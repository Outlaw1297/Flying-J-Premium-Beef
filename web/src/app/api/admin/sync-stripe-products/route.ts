import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncAllProductsToStripe } from "@/lib/stripe-products";
import { getStripeSecretKey } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await getStripeSecretKey())) {
    return NextResponse.json(
      { error: "Add Stripe keys under Admin → Payments" },
      { status: 500 },
    );
  }

  const result = await syncAllProductsToStripe();
  return NextResponse.json(result);
}
