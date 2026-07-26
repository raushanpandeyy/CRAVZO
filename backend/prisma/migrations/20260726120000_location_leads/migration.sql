-- CreateTable
CREATE TABLE "LocationLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationLead_status_createdAt_idx" ON "LocationLead"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LocationLead_createdAt_idx" ON "LocationLead"("createdAt");
