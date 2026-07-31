import Link from "next/link";
import { formatCents } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";

type ProductCardProps = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  priceCents: number;
  weightLabel: string | null;
  category: string | null;
  inventoryCount: number;
};

const categoryGradients: Record<string, string> = {
  steaks: "from-charcoal to-charcoal/70",
  ground: "from-copper/80 to-charcoal",
  roasts: "from-charcoal/90 to-copper/60",
  bundles: "from-copper to-charcoal",
};

export function ProductCard({
  slug,
  name,
  description,
  priceCents,
  weightLabel,
  category,
  inventoryCount,
}: ProductCardProps) {
  const gradient =
    categoryGradients[category ?? ""] ?? "from-charcoal/80 to-copper/70";
  const outOfStock = inventoryCount === 0;

  return (
    <Link
      href={`/shop/${slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className={`relative flex h-40 items-end p-4 bg-gradient-to-br ${gradient}`}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-cream/80">
          {categoryLabel(category)}
        </span>
        {outOfStock && (
          <span className="absolute right-3 top-3 rounded-full bg-cream/90 px-2.5 py-1 text-xs font-semibold text-charcoal">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className="font-display text-lg font-semibold text-charcoal group-hover:text-copper transition-colors">
          {name}
        </h2>
        {description && (
          <p className="mt-1 line-clamp-2 text-sm text-charcoal/60">{description}</p>
        )}
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-lg font-semibold text-charcoal">
              {formatCents(priceCents)}
            </p>
            {weightLabel && (
              <p className="text-xs text-charcoal/50">{weightLabel}</p>
            )}
          </div>
          <span className="text-sm font-medium text-copper">View →</span>
        </div>
      </div>
    </Link>
  );
}
