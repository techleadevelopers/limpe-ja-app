# README — Módulo de Providers (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Providers** com base nos arquivos: `providers.module.ts`, `providers.controller.ts`, `providers.service.ts`, `provider.entity.ts`, `provider-details.dto.ts`, `provider-search.dto.ts`, `provider-service-offering.dto.ts`, `update-provider-profile.dto.ts`.
>
> **Objetivo:** gerir o **perfil do provedor** (identidade pública, cobertura, métricas de desempenho), expor **detalhes públicos** para descoberta e compor o **payload de busca**, integrando **Provider Services**, **Availability**, **Ranking**, **Reviews**, **Document Processing** e **KYC/Verification**.

---

## 1) Responsabilidades

* Persistir **dados públicos** de provedores (nome exibido, bio, fotos, cobertura/raio, cidade base).
* Exibir **detalhes públicos** ricos (métricas, próximos horários, ofertas/serviços, distância, badges).
* Oferecer **busca** de provedores por localização, categoria/serviço, rating e ordenação.
* Permitir **edição de perfil** pelo próprio provedor (RBAC), com sanitização e auditoria.

---

## 2) Arquitetura

* **Module**: `ProvidersModule` — registra controller/service, repositórios/ORM e injeta dependências de leitura.
* **Controller**: `ProvidersController` — rotas REST para **detalhes**, **busca** e **update** do próprio perfil.
* **Service**: `ProvidersService` — regra de negócio: composição de DTOs públicos, validações e integração de sinais para ranking.

**Dependências usuais**: `ProviderServicesService` (ofertas), `AvailabilityService` (próximo horário), `RankingService`/`Search`, `ReviewsService`/`MetricsService` (rating/contagens), `DocumentProcessingService` (avatar/galeria), `Verification/KycService` (status), `Cache/Redis`, `Sentry`.

---

## 3) Modelagem (entity — code‑real esperado)

```ts
export type KycStatus = 'PENDING'|'APPROVED'|'REJECTED'|'REVIEW';

export class Provider {
  id: string;                      // uuid
  userId: string;                  // FK Users

  displayName: string;             // nome público
  bio?: string | null;             // descrição curta (sanitizada)
  avatar?: string | null;          // storageKey (Document Processing)

  baseCity?: string | null;        // cidade base (ex.: 'Campinas/SP')
  baseLat?: number | null;         // lat/lon para distância
  baseLon?: number | null;
  radiusKm?: number | null;        // raio de atendimento (fallback)
  cityIds?: string[] | null;       // cobertura discreta (bairros/cidades)

  // métricas públicas agregadas
  rating: number;                  // 0..5
  reviewsCount: number;
  acceptanceRate: number;          // 0..1
  avgResponseTimeSec: number;      // tempo médio de resposta no chat
  completedJobs: number;           // total de reservas concluídas

  kycStatus: KycStatus;            // gating de visibilidade no search
  isActive: boolean;               // opt‑in público

  createdAt: Date; updatedAt: Date; deletedAt?: Date | null;
}
```

**Índices:** `(isActive, rating desc)`, `(baseCity, isActive)`, `GIST(baseLat, baseLon)` (quando PostGIS), `userId (unique)`.

> **Sanitização:** campos de texto (`displayName`, `bio`) devem passar por sanitizer/whitelist de HTML.

---

## 4) DTOs (code‑real)

### 4.1 `ProviderDetailsDto` (público)

```ts
export class ProviderDetailsDto {
  provider: {
    id: string; displayName: string; bio?: string; avatarUrl?: string; baseCity?: string;
    rating: number; reviewsCount: number; acceptanceRate: number; avgResponseTimeSec: number; completedJobs: number;
  };
  discovery: {
    distanceKm?: number; nextAvailableAt?: string;              // via Availability
    badges?: string[];                                          // ex.: 'Top do bairro'
  };
  offerings: Array<ProviderServiceOfferingDto>;                  // resumo de serviços
}
```

### 4.2 `ProviderServiceOfferingDto` (resumo de oferta)

```ts
export class ProviderServiceOfferingDto {
  id: string; title: string; pricingModel: 'FIXED'|'HOURLY'|'PACKAGE';
  priceFrom: number; defaultDurationMin: number; isActive: boolean;
}
```

### 4.3 `ProviderSearchDto` (query pública)

```ts
export class ProviderSearchDto {
  lat?: number; lon?: number;           // origem para distância
  radiusKm?: number;                     // filtro por raio
  categoryId?: string;                   // categoria/serviço
  q?: string;                            // texto livre (nome/bio)
  minRating?: number;                    // 0..5
  sort?: 'best'|'distance'|'rating'|'reviews'|'responseTime';
  page?: number; pageSize?: number;      // paginação
}
```

### 4.4 `UpdateProviderProfileDto` (edição do próprio perfil)

```ts
export class UpdateProviderProfileDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() avatar?: string;               // storageKey válido
  @IsOptional() @IsString() baseCity?: string;
  @IsOptional() @IsNumber() radiusKm?: number;
  @IsOptional() @IsArray() @IsString({each:true}) cityIds?: string[];
}
```

---

## 5) Rotas (ProvidersController)

| Método | Rota                   | Scope           | Descrição                                                             |
| -----: | ---------------------- | --------------- | --------------------------------------------------------------------- |
|    GET | `/providers/:id`       | Público         | **Detalhes públicos** do provedor (`ProviderDetailsDto`).             |
|    GET | `/providers/search`    | Público         | Busca por provedores (`ProviderSearchDto`).                           |
|    GET | `/providers/me`        | PROVIDER (self) | Perfil do provedor autenticado.                                       |
|  PATCH | `/providers/me`        | PROVIDER (self) | Atualiza perfil (`UpdateProviderProfileDto`).                         |
|   POST | `/providers/me/avatar` | PROVIDER (self) | (Opcional) upload/associação de avatar (via Document Processing/BFF). |

**Erros comuns**: `VALIDATION_ERROR`, `FORBIDDEN` (owner mismatch), `NOT_FOUND`, `KYC_REQUIRED`, `INACTIVE`.

---

## 6) Service (assinaturas & regras)

```ts
class ProvidersService {
  getPublicDetails(providerId: string, viewerLoc?: {lat:number; lon:number}): Promise<ProviderDetailsDto>;
  search(q: ProviderSearchDto): Promise<{ items: ProviderDetailsDto[]; total: number }>;
  getMine(userId: string): Promise<Provider>;
  updateProfile(userId: string, dto: UpdateProviderProfileDto): Promise<Provider>;
}
```

### 6.1 Detalhes públicos

* Compor `ProviderDetailsDto` agregando:

  * Perfil (entity)
  * **Métricas**: `rating`, `reviewsCount`, `acceptanceRate`, `avgResponseTimeSec`, `completedJobs` (via Metrics/Reviews)
  * **Discovery**: `distanceKm` (se `viewerLoc`), `nextAvailableAt` (via Availability), `badges` (via Gamificação)
  * **Offerings**: mapear serviços ativos do provedor (via ProviderServices) em `ProviderServiceOfferingDto`
* Resolver `avatarUrl` via `DocumentProcessingService.getSignedUrl`.

### 6.2 Busca

* Filtro por **raio**: `distance(provider.baseLat, baseLon, q.lat, q.lon) ≤ (q.radiusKm || provider.radiusKm || DEFAULT_RADIUS)`.
* Filtro por **categoria**: `EXISTS(service.categoryId = q.categoryId AND service.isActive)`.
* Filtro por **minRating**.
* Ordenação `sort` (default `best`) usando **RankingService** (score) ou chaves secundárias (distância/rating/responseTime).
* Paginado (`page`, `pageSize`) com limites de segurança.

### 6.3 Edição de perfil

* **RBAC**: somente o **owner** (via `userId`) altera seu `Provider`.
* **Sanitização** de `bio`; validar `displayName` (tamanho/char set) e `radiusKm` (0–100km, por ex.).
* **Avatar**: `avatar` deve ser `storageKey` válido pertencente ao usuário.
* Atualizações disparam **invalidação de cache** e, quando relevante, re‑index no **Search/Ranking**.

### 6.4 Visibilidade

* **KYC gating**: `kycStatus='APPROVED'` e `isActive=true` para aparecer na busca.
* Provedores `INACTIVE` podem editar o perfil, mas não aparecem publicamente.

---

## 7) Integrações

* **Provider Services**: leitura de serviços ativos para detalhes e filtro por categoria.
* **Availability**: cálculo de `nextAvailableAt` para experiência de descoberta.
* **Reviews/Metrics**: rating/contagens e tempos de resposta/aceitação.
* **Ranking/Search**: aplicação do score e ordenação.
* **Document Processing**: avatar/galeria via URLs assinadas.
* **Verification/KYC**: status para gating (APPROVED → público).

---

## 8) Config (ENV)

```env
PROVIDERS_PUBLIC_PAGE_SIZE=20
PROVIDERS_DEFAULT_RADIUS_KM=15
PROVIDERS_SEARCH_MAX_RADIUS_KM=50
PROVIDERS_REQUIRE_KYC_APPROVED=true
```

---

## 9) Exemplos (HTTP)

### 9.1 Detalhes públicos

```http
GET /providers/p_01?lat=-22.90&lon=-47.06
```

**200** *(reduzido)*

```json
{
  "provider": {"id":"p_01","displayName":"Ana Lima","rating":4.9,"reviewsCount":124,"acceptanceRate":0.93,"avgResponseTimeSec":420,"completedJobs":310,"baseCity":"Campinas/SP"},
  "discovery": {"distanceKm":2.3, "nextAvailableAt":"2025-08-25T10:00:00-03:00", "badges":["Top do bairro"]},
  "offerings": [{"id":"svc_1","title":"Faxina Completa","pricingModel":"HOURLY","priceFrom":135,"defaultDurationMin":180,"isActive":true}]
}
```

### 9.2 Busca pública

```http
GET /providers/search?lat=-22.90&lon=-47.06&radiusKm=10&categoryId=clean_full&minRating=4.5&sort=best&page=1&pageSize=20
```

**200** *(exemplo reduzido)*

```json
{ "items": [ { "provider": {"id":"p_01","displayName":"Ana Lima","rating":4.9}, "discovery": {"distanceKm":2.3, "nextAvailableAt":"2025-08-25T10:00:00-03:00"}, "offerings": [{"id":"svc_1","title":"Faxina Completa","priceFrom":135,"pricingModel":"HOURLY"}] } ], "total": 1 }
```

### 9.3 Atualizar perfil (self)

```http
PATCH /providers/me
Idempotency-Key: upd-123
{
  "displayName": "Ana L.",
  "bio": "Profissional há 6 anos, materiais próprios.",
  "radiusKm": 18,
  "cityIds": ["campinas","valinhos"]
}
```

**200** → retorna `Provider` atualizado.

---

## 10) Telemetria & KPIs

* Eventos: `provider_profile_viewed`, `provider_profile_updated`, `provider_search_performed`, `provider_search_result_clicked`.
* KPIs: **views→quotes** (detalhes → cotação), **quotes→bookings**, taxa de **ativação** (KYC aprovado & ativo), **tempo de resposta** e **aceitação** por provedor.

---

## 11) QA — Casos críticos

* Provedor sem `baseLat/Lon` → calcular distância por cidade/raio padrão; evitar exclusão indevida.
* `radiusKm` muito alto → clamp a `PROVIDERS_SEARCH_MAX_RADIUS_KM`.
* Avatar inexistente/sem permissão → ignorar e logar.
* `KYC_REQUIRED` bloqueando exibição pública, mas permitindo edição.
* Sincronizar métricas (acceptance/responseTime) com origem única para evitar divergência no payload.

---

## 12) Melhorias avançadas (quando necessário)

1. **Score de completude de perfil** (foto, bio, serviços, disponibilidade) com missões/badges.
2. **Idiomas** e **preferências** do provedor (animais, materiais, limpeza pesada/leves) para melhor matching.
3. **Portfólio** (galeria) e **respostas rápidas** para chat (reduz `avgResponseTimeSec`).
4. **Verificação estendida** (documentos adicionais) para selo “verificado+”.
5. **Geo‑fences** dinâmicos por demanda (surge) e restrição de raio por logística.

---

## 13) Conclusão

O módulo **Providers** centraliza a identidade pública e os sinais de qualidade do provedor, alimentando **busca** e **descoberta** com dados confiáveis e atualizados. Com integrações claras e regras de visibilidade (KYC/ativo), sustenta conversão, confiança e escala do marketplace.
