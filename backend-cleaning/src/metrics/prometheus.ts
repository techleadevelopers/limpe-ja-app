// src/metrics/prometheus.ts
import * as client from 'prom-client';

export const contactLeakPolicyCounter = new client.Counter({
  name: 'limpeja_contact_policy_hits_total',
  help: 'Contador de violações de política de contato por tipo (PHONE/EMAIL/LINK)',
  labelNames: ['type'] as const,
});

export function initPrometheus() {
  client.collectDefaultMetrics({
    prefix: 'limpeja_',
  });
}
