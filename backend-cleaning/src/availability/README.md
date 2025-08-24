# README — Módulo de Availability (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Availability** com base nos arquivos: `availability.module.ts`, `availability.controller.ts`, `availability.service.ts`, `availability.entity.ts`, `get-availability.dto.ts`, `update-availability.dto.ts`.
>
> **Objetivo:** disponibilizar **janelas de agenda** de provedores, gerar **time‑slots** válidos e garantir **consistência** com reservas (Bookings), respeitando **fuso**, **quebras (breaks)**, **exceções/feriados**, **buffers** e **capacidade**.

---

## 1) Responsabilidades

* Persistir **template semanal** de disponibilidade por provedor (dias/horas, duração de slot, breaks).
* Registrar **exceções/overrides** (folgas, feriados, dias estendidos, bloqueios parciais).
* Gerar **slots disponíveis** em um intervalo (start/end) considerando **bookings**, **holds**, **buffers** e **lead time**.
* Validar **eligibilidade** de um slot para criação de **booking** (no‑oversell).
* Integrar com **Bookings** (hold/release), **Ranking/Search** (próximo horário livre) e **Notifications** (mudanças relevantes).

---

## 2) Arquitetura

* **Module**: `AvailabilityModule` — registra controller/service, injeta repositório (ORM) e dependências (Bookings/Config/Cache/Queues).
* **Controller**: `AvailabilityController` — rotas REST para consultar slots, obter/atualizar template e gerir overrides.
* **Service**: `AvailabilityService` — regra de negócio: construção de agenda efetiva, checagens e locks idempotentes.
* **Entity**: `Availability` + entidades auxiliares (Overrides/Breaks) conforme `availability.entity.ts`.

**Dependências**: `BookingsService` (conflitos/holds), `ConfigService` (padrões), `Cache/Redis` (memoização e locks), `Sentry` (telemetria), Postgres (+ PostGIS opcional para filtros por cidade/raio).

---

## 3) Modelagem (entity – code‑real esperado)

```ts
export enum DayOfWeek { SUN=0, MON=1, TUE=2, WED=3, THU=4, FRI=5, SAT=6 }

export class Availability {               // Tabela base de template semanal
  id: string;                             // uuid
  providerId: string;                     // FK Provedor
  dayOfWeek: DayOfWeek;                   // 0..6
  startTime: string;                      // 'HH:mm' (no tz do provedor)
  endTime: string;                        // 'HH:mm'
  slotDurationMin: number;                // ex.: 60
  breaks?: Array<{ start: string; end: string }>; // intervalos internos
  capacity?: number;                      // nº de jobs simultâneos (default 1)
  timezone?: string;                      // default 'America/Sao_Paulo'
  updatedAt: Date; createdAt: Date;
}

export class AvailabilityOverride {       // Folgas/bloqueios/expansões pontuais
  id: string; providerId: string;
  date: string;                           // 'YYYY-MM-DD' no tz do provedor
  startTime?: string; endTime?: string;   // janela alterada
  kind: 'BLOCK'|'EXTEND'|'CUSTOM';        // BLOCK = sem agenda; EXTEND/CUSTOM = substitui janela padrão
  breaks?: Array<{ start: string; end: string }>;
  capacity?: number | null;               // override de capacidade
}
```

> **Índices:** `(providerId, dayOfWeek)`, `(providerId, date)`.

---

## 4) DTOs (code‑real)

### 4.1 `GetAvailabilityDto`

```ts
export class GetAvailabilityDto {
  @IsDateString() start: string;                    // ISO inclusivo
  @IsDateString() end: string;                      // ISO exclusivo
  @IsOptional() @IsString() timezone?: string = 'America/Sao_Paulo';
  @IsOptional() @IsUUID() providerId?: string;      // se admin; /me usa do token
  @IsOptional() @IsUUID() serviceId?: string;       // filtra/ajusta duração
  @IsOptional() @IsInt() durationMin?: number;      // override da duração
}
```

### 4.2 `UpdateAvailabilityDto`

```ts
export class UpdateAvailabilityDto {
  @ValidateNested({ each: true })
  template: Array<{
    dayOfWeek: DayOfWeek;
    startTime: string; endTime: string; slotDurationMin: number;
    breaks?: Array<{ start: string; end: string }>; capacity?: number;
  }>;

  @IsOptional() timezone?: string;
}
```

> Podem existir DTOs auxiliares para **overrides**: `UpsertOverrideDto { date, kind, startTime?, endTime?, breaks?, capacity? }`.

---

## 5) Rotas (AvailabilityController)

| Método | Rota                                     | Descrição                                                           |
| -----: | ---------------------------------------- | ------------------------------------------------------------------- |
|    GET | `/availability/providers/:id/slots`      | Lista **slots disponíveis** para o provedor `:id` em `start`→`end`. |
|    GET | `/availability/me/slots`                 | Slots do **provedor autenticado**.                                  |
|    GET | `/availability/me/template`              | Obtém **template semanal** do provedor autenticado.                 |
|  PATCH | `/availability/me/template`              | Atualiza template semanal (UpdateAvailabilityDto).                  |
|   POST | `/availability/me/overrides`             | Cria/atualiza **override** (folga/expansão/custom) em uma data.     |
| DELETE | `/availability/me/overrides/:overrideId` | Remove override.                                                    |

**Erros comuns**: `VALIDATION_ERROR`, `DATE_RANGE_TOO_LARGE`, `OVERRIDE_CONFLICT`, `INVALID_BREAKS`, `PAST_WINDOW`, `DURATION_NOT_SUPPORTED`.

---

## 6) Service (assinaturas & regras)

```ts
class AvailabilityService {
  getSlots(providerId: string, q: GetAvailabilityDto): Promise<Slot[]>;
  getTemplate(providerId: string): Promise<AvailabilityTemplate>;
  updateTemplate(providerId: string, dto: UpdateAvailabilityDto): Promise<void>;
  upsertOverride(providerId: string, dto: UpsertOverrideDto): Promise<Override>;
  deleteOverride(providerId: string, overrideId: string): Promise<void>;
  isSlotAvailable(providerId: string, start: string, durationMin: number): Promise<boolean>;
}
```

### 6.1 Construção de slots (pipeline)

1. **Range & fuso**: normalizar `start/end` para `timezone` do provedor; validar **half‑open** (inclui `start`, exclui `end`).
2. **Template semanal**: carregar janelas por `dayOfWeek` e quebrar em **slots** de `slotDurationMin`.
3. **Breaks**: remover segmentos `breaks`.
4. **Overrides**: aplicar por `date` na ordem: `BLOCK` > `CUSTOM` > `EXTEND`.
5. **Buffers**: aplicar `leadTimeMin` (antecedência mínima, ex.: 3h) e `prepBufferMin` (antes/depois, ex.: 15min).
6. **Capacidade**: respeitar `capacity` (simultâneos por slot) e reservas existentes.
7. **Conflitos**: excluir slots com **bookings** (REQUESTED/CONFIRMED/IN\_PROGRESS) ou **holds** ativos.
8. **Duração**: ajustar se `durationMin` do serviço difere do `slotDurationMin` (montar blocos contíguos).
9. **Cache**: memoizar resposta por `(providerId,start,end,duration,timezone)` (TTL curto, ex.: 60s).

### 6.2 Checagem de conflito

* Consultar `Bookings` por interseção de intervalos (`[start, end)`), incluir **holds** (reservas preliminares com TTL) para evitar **double‑book**.
* **Lock Redis** em `holdSlot` durante `createBooking`.

### 6.3 Regras de validação

* `startTime < endTime`; `breaks` dentro da janela e **não sobrepostas**.
* `DATE_RANGE_TOO_LARGE`: limitar range a, por ex., **30 dias**.
* `DURATION_NOT_SUPPORTED`: quando o múltiplo de `slotDurationMin` não fecha com a duração pedida.

---

## 7) Tipos de retorno

```ts
export type Slot = {
  start: string;               // ISO no tz do provedor
  end: string;                 // ISO
  durationMin: number;         // minutos
  capacity: number;            // simultâneos
  remaining: number;           // (capacidade - reservas/holds no slot)
};

export type AvailabilityTemplate = Array<{
  dayOfWeek: DayOfWeek; startTime: string; endTime: string; slotDurationMin: number; breaks?: {start:string,end:string}[]; capacity?: number;
}>;
```

---

## 8) Integrações

* **Bookings**: `holdSlot(providerId, start, end)` durante `createBooking`; `releaseHold` em cancel/timeout.
* **Search/Ranking**: expor **próximo slot** disponível para melhorar a descoberta e ordenação.
* **Notifications**: alertar provedor/cliente em mudanças ou cancelamentos que afetem slots.

---

## 9) Config (ENV)

```env
AVAILABILITY_TIMEZONE_DEFAULT=America/Sao_Paulo
AVAILABILITY_MAX_RANGE_DAYS=30
AVAILABILITY_LEAD_TIME_MIN=180      # 3h
AVAILABILITY_PREP_BUFFER_MIN=15
AVAILABILITY_CACHE_TTL_SEC=60
AVAILABILITY_CAPACITY_DEFAULT=1
```

---

## 10) Exemplos (HTTP)

### 10.1 Consultar slots do provedor

```http
GET /availability/providers/p_123/slots?start=2025-08-24T00:00:00Z&end=2025-08-31T00:00:00Z&durationMin=120&timezone=America/Sao_Paulo
```

**200**

```json
[
  {"start":"2025-08-26T09:00:00-03:00","end":"2025-08-26T11:00:00-03:00","durationMin":120,"capacity":1,"remaining":1}
]
```

### 10.2 Atualizar template semanal

```http
PATCH /availability/me/template
{
  "timezone": "America/Sao_Paulo",
  "template": [
    { "dayOfWeek": 1, "startTime": "08:00", "endTime": "17:00", "slotDurationMin": 60, "breaks": [{"start":"12:00","end":"13:00"}] },
    { "dayOfWeek": 3, "startTime": "08:00", "endTime": "17:00", "slotDurationMin": 60 }
  ]
}
```

### 10.3 Criar override (folga)

```http
POST /availability/me/overrides
{
  "date": "2025-08-27",
  "kind": "BLOCK"
}
```

---

## 11) Segurança & RBAC

* Provedores só podem ler/editar **própria** disponibilidade (`/me/*`).
* Admins podem consultar/ajustar de terceiros (investigação/ajuste operacional).
* Auditoria de mudanças (quem/quando) + rollback simples (guardar versões recentes do template).

---

## 12) Telemetria & Alertas

* Eventos: `availability_template_updated`, `override_created`, `slots_queried`, `hold_acquired/released`.
* Alertas: p95 de geração de slots > 200ms; taxa de erro `DURATION_NOT_SUPPORTED`.

---

## 13) QA — Casos críticos

* **Quebra sobreposta** ou fora da janela.
* **Override** duplicado no mesmo dia → consolidar/invalidar.
* **Lead time**: impedir slot imediato se `AVAILABILITY_LEAD_TIME_MIN` > 0.
* **Capacidade** > 1: validar contagem de reservas simultâneas.
* Transições de horário (DST) — normalizar em `timezone` (São Paulo não tem DST atualmente, mas manter suporte genérico).
* Slots **overnight** (ex.: 22:00→02:00) — dividir em dois segmentos (dia corrente e seguinte).

---

## 14) Melhorias avançadas (quando necessário)

1. **Capacidade por serviço** (ex.: serviços longos consomem 2× slots, ou têm duração distinta por categoria).
2. **Auto‑suggest** de janelas com base em demanda local (surge) e preferências do provedor.
3. **Blackout por região/cidade** (feriados locais via calendário externo).
4. **Calendar Sync** (Google/Outlook) em 1‑way ou 2‑way com throttling.
5. **Smart buffers** por deslocamento (distância → tempo de deslocamento estimado via geo API).
6. **Hold distribuído** com chave idempotente e fallback (DLQ) para evitar locks zumbi.
7. **AB testing** de slotDurationMin por categoria/impacto em conversão.

---

## 15) Conclusão

O módulo **Availability** garante que a agenda exibida ao cliente é **realmente reservável**, evitando conflitos e respeitando regras operacionais. Ele serve de base para **conversão** (slots sempre frescos), **qualidade** (sem oversell) e **escala** (cache/locks), integrando‑se com Bookings, Ranking e Notifications.
