"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, slugify } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/enums";
import { ensureProductSynced } from "@/lib/stripe-products";
import {
  DEFAULT_PRODUCT_TAX_CODE,
  isKnownTaxCode,
} from "@/lib/stripe-tax-codes";

export type AdminFormState = { error?: string; success?: string };

const statusValues = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "READY",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
] as const;

export async function updateOrderStatusAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  if (!orderId || !statusValues.includes(status as (typeof statusValues)[number])) {
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

const productSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(80).optional(),
  description: z.string().max(2000).optional(),
  priceDollars: z.coerce.number().positive(),
  weightLabel: z.string().max(40).optional(),
  inventoryCount: z.coerce.number().int().min(0),
  category: z.string().max(60).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  stripeTaxCode: z.string().min(1).max(40),
  active: z.boolean().optional(),
});

export async function upsertProductAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    priceDollars: formData.get("priceDollars"),
    weightLabel: formData.get("weightLabel") || undefined,
    inventoryCount: formData.get("inventoryCount"),
    category: formData.get("category") || undefined,
    imageUrl: formData.get("imageUrl") || "",
    stripeTaxCode: formData.get("stripeTaxCode") || DEFAULT_PRODUCT_TAX_CODE,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product" };
  }

  if (!isKnownTaxCode(parsed.data.stripeTaxCode)) {
    return { error: "Choose a valid Stripe tax code" };
  }

  const slug = slugify(parsed.data.slug || parsed.data.name);
  if (!slug) return { error: "Slug is required" };

  const data = {
    name: parsed.data.name.trim(),
    slug,
    description: parsed.data.description?.trim() || null,
    priceCents: Math.round(parsed.data.priceDollars * 100),
    weightLabel: parsed.data.weightLabel?.trim() || null,
    inventoryCount: parsed.data.inventoryCount,
    category: parsed.data.category?.trim() || null,
    imageUrl: parsed.data.imageUrl?.trim() || null,
    stripeTaxCode: parsed.data.stripeTaxCode,
    active: parsed.data.active ?? true,
  };

  const conflict = await prisma.product.findUnique({ where: { slug } });
  if (conflict && conflict.id !== id) {
    return { error: "Another product already uses this slug" };
  }

  let productId = id;
  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    const created = await prisma.product.create({ data });
    productId = created.id;
  }

  try {
    await ensureProductSynced(productId);
  } catch (error) {
    console.error("Product Stripe sync failed:", error);
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect(`/admin/products/${productId}`);
}

export async function toggleProductActiveAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  if (!id) return;

  await prisma.product.update({
    where: { id },
    data: { active: !active },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop");
}
