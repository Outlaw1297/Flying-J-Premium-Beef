import { prisma } from "@/lib/prisma";
import {
  NewsletterSource,
  NewsletterStatus,
} from "@/generated/prisma/enums";
import { getAppUrl } from "@/lib/stripe";

export type SubscribeInput = {
  email: string;
  source: "FOOTER" | "CHECKOUT" | "POPUP" | "ACCOUNT";
  userId?: string | null;
  sendWelcome?: boolean;
};

export async function subscribeToNewsletter(
  input: SubscribeInput,
): Promise<{ ok: true; created: boolean } | { error: string }> {
  const email = input.email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address" };
  }

  const source =
    input.source === "CHECKOUT"
      ? NewsletterSource.CHECKOUT
      : input.source === "POPUP"
        ? NewsletterSource.POPUP
        : input.source === "ACCOUNT"
          ? NewsletterSource.ACCOUNT
          : NewsletterSource.FOOTER;

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (existing?.status === NewsletterStatus.ACTIVE) {
    if (input.userId && !existing.userId) {
      await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { userId: input.userId },
      });
    }
    if (input.userId) {
      await prisma.user.update({
        where: { id: input.userId },
        data: { newsletterSubscribed: true },
      });
    }
    return { ok: true, created: false };
  }

  if (existing) {
    await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        status: NewsletterStatus.ACTIVE,
        source,
        subscribedAt: new Date(),
        unsubscribedAt: null,
        userId: input.userId ?? existing.userId,
      },
    });
  } else {
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        source,
        status: NewsletterStatus.ACTIVE,
        userId: input.userId ?? null,
      },
    });
  }

  if (input.userId) {
    await prisma.user.update({
      where: { id: input.userId },
      data: { newsletterSubscribed: true },
    });
  }

  if (input.sendWelcome !== false) {
    await sendWelcomeNewsletterEmail(email).catch((err) =>
      console.error("Welcome newsletter email failed:", err),
    );
  }

  return { ok: true, created: !existing };
}

export async function unsubscribeFromNewsletter(
  email: string,
): Promise<{ ok: true } | { error: string }> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return { error: "Email is required" };

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: normalized },
  });

  if (existing) {
    await prisma.newsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        status: NewsletterStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date(),
      },
    });
    if (existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { newsletterSubscribed: false },
      });
    }
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { newsletterSubscribed: false },
    });
  }

  return { ok: true };
}

async function sendWelcomeNewsletterEmail(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY ?? process.env.EMAIL_API_KEY;
  const from =
    process.env.EMAIL_FROM ?? "Flying J Premium Beef <onboarding@resend.dev>";

  if (!apiKey) {
    console.info(`[email skipped] Newsletter welcome for ${to}`);
    return;
  }

  const shopUrl = `${getAppUrl()}/shop`;
  const unsubUrl = `${getAppUrl()}/newsletter/unsubscribe?email=${encodeURIComponent(to)}`;

  const html = `
    <div style="font-family: Georgia, serif; color: #1c1917;">
      <h1 style="font-size: 22px;">Welcome to Flying J Premium Beef</h1>
      <p>Thanks for joining our list. We'll share seasonal cuts, pickup updates, and exclusive coupon codes.</p>
      <p><a href="${shopUrl}">Browse our cuts</a></p>
      <p style="color:#78716c;font-size:12px;">
        <a href="${unsubUrl}">Unsubscribe</a> anytime.
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Welcome to Flying J Premium Beef",
      html,
    }),
  });

  if (!res.ok) {
    console.error("Welcome email failed:", await res.text());
  }
}
