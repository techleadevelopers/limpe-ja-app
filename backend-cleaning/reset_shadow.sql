SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'prisma_migrate_shadow_db_ca6bc851-8e74-4831-9ab4-e6fa4cfd3a80';
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'cleaning_db_shadow';
DROP DATABASE IF EXISTS "prisma_migrate_shadow_db_ca6bc851-8e74-4831-9ab4-e6fa4cfd3a80";
DROP DATABASE IF EXISTS cleaning_db_shadow;
CREATE DATABASE cleaning_db_shadow;
