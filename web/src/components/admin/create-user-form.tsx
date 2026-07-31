"use client";

import { useActionState } from "react";
import {
  createUserAction,
  type AdminUserFormState,
} from "@/app/admin/user-actions";

const initialState: AdminUserFormState = {};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3 py-2.5 text-sm text-charcoal shadow-sm focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/20";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(
    createUserAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 break-all">
          {state.success}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-charcoal">
            Name
          </label>
          <input id="name" name="name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-charcoal">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="role" className="text-sm font-medium text-charcoal">
            Role
          </label>
          <select id="role" name="role" defaultValue="CUSTOMER" className={inputClass}>
            <option value="CUSTOMER">Customer</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-charcoal">
            Password <span className="font-normal text-charcoal/50">(optional)</span>
          </label>
          <input
            id="password"
            name="password"
            type="text"
            minLength={8}
            placeholder="Auto-generated if blank"
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-charcoal">
        <input type="checkbox" name="sendInvite" defaultChecked />
        Email them a login invite (includes temporary password)
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-cream hover:bg-charcoal/90 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
