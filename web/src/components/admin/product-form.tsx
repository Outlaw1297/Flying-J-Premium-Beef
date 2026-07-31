"use client";

import { useActionState } from "react";
import {
  upsertProductAction,
  type AdminFormState,
} from "@/app/admin/actions";

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
    active: boolean;
  } | null;
}) {
  const [state, formAction, pending] = useActionState(
    upsertProductAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
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
        </div>
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-charcoal">
            Slug
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={product?.slug ?? ""}
            placeholder="auto from name"
            className={inputClass}
          />
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
        <div>
          <label htmlFor="imageUrl" className="block text-sm font-medium text-charcoal">
            Image URL
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            defaultValue={product?.imageUrl ?? ""}
            className={inputClass}
          />
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
