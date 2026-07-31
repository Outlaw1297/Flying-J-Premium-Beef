import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">
        Forgot password
      </h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Enter the email on your account and we&apos;ll send a reset link.
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
