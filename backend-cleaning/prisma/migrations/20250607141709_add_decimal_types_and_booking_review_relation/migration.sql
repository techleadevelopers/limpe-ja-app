/*
  Warnings:

  - Made the column `bookingId` on table `Review` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_bookingId_fkey";

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "bookingId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
