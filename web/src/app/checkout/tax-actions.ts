"use server";

import { getCart, getCartSubtotal } from "@/lib/cart";
import { resolveAppliedCoupon } from "@/lib/coupons";
import { calculateSalesTax, resolveTaxAddress } from "@/lib/tax";

export type TaxEstimateState = {
  error?: string;
  warning?: string;
  taxCents?: number;
  totalCents?: number;
  subtotalCents?: number;
  jurisdiction?: string | null;
};

export async function estimateTaxAction(
  _prev: TaxEstimateState,
  formData: FormData,
): Promise<TaxEstimateState> {
  const fulfillmentType = formData.get("fulfillmentType");
  if (fulfillmentType !== "PICKUP" && fulfillmentType !== "DELIVERY") {
    return { error: "Choose pickup or delivery" };
  }

  const cart = await getCart();
  if (cart.length === 0) {
    return { error: "Your cart is empty" };
  }

  const applied = await resolveAppliedCoupon(getCartSubtotal(cart));

  const resolved = resolveTaxAddress({
    fulfillmentType,
    customerAddress: {
      line1: String(formData.get("addressLine1") || ""),
      line2: String(formData.get("addressLine2") || "") || null,
      city: String(formData.get("city") || ""),
      state: String(formData.get("state") || ""),
      postalCode: String(formData.get("zip") || ""),
    },
  });

  if ("error" in resolved) {
    return { error: resolved.error };
  }

  try {
    const quote = await calculateSalesTax({
      cart,
      address: resolved.address,
      addressSource: resolved.source,
      discountCents: applied?.discountCents ?? 0,
    });

    return {
      taxCents: quote.taxCents,
      totalCents: quote.totalCents,
      subtotalCents: quote.subtotalCents,
      jurisdiction: quote.jurisdiction,
      warning: quote.warning,
    };
  } catch {
    return { error: "Unable to estimate tax right now" };
  }
}
