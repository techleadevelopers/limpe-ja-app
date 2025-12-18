# Monitoring cheatsheet (Grafana/Alertmanager)

## Endpoints
- Metrics (Prometheus): `https://<backend>/metrics/prometheus`
- Health:
  - Liveness: `https://<backend>/health/liveness`
  - Readiness: `https://<backend>/health/readiness`

## PromQL snippets
- **Latency p95**:
  ```
  histogram_quantile(
    0.95,
    sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route, method)
  )
  ```
- **Error rate (5xx) %**:
  ```
  sum(rate(http_requests_total{status_code=~"5.."}[5m])) 
    / sum(rate(http_requests_total[5m])) * 100
  ```
- **Throughput (req/s)**:
  ```
  sum(rate(http_requests_total[1m]))
  ```
- **Cache health (readiness)**: alert if `health_readiness` returns non-200 or if `cache` != "up" in payload (use blackbox or HTTP probe).

## Alert ideas (Alertmanager)
- **High latency**: p95 > 1.5s for 5m on any route.
- **Error spike**: 5xx rate > 2% for 5m.
- **Readiness fail**: `/health/readiness` non-200 for 2 probes.
- **Queue/job stall**: scrape queue metrics if exposed; alert on jobs waiting > threshold.

## Tracing
- The Nest tracing interceptor emits spans using `@opentelemetry/api` (context key `http.*`). Plug an OTLP exporter/collector (Jaeger/Tempo) to ingest spans.
- Suggested samplers: 0.1–0.2 in prod; 1.0 in staging.
- Tag routes with `http.route`, `http.method`, `http.status_code`, `http.response_time_ms`.

## Dashboards
- Panels:
  - Latency p50/p95/p99 by route.
  - Requests by status class (2xx/4xx/5xx).
  - Top routes by error rate.
  - Cache hit/miss (when available).
  - Health check status (liveness/readiness) as single stats.
  - Tracing links: route name → explore traces in Jaeger/Tempo.
