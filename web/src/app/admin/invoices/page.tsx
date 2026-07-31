import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Invoices" };

const statusStyle: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-900",
  ISSUED: "bg-sky-100 text-sky-900",
  PAID: "bg-emerald-100 text-emerald-900",
  VOID: "bg-charcoal/10 text-charcoal/60",
};

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const { status } = await searchParams;
  const filter =
    status && ["DRAFT", "ISSUED", "PAID", "VOID"].includes(status)
      ? { status: status as "DRAFT" | "ISSUED" | "PAID" | "VOID" }
      : {};

  const invoices = await prisma.invoice.findMany({
    where: filter,
    include: {
      order: { include: { user: { select: { name: true, email: true } } } },
      lines: { select: { awaitingWeight: true, quantity: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Invoices</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Edit hanging weights, issue invoices, and collect payment.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {["", "DRAFT", "ISSUED", "PAID"].map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/admin/invoices?status=${s}` : "/admin/invoices"}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              (status || "") === s
                ? "bg-charcoal text-cream"
                : "border border-charcoal/15 text-charcoal/70 hover:border-copper"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-charcoal/10 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-charcoal/10 bg-cream/60 text-xs uppercase tracking-wider text-charcoal/50">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const needsWeight = inv.lines.some(
                (l) => l.awaitingWeight || (l.quantity <= 0 && inv.status === "DRAFT"),
              );
              return (
                <tr key={inv.id} className="border-b border-charcoal/5">
                  <td className="px-4 py-3 font-medium text-charcoal">
                    {inv.invoiceNumber}
                    {needsWeight ? (
                      <span className="ml-2 text-xs font-normal text-copper">
                        needs weight
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">
                    {inv.order.user.name || inv.order.user.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[inv.status]}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatCents(inv.totalCents)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/invoices/${inv.id}`}
                      className="font-medium text-copper hover:underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-charcoal/50">
                  No invoices yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
