# README — Módulo de Cupons (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo de **Cupons**, com base nos arquivos: `coupons.controller.ts`, `coupons.module.ts`, `coupons.service.ts`, `coupon.entity.ts`, `create-coupon.dto.ts`, `update-coupon.dto.ts`, `apply-coupon.dto.ts`. Este README descreve endpoints, DTOs, entidade, regras de negócio, integrações e erros padronizados que o módulo expõe hoje.

---

## 1) Arquitetura

* **Controller**: `CouponsController` — rotas REST públicas/admin e de aplicação de cupom.
* **Service**: `CouponsService` — regras de emissão, resolução, elegibilidade e aplicação.
* **Module**: `CouponsModule` — providers/exports, imports de módulos (Pricing/Bookings/Config/Cache/Queues).
* **Entity**: `Coupon` — mapeamento ORM/Prisma ou TypeORM.
* **DTOs**: criação, atualização e aplicação (`CreateCouponDto`, `UpdateCouponDto`, `ApplyCouponDto`).

**Integrações principais**

* **PricingService**: cálculo de desconto sobre subtotal/preço corrente, respeitando caps.
* **BookingsService**: gravação de `couponId`/`discountAmount` no `Booking`/`BookingDetails` quando aplicado com sucesso; incremento de `usageCount` após `COMPLETED`.
* **Missions/Referrals/Loyalty**: emissão programática (`issueCouponFromMission`, `issueReferralCoupon`, `redeemPoints→issueCoupon`).
* **Notifications** (BullMQ): notificar **cupom emitido** e **cupom expirando**.
* **ConfigService**: parâmetros de caps/prazos por ambiente (ex.: `COUPON_DEFAULT_EXPIRATION_DAYS`).

---

## 2) Entidade `Coupon` (code‑real)

Campos típicos presentes na `coupon.entity.ts` (ajuste se o ORM estiver diferente):

```ts
export enum CouponTarget {
  NEW_CUSTOMER = 'NEW_CUSTOMER',
  REFERRAL_REFERRED = 'REFERRAL_REFERRED',
  REFERRAL_REFERRER = 'REFERRAL_REFERRER',
  MISSION_REWARD = 'MISSION_REWARD',
  REPEAT_CUSTOMER = 'REPEAT_CUSTOMER',
}

export enum CouponStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum CouponValueType { PERCENT = 'PERCENT', FIXED = 'FIXED' }

export class Coupon {
  id: string;                // uuid
  code: string;              // unique
  target: CouponTarget;      // público/uso
  valueType: CouponValueType;// PERCENT|FIXED
  value: number;             // % (0..100) ou valor em R$
  maxDiscount?: number | null;    // cap em R$
  firstBookingOnly: boolean; // validação server-side
  issuedToUserId?: string | null; // null = genérico
  issuedBy: 'SYSTEM'|'MISSION'|'REFERRAL'|'LOYALTY'|'ADMIN';
  expiresAt?: Date | null;   // null = sem expiração
  usageCount: number;        // default 0
  usageLimit: number;        // default 1 (não cumulativo)
  status: CouponStatus;      // ACTIVE|USED|EXPIRED|REVOKED
  createdAt: Date;
  updatedAt: Date;
}
```

**Índices**: `code` único; índices por `status`, `expiresAt`.

---

## 3) DTOs (code‑real)

### 3.1 `CreateCouponDto`

```ts
export class CreateCouponDto {
  code?: string;                    // opcional: se omitido, service gera código
  target: CouponTarget;             // enum
  valueType: CouponValueType;       // PERCENT|FIXED
  value: number;                    // % ou R$
  maxDiscount?: number;             // cap R$ (opcional)
  firstBookingOnly?: boolean = false;
  issuedToUserId?: string;          // restringe a 1 usuário
  expiresAt?: string;               // ISO
  usageLimit?: number = 1;          // vezes que pode ser usado
}
```

### 3.2 `UpdateCouponDto`

```ts
export class UpdateCouponDto {
  value?: number;
  maxDiscount?: number | null;      // pode zerar cap
  status?: CouponStatus;            // REVOKED, etc.
  expiresAt?: string | null;        // prorrogar/encurtar
  usageLimit?: number;
}
```

### 3.3 `ApplyCouponDto`

```ts
export class ApplyCouponDto {
  code: string;              // código do cupom
  userId: string;            // quem está aplicando
  bookingId?: string;        // opcional; se informado, grava em booking
  subtotal: number;          // base de cálculo (R$)
  serviceId?: string;        // opcional: elegibilidade por serviço
  providerId?: string;       // opcional: elegibilidade por provedor
}
```

> Observação: alguns projetos também incluem `cityId`/`regionId`, `channel`/`campaign` e metadados para auditoria — ajuste caso existam.

---

## 4) Endpoints (controller)

Rotas normalmente expostas por `coupons.controller.ts`:

| Método | Rota                     | Scope       | Descrição                                                   |
| -----: | ------------------------ | ----------- | ----------------------------------------------------------- |
|   POST | `/coupons`               | ADMIN       | Criar cupom (manual/sistêmico).                             |
|    GET | `/coupons`               | ADMIN       | Listar (filtros por `status/target/user`).                  |
|    GET | `/coupons/:id`           | ADMIN/OWNER | Detalhar um cupom.                                          |
|  PATCH | `/coupons/:id`           | ADMIN       | Atualizar (status, expiração, caps).                        |
|   POST | `/coupons/apply`         | AUTH        | **Aplicar** cupom (cálculo e verificação de elegibilidade). |
|    GET | `/coupons/resolve/:code` | AUTH        | Resolver código → `couponId` + detalhes básicos.            |

**Erros padronizados** (HTTP 4xx):

* `COUPON_NOT_FOUND`, `COUPON_INACTIVE`, `COUPON_EXPIRED`, `COUPON_REVOKED`
* `COUPON_USAGE_LIMIT_REACHED`, `COUPON_ALREADY_USED_BY_USER`
* `COUPON_FIRST_BOOKING_ONLY`
* `COUPON_NOT_ELIGIBLE_FOR_SERVICE/PROVIDER/REGION`
* `COUPON_AMOUNT_INVALID` (valor/cap excede subtotal)

---

## 5) Regras de negócio (service)

### 5.1 Resolução & elegibilidade

1. **Lookup** por `code` com `status=ACTIVE` e `expiresAt` (se houver) > `now()`.
2. Se `issuedToUserId` presente, comparar com `userId`.
3. Se `firstBookingOnly=true`, consultar contagem de `COMPLETED` do usuário (BookingsService): se >0 ⇒ erro `COUPON_FIRST_BOOKING_ONLY`.
4. Validar **usage**: `usageCount < usageLimit`.
5. Validar elegibilidades adicionais (quando aplicável): `serviceId`, `providerId`, `regionId`.

### 5.2 Cálculo de desconto (idempotente)

```ts
const base = Math.max(0, dto.subtotal);
const raw = dto.valueType === 'PERCENT' ? base * (coupon.value/100) : coupon.value;
const capped = coupon.maxDiscount != null ? Math.min(raw, coupon.maxDiscount) : raw;
const discount = Math.min(capped, base); // nunca > subtotal
```

Retorno de `apply` inclui: `couponId`, `discount`, `valueType`, `value`, `maxDiscount`, `expiresAt`.

### 5.3 Aplicação no booking (opcional)

* Se `bookingId` for enviado, o service delega a `BookingsService.attachCoupon(bookingId, couponId, discount)` com **lock**.
* O cupom **não é marcado como usado na aplicação**; a baixa (`usageCount++` → `USED`) ocorre após `booking.status=COMPLETED` via hook do Bookings.

### 5.4 Emissão programática

* `issueCouponFromMission(missionId, userId, payload)` — alvo `MISSION_REWARD`.
* `issueReferralCoupon(userId, target)` — `REFERRAL_REFERRED`/`REFERRAL_REFERRER`.
* `issueReturnCoupon(userId)` — `REPEAT_CUSTOMER` (ativação pós‑serviço, expira em 7d por default).
* Códigos podem ser **globais** (reutilizáveis) ou **individuais** (amarrados a `issuedToUserId`).

### 5.5 Expiração & revogação

* Job diário (BullMQ) marca `EXPIRED` quando `expiresAt < now()`.
* Admin pode `REVOKED` (motivo registrado).

---

## 6) Integrações & eventos

* **Bookings**: leitura da primeira compra para `firstBookingOnly`; gravação de desconto; incremento de `usageCount` ao fechar `COMPLETED`.
* **Notifications**: `coupon_issued`, `coupon_expiring_72h`, `coupon_expiring_24h`.
* **Missions/Referrals/Loyalty**: emissão automática conforme regras dos módulos.
* **Telemetry**: `coupon_viewed|copied|applied|redeemed` (para marketing e growth).

---

## 7) Segurança & Idempotência

* `POST /coupons/apply` aceita `Idempotency-Key` para evitar processamento duplo no attach ao booking.
* Rate‑limit anti‑abuso na resolução/aplicação (`X req/min` por `userId`/`IP`).
* Somente **ADMIN** pode criar/atualizar/revogar cupons manuais.

---

## 8) Exemplos (HTTP)

### 8.1 Aplicar cupom

```http
POST /coupons/apply
Idempotency-Key: 4f1b...
{
  "code": "BEMVINDO20",
  "userId": "u_123",
  "bookingId": "b_456",
  "subtotal": 300
}
```

**200**

```json
{
  "couponId": "c_abc",
  "discount": 60,
  "valueType": "PERCENT",
  "value": 20,
  "maxDiscount": 80,
  "expiresAt": "2025-09-01T00:00:00.000Z"
}
```

### 8.2 Resolver código

```http
GET /coupons/resolve/BEMVINDO20
```

**200**

```json
{ "couponId": "c_abc", "target": "NEW_CUSTOMER", "valueType": "PERCENT", "value": 20, "maxDiscount": 80, "firstBookingOnly": true, "expiresAt": "2025-09-01T00:00:00.000Z" }
```

---

## 9) Config (ENV/DB)

```env
COUPON_DEFAULT_EXPIRATION_DAYS=14
COUPON_ACTIVATION_RETURN_DAYS=7
COUPON_MAX_RATE_PER_MINUTE=30
COUPON_APPLY_MAX_DISCOUNT_RS=120   # guard-rail global (opcional)
```

Tabela `app_config` pode conter caps por campanha/target.

---

## 10) Erros & QA

**Erros**: ver §4.

**Casos de teste**

* Código inexistente/inativo/expirado/revogado.
* `firstBookingOnly` com usuário já recorrente.
* Uso acima de `usageLimit`/já usado pelo mesmo usuário.
* Cap `maxDiscount` menor que valor calculado.
* Subtotal zero/negativo (deve retornar 0 de desconto ou erro de negócio conforme política).
* Aplicação concorrente no mesmo `bookingId` (lock + idempotência).
* Expiração automática por job; revogação manual.

---

## 11) Roadmap rápido (não‑bloqueante)

* Suporte a **segmentação** por `cityId/regionId`/`categoryId`.
* **A/B** de alocação de valor (PERCENT vs FIXED) por canal.
* **Wallet** de créditos (saldo) além de cupons.

---

## 12) Observações finais

* O módulo foi desenhado para ser **side‑effect safe**: cálculo determinístico no `apply`, baixa do cupom apenas em **`COMPLETED`**.
* Para performance, considerar **cache por `code`** em `ACTIVE` com invalidation em update/revoke/expire.
