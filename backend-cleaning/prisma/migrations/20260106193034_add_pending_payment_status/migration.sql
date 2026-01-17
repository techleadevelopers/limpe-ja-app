/*
  Warnings:

  - The primary key for the `UserConsent` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `UserConsent` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/

-- AlterEnum
-- Adicionando os valores e forçando o Postgres a reconhecer antes do próximo bloco
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_PAYMENT';
ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';

-- DropForeignKey
ALTER TABLE "MessagePolicyHit" DROP CONSTRAINT "MessagePolicyHit_bookingId_fkey";
ALTER TABLE "MessagePolicyHit" DROP CONSTRAINT "MessagePolicyHit_chatId_fkey";
ALTER TABLE "MessagePolicyHit" DROP CONSTRAINT "MessagePolicyHit_disputeId_fkey";
ALTER TABLE "MessagePolicyHit" DROP CONSTRAINT "MessagePolicyHit_userId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "cancellationCooldownUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProviderService" ALTER COLUMN "pricePerHour" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserConsent" DROP CONSTRAINT "UserConsent_pkey",
ADD COLUMN     "documentHash" TEXT,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "userAgent" TEXT,
ADD CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "SlotHoldStrike" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotHoldStrike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SlotHoldStrike_clientId_providerId_start_idx" ON "SlotHoldStrike"("clientId", "providerId", "start");

-- CreateIndex
CREATE INDEX "SlotHoldStrike_providerId_start_createdAt_idx" ON "SlotHoldStrike"("providerId", "start", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_status_expiresAt_idx" ON "Booking"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "UserConsent_userId_documentType_consentedAt_idx" ON "UserConsent"("userId", "documentType", "consentedAt");

-- AddForeignKey
ALTER TABLE "MessagePolicyHit" ADD CONSTRAINT "MessagePolicyHit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessagePolicyHit" ADD CONSTRAINT "MessagePolicyHit_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessagePolicyHit" ADD CONSTRAINT "MessagePolicyHit_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessagePolicyHit" ADD CONSTRAINT "MessagePolicyHit_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotHoldStrike" ADD CONSTRAINT "SlotHoldStrike_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotHoldStrike" ADD CONSTRAINT "SlotHoldStrike_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;