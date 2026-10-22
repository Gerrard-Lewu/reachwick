# Docker and Oracle deployment

Run `docker compose build`, initialize the owner using the private password file command in installation.md, then `docker compose up -d`. The non-root app persists /data in a named volume. Use Docker Desktop on Windows/macOS or Docker Engine and Compose on Linux.

Cloudflared is pinned to the registry's verified latest manifest digest observed on 2026-10-22. Verify and deliberately update this digest when maintaining the deployment. Registry verification establishes artifact availability, not a completed cloud deployment.

## Oracle with Cloudflare Tunnel

Manually provision an Ubuntu Oracle VM (AMD64 or ARM64), install Docker and Compose, and deploy a reviewed checkout. Keep the data volume on persistent local block storage. Restrict SSH to trusted sources. Do not open port 3000 in Oracle security lists or the host firewall.

Create a remotely managed Cloudflare Tunnel and route your owned hostname to `http://app:3000`. Put its token in a private file outside Git and set CLOUDFLARE_TUNNEL_TOKEN_FILE to that absolute path. Set PUBLIC_ORIGIN to your exact HTTPS origin and SECURE_COOKIES=true. Run `docker compose --profile cloud up -d`. The tunnel establishes outbound connections.

Compose assigns the app `172.30.254.3` and cloudflared `172.30.254.2` on a private network. The app uses `CF-Connecting-IP` for rate limiting only when the connection comes from that configured cloudflared address; direct clients cannot choose their rate-limit key with a forwarded header. If this subnet conflicts with your host network, set `REACHWICK_NETWORK_SUBNET`, `REACHWICK_APP_IP`, and `TRUSTED_TUNNEL_PROXY_IP` together in the Compose environment, keeping both addresses inside the subnet. Do not configure Cloudflare to remove visitor IP headers; Cloudflare documents that `CF-Connecting-IP` carries the visitor address to the origin: https://developers.cloudflare.com/fundamentals/reference/http-headers/.

Verify HTTPS, login, anonymous API rejection, and blocked direct VM port access from another device. Record image digest, date, and backup location. A written deployment guide does not establish these release gates passed. Cloud accounts, domains, and provisioning are manual prerequisites.

Back up before upgrades. Stop the existing app, update to the reviewed release, then restart with the same volume. Never run two versions on one database. On migration failure, restore with the old application version.

References: https://developers.cloudflare.com/tunnel/ and https://docs.oracle.com/en-us/iaas/Content/Compute/home.htm
