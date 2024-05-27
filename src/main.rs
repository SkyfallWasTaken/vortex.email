use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};

mod consts;
mod esmtp;
mod messages;
use messages::Command;

const ADDR: &str = "127.0.0.1:25";

struct ConnState {
    esmtp: bool,
    greeting_done: bool,

    mail_from: Option<String>,
    rcpt_to: Vec<String>,
    data: Option<[u8; consts::MAX_SIZE]>,
}

async fn process(mut socket: TcpStream) {
    let mut buf = vec![0; consts::MAX_SIZE];

    let mut state = ConnState {
        esmtp: false,
        greeting_done: false,

        mail_from: None,
        rcpt_to: Vec::new(),
        data: None,
    };

    socket.write_all(messages::GREETING).await.unwrap();

    loop {
        let n = match socket.read(&mut buf).await {
            // socket closed
            Ok(0) => return,
            Ok(n) => n,
            Err(e) => {
                panic!() // FIXME: oops.
            }
        };

        let msg = String::from_utf8_lossy(&buf[0..n]);
        let command = Command::from_smtp_message(&msg).unwrap();
        match command {
            Command::Helo { fqdn } => {
                state.greeting_done = true;
                state.esmtp = false;
                socket.write_all(messages::HELO_RESPONSE).await.unwrap();
            }
            Command::Ehlo { fqdn } => {
                state.greeting_done = true;
                state.esmtp = true;
                socket.write_all(messages::HELO_RESPONSE).await.unwrap();

                for ext in esmtp::SUPPORTED_EXTENSIONS {
                    socket
                        .write_all(format!("250-{}\n", ext).as_bytes())
                        .await
                        .unwrap();
                }
            }
            Command::MailFrom { email } => {
                if !state.greeting_done {
                    socket
                        .write_all(messages::BAD_COMMAND_SEQUENCE)
                        .await
                        .unwrap();
                    continue;
                }

                state.mail_from = Some(email.to_string());
                socket.write_all(messages::OK).await.unwrap();
            }
            Command::RcptTo { email } => {
                if !state.greeting_done || state.mail_from.is_none() {
                    socket
                        .write_all(messages::BAD_COMMAND_SEQUENCE)
                        .await
                        .unwrap();
                    continue;
                }

                state.rcpt_to.push(email.to_string());
                socket.write_all(messages::OK).await.unwrap();
            }
            Command::Help => {
                socket.write_all(messages::HELP_RESPONSE).await.unwrap();
            }
            Command::NoOp => {
                socket.write_all(messages::OK).await.unwrap();
            }
            Command::Rset => {
                state.mail_from = None;
                state.rcpt_to.clear();
                state.data = None;
                socket.write_all(messages::OK).await.unwrap();
            }
        }
    }
}

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
