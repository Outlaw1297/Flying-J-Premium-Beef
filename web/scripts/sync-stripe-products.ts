import "dotenv/config";
import { syncAllProductsToStripe } from "../src/lib/stripe-products";

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is required to sync products");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const result = await syncAllProductsToStripe();
  console.log(`Synced ${result.synced} products to Stripe.`);
  if (result.failed > 0) {
    console.error(`Failed: ${result.failed}`);
    for (const err of result.errors) console.error(" -", err);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
