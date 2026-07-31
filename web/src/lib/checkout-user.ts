import { prisma } from "@/lib/prisma";
import type { FulfillmentType } from "@/generated/prisma/enums";

export type CheckoutCustomerInput = {
  email: string;
  name: string;
  phone: string;
  preferredFulfillment?: FulfillmentType;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

/**
 * Resolve the user for checkout:
 * - Signed-in session user (if provided)
 * - Existing guest (no password) → update profile
 * - Existing account with password → must sign in
 * - New email → create guest user (no password)
 */
export async function resolveCheckoutUser(input: {
  sessionUserId?: string | null;
  customer: CheckoutCustomerInput;
}): Promise<
  | { userId: string; email: string; isGuest: boolean }
  | { error: string; needsLogin?: boolean }
> {
  const email = input.customer.email.toLowerCase().trim();

  if (input.sessionUserId) {
    const sessionUser = await prisma.user.findUnique({
      where: { id: input.sessionUserId },
    });
    if (!sessionUser) {
      return { error: "Session expired. Please sign in again." };
    }

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        name: input.customer.name,
        phone: input.customer.phone,
        preferredFulfillment: input.customer.preferredFulfillment,
        ...(input.customer.preferredFulfillment === "DELIVERY"
          ? {
              addressLine1: input.customer.addressLine1,
              addressLine2: input.customer.addressLine2,
              city: input.customer.city,
              state: input.customer.state,
              zip: input.customer.zip,
            }
          : {}),
      },
    });

    return {
      userId: sessionUser.id,
      email: sessionUser.email,
      isGuest: !sessionUser.passwordHash,
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.passwordHash) {
    return {
      error:
        "An account already exists for this email. Please sign in to continue checkout.",
      needsLogin: true,
    };
  }

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: input.customer.name,
        phone: input.customer.phone,
        preferredFulfillment: input.customer.preferredFulfillment,
        ...(input.customer.preferredFulfillment === "DELIVERY"
          ? {
              addressLine1: input.customer.addressLine1,
              addressLine2: input.customer.addressLine2,
              city: input.customer.city,
              state: input.customer.state,
              zip: input.customer.zip,
            }
          : {}),
      },
    });
    return { userId: existing.id, email: existing.email, isGuest: true };
  }

  const created = await prisma.user.create({
    data: {
      email,
      name: input.customer.name,
      phone: input.customer.phone,
      passwordHash: null,
      preferredFulfillment: input.customer.preferredFulfillment,
      addressLine1: input.customer.addressLine1,
      addressLine2: input.customer.addressLine2,
      city: input.customer.city,
      state: input.customer.state,
      zip: input.customer.zip,
    },
  });

  return { userId: created.id, email: created.email, isGuest: true };
}
