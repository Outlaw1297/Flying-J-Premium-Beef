#!/bin/sh
set -eu

DATA_DIR="${DATA_DIR:-/app/data}"
mkdir -p "$DATA_DIR"

rand_secret() {
  node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))"
}

rand_password() {
  node -e "process.stdout.write(require('crypto').randomBytes(12).toString('base64url'))"
}

# Persist AUTH_SECRET across restarts so login sessions stay valid.
if [ -z "${AUTH_SECRET:-}" ]; then
  if [ -f "$DATA_DIR/auth_secret" ]; then
    AUTH_SECRET="$(cat "$DATA_DIR/auth_secret")"
    echo "Loaded AUTH_SECRET from $DATA_DIR/auth_secret"
  else
    AUTH_SECRET="$(rand_secret)"
    printf '%s' "$AUTH_SECRET" > "$DATA_DIR/auth_secret"
    chmod 600 "$DATA_DIR/auth_secret"
    echo "Generated AUTH_SECRET and saved to $DATA_DIR/auth_secret"
  fi
  export AUTH_SECRET
fi

if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  export NEXTAUTH_SECRET="$AUTH_SECRET"
fi

# Auto-create an admin password on first seed when none was provided.
if [ "${SEED_ON_START:-false}" = "true" ] && [ -z "${SEED_ADMIN_PASSWORD:-}" ]; then
  if [ -f "$DATA_DIR/admin_password" ]; then
    SEED_ADMIN_PASSWORD="$(cat "$DATA_DIR/admin_password")"
    echo "Loaded SEED_ADMIN_PASSWORD from $DATA_DIR/admin_password"
  else
    SEED_ADMIN_PASSWORD="$(rand_password)"
    printf '%s' "$SEED_ADMIN_PASSWORD" > "$DATA_DIR/admin_password"
    chmod 600 "$DATA_DIR/admin_password"
    echo "Generated SEED_ADMIN_PASSWORD and saved to $DATA_DIR/admin_password"
  fi
  export SEED_ADMIN_PASSWORD
fi

echo "Waiting for database..."
node <<'NODE'
const { Client } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

(async () => {
  for (let i = 0; i < 60; i += 1) {
    const client = new Client({ connectionString: url });
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      console.log("Database is ready.");
      process.exit(0);
    } catch (error) {
      try {
        await client.end();
      } catch {
        // ignore
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.error(
    "Database not reachable after 60s — check DATABASE_URL and that Postgres is up.",
  );
  process.exit(1);
})();
NODE

echo "Running database migrations..."
npx prisma migrate deploy

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "SEED_ON_START=true — seeding database..."
  npm run db:seed
  if [ -n "${SEED_ADMIN_PASSWORD:-}" ]; then
    echo ""
    echo "========================================================"
    echo " Admin login (save this — shown on first seed only)"
    echo "   email:    ${SEED_ADMIN_EMAIL:-admin@flyingjbeef.com}"
    echo "   password: ${SEED_ADMIN_PASSWORD}"
    echo " Also saved in container at: $DATA_DIR/admin_password"
    echo "========================================================"
    echo ""
  fi
fi

echo "Starting Flying J Premium Beef on 0.0.0.0:${PORT:-3000}"
exec npm start
