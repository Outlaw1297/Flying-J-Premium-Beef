export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Normalize to 10-digit US number when possible. */
export function normalizeUsPhone(phone: string): string | null {
  let digits = phoneDigits(phone);
  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) return null;
  return digits;
}

/** Format as (555) 123-4567 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = normalizeUsPhone(phone) ?? phoneDigits(phone);
  if (digits.length !== 10) return phone;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Format while typing (US) */
export function formatPhoneInput(value: string): string {
  const digits = phoneDigits(value).slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length < 4) return `(${digits}`;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
