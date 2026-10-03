import type { Metadata } from "next";
import Link from "next/link";
import { InspectionBadge } from "@/components/ui/brand";
import {
  ArrowRightIcon,
  FamilyIcon,
  RanchIcon,
  ShieldIcon,
  TransparentIcon,
} from "@/components/ui/brand-icons";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Flying J Premium Beef — locally raised cattle near Scranton, North Dakota. Butchered, processed, and federally inspected for families who want premium beef they can trust.",
  openGraph: {
    title: "Our story | Flying J Premium Beef",
    description:
      "Locally raised near Scranton, ND. Federally inspected premium beef for pickup or delivery.",
  },
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-forest text-cream">
        <div className="grain-overlay absolute inset-0 opacity-30" />
        <div className="section-shell relative py-20 sm:py-28">
          <InspectionBadge className="border-cream/20 bg-cream/10 text-cream" />
          <h1 className="mt-7 max-w-4xl text-balance font-display text-5xl font-semibold leading-[.98] tracking-[-0.045em] sm:text-7xl">
            Raised nearby. Inspected with care. Shared with pride.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-cream/68">
            Flying J Premium Beef is a North Dakota family operation — cattle
            raised on local pastures, then butchered and processed so you get
            premium beef from people willing to put their name behind it.
          </p>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="section-shell grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="eyebrow text-copper">Our standard</p>
            <h2 className="mt-4 text-balance font-display text-4xl font-semibold tracking-[-0.035em] text-charcoal sm:text-5xl">
              From pasture to package
            </h2>
          </div>
          <div className="space-y-6 text-base leading-8 text-charcoal/65">
            <p>
              We raise beef close to home, with attention to the animal and the
              land. When it&apos;s time, cattle are processed under federal
              inspection so every package meets the safety and quality standards
              your family deserves.
            </p>
            <p>
              Whether you&apos;re stocking the freezer with ground beef, grilling
              steaks for the weekend, or sharing a bundle with neighbors,
              you&apos;ll know where it came from and who stands behind it.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-charcoal/8 bg-cream">
        <div className="section-shell grid divide-y divide-charcoal/8 md:grid-cols-4 md:divide-x md:divide-y-0">
          {[
            ["Family owned", FamilyIcon],
            ["Ranch raised", RanchIcon],
            ["USDA inspected", ShieldIcon],
            ["Transparent", TransparentIcon],
          ].map(([label, Icon]) => {
            const IconComponent = Icon as typeof FamilyIcon;
            return (
              <div
                key={label as string}
                className="flex min-h-44 flex-col items-center justify-center p-6 text-center"
              >
                <IconComponent className="h-8 w-8 text-forest" />
                <p className="mt-4 font-display text-xl font-semibold text-charcoal">
                  {label as string}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section-pad bg-charcoal text-cream">
        <div className="section-shell grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow text-copper">Pickup &amp; delivery</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Rooted in Scranton, North Dakota
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-cream/65">
              Orders are available for local pickup or delivery. We confirm
              timing after checkout so you know exactly when your beef will be
              ready.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-cream/12 bg-cream/5 p-7 sm:p-9">
            <address className="not-italic text-cream">
              <p className="font-display text-2xl font-semibold">
                Flying J Premium Beef
              </p>
              <p className="mt-4 leading-7 text-cream/65">
                10457 Lanesboro Rd
                <br />
                Scranton, ND 58653
              </p>
            </address>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-copper px-6 text-xs font-bold uppercase tracking-[0.1em] text-white hover:bg-[#a8632e]"
              >
                Shop beef <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                href="/help"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-cream/20 px-6 text-xs font-bold uppercase tracking-[0.1em] text-cream hover:border-cream"
              >
                Help &amp; FAQs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
