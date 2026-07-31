import Link from "next/link";
import { formatCents } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";
import { ProductMedia } from "@/components/shop/product-media";
import { ArrowRightIcon } from "@/components/ui/brand-icons";

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
  const outOfStock = inventoryCount === 0;

  return (
    <Link
      href={`/shop/${slug}`}
      aria-label={`View ${name}`}
      className="group flex flex-col overflow-hidden rounded-[1.35rem] border border-charcoal/10 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-charcoal/15 hover:shadow-[0_24px_55px_rgba(34,34,34,0.1)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <ProductMedia
          imageUrl={imageUrl}
          name={name}
          category={category}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="h-full"
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-charcoal/65 px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md">
          {categoryLabel(category)}
        </span>
        {outOfStock ? (
          <span className="absolute right-4 top-4 rounded-full bg-cream px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-charcoal">
            Out of stock
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold tracking-[-0.025em] text-charcoal transition-colors group-hover:text-forest">
          {name}
        </h2>
        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-charcoal/56">
            {description}
          </p>
        )}
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-charcoal/8 pt-4">
          <div>
            <p className="text-lg font-bold tracking-[-0.02em] text-charcoal">
              {formatCents(priceCents)}
              {pricingMode === "PER_POUND_HANGING" ? (
                <span className="text-xs font-medium text-charcoal/45">
                  {" "}
                  / lb hanging
                </span>
              ) : null}
            </p>
            {weightLabel && (
              <p className="mt-0.5 text-xs text-charcoal/45">{weightLabel}</p>
            )}
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-charcoal/12 text-forest transition-all group-hover:border-forest group-hover:bg-forest group-hover:text-white">
            <ArrowRightIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
