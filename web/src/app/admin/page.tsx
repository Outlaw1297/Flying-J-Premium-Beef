import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SyncStripeButton } from "@/components/admin/sync-stripe-button";
import {
  OrderStatus,
  SupportTicketStatus,
} from "@/generated/prisma/enums";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    ordersToday,
    revenueAgg,
    openTickets,
    activeCoupons,
    lowStock,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        createdAt: { gte: startOfDay },
        status: { notIn: [OrderStatus.CANCELLED] },
      },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfDay },
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.READY,
            OrderStatus.COMPLETED,
          ],
        },
      },
      _sum: { totalCents: true },
    }),
    prisma.supportTicket.count({
      where: {
        status: {
          in: [SupportTicketStatus.OPEN, SupportTicketStatus.PENDING],
        },
      },
    }),
    prisma.coupon.count({ where: { active: true } }),
    prisma.product.count({
      where: { active: true, inventoryCount: { lte: 5 } },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        invoice: true,
      },
    }),
  ]);

  const revenueToday = revenueAgg._sum.totalCents ?? 0;

  const stats = [
    { label: "Orders today", value: String(ordersToday), href: "/admin/orders" },
    {
      label: "Revenue today",
      value: formatCents(revenueToday),
      href: "/admin/orders",
    },
    {
      label: "Open tickets",
      value: String(openTickets),
      href: "/admin/support?status=active",
    },
    {
      label: "Active coupons",
      value: String(activeCoupons),
      href: "/admin/coupons",
    },
    {
      label: "Low stock SKUs",
      value: String(lowStock),
      href: "/admin/products",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-semibold text-charcoal">
        Dashboard
      </h1>
      <p className="mt-2 text-charcoal/70">
        Day-to-day overview for Flying J Premium Beef.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm transition-colors hover:border-copper/40"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/50">
              {s.label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold text-charcoal">
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-charcoal">
              Recent orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-copper hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 bg-white shadow-sm">
            {recentOrders.length === 0 ? (
              <li className="p-6 text-sm text-charcoal/50">No orders yet.</li>
            ) : (
              recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-cream/50"
                  >
                    <div>
                      <p className="font-medium text-charcoal">
                        {o.invoice?.invoiceNumber ?? o.id.slice(-8)}
                      </p>
                      <p className="text-xs text-charcoal/55">
                        {o.user.name ?? o.user.email} · {o.status}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-charcoal">
                      {formatCents(o.totalCents)}
                    </p>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-charcoal">
              Stripe catalog
            </h2>
            <p className="mt-2 text-sm text-charcoal/70">
              Sync website products to Stripe Products &amp; Prices.
            </p>
            <div className="mt-4">
              <SyncStripeButton />
            </div>
          </div>
          <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-charcoal">
              Quick links
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/admin/products/new" className="text-copper hover:underline">
                  Add product
                </Link>
              </li>
              <li>
                <Link href="/admin/payments" className="text-copper hover:underline">
                  Stripe API keys
                </Link>
              </li>
              <li>
                <Link href="/admin/coupons" className="text-copper hover:underline">
                  Create coupon
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/support?status=active"
                  className="text-copper hover:underline"
                >
                  Open support inbox
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
