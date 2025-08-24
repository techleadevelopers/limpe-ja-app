# README — Módulo de Métricas (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo de **Métricas** com base nos arquivos presentes: `metrics.module.ts`, `metrics.controller.ts`, `metrics.service.ts`, `bookings.metrics.repo.ts`, `payments.metrics.repo.ts`, `reviews.metrics.repo.ts`, `customer-metrics.query.dto.ts`.
>
> Objetivo: expor **KPIs operacionais** e **funis** (aquisição → pagamento → conclusão), GMV/receita (take rate), PIX, avaliações e coortes, com filtragem por **janela temporal**, **granularidade** e **segmentos** (cidade, provedor, origem/campanha — quando disponível).

---

## 1) Arquitetura

* **Module**: `MetricsModule` — agrega repositórios de leitura e providers utilitários (timezone, bucketing, cache).
* **Controller**: `MetricsController` — rotas REST para consultas de métricas.
* **Service**: `MetricsService` — orquestra validações (DTO), consulta repositórios e compõe respostas (composições/funis/coortes).
* **Repos** (read-only):

  * `BookingsMetricsRepo` — volume/estágios do booking, conversões, retenção e coortes.
  * `PaymentsMetricsRepo` — GMV, take rate, PIX (intent/paid/refund), ticket médio.
  * `ReviewsMetricsRepo` — notas, NPS e contagem de reviews.

**Dependências**: DB (Prisma/TypeORM), `ConfigService` (defaults), `Cache/Redis` (memoização), Sentry (telemetria).

---

## 2) DTO de consulta (code‑real)

Arquivo: `customer-metrics.query.dto.ts`

```ts
export class CustomerMetricsQueryDto {
  @IsDateString() start: string;                // ISO (inclusivo)
  @IsDateString() end: string;                  // ISO (exclusivo)
  @IsOptional() @IsEnum(['day','week','month']) granularity?: 'day'|'week'|'month' = 'day';
  @IsOptional() @IsString() timezone?: string;  // default: 'America/Sao_Paulo'
  @IsOptional() @IsString() cityId?: string;    // filtro geográfico
  @IsOptional() @IsUUID()  providerId?: string; // filtro por provedor
  @IsOptional() @IsBoolean() includeCohorts?: boolean; // retorna coortes 7d/30d
  // Campos extras opcionais (se existirem no projeto):
  @IsOptional() @IsString() channel?: string;   // origem/campanha
}
```

**Observações**

* `end` é **exclusivo** (half‑open interval). Sempre normalizar para limites **no fuso do cliente**.
* `granularity` define o bucket de group by.

---

## 3) Rotas (MetricsController)

| Método | Rota                | Descrição                                                                             |
| -----: | ------------------- | ------------------------------------------------------------------------------------- |
|    GET | `/metrics/bookings` | Funil de bookings: requested/confirmed/paid/completed/cancelled + taxas de conversão. |
|    GET | `/metrics/payments` | GMV, take rate, intents PIX, pagos PIX, conversão PIX, ticket médio.                  |
|    GET | `/metrics/reviews`  | Média de rating, NPS, contagem de reviews.                                            |
|    GET | `/metrics/overview` | Agrega bookings + payments + reviews (painel executivo).                              |
|    GET | `/metrics/cohorts`  | Cohorts de retenção (D7/D30) e repetição por coorte de 1ª compra.                     |

Todas as rotas aceitam **query** `CustomerMetricsQueryDto`.

**Erros usuais**: `VALIDATION_ERROR`, `DATE_RANGE_TOO_LARGE`, `UNSUPPORTED_GRANULARITY`, `PROVIDER_NOT_FOUND`, `CITY_NOT_FOUND`.

---

## 4) Service (assinaturas & composição)

```ts
class MetricsService {
  getBookingsMetrics(q: CustomerMetricsQueryDto): Promise<BookingsMetricsResponse>
  getPaymentsMetrics(q: CustomerMetricsQueryDto): Promise<PaymentsMetricsResponse>
  getReviewsMetrics(q: CustomerMetricsQueryDto): Promise<ReviewsMetricsResponse>
  getOverview(q: CustomerMetricsQueryDto): Promise<OverviewMetricsResponse>
  getCohorts(q: CustomerMetricsQueryDto): Promise<CohortsResponse>
}
```

**Composição**

* Normaliza janela + fuso (`timezone`).
* Chama repositórios; aplica **bucketing** por `granularity` e **preenchimento de buracos** (zero‑fill).
* Calcula **taxas** (ratios) e garante **idempotência semântica** (mesma consulta → mesmo payload, independente de reexecuções).
* Usa **cache** (Redis) com chave: `metrics:{route}:{hash(q)}` (TTL configurável).

---

## 5) Repositórios (consultas)

### 5.1 `BookingsMetricsRepo`

**Saídas** (por bucket):

* `requested`, `confirmed`, `paid`, `completed`, `cancelled`.
* `conv_requested_to_confirmed`, `conv_confirmed_to_paid`, `conv_paid_to_completed`, `conv_requested_to_completed`.
* `repeat_rate_30d` (quando `includeCohorts`).

**Esboço SQL** (adaptar para ORM):

```sql
-- bucketiza por dia/semana/mês seguindo timezone
WITH slots AS (
  SELECT time_bucket_gapfill(:granularity, ts AT TIME ZONE :tz) AS bucket
  FROM generate_series(:start::timestamptz, :end::timestamptz, :granularity) ts
), b AS (
  SELECT status, created_at AT TIME ZONE :tz AS ts
  FROM bookings
  WHERE created_at >= :start AND created_at < :end
    AND (:cityId IS NULL OR city_id = :cityId)
    AND (:providerId IS NULL OR provider_id = :providerId)
)
SELECT s.bucket,
  SUM(CASE WHEN b.status = 'REQUESTED'  THEN 1 ELSE 0 END) AS requested,
  SUM(CASE WHEN b.status = 'CONFIRMED'  THEN 1 ELSE 0 END) AS confirmed,
  SUM(CASE WHEN b.status = 'PAID'       THEN 1 ELSE 0 END) AS paid,
  SUM(CASE WHEN b.status = 'COMPLETED'  THEN 1 ELSE 0 END) AS completed,
  SUM(CASE WHEN b.status = 'CANCELLED'  THEN 1 ELSE 0 END) AS cancelled
FROM slots s
LEFT JOIN b ON date_trunc(:granularity, b.ts) = s.bucket
GROUP BY 1
ORDER BY 1;
```

**Taxas** — calculadas no Service para evitar divisão por zero.

**Retenção / repetição**

```sql
-- clientes com 1ª compra no período e que repetem em até 30d
WITH firsts AS (
  SELECT client_id, MIN(completed_at) AS first_buy
  FROM bookings
  WHERE status = 'COMPLETED'
  GROUP BY 1
  HAVING MIN(completed_at) BETWEEN :start AND :end
), repeats AS (
  SELECT b.client_id
  FROM bookings b
  JOIN firsts f ON b.client_id = f.client_id
  WHERE b.completed_at > f.first_buy
    AND b.completed_at <= f.first_buy + INTERVAL '30 days'
)
SELECT COUNT(*)::int AS first_buyers,
       COUNT(repeats.client_id)::int AS repeaters_30d
FROM firsts
LEFT JOIN repeats USING (client_id);
```

### 5.2 `PaymentsMetricsRepo`

**Saídas**:

* `gmv` (soma de `amount_paid`), `take_rate_revenue` (ex.: `gmv * 0.15`).
* `pix_intents`, `pix_paid`, `pix_conv = pix_paid/pix_intents`.
* `avg_ticket = gmv / completed`.

**Notas**: GMV deve considerar **status liquidados**; intent/pago/refund vêm de `payment_events`/`transactions`.

### 5.3 `ReviewsMetricsRepo`

**Saídas**:

* `avg_rating` (1–5), `reviews_count`.
* `nps`: `(%promoters − %detractors) × 100`.

**Cálculo NPS**

```
promoters = count(score >= 9)
detractors = count(score <= 6)
passives  = count(score in 7..8)
nps = ((promoters - detractors) / total) * 100
```

---

## 6) Respostas (tipos)

```ts
export type SeriesPoint = { bucket: string /* ISO start */, value: number };

export type BookingsMetricsResponse = {
  requested: SeriesPoint[]; confirmed: SeriesPoint[]; paid: SeriesPoint[]; completed: SeriesPoint[]; cancelled: SeriesPoint[];
  conv: { req_to_conf: number; conf_to_paid: number; paid_to_comp: number; req_to_comp: number };
};

export type PaymentsMetricsResponse = {
  gmv: SeriesPoint[]; take_rate_revenue: SeriesPoint[]; pix_intents: SeriesPoint[]; pix_paid: SeriesPoint[]; pix_conv: number; avg_ticket: number;
};

export type ReviewsMetricsResponse = { avg_rating: number; nps: number; reviews_count: SeriesPoint[] };

export type CohortsResponse = { d7_repeat_rate?: number; d30_repeat_rate?: number; tables?: any };

export type OverviewMetricsResponse = {
  bookings: BookingsMetricsResponse; payments: PaymentsMetricsResponse; reviews: ReviewsMetricsResponse;
};
```

---

## 7) Exemplos (HTTP)

### 7.1 Funil de bookings (30 dias)

```http
GET /metrics/bookings?start=2025-07-25T00:00:00Z&end=2025-08-24T00:00:00Z&granularity=day&timezone=America/Sao_Paulo
```

**200**

```json
{
  "requested": [{"bucket":"2025-08-01T00:00:00-03:00","value":32}, ...],
  "confirmed": [...],
  "paid": [...],
  "completed": [...],
  "cancelled": [...],
  "conv": {"req_to_conf":0.78,"conf_to_paid":0.91,"paid_to_comp":0.96,"req_to_comp":0.68}
}
```

### 7.2 Pagamentos/PIX

```http
GET /metrics/payments?start=2025-08-01T00:00:00Z&end=2025-08-24T00:00:00Z&granularity=day
```

**200**

```json
{
  "gmv": [{"bucket":"2025-08-10T00:00:00-03:00","value":7800}],
  "take_rate_revenue": [{"bucket":"2025-08-10T00:00:00-03:00","value":1170}],
  "pix_intents": [{"bucket":"2025-08-10T00:00:00-03:00","value":29}],
  "pix_paid": [{"bucket":"2025-08-10T00:00:00-03:00","value":26}],
  "pix_conv": 0.90,
  "avg_ticket": 300
}
```

### 7.3 Reviews / NPS

```http
GET /metrics/reviews?start=2025-08-01T00:00:00Z&end=2025-08-24T00:00:00Z&granularity=week
```

**200**

```json
{ "avg_rating": 4.82, "nps": 62, "reviews_count": [{"bucket":"2025-08-18T00:00:00-03:00","value":41}] }
```

---

## 8) Regras & cuidados

* **Timezone‑first**: agregações sempre respeitando `timezone` — não usar `UTC` puro ao bucketizar.
* **Half‑open interval**: incluir `start`, excluir `end` para evitar **double count**.
* **Zero‑fill**: preencher buckets ausentes com valor `0` para gráficos consistentes.
* **Parcialidade do último bucket**: marcar `is_partial=true` (opcional) quando `now < end_bucket`.
* **Performance**: índices por (`created_at`,`status`), (`completed_at`), (`provider_id`,`created_at`), (`city_id`,`created_at`). Considerar materialized views para janelas longas.
* **Cache**: TTL diferente por rota (ex.: `/overview` 60s; outras 5–10min). Invalidate ao finalizar booking/pagamento/review (event‑driven, se disponível).

---

## 9) Telemetria & Alertas

* Eventos: `metrics_query_started`, `metrics_query_cached`, `metrics_query_db_ms`, `metrics_query_failure`.
* Alertas (Sentry): p95 de consulta > 1.5s; erros de validação massivos.

---

## 10) Config (ENV)

```env
METRICS_TIMEZONE_DEFAULT=America/Sao_Paulo
METRICS_MAX_RANGE_DAYS=185
METRICS_CACHE_TTL_OVERVIEW_SECONDS=60
METRICS_CACHE_TTL_DEFAULT_SECONDS=600
TAKE_RATE_PERCENT=15
```

---

## 11) QA — Casos críticos

* Janela > `METRICS_MAX_RANGE_DAYS` → erro.
* `start >= end` → erro.
* `granularity` inconsistente com janela (ex.: `day` em 12 meses) → degradar para `week`/`month`.
* Falta de dados: zero‑fill + retorno consistente de séries vazias.
* Filtro `providerId` com provedor inexistente → `PROVIDER_NOT_FOUND`.
* Coortes com 0 first‑buyers → divisão por zero protegida (retornar 0 ou `null`).

---

## 12) Roadmap curto

* **Dimensões** extras: categoria de serviço, canal de aquisição, dispositivo.
* **Export** CSV/Parquet das séries.
* **Cohorts** visuais (grids D0..D30) e funis por segmento.
* **Rollups** diários pré‑computados (Airflow/DB jobs) para períodos longos.
