import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/help/faq-accordion";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { ProductCard } from "@/components/shop/product-card";
import { ProductMedia } from "@/components/shop/product-media";
import {
  ArrowRightIcon,
  FamilyIcon,
  PackageIcon,
  QualityIcon,
  RanchIcon,
  ShieldIcon,
  StarIcon,
  TransparentIcon,
} from "@/components/ui/brand-icons";
import { InspectionBadge } from "@/components/ui/brand";
import { FAQ_CATEGORIES } from "@/lib/faq";
import { getAppUrl } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Premium Ranch-Raised Beef from North Dakota",
  description:
    "Shop premium Angus beef direct from Flying J Beef near Scranton, North Dakota. USDA inspected, family owned, vacuum sealed, and available for pickup or local delivery.",
  alternates: { canonical: "/" },
};

const trustCards = [
  {
    title: "Ranch Raised",
    body: "Raised close to home with attention to the animal and the land.",
    icon: RanchIcon,
  },
  {
    title: "Family Owned",
    body: "A North Dakota family operation built on accountability and hard work.",
    icon: FamilyIcon,
  },
  {
    title: "USDA Inspected",
    body: "Processed under federal inspection for safety you can trust.",
    icon: ShieldIcon,
  },
  {
    title: "Premium Quality",
    body: "Carefully selected beef with the flavor and consistency your table deserves.",
    icon: QualityIcon,
  },
  {
    title: "Vacuum Sealed",
    body: "Portioned and sealed to protect quality in your freezer.",
    icon: PackageIcon,
  },
  {
    title: "Local & Transparent",
    body: "Know where your beef comes from and who stands behind it.",
    icon: TransparentIcon,
  },
];

const shareCards = [
  {
    name: "Quarter Beef",
    packed: "Approx. 100–140 lb",
    meals: "200–280 servings",
    family: "2–3 people",
    freezer: "5–7 cu. ft.",
  },
  {
    name: "Half Beef",
    packed: "Approx. 200–280 lb",
    meals: "400–560 servings",
    family: "3–5 people",
    freezer: "10–14 cu. ft.",
    featured: true,
  },
  {
    name: "Whole Beef",
    packed: "Approx. 400–560 lb",
    meals: "800–1,120 servings",
    family: "Large family / shared",
    freezer: "20–28 cu. ft.",
  },
];

const recipes = [
  {
    title: "Cast-Iron Ribeye",
    type: "Steaks",
    detail: "Hard sear · butter baste · 20 minutes",
    href: "/recipes#ribeye",
    tone: "from-[#7b4627] to-[#2b201a]",
  },
  {
    title: "Low & Slow Brisket",
    type: "Brisket",
    detail: "Smoke · rest · slice against the grain",
    href: "/recipes#brisket",
    tone: "from-forest to-charcoal",
  },
  {
    title: "Sunday Ranch Roast",
    type: "Roasts",
    detail: "One pot · root vegetables · fork tender",
    href: "/recipes#roast",
    tone: "from-[#5d3a29] to-forest",
  },
  {
    title: "Weeknight Smash Burgers",
    type: "Ground beef",
    detail: "Hot griddle · crisp edges · 15 minutes",
    href: "/recipes#ground-beef",
    tone: "from-copper to-charcoal",
  },
];

export default async function HomePage() {
  let featuredProducts: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  try {
    featuredProducts = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ imageUrl: "desc" }, { updatedAt: "desc" }],
      take: 4,
    });
  } catch (error) {
    console.warn("Home: featured products unavailable", error);
  }

  const heroProduct =
    featuredProducts.find((product) => Boolean(product.imageUrl)) ??
    featuredProducts[0] ??
    null;
  const appUrl = getAppUrl();
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "FoodEstablishment"],
    name: "Flying J Premium Beef",
    url: appUrl,
    description:
      "Family-owned, ranch-raised premium beef near Scranton, North Dakota.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "10457 Lanesboro Rd",
      addressLocality: "Scranton",
      addressRegion: "ND",
      postalCode: "58653",
      addressCountry: "US",
    },
    areaServed: "Southwestern North Dakota",
    sameAs: [
      process.env.NEXT_PUBLIC_FACEBOOK_URL,
      process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="relative min-h-[calc(100svh-7rem)] overflow-hidden bg-charcoal text-cream">
        <div className="absolute inset-0">
          <ProductMedia
            imageUrl={heroProduct?.imageUrl}
            name={heroProduct?.name ?? "Flying J ranch-raised beef"}
            category={heroProduct?.category ?? "bundles"}
            priority
            sizes="100vw"
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,24,21,.96)_0%,rgba(20,24,21,.78)_42%,rgba(20,24,21,.28)_72%,rgba(20,24,21,.38)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(20,24,21,.75)_0%,transparent_40%)]" />
        </div>

        <div className="section-shell relative flex min-h-[calc(100svh-7rem)] items-end py-16 sm:items-center sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <div className="reveal">
              <InspectionBadge className="border-cream/20 bg-cream/10 text-cream" />
            </div>
            <h1 className="reveal reveal-delay-1 mt-7 max-w-[15ch] text-balance font-display text-[clamp(2.8rem,7vw,5.7rem)] font-semibold leading-[0.97] tracking-[-0.045em]">
              Premium Ranch-Raised Beef, Direct from Flying J
            </h1>
            <p className="reveal reveal-delay-2 mt-7 max-w-2xl text-base font-medium leading-7 text-cream/76 sm:text-lg">
              USDA inspected <span className="mx-2 text-copper">•</span> Family
              owned <span className="mx-2 text-copper">•</span> Vacuum sealed{" "}
              <span className="mx-2 text-copper">•</span> Premium Angus beef
            </p>
            <div className="reveal reveal-delay-2 mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-copper px-8 text-sm font-bold uppercase tracking-[0.1em] text-white transition-all hover:-translate-y-0.5 hover:bg-[#a8632e] hover:shadow-xl"
              >
                Shop beef
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-cream/35 px-8 text-sm font-bold uppercase tracking-[0.1em] text-cream transition-colors hover:border-cream hover:bg-cream/10"
              >
                Learn about our ranch
              </Link>
            </div>
            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-cream/48">
              Order online · Local pickup &amp; delivery near Scranton, ND
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-charcoal/8 bg-white">
        <div className="section-shell grid grid-cols-2 divide-x divide-y divide-charcoal/8 md:grid-cols-3 md:divide-y-0 lg:grid-cols-6">
          {trustCards.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="group min-h-52 p-6 transition-colors hover:bg-cream sm:p-7"
              >
                <Icon className="h-8 w-8 text-forest transition-transform duration-300 group-hover:-translate-y-1" />
                <h2 className="mt-5 font-display text-lg font-semibold tracking-[-0.02em] text-charcoal">
                  {item.title}
                </h2>
                <p className="mt-2 text-xs leading-5 text-charcoal/58">
                  {item.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-pad bg-cream">
        <div className="section-shell">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-copper">From our freezer to yours</p>
              <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-semibold leading-tight tracking-[-0.035em] text-charcoal sm:text-5xl">
                Beef worth building a meal around
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-forest hover:text-copper"
            >
              Shop all beef <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
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
          ) : (
            <div className="mt-11 rounded-[2rem] border border-charcoal/10 bg-white p-10 text-center">
              <p className="font-display text-2xl font-semibold text-charcoal">
                Fresh cuts are being prepared
              </p>
              <p className="mt-2 text-sm text-charcoal/60">
                Check the shop for current availability.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="section-shell">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-copper">Simple from start to supper</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-[-0.035em] text-charcoal sm:text-5xl">
              How it works
            </h2>
          </div>
          <ol className="relative mt-14 grid gap-8 md:grid-cols-4 md:gap-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-6 hidden h-px bg-charcoal/12 md:block" />
            {[
              ["01", "Choose your beef", "Browse individual cuts, bundles, or a freezer-filling share."],
              ["02", "Order online", "Check out securely by card, cash, check, or deferred invoice."],
              ["03", "Pickup or delivery", "We confirm timing and coordinate the handoff with you."],
              ["04", "Enjoy ranch beef", "Cook with confidence knowing exactly where it came from."],
            ].map(([number, title, body]) => (
              <li key={number} className="relative text-center">
                <span className="relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-charcoal/15 bg-cream text-xs font-bold tracking-wider text-forest">
                  {number}
                </span>
                <h3 className="mt-6 font-display text-xl font-semibold text-charcoal">
                  {title}
                </h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-charcoal/58">
                  {body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="overflow-hidden bg-forest text-cream">
        <div className="section-shell grid min-h-[36rem] lg:grid-cols-2">
          <div className="relative min-h-80 lg:min-h-full">
            <ProductMedia
              imageUrl={heroProduct?.imageUrl}
              name="Flying J ranch life"
              category="bundles"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="absolute inset-0 h-full"
            />
            {!heroProduct?.imageUrl ? (
              <div className="absolute inset-x-8 bottom-8 rounded-2xl border border-white/15 bg-charcoal/45 p-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cream/70">
                  Authentic ranch photography slot
                </p>
                <p className="mt-1 text-sm text-cream/55">
                  Ready for your pasture, family, or sunrise photo.
                </p>
              </div>
            ) : null}
          </div>
          <div className="flex items-center px-6 py-16 sm:px-12 lg:px-16 lg:py-24">
            <div>
              <p className="eyebrow text-copper">About the ranch</p>
              <h2 className="mt-5 max-w-xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-5xl">
                Good beef starts with knowing the land
              </h2>
              <p className="mt-7 max-w-xl text-base leading-7 text-cream/67">
                Flying J Beef is a North Dakota family operation built around
                care, transparency, and the belief that customers should know
                where their food comes from. Our cattle are raised nearby and
                processed under federal inspection.
              </p>
              <Link
                href="/about"
                className="mt-9 inline-flex items-center gap-2 border-b border-copper pb-1 text-sm font-bold uppercase tracking-[0.1em] text-cream transition-colors hover:text-copper"
              >
                Meet Flying J <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="beef-shares" className="section-pad scroll-mt-28 bg-cream">
        <div className="section-shell">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow text-copper">Fill the freezer</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-[-0.035em] text-charcoal sm:text-5xl">
              Beef shares, made understandable
            </h2>
            <p className="mt-5 text-sm leading-6 text-charcoal/60 sm:text-base">
              Reserve a quarter, half, or whole beef. Final pricing is based on
              hanging weight; we send the invoice after weigh-in.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {shareCards.map((share) => (
              <article
                key={share.name}
                className={`relative rounded-[1.75rem] border p-7 sm:p-8 ${
                  share.featured
                    ? "border-forest bg-forest text-cream premium-shadow"
                    : "border-charcoal/10 bg-white text-charcoal"
                }`}
              >
                {share.featured ? (
                  <span className="absolute right-6 top-6 rounded-full bg-copper px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-white">
                    Most popular
                  </span>
                ) : null}
                <h3 className="font-display text-3xl font-semibold tracking-[-0.03em]">
                  {share.name}
                </h3>
                <dl className="mt-8 divide-y divide-current/10 text-sm">
                  {[
                    ["Packed beef", share.packed],
                    ["Estimated meals", share.meals],
                    ["Best for", share.family],
                    ["Freezer space", share.freezer],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-3.5">
                      <dt className={share.featured ? "text-cream/55" : "text-charcoal/52"}>
                        {label}
                      </dt>
                      <dd className="text-right font-semibold">{value}</dd>
                    </div>
                  ))}
                </dl>
                <Link
                  href="/shop?category=bundles"
                  className={`mt-8 inline-flex w-full min-h-12 items-center justify-center rounded-full text-sm font-bold uppercase tracking-[0.1em] ${
                    share.featured
                      ? "bg-copper text-white hover:bg-[#a8632e]"
                      : "border border-charcoal/15 text-charcoal hover:border-forest hover:text-forest"
                  }`}
                >
                  View availability
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-center text-xs leading-5 text-charcoal/45">
            Estimates vary by animal, processing choices, and package yield.
            We confirm final weight and total before payment.
          </p>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="section-shell">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-copper">From the Flying J kitchen</p>
              <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-[-0.035em] text-charcoal sm:text-5xl">
                Cook every cut with confidence
              </h2>
            </div>
            <Link
              href="/recipes"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-forest hover:text-copper"
            >
              All recipes <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {recipes.map((recipe) => (
              <Link
                key={recipe.title}
                id={recipe.type.toLowerCase().replaceAll(" ", "-")}
                href={recipe.href}
                className={`group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[1.5rem] bg-gradient-to-br p-6 text-cream ${recipe.tone}`}
              >
                <div className="grain-overlay absolute inset-0 opacity-50" />
                <div className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-cream/65 transition-transform group-hover:translate-x-1">
                  <ArrowRightIcon className="h-5 w-5" />
                </div>
                <div className="relative">
                  <p className="eyebrow text-copper">{recipe.type}</p>
                  <h3 className="mt-3 font-display text-2xl font-semibold leading-tight">
                    {recipe.title}
                  </h3>
                  <p className="mt-3 text-xs leading-5 text-cream/60">
                    {recipe.detail}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad border-y border-charcoal/8 bg-cream">
        <div className="section-shell grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="eyebrow text-copper">Common questions</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-[-0.035em] text-charcoal sm:text-5xl">
              Straight answers about ordering beef
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-charcoal/60">
              From pickup timing to freezer space, we want every order to feel
              simple and transparent.
            </p>
            <Link
              href="/help"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-forest hover:text-copper"
            >
              Visit the help center <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <FaqAccordion categories={FAQ_CATEGORIES.slice(0, 2)} />
        </div>
      </section>

      <section className="bg-copper text-white">
        <div className="section-shell grid gap-8 py-14 md:grid-cols-[1fr_1.1fr] md:items-center md:py-16">
          <div>
            <div className="flex gap-1 text-cream/75" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, index) => (
                <StarIcon key={index} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em]">
              Customer stories, honestly earned
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
              We’ll publish verified customer notes here as orders go out—never
              invented testimonials or stock photos.
            </p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-sm leading-6 text-white/80">
            Purchased from Flying J? Share feedback through your account support
            ticket. Approved reviews can include a customer photo when provided.
          </div>
        </div>
      </section>

      <section className="section-pad bg-forest text-cream">
        <div className="section-shell grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div>
            <p className="eyebrow text-copper">Stay close to the ranch</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Seasonal beef, recipes, and first notice
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-6 text-cream/60">
              Get availability updates, cooking ideas, and occasional specials.
              No inbox clutter.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-cream/15 bg-charcoal/20 p-6 sm:p-8">
            <NewsletterSignup source="FOOTER" idSuffix="home" />
          </div>
        </div>
      </section>
    </>
  );
}
