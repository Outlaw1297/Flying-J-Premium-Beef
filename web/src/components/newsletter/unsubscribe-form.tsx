"use client";

import { useActionState } from "react";
import {
  unsubscribeNewsletterAction,
  type NewsletterFormState,
} from "@/app/newsletter/actions";

const initialState: NewsletterFormState = {};

export function UnsubscribeForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState(
    unsubscribeNewsletterAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-copper/30 bg-copper/10 px-4 py-3 text-sm text-copper">
          {state.success}
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
          defaultValue={defaultEmail}
          autoComplete="email"
          className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-charcoal py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60"
      >
        {pending ? "Updating…" : "Unsubscribe"}
      </button>
    </form>
  );
}
