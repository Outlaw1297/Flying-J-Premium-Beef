"use server";

import { revalidatePath } from "next/cache";
import { getCart, getCartSubtotal } from "@/lib/cart";
import {
  setAppliedCouponCode,
  validateCouponCode,
} from "@/lib/coupons";

export type CouponFormState = {
  error?: string;
  success?: string;
  code?: string;
  discountCents?: number;
};

export async function applyCouponAction(
  _prev: CouponFormState,
  formData: FormData,
): Promise<CouponFormState> {
  const code = String(formData.get("code") || "");
  const cart = await getCart();
  const subtotal = getCartSubtotal(cart);

  if (cart.length === 0) {
    return { error: "Add items to your cart before applying a coupon" };
  }

  const result = await validateCouponCode(code, subtotal);
  if ("error" in result) {
    return { error: result.error };
  }

  await setAppliedCouponCode(result.code);
  revalidatePath("/cart");
  revalidatePath("/checkout");

  return {
    success: `Coupon ${result.code} applied`,
    code: result.code,
    discountCents: result.discountCents,
  };
}

export async function removeCouponAction(): Promise<void> {
  await setAppliedCouponCode(null);
  revalidatePath("/cart");
  revalidatePath("/checkout");
}
