// src/metrics/prometheus.ts
import * as client from 'prom-client';

export const contactLeakPolicyCounter = new client.Counter({
  name: 'limpeja_contact_policy_hits_total',
  help: 'Contador de violações de política de contato por tipo (PHONE/EMAIL/LINK)',
  labelNames: ['type'] as const,
});

export const pixWebhookSuccessCounter = new client.Counter({
  name: 'limpeja_pix_webhook_success_total',
  help: 'Contador de webhooks PIX processados com sucesso',
  labelNames: ['reason'] as const,
});

export const pixWebhookFailureCounter = new client.Counter({
  name: 'limpeja_pix_webhook_failure_total',
  help: 'Contador de webhooks PIX que falharam durante o processamento',
  labelNames: ['reason'] as const,
});

export const pixWebhookProcessingDuration = new client.Histogram({
  name: 'limpeja_pix_webhook_processing_duration_seconds',
  help: 'Tempo gasto para processar webhooks de PIX',
  labelNames: ['outcome'] as const,
  buckets: [0.05, 0.1, 0.3, 1, 3, 10],
});

export const queueJobProcessingDuration = new client.Histogram({
  name: 'limpeja_queue_job_processing_duration_seconds',
  help: 'Tempo gasto para processar jobs das filas',
  labelNames: ['queue', 'job'] as const,
  buckets: [0.05, 0.1, 0.5, 1, 3, 10, 30],
});

export const queueWaitingGauge = new client.Gauge({
  name: 'limpeja_queue_waiting_jobs',
  help: 'Número de jobs aguardando processamento em cada fila',
  labelNames: ['queue'] as const,
});

export function initPrometheus() {
  client.collectDefaultMetrics({
    prefix: 'limpeja_',
  });
}
