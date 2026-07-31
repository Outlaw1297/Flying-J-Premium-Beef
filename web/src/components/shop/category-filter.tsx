import Link from "next/link";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

export function CategoryFilter({ activeCategory }: { activeCategory: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRODUCT_CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        const href = cat.id === "all" ? "/shop" : `/shop?category=${cat.id}`;

        return (
          <Link
            key={cat.id}
            href={href}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-charcoal text-cream"
                : "border border-charcoal/15 text-charcoal/80 hover:border-copper hover:text-copper"
            }`}
          >
            {cat.label}
          </Link>
        );
      })}
    </div>
  );
}
