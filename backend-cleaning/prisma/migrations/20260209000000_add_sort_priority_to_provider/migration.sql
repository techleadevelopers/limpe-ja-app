ALTER TABLE "Provider" ADD COLUMN "sortPriority" DOUBLE PRECISION NOT NULL DEFAULT 0;
CREATE INDEX "idx_provider_sort_priority" ON "Provider" ("sortPriority");
