-- AlterTable users
ALTER TABLE "users" ADD COLUMN "address_line1" TEXT;
ALTER TABLE "users" ADD COLUMN "address_line2" TEXT;
ALTER TABLE "users" ADD COLUMN "city" TEXT;
ALTER TABLE "users" ADD COLUMN "state" TEXT;
ALTER TABLE "users" ADD COLUMN "zip" TEXT;
ALTER TABLE "users" ADD COLUMN "preferred_fulfillment" "FulfillmentType";

-- AlterTable orders
ALTER TABLE "orders" ADD COLUMN "address_line1" TEXT;
ALTER TABLE "orders" ADD COLUMN "address_line2" TEXT;
ALTER TABLE "orders" ADD COLUMN "city" TEXT;
ALTER TABLE "orders" ADD COLUMN "state" TEXT;
ALTER TABLE "orders" ADD COLUMN "zip" TEXT;
ALTER TABLE "orders" ADD COLUMN "delivery_instructions" TEXT;
