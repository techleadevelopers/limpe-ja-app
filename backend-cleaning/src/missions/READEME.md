# README — Módulo de Missões (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo de **Missões**, com base nos arquivos presentes: `missions.module.ts`, `missions.controller.ts`, `missions.service.ts`, `progress.service.ts`, `claim-mission.dto.ts`, `upsert-mission.dto.ts`. Este README detalha responsabilidades, rotas, DTOs, serviços, estados/progressos, integrações (Coupons/Loyalty/Bookings/Reviews/Chat), jobs/SLAs e telemetria.

---

## 1) Responsabilidades

* Definir, versionar e disponibilizar **missões** para **clientes** e **provedores** (audiences).
* Calcular **progresso** (COUNT\_EVENT, STREAK\_DAYS, WITHIN\_WINDOW), avaliar elegibilidade e **entregar recompensas** (cupom ou pontos) no **claim**.
* Manter **linha do tempo** de eventos e **idempotência** no resgate.
* Integrar com **CouponsService** (emissão de cupom) e **LoyaltyService** (pontos/tiers), consumindo eventos de **Bookings**, **Reviews** e **Chat**.

---

## 2) Estrutura de pastas

```
backend/src/missions/
 ├─ missions.module.ts
 ├─ missions.controller.ts
 ├─ missions.service.ts
 ├─ progress.service.ts
 ├─ dto/
 │   ├─ claim-mission.dto.ts
 │   └─ upsert-mission.dto.ts
 └─ entities/
     ├─ mission.entity.ts
     ├─ mission-progress.entity.ts
     └─ mission-event.entity.ts
```

**Dependências principais:** CouponsModule, LoyaltyModule, BookingsModule, ReviewsModule, ChatModule, NotificationsModule, Cache/Redis (locks), BullMQ (jobs), ConfigService (flags/limites), Sentry (telemetria).

---

## 3) Modelagem (entidades)

### 3.1 Mission

```ts
export enum MissionAudience { CLIENT = 'CLIENT', PROVIDER = 'PROVIDER' }
export enum MissionKind { COUNT_EVENT = 'COUNT_EVENT', STREAK_DAYS = 'STREAK_DAYS', WITHIN_WINDOW = 'WITHIN_WINDOW' }
export enum RewardType { COUPON = 'COUPON', POINTS = 'POINTS' }
export enum MissionStatus { ACTIVE = 'ACTIVE', INACTIVE = 'INACTIVE' }

export class Mission {
  id: string;                    // uuid
  title: string;
  description?: string;
  audience: MissionAudience;     // CLIENT|PROVIDER
  kind: MissionKind;             // COUNT_EVENT|STREAK_DAYS|WITHIN_WINDOW
  goal: number;                  // meta numérica (contagem, dias de streak, etc.)
  windowDays?: number | null;    // janela para WITHIN_WINDOW / STREAK
  rewardType: RewardType;        // COUPON|POINTS
  rewardValue: number;           // R$ (cupom) ou pontos
  activeFrom?: Date | null;
  activeTo?: Date | null;
  status: MissionStatus;         // ACTIVE|INACTIVE
  createdAt: Date; updatedAt: Date;
}
```

### 3.2 MissionProgress

```ts
export enum ProgressState { IN_PROGRESS='IN_PROGRESS', COMPLETED='COMPLETED', CLAIMED='CLAIMED', EXPIRED='EXPIRED' }

export class MissionProgress {
  id: string; missionId: string; userId: string;
  current: number;               // progresso atual (0..goal)
  lastEventAt?: Date | null;     // última atualização
  state: ProgressState;          // IN_PROGRESS|COMPLETED|CLAIMED|EXPIRED
  startedAt: Date; updatedAt: Date;
}
```

### 3.3 MissionEvent (auditoria/opcional)

```ts
export class MissionEvent { id: string; missionId: string; userId: string; name: string; meta?: any; createdAt: Date }
```

---

## 4) DTOs (code‑real)

### 4.1 `UpsertMissionDto`

```ts
export class UpsertMissionDto {
  @IsOptional() id?: string;                       // create/update
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(MissionAudience) audience: MissionAudience;
  @IsEnum(MissionKind) kind: MissionKind;
  @IsNumber() goal: number;                        // >=1
  @IsOptional() @IsNumber() windowDays?: number;   // ex.: 7, 30, 90
  @IsEnum(RewardType) rewardType: RewardType;
  @IsNumber() rewardValue: number;                 // R$ ou pontos
  @IsOptional() @IsDateString() activeFrom?: string;
  @IsOptional() @IsDateString() activeTo?: string;
  @IsOptional() @IsEnum(MissionStatus) status?: MissionStatus; // default ACTIVE
}
```

### 4.2 `ClaimMissionDto`

```ts
export class ClaimMissionDto {
  @IsUUID() missionId: string;
  @IsOptional() @IsString() idempotencyKey?: string; // evita duplo resgate
}
```

---

## 5) Controller (rotas)

| Método | Rota                  | Scope         | Descrição                                                            |
| -----: | --------------------- | ------------- | -------------------------------------------------------------------- |
|    GET | `/missions`           | AUTH          | Lista missões **ativas** para o usuário (filtra por `audience`).     |
|    GET | `/missions/:id`       | AUTH          | Detalhes de uma missão + progresso do usuário.                       |
|   POST | `/missions/:id/claim` | AUTH          | **Claim** de recompensa se missão `COMPLETED`.                       |
|   POST | `/missions/track`     | INTERNAL/AUTH | Recebe um **evento** (ex.: `booking_completed`, `review_submitted`). |
|   POST | `/missions/upsert`    | ADMIN         | Cria/atualiza missão (UpsertMissionDto).                             |
|    GET | `/missions/progress`  | AUTH          | Lista progressos do usuário (resumo dashboard).                      |

**Erros comuns**: `MISSION_NOT_FOUND`, `MISSION_INACTIVE`, `MISSION_NOT_ELIGIBLE`, `PROGRESS_NOT_COMPLETED`, `ALREADY_CLAIMED`, `IDEMPOTENCY_CONFLICT`.

---

## 6) Services (assinaturas e efeitos)

### 6.1 `MissionsService`

```ts
getActiveForUser(userId: string, audience: MissionAudience): Promise<MissionWithProgress[]>
getById(userId: string, missionId: string): Promise<MissionWithProgress>
claim(userId: string, dto: ClaimMissionDto): Promise<ClaimResult>
trackEvent(userId: string, eventName: string, meta?: Record<string,any>): Promise<void>
upsertMission(adminId: string, dto: UpsertMissionDto): Promise<Mission>
```

**Efeitos**

* `getActiveForUser`: aplica janelas (`activeFrom/To`) e status; une com progresso atual do usuário.
* `claim`: checa `ProgressState=COMPLETED`, aplica **lock Redis** `(missionId,userId)` + `idempotencyKey`, entrega recompensa (cupom ou pontos) e marca `CLAIMED`.
* `trackEvent`: normaliza evento, delega cálculo ao **ProgressService**, atualiza/insere `MissionProgress` e emitir telemetria.
* `upsertMission`: cria/atualiza missão e reindexa critérios (quando necessário).

### 6.2 `ProgressService`

```ts
updateProgressOnEvent(userId: string, eventName: string, when: Date, meta?: any): Promise<void>
recompute(userId: string, missionId: string): Promise<MissionProgress>
```

**Lógica de progresso**

* **COUNT\_EVENT**: `current = min(goal, current + 1)` quando o evento mapeado ocorre.
* **STREAK\_DAYS**: considerar **janela semanal** (ou diária, conforme `windowDays`): incrementa streak se ao menos 1 evento no período; reseta se falhar; `current = weeks_consec`.
* **WITHIN\_WINDOW**: marca completo se o evento ocorrer dentro de `windowDays` após o gatilho inicial (ex.: `review_submitted` ≤48h após `booking_completed`).

---

## 7) Mapeamento de eventos (origens)

* **Bookings**: `booking_completed`, `first_booking_completed` (ativação/retorno), `booking_accepted` (provedor).
* **Reviews**: `review_submitted` (cliente avaliou serviço ≤48h).
* **Chat**: `chat_response_time_met` (provedor cumpriu SLA de resposta média X min na janela).
* **Quality**: `rating_maintained` (média ≥ *threshold* por 30 dias).

> Eventos chegam por chamada direta do módulo de origem ou via bus/queue interno. Todos recebem **Idempotency-Key**.

---

## 8) Recompensas (claim)

* **RewardType.COUPON**: `CouponsService.issueCouponFromMission(missionId, userId, { value: rewardValue })`.
* **RewardType.POINTS**: `LoyaltyService.addPoints(userId, rewardValue, 'MISSION_COMPLETED')`.
* Notificação: `NotificationsService.push(userId, 'MISSION_CLAIMED', payload)`.

**Regras**

* 1 claim por missão/usuário (`unique (missionId,userId)`); travar com lock Redis e `idempotencyKey`.
* Se missão **expirada** (`activeTo < now()`), recusar claim.

---

## 9) Configuração & Flags

```env
MISSIONS_ENABLED=true
MISSIONS_DEFAULT_WINDOW_DAYS=30
MISSIONS_STREAK_MAX_BONUS_WEEKS=6
MISSIONS_WITHIN_WINDOW_HOURS=48  # para review_submitted após booking
MISSION_CLAIM_LOCK_TTL_MS=8000    # lock Redis
```

---

## 10) Telemetria & KPIs

**Eventos**: `mission_started`, `mission_progress_updated`, `mission_completed`, `mission_claimed`, `mission_claim_idempotent`, `mission_claim_failed`.

**KPIs**: taxa de **claim**, tempo médio até claim, impacto de missões na **2ª compra em 7 dias**, \`% missões concluídas\*\* por coorte, conversão de **recompensa em uso real** (cupons resgatados/pontos convertidos), e contribuição para **LTV**.

---

## 11) Notificações & Jobs

* **Push/in‑app**: missão iniciada, progresso, pronta para claim, expiração próxima.
* **BullMQ**: job de expiração **fecha** missões fora de janela (marca `EXPIRED` em progressos não‑claimados); jobs de **digest** de progresso semanal.

---

## 12) Segurança & Compliance

* **RBAC**: usuários só podem ver/claim missões do seu `audience`.
* **Anti‑fraude**: validar que eventos de origem são legítimos (ex.: `booking_completed` só de bookings do usuário).
* **LGPD**: metadados mínimos; nenhum dado sensível além do necessário para auditoria.

---

## 13) Exemplos (HTTP)

### 13.1 Listar minhas missões

```http
GET /missions
Authorization: Bearer <token>
```

**200**

```json
[
  {"id":"m1","title":"3 reservas no mês","audience":"CLIENT","kind":"COUNT_EVENT","goal":3,"current":1,"state":"IN_PROGRESS","rewardType":"COUPON","rewardValue":30},
  {"id":"m2","title":"Avalie em 48h","audience":"CLIENT","kind":"WITHIN_WINDOW","goal":1,"current":1,"state":"COMPLETED","rewardType":"POINTS","rewardValue":100}
]
```

### 13.2 Claim

```http
POST /missions/:id/claim
Idempotency-Key: 79b0-...
{}
```

**200**

```json
{"status":"CLAIMED","reward":{"type":"COUPON","value":30,"couponId":"c_123"}}
```

### 13.3 Track event

```http
POST /missions/track
{
  "eventName": "review_submitted",
  "when": "2025-08-24T15:00:00Z",
  "meta": {"bookingId":"b_1"}
}
```

---

## 14) QA — casos críticos

* Claim duplo (mesmo `missionId,userId`) → idempotente.
* Expiração de missão (jobs) antes do claim.
* Eventos tardios (fora da janela) não devem alterar progresso.
* Eventos duplicados (replay) não devem somar progresso.
* STREAK: falha de semana deve **resetar** corretamente.
* WITHIN\_WINDOW: validar vínculo com o evento gatilho (ex.: review ≤ 48h pós‑booking).

---

## 15) Roadmap (curto)

* Editor de **regras declarativas** (DSL) por cidade/segmento.
* **A/B** por coorte (valores de recompensa, metas e janelas).
* Missões compostas multi‑evento (AND/OR) e dependências entre missões.
