-- Add the column as nullable first (temporarily)
ALTER TABLE "public"."Review" ADD COLUMN "updatedAt" TIMESTAMP(3);

-- Set a default value for existing rows
UPDATE "public"."Review" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;

-- Then alter the column to be NOT NULL
ALTER TABLE "public"."Review" ALTER COLUMN "updatedAt" SET NOT NULL;