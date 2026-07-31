import { prisma } from "@/lib/prisma";

/** Map cart product ids → stored Stripe tax codes. */
export async function taxCodesForProductIds(
  productIds: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(productIds.filter(Boolean))];
  if (unique.length === 0) return {};

  const products = await prisma.product.findMany({
    where: { id: { in: unique } },
    select: { id: true, stripeTaxCode: true },
  });

  return Object.fromEntries(
    products.map((p) => [p.id, p.stripeTaxCode]),
  );
}
