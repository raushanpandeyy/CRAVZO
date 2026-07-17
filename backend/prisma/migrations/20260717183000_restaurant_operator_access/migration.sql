CREATE TABLE "RestaurantOperatorAccess" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "restaurantId" TEXT NOT NULL,
  "grantedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RestaurantOperatorAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RestaurantOperatorAccess_vendorId_restaurantId_key"
  ON "RestaurantOperatorAccess"("vendorId", "restaurantId");

CREATE INDEX "RestaurantOperatorAccess_vendorId_createdAt_idx"
  ON "RestaurantOperatorAccess"("vendorId", "createdAt");

CREATE INDEX "RestaurantOperatorAccess_restaurantId_createdAt_idx"
  ON "RestaurantOperatorAccess"("restaurantId", "createdAt");

ALTER TABLE "RestaurantOperatorAccess"
  ADD CONSTRAINT "RestaurantOperatorAccess_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RestaurantOperatorAccess"
  ADD CONSTRAINT "RestaurantOperatorAccess_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RestaurantOperatorAccess"
  ADD CONSTRAINT "RestaurantOperatorAccess_grantedById_fkey"
  FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
