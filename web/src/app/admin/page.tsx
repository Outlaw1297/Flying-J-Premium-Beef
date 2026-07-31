import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/account");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Admin</h1>
      <p className="mt-4 text-charcoal/70">
        Admin dashboard for orders, products, coupons, and support — coming in Phase 7.
      </p>
    </div>
  );
}
