"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { formatPhoneDisplay, normalizeUsPhone } from "@/lib/phone";
import { prisma } from "@/lib/prisma";
import { FulfillmentType } from "@/generated/prisma/enums";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(7, "Phone is required").max(30),
  preferredFulfillment: z.enum(["PICKUP", "DELIVERY"]).optional(),
  addressLine1: z.string().max(120).optional(),
  addressLine2: z.string().max(120).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(2).optional(),
  zip: z.string().max(10).optional(),
});

export type ProfileState = { error?: string; success?: string };

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    preferredFulfillment: formData.get("preferredFulfillment") || undefined,
    addressLine1: formData.get("addressLine1") || undefined,
    addressLine2: formData.get("addressLine2") || undefined,
    city: formData.get("city") || undefined,
    state: formData.get("state") || undefined,
    zip: formData.get("zip") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const phoneDigits = normalizeUsPhone(parsed.data.phone);
  if (!phoneDigits) {
    return { error: "Enter a valid 10-digit US phone number" };
  }

  const emptyToNull = (v?: string) => {
    const t = v?.trim();
    return t ? t : null;
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      phone: formatPhoneDisplay(phoneDigits),
      preferredFulfillment:
        parsed.data.preferredFulfillment === "DELIVERY"
          ? FulfillmentType.DELIVERY
          : parsed.data.preferredFulfillment === "PICKUP"
            ? FulfillmentType.PICKUP
            : null,
      addressLine1: emptyToNull(parsed.data.addressLine1),
      addressLine2: emptyToNull(parsed.data.addressLine2),
      city: emptyToNull(parsed.data.city),
      state: emptyToNull(parsed.data.state?.toUpperCase()),
      zip: emptyToNull(parsed.data.zip),
    },
  });

  const wantNewsletter = formData.get("newsletter") === "on";
  const { subscribeToNewsletter, unsubscribeFromNewsletter } = await import(
    "@/lib/newsletter"
  );
  if (wantNewsletter) {
    await subscribeToNewsletter({
      email: session.user.email!,
      source: "ACCOUNT",
      userId: session.user.id,
      sendWelcome: false,
    });
  } else {
    await unsubscribeFromNewsletter(session.user.email!);
  }

  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/checkout");

  return { success: "Profile saved" };
}
