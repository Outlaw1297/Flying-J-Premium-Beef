"use server";

import { compare } from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import {
  clearPasswordResetToken,
  findUserByResetToken,
  setPasswordResetToken,
} from "@/lib/password-reset";
import { getAppUrl } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export type ForgotPasswordState = { error?: string; success?: string };
export type ResetPasswordState = { error?: string; success?: string };

const emailSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

const resetSchema = z
  .object({
    token: z.string().min(32),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string().min(8),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

/**
 * Always return a generic success message to avoid email enumeration.
 */
export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.passwordHash) {
    try {
      const rawToken = await setPasswordResetToken(user.id);
      const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
      });
    } catch (error) {
      console.error("Forgot password failed:", error);
      return { error: "Unable to send reset email. Please try again." };
    }
  }

  return {
    success:
      "If an account exists for that email, we sent a password reset link. Check your inbox.",
  };
}

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const user = await findUserByResetToken(parsed.data.token);
  if (!user) {
    return {
      error: "This reset link is invalid or has expired. Request a new one.",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      claimToken: null,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return {
    success: "Password updated. You can sign in with your new password.",
  };
}

export async function changePasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in" };
  }

  const schema = z
    .object({
      currentPassword: z.string().min(1, "Current password is required"),
      password: z.string().min(8, "New password must be at least 8 characters"),
      confirm: z.string().min(8),
    })
    .refine((data) => data.password === data.confirm, {
      message: "Passwords do not match",
      path: ["confirm"],
    });

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.passwordHash) {
    return { error: "Account has no password set" };
  }

  const valid = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect" };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  await clearPasswordResetToken(user.id);

  return { success: "Password changed" };
}
