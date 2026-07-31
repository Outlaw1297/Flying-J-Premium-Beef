import type { Metadata } from "next";
import Link from "next/link";
import { CartLineItems } from "@/components/cart/cart-line-items";
import { CouponField } from "@/components/cart/coupon-field";
import { applyCouponCodeIfValid, resolveAppliedCoupon } from "@/lib/coupons";
import { getCart, getCartSubtotal } from "@/lib/cart";
import { formatCents } from "@/lib/format";

export const metadata: Metadata = {
  title: "Cart",
};

type CartPageProps = {
  searchParams: Promise<{ code?: string }>;
};

export default async function CartPage({ searchParams }: CartPageProps) {
  const { code: codeParam } = await searchParams;
  if (codeParam) {
    await applyCouponCodeIfValid(codeParam);
  }

  const items = await getCart();
  const subtotal = getCartSubtotal(items);
  const applied = items.length > 0 ? await resolveAppliedCoupon(subtotal) : null;
  const discountCents = applied?.discountCents ?? 0;
  const afterDiscount = Math.max(0, subtotal - discountCents);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-charcoal sm:text-4xl">
        Your cart
      </h1>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-charcoal/10 bg-white p-10 text-center">
          <p className="text-charcoal/70">Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-6 inline-flex rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 transition-colors"
          >
            Browse cuts
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
          <CartLineItems items={items} />

          <div className="mt-6 border-t border-charcoal/10 pt-6">
            <CouponField
              appliedCode={applied?.code}
              discountCents={applied?.discountCents}
              defaultCode={codeParam}
            />
          </div>

          <div className="mt-6 space-y-2 border-t border-charcoal/10 pt-6">
            <div className="flex items-center justify-between text-sm text-charcoal/70">
              <span>Subtotal</span>
              <span>{formatCents(subtotal)}</span>
            </div>
            {discountCents > 0 && (
              <div className="flex items-center justify-between text-sm text-copper">
                <span>Discount ({applied?.code})</span>
                <span>−{formatCents(discountCents)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-charcoal/70">
                {discountCents > 0 ? "After discount" : "Subtotal"}
              </span>
              <span className="text-xl font-semibold text-charcoal">
                {formatCents(afterDiscount)}
              </span>
            </div>
          </div>

          <p className="mt-2 text-xs text-charcoal/50">
            Guest checkout welcome — no account required. Card payments via Stripe.
            Tax calculated at checkout.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex justify-center rounded-full border border-charcoal/15 px-6 py-3 text-sm font-medium text-charcoal hover:border-charcoal/30 transition-colors"
            >
              Continue shopping
            </Link>
            <Link
              href="/checkout"
              className="inline-flex justify-center rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream hover:bg-copper/90 transition-colors"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
