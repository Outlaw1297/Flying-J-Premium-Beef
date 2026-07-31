import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generatePasswordResetToken(): string {
  return randomBytes(32).toString("hex");
}

/** Store a hashed token so a DB leak doesn't expose usable reset links. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function setPasswordResetToken(userId: string): Promise<string> {
  const raw = generatePasswordResetToken();
  const hashed = hashResetToken(raw);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: hashed,
      passwordResetExpires: new Date(Date.now() + RESET_TTL_MS),
    },
  });
  return raw;
}

export async function findUserByResetToken(rawToken: string) {
  if (!rawToken || rawToken.length < 32) return null;
  const hashed = hashResetToken(rawToken);
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashed,
      passwordResetExpires: { gt: new Date() },
    },
  });
  return user;
}

export async function clearPasswordResetToken(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });
}
