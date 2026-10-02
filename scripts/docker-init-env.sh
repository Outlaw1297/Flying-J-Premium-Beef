#!/usr/bin/env bash
# Create a root .env for Docker Compose with generated secrets.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXAMPLE="$ROOT_DIR/.env.docker.example"
TARGET="$ROOT_DIR/.env"

if [[ ! -f "$EXAMPLE" ]]; then
  echo "Missing $EXAMPLE" >&2
  exit 1
fi

if [[ -f "$TARGET" && "${FORCE:-}" != "1" ]]; then
  echo "$TARGET already exists. Re-run with FORCE=1 to overwrite." >&2
  exit 1
fi

AUTH_SECRET="$(openssl rand -base64 32)"
DB_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-24)"
ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-18)"

umask 077
sed \
  -e "s|^AUTH_SECRET=.*|AUTH_SECRET=${AUTH_SECRET}|" \
  -e "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${AUTH_SECRET}|" \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${DB_PASSWORD}|" \
  -e "s|^SEED_ADMIN_PASSWORD=.*|SEED_ADMIN_PASSWORD=${ADMIN_PASSWORD}|" \
  "$EXAMPLE" > "$TARGET"

echo "Wrote $TARGET"
echo
echo "Admin login after first boot:"
echo "  email:    admin@flyingjbeef.com"
echo "  password: ${ADMIN_PASSWORD}"
echo
echo "Next:"
echo "  1. Edit NEXTAUTH_URL in .env if this is not http://localhost:3000"
echo "  2. docker compose up -d --build"
echo "  3. After login works, set SEED_ON_START=false in .env and recreate web"
