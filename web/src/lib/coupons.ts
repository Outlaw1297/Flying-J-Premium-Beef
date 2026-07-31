import { cookies } from "next/headers";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type { Coupon, CouponType } from "@/generated/prisma/client";
import { CouponType as CouponTypeEnum } from "@/generated/prisma/enums";

export const COUPON_COOKIE = "fj-coupon";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export type ValidatedCoupon = {
  coupon: Coupon;
  discountCents: number;
  code: string;
};

export function computeDiscountCents(
  type: CouponType,
  value: number,
  subtotalCents: number,
): number {
  if (subtotalCents <= 0) return 0;

  if (type === CouponTypeEnum.PERCENT) {
    const pct = Math.min(100, Math.max(0, value));
    return Math.min(subtotalCents, Math.floor((subtotalCents * pct) / 100));
  }

  // FIXED — value stored in cents
  return Math.min(subtotalCents, Math.max(0, value));
}

export async function validateCouponCode(
  code: string,
  subtotalCents: number,
): Promise<ValidatedCoupon | { error: string }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { error: "Enter a coupon code" };
  }

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
  });

  if (!coupon || !coupon.active) {
    return { error: "This coupon code is not valid" };
  }

  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { error: "This coupon has expired" };
  }

  if (coupon.maxUses != null && coupon.usesCount >= coupon.maxUses) {
    return { error: "This coupon has reached its usage limit" };
  }

  if (subtotalCents < coupon.minOrderCents) {
    const dollars = (coupon.minOrderCents / 100).toFixed(2);
    return { error: `Minimum order of $${dollars} required for this coupon` };
  }

  const discountCents = computeDiscountCents(
    coupon.type,
    coupon.value,
    subtotalCents,
  );

  if (discountCents <= 0) {
    return { error: "This coupon does not apply to your cart" };
  }

  return { coupon, discountCents, code: coupon.code };
}

export async function getAppliedCouponCode(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COUPON_COOKIE)?.value;
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return code || null;
}

export async function setAppliedCouponCode(code: string | null): Promise<void> {
  const cookieStore = await cookies();
  if (!code) {
    cookieStore.delete(COUPON_COOKIE);
    return;
  }
  cookieStore.set(COUPON_COOKIE, code.trim().toUpperCase(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function resolveAppliedCoupon(
  subtotalCents: number,
): Promise<ValidatedCoupon | null> {
  const code = await getAppliedCouponCode();
  if (!code) return null;

  const result = await validateCouponCode(code, subtotalCents);
  if ("error" in result) {
    await setAppliedCouponCode(null);
    return null;
  }
  return result;
}

/** Create matching Stripe Coupon + Promotion Code; returns promo id. */
export async function syncCouponToStripe(coupon: Coupon): Promise<string | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null;

  const stripe = getStripe();

  const stripeCoupon =
    coupon.type === CouponTypeEnum.PERCENT
      ? await stripe.coupons.create({
          percent_off: coupon.value,
          duration: "once",
          name: coupon.campaignName ?? coupon.code,
          metadata: { couponId: coupon.id, code: coupon.code },
        })
      : await stripe.coupons.create({
          amount_off: coupon.value,
          currency: "usd",
          duration: "once",
          name: coupon.campaignName ?? coupon.code,
          metadata: { couponId: coupon.id, code: coupon.code },
        });

  const promo = await stripe.promotionCodes.create({
    promotion: {
      type: "coupon",
      coupon: stripeCoupon.id,
    },
    code: coupon.code,
    active: coupon.active,
    metadata: { couponId: coupon.id },
  });

  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { stripePromotionCodeId: promo.id },
  });

  return promo.id;
}

export async function recordCouponRedemption(input: {
  couponId: string;
  orderId: string;
  userId: string;
  discountCents: number;
}): Promise<void> {
  const existing = await prisma.couponRedemption.findFirst({
    where: { orderId: input.orderId, couponId: input.couponId },
  });
  if (existing) return;

  await prisma.$transaction([
    prisma.couponRedemption.create({
      data: {
        couponId: input.couponId,
        orderId: input.orderId,
        userId: input.userId,
        discountCents: input.discountCents,
      },
    }),
    prisma.coupon.update({
      where: { id: input.couponId },
      data: { usesCount: { increment: 1 } },
    }),
  ]);
}

export function formatCouponValue(type: CouponType, value: number): string {
  if (type === CouponTypeEnum.PERCENT) return `${value}% off`;
  return `$${(value / 100).toFixed(2)} off`;
}

export async function applyCouponCodeIfValid(code: string): Promise<boolean> {
  const { getCart, getCartSubtotal } = await import("@/lib/cart");
  const cart = await getCart();
  const subtotal = getCartSubtotal(cart);
  if (cart.length === 0) return false;

  const result = await validateCouponCode(code, subtotal);
  if ("error" in result) return false;

  await setAppliedCouponCode(result.code);
  return true;
}
