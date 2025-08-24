# README — Módulo de Provider Services (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Provider Services** com base nos arquivos: `provider-services.module.ts`, `provider-services.controller.ts`, `provider-services.service.ts`, `provider-service.entity.ts`, `create-provider-service.dto.ts`, `update-provider-service.dto.ts`, `provider-service-details.dto.ts`.
>
> **Objetivo:** gerenciar o **catálogo de serviços ofertados pelos provedores** (título, descrição, preço, duração, cobertura, ativos/adicionais), expondo **detalhes públicos** para busca/descoberta e endpoints **autenticados** para CRUD do provedor. Integra com **Availability**, **Bookings**, **Ranking/Search**, **Document Processing** (imagens) e **Notifications**.

---

## 1) Responsabilidades

* Persistir e versionar **serviços do provedor** (nome, categoria, preços, duração, raio/cidades atendidas, imagens, status).
* Calcular **cotações** (price quote) conforme **modelo de precificação** (FIXED/HOURLY/PACKAGE) e parâmetros (duração, adicionais).
* Expor **detalhes públicos** ricos (rating do provedor, próximos horários, distância, preço “a partir de”).
* Garantir **consistência** com a agenda (**Availability**) e o fluxo de **Booking** (snapshot de preço e descrição no ato da reserva).

---

## 2) Arquitetura

* **Module**: `ProviderServicesModule` — registra controller/service e injeta dependências (ORM repo, Availability, Ranking, Notifications, DocumentProcessing, Config, Cache/Redis, Sentry).
* **Controller**: `ProviderServicesController` — rotas REST para **CRUD** (provedor) e **consulta pública**.
* **Service**: `ProviderServicesService` — regras de negócio, cálculo de preço/duração, validações e composição de **ProviderServiceDetailsDto**.
* **Entity**: `ProviderService` — modelo persistente de um serviço publicado por um provedor.

---

## 3) Modelagem (entity — code‑real esperado)

```ts
export type PricingModel = 'FIXED' | 'HOURLY' | 'PACKAGE';

export class ProviderService {
  id: string;                    // uuid
  providerId: string;            // FK Provedor
  categoryId?: string | null;    // FK Categoria (quando houver catálogo)

  title: string;                 // ex.: "Faxina Completa"
  description?: string | null;   // markdown/HTML sanitizado

  pricingModel: PricingModel;    // FIXED | HOURLY | PACKAGE
  basePrice: number;             // R$ por job (FIXED) ou por hora (HOURLY)
  minHours?: number | null;      // HOURLY: horas mínimas
  maxHours?: number | null;      // HOURLY: cap opcional
  defaultDurationMin: number;    // duração padrão em minutos (p/ Availability)

  addOns?: Array<{ code: string; title: string; price: number }>; // adicionais
  materialsIncluded?: boolean;   // se o provedor leva material

  radiusKm?: number | null;      // raio de atendimento a partir do endereço-base
  cityIds?: string[] | null;     // cobertura por cidades/bairros quando aplicável

  images?: string[] | null;      // storageKeys (Document Processing)

  isActive: boolean;             // visibilidade pública
  sortWeight?: number | null;    // ordenação interna (opcional)

  createdAt: Date; updatedAt: Date; deletedAt?: Date | null;
}
```

**Índices:** `(providerId, isActive, categoryId)`, `GIN(cityIds)`, `sortWeight desc`.

> **Sanitização**: `description` deve passar por sanitizer (sem script/style/event handlers).

---

## 4) DTOs (code‑real)

### 4.1 `CreateProviderServiceDto`

```ts
export class CreateProviderServiceDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() categoryId?: string;

  @IsEnum(['FIXED','HOURLY','PACKAGE']) pricingModel: PricingModel;
  @IsNumber() @Min(10) basePrice: number;                   // R$
  @IsInt() @Min(30) defaultDurationMin: number;             // min
  @IsOptional() @IsInt() @Min(1) minHours?: number;         // HOURLY
  @IsOptional() @IsInt() @Min(1) maxHours?: number;         // HOURLY

  @IsOptional() addOns?: Array<{ code: string; title: string; price: number }>;
  @IsOptional() @IsBoolean() materialsIncluded?: boolean;

  @IsOptional() @IsNumber() @Min(0) radiusKm?: number;      // geocobertura
  @IsOptional() @IsArray() @IsString({each:true}) cityIds?: string[];

  @IsOptional() @IsArray() @IsString({each:true}) images?: string[]; // storageKeys
  @IsOptional() @IsBoolean() isActive?: boolean = true;
}
```

### 4.2 `UpdateProviderServiceDto`

```ts
export class UpdateProviderServiceDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsEnum(['FIXED','HOURLY','PACKAGE']) pricingModel?: PricingModel;
  @IsOptional() @IsNumber() basePrice?: number;
  @IsOptional() @IsInt() defaultDurationMin?: number;
  @IsOptional() @IsInt() minHours?: number;
  @IsOptional() @IsInt() maxHours?: number;
  @IsOptional() addOns?: Array<{ code: string; title: string; price: number }>;
  @IsOptional() @IsBoolean() materialsIncluded?: boolean;
  @IsOptional() @IsNumber() radiusKm?: number;
  @IsOptional() @IsArray() @IsString({each:true}) cityIds?: string[];
  @IsOptional() @IsArray() @IsString({each:true}) images?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}
```

### 4.3 `ProviderServiceDetailsDto` (payload público)

```ts
export class ProviderServiceDetailsDto {
  service: {
    id: string; title: string; description?: string; pricingModel: PricingModel; basePrice: number; defaultDurationMin: number; addOns?: any[]; materialsIncluded?: boolean;
  };
  provider: {
    id: string; name: string; rating: number; reviewsCount: number; acceptanceRate: number; avgResponseTimeSec: number;
  };
  discovery: {
    distanceKm?: number; nextAvailableAt?: string;            // baseado no Availability
    priceFrom: number;                                        // preço "a partir de"
  };
}
```

---

## 5) Rotas (ProviderServicesController)

| Método | Rota                                   | Scope               | Descrição                                                      |
| -----: | -------------------------------------- | ------------------- | -------------------------------------------------------------- |
|    GET | `/providers/:providerId/services`      | Público             | Lista de serviços públicos de um provedor (paginada/ordenada). |
|    GET | `/provider-services/:id`               | Público             | **Detalhes públicos** (`ProviderServiceDetailsDto`).           |
|    GET | `/provider-services/me`                | PROVIDER (self)     | Lista dos meus serviços (com flags internos).                  |
|   POST | `/provider-services`                   | PROVIDER (self)     | **Criar** serviço (CreateProviderServiceDto).                  |
|  PATCH | `/provider-services/:id`               | PROVIDER (self)     | **Atualizar** serviço.                                         |
| DELETE | `/provider-services/:id`               | PROVIDER (self)     | **Desativar/soft‑delete** serviço.                             |
|   POST | `/provider-services/:id/toggle-active` | PROVIDER (self)     | Ativar/Desativar rapidamente (opcional).                       |
|    GET | `/provider-services/:id/quote`         | Público/Autenticado | **Cotação** dado `durationMin`/`addOns`/`distance`.            |

**Query params comuns**: `page`, `pageSize`, `categoryId`, `activeOnly`, `sort=price|rating|distance`.

**Erros**: `VALIDATION_ERROR`, `FORBIDDEN` (owner mismatch), `NOT_FOUND`, `UNSUPPORTED_PRICING`, `DURATION_NOT_SUPPORTED`.

---

## 6) Service (assinaturas & regra)

```ts
class ProviderServicesService {
  listPublicByProvider(providerId: string, q: ListQuery): Promise<{ items: ProviderService[]; total: number }>;
  getPublicDetails(serviceId: string, viewerLatLon?: {lat:number; lon:number}): Promise<ProviderServiceDetailsDto>;

  listMine(userId: string, q: ListQuery): Promise<{ items: ProviderService[]; total: number }>;
  create(userId: string, dto: CreateProviderServiceDto): Promise<ProviderService>;
  update(userId: string, serviceId: string, dto: UpdateProviderServiceDto): Promise<ProviderService>;
  remove(userId: string, serviceId: string): Promise<void>; // soft delete/desativação

  quote(serviceId: string, params: { durationMin?: number; addOns?: string[]; distanceKm?: number }): Promise<{ price: number; breakdown: any }>;
}
```

### 6.1 Regras de precificação

* **FIXED**: `price = basePrice + Σ(addOns.price)`.
* **HOURLY**: `hours = ceil( max(minHours, durationMin/60) )`; `price = hours * basePrice + Σ(addOns.price)`; se `maxHours` definido, `hours ≤ maxHours`.
* **PACKAGE**: regra específica por `addOns`/quantidade (ex.: “Faxina + Passar Roupa” com desconto). Implementar tabela/engine simples no service ou config.
* **Floor/Caps**: validar `basePrice ≥ PRICE_MIN` e `price ≤ PRICE_CAP` (por cidade/categoria quando aplicável).
* **Taxas/Take‑rate**: *não* embutidas no preço exibido ao cliente; ficam para o módulo de **Payments**.

### 6.2 Duração & agenda

* `defaultDurationMin` deve ser múltiplo de `slotDurationMin` (Availability). Caso `durationMin` de cotação difira, montar blocos contíguos.
* Para **quote** público, retornar também `nextAvailableAt` via `Availability`.

### 6.3 Cobertura geográfica

* Se `radiusKm` definido, validar `distanceKm ≤ radiusKm` na **cotação**; caso contrário, retornar erro ou `price` com taxa de deslocamento (se existir política).
* Alternativamente, usar `cityIds` para coberturas discretas.

### 6.4 CRUD & segurança

* **Ownership**: `create/update/remove/listMine` só operam sobre serviços cujo `providerId` pertence ao **userId** autenticado.
* **Sanitização**: `description` sanitizada; `images` devem existir no storage (Document Processing) e pertencer ao owner.
* **Idempotência**: `create` pode aceitar `Idempotency-Key` (opcional) para evitar duplicação por retry.

### 6.5 Detalhes públicos

* Montar `ProviderServiceDetailsDto` combinando: dados do serviço + **rating**, `reviewsCount`, `acceptanceRate`, `avgResponseTimeSec` (do provedor) + `distanceKm` (se lat/lon do cliente) + `nextAvailableAt`.
* `priceFrom` = preço calculado mínimo para `defaultDurationMin` sem add‑ons.

---

## 7) Integrações

* **Availability**: verificar duração/slots e obter `nextAvailableAt`.
* **Bookings**: ao criar booking, fazer **snapshot** do serviço (título, descrição, `pricingModel`, `basePrice`, `addOns`) no `BookingDetails` para imutabilidade da reserva.
* **Ranking/Search**: indexar serviço com sinais (rating do provedor, distância estimada, preço mínimo). Aplicar **boosts** quando houver badges/missões.
* **Document Processing**: validar/exibir imagens (`images[]` → URLs assinadas no BFF).
* **Notifications**: opcional — notificar provedor quando serviço for aprovado/ativado (se houver moderação).

---

## 8) Config (ENV)

```env
PROVIDER_SERVICES_PRICE_MIN_RS=40
PROVIDER_SERVICES_PRICE_CAP_RS=2000
PROVIDER_SERVICES_DEFAULT_DURATION_MIN=120
PROVIDER_SERVICES_DEFAULT_RADIUS_KM=15
PROVIDER_SERVICES_PUBLIC_PAGE_SIZE=20
```

---

## 9) Exemplos (HTTP)

### 9.1 Criar serviço (provedor)

```http
POST /provider-services
Authorization: Bearer <provider-token>
{
  "title": "Faxina Completa",
  "description": "Limpeza pesada de até 3 quartos",
  "pricingModel": "HOURLY",
  "basePrice": 45,
  "minHours": 3,
  "defaultDurationMin": 180,
  "materialsIncluded": false,
  "radiusKm": 20,
  "images": ["uploads/2025/08/24/img1.jpg"]
}
```

**201** → retorna o `ProviderService` criado.

### 9.2 Detalhes públicos

```http
GET /provider-services/svc_123
```

**200** *(exemplo reduzido)*

```json
{
  "service": {"id":"svc_123","title":"Faxina Completa","pricingModel":"HOURLY","basePrice":45,"defaultDurationMin":180},
  "provider": {"id":"p_01","name":"Ana Lima","rating":4.9,"reviewsCount":124,"acceptanceRate":0.93,"avgResponseTimeSec":420},
  "discovery": {"distanceKm": 2.3, "nextAvailableAt":"2025-08-25T10:00:00-03:00", "priceFrom":135}
}
```

### 9.3 Cotação

```http
GET /provider-services/svc_123/quote?durationMin=240&addOns=geladeira,forno&distanceKm=5
```

**200**

```json
{ "price": 225, "breakdown": { "hours": 4, "base": 180, "addOns": 45 } }
```

---

## 10) Telemetria & KPIs

* Eventos: `provider_service_created`, `provider_service_updated`, `provider_service_toggled`, `provider_service_viewed`, `provider_service_quoted`.
* KPIs: taxa de **ativação** de serviço (criado→ativo), **views→quotes** (V2Q), **quotes→bookings**, preço médio por categoria, **cancelamentos** por serviço.

---

## 11) QA — Casos críticos

* **Duração** inconsistente com Availability → erro `DURATION_NOT_SUPPORTED`.
* **HOURLY** com `minHours` > `maxHours` → validação.
* **Cobertura** (radius/cityIds) inválida vs. endereço do cliente.
* **Imagens** inexistentes/sem owner → rejeitar.
* **Sanitização** de `description` (evitar XSS) e limites de tamanho (ex.: 2.000 chars).

---

## 12) Melhorias avançadas (quando necessário)

1. **Bundles/PACKAGE** com regras declarativas (ex.: YAML/JSON) e aplicação de descontos automáticos.
2. **Preço dinâmico** por demanda (surge) — fator por hora/dia/bairro.
3. **A/B** de títulos/descrições e preço mínimo por cidade.
4. **Moderation queue** para aprovar/recusar serviços antes de irem ao ar.
5. **Tradução/i18n** de títulos/descrições.

---

## 13) Conclusão

O **Provider Services** é a base do **catálogo** no LimpeJá. Ele conecta **preço, duração e cobertura** do serviço com a **agenda real** do provedor, expõe um payload público rico para **descoberta** e assegura **imutabilidade** no momento da reserva. As integrações e validações aqui descritas garantem qualidade de oferta e sustentam os objetivos de **conversão** e **NPS** do produto.
