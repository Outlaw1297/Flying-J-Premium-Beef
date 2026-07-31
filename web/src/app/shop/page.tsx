import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CategoryFilter } from "@/components/shop/category-filter";
import { ProductCard } from "@/components/shop/product-card";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse locally raised premium beef — steaks, ground, roasts, and bundles.",
};

type ShopPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category } = await searchParams;
  const validCategory = PRODUCT_CATEGORIES.some((c) => c.id === category)
    ? category
    : "all";

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(validCategory !== "all" ? { category: validCategory } : {}),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-charcoal sm:text-4xl">
          Shop cuts
        </h1>
        <p className="mt-3 text-charcoal/70 leading-relaxed">
          Locally raised, butchered, and processed. Federally inspected premium beef
          for pickup.
        </p>
      </div>

      <div className="mt-8">
        <CategoryFilter activeCategory={validCategory ?? "all"} />
      </div>

      {products.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-charcoal/10 bg-white p-10 text-center">
          <p className="text-charcoal/70">No products in this category right now.</p>
          <a
            href="/shop"
            className="mt-4 inline-flex text-sm font-medium text-copper hover:underline"
          >
            View all cuts
          </a>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={product.name}
              description={product.description}
              priceCents={product.priceCents}
              weightLabel={product.weightLabel}
              category={product.category}
              inventoryCount={product.inventoryCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
