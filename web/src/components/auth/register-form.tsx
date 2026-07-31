"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { registerAction, type RegisterState } from "@/app/register/actions";

const initialState: RegisterState = {};

export function RegisterForm() {
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get("email") ?? "";
  const defaultName = searchParams.get("name") ?? "";
  const claim = searchParams.get("claim") ?? "";
  const fromCheckout = searchParams.get("from") === "checkout";

  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {claim ? <input type="hidden" name="claim" value={claim} /> : null}
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {fromCheckout && (
        <div className="rounded-xl border border-copper/25 bg-copper/5 px-4 py-3 text-sm text-charcoal/80">
          Set a password to save your guest order, get newsletters and coupons,
          and reorder faster next time.
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-charcoal">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          defaultValue={defaultName}
          className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-charcoal">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={defaultEmail}
          className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-charcoal">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
        />
        <p className="mt-1 text-xs text-charcoal/50">At least 8 characters</p>
      </div>

      <label className="flex items-start gap-3 text-sm text-charcoal/80">
        <input
          type="checkbox"
          name="newsletter"
          defaultChecked={fromCheckout}
          className="mt-1"
        />
        <span>
          Email me newsletters, seasonal deals, and coupons. You can unsubscribe
          anytime.
        </span>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-charcoal py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60 transition-colors"
      >
        {pending
          ? "Creating account…"
          : fromCheckout
            ? "Save my account"
            : "Create account"}
      </button>

      <p className="text-center text-sm text-charcoal/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-copper hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
