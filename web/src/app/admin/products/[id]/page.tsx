import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Product ${id.slice(-6)}` };
}

export default async function EditProductPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link href="/admin/products" className="text-sm font-medium text-copper hover:underline">
        ← Products
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">
        Edit {product.name}
      </h1>
      <p className="mt-2 text-sm text-charcoal/60">
        <Link href={`/shop/${product.slug}`} className="text-copper hover:underline">
          View in shop
        </Link>
        {product.stripePriceId ? ` · Stripe price ${product.stripePriceId}` : ""}
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <ProductForm product={product} />
      </div>
    </div>
  );
}
