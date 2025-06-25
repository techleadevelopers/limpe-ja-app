-- AlterTable
-- 1. Adicionar createdAt com valor padrão
ALTER TABLE "Client" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. Adicionar updatedAt permitindo NULL temporariamente
ALTER TABLE "Client" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- 3. Preencher a coluna updatedAt para as linhas existentes
-- Use CURRENT_TIMESTAMP para preencher todas as linhas existentes
UPDATE "Client" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;

-- 4. Alterar a coluna updatedAt para NOT NULL (obrigatória)
ALTER TABLE "Client" ALTER COLUMN "updatedAt" SET NOT NULL;