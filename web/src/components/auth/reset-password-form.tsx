"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/app/forgot-password/actions";

const initialState: ResetPasswordState = {};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  if (state.success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {state.success}
        </div>
        <Link
          href="/login"
          className="inline-flex w-full justify-center rounded-full bg-charcoal py-3 text-sm font-semibold text-cream hover:bg-charcoal/90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-charcoal">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-charcoal">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-charcoal py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60 transition-colors"
      >
        {pending ? "Updating…" : "Update password"}
      </button>

      <p className="text-center text-sm text-charcoal/60">
        <Link
          href="/forgot-password"
          className="font-medium text-copper hover:underline"
        >
          Request a new link
        </Link>
      </p>
    </form>
  );
}
