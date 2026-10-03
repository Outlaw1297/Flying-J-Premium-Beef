import Image from "next/image";
import { CowIcon } from "@/components/ui/brand-icons";
import { categoryLabel } from "@/lib/categories";

const categoryTone: Record<string, string> = {
  steaks: "from-[#27332d] via-forest to-[#162019]",
  ground: "from-[#7f4926] via-copper to-[#3f2418]",
  roasts: "from-[#342b27] via-charcoal to-[#151515]",
  bundles: "from-forest via-[#3e5c4c] to-charcoal",
};

export function ProductMedia({
  imageUrl,
  name,
  category,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
  className = "",
}: {
  imageUrl?: string | null;
  name: string;
  category?: string | null;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  const tone =
    categoryTone[category ?? ""] ?? "from-forest via-[#385746] to-charcoal";
  const isLocal = Boolean(imageUrl?.startsWith("/"));

  return (
    <div
      className={`relative isolate overflow-hidden bg-gradient-to-br ${tone} ${className}`}
    >
      {imageUrl ? (
        isLocal ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
          />
        ) : (
          // Data URLs survive Render's ephemeral filesystem; external legacy URLs
          // remain supported without widening Next Image's remote host allowlist.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
          />
        )
      ) : (
        <>
          <div className="grain-overlay absolute inset-0 opacity-70" />
          <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full border border-white/10" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative flex h-full min-h-44 flex-col items-center justify-center p-6 text-center text-cream">
            <CowIcon className="h-14 w-14 text-cream/35" />
            <span className="mt-4 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-cream/55">
              {categoryLabel(category)}
            </span>
          </div>
        </>
      )}
      {imageUrl ? (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal/25 via-transparent to-transparent" />
      ) : null}
    </div>
  );
}
