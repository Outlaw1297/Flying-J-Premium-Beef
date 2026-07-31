import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-semibold text-charcoal">Create account</h1>
      <p className="mt-2 text-sm text-charcoal/60">
        Register to place orders and track pickups.
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
