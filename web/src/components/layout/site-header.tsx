import Link from "next/link";
import { auth } from "@/lib/auth";
import { SiteHeader } from "./site-header";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
];

export async function SiteHeaderAuth() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-charcoal/10 bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-sm font-bold text-cream">
            FJ
          </span>
          <div className="leading-tight">
            <span className="font-display text-lg font-semibold tracking-tight text-charcoal group-hover:text-copper transition-colors">
              Flying J
            </span>
            <span className="block text-xs font-medium uppercase tracking-widest text-charcoal/60">
              Premium Beef
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-charcoal/80 hover:text-copper transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/cart"
            className="hidden rounded-full border border-charcoal/15 px-3 py-1.5 text-sm font-medium text-charcoal hover:border-copper hover:text-copper transition-colors sm:inline-flex"
          >
            Cart
          </Link>
          {session?.user ? (
            <Link
              href="/account"
              className="rounded-full bg-charcoal px-4 py-2 text-sm font-medium text-cream hover:bg-charcoal/90 transition-colors"
            >
              Account
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-charcoal px-4 py-2 text-sm font-medium text-cream hover:bg-charcoal/90 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

// Keep default export for backwards compat - use auth version in shell
export { SiteHeaderAuth as SiteHeader };
