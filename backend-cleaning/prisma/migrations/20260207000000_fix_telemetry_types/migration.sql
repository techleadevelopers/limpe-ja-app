-- Migration: Fix TelemetryForceLogout userId type so it matches User.id
ALTER TABLE "TelemetryForceLogout" DROP CONSTRAINT IF EXISTS "TelemetryForceLogout_userId_fkey";
ALTER TABLE "TelemetryForceLogout" ALTER COLUMN "userId" TYPE uuid USING ("userId"::uuid);
ALTER TABLE "TelemetryForceLogout"
  ADD CONSTRAINT "TelemetryForceLogout_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
