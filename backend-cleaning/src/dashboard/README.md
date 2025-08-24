# README — Módulo de Dashboard (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo de **Dashboard**, com base nos arquivos: `dashboard.module.ts`, `dashboard.controller.ts`, `dashboard.service.ts`, `dashboard.dto.ts`.
>
> **Objetivo:** expor painéis executivos e operacionais (Admin e Provedor) agregando dados de **Bookings, Pagamentos/PIX, Reviews/NPS e Cohorts**, com filtros de período e fuso, **cache** e respostas prontas para **cards** e **gráficos**.

---

## 1) Responsabilidades

* Compor **KPIs** e **séries temporais** a partir do **MetricsModule** e repositórios de leitura.
* Fornecer **endpoints** para **overview** (Admin) e **painel do Provedor** (ganhos, performance, reputação).
* Aplicar **filtros** (janela, granularidade, cidade, provedor) e garantir **zero‑fill** para gráficos.
* Expor respostas já **modeladas em cards** (ex.: GMV, Take‑Rate, Funil, NPS, Ticket Médio, Top Provedores/Bairros).

---

## 2) Arquitetura

* **Module**: `DashboardModule` — registra controller/service e injeta dependências.
* **Controller**: `DashboardController` — rotas REST para overview e detalhes.
* **Service**: `DashboardService` — orquestra consultas, bucketing e montagem das respostas de painel.
* **DTOs**: `DashboardQueryDto` (filtros de data/segmentação) e tipos de retorno.

**Dependências**: `MetricsService` (bookings/payments/reviews/cohorts), `ConfigService` (defaults), `Cache/Redis` (memoização), `Sentry` (telemetria), repositórios de leitura (quando necessário para tabelas Top N).

---

## 3) DTO de consulta (code‑real)

Arquivo: `dashboard.dto.ts` (campos esperados)

```ts
export class DashboardQueryDto {
  @IsDateString() start: string;                 // ISO inclusivo
  @IsDateString() end: string;                   // ISO exclusivo
  @IsOptional() @IsEnum(['day','week','month']) granularity?: 'day'|'week'|'month' = 'day';
  @IsOptional() @IsString() timezone?: string = 'America/Sao_Paulo';
  @IsOptional() @IsString() cityId?: string;
  @IsOptional() @IsUUID()  providerId?: string; // para painel do provedor
  @IsOptional() @IsBoolean() includeCohorts?: boolean = true;
}
```

> Observação: manter **half‑open interval** (inclui `start`, exclui `end`) e normalizar para o **fuso** do usuário.

---

## 4) Rotas (DashboardController)

| Método | Rota                      | Descrição                                                      |
| -----: | ------------------------- | -------------------------------------------------------------- |
|    GET | `/dashboard/overview`     | Painel Executivo (Admin): KPIs e séries agregadas.             |
|    GET | `/dashboard/provider`     | Painel do **provedor autenticado** (ganhos, funil, reputação). |
|    GET | `/dashboard/provider/:id` | Painel de um provedor específico (ADMIN).                      |
|    GET | `/dashboard/cards`        | Retorna **cards** canônicos para o período (sem séries).       |

**Erros comuns**: `VALIDATION_ERROR`, `DATE_RANGE_TOO_LARGE`, `PROVIDER_NOT_FOUND`, `UNAUTHORIZED`/`FORBIDDEN`.

---

## 5) Service (assinaturas & composição)

```ts
class DashboardService {
  getOverview(q: DashboardQueryDto): Promise<OverviewPayload>;
  getProviderDashboard(userId: string, q: DashboardQueryDto): Promise<ProviderPayload>;
  getProviderDashboardById(providerId: string, q: DashboardQueryDto): Promise<ProviderPayload>;
  getCards(q: DashboardQueryDto): Promise<CardsPayload>;
}
```

**Composição (Overview)**

1. Chama `MetricsService.getBookingsMetrics`, `getPaymentsMetrics`, `getReviewsMetrics`, `getCohorts` com `q`.
2. Faz **bucketing** por `granularity` (day/week/month) e **zero‑fill**.
3. Calcula **taxas** (ex.: conversões do funil, PIX conv, repeat D7/D30).
4. Monta **cards**: GMV, Receita (take‑rate), Funil, Ticket Médio, NPS, Rating, Recompra D7/D30.
5. Aplica **cache** (Redis) por 60–300s: `dashboard:overview:{hash(q)}`.

**Composição (Provider)**

* Ganhos (saldo, saques, GMV do provedor), funil (`requested→completed`), **aceitação** e **tempo de resposta**, rating/NPS, e **agenda** (slots/recência). Fonte: `MetricsService` + repositórios do provedor.

---

## 6) Payloads (tipos de resposta)

```ts
export type SeriesPoint = { bucket: string /* ISO */, value: number };

export type OverviewPayload = {
  kpis: {
    gmv: number; takeRateRevenue: number; pixConv: number; avgTicket: number; nps: number; rating: number; d7Repeat?: number; d30Repeat?: number;
  };
  series: {
    bookings: { requested: SeriesPoint[]; confirmed: SeriesPoint[]; paid: SeriesPoint[]; completed: SeriesPoint[]; cancelled: SeriesPoint[] };
    payments: { gmv: SeriesPoint[]; revenue: SeriesPoint[]; pixIntents: SeriesPoint[]; pixPaid: SeriesPoint[] };
    reviews:  { count: SeriesPoint[] };
  };
  top: {
    providers?: Array<{ id: string; name: string; rating: number; completed30d: number }>;
    neighborhoods?: Array<{ id: string; name: string; completed30d: number }>;
  };
};

export type ProviderPayload = {
  kpis: { earnings: number; gmv: number; acceptanceRate: number; avgResponseTimeSec: number; rating: number; completed30d: number };
  series: {
    bookings: { requested: SeriesPoint[]; confirmed: SeriesPoint[]; completed: SeriesPoint[]; cancelled: SeriesPoint[] };
    earnings: SeriesPoint[];
  };
  reviews: { avgRating: number; nps: number; recent: Array<{ date: string; score: number; comment?: string }> };
};

export type CardsPayload = Array<{ key: string; title: string; value: number|string; trend?: number; hint?: string }>;
```

---

## 7) Segurança & RBAC

* **/dashboard/overview**: role **ADMIN**.
* **/dashboard/provider**: **provedor autenticado** (self) — obtém `providerId` por token.
* **/dashboard/provider/\:id**: **ADMIN**.
* **PII mínima**: payload nunca retorna e‑mails/telefones; apenas IDs e agregados.

---

## 8) Performance & Cache

* **Cache Redis** por rota (`overview:60s`, `provider:120s`, `cards:60s`).
* **Limites**: `METRICS_MAX_RANGE_DAYS` (ex.: 185). Se `granularity=day` e range muito grande, **promover** para `week/month`.
* **Zero‑fill**: preencher buckets vazios; marcar `isPartial=true` no último bucket quando aplicável.

---

## 9) Exemplos (HTTP)

### 9.1 Overview (Admin)

```http
GET /dashboard/overview?start=2025-08-01T00:00:00Z&end=2025-08-24T00:00:00Z&granularity=day&timezone=America/Sao_Paulo
```

**200**

```json
{
  "kpis": { "gmv": 78200, "takeRateRevenue": 11730, "pixConv": 0.91, "avgTicket": 300, "nps": 62, "rating": 4.82, "d7Repeat": 0.23, "d30Repeat": 0.41 },
  "series": { ... },
  "top": { "providers": [{"id":"p1","name":"Ana","rating":4.9,"completed30d":22}] }
}
```

### 9.2 Painel do Provedor (self)

```http
GET /dashboard/provider?start=2025-08-01T00:00:00Z&end=2025-08-24T00:00:00Z
```

**200**

```json
{
  "kpis": { "earnings": 4120, "gmv": 27465, "acceptanceRate": 0.93, "avgResponseTimeSec": 540, "rating": 4.87, "completed30d": 18 },
  "series": { ... },
  "reviews": { "avgRating": 4.87, "nps": 58, "recent": [{"date":"2025-08-23","score":5}] }
}
```

---

## 10) Telemetria

* `dashboard_query_started`, `dashboard_query_cached`, `dashboard_query_db_ms`, `dashboard_query_failure`.
* KPI de uso: consultas/dia, p95 de latência, cache hit‑ratio, erros por rota.

---

## 11) Config (ENV)

```env
DASHBOARD_CACHE_TTL_OVERVIEW=60
DASHBOARD_CACHE_TTL_PROVIDER=120
METRICS_MAX_RANGE_DAYS=185
DASHBOARD_TIMEZONE_DEFAULT=America/Sao_Paulo
```

---

## 12) Tabelas "Top" (opcional)

* **Top providers**: maior `completed30d` (com min de reviews) + `rating`.
* **Top bairros/zonas**: maior `completed30d`.
* **Top campanhas**: quando há `channel` na reserva/pagamento.

Paginação com `limit/offset` e ordenação por métrica alvo.

---

## 13) Boas práticas de UI (consumo)

* **Cards** com valores + `trend` (variação vs. período anterior).
* **Gráficos**: linhas para séries (bookings/payments) e barras para contagens semanais; exibir tooltips com bucket ISO.
* **Empty states** amigáveis quando não houver dados.

---

## 14) QA — Casos críticos

* Range inválido (`start >= end`) ou muito grande → erro ou promover granularity.
* Falta de dados: garantir zero‑fill e KPIs consistentes (0/`null`).
* Filtros inválidos (provider/city) → erro claro.
* Timezone incorreto → comparar com `timezone` default.

---

## 15) Melhorias avançadas (quando necessário)

1. **Rollups diários** pré‑computados (job noturno) para janelas > 6 meses.
2. **Cohorts visuais** (grade D0..D30) e funil por segmento (cidade/canal).
3. **Alertas inteligentes** (ex.: queda de conversão PIX), com thresholds por cidade e push para Admin.
4. **Atribuição de aquisição** (canal/campanha) e impacto em **LTV** e **CAC**.
5. **Export** (CSV/Parquet) e **share link** com expiração.
6. **AB testing** de promoções e variação por coorte; camada de **feature flags** por cidade.
7. **Drilldown**: permitir navegar do card para a lista de bookings/pagamentos base.
8. **Streaming SSE/WebSocket** para near‑real‑time (<60s) em campanhas.
9. **Multi‑tenant por cidade** (prefixo de cache e rate‑limit segmentado).

---

## 16) Conclusão

O módulo de Dashboard compõe os dados do **MetricsModule** e entrega respostas
**consistentes, rápidas e baratas** de consumir no front. Com os **TTL de cache** e a promoção
inteligente da granularidade, atende bem ao MVP e escala conforme a base cresce; as
melhorias avançadas listadas permitem evoluir para análises mais profundas sem reescrever o módulo.
