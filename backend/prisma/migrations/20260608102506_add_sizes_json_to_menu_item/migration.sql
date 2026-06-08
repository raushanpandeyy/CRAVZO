/*
  Warnings:

  - You are about to drop the column `size` on the `MenuItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MenuItem" DROP COLUMN "size",
ADD COLUMN     "sizes" JSONB;
