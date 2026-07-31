import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  adminPayInvoiceAction,
  markInvoicePaidAction,
} from "@/app/admin/invoice-actions";
import { InvoiceEditor } from "@/components/admin/invoice-editor";
import { requireAdmin } from "@/lib/admin";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice ${id.slice(-6)}` };
}

export default async function AdminInvoiceDetailPage({
  params,
  searchParams,
}: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      order: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
        },
      },
    },
  });
  if (!invoice) notFound();

  const editable = invoice.status === "DRAFT" || invoice.status === "ISSUED";
  const canIssue = invoice.status === "DRAFT";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/admin/invoices" className="text-sm font-medium text-copper hover:underline">
        ← Invoices
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            {invoice.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-charcoal/60">
            {invoice.order.user.name || invoice.order.user.email} ·{" "}
            <Link
              href={`/admin/orders/${invoice.orderId}`}
              className="text-copper hover:underline"
            >
              Order
            </Link>
          </p>
        </div>
        <span className="rounded-full bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-wider text-charcoal">
          {invoice.status}
        </span>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {invoice.status === "DRAFT" ? (
        <p className="mt-4 rounded-xl border border-copper/25 bg-copper/5 px-4 py-3 text-sm text-charcoal/80">
          Enter the hanging weight (lbs) and adjust lines, then{" "}
          <strong>Issue invoice</strong> (saves your edits and emails the customer a pay
          link).
        </p>
      ) : null}

      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <InvoiceEditor
          invoiceId={invoice.id}
          initialNotes={invoice.notes}
          initialTaxCents={invoice.taxCents}
          initialDiscountCents={invoice.discountCents}
          editable={editable && invoice.status !== "PAID"}
          canIssue={canIssue}
          initialLines={invoice.lines.map((l) => ({
            id: l.id,
            description: l.description,
            quantity: l.quantity,
            unitLabel: l.unitLabel,
            unitPriceCents: l.unitPriceCents,
            awaitingWeight: l.awaitingWeight,
            productId: l.productId,
          }))}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {invoice.status === "ISSUED" ? (
          <>
            <form action={adminPayInvoiceAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <button
                type="submit"
                className="rounded-full bg-copper px-5 py-2.5 text-sm font-semibold text-cream hover:bg-copper/90"
              >
                Collect card payment (Stripe)
              </button>
            </form>
            <form action={markInvoicePaidAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <input type="hidden" name="method" value="CASH" />
              <button
                type="submit"
                className="rounded-full border border-charcoal/15 px-5 py-2.5 text-sm font-semibold text-charcoal hover:border-copper"
              >
                Mark paid (cash)
              </button>
            </form>
            <form action={markInvoicePaidAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <input type="hidden" name="method" value="CHECK" />
              <button
                type="submit"
                className="rounded-full border border-charcoal/15 px-5 py-2.5 text-sm font-semibold text-charcoal hover:border-copper"
              >
                Mark paid (check)
              </button>
            </form>
          </>
        ) : null}
      </div>

      <p className="mt-6 text-sm text-charcoal/50">
        Current total: <span className="font-semibold text-charcoal">{formatCents(invoice.totalCents)}</span>
      </p>
    </div>
  );
}
