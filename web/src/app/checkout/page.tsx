import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCart, getCartSubtotal } from "@/lib/cart";
import { formatCents } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/checkout");
  }

  const cart = await getCart();
  if (cart.length === 0) {
    redirect("/cart");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, phone: true, email: true },
  });

  const subtotal = getCartSubtotal(cart);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-semibold text-charcoal sm:text-4xl">
        Checkout
      </h1>
      <p className="mt-2 text-charcoal/70">
        Confirm your details, then pay securely with Stripe.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <CheckoutForm defaultName={user?.name} defaultPhone={user?.phone} />
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
            <div className="mt-4 flex items-center justify-between border-t border-charcoal/10 pt-4">
              <span className="text-sm font-medium text-charcoal/70">Subtotal</span>
              <span className="text-lg font-semibold text-charcoal">
                {formatCents(subtotal)}
              </span>
            </div>
            <p className="mt-2 text-xs text-charcoal/50">
              Signed in as {user?.email}
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
