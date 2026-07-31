export const PRODUCT_CATEGORIES = [
  { id: "all", label: "All cuts" },
  { id: "steaks", label: "Steaks" },
  { id: "ground", label: "Ground" },
  { id: "roasts", label: "Roasts" },
  { id: "bundles", label: "Bundles" },
] as const;

export type ProductCategoryId = Exclude<
  (typeof PRODUCT_CATEGORIES)[number]["id"],
  "all"
>;

export function categoryLabel(category: string | null | undefined): string {
  const match = PRODUCT_CATEGORIES.find((c) => c.id === category);
  return match?.label ?? "Premium beef";
}
