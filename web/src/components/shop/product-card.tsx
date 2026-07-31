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
  imageUrl?: string | null;
  pricingMode?: "FIXED" | "PER_POUND_HANGING" | null;
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
  imageUrl,
  pricingMode,
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
        className={`relative flex h-40 items-end overflow-hidden bg-gradient-to-br p-4 ${gradient}`}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : null}
        <span
          className={`relative z-10 text-xs font-semibold uppercase tracking-wider ${
            imageUrl ? "rounded bg-charcoal/70 px-2 py-1 text-cream" : "text-cream/80"
          }`}
        >
          {categoryLabel(category)}
        </span>
        {outOfStock && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-cream/90 px-2.5 py-1 text-xs font-semibold text-charcoal">
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
              {pricingMode === "PER_POUND_HANGING" ? (
                <span className="text-sm font-normal text-charcoal/50"> / lb hanging</span>
              ) : null}
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
