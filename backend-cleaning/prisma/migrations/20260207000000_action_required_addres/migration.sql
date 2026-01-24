/*
  Manual adjustments for subscription schema delta.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'SubscriptionStatus'
      AND e.enumlabel = 'ACTION_REQUIRED_ADDRESS'
  ) THEN
    ALTER TYPE "SubscriptionStatus" ADD VALUE 'ACTION_REQUIRED_ADDRESS';
  END IF;
END
$$;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "periodId" TEXT;

ALTER TABLE "Booking"
  ADD CONSTRAINT "booking_subscription_period_unique"
    UNIQUE ("subscriptionId", "periodId");
