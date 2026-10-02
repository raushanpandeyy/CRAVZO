-- Migration: add_promo_codes
-- Adds PromoCode, PromoCodeRedemption tables and promoCode/promoCodeDiscount cols on Order

-- PromoCode table
CREATE TABLE "PromoCode" (
    "id"            TEXT NOT NULL,
    "code"          TEXT NOT NULL,
    "label"         TEXT NOT NULL,
    "discountType"  TEXT NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minOrderValue" DECIMAL(10,2),
    "maxDiscount"   DECIMAL(10,2),
    "maxUses"       INTEGER,
    "currentUses"   INTEGER NOT NULL DEFAULT 0,
    "perUserLimit"  INTEGER NOT NULL DEFAULT 1,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "startsAt"      TIMESTAMP(3),
    "expiresAt"     TIMESTAMP(3),
    "createdBy"     TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX "PromoCode_code_isActive_idx" ON "PromoCode"("code", "isActive");
CREATE INDEX "PromoCode_isActive_expiresAt_idx" ON "PromoCode"("isActive", "expiresAt");
CREATE INDEX "PromoCode_createdAt_idx" ON "PromoCode"("createdAt");

-- PromoCodeRedemption table
CREATE TABLE "PromoCodeRedemption" (
    "id"          TEXT NOT NULL,
    "promoCodeId" TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "orderId"     TEXT,
    "redeemedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCodeRedemption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PromoCodeRedemption_promoCodeId_userId_idx" ON "PromoCodeRedemption"("promoCodeId", "userId");
CREATE INDEX "PromoCodeRedemption_userId_redeemedAt_idx" ON "PromoCodeRedemption"("userId", "redeemedAt");
CREATE INDEX "PromoCodeRedemption_promoCodeId_redeemedAt_idx" ON "PromoCodeRedemption"("promoCodeId", "redeemedAt");

ALTER TABLE "PromoCodeRedemption"
    ADD CONSTRAINT "PromoCodeRedemption_promoCodeId_fkey"
    FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PromoCodeRedemption"
    ADD CONSTRAINT "PromoCodeRedemption_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add promoCode + promoCodeDiscount columns to Order
ALTER TABLE "Order"
    ADD COLUMN "promoCode"         TEXT,
    ADD COLUMN "promoCodeDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0;
