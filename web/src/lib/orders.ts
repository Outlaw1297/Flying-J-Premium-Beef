import { nextInvoiceNumber } from "@/lib/invoices";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { recordCouponRedemption } from "@/lib/coupons";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

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

  // Idempotent: already paid
  if (existing.status === "PAID" || existing.invoice) {
    return;
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const taxCents = session.total_details?.amount_tax ?? existing.taxCents;
  const totalCents = session.amount_total ?? existing.totalCents;
  const discountCents =
    session.total_details?.amount_discount ?? existing.discountCents;
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
  });

  if (existing.couponId && discountCents > 0) {
    try {
      await recordCouponRedemption({
        couponId: existing.couponId,
        orderId: existing.id,
        userId: existing.userId,
        discountCents,
      });
    } catch (error) {
      console.error("Coupon redemption failed:", error);
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
