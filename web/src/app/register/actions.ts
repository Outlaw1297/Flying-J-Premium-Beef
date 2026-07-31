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

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  const emailStr = String(email).toLowerCase();
  const passwordStr = String(password);
  const nameStr = String(name);

  if (passwordStr.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const existing = await prisma.user.findUnique({ where: { email: emailStr } });
  if (existing) {
    return { error: "An account with this email already exists" };
  }

  const passwordHash = await hash(passwordStr, 12);

  await prisma.user.create({
    data: {
      email: emailStr,
      name: nameStr,
      passwordHash,
    },
  });

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
