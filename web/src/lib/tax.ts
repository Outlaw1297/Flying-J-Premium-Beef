import { getStripe } from "@/lib/stripe";
import type { CartItem } from "@/lib/cart";

export type TaxAddress = {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
};

export type TaxQuote = {
  taxCents: number;
  totalCents: number;
  subtotalCents: number;
  calculationId: string | null;
  /** Human-readable jurisdiction hint when available */
  jurisdiction?: string | null;
};

/** Stripe tax code for fresh meat / poultry (grocery-style food rules). */
export function productTaxCode(): string {
  return process.env.STRIPE_PRODUCT_TAX_CODE ?? "txcd_40060003";
}

/** Business / pickup location — used for origin-style pickup tax. */
export function getBusinessTaxAddress(): TaxAddress | null {
  const line1 = process.env.BUSINESS_ADDRESS_LINE1?.trim();
  const city = process.env.BUSINESS_CITY?.trim();
  const state = process.env.BUSINESS_STATE?.trim()?.toUpperCase();
  const postalCode = process.env.BUSINESS_ZIP?.trim();

  if (!line1 || !city || !state || !postalCode) return null;

  return {
    line1,
    line2: process.env.BUSINESS_ADDRESS_LINE2?.trim() || null,
    city,
    state,
    postalCode,
    country: "US",
  };
}

export function resolveTaxAddress(input: {
  fulfillmentType: "PICKUP" | "DELIVERY";
  customerAddress?: Partial<TaxAddress> | null;
}): { address: TaxAddress; source: "shipping" | "billing" } | { error: string } {
  if (input.fulfillmentType === "DELIVERY") {
    const a = input.customerAddress;
    if (!a?.line1 || !a.city || !a.state || !a.postalCode) {
      return { error: "Delivery address is required to calculate tax" };
    }
    return {
      source: "shipping",
      address: {
        line1: a.line1,
        line2: a.line2,
        city: a.city,
        state: a.state.toUpperCase(),
        postalCode: a.postalCode,
        country: "US",
      },
    };
  }

  const business = getBusinessTaxAddress();
  if (!business) {
    return {
      error:
        "Pickup tax needs your business address. Set BUSINESS_ADDRESS_LINE1, BUSINESS_CITY, BUSINESS_STATE, and BUSINESS_ZIP on Render.",
    };
  }

  return { source: "billing", address: business };
}

/**
 * Calculate sales tax with Stripe Tax (state + county + city rules).
 * Falls back to $0 tax with a warning if Stripe Tax is not enabled yet.
 */
export async function calculateSalesTax(input: {
  cart: CartItem[];
  address: TaxAddress;
  addressSource: "shipping" | "billing";
}): Promise<TaxQuote & { warning?: string }> {
  const subtotalCents = input.cart.reduce(
    (sum, item) => sum + item.priceCents * item.quantity,
    0,
  );

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      subtotalCents,
      taxCents: 0,
      totalCents: subtotalCents,
      calculationId: null,
      warning: "Stripe is not configured — tax not calculated",
    };
  }

  const stripe = getStripe();

  try {
    const calculation = await stripe.tax.calculations.create({
      currency: "usd",
      customer_details: {
        address: {
          line1: input.address.line1,
          line2: input.address.line2 || undefined,
          city: input.address.city,
          state: input.address.state,
          postal_code: input.address.postalCode,
          country: input.address.country ?? "US",
        },
        address_source: input.addressSource,
      },
      line_items: input.cart.map((item, index) => ({
        amount: item.priceCents * item.quantity,
        quantity: item.quantity,
        reference: item.productId || `item-${index}`,
        tax_code: productTaxCode(),
      })),
    });

    const taxCents = calculation.tax_amount_exclusive ?? 0;
    const totalCents =
      calculation.amount_total ?? subtotalCents + taxCents;

    const breakdown = calculation.tax_breakdown?.[0] as
      | { jurisdiction?: { display_name?: string } }
      | undefined;
    const jurisdiction = breakdown?.jurisdiction?.display_name ?? null;

    return {
      subtotalCents,
      taxCents,
      totalCents,
      calculationId: calculation.id,
      jurisdiction,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tax calculation failed";
    console.error("Stripe Tax calculation error:", message);

    // Common when Stripe Tax is not enabled / no registrations
    if (
      message.toLowerCase().includes("tax") ||
      message.toLowerCase().includes("registration") ||
      message.toLowerCase().includes("head office")
    ) {
      return {
        subtotalCents,
        taxCents: 0,
        totalCents: subtotalCents,
        calculationId: null,
        warning:
          "Stripe Tax is not fully configured (enable Tax + add registrations in the Stripe Dashboard). Order total does not include tax yet.",
      };
    }

    throw error;
  }
}
