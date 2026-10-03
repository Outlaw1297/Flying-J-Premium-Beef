import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/shop/add-to-cart-form";
import { ProductCard } from "@/components/shop/product-card";
import { ProductMedia } from "@/components/shop/product-media";
import {
  ArrowRightIcon,
  PackageIcon,
  RanchIcon,
  ShieldIcon,
} from "@/components/ui/brand-icons";
import { formatCents } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { getAppUrl } from "@/lib/stripe";
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
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: `${product.name} | Flying J Premium Beef`,
      description:
        product.description ??
        `${categoryLabel(product.category)} from Flying J Premium Beef.`,
      images: product.imageUrl
        ? [{ url: product.imageUrl, alt: product.name }]
        : undefined,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, active: true },
  });

  if (!product) notFound();

  const outOfStock = product.inventoryCount === 0;
  const relatedProducts = await prisma.product.findMany({
    where: {
      active: true,
      id: { not: product.id },
      ...(product.category ? { category: product.category } : {}),
    },
    orderBy: [{ imageUrl: "desc" }, { updatedAt: "desc" }],
    take: 3,
  });

  const cookingByCategory: Record<string, { title: string; body: string }> = {
    steaks: {
      title: "Hot, fast, and rested",
      body: "Bring toward room temperature, season generously, sear over high heat, and rest before slicing.",
    },
    ground: {
      title: "Keep it cold, handle it lightly",
      body: "Form loosely, season just before cooking, and use a hot surface for a deep crust.",
    },
    roasts: {
      title: "Low heat rewards patience",
      body: "Cook gently until tender, then rest well so the juices settle before carving.",
    },
    bundles: {
      title: "Built for a well-stocked freezer",
      body: "Keep frozen until needed, thaw packages in the refrigerator, and plan meals by cut.",
    },
  };
  const cooking =
    cookingByCategory[product.category ?? ""] ?? cookingByCategory.bundles;
  const appUrl = getAppUrl();
  const productUrl = `${appUrl}/shop/${product.slug}`;
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    sku: product.id,
    category: categoryLabel(product.category),
    brand: {
      "@type": "Brand",
      name: "Flying J Premium Beef",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "USD",
      price: (product.priceCents / 100).toFixed(2),
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Flying J Premium Beef",
      },
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: appUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${appUrl}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c"),
        }}
      />

      <div className="section-shell py-6 sm:py-10">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.11em] text-charcoal/45"
        >
          <Link href="/" className="hover:text-copper">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/shop" className="hover:text-copper">
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-charcoal/75">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-9 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
          <div>
            <ProductMedia
              imageUrl={product.imageUrl}
              name={product.name}
              category={product.category}
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="aspect-[5/4] rounded-[1.75rem] premium-shadow sm:aspect-[4/3]"
            />
            <div className="mt-3 grid grid-cols-3 gap-3" aria-label="Product highlights">
              {[
                ["Ranch raised", RanchIcon],
                ["USDA inspected", ShieldIcon],
                ["Vacuum sealed", PackageIcon],
              ].map(([label, Icon]) => {
                const IconComponent = Icon as typeof ShieldIcon;
                return (
                  <div
                    key={label as string}
                    className="flex min-h-20 flex-col items-center justify-center rounded-xl border border-charcoal/8 bg-white p-3 text-center"
                  >
                    <IconComponent className="h-5 w-5 text-forest" />
                    <span className="mt-2 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-charcoal/55">
                      {label as string}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:py-5">
            <p className="eyebrow text-copper">{categoryLabel(product.category)}</p>
            <h1 className="mt-4 text-balance font-display text-4xl font-semibold leading-[1.03] tracking-[-0.04em] text-charcoal sm:text-5xl">
              {product.name}
            </h1>

            {product.description ? (
              <p className="mt-6 text-base leading-7 text-charcoal/65">
                {product.description}
              </p>
            ) : null}

            <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-2 border-y border-charcoal/10 py-6">
              <p className="text-3xl font-bold tracking-[-0.03em] text-charcoal">
                {formatCents(product.priceCents)}
                {product.pricingMode === "PER_POUND_HANGING" ? (
                  <span className="ml-1 text-sm font-semibold text-charcoal/45">
                    / lb hanging
                  </span>
                ) : null}
              </p>
              {product.weightLabel ? (
                <p className="pb-1 text-sm text-charcoal/50">
                  {product.weightLabel}
                </p>
              ) : null}
            </div>

            {product.pricingMode === "PER_POUND_HANGING" ? (
              <div className="mt-5 rounded-xl border border-copper/25 bg-copper/5 p-4 text-sm leading-6 text-charcoal/70">
                Reserve now and pay after weigh-in. We’ll confirm the final
                hanging weight, send an itemized invoice, and then collect
                payment.
              </div>
            ) : null}

            <div className="mt-6 flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  outOfStock ? "bg-charcoal/25" : "bg-forest"
                }`}
                aria-hidden="true"
              />
              <p className="text-sm font-semibold text-charcoal/65">
                {outOfStock
                  ? "Currently out of stock"
                  : `${product.inventoryCount} available for order`}
              </p>
            </div>

            <div className="mt-7 hidden lg:block">
              <AddToCartForm
                productId={product.id}
                maxQuantity={product.inventoryCount}
                disabled={outOfStock}
              />
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.13em] text-charcoal">
                  Best way to cook it
                </h2>
                <p className="mt-2 font-display text-lg font-semibold text-forest">
                  {cooking.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-charcoal/58">
                  {cooking.body}
                </p>
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.13em] text-charcoal">
                  Storage
                </h2>
                <p className="mt-2 font-display text-lg font-semibold text-forest">
                  Keep frozen for best quality
                </p>
                <p className="mt-2 text-sm leading-6 text-charcoal/58">
                  Thaw in the refrigerator. Keep raw beef chilled and cook using
                  standard food-safety guidance.
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-xl bg-sage/65 p-4">
              <ShieldIcon className="mt-0.5 h-5 w-5 shrink-0 text-forest" />
              <p className="text-xs leading-5 text-charcoal/60">
                Federally inspected and handled through secure checkout. Card
                details are processed by Stripe and never stored by Flying J.
              </p>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="section-pad border-t border-charcoal/8 bg-white">
          <div className="section-shell">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="eyebrow text-copper">Keep exploring</p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-charcoal sm:text-4xl">
                  More from this cut
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-forest hover:text-copper sm:inline-flex"
              >
                Shop all <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProducts.map((related) => (
                <ProductCard
                  key={related.id}
                  id={related.id}
                  slug={related.slug}
                  name={related.name}
                  description={related.description}
                  priceCents={related.priceCents}
                  weightLabel={related.weightLabel}
                  category={related.category}
                  inventoryCount={related.inventoryCount}
                  imageUrl={related.imageUrl}
                  pricingMode={related.pricingMode}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-[4.65rem] z-40 border-t border-charcoal/10 bg-cream/95 px-3 py-2 shadow-[0_-12px_30px_rgba(34,34,34,0.09)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-charcoal">
              {product.name}
            </p>
            <p className="text-sm font-bold text-charcoal">
              {formatCents(product.priceCents)}
              {product.pricingMode === "PER_POUND_HANGING"
                ? " / lb hanging"
                : ""}
            </p>
          </div>
          <AddToCartForm
            productId={product.id}
            maxQuantity={product.inventoryCount}
            disabled={outOfStock}
            compact
          />
        </div>
      </div>
    </>
  );
}
