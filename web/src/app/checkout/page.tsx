import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { applyCouponCodeIfValid } from "@/lib/coupons";
import { CouponField } from "@/components/cart/coupon-field";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { auth } from "@/lib/auth";
import { getCart, getCartSubtotal } from "@/lib/cart";
import { resolveAppliedCoupon } from "@/lib/coupons";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Checkout",
};

type CheckoutPageProps = {
  searchParams: Promise<{ code?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { code: codeParam } = await searchParams;
  if (codeParam) {
    await applyCouponCodeIfValid(codeParam);
  }

  const session = await auth();
  const cart = await getCart();
  if (cart.length === 0) {
    redirect("/cart");
  }

  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          name: true,
          phone: true,
          email: true,
          passwordHash: true,
          newsletterSubscribed: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          zip: true,
          preferredFulfillment: true,
        },
      })
    : null;

  const isSignedIn = Boolean(session?.user?.id && user?.passwordHash);
  const subtotal = getCartSubtotal(cart);
  const applied = await resolveAppliedCoupon(subtotal);
  const discountCents = applied?.discountCents ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-charcoal sm:text-4xl">
        Checkout
      </h1>
      <p className="mt-2 text-charcoal/70">
        {isSignedIn
          ? "Confirm your details, address for delivery, then choose how to pay."
          : "Order as a guest — no account required. We’ll email order updates to the address you provide."}
      </p>
      {!isSignedIn && (
        <p className="mt-2 text-sm text-charcoal/60">
          Already have an account?{" "}
          <Link
            href="/login?callbackUrl=/checkout"
            className="font-medium text-copper hover:underline"
          >
            Sign in
          </Link>{" "}
          for faster checkout and order history.
        </p>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <CheckoutForm
              defaultName={user?.name}
              defaultEmail={user?.email ?? session?.user?.email}
              defaultPhone={user?.phone}
              defaultFulfillment={user?.preferredFulfillment}
              emailLocked={isSignedIn}
              isGuestCheckout={!isSignedIn}
              newsletterDefault={!user?.newsletterSubscribed}
              subtotalCents={subtotal}
              discountCents={discountCents}
              defaultAddress={{
                addressLine1: user?.addressLine1,
                addressLine2: user?.addressLine2,
                city: user?.city,
                state: user?.state,
                zip: user?.zip,
              }}
            />
          </div>
        </div>

        <aside className="lg:col-span-2">
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold text-charcoal">
              Order summary
            </h2>
            <ul className="mt-4 space-y-3">
              {cart.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-start justify-between gap-3 text-sm"
                >
                  <span className="text-charcoal/80">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="font-medium text-charcoal whitespace-nowrap">
                    {formatCents(item.priceCents * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 space-y-2 border-t border-charcoal/10 pt-4">
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
            </div>

            <div className="mt-4">
              <CouponField
                appliedCode={applied?.code}
                discountCents={applied?.discountCents}
                defaultCode={codeParam}
              />
            </div>

            <p className="mt-4 text-xs text-charcoal/50">
              Sales tax is calculated from delivery address (or pickup location) —
              state and county rates via Stripe Tax.
            </p>
            <Link
              href="/cart"
              className="mt-4 inline-flex text-sm font-medium text-copper hover:underline"
            >
              ← Edit cart
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
