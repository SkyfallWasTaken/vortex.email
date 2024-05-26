use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};

mod messages;
use messages::Command;

const ADDR: &str = "127.0.0.1:587";

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let listener = TcpListener::bind(ADDR).await.unwrap();

    tracing::info!("Listening on {ADDR}");

    loop {
        let (socket, _) = listener.accept().await.unwrap();
        // A new task is spawned for each inbound socket. The socket is
        // moved to the new task and processed there.
        tokio::spawn(async move {
            process(socket).await;
        });
    }
}

async fn process(mut socket: TcpStream) {
    let mut buf = vec![0; 1024];

    socket.write_all(messages::GREETING).await.unwrap();

    loop {
        let n = match socket.read(&mut buf).await {
            // socket closed
            Ok(n) if n == 0 => return,
            Ok(n) => n,
            Err(e) => {
                panic!() // FIXME: oops.
            }
        };

        let message = &buf[0..n];
        let command = Command::from_smtp_message(&String::from_utf8_lossy(message)).unwrap();
        match command {
            Command::Helo { fqdn } => {
                socket.write_all(messages::HELO_RESPONSE.replace("[$hostname]", fqdn)).await.unwrap();
            }
        }
    }
}
