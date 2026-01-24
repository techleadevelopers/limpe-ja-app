CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "ObservabilityLatencySummary" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "routeKey" TEXT NOT NULL,
  "p50" DOUBLE PRECISION NOT NULL,
  "p90" DOUBLE PRECISION NOT NULL,
  "p99" DOUBLE PRECISION NOT NULL,
  "sampleCount" INTEGER NOT NULL,
  "windowMinutes" INTEGER NOT NULL DEFAULT 30,
  "recordedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_observability_latency_summary_route_recorded"
  ON "ObservabilityLatencySummary" ("routeKey", "recordedAt");
