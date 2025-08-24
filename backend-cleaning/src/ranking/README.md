# README — Módulo de Ranking (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo de **Ranking de Provedores**, com base nos arquivos: `ranking.module.ts`, `ranking.controller.ts`, `ranking.service.ts`, `provider-ranking.dto.ts`.
>
> Objetivo: ordenar provedores para busca/descoberta considerando **qualidade, proximidade e desempenho**, aplicando **boosts** de gamificação e **penalidades** operacionais, com resultados **paginados**, **cacheados** e **auditáveis**.

---

## 1) Arquitetura

* **Module**: `RankingModule` — registra controller/service, injeta dependências (Providers/Bookings/Reviews/Missions/Cache/Config/DB geoespacial).
* **Controller**: `RankingController` — expõe rotas para **rankear** e depurar scores.
* **Service**: `RankingService` — agrega sinais, normaliza, calcula `score`, aplica boosts/penalidades, pagina e devolve.
* **DTOs**: `ProviderRankingQueryDto` (entrada), `ProviderRankingItem`/`ProviderRankingResponse` (saída).

**Dependências típicas**: `ProvidersRepo` (geo + dados do provedor), `BookingsMetricsRepo` (recência/volume/cancelamento), `ReviewsRepo` (rating/share5★), `Missions/BadgesRepo` (boosts), `Cache/Redis`, `ConfigService`, banco com **PostGIS** (distância).

---

## 2) DTOs (code‑real)

Arquivo: `provider-ranking.dto.ts` (campos esperados)

```ts
export class ProviderRankingQueryDto {
  @IsNumber() lat: number;
  @IsNumber() lon: number;
  @IsOptional() @IsNumber() radiusKm: number = 10;      // raio de busca
  @IsOptional() @IsUUID() serviceId?: string;           // filtra por serviço/categoria
  @IsOptional() @IsString() cityId?: string;            // filtro geográfico rápido
  @IsOptional() @IsInt() limit: number = 20;
  @IsOptional() @IsInt() offset: number = 0;
  @IsOptional() @IsEnum(['score','distance','rating']) sort: 'score'|'distance'|'rating' = 'score';
  @IsOptional() @IsString() q?: string;                 // texto (nome/descrição)
}

export type ProviderRankingItem = {
  providerId: string;
  name: string;
  distanceKm: number;
  score: number;                   // 0..1
  rating: number;                  // 1..5
  share5stars: number;             // 0..1
  acceptanceRate: number;          // 0..1 (com suavização Bayes)
  avgResponseTimeSec: number;      // segundos
  recentBookings30d: number;
  badges?: string[];               // ex.: ['TOP_BAIRRO']
  boosts?: Record<string, number>; // contribuição de boosts
  penalties?: Record<string, number>; // contribuição de penalidades
};

export type ProviderRankingResponse = { items: ProviderRankingItem[]; total: number; queryEcho: ProviderRankingQueryDto };
```

---

## 3) Rotas (RankingController)

| Método | Rota                                   | Descrição                                                                            |
| -----: | -------------------------------------- | ------------------------------------------------------------------------------------ |
|    GET | `/ranking/providers`                   | Retorna lista ranqueada de provedores conforme `ProviderRankingQueryDto` (paginado). |
|    GET | `/ranking/providers/debug/:providerId` | Devolve **decomposição** de sinais e pesos para auditoria.                           |

**Erros comuns**: `VALIDATION_ERROR`, `RADIUS_TOO_LARGE`, `NO_RESULTS`, `PROVIDER_NOT_FOUND`.

---

## 4) Service (assinaturas & fluxo)

```ts
class RankingService {
  rankProviders(q: ProviderRankingQueryDto): Promise<ProviderRankingResponse>;
  debugProvider(providerId: string, q: Omit<ProviderRankingQueryDto,'limit'|'offset'>): Promise<ProviderRankingItem>;
}
```

**Fluxo `rankProviders`**

1. **Cache key**: `ranking:{lat}:{lon}:{radius}:{serviceId}:{cityId}:{sort}:{limit}:{offset}` (TTL 60s — configurável).
2. **Consulta geo**: candidatos em `radiusKm` usando PostGIS `ST_DistanceSphere`/`ST_DWithin` (ou Haversine no app server) + filtros (`serviceId`,`cityId`,`q`).
3. **Coletar sinais** por `providerId`:

   * `rating`, `share5stars`, `reviewsCount` (ReviewsRepo)
   * `recentBookings30d`, `lastBookingAt`, `cancelRate30d` (BookingsMetrics)
   * `acceptanceRate`, `avgResponseTimeSec` (Providers/Bookings)
   * `badges`/`boosts` ativos (Missions/BadgesRepo)
4. **Normalizar** sinais → `*_norm` (0..1) e **calcular score**.
5. **Aplicar boosts/penalidades**.
6. **Ordenar** por `score` (ou `distance`/`rating` conforme `sort`).
7. **Tie‑break**: jitter pequeno com seed por `providerId` (estabilidade com diversidade).
8. **Paginar** e devolver `items` + `total`.

---

## 5) Fórmula do score (parametrizável)

Pesos em `ConfigService` (defaults alinhados ao MVP):

```
score = 0.35·rating_norm
      + 0.20·share5stars
      + 0.15·recency_norm
      + 0.15·(1 - distance_norm)
      + 0.10·acceptanceRate_adj
      + 0.05·(1/avgResponseTime_norm)
      + boosts - penalties
```

### 5.1 Normalizações

* **rating\_norm**: `clamp((rating - 3) / 2, 0, 1)`  // 3★→0, 5★→1
* **share5stars**: `count_5★ / total_reviews` (saturação com **suavização Bayes** — ver abaixo)
* **recency\_norm**: `exp(-Δt / τ)` (Δt = dias desde última reserva; τ=30d default) ou função por `recentBookings30d`.
* **distance\_norm**: `min(1, distanceKm / radiusKm)`
* **avgResponseTime\_norm**: `min(1, avgResponseTimeSec / T_max)` (T\_max default 7200s = 120min)

### 5.2 Suavização Bayes (amostras pequenas)

Para **acceptanceRate** e **share5stars** usar prior `p0` com força `k` (defaults: `p0=0.85`, `k=10`).

```
adj = (k·p0 + n·p_obs) / (k + n)
```

`n` = #amostras (pedidos/avaliações). Evita outliers em provedores novos.

---

## 6) Boosts & Penalidades (gamificação/qualidade)

### 6.1 Boosts (somados ao `score`)

* **TOP\_BAIRRO**: `+0.05` por **72h** após conquista.
* **MISSION\_10\_IN\_MONTH**: `+0.03` enquanto missão ativa/concluída.
* **CHAT\_SLA\_90\_5MIN**: `+0.02` com janela móvel de 30d.

> Todos os boosts têm **TTL** e são carregados do módulo de Missões/Badges.

### 6.2 Penalidades (subtraídos do `score`)

* **NO\_SHOW** (últimos 30d): `−0.08` por ocorrência (cap `−0.15`).
* **CANCEL\_RATE\_30d** > 0.2: penalidade linear até `−0.10`.
* **DISPUTE\_RATE\_30d** > 0.1: `−0.05`.

> Penalidades possuem **cooldown** (expiram) e são configuráveis via `app_config`.

---

## 7) Geolocalização

* Consulta inicial: `ST_DWithin(geom, ST_MakePoint(lon,lat)::geography, radiusKm*1000)`
* Distância: `ST_DistanceSphere(geom, ST_MakePoint(lon,lat)) / 1000 AS distance_km`
* Se o DB não tiver PostGIS, o service utiliza **Haversine** em memória (menos eficiente; recomendado PostGIS).

---

## 8) Cache, paginação e estabilidade

* **Cache Redis** por 60s (por chave da consulta) com **invalidation** em eventos: `review_created`, `booking_completed`, `provider_profile_updated`, `badge_granted`.
* **Paginação**: `limit` (≤50) e `offset`. `total` retornado via `COUNT(*)` da query base.
* **Tie‑break**: jitter pseudo‑aleatório determinístico: `score' = score + ε`, `ε = hash(providerId) % 0.003`.

---

## 9) Telemetria & Auditoria

* Eventos: `ranking_query`, `ranking_cache_hit`, `ranking_cache_miss`, `ranking_query_ms`, `ranking_debug_viewed`.
* **Debug endpoint** retorna **decomposição**: pesos × sinais + boosts − penalidades, com todos os valores normalizados para explicar o score.

---

## 10) Config (ENV/DB)

```env
RANKING_DEFAULT_RADIUS_KM=10
RANKING_MAX_LIMIT=50
RANKING_HALF_LIFE_DAYS=30        # τ para recency_norm
RANKING_RESPONSE_TMAX_SEC=7200    # 120 min
RANKING_PRIOR_P0=0.85
RANKING_PRIOR_K=10
RANKING_CACHE_TTL_SEC=60
```

Pesos e deltas de boosts/penalidades ficam na tabela `app_config` com **feature flags** por cidade.

---

## 11) Exemplos (HTTP)

### 11.1 Busca ranqueada

```http
GET /ranking/providers?lat=-22.9056&lon=-47.0600&radiusKm=12&serviceId=s_clean&limit=20&offset=0
```

**200**

```json
{
  "items": [
    {
      "providerId": "p_01",
      "name": "Diarista Ana",
      "distanceKm": 2.1,
      "score": 0.87,
      "rating": 4.9,
      "share5stars": 0.78,
      "acceptanceRate": 0.93,
      "avgResponseTimeSec": 540,
      "recentBookings30d": 22,
      "badges": ["TOP_BAIRRO"],
      "boosts": {"TOP_BAIRRO": 0.05},
      "penalties": {"CANCEL_RATE_30d": 0}
    }
  ],
  "total": 142,
  "queryEcho": {"lat":-22.9056,"lon":-47.06,"radiusKm":12,"serviceId":"s_clean","limit":20,"offset":0,"sort":"score"}
}
```

### 11.2 Debug de um provedor

```http
GET /ranking/providers/debug/p_01?lat=-22.9056&lon=-47.06&radiusKm=12&serviceId=s_clean
```

**200** *(exemplo reduzido)*

```json
{
  "providerId": "p_01",
  "distanceKm": 2.1,
  "signals": {
    "rating": 4.9, "rating_norm": 0.95,
    "share5stars": 0.78,
    "recency_norm": 0.83,
    "distance_norm": 0.175,
    "acceptanceRate_adj": 0.92,
    "avgResponseTime_norm": 0.075
  },
  "weights": {"rating":0.35,"share5stars":0.2,"recency":0.15,"distance":0.15,"accept":0.10,"response":0.05},
  "boosts": {"TOP_BAIRRO": 0.05},
  "penalties": {},
  "score": 0.87
}
```

---

## 12) QA — Casos críticos

* **Sem reviews**: usar prior Bayes para `rating/share5stars`.
* **Provedor novo** (poucos pedidos): suavização em `acceptanceRate` + cap de `recency_norm`.
* **Latitude/longitude inválidas** ou **radius** > 30 km: erro de validação.
* **Buracos de dados**: faltas em métricas devem **zerar** sinal, não quebrar a query.
* **Penalidades acumuladas** não podem levar `score < 0` (clamp final 0..1).
* **Cache**: garantir invalidation em `review_created`/`booking_completed`/`badge_granted`.

---

## 13) Roadmap curto

* **AB testing** de pesos por cidade/coorte.
* Boosts temporais por janela de demanda (surge)
* Reranking **diversidade** (evitar concentração por bairro) com MMR (Maximal Marginal Relevance).
* Indexação vetorial para `q` (busca semântica de ofertas do provedor).
