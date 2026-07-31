"use client";

import { useState } from "react";

export function SyncStripeButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSync() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/sync-stripe-products", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Sync failed");
        return;
      }
      setMessage(
        `Synced ${data.synced} product(s)` +
          (data.failed ? `, ${data.failed} failed` : ""),
      );
    } catch {
      setMessage("Sync request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleSync}
        disabled={pending}
        className="rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60"
      >
        {pending ? "Syncing…" : "Sync products to Stripe"}
      </button>
      {message && <p className="text-sm text-charcoal/70">{message}</p>}
    </div>
  );
}
