-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "pixKeyMasked" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "pixKeyMasked" TEXT;

-- CreateIndex
CREATE INDEX "LedgerEntry_bookingId_idx" ON "LedgerEntry"("bookingId");

-- CreateIndex
CREATE INDEX "Notification_userId_priority_createdAt_idx" ON "Notification"("userId", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_updatedAt_idx" ON "PaymentIntent"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Transaction_providerId_status_createdAt_idx" ON "Transaction"("providerId", "status", "createdAt");
