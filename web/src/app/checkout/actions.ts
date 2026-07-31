"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getCart, getCartSubtotal, setCart, type CartItem } from "@/lib/cart";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { nextInvoiceNumber } from "@/lib/invoices";
import { formatPhoneDisplay, normalizeUsPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { FulfillmentType, PaymentMethod } from "@/generated/prisma/enums";

const checkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(7, "Phone is required").max(30),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
  paymentMethod: z.enum(["CARD", "CASH", "CHECK"]),
  pickupDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type CheckoutState = { error?: string };

async function validateCart(cart: CartItem[]) {
  if (cart.length === 0) {
    return { error: "Your cart is empty" as const };
  }

  const products = await prisma.product.findMany({
    where: { id: { in: cart.map((i) => i.productId) }, active: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of cart) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { error: `${item.name} is no longer available` as const };
    }
    if (product.inventoryCount < item.quantity) {
      return {
        error:
          product.inventoryCount === 0
            ? `${product.name} is out of stock`
            : `Only ${product.inventoryCount} of ${product.name} available`,
      } as const;
    }
    if (product.priceCents !== item.priceCents) {
      return {
        error: `Price changed for ${product.name}. Please update your cart.`,
      } as const;
    }
  }

  return { productMap };
}

export async function createCheckoutSessionAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }

  const parsed = checkoutSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    fulfillmentType: formData.get("fulfillmentType"),
    paymentMethod: formData.get("paymentMethod"),
    pickupDate: formData.get("pickupDate") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const phoneDigits = normalizeUsPhone(parsed.data.phone);
  if (!phoneDigits) {
    return { error: "Enter a valid 10-digit US phone number" };
  }
  const phoneFormatted = formatPhoneDisplay(phoneDigits);

  const cart = await getCart();
  const validated = await validateCart(cart);
  if ("error" in validated && validated.error) {
    return { error: validated.error };
  }

  const subtotalCents = getCartSubtotal(cart);
  const fulfillmentType =
    parsed.data.fulfillmentType === "DELIVERY"
      ? FulfillmentType.DELIVERY
      : FulfillmentType.PICKUP;

  const paymentMethod =
    parsed.data.paymentMethod === "CASH"
      ? PaymentMethod.CASH
      : parsed.data.paymentMethod === "CHECK"
        ? PaymentMethod.CHECK
        : PaymentMethod.CARD;

  let pickupDate: Date | null = null;
  if (parsed.data.pickupDate) {
    pickupDate = new Date(parsed.data.pickupDate);
    if (Number.isNaN(pickupDate.getTime())) {
      return { error: "Invalid pickup date" };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: phoneFormatted,
    },
  });

  // Cash / check — place order without Stripe
  if (paymentMethod !== PaymentMethod.CARD) {
    const invoiceNumber = await nextInvoiceNumber();

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: session.user.id,
          status: "PENDING",
          paymentMethod,
          subtotalCents,
          discountCents: 0,
          taxCents: 0,
          totalCents: subtotalCents,
          fulfillmentType,
          pickupDate,
          notes: parsed.data.notes,
          items: {
            create: cart.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceCents: item.priceCents,
              productNameSnapshot: item.name,
            })),
          },
        },
      });

      await tx.invoice.create({
        data: {
          orderId: created.id,
          invoiceNumber,
        },
      });

      for (const item of cart) {
        await tx.product.update({
          where: { id: item.productId },
          data: { inventoryCount: { decrement: item.quantity } },
        });
      }

      return created;
    });

    await setCart([]);
    redirect(`/checkout/success?order_id=${order.id}`);
  }

  // Card — Stripe Checkout
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      error:
        "Card payments are not configured yet. Choose cash or check, or add STRIPE_SECRET_KEY in Render.",
    };
  }

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
      paymentMethod: PaymentMethod.CARD,
      subtotalCents,
      discountCents: 0,
      taxCents: 0,
      totalCents: subtotalCents,
      fulfillmentType,
      pickupDate,
      notes: parsed.data.notes,
      items: {
        create: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceCents: item.priceCents,
          productNameSnapshot: item.name,
        })),
      },
    },
  });

  const stripe = getStripe();
  const appUrl = getAppUrl();

  let checkoutSession;
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: session.user.email,
      line_items: cart.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "usd",
          unit_amount: item.priceCents,
          product_data: {
            name: item.name,
            description: item.weightLabel ?? undefined,
          },
        },
      })),
      metadata: {
        orderId: order.id,
        userId: session.user.id,
        fulfillmentType: fulfillmentType,
        paymentMethod: "CARD",
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel?order_id=${order.id}`,
    });
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    console.error("Stripe session error:", error);
    return { error: "Unable to start payment. Please try again." };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: checkoutSession.id },
  });

  if (!checkoutSession.url) {
    return { error: "Unable to start payment. Please try again." };
  }

  redirect(checkoutSession.url);
}

export async function clearCartAfterCheckout(): Promise<void> {
  await setCart([]);
}
