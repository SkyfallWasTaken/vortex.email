# Vortex

![image](https://hc-cdn.hel1.your-objectstorage.com/s/v3/678d11449bb79ac1df1e1bc96c0819a684c3dea7_image.png)

**Tired of dealing with a cluttered email inbox?** Vortex has you covered. It’s a simple solution for keeping your primary email clean by providing temporary email addresses - use them to sign up for newsletters, websites, and services without worrying about spam or unwanted emails!

**Try it out at <https://vortex.skyfall.dev>,** where you’ll find over 10 (sub)domains to choose from.

## Why Vortex?

- Generate disposable email addresses
- Protect your primary email from spam and unwanted newsletters
- Ideal for one-time signups and temporary accounts _(looking at you, Quora)_

## Development

You will need:

- Rust
- Bun
- Node.js (to actually run the project)

It's also recommended to install Docker so you can run the SMTP server.

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
RUST_LOG=debug FRONTEND_DOMAIN=localhost cargo run
```

By default, the SMTP server will listen on **port 2525**, so that you don't need to run it as root whilst developing.

In another terminal, run:

```bash
cd frontend
bun install
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

---

#### License

<sup>
Licensed under the <a href="LICENSE.md">GNU Affero General Public License v3.0</a>.
</sup>

<br>

<sub>
Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in this application by you, as defined in the GNU Affero General Public License v3.0, shall
be licensed as above, without any additional terms or conditions.
</sub>
