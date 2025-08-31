/*
  Warnings:

  - A unique constraint covering the columns `[providerId,serviceId,pricingType]` on the table `ProviderService` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ProviderService_providerId_serviceId_key";

-- AlterTable
ALTER TABLE "Offer" ALTER COLUMN "validFrom" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProviderService_providerId_serviceId_pricingType_key" ON "ProviderService"("providerId", "serviceId", "pricingType");
