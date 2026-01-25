-- 1. Remove a trava de chave estrangeira antiga
ALTER TABLE "TelemetryForceLogout" DROP CONSTRAINT IF EXISTS "TelemetryForceLogout_userId_fkey";

-- 2. Converte a coluna userId para TEXT para bater com a tabela User
ALTER TABLE "TelemetryForceLogout" ALTER COLUMN "userId" TYPE TEXT;

-- 3. Recria a relação (Foreign Key) com os tipos alinhados
ALTER TABLE "TelemetryForceLogout" ADD CONSTRAINT "TelemetryForceLogout_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Limpa a trava zumbi da Luciene (ID velho e ID novo)
DELETE FROM "TelemetryForceLogout" WHERE "userId" IN ('a0254df4-e49a-43c6-9a6d-c30fd6b0f8e6', 'bf4b1dec-fdb5-42dd-bc9e-289133309c6b');

-- 5. Zera a tabela para garantir que o login não seja barrado por cache de banco
TRUNCATE TABLE "TelemetryForceLogout";