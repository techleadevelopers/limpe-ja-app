/*
  Warnings:

  - The values [PERCENTAGE,FIXED_AMOUNT] on the enum `CouponType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[myReferralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `valueType` on the `Coupon` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `target` on the `Coupon` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CouponTarget" ADD VALUE 'NEW_CUSTOMER';
ALTER TYPE "CouponTarget" ADD VALUE 'REFERRAL_REFERRED';
ALTER TYPE "CouponTarget" ADD VALUE 'REFERRAL_REFERRER';
ALTER TYPE "CouponTarget" ADD VALUE 'MISSION_REWARD';
ALTER TYPE "CouponTarget" ADD VALUE 'REPEAT_CUSTOMER';

-- AlterEnum
BEGIN;
CREATE TYPE "CouponType_new" AS ENUM ('PERCENT', 'FIXED');
ALTER TABLE "Coupon" ALTER COLUMN "valueType" TYPE "CouponType_new" USING ("valueType"::text::"CouponType_new");
ALTER TYPE "CouponType" RENAME TO "CouponType_old";
ALTER TYPE "CouponType_new" RENAME TO "CouponType";
DROP TYPE "CouponType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LoyaltyTransactionType" ADD VALUE 'REFERRAL_CONVERSION';
ALTER TYPE "LoyaltyTransactionType" ADD VALUE 'PROFILE_COMPLETION';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "discountAmount" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Coupon" ADD COLUMN     "firstBookingOnly" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "issuedToUserId" TEXT,
ADD COLUMN     "maxDiscount" DECIMAL(10,2),
DROP COLUMN "valueType",
ADD COLUMN     "valueType" "CouponType" NOT NULL,
DROP COLUMN "target",
ADD COLUMN     "target" "CouponTarget" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "myReferralCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_myReferralCode_key" ON "User"("myReferralCode");

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_issuedToUserId_fkey" FOREIGN KEY ("issuedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
