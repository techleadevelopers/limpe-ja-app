-- AlterTable
ALTER TABLE "ProviderService" ADD COLUMN     "pricePerHour" DECIMAL(10,2),
ALTER COLUMN "price" DROP NOT NULL;
