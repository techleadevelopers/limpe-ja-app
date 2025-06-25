/*
  Warnings:

  - A unique constraint covering the columns `[addressId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "addressId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_addressId_key" ON "Booking"("addressId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
