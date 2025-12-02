-- DropIndex
DROP INDEX "idx_address_lat_lon";

-- DropIndex
DROP INDEX "idx_address_location";

-- AlterTable
ALTER TABLE "PaymentIntent" ADD COLUMN     "externalChargeId" TEXT,
ADD COLUMN     "externalOrderId" TEXT,
ADD COLUMN     "externalQrCodeId" TEXT,
ALTER COLUMN "gateway" SET DEFAULT 'PAGSEGURO_ORDER_PIX';
