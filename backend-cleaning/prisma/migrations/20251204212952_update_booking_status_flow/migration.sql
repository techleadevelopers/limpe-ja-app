/*
  Warnings:

  - The values [COMPLETED,IN_PROGRESS] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'ON_THE_WAY', 'ARRIVED', 'STARTED', 'FINISHED', 'CANCELED', 'PENDING_DISPUTE', 'RESCHEDULED', 'PENDING_PROVIDER_CONFIRMATION', 'REJECTED', 'NO_SHOW');
ALTER TABLE "Booking" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Booking" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "BookingStatus_old";
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "arrivedAt" TIMESTAMP(3);
