-- CreateTable
CREATE TABLE "DishPromotion" (
    "id" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DishPromotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DishPromotion_isActive_position_idx" ON "DishPromotion"("isActive", "position");
