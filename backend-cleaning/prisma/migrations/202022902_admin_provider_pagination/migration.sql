-- Add indexes needed for admin provider pagination filters
CREATE INDEX "idx_provider_full_name" ON "Provider" ("fullName");
CREATE INDEX "idx_provider_verification_status" ON "Provider" ("verificationStatus");
CREATE INDEX "idx_provider_visibility_status" ON "Provider" ("visibilityStatus");
CREATE INDEX "idx_provider_verification_status_years_experience" ON "Provider" ("verificationStatus", "yearsOfExperience");
CREATE INDEX "idx_provider_service_service_id" ON "ProviderService" ("serviceId");
