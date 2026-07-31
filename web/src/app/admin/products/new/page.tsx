import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { ProductForm } from "@/components/admin/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
      <Link href="/admin/products" className="text-sm font-medium text-copper hover:underline">
        ← Products
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">
        New product
      </h1>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <ProductForm />
      </div>
    </div>
  );
}
