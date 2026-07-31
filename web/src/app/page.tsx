import Link from "next/link";
import { InspectionBadge } from "@/components/ui/brand";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-charcoal text-cream">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(180,83,9,0.25),transparent_50%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
          <InspectionBadge className="border-copper/40 bg-copper/20 text-amber-200" />
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Premium beef from
            <br />
            <span className="text-copper">local pastures</span> to your table
          </h1>
          <p className="mt-6 max-w-xl text-lg text-cream/75 leading-relaxed">
            Flying J Premium Beef is locally raised, butchered, and processed —
            federally inspected for the quality your family deserves.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-copper px-8 py-3.5 text-sm font-semibold text-cream hover:bg-copper/90 transition-colors"
            >
              Shop cuts
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-full border border-cream/25 px-8 py-3.5 text-sm font-semibold text-cream hover:bg-cream/10 transition-colors"
            >
              Our story
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: "Locally raised",
              body: "Cattle raised by families who know the land — not industrial feedlots.",
            },
            {
              title: "Butchered & processed",
              body: "From cut to package, handled with care at our local facility.",
            },
            {
              title: "Federally inspected",
              body: "Every product meets federal inspection standards for safety and quality.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm"
            >
              <h2 className="font-display text-xl font-semibold text-charcoal">
                {item.title}
              </h2>
              <p className="mt-3 text-sm text-charcoal/70 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-y border-charcoal/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 text-center">
          <h2 className="font-display text-3xl font-semibold text-charcoal">
            Ready to order?
          </h2>
          <p className="mt-4 text-charcoal/70">
            Browse steaks, ground beef, and bundles — add to cart for pickup.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-full bg-charcoal px-8 py-3.5 text-sm font-semibold text-cream hover:bg-charcoal/90 transition-colors"
          >
            Shop now
          </Link>
        </div>
      </section>
    </div>
  );
}
