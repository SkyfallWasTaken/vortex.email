use const_format::concatcp;

pub const SUPPORTED_EXTENSIONS: &[&str; 1] = &[
    // "HELP",
    concatcp!("SIZE ", crate::consts::MAX_SIZE),
];
