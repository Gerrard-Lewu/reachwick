# Installation

Use Node.js 24 LTS and npm on Windows, macOS, or Linux. Native dependency builds may need Python and platform C++ build tools.

After cloning, run `npm ci`, `npm run build`, `npm run owner:setup`, and `npm start`. Open http://127.0.0.1:3000/app. Owner setup and reset require host terminal access. Use `npm run owner:reset` to reset credentials and revoke sessions.

Before native setup or reset, set OWNER_EMAIL and OWNER_PASSWORD_FILE in the terminal environment. OWNER_PASSWORD_FILE must name a private file containing a password of at least 12 characters. Avoid saving passwords in shell history. Remove the file securely after setup. OWNER_PASSWORD is also supported for controlled terminal use.

For Docker, create that file outside the checkout, then run the following command with your actual absolute file path and email. Use owner:reset instead for recovery. Credentials are supplied only to this one-off process, never the persistent app service.

```sh
docker compose run --rm -v /absolute/private/password.secret:/run/owner-password:ro -e OWNER_EMAIL=you@example.org -e OWNER_PASSWORD_FILE=/run/owner-password app npm run owner:setup
```

Ensure the file can be read by the container's non-root user while protecting it from other host users. On Windows, use an absolute Docker Desktop compatible path for the bind mount.

The default bind address is localhost. Keep DATABASE_PATH private and persistent (default data/reachwick.sqlite). Docker binds all container interfaces internally while publishing only host loopback. Review deployment.md before exposing remote access.
