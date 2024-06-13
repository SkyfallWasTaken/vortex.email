use color_eyre::Result;
use vortex_smtp::event::Event;

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    tracing_subscriber::fmt::init();

    vortex_smtp::listen("0.0.0.0:25", |event| match &event {
        Event::EmailReceived {
            mail_from,
            rcpt_to,
            data,
        } => {
            dbg!(event);
        }
    })
    .await?;

    Ok(())
}
