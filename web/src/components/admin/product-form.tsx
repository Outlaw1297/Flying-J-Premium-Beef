"use client";

import { useActionState, useMemo, useState } from "react";
import {
  upsertProductAction,
  type AdminFormState,
} from "@/app/admin/actions";
import {
  DEFAULT_PRODUCT_TAX_CODE,
  STRIPE_TAX_CODES,
} from "@/lib/stripe-tax-codes";

const initialState: AdminFormState = {};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20";

export function ProductForm({
  product,
}: {
  product?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    priceCents: number;
    weightLabel: string | null;
    inventoryCount: number;
    category: string | null;
    imageUrl: string | null;
    stripeTaxCode?: string | null;
    pricingMode?: "FIXED" | "PER_POUND_HANGING";
    estimatedLbs?: number | null;
    active: boolean;
  } | null;
}) {
  const [state, formAction, pending] = useActionState(
    upsertProductAction,
    initialState,
  );
  const [preview, setPreview] = useState<string | null>(product?.imageUrl ?? null);
  const [taxFilter, setTaxFilter] = useState("");
  const selectedTax =
    product?.stripeTaxCode?.trim() || DEFAULT_PRODUCT_TAX_CODE;

  const taxOptions = useMemo(() => {
    const q = taxFilter.trim().toLowerCase();
    const filtered = !q
      ? STRIPE_TAX_CODES
      : STRIPE_TAX_CODES.filter(
          (c) =>
            c.id.toLowerCase().includes(q) ||
            c.name.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q),
        );
    // Keep the current selection visible even when the filter would hide it
    if (!filtered.some((c) => c.id === selectedTax)) {
      const current = STRIPE_TAX_CODES.find((c) => c.id === selectedTax);
      if (current) return [current, ...filtered];
    }
    return filtered;
  }, [taxFilter, selectedTax]);

  const physical = taxOptions.filter((c) => c.type === "Physical goods");
  const services = taxOptions.filter((c) => c.type !== "Physical goods");

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-charcoal">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={product?.name ?? ""}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-charcoal/50">
            Shop URL is created automatically from the name.
          </p>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-charcoal">
            Category
          </label>
          <input
            id="category"
            name="category"
            defaultValue={product?.category ?? ""}
            placeholder="steaks, ground, bundles…"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="priceDollars" className="block text-sm font-medium text-charcoal">
            Price ($)
          </label>
          <input
            id="priceDollars"
            name="priceDollars"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={
              product ? (product.priceCents / 100).toFixed(2) : ""
            }
            className={inputClass}
          />
          <p className="mt-1 text-xs text-charcoal/50">
            Package price, or $ per hanging lb for halves/quarters.
          </p>
        </div>
        <div>
          <label htmlFor="pricingMode" className="block text-sm font-medium text-charcoal">
            Pricing
          </label>
          <select
            id="pricingMode"
            name="pricingMode"
            defaultValue={product?.pricingMode ?? "FIXED"}
            className={inputClass}
          >
            <option value="FIXED">Fixed package price</option>
            <option value="PER_POUND_HANGING">Per lb hanging weight</option>
          </select>
        </div>
        <div>
          <label htmlFor="estimatedLbs" className="block text-sm font-medium text-charcoal">
            Est. hanging lbs
          </label>
          <input
            id="estimatedLbs"
            name="estimatedLbs"
            type="number"
            step="0.1"
            min="0"
            defaultValue={product?.estimatedLbs ?? ""}
            placeholder="e.g. 350 for a half"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-charcoal/50">
            Optional estimate shown at checkout. Final lbs set on the invoice.
          </p>
        </div>
        <div>
          <label htmlFor="inventoryCount" className="block text-sm font-medium text-charcoal">
            Inventory
          </label>
          <input
            id="inventoryCount"
            name="inventoryCount"
            type="number"
            min="0"
            required
            defaultValue={product?.inventoryCount ?? 0}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="weightLabel" className="block text-sm font-medium text-charcoal">
            Weight label
          </label>
          <input
            id="weightLabel"
            name="weightLabel"
            defaultValue={product?.weightLabel ?? ""}
            placeholder="~1 lb"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="image" className="block text-sm font-medium text-charcoal">
            Product photo
          </label>
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Product preview"
              className="mt-2 h-40 w-full max-w-sm rounded-xl object-cover border border-charcoal/10"
            />
          )}
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-charcoal file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-cream`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                setPreview(product?.imageUrl ?? null);
                return;
              }
              const url = URL.createObjectURL(file);
              setPreview(url);
            }}
          />
          <p className="mt-1 text-xs text-charcoal/50">
            JPEG, PNG, or WebP up to 2.5 MB
            {product?.imageUrl ? " · Leave empty to keep the current photo" : ""}.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="stripeTaxCode" className="block text-sm font-medium text-charcoal">
            Stripe tax code
          </label>
          <input
            type="search"
            value={taxFilter}
            onChange={(e) => setTaxFilter(e.target.value)}
            placeholder="Filter tax codes (e.g. meat, grocery, food…)"
            className={inputClass}
            aria-label="Filter Stripe tax codes"
          />
          <select
            id="stripeTaxCode"
            name="stripeTaxCode"
            required
            defaultValue={selectedTax}
            className={`${inputClass} mt-2`}
            size={8}
          >
            {physical.length > 0 && (
              <optgroup label="Physical goods">
                {physical.map((code) => (
                  <option key={code.id} value={code.id} title={code.description}>
                    {code.name} — {code.id}
                  </option>
                ))}
              </optgroup>
            )}
            {services.length > 0 && (
              <optgroup label="Services & other">
                {services.map((code) => (
                  <option key={code.id} value={code.id} title={code.description}>
                    {code.name} — {code.id}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <p className="mt-1 text-xs text-charcoal/50">
            Default for beef is{" "}
            <span className="font-medium">Meat and Meat Products</span> (
            {DEFAULT_PRODUCT_TAX_CODE}). Synced to Stripe on save.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-charcoal">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product?.description ?? ""}
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
          />
          Active in shop
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60"
      >
        {pending ? "Saving…" : product ? "Save product" : "Create product"}
      </button>
    </form>
  );
}
