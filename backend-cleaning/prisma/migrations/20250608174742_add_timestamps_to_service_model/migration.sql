-- CreateTable
ALTER TABLE "Service" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Passo intermediário: Adicionar a coluna updatedAt permitindo NULL temporariamente
ALTER TABLE "Service" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Passo intermediário: Preencher a coluna updatedAt para as linhas existentes
-- Você pode usar CURRENT_TIMESTAMP ou o valor de createdAt para as linhas existentes
UPDATE "Service" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Passo final: Alterar a coluna updatedAt para NOT NULL
ALTER TABLE "Service" ALTER COLUMN "updatedAt" SET NOT NULL;