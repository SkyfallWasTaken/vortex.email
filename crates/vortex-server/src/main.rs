use std::env;
use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::{HeaderValue, Method, StatusCode},
    routing::{delete, get},
    Json, Router,
};
use color_eyre::{eyre::Context, Result};
use email_address_parser::EmailAddress;
use redis::{aio::MultiplexedConnection, AsyncCommands, Client, RedisResult};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;
use tokio::sync::Mutex;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use vortex_smtp::{event::Event, Email};

const HTTP_ADDR: &str = "0.0.0.0:3000";
const SMTP_ADDR: &str = "0.0.0.0:2525";

#[derive(Clone, Debug, Serialize, Deserialize)]
struct ExtendedEmail {
    email: Email,
    timestamp: String,
}

#[derive(Clone)]
struct AppState {
    redis_conn: Arc<Mutex<MultiplexedConnection>>,
    allowed_domains: Arc<Vec<String>>,
}

#[tracing::instrument]
async fn server_main() -> Result<()> {
    let allowed_domains =
        env::var("VITE_EMAIL_DOMAINS").wrap_err("VITE_EMAIL_DOMAINS must be set")?;
    let allowed_domains: Arc<Vec<String>> =
        Arc::new(allowed_domains.split(',').map(String::from).collect());
    let frontend_domain = env::var("FRONTEND_DOMAIN").wrap_err("FRONTEND_DOMAIN must be set")?;

    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let redis_client = Client::open(redis_url.clone())
        .wrap_err_with(|| format!("Failed to connect to Redis at {}", redis_url))?;

    let redis_conn = redis_client
        .get_multiplexed_async_connection()
        .await
        .wrap_err("Failed to establish Redis connection")?;

    let mut conn_clone = redis_conn.clone();
    let _: String = redis::cmd("PING")
        .query_async(&mut conn_clone)
        .await
        .wrap_err("Failed to ping Redis server")?;
    tracing::info!("Connected to Redis server at {}", redis_url);

    let app_state = AppState {
        redis_conn: Arc::new(Mutex::new(redis_conn)),
        allowed_domains,
    };

    let smtp_validator_state = app_state.clone();
    let smtp_event_state = app_state.clone();
    let smtp_server = tokio::spawn(async move {
        tracing::info!("SMTP server listening on {SMTP_ADDR}");
        vortex_smtp::listen(
            SMTP_ADDR,
            move |email| {
                let state = smtp_validator_state.clone();
                let email_str = email.to_string();
                async move {
                    validate_vortex_email_with_redis(&email_str, &state).await
                }
            },
            move |event| {
                #[allow(irrefutable_let_patterns)]
                if let Event::EmailReceived(email) = &event {
                    tracing::debug!(
                        mail_from = email.mail_from,
                        rcpt_to = email.rcpt_to.join(", "),
                        "email received via SMTP"
                    );

                    let timestamp = chrono::Utc::now().to_rfc3339();
                    let state = smtp_event_state.clone();
                    let email_clone = email.clone();

                    tokio::spawn(async move {
                        for recipient in &email_clone.rcpt_to {
                            match store_email_in_redis(&state, recipient, &email_clone, &timestamp).await {
                                Ok(_) => {
                                    tracing::debug!(recipient, "Email stored in Redis");
                                }
                                Err(e) => {
                                    tracing::error!(recipient, error = %e, "Failed to store email in Redis");
                                }
                            }
                        }
                    });
                }
            },
        )
        .await
        .wrap_err("SMTP server failed")
    });

    let http_state = app_state.clone();
    let http_server = tokio::spawn(async move {
        let cors = CorsLayer::new()
            .allow_methods([Method::GET, Method::DELETE])
            .allow_origin(
                frontend_domain
                    .parse::<HeaderValue>()
                    .wrap_err("Invalid FRONTEND_DOMAIN")?,
            );

        let router = Router::new()
            .route(
                "/",
                get(|| async { format!("vortex-server v{}", env!("CARGO_PKG_VERSION")) }),
            )
            .route("/emails/{email}", get(get_emails))
            .route("/emails/{email}/clear", delete(clear_emails))
            .with_state(http_state)
            .layer(cors);

        let listener = TcpListener::bind(HTTP_ADDR)
            .await
            .wrap_err_with(|| format!("Failed to bind HTTP server to {HTTP_ADDR}"))?;

        tracing::info!("HTTP server listening on {HTTP_ADDR}");
        axum::serve(listener, router)
            .await
            .wrap_err("HTTP server failed")
    });

    tracing::info!("Starting servers...");
    let (http_res, smtp_res) = tokio::try_join!(http_server, smtp_server)?;
    if let Err(err) = http_res {
        tracing::error!("HTTP server failed: {err}");
        return Err(err);
    }
    if let Err(err) = smtp_res {
        tracing::error!("SMTP server failed: {err}");
        return Err(err);
    }

    Ok(())
}

async fn store_email_in_redis(
    state: &AppState,
    recipient: &str,
    email: &Email,
    timestamp: &str,
) -> RedisResult<()> {
    let mut conn = state.redis_conn.lock().await.clone();

    let key = format!("emails:{}", recipient);

    let timestamp_dt = chrono::DateTime::parse_from_rfc3339(timestamp)
        .map_err(|e| {
            redis::RedisError::from((
                redis::ErrorKind::TypeError,
                "Timestamp parse error",
                e.to_string(),
            ))
        })?
        .with_timezone(&chrono::Utc);
    let score = timestamp_dt.timestamp();

    let extended_email = ExtendedEmail {
        email: email.clone(),
        timestamp: timestamp.to_string(),
    };
    let json = serde_json::to_string(&extended_email).map_err(|e| {
        redis::RedisError::from((
            redis::ErrorKind::IoError,
            "Serialization error",
            e.to_string(),
        ))
    })?;

    let _: () = conn.zadd(&key, json, score).await?;

    Ok(())
}

// lua script that ensures the key exists as an empty sorted set and returns all emails
// what's the point, you ask? this way we can ensure that the key exists and is a sorted set
// - *in a single roundtrip!*
const ENSURE_ZSET_SCRIPT: &str = r#"
    local key = KEYS[1]
    if redis.call('EXISTS', key) == 0 then
        redis.call('ZADD', key, 0, 'temp')
        redis.call('ZREM', key, 'temp')
    end
    return redis.call('ZREVRANGE', key, 0, -1)
"#;

#[tracing::instrument(skip(state))]
async fn get_emails(
    State(state): State<AppState>,
    Path(email): Path<String>,
) -> Result<(StatusCode, Json<Vec<ExtendedEmail>>), StatusCode> {
    if !validate_vortex_email(&email, &state.allowed_domains) {
        tracing::warn!(email, "Invalid domain in GET request");
        return Err(StatusCode::BAD_REQUEST);
    }

    let key = format!("emails:{}", email);
    let mut conn = state.redis_conn.lock().await.clone();

    let email_jsons: Vec<String> = redis::Script::new(ENSURE_ZSET_SCRIPT)
        .key(&key)
        .invoke_async(&mut conn)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Failed to execute Redis script");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let emails: Vec<ExtendedEmail> = email_jsons
        .into_iter()
        .filter_map(|json| serde_json::from_str(&json).ok())
        .collect();

    Ok((StatusCode::OK, Json(emails)))
}

#[tracing::instrument(skip(state))]
async fn clear_emails(
    State(state): State<AppState>,
    Path(email): Path<String>,
) -> Result<StatusCode, StatusCode> {
    if !validate_vortex_email(&email, &state.allowed_domains) {
        tracing::warn!(email, "Invalid domain requested for clearing");
        return Err(StatusCode::BAD_REQUEST);
    }

    let key = format!("emails:{}", email);
    let mut conn = state.redis_conn.lock().await.clone();

    let _: () = conn.del(&key).await.map_err(|e| {
        tracing::error!(error = %e, "Failed to clear emails from Redis");
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    tracing::info!(email, "Mailbox cleared");
    Ok(StatusCode::NO_CONTENT)
}

fn validate_vortex_email(email: &str, allowed_domains: &[String]) -> bool {
    let Some(parsed) = EmailAddress::parse(email, None) else {
        return false;
    };
    allowed_domains
        .iter()
        .any(|domain| parsed.domain() == *domain)
}

async fn validate_vortex_email_with_redis(email: &str, state: &AppState) -> bool {
    // First check domain validity
    if !validate_vortex_email(email, &state.allowed_domains) {
        return false;
    }

    // Then get the Redis conn
    let key = format!("emails:{}", email);
    let mut conn = state.redis_conn.lock().await.clone();

    match conn.exists(&key).await {
        Ok(exists) => exists,
        Err(e) => {
            tracing::error!(email, error = %e, "Failed to check email existence in Redis");
            false
        }
    }
}

fn main() -> Result<()> {
    color_eyre::install()?;

    let sentry_dsn =
        env::var("VITE_SENTRY_DSN").wrap_err("failed to read env var VITE_SENTRY_DSN")?;
    let _sentry_guard = sentry::init((
        sentry_dsn,
        sentry::ClientOptions {
            release: sentry::release_name!(),
            traces_sample_rate: 0.3,
            ..Default::default()
        },
    ));

    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env())
        .with(tracing_subscriber::fmt::layer())
        .with(sentry_tracing::layer())
        .init();

    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?
        .block_on(server_main())
}
