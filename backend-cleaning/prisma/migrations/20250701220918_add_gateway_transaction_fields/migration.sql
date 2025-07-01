/*
  Warnings:

  - A unique constraint covering the columns `[gatewayTransactionId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "targetUrl" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "gatewayTransactionId" TEXT,
ADD COLUMN     "qrCodeUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_gatewayTransactionId_key" ON "Transaction"("gatewayTransactionId");
