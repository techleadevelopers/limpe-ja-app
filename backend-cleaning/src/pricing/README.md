# README — Módulo de Pricing (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Pricing** com base nos arquivos: `pricing.module.ts`, `pricing.controller.ts`, `pricing.service.ts`, `pricing-rule.entity.ts`.
>
> **Objetivo:** calcular **preços de reserva** e expor **cotações** consistentes com o catálogo (Services/Provider Services), aplicando **regras de preço** (surge, distância, floors/caps, descontos de pacote) e retornando um **breakdown** claro (cliente ↔ provedor ↔ marketplace). Integra com **Availability** (duração/slot), **Search/Ranking** (priceFrom), **Bookings** (snapshot do preço) e **Payments**.

---

## 1) Responsabilidades

* Calcular **quote** (preço estimado) para um serviço/oferta, dado **duração**, **add‑ons**, **distância** e **momento** (para regras temporais).
* Manter **Pricing Rules** paramétricas (surge, taxa por km, floors/caps, descontos) com escopo (global/cidade/categoria/serviço/provedor) e janelas de validade.
* Fornecer **breakdown**: `base`, `addOns`, `duration/horas`, `distanceFee`, `surgeMultiplier`, `packageDiscount`, `caps/floors`, `grossCustomer`, `providerPayout`, `marketplaceFee`.
* Garantir **consistência** com o que será persistido em **Bookings** (snapshot) e usado por **Search** (`priceFrom`).

---

## 2) Arquitetura

* **Module**: `PricingModule` — registra controller/service, injeta repositório/ORM para regras e dependências de leitura (ProviderServices/Services/Config/Cache).
* **Controller**: `PricingController` — rotas de **cotação** e **admin** para regras.
* **Service**: `PricingService` — motor de cálculo, seleção/ordenação de regras e composição do breakdown.
* **Entity**: `PricingRule` — regra persistente parametrizável.

**Dependências usuais:** `ProviderServicesService`, `ServicesService`, `ConfigService`, `Cache/Redis`, `Sentry`, (opcional) `Geo/DistanceService`.

---

## 3) Modelagem — `PricingRule` (entity)

```ts
export type PricingScope = 'GLOBAL'|'CITY'|'CATEGORY'|'SERVICE'|'PROVIDER';
export type PricingKind  = 'SURGE'|'DISTANCE_FEE'|'FLOOR'|'CAP'|'PACKAGE_DISCOUNT'|'ABSOLUTE_ADJUST';
export type ValueType    = 'MULTIPLIER'|'FIXED'|'PERCENT';

export class PricingRule {
  id: string;                     // uuid
  scope: PricingScope;            // aplica onde?
  refId?: string | null;          // cityId/categoryId/serviceId/providerId
  kind: PricingKind;              // tipo de regra

  valueType: ValueType;           // MULTIPLIER/FIXED/PERCENT
  value: number;                  // ex.: 1.2 (20%), 15 (R$15), 10 (%10)
  maxEffect?: number | null;      // limites por regra (ex.: máx. R$50 em DISTANCE_FEE)

  // janelas de ativação
  daysOfWeek?: number[] | null;   // 0..6 (dom..sáb)
  timeStart?: string | null;      // 'HH:MM'
  timeEnd?: string | null;        // 'HH:MM'
  activeFrom?: Date | null;       // datas absolutas
  activeTo?: Date | null;

  priority?: number | null;       // maior > aplica depois
  isActive: boolean;

  description?: string | null;    // help para admins
  createdAt: Date; updatedAt: Date; deletedAt?: Date | null;
}
```

**Índices:** `(scope, refId, isActive)`, `(kind, isActive)`, `(activeFrom, activeTo)`, `(daysOfWeek, timeStart,timeEnd)`.

---

## 4) DTOs (code‑real esperado)

### 4.1 `QuoteQueryDto` (querystring)

```ts
export class QuoteQueryDto {
  serviceId: string;                     // ProviderService ou Service canônico
  providerId?: string;                   // se necessário
  durationMin?: number;                  // override do default
  addOns?: string[];                     // códigos de adicionais
  distanceKm?: number;                   // cliente→base do provedor
  when?: string;                         // ISO (para regras de tempo)
  cityId?: string;                       // escopo cidade
}
```

### 4.2 `UpsertPricingRuleDto`

```ts
export class UpsertPricingRuleDto {
  scope: PricingScope; refId?: string;
  kind: PricingKind; valueType: ValueType; value: number; maxEffect?: number;
  daysOfWeek?: number[]; timeStart?: string; timeEnd?: string;
  activeFrom?: string; activeTo?: string; priority?: number; isActive?: boolean;
  description?: string;
}
```

---

## 5) Rotas (PricingController)

| Método | Rota                 | Scope             | Descrição                                                    |
| -----: | -------------------- | ----------------- | ------------------------------------------------------------ |
|    GET | `/pricing/quote`     | Público/Autentic. | **Cotação** com breakdown. Params = `QuoteQueryDto`.         |
|    GET | `/pricing/rules`     | ADMIN             | Lista regras (filtros por `scope/kind/refId/isActive`).      |
|   POST | `/pricing/rules`     | ADMIN             | Cria/atualiza regra (`UpsertPricingRuleDto`).                |
|  PATCH | `/pricing/rules/:id` | ADMIN             | Atualiza campos permitidos (enable/disable, janelas, valor). |
| DELETE | `/pricing/rules/:id` | ADMIN             | Soft‑delete da regra.                                        |

**Erros comuns:** `VALIDATION_ERROR`, `UNSUPPORTED_PRICING`, `RANGE_NOT_ALLOWED` (dur/raio), `NOT_FOUND` (service/provider), `RULE_CONFLICT`.

---

## 6) Service (assinaturas & fluxo)

```ts
class PricingService {
  quote(q: QuoteQueryDto): Promise<{
    inputs: any; breakdown: any; totals: {
      grossCustomer: number; providerPayout: number; marketplaceFee: number;
    }}>
  
  listRules(filter: any): Promise<{ items: PricingRule[]; total: number }>;
  upsertRule(dto: UpsertPricingRuleDto): Promise<PricingRule>;
  updateRule(id: string, dto: Partial<UpsertPricingRuleDto>): Promise<PricingRule>;
  removeRule(id: string): Promise<void>;
}
```

### 6.1 Pipeline de cálculo (quote)

1. **Fetch do serviço** (`ProviderService` → `pricingModel`, `basePrice`, `defaultDurationMin`, `addOns`).
2. **Duração**: `dur = durationMin || defaultDurationMin`. Se `HOURLY`, `hours = ceil(max(minHours, dur/60))` (cap em `maxHours` se houver).
3. **Base**:

   * `FIXED` → `base = basePrice`
   * `HOURLY` → `base = hours * basePrice`
   * `PACKAGE` → aplicar tabela/engine de pacote (service‑specific)
4. **Add‑ons**: `addOnsSum = Σ(addOn.price)` (valida códigos).
5. **Regras** (ordenadas por `priority asc` e depois `kind`):

   * `DISTANCE_FEE` → `distanceFee = f(distanceKm)` (ex.: `rs_per_km * distanceKm`, clamp por `maxEffect`)
   * `SURGE` (MULTIPLIER) → `subtotal *= surge`
   * `FLOOR` → `subtotal = max(subtotal, floor)`
   * `CAP` → `subtotal = min(subtotal, cap)`
   * `PACKAGE_DISCOUNT` / `ABSOLUTE_ADJUST` → aplicar conforme `valueType`
6. **Subtotal**: `subtotal = base + addOnsSum + distanceFee` antes de `SURGE`; aplicar demais regras em ordem.
7. **Rounding**: arredondar para múltiplos configurados (ex.: `R$ 1,00`).
8. **Split** (informativo):

   * `marketplaceFee = round(subtotal * TAKE_RATE_BP / 10_000)`
   * `providerPayout = subtotal - marketplaceFee`
9. **Breakdown** retornado ao cliente; **nenhuma gravação** ocorre aqui (snapshot real no `Bookings`).

### 6.2 Seleção de regras

* **Escopos** avaliados em ordem de especificidade: `PROVIDER` > `SERVICE` > `CATEGORY` > `CITY` > `GLOBAL`.
* Filtros por **when** (`daysOfWeek`, `timeStart/end`, `activeFrom/to`).
* Resolver **conflitos** por `priority` (maior aplica por último) e **tipo** (ex.: múltiplos `SURGE` multiplicam sequencialmente até o limite em ENV).

---

## 7) Config (ENV)

```env
PRICING_TAKE_RATE_BP=1500                  # 15% em basis points
PRICING_ROUND_TO_RS=1                      # arredonda para o real mais próximo
PRICING_DISTANCE_RS_PER_KM=3               # fallback p/ DISTANCE_FEE
PRICING_SURGE_MAX_MULTIPLIER=1.8
PRICING_PRICE_MIN_RS=40
PRICING_PRICE_CAP_RS=2000
PRICING_CACHE_TTL_SEC=60                   # cache de quotes idênticas (chaveado por params)
```

---

## 8) Exemplos (HTTP)

### 8.1 Cotação — serviço por hora com add‑ons e distância

```http
GET /pricing/quote?serviceId=svc_123&providerId=p_01&durationMin=240&addOns=geladeira,forno&distanceKm=5&when=2025-08-26T10:00:00-03:00
```

**200** *(exemplo reduzido)*

```json
{
  "inputs": {"serviceId":"svc_123","providerId":"p_01","durationMin":240,"addOns":["geladeira","forno"],"distanceKm":5},
  "breakdown": {
    "model": "HOURLY",
    "hours": 4,
    "base": 180,
    "addOns": 45,
    "distanceFee": 15,
    "surgeMultiplier": 1.2,
    "floorApplied": false,
    "capApplied": false
  },
  "totals": {"grossCustomer": 276, "marketplaceFee": 41.4, "providerPayout": 234.6}
}
```

### 8.2 Regras — criar surge por pico (cidade)

```http
POST /pricing/rules
{
  "scope":"CITY","refId":"campinas",
  "kind":"SURGE","valueType":"MULTIPLIER","value":1.2,
  "daysOfWeek":[5,6],"timeStart":"08:00","timeEnd":"12:00",
  "activeFrom":"2025-08-01T00:00:00Z","activeTo":"2025-12-31T23:59:59Z",
  "priority": 100, "description": "Pico manhã fim de semana"
}
```

---

## 9) Integrações

* **Provider Services**: fonte de `pricingModel/basePrice/duration/addOns`.
* **Services**: defaults de duração/add‑ons quando aplicável.
* **Search/Ranking**: `priceFrom` para ordenação/filtro.
* **Bookings**: grava **snapshot** do preço e aplica **cupom** (módulo de Coupons).
* **Payments**: `marketplaceFee` alimenta relatórios (não altera valor de cobrança do cliente nesta etapa).
* **Cache/Redis**: memoização de quotes idênticas por curto prazo.

---

## 10) Segurança & LGPD

* Não expor PII; apenas IDs e valores.
* Validar ownership/escopos em rotas **admin** de regras.
* Rate‑limit em `/pricing/quote` para evitar abuso.

---

## 11) Telemetria & KPIs

* Eventos: `pricing_quote_requested`, `pricing_rules_applied`, `pricing_quote_cached`.
* KPIs: **p95** de latência do quote, **hit‑rate** de cache, **variação de conversão** por regra (antes/depois), **distribuição de priceFrom** por cidade/categoria.

---

## 12) QA — Casos críticos

* `durationMin` não compatível com o serviço (`HOURLY` com `minHours`) → erro claro.
* `distanceKm` ausente em regra obrigatória de distância → usar fallback ENV ou negar cotação.
* Regras conflitantes (`FLOOR` > `CAP`) → priorizar `CAP` final; alertar log.
* `SURGE` acumulado > `PRICING_SURGE_MAX_MULTIPLIER` → clamp e logar.
* `PACKAGE` sem tabela configurada → `UNSUPPORTED_PRICING`.

---

## 13) Melhorias avançadas (quando necessário)

1. **Zona dinâmica** de preço por bairro (heatmap de demanda) com auto‑surge.
2. **Elasticidade**: experimentar passos de preço para maximizar conversão/receita.
3. **Preços personalizados** por coorte (ex.: clientes recorrentes vs. novos), respeitando LGPD e fairness.
4. **Simulador** de impacto de regras antes de publicar (A/B).

---

## 14) Conclusão

O **Pricing** centraliza regras e cálculos de preço do LimpeJá, garantindo previsibilidade para o cliente, rentabilidade para o provedor e margem para o marketplace. Com regras declarativas, breakdown explícito e integração aos módulos de catálogo, reservas e pagamentos, o sistema está pronto para produção e para escalar com novas políticas de preço.
