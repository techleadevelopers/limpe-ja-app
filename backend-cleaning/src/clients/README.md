# README — Módulo de Clients (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Clients** com base nos arquivos: `clients.module.ts`, `clients.controller.ts`, `clients.service.ts`, `client.entity.ts`, `client-details.dto.ts`, `client-dashboard.dto.ts`, `update-client-profile.dto.ts`.
>
> **Objetivo:** gerenciar **perfil** do cliente, **endereços**, **preferências**, **referência de indicação** e expor **dashboard** do cliente (funil pessoal, retenção e benefícios), integrando **Bookings/Coupons/Missions/Loyalty/Referrals/Notifications**.

---

## 1) Responsabilidades

* Persistir e expor **dados de cliente** com validação (CPF, telefone, CEP) e georreferência opcional (lat/lon).
* Fornecer **detalhes** consumíveis pelo app (nome, foto, documentos opcionais, endereço padrão, preferências, referral code).
* Expor **dashboard** do cliente: histórico de reservas, cupons, pontos e metas (missões), além de indicadores de engajamento.
* Atualizar **perfil** com regras de LGPD (auditoria de alterações, consentimentos), com **idempotência** e **validações server‑side**.

---

## 2) Arquitetura

* **Module**: `ClientsModule` — registra controller/service e injeta dependências (ORM repo, Metrics, Loyalty, Coupons, Referrals, Notifications, ViaCEP/Geo provider).
* **Controller**: `ClientsController` — rotas REST para **detalhes do cliente**, **dashboard** e **atualização** de perfil.
* **Service**: `ClientsService` — regras de negócio (normalização de dados, validações, composição do dashboard, integração com outros módulos).
* **Entity**: `Client` (modelo de persistência principal) + relacionamentos (`User`, `Address`, etc.).

**Dependências típicas**: `UsersService` (autenticação/identity), `BookingsService`, `CouponsService`, `MissionsService`, `LoyaltyService`, `ReferralsService`, `MetricsService`, `AddressService/ViaCEP`, `Cache/Redis`, `Sentry`.

---

## 3) Modelagem (entity – code‑real esperado)

```ts
export class Client {
  id: string;                    // uuid
  userId: string;                // FK users
  fullName: string;
  email?: string | null;         // redundância controlada (fonte é Users)
  phone: string;                 // E.164
  cpf?: string | null;           // validado (apenas hash/parcial em logs)
  defaultAddressId?: string | null;  // FK address
  defaultLat?: number | null;    // geo opcional (para estimativa de deslocamento)
  defaultLon?: number | null;
  referralCode?: string | null;  // código único do cliente
  marketingOptIn?: boolean;      // consentimento
  blocked?: boolean;             // anti‑fraude/churn extremo
  createdAt: Date; updatedAt: Date;
}
```

> **Índices:** `userId (unique)`, `referralCode (unique)`, `(defaultLat, defaultLon)` (GIST opcional).

**Relacionadas (fora deste módulo, quando houver)**: `addresses(id, clientId, street, number, complement, neighborhood, cityId, state, zip, lat, lon)`.

---

## 4) DTOs (code‑real)

### 4.1 `ClientDetailsDto`

```ts
export class ClientDetailsDto {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  cpfMasked?: string;                 //  ***.***.***-** (somente exibição)
  referralCode?: string;
  defaultAddress?: {
    id: string; street: string; number?: string; complement?: string; neighborhood?: string; city?: string; state?: string; zip?: string;
    lat?: number; lon?: number;
  };
  preferences?: { notifications: boolean; marketingOptIn: boolean };
}
```

### 4.2 `ClientDashboardDto`

```ts
export class ClientDashboardDto {
  kpis: {
    bookingsTotal: number;        // todas as reservas
    bookingsCompleted: number;    // concluídas
    lastBookingAt?: string;       // ISO
    activeCoupons: number;        // cupons válidos
    loyaltyPoints: number;        // saldo de pontos
    missionsReadyToClaim: number; // missões disponíveis para claim
  };
  recentBookings: Array<{ id: string; status: string; scheduledAt: string; providerName?: string; totalPrice?: number; }>;
  coupons: Array<{ id: string; code: string; valueType: 'PERCENT'|'FIXED'; value: number; expiresAt: string }>;
  missions: Array<{ id: string; title: string; kind: string; progress: number; goal: number; state: 'IN_PROGRESS'|'COMPLETED'|'CLAIMED' }>;
}
```

### 4.3 `UpdateClientProfileDto`

```ts
export class UpdateClientProfileDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsPhoneNumber() phone?: string;      // E.164
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() cpf?: string;             // validação de CPF no service
  @IsOptional() defaultAddress?: {
    street: string; number?: string; complement?: string; neighborhood?: string; city: string; state: string; zip: string; lat?: number; lon?: number;
  };
  @IsOptional() @IsBoolean() marketingOptIn?: boolean;
}
```

---

## 5) Rotas (ClientsController)

| Método | Rota                     | Scope         | Descrição                                                 |
| -----: | ------------------------ | ------------- | --------------------------------------------------------- |
|    GET | `/clients/me`            | AUTH (CLIENT) | **Detalhes** do cliente autenticado (`ClientDetailsDto`). |
|  PATCH | `/clients/me`            | AUTH (CLIENT) | **Atualiza** perfil (valida CPF/telefone/CEP; normaliza). |
|    GET | `/clients/me/dashboard`  | AUTH (CLIENT) | **Dashboard** pessoal (`ClientDashboardDto`).             |
|    GET | `/clients/:id`           | ADMIN         | Consulta detalhes por `id` (investigação).                |
|    GET | `/clients/:id/dashboard` | ADMIN         | Dashboard de um cliente específico.                       |

**Erros comuns**: `VALIDATION_ERROR`, `DUPLICATE_CPF`, `INVALID_ZIP_OR_ADDRESS`, `FORBIDDEN`, `NOT_FOUND`.

---

## 6) Service (assinaturas & regras)

```ts
class ClientsService {
  getDetails(userId: string): Promise<ClientDetailsDto>;
  updateProfile(userId: string, dto: UpdateClientProfileDto): Promise<ClientDetailsDto>;
  getDashboard(userId: string): Promise<ClientDashboardDto>;
  adminGetDetails(clientId: string): Promise<ClientDetailsDto>;
  adminGetDashboard(clientId: string): Promise<ClientDashboardDto>;
}
```

### 6.1 `getDetails`

* Carrega `Client` por `userId` e **address default**.
* **Mask** de `cpf` para exibição (não retornar valor bruto).
* Retorna preferências (marketing/notifications) e `referralCode` (se existir).

### 6.2 `updateProfile`

* **Normalizações**: `fullName` trim, `phone` para E.164, `email` lowercase.
* **CPF**: validar dígitos verificadores; armazenar **somente** valor normalizado; **não** logar.
* **Endereço**: se `zip` presente, valida via **ViaCEP**; persistir lat/lon quando possível.
* **Idempotência**: aplicar lock curto `client:update:{userId}` para evitar race.
* Gera **evento** `client_profile_updated` (telemetria) + notificação opcional.

### 6.3 `getDashboard`

* Agrega dados de **Bookings** (últimas N reservas, totais), **Coupons** (ativos), **Loyalty** (pontos), **Missions** (progresso e claim disponíveis).
* Pode utilizar `MetricsService`/repositórios de leitura para contagens otimizadas.
* **Cache** por 60s (`clients:dashboard:{userId}`) e invalidação em eventos (`booking_*`, `coupon_*`, `mission_*`, `loyalty_*`).

---

## 7) Integrações

* **Bookings**: histórico recente, status e datas; efeito no funil e lembretes de review.
* **Coupons**: listagem de cupons **ativos** (não expirados, `usageCount < usageLimit`).
* **Missions**: progresso e **claim** elegível.
* **Loyalty**: saldo de pontos e **tiers**.
* **Referrals**: exposição do `referralCode`; opcionalmente, contagem de conversões.
* **Notifications**: push para mudanças relevantes (ex.: perfil atualizado, cupom emitido).
* **Address/ViaCEP**: validação de CEP e enriquecimento do endereço.

---

## 8) Segurança, LGPD & Auditoria

* **RBAC**: `/clients/me*` restrito ao **próprio usuário**; endpoints `ADMIN` para investigação.
* **PII**: mascarar `cpf` e **nunca** retornar raw em payloads; telefone/e‑mail somente do próprio usuário.
* **Consentimentos**: persistir `marketingOptIn` e `notifications` com trilha de alteração (`who/when`).
* **Auditoria**: registrar alterações sensíveis (cpf, endereço) com hash/salt e IP.

---

## 9) Config (ENV)

```env
CLIENTS_TIMEZONE_DEFAULT=America/Sao_Paulo
CLIENTS_DASHBOARD_CACHE_TTL=60
CPF_VALIDATION_ENABLED=true
VIACEP_ENABLED=true
```

---

## 10) Exemplos (HTTP)

### 10.1 Detalhes (me)

```http
GET /clients/me
Authorization: Bearer <token>
```

**200**

```json
{
  "id": "c_01",
  "fullName": "Maria Souza",
  "phone": "+5511999999999",
  "email": "maria@example.com",
  "cpfMasked": "***.***.***-**",
  "referralCode": "MARIA123",
  "defaultAddress": { "street": "Rua A", "number": "100", "city": "Campinas", "state": "SP", "zip": "13000-000" },
  "preferences": { "notifications": true, "marketingOptIn": true }
}
```

### 10.2 Atualizar perfil

```http
PATCH /clients/me
Idempotency-Key: d7a1-...
{
  "fullName": "Maria A. Souza",
  "phone": "+5511988888888",
  "defaultAddress": { "street": "Rua B", "number": "200", "city": "Campinas", "state": "SP", "zip": "13000-001" },
  "marketingOptIn": true
}
```

### 10.3 Dashboard (me)

```http
GET /clients/me/dashboard
```

**200** *(exemplo reduzido)*

```json
{
  "kpis": { "bookingsTotal": 4, "bookingsCompleted": 3, "lastBookingAt": "2025-08-22T14:00:00-03:00", "activeCoupons": 1, "loyaltyPoints": 320, "missionsReadyToClaim": 1 },
  "recentBookings": [{"id":"b1","status":"COMPLETED","scheduledAt":"2025-08-10T09:00:00-03:00","providerName":"Ana"}],
  "coupons": [{"id":"cp1","code":"VOLTE7","valueType":"FIXED","value":30,"expiresAt":"2025-08-29T23:59:59-03:00"}],
  "missions": [{"id":"m1","title":"3 reservas no mês","kind":"COUNT_EVENT","progress":2,"goal":3,"state":"IN_PROGRESS"}]
}
```

---

## 11) Telemetria & KPIs

* Eventos: `client_profile_viewed`, `client_profile_updated`, `clients_dashboard_viewed`.
* KPIs: engajamento (DAU/WAU), **2ª compra em 7d**, VTR de cards no dashboard (missão/cupom), taxa de completude do perfil (endereço/CPF/telefone verificados).

---

## 12) QA — Casos críticos

* Atualização simultânea do perfil (race) → proteger com lock por `userId` + idempotência.
* CPF inválido ou duplicado (já usado por outro usuário) → `DUPLICATE_CPF`.
* CEP inexistente/fora do padrão → `INVALID_ZIP_OR_ADDRESS`.
* Dashboard sem dados → retornar zeros/listas vazias; **não** erro.
* Remoção/alteração de endereço padrão → revalidar lat/lon e limpar caches dependentes (ranking/localização).

---

## 13) Melhorias avançadas (quando necessário)

1. **Score de completude** de perfil (com gamificação para atingir 100%).
2. **Preferências granulares** de notificação (tipos, horários de silêncio) + digest.
3. **Recomendações** personalizadas no dashboard (prove dores próximos, horários populares, cupons relevantes).
4. **Histórico de endereços** com quick‑switch e etiquetas (Casa, Trabalho, Mãe).
5. **Análise de churn** (sinalização no dashboard com ação sugerida: cupom/mission).
6. **Portabilidade (LGPD)**: export JSON/ZIP dos dados do cliente.

---

## 14) Conclusão

O módulo **Clients** provê a base de **identidade de cliente**,
com dados limpos e auditáveis, permitindo **personalização** (dashboard, cupons, missões)
e integrando‑se de forma segura aos demais módulos para maximizar **retenção** e **NPS**.
