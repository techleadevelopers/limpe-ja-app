-- Ensure PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Backfill geometry from latitude/longitude where missing
UPDATE "Address"
SET "location" = ST_SetSRID(
  ST_MakePoint(CAST("longitude" AS double precision), CAST("latitude" AS double precision)),
  4326
)
WHERE "location" IS NULL AND "longitude" IS NOT NULL AND "latitude" IS NOT NULL;

-- Recreate GiST index on geometry for spatial queries
CREATE INDEX IF NOT EXISTS "idx_Address_location" ON "Address" USING GIST ("location");

