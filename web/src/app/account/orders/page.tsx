import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Orders",
};

const statusLabel: Record<string, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

function paymentLabel(method: string, status: string): string | null {
  if (method === "CARD" && status === "PAID") return "Paid by card";
  if (method === "CASH") {
    return status === "PAID" ? "Paid with cash" : "Cash due at pickup / delivery";
  }
  if (method === "CHECK") {
    return status === "PAID" ? "Paid by check" : "Check due at pickup / delivery";
  }
  return null;
}

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: true,
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/account" className="text-sm font-medium text-copper hover:underline">
        ← Account
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">
        Your orders
      </h1>

      {orders.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-charcoal/10 bg-white p-10 text-center">
          <p className="text-charcoal/70">No orders yet.</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream hover:bg-charcoal/90"
          >
            Shop cuts
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => {
            const payNote = paymentLabel(order.paymentMethod, order.status);
            const badge =
              order.paymentMethod !== "CARD" && order.status === "PENDING"
                ? order.paymentMethod === "CHECK"
                  ? "Pay by check"
                  : "Pay with cash"
                : statusLabel[order.status] ?? order.status;

            return (
              <li
                key={order.id}
                className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm"
              >
                <Link href={`/account/orders/${order.id}`} className="block group">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-semibold text-charcoal group-hover:text-copper transition-colors">
                        {order.invoice?.invoiceNumber ?? `Order ${order.id.slice(-6)}`}
                      </p>
                      <p className="mt-1 text-sm text-charcoal/60">
                        {order.createdAt.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {" · "}
                        {order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}
                      </p>
                    </div>
                    <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-wide text-charcoal/70">
                      {badge}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-1 text-sm text-charcoal/70">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity}× {item.productNameSnapshot}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm font-semibold text-charcoal">
                    Total {formatCents(order.totalCents)}
                  </p>
                  {payNote && (
                    <p className="mt-1 text-sm text-copper">{payNote}</p>
                  )}
                  <p className="mt-3 text-sm font-medium text-copper">View details →</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
