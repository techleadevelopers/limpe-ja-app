#!/usr/bin/env node
/**
 * Fire load tests against the four critical routes tracked by Observabilidade.
 *
 * Supports:
 *   1. POST /auth/register/client      (public)
 *   2. GET  /providers/nearby          (public)
 *   3. POST /bookings                 (requires CLIENT_AUTH_TOKEN + provider/service IDs)
 *   4. POST /payments/webhook/pix     (requires PIX_WEBHOOK_SECRET for signature)
 *
 * Usage:
 *   BASE_URL=https://your-host node scripts/loadtest-critical-routes.js
 *   CLIENT_AUTH_TOKEN=ey... \
 *   BOOKING_PROVIDER_ID=... \
 *   BOOKING_SERVICE_ID=... \
 *   PIX_WEBHOOK_SECRET=secret \
 *     node scripts/loadtest-critical-routes.js
 *
 * The script sends `CONCURRENT_REQUESTS` parallel calls per scenario and reports durations/statuses.
 */

const fetch = globalThis.fetch;

if (typeof fetch !== 'function') {
  console.error('Node 18+ is required for global fetch.');
  process.exit(1);
}

const BASE_URL =
  (process.env.BASE_URL ?? 'http://localhost:3333').replace(/\/$/, '');
const CONCURRENT_REQUESTS = Number(process.env.CONCURRENT_REQUESTS) || 12;
const TIMEOUT_MS = 30_000;
const PASSWORD = 'Teste@1234';

const PROVIDER_ID = process.env.BOOKING_PROVIDER_ID;
const PROVIDER_SERVICE_ID = process.env.BOOKING_SERVICE_ID;
const CLIENT_AUTH_TOKEN = process.env.CLIENT_AUTH_TOKEN;
const PIX_WEBHOOK_SECRET = process.env.PIX_WEBHOOK_SECRET;

const scenarios = [
  {
    name: 'register',
    label: 'Cadastro (/auth/register/client)',
    builder: (index) => ({
      method: 'POST',
      path: '/auth/register/client',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRegisterPayload(index)),
    }),
  },
  {
    name: 'radius',
    label: 'Proximidade (/providers/nearby)',
    builder: () => ({
      method: 'GET',
      path: '/providers/nearby?latitude=-23.55052&longitude=-46.633308&radius=8',
    }),
  },
  {
    name: 'bookings',
    label: 'Agendamentos (/bookings)',
    requires: PROVIDER_ID && PROVIDER_SERVICE_ID && CLIENT_AUTH_TOKEN,
    builder: (index) => ({
      method: 'POST',
      path: '/bookings',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CLIENT_AUTH_TOKEN}`,
      },
      body: JSON.stringify(buildBookingPayload(index)),
    }),
    skipMessage:
      'bookings scenario skipped because BOOKING_PROVIDER_ID, BOOKING_SERVICE_ID or CLIENT_AUTH_TOKEN is missing.',
  },
  {
    name: 'pix',
    label: 'Pix Webhook (/payments/webhook/pix)',
    requires: Boolean(PIX_WEBHOOK_SECRET),
    builder: (index) => {
      const payload = buildPixWebhookPayload(index);
      const rawBody = JSON.stringify(payload);
      const headers = {
        'Content-Type': 'application/json',
        'x-signature': PIX_WEBHOOK_SECRET
          ? createSignature(PIX_WEBHOOK_SECRET, rawBody)
          : '',
      };
      return {
        method: 'POST',
        path: '/payments/webhook/pix',
        headers,
        body: rawBody,
      };
    },
    skipMessage:
      'pix scenario skipped because PIX_WEBHOOK_SECRET is not configured.',
  },
];

async function main() {
  for (const scenario of scenarios) {
    if (scenario.requires === false) {
      console.warn(scenario.skipMessage || `Scenario ${scenario.name} skipped.`);
      continue;
    }
    console.log(`\n⏱️ Running load test for ${scenario.label}`);
    await runScenario(scenario);
  }
}

async function runScenario(scenario) {
  const results = await Promise.all(
    Array.from({ length: CONCURRENT_REQUESTS }, (_, index) =>
      fireRequest(scenario, index),
    ),
  );

  const total = results.length;
  const errors = results.filter((r) => r.status >= 500 || r.error);
  const timeouts = results.filter((r) => r.timeout);
  const avg = (
    results.reduce((sum, r) => sum + (r.duration ?? 0), 0) / total
  ).toFixed(2);

  console.log(
    `✔️ ${scenario.label} summary: ${total} requests, ${errors.length} errors, ${timeouts.length} timeouts, avg ${avg}ms`,
  );
}

async function fireRequest(scenario, index) {
  const params = scenario.builder(index);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${params.path}`, {
      method: params.method,
      headers: params.headers,
      body: params.body,
      signal: controller.signal,
    });
    const duration = Date.now() - start;
    const text = await safeRead(response);
    logResult(index, params.path, response.status, duration, text);
    return {
      status: response.status,
      duration,
      timeout: false,
    };
  } catch (error) {
    const duration = Date.now() - start;
    const timeoutFlag = error.name === 'AbortError';
    logResult(
      index,
      params.path,
      'ERROR',
      duration,
      timeoutFlag ? `timeout > ${TIMEOUT_MS}ms` : error.message,
    );
    return {
      status: 0,
      duration,
      timeout: timeoutFlag,
      error: error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function logResult(index, path, status, duration, detail) {
  console.log(
    `#${String(index + 1).padStart(2, '0')} [${path}] ${status} ${duration}ms → ${
      typeof detail === 'string' ? detail.slice(0, 120) : detail
    }`,
  );
}

function safeRead(response) {
  return response.text().catch(() => '');
}

function buildRegisterPayload(index) {
  const seed = `${Date.now()}-${index}-${Math.random().toString().slice(2, 6)}`;
  return {
    email: `loadtest.${seed}@example.com`,
    password: PASSWORD,
    fullName: `Carga ${seed}`,
    cpf: randomDigits(11),
    phone: randomPhone(),
    address: randomAddress(),
    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString(),
  };
}

function buildBookingPayload(index) {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return {
    providerId: PROVIDER_ID,
    providerServiceId: PROVIDER_SERVICE_ID,
    scheduledDate: date.toISOString().split('T')[0],
    scheduledTime: '10:00',
    totalPrice: 150,
    notes: `Loadtest ${index}`,
    address: randomAddress(),
  };
}

function buildPixWebhookPayload(index) {
  const reference = `loadtest-pix-${Date.now()}-${index}`;
  return {
    event: 'psp.pix.completed',
    reference_id: reference,
    resource_id: reference,
    status: 'PAID',
    transaction: {
      reference_id: reference,
      id: `txn-${reference}`,
    },
    charges: [
      {
        reference_id: reference,
        status: 'PAID',
      },
    ],
  };
}

function randomDigits(length) {
  let digits = '';
  for (let i = 0; i < length; i += 1) {
    digits += Math.floor(Math.random() * 10);
  }
  return digits;
}

function randomPhone() {
  const ddd = `${Math.floor(Math.random() * 80) + 11}`;
  const suffix = randomDigits(8);
  return `${ddd}${suffix}`;
}

function randomAddress() {
  return {
    cep: `${Math.floor(Math.random() * 89999999) + 10000000}`,
    street: 'Rua Teste Load',
    number: `${Math.floor(Math.random() * 4000) + 1}`,
    complement: 'Apto Load',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.55 + Math.random() * 0.02,
    longitude: -46.63 + Math.random() * 0.02,
  };
}

function createSignature(secret, body) {
  const crypto = require('crypto');
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

main().catch((err) => {
  console.error('Load test runner failed:', err);
  process.exit(1);
});
