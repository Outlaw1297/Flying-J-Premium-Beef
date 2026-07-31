"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

function urlErrorMessage(error: string | null): string | null {
  if (!error) return null;
  if (error === "MissingCSRF") {
    return "Session expired. Please try signing in again.";
  }
  if (error === "CredentialsSignin") {
    return "Invalid email or password";
  }
  return "Unable to sign in. Please try again.";
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/account";
  const urlError = urlErrorMessage(searchParams.get("error"));

  const [state, formAction, pending] = useActionState(loginAction, initialState);

  const displayError = state.error ?? urlError;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {displayError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {displayError}
        </div>
      )}

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
          autoComplete="current-password"
          minLength={8}
          className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-charcoal py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60 transition-colors"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-charcoal/60">
        No account?{" "}
        <Link href="/register" className="font-medium text-copper hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
