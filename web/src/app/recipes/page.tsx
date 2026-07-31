import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  BookIcon,
  ShieldIcon,
} from "@/components/ui/brand-icons";

export const metadata: Metadata = {
  title: "Beef Recipes",
  description:
    "Straightforward cooking guides for ribeye, brisket, roasts, and ground beef from Flying J Premium Beef.",
  alternates: { canonical: "/recipes" },
};

const recipes = [
  {
    id: "ribeye",
    eyebrow: "Steak night",
    title: "Cast-Iron Ribeye",
    time: "20 minutes",
    heat: "High heat",
    intro:
      "A hard sear, butter baste, and proper rest let a well-marbled ribeye speak for itself.",
    steps: [
      "Pat dry and season generously with salt.",
      "Sear in a very hot cast-iron pan until a deep crust forms.",
      "Lower heat, add butter and aromatics, then baste to desired doneness.",
      "Rest 7–10 minutes before slicing.",
    ],
    shop: "/shop?category=steaks",
    tone: "bg-[#6f4129]",
  },
  {
    id: "brisket",
    eyebrow: "Low & slow",
    title: "Ranch Brisket",
    time: "8–12 hours",
    heat: "225–250°F",
    intro:
      "Steady heat and a patient rest turn brisket into the centerpiece it was meant to be.",
    steps: [
      "Trim hard fat and season with salt, pepper, and garlic.",
      "Smoke fat-side toward the heat until the bark is set.",
      "Wrap when the color is right; cook until probe tender.",
      "Rest at least one hour, then slice across the grain.",
    ],
    shop: "/shop?category=roasts",
    tone: "bg-forest",
  },
  {
    id: "roast",
    eyebrow: "Sunday supper",
    title: "Slow-Braised Beef Roast",
    time: "3–4 hours",
    heat: "Low oven",
    intro:
      "A one-pot roast with root vegetables and rich pan juices is hard to improve on.",
    steps: [
      "Season and brown the roast well on every side.",
      "Add onion, carrots, stock, and herbs.",
      "Cover and braise gently until fork tender.",
      "Rest briefly, skim the sauce, and serve.",
    ],
    shop: "/shop?category=roasts",
    tone: "bg-charcoal",
  },
  {
    id: "ground-beef",
    eyebrow: "Weeknight",
    title: "Crisp-Edge Smash Burgers",
    time: "15 minutes",
    heat: "Very hot griddle",
    intro:
      "Cold beef, a ripping-hot surface, and one firm smash make the crispest edges.",
    steps: [
      "Divide cold ground beef into loose balls without overworking.",
      "Place on a hot griddle and smash once, firmly.",
      "Season, flip when deeply browned, and add cheese if desired.",
      "Serve immediately on a toasted bun.",
    ],
    shop: "/shop?category=ground",
    tone: "bg-copper",
  },
];

export default function RecipesPage() {
  const recipeListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Flying J Beef recipes",
    itemListElement: recipes.map((recipe, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: recipe.title,
      url: `/recipes#${recipe.id}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(recipeListSchema).replace(/</g, "\\u003c"),
        }}
      />
      <section className="relative overflow-hidden bg-forest text-cream">
        <div className="grain-overlay absolute inset-0 opacity-35" />
        <div className="section-shell relative py-16 sm:py-24">
          <BookIcon className="h-10 w-10 text-copper" />
          <p className="eyebrow mt-6 text-copper">From the Flying J kitchen</p>
          <h1 className="mt-5 max-w-4xl text-balance font-display text-5xl font-semibold leading-[1] tracking-[-0.045em] sm:text-6xl">
            Simple methods for exceptional beef
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-cream/65">
            No fussy techniques—just clear timing, proper heat, and enough rest
            to get the best from every cut.
          </p>
        </div>
      </section>

      <section className="section-pad bg-cream">
        <div className="section-shell space-y-8">
          {recipes.map((recipe, index) => (
            <article
              key={recipe.id}
              id={recipe.id}
              className="scroll-mt-28 overflow-hidden rounded-[2rem] border border-charcoal/10 bg-white premium-shadow"
            >
              <div className="grid lg:grid-cols-[.62fr_1.38fr]">
                <div
                  className={`relative flex min-h-64 flex-col justify-between overflow-hidden p-8 text-cream sm:p-10 ${recipe.tone}`}
                >
                  <div className="grain-overlay absolute inset-0 opacity-35" />
                  <div className="relative">
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-cream/55">
                      0{index + 1}
                    </span>
                    <p className="eyebrow mt-12 text-copper">{recipe.eyebrow}</p>
                    <h2 className="mt-3 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-[-0.04em]">
                      {recipe.title}
                    </h2>
                  </div>
                  <div className="relative mt-10 flex gap-5 text-xs font-semibold uppercase tracking-[0.1em] text-cream/55">
                    <span>{recipe.time}</span>
                    <span>·</span>
                    <span>{recipe.heat}</span>
                  </div>
                </div>

                <div className="p-7 sm:p-10 lg:p-12">
                  <p className="max-w-2xl text-base leading-7 text-charcoal/65">
                    {recipe.intro}
                  </p>
                  <ol className="mt-7 grid gap-4 sm:grid-cols-2">
                    {recipe.steps.map((step, stepIndex) => (
                      <li key={step} className="flex gap-3 text-sm leading-6 text-charcoal/65">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sage text-[0.62rem] font-bold text-forest">
                          {stepIndex + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <Link
                    href={recipe.shop}
                    className="mt-9 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-forest hover:text-copper"
                  >
                    Shop related cuts <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-charcoal/8 bg-white">
        <div className="section-shell flex flex-col gap-5 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldIcon className="mt-1 h-6 w-6 shrink-0 text-forest" />
            <div>
              <h2 className="font-display text-2xl font-semibold text-charcoal">
                Cook safely
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-charcoal/58">
                Use an instant-read thermometer and follow USDA safe-temperature
                guidance, especially for ground beef.
              </p>
            </div>
          </div>
          <Link
            href="/cuts"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full border border-charcoal/15 px-6 text-xs font-bold uppercase tracking-[0.1em] text-charcoal hover:border-forest hover:text-forest"
          >
            Explore the cuts
          </Link>
        </div>
      </section>
    </>
  );
}
