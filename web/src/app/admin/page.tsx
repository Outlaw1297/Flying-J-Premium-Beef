import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SyncStripeButton } from "@/components/admin/sync-stripe-button";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Admin</h1>
      <p className="mt-4 text-charcoal/70">
        Staff tools for Flying J Premium Beef. Full order/product management expands in later phases.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-charcoal">
          Stripe catalog
        </h2>
        <p className="text-sm text-charcoal/70">
          Push all website products to Stripe Products &amp; Prices so the catalogs stay in sync.
        </p>
        <SyncStripeButton />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/coupons"
          className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm transition-colors hover:border-copper/40"
        >
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Coupons
          </h2>
          <p className="mt-2 text-sm text-charcoal/70">
            Create codes, track redemptions, sync to Stripe.
          </p>
        </Link>
        <Link
          href="/admin/newsletters"
          className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm transition-colors hover:border-copper/40"
        >
          <h2 className="font-display text-lg font-semibold text-charcoal">
            Newsletter
          </h2>
          <p className="mt-2 text-sm text-charcoal/70">
            View subscribers and export the list.
          </p>
        </Link>
      </div>

      <Link href="/account" className="mt-8 inline-flex text-sm font-medium text-copper hover:underline">
        ← Back to account
      </Link>
    </div>
  );
}
