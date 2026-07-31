import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { generateClaimToken } from "@/lib/guest-tokens";
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

function deliveryFields(customer: CheckoutCustomerInput) {
  if (customer.preferredFulfillment !== "DELIVERY") return {};
  return {
    addressLine1: customer.addressLine1,
    addressLine2: customer.addressLine2,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
  };
}

/**
 * Resolve the user for checkout:
 * - Signed-in session user (if provided)
 * - Existing guest (no password) → update profile
 * - Existing account with password → must sign in
 * - New email → create guest user (no password) with claim token
 */
export async function resolveCheckoutUser(input: {
  sessionUserId?: string | null;
  customer: CheckoutCustomerInput;
}): Promise<
  | { userId: string; email: string; isGuest: boolean; claimToken: string | null }
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

    const claimToken =
      !sessionUser.passwordHash && !sessionUser.claimToken
        ? generateClaimToken()
        : sessionUser.claimToken;

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        name: input.customer.name,
        phone: input.customer.phone,
        preferredFulfillment: input.customer.preferredFulfillment,
        ...deliveryFields(input.customer),
        ...(!sessionUser.passwordHash && claimToken && !sessionUser.claimToken
          ? { claimToken }
          : {}),
      },
    });

    return {
      userId: sessionUser.id,
      email: sessionUser.email,
      isGuest: !sessionUser.passwordHash,
      claimToken: sessionUser.passwordHash ? null : claimToken,
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
    const claimToken = existing.claimToken ?? generateClaimToken();
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: input.customer.name,
        phone: input.customer.phone,
        preferredFulfillment: input.customer.preferredFulfillment,
        ...deliveryFields(input.customer),
        ...(existing.claimToken ? {} : { claimToken }),
      },
    });
    return {
      userId: existing.id,
      email: existing.email,
      isGuest: true,
      claimToken,
    };
  }

  const claimToken = generateClaimToken();
  try {
    const created = await prisma.user.create({
      data: {
        email,
        name: input.customer.name,
        phone: input.customer.phone,
        passwordHash: null,
        claimToken,
        preferredFulfillment: input.customer.preferredFulfillment,
        addressLine1: input.customer.addressLine1,
        addressLine2: input.customer.addressLine2,
        city: input.customer.city,
        state: input.customer.state,
        zip: input.customer.zip,
      },
    });
    return {
      userId: created.id,
      email: created.email,
      isGuest: true,
      claimToken,
    };
  } catch (error) {
    // Concurrent guest checkout for the same email
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced = await prisma.user.findUnique({ where: { email } });
      if (raced?.passwordHash) {
        return {
          error:
            "An account already exists for this email. Please sign in to continue checkout.",
          needsLogin: true,
        };
      }
      if (raced) {
        const token = raced.claimToken ?? generateClaimToken();
        if (!raced.claimToken) {
          await prisma.user.update({
            where: { id: raced.id },
            data: { claimToken: token },
          });
        }
        return {
          userId: raced.id,
          email: raced.email,
          isGuest: true,
          claimToken: token,
        };
      }
    }
    throw error;
  }
}
