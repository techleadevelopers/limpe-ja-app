/*
  Warnings:

  - You are about to alter the column `acceptanceRate` on the `Provider` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- DropIndex
DROP INDEX "idx_Address_location";

-- AlterTable
ALTER TABLE "Provider" ALTER COLUMN "dateOfBirth" DROP NOT NULL,
ALTER COLUMN "badges" DROP DEFAULT,
ALTER COLUMN "acceptanceRate" DROP NOT NULL,
ALTER COLUMN "acceptanceRate" DROP DEFAULT,
ALTER COLUMN "acceptanceRate" SET DATA TYPE INTEGER,
ALTER COLUMN "averageResponseTime" DROP NOT NULL,
ALTER COLUMN "averageResponseTime" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "Provider_verificationStatus_yearsOfExperience_idx" ON "Provider"("verificationStatus", "yearsOfExperience");
