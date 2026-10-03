"use client";

import { useActionState } from "react";
import { addToCartAction, type CartActionState } from "@/app/cart/actions";

const initialState: CartActionState = {};

export function AddToCartForm({
  productId,
  maxQuantity,
  disabled,
  compact = false,
}: {
  productId: string;
  maxQuantity: number;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);

  return (
    <form action={formAction} className={compact ? "" : "space-y-3"}>
      <input type="hidden" name="productId" value={productId} />
      <div className={`flex items-center ${compact ? "gap-2" : "flex-col gap-3 sm:flex-row"}`}>
        <label className="flex items-center gap-2 text-sm font-semibold text-charcoal">
          <span className={compact ? "sr-only" : ""}>Qty</span>
          <select
            name="quantity"
            defaultValue={1}
            disabled={disabled || pending}
            aria-label="Quantity"
            className={`rounded-full border border-charcoal/15 bg-white text-charcoal focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 ${
              compact ? "h-11 w-16 px-2 text-sm" : "px-4 py-3"
            }`}
          >
            {Array.from({ length: Math.min(maxQuantity, 10) }, (_, i) => i + 1).map(
              (n) => (
                <option key={n} value={n}>{n}</option>
              ),
            )}
          </select>
        </label>
        <button
          type="submit"
          disabled={disabled || pending}
          className={`flex-1 rounded-full bg-copper font-bold text-white transition-all hover:bg-[#a8632e] disabled:opacity-50 ${
            compact
              ? "h-11 px-5 text-xs uppercase tracking-[0.08em]"
              : "min-h-12 px-8 text-sm uppercase tracking-[0.08em] sm:flex-none"
          }`}
        >
          {pending ? "Adding…" : disabled ? "Out of stock" : "Add to cart"}
        </button>
      </div>
      {!compact && state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {!compact && state.success && (
        <p className="text-sm text-copper">{state.success}</p>
      )}
    </form>
  );
}
