use std::sync::Arc;

use axum::{
    extract::Path,
    http::{Method, StatusCode},
    routing::get,
    Extension, Json, Router,
};
use color_eyre::{Report, Result};
use dashmap::DashMap;
use futures_util::TryFutureExt;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};

use vortex_smtp::{event::Event, Email};

const HTTP_ADDR: &str = "0.0.0.0:3000";
const SMTP_ADDR: &str = "0.0.0.0:25";

type EmailsMap = DashMap<String, Vec<Email>>;

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    tracing_subscriber::fmt::init();

    let emails_map: Arc<EmailsMap> = Arc::new(DashMap::new());
    let emails_map_validator = emails_map.clone();
    let emails_map_smtp = emails_map.clone();

    let smtp_server = vortex_smtp::listen(
        SMTP_ADDR,
        move |email| {
            tracing::debug!(email, "validating email");
            emails_map_validator.contains_key(email)
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

    let http_server = tokio::spawn(async {
        let cors = CorsLayer::new()
            .allow_methods([Method::GET])
            // FIXME: this allows requests from any origin
            .allow_origin(Any);

        let router = Router::new()
            .route("/", get(|| async { "OK :)" }))
            .route("/emails/:username", get(get_emails))
            .layer(Extension(emails_map_smtp))
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

async fn get_emails(
    Path(username): Path<String>,
    Extension(emails_map): Extension<Arc<EmailsMap>>,
) -> (StatusCode, Json<Vec<Email>>) {
    let emails_map = emails_map.as_ref();
    match emails_map.get(&username) {
        Some(emails) => (StatusCode::OK, Json(emails.clone())),
        None => {
            tracing::info!(username, "mailbox not found, adding to map");
            emails_map.insert(username.clone(), Vec::new());
            (StatusCode::CREATED, Json(Vec::new()))
        }
    }
}
