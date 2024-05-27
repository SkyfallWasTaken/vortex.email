use color_eyre::Result;

#[tokio::main]
async fn main() -> Result<()> {
    color_eyre::install()?;
    tracing_subscriber::fmt::init();

    vortex_smtp::listen("127.0.0.1:25").await?;

    Ok(())
}
