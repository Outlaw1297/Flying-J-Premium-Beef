"use client";

import { useActionState } from "react";
import {
  subscribeNewsletterAction,
  type NewsletterFormState,
} from "@/app/newsletter/actions";

const initialState: NewsletterFormState = {};

export function NewsletterSignup({
  source = "FOOTER",
  compact = false,
  idSuffix,
}: {
  source?: "FOOTER" | "CHECKOUT" | "POPUP" | "ACCOUNT";
  compact?: boolean;
  idSuffix?: string;
}) {
  const [state, formAction, pending] = useActionState(
    subscribeNewsletterAction,
    initialState,
  );
  const inputId = `newsletter-email-${idSuffix ?? source}`;

  return (
    <form action={formAction} className={compact ? "space-y-2" : "space-y-3"}>
      <input type="hidden" name="source" value={source} />
      <div className={compact ? "flex flex-col gap-2 sm:flex-row" : "space-y-2"}>
        <label htmlFor={inputId} className="sr-only">
          Email
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full rounded-lg border border-cream/20 bg-charcoal px-3 py-2.5 text-sm text-cream placeholder:text-cream/40 focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-copper px-5 py-2.5 text-sm font-semibold text-cream hover:bg-copper/90 disabled:opacity-60"
        >
          {pending ? "Joining…" : "Join"}
        </button>
      </div>
      {state.error && <p className="text-xs text-red-300">{state.error}</p>}
      {state.success && <p className="text-xs text-copper">{state.success}</p>}
      {!compact && (
        <p className="text-xs text-cream/50">
          Seasonal deals &amp; coupons. Unsubscribe anytime.
        </p>
      )}
    </form>
  );
}
