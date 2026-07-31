"use client";

import { useActionState, useState } from "react";
import {
  createCheckoutSessionAction,
  type CheckoutState,
} from "@/app/checkout/actions";
import { formatPhoneDisplay, formatPhoneInput } from "@/lib/phone";

const initialState: CheckoutState = {};

export function CheckoutForm({
  defaultName,
  defaultPhone,
}: {
  defaultName?: string | null;
  defaultPhone?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    createCheckoutSessionAction,
    initialState,
  );
  const [phone, setPhone] = useState(formatPhoneDisplay(defaultPhone) || "");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CASH" | "CHECK">(
    "CARD",
  );

  const submitLabel =
    paymentMethod === "CARD"
      ? pending
        ? "Redirecting to Stripe…"
        : "Pay securely with Stripe"
      : pending
        ? "Placing order…"
        : "Place order — pay at pickup / delivery";

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-charcoal">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={defaultName ?? ""}
            className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-charcoal">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-charcoal">Fulfillment</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-charcoal/15 bg-white p-4 has-[:checked]:border-copper has-[:checked]:ring-1 has-[:checked]:ring-copper">
            <input
              type="radio"
              name="fulfillmentType"
              value="PICKUP"
              defaultChecked
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-charcoal">Local pickup</span>
              <span className="mt-0.5 block text-xs text-charcoal/60">
                Ready for pickup after we confirm your order
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-charcoal/15 bg-white p-4 has-[:checked]:border-copper has-[:checked]:ring-1 has-[:checked]:ring-copper">
            <input type="radio" name="fulfillmentType" value="DELIVERY" className="mt-1" />
            <span>
              <span className="block font-medium text-charcoal">Local delivery</span>
              <span className="mt-0.5 block text-xs text-charcoal/60">
                Available in our service area — we&apos;ll confirm
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-charcoal">Payment</legend>
        <div className="mt-3 space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-charcoal/15 bg-white p-4 has-[:checked]:border-copper has-[:checked]:ring-1 has-[:checked]:ring-copper">
            <input
              type="radio"
              name="paymentMethod"
              value="CARD"
              checked={paymentMethod === "CARD"}
              onChange={() => setPaymentMethod("CARD")}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-charcoal">Pay with card</span>
              <span className="mt-0.5 block text-xs text-charcoal/60">
                Secure checkout with Stripe
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-charcoal/15 bg-white p-4 has-[:checked]:border-copper has-[:checked]:ring-1 has-[:checked]:ring-copper">
            <input
              type="radio"
              name="paymentMethod"
              value="CASH"
              checked={paymentMethod === "CASH"}
              onChange={() => setPaymentMethod("CASH")}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-charcoal">Cash at pickup / delivery</span>
              <span className="mt-0.5 block text-xs text-charcoal/60">
                Pay when you receive your order
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-charcoal/15 bg-white p-4 has-[:checked]:border-copper has-[:checked]:ring-1 has-[:checked]:ring-copper">
            <input
              type="radio"
              name="paymentMethod"
              value="CHECK"
              checked={paymentMethod === "CHECK"}
              onChange={() => setPaymentMethod("CHECK")}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-charcoal">Check at pickup / delivery</span>
              <span className="mt-0.5 block text-xs text-charcoal/60">
                Bring a check when you receive your order
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor="pickupDate" className="block text-sm font-medium text-charcoal">
          Preferred pickup / delivery date
        </label>
        <input
          id="pickupDate"
          name="pickupDate"
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20 sm:max-w-xs"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-charcoal">
          Order notes <span className="font-normal text-charcoal/50">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={500}
          placeholder="Special instructions, cut preferences…"
          className="mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-copper py-3.5 text-sm font-semibold text-cream hover:bg-copper/90 disabled:opacity-60 transition-colors"
      >
        {submitLabel}
      </button>

      <p className="text-center text-xs text-charcoal/50">
        {paymentMethod === "CARD"
          ? "Card details are handled by Stripe — we never store your payment information."
          : "Your order is reserved. Payment is due when you pick up or receive delivery."}
      </p>
    </form>
  );
}
