ALTER TABLE "Order"
  ADD COLUMN "cancelledRiderId" TEXT,
  ADD COLUMN "riderCancellationEarning" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ADD COLUMN "cancelledByRole" TEXT;

CREATE INDEX "Order_cancelledRiderId_status_createdAt_idx" ON "Order"("cancelledRiderId", "status", "createdAt");
