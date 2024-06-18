use std::sync::Arc;

use color_eyre::Result;
use dashmap::DashMap;
use vortex_smtp::{event::Event, Email};

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    tracing_subscriber::fmt::init();

    let emails_map: Arc<DashMap<String, Vec<Email>>> = Arc::new(DashMap::new());
    let emails_map_clone1 = emails_map.clone();

    vortex_smtp::listen(
        "0.0.0.0:25",
        move |email| {
            tracing::debug!(email, "Validating email");
            emails_map_clone1.contains_key(email)
        },
        move |event| match &event {
            Event::EmailReceived(email) => {
                tracing::debug!(
                    mail_from = email.mail_from,
                    rcpt_to = email.rcpt_to.join(", "),
                    "Email received"
                );

                let key = email.mail_from.clone();
                let mut emails = emails_map.get_mut(&key).unwrap();
                emails.push(email.clone());
            }
        },
    )
    .await?;

    Ok(())
}
