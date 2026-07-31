import type { Metadata } from "next";
import Link from "next/link";
import { ClearCartOnSuccess } from "@/components/checkout/clear-cart-on-success";
import { formatCents } from "@/lib/format";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { fulfillCheckoutSession } from "@/lib/orders";
import { auth } from "@/lib/auth";
import { verifyOrderConfirmToken } from "@/lib/guest-tokens";

export const metadata: Metadata = {
  title: "Order confirmed",
};

type SuccessPageProps = {
  searchParams: Promise<{
    session_id?: string;
    order_id?: string;
    invoice_id?: string;
    guest?: string;
    confirm?: string;
    deferred?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const {
    session_id: sessionId,
    order_id: orderIdParam,
    invoice_id: invoiceIdParam,
    guest: guestParam,
    confirm: confirmToken,
    deferred: deferredParam,
  } = await searchParams;
  const session = await auth();

  let invoiceNumber: string | null = null;
  let totalCents: number | null = null;
  let orderId: string | null = null;
  let paymentMethod: string | null = null;
  let paidOnline = false;
  let guestEmail: string | null = null;
  let guestName: string | null = null;
  let claimToken: string | null = null;
  let isGuestOrder = guestParam === "1";
  let isDeferred = deferredParam === "1";
  let invoiceId: string | null = invoiceIdParam ?? null;

  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = getStripe();
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

      if (checkoutSession.payment_status === "paid") {
        await fulfillCheckoutSession(checkoutSession);
      }

      const order = await prisma.order.findFirst({
        where: { stripeSessionId: sessionId },
        include: {
          invoice: true,
          user: {
            select: {
              email: true,
              name: true,
              passwordHash: true,
              claimToken: true,
            },
          },
        },
      });

      if (order) {
        orderId = order.id;
        totalCents = order.totalCents;
        invoiceNumber = order.invoice?.invoiceNumber ?? null;
        invoiceId = order.invoice?.id ?? null;
        paymentMethod = order.paymentMethod;
        paidOnline = order.status === "PAID";
        if (order.paymentMethod === "INVOICE" && order.invoice?.status === "DRAFT") {
          isDeferred = true;
        }
        if (!order.user.passwordHash) {
          isGuestOrder = true;
          guestEmail = order.user.email;
          guestName = order.user.name;
          claimToken = order.user.claimToken;
        }
      }
    } catch (error) {
      console.error("Success page session lookup failed:", error);
    }
  } else if (orderIdParam) {
    const order = await prisma.order.findFirst({
      where: { id: orderIdParam },
      include: {
        invoice: true,
        user: {
          select: {
            email: true,
            name: true,
            passwordHash: true,
            claimToken: true,
          },
        },
      },
    });

    const isOwner = Boolean(order && order.userId === session?.user?.id);
    const guestConfirmOk =
      Boolean(order) &&
      !order!.user.passwordHash &&
      verifyOrderConfirmToken(confirmToken, order!.id);

    if (order && (isOwner || guestConfirmOk)) {
      orderId = order.id;
      totalCents = order.totalCents;
      invoiceNumber = order.invoice?.invoiceNumber ?? null;
      invoiceId = order.invoice?.id ?? null;
      paymentMethod = order.paymentMethod;
      paidOnline = order.status === "PAID";
      if (order.paymentMethod === "INVOICE" && order.invoice?.status === "DRAFT") {
        isDeferred = true;
      }
      if (!order.user.passwordHash) {
        isGuestOrder = true;
        guestEmail = order.user.email;
        guestName = order.user.name;
        claimToken = order.user.claimToken;
      }
    }
  }

  const isOfflinePay =
    paymentMethod === "CASH" || paymentMethod === "CHECK";

  const showAccountCta =
    isGuestOrder &&
    guestEmail &&
    claimToken &&
    !(session?.user?.id && session.user.email === guestEmail);

  const registerHref =
    guestEmail && claimToken
      ? `/register?email=${encodeURIComponent(guestEmail)}${
          guestName ? `&name=${encodeURIComponent(guestName)}` : ""
        }&claim=${encodeURIComponent(claimToken)}&from=checkout`
      : "/register?from=checkout";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-20 text-center">
      <ClearCartOnSuccess />
      <p className="text-sm font-semibold uppercase tracking-wider text-copper">
        {paidOnline
          ? "Payment received"
          : isDeferred
            ? "Order received"
            : isOfflinePay
              ? "Order placed"
              : "Thank you"}
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
        {isDeferred ? "We've got your order" : "Thank you for your order"}
      </h1>
      <p className="mt-4 text-charcoal/70 leading-relaxed">
        {orderId
          ? isDeferred
            ? "We'll confirm hanging weight, then email your final invoice so you can pay online or at pickup."
            : isOfflinePay
              ? `We'll prepare your Flying J Premium Beef. Please bring ${
                  paymentMethod === "CHECK" ? "a check" : "cash"
                } when you pick up or receive delivery.`
              : "We'll prepare your Flying J Premium Beef and notify you when it's ready for pickup or delivery."
          : "If you just completed checkout, your confirmation may still be processing. Check your email or sign in to view orders."}
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
          {isDeferred && (
            <p className="mt-2 text-sm font-medium text-copper">
              Final total after weigh-in — we&apos;ll email your invoice
            </p>
          )}
          {isOfflinePay && !isDeferred && (
            <p className="mt-2 text-sm font-medium text-copper">
              Due at pickup / delivery —{" "}
              {paymentMethod === "CHECK" ? "check" : "cash"}
            </p>
          )}
          {invoiceId && (
            <p className="mt-3">
              <Link
                href={`/account/invoices/${invoiceId}`}
                className="text-sm font-medium text-copper hover:underline"
              >
                View invoice →
              </Link>
            </p>
          )}
        </div>
      )}

      {showAccountCta && (
        <div className="mt-8 rounded-2xl border border-copper/30 bg-copper/5 p-6 text-left">
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Save your order with a free account
          </h2>
          <p className="mt-2 text-sm text-charcoal/70 leading-relaxed">
            Create a password for{" "}
            <span className="font-medium text-charcoal">{guestEmail}</span> to
            track this order, get newsletters and coupons, and reorder your
            favorites faster next time. Use this page&apos;s link so we can
            securely attach your guest order.
          </p>
          <Link
            href={registerHref}
            className="mt-4 inline-flex w-full justify-center rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream hover:bg-copper/90 transition-colors sm:w-auto"
          >
            Create account
          </Link>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        {session?.user?.id && !isGuestOrder ? (
          <Link
            href={orderId ? `/account/orders/${orderId}` : "/account/orders"}
            className="inline-flex justify-center rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 transition-colors"
          >
            View order
          </Link>
        ) : null}
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
