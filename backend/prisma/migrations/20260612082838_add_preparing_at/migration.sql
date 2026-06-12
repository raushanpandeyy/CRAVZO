-- AlterEnum
ALTER TYPE "ChatRoomType" ADD VALUE 'ORDER_VENDOR';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "preparingAt" TIMESTAMP(3);
