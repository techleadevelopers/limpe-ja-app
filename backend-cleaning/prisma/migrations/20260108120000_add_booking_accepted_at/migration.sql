-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "acceptedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_providerId_acceptedAt_idx" ON "Booking"("providerId", "acceptedAt");
