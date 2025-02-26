// Piling on some tech debt because it's midnight and I just want this fixed atm
use std::env;
use std::sync::Arc;

use axum::{
    extract::Path,
    http::{HeaderValue, Method, StatusCode},
    routing::get,
    Extension, Json, Router,
};
use color_eyre::{
    eyre::{eyre, Context},
    Result,
};
use dashmap::DashMap;
use email_address_parser::EmailAddress;
use tokio::{net::TcpListener, task::JoinHandle};
use tower_http::cors::CorsLayer;
use tracing_subscriber::prelude::*;

use vortex_smtp::{event::Event, Email};

const HTTP_ADDR: &str = "0.0.0.0:3000";
const SMTP_ADDR: &str = "0.0.0.0:25";

type EmailsMap = DashMap<String, Vec<Email>>;

async fn flatten<T, E: ToString>(handle: JoinHandle<Result<T, E>>) -> Result<T, String> {
    match handle.await {
        Ok(Ok(result)) => Ok(result),
        Ok(Err(err)) => Err(err.to_string()),
        Err(_) => Err("unknown error".to_string()),
    }
}

#[tracing::instrument]
async fn server_main() -> Result<()> {
    let emails_map: Arc<EmailsMap> = Arc::new(DashMap::new());
    let emails_map_validator = emails_map.clone();
    let emails_map_smtp = emails_map.clone();
    let email_domains =
        env::var("VITE_EMAIL_DOMAINS").wrap_err("VITE_EMAIL_DOMAINS must be set")?;
    let email_domains: Arc<Vec<String>> =
        Arc::new(email_domains.split(',').map(String::from).collect());

    let email_domains_smtp = email_domains.clone();
    let smtp_server = tokio::spawn(async move {
        vortex_smtp::listen(
            SMTP_ADDR,
            move |email| {
                tracing::debug!(email, "validating email");
                validate_vortex_email(email, &email_domains_smtp)
                    && emails_map_validator.contains_key(email)
            },
            move |event| match &event {
                Event::EmailReceived(email) => {
                    tracing::debug!(
                        mail_from = email.mail_from,
                        rcpt_to = email.rcpt_to.join(", "),
                        "email received"
                    );

                    let keys = email.rcpt_to.clone();
                    for key in keys {
                        let mut emails = emails_map.get_mut(&key).unwrap();
                        emails.push(email.clone());
                    }
                }
            },
        )
        .await
    });

    let http_server = tokio::spawn(async move {
        let cors = CorsLayer::new().allow_methods([Method::GET]).allow_origin(
            env::var("FRONTEND_DOMAIN")
                .expect("FRONTEND_DOMAIN must be set")
                .parse::<HeaderValue>()
                .unwrap(),
        );

        let router = Router::new()
            .route(
                "/",
                get(|| async { format!("vortex-server v{}", env!("CARGO_PKG_VERSION")) }),
            )
            .route("/emails/:email", get(get_emails))
            .layer(Extension(emails_map_smtp))
            .layer(Extension(email_domains))
            .layer(cors);
        let listener = TcpListener::bind(HTTP_ADDR).await.unwrap();

        tracing::debug!("http listening on {HTTP_ADDR}");
        axum::serve(listener, router).await
    });

    tracing::debug!("starting servers");
    if let Err(err) = tokio::try_join!(flatten(http_server), flatten(smtp_server)) {
        return Err(eyre!(err));
    };

    Ok(())
}

#[tracing::instrument]
async fn get_emails(
    Path(email): Path<String>,
    Extension(emails_map): Extension<Arc<EmailsMap>>,
    Extension(email_domains): Extension<Arc<Vec<String>>>,
) -> (StatusCode, Json<Vec<Email>>) {
    let emails_map = emails_map.as_ref();

    if validate_vortex_email(&email, &email_domains) {
        if let Some(emails) = emails_map.get(&email) {
            (StatusCode::OK, Json(emails.clone()))
        } else {
            tracing::info!(email, "mailbox not found, adding to map");
            emails_map.insert(email.clone(), Vec::new());
            (StatusCode::CREATED, Json(Vec::new()))
        }
    } else {
        (StatusCode::BAD_REQUEST, Json(Vec::new()))
    }
}

fn validate_vortex_email(email: &str, email_domains: &[String]) -> bool {
    let Some(parsed) = EmailAddress::parse(email, None) else {
        return false;
    };
    email_domains
        .iter()
        .any(|domain| parsed.domain() == *domain)
}

fn main() -> Result<()> {
    color_eyre::install()?;

    let log_dir = env::var("LOG_DIR").wrap_err("failed to read env var LOG_DIR")?;
    let appender = tracing_appender::rolling::daily(log_dir, "vortex-server.log");
    let (non_blocking_appender, _log_guard) = tracing_appender::non_blocking(appender);
    tracing_subscriber::Registry::default()
        .with(sentry::integrations::tracing::layer())
        .with(tracing_subscriber::fmt::layer().with_writer(non_blocking_appender))
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();

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

    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?
        .block_on(server_main())?;

    Ok(())
}
