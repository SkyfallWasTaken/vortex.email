#[derive(Debug, Clone)]
pub enum Event {
    EmailReceived {
        mail_from: String,
        rcpt_to: Vec<String>,
        data: Vec<u8>,
    },
}

pub type EventHandler = fn(Event);
