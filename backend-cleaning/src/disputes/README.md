# README — Disputes Module (code‑real, versão atual)

> Documentação de engenharia focada **no código atual** do módulo de Disputas do LimpeJá. Cobre
> arquitetura, rotas, DTOs, serviços, máquina de estados, integrações, erros, filas/SLAs,
> telemetria, configuração e exemplos de uso.

---

## 1) Visão geral & responsabilidades

* Centraliza **abertura, negociação, mediação e resolução** de disputas de um `booking`.
* Aplica **HOLD/ajuste** de payout do provedor até decisão final.
* Orquestra **reembolso PIX / crédito (cupom)** e **reagendamento** quando aplicável.
* Mantém **linha do tempo auditável** (mensagens/evidências/SLAs/decisão) e políticas anti‑desintermediação.

---

## 2) Estrutura (pasta)

```
backend/src/disputes/
 ├─ dispute.module.ts
 ├─ dispute.controller.ts
 ├─ dispute.service.ts
 ├─ dto/
 │   ├─ create-dispute.dto.ts
 │   └─ update-dispute.dto.ts
 ├─ entities/
 │   ├─ dispute.entity.ts
 │   ├─ dispute-message.entity.ts
 │   ├─ dispute-evidence.entity.ts
 │   └─ dispute-decision.entity.ts
 └─ jobs/ (BullMQ)  // timeouts/SLAs
```

**Dependências principais**: `BookingsModule`, `PaymentsModule`, `CouponsModule`, `SupportModule`, `NotificationsModule`, `Cache/RedisModule` (locks/rate-limit), `BullMQModule` (SLAs), `ConfigModule` (ENV), `SentryModule` (telemetria).

---

## 3) DisputeModule (wiring)

* **imports**: Bookings, Payments, Coupons, Support, Notifications, Cache/Redis, BullMQ, Config.
* **providers**: `DisputeService`, `DisputeSlaProcessor` (BullMQ), validadores/guards.
* **controllers**: `DisputeController`.

> *Observação*: variáveis sensíveis viriam de `ConfigService` (prefixo `DISPUTE_*`).

---

## 4) Rotas (DisputeController)

| Método | Rota                               | Auth            | Descrição                                                     |
| ------ | ---------------------------------- | --------------- | ------------------------------------------------------------- |
| `POST` | `/disputes`                        | CLIENT/PROVIDER | Abre disputa (motivo, descrição, evidências; um por booking). |
| `GET`  | `/disputes/:id`                    | OWNER/ADMIN     | Detalhes + linha do tempo + SLAs.                             |
| `POST` | `/disputes/:id/messages`           | OWNER/ADMIN     | Envia mensagem/evidência (com moderação anti‑contato).        |
| `POST` | `/disputes/:id/settlement/propose` | OWNER/ADMIN     | Registra proposta (percentual/valor, cupom, reagendamento).   |
| `POST` | `/disputes/:id/escalate`           | OWNER/ADMIN     | Escalona para mediação do marketplace.                        |
| `POST` | `/disputes/:id/resolve`            | ADMIN           | Decide disputa (refund integral/parcial, redo, rejeitado).    |

**Códigos de erro usuais**: `DISPUTE_DUPLICATE`, `BOOKING_INELIGIBLE`, `INVALID_STATE`, `NOT_OWNER`, `SLA_EXPIRED`, `CONTACT_INFO_BLOCKED`, `ATTACHMENT_NOT_ALLOWED`.

---

## 5) DTOs (validação)

### 5.1 `CreateDisputeDto`

```ts
export class CreateDisputeDto {
  @IsUUID() bookingId: string;
  @IsEnum(['NO_SHOW','LATE','QUALITY','DAMAGE','MISCONDUCT','OTHER']) reason: string;
  @IsString() @MaxLength(2000) description: string;
  @IsOptional() @IsArray() @ArrayMaxSize(6)
  @IsUrl({}, { each: true }) evidenceUrls?: string[]; // GCS/S3 presigned
}
```

### 5.2 `UpdateDisputeDto`

```ts
export class UpdateDisputeDto {
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsEnum([
    'OPENED','WAITING_PROVIDER','NEGOTIATION','MEDIATION','DECISION_PENDING',
    'RESOLVED_FULL_REFUND','RESOLVED_PARTIAL_REFUND','RESOLVED_REDO','RESOLVED_REJECTED','CLOSED'])
  state?: string;
}
```

### 5.3 Auxiliares (controller/service)

```ts
export class AddMessageDto {
  @IsString() @MaxLength(2000) text: string;
  @IsOptional() @IsArray() @ArrayMaxSize(3)
  @IsUrl({}, { each: true }) evidenceUrls?: string[];
}

export class ProposeSettlementDto {
  @IsOptional() @IsNumber() refundPercent?: number; // 0..100
  @IsOptional() @IsNumber() refundAmount?: number;  // R$
  @IsOptional() @IsString() couponCode?: string;    // opcional
  @IsOptional() @IsDateString() redoAt?: string;    // reexecução
}

export class ResolveDisputeDto {
  @IsEnum(['FULL_REFUND','PARTIAL_REFUND','REDO','REJECTED']) outcome: string;
  @IsOptional() @IsNumber() refundPercent?: number;
  @IsOptional() @IsNumber() refundAmount?: number;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsDateString() redoAt?: string;
}
```

> Middleware/pipe de **moderação** deve sanitizar `AddMessageDto.text` (telefone/e‑mail/URL/redes) antes de persistir e emitir.

---

## 6) Service (assinaturas e efeitos)

```ts
open(userId: string, dto: CreateDisputeDto): Promise<Dispute>
getById(userId: string, id: string): Promise<DisputeWithTimeline>
addMessage(userId: string, id: string, dto: AddMessageDto): Promise<DisputeMessage>
proposeSettlement(userId: string, id: string, dto: ProposeSettlementDto): Promise<void>
escalate(userId: string, id: string): Promise<void>
resolve(adminId: string, id: string, dto: ResolveDisputeDto): Promise<DisputeDecision>
```

**Efeitos por operação**

* `open`  → valida janela (IN\_PROGRESS ou ≤48h pós‑COMPLETED), impede duplicidade por `bookingId`, cria `OPENED`, **HOLD payout** (se não liquidado), agenda SLA `WAITING_PROVIDER`, notifica partes.
* `addMessage` → sanitiza texto (anti‑desintermediação), guarda evidências (GCS/S3), notifica contraparte.
* `proposeSettlement` → registra proposta, alterna p/ `NEGOTIATION`, notifica contraparte.
* `escalate` → força `MEDIATION`, abre **ticket interno** no Support para time de mediação.
* `resolve` → calcula e **executa** (refund parcial/integral, cupom via Coupons, redo), encerra estados; emite eventos de telemetria.

Locks (Redis) por `(disputeId, action)` e `Idempotency-Key` por request mutável.

---

## 7) Máquina de estados & SLAs

Estados:

```
OPENED → WAITING_PROVIDER → NEGOTIATION → MEDIATION → DECISION_PENDING →
  RESOLVED_FULL_REFUND | RESOLVED_PARTIAL_REFUND | RESOLVED_REDO | RESOLVED_REJECTED → CLOSED
```

SLAs (BullMQ jobs):

* `WAITING_PROVIDER` **24h** – se sem resposta, auto‑avança → `NEGOTIATION`.
* `NEGOTIATION` **24h** – timeout → `MEDIATION`.
* `MEDIATION` **24–48h** – timeout → `DECISION_PENDING` com regra padrão.

Transições checam `disputeVersion` (optimistic lock). Todas as mudanças ficam auditadas.

---

## 8) Cálculo de decisão (resumo atual)

* **NO\_SHOW** → reembolso **100%**; sanção de ranking ao provedor.
* **LATE** → até **20%** (cap R\$40) + **cupom** de boa‑fé ao cliente.
* **QUALITY** → **30–90%** conforme `quality_score` (checklist/fotos/NPS), cap R\$120.
* **MISCONDUCT** → integral + sanções.
* **OTHER** → julgamento do moderador; default cupom de boa‑fé quando cabível.

Execução financeira: antes do payout, abate do **HOLD**; após, cria **saldo negativo** do provedor ou devolução PIX (se PSP suportar); senão, crédito/cupom ao cliente.

---

## 9) Integrações

* **Bookings**: status/agenda; hold/liberação de payout; fecha chat; opcional: reagendamento.
* **Payments**: criação/devolução de transações; reconciliação por `PaymentEvent`.
* **Coupons**: emissão de cupom de boa‑fé (cliente) e/ou isenção parcial do provedor.
* **Support**: ticket interno ao escalar; logs e SLA do caso.
* **Notifications**: push de abertura, lembretes de SLA, decisão final.
* **Chat**: mensagens sanitizadas; bloqueio de contato.

---

## 10) Segurança, rate‑limit e compliance

* **Anti‑desintermediação**: regex para telefone/e‑mail/URL/redes; bloqueio de vCard/QR.
* **Rate‑limit**: 10 msgs / 10 min / usuário (por booking); backoff.
* **LGPD**: salvar `sanitizedBody` + `blockedReason`; evidências em storage seguro com URL expirada.
* **RBAC**: OWNER (cliente/provedor do booking) vs ADMIN (mediação interna).

---

## 11) Telemetria (SSE/Logs)

Eventos: `dispute_opened`, `dispute_waiting_provider_timeout`, `dispute_negotiation_timeout`, `dispute_escalated`, `dispute_decided`, `dispute_refund_executed`, `dispute_closed`, `chat_message_blocked`.

KPIs: TTR ≤72h, % resolvida sem admin, % partial/full refund, reincidência por provedor/cliente, disputas/100 bookings.

---

## 12) Config (ENV)

```
DISPUTE_ENABLED=true
DISPUTE_OPEN_WINDOW_HOURS=48
DISPUTE_WAITING_PROVIDER_HOURS=24
DISPUTE_NEGOTIATION_HOURS=24
DISPUTE_MEDIATION_HOURS=48
DISPUTE_LATE_MAX_PCT=0.20
DISPUTE_LATE_CAP_RS=40
DISPUTE_QUALITY_CAP_RS=120
GOODWILL_COUPON_RS=20
```

---

## 13) Exemplos (HTTP)

### 13.1 Abrir disputa

```http
POST /disputes
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "b6b7b3e0-...",
  "reason": "QUALITY",
  "description": "Limpeza parcial e atraso de 30min.",
  "evidenceUrls": ["https://gcs/.../antes.jpg", "https://gcs/.../depois.jpg"]
}
```

### 13.2 Propor acordo

```http
POST /disputes/{id}/settlement/propose
{
  "refundPercent": 20,
  "couponCode": "BOAFE20"
}
```

### 13.3 Resolver

```http
POST /disputes/{id}/resolve
{
  "outcome": "PARTIAL_REFUND",
  "refundPercent": 40
}
```

---

## 14) QA — Casos críticos

* Duplicidade (1 disputa por booking).
* Timeouts automáticos p/ cada SLA e avanço coerente de estado.
* Refund antes/depois de payout; falha na devolução PIX.
* Mensagem bloqueada (telefone/link/arroba, números espaçados).
* Evidência tipo/tamanho inválidos; expiração de URL.
* Idempotência: reenvio de `resolve`/`propose`.

---

## 15) Roadmap (curto)

* Exportar linha do tempo completa (PDF) p/ auditoria.
* Template de decisões (rationale padronizada) e cálculo exibido para o moderador.
* Integração com **Policy Engine** (regras declarativas por motivo/cidade/coorte).
