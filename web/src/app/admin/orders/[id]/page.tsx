import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { updateOrderStatusAction } from "@/app/admin/actions";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(-6)}` };
}

const labels: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PROCESSING: "Processing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      invoice: true,
      items: true,
      coupon: true,
    },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
      <Link href="/admin/orders" className="text-sm font-medium text-copper hover:underline">
        ← Orders
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            {order.invoice?.invoiceNumber ?? `Order ${order.id.slice(-8)}`}
          </h1>
          <p className="mt-2 text-sm text-charcoal/60">
            {order.createdAt.toLocaleString()} · {order.fulfillmentType} ·{" "}
            {order.paymentMethod}
          </p>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-wide text-charcoal/70">
          {labels[order.status] ?? order.status}
        </span>
      </div>

      <form
        action={updateOrderStatusAction}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm"
      >
        <input type="hidden" name="orderId" value={order.id} />
        <div>
          <label htmlFor="status" className="block text-xs font-medium text-charcoal/60">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={order.status}
            className="mt-1 rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm"
          >
            {Object.keys(labels).map((s) => (
              <option key={s} value={s}>
                {labels[s]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-charcoal px-4 py-2 text-sm font-semibold text-cream hover:bg-charcoal/90"
        >
          Update status
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal/50">
            Customer
          </h2>
          <p className="mt-2 text-sm text-charcoal">{order.user.name ?? "—"}</p>
          <p className="text-sm text-charcoal/70">{order.user.email}</p>
          {order.user.phone && (
            <p className="text-sm text-charcoal/70">{order.user.phone}</p>
          )}
          <Link
            href="/admin/support?status=active"
            className="mt-3 inline-flex text-xs font-medium text-copper hover:underline"
          >
            Open support inbox
          </Link>
        </div>
        <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal/50">
            Fulfillment
          </h2>
          <p className="mt-2 text-sm text-charcoal">{order.fulfillmentType}</p>
          {order.addressLine1 && (
            <p className="mt-1 text-sm text-charcoal/70">
              {[order.addressLine1, order.addressLine2, order.city, order.state, order.zip]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {order.deliveryInstructions && (
            <p className="mt-2 text-xs text-charcoal/60">{order.deliveryInstructions}</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal/50">
          Line items
        </h2>
        <ul className="mt-3 space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity}× {item.productNameSnapshot}
              </span>
              <span>{formatCents(item.priceCents * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-charcoal/10 pt-4 text-sm">
          <div className="flex justify-between text-charcoal/70">
            <span>Subtotal</span>
            <span>{formatCents(order.subtotalCents)}</span>
          </div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-copper">
              <span>Discount{order.coupon ? ` (${order.coupon.code})` : ""}</span>
              <span>−{formatCents(order.discountCents)}</span>
            </div>
          )}
          <div className="flex justify-between text-charcoal/70">
            <span>Tax</span>
            <span>{formatCents(order.taxCents)}</span>
          </div>
          <div className="flex justify-between font-semibold text-charcoal">
            <span>Total</span>
            <span>{formatCents(order.totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
