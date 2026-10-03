import Link from "next/link";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ShieldIcon } from "@/components/ui/brand-icons";

export function SiteFooter() {
  const socialLinks = [
    {
      label: "Facebook",
      href: process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim(),
    },
    {
      label: "Instagram",
      href: process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim(),
    },
  ].filter((link): link is { label: string; href: string } => Boolean(link.href));

  return (
    <footer className="relative overflow-hidden bg-charcoal text-cream">
      <div className="grain-overlay absolute inset-0 opacity-30" />
      <div className="section-shell relative py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.25fr_.7fr_.7fr_1.2fr]">
          <div className="max-w-sm">
            <BrandLogo className="[&_span]:!text-cream [&_svg]:!text-copper" />
            <p className="mt-6 text-sm leading-relaxed text-cream/65">
              Premium Angus beef raised near Scranton, North Dakota. Family
              owned, USDA inspected, and sold directly from our ranch to your
              table.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-cream/55">
              <ShieldIcon className="h-5 w-5 text-copper" />
              Secure checkout · USDA inspected
            </div>
          </div>

          <div>
            <p className="eyebrow text-cream/40">
              Shop
            </p>
            <ul className="mt-5 space-y-3 text-sm text-cream/70">
              <li>
                <Link href="/shop" className="transition-colors hover:text-white">
                  All beef
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=steaks"
                  className="transition-colors hover:text-white"
                >
                  Steaks
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=ground"
                  className="transition-colors hover:text-white"
                >
                  Ground beef
                </Link>
              </li>
              <li>
                <Link
                  href="/shop?category=bundles"
                  className="transition-colors hover:text-white"
                >
                  Beef shares
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-cream/40">
              Discover
            </p>
            <ul className="mt-5 space-y-3 text-sm text-cream/70">
              <li>
                <Link href="/about" className="transition-colors hover:text-white">
                  Our ranch
                </Link>
              </li>
              <li>
                <Link href="/cuts" className="transition-colors hover:text-white">
                  Explore the cuts
                </Link>
              </li>
              <li>
                <Link href="/recipes" className="transition-colors hover:text-white">
                  Recipes
                </Link>
              </li>
              <li>
                <Link href="/help" className="transition-colors hover:text-white">
                  Help center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-cream/40">Ranch notes</p>
            <p className="mt-5 text-sm leading-relaxed text-cream/65">
              Seasonal availability, recipes, and first access to beef shares.
            </p>
            <div className="mt-5">
              <NewsletterSignup source="FOOTER" compact />
            </div>
            <address className="mt-7 not-italic text-xs leading-6 text-cream/50">
              10457 Lanesboro Rd · Scranton, ND 58653
              <br />
              Order online anytime · Pickup and delivery scheduled per order
            </address>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-cream/10 pt-7 text-xs text-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Flying J Premium Beef. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-cream"
              >
                {link.label}
              </a>
            ))}
            <Link href="/newsletter/unsubscribe" className="transition-colors hover:text-cream">
              Unsubscribe
            </Link>
            <Link href="/help" className="transition-colors hover:text-cream">
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
