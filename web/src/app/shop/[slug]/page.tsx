import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InspectionBadge } from "@/components/ui/brand";
import { AddToCartForm } from "@/components/shop/add-to-cart-form";
import { formatCents } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { prisma } from "@/lib/prisma";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
  });

  if (!product) notFound();

  const outOfStock = product.inventoryCount === 0;
  const gradient =
    product.category === "steaks"
      ? "from-charcoal to-charcoal/70"
      : product.category === "ground"
        ? "from-copper/80 to-charcoal"
        : product.category === "bundles"
          ? "from-copper to-charcoal"
          : "from-charcoal/90 to-copper/60";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/shop"
        className="text-sm font-medium text-copper hover:underline"
      >
        ← Back to shop
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div
          className={`flex min-h-72 items-end rounded-2xl bg-gradient-to-br p-6 ${gradient}`}
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-cream/70">
              {categoryLabel(product.category)}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-cream">
              {product.name}
            </p>
          </div>
        </div>

        <div>
          <InspectionBadge />
          <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
            {product.name}
          </h1>

          {product.description && (
            <p className="mt-4 text-charcoal/70 leading-relaxed">
              {product.description}
            </p>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <p className="text-3xl font-semibold text-charcoal">
              {formatCents(product.priceCents)}
            </p>
            {product.weightLabel && (
              <p className="text-sm text-charcoal/50">{product.weightLabel}</p>
            )}
          </div>

          <p className="mt-2 text-sm text-charcoal/60">
            {outOfStock
              ? "Currently out of stock"
              : `${product.inventoryCount} available`}
          </p>

          <div className="mt-8">
            <AddToCartForm
              productId={product.id}
              maxQuantity={product.inventoryCount}
              disabled={outOfStock}
            />
          </div>

          <p className="mt-6 text-xs text-charcoal/50">
            Federally inspected. Pickup available after checkout (Phase 3).
          </p>
        </div>
      </div>
    </div>
  );
}
