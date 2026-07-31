import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Checkout cancelled",
};

type CancelPageProps = {
  searchParams: Promise<{ order_id?: string }>;
};

export default async function CheckoutCancelPage({
  searchParams,
}: CancelPageProps) {
  const { order_id: orderId } = await searchParams;

  if (orderId) {
    await prisma.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "CANCELLED" },
    });
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-20 text-center">
      <h1 className="font-display text-3xl font-semibold text-charcoal">
        Payment cancelled
      </h1>
      <p className="mt-4 text-charcoal/70">
        No charge was made. Your cart is still available whenever you&apos;re ready.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/checkout"
          className="inline-flex justify-center rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 transition-colors"
        >
          Return to checkout
        </Link>
        <Link
          href="/cart"
          className="inline-flex justify-center rounded-full border border-charcoal/15 px-6 py-3 text-sm font-medium text-charcoal hover:border-charcoal/30 transition-colors"
        >
          View cart
        </Link>
      </div>
    </div>
  );
}
