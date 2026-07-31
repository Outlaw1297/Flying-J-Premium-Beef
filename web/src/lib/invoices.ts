import { prisma } from "@/lib/prisma";

export async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FJP-${year}-`;

  const latest = await prisma.invoice.findFirst({
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
