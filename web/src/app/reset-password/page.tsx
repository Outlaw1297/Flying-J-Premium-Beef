import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

function ResetPasswordInner({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token?.trim() ?? "";
  if (!token) {
    return (
      <div className="space-y-4 text-sm text-charcoal/70">
        <p>This reset link is missing or incomplete.</p>
        <Link href="/forgot-password" className="font-medium text-copper hover:underline">
          Request a new password reset
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Pick a password at least 8 characters long.
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <Suspense fallback={<p className="text-sm text-charcoal/50">Loading…</p>}>
          <ResetPasswordInner searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
