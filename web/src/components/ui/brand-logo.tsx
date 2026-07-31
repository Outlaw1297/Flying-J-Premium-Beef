import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <rect width="56" height="56" rx="28" fill="currentColor" />
      <path
        d="M14 35.5c7.2-7.2 20.8-7.2 28 0M17 25.5h22M20 21.5h16"
        stroke="var(--cream)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M21 19v13.5M21 19h10M21 25h8M34.5 19v10.5c0 3.3-1.7 5-5 5-2 0-3.6-.8-4.5-2.2"
        stroke="var(--cream)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      aria-label="Flying J Premium Beef home"
      className={`group inline-flex items-center gap-3 ${className}`}
    >
      <BrandMark className="h-10 w-10 shrink-0 text-forest transition-transform duration-300 group-hover:scale-105 sm:h-11 sm:w-11" />
      {!compact ? (
        <span className="leading-none">
          <span className="block font-display text-[1.2rem] font-semibold tracking-[-0.02em] text-charcoal">
            Flying J Beef
          </span>
          <span className="mt-1 block text-[0.58rem] font-bold uppercase tracking-[0.23em] text-charcoal/55">
            Ranch raised · North Dakota
          </span>
        </span>
      ) : null}
    </Link>
  );
}
