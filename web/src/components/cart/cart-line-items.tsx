"use client";

import { useTransition } from "react";
import Link from "next/link";
import { removeFromCartAction, updateCartQuantityAction } from "@/app/cart/actions";
import { formatCents } from "@/lib/format";
import type { CartItem } from "@/lib/cart";

export function CartLineItems({ items }: { items: CartItem[] }) {
  const [isPending, startTransition] = useTransition();

  function handleQuantityChange(productId: string, quantity: number) {
    startTransition(async () => {
      await updateCartQuantityAction(productId, quantity);
    });
  }

  function handleRemove(productId: string) {
    startTransition(async () => {
      await removeFromCartAction(productId);
    });
  }

  return (
    <ul className="divide-y divide-charcoal/10">
      {items.map((item) => (
        <li
          key={item.productId}
          className={`flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between ${isPending ? "opacity-60" : ""}`}
        >
          <div>
            <Link
              href={`/shop/${item.slug}`}
              className="font-display text-lg font-semibold text-charcoal hover:text-copper"
            >
              {item.name}
            </Link>
            {item.weightLabel && (
              <p className="text-sm text-charcoal/50">{item.weightLabel}</p>
            )}
            <p className="mt-1 text-sm text-charcoal/70">
              {formatCents(item.priceCents)} each
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={item.quantity}
              onChange={(e) =>
                handleQuantityChange(item.productId, Number(e.target.value))
              }
              disabled={isPending}
              className="rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal"
              aria-label={`Quantity for ${item.name}`}
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            <p className="min-w-24 text-right font-semibold text-charcoal">
              {formatCents(item.priceCents * item.quantity)}
            </p>

            <button
              type="button"
              onClick={() => handleRemove(item.productId)}
              disabled={isPending}
              className="text-sm text-charcoal/50 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
