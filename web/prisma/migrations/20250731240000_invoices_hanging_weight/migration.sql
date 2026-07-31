-- Pricing mode for products (fixed package vs per-lb hanging weight)
CREATE TYPE "PricingMode" AS ENUM ('FIXED', 'PER_POUND_HANGING');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID');

-- Extend PaymentMethod with INVOICE
DO $$ BEGIN
  ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'INVOICE';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "products"
  ADD COLUMN "pricing_mode" "PricingMode" NOT NULL DEFAULT 'FIXED',
  ADD COLUMN "estimated_lbs" DOUBLE PRECISION;

-- Expand invoices for editable drafts / hanging weight
ALTER TABLE "invoices"
  ADD COLUMN "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "subtotal_cents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "tax_cents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "discount_cents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "total_cents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "stripe_checkout_session_id" TEXT,
  ADD COLUMN "paid_at" TIMESTAMP(3),
  ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- issued_at was NOT NULL; allow null for drafts
ALTER TABLE "invoices" ALTER COLUMN "issued_at" DROP NOT NULL;

CREATE TABLE "invoice_lines" (
  "id" TEXT NOT NULL,
  "invoice_id" TEXT NOT NULL,
  "product_id" TEXT,
  "description" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit_label" TEXT NOT NULL DEFAULT 'each',
  "unit_price_cents" INTEGER NOT NULL,
  "line_total_cents" INTEGER NOT NULL,
  "awaiting_weight" BOOLEAN NOT NULL DEFAULT false,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "invoice_lines_invoice_id_idx" ON "invoice_lines"("invoice_id");

ALTER TABLE "invoice_lines"
  ADD CONSTRAINT "invoice_lines_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoice_lines"
  ADD CONSTRAINT "invoice_lines_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: mark existing invoices paid/issued from order status; copy line items
UPDATE "invoices" i
SET
  "status" = CASE WHEN o."status" IN ('PAID', 'PROCESSING', 'READY', 'COMPLETED') THEN 'PAID'::"InvoiceStatus" ELSE 'ISSUED'::"InvoiceStatus" END,
  "subtotal_cents" = o."subtotal_cents",
  "tax_cents" = o."tax_cents",
  "discount_cents" = o."discount_cents",
  "total_cents" = o."total_cents",
  "paid_at" = CASE WHEN o."status" IN ('PAID', 'PROCESSING', 'READY', 'COMPLETED') THEN COALESCE(i."issued_at", NOW()) ELSE NULL END,
  "updated_at" = NOW()
FROM "orders" o
WHERE o."id" = i."order_id";

INSERT INTO "invoice_lines" (
  "id", "invoice_id", "product_id", "description", "quantity",
  "unit_label", "unit_price_cents", "line_total_cents", "awaiting_weight", "sort_order"
)
SELECT
  md5(random()::text || clock_timestamp()::text || oi."id")::text,
  i."id",
  oi."product_id",
  oi."product_name_snapshot",
  oi."quantity"::double precision,
  'each',
  oi."price_cents",
  oi."price_cents" * oi."quantity",
  false,
  0
FROM "invoices" i
JOIN "order_items" oi ON oi."order_id" = i."order_id";
