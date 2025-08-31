# README — Painel Administrativo **LimpeJá**

> **Versão:** 2.0 (estado alvo: 100% produção)
> **Stack:** React + TypeScript + Vite + Tailwind + Radix UI + TanStack Query + Wouter + Recharts
> **Build:** Node 20+ | PNPM/Yarn/NPM
> **Infra:** Backend LimpeJá (NestJS + Prisma + REST), Redis/BullMQ (filas), Sentry (observabilidade)

---

## 1) Visão Geral

O **Painel Administrativo LimpeJá** é a console web usada por operações, suporte e growth para governar o marketplace (provedores, clientes, agendamentos, pagamentos, cupons, missões, assinaturas, disputas, safety e analytics). Este README documenta **setup**, **padrões**, **módulos**, **RBAC**, **integrações** e **procedimentos de produção**.

### Objetivos

* **Operação em produção** com autenticação, RBAC e auditoria.
* **Consolidação 100%** das páginas críticas: Cupons, Missões, Assinaturas, Pagamentos (Earnings), Disputas, Bookings, Safety, Analytics.
* **Observabilidade e qualidade**: Sentry, logs de auditoria, testes de contrato.

---

## 2) Pré‑requisitos

* **Node.js 20+**
* **PNPM 9+** *(recomendado)* ou Yarn/NPM
* Backend LimpeJá rodando e acessível (ambiente dev/stage/prod)
* Acesso às variáveis de ambiente (arquivos `.env.*`)

---

## 3) Como rodar

```bash
# 1) Instalar deps
pnpm install

# 2) Configurar env local
cp .env.example .env.local
# edite valores conforme sua stack

# 3) Subir em modo dev
pnpm dev

# 4) Build de produção
pnpm build

# 5) Preview local do build
pnpm preview
```

> **Ports**: Vite default `5173`. Configure `VITE_PORT` se necessário.

---

## 4) Variáveis de Ambiente (Frontend)

Crie `.env.local` (dev), `.env.staging` (stage) e `.env.production` (prod).

```ini
# URLs de API
VITE_API_BASE_URL=https://api.dev.limpeja.com

# Auth
VITE_AUTH_TOKEN_STORAGE_KEY=limpeja_admin_token
VITE_AUTH_REFRESH_INTERVAL_SEC=300

# Feature Flags
VITE_FEATURE_COUPONS=true
VITE_FEATURE_MISSIONS=true
VITE_FEATURE_SUBSCRIPTIONS=true
VITE_FEATURE_EARNINGS=true
VITE_FEATURE_DISPUTES=true
VITE_FEATURE_SAFETY=true

# Observabilidade
VITE_SENTRY_DSN=
VITE_SENTRY_ENV=development

# UI/Experimentos
VITE_DASHBOARD_CACHE_SEC=30
VITE_DEFAULT_TZ=America/Sao_Paulo

# Map/Geo (se aplicável a mapas do admin)
VITE_MAP_TOKEN=
```

> **Dica**: flags permitem esconder módulos ainda não liberados.

---

## 5) Estrutura do Projeto

```
admin/
├── src/
│   ├── components/            # Primitives UI (Radix wrappers, shadcn-like)
│   ├── layouts/               # Header, Sidebar, Layout base
│   ├── hooks/                 # useAuth, useToast, useIsMobile
│   ├── services/              # SDK de API (fetchApi + módulos)
│   ├── store/                 # auth.store, ui.store (zustand/opcional)
│   ├── utils/                 # cn, formatters, kpis, guards
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── providers/
│   │   ├── clients/
│   │   ├── bookings/
│   │   ├── coupons/                 # [NOVO] CRUD + analytics
│   │   ├── missions/                # [NOVO] gestão de missões
│   │   ├── subscriptions/           # [NOVO] planos + recorrência
│   │   ├── payments/                # ledger + saques (earnings)
│   │   ├── disputes/                # workflow disputas
│   │   ├── safety/                  # incidentes + panic
│   │   ├── notifications/
│   │   ├── analytics/               # financeiro + retenção
│   │   ├── referrals/
│   │   ├── services/
│   │   ├── settings/
│   │   ├── not-found.tsx
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
```

---

## 6) Scripts (PNPM)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 5173",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "format": "prettier -w ."
  }
}
```

---

## 7) Autenticação, Sessão e RBAC

* **AuthContext** armazena `accessToken` + `user` no `localStorage` (chave `VITE_AUTH_TOKEN_STORAGE_KEY`).
* **Roles**: `ADMIN`, `SUPPORT`, `FINANCE`, `OPS`, `VIEWER`.
* **Proteção de Rotas**: `PrivateRoute` verifica sessão e **claims** (roles).
* **Renovação de Token**: refresh automático em `VITE_AUTH_REFRESH_INTERVAL_SEC` (se backend suportar).
* **Logout Global** ao 401/419.

**Guard de Página (exemplo):**

```ts
function guard(required: Role[]) {
  return hasAnyRole(auth.user, required);
}
```

---

## 8) Padrões de API e Estado

* **HTTP** via `fetchApi` (headers com token, retries leves, parse JSON, tratamento de erros padrão).
* **TanStack Query** para cache, invalidação por chave e revalidação (`staleTime` curto em listas, maior em métricas).
* **Paginação padrão**: `?page=1&pageSize=20&sort=-createdAt`.
* **Idempotência**: `Idempotency-Key` em ações sensíveis (criar cupom, aprovar saque etc.).

**Arquivos principais**

* `services/api.ts` — base HTTP e tipagens.
* `services/*` — SDK por domínio: `coupons.ts`, `missions.ts`, `subscriptions.ts`, `payments.ts`, `bookings.ts`, `disputes.ts`, `analytics.ts`, `safety.ts`, `referrals.ts`, `notifications.ts`, `providers.ts`, `clients.ts`, `services-catalog.ts`.

---

## 9) Mapa de Páginas (100% Produção)

### 9.1 Dashboard (`/`)

* **KPIs**: usuários ativos, provedores aprovados, serviços agendados, receita total.
* **Gráficos**: Receita por período (7/30/90d), conversão funil (explore → quote → booking).
* **Widgets**: Mapa de provedores, Atividades recentes, Fila de verificação.

### 9.2 Cupons (`/coupons`)

* **CRUD**: criar, editar, togglar ativo, **revogar**.
* **Tipos**: `PERCENT|FIXED`, `maxDiscount`, `firstBookingOnly`, `issuedToUserId`, `expiresAt`, `usageLimit`.
* **Ações em massa**: upload CSV, revogação em lote.
* **Analytics**: emissões, uso por coorte, receita incremental, ROI.
* **Rotas API**: `GET/POST/PATCH /coupons`, `POST /coupons/apply`, `GET /coupons/resolve/:code`.

### 9.3 Missões (`/missions`)

* **Definição**: `COUNT_EVENT|STREAK_DAYS|WITHIN_WINDOW`, `goal`, `audience`, `rewardType (COUPON|POINTS)`.
* **Progresso**: visualizar e forçar expiração manual (ops).
* **Claim**: histórico e idempotência.
* **Analytics**: taxa de claim, tempo até claim, uso de recompensa.
* **API**: `GET/POST /missions`, `POST /missions/:id/claim`, `POST /missions/track`.

### 9.4 Assinaturas (`/subscriptions`)

* **Gestão**: criar, pausar, cancelar, retomar; frequência (semanal/quinzenal/mensal).
* **Agendamentos**: ver jobs futuros, reagendar geração.
* **Integração**: Payments (setup/pausa/retomada) e Queues (BullMQ).
* **API**: `POST/GET/PATCH /subscriptions`, `GET /subscriptions/me` (visão admin tem filtro por usuário).

### 9.5 Pagamentos / Earnings (`/payments`)

* **Ledger**: eventos (BOOKING\_COMPLETED, TAKE\_RATE\_FEE, WITHDRAWAL\_\*).
* **Saques (PIX)**: aprovar, recusar, revisar; auditoria por `idempotencyKey`.
* **KPIs**: available, pending, onHold, withdrawn.
* **API**: `GET /earnings/*`, `POST /earnings/withdrawals`.

### 9.6 Disputas (`/disputes`)

* **Workflow**: abrir, atribuir, solicitar evidências, decidir (refund/deny), bloqueios.
* **Estado**: `OPEN → IN_REVIEW → RESOLVED → CLOSED`.
* **API**: `/disputes` (listar, detalhar, transicionar status, anexar).

### 9.7 Bookings (`/bookings`)

* **Operações**: aceitar/rejeitar (provider), cancelar (cliente/provider/admin), reagendar, aplicar cupom.
* **Integrações**: Payments, Chat, Reviews, Notifications.
* **API**: `/bookings/*`.

### 9.8 Safety (`/safety`)

* **Pânico**: ACK dentro do SLA; escalonamento automático.
* **Incidentes**: timeline, anexos, severidade, SLA.
* **API**: `/safety/panic`, `/safety/incidents/*`.

### 9.9 Referrals (`/referrals`)

* **Indicadores**: indicações, conversões, pontos concedidos.
* **API**: `/referrals/*`.

### 9.10 Notifications (`/notifications`)

* **Inbox**: listagem in-app, marcar como lida, exclusão.
* **Push**: disparo por segmento, rate-limit diário, idempotência.
* **API**: `/notifications/*`.

### 9.11 Catálogo de Serviços (`/services`)

* **CRUD Admin**: criar/editar/arquivar; `slug` estável; `sortWeight`.
* **API**: `/services/*`.

### 9.12 Clientes & Provedores (`/clients`, `/providers`)

* **KYC**: verificação, aprovação/rejeição, bloqueio.
* **Perfil**: edição de dados sensíveis com auditoria.
* **APIs**: `/clients/*`, `/providers/*`, `/verification/*`.

### 9.13 Settings (`/settings`)

* **Config**: Geral, Notificações, Segurança, DB, Email.
* **Flags**: ativar/desativar módulos e parâmetros operacionais.

---

## 10) Padrões de UI/UX

* **Tailwind** com tokens de tema (`:root` / `.dark`) e utilitários custom (shadows, animações).
* **Radix UI** para acessibilidade.
* **Princípios**:

  * estados de carregamento com **Skeleton**;
  * feedback com **Toast**;
  * formulários com **react-hook-form**;
  * tabelas com paginação, busca e filtros;
  * **empty states** claros e CTAs de ação.

---

## 11) Segurança & Compliance

* **LGPD**: evitar PII sensível em payloads e logs.
* **RBAC**: controles por rota e componentes (ex.: esconder botões sem permissão).
* **Audit Trail**: toda ação crítica chama `/audit-logs` (server), gravando quem/quando/o quê.
* **Rate-Limit**: reuso de headers de idempotência.
* **Sentry**: erro com `user.id` (sem PII), `release` e `environment`.

---

## 12) Observabilidade

* **Sentry**: init em `main.tsx` (DSN e env por variáveis).
* **Logs de negócio** (backend) visíveis na UI via widgets básicos (ex.: fila de verificação, safety pendente).
* **KPIs**: taxa de entrega de notificações, open-rate, tempo de saque, conversão de cupons, claim de missões.

---

## 13) Qualidade: Testes e Tipagem

* **TypeScript estrito** (`"strict": true`).
* **Vitest** para unit e **MSW** (Mock Service Worker) para testes de componentes/queries.
* **Testes de contrato** (Pact, opcional) para endpoints críticos (coupons/apply, withdrawals, missions/claim).
* **Lint & Format**: ESLint + Prettier no CI.

```bash
pnpm typecheck
pnpm lint
pnpm test
```

---

## 14) Deploy

* **Build estático** (Vite) → bucket + CDN ou container Nginx.
* **Headers**: cache estático agressivo para assets + `no-store` para HTML.
* **Ambientes**: `dev` → `staging` → `prod` com `.env.*` separados.
* **Rollback**: manter últimos artefatos (N-3) versionados.

---

## 15) CI/CD (exemplo GitHub Actions)

* Jobs: `install`, `typecheck`, `lint`, `test`, `build`, `upload-artifact`.
* Gate de qualidade: reprova PR sem testes/linters.
* Deploy automático mediante tag `vX.Y.Z`.

---

## 16) Performance

* **Code‑split** por rota (import dinâmico).
* **Memo** e **React Query** com `select` para reduzir renders.
* **Virtualização** em tabelas grandes (react-virtual).
* **Imagens** com `loading="lazy"` e compressão.

---

## 17) Acessibilidade (a11y)

* Componentes Radix + labels/aria.
* Contraste AA na paleta.
* Navegação por teclado em modais, menus e diálogos.

---

## 18) Troubleshooting

* **401/403**: verificar token e roles.
* **CORS**: conferir `VITE_API_BASE_URL` e proxy em dev.
* **Build falhou**: rodar `pnpm typecheck` e `pnpm lint`.
* **Dados não aparecem**: checar `staleTime` e chaves de query (TanStack Query).

---

## 19) Roadmap de Consolidação (→ 100% produção)

1. **Cupons + Missões**: CRUD completo, analytics e claim idempotente.
2. **Financeiro (Earnings) + Assinaturas**: ledger + aprovação de saques e billing recorrente.
3. **Disputas + Bookings**: workflows e governança operacional.
4. **Analytics**: CAC, LTV, ROI, cohort de retenção.
5. **Safety + Auditoria**: ACK de pânico, incidentes, trilhas completas.

---

## 20) Contribuição

* Branching: `main` (protegida), `feat/*`, `fix/*`, `chore/*`.
* PR com checklist de: **tipos ok, lint ok, testes ok, snapshots atualizados**.
* **Changelog** por release (Conv. Commits) e versionamento **SemVer**.

---

## 21) Anexos — Convenções Rápidas

* **Formatação monetária**: util `formatCurrency(value, 'BRL')`.
* **Datas**: `dayjs.tz(VITE_DEFAULT_TZ)`; exibir minutos relativos `fromNow()`.
* **Tabela padrão**: busca + filtros + paginação + export CSV.
* **Botões críticos**: requerem confirmação (AlertDialog) e exibem toast de resultado.

---

### Checklist de Liberação (Go‑Live)

* [ ] Todas as páginas listadas em **9)** com dados reais e erros tratados.
* [ ] RBAC conferido por perfil (ADMIN, SUPPORT, FINANCE, OPS, VIEWER).
* [ ] Sentry habilitado + releases versionadas.
* [ ] Auditoria ativa para ações críticas (cupons, saques, disputas).
* [ ] LGPD: sem PII sensível em logs, telas e payloads.
* [ ] Documentação de rollback e planos de contingência.

---

**Contato Time**: `#admin-limpeja` (Slack) — incidentes via `/safety` e suporte via `/support`.
