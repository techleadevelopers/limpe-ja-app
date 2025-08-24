# README — Módulo de Notifications (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Notifications** com base nos arquivos: `notifications.module.ts`, `notifications.controller.ts`, `notifications.service.ts`, `notification.entity.ts`, `create-notification.dto.ts`, `update-notification.dto.ts`, `mark-as-read.dto.ts`.
>
> **Objetivo:** entregar **push** e **in‑app notifications** confiáveis para eventos de produto (cupons, missões, bookings, pagamentos, disputas), com **rate‑limit**, **idempotência**, **deeplinks** e **marcação de leitura**, integrando **Queues** e **WebSocket**.

---

## 1) Responsabilidades

* Persistir e servir **in‑app notification center** (lista, unread count, marcar como lida).
* Orquestrar **envio de push** (FCM/Expo) via **Queues** com retries/backoff.
* Padronizar **payloads** (title/body/data/deeplink/priority) e **kinds** de notificação.
* Aplicar **rate‑limits** por usuário e **idempotência** por evento.
* Expor **preferências** básicas (opt‑in marketing) e honrar horários de silêncio (silence window) quando houver.

---

## 2) Arquitetura

* **Module**: `NotificationsModule` — registra controller/service, injeta repos/ORM e integra **QueuesService**.
* **Controller**: `NotificationsController` — rotas REST para listar/notificar/acknowledge.
* **Service**: `NotificationsService` — regra de negócio: criação, enqueue de push, marcação de leitura, rate‑limit, idempotência.
* **Entity**: `Notification` — persistência de notificações in‑app e metadados de envio.
* **Workers**: consumo do envio em `notification.worker.ts` (do módulo de Filas).
* **Realtime (opcional)**: emissão via **WebSocket** para atualização imediata do center.

**Dependências:** `QueuesService`, `ConfigService`, `Cache/Redis`, `Users/DevicesService` (tokens push), `Sentry` (telemetria).

---

## 3) Modelagem (entity — code‑real esperado)

```ts
export type NotificationChannel = 'IN_APP'|'PUSH';
export type NotificationStatus = 'PENDING'|'SENT'|'DELIVERED'|'FAILED'|'READ'|'DISMISSED';
export type NotificationKind =
  | 'coupon_issued' | 'coupon_expiring' | 'mission_ready' | 'referral_converted'
  | 'booking_confirmed' | 'booking_reminder' | 'booking_completed' | 'booking_cancelled'
  | 'payment_pix_created' | 'withdrawal_paid' | 'withdrawal_failed'
  | 'dispute_opened' | 'dispute_escalated' | 'support_reply'
  | 'system';

export class Notification {
  id: string;                  // uuid
  userId: string;              // destinatário
  channel: NotificationChannel; // IN_APP ou PUSH (ou ambos, via registros separados)
  kind: NotificationKind;
  title: string;               // título exibido
  body: string;                // texto curto (<= 180 chars recomendado)
  data?: Record<string, any>;  // metadados (ids, params)
  deeplink?: string;           // ex.: '/(client)/bookings/123'
  priority?: 1|2|3;            // 1 alta, 3 baixa
  isRead: boolean;             // atalho p/ status READ
  readAt?: Date | null;
  scheduledAt?: Date | null;   // envio agendado (opcional)
  sentAt?: Date | null;        // quando push foi enviado
  status: NotificationStatus;  // PENDING/SENT/...
  idempotencyKey?: string | null; // identificação única por evento
  createdAt: Date; updatedAt: Date; deletedAt?: Date | null;
}
```

**Índices:** `(userId, isRead, createdAt desc)`, `idempotencyKey (unique)`, `scheduledAt` (para pickers), `status`.

---

## 4) DTOs (code‑real)

### 4.1 `CreateNotificationDto`

```ts
export class CreateNotificationDto {
  @IsUUID() userId: string;
  @IsEnum(['IN_APP','PUSH']) channel: NotificationChannel;
  @IsString() kind: NotificationKind;
  @IsString() title: string;
  @IsString() body: string;
  @IsOptional() data?: Record<string, any>;
  @IsOptional() deeplink?: string;
  @IsOptional() @IsIn([1,2,3]) priority?: 1|2|3;
  @IsOptional() @IsISO8601() scheduledAt?: string;
  @IsOptional() @IsString() idempotencyKey?: string; // evita duplicação
}
```

### 4.2 `UpdateNotificationDto`

```ts
export class UpdateNotificationDto {
  @IsOptional() title?: string;
  @IsOptional() body?: string;
  @IsOptional() data?: Record<string, any>;
  @IsOptional() deeplink?: string;
  @IsOptional() priority?: 1|2|3;
  @IsOptional() channel?: NotificationChannel;
}
```

### 4.3 `MarkAsReadDto`

```ts
export class MarkAsReadDto {
  @IsUUID() id: string;         // notificationId
}
```

---

## 5) Rotas (NotificationsController)

| Método | Rota                          | Scope        | Descrição                                                                         |
| -----: | ----------------------------- | ------------ | --------------------------------------------------------------------------------- |
|    GET | `/notifications`              | AUTH (user)  | Lista do usuário autenticado. Filtros: `limit/offset`, `since`, `isRead`, `kind`. |
|    GET | `/notifications/unread/count` | AUTH (user)  | Contagem de não lidas (badge).                                                    |
|   POST | `/notifications`              | ADMIN/SYSTEM | Cria notificação (IN\_APP/PUSH) e enfileira push quando aplicável.                |
|  PATCH | `/notifications/:id`          | ADMIN        | Atualiza campos editáveis.                                                        |
|   POST | `/notifications/:id/read`     | AUTH (user)  | Marca como lida (`READ`).                                                         |
|   POST | `/notifications/read-all`     | AUTH (user)  | Marca todas como lidas (até `since`, opcional).                                   |
| DELETE | `/notifications/:id`          | ADMIN        | Soft‑delete.                                                                      |

**Erros comuns**: `VALIDATION_ERROR`, `FORBIDDEN`, `NOT_FOUND`, `IDEMPOTENCY_CONFLICT`.

---

## 6) Service (assinaturas & regras)

```ts
class NotificationsService {
  list(userId: string, q: ListQuery): Promise<{ items: Notification[]; total: number }>;
  unreadCount(userId: string): Promise<{ count: number }>;
  create(dto: CreateNotificationDto, requestedBy?: string): Promise<Notification>;
  update(id: string, dto: UpdateNotificationDto): Promise<Notification>;
  markAsRead(userId: string, id: string): Promise<void>;
  markAllAsRead(userId: string, since?: string): Promise<number>; // retorna qtde
}
```

**Regras de negócio**

* **Idempotência**: se `idempotencyKey` presente, garantir unicidade por usuário; retornar existente.
* **Rate‑limit push**: máx. **3 push/dia** por usuário, com prioridade: (1) safety/financeiro, (2) produto, (3) marketing.
* **Deeplinks**: usar rotas do app (ex.: `/(client)/schedule-service`), sempre junto a `data` (ex.: `{couponId}`).
* **Preferências**: honrar `marketingOptIn=false` (do módulo Clients) para Kinds de marketing.
* **Badge** e **WebSocket**: ao criar/ler, publicar evento WS para atualizar contadores no app.

---

## 7) Integração com Filas (notification.worker)

* Criação com `channel='PUSH'` → `QueuesService.enqueuePush(...)` com `jobId` determinístico (ex.: `coupon:${couponId}:T-72h`).
* Worker tenta envio via **FCM/Expo**; em sucesso, atualiza `status='SENT'`/`DELIVERED'` e `sentAt`.
* Em falha temporária, retries com **backoff exponencial**; após esgotar, `status='FAILED'`.

**Envelope do Job (padrão):**

```ts
{
  idempotencyKey?: string,
  createdAt: string,
  payload: {
    userId: string,
    kind: NotificationKind,
    title: string,
    body: string,
    data?: any,
    deeplink?: string,
    priority?: 1|2|3
  }
}
```

---

## 8) Canais e Dispositivos

* **IN\_APP**: lido via `/notifications` e **WebSocket** → renderização no center com **CTA** (deeplink).
* **PUSH**: requer **device tokens** associados ao `userId` (múltiplos dispositivos). Tokens inválidos são limpos pelo worker.

> **Boas práticas**: título conciso (≤50), corpo curto (≤120), CTA claro, evitar PII no corpo.

---

## 9) Segurança & LGPD

* Payload não deve conter **PII sensível**; IDs e deeplinks bastam.
* Cookies/tokens não trafegam em push.
* Auditoria de criação/leitura: `who/when/IP`.

---

## 10) Config (ENV)

```env
NOTIFICATIONS_PUSH_PROVIDER=expo          # ou 'fcm'
NOTIFICATIONS_DAILY_PUSH_CAP=3
NOTIFICATIONS_DEFAULT_PRIORITY=2
NOTIFICATIONS_WS_ENABLED=true
NOTIFICATIONS_UNREAD_CACHE_TTL=30        # segundos
```

---

## 11) Exemplos (HTTP)

### 11.1 Listar notificações

```http
GET /notifications?limit=20&offset=0
Authorization: Bearer <token>
```

**200**

```json
{ "items": [
  {"id":"n1","kind":"coupon_expiring","title":"Seu cupom expira em 24h","body":"Use VOLTE7 e garanta 20% OFF","deeplink":"/(client)/schedule-service","isRead":false,"createdAt":"2025-08-23T10:00:00-03:00"}
], "total": 1 }
```

### 11.2 Criar (admin/sistema)

```http
POST /notifications
{
  "userId": "u_01",
  "channel": "PUSH",
  "kind": "booking_confirmed",
  "title": "Reserva confirmada",
  "body": "Terça, 10h — clique para ver detalhes",
  "deeplink": "/(client)/bookings/b_01",
  "idempotencyKey": "evt_booking_confirmed_b_01"
}
```

### 11.3 Marcar como lida

```http
POST /notifications/n1/read
```

### 11.4 Marcar todas

```http
POST /notifications/read-all
{
  "since": "2025-08-01T00:00:00Z"
}
```

---

## 12) Telemetria & KPIs

* Eventos: `notification_created`, `notification_enqueued`, `notification_sent`, `notification_failed`, `notification_read`, `notification_dismissed`, `notification_opened` (com deeplink).
* KPIs: taxa de **entrega** (sent/delivered), **open‑rate** (opened/sent), tempo de envio (enqueue→sent), **unread backlog** médio por usuário.

---

## 13) QA — Casos críticos

* Token push inválido → limpar e registrar; não re‑tentar indefinidamente.
* `idempotencyKey` repetido → retornar existente (não criar duplicado).
* Rate‑limit diário estourado → **downgrade** para IN\_APP ou **adiar** (scheduledAt D+1).
* WebSocket desconectado → app ainda vê via polling (`/unread/count`).

---

## 14) Melhorias avançadas (quando necessário)

1. **Preferências granulares** (tipos de notificação por usuário + quiet hours).
2. **Digest** diário/semana para marketing (um push consolidado) para reduzir ruído.
3. **A/B** de copy/título e **send‑time optimization** por coorte/local.
4. **Inbox categories** (Financeiro, Reservas, Benefícios) com filtros no center.
5. **Tracing de deeplink** (atribuição de conversão: agendamento em 24h pós push).
6. **Localização** multi‑idioma do texto (i18n) com placeholders/templating.

---

## 15) Conclusão

O módulo **Notifications** provê uma base robusta para comunicações **acionáveis** do LimpeJá, garantindo entrega confiável (via Filas), experiência consistente no **in‑app center** e governança (rate‑limit, idempotência, auditoria). Ele sustenta as alavancas de **retenção** (cupons/missões) e **qualidade de serviço** (SLA de disputas, lembretes de booking) com custo sob controle.
