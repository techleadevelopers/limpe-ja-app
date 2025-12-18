// src/metrics/prometheus.ts
import * as client from 'prom-client';

export function initPrometheus() {
  client.collectDefaultMetrics({
    prefix: 'limpeja_',
  });
}
