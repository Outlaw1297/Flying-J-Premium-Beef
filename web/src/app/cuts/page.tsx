import type { Metadata } from "next";
import Link from "next/link";
import { CutGuide } from "@/components/marketing/cut-guide";
import { ArrowRightIcon } from "@/components/ui/brand-icons";

export const metadata: Metadata = {
  title: "Explore the Cuts",
  description:
    "Explore beef cuts, the best cooking methods, and available Flying J Beef products with our interactive cut guide.",
  alternates: { canonical: "/cuts" },
};

export default function CutsPage() {
  return (
    <>
      <section className="bg-charcoal text-cream">
        <div className="section-shell py-16 sm:py-24">
          <p className="eyebrow text-copper">Know your beef</p>
          <h1 className="mt-5 max-w-4xl text-balance font-display text-5xl font-semibold leading-[1] tracking-[-0.045em] sm:text-6xl">
            Explore the cuts from chuck to round
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-cream/65">
            Tap or hover over the guide to learn where each cut comes from, how
            to cook it, and what’s currently available from Flying J.
          </p>
        </div>
      </section>

      <section className="section-pad bg-cream">
        <div className="section-shell">
          <CutGuide />
        </div>
      </section>

      <section className="border-t border-charcoal/8 bg-white">
        <div className="section-shell flex flex-col gap-6 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-copper">Ready to cook?</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-charcoal">
              Match the cut to a proven method
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/recipes"
              className="inline-flex min-h-12 items-center gap-2 rounded-full border border-charcoal/15 px-6 text-xs font-bold uppercase tracking-[0.1em] text-charcoal hover:border-forest hover:text-forest"
            >
              Browse recipes
            </Link>
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center gap-2 rounded-full bg-forest px-6 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-charcoal"
            >
              Shop beef <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
