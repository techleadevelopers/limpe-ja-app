/*
  Warnings:

  - Added the required column `updatedAt` to the `ProviderService` table without a default value. This is not possible if the table is not empty.
    (Esta warning é do Prisma original e será resolvida pela edição manual abaixo)

*/
-- AlterTable (Mantenha esta parte se foi gerada para o modelo Provider)
ALTER TABLE "Provider" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable para ProviderService
-- 1. Adiciona 'createdAt' com default (esta parte geralmente é tratada corretamente pelo Prisma)
ALTER TABLE "ProviderService" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Adiciona 'updatedAt' como NULA inicialmente
ALTER TABLE "ProviderService" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- 3. Popula 'updatedAt' para as linhas existentes com um valor padrão (ex: timestamp atual)
UPDATE "ProviderService" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

-- 4. Altera 'updatedAt' para ser NOT NULL
ALTER TABLE "ProviderService" ALTER COLUMN "updatedAt" SET NOT NULL;