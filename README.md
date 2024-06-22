# Vortex

A free, disposable email service from [Skyfall.](https://skyfall.dino.icu)

![e4494707-0aa6-4c93-aa64-25a0d0c0f7cc-image](https://github.com/SkyfallWasTaken/vortex.email/assets/55807755/96ed167b-5ace-4b25-ae4a-1b4e1053919f)

## Building

You will need:
- Rust
- Bun
- Node.js (to actually run the project)

### Building the SMTP server

Run:
```bash
cargo b --release
```
The server will be located at `/target/debug/vortex-server`.

### Building the frontend

Run:
```bash
cd frontend
bun run build
```

### Running Vortex in development

In one terminal, run:
```bash
RUST_LOG=debug cargo run
```
Ensure you have permissions to bind to port 25.

In another, run:
```bash
cd frontend
bun dev
```
