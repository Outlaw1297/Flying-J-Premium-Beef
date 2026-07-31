import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnSuccess } from "@/components/checkout/clear-cart-on-success";
import { formatCents } from "@/lib/format";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillCheckoutSession } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Order confirmed",
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  let invoiceNumber: string | null = null;
  let totalCents: number | null = null;
  let orderId: string | null = null;

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Fallback if webhook hasn't run yet (common on free tier cold starts)
      if (session.payment_status === "paid") {
        await fulfillCheckoutSession(session);
      }

      const order = await prisma.order.findFirst({
        where: { stripeSessionId: sessionId },
        include: { invoice: true },
      });

      if (order) {
        orderId = order.id;
        totalCents = order.totalCents;
        invoiceNumber = order.invoice?.invoiceNumber ?? null;
      }
    } catch (error) {
      console.error("Success page session lookup failed:", error);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-20 text-center">
      <ClearCartOnSuccess />
      <p className="text-sm font-semibold uppercase tracking-wider text-copper">
        Payment received
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
        Thank you for your order
      </h1>
      <p className="mt-4 text-charcoal/70 leading-relaxed">
        We&apos;ll prepare your Flying J Premium Beef and notify you when it&apos;s
        ready for pickup or delivery.
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
