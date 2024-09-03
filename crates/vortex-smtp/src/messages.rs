use const_format::formatcp;

pub const GREETING: &[u8] = formatcp!(
    "220 smtp.example.org ESMTP VortexSMTP(v{})\n",
    env!("CARGO_PKG_VERSION")
)
.as_bytes();
pub const BAD_COMMAND_SEQUENCE: &[u8] = b"503 Bad sequence of commands\n";
pub const OK: &[u8] = b"250 OK\n";
pub const DATA_RESPONSE: &[u8] = b"354 End data with <CR><LF>.<CR><LF>\n";
pub const HELP_RESPONSE: &[u8] =
    b"214-go check out https://datatracker.ietf.org/doc/html/rfc5321\n";
pub const UNRECOGNIZED_COMMAND: &[u8] = b"500 Unrecognized command\n";
pub const USER_UNKNOWN: &[u8] = b"550 User unknown\n";
pub const BYE: &[u8] = b"221 Bye\n";

pub fn helo_response(hostname: &str) -> String {
    format!("250-smtp2.example.org ready when you are, {hostname}\n")
}

#[derive(Debug, PartialEq, Eq)]
pub enum Command<'a> {
    Helo { fqdn: &'a str },
    Ehlo { fqdn: &'a str },

    MailFrom { email: &'a str },
    RcptTo { email: &'a str },
    Data,

    Help,
    NoOp,
    Rset,
    Quit,
}

impl<'a> Command<'a> {
    #[tracing::instrument]
    pub fn from_smtp_message(msg: &'a str) -> Option<Self> {
        let msg: Vec<&str> = msg.split_whitespace().collect();
        let cmd = msg.first()?.to_uppercase();
        let cmd = cmd.as_str();

        match cmd {
            "HELO" => Some(Self::Helo { fqdn: msg.get(1)? }),
            "EHLO" => Some(Self::Ehlo { fqdn: msg.get(1)? }),

            "MAIL" => {
                let arg = msg.get(1)?.to_uppercase();

                if arg.starts_with("FROM:") {
                    let arg = msg.get(1)?;
                    if let (Some(start), Some(end)) = (arg.find('<'), arg.find('>')) {
                        // Extract the substring between the < and >
                        let email = &arg[start + 1..end];
                        if !email.is_empty() {
                            return Some(Self::MailFrom { email });
                        }
                    }
                }

                None
            }
            "RCPT" => {
                let arg = msg.get(1)?.to_uppercase();

                if arg.starts_with("TO:") {
                    let arg = msg.get(1)?;
                    if let (Some(start), Some(end)) = (arg.find('<'), arg.find('>')) {
                        // Extract the substring between the < and >
                        let email = &arg[start + 1..end];
                        if !email.is_empty() {
                            return Some(Self::RcptTo { email });
                        }
                    }
                }

                None
            }

            "DATA" => Some(Self::Data),

            "HELP" => Some(Self::Help),
            "NOOP" => Some(Self::NoOp),
            "RSET" => Some(Self::Rset),
            "QUIT" => Some(Self::Quit),
            _ => {
                tracing::trace!("Unrecognized command: {}", cmd);
                None
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_helo() {
        assert_eq!(
            Command::from_smtp_message("HELO smtp.example.org"),
            Some(Command::Helo {
                fqdn: "smtp.example.org"
            })
        );
    }

    #[test]
    fn test_ehlo() {
        assert_eq!(
            Command::from_smtp_message("EHLO smtp.example.org"),
            Some(Command::Ehlo {
                fqdn: "smtp.example.org"
            })
        );
    }

    #[test]
    fn test_mail_from() {
        assert_eq!(
            Command::from_smtp_message("MAIL FROM:<test@skyfall.com>"),
            Some(Command::MailFrom {
                email: "test@skyfall.com"
            })
        );
        assert_eq!(Command::from_smtp_message("MAIL FROM:<"), None);
        assert_eq!(Command::from_smtp_message("MAIL FROM:<hi"), None);
    }

    #[test]
    fn test_rcpt_to() {
        assert_eq!(
            Command::from_smtp_message("RCPT TO:<test@skyfall.com>"),
            Some(Command::RcptTo {
                email: "test@skyfall.com"
            })
        );
        assert_eq!(Command::from_smtp_message("RCPT TO:<"), None);
        assert_eq!(Command::from_smtp_message("RCPT TO:<hi"), None);
    }

    #[test]
    fn case_insensitive_commands() {
        assert_eq!(Command::from_smtp_message("help"), Some(Command::Help));
    }
    #[test]
    fn command_argument_casing_is_kept() {
        assert_eq!(
            Command::from_smtp_message("MAIL FROM:<Test@test.com>"),
            Some(Command::MailFrom {
                email: "Test@test.com"
            })
        );
        assert_eq!(
            Command::from_smtp_message("RCPT TO:<Test@test.com>"),
            Some(Command::RcptTo {
                email: "Test@test.com"
            })
        );
        assert_eq!(
            Command::from_smtp_message("HELO Test.com"),
            Some(Command::Helo { fqdn: "Test.com" })
        )
    }

    // Miscellaneous. Will probably never fail lol (famous last words)
    #[test]
    fn test_data() {
        assert_eq!(Command::from_smtp_message("DATA"), Some(Command::Data));
    }
    #[test]
    fn test_help() {
        assert_eq!(Command::from_smtp_message("HELP"), Some(Command::Help));
    }
    #[test]
    fn test_noop() {
        assert_eq!(Command::from_smtp_message("NOOP"), Some(Command::NoOp));
    }
    #[test]
    fn test_rset() {
        assert_eq!(Command::from_smtp_message("RSET"), Some(Command::Rset));
    }
    #[test]
    fn test_quit() {
        assert_eq!(Command::from_smtp_message("QUIT"), Some(Command::Quit));
    }
}
