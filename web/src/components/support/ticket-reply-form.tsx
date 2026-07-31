"use client";

import { useActionState } from "react";
import {
  replySupportTicketAction,
  type SupportFormState,
} from "@/app/account/support/actions";

const initialState: SupportFormState = {};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20";

export function TicketReplyForm({
  ticketId,
  isAdmin = false,
  currentStatus = "OPEN",
}: {
  ticketId: string;
  isAdmin?: boolean;
  currentStatus?: "OPEN" | "PENDING" | "RESOLVED";
}) {
  const [state, formAction, pending] = useActionState(
    replySupportTicketAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="ticketId" value={ticketId} />
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-copper/30 bg-copper/10 px-4 py-3 text-sm text-copper">
          {state.success}
        </div>
      )}

      <div>
        <label htmlFor="body" className="block text-sm font-medium text-charcoal">
          {isAdmin ? "Reply" : "Add a reply"}
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={4}
          maxLength={4000}
          className={inputClass}
        />
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-4 text-sm text-charcoal/80">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="isInternal" />
            Internal note (staff only)
          </label>
          <label className="flex items-center gap-2">
            Status
            <select
              name="status"
              defaultValue={currentStatus}
              className="rounded-lg border border-charcoal/15 bg-white px-2 py-1"
            >
              <option value="OPEN">Open</option>
              <option value="PENDING">Pending</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </label>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reply"}
      </button>
    </form>
  );
}
