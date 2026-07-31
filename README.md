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

**Seed admin (development only):** `admin@flyingjbeef.com` / `changeme123`

## Deploy on Render

1. Push this repo to GitHub.
2. In Render Dashboard → **New Blueprint** → connect repo (uses `render.yaml`).
3. Set `NEXTAUTH_URL` to your Render service URL (e.g. `https://flying-j-beef.onrender.com`).
4. After first deploy, run seed via Render shell: `npm run db:seed`

## Phase 1 status (foundation)

- [x] Next.js 16 + TypeScript + Tailwind
- [x] Prisma schema (users, products, orders, coupons, newsletter, support)
- [x] Auth.js login / register / protected routes
- [x] Mobile-first layout (header, footer, bottom nav)
- [x] Home page with brand design
- [x] `render.yaml` for Render deployment
