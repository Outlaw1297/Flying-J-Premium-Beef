"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type RegisterState = { error?: string };

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const claim = String(formData.get("claim") || "").trim();
  const newsletter = formData.get("newsletter") === "on";

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  const emailStr = String(email).toLowerCase().trim();
  const passwordStr = String(password);
  const nameStr = String(name).trim();

  if (passwordStr.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const passwordHash = await hash(passwordStr, 12);
  const existing = await prisma.user.findUnique({ where: { email: emailStr } });

  if (existing?.passwordHash) {
    return { error: "An account with this email already exists" };
  }

  if (existing) {
    // Guest claim requires the token from the order confirmation page
    if (!claim || !existing.claimToken || claim !== existing.claimToken) {
      return {
        error:
          "To claim this guest order, use the Create account link from your order confirmation page.",
      };
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: nameStr,
        passwordHash,
        claimToken: null,
        newsletterSubscribed: newsletter || existing.newsletterSubscribed,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email: emailStr,
        name: nameStr,
        passwordHash,
        newsletterSubscribed: newsletter,
      },
    });
  }

  if (newsletter) {
    const { subscribeToNewsletter } = await import("@/lib/newsletter");
    await subscribeToNewsletter({
      email: emailStr,
      source: "ACCOUNT",
      userId:
        existing?.id ??
        (await prisma.user.findUnique({ where: { email: emailStr } }))?.id,
      sendWelcome: true,
    });
  }

  try {
    await signIn("credentials", {
      email: emailStr,
      password: passwordStr,
      redirectTo: "/account",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Account created but sign-in failed. Please log in manually.",
      };
    }
    throw error;
  }

  return {};
}
