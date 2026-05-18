/*
  Warnings:

  - You are about to drop the column `taxAmount` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "taxAmount",
ADD COLUMN     "codCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "deliveryDistance" DECIMAL(5,2),
ADD COLUMN     "deliveryFeeBase" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "deliveryTax" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gatewayFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "packagingFeeBase" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "packagingTax" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "platformFeeBase" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "platformTax" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalTax" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "deliveryFee" SET DEFAULT 0,
ALTER COLUMN "packagingFee" SET DEFAULT 0,
ALTER COLUMN "totalAmount" SET DEFAULT 0;
