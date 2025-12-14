-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "onTheWayAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_clientId_status_scheduledDate_idx" ON "Booking"("clientId", "status", "scheduledDate");
