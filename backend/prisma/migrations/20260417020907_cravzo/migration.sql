-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('VENDOR_ONBOARDING', 'RIDER_ONBOARDING');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "riderOnboarding" JSONB,
ADD COLUMN     "vendorOnboarding" JSONB;

-- CreateTable
CREATE TABLE "OtpVerification" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "sentCount" INTEGER NOT NULL DEFAULT 1,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtpVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpVerification_email_purpose_createdAt_idx" ON "OtpVerification"("email", "purpose", "createdAt");
