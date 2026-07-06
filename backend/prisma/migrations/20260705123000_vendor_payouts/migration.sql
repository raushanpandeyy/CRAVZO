CREATE TABLE "VendorPayout" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "amount" DECIMAL(10,2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'REQUESTED',
  "reference" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "VendorPayout_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "VendorPayout_vendorId_status_requestedAt_idx" ON "VendorPayout"("vendorId", "status", "requestedAt");
CREATE INDEX "VendorPayout_restaurantId_requestedAt_idx" ON "VendorPayout"("restaurantId", "requestedAt");
ALTER TABLE "VendorPayout" ADD CONSTRAINT "VendorPayout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VendorPayout" ADD CONSTRAINT "VendorPayout_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;