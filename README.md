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
