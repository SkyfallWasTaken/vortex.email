use const_format::formatcp;

pub const GREETING: &[u8] = formatcp!(
    "220 smtp.example.org ESMTP WillowEmail(v{})\n",
    env!("CARGO_PKG_VERSION")
)
.as_bytes();
pub const HELO_RESPONSE: &[u8] = b"250-smtp2.example.org ready when you are, [$hostname]\n";
pub const BAD_COMMAND_SEQUENCE: &[u8] = b"503 Bad sequence of commands\n";
pub const OK: &[u8] = b"250 OK\n";
pub const HELP_RESPONSE: &[u8] =
    b"214-go check out https://datatracker.ietf.org/doc/html/rfc5321\n";

#[derive(Debug)]
pub enum Command<'a> {
    Helo { fqdn: &'a str },
    Ehlo { fqdn: &'a str },
    MailFrom { email: &'a str },
    RcptTo { email: &'a str },
    Help,
}

impl<'a> Command<'a> {
    pub fn from_smtp_message(msg: &'a str) -> Option<Command<'a>> {
        let msg = msg.split_whitespace().collect::<Vec<&str>>();
        let cmd = msg.first()?.to_uppercase();
        let cmd = cmd.as_str();

        match cmd {
            "HELO" => Some(Self::Helo { fqdn: msg.get(1)? }),
            "EHLO" => Some(Self::Ehlo { fqdn: msg.get(1)? }),
            "MAIL" => {
                let arg = msg.get(1)?.to_uppercase();
                if arg.starts_with("FROM:") {
                    let email = arg[6..].trim_start_matches('<').trim_end_matches('>');

                    Some(Self::MailFrom { email })
                } else {
                    None
                }
            }
            "RCPT" if msg.get(1)?.to_uppercase() == "TO" => {
                Some(Self::RcptTo { email: msg.get(2)? })
            }
            "HELP" => Some(Self::Help),
            _ => None,
        }
    }
}
