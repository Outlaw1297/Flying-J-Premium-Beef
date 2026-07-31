import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { toggleProductActiveAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage() {
  await requireAdmin();

  const products = await prisma.product.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            Products
          </h1>
          <p className="mt-2 text-charcoal/70">
            Manage cuts, pricing, and inventory. Inventory decrements automatically on paid orders.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-copper px-5 py-2.5 text-sm font-semibold text-cream hover:bg-copper/90"
        >
          Add product
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-charcoal/10 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-charcoal/10 bg-cream/40 text-xs uppercase tracking-wider text-charcoal/50">
            <tr>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-charcoal/5">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="font-medium text-charcoal hover:text-copper"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-charcoal/50">
                    {p.slug}
                    {p.category ? ` · ${p.category}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3">{formatCents(p.priceCents)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.inventoryCount <= 5
                        ? "font-medium text-copper"
                        : "text-charcoal/80"
                    }
                  >
                    {p.inventoryCount}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-charcoal/60">
                  {p.active ? "Active" : "Hidden"}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleProductActiveAction} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={p.active ? "true" : "false"}
                    />
                    <button
                      type="submit"
                      className="text-xs font-medium text-charcoal/60 hover:text-copper underline"
                    >
                      {p.active ? "Hide" : "Show"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
