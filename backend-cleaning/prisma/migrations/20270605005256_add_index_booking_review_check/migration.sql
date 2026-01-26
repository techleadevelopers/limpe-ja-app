-- CreateIndex
CREATE INDEX "Booking_clientId_status_isReviewed_idx" ON "Booking"("clientId", "status", "isReviewed");