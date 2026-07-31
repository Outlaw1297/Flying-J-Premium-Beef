import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-charcoal/10 bg-charcoal text-cream">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-xl font-semibold">Flying J Premium Beef</p>
            <p className="mt-3 text-sm text-cream/70 leading-relaxed">
              Locally raised, butchered, and processed beef. Federally inspected
              for quality you can trust.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-cream/50">
              Explore
            </p>
            <ul className="mt-4 space-y-2 text-sm text-cream/80">
              <li>
                <Link href="/shop" className="hover:text-copper transition-colors">
                  Shop cuts
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-copper transition-colors">
                  Our story
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-copper transition-colors">
                  Help center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-cream/50">
              Stay connected
            </p>
            <p className="mt-4 text-sm text-cream/70">
              Newsletter signup and coupon offers coming in Phase 5.
            </p>
            <p className="mt-4 text-xs text-cream/50">
              Questions?{" "}
              <Link href="/help" className="text-copper hover:underline">
                Visit our help center
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-cream/10 pt-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Flying J Premium Beef. All rights reserved.</p>
          <div className="flex gap-4">
            <span>Federally Inspected</span>
            <Link href="/help" className="hover:text-cream">Privacy</Link>
            <Link href="/help" className="hover:text-cream">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
