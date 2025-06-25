/*
  Warnings:

  - A unique constraint covering the columns `[bookingId,clientId,providerId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_clientId_providerId_key" ON "Review"("bookingId", "clientId", "providerId");
