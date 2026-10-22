#!/usr/bin/env bash
set -euo pipefail
image=${1:?image required}
secret=$(mktemp)
volume="reachwick-smoke-$RANDOM"
container="reachwick-smoke-$RANDOM"
trap 'docker rm -f "$container" >/dev/null 2>&1 || true; docker volume rm "$volume" >/dev/null 2>&1 || true; rm -f "$secret"' EXIT
printf '%s' 'Synthetic-smoke-password-72!' > "$secret"
chmod 644 "$secret"
docker volume create "$volume" >/dev/null
docker run --rm -v "$volume:/data" -v "$secret:/run/owner-password:ro" -e OWNER_EMAIL=owner@example.test -e OWNER_PASSWORD_FILE=/run/owner-password "$image" npm run owner:setup
docker run -d --name "$container" -v "$volume:/data" -p 127.0.0.1::3000 "$image" >/dev/null
port=$(docker port "$container" 3000/tcp | cut -d: -f2)
for attempt in $(seq 1 40); do
  if curl --fail --silent "http://127.0.0.1:$port/healthz" >/dev/null; then break; fi
  sleep 2
done
curl --fail --silent "http://127.0.0.1:$port/healthz" >/dev/null
curl --fail --silent -H 'Content-Type: application/json' -d '{"email":"owner@example.test","password":"Synthetic-smoke-password-72!"}' "http://127.0.0.1:$port/api/v1/auth/login" >/dev/null
