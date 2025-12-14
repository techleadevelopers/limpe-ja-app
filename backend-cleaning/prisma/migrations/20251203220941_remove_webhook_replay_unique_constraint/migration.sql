-- DropIndex
DROP INDEX "WebhookReplay_eventId_key";

-- CreateIndex
CREATE INDEX "Availability_providerId_dayOfWeek_idx" ON "Availability"("providerId", "dayOfWeek");
