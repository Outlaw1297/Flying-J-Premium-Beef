"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/cart", label: "Cart" },
  { href: "/account", label: "Account" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-charcoal/10 bg-cream md:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-around px-2 py-2">
        {navLinks.slice(0, 4).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-medium text-charcoal/70 hover:text-copper"
          >
            <span>{link.label}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-medium text-charcoal/70"
          aria-expanded={open}
          aria-label="More menu"
        >
          <span>More</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-charcoal/10 bg-cream px-4 py-3">
          <div className="flex flex-col gap-2">
            <Link
              href="/account"
              className="text-sm font-medium text-charcoal hover:text-copper"
              onClick={() => setOpen(false)}
            >
              My Account
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-charcoal hover:text-copper"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-charcoal hover:text-copper"
              onClick={() => setOpen(false)}
            >
              Create account
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
