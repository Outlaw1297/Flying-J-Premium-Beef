"use client";

import { useActionState } from "react";
import {
  createCouponAction,
  type CouponAdminState,
} from "@/app/admin/coupons/actions";

const initialState: CouponAdminState = {};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20";

export function CreateCouponForm() {
  const [state, formAction, pending] = useActionState(
    createCouponAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {state.error && (
        <div className="sm:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="sm:col-span-2 rounded-lg border border-copper/30 bg-copper/10 px-4 py-3 text-sm text-copper">
          {state.success}
        </div>
      )}

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-charcoal">
          Code
        </label>
        <input
          id="code"
          name="code"
          required
          placeholder="WELCOME10"
          className={`${inputClass} uppercase`}
        />
      </div>
      <div>
        <label htmlFor="campaignName" className="block text-sm font-medium text-charcoal">
          Campaign name
        </label>
        <input
          id="campaignName"
          name="campaignName"
          placeholder="Launch welcome"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-charcoal">
          Type
        </label>
        <select id="type" name="type" className={inputClass} defaultValue="PERCENT">
          <option value="PERCENT">Percent off</option>
          <option value="FIXED">Fixed dollar off</option>
        </select>
      </div>
      <div>
        <label htmlFor="value" className="block text-sm font-medium text-charcoal">
          Value
        </label>
        <input
          id="value"
          name="value"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="10"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-charcoal/50">
          Percent (e.g. 10) or dollars (e.g. 5.00 for fixed)
        </p>
      </div>
      <div>
        <label htmlFor="minOrderDollars" className="block text-sm font-medium text-charcoal">
          Min order ($)
        </label>
        <input
          id="minOrderDollars"
          name="minOrderDollars"
          type="number"
          step="0.01"
          min="0"
          defaultValue="0"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="maxUses" className="block text-sm font-medium text-charcoal">
          Max uses
        </label>
        <input
          id="maxUses"
          name="maxUses"
          type="number"
          min="1"
          placeholder="Unlimited"
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="expiresAt" className="block text-sm font-medium text-charcoal">
          Expires
        </label>
        <input
          id="expiresAt"
          name="expiresAt"
          type="date"
          className={`${inputClass} sm:max-w-xs`}
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create coupon"}
        </button>
      </div>
    </form>
  );
}
