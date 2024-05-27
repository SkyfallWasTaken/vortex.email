use const_format::formatcp;

pub const GREETING: &[u8] = formatcp!(
    "220 smtp.example.org ESMTP WillowEmail(v{})\n",
    env!("CARGO_PKG_VERSION")
)
.as_bytes();
pub const HELO_RESPONSE: &[u8] = b"250-smtp2.example.org ready when you are, [$hostname]\n";
pub const BAD_COMMAND_SEQUENCE: &[u8] = b"503 Bad sequence of commands\n";
pub const OK: &[u8] = b"250 OK\n";
pub const DATA_RESPONSE: &[u8] = b"354 End data with <CR><LF>.<CR><LF>\n";
pub const HELP_RESPONSE: &[u8] =
    b"214-go check out https://datatracker.ietf.org/doc/html/rfc5321\n";
pub const UNRECOGNIZED_COMMAND: &[u8] = b"500 Unrecognized command\n";

#[derive(Debug)]
pub enum Command<'a> {
    Helo { fqdn: &'a str },
    Ehlo { fqdn: &'a str },

    MailFrom { email: String },
    RcptTo { email: String },
    Data,

    Help,
    NoOp,
    Rset,
}

impl<'a> Command<'a> {
    pub fn from_smtp_message(msg: &'a str) -> Option<Command<'a>> {
        let msg: Vec<&str> = msg.trim().split_whitespace().collect();
        let cmd = msg.first()?.to_uppercase();
        let cmd = cmd.as_str();

        match cmd {
            "HELO" => Some(Self::Helo { fqdn: msg.get(1)? }),
            "EHLO" => Some(Self::Ehlo { fqdn: msg.get(1)? }),
            "MAIL" => {
                let arg = msg.get(1)?.to_uppercase();

                if arg.starts_with("FROM:") {
                    let email = arg
                        .trim_start_matches('<')
                        .trim_end_matches('>')
                        .to_string();

                    Some(Self::MailFrom { email })
                } else {
                    None
                }
            }
            "RCPT" => {
                let arg = msg.get(1)?.to_uppercase();

                if arg.starts_with("TO:") {
                    let email = arg
                        .trim_start_matches('<')
                        .trim_end_matches('>')
                        .to_string();

                    Some(Self::RcptTo { email })
                } else {
                    None
                }
            }
            "DATA" => Some(Self::Data),
            "HELP" => Some(Self::Help),
            "NOOP" => Some(Self::NoOp),
            "RSET" => Some(Self::Rset),
            _ => None,
        }
    }
}
