import type { Metadata } from "next";
import Link from "next/link";
import { InspectionBadge } from "@/components/ui/brand";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Flying J Premium Beef — locally raised cattle near Scranton, North Dakota. Butchered, processed, and federally inspected for families who want premium beef they can trust.",
  openGraph: {
    title: "Our story | Flying J Premium Beef",
    description:
      "Locally raised near Scranton, ND. Federally inspected premium beef for pickup or delivery.",
  },
};

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden bg-charcoal text-cream">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(180,83,9,0.28),transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
          <InspectionBadge className="border-copper/40 bg-copper/20 text-amber-200" />
          <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Raised nearby.
            <br />
            <span className="text-copper">Inspected with care.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-cream/75 leading-relaxed">
            Flying J Premium Beef is a North Dakota family operation — cattle
            raised on local pastures, then butchered and processed so you get
            premium cuts without the industrial feedlot middleman.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="font-display text-2xl font-semibold text-charcoal sm:text-3xl">
          From pasture to package
        </h2>
        <div className="mt-6 space-y-5 text-charcoal/75 leading-relaxed">
          <p>
            We raise beef the way it should be done — close to home, with attention
            to the animal and the land. When it&apos;s time, cattle are processed
            under federal inspection so every package meets the safety and quality
            standards your family deserves.
          </p>
          <p>
            Whether you&apos;re stocking the freezer with ground beef, grilling
            steaks for the weekend, or sharing a bundle with neighbors, you&apos;ll
            know exactly where it came from.
          </p>
        </div>

        <div className="mt-12 border-t border-charcoal/10 pt-10">
          <h2 className="font-display text-2xl font-semibold text-charcoal">
            Pickup &amp; delivery
          </h2>
          <p className="mt-4 text-charcoal/75 leading-relaxed">
            Orders are available for local pickup or delivery. Our home base is
            Scranton, North Dakota:
          </p>
          <address className="mt-4 not-italic text-charcoal">
            <p className="font-medium">Flying J Premium Beef</p>
            <p>10457 Lanesboro Rd</p>
            <p>Scranton, ND 58653</p>
          </address>
          <p className="mt-4 text-sm text-charcoal/60">
            Prefer questions first? Visit the{" "}
            <Link href="/help" className="font-medium text-copper hover:underline">
              help center
            </Link>{" "}
            or reach us after you place an order through your account.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-copper px-8 py-3.5 text-sm font-semibold text-cream hover:bg-copper/90 transition-colors"
          >
            Shop cuts
          </Link>
          <Link
            href="/help"
            className="inline-flex items-center justify-center rounded-full border border-charcoal/15 px-8 py-3.5 text-sm font-semibold text-charcoal hover:border-copper hover:text-copper transition-colors"
          >
            Help &amp; FAQs
          </Link>
        </div>
      </section>
    </div>
  );
}
