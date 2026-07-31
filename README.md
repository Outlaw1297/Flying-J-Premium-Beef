# Flying J Premium Beef

E-commerce system for a local federally inspected premium beef business.

- **[PLAN.md](./PLAN.md)** — Full execution plan
- **[web/](./web/)** — Next.js application

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

## Deploy on Render

1. Push this repo to GitHub.
2. In Render Dashboard → **New Blueprint** → connect repo (uses `render.yaml` on `main`).
3. Set environment variables:
   - `NEXTAUTH_URL` → `https://flying-j-beef.onrender.com`
   - `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` (Stripe test keys)
   - `STRIPE_WEBHOOK_SECRET` (from Stripe webhook endpoint)
4. After first deploy, seed products via Render shell:
   ```bash
   SEED_ADMIN_PASSWORD='your-secure-password' npm run db:seed
   ```

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
