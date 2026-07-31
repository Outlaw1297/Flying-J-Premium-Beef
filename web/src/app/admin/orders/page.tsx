import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/enums";
import { updateOrderStatusAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Orders" };

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

const labels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  await requireAdmin();
  const { status } = await searchParams;

  const where =
    status && Object.values(OrderStatus).includes(status as OrderStatus)
      ? { status: status as OrderStatus }
      : {};

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { email: true, name: true } },
      invoice: true,
      items: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Orders</h1>
      <p className="mt-2 text-charcoal/70">Update fulfillment status as you pack and deliver.</p>

      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/orders"
          className="rounded-full border border-charcoal/15 px-3 py-1.5 font-medium text-charcoal/80 hover:border-copper hover:text-copper"
        >
          All
        </Link>
        {Object.keys(labels).map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className="rounded-full border border-charcoal/15 px-3 py-1.5 font-medium text-charcoal/80 hover:border-copper hover:text-copper"
          >
            {labels[s]}
          </Link>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-charcoal/10 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-charcoal/10 bg-cream/40 text-xs uppercase tracking-wider text-charcoal/50">
            <tr>
              <th className="px-4 py-3 font-medium">Invoice</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Update</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">
                  No orders in this view.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-charcoal/5">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-medium text-copper hover:underline"
                    >
                      {o.invoice?.invoiceNumber ?? o.id.slice(-8)}
                    </Link>
                    <p className="text-xs text-charcoal/50">
                      {o.createdAt.toLocaleString()} · {o.fulfillmentType}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-charcoal/80">
                    {o.user.name ?? "—"}
                    <span className="block text-xs text-charcoal/50">{o.user.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-charcoal/70">
                      {labels[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-charcoal">
                    {formatCents(o.totalCents)}
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateOrderStatusAction} className="flex gap-2">
                      <input type="hidden" name="orderId" value={o.id} />
                      <select
                        name="status"
                        defaultValue={o.status}
                        className="rounded-lg border border-charcoal/15 bg-white px-2 py-1 text-xs"
                      >
                        {Object.keys(labels).map((s) => (
                          <option key={s} value={s}>
                            {labels[s]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="text-xs font-medium text-copper hover:underline"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
