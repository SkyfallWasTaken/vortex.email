use std::env;
use std::sync::Arc;

use axum::{
    extract::Path,
    http::{HeaderValue, Method, StatusCode},
    routing::get,
    Extension, Json, Router,
};
use color_eyre::{eyre::Context, Report, Result};
use dashmap::DashMap;
use email_address_parser::EmailAddress;
use futures_util::TryFutureExt;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tracing_subscriber::prelude::*;

use vortex_smtp::{event::Event, Email};

const HTTP_ADDR: &str = "0.0.0.0:3000";
const SMTP_ADDR: &str = "0.0.0.0:25";

type EmailsMap = DashMap<String, Vec<Email>>;

#[tracing::instrument]
async fn server_main() -> Result<()> {
    let emails_map: Arc<EmailsMap> = Arc::new(DashMap::new());
    let emails_map_validator = emails_map.clone();
    let emails_map_smtp = emails_map.clone();
    let email_domain =
        Arc::new(env::var("VITE_EMAIL_DOMAIN").wrap_err("VITE_EMAIL_DOMAIN must be set")?);
    let email_domain_smtp = email_domain.clone();
    let email_domain_http = email_domain.clone();

    let smtp_server = vortex_smtp::listen(
        SMTP_ADDR,
        move |email| {
            tracing::debug!(email, "validating email");
            validate_vortex_email(email, &email_domain_smtp)
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
    );

    let http_server = tokio::spawn(async move {
        let cors = CorsLayer::new()
            .allow_methods([Method::GET])
            // FIXME: this allows requests from any origin
            .allow_origin(
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
            .layer(Extension(email_domain_http.to_string()))
            .layer(cors);
        let listener = TcpListener::bind(HTTP_ADDR).await.unwrap();

        tracing::debug!("http listening on {HTTP_ADDR}");
        axum::serve(listener, router).await
    });

    tracing::debug!("starting servers");
    let (http_result, _) = tokio::try_join!(
        http_server.map_err(Report::from),
        smtp_server.map_err(Report::from)
    )?;
    http_result?;
    tracing::debug!("exiting.");

    Ok(())
}

#[tracing::instrument]
async fn get_emails(
    Path(email): Path<String>,
    Extension(emails_map): Extension<Arc<EmailsMap>>,
    Extension(email_domain): Extension<String>,
) -> (StatusCode, Json<Vec<Email>>) {
    let emails_map = emails_map.as_ref();

    if validate_vortex_email(&email, &email_domain) {
        if let Some(emails) = emails_map.get(&email) {
            (StatusCode::OK, Json(emails.clone()))
        } else {
            tracing::info!(email, "mailbox not found, adding to map");
            emails_map.insert(email.clone(), Vec::new());
            (StatusCode::CREATED, Json(Vec::new()))
        }
    } else {
        (StatusCode::BAD_REQUEST, Json(Vec::new())) // TODO: returning a new Vec here is wrong.
    }
}

fn validate_vortex_email(email: &str, email_domain: &str) -> bool {
    // The `None` here means that we use strict email parsing.
    let Some(parsed) = EmailAddress::parse(email, None) else {
        return false;
    };
    parsed.get_domain() == email_domain
}

fn main() -> Result<()> {
    color_eyre::install()?;
    tracing_subscriber::Registry::default()
        .with(sentry::integrations::tracing::layer())
        .init();

    let sentry_dsn =
        env::var("VITE_SENTRY_DSN").wrap_err("failed to read env var VITE_SENTRY_DSN")?;
    let _guard = sentry::init((
        sentry_dsn,
        sentry::ClientOptions {
            release: sentry::release_name!(),
            ..Default::default()
        },
    ));

    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()?
        .block_on(server_main())?;

    Ok(())
}
