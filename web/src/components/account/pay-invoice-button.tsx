"use client";

import { useTransition } from "react";
import { payInvoiceAction } from "@/app/admin/invoice-actions";

export function PayInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await payInvoiceAction(invoiceId);
          if (result.url) {
            window.location.href = result.url;
            return;
          }
          alert(result.error || "Unable to start payment");
        });
      }}
      className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream hover:bg-copper/90 disabled:opacity-60"
    >
      {pending ? "Redirecting to Stripe…" : "Pay with card"}
    </button>
  );
}
