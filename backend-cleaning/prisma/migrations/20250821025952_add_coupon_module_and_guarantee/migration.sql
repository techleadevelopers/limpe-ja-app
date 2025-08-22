/*
  Warnings:

  - Added the required column `appliedValue` to the `CouponUsage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CouponUsage" ADD COLUMN     "appliedValue" DECIMAL(10,2) NOT NULL;
