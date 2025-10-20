-- Add unique idempotency guard for loyalty transactions by (userId, type, referenceId)
-- Allows multiple rows with NULL referenceId, but enforces uniqueness when referenceId is set

DO $$ BEGIN
  CREATE UNIQUE INDEX "LoyaltyTransaction_userId_type_referenceId_unique"
  ON "LoyaltyTransaction" ("userId", "type", "referenceId")
  WHERE "referenceId" IS NOT NULL;
EXCEPTION WHEN others THEN
  -- ignore if already exists
  NULL;
END $$;

