import { URL } from 'url';
import { config } from 'dotenv';
import { resolve } from 'path';

const TEST_DB_HOSTS = new Set(['localhost', '127.0.0.1']);
const TEST_REDIS_HOSTS = new Set(['localhost', '127.0.0.1']);

export interface TestDatabaseInfo {
  host: string;
  port: string;
  dbName: string;
}

export interface TestRedisInfo {
  host: string;
  port: string;
}

function sanitizeDbUrl(raw: string): TestDatabaseInfo {
  const parsed = new URL(raw);
  const host = parsed.hostname;
  const port = parsed.port;
  const dbName = parsed.pathname?.replace(/^\//, '');
  if (!host || !TEST_DB_HOSTS.has(host)) {
    throw new Error(
      `Test DB host must be localhost/127.0.0.1. Received: ${host || 'none'}.`,
    );
  }
  if (port !== '5433') {
    throw new Error(`Test DB port must be 5433. Received: ${port || 'none'}.`);
  }
  if (dbName !== 'app_test') {
    throw new Error(
      `Test DB must target database 'app_test'. Received: ${dbName || 'none'}.`,
    );
  }
  return { host, port, dbName };
}

function sanitizeRedisUrl(raw: string): TestRedisInfo {
  const parsed = new URL(raw);
  const host = parsed.hostname;
  const port = parsed.port;
  if (!host || !TEST_REDIS_HOSTS.has(host)) {
    throw new Error(
      `Test Redis host must be localhost/127.0.0.1. Received: ${host || 'none'}.`,
    );
  }
  if (port !== '6380') {
    throw new Error(`Test Redis port must be 6380. Received: ${port || 'none'}.`);
  }
  return { host, port };
}

export function assertTestDatabaseUrl(raw?: string): TestDatabaseInfo {
  if (!raw) {
    throw new Error(
      'DATABASE_URL_TEST is required for test automation and must point to localhost:5433/app_test.',
    );
  }
  const info = sanitizeDbUrl(raw);
  console.info(`[Test Env] Using TEST DB: ${info.host}:${info.port}/${info.dbName}`);
  return info;
}

export function assertTestRedisUrl(raw?: string): TestRedisInfo {
  if (!raw) {
    throw new Error(
      'REDIS_URL_TEST is required for test automation and must point to localhost:6380.',
    );
  }
  const info = sanitizeRedisUrl(raw);
  console.info(`[Test Env] Using TEST REDIS: ${info.host}:${info.port}`);
  return info;
}

if (require.main === module) {
  const envPath = resolve(process.cwd(), '.env.test');
  config({ path: envPath, override: false });
  assertTestDatabaseUrl(process.env.DATABASE_URL_TEST);
  assertTestRedisUrl(process.env.REDIS_URL_TEST);
}
