"use server";

import { auth } from "@/lib/auth";
import { subscribeToNewsletter, unsubscribeFromNewsletter } from "@/lib/newsletter";
import { revalidatePath } from "next/cache";

export type NewsletterFormState = {
  error?: string;
  success?: string;
};

export async function subscribeNewsletterAction(
  _prev: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const email = String(formData.get("email") || "");
  const sourceRaw = String(formData.get("source") || "FOOTER");
  const source =
    sourceRaw === "CHECKOUT" ||
    sourceRaw === "POPUP" ||
    sourceRaw === "ACCOUNT"
      ? sourceRaw
      : "FOOTER";

  const session = await auth();
  const result = await subscribeToNewsletter({
    email,
    source,
    userId: session?.user?.id,
  });

  if ("error" in result) return { error: result.error };

  return {
    success: result.created
      ? "You're on the list — welcome!"
      : "You're already subscribed. Thanks!",
  };
}

export async function unsubscribeNewsletterAction(
  _prev: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const email = String(formData.get("email") || "");
  const result = await unsubscribeFromNewsletter(email);
  if ("error" in result) return { error: result.error };
  return { success: "You've been unsubscribed." };
}

export async function updateNewsletterPreferenceAction(
  _prev: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { error: "You must be signed in" };
  }

  const subscribe = formData.get("newsletter") === "on";

  if (subscribe) {
    const result = await subscribeToNewsletter({
      email: session.user.email,
      source: "ACCOUNT",
      userId: session.user.id,
      sendWelcome: false,
    });
    if ("error" in result) return { error: result.error };
  } else {
    await unsubscribeFromNewsletter(session.user.email);
  }

  revalidatePath("/account/profile");
  return {
    success: subscribe
      ? "Subscribed to the newsletter"
      : "Unsubscribed from the newsletter",
  };
}
