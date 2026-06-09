-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN     "sideDishes" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "selectedSideDishes" JSONB;
