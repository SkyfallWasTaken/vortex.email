pub const GREETING: &[u8] = b"220 smtp.example.org\n";
pub const HELO_RESPONSE: &[u8] = b"250-smtp2.example.com ready when you are, [$hostname]\n";

#[derive(Debug)]
pub enum Command<'a> {
    Helo {
        fqdn: &'a str
    },
}

impl Command<'_> {
    pub fn from_smtp_message(message: &str) -> Option<Command> {
        let mut message = message.split_whitespace();
        let binding = message.next()?.to_uppercase();
        let cmd = binding.as_str();

        match cmd {
            "HELO" => Some(Self::Helo {
                fqdn: message.next()?
            }),
            _ => None,
        }
    }
}
