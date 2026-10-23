# Docker and remote deployment

Run `docker compose build`, initialize the owner using the private password file command in [installation](installation.md), then `docker compose up -d`. The non-root app persists `/data` in a named volume. Use Docker Desktop on Windows/macOS or Docker Engine and Compose on Linux. For a server, choose any provider that supports Docker Compose and persistent storage.

The optional Cloudflare Tunnel sidecar is pinned to a verified image digest. Verify and deliberately update it when maintaining the deployment. Image verification establishes artifact availability, not a completed remote deployment.

## Optional Cloudflare Tunnel

On any Linux server (AMD64 or ARM64), install Docker and Compose and deploy a reviewed checkout. Keep the data volume on persistent local storage and restrict administrator access. When using the tunnel, do not expose port 3000 through the provider firewall or host firewall.

Create a Cloudflare Tunnel and route your hostname to `http://app:3000`. Store its token in a private file outside Git and set `CLOUDFLARE_TUNNEL_TOKEN_FILE` to that absolute path. Set `PUBLIC_ORIGIN` to your exact HTTPS origin and `SECURE_COOKIES=true`. Run `docker compose --profile cloud up -d`. The tunnel connects outbound; the app stays on the private Compose network.

Compose assigns the app `172.30.254.3` and cloudflared `172.30.254.2` on a private network. The app uses `CF-Connecting-IP` for rate limiting only when the connection comes from that configured cloudflared address; direct clients cannot choose their rate-limit key with a forwarded header. If this subnet conflicts with your host network, set `REACHWICK_NETWORK_SUBNET`, `REACHWICK_APP_IP`, and `TRUSTED_TUNNEL_PROXY_IP` together in the Compose environment, keeping both addresses inside the subnet. Do not configure Cloudflare to remove visitor IP headers; Cloudflare documents that `CF-Connecting-IP` carries the visitor address to the origin: https://developers.cloudflare.com/fundamentals/reference/http-headers/.

For another HTTPS proxy or tunnel, keep port 3000 private and configure `PUBLIC_ORIGIN` and `SECURE_COOKIES=true`. Forwarded client IPs are not trusted by default; configure a trusted proxy only after reviewing the deployment's network boundaries.

Verify HTTPS, login, anonymous API rejection, and blocked direct app-port access from another device. Record image digest, date, and backup location. A written deployment guide does not establish these release gates passed. Cloud accounts, domains, and provisioning are manual prerequisites.

Back up before upgrades. Stop the existing app, update to the reviewed release, then restart with the same volume. Never run two versions on one database. On migration failure, restore with the old application version.

Reference: https://developers.cloudflare.com/tunnel/
