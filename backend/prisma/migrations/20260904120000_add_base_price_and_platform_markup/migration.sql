-- Add basePrice, platformMarkup, snackSize to MenuItem
ALTER TABLE "MenuItem"
  ADD COLUMN IF NOT EXISTS "basePrice"      DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "platformMarkup" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "snackSize"      TEXT;

-- Create PlatformMarkup table for admin-controlled category markups
CREATE TABLE IF NOT EXISTS "PlatformMarkup" (
  "id"        TEXT         NOT NULL,
  "category"  TEXT         NOT NULL,
  "markup"    DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlatformMarkup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformMarkup_category_key" ON "PlatformMarkup"("category");

-- Seed default markups
INSERT INTO "PlatformMarkup" ("id", "category", "markup", "createdAt", "updatedAt") VALUES
  (gen_random_uuid()::text, 'Main Course',  30, NOW(), NOW()),
  (gen_random_uuid()::text, 'Starters',     30, NOW(), NOW()),
  (gen_random_uuid()::text, 'Biryani',      30, NOW(), NOW()),
  (gen_random_uuid()::text, 'Thali',        30, NOW(), NOW()),
  (gen_random_uuid()::text, 'Desserts',     30, NOW(), NOW()),
  (gen_random_uuid()::text, 'Breads',        5, NOW(), NOW()),
  (gen_random_uuid()::text, 'Beverages',    10, NOW(), NOW()),
  (gen_random_uuid()::text, 'Sides',         0, NOW(), NOW()),
  (gen_random_uuid()::text, 'Snacks',       25, NOW(), NOW()),
  (gen_random_uuid()::text, 'Snacks-half',  20, NOW(), NOW()),
  (gen_random_uuid()::text, 'Snacks-full',  30, NOW(), NOW())
ON CONFLICT ("category") DO NOTHING;
