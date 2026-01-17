-- CreateTable
CREATE TABLE "NotificationLogs" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageKey" TEXT,
    "externalMessageId" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappWebhookLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsappWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationLogs_externalMessageId_idx" ON "NotificationLogs"("externalMessageId");
-- CreateIndex
CREATE INDEX "NotificationLogs_bookingId_status_messageKey_idx" ON "NotificationLogs"("bookingId", "status", "messageKey");
-- AddForeignKey
ALTER TABLE "NotificationLogs" ADD CONSTRAINT "NotificationLogs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;