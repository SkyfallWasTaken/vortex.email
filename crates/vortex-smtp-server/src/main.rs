use color_eyre::Result;
use dashmap::DashMap;
use vortex_smtp::{event::Event, Email};

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    tracing_subscriber::fmt::init();

    let emails: DashMap<String, Vec<Email>> = DashMap::new();

    vortex_smtp::listen(
        "0.0.0.0:25",
        move |email| {
            tracing::debug!(email, "Validating email");
            emails.contains_key(email)
        },
        |event| match &event {
            Event::EmailReceived(email) => {
                tracing::debug!(
                    mail_from = email.mail_from,
                    rcpt_to = email.rcpt_to.join(", "),
                    "Email received"
                );
            }
        },
    )
    .await?;

    Ok(())
}
