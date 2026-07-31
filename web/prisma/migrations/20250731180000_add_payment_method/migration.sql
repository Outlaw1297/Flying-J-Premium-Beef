-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'CASH', 'CHECK');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CARD';
