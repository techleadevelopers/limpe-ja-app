# README — Módulo de Earnings (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Earnings** com base nos arquivos: `earnings.module.ts`, `earnings.controller.ts`, `earnings.service.ts`, `earnings.dto.ts`.
>
> **Objetivo:** expor, para **provedores**, o **saldo**, o **histórico (ledger)**, os **ganhos por período**, e operar o **fluxo de saque PIX** com segurança, idempotência e auditoria — integrando **Bookings/Payments/Disputes/Queues**.

---

## 1) Responsabilidades

* Calcular **saldo disponível** (available), **saldo pendente** (pending) e **bloqueado** (on hold) por provedor.
* Expor **ganhos por período** (séries), **resumo** (KPI) e **ledger** detalhado (eventos financeiros).
* Receber **solicitações de saque** (PIX) e orquestrar processamento/estado até **PAID** ou **FAILED**.
* Manter **auditoria** completa (quem pediu, quando, para qual chave PIX, valores/fees, idempotência).

---

## 2) Arquitetura

* **Module**: `EarningsModule` — registra controller/service e injeta dependências.
* **Controller**: `EarningsController` — rotas REST para resumo, séries, ledger e saque.
* **Service**: `EarningsService` — cálculos, validações de saque, criação de intent de payout, integração com filas.
* **DTOs**: definidos em `earnings.dto.ts` (consulta e solicitação de saque).

**Dependências típicas**: `PaymentsService` (payout PIX e reconciliation), `BookingsService` (COMPLETED), `DisputesService` (holds), `QueuesService` (jobs assíncronos), `ConfigService` (limites/fees), `Cache/Redis`, `Sentry` (telemetria).

---

## 3) Modelagem (conceitos)

### 3.1 Ledger

Eventos financeiros por provedor:

* `BOOKING_COMPLETED` (crédito bruto)
* `TAKE_RATE_FEE` (débito da taxa do marketplace)
* `ADJUSTMENT` (ajustes manuais)
* `DISPUTE_HOLD` / `DISPUTE_RELEASE` (bloqueio/liberação)
* `WITHDRAWAL_REQUESTED` / `WITHDRAWAL_PAID` / `WITHDRAWAL_FAILED` (saques)

### 3.2 Estados de saque (payout)

`REQUESTED` → `IN_REVIEW` → `PROCESSING` → `PAID` | `FAILED` | `CANCELED`

> Transições dirigidas por **worker** (fila) e **webhook**/consulta no PSP PIX.

---

## 4) DTOs (code‑real)

Arquivo: `earnings.dto.ts` (formas esperadas)

```ts
export class EarningsQueryDto {
  @IsDateString() start: string;                   // ISO inclusivo
  @IsDateString() end: string;                     // ISO exclusivo
  @IsOptional() @IsEnum(['day','week','month']) granularity: 'day'|'week'|'month' = 'day';
  @IsOptional() @IsString() timezone: string = 'America/Sao_Paulo';
}

export class RequestWithdrawalDto {
  @IsNumber() @Min(10) amount: number;             // R$; limites via env
  @IsString() pixKey: string;                      // chave PIX (cpf/cnpj/email/phone/random)
  @IsOptional() @IsString() idempotencyKey?: string; // evita duplo pedido
}
```

> Caso exista validação granular de PIX (`@IsPixKey`), ela é aplicada no controller/service antes de aceitar a solicitação.

---

## 5) Rotas (EarningsController)

| Método | Rota                    | Scope           | Descrição                                                           |
| -----: | ----------------------- | --------------- | ------------------------------------------------------------------- |
|    GET | `/earnings/summary`     | PROVIDER (self) | KPIs: `available`, `pending`, `onHold`, `totalEarned`, `withdrawn`. |
|    GET | `/earnings/series`      | PROVIDER (self) | Ganhos ao longo do tempo conforme `EarningsQueryDto`.               |
|    GET | `/earnings/ledger`      | PROVIDER (self) | Lista de eventos financeiros (paginada).                            |
|    GET | `/earnings/withdrawals` | PROVIDER (self) | Histórico de saques e seus estados.                                 |
|   POST | `/earnings/withdrawals` | PROVIDER (self) | **Solicitar saque** (PIX), valida e enfileira `PROCESSING`.         |

**Erros comuns**: `VALIDATION_ERROR`, `KYC_REQUIRED`, `AMOUNT_BELOW_MIN`, `AMOUNT_ABOVE_MAX`, `INSUFFICIENT_AVAILABLE`, `WITHDRAWAL_IN_REVIEW`, `PIX_KEY_INVALID`, `IDEMPOTENCY_CONFLICT`.

---

## 6) Service (assinaturas & fluxo)

```ts
class EarningsService {
  getSummary(providerId: string): Promise<SummaryPayload>;
  getSeries(providerId: string, q: EarningsQueryDto): Promise<SeriesPayload>;
  getLedger(providerId: string, page: number, pageSize: number): Promise<LedgerPage>;
  listWithdrawals(providerId: string): Promise<WithdrawalItem[]>;
  requestWithdrawal(providerId: string, dto: RequestWithdrawalDto): Promise<WithdrawalItem>;
}
```

### 6.1 Cálculo de saldos

* **totalEarned** = soma de créditos `BOOKING_COMPLETED` − taxas (`TAKE_RATE_FEE`) ± ajustes.
* **onHold** = soma de `DISPUTE_HOLD` − `DISPUTE_RELEASE` em aberto.
* **withdrawn** = soma de `WITHDRAWAL_PAID`.
* **pending** = créditos ainda não liquidados (ex.: período de compensação `T+N`).
* **available** = `totalEarned − withdrawn − onHold − pending` (não negativo).

### 6.2 Série temporal (granularidade)

* Agrupar por `granularity` (`day/week/month`) no fuso do provedor; **zero‑fill** nos buckets.

### 6.3 Solicitação de saque

1. **Pré‑checks**: KYC aprovado; `amount` entre `[MIN, MAX]`; `available ≥ amount + FEE`.
2. **Idempotência**: se `idempotencyKey` presente, travar `withdrawal:{providerId}:{key}`.
3. Criar **withdrawal intent** (`REQUESTED` → `IN_REVIEW`), debitar **fee** (se aplicável) e enfileirar no `QueuesService`.
4. Worker aciona PSP (PIX) → `PROCESSING` → `PAID` (`FAILED` se erro). Telemetria e notificação push.

### 6.4 Holds de disputa

* Ao abrir disputa relevante ao provedor, criar `DISPUTE_HOLD` (valor estimado/cap) → reduz `available` até resolução.
* Na decisão: `DISPUTE_RELEASE` (se improcedente) ou ajuste financeiro (se reembolso).

---

## 7) Payloads (resposta)

```ts
export type SummaryPayload = {
  available: number; pending: number; onHold: number; totalEarned: number; withdrawn: number;
};

export type SeriesPoint = { bucket: string /* ISO no timezone */, value: number };
export type SeriesPayload = { earnings: SeriesPoint[] };

export type LedgerItem = {
  id: string; kind: 'BOOKING_COMPLETED'|'TAKE_RATE_FEE'|'ADJUSTMENT'|'DISPUTE_HOLD'|'DISPUTE_RELEASE'|'WITHDRAWAL_REQUESTED'|'WITHDRAWAL_PAID'|'WITHDRAWAL_FAILED';
  amount: number; meta?: any; createdAt: string; bookingId?: string; disputeId?: string; withdrawalId?: string;
};
export type LedgerPage = { items: LedgerItem[]; page: number; pageSize: number; total: number };

export type WithdrawalItem = {
  id: string; amount: number; fee: number; pixKey: string; state: 'REQUESTED'|'IN_REVIEW'|'PROCESSING'|'PAID'|'FAILED'|'CANCELED';
  createdAt: string; updatedAt: string; failureReason?: string;
};
```

---

## 8) Segurança & RBAC

* Todas as rotas são **autenticadas** e escopo **PROVIDER (self)**; ADMIN pode consultar para auditoria/investigação.
* **PII mínima**: salvar/retornar **somente** a **chave PIX** mascarada quando exibida ao usuário.
* **Auditoria**: mudanças de estado de `withdrawal` com `who/when/why` + IP.

---

## 9) Integrações

* **PaymentsService**: criação de `payout intent` PIX e reconciliação (webhook/polling).
* **BookingsService**: origem dos créditos (COMPLETED) e janela de liquidação (se existir `T+N`).
* **DisputesService**: aplicação/remoção de **holds**.
* **QueuesService**: processamento assíncrono de `withdrawal` e re‑tentativas.
* **Notifications**: push de `withdrawal_requested/paid/failed`.

---

## 10) Config (ENV)

```env
EARNINGS_TIMEZONE_DEFAULT=America/Sao_Paulo
WITHDRAWAL_MIN_RS=20
WITHDRAWAL_MAX_RS=5000
WITHDRAWAL_FIXED_FEE_RS=0           # opcional
WITHDRAWAL_PERCENT_FEE=0            # ex.: 0.01 = 1%
WITHDRAWAL_SETTLEMENT_DAYS=0        # T+N; 0 = imediato após COMPLETED
REQUIRE_KYC_FOR_WITHDRAWAL=true
```

> **Fee efetiva**: `fee = max(WITHDRAWAL_FIXED_FEE_RS, amount * WITHDRAWAL_PERCENT_FEE)`.

---

## 11) Exemplos (HTTP)

### 11.1 Resumo

```http
GET /earnings/summary
Authorization: Bearer <token>
```

**200**

```json
{ "available": 1240, "pending": 180, "onHold": 60, "totalEarned": 1620, "withdrawn": 200 }
```

### 11.2 Série (30 dias)

```http
GET /earnings/series?start=2025-07-26T00:00:00Z&end=2025-08-24T00:00:00Z&granularity=day&timezone=America/Sao_Paulo
```

**200**

```json
{ "earnings": [{"bucket":"2025-08-10T00:00:00-03:00","value":820}, ...] }
```

### 11.3 Ledger (paginado)

```http
GET /earnings/ledger?page=1&pageSize=50
```

**200** *(exemplo reduzido)*

```json
{
  "items": [
    {"id":"l1","kind":"BOOKING_COMPLETED","amount":300,"bookingId":"b1","createdAt":"2025-08-10T14:30:00-03:00"},
    {"id":"l2","kind":"TAKE_RATE_FEE","amount":-45,"bookingId":"b1","createdAt":"2025-08-10T14:30:00-03:00"}
  ],
  "page":1,"pageSize":50,"total":2
}
```

### 11.4 Solicitar saque (PIX)

```http
POST /earnings/withdrawals
Idempotency-Key: 7f12-d3...
{
  "amount": 400,
  "pixKey": "cpf:123.456.789-09"
}
```

**200**

```json
{ "id":"w_01","amount":400,"fee":0,"pixKey":"cpf:***-**9-09","state":"IN_REVIEW","createdAt":"2025-08-24T12:00:00-03:00" }
```

---

## 12) Telemetria & Alertas

* Eventos: `earnings_summary_viewed`, `withdrawal_requested`, `withdrawal_processing`, `withdrawal_paid`, `withdrawal_failed`.
* Alertas: taxa de **falhas** > 2%/dia em `withdrawal`, latência média de PSP > Xs, anomalias de saldo (`available < 0`).

---

## 13) Cache & Performance

* **Cache** curto (30–120s) no **summary** e **series** (`earnings:{providerId}:{hash(q)}`) com **invalidation** por eventos (`booking_completed`, `dispute_hold/release`, `withdrawal_paid`).
* Paginação no **ledger** com índices por `providerId, createdAt`.

---

## 14) QA — Casos críticos

* `available` negativo (não pode) — proteger com clamp a zero e investigar ledger.
* Saque > `available` ⇒ erro; considerar **race condition** com novos holds.
* Idempotência: mesmo `Idempotency-Key` não deve criar 2 pedidos.
* PIX inválido/PSP fora — `FAILED` com reprocesso opcional.
* KYC ausente ⇒ `KYC_REQUIRED`.

---

## 15) Melhorias avançadas (quando necessário)

1. **Wallet** de créditos do provedor (saldo interno) para abatimentos/ajustes finos.
2. **Antecipação** (early payout) com fee dinâmica baseada em risco e histórico.
3. **Split de recebíveis** (multi‑provedor/serviço) quando aplicável.
4. **Export** CSV do ledger e extratos mensais PDF.
5. **Reconciliação** near‑real‑time via webhooks + fallback de polling.
6. **Alertas proativos** ao provedor (meta semanal atingida, picos de cancelamento, recomendação de preço/slot).

---

## 16) Conclusão

O módulo **Earnings** consolida os ganhos do provedor com regras claras,
**saques seguros** (idempotentes) e **auditoria completa**, e oferece base para
transparência e confiança — pilares para retenção de oferta e escala do marketplace.
