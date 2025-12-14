/*
  Warnings:

  - You are about to alter the column `latitude` on the `Address` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,8)` to `DoublePrecision`.
  - You are about to alter the column `longitude` on the `Address` table. The data in that column could be lost. The data in that column will be cast from `Decimal(11,8)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "Address" ALTER COLUMN "latitude" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "longitude" SET DATA TYPE DOUBLE PRECISION;
