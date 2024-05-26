pub const GREETING: &[u8] = b"220 smtp.example.org ESMTP\n";
pub const HELO_RESPONSE: &[u8] = b"250-smtp2.example.org ready when you are, [$hostname]\n";

#[derive(Debug)]
pub enum Command<'a> {
    Helo { fqdn: &'a str },
    Ehlo { fqdn: &'a str },
}

impl<'a> Command<'a> {
    pub fn from_smtp_message(message: &'a str) -> Option<Command<'a>> {
        let message = message.split_whitespace().collect::<Vec<&str>>();
        let cmd = message.first()?.to_uppercase();
        let cmd = cmd.as_str();

        match cmd {
            "HELO" => Some(Self::Helo {
                fqdn: message.get(1)?,
            }),
            "EHLO" => Some(Self::Ehlo {
                fqdn: message.get(1)?,
            }),
            _ => None,
        }
    }
}
