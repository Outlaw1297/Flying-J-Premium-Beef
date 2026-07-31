import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnSuccess } from "@/components/checkout/clear-cart-on-success";
import { formatCents } from "@/lib/format";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillCheckoutSession } from "@/lib/orders";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Order confirmed",
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string; order_id?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId, order_id: orderIdParam } = await searchParams;
  const session = await auth();

  let invoiceNumber: string | null = null;
  let totalCents: number | null = null;
  let orderId: string | null = null;
  let paymentMethod: string | null = null;
  let paidOnline = false;

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = getStripe();
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

      if (checkoutSession.payment_status === "paid") {
        await fulfillCheckoutSession(checkoutSession);
      }

      const order = await prisma.order.findFirst({
        where: { stripeSessionId: sessionId },
        include: { invoice: true },
      });

      if (order) {
        orderId = order.id;
        totalCents = order.totalCents;
        invoiceNumber = order.invoice?.invoiceNumber ?? null;
        paymentMethod = order.paymentMethod;
        paidOnline = order.status === "PAID";
      }
    } catch (error) {
      console.error("Success page session lookup failed:", error);
    }
  } else if (orderIdParam && session?.user?.id) {
    const order = await prisma.order.findFirst({
      where: { id: orderIdParam, userId: session.user.id },
      include: { invoice: true },
    });

    if (order) {
      orderId = order.id;
      totalCents = order.totalCents;
      invoiceNumber = order.invoice?.invoiceNumber ?? null;
      paymentMethod = order.paymentMethod;
      paidOnline = order.status === "PAID";
    }
  }

  const isOfflinePay =
    paymentMethod === "CASH" || paymentMethod === "CHECK";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-20 text-center">
      <ClearCartOnSuccess />
      <p className="text-sm font-semibold uppercase tracking-wider text-copper">
        {paidOnline
          ? "Payment received"
          : isOfflinePay
            ? "Order placed"
            : "Thank you"}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
        Thank you for your order
      </h1>
      <p className="mt-4 text-charcoal/70 leading-relaxed">
        {isOfflinePay
          ? `We'll prepare your Flying J Premium Beef. Please bring ${
              paymentMethod === "CHECK" ? "a check" : "cash"
            } when you pick up or receive delivery.`
          : "We'll prepare your Flying J Premium Beef and notify you when it's ready for pickup or delivery."}
      </p>

      {(invoiceNumber || totalCents !== null) && (
        <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 text-left shadow-sm">
          {invoiceNumber && (
            <p className="text-sm text-charcoal/70">
              Invoice{" "}
              <span className="font-semibold text-charcoal">{invoiceNumber}</span>
            </p>
          )}
          {totalCents !== null && (
            <p className="mt-1 text-sm text-charcoal/70">
              Total{" "}
              <span className="font-semibold text-charcoal">
                {formatCents(totalCents)}
              </span>
            </p>
          )}
          {isOfflinePay && (
            <p className="mt-2 text-sm font-medium text-copper">
              Due at pickup / delivery —{" "}
              {paymentMethod === "CHECK" ? "check" : "cash"}
            </p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={orderId ? "/account/orders" : "/account"}
          className="inline-flex justify-center rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 transition-colors"
        >
          View orders
        </Link>
        <Link
          href="/shop"
          className="inline-flex justify-center rounded-full border border-charcoal/15 px-6 py-3 text-sm font-medium text-charcoal hover:border-charcoal/30 transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
