#[derive(Debug, Clone)]
pub enum Event {
    EmailReceived(crate::Email),
}

pub type EventHandler = fn(Event);
