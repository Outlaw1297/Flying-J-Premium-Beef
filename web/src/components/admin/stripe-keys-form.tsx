"use client";

import { useActionState } from "react";
import {
  saveStripeKeysAction,
  type StripeKeysState,
} from "@/app/admin/payments/actions";

const initialState: StripeKeysState = {};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20";

export function StripeKeysForm({
  secretHint,
  publishableHint,
  webhookHint,
  webhookUrl,
}: {
  secretHint: string | null;
  publishableHint: string | null;
  webhookHint: string | null;
  webhookUrl: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveStripeKeysAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
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
        <label htmlFor="secretKey" className="block text-sm font-medium text-charcoal">
          Secret key
        </label>
        <input
          id="secretKey"
          name="secretKey"
          type="password"
          autoComplete="off"
          placeholder={secretHint ? "Saved — paste a new key to replace it" : "sk_live_..."}
          className={inputClass}
        />
        {secretHint && (
          <p className="mt-1 text-xs text-charcoal/60">Saved as {secretHint}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="publishableKey"
          className="block text-sm font-medium text-charcoal"
        >
          Publishable key
        </label>
        <input
          id="publishableKey"
          name="publishableKey"
          type="password"
          autoComplete="off"
          placeholder={
            publishableHint ? "Saved — paste a new key to replace it" : "pk_live_..."
          }
          className={inputClass}
        />
        {publishableHint && (
          <p className="mt-1 text-xs text-charcoal/60">Saved as {publishableHint}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="webhookSecret"
          className="block text-sm font-medium text-charcoal"
        >
          Webhook signing secret
        </label>
        <input
          id="webhookSecret"
          name="webhookSecret"
          type="password"
          autoComplete="off"
          placeholder={webhookHint ? "Saved — paste a new secret to replace it" : "whsec_..."}
          className={inputClass}
        />
        {webhookHint && (
          <p className="mt-1 text-xs text-charcoal/60">Saved as {webhookHint}</p>
        )}
        <p className="mt-1 text-xs text-charcoal/60">
          Stripe webhook endpoint: {webhookUrl}
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save Stripe keys"}
      </button>
    </form>
  );
}
