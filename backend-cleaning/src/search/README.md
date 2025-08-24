# README — Módulo de Search (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Search** com base nos arquivos: `search.module.ts`, `search.controller.ts`, `search.service.ts`, `search-query.dto.ts`, `provider-service-search-result.dto.ts`.
>
> **Objetivo:** entregar **busca unificada** de **provedores** e **serviços**, priorizando **qualidade**, **proximidade** e **disponibilidade**, com paginação, ordenação e integração a **Ranking**, **Availability**, **Providers** e **Provider Services**.

---

## 1) Responsabilidades

* Normalizar **consultas** (texto, localização, categoria/serviço, filtros de preço/nota/duração).
* Agregar dados de **Providers** + **Provider Services** + **Availability** em um **payload único** de resultados.
* Calcular **distância**, **próximo horário disponível** e **score** (via `RankingService`).
* Suportar **ordenação** (melhores, distância, rating, preço) e **paginação**.
* Cachear **consultas quentes** e expor **telemetria** de busca.

---

## 2) Arquitetura

* **Module**: `SearchModule` — registra controller/service e injeta dependências de leitura.
* **Controller**: `SearchController` — rotas REST públicas de busca.
* **Service**: `SearchService` — orquestração de fontes, cálculos de distância/score/slot, cache e montagem do DTO de resultado.

**Dependências típicas**: `ProvidersService`, `ProviderServicesService`, `AvailabilityService`, `RankingService`, `Metrics/ReviewsService`, `ConfigService`, `Cache/Redis`, Postgres (opcional PostGIS), `Sentry`.

---

## 3) DTOs (code‑real)

### 3.1 `SearchQueryDto`

```ts
export class SearchQueryDto {
  // Localização
  lat?: number; lon?: number;              // ponto de referência
  radiusKm?: number;                        // raio de busca (default em ENV)

  // Escopo
  categoryId?: string;                      // categoria do serviço
  serviceId?: string;                        // serviço específico
  q?: string;                                // texto livre (nome/bio/título)

  // Filtros
  minRating?: number;                        // 0..5
  priceFrom?: number; priceTo?: number;      // faixa de preço ("a partir de")
  onlyWithNextSlot?: boolean;                // exige próximo horário
  dateFrom?: string; dateTo?: string;        // janela para disponibilidade
  durationMin?: number;                       // duração desejada
  materialsIncluded?: boolean;               // provedor leva material

  // Ordenação & paginação
  sort?: 'best'|'distance'|'rating'|'price';
  page?: number; pageSize?: number;          // defaults em ENV
}
```

### 3.2 `ProviderServiceSearchResultDto`

```ts
export class ProviderServiceSearchResultDto {
  provider: {
    id: string; displayName: string; avatarUrl?: string;
    rating: number; reviewsCount: number;
    acceptanceRate: number; avgResponseTimeSec: number;
  };
  service: {
    id: string; title: string; pricingModel: 'FIXED'|'HOURLY'|'PACKAGE';
    priceFrom: number; defaultDurationMin: number; materialsIncluded?: boolean;
  };
  discovery: {
    distanceKm?: number; nextAvailableAt?: string;
    score?: number;                                     // score de ranking
  };
}
```

---

## 4) Rotas (SearchController)

| Método | Rota                | Descrição                                                                |
| -----: | ------------------- | ------------------------------------------------------------------------ |
|    GET | `/search/providers` | Busca por **provedores** (agrega serviços ativos para compor resultado). |
|    GET | `/search/services`  | Busca por **serviços** (cada item é um par provedor×serviço).            |

**Query params**: conforme `SearchQueryDto`.

**Erros comuns**: `VALIDATION_ERROR` (lat/lon inválidos, faixa de preço), `RANGE_TOO_LARGE` (radius), `DATE_RANGE_TOO_LARGE`, `NOT_FOUND` (quando `serviceId` inexistente).

---

## 5) Service (assinaturas & fluxo)

```ts
class SearchService {
  searchProviders(q: SearchQueryDto): Promise<{ items: ProviderServiceSearchResultDto[]; total: number }>;
  searchServices(q: SearchQueryDto): Promise<{ items: ProviderServiceSearchResultDto[]; total: number }>;
}
```

### 5.1 Pipeline de busca

1. **Normalização**: aplicar defaults (`page=1`, `pageSize=20`, `sort='best'`, `radiusKm=DEFAULT_RADIUS`). `q` → trim/lower; proteger contra termos muito curtos.
2. **Pré‑seleção**: obter **provedores/serviços ativos** por filtros estruturais (categoria/serviço/priceFrom/materialsIncluded/`minRating`).
3. **Localização**: se `lat/lon` presentes, calcular **distância** (Haversine ou `ST_DistanceSphere`) e filtrar por `radiusKm`. Popular `distanceKm` no resultado.
4. **Disponibilidade**: se `onlyWithNextSlot` ou `dateFrom/dateTo` definidos, consultar `AvailabilityService` para cada candidato (ou por *batch*) e preencher `nextAvailableAt`.
5. **Preço mínimo**: calcular `priceFrom` por serviço usando `pricingModel` e `defaultDurationMin` (sem add‑ons).
6. **Score**: pedir `RankingService.score(providerId, viewerLoc?, signals)` e anexar `score`.
7. **Ordenação**: por `sort`:

   * `best` (default): por `score desc`, *tie‑breakers* (rating desc, distance asc)
   * `distance`: `distanceKm asc`
   * `rating`: `rating desc`
   * `price`: `priceFrom asc`
8. **Paginação**: aplicar `page/pageSize` com limites (ex.: `pageSize ≤ 50`).
9. **Cache**: memoizar chaveada por query normalizada (TTL curto, ex.: 60s) e invalidar em eventos (ativação de serviço, review novo, mudança de disponibilidade).

---

## 6) Distância & Disponibilidade

* **Distância**: quando PostGIS estiver habilitado, preferir consulta SQL com `ORDER BY ST_DistanceSphere(provider.geom, point(lon,lat))`; caso contrário, Haversine em app.
* **Disponibilidade**: `nextAvailableAt` vem de `AvailabilityService.getSlots(providerId, {start:end})` pegando o primeiro slot compatível com `durationMin`.

---

## 7) Integrações

* **Providers/Provider Services**: leitura de perfis/serviços **ativos** + imagens (URL assinada vinda do BFF/Document).
* **RankingService**: cálculo de `score` usando sinais: `rating`, `share5stars`, `recency`, `distance`, `acceptanceRate`, `avgResponseTimeSec`, além de **boosts** de gamificação.
* **AvailabilityService**: preenchimento do `nextAvailableAt` e filtro com `dateFrom/dateTo`.
* **Metrics/Reviews**: agregados de rating e contagem de reviews.
* **Cache/Redis**: memoizar resultados; invalidar ao mudar cadastro/ativação de serviços, reviews, disponibilidade.

---

## 8) Config (ENV)

```env
SEARCH_DEFAULT_RADIUS_KM=15
SEARCH_MAX_RADIUS_KM=50
SEARCH_DEFAULT_PAGE_SIZE=20
SEARCH_MAX_PAGE_SIZE=50
SEARCH_CACHE_TTL_SEC=60
SEARCH_REQUIRE_KYC_APPROVED=true  # só retorna provedores aprovados
```

---

## 9) Exemplos (HTTP)

### 9.1 Busca de serviços próximos (com slot)

```http
GET /search/services?lat=-22.90&lon=-47.06&radiusKm=10&categoryId=clean_full&onlyWithNextSlot=true&sort=best&page=1&pageSize=20
```

**200** *(exemplo reduzido)*

```json
{
  "items": [
    {
      "provider": {"id":"p_01","displayName":"Ana Lima","rating":4.9,"reviewsCount":124,"acceptanceRate":0.93,"avgResponseTimeSec":420},
      "service": {"id":"svc_1","title":"Faxina Completa","pricingModel":"HOURLY","priceFrom":135,"defaultDurationMin":180},
      "discovery": {"distanceKm":2.3, "nextAvailableAt":"2025-08-25T10:00:00-03:00", "score":0.87}
    }
  ],
  "total": 1
}
```

### 9.2 Busca por preço/rating

```http
GET /search/providers?priceFrom=100&priceTo=250&minRating=4.5&sort=price
```

---

## 10) Segurança & LGPD

* Resultados restringidos a **provedores com KYC aprovado** e `isActive=true` (se `SEARCH_REQUIRE_KYC_APPROVED`).
* Não expor PII; imagens via **URL assinada** pelo BFF.
* Proteções anti‑abuso: **rate‑limit** de chamadas por IP e validação de parâmetros (raio, paginação).

---

## 11) Telemetria & KPIs

* Eventos: `search_performed`, `search_result_viewed`, `search_click`, `search_no_results`.
* KPIs: **CTR** (resultados → clique), **V2Q** (view → quote), **quotes→bookings**, tempo p95 de busca, taxa de **no‑results**.

---

## 12) QA — Casos críticos

* `lat/lon` ausentes → permitir busca por cidade (fallback) ou ordenar por `best` sem distância.
* `radiusKm` > `SEARCH_MAX_RADIUS_KM` → clamp.
* `dateRange` muito grande → limitar a N dias.
* Resultado com serviço **inativo** ou provedor **sem KYC** → filtrar antes do score.
* Cache desatualizado após ativar/desativar serviço → invalidar por evento.

---

## 13) Melhorias avançadas (quando necessário)

1. **Indexação** materializada (views) ou índice vetorial de **semântica** para `q`.
2. **Personalização** por histórico do cliente (recompras, preferências, last‑mile).
3. **Relevância** sensível ao tempo (picos por dia/semana com boosts de slot).
4. **A/B** de pesos de ranking e de ordenação por coorte/cidade.
5. **Sugestões** de busca (autocomplete e *did‑you‑mean*).

---

## 14) Conclusão

O **Search** entrega resultados **relevantes e reserváveis**, unificando dados de catálogo, agenda e reputação. A integração com **Ranking** e **Availability** garante equilíbrio entre **qualidade** e **tempo**, enquanto cache e validações mantêm **performance** e **segurança** em produção.
