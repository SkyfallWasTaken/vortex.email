#[derive(Debug, Clone)]
pub enum Event {
    EmailReceived(crate::State),
}

pub type EventHandler = fn(Event);