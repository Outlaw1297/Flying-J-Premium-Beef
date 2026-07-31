"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getCart, getCartSubtotal, setCart, cartHasHangingWeight, type CartItem } from "@/lib/cart";
import { resolveCheckoutUser } from "@/lib/checkout-user";
import {
  recordCouponRedemption,
  resolveAppliedCoupon,
  setAppliedCouponCode,
  syncCouponToStripe,
} from "@/lib/coupons";
import { createOrderConfirmToken } from "@/lib/guest-tokens";
import { subscribeToNewsletter } from "@/lib/newsletter";
import { getAppUrl, getStripe } from "@/lib/stripe";
import {
  buildInvoiceLinesFromCart,
  nextInvoiceNumber,
  recalculateInvoiceTotals,
} from "@/lib/invoices";
import { sendOrderReceivedEmail } from "@/lib/email";
import { formatPhoneDisplay, normalizeUsPhone } from "@/lib/phone";
import { taxCodesForProductIds } from "@/lib/product-tax";
import { resolveProductTaxCode } from "@/lib/stripe-tax-codes";
import { calculateSalesTax, resolveTaxAddress } from "@/lib/tax";
import { ensureProductSynced } from "@/lib/stripe-products";
import { prisma } from "@/lib/prisma";
import { FulfillmentType, PaymentMethod } from "@/generated/prisma/enums";

const checkoutSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.string().email("Valid email is required").max(120),
    phone: z.string().min(7, "Phone is required").max(30),
    fulfillmentType: z.enum(["PICKUP", "DELIVERY"]),
    paymentMethod: z.enum(["CARD", "CASH", "CHECK", "INVOICE"]),
    pickupDate: z.string().optional(),
    notes: z.string().max(500).optional(),
    addressLine1: z.string().max(120).optional(),
    addressLine2: z.string().max(120).optional(),
    city: z.string().max(80).optional(),
    state: z.string().max(2).optional(),
    zip: z.string().max(10).optional(),
    deliveryInstructions: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fulfillmentType !== "DELIVERY") return;

    if (!data.addressLine1?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Street address is required for delivery",
        path: ["addressLine1"],
      });
    }
    if (!data.city?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "City is required for delivery",
        path: ["city"],
      });
    }
    if (!data.state?.trim() || data.state.trim().length !== 2) {
      ctx.addIssue({
        code: "custom",
        message: "2-letter state is required for delivery",
        path: ["state"],
      });
    }
    if (!data.zip?.trim() || !/^\d{5}(-\d{4})?$/.test(data.zip.trim())) {
      ctx.addIssue({
        code: "custom",
        message: "Valid ZIP code is required for delivery",
        path: ["zip"],
      });
    }
  });

export type CheckoutState = {
  error?: string;
  needsLogin?: boolean;
};

function emptyToNull(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

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

  const parsed = checkoutSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    fulfillmentType: formData.get("fulfillmentType"),
    paymentMethod: formData.get("paymentMethod"),
    pickupDate: formData.get("pickupDate") || undefined,
    notes: formData.get("notes") || undefined,
    addressLine1: formData.get("addressLine1") || undefined,
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    zip: formData.get("zip") || undefined,
    deliveryInstructions: formData.get("deliveryInstructions") || undefined,
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
  const productMap = validated.productMap!;

  // Refresh hanging-weight metadata from DB onto cart lines
  const enrichedCart: CartItem[] = cart.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      ...item,
      pricingMode: product.pricingMode,
      estimatedLbs: product.estimatedLbs,
      priceCents: product.priceCents,
    };
  });
  const hasHangingWeight =
    cartHasHangingWeight(enrichedCart) ||
    [...productMap.values()].some((p) => p.pricingMode === "PER_POUND_HANGING");

  const subtotalCents = getCartSubtotal(enrichedCart);
  const appliedCoupon = await resolveAppliedCoupon(subtotalCents);
  const discountCents = appliedCoupon?.discountCents ?? 0;

  const fulfillmentType =
    parsed.data.fulfillmentType === "DELIVERY"
      ? FulfillmentType.DELIVERY
      : FulfillmentType.PICKUP;

  let paymentMethod =
    parsed.data.paymentMethod === "CASH"
      ? PaymentMethod.CASH
      : parsed.data.paymentMethod === "CHECK"
        ? PaymentMethod.CHECK
        : parsed.data.paymentMethod === "INVOICE"
          ? PaymentMethod.INVOICE
          : PaymentMethod.CARD;

  if (hasHangingWeight) {
    paymentMethod = PaymentMethod.INVOICE;
  } else if (paymentMethod === PaymentMethod.INVOICE) {
    return { error: "Invoice checkout is only for hanging-weight orders" };
  }

  let pickupDate: Date | null = null;
  if (parsed.data.pickupDate) {
    pickupDate = new Date(parsed.data.pickupDate);
    if (Number.isNaN(pickupDate.getTime())) {
      return { error: "Invalid pickup date" };
    }
  }

  const addressFields = {
    addressLine1: emptyToNull(parsed.data.addressLine1),
    addressLine2: emptyToNull(parsed.data.addressLine2),
    city: emptyToNull(parsed.data.city),
    state: emptyToNull(parsed.data.state?.toUpperCase()),
    zip: emptyToNull(parsed.data.zip),
    deliveryInstructions: emptyToNull(parsed.data.deliveryInstructions),
  };

  const taxResolved = resolveTaxAddress({
    fulfillmentType: parsed.data.fulfillmentType,
    customerAddress: {
      line1: addressFields.addressLine1 ?? undefined,
      line2: addressFields.addressLine2,
      city: addressFields.city ?? undefined,
      state: addressFields.state ?? undefined,
      postalCode: addressFields.zip ?? undefined,
    },
  });

  if ("error" in taxResolved) {
    return { error: taxResolved.error };
  }

  const taxCodesByProductId = await taxCodesForProductIds(
    enrichedCart.map((item) => item.productId),
  );

  let taxQuote = {
    taxCents: 0,
    totalCents: Math.max(0, subtotalCents - discountCents),
    subtotalCents,
    calculationId: null as string | null,
  };

  // Skip Stripe Tax until hanging weight is finalized — amount is unknown
  if (!hasHangingWeight) {
    try {
      taxQuote = await calculateSalesTax({
        cart: enrichedCart,
        address: taxResolved.address,
        addressSource: taxResolved.source,
        discountCents,
        taxCodesByProductId,
      });
    } catch {
      return { error: "Unable to calculate sales tax. Please try again." };
    }
  }

  const checkoutUser = await resolveCheckoutUser({
    sessionUserId: session?.user?.id,
    customer: {
      email: parsed.data.email,
      name: parsed.data.name,
      phone: phoneFormatted,
      preferredFulfillment: fulfillmentType,
      addressLine1: addressFields.addressLine1,
      addressLine2: addressFields.addressLine2,
      city: addressFields.city,
      state: addressFields.state,
      zip: addressFields.zip,
    },
  });

  if ("error" in checkoutUser) {
    return {
      error: checkoutUser.error,
      needsLogin: checkoutUser.needsLogin,
    };
  }

  const wantNewsletter = formData.get("newsletter") === "on";

  const orderBase = {
    userId: checkoutUser.userId,
    status: "PENDING" as const,
    paymentMethod,
    subtotalCents,
    discountCents,
    taxCents: taxQuote.taxCents,
    totalCents: taxQuote.totalCents,
    couponId: appliedCoupon?.coupon.id ?? null,
    fulfillmentType,
    pickupDate,
    notes: emptyToNull(parsed.data.notes),
    ...addressFields,
    items: {
      create: enrichedCart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        priceCents: item.priceCents,
        productNameSnapshot: item.name,
      })),
    },
  };

  // Hanging-weight / deferred invoice — submit now, pay after weigh-in
  if (paymentMethod === PaymentMethod.INVOICE) {
    const invoiceNumber = await nextInvoiceNumber();
    const lines = buildInvoiceLinesFromCart(
      enrichedCart.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        priceCents: item.priceCents,
        pricingMode: item.pricingMode ?? "FIXED",
        estimatedLbs: item.estimatedLbs ?? null,
        weightLabel: item.weightLabel ?? null,
      })),
    );
    const totals = recalculateInvoiceTotals({
      lines,
      discountCents,
      taxCents: 0,
    });

    let order;
    try {
      order = await prisma.$transaction(
        async (tx) => {
          const created = await tx.order.create({
            data: {
              ...orderBase,
              taxCents: 0,
              totalCents: totals.totalCents,
            },
          });

          await tx.invoice.create({
            data: {
              orderId: created.id,
              invoiceNumber,
              status: "DRAFT",
              subtotalCents: totals.subtotalCents,
              discountCents: totals.discountCents,
              taxCents: 0,
              totalCents: totals.totalCents,
              notes:
                "Hanging-weight items — final total after weigh-in. Customer notified when invoice is issued.",
              lines: { create: lines },
            },
          });

          for (const item of enrichedCart) {
            await tx.product.update({
              where: { id: item.productId },
              data: { inventoryCount: { decrement: item.quantity } },
            });
          }

          if (appliedCoupon) {
            await recordCouponRedemption(
              {
                couponId: appliedCoupon.coupon.id,
                orderId: created.id,
                userId: checkoutUser.userId,
                discountCents,
              },
              tx,
            );
          }

          return created;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      console.error("Deferred invoice checkout failed:", error);
      return { error: "Unable to place order. Please try again." };
    }

    if (wantNewsletter) {
      await subscribeToNewsletter({
        email: checkoutUser.email,
        source: "CHECKOUT",
        userId: checkoutUser.userId,
        sendWelcome: true,
      });
    }

    try {
      await sendOrderReceivedEmail({
        to: checkoutUser.email,
        customerName: parsed.data.name,
        invoiceNumber,
        orderId: order.id,
      });
    } catch (error) {
      console.error("Order received email failed:", error);
    }

    await setCart([]);
    await setAppliedCouponCode(null);
    const confirm = createOrderConfirmToken(order.id);
    redirect(
      `/checkout/success?order_id=${order.id}&confirm=${encodeURIComponent(confirm)}&deferred=1${
        checkoutUser.isGuest ? "&guest=1" : ""
      }`,
    );
  }

  // Cash / check — place order without Stripe card charge
  if (paymentMethod !== PaymentMethod.CARD) {
    const invoiceNumber = await nextInvoiceNumber();
    const lines = buildInvoiceLinesFromCart(
      enrichedCart.map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        priceCents: item.priceCents,
        pricingMode: "FIXED" as const,
        estimatedLbs: null,
        weightLabel: item.weightLabel ?? null,
      })),
    );
    const totals = recalculateInvoiceTotals({
      lines,
      discountCents,
      taxCents: taxQuote.taxCents,
    });

    let order;
    try {
      order = await prisma.$transaction(
        async (tx) => {
          const created = await tx.order.create({ data: orderBase });

          await tx.invoice.create({
            data: {
              orderId: created.id,
              invoiceNumber,
              status: "ISSUED",
              subtotalCents: totals.subtotalCents,
              discountCents: totals.discountCents,
              taxCents: totals.taxCents,
              totalCents: totals.totalCents,
              issuedAt: new Date(),
              lines: { create: lines },
            },
          });

          for (const item of enrichedCart) {
            await tx.product.update({
              where: { id: item.productId },
              data: { inventoryCount: { decrement: item.quantity } },
            });
          }

          if (appliedCoupon) {
            await recordCouponRedemption(
              {
                couponId: appliedCoupon.coupon.id,
                orderId: created.id,
                userId: checkoutUser.userId,
                discountCents,
              },
              tx,
            );
          }

          return created;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.toLowerCase().includes("usage limit")) {
        return { error: "This coupon has reached its usage limit" };
      }
      console.error("Offline checkout failed:", error);
      return { error: "Unable to place order. Please try again." };
    }

    if (wantNewsletter) {
      await subscribeToNewsletter({
        email: checkoutUser.email,
        source: "CHECKOUT",
        userId: checkoutUser.userId,
        sendWelcome: true,
      });
    }

    await setCart([]);
    await setAppliedCouponCode(null);
    const confirm = createOrderConfirmToken(order.id);
    redirect(
      `/checkout/success?order_id=${order.id}&confirm=${encodeURIComponent(confirm)}${
        checkoutUser.isGuest ? "&guest=1" : ""
      }`,
    );
  }

  // Card — Stripe Checkout with automatic tax
  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      error:
        "Card payments are not configured yet. Choose cash or check, or add STRIPE_SECRET_KEY in Render.",
    };
  }

  const order = await prisma.order.create({
    data: {
      ...orderBase,
      paymentMethod: PaymentMethod.CARD,
    },
  });

  const stripe = getStripe();
  const appUrl = getAppUrl();
  const taxAddress = taxResolved.address;

  let checkoutSession;
  try {
    const customer = await stripe.customers.create({
      email: checkoutUser.email,
      name: parsed.data.name,
      phone: phoneFormatted,
      address: {
        line1: taxAddress.line1,
        line2: taxAddress.line2 || undefined,
        city: taxAddress.city,
        state: taxAddress.state,
        postal_code: taxAddress.postalCode,
        country: "US",
      },
      shipping: {
        name: parsed.data.name,
        address: {
          line1: taxAddress.line1,
          line2: taxAddress.line2 || undefined,
          city: taxAddress.city,
          state: taxAddress.state,
          postal_code: taxAddress.postalCode,
          country: "US",
        },
      },
      metadata: { userId: checkoutUser.userId },
    });

    const lineItems = [];
    for (const item of enrichedCart) {
      const priceId = await ensureProductSynced(item.productId);
      if (priceId) {
        lineItems.push({ price: priceId, quantity: item.quantity });
      } else {
        // Fallback if Stripe catalog sync unavailable
        lineItems.push({
          quantity: item.quantity,
          price_data: {
            currency: "usd" as const,
            unit_amount: item.priceCents,
            product_data: {
              name: item.name,
              description: item.weightLabel ?? undefined,
              tax_code: resolveProductTaxCode(
                taxCodesByProductId[item.productId],
              ),
            },
          },
        });
      }
    }

    const successGuest = checkoutUser.isGuest ? "&guest=1" : "";

    let promotionCodeId = appliedCoupon?.coupon.stripePromotionCodeId ?? null;
    if (appliedCoupon && !promotionCodeId) {
      try {
        promotionCodeId = await syncCouponToStripe(appliedCoupon.coupon);
      } catch (error) {
        console.error("Coupon Stripe sync failed:", error);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED" },
        });
        return {
          error:
            "Unable to apply coupon to card checkout. Try again or choose cash/check.",
        };
      }
    }

    checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customer.id,
      automatic_tax: { enabled: true },
      customer_update: {
        address: "auto",
        shipping: "auto",
      },
      line_items: lineItems,
      ...(promotionCodeId
        ? { discounts: [{ promotion_code: promotionCodeId }] }
        : {}),
      metadata: {
        orderId: order.id,
        userId: checkoutUser.userId,
        fulfillmentType: fulfillmentType,
        paymentMethod: "CARD",
        taxCalculationId: taxQuote.calculationId ?? "",
        couponId: appliedCoupon?.coupon.id ?? "",
        discountCents: String(discountCents),
        newsletter: wantNewsletter ? "1" : "0",
      },
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}${successGuest}`,
      cancel_url: `${appUrl}/checkout/cancel?order_id=${order.id}`,
    });
  } catch (error) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
    console.error("Stripe session error:", error);
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("automatic tax")) {
      return {
        error:
          "Enable Stripe Tax in your Stripe Dashboard (Tax → Get started + add tax registrations), then try again.",
      };
    }
    return { error: "Unable to start payment. Please try again." };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      stripeSessionId: checkoutSession.id,
      // Prefer Stripe Checkout amounts (promo + automatic tax) over local estimate
      taxCents:
        checkoutSession.total_details?.amount_tax ?? orderBase.taxCents,
      totalCents: checkoutSession.amount_total ?? orderBase.totalCents,
      discountCents:
        checkoutSession.total_details?.amount_discount ??
        orderBase.discountCents,
    },
  });

  if (!checkoutSession.url) {
    return { error: "Unable to start payment. Please try again." };
  }

  redirect(checkoutSession.url);
}

export async function clearCartAfterCheckout(): Promise<void> {
  await setCart([]);
  await setAppliedCouponCode(null);
}
