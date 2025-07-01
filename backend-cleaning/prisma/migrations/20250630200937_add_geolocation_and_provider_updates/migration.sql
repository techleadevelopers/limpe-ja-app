/*
  Warnings:

  - Added the required column `updatedAt` to the `Provider` table without a default value. This is not possible if the table is not empty.

*/
-- Habilita a extensão PostGIS no banco de dados.
-- O "IF NOT EXISTS" evita erros se a extensão já estiver habilitada.
CREATE EXTENSION IF NOT EXISTS postgis;

-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_userId_fkey";

-- DropForeignKey
ALTER TABLE "Provider" DROP CONSTRAINT "Provider_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProviderService" DROP CONSTRAINT "ProviderService_providerId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_providerId_fkey";

-- AlterTable
ALTER TABLE "Address" ADD COLUMN "location" geometry(Point, 4326);

-- AlterTable
ALTER TABLE "Provider"
    ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- CORREÇÃO AQUI: Adiciona DEFAULT CURRENT_TIMESTAMP para 'updatedAt'
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "cpf" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProviderService" ALTER COLUMN "durationMinutes" DROP NOT NULL;

-- REMOVIDO: A linha CREATE UNIQUE INDEX "Transaction_bookingId_key" não deve estar aqui.
-- Se por algum motivo ela ainda aparecer no seu arquivo gerado (o que não aconteceu no seu último output, mas para garantir),
-- VOCÊ DEVE APAGÁ-LA MANUALMENTE. A remoção do @unique do schema.prisma garante que o Prisma não a inclua.

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;