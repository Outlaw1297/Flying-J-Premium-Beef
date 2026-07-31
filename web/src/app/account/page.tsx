import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">My account</h1>
      <p className="mt-2 text-charcoal/70">
        Signed in as <span className="font-medium text-charcoal">{session.user.email}</span>
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm hover:border-copper/40 transition-colors"
        >
          <h2 className="font-display text-lg font-semibold">Orders</h2>
          <p className="mt-2 text-sm text-charcoal/60">View order history and invoices</p>
        </Link>
        <Link
          href="/account/profile"
          className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm hover:border-copper/40 transition-colors"
        >
          <h2 className="font-display text-lg font-semibold">Profile</h2>
          <p className="mt-2 text-sm text-charcoal/60">
            Name, phone, address, and pickup preference
          </p>
        </Link>
        <Link
          href="/account/support"
          className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm hover:border-copper/40 transition-colors sm:col-span-2"
        >
          <h2 className="font-display text-lg font-semibold">Support</h2>
          <p className="mt-2 text-sm text-charcoal/60">Get help with orders and pickup</p>
        </Link>
      </div>

      {session.user.role === "ADMIN" && (
        <Link
          href="/admin"
          className="mt-6 inline-flex text-sm font-medium text-copper hover:underline"
        >
          Go to admin dashboard →
        </Link>
      )}

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        className="mt-10"
      >
        <button
          type="submit"
          className="rounded-full border border-charcoal/15 px-5 py-2.5 text-sm font-medium text-charcoal hover:border-charcoal/30 transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
