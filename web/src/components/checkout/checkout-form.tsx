"use client";

import { useActionState, useState } from "react";
import {
  createCheckoutSessionAction,
  type CheckoutState,
} from "@/app/checkout/actions";
import { formatPhoneDisplay, formatPhoneInput } from "@/lib/phone";

const initialState: CheckoutState = {};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20";

export function CheckoutForm({
  defaultName,
  defaultPhone,
  defaultAddress,
  defaultFulfillment,
}: {
  defaultName?: string | null;
  defaultPhone?: string | null;
  defaultFulfillment?: "PICKUP" | "DELIVERY" | null;
  defaultAddress?: {
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(
    createCheckoutSessionAction,
    initialState,
  );
  const [phone, setPhone] = useState(formatPhoneDisplay(defaultPhone) || "");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CASH" | "CHECK">(
    "CARD",
  );
  const [fulfillmentType, setFulfillmentType] = useState<"PICKUP" | "DELIVERY">(
    defaultFulfillment === "DELIVERY" ? "DELIVERY" : "PICKUP",
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
            className={inputClass}
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
            className={inputClass}
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
              checked={fulfillmentType === "PICKUP"}
              onChange={() => setFulfillmentType("PICKUP")}
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
            <input
              type="radio"
              name="fulfillmentType"
              value="DELIVERY"
              checked={fulfillmentType === "DELIVERY"}
              onChange={() => setFulfillmentType("DELIVERY")}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-charcoal">Local delivery</span>
              <span className="mt-0.5 block text-xs text-charcoal/60">
                Available in our service area — we&apos;ll confirm
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {fulfillmentType === "DELIVERY" && (
        <fieldset className="space-y-4 rounded-2xl border border-charcoal/10 bg-cream/40 p-4">
          <legend className="px-1 text-sm font-medium text-charcoal">
            Delivery address
          </legend>

          <div>
            <label htmlFor="addressLine1" className="block text-sm font-medium text-charcoal">
              Street address
            </label>
            <input
              id="addressLine1"
              name="addressLine1"
              type="text"
              required
              autoComplete="address-line1"
              defaultValue={defaultAddress?.addressLine1 ?? ""}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="addressLine2" className="block text-sm font-medium text-charcoal">
              Apt / suite{" "}
              <span className="font-normal text-charcoal/50">(optional)</span>
            </label>
            <input
              id="addressLine2"
              name="addressLine2"
              type="text"
              autoComplete="address-line2"
              defaultValue={defaultAddress?.addressLine2 ?? ""}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="city" className="block text-sm font-medium text-charcoal">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                required
                autoComplete="address-level2"
                defaultValue={defaultAddress?.city ?? ""}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-1">
              <label htmlFor="state" className="block text-sm font-medium text-charcoal">
                State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                required
                maxLength={2}
                autoComplete="address-level1"
                placeholder="TX"
                defaultValue={defaultAddress?.state ?? ""}
                className={`${inputClass} uppercase`}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="zip" className="block text-sm font-medium text-charcoal">
                ZIP
              </label>
              <input
                id="zip"
                name="zip"
                type="text"
                required
                autoComplete="postal-code"
                inputMode="numeric"
                placeholder="12345"
                defaultValue={defaultAddress?.zip ?? ""}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="deliveryInstructions"
              className="block text-sm font-medium text-charcoal"
            >
              Delivery instructions
            </label>
            <textarea
              id="deliveryInstructions"
              name="deliveryInstructions"
              rows={3}
              maxLength={500}
              placeholder="Gate code, where to leave coolers, dogs, landmarks…"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-charcoal/50">
              Helps our team find you and handle the delivery safely.
            </p>
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="text-sm font-medium text-charcoal">Payment</legend>
        <div className="mt-3 space-y-3">
          {(
            [
              {
                value: "CARD" as const,
                title: "Pay with card",
                body: "Secure checkout with Stripe",
              },
              {
                value: "CASH" as const,
                title: "Cash at pickup / delivery",
                body: "Pay when you receive your order",
              },
              {
                value: "CHECK" as const,
                title: "Check at pickup / delivery",
                body: "Bring a check when you receive your order",
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-charcoal/15 bg-white p-4 has-[:checked]:border-copper has-[:checked]:ring-1 has-[:checked]:ring-copper"
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.value}
                checked={paymentMethod === option.value}
                onChange={() => setPaymentMethod(option.value)}
                className="mt-1"
              />
              <span>
                <span className="block font-medium text-charcoal">{option.title}</span>
                <span className="mt-0.5 block text-xs text-charcoal/60">{option.body}</span>
              </span>
            </label>
          ))}
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
          className={`${inputClass} sm:max-w-xs`}
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
          className={inputClass}
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
