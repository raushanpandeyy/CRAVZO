ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUND_PENDING';

ALTER TABLE "Order"
ADD COLUMN "refundId" TEXT,
ADD COLUMN "refundStatus" TEXT,
ADD COLUMN "refundAmount" DECIMAL(10,2),
ADD COLUMN "refundInitiatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Order_refundId_key" ON "Order"("refundId");