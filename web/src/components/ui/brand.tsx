import Link from "next/link";

export function InspectionBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-copper ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-copper" />
      Federally Inspected
    </span>
  );
}

export function PlaceholderPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
      <h1 className="font-display text-3xl font-semibold text-charcoal sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 text-lg text-charcoal/70 leading-relaxed">{description}</p>
      {children}
      <Link
        href="/"
        className="mt-8 inline-flex text-sm font-medium text-copper hover:underline"
      >
        ← Back to home
      </Link>
    </div>
  );
}
