"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getCart, getCartSubtotal, setCart } from "@/lib/cart";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { FulfillmentType } from "@/generated/prisma/enums";

const checkoutSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(7, "Phone is required").max(30),
  fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
  pickupDate: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export type CheckoutState = { error?: string };

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
    pickupDate: formData.get("pickupDate") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      error:
        "Payments are not configured yet. Add STRIPE_SECRET_KEY in Render environment variables.",
    };
  }

  const cart = await getCart();
  if (cart.length === 0) {
    return { error: "Your cart is empty" };
  }

  const productIds = cart.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  for (const item of cart) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { error: `${item.name} is no longer available` };
    }
    if (product.inventoryCount < item.quantity) {
      return {
        error:
          product.inventoryCount === 0
            ? `${product.name} is out of stock`
            : `Only ${product.inventoryCount} of ${product.name} available`,
      };
    }
    if (product.priceCents !== item.priceCents) {
      return {
        error: `Price changed for ${product.name}. Please update your cart.`,
      };
    }
  }

  const subtotalCents = getCartSubtotal(cart);
  const fulfillmentType =
    parsed.data.fulfillmentType === "DELIVERY"
      ? FulfillmentType.DELIVERY
      : FulfillmentType.PICKUP;

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
      phone: parsed.data.phone,
    },
  });

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
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
