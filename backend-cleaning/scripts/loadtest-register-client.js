#!/usr/bin/env node
/**
 * Load test helper: fire several parallel register requests for clients and providers.
 *
 * Usage:
 *   TARGET_URL=http://localhost:3333 node scripts/loadtest-register-client.js
 *
 * This script sequentially runs two batches (each with CONCURRENT_REQUESTS):
 *   - POST /auth/register/client
 *   - POST /auth/register/provider
 *
 * It reports per-batch averages/errors/timeouts.
 */

const fetch = globalThis.fetch;

if (typeof fetch !== 'function') {
  console.error('Node must expose global fetch (Node 18+).');
  process.exit(1);
}

const TARGET_URL =
  process.env.TARGET_URL?.replace(/\/$/, '') ?? 'http://localhost:3333';
const CLIENT_ENDPOINT = '/auth/register/client';
const PROVIDER_ENDPOINT = '/auth/register/provider';
const CONCURRENT_REQUESTS = 20;
const REQUEST_TIMEOUT_MS = 30_000;
const PASSWORD = 'Teste@1234';

const names = [
  'Ana Clara',
  'Bruno Lima',
  'Camila Rocha',
  'Diego Andrade',
  'Evelyn Santos',
  'Fábio Costa',
  'Gabriela Reis',
  'Helena Cruz',
  'Igor Vieira',
  'Juliana Melo',
  'Kaio Ribeiro',
  'Larissa Pinto',
  'Marcelo Alves',
  'Nina Duarte',
  'Otávio Souza',
  'Paula Fernandes',
  'Quésia Monteiro',
  'Renato Paz',
  'Sofia Barros',
  'Thiago Ramos',
];

const stateOptions = ['SP', 'RJ', 'MG', 'PR', 'RS'];
const startTime = Date.now();

async function main() {
  console.log('🔁 Starting client registration load test...');
  const clientResults = await runBatch(
    CLIENT_ENDPOINT,
    buildClientPayload,
    'Client registration',
  );

  console.log('\n🔁 Starting provider registration load test...');
  const providerResults = await runBatch(
    PROVIDER_ENDPOINT,
    buildProviderPayload,
    'Provider registration',
  );

  const totalTime = Date.now() - startTime;
  console.log(
    `\n🧪 Total load test time: ${totalTime}ms (client: ${clientResults.length}, provider: ${providerResults.length})`,
  );
}

async function runBatch(endpoint, payloadFactory, label) {
  const results = await Promise.all(
    Array.from({ length: CONCURRENT_REQUESTS }, (_, idx) =>
      fireRequest(idx, endpoint, payloadFactory),
    ),
  );
  logSummary(label, results);
  return results;
}

async function fireRequest(index, endpoint, payloadFactory) {
  const payload = payloadFactory(index);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const start = Date.now();

  try {
    const response = await fetch(`${TARGET_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const duration = Date.now() - start;
    const text = await response
      .text()
      .catch(() => '<unable to read response text>');
    logStatus(index, endpoint, response.status, duration, text);
    return {
      status: response.status,
      duration,
      timeout: false,
    };
  } catch (error) {
    const duration = Date.now() - start;
    const timedOut = error.name === 'AbortError';
    logStatus(
      index,
      endpoint,
      'ERROR',
      duration,
      timedOut ? `timeout > ${REQUEST_TIMEOUT_MS}ms` : error.message,
    );
    return {
      status: 0,
      duration,
      timeout: timedOut,
      error: error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function logStatus(index, endpoint, status, duration, detail) {
  const label = status === 201 || status === 200 ? 'SUCCESS' : 'ERROR';
  console.log(
    `#${String(index + 1).padStart(2, '0')} [${endpoint}] ${label} ${duration}ms → ${
      typeof detail === 'string' ? detail.slice(0, 160) : detail
    }`,
  );
}

function logSummary(label, results) {
  const total = results.length;
  const errors = results.filter((r) => r.status >= 500 || r.error).length;
  const timeouts = results.filter((r) => r.timeout).length;
  const average = (
    results.reduce((sum, r) => sum + (r.duration ?? 0), 0) / total
  ).toFixed(2);
  console.log(
    `${label} summary: ${total} requests, ${errors} errors (≥500), ${timeouts} timeouts, avg ${average}ms`,
  );
}

function buildClientPayload(index) {
  const name = names[index % names.length];
  const seed = `${Date.now()}-${index}-${Math.random().toString().slice(2, 8)}`;
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}.${seed}@example.com`;
  return {
    email,
    password: PASSWORD,
    fullName: `${name} ${seed.slice(0, 4)}`,
    cpf: randomDigits(11),
    phone: randomPhone(),
    address: randomAddress(seed, index),
    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString(),
  };
}

function buildProviderPayload(index) {
  const name = `Provedor ${names[index % names.length]}`;
  const seed = `${Date.now()}-${index}-${Math.random().toString().slice(2, 8)}`;
  const email = `provider.${name.toLowerCase().replace(/\s+/g, '.')}.${seed}@example.com`;
  return {
    email,
    password: PASSWORD,
    fullName: `${name}`,
    cpf: randomDigits(11),
    dateOfBirth: '1990-01-01',
    phone: randomPhone(),
    address: randomAddress(seed, index),
    yearsOfExperience: 3 + (index % 5),
  };
}

function randomAddress(seed, index) {
  return {
    cep: randomCep(),
    street: `Rua Teste ${seed.slice(0, 3)}`,
    number: `${Math.floor(Math.random() * 1000) + 1}`,
    complement: `Apto ${Math.floor(Math.random() * 200) + 1}`,
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: stateOptions[index % stateOptions.length],
    latitude: -23.55052 + Math.random() * 0.02,
    longitude: -46.633308 + Math.random() * 0.02,
  };
}

function randomDigits(length) {
  let digits = '';
  for (let i = 0; i < length; i += 1) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  return digits;
}

function randomPhone() {
  const ddd = `${Math.floor(Math.random() * 90) + 11}`;
  const rest = randomDigits(8);
  return `${ddd}${rest}`;
}

function randomCep() {
  return `${Math.floor(Math.random() * 89999999) + 10000000}`;
}

main().catch((err) => {
  console.error('Load test failed:', err);
  process.exit(1);
});
