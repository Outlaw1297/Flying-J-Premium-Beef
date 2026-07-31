"use client";

import { useActionState } from "react";
import { addToCartAction, type CartActionState } from "@/app/cart/actions";

const initialState: CartActionState = {};

export function AddToCartForm({
  productId,
  maxQuantity,
  disabled,
}: {
  productId: string;
  maxQuantity: number;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(addToCartAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm font-medium text-charcoal">
          Qty
          <select
            name="quantity"
            defaultValue={1}
            disabled={disabled || pending}
            className="rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-charcoal focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
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
          className="flex-1 rounded-full bg-copper px-8 py-3 text-sm font-semibold text-cream hover:bg-copper/90 disabled:opacity-50 transition-colors sm:flex-none"
        >
          {pending ? "Adding…" : disabled ? "Out of stock" : "Add to cart"}
        </button>
      </div>
      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state.success && (
        <p className="text-sm text-copper">{state.success}</p>
      )}
    </form>
  );
}
