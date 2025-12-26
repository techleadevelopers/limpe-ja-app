import { spawnSync } from 'child_process';
import { config } from 'dotenv';
import { resolve } from 'path';
import { assertTestDatabaseUrl, assertTestRedisUrl } from './assert-test-env';

config({ path: resolve(process.cwd(), '.env.test'), override: false });
assertTestDatabaseUrl(process.env.DATABASE_URL_TEST);
assertTestRedisUrl(process.env.REDIS_URL_TEST);

const env = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: process.env.DATABASE_URL_TEST,
  REDIS_URL: process.env.REDIS_URL_TEST,
};

const result = spawnSync('npx', ['prisma', 'migrate', 'reset', '--force'], {
  stdio: 'inherit',
  env,
});

if (result.error) {
  throw result.error;
}
if (result.status && result.status > 0) {
  process.exit(result.status);
}
