ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "referralVoucherCode" TEXT,
  ADD COLUMN IF NOT EXISTS "referralVoucherId" TEXT,
  ADD COLUMN IF NOT EXISTS "referralVoucherDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "Order_referralVoucherCode_idx" ON "Order"("referralVoucherCode");