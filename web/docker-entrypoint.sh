#!/bin/sh
set -eu

if [ -z "${AUTH_SECRET:-}" ]; then
  echo "ERROR: AUTH_SECRET is required."
  echo "Set it in your .env file, or in Portainer → Stack → Environment variables."
  echo "Generate one with:  openssl rand -base64 32"
  exit 1
fi

# Allow setting only AUTH_SECRET; mirror it for Auth.js if NEXTAUTH_SECRET is blank
if [ -z "${NEXTAUTH_SECRET:-}" ]; then
  export NEXTAUTH_SECRET="$AUTH_SECRET"
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
fi

echo "Starting Flying J Premium Beef on 0.0.0.0:${PORT:-3000}"
exec npm start
