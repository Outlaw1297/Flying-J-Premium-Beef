import Stripe from "stripe";
import { getSetting } from "@/lib/app-settings";

async function settingOrEnv(key: string, envName: string): Promise<string | null> {
  const stored = await getSetting(key);
  if (stored) return stored;
  const fromEnv = process.env[envName]?.trim();
  return fromEnv || null;
}

export async function getStripeSecretKey(): Promise<string | null> {
  return settingOrEnv("stripe_secret_key", "STRIPE_SECRET_KEY");
}

export async function getStripePublishableKey(): Promise<string | null> {
  return settingOrEnv("stripe_publishable_key", "STRIPE_PUBLISHABLE_KEY");
}

export async function getStripeWebhookSecret(): Promise<string | null> {
  return settingOrEnv("stripe_webhook_secret", "STRIPE_WEBHOOK_SECRET");
}

export async function getStripe(): Promise<Stripe> {
  const key = await getStripeSecretKey();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, {
    apiVersion: "2026-07-29.dahlia",
  });
}

export function getAppUrl(): string {
  return (
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function maskSecret(value: string | null): string | null {
  if (!value) return null;
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 7)}…${value.slice(-4)}`;
}
