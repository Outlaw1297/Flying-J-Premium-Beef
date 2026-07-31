import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CategoryFilter } from "@/components/shop/category-filter";
import { ProductCard } from "@/components/shop/product-card";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { InspectionBadge } from "@/components/ui/brand";
import { ShieldIcon, TransparentIcon } from "@/components/ui/brand-icons";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse locally raised premium beef — steaks, ground, roasts, and bundles. Federally inspected. Order online for pickup or delivery near Scranton, ND.",
  openGraph: {
    title: "Shop | Flying J Premium Beef",
    description:
      "Steaks, ground beef, roasts, and bundles from Flying J Premium Beef.",
  },
  alternates: { canonical: "/shop" },
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
    <>
      <section className="relative overflow-hidden bg-forest text-cream">
        <div className="grain-overlay absolute inset-0 opacity-35" />
        <div className="section-shell relative py-16 sm:py-24">
          <InspectionBadge className="border-cream/20 bg-cream/10 text-cream" />
          <h1 className="mt-6 max-w-3xl text-balance font-display text-5xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-6xl">
            Ranch beef, cut for real life
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-cream/68 sm:text-lg">
            Premium Angus beef raised nearby, USDA inspected, vacuum sealed, and
            ready for your freezer. Order by the package or reserve a beef share.
          </p>
          <div className="mt-8 flex flex-wrap gap-5 text-xs font-bold uppercase tracking-[0.13em] text-cream/55">
            <span className="flex items-center gap-2">
              <ShieldIcon className="h-5 w-5 text-copper" /> Secure checkout
            </span>
            <span className="flex items-center gap-2">
              <TransparentIcon className="h-5 w-5 text-copper" /> Transparent
              sourcing
            </span>
          </div>
        </div>
      </section>

      <div className="section-shell section-pad !pt-10">
        <div className="flex flex-col gap-6 border-b border-charcoal/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <CategoryFilter activeCategory={validCategory ?? "all"} />
          <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/45">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="mt-12 rounded-[2rem] border border-charcoal/10 bg-white p-12 text-center premium-shadow">
            <p className="font-display text-2xl font-semibold text-charcoal">
              This cut is between seasons
            </p>
            <p className="mt-2 text-sm text-charcoal/58">
              Inventory changes with the ranch. Browse all available beef or join
              the newsletter for restock notes.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-forest px-6 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-charcoal"
            >
              View all beef
            </Link>
          </div>
        ) : (
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                imageUrl={product.imageUrl}
                pricingMode={product.pricingMode}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
