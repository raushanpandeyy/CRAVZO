-- CreateEnum
CREATE TYPE "RiderGigStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ENDED_EARLY');

-- CreateTable
CREATE TABLE "RiderGig" (
    "id"              TEXT NOT NULL,
    "riderId"         TEXT NOT NULL,
    "durationHours"   DOUBLE PRECISION NOT NULL,
    "startedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt"          TIMESTAMP(3) NOT NULL,
    "status"          "RiderGigStatus" NOT NULL DEFAULT 'ACTIVE',
    "ordersCompleted" INTEGER NOT NULL DEFAULT 0,
    "bonusEarned"     DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endedEarly"      BOOLEAN NOT NULL DEFAULT false,
    "endedAt"         TIMESTAMP(3),

    CONSTRAINT "RiderGig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RiderGig_riderId_status_idx" ON "RiderGig"("riderId", "status");

-- CreateIndex
CREATE INDEX "RiderGig_status_endsAt_idx" ON "RiderGig"("status", "endsAt");

-- AddForeignKey
ALTER TABLE "RiderGig" ADD CONSTRAINT "RiderGig_riderId_fkey"
    FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
