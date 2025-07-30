-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FIXED_PRICE', 'HOURLY', 'BY_SIZE', 'CUSTOM_QUOTE');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_DISPUTE';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "completedBookingsCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "fiveStarReviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyBookingsCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ProviderService" ADD COLUMN     "pricePerRoom" DECIMAL(10,2),
ADD COLUMN     "pricePerSquareMeter" DECIMAL(10,2),
ADD COLUMN     "pricingType" "PricingType" NOT NULL DEFAULT 'FIXED_PRICE';
