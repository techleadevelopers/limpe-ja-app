-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "scheduledEnd" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_providerId_scheduledStart_scheduledEnd_idx" ON "Booking"("providerId", "scheduledStart", "scheduledEnd");
