"use client";

import { useActionState, useState } from "react";
import {
  updateProfileAction,
  type ProfileState,
} from "@/app/account/profile/actions";
import { formatPhoneDisplay, formatPhoneInput } from "@/lib/phone";

const initialState: ProfileState = {};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20";

export function ProfileForm({
  user,
}: {
  user: {
    name: string | null;
    phone: string | null;
    email: string;
    preferredFulfillment: "PICKUP" | "DELIVERY" | null;
    newsletterSubscribed: boolean;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const [phone, setPhone] = useState(formatPhoneDisplay(user.phone) || "");

  return (
    <form action={formAction} className="space-y-6">
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
        <label className="block text-sm font-medium text-charcoal">Email</label>
        <p className="mt-1.5 text-sm text-charcoal/70">{user.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-charcoal">
            Full name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={user.name ?? ""}
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
            required
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-charcoal">
          Preferred fulfillment
        </legend>
        <div className="mt-3 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input
              type="radio"
              name="preferredFulfillment"
              value="PICKUP"
              defaultChecked={user.preferredFulfillment !== "DELIVERY"}
            />
            Pickup
          </label>
          <label className="flex items-center gap-2 text-sm text-charcoal">
            <input
              type="radio"
              name="preferredFulfillment"
              value="DELIVERY"
              defaultChecked={user.preferredFulfillment === "DELIVERY"}
            />
            Delivery
          </label>
        </div>
      </fieldset>

      <div className="space-y-4 rounded-2xl border border-charcoal/10 bg-cream/40 p-4">
        <p className="text-sm font-medium text-charcoal">Default delivery address</p>
        <div>
          <label htmlFor="addressLine1" className="block text-sm font-medium text-charcoal">
            Street address
          </label>
          <input
            id="addressLine1"
            name="addressLine1"
            defaultValue={user.addressLine1 ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="addressLine2" className="block text-sm font-medium text-charcoal">
            Apt / suite
          </label>
          <input
            id="addressLine2"
            name="addressLine2"
            defaultValue={user.addressLine2 ?? ""}
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
              defaultValue={user.city ?? ""}
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
              maxLength={2}
              defaultValue={user.state ?? ""}
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
              defaultValue={user.zip ?? ""}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <fieldset className="rounded-2xl border border-charcoal/10 bg-cream/40 p-4">
        <legend className="px-1 text-sm font-medium text-charcoal">
          Newsletter
        </legend>
        <label className="mt-2 flex items-start gap-3 text-sm text-charcoal/80">
          <input
            type="checkbox"
            name="newsletter"
            defaultChecked={user.newsletterSubscribed}
            className="mt-1"
          />
          <span>
            Email me seasonal deals, pickup updates, and coupon codes.
          </span>
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
