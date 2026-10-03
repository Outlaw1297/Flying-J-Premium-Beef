"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { setSetting } from "@/lib/app-settings";

export type StripeKeysState = { error?: string; success?: string };

function looksLikeSecret(value: string): boolean {
  return /^(sk|rk)_(test|live)_/.test(value);
}

function looksLikePublishable(value: string): boolean {
  return /^pk_(test|live)_/.test(value);
}

function looksLikeWebhook(value: string): boolean {
  return value.startsWith("whsec_");
}

export async function saveStripeKeysAction(
  _prev: StripeKeysState,
  formData: FormData,
): Promise<StripeKeysState> {
  await requireAdmin();

  const secret = String(formData.get("secretKey") ?? "").trim();
  const publishable = String(formData.get("publishableKey") ?? "").trim();
  const webhook = String(formData.get("webhookSecret") ?? "").trim();

  if (!secret && !publishable && !webhook) {
    return { error: "Paste at least one key. Leave a field blank to keep the saved value." };
  }

  if (secret && !looksLikeSecret(secret)) {
    return {
      error: "Secret key should start with sk_test_, sk_live_, rk_test_, or rk_live_.",
    };
  }
  if (publishable && !looksLikePublishable(publishable)) {
    return { error: "Publishable key should start with pk_test_ or pk_live_." };
  }
  if (webhook && !looksLikeWebhook(webhook)) {
    return { error: "Webhook secret should start with whsec_." };
  }

  if (secret) await setSetting("stripe_secret_key", secret);
  if (publishable) await setSetting("stripe_publishable_key", publishable);
  if (webhook) await setSetting("stripe_webhook_secret", webhook);

  revalidatePath("/admin/payments");
  return { success: "Stripe keys saved. Card checkout can use them now." };
}
