use std::env;
use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::{HeaderValue, Method, StatusCode},
    routing::{delete, get},
    Json, Router,
};
use color_eyre::{eyre::Context, Result};
use dashmap::DashMap;
use email_address_parser::EmailAddress;
use serde::Serialize;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tracing::Level;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use vortex_smtp::{event::Event, Email};

const HTTP_ADDR: &str = "0.0.0.0:3000";
const SMTP_ADDR: &str = "0.0.0.0:2525";

#[derive(Clone, Debug, Serialize)]
struct ExtendedEmail {
    email: Email,
    timestamp: String,
}
type EmailsMap = DashMap<String, Vec<ExtendedEmail>>;

#[derive(Clone)]
struct AppState {
    emails: Arc<EmailsMap>,
    allowed_domains: Arc<Vec<String>>,
}

#[tracing::instrument]
async fn server_main() -> Result<()> {
    // Load configuration
    let allowed_domains =
        env::var("VITE_EMAIL_DOMAINS").wrap_err("VITE_EMAIL_DOMAINS must be set")?;
    let allowed_domains: Arc<Vec<String>> =
        Arc::new(allowed_domains.split(',').map(String::from).collect());
    let frontend_domain = env::var("FRONTEND_DOMAIN").wrap_err("FRONTEND_DOMAIN must be set")?;

    // Create shared state
    let app_state = AppState {
        emails: Arc::new(DashMap::new()),
        allowed_domains,
    };

    // --- SMTP Server ---
    let smtp_validator_state = app_state.clone();
    let smtp_event_state = app_state.clone(); // Clone state for the event handler too
    let smtp_server = tokio::spawn(async move {
        vortex_smtp::listen(
            SMTP_ADDR,
            // Validator closure
            move |email| {
                tracing::debug!(email, "validating email for SMTP");
                validate_vortex_email(email, &smtp_validator_state.allowed_domains)
                    && smtp_validator_state.emails.contains_key(email)
            },
            // Event handler closure
            move |event| {
                #[allow(irrefutable_let_patterns)]
                if let Event::EmailReceived(email) = &event {
                    tracing::debug!(
                        mail_from = email.mail_from,
                        rcpt_to = email.rcpt_to.join(", "),
                        "email received via SMTP"
                    );

                    let timestamp = chrono::Utc::now().to_rfc3339();
                    for recipient in &email.rcpt_to {
                        if let Some(mut mailbox) = smtp_event_state.emails.get_mut(recipient) {
                            mailbox.push(ExtendedEmail {
                                email: email.clone(),
                                timestamp: timestamp.clone(),
                            });
                        } else {
                            // This case should ideally not happen if validator works correctly
                            tracing::warn!(recipient, "Received email for non-existent mailbox");
                        }
                    }
                }
            },
        )
        .await
        .wrap_err("SMTP server failed")
    });

    // --- HTTP Server ---
    let http_state = app_state.clone();
    let http_server = tokio::spawn(async move {
        let cors = CorsLayer::new()
            .allow_methods([Method::GET, Method::DELETE]) // Allow DELETE for clear_emails
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
            .route("/emails/:email", get(get_emails))
            .route("/emails/:email/clear", delete(clear_emails))
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

    // --- Run Servers ---
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

#[tracing::instrument(skip(state))]
async fn get_emails(
    State(state): State<AppState>,
    Path(email): Path<String>,
) -> Result<(StatusCode, Json<Vec<ExtendedEmail>>), StatusCode> {
    if !validate_vortex_email(&email, &state.allowed_domains) {
        tracing::warn!(email, "Invalid domain requested");
        return Err(StatusCode::BAD_REQUEST);
    }

    match state.emails.entry(email.clone()) {
        dashmap::mapref::entry::Entry::Occupied(entry) => {
            Ok((StatusCode::OK, Json(entry.get().clone())))
        }
        dashmap::mapref::entry::Entry::Vacant(entry) => {
            tracing::info!(email, "Mailbox created on first access");
            entry.insert(Vec::new());
            Ok((StatusCode::CREATED, Json(Vec::new())))
        }
    }
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

    if let Some(mut emails) = state.emails.get_mut(&email) {
        emails.clear();
        tracing::info!(email, "Mailbox cleared");
        Ok(StatusCode::NO_CONTENT) // 204
    } else {
        tracing::info!(email, "Attempted to clear non-existent mailbox");
        Err(StatusCode::NOT_FOUND)
    }
}

fn validate_vortex_email(email: &str, allowed_domains: &[String]) -> bool {
    let Some(parsed) = EmailAddress::parse(email, None) else {
        return false;
    };
    allowed_domains
        .iter()
        .any(|domain| parsed.domain() == *domain)
}

fn main() -> Result<()> {
    color_eyre::install()?;

    // Initialize Sentry
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

    // Initialize tracing subscriber with Sentry layer
    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env().add_directive(Level::INFO.into())) // Default to INFO level, adjustable via RUST_LOG
        .with(tracing_subscriber::fmt::layer())
        .with(sentry_tracing::layer())
        .init();

    // Build and run the Tokio runtime
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?
        .block_on(server_main())
}
