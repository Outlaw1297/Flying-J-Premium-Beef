"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookIcon,
  CartIcon,
  CloseIcon,
  CowIcon,
  MenuIcon,
  RanchIcon,
  UserIcon,
} from "@/components/ui/brand-icons";

const navLinks = [
  { href: "/shop", label: "Shop", icon: CowIcon },
  { href: "/cuts", label: "Cuts", icon: RanchIcon },
  { href: "/recipes", label: "Recipes", icon: BookIcon },
  { href: "/cart", label: "Cart", icon: CartIcon },
];

export function MobileNav({ cartCount = 0 }: { cartCount?: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-charcoal/10 bg-cream/95 shadow-[0_-12px_30px_rgba(34,34,34,0.07)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 items-stretch px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-1.5">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] transition-colors ${
              active ? "text-forest" : "text-charcoal/55 hover:text-charcoal"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{link.label}</span>
            {link.href === "/cart" && cartCount > 0 ? (
              <span className="absolute right-[22%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-copper px-1 text-[0.55rem] text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-charcoal/55"
          aria-expanded={open}
          aria-controls="mobile-more-menu"
          aria-label="More menu"
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          <span>More</span>
        </button>
      </div>

      {open && (
        <div
          id="mobile-more-menu"
          className="absolute inset-x-0 bottom-full border-t border-charcoal/10 bg-cream p-4 shadow-[0_-20px_45px_rgba(34,34,34,0.12)]"
        >
          <div className="mx-auto grid max-w-lg gap-2">
            <Link
              href="/account"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-white px-4 text-sm font-semibold text-charcoal"
              onClick={() => setOpen(false)}
            >
              <UserIcon className="h-5 w-5 text-forest" />
              My account
            </Link>
            <Link
              href="/about"
              className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-charcoal"
              onClick={() => setOpen(false)}
            >
              <RanchIcon className="h-5 w-5 text-forest" />
              Our ranch
            </Link>
            <Link
              href="/help"
              className="flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-charcoal"
              onClick={() => setOpen(false)}
            >
              Help &amp; FAQs
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
