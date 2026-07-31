"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import {
  sendAccountCreatedEmail,
  sendPasswordResetEmail,
} from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { setPasswordResetToken } from "@/lib/password-reset";
import { getAppUrl } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/enums";

export type AdminUserFormState = { error?: string; success?: string };

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["CUSTOMER", "ADMIN"]),
  password: z.string().min(8).optional().or(z.literal("")),
  sendInvite: z.boolean().optional(),
});

function generateTempPassword(): string {
  return randomBytes(9).toString("base64url").slice(0, 12);
}

export async function createUserAction(
  _prev: AdminUserFormState,
  formData: FormData,
): Promise<AdminUserFormState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role") || "CUSTOMER",
    password: formData.get("password") || "",
    sendInvite: formData.get("sendInvite") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const email = parsed.data.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    return { error: "A user with that email already exists" };
  }

  const tempPassword =
    parsed.data.password && parsed.data.password.length >= 8
      ? parsed.data.password
      : generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name.trim(),
        passwordHash,
        claimToken: null,
        role: parsed.data.role as UserRole,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email,
        name: parsed.data.name.trim(),
        passwordHash,
        role: parsed.data.role as UserRole,
      },
    });
  }

  if (parsed.data.sendInvite) {
    try {
      await sendAccountCreatedEmail({
        to: email,
        name: parsed.data.name.trim(),
        role: parsed.data.role,
        tempPassword,
        loginUrl: `${getAppUrl()}/login`,
      });
    } catch (error) {
      console.error("Account created email failed:", error);
    }
    revalidatePath("/admin/users");
    return { success: `Created ${email} and sent login email` };
  }

  revalidatePath("/admin/users");
  return {
    success: `Created ${email}. Temporary password: ${tempPassword}`,
  };
}

export async function setUserRoleAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "");
  if (!userId || (role !== "ADMIN" && role !== "CUSTOMER")) return;

  if (role === "CUSTOMER") {
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (target?.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) return;
      if (userId === session.user.id && adminCount <= 1) return;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as UserRole },
  });

  revalidatePath("/admin/users");
}

export async function sendPasswordResetForUserAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  if (!userId) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) return;

  const rawToken = await setPasswordResetToken(user.id);
  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
  });

  revalidatePath("/admin/users");
}

export async function adminSetPasswordAction(
  _prev: AdminUserFormState,
  formData: FormData,
): Promise<AdminUserFormState> {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  const password = String(formData.get("password") || "");
  if (!userId) return { error: "Missing user" };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null,
      claimToken: null,
    },
  });

  revalidatePath("/admin/users");
  return { success: "Password updated" };
}
