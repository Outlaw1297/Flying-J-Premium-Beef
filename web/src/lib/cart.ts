import { cookies } from "next/headers";
import type { PricingMode } from "@/generated/prisma/client";

export const CART_COOKIE = "fj-cart";
const MAX_AGE = 60 * 60 * 24 * 7;

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  weightLabel?: string | null;
  quantity: number;
  pricingMode?: PricingMode;
  estimatedLbs?: number | null;
};

export async function getCart(): Promise<CartItem[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CART_COOKIE)?.value;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item.productId &&
        item.slug &&
        item.name &&
        typeof item.priceCents === "number" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

export async function setCart(items: CartItem[]): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE, JSON.stringify(items), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

export async function getCartItemCount(): Promise<number> {
  const cart = await getCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

/** Estimated cart subtotal — hanging-weight lines use estimate lbs when available. */
export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => {
    if (item.pricingMode === "PER_POUND_HANGING") {
      const lbs = (item.estimatedLbs ?? 0) * item.quantity;
      if (lbs <= 0) return sum;
      return sum + Math.round(lbs * item.priceCents);
    }
    return sum + item.priceCents * item.quantity;
  }, 0);
}

export function cartHasHangingWeight(items: CartItem[]): boolean {
  return items.some((item) => item.pricingMode === "PER_POUND_HANGING");
}
