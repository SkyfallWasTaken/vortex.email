use std::fmt::Display;

use nanoid::nanoid;
use serde::Serialize;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream, ToSocketAddrs};

mod consts;
mod esmtp;
pub mod event;
mod messages;

use event::Event;
use messages::Command;

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("network error: {0}")]
    NetworkError(#[from] std::io::Error),

    #[error("mail from missing")]
    MailFromMissing,

    #[error("rcpt to missing")]
    RcptToMissing,

    #[error("data missing")]
    DataMissing,
}

#[derive(Debug, Clone)]
pub struct State {
    esmtp: bool,
    greeting_done: bool,
    finished: bool,

    mail_from: Option<String>,
    rcpt_to: Vec<String>,
    waiting_for_data: bool,
    data: Vec<u8>, // We can't use a &[u8], as that could cause a stack overflow
}

async fn process<T: Send + Fn(&str) -> bool>(
    mut socket: TcpStream,
    is_email_valid: T,
) -> Result<State, Error> {
    let mut buf = vec![0; consts::MAX_SIZE];

    let mut state = State {
        esmtp: false,
        greeting_done: false,
        finished: false,

        mail_from: None,
        rcpt_to: Vec::new(),
        waiting_for_data: false,
        data: Vec::new(),
    };

    socket.write_all(messages::GREETING).await?;

    loop {
        let n = match socket.read(&mut buf).await {
            // socket closed
            Ok(0) => return Ok(state),
            Ok(n) => n,
            Err(e) => {
                return Err(Error::NetworkError(e));
            }
        };

        let msg = String::from_utf8_lossy(&buf[0..n]);
        tracing::trace!("received: {:?}", msg);

        if state.waiting_for_data {
            // TODO: Implement dot stuffing
            tracing::debug!("data: {:?}", msg);
            // TODO: is this correct?
            if msg.ends_with("\r\n.\r\n") {
                // -5 for \r\n.\r\n
                if state.data.len() + n - 5 > consts::MAX_SIZE {
                    socket.write_all(messages::MESSAGE_TOO_LARGE).await?;
                    continue;
                }

                state.waiting_for_data = false;
                state.finished = true;
                tracing::trace!("got . in data, ending");

                state.data.extend_from_slice(&buf[0..n - 5]); // Don't include the \r\n.\r\n
                socket.write_all(messages::OK).await?;
            } else {
                if state.data.len() + n > consts::MAX_SIZE {
                    socket.write_all(messages::MESSAGE_TOO_LARGE).await?;
                    continue;
                }

                tracing::trace!("adding {n} bytes to data");
                state.data.extend_from_slice(&buf[0..n]);
            }
        } else {
            let Some(command) = Command::from_smtp_message(msg.trim()) else {
                tracing::trace!("command unrecognised");
                socket.write_all(messages::UNRECOGNIZED_COMMAND).await?;
                continue;
            };
            match command {
                Command::Helo { fqdn } => {
                    tracing::trace!("HELO");
                    state.greeting_done = true;
                    state.esmtp = false;
                    socket
                        .write_all(messages::helo_response(fqdn).as_bytes())
                        .await?;
                }
                Command::Ehlo { fqdn } => {
                    tracing::trace!("EHLO");
                    state.greeting_done = true;
                    state.esmtp = true;

                    let mut response = Vec::new();
                    response.extend_from_slice(messages::helo_response(fqdn).as_bytes());

                    for ext in esmtp::SUPPORTED_EXTENSIONS {
                        response.extend_from_slice(format!("250-{ext}\r\n").as_bytes());
                    }
                    response.extend_from_slice(b"250 SMTPUTF8\r\n");

                    socket.write_all(&response).await?;
                }

                Command::MailFrom { email } => {
                    if !state.greeting_done {
                        tracing::trace!("MAIL FROM in wrong order");
                        socket.write_all(messages::BAD_COMMAND_SEQUENCE).await?;
                        continue;
                    }

                    state.mail_from = Some(email.to_string());
                    socket.write_all(messages::OK).await?;
                    tracing::trace!("MAIL FROM sent");
                }
                Command::RcptTo { email } => {
                    if !state.greeting_done || state.mail_from.is_none() {
                        tracing::trace!("RCPT TO in wrong order");
                        socket.write_all(messages::BAD_COMMAND_SEQUENCE).await?;
                        continue;
                    }

                    let email = email.to_string();
                    let email = email.trim();
                    if !is_email_valid(email) {
                        tracing::trace!("email incoming, but recipient is invalid");
                        socket.write_all(messages::USER_UNKNOWN).await?;
                        continue;
                    }

                    tracing::trace!("added new recipient");
                    state.rcpt_to.push(email.to_string());
                    socket.write_all(messages::OK).await?;
                }
                Command::Data => {
                    if !state.greeting_done || state.mail_from.is_none() || state.rcpt_to.is_empty()
                    {
                        tracing::trace!("DATA sent, but in wrong order");
                        socket.write_all(messages::BAD_COMMAND_SEQUENCE).await?;
                        continue;
                    }

                    state.waiting_for_data = true;
                    tracing::trace!("waiting for data");
                    socket.write_all(messages::DATA_RESPONSE).await?;
                }

                Command::Help => {
                    socket.write_all(messages::HELP_RESPONSE).await?;
                }
                Command::NoOp => {
                    socket.write_all(messages::OK).await?;
                }
                Command::Rset => {
                    state.mail_from = None;
                    state.rcpt_to.clear();
                    state.data = Vec::new();
                    socket.write_all(messages::OK).await?;
                }
                Command::Quit => {
                    state.finished = true;
                    socket.write_all(messages::BYE).await?;
                    socket.shutdown().await?;
                    return Ok(state);
                }
            }
        }
    }
}

#[derive(Clone, Debug, Serialize)]
pub struct Email {
    pub mail_from: String,
    pub rcpt_to: Vec<String>,
    pub data: String,
    // FIXME: this is *probably* the wrong place to put this.
    // However, it's also the easiest way.
    // Get rid of this ASAP.
    pub id: String,
}

pub async fn listen<A, F, G>(addr: A, validate_email: F, handle_event: G) -> Result<(), Error>
where
    A: ToSocketAddrs + Display + Copy + Send,
    F: Fn(&str) -> bool + Send + Sync + Clone + 'static, // Added Clone here
    G: Fn(Event) + Send + Sync + Clone + 'static,        // Added Clone here
{
    let listener = TcpListener::bind(addr).await?;

    tracing::debug!("listening on {addr}");

    loop {
        let (socket, _) = listener.accept().await?;
        let validate_email_clone = validate_email.clone();
        let handle_event_clone = handle_event.clone();

        socket.set_nodelay(true)?;
        tokio::spawn(async move {
            let result: Result<(), Error> = async {
                let state = process(socket, validate_email_clone).await?;

                if state.finished {
                    if state.rcpt_to.is_empty() {
                        return Err(Error::RcptToMissing);
                    }

                    if state.data.is_empty() {
                        return Err(Error::DataMissing);
                    }

                    handle_event_clone(Event::EmailReceived(crate::Email {
                        mail_from: state.mail_from.ok_or(Error::MailFromMissing)?,
                        rcpt_to: state.rcpt_to,
                        data: String::from_utf8_lossy(&state.data).to_string(), // FIXME: this is inefficient.
                        id: nanoid!(),
                    }));
                } else {
                    tracing::debug!("connection closed before finishing");
                }

                Ok(())
            }
            .await;

            if let Err(e) = result {
                tracing::error!("error processing email: {:?}", e);
            }
        });
    }
}
