import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function secret(): string {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dev-insecure-guest-token-secret"
  );
}

/** Opaque token proving the holder completed guest checkout for this account. */
export function generateClaimToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Signed, time-limited token so guest success pages are not an open IDOR
 * on order_id alone. Format: orderId.exp.sig
 */
export function createOrderConfirmToken(orderId: string, ttlSeconds = 60 * 60 * 48): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${orderId}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyOrderConfirmToken(
  token: string | null | undefined,
  orderId: string,
): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [id, expStr, sig] = parts;
  if (id !== orderId) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const payload = `${id}.${expStr}`;
  const expected = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
