-- Create the ReferralStatus enum first (must exist before table uses it)
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- Add referral wallet fields to "User"
ALTER TABLE "User"
  ADD COLUMN "referralCode" TEXT,
  ADD COLUMN "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Unique constraint for referral codes
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- Create "Referral" table
CREATE TABLE "Referral" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "referredId" TEXT NOT NULL,
  "status" "ReferralStatus" NOT NULL DEFAULT 'COMPLETED',
  "bonusAmount" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),

  CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one referral per referred user
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- Index for listing referrals made by a referrer, ordered by creation date
CREATE INDEX "Referral_referrerId_createdAt_idx" ON "Referral"("referrerId", "createdAt");

-- Foreign keys
ALTER TABLE "Referral"
  ADD CONSTRAINT "Referral_referrerId_fkey"
  FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Referral"
  ADD CONSTRAINT "Referral_referredId_fkey"
  FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;