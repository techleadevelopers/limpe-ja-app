UPDATE "ProviderService" SET "pricePerHour" = COALESCE("pricePerHour", "price") WHERE COALESCE("pricePerHour", 0) <= 0 AND COALESCE("price", 0) > 0;
