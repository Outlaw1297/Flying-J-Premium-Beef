import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/help/faq-accordion";
import { FAQ_CATEGORIES } from "@/lib/faq";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Help center",
};

export default async function HelpPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-semibold uppercase tracking-wider text-copper">
        Help center
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-charcoal sm:text-4xl">
        Answers for orders, cuts, and pickup
      </h1>
      <p className="mt-3 max-w-2xl text-charcoal/70 leading-relaxed">
        Quick answers about Flying J Premium Beef. Still stuck? Reach our team
        through a support ticket — we&apos;ll tie it to your account and order
        when we can.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2">
        {FAQ_CATEGORIES.map((cat) => (
          <a
            key={cat.id}
            href={`#${cat.id}`}
            className="rounded-full border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal/80 hover:border-copper hover:text-copper"
          >
            {cat.title}
          </a>
        ))}
      </nav>

      <div className="mt-10">
        <FaqAccordion categories={FAQ_CATEGORIES} />
      </div>

      <div className="mt-12 rounded-2xl border border-copper/25 bg-copper/5 p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-charcoal">
          Still need help?
        </h2>
        <p className="mt-2 text-sm text-charcoal/70 leading-relaxed">
          Open a support ticket and we&apos;ll get back to you by email. Link an
          order when the question is about a specific purchase.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {session?.user ? (
            <Link
              href="/account/support/new"
              className="inline-flex justify-center rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream hover:bg-copper/90"
            >
              Contact support
            </Link>
          ) : (
            <Link
              href="/login?callbackUrl=/account/support/new"
              className="inline-flex justify-center rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream hover:bg-copper/90"
            >
              Sign in to contact us
            </Link>
          )}
          <Link
            href="/shop"
            className="inline-flex justify-center rounded-full border border-charcoal/15 px-6 py-3 text-sm font-medium text-charcoal hover:border-charcoal/30"
          >
            Browse the shop
          </Link>
        </div>
      </div>
    </div>
  );
}
