import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/support?status=active", label: "Support" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/newsletters", label: "Newsletter" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-full bg-cream">
      <div className="border-b border-charcoal/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-copper">
              Staff
            </p>
            <Link
              href="/admin"
              className="font-display text-lg font-semibold text-charcoal"
            >
              Flying J Admin
            </Link>
          </div>
          <nav className="flex flex-wrap gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-charcoal/70 hover:bg-cream hover:text-charcoal"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
