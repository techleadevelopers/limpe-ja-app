# ADMIN STATE OF PROJECT
**Location:** `admin-web/ADMIN_STATE_PROJECT.md`  
**Date:** 2025-12-30  
**Commit:** `b61a8527679ebed49f940d717d6422a56305a732`  
**Branch:** `main`

## 0) TL;DR
- **Status geral:** O admin é um SPA React 18 rodando com Vite (`client/src/App.tsx:1-90`) e um micro-servidor Express em `server/index.ts:1-45`; o front usa Wouter + React Query e consome uma API fake implementada em `server/routes.ts:1-89`/`server/storage.ts:1-155`.
- **Pronto pra produção:** Dashboard com KPIs, gráficos, mapa e widgets de fila/confimação (`client/src/pages/dashboard/dashboard.tsx:1-62`); gestão de provedores com busca, filtros, páginação e modais de aprovação (`client/src/pages/providers/providers.tsx:1-110`); tela de login rodando `AuthContext` que guarda token/user no `localStorage` e navega para `VirtualRoute` (`client/src/pages/login.tsx:1-70`, `client/src/context/AuthContext.tsx:1-120`); integrações com o backend via `client/src/lib/api.ts:1-230`.
- **Principais riscos (Top 10):**
  1. `npm ci` falha por `EPERM` ao tentar remover `node_modules/@rollup/rollup-win32-x64-msvc/rollup.win32-x64-msvc.node` (possível arquivo bloqueado).
  2. `npm run lint` quebra em massa (`import/no-unresolved` e `casing`) porque o ESLint não resolve `react`, `lucide-react`, `@radix-ui/*`, `framer-motion`, `wouter`, etc. (`client/src/**`, `server/*.ts`).
  3. `npx tsc --noEmit` / `npm run build` falham em `client/src/pages/clients/client-management.tsx:256` (JSX sem tag fechada).
  4. `npm run test` tenta invocar `vitest`, mas o binário não existe no PATH (as dependências de dev não foram instaladas nem linkadas após o `npm ci` rejeitado).
  5. O backend Express é um mock com storage em memória (`server/storage.ts`); não há persistência real nem conexões com o relax-app real.
  6. Autenticação usa `localStorage` e `AuthContext` sem refresh token, e `PrivateRoute` só verifica `user.role === 'ADMIN'` (não há verificação server-side de sessão).
  7. Nenhum rate-limiter ou política CSRF nos endpoints Express além dos logs simples em `server/index.ts`.
  8. O `.env` está presente mas falta `.env.example`, dificultando replicar a URL da API e outros secrets (`admin-web/.env`).
  9. API fake cobre apenas métricas, provedores e filas; o cliente chama dezenas de endpoints como `/bookings`, `/disputes`, `/payments` (client/src/lib/api.ts) que não existem no servidor local.
  10. Falta cobertura automatizada (Vitest não configurado) e nada roda em CI hoje.
- **Próximos passos recomendados (prioridade P0/P1/P2):**
  1. **P0:** Corrigir o JSX malformado em `client/src/pages/clients/client-management.tsx` (linha 256) para desbloquear `tsc`/`npm run build`.
  2. **P0:** Ajustar os imports/eslint para resolver corretamente `react`, `@tanstack/react-query`, `lucide-react`, `radix-ui` e `framer-motion` ou atualizar `settings.json` do ESLint para aceitar o casing atual (`client/src/components/*`, `client/src/pages/*`).
  3. **P0:** Fechar o handle no `rollup.win32-x64-msvc.node` e repetir `npm ci`.
  4. **P1:** Instalar/linkar `vitest` (provider script `npm run test`) ou trocar por outro runner; hoje o comando falha em qualquer ambiente.
  5. **P1:** Documentar um `.env.example` com `VITE_APP_API_URL` e variáveis esperadas por `server/index.ts`/`client/src/lib/api.ts`.
  6. **P1:** Expandir o servidor Express para suportar os endpoints consumidos pelo cliente (bookings, disputes, payments, notifications etc.) ou apontar o frontend para o backend real.
  7. **P2:** Introduzir health/metrics page (hoje só log/console).
  8. **P2:** Implantar rate limiting/session hardening no Express (não há middleware de segurança).
  9. **P2:** Cobrir rota de settings/queues/referrals com testes (Vitest + RTL) para reduzir risco de regressão.
  10. **P2:** Centralizar a configuração da URL (há `VITE_APP_API_URL` no `.env` e múltiplos fallbacks em `client/src/lib/api.ts:18-33`); garantir que `app.config.ts`/Replit usará o mesmo valor no build.

## 1) Stack & Infra
- **Detectado:** Vite (v5.4.19, `vite.config.ts`), React 18, TypeScript 5.6, Tailwind (`tailwind.config.ts`), React Query (`@tanstack/react-query`), Wouter router (`/client/src/App.tsx`), Radix UI components (`components/ui/*`), Framer Motion, Express server + Drizzle ORM types (`shared/schema.ts`), API client baseado em Axios (`client/src/lib/api.ts`).
- **Scripts:** `package.json` define quatro scripts principais e `vitest` (falha porque o binário não é encontrado):
  | Script | Comando | Propósito |
  | --- | --- | --- |
  | `dev` | `vite` | Dev server React + HMR |
  | `build` | `tsc && vite build` | Type-check + bundle prod |
  | `lint` | `eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0` | Força casing/imports coerentes |
  | `preview` | `vite preview` | Serve build para QA |
  | `test` | `vitest` | Suite unitária (não funciona, vitest ausente) |
- **Env vars:** `.env` define `VITE_APP_API_URL` (apontando para `https://limpeja-backend-production.up.railway.app/`). Não há `.env.example`, então a URL e outras chaves só existem localmente (`admin-web/.env`).
- **Infra adicional:** `server/index.ts` faz logging de cada `/api` com tempo de resposta e JSON (linha 10-30) e só em dev monta Vite via `server/vite.ts`; em produção serve estáticos.

## 2) Rotas & Navegação
- O roteamento é gerido por `wouter` em `client/src/App.tsx:8-66`, com `PrivateRoute` (linha 12-41) que redireciona para `/login` e bloqueia qualquer `user.role !== 'ADMIN'`.
- **Tabela de rotas:**
  | Rota | Componente | Proteção | Propósito |
  | --- | --- | --- | --- |
  | `/login` | `client/src/pages/login.tsx` | pública | Formulário de email/senha chama `AuthContext.login` + toast |
  | `/` | `client/src/pages/dashboard/dashboard.tsx` | `PrivateRoute` (ADMIN) | Landing do painel com KPIs, mapa, fila |
  | `/dashboard` | idem | idem | Mesma view (redirect padrão) |
  | `/notifications` | `client/src/pages/notifications/notifications.tsx` | privado | Consolida notificações via API |
  | `/providers` | `client/src/pages/providers/providers.tsx` | privado | Lista/filtros de provedores + modais de aprovação/exclusão |
  | `/verification-queue` | `client/src/pages/users/verification-queue.tsx` | privado | Fila de verificações pendentes + modal de intervenção |
  | `/financial-analytics` | `client/src/pages/analytics/financial-analytics.tsx` | privado | Relatórios financeiros |
  | `/service-management` | `client/src/pages/services/service-management.tsx` | privado | CRUD de serviços |
  | `/dispute-management` | `client/src/pages/disputes/dispute-management.tsx` | privado | Gestão de disputas |
  | `/payment-management` | `client/src/pages/payments/payment-management.tsx` | privado | Saques/pagamentos com modal e abas |
  | `/safety-alerts` | `client/src/pages/safety/safety-alerts.tsx` | privado | Monitoramento de incidentes |
  | `/user-management` | `client/src/pages/users/user-management.tsx` | privado | Busca/edição/exclusão de clientes |
  | `/provider-map` | `client/src/pages/providers/provider-map.tsx` | privado | Visualiza geolocalização de provedores |
  | `/settings` | `client/src/pages/settings/settings.tsx` | privado | Configurações (SLAs, pricing, queues) |
  | `/*` | `client/src/pages/not-found.tsx` | fallback | Página 404 simples |

## 3) Auth & RBAC
- O login usa `AuthContext` (`client/src/context/AuthContext.tsx:20-120`): chama `api/login`, salva `authToken` e `userData` no `localStorage`, define `isLoading` e invoca `navigate('/dashboard')`. O logout limpa `localStorage` e navega para `/login`. (`login.tsx` e `AuthContext.tsx`).
- `PrivateRoute` em `client/src/App.tsx:12-41` obriga autenticação + `user.role === 'ADMIN'`, caso contrário redireciona e mostra erro simples. Sem token válido, `AuthContext` navega para `/login`.
- `client/src/lib/api.ts:8-72` resolve `API_BASE_URL` via `import.meta.env` e fallback, cria axios com `withCredentials: true` e define interceptores que: (a) adicionam `Authorization` e `X-Client-Request-Id`, (b) criam `Idempotency-Key` para POST/PUT/PATCH, (c) retry exponencial (até 3 tentativas), (d) deduplicam logs de erro e (e) disparam `setUnauthorizedHandler` (gerenciado em AuthContext) para limpar sessão 401.
- **Gaps:** nenhuma sessão server-side, nenhuma rotação de token, e o `PrivateRoute` não verifica validade do token no servidor além do `isAuthenticated` em memória. Não há roles adicionais (apenas `ADMIN`), então futuras hierarquias (SUPPORT, OPS) precisam de guardas extras.

## 4) Integração com Backend
- `client/src/lib/api.ts` consome `/auth/login`, `/admin/dashboard/metrics`, `/providers`, `/verification/pending-queue`, `/bookings`, `/disputes`, `/payments`, `/services`, `/pricing`, `/faqs`, `/referrals`, `/safety/*`, `/admin/queues/*` etc. Todos usam `fetchApi` que injeta headers, trata erros com `buildUnifiedError`, e faz retries/dedup (linhas 50-120).
- O backend local (`server/routes.ts`) expõe APIs reais para `dashboard/metrics`, `providers`, `providers/status/:status`, `providers/:id`, `activities`, `verification-queue` e `providers` updates. Cada rota usa `try/catch` e devolve JSON ou erro 500; os dados vêm do storage em memória (`server/storage.ts:1-200`) que inicializa amostras e relata `getProvidersByStatus`/`getDashboardMetrics`.
- O shared schema `shared/schema.ts:1-60` (Drizzle + Zod) descreve tabelas `users`, `providers`, `services`, `bookings`, `activities` e a enum de status para alinhar tipos usados tanto no servidor como no cliente.
- Logs e observabilidade: `server/index.ts:10-32` mede latência, concatena JSON e escreve no console, e `server/vite.ts` monta Vite em dev/serve statico em prod.

## 5) Features do Admin (o que existe)
- **Dashboard:** `client/src/pages/dashboard/dashboard.tsx` carrega métricas via `fetchDashboardMetrics`, mostra `MetricsCards`, `RevenueChart`, `ProviderMap`, `RecentActivities`, `VerificationQueueWidget`, `ConfigUpdates`, com estados de loading/error (linha 18-68).
- **Provedores:** `client/src/pages/providers/providers.tsx` (linhas 1-130) busca `/providers`, aplica filtros de status/pesquisa, pagina, abre `VerificationModal`, usa mutações `updateProviderStatus` e `deleteProvider` e mostra badges dinamicamente.
- **Fila de verificação:** `client/src/pages/users/verification-queue.tsx` (linhas 1-80) consulta `/verification/pending-queue`, lista provedores pendentes e usa modal para aprovar/rejeitar com toasts.
- **Usuários/Clientes:** `client/src/pages/users/user-management.tsx` faz fetch de clientes (`fetchClients`, `updateClientProfile`, `deleteUser`), oferece modais de edição e permissões, e usa badges/status (linhas 1-50).
- **Bookings:** `client/src/pages/bookings/booking-management.tsx` (linhas 1-60) carrega `/bookings`, abre modais para detalhar agendamentos, mudar status e colocar notas, e usa `updateBookingStatus`.
- **Pagamentos/Saques:** `client/src/pages/payments/payment-management.tsx` (linhas 1-60) integra `fetchWithdrawalRequests`, `fetchAllTransactions`, aprova/rejeita saques com modal e campos de justificativa (linha 1-40).
- **Settings/Queues/Missions:** `client/src/pages/settings/settings.tsx`, `client/src/pages/settings/queues-monitor.tsx`, `client/src/pages/missions/mission-management.tsx` usam API de SLAs, pricing e monitoramento de filas (módulos referenciados em `client/src/lib/api.ts:230-380`).
- **Disputas/Reviews/Offers:** Outras páginas (ex.: `client/src/pages/disputes/dispute-management.tsx`, `client/src/pages/reviews/review-management.tsx`, `client/src/pages/offers/offer-management.tsx`) usam `fetchAllDisputes`, `fetchAllReviews`, `fetchOffers` para CRUD e logs.
- **Segurança & Notificações:** `client/src/pages/safety/safety-alerts.tsx` chama `/safety/panic-alerts` e `/safety/incidents`; `client/src/pages/notifications/notifications.tsx` consome `fetchChatLogs`, `sendNotification`, `scheduleNotification`.

## 6) Qualidade (Build/Test/Lint/Typecheck)
- **Comandos rodados:**  
  1. `npm ci` – **FAIL** (`EPERM` ao remover `node_modules/@rollup/rollup-win32-x64-msvc/rollup.win32-x64-msvc.node`). Sem clean install, dependências podem estar inconsistentes.  
  2. `npm run lint` – **FAIL** (393 erros `import/no-unresolved` + `unicode-bom` + missing `lucide-react`, `framer-motion`, etc.; log parcial acima).  
  3. `npx tsc --noEmit` – **FAIL** (`client/src/pages/clients/client-management.tsx:256` tem `<div>` sem fechamento, TS17008).  
  4. `npm run test` – **FAIL** (`vitest` não encontrado no PATH; dev dependency não instalada).  
  5. `npm run build` – **FAIL** (mesmo erro TS17008 bloqueia `tsc`).  
- **Principais falhas:** EsLint não resolve imports (possível alias `@/*` não configurado na IDE ou nos plugins), `tsc` detecta JSX malformado, e `vitest` precisa ser instalado/configurado. Sem esses, o pipeline não sobe. Sugestões: alinhar aliases/resolver, fechar tags JSX, instalar `vitest`.

## 7) Segurança/Operação
- **Credenciais:** `AuthContext` salva `authToken` + `userData` em `localStorage` (`client/src/context/AuthContext.tsx:24-60`); `api.ts` injeta esse token em `Authorization` e remove tudo no logout/401. Não há HttpOnly cookie nem refresh token.  
- **Rate limiting:** inexistente; o servidor Express (`server/index.ts`) só faz log/tempo; nenhum `express-rate-limit` ou middleware similar.  
- **Logs:** `server/index.ts:10-32` loga cada `/api` com método, path, status e JSON limitado a 80 caracteres.  
- **CI/CD/Deploy:** Repositório indica `app.config.ts` (talvez Replit) e `.replit`, mas não há GitHub Actions ou pipeline; dependências estão em `package.json`. Deploy alvo é Vite/Express na porta 5000 (comentado em `server/index.ts:37-45`).  
- **Observabilidade:** nenhuma health page – monitoramento fica no console; `server/index.ts` escreve `serving on port` e logs por requisição.  
- **Segurança recomendada:** 1) Criar `.env.example` para `VITE_APP_API_URL`. 2) Introduzir rate limiter/session guard no Express. 3) Melhorar logging/monitor com métricas e rota `/health`. 4) Mover tokens para HttpOnly cookie quando for integrar com backend real.

## 8) Lista de Arquivos Relevantes
- `client/src/App.tsx` – roteamento Wouter, animações Framer Motion, `PrivateRoute` com RBAC.  
- `client/src/context/AuthContext.tsx` – login/logout, localStorage, unauthorized handler.  
- `client/src/lib/api.ts` – base URL, Axios interceptors, retries, autop inference de endpoints.  
- `client/src/pages/dashboard/dashboard.tsx` – KPIs, RevenueChart, ProviderMap e widgets conectando APIs.  
- `client/src/pages/providers/providers.tsx` – filtros/pesquisa, modais, mutações de status/exclusão.  
- `client/src/pages/bookings/booking-management.tsx` – modais para status, `fetchBookingDetails`, `updateBookingStatus`.  
- `client/src/pages/payments/payment-management.tsx` – abas de transações, modal de saques, chamadas a `approveWithdrawal/rejectWithdrawal`.  
- `client/src/pages/users/user-management.tsx` e `verification-queue.tsx` – CRUD de clientes e modais de verificação.  
- `client/src/pages/safety/safety-alerts.tsx` – alertas de panic/incidentes via API.  
- `server/routes.ts`, `server/storage.ts` e `shared/schema.ts` – APIs Express + in-memory + Drizzle schema (providers, services, bookings, activities).

## 9) Próximas melhorias recomendadas (P0/P1/P2)
1. **P0** – Fechar o JSX malformado em `client/src/pages/clients/client-management.tsx` para que `tsc` e `npm run build` passem.  
2. **P0** – Normalizar imports (React, Radix, Wouter, Framer Motion) e configurar ESLint para reconhecer aliases `@/...`.  
3. **P1** – Repetir `npm ci` após libertar `rollup.win32-x64-msvc.node`; sem isso, `npm run lint/build` não são confiáveis.  
4. **P1** – Instalar/configurar `vitest` (ou outra suite) para que `npm run test` rode; atualmente o comando é um stub quebrado.  
5. **P1** – Documentar `.env.example` com `VITE_APP_API_URL` e quaisquer secrets do servidor Express.  
6. **P2** – Expandir o servidor Express fake para cobrir os endpoints usados pelo cliente (bookings/disputes/payments/notifications) ou trocar para o backend real do relax-app.  
7. **P2** – Introduzir health endpoint e métricas básicas no Express (`server/index.ts`).  
8. **P2** – Adicionar rate-limit/CSP e harden `Authorization` (hoje o server só aceita tudo).  
9. **P2** – Revisar RBAC para suportar mais papéis (SUPPORT, OPS) se adicionados, replicando `PrivateRoute`.  
10. **P2** – Criar testes end-to-end mínimos (p. ex. login + dashboard smoke) uma vez que `vitest` esteja disponível.
