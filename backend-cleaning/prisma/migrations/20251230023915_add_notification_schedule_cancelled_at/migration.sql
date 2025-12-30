-- CreateEnum
CREATE TYPE "BookingProofType" AS ENUM ('CHECKIN', 'CHECKOUT');

-- CreateEnum
CREATE TYPE "InsurancePlanId" AS ENUM ('ESSENCIAL', 'PREMIUM', 'TOTAL');

-- CreateEnum
CREATE TYPE "NotificationScheduleStatus" AS ENUM ('PENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationScheduleType" AS ENUM ('BOOKING_REMINDER', 'PROVIDER_LATE', 'JOB_STARTED', 'JOB_ENDED');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "payload" JSONB,
ADD COLUMN     "ttlSeconds" INTEGER;

-- AlterTable
ALTER TABLE "ProviderPromotion" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "BookingInsurance" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "planId" "InsurancePlanId" NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "coverageCents" INTEGER NOT NULL,
    "deductibleCents" INTEGER NOT NULL,
    "riskMultiplierBps" INTEGER NOT NULL,
    "proofRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingProof" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BookingProofType" NOT NULL,
    "photos" JSONB NOT NULL,
    "videoUrl" TEXT,
    "hashes" JSONB,
    "timestamps" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationSchedule" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "type" "NotificationScheduleType" NOT NULL,
    "slot" TEXT,
    "status" "NotificationScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "cancelledAt" TIMESTAMP(3),
    "dedupeKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceClaim" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deductibleCents" INTEGER NOT NULL,
    "coverageCents" INTEGER NOT NULL,
    "planId" "InsurancePlanId" NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingInsurance_bookingId_key" ON "BookingInsurance"("bookingId");

-- CreateIndex
CREATE INDEX "BookingInsurance_bookingId_idx" ON "BookingInsurance"("bookingId");

-- CreateIndex
CREATE INDEX "BookingProof_bookingId_idx" ON "BookingProof"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingProof_bookingId_type_key" ON "BookingProof"("bookingId", "type");

-- CreateIndex
CREATE INDEX "NotificationSchedule_bookingId_idx" ON "NotificationSchedule"("bookingId");

-- CreateIndex
CREATE INDEX "NotificationSchedule_status_runAt_idx" ON "NotificationSchedule"("status", "runAt");

-- CreateIndex
CREATE INDEX "InsuranceClaim_bookingId_idx" ON "InsuranceClaim"("bookingId");

-- CreateIndex
CREATE INDEX "InsuranceClaim_reporterId_idx" ON "InsuranceClaim"("reporterId");

-- CreateIndex
CREATE INDEX "Notification_userId_dedupeKey_createdAt_idx" ON "Notification"("userId", "dedupeKey", "createdAt");

-- AddForeignKey
ALTER TABLE "BookingInsurance" ADD CONSTRAINT "BookingInsurance_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingProof" ADD CONSTRAINT "BookingProof_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationSchedule" ADD CONSTRAINT "NotificationSchedule_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceClaim" ADD CONSTRAINT "InsuranceClaim_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
