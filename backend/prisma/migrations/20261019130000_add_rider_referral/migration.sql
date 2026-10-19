-- CreateTable: RiderReferral
CREATE TABLE "RiderReferral" (
    "id"                 TEXT NOT NULL,
    "referrerId"         TEXT NOT NULL,
    "referredId"         TEXT NOT NULL,
    "referredOrderCount" INTEGER NOT NULL DEFAULT 0,
    "stage1PaidAt"       TIMESTAMP(3),
    "stage2PaidAt"       TIMESTAMP(3),
    "stage3PaidAt"       TIMESTAMP(3),
    "totalPaid"          DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiderReferral_pkey" PRIMARY KEY ("id")
);

-- Unique: a rider can only be referred once
CREATE UNIQUE INDEX "RiderReferral_referredId_key" ON "RiderReferral"("referredId");

-- Indexes
CREATE INDEX "RiderReferral_referrerId_idx"              ON "RiderReferral"("referrerId");
CREATE INDEX "RiderReferral_referrerId_referredOrderCount_idx" ON "RiderReferral"("referrerId", "referredOrderCount");

-- Foreign keys
ALTER TABLE "RiderReferral" ADD CONSTRAINT "RiderReferral_referrerId_fkey"
    FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RiderReferral" ADD CONSTRAINT "RiderReferral_referredId_fkey"
    FOREIGN KEY ("referredId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
