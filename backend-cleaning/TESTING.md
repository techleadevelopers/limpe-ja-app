# Testing Workflow (Isolated)

This project deliberately keeps its test environment isolated from production/normal deployments. Follow these steps when working with the backend tests:

1. **Bring up the test stack (Postgres+Redis).**
   ```
   npm run test:db:up
   ```
   This uses `docker compose -f docker-compose.test.yml up -d`. Postgres listens on `localhost:5433/app_test` and Redis on `localhost:6380`. Health checks ensure services are ready before you run seeds/tests.

2. **Prepare the database with migrations.**
   ```
   npm run test:db:reset
   ```
   This script executes `ts-node scripts/reset-test-db.ts`, which loads `.env.test`, validates the `_TEST` URLs, and then runs `prisma migrate reset --force` with `NODE_ENV=test` while pointing Prisma at `localhost:5433/app_test`.

3. **Run the isolated e2e suite.**
   ```
   npm run test:e2e
   ```
   This script runs `ts-node scripts/run-e2e.ts`, which loads `.env.test`, asserts the `_TEST` URLs, sets `NODE_ENV=test`, and invokes Jest (`./test/jest-e2e.json`). The harness will then override `DATABASE_URL`/`REDIS_URL` before any Nest app boots.

4. **Tear down the stack when done.**
   ```
   npm run test:db:down
   ```
   This stops and removes the test containers plus their volumes.

5. **Environment Variables**
   - Copy `.env.test.example` to `.env.test` and fill any missing secrets (e.g., `PIX_WEBHOOK_SECRET`). `.env.test` is intentionally listed in `.gitignore`.
   - The harness fails fast if `DATABASE_URL_TEST` or `REDIS_URL_TEST` is missing or points outside `localhost:5433/app_test` / `localhost:6380`.

### Anti-Production Guarantee

- `scripts/assert-test-env.ts` (`assertTestDatabaseUrl` / `assertTestRedisUrl`) enforces:
  - `DATABASE_URL_TEST` (or `REDIS_URL_TEST`) must not be empty.
  - The host must be `localhost` or `127.0.0.1`.
  - The port must be `5433` (Postgres) / `6380` (Redis).
  - The database name must be `app_test`.
  - Logs only the sanitized host/port/database (no credentials).
- Seed (`prisma/seed/seed.ts`, `align.ts`) and all test scripts instantiate Prisma with `DATABASE_URL_TEST` explicitly and run the same guard before doing any writes.
- The `test` harness (`test/setup.ts`) loads `.env.test`, asserts the `_TEST` URLs, and remaps `DATABASE_URL` / `REDIS_URL` so nothing ever touches production env values.
- All CLI helpers (`npm run test:db:reset`, `npm run test:e2e`) load `.env.test`, assert the `_TEST` URLs, and run their commands with `NODE_ENV=test`, so there is no path that touches the production database even when local `.env` is misconfigured.
- Because of these checks, attempting to run any of the test helpers with a misconfigured URL will abort immediately, protecting production inadvertently.
