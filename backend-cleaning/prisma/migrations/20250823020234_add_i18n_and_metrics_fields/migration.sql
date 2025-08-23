-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "acceptanceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "averageResponseTime" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "preferredLanguage" TEXT;
