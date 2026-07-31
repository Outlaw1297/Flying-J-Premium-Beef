import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncAllProductsToStripe } from "@/lib/stripe-products";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured" },
      { status: 500 },
    );
  }

  const result = await syncAllProductsToStripe();
  return NextResponse.json(result);
}
