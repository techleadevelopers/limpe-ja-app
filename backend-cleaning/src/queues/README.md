# README — Módulo de Filas (Queues)

> **Escopo:** documentação **code‑real** do módulo de filas do backend LimpeJá com base nos arquivos presentes: `queues.module.ts`, `queues.service.ts`, `notification.worker.ts`, `verification.worker.ts`, `dispute.worker.ts`.
>
> **Objetivo:** operar **BullMQ + Redis** para tarefas assíncronas e agendadas (notificações, KYC/verificação, SLAs de disputas), com **idempotência**, **DLQ**, **observabilidade** e **plano de evolução** até 100% produção com o **melhor custo‑benefício** (sem over‑engineering).

---

## 1) Arquitetura

**Tecnologias:** BullMQ, ioredis, NestJS providers, Sentry/Logs, ConfigService.

**Papeis:**

* **QueuesService** (produtor): enfileira jobs transacionais e agendados.
* **Workers** (consumidores): `notification.worker.ts`, `verification.worker.ts`, `dispute.worker.ts`.
* **Redis**: armazenamento de filas, locks e agendamentos (repeatable jobs).

**Filas (nomes canônicos):**

* `notification.queue` — push/in‑app, lembretes (cupom expira, missão pronta para claim).
* `verification.queue` — KYC: OCR, selfie liveness/match, antecedentes; consolidação de decisão.
* `dispute.queue` — timers de SLA, escalonamentos, follow‑ups automáticos.

> *Obs.* Se houver WebSockets/notificações em tempo real, **não** usar filas para mensagens síncronas; as filas tratam envios/retries/cron e trabalhos pesados.

---

## 2) Módulos & Arquivos

```
src/queues/
 ├─ queues.module.ts         # registra providers/consumidores
 ├─ queues.service.ts        # API única p/ enfileirar jobs
 ├─ workers/
 │   ├─ notification.worker.ts
 │   ├─ verification.worker.ts
 │   └─ dispute.worker.ts
 └─ types.ts (opcional)      # envelopes/DTOs de job
```

**`queues.module.ts`**

* Injeta **Redis connection** (via `ConfigService` → `REDIS_URL`).
* Registra filas BullMQ com opções padrão (attempts, backoff, removeOnComplete/Fail, prefix por ambiente).
* Faz bind dos **workers** com suas **concurrencies** e handlers.

**`queues.service.ts`**

* Fachada para producers (outros módulos chamam **apenas** aqui). Exemplos de métodos públicos:

  * `enqueuePush(toUserId, payload, opts?)`
  * `scheduleCouponExpiryReminder(userId, couponId, when)`
  * `enqueueKycStep(providerId, step, payload)`
  * `scheduleDisputeSla(disputeId, at, priority)`
  * `enqueueMissionDigest(userId, kind)` *(se necessário)*
* **Idempotência:** todos métodos aceitam `idempotencyKey`/`jobId` estável (ex.: `dispute:${id}:t+24h`) para evitar duplicação.

**Workers**

* **`notification.worker.ts`**: envia push/in‑app; trata retries, fallback (enfileirar novamente) e marca como **readOnly**/audit.
* **`verification.worker.ts`**: executa pipeline KYC (OCR → selfie → antecedentes), agrega estados parciais e publica **decisão** (APPROVED/REJECTED/NEEDS\_REVIEW).
* **`dispute.worker.ts`**: dispara timers de SLA, escalona, notifica partes e abre tarefa para suporte conforme política.

---

## 3) Configuração (ENV)

```env
REDIS_URL=redis://localhost:6379
QUEUES_PREFIX=limpeja:${NODE_ENV}
QUEUES_DEFAULT_ATTEMPTS=5
QUEUES_DEFAULT_BACKOFF_MS=15000      # exponencial: 15s, 30s, 60s...
QUEUES_REMOVE_ON_COMPLETE=true
QUEUES_REMOVE_ON_FAIL=false

# Concurrency (ajustável por worker)
Q_NOTIF_CONCURRENCY=8
Q_VERIF_CONCURRENCY=3
Q_DISPUTE_CONCURRENCY=2

# SLAs
DISPUTE_SLA_URGENT_HOURS=4
DISPUTE_SLA_HIGH_HOURS=8
DISPUTE_SLA_MEDIUM_HOURS=24
DISPUTE_SLA_LOW_HOURS=48

# KYC / Provedores externos
KYC_OCR_PROVIDER=...      # chave/endpoint
KYC_FACE_PROVIDER=...
KYC_BG_CHECK_PROVIDER=...
```

---

## 4) Envelope de Job (padrão)

Todos os jobs seguem um **envelope** comum para rastreabilidade e idempotência:

```ts
export type JobEnvelope<T = any> = {
  idempotencyKey?: string;   // define jobId estável no add()
  requestedBy?: string;      // sistema/módulo/usuário
  createdAt: string;         // ISO
  payload: T;                // dados do trabalho
  meta?: Record<string, any>;// contexto (cidade, campanha, etc.)
};
```

**Políticas default** (`add()`): `attempts=5`, `backoff=exponential`, `timeout=25_000ms`, `removeOnComplete=true`, `removeOnFail=false`.

**DLQ**: jobs com falha final vão para `*.dlq` (ver §8.2) com **replay** manual/automatizado.

---

## 5) Notificações — `notification.worker.ts`

**Tipos de job (exemplos):**

* `push.coupon_issued`  → título/cta, deep‑link p/ `bookings/schedule`.
* `push.coupon_expiring`→ lembretes T‑72h/T‑24h.
* `push.mission_ready`  → missão pronta p/ claim.
* `push.referral_converted` → “S
