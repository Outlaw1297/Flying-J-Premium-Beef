import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Welcome back</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Sign in to view orders and manage your account. Prefer to skip an account?{" "}
        <Link href="/shop" className="font-medium text-copper hover:underline">
          Shop and checkout as a guest
        </Link>
        .
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <Suspense fallback={<div className="text-sm text-charcoal/50">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
