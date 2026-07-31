"use server";

import { revalidatePath } from "next/cache";
import { getCart, setCart, type CartItem } from "@/lib/cart";
import { prisma } from "@/lib/prisma";

export type CartActionState = { error?: string; success?: string };

async function findActiveProduct(productId: string) {
  return prisma.product.findFirst({
    where: { id: productId, active: true },
  });
}

export async function addToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const productId = formData.get("productId");
  const quantity = Number(formData.get("quantity") ?? 1);

  if (!productId || !Number.isFinite(quantity) || quantity < 1) {
    return { error: "Invalid product or quantity" };
  }

  const product = await findActiveProduct(String(productId));
  if (!product) {
    return { error: "Product not found" };
  }

  if (product.inventoryCount < quantity) {
    return {
      error:
        product.inventoryCount === 0
          ? "This item is out of stock"
          : `Only ${product.inventoryCount} available`,
    };
  }

  const cart = await getCart();
  const existing = cart.find((item) => item.productId === product.id);
  const newQuantity = (existing?.quantity ?? 0) + quantity;

  if (newQuantity > product.inventoryCount) {
    return { error: `Only ${product.inventoryCount} available` };
  }

  const updated: CartItem[] = existing
    ? cart.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: newQuantity }
          : item,
      )
    : [
        ...cart,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          priceCents: product.priceCents,
          weightLabel: product.weightLabel,
          quantity,
          pricingMode: product.pricingMode,
          estimatedLbs: product.estimatedLbs,
        },
      ];

  await setCart(updated);
  revalidatePath("/cart");
  revalidatePath("/shop");

  return { success: `Added ${product.name} to cart` };
}

export async function updateCartQuantityAction(
  productId: string,
  quantity: number,
): Promise<CartActionState> {
  if (!productId || quantity < 0) {
    return { error: "Invalid update" };
  }

  const cart = await getCart();
  const item = cart.find((i) => i.productId === productId);
  if (!item) {
    return { error: "Item not in cart" };
  }

  if (quantity === 0) {
    await setCart(cart.filter((i) => i.productId !== productId));
    revalidatePath("/cart");
    return { success: "Item removed" };
  }

  const product = await findActiveProduct(productId);
  if (!product) {
    return { error: "Product no longer available" };
  }

  if (quantity > product.inventoryCount) {
    return { error: `Only ${product.inventoryCount} available` };
  }

  await setCart(
    cart.map((i) =>
      i.productId === productId ? { ...i, quantity } : i,
    ),
  );
  revalidatePath("/cart");
  return { success: "Cart updated" };
}

export async function removeFromCartAction(productId: string): Promise<void> {
  const cart = await getCart();
  await setCart(cart.filter((i) => i.productId !== productId));
  revalidatePath("/cart");
}
