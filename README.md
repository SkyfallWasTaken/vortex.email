# Vortex

A free, disposable email service from [Skyfall.](https://skyfall.dev)

![e4494707-0aa6-4c93-aa64-25a0d0c0f7cc-image](https://github.com/SkyfallWasTaken/vortex.email/assets/55807755/96ed167b-5ace-4b25-ae4a-1b4e1053919f)

I built Vortex because I was frustrated with receiving random newsletters and spam in my email, just because some random website forced me to sign up to their newsletter for a discount years ago. Vortex changes that - you get a temporary email address you can give to newsletters and websites, which you can use for those websites that require you to create an account to get what you need _(looking at you, Quora)_

## Building

You will need:

- Rust
- Bun
- Node.js (to actually run the project)

Additionally, if you want to run the server, we recommend:

- Docker
- Caddy

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

## Running Vortex

Ensure you've built everything first.

### In development

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

### In production

#### Frontend

Run it anywhere, e.g. Vercel. Ensure environment variables are set.

#### Backend

This assumes that you are using Docker and Caddy.

Firstly, create a new user for Vortex.

Secondly, [install rootless Docker.](https://docs.docker.com/engine/security/rootless) for the Vortex user.

Then this Docker command:

```bash
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE -d -p 25:25 -p 3000:3000 ghcr.io/skyfallwastaken/vortex.email:latest
```

And finally, this Caddy reverse proxy command:

```bash
caddy reverse-proxy --from <your api domain> --to :3000
```
<br>
