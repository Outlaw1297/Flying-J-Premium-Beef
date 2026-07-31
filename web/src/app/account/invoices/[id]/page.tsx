import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PayInvoiceButton } from "@/components/account/pay-invoice-button";
import { auth } from "@/lib/auth";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Invoice ${id.slice(-6)}` };
}

export default async function CustomerInvoicePage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/account/invoices/${(await params).id}`);
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { sortOrder: "asc" } },
      order: true,
    },
  });

  if (!invoice || invoice.order.userId !== session.user.id) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href={`/account/orders/${invoice.orderId}`}
        className="text-sm font-medium text-copper hover:underline"
      >
        ← Order
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">
        Invoice {invoice.invoiceNumber}
      </h1>
      <p className="mt-2 text-sm text-charcoal/60">Status: {invoice.status}</p>

      {invoice.status === "DRAFT" ? (
        <p className="mt-6 rounded-xl border border-copper/25 bg-copper/5 px-4 py-3 text-sm text-charcoal/80">
          We&apos;re waiting on hanging weight. You&apos;ll get an email when this
          invoice is ready to pay.
        </p>
      ) : null}

      <div className="mt-8 space-y-3 rounded-2xl border border-charcoal/10 bg-white p-6">
        {invoice.lines.map((line) => (
          <div
            key={line.id}
            className="flex justify-between gap-4 border-b border-charcoal/5 pb-3 text-sm"
          >
            <div>
              <p className="font-medium text-charcoal">{line.description}</p>
              <p className="text-xs text-charcoal/50">
                {line.awaitingWeight
                  ? line.quantity > 0
                    ? `Est. ${line.quantity} ${line.unitLabel} × ${formatCents(line.unitPriceCents)} — final after weigh-in`
                    : "Weight TBD"
                  : `${line.quantity} ${line.unitLabel} × ${formatCents(line.unitPriceCents)}`}
              </p>
            </div>
            <p className="font-medium text-charcoal">
              {line.awaitingWeight ? "—" : formatCents(line.lineTotalCents)}
            </p>
          </div>
        ))}
        {invoice.discountCents > 0 ? (
          <div className="flex justify-between text-sm text-copper">
            <span>Discount</span>
            <span>−{formatCents(invoice.discountCents)}</span>
          </div>
        ) : null}
        {invoice.taxCents > 0 ? (
          <div className="flex justify-between text-sm text-charcoal/70">
            <span>Tax</span>
            <span>{formatCents(invoice.taxCents)}</span>
          </div>
        ) : null}
        <div className="flex justify-between pt-2 text-base font-semibold text-charcoal">
          <span>Total</span>
          <span>{formatCents(invoice.totalCents)}</span>
        </div>
      </div>

      {invoice.status === "ISSUED" ? (
        <div className="mt-8">
          <PayInvoiceButton invoiceId={invoice.id} />
        </div>
      ) : null}

      {invoice.status === "PAID" ? (
        <p className="mt-6 text-sm text-emerald-700">This invoice is paid. Thank you!</p>
      ) : null}
    </div>
  );
}
