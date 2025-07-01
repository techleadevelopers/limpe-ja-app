-- This is an empty migration.
-- migration.sql (dentro de prisma/migrations/20250630230758_add_gist_index_on_location/)

-- This is an empty migration. -- (ou qualquer outro conteúdo que já estivesse lá)

-- Adicione a linha abaixo:
CREATE INDEX "idx_Address_location" ON "Address" USING GIST ("location");