-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SYSTEM';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "bookingId" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
