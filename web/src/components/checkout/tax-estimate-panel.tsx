"use client";

import { useActionState, startTransition } from "react";
import {
  estimateTaxAction,
  type TaxEstimateState,
} from "@/app/checkout/tax-actions";
import { formatCents } from "@/lib/format";

const initialState: TaxEstimateState = {};

export function TaxEstimatePanel({
  fulfillmentType,
  addressLine1,
  addressLine2,
  city,
  state,
  zip,
  subtotalCents,
  discountCents = 0,
}: {
  fulfillmentType: "PICKUP" | "DELIVERY";
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  subtotalCents: number;
  discountCents?: number;
}) {
  const [estimate, runEstimate, pending] = useActionState(
    estimateTaxAction,
    initialState,
  );

  const canEstimate =
    fulfillmentType === "PICKUP" ||
    (Boolean(addressLine1.trim()) &&
      Boolean(city.trim()) &&
      state.trim().length === 2 &&
      /^\d{5}(-\d{4})?$/.test(zip.trim()));

  const taxCents = estimate.taxCents ?? null;
  const totalCents = estimate.totalCents ?? null;
  const afterDiscount = Math.max(0, subtotalCents - discountCents);

  function handleEstimate() {
    if (!canEstimate || pending) return;
    const fd = new FormData();
    fd.set("fulfillmentType", fulfillmentType);
    fd.set("addressLine1", addressLine1);
    fd.set("addressLine2", addressLine2);
    fd.set("city", city);
    fd.set("state", state);
    fd.set("zip", zip);
    // Nested <form> inside checkout is invalid HTML — call the action directly
    startTransition(() => {
      runEstimate(fd);
    });
  }

  return (
    <div className="rounded-xl border border-charcoal/10 bg-cream/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-charcoal">Sales tax</p>
          <p className="mt-0.5 text-xs text-charcoal/55">
            Based on {fulfillmentType === "DELIVERY" ? "delivery address" : "pickup location"}{" "}
            (state &amp; county)
          </p>
        </div>
        <button
          type="button"
          onClick={handleEstimate}
          disabled={pending || !canEstimate}
          className="rounded-full border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal hover:border-copper hover:text-copper disabled:opacity-50"
        >
          {pending ? "Calculating…" : "Estimate tax"}
        </button>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between text-charcoal/70">
          <span>Subtotal</span>
          <span>{formatCents(subtotalCents)}</span>
        </div>
        {discountCents > 0 && (
          <div className="flex justify-between text-copper">
            <span>Discount</span>
            <span>−{formatCents(discountCents)}</span>
          </div>
        )}
        <div className="flex justify-between text-charcoal/70">
          <span>Estimated tax</span>
          <span>{taxCents === null ? "—" : formatCents(taxCents)}</span>
        </div>
        <div className="flex justify-between font-semibold text-charcoal">
          <span>Estimated total</span>
          <span>
            {totalCents === null
              ? formatCents(afterDiscount)
              : formatCents(totalCents)}
          </span>
        </div>
      </div>

      {estimate.jurisdiction && (
        <p className="mt-2 text-xs text-charcoal/50">{estimate.jurisdiction}</p>
      )}
      {estimate.error && (
        <p className="mt-2 text-xs text-red-600">{estimate.error}</p>
      )}
      {estimate.warning && (
        <p className="mt-2 text-xs text-copper">{estimate.warning}</p>
      )}
      {!canEstimate && fulfillmentType === "DELIVERY" && (
        <p className="mt-2 text-xs text-charcoal/50">
          Enter a full delivery address to estimate tax.
        </p>
      )}
    </div>
  );
}
