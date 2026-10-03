# Flying J Premium Beef

E-commerce system for a local federally inspected premium beef business.

- **[PLAN.md](./PLAN.md)** — Full execution plan
- **[web/](./web/)** — Next.js application
- **[docker-compose.yml](./docker-compose.yml)** — Self-host on a personal server / VPS

## Quick start (local)

```bash
cd web
cp .env.example .env
# Set DATABASE_URL and AUTH_SECRET in .env

npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Seed admin (local dev only):** `admin@flyingjbeef.com` / `changeme123`

## Self-host with Docker (personal server)

Requires Docker Engine + Docker Compose v2.

### Zero-config (Portainer / mobile)

The stack pulls a ready-made image. It does not build on your server.

1. Delete the failed stack if it is still listed.
2. Add a stack. Paste `docker-compose.yml` from `main`, or use the Git repository.
3. Leave environment variables empty and deploy.

Repository settings, if you use Git instead of paste:

- URL: `https://github.com/Outlaw1297/Flying-J-Premium-Beef`
- Compose path: `docker-compose.yml`
- Branch: `main`
- The repo is private, so Portainer needs a GitHub personal access token with repo read access.

After the **web** container is running, open its logs:

```text
email:    admin@flyingjbeef.com
password: (generated value in the log)
```

Optional later:

- `NEXTAUTH_URL=https://your-domain.example`
- `SEED_ON_START=false` after you have signed in
- `POSTGRES_PASSWORD` if you do not want the built-in default `flying_j_change_me`

### CLI

```bash
chmod +x scripts/docker-init-env.sh
./scripts/docker-init-env.sh   # optional — pre-writes secrets into .env
docker compose pull
docker compose up -d
```

- App: `http://localhost:3000` (or your `NEXTAUTH_URL` behind a reverse proxy)
- First boot runs migrations + seed when `SEED_ON_START=true` (default)
- After first successful login, set `SEED_ON_START=false` and redeploy/recreate `web`

Useful commands:

```bash
docker compose logs -f web
docker compose exec web npm run db:seed          # re-seed / reset admin password
docker compose exec web npm run db:sync-stripe   # if Stripe keys are set
docker compose down                              # stop (keeps DB + uploads volumes)
```

Product uploads persist in the `uploads_data` volume. Postgres data persists in `postgres_data`.

Put a reverse proxy (Caddy / nginx / Traefik) in front for HTTPS and point Stripe webhooks at `https://your-domain/api/stripe/webhook`.

## Deploy on Render

1. Push this repo to GitHub.
2. In Render Dashboard → **New Blueprint** → connect repo (uses `render.yaml` on `main`).
3. Set environment variables:
   - `NEXTAUTH_URL` → `https://flying-j-beef.onrender.com`
   - `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` (Stripe test keys)
   - `STRIPE_WEBHOOK_SECRET` (from Stripe webhook endpoint)
   - `BUSINESS_ADDRESS_LINE1`, `BUSINESS_CITY`, `BUSINESS_STATE`, `BUSINESS_ZIP` (pickup tax origin)
4. After first deploy, seed products via Render shell:
   ```bash
   SEED_ADMIN_PASSWORD='your-secure-password' npm run db:seed
   ```

### Stripe Tax (state & county)

Sales tax uses **Stripe Tax** so rates follow the customer’s delivery address (or your business address for pickup).

1. In Stripe Dashboard → **Tax** → Get started
2. Set your **head office** address
3. Add **tax registrations** for states where you have nexus (at least your home state)
4. Card checkout uses `automatic_tax`; cash/check orders use the Tax Calculations API

Product tax code defaults to `txcd_40060003` (fresh meat / poultry). Override with `STRIPE_PRODUCT_TAX_CODE` if needed.

### Stripe product catalog sync

The website database is the source of truth. Products are mirrored to Stripe Products/Prices:

```bash
cd web
npm run db:sync-stripe
```

Or (as admin, while signed in) `POST /api/admin/sync-stripe-products`.

Checkout prefers Stripe Price IDs; it falls back to inline prices if sync is missing.

### Stripe webhook

In [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks), add endpoint:

`https://flying-j-beef.onrender.com/api/stripe/webhook`

Event: `checkout.session.completed`

Copy the signing secret into Render as `STRIPE_WEBHOOK_SECRET`.

## Phase 1 status (foundation)

- [x] Next.js 16 + TypeScript + Tailwind
- [x] Prisma schema (users, products, orders, coupons, newsletter, support)
- [x] Auth.js login / register / protected routes
- [x] Mobile-first layout (header, footer, bottom nav)
- [x] Home page with brand design
- [x] `render.yaml` for Render deployment
