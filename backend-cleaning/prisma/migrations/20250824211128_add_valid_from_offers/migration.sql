/*
  Warnings:

  - You are about to alter the column `fixedDiscountAmount` on the `Offer` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - Added the required column `validFrom` to the `Offer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "validFrom" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "fixedDiscountAmount" SET DATA TYPE DECIMAL(65,30);
