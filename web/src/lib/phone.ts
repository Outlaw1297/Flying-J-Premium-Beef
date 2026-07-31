export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Normalize to 10-digit US national number when possible. */
export function normalizeUsPhone(phone: string): string | null {
  let digits = phoneDigits(phone);
  // Country code (+1). NANP area codes never start with 0 or 1.
  if (digits.startsWith("1") && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) return null;
  if (digits.startsWith("0") || digits.startsWith("1")) return null;
  return digits;
}

/** Format as +1 (555) 123-4567 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = normalizeUsPhone(phone);
  if (!digits) return phone;
  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Format while typing (US, with +1 country code) */
export function formatPhoneInput(value: string): string {
  let digits = phoneDigits(value);
  // Drop leading country code so typing "+1" or "1…" doesn't eat the area code
  if (digits.startsWith("1")) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 10);

  if (digits.length === 0) return "+1 ";
  if (digits.length < 4) return `+1 (${digits}`;
  if (digits.length < 7) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
