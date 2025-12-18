# Observability quick setup (Prometheus + Alertmanager + Tempo/Jaeger)

## 1) Backend envs
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318/v1/traces`
- `OTEL_SERVICE_NAME=backend-cleaning`
- `OTEL_DEBUG=1` (opcional em staging)

## 2) Prometheus scrape
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: backend
    metrics_path: /metrics/prometheus
    static_configs:
      - targets: ["backend-host:3000"]

  - job_name: health-readiness
    metrics_path: /health/readiness
    scrape_interval: 30s
    scrape_timeout: 5s
    static_configs:
      - targets: ["backend-host:3000"]
```

## 3) Alerting rules (exemplos)
```yaml
groups:
  - name: backend.rules
    rules:
      - alert: HighLatencyP95
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route, method)) > 1.5
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "p95 alto em {{ $labels.route }}"
          description: "p95 > 1.5s por 5m ({{ $labels.method }})"

      - alert: ErrorRateHigh
        expr: (sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) * 100 > 2
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "Erro 5xx acima de 2%"
          description: "Erro 5xx acima de 2% nos últimos 5m"

      - alert: ReadinessFail
        expr: probe_success{job="health-readiness"} == 0
        for: 2m
        labels: { severity: critical }
        annotations:
          summary: "Readiness falhou"
          description: "/health/readiness retornou falha"
```

## 4) Alertmanager (receptor Slack exemplo)
```yaml
route:
  receiver: slack-notify
  repeat_interval: 1h

receivers:
  - name: slack-notify
    slack_configs:
      - api_url: https://hooks.slack.com/services/XXX/YYY/ZZZ
        channel: "#alerts"
        text: "{{ .CommonAnnotations.summary }}\n{{ .CommonAnnotations.description }}"
```

## 5) Tempo/Jaeger (OTLP HTTP)
- Exemplo docker-compose (Tempo):
```yaml
services:
  tempo:
    image: grafana/tempo:latest
    command: ["-config.file=/etc/tempo.yaml"]
    ports:
      - "4318:4318" # OTLP/HTTP
      - "3200:3200" # Tempo query (opcional)
```
- No Grafana, adicione data source Tempo/Jaeger apontando para o querier. Para Tempo standalone, use `http://tempo:3200` (ou host/porta expostos).

## 6) Dashboards (Grafana)
- Use as consultas de `documentation/monitoring-promql.md` para painéis de latência, erro, throughput, health.
- Adicione links de trace (Data source Tempo/Jaeger) em painéis de rota para explorar spans.

## 7) Sanidade pós-deploy
- Confirmar scrape de `/metrics/prometheus` no Prometheus.
- Disparar tráfego e ver spans no Tempo/Jaeger.
- Simular falha (latência artificial ou 500) e validar alert firing no Alertmanager/Slack.
