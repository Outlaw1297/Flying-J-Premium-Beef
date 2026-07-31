"use client";

import { useActionState, useMemo, useState } from "react";
import {
  updateInvoiceDraftAction,
  type InvoiceFormState,
} from "@/app/admin/invoice-actions";
import { formatCents } from "@/lib/format";

type Line = {
  id?: string;
  description: string;
  quantity: number;
  unitLabel: string;
  unitPriceCents: number;
  awaitingWeight: boolean;
  productId?: string | null;
};

const inputClass =
  "w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20";

export function InvoiceEditor({
  invoiceId,
  initialNotes,
  initialTaxCents,
  initialDiscountCents,
  initialLines,
  editable,
}: {
  invoiceId: string;
  initialNotes: string | null;
  initialTaxCents: number;
  initialDiscountCents: number;
  initialLines: Line[];
  editable: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateInvoiceDraftAction,
    {} as InvoiceFormState,
  );
  const [lines, setLines] = useState<Line[]>(
    initialLines.length
      ? initialLines
      : [
          {
            description: "",
            quantity: 1,
            unitLabel: "each",
            unitPriceCents: 0,
            awaitingWeight: false,
          },
        ],
  );
  const [taxDollars, setTaxDollars] = useState(
    (initialTaxCents / 100).toFixed(2),
  );
  const [discountDollars, setDiscountDollars] = useState(
    (initialDiscountCents / 100).toFixed(2),
  );

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, l) => sum + Math.round(l.quantity * l.unitPriceCents),
        0,
      ),
    [lines],
  );
  const taxCents = Math.round(Number(taxDollars || 0) * 100);
  const discountCents = Math.round(Number(discountDollars || 0) * 100);
  const total = Math.max(0, subtotal - discountCents + taxCents);

  if (!editable) {
    return (
      <div className="space-y-3 text-sm text-charcoal/70">
        {lines.map((l, i) => (
          <div key={i} className="flex justify-between gap-4 border-b border-charcoal/5 py-2">
            <div>
              <p className="font-medium text-charcoal">{l.description}</p>
              <p className="text-xs text-charcoal/50">
                {l.quantity} {l.unitLabel} × {formatCents(l.unitPriceCents)}
              </p>
            </div>
            <p className="font-medium text-charcoal">
              {formatCents(Math.round(l.quantity * l.unitPriceCents))}
            </p>
          </div>
        ))}
        <div className="flex justify-between pt-2">
          <span>Total</span>
          <span className="font-semibold text-charcoal">{formatCents(total)}</span>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="linesJson" value={JSON.stringify(lines)} />
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}

      <div className="space-y-4">
        {lines.map((line, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-xl border border-charcoal/10 bg-cream/40 p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-charcoal/60">Description</label>
              <input
                className={`${inputClass} mt-1`}
                value={line.description}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = { ...line, description: e.target.value };
                  setLines(next);
                }}
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60">
                Qty / hanging lbs
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`${inputClass} mt-1`}
                value={line.quantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = {
                    ...line,
                    quantity: Number(e.target.value),
                    awaitingWeight: false,
                  };
                  setLines(next);
                }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60">Unit</label>
              <select
                className={`${inputClass} mt-1`}
                value={line.unitLabel}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = { ...line, unitLabel: e.target.value };
                  setLines(next);
                }}
              >
                <option value="each">each</option>
                <option value="lb hanging">lb hanging</option>
                <option value="lb">lb</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-charcoal/60">
                Unit price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`${inputClass} mt-1`}
                value={(line.unitPriceCents / 100).toFixed(2)}
                onChange={(e) => {
                  const next = [...lines];
                  next[index] = {
                    ...line,
                    unitPriceCents: Math.round(Number(e.target.value) * 100),
                  };
                  setLines(next);
                }}
              />
            </div>
            <div className="flex items-end justify-between gap-2">
              <p className="text-sm font-medium text-charcoal">
                Line: {formatCents(Math.round(line.quantity * line.unitPriceCents))}
              </p>
              {lines.length > 1 ? (
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => setLines(lines.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="text-sm font-medium text-copper hover:underline"
        onClick={() =>
          setLines([
            ...lines,
            {
              description: "",
              quantity: 1,
              unitLabel: "each",
              unitPriceCents: 0,
              awaitingWeight: false,
            },
          ])
        }
      >
        + Add line
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-charcoal/60">Discount ($)</label>
          <input
            name="discountDollars"
            type="number"
            step="0.01"
            min="0"
            className={`${inputClass} mt-1`}
            value={discountDollars}
            onChange={(e) => setDiscountDollars(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-charcoal/60">Tax ($)</label>
          <input
            name="taxDollars"
            type="number"
            step="0.01"
            min="0"
            className={`${inputClass} mt-1`}
            value={taxDollars}
            onChange={(e) => setTaxDollars(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-charcoal/60">Notes</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initialNotes ?? ""}
          className={`${inputClass} mt-1`}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl bg-charcoal px-4 py-3 text-cream">
        <span className="text-sm">Estimated total</span>
        <span className="font-display text-xl font-semibold">
          {formatCents(total)}
        </span>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream hover:bg-copper/90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save invoice"}
      </button>
    </form>
  );
}
