import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(-6)}` };
}

const statusLabel: Record<string, string> = {
  PENDING: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/orders");

  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, userId: session.user.id },
    include: {
      items: {
        include: {
          product: { select: { pricingMode: true } },
        },
      },
      invoice: {
        include: {
          lines: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!order) notFound();

  const draftInvoice = order.invoice?.status === "DRAFT";

  const addressLines = [
    order.addressLine1,
    order.addressLine2,
    [order.city, order.state, order.zip].filter(Boolean).join(", "),
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/account/orders"
        className="text-sm font-medium text-copper hover:underline"
      >
        ← Orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            {order.invoice?.invoiceNumber ?? `Order ${order.id.slice(-6)}`}
          </h1>
          <p className="mt-2 text-sm text-charcoal/60">
            Placed{" "}
            {order.createdAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-wide text-charcoal/70">
          {statusLabel[order.status] ?? order.status}
        </span>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal/50">
            Fulfillment
          </h2>
          <p className="mt-2 font-medium text-charcoal">
            {order.fulfillmentType === "DELIVERY" ? "Delivery" : "Pickup"}
          </p>
          {order.pickupDate && (
            <p className="mt-1 text-sm text-charcoal/70">
              Preferred date:{" "}
              {order.pickupDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {addressLines.length > 0 && (
            <div className="mt-3 text-sm text-charcoal/70">
              {addressLines.map((line) => (
                <p key={String(line)}>{line}</p>
              ))}
            </div>
          )}
          {order.deliveryInstructions && (
            <p className="mt-3 text-sm text-charcoal/70">
              <span className="font-medium text-charcoal">Instructions: </span>
              {order.deliveryInstructions}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal/50">
            Payment & invoice
          </h2>
          <p className="mt-2 font-medium text-charcoal">
            {order.paymentMethod === "CARD"
              ? "Card (Stripe)"
              : order.paymentMethod === "CHECK"
                ? "Check at pickup / delivery"
                : order.paymentMethod === "INVOICE"
                  ? "Invoice (pay after weigh-in)"
                  : "Cash at pickup / delivery"}
          </p>
          {order.invoice && (
            <p className="mt-1 text-sm text-charcoal/70">
              Invoice {order.invoice.invoiceNumber}
              {order.invoice.status ? ` · ${order.invoice.status}` : ""}
            </p>
          )}
          {order.invoice?.issuedAt && (
            <p className="mt-1 text-sm text-charcoal/70">
              Issued{" "}
              {order.invoice.issuedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {order.invoice && (
            <p className="mt-3">
              <Link
                href={`/account/invoices/${order.invoice.id}`}
                className="text-sm font-medium text-copper hover:underline"
              >
                View invoice
                {order.invoice.status === "ISSUED" ? " & pay" : ""} →
              </Link>
            </p>
          )}
          <p className="mt-3 text-lg font-semibold text-charcoal">
            {order.invoice?.status === "DRAFT"
              ? "Total TBD"
              : formatCents(order.totalCents)}
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-charcoal">Items</h2>
        <ul className="mt-4 divide-y divide-charcoal/10">
          {order.items.map((item) => {
            const invoiceLine = order.invoice?.lines.find(
              (line) => line.productId === item.productId,
            );
            const hanging = item.product.pricingMode === "PER_POUND_HANGING";
            const amountLabel = hanging
              ? !invoiceLine ||
                invoiceLine.awaitingWeight ||
                !(invoiceLine.quantity > 0)
                ? "TBD"
                : formatCents(invoiceLine.lineTotalCents)
              : formatCents(item.priceCents * item.quantity);

            return (
              <li
                key={item.id}
                className="flex items-start justify-between gap-4 py-3 text-sm"
              >
                <span className="text-charcoal/80">
                  {item.quantity}× {item.productNameSnapshot}
                  {hanging ? (
                    <span className="block text-xs text-charcoal/50">
                      Priced by hanging weight
                    </span>
                  ) : null}
                </span>
                <span className="font-medium text-charcoal">{amountLabel}</span>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex justify-between border-t border-charcoal/10 pt-4 text-sm">
          <span className="text-charcoal/70">Subtotal</span>
          <span className="font-medium text-charcoal">
            {draftInvoice ? "TBD" : formatCents(order.subtotalCents)}
          </span>
        </div>
        {order.discountCents > 0 && (
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-charcoal/70">Discount</span>
            <span className="font-medium text-charcoal">
              −{formatCents(order.discountCents)}
            </span>
          </div>
        )}
        <div className="mt-2 flex justify-between text-sm">
          <span className="text-charcoal/70">Sales tax</span>
          <span className="font-medium text-charcoal">
            {draftInvoice ? "TBD" : formatCents(order.taxCents)}
          </span>
        </div>
        <div className="mt-2 flex justify-between text-base">
          <span className="font-semibold text-charcoal">Total</span>
          <span className="font-semibold text-charcoal">
            {draftInvoice ? "TBD" : formatCents(order.totalCents)}
          </span>
        </div>
      </div>

      {order.notes && (
        <div className="mt-6 rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal/50">
            Order notes
          </h2>
          <p className="mt-2 text-sm text-charcoal/70">{order.notes}</p>
        </div>
      )}

      <Link
        href={`/account/support/new?orderId=${order.id}&subject=${encodeURIComponent(
          `Help with ${order.invoice?.invoiceNumber ?? `order ${order.id.slice(-6)}`}`,
        )}`}
        className="mt-8 inline-flex rounded-full bg-copper px-5 py-2.5 text-sm font-semibold text-cream hover:bg-copper/90"
      >
        Get help with this order
      </Link>
    </div>
  );
}
