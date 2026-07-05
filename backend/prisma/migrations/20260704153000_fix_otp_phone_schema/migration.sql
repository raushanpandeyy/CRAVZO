-- Bring OtpVerification in sync with the Prisma schema.
ALTER TABLE "OtpVerification"
  ALTER COLUMN "email" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "phone" TEXT;

CREATE INDEX IF NOT EXISTS "OtpVerification_phone_purpose_createdAt_idx"
  ON "OtpVerification"("phone", "purpose", "createdAt");
