ALTER TABLE "MenuItem"
  ADD COLUMN "trackInventory" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "stockQuantity" INTEGER;

ALTER TABLE "Order"
  ADD COLUMN "pickedUpAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "deliveryOtpHash" TEXT,
  ADD COLUMN "deliveryOtpExpiresAt" TIMESTAMP(3);