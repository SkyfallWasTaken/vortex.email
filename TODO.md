# To-Dos

## ESMTP Extensions

- [x] SIZE
- [ ] 8BITMIME
- [ ] STARTTLS
- [ ] ENHANCEDSTATUSCODES
- [ ] PIPELINING
- [ ] CHUNKING
- [x] SMTPUTF8

## Fuzzing Failures

- `begin <= end (6 <= 5) when slicing FROM:<` - crates/vortex-smtp/src/messages.rs:47
- `begin <= end (4 <= 3) when slicing TO:<` - crates/vortex-smtp/src/messages.rs:60


## Miscellaneous

### DATA

- [ ] Dot Stuffing

### RCPT TO

- [ ] Inform that we are not a forwarder

### VRFY

- [ ] Implement (but say we don't do this)

### SIZE
- [ ] Actually check the size of the message