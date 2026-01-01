BEGIN;

ALTER TABLE "ProviderService"
  ADD COLUMN IF NOT EXISTS "needsReview" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "ProviderService"
  ALTER COLUMN "pricePerHour" SET DEFAULT 0;

-- 1) Normaliza serviços HOURLY existentes (mantém pricePerHour quando já válido).
UPDATE "ProviderService"
SET
  "pricePerHour" = CASE
    WHEN (COALESCE("pricePerHour", 0) <= 0) AND "price" IS NOT NULL AND "price" > 0 THEN "price"
    ELSE COALESCE("pricePerHour", 0)
  END,
  "needsReview" = FALSE
WHERE "pricingType" = 'HOURLY';

-- 2) FIXED_PRICE vira HOURLY via heurística (divide por 4h) e marca revisão.
UPDATE "ProviderService"
SET
  "pricePerHour" = CASE
    WHEN "price" IS NOT NULL AND "price" > 0 THEN ROUND(("price" / 4.0)::numeric, 2)
    ELSE 0
  END,
  "needsReview" = TRUE
WHERE "pricingType" = 'FIXED_PRICE'
  AND (COALESCE("pricePerHour", 0) = 0);

-- 3) BY_SIZE continua inválido até revisão manual.
UPDATE "ProviderService"
SET
  "pricePerHour" = 0,
  "needsReview" = TRUE
WHERE "pricingType" = 'BY_SIZE';

-- 4) Qualquer registro sem preço válido acaba marcado para revisão.
UPDATE "ProviderService"
SET
  "pricePerHour" = 0,
  "needsReview" = TRUE
WHERE (COALESCE("pricePerHour", 0) <= 0)
  AND "needsReview" = FALSE;

-- 5) Limpa campos legados para evitar uso acidental.
UPDATE "ProviderService"
SET
  "price" = NULL,
  "pricePerSquareMeter" = NULL,
  "pricePerRoom" = NULL,
  "pricingType" = NULL;

-- 6) Normalize ProviderServiceVersion history to store pricePerHour.
ALTER TABLE "ProviderServiceVersion"
  ADD COLUMN IF NOT EXISTS "pricePerHour" NUMERIC(10, 2);

UPDATE "ProviderServiceVersion"
SET "pricePerHour" = COALESCE("price", 0)
WHERE "pricePerHour" IS NULL;

ALTER TABLE "ProviderServiceVersion"
  ALTER COLUMN "pricePerHour" SET NOT NULL;

ALTER TABLE "ProviderServiceVersion"
  ALTER COLUMN "pricingType" DROP NOT NULL;

ALTER TABLE "ProviderServiceVersion"
  DROP COLUMN IF EXISTS "price";

ALTER TABLE "ProviderService"
  ALTER COLUMN "pricePerHour" SET NOT NULL;

ALTER TABLE "ProviderService"
  ALTER COLUMN "pricingType" DROP DEFAULT,
  ALTER COLUMN "pricingType" DROP NOT NULL;

DROP INDEX IF EXISTS "ProviderService_providerId_serviceId_pricingType_key";
CREATE UNIQUE INDEX IF NOT EXISTS "ProviderService_providerId_serviceId_key"
  ON "ProviderService" ("providerId", "serviceId");

ALTER TABLE "ProviderService"
  DROP CONSTRAINT IF EXISTS "ProviderService_price_hourly_or_review";

ALTER TABLE "ProviderService"
  ADD CONSTRAINT "ProviderService_price_hourly_or_review"
  CHECK (("pricePerHour" > 0) OR ("needsReview" = TRUE));

COMMIT;
