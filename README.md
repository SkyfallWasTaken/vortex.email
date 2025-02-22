# Vortex

![image](https://cloud-tyy4wckc7-hack-club-bot.vercel.app/0image.png)

**Tired of dealing with a cluttered email inbox?** Vortex has you covered! It’s a simple solution for keeping your primary email clean by providing temporary email addresses. Use them to sign up for newsletters, websites, and services without worrying about spam or unwanted emails.

**Try it out at <https://vortex.skyfall.dev>,** where you’ll find over 10 (sub)domains to choose from!

## Why Vortex?

- Generate disposable email addresses
- Protect your primary email from spam and unwanted newsletters
- Ideal for one-time signups and temporary accounts _(looking at you, Quora)_

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

Run it anywhere, e.g. Cloudflare Pages. Ensure environment variables are set.

#### Backend

This assumes that you are using Docker and Caddy.

Firstly, create a new user for Vortex.

Secondly, [install rootless Docker.](https://docs.docker.com/engine/security/rootless) for the Vortex user.

Then this Docker command:

```bash
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE -v /home/vortex/vtx-logs:/app/logs -p 25:25 -p 3000:3000 --name vortex-backend ghcr.io/skyfallwastaken/vortex.email:main
```

And finally, this Caddy reverse proxy command:

```bash
caddy reverse-proxy --from <your api domain> --to :3000
```

<br>
