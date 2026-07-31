"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, slugify } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/generated/prisma/enums";
import { ensureProductSynced } from "@/lib/stripe-products";
import { saveProductImage } from "@/lib/product-images";
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
  description: z.string().max(2000).optional(),
  priceDollars: z.coerce.number().positive(),
  weightLabel: z.string().max(40).optional(),
  inventoryCount: z.coerce.number().int().min(0),
  category: z.string().max(60).optional(),
  stripeTaxCode: z.string().min(1).max(40),
  active: z.boolean().optional(),
});

async function uniqueSlugFromName(name: string, excludeId?: string) {
  const base = slugify(name) || "product";
  let candidate = base;
  let n = 2;
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

export async function upsertProductAction(
  _prev: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    priceDollars: formData.get("priceDollars"),
    weightLabel: formData.get("weightLabel") || undefined,
    inventoryCount: formData.get("inventoryCount"),
    category: formData.get("category") || undefined,
    stripeTaxCode: formData.get("stripeTaxCode") || DEFAULT_PRODUCT_TAX_CODE,
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product" };
  }

  if (!isKnownTaxCode(parsed.data.stripeTaxCode)) {
    return { error: "Choose a valid Stripe tax code" };
  }

  const existing = id
    ? await prisma.product.findUnique({ where: { id } })
    : null;
  if (id && !existing) {
    return { error: "Product not found" };
  }

  // Keep URL stable when editing; generate from name on create
  const slug = existing
    ? existing.slug
    : await uniqueSlugFromName(parsed.data.name);

  let imageUrl = existing?.imageUrl ?? null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const saved = await saveProductImage(image);
    if ("error" in saved) return { error: saved.error };
    imageUrl = saved.imageUrl;
  }

  const data = {
    name: parsed.data.name.trim(),
    slug,
    description: parsed.data.description?.trim() || null,
    priceCents: Math.round(parsed.data.priceDollars * 100),
    weightLabel: parsed.data.weightLabel?.trim() || null,
    inventoryCount: parsed.data.inventoryCount,
    category: parsed.data.category?.trim() || null,
    imageUrl,
    stripeTaxCode: parsed.data.stripeTaxCode,
    active: parsed.data.active ?? true,
  };

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
  revalidatePath(`/shop/${slug}`);
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
