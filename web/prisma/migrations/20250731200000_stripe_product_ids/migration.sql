-- AlterTable
ALTER TABLE "products" ADD COLUMN "stripe_product_id" TEXT;
ALTER TABLE "products" ADD COLUMN "stripe_price_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "products_stripe_product_id_key" ON "products"("stripe_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_stripe_price_id_key" ON "products"("stripe_price_id");
