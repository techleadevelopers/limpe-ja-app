-- Create visibility status enum and tracking columns for providers' vitrine state.
CREATE TYPE "ProviderVisibilityStatus" AS ENUM (
  'VISIBLE',
  'VITRINE_IRREGULAR',
  'PENDING_VITRINE_REVIEW'
);

ALTER TABLE "Provider"
  ADD COLUMN "visibilityStatus" "ProviderVisibilityStatus" NOT NULL DEFAULT 'VISIBLE',
  ADD COLUMN "visibilityReason" text,
  ADD COLUMN "visibilityUpdatedAt" timestamp(3) with time zone;
