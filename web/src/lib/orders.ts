import { nextInvoiceNumber } from "@/lib/invoices";
import { sendOrderConfirmationEmail } from "@/lib/email";
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

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
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
        stripeInvoiceId: null,
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
