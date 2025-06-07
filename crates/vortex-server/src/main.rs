use std::env;
use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::{HeaderValue, Method, StatusCode},
    routing::{delete, get, post},
    Json, Router,
};
use base64::{engine::general_purpose, Engine as _};
use color_eyre::{eyre::Context, Result};
use email_address_parser::EmailAddress;
use redis::{aio::MultiplexedConnection, AsyncCommands, Client, RedisResult};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;
use tokio::sync::Mutex;
use tower_governor::{governor::GovernorConfigBuilder, key_extractor::KeyExtractor, GovernorLayer};
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use uuid::Uuid;

use vortex_smtp::{event::Event, Email};

const HTTP_ADDR: &str = "0.0.0.0:3000";
const SMTP_ADDR: &str = "0.0.0.0:2525";

#[derive(Clone, Debug, Serialize, Deserialize)]
struct ExtendedEmail {
    email: Email,
    timestamp: String,
}

#[derive(Debug, Deserialize)]
struct TurnstileVerifyRequest {
    token: String,
}

#[derive(Debug, Serialize)]
struct TurnstileVerifyResponse {
    api_token: String,
}

#[derive(Debug, Deserialize)]
struct CloudflareTurnstileResponse {
    success: bool,
    #[serde(rename = "error-codes")]
    error_codes: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
struct ApiTokenQuery {
    api_token: Option<String>,
}

#[derive(Clone)]
struct AppState {
    redis_conn: Arc<Mutex<MultiplexedConnection>>,
    allowed_domains: Arc<Vec<String>>,
    turnstile_secret: Option<String>,
}

#[derive(Clone)]
struct ApiTokenKeyExtractor;

impl KeyExtractor for ApiTokenKeyExtractor {
    type Key = String;

    fn extract<T>(
        &self,
        req: &axum::http::Request<T>,
    ) -> Result<Self::Key, tower_governor::GovernorError> {
        // Try to get api_token from query parameters
        if let Some(query) = req.uri().query() {
            for pair in query.split('&') {
                if let Some((key, value)) = pair.split_once('=') {
                    if key == "api_token" {
                        return Ok(urlencoding::decode(value)
                            .unwrap_or_else(|_| value.into())
                            .to_string());
                    }
                }
            }
        }

        // Fallback to IP address for requests without API tokens
        let fallback_key = req
            .headers()
            .get("x-forwarded-for")
            .and_then(|hv| hv.to_str().ok())
            .map(|s| s.split(',').next().unwrap_or(s).trim().to_string())
            .or_else(|| {
                req.headers()
                    .get("x-real-ip")
                    .and_then(|hv| hv.to_str().ok())
                    .map(|s| s.to_string())
            })
            .unwrap_or_else(|| "unknown".to_string());

        Ok(fallback_key)
    }
}

#[tracing::instrument]
async fn server_main() -> Result<()> {
    let allowed_domains =
        env::var("VITE_EMAIL_DOMAINS").wrap_err("VITE_EMAIL_DOMAINS must be set")?;
    let allowed_domains: Arc<Vec<String>> =
        Arc::new(allowed_domains.split(',').map(String::from).collect());
    let frontend_domain = env::var("FRONTEND_DOMAIN").wrap_err("FRONTEND_DOMAIN must be set")?;
    let turnstile_secret = env::var("TURNSTILE_SECRET").ok();

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
        turnstile_secret,
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
            .allow_methods([Method::GET, Method::DELETE, Method::POST])
            .allow_origin(
                frontend_domain
                    .parse::<HeaderValue>()
                    .wrap_err("Invalid FRONTEND_DOMAIN")?,
            )
            .allow_headers([
                axum::http::header::CONTENT_TYPE,
                axum::http::header::AUTHORIZATION,
            ]);

        // Set up rate limiting - 30 requests per minute
        let governor_conf = Arc::new(
            GovernorConfigBuilder::default()
                .per_second(1) // 30 requests per minute = 0.5 per second, but we'll use burst
                .burst_size(30) // Allow bursts up to 30 requests
                .key_extractor(ApiTokenKeyExtractor)
                .finish()
                .unwrap(),
        );

        let router = Router::new()
            .route(
                "/",
                get(|| async { format!("vortex-server v{}", env!("CARGO_PKG_VERSION")) }),
            )
            .route("/emails/{email}", get(get_emails))
            .route("/emails/{email}/clear", delete(clear_emails))
            .route("/verify-turnstile", post(verify_turnstile))
            .with_state(http_state)
            .layer(GovernorLayer {
                config: governor_conf,
            })
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
//
// you might also ask - why the sentinel? because we want to ensure that the key is not empty
// as otherwise redis will remove the key when we try to read it
const ENSURE_ZSET_SCRIPT: &str = r#"
    local key = KEYS[1]
    local sentinel = ARGV[1]

    -- Add sentinel member if it doesn't exist (and thus create the key)
    redis.call('ZADD', key, 'NX', -1, sentinel)

    -- Fetch everything newest-first
    local all = redis.call('ZREVRANGE', key, 0, -1)

    -- Remove sentinel from the result set
    for i = #all, 1, -1 do
        if all[i] == sentinel then
            table.remove(all, i)
        end
    end

    return all
"#;

#[tracing::instrument(skip(state))]
async fn get_emails(
    State(state): State<AppState>,
    Path(email): Path<String>,
    Query(query): Query<ApiTokenQuery>,
) -> Result<(StatusCode, Json<Vec<ExtendedEmail>>), StatusCode> {
    if !validate_vortex_email(&email, &state.allowed_domains) {
        tracing::warn!(email, "Invalid domain in GET request");
        return Err(StatusCode::BAD_REQUEST);
    }

    // Check API token if Turnstile is enabled
    if state.turnstile_secret.is_some() {
        match query.api_token {
            Some(token) => {
                if !validate_api_token(&state, &token).await {
                    tracing::warn!("Invalid or expired API token");
                    return Err(StatusCode::UNAUTHORIZED);
                }
            }
            None => {
                tracing::warn!("API token required but not provided");
                return Err(StatusCode::UNAUTHORIZED);
            }
        }
    }

    let key = format!("emails:{}", email);
    let mut conn = state.redis_conn.lock().await.clone();

    let sentinel = "__empty__";
    let email_jsons: Vec<String> = redis::Script::new(ENSURE_ZSET_SCRIPT)
        .key(&key)
        .arg(sentinel)
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
    Query(query): Query<ApiTokenQuery>,
) -> Result<StatusCode, StatusCode> {
    if !validate_vortex_email(&email, &state.allowed_domains) {
        tracing::warn!(email, "Invalid domain requested for clearing");
        return Err(StatusCode::BAD_REQUEST);
    }

    // Check API token if Turnstile is enabled
    if state.turnstile_secret.is_some() {
        match query.api_token {
            Some(token) => {
                if !validate_api_token(&state, &token).await {
                    tracing::warn!("Invalid or expired API token");
                    return Err(StatusCode::UNAUTHORIZED);
                }
            }
            None => {
                tracing::warn!("API token required but not provided");
                return Err(StatusCode::UNAUTHORIZED);
            }
        }
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

#[tracing::instrument(skip(state))]
async fn verify_turnstile(
    State(state): State<AppState>,
    Json(request): Json<TurnstileVerifyRequest>,
) -> Result<Json<TurnstileVerifyResponse>, StatusCode> {
    let turnstile_secret = match &state.turnstile_secret {
        Some(secret) => secret,
        None => {
            tracing::warn!("Turnstile verification requested but TURNSTILE_SECRET not set");
            return Err(StatusCode::SERVICE_UNAVAILABLE);
        }
    };

    // Verify with Cloudflare
    let client = reqwest::Client::new();
    let params = [
        ("secret", turnstile_secret.as_str()),
        ("response", &request.token),
    ];

    let cloudflare_response = client
        .post("https://challenges.cloudflare.com/turnstile/v0/siteverify")
        .form(&params)
        .send()
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Failed to verify Turnstile token with Cloudflare");
            StatusCode::INTERNAL_SERVER_ERROR
        })?
        .json::<CloudflareTurnstileResponse>()
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Failed to parse Cloudflare response");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    if !cloudflare_response.success {
        tracing::warn!(error_codes = ?cloudflare_response.error_codes, "Turnstile verification failed");
        return Err(StatusCode::BAD_REQUEST);
    }

    // Generate API token
    let api_token = general_purpose::URL_SAFE_NO_PAD.encode(Uuid::new_v4().as_bytes());

    // Store token in Redis with 12-hour TTL
    let mut conn = state.redis_conn.lock().await.clone();
    let token_key = format!("api_token:{}", api_token);
    let ttl_seconds = 12 * 60 * 60; // 12 hours

    let _: () = conn
        .set_ex(&token_key, "valid", ttl_seconds)
        .await
        .map_err(|e| {
            tracing::error!(error = %e, "Failed to store API token in Redis");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    tracing::info!("API token generated and stored");
    Ok(Json(TurnstileVerifyResponse { api_token }))
}

async fn validate_api_token(state: &AppState, token: &str) -> bool {
    let token_key = format!("api_token:{}", token);
    let mut conn = state.redis_conn.lock().await.clone();

    match conn.exists::<String, bool>(token_key).await {
        Ok(exists) => exists,
        Err(e) => {
            tracing::error!(error = %e, "Failed to validate API token in Redis");
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
