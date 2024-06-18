use std::sync::Arc;

use axum::{http::StatusCode, routing::get, Extension, Json, Router};
use color_eyre::Result;
use dashmap::DashMap;
use tokio::net::TcpListener;
use vortex_smtp::{event::Event, Email};

const HTTP_ADDR: &str = "0.0.0.0:3000";
const SMTP_ADDR: &str = "0.0.0.0:25";

type EmailsMap = DashMap<String, Vec<Email>>;

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    tracing_subscriber::fmt::init();

    let emails_map: Arc<EmailsMap> = Arc::new(DashMap::new());
    let emails_map_http = emails_map.clone();

    let smtp_server = vortex_smtp::listen(
        SMTP_ADDR,
        {
            let emails_map_smtp = emails_map.clone();
            move |email| {
                tracing::debug!(email, "Validating email");
                emails_map_smtp.contains_key(email)
            }
        },
        {
            let emails_map_smtp = emails_map.clone();
            move |event| match &event {
                Event::EmailReceived(email) => {
                    tracing::debug!(
                        mail_from = email.mail_from,
                        rcpt_to = email.rcpt_to.join(", "),
                        "Email received"
                    );

                    let key = email.mail_from.clone();
                    let mut emails = emails_map_smtp.get_mut(&key).unwrap();
                    emails.push(email.clone());
                }
            }
        },
    );

    let http_server = tokio::spawn(async move {
        let router = Router::new()
            .route("/emails/:username", get(get_emails))
            .layer(Extension(emails_map_http));
        let listener = TcpListener::bind(HTTP_ADDR).await.unwrap();
        axum::serve(listener, router).await.unwrap();
    });

    let _ = tokio::join!(smtp_server, http_server);

    Ok(())
}

async fn get_emails(
    Extension(emails_map): Extension<Arc<EmailsMap>>,
    username: String,
) -> (StatusCode, Json<Vec<Email>>) {
    let Some(emails) = emails_map.get(&username) else {
        return (StatusCode::NOT_FOUND, Json(vec![])); // TODO: this response is bad
    };
    (StatusCode::OK, Json(emails.clone()))
}
