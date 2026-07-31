"use client";

import { useActionState } from "react";
import {
  applyCouponAction,
  removeCouponAction,
  type CouponFormState,
} from "@/app/cart/coupon-actions";
import { formatCents } from "@/lib/format";

const initialState: CouponFormState = {};

export function CouponField({
  appliedCode,
  discountCents,
  defaultCode,
}: {
  appliedCode?: string | null;
  discountCents?: number;
  defaultCode?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    applyCouponAction,
    initialState,
  );

  if (appliedCode && discountCents != null && discountCents > 0) {
    return (
      <div className="rounded-xl border border-copper/25 bg-copper/5 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-charcoal">
              Coupon <span className="text-copper">{appliedCode}</span>
            </p>
            <p className="mt-0.5 text-xs text-charcoal/60">
              −{formatCents(discountCents)} off your order
            </p>
          </div>
          <form action={removeCouponAction}>
            <button
              type="submit"
              className="text-xs font-medium text-charcoal/60 hover:text-copper underline"
            >
              Remove
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <label htmlFor="coupon-code" className="block text-sm font-medium text-charcoal">
        Coupon code
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          name="code"
          type="text"
          defaultValue={defaultCode ?? ""}
          placeholder="e.g. WELCOME10"
          autoCapitalize="characters"
          className="min-w-0 flex-1 rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-sm text-charcoal uppercase shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full border border-charcoal/15 px-4 py-2 text-sm font-medium text-charcoal hover:border-copper hover:text-copper disabled:opacity-60"
        >
          {pending ? "…" : "Apply"}
        </button>
      </div>
      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="text-xs text-copper">{state.success}</p>
      )}
    </form>
  );
}
