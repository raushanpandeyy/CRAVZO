ALTER TABLE "User"
ADD COLUMN "bankDetails" JSONB,
ADD COLUMN "vehicleDetails" JSONB,
ADD COLUMN "paymentMethods" JSONB;

ALTER TABLE "Restaurant"
ADD COLUMN "bankDetails" JSONB;

ALTER TABLE "Order"
ADD COLUMN "gatewayProvider" TEXT,
ADD COLUMN "gatewayOrderId" TEXT,
ADD COLUMN "gatewayPaymentId" TEXT,
ADD COLUMN "gatewaySignature" TEXT;
