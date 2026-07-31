import { prisma } from "@/lib/prisma";
import type { InvoiceLine, PricingMode, Prisma } from "@/generated/prisma/client";

export async function nextInvoiceNumber(
  tx?: Prisma.TransactionClient,
): Promise<string> {
  const db = tx ?? prisma;
  const year = new Date().getFullYear();
  const prefix = `FJP-${year}-`;

  const latest = await db.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let sequence = 1;
  if (latest) {
    const part = latest.invoiceNumber.slice(prefix.length);
    const parsed = Number.parseInt(part, 10);
    if (!Number.isNaN(parsed)) sequence = parsed + 1;
  }

  return `${prefix}${String(sequence).padStart(5, "0")}`;
}

export function lineTotalCents(quantity: number, unitPriceCents: number): number {
  return Math.max(0, Math.round(quantity * unitPriceCents));
}

export function sumInvoiceLines(
  lines: Pick<InvoiceLine, "lineTotalCents">[],
): number {
  return lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
}

export type CartProductPricing = {
  productId: string;
  name: string;
  quantity: number;
  priceCents: number;
  pricingMode: PricingMode;
  estimatedLbs: number | null;
  weightLabel: string | null;
};

export function buildInvoiceLinesFromCart(items: CartProductPricing[]) {
  return items.map((item, index) => {
    const awaitingWeight = item.pricingMode === "PER_POUND_HANGING";
    const unitLabel = awaitingWeight ? "lb hanging" : "each";
    const quantity = awaitingWeight
      ? item.estimatedLbs && item.estimatedLbs > 0
        ? item.estimatedLbs * item.quantity
        : 0
      : item.quantity;
    const unitPriceCents = item.priceCents;
    const total = awaitingWeight
      ? quantity > 0
        ? lineTotalCents(quantity, unitPriceCents)
        : 0
      : unitPriceCents * item.quantity;

    return {
      productId: item.productId,
      description: awaitingWeight
        ? `${item.name} (hanging weight — final $ after weigh-in)`
        : item.name,
      quantity,
      unitLabel,
      unitPriceCents,
      lineTotalCents: total,
      awaitingWeight,
      sortOrder: index,
    };
  });
}

export function invoiceNeedsWeight(
  lines: Pick<InvoiceLine, "awaitingWeight" | "quantity">[],
): boolean {
  return lines.some((l) => l.awaitingWeight && !(l.quantity > 0));
}

export function recalculateInvoiceTotals(input: {
  lines: Pick<InvoiceLine, "lineTotalCents">[];
  discountCents?: number;
  taxCents?: number;
}) {
  const subtotalCents = sumInvoiceLines(input.lines);
  const discountCents = Math.min(
    subtotalCents,
    Math.max(0, input.discountCents ?? 0),
  );
  const taxCents = Math.max(0, input.taxCents ?? 0);
  const totalCents = Math.max(0, subtotalCents - discountCents + taxCents);
  return { subtotalCents, discountCents, taxCents, totalCents };
}
