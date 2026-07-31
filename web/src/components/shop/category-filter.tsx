import Link from "next/link";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

export function CategoryFilter({ activeCategory }: { activeCategory: string }) {
  return (
    <nav
      aria-label="Product categories"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
    >
      {PRODUCT_CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        const href = cat.id === "all" ? "/shop" : `/shop?category=${cat.id}`;

        return (
          <Link
            key={cat.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition-all ${
              isActive
                ? "bg-forest text-white shadow-sm"
                : "border border-charcoal/12 bg-white text-charcoal/65 hover:border-copper hover:text-copper"
            }`}
          >
            {cat.label}
          </Link>
        );
      })}
    </nav>
  );
}
