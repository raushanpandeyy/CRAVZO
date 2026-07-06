-- Create Coupon table if not exists (safe for both real and shadow database)
CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minOrderValue" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "restaurantId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- Coupon indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_code_isActive_expiresAt_idx" ON "Coupon"("code", "isActive", "expiresAt");
CREATE INDEX IF NOT EXISTS "Coupon_isActive_expiresAt_idx" ON "Coupon"("isActive", "expiresAt");
CREATE INDEX IF NOT EXISTS "Coupon_restaurantId_idx" ON "Coupon"("restaurantId");

-- Add restaurantId column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Coupon' AND column_name = 'restaurantId'
    ) THEN
        ALTER TABLE "Coupon" ADD COLUMN "restaurantId" TEXT;
    END IF;
END $$;

-- Add foreign key for Coupon.restaurantId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'Coupon_restaurantId_fkey'
    ) THEN
        ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_restaurantId_fkey"
            FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create RiderRating table if not exists
CREATE TABLE IF NOT EXISTS "RiderRating" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiderRating_pkey" PRIMARY KEY ("id")
);

-- RiderRating indexes
CREATE UNIQUE INDEX IF NOT EXISTS "RiderRating_orderId_key" ON "RiderRating"("orderId");
CREATE INDEX IF NOT EXISTS "RiderRating_riderId_createdAt_idx" ON "RiderRating"("riderId", "createdAt");
CREATE INDEX IF NOT EXISTS "RiderRating_userId_createdAt_idx" ON "RiderRating"("userId", "createdAt");

-- RiderRating foreign keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'RiderRating_orderId_fkey'
    ) THEN
        ALTER TABLE "RiderRating" ADD CONSTRAINT "RiderRating_orderId_fkey"
            FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'RiderRating_userId_fkey'
    ) THEN
        ALTER TABLE "RiderRating" ADD CONSTRAINT "RiderRating_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'RiderRating_riderId_fkey'
    ) THEN
        ALTER TABLE "RiderRating" ADD CONSTRAINT "RiderRating_riderId_fkey"
            FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add closureDates to Restaurant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Restaurant' AND column_name = 'closureDates'
    ) THEN
        ALTER TABLE "Restaurant" ADD COLUMN "closureDates" JSONB;
    END IF;
END $$;
