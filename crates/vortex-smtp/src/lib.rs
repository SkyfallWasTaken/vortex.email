use eyre::Result;

use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream, ToSocketAddrs};

mod consts;
mod esmtp;
pub mod event;
mod messages;

use event::Event;
use messages::Command;

const ADDR: &str = "127.0.0.1:25";

#[derive(Debug, Clone)]
pub struct State {
    esmtp: bool,
    greeting_done: bool,

    mail_from: Option<String>,
    rcpt_to: Vec<String>,
    waiting_for_data: bool,
    data: Option<Vec<u8>>, // We can't use a &[u8], as that could cause a stack overflow
}

async fn process<T: Fn(&str) -> bool>(mut socket: TcpStream, is_email_valid: T) -> State {
    let mut buf = vec![0; consts::MAX_SIZE];

    let mut state = State {
        esmtp: false,
        greeting_done: false,

        mail_from: None,
        rcpt_to: Vec::new(),
        waiting_for_data: false,
        data: None,
    };

    socket.write_all(messages::GREETING).await.unwrap();

    loop {
        let n = match socket.read(&mut buf).await {
            // socket closed
            Ok(0) => return state,
            Ok(n) => n,
            Err(e) => {
                panic!() // FIXME: oops.
            }
        };

        let msg = String::from_utf8_lossy(&buf[0..n]);

        if state.waiting_for_data {
            // TODO: Implement dot stuffing
            tracing::debug!("Data: {:?}", msg);
            // TODO: is this correct?
            if msg.ends_with(".\n") {
                state.waiting_for_data = false;
                state
                    .data
                    .get_or_insert_with(Vec::new)
                    .extend_from_slice(&buf[0..n - 2]); // Don't include the trailing .\n
                socket.write_all(messages::OK).await.unwrap();
            } else {
                state
                    .data
                    .get_or_insert_with(Vec::new)
                    .extend_from_slice(&buf[0..n]);
            }
        } else {
            let Some(command) = Command::from_smtp_message(&msg) else {
                socket
                    .write_all(messages::UNRECOGNIZED_COMMAND)
                    .await
                    .unwrap();
                continue;
            };
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
                            .write_all(format!("250-{ext}\n").as_bytes())
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

                    let email = email.to_string();
                    let email = email.trim();
                    if !is_email_valid(email) {
                        socket.write_all(messages::USER_UNKNOWN).await.unwrap();
                        continue;
                    }

                    state.rcpt_to.push(email.to_string());
                    socket.write_all(messages::OK).await.unwrap();
                }
                Command::Data => {
                    if !state.greeting_done || state.mail_from.is_none() || state.rcpt_to.is_empty()
                    {
                        socket
                            .write_all(messages::BAD_COMMAND_SEQUENCE)
                            .await
                            .unwrap();
                        continue;
                    }

                    state.waiting_for_data = true;
                    tracing::debug!("Waiting for data");
                    socket.write_all(messages::DATA_RESPONSE).await.unwrap();
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
                Command::Quit => {
                    socket.write_all(messages::BYE).await.unwrap();
                    socket.shutdown().await.unwrap();
                    return state;
                }
            }
        }
    }
}

#[derive(Clone, Debug)]
pub struct Email {
    pub mail_from: String,
    pub rcpt_to: Vec<String>,
    pub data: Vec<u8>,
}

pub async fn listen<A, F, G>(addr: A, validate_email: F, handle_event: G) -> Result<()>
where
    A: ToSocketAddrs,
    F: Fn(&str) -> bool + Send + Sync + Clone + 'static, // Added Clone here
    G: Fn(Event) + Send + Sync + Clone + 'static,        // Added Clone here
{
    let listener = TcpListener::bind(addr).await.unwrap();

    tracing::debug!("Listening on {ADDR}");

    loop {
        let (socket, _) = listener.accept().await.unwrap();
        let validate_email_clone = validate_email.clone();
        let handle_event_clone = handle_event.clone();

        socket.set_nodelay(true).unwrap();
        tokio::spawn(async move {
            let state = process(socket, validate_email_clone).await; // Use the cloned closure
            handle_event_clone(Event::EmailReceived(crate::Email {
                mail_from: state.mail_from.unwrap(),
                rcpt_to: state.rcpt_to,
                data: state.data.unwrap(),
            }));
        });
    }
}
