"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { syncCouponToStripe, setStripePromotionActive } from "@/lib/coupons";
import { prisma } from "@/lib/prisma";
import { CouponType } from "@/generated/prisma/enums";

export type CouponAdminState = {
  error?: string;
  success?: string;
};

const createSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, dashes, or underscores"),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive("Value must be greater than 0"),
  minOrderDollars: z.coerce.number().min(0).optional(),
  expiresAt: z.string().optional(),
  campaignName: z.string().max(100).optional(),
});

export async function createCouponAction(
  _prev: CouponAdminState,
  formData: FormData,
): Promise<CouponAdminState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const parsed = createSchema.safeParse({
    code: formData.get("code"),
    type: formData.get("type"),
    value: formData.get("value"),
    minOrderDollars: formData.get("minOrderDollars") || 0,
    expiresAt: formData.get("expiresAt") || undefined,
    campaignName: formData.get("campaignName") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const code = parsed.data.code.toUpperCase();
  const type =
    parsed.data.type === "FIXED" ? CouponType.FIXED : CouponType.PERCENT;

  if (type === CouponType.PERCENT && parsed.data.value > 100) {
    return { error: "Percent off cannot exceed 100" };
  }

  const value =
    type === CouponType.FIXED
      ? Math.round(parsed.data.value * 100)
      : Math.round(parsed.data.value);

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return { error: "A coupon with this code already exists" };
  }

  let expiresAt: Date | null = null;
  if (parsed.data.expiresAt) {
    expiresAt = new Date(parsed.data.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return { error: "Invalid expiry date" };
    }
  }

  const maxUsesRaw = String(formData.get("maxUses") || "").trim();
  const maxUses = maxUsesRaw ? Number.parseInt(maxUsesRaw, 10) : null;
  if (maxUsesRaw && (!maxUses || maxUses < 1)) {
    return { error: "Max uses must be a positive number" };
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      type,
      value,
      minOrderCents: Math.round((parsed.data.minOrderDollars ?? 0) * 100),
      maxUses,
      expiresAt,
      campaignName: parsed.data.campaignName?.trim() || null,
      active: true,
    },
  });

  try {
    await syncCouponToStripe(coupon);
  } catch (error) {
    console.error("Stripe coupon sync failed:", error);
    // Keep DB coupon; card checkout will retry sync
  }

  revalidatePath("/admin/coupons");
  return { success: `Coupon ${code} created` };
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  if (!id) return;

  const nextActive = !active;
  const coupon = await prisma.coupon.update({
    where: { id },
    data: { active: nextActive },
  });

  try {
    await setStripePromotionActive(coupon.stripePromotionCodeId, nextActive);
  } catch (error) {
    console.error("Stripe promo toggle failed:", error);
  }

  revalidatePath("/admin/coupons");
}
