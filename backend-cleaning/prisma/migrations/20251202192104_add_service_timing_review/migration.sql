-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "isReviewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledStart" TIMESTAMP(3);
