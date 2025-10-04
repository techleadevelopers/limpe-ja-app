-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('EARNING', 'ADJUSTMENT', 'WITHDRAWAL', 'FEE', 'REFUND', 'HOLD', 'RELEASE');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PricingScope" AS ENUM ('GLOBAL', 'CITY', 'CATEGORY', 'PROVIDER');

-- AlterTable
ALTER TABLE "PricingRule" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "cityCode" TEXT,
ADD COLUMN     "maxMultiplier" DECIMAL(3,2),
ADD COLUMN     "providerId" TEXT,
ADD COLUMN     "scope" "PricingScope";

-- CreateTable
CREATE TABLE "ProviderServiceVersion" (
    "id" TEXT NOT NULL,
    "providerServiceId" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "pricingType" "PricingType" NOT NULL,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderServiceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponReservation" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT,
    "disputeId" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayTxnId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookReplay" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookReplay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProviderServiceVersion_providerServiceId_changedAt_idx" ON "ProviderServiceVersion"("providerServiceId", "changedAt");

-- CreateIndex
CREATE INDEX "CouponReservation_expiresAt_idx" ON "CouponReservation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CouponReservation_couponId_userId_bookingId_key" ON "CouponReservation"("couponId", "userId", "bookingId");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_createdAt_idx" ON "LedgerEntry"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_gatewayTxnId_key" ON "Payout"("gatewayTxnId");

-- CreateIndex
CREATE UNIQUE INDEX "Payout_idempotencyKey_key" ON "Payout"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookReplay_eventId_key" ON "WebhookReplay"("eventId");

-- CreateIndex
CREATE INDEX "PricingRule_scope_isActive_cityCode_categoryId_providerId_idx" ON "PricingRule"("scope", "isActive", "cityCode", "categoryId", "providerId");

-- AddForeignKey
ALTER TABLE "ProviderServiceVersion" ADD CONSTRAINT "ProviderServiceVersion_providerServiceId_fkey" FOREIGN KEY ("providerServiceId") REFERENCES "ProviderService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponReservation" ADD CONSTRAINT "CouponReservation_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponReservation" ADD CONSTRAINT "CouponReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
