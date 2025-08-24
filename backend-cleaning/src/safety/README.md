# README — Módulo de Safety (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Safety** com base nos arquivos: `safety.module.ts`, `safety.controller.ts`, `safety.service.ts`, `report-incident.dto.ts`, `report-panic.dto.ts`, `update-incident.dto.ts`, `incident.entity.ts`, `panic-alert.entity.ts`.
>
> **Objetivo:** prover **camada de segurança** do marketplace: botão de **pânico** (tempo‑crítico), **relato de incidentes** (com auditoria e SLA), gestão de **evidências** e **integração com Suporte/Notificações/Filas** para resposta confiável.

---

## 1) Responsabilidades

* Receber e registrar **Panic Alerts** em tempo real, com **SLA de ACK** curto e escalonamento automático.
* Criar e gerir **Incidents** (com categorias, severidades, status, anexos, timeline de ações e SLA).
* Integrar com **Support** (tickets), **Notifications** (push/in‑app), **Queues** (jobs de SLA/expiração) e **Document Processing** (anexos/evidências).
* Expor APIs para **consulta, atualização e resolução** com trilhas de auditoria compatíveis com **LGPD**.

---

## 2) Arquitetura

* **Module**: `SafetyModule` — registra controller/service e injeta dependências (ORM repo, QueuesService, NotificationsService, SupportService, DocumentProcessingService, ConfigService, Sentry/Logger).
* **Controller**: `SafetyController` — endpoints para **pânico** e **incidentes** (público autenticado + admin/suporte).
* **Service**: `SafetyService` — regra de negócio: criação, escalonamento, SLA timers, atualizações de status e emissão de eventos.
* **Entities**: `Incident`, `PanicAlert` — persistência e auditoria.

---

## 3) Modelagem (entities — code‑real esperado)

### 3.1 `Incident`

```ts
export type IncidentStatus = 'OPEN'|'IN_REVIEW'|'AWAITING_USER'|'ESCALATED'|'RESOLVED'|'CLOSED'|'CANCELLED';
export type IncidentSeverity = 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export type IncidentCategory = 'SERVICE_QUALITY'|'NO_SHOW'|'PROPERTY_DAMAGE'|'PAYMENT'|'HARASSMENT'|'SAFETY'|'OTHER';

export class Incident {
  id: string;                       // uuid
  bookingId?: string | null;        // FK opcional
  reporterUserId: string;           // quem abriu
  accusedUserId?: string | null;    // parte acusada (se aplicável)
  providerId?: string | null;       // FK rápido
  clientId?: string | null;         // FK rápido

  category: IncidentCategory;
  severity: IncidentSeverity;       // define SLA
  description: string;              // texto livre (sanitizado)
  attachments?: string[] | null;    // storageKeys (Document Processing)

  locationLat?: number | null;      // se compartilhado no relato
  locationLon?: number | null;

  status: IncidentStatus;
  assignedToUserId?: string | null; // agente de suporte
  slaPriority?: 1|2|3|4;            // mapeado a partir de severity

  openedAt: Date;                   // criação
  acknowledgedAt?: Date | null;     // quando time abriu
  escalatedAt?: Date | null;        // escalado p/ nível 2
  resolvedAt?: Date | null;
  closedAt?: Date | null;

  timeline: Array<{ at: Date; by?: string; action: string; meta?: any }>; // auditoria

  createdAt: Date; updatedAt: Date; deletedAt?: Date | null;
}
```

### 3.2 `PanicAlert`

```ts
export type PanicStatus = 'RECEIVED'|'ACKED'|'DISPATCHED'|'CLOSED';

export class PanicAlert {
  id: string;                       // uuid
  bookingId?: string | null;        // se houver
  userId: string;                   // quem acionou
  role: 'CLIENT'|'PROVIDER';

  message?: string | null;          // texto curto opcional (ex.: "emergência")
  locationLat?: number | null;      // última localização conhecida
  locationLon?: number | null;

  status: PanicStatus;
  ackByUserId?: string | null;      // agente que deu ACK
  ackAt?: Date | null;              // horário do ACK
  dispatchedAt?: Date | null;       // encaminhamento/escalação
  closedAt?: Date | null;

  createdAt: Date; updatedAt: Date;
}
```

**Índices recomendados**: `Incident(status,severity,openedAt desc)`, `PanicAlert(status,createdAt desc)`, `bookingId`, `reporterUserId`.

---

## 4) DTOs (code‑real)

### 4.1 `ReportPanicDto`

```ts
export class ReportPanicDto {
  @IsOptional() @IsString() bookingId?: string;
  @IsString() role: 'CLIENT'|'PROVIDER';
  @IsOptional() @IsString() message?: string;
  @IsOptional() @IsNumber() locationLat?: number;
  @IsOptional() @IsNumber() locationLon?: number;
}
```

### 4.2 `ReportIncidentDto`

```ts
export class ReportIncidentDto {
  @IsOptional() @IsString() bookingId?: string;
  @IsString() category: IncidentCategory;
  @IsString() severity: IncidentSeverity;
  @IsString() description: string;
  @IsOptional() @IsArray() @IsString({each:true}) attachments?: string[]; // storageKeys
  @IsOptional() @IsNumber() locationLat?: number;
  @IsOptional() @IsNumber() locationLon?: number;
  @IsOptional() @IsString() accusedUserId?: string;
}
```

### 4.3 `UpdateIncidentDto`

```ts
export class UpdateIncidentDto {
  @IsOptional() status?: IncidentStatus;          // transitions válidas
  @IsOptional() assignedToUserId?: string;        // reassign
  @IsOptional() severity?: IncidentSeverity;      // reclassify
  @IsOptional() @IsString() internalNote?: string;// adiciona timeline
}
```

---

## 5) Rotas (SafetyController)

| Método | Rota                            | Scope              | Descrição                                                        |
| -----: | ------------------------------- | ------------------ | ---------------------------------------------------------------- |
|   POST | `/safety/panic`                 | AUTH (user)        | Dispara **PanicAlert**. Retorna objeto e inicia SLA de ACK.      |
|    GET | `/safety/panic/:id`             | AUTH (user/admin)  | Detalhe do panic.                                                |
|   POST | `/safety/incidents`             | AUTH (user)        | Abre **Incident** (ReportIncidentDto).                           |
|    GET | `/safety/incidents/:id`         | AUTH (owner/admin) | Detalhe do incidente com timeline.                               |
|    GET | `/safety/incidents`             | ADMIN/SUPPORT      | Lista/pesquisa por `status,severity,bookingId,userId,dateRange`. |
|  PATCH | `/safety/incidents/:id`         | ADMIN/SUPPORT      | Atualiza status/severity/assignee; adiciona notas.               |
|   POST | `/safety/incidents/:id/resolve` | ADMIN/SUPPORT      | Marca como **RESOLVED** com nota.                                |
|   POST | `/safety/incidents/:id/close`   | ADMIN/SUPPORT      | Fecha **CLOSED** (após resolução/validação).                     |
|   POST | `/safety/incidents/:id/attach`  | AUTH (owner)       | Anexa evidências (storageKeys de Document Processing).           |

**Erros**: `VALIDATION_ERROR`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_TRANSITION`, `SLA_BREACH` (quando aplicável).

---

## 6) Service (assinaturas & regras)

```ts
class SafetyService {
  reportPanic(userId: string, dto: ReportPanicDto): Promise<PanicAlert>;
  getPanic(panicId: string, requesterId: string): Promise<PanicAlert>;

  reportIncident(userId: string, dto: ReportIncidentDto): Promise<Incident>;
  getIncident(id: string, requesterId: string): Promise<Incident>;
  listIncidents(q: ListQuery): Promise<{ items: Incident[]; total: number }>;
  updateIncident(id: string, dto: UpdateIncidentDto, agentId: string): Promise<Incident>;
  resolveIncident(id: string, note: string, agentId: string): Promise<Incident>;
  closeIncident(id: string, note: string, agentId: string): Promise<Incident>;
  attachEvidence(id: string, storageKeys: string[], requesterId: string): Promise<Incident>;
}
```

### 6.1 Panic — SLA e escalonamento

* **SLA de ACK** (default): `PANIC_ACK_MAX_MIN=5` minutos.
* `reportPanic` cria **PanicAlert** (`status='RECEIVED'`) e enfileira **timer de ACK**. Notifica **Support** (priority=1) e **equipes** designadas.
* `ACK`: ao operador abrir no painel ou chamar `ackPanic(panicId)`, muda para `ACKED` e registra `ackAt/ackByUserId`.
* Se **timeout**, transita para `DISPATCHED` e dispara **escalation** (ex.: supervisor N2) + push ao usuário informando que o caso está em atendimento.
* `CLOSE`: após atendimento (ex.: chamada ao usuário/provedor), marcar como `CLOSED` com nota.

### 6.2 Incident — estados válidos

```
OPEN → IN_REVIEW → (AWAITING_USER ↔ IN_REVIEW) → RESOLVED → CLOSED
OPEN → ESCALATED → IN_REVIEW/RESOLVED → CLOSED
```

* `severity` mapeia `slaPriority` e **prazos** (ex.: CRITICAL ≤4h, HIGH ≤8h, MEDIUM ≤24h, LOW ≤48h).
* Cada transição adiciona **timeline entry**; mudanças de `severity/assignee` também.
* `attachEvidence` valida ownership e existência dos arquivos (Document Processing) e registra na timeline.

### 6.3 Integrações

* **Support**: opcionalmente abrir/ligar a um **ticket**; sincronizar estados.
* **Notifications**: push/in‑app para eventos: panic recebido/acked/dispatch, incident updated/resolved/closed.
* **Queues (BullMQ)**: timers de SLA, reintentos e DLQ. Jobs chaveados por `incident:{id}:ack` / `panic:{id}:ack` / `incident:{id}:sla:resolution`.
* **Bookings**: quando há `bookingId`, anexar snapshot do booking à timeline para contexto.

---

## 7) Segurança, LGPD & Auditoria

* Sanitizar `description` e **remover PII** desnecessária de payloads de notificação.
* Restringir acesso a **owner** do incidente/pânico, agentes de **Support** e **Admin**; logs de acesso (`who, when, ip`).
* **Retention policy**: expurgo/anonimização após `SAFETY_RETENTION_DAYS` (ex.: 365–730), configurável por severidade.
* **CORS/CSRF**: padrões do backend aplicáveis aos endpoints.

---

## 8) Config (ENV)

```env
PANIC_ACK_MAX_MIN=5
INCIDENT_SLA_CRITICAL_H=4
INCIDENT_SLA_HIGH_H=8
INCIDENT_SLA_MEDIUM_H=24
INCIDENT_SLA_LOW_H=48
SAFETY_RETENTION_DAYS=730
SAFETY_NOTIFICATIONS_ENABLED=true
```

---

## 9) Exemplos (HTTP)

### 9.1 Disparar pânico

```http
POST /safety/panic
Authorization: Bearer <token>
{
  "bookingId": "b_123",
  "role": "CLIENT",
  "message": "Emergência — sinto-me inseguro",
  "locationLat": -22.90,
  "locationLon": -47.06
}
```

**201** → retorna `PanicAlert` (`status='RECEIVED'`).

### 9.2 Reportar incidente

```http
POST /safety/incidents
{
  "bookingId": "b_123",
  "category": "PROPERTY_DAMAGE",
  "severity": "HIGH",
  "description": "Vidro da janela trincado",
  "attachments": ["uploads/2025/08/24/foto1.jpg"]
}
```

**201** → retorna `Incident` (`status='OPEN'`).

### 9.3 Atualizar incidente (suporte)

```http
PATCH /safety/incidents/inc_01
{
  "status": "IN_REVIEW",
  "assignedToUserId": "agent_007",
  "internalNote": "Contato realizado com as partes; aguardando orçamento do reparo."
}
```

---

## 10) Telemetria & KPIs

* Eventos: `panic_received`, `panic_acked`, `panic_dispatched`, `panic_closed`, `incident_opened`, `incident_updated`, `incident_resolved`, `incident_closed`.
* KPIs: **ACK time** (panic p95), **tempo até resolução** por severidade, **% dentro de SLA**, incidentes por categoria, taxa de **recorrência** por usuário/área.

---

## 11) QA — Casos críticos

* Pânico sem ACK dentro do SLA → validar **escalation job** e notificação ao usuário.
* Incidente sem timeline em transição → **bloquear** atualização.
* Anexo inexistente/sem owner → rejeitar em `attachEvidence`.
* Status inválido (pulo direto para `RESOLVED` sem `IN_REVIEW`) → `INVALID_TRANSITION`.
* Conflitos de concorrência (dois agentes alterando) → usar **versionamento/locks** otimistas.

---

## 12) Melhorias avançadas (quando necessário)

1. **Geofencing** e proximidade de equipe/plantonista.
2. **Templates** de resolução por categoria, com checklists e FAQ específicos.
3. **Detecção automática** de conteúdo sensível no chat (PII/contato direto), gerando **Incident** com severidade `MEDIUM` e aviso educativo.
4. **Auto‑enriquecimento** de incidentes com dados do booking e perfis (histórico, avaliações, cancelamentos recentes).
5. **Auto‑triagem** com ML para sugerir `severity` e prazo.

---

## 13) Conclusão

O **Safety** garante resposta **rápida e auditável** a emergências e incidentes, protegendo clientes e provedores e reduzindo risco do marketplace. Com SLA, escalonamento via filas e integrações com Suporte/Notificações/Documentos, o módulo está pronto para produção e para evoluir com automações de triagem e políticas de retenção compatíveis com **LGPD**.
