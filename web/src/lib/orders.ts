import {
  buildInvoiceLinesFromCart,
  nextInvoiceNumber,
  recalculateInvoiceTotals,
} from "@/lib/invoices";
import {
  sendOrderConfirmationEmail,
} from "@/lib/email";
import { recordCouponRedemption } from "@/lib/coupons";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

async function ensureCouponRedemption(order: {
  id: string;
  couponId: string | null;
  userId: string;
  discountCents: number;
}): Promise<void> {
  if (!order.couponId || order.discountCents <= 0) return;
  try {
    await recordCouponRedemption({
      couponId: order.couponId,
      orderId: order.id,
      userId: order.userId,
      discountCents: order.discountCents,
    });
  } catch (error) {
    console.error("Coupon redemption failed:", error);
  }
}

/** Mark an issued invoice paid after Stripe Checkout (invoice payment path). */
export async function fulfillInvoiceCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const invoiceId = session.metadata?.invoiceId;
  if (!invoiceId) return;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { order: { include: { user: true, items: true } }, lines: true },
  });
  if (!invoice) return;
  if (invoice.status === "PAID") return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const taxCents = session.total_details?.amount_tax ?? invoice.taxCents;
  const totalCents = session.amount_total ?? invoice.totalCents;

  await prisma.$transaction(async (tx) => {
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        taxCents,
        totalCents,
        stripeCheckoutSessionId: session.id,
      },
    });
    await tx.order.update({
      where: { id: invoice.orderId },
      data: {
        status: "PAID",
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        taxCents,
        totalCents,
        paymentMethod: "CARD",
      },
    });
  });

  try {
    await sendOrderConfirmationEmail({
      to: invoice.order.user.email,
      customerName: invoice.order.user.name,
      orderId: invoice.orderId,
      invoiceNumber: invoice.invoiceNumber,
      totalCents,
      fulfillmentType: invoice.order.fulfillmentType,
      items: invoice.lines.map((l) => ({
        name: l.description,
        quantity: Math.max(1, Math.round(l.quantity)),
        priceCents: l.unitPriceCents,
      })),
    });
  } catch (error) {
    console.error("Invoice paid email failed:", error);
  }
}

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.metadata?.invoiceId) {
    await fulfillInvoiceCheckoutSession(session);
    return;
  }

  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error("Checkout session missing orderId metadata", session.id);
    return;
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      user: true,
      invoice: true,
    },
  });

  if (!existing) {
    console.error("Order not found for session", orderId, session.id);
    return;
  }

  const discountCents =
    session.total_details?.amount_discount ?? existing.discountCents;

  // Idempotent payment path — still ensure redemption/newsletter on retries
  if (existing.status === "PAID" || existing.invoice) {
    if (existing.invoice?.status !== "PAID" && existing.invoice) {
      await prisma.invoice.update({
        where: { id: existing.invoice.id },
        data: { status: "PAID", paidAt: new Date() },
      });
    }
    await ensureCouponRedemption({
      id: existing.id,
      couponId: existing.couponId,
      userId: existing.userId,
      discountCents,
    });
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const taxCents = session.total_details?.amount_tax ?? existing.taxCents;
  const totalCents = session.amount_total ?? existing.totalCents;
  const invoiceNumber = await nextInvoiceNumber();

  const fixedLines = existing.items.map((item, index) => ({
    productId: item.productId,
    description: item.productNameSnapshot,
    quantity: item.quantity,
    unitLabel: "each",
    unitPriceCents: item.priceCents,
    lineTotalCents: item.priceCents * item.quantity,
    awaitingWeight: false,
    sortOrder: index,
  }));

  const totals = recalculateInvoiceTotals({
    lines: fixedLines,
    discountCents,
    taxCents,
  });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        stripeSessionId: session.id,
        stripePaymentIntentId: paymentIntentId,
        taxCents,
        totalCents,
        discountCents,
      },
    });

    await tx.invoice.create({
      data: {
        orderId,
        invoiceNumber,
        status: "PAID",
        subtotalCents: totals.subtotalCents,
        discountCents: totals.discountCents,
        taxCents: totals.taxCents,
        totalCents: totalCents,
        issuedAt: new Date(),
        paidAt: new Date(),
        stripeCheckoutSessionId: session.id,
        lines: { create: fixedLines },
      },
    });

    for (const item of existing.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          inventoryCount: {
            decrement: item.quantity,
          },
        },
      });
    }

    if (existing.couponId && discountCents > 0) {
      await recordCouponRedemption(
        {
          couponId: existing.couponId,
          orderId: existing.id,
          userId: existing.userId,
          discountCents,
        },
        tx,
      );
    }
  });

  if (session.metadata?.newsletter === "1") {
    try {
      await subscribeToNewsletter({
        email: existing.user.email,
        source: "CHECKOUT",
        userId: existing.userId,
        sendWelcome: true,
      });
    } catch (error) {
      console.error("Checkout newsletter subscribe failed:", error);
    }
  }

  try {
    await sendOrderConfirmationEmail({
      to: existing.user.email,
      customerName: existing.user.name,
      orderId: existing.id,
      invoiceNumber,
      totalCents: session.amount_total ?? existing.totalCents,
      fulfillmentType: existing.fulfillmentType,
      items: existing.items.map((i) => ({
        name: i.productNameSnapshot,
        quantity: i.quantity,
        priceCents: i.priceCents,
      })),
    });
  } catch (error) {
    console.error("Order email failed:", error);
  }
}

export { sendInvoiceIssuedEmail } from "@/lib/email";
