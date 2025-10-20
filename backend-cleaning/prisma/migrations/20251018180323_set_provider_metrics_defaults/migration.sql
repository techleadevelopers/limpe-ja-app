/*
  Warnings:

  - A unique constraint covering the columns `[userId,type,referenceId]` on the table `LoyaltyTransaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Provider" ALTER COLUMN "acceptanceRate" SET DEFAULT 94,
ALTER COLUMN "averageResponseTime" SET DEFAULT 25;

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyTransaction_userId_type_referenceId_key" ON "LoyaltyTransaction"("userId", "type", "referenceId");
