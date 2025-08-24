/*
  Warnings:

  - The values [ALL] on the enum `CouponTarget` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `ticketId` to the `DisputeMessage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CouponTarget_new" AS ENUM ('GENERAL', 'NEW_CLIENTS', 'SPECIFIC_SERVICE', 'SPECIFIC_PROVIDER', 'NEW_CUSTOMER', 'REFERRAL_REFERRED', 'REFERRAL_REFERRER', 'MISSION_REWARD', 'REPEAT_CUSTOMER');
ALTER TABLE "Coupon" ALTER COLUMN "target" TYPE "CouponTarget_new" USING ("target"::text::"CouponTarget_new");
ALTER TYPE "CouponTarget" RENAME TO "CouponTarget_old";
ALTER TYPE "CouponTarget_new" RENAME TO "CouponTarget";
DROP TYPE "CouponTarget_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "DisputeMessage" DROP CONSTRAINT "DisputeMessage_disputeId_fkey";

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "issuedBy" TEXT;

-- AlterTable
ALTER TABLE "DisputeMessage" ADD COLUMN     "ticketId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "DisputeMessage" ADD CONSTRAINT "DisputeMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeMessage" ADD CONSTRAINT "DisputeMessage_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
