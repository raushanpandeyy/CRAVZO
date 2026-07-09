-- Extend ReferralStatus enum with new states
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'OTP_VERIFIED';
ALTER TYPE "ReferralStatus" ADD VALUE IF NOT EXISTS 'SUSPECT';

-- Add anti-fraud + qualification columns to Referral
ALTER TABLE "Referral"
  ADD COLUMN IF NOT EXISTS "referredFingerprintHash" TEXT,
  ADD COLUMN IF NOT EXISTS "referredIpHash" TEXT,
  ADD COLUMN IF NOT EXISTS "suspectFlag" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "suspectReason" TEXT,
  ADD COLUMN IF NOT EXISTS "paidOrderId" TEXT;

-- Referral: change default status to PENDING for new referrals
ALTER TABLE "Referral" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "Referral" ALTER COLUMN "bonusAmount" SET DEFAULT 0;

-- New indexes on Referral
CREATE INDEX IF NOT EXISTS "Referral_status_idx" ON "Referral"("status");
CREATE INDEX IF NOT EXISTS "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

-- User: signup fingerprint + ip hash columns
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "signupFingerprintHash" TEXT,
  ADD COLUMN IF NOT EXISTS "signupIpHash" TEXT;

CREATE INDEX IF NOT EXISTS "User_signupFingerprintHash_idx" ON "User"("signupFingerprintHash");

-- Create DeviceFingerprint table
CREATE TABLE IF NOT EXISTS "DeviceFingerprint" (
  "id" TEXT NOT NULL,
  "fingerprintHash" TEXT NOT NULL,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "userId" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "DeviceFingerprint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "DeviceFingerprint_fingerprintHash_idx" ON "DeviceFingerprint"("fingerprintHash");
CREATE INDEX IF NOT EXISTS "DeviceFingerprint_ipHash_idx" ON "DeviceFingerprint"("ipHash");
CREATE INDEX IF NOT EXISTS "DeviceFingerprint_userId_idx" ON "DeviceFingerprint"("userId");

ALTER TABLE "DeviceFingerprint"
  ADD CONSTRAINT "DeviceFingerprint_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create ReferralMilestone table
CREATE TABLE IF NOT EXISTS "ReferralMilestone" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tier" INTEGER NOT NULL,
  "rewardType" TEXT NOT NULL,
  "rewardValue" DOUBLE PRECISION NOT NULL,
  "voucherCode" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ISSUED',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "redeemedAt" TIMESTAMP(3),
  "redeemedOrderId" TEXT,

  CONSTRAINT "ReferralMilestone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ReferralMilestone_voucherCode_key" ON "ReferralMilestone"("voucherCode");
CREATE INDEX IF NOT EXISTS "ReferralMilestone_userId_status_idx" ON "ReferralMilestone"("userId", "status");
CREATE INDEX IF NOT EXISTS "ReferralMilestone_voucherCode_idx" ON "ReferralMilestone"("voucherCode");
CREATE INDEX IF NOT EXISTS "ReferralMilestone_status_expiresAt_idx" ON "ReferralMilestone"("status", "expiresAt");

ALTER TABLE "ReferralMilestone"
  ADD CONSTRAINT "ReferralMilestone_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: existing COMPLETED referrals keep COMPLETED status (good-will milestone credit),
-- and existing COMPLETED referrers get retroactive Tier 1 milestone issued via separate script if desired.