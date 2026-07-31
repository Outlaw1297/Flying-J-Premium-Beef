"use client";

import { useActionState } from "react";
import {
  createSupportTicketAction,
  type SupportFormState,
} from "@/app/account/support/actions";

const initialState: SupportFormState = {};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20";

export function NewTicketForm({
  orders,
  defaultOrderId,
  defaultSubject,
}: {
  orders: { id: string; label: string }[];
  defaultOrderId?: string | null;
  defaultSubject?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    createSupportTicketAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-charcoal">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          maxLength={120}
          defaultValue={defaultSubject ?? ""}
          placeholder="Pickup timing, wrong cut, refund question…"
          className={inputClass}
        />
      </div>

      {orders.length > 0 && (
        <div>
          <label htmlFor="orderId" className="block text-sm font-medium text-charcoal">
            Related order{" "}
            <span className="font-normal text-charcoal/50">(optional)</span>
          </label>
          <select
            id="orderId"
            name="orderId"
            defaultValue={defaultOrderId ?? ""}
            className={inputClass}
          >
            <option value="">No specific order</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-charcoal">
          How can we help?
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={6}
          maxLength={4000}
          placeholder="Share details, preferred pickup times, or what went wrong…"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-copper px-6 py-3 text-sm font-semibold text-cream hover:bg-copper/90 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
