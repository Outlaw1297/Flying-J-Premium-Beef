import type { Metadata } from "next";
import Link from "next/link";
import { StripeKeysForm } from "@/components/admin/stripe-keys-form";
import { requireAdmin } from "@/lib/admin";
import {
  getAppUrl,
  getStripePublishableKey,
  getStripeSecretKey,
  getStripeWebhookSecret,
  maskSecret,
} from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Payments",
};

export default async function AdminPaymentsPage() {
  await requireAdmin();

  const [secret, publishable, webhook] = await Promise.all([
    getStripeSecretKey(),
    getStripePublishableKey(),
    getStripeWebhookSecret(),
  ]);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/admin" className="text-sm font-medium text-copper hover:underline">
        ← Dashboard
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold text-charcoal">
        Stripe payments
      </h1>
      <p className="mt-2 text-sm text-charcoal/70">
        Paste the API keys from the Stripe Dashboard. Leave a box empty to keep
        the key already saved.
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-5 sm:p-6">
        <StripeKeysForm
          secretHint={maskSecret(secret)}
          publishableHint={maskSecret(publishable)}
          webhookHint={maskSecret(webhook)}
          webhookUrl={`${getAppUrl()}/api/stripe/webhook`}
        />
      </div>
    </div>
  );
}
