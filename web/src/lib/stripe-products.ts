import { getStripe } from "@/lib/stripe";
import { productTaxCode } from "@/lib/tax";
import { prisma } from "@/lib/prisma";
import type { Product } from "@/generated/prisma/client";

type SyncableProduct = Pick<
  Product,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "priceCents"
  | "weightLabel"
  | "imageUrl"
  | "active"
  | "category"
  | "stripeProductId"
  | "stripePriceId"
>;

/**
 * Upsert a website product into Stripe Products + Prices.
 * Website DB remains source of truth; Stripe is the payment mirror.
 */
export async function syncProductToStripe(
  product: SyncableProduct,
): Promise<{ stripeProductId: string; stripePriceId: string }> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const stripe = getStripe();
  const taxCode = productTaxCode();

  let stripeProductId = product.stripeProductId;

  if (stripeProductId) {
    await stripe.products.update(stripeProductId, {
      name: product.name,
      description: product.description || undefined,
      images: product.imageUrl ? [product.imageUrl] : undefined,
      active: product.active,
      tax_code: taxCode,
      metadata: {
        productId: product.id,
        slug: product.slug,
        category: product.category ?? "",
        weightLabel: product.weightLabel ?? "",
      },
    });
  } else {
    const created = await stripe.products.create({
      name: product.name,
      description: product.description || undefined,
      images: product.imageUrl ? [product.imageUrl] : undefined,
      active: product.active,
      tax_code: taxCode,
      metadata: {
        productId: product.id,
        slug: product.slug,
        category: product.category ?? "",
        weightLabel: product.weightLabel ?? "",
      },
    });
    stripeProductId = created.id;
  }

  let stripePriceId = product.stripePriceId;
  let needsNewPrice = !stripePriceId;

  if (stripePriceId) {
    try {
      const existingPrice = await stripe.prices.retrieve(stripePriceId);
      if (
        existingPrice.unit_amount !== product.priceCents ||
        existingPrice.currency !== "usd" ||
        existingPrice.product !== stripeProductId
      ) {
        needsNewPrice = true;
        // Archive old price — Stripe prices are immutable
        await stripe.prices.update(stripePriceId, { active: false });
      }
    } catch {
      needsNewPrice = true;
    }
  }

  if (needsNewPrice) {
    const price = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: product.priceCents,
      currency: "usd",
      tax_behavior: "exclusive",
      metadata: {
        productId: product.id,
        slug: product.slug,
      },
    });
    stripePriceId = price.id;

    await stripe.products.update(stripeProductId, {
      default_price: stripePriceId,
    });
  }

  await prisma.product.update({
    where: { id: product.id },
    data: {
      stripeProductId,
      stripePriceId,
    },
  });

  return { stripeProductId, stripePriceId: stripePriceId! };
}

/** Sync one product by id; no-op-safe if Stripe is missing. */
export async function ensureProductSynced(productId: string): Promise<string | null> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return null;

  if (!process.env.STRIPE_SECRET_KEY) {
    return product.stripePriceId;
  }

  if (product.stripeProductId && product.stripePriceId) {
    // Still refresh metadata / price if needed
    const synced = await syncProductToStripe(product);
    return synced.stripePriceId;
  }

  const synced = await syncProductToStripe(product);
  return synced.stripePriceId;
}

/** Sync all active products to Stripe. Returns counts. */
export async function syncAllProductsToStripe(): Promise<{
  synced: number;
  failed: number;
  errors: string[];
}> {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
  });

  let synced = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const product of products) {
    try {
      await syncProductToStripe(product);
      synced += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown error";
      errors.push(`${product.slug}: ${message}`);
      console.error(`Stripe sync failed for ${product.slug}:`, message);
    }
  }

  return { synced, failed, errors };
}
