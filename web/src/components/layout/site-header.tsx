import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCartItemCount } from "@/lib/cart";
import { BrandLogo } from "@/components/ui/brand-logo";
import { CartIcon, UserIcon } from "@/components/ui/brand-icons";

const navLinks = [
  { href: "/shop", label: "Shop beef" },
  { href: "/#beef-shares", label: "Beef shares" },
  { href: "/cuts", label: "Explore cuts" },
  { href: "/recipes", label: "Recipes" },
  { href: "/about", label: "Our ranch" },
];

export async function SiteHeader() {
  const session = await auth();
  const cartCount = await getCartItemCount();

  return (
    <>
      <div className="relative z-[60] bg-forest px-4 py-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.17em] text-cream sm:text-xs">
        <p>USDA inspected · Family owned · Ranch raised in North Dakota</p>
      </div>
      <header className="sticky top-0 z-50 border-b border-charcoal/10 bg-cream/95 backdrop-blur-xl">
        <div className="section-shell flex h-[4.75rem] items-center justify-between gap-4">
          <BrandLogo />

          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-7 lg:flex"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative py-3 text-[0.78rem] font-bold uppercase tracking-[0.11em] text-charcoal/75 transition-colors after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-copper after:transition-transform hover:text-charcoal hover:after:scale-x-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href={session?.user ? "/account" : "/login"}
              aria-label={session?.user ? "Open account" : "Sign in"}
              className="hidden h-11 w-11 items-center justify-center rounded-full text-charcoal transition-colors hover:bg-white sm:inline-flex"
            >
              <UserIcon className="h-5 w-5" />
            </Link>
            <Link
              href="/cart"
              aria-label={`Cart with ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              className="relative inline-flex h-11 items-center gap-2 rounded-full border border-charcoal/15 bg-white px-4 text-sm font-semibold text-charcoal transition-all hover:border-copper hover:text-copper"
            >
              <CartIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-copper px-1.5 text-[0.65rem] font-bold text-white">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
