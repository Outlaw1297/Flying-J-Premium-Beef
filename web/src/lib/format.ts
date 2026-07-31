export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export {
  formatPhoneDisplay,
  formatPhoneInput,
  normalizeUsPhone,
} from "@/lib/phone";

