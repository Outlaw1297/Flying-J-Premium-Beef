import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">
        Create account
      </h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Save orders, get coupons and newsletters, and reorder your favorites.
        You can also checkout as a guest anytime.
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <Suspense fallback={<p className="text-sm text-charcoal/60">Loading…</p>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
