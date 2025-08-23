/*
  Warnings:

  - Added the required column `status` to the `Offer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target` to the `Offer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OfferTarget" AS ENUM ('GENERAL', 'SPECIFIC_SERVICE', 'SPECIFIC_PROVIDER', 'NEW_CLIENTS');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "status" "OfferStatus" NOT NULL,
ADD COLUMN     "target" "OfferTarget" NOT NULL,
ADD COLUMN     "targetId" TEXT;
