# STATE OF PROJECT
> Data: 2025-12-28 | Commit: 95ebd7ff | Branch: main

## 0) TL;DR (1 pagina)
- Status geral: O backend NestJS entrega autenticacao JWT/roles, bookings (slots, regras minimas e state machine), payments PIX com webhooks e observabilidade (Prometheus, OTEL e health), enquanto o frontend Expo Router ja percorre explore, bookings e provider pages; o ciclo esta pronto para um beta controlado, mas depende de ajustes de configuracao (PIX/PSP secrets, rate limiting e consistencia de constantes), o bootstrap de producao valida `PIX_WEBHOOK_SECRET`, `psp.webhookSecret`, `PAGSEGURO_API_TOKEN` e `API_BASE_URL` e aborta o startup se algum secret critico faltar, e os testes Jest agora silenciam `Logger.log/debug/verbose` para manter o CI limpo.
- Pós-booking reminders + detecção de provedor atrasado + push delivery: SchedulerService persiste NotificationSchedule e dispara BOOKING_REMINDER/PROVIDER_LATE/JOB_STARTED/JOB_ENDED enquanto o front re-registra tokens ao voltar do foreground para garantir que toasts/pushes persistam (backend-cleaning/src/scheduler/scheduler.service.ts:1-230; backend-cleaning/src/bookings/bookings.service.ts:1930-2090; hooks/usePushRegistration.ts:1-32; contexts/AuthContext.tsx:200-330).
- Testes unitários: `npx jest --config test/jest-unit.json --runInBand` agora passa 14 suites e 39 testes; o novo controller `/pricing/config` também inclui especificação no PR #3, que hardenou pricing (derrubando fallback de `totalPrice` e garantindo `BadRequest` para `pricingType` inválido) e confirmou que conflitos já respeitam `PENDING_PROVIDER_CONFIRMATION`.
- PR #3 finalizado: endpoint público GET `/pricing/config` (mina `minHourlyMinutes` + `currency`), forte validação de pricingType e verificação que o backend ignora `dto.totalPrice`, e o conflito de bookings engloba o status `PENDING_PROVIDER_CONFIRMATION` via `BLOCKED_BOOKING_STATUSES`.
- Environment behavior (prod vs dev/test):
| Concern | Production | Dev/Test |
| --- | --- | --- |
| Missing secrets (`PIX_WEBHOOK_SECRET`, `psp.webhookSecret`, `PAGSEGURO_API_TOKEN`, `API_BASE_URL`) | bootstrap throws `Missing production secrets` and app never starts | `logMissingConfigOnce` warns once per key and the app keeps running so manual testing remains possible |
| `/payments/pix-charge` | never reached when PSP secrets missing (fails fast) | handler still returns `HttpException('PSP not configured', 503)` so requests fail fast despite placeholder mode |
| Logger output | normal Nest logger for all levels; production uses log/warn/error | Jest setup file overrides `Logger.log/debug/verbose` (see `test/jest.setup.ts`) so unit output stays focused on WARN/ERROR |

- Operacoes Ads-safe: `docs/RUNBOOK_ADS_SAFE.md` centraliza o checklist de pre-deploy, smoke tests, observabilidade, rollback e ondas de expansao para o trafego pago.

Top risks:
  1. `backend-cleaning/src/payments/payments.service.ts:198`  em dev/test a falta de `PIX_WEBHOOK_SECRET` ainda impede globais PIX (o fail-fast prod bloqueia subidas), então monitorar o config continua chave para evitar rejects de webhook.
  2. `backend-cleaning/src/payouts/guards/psp-webhook.guard.ts:29`  idem para `psp.webhookSecret` nos ambientes controlados.
  3. `backend-cleaning/src/metrics/metrics.controller.ts:8`  todas as metricas ficam atras de `JwtAuthGuard`, obrigando ferramentas externas a obter um JWT valido.
- Top 10 proximos passos:
  1. Validar `PIX_WEBHOOK_SECRET` durante o bootstrap e abortar se faltar (`backend-cleaning/src/payments/payments.service.ts:198`).
  2. Garantir que `psp.webhookSecret` esteja presente antes de aceitar webhooks (`backend-cleaning/src/payouts/guards/psp-webhook.guard.ts:29`).
  3. Documentar e monitorar `PAGSEGURO_API_TOKEN`/`API_BASE_URL`: `/payments/pix-charge` responde `HttpException('PSP not configured', 503)` enquanto essas chaves estiverem ausentes (`backend-cleaning/src/payments/payments.service.ts:1016-1033`).
  4. Garantir que `payments/payment.state-machine.ts` (que agora declara estados, transições e `canTransition`) continue a ser utilizado nos fluxos de `PaymentIntent` e que a cobertura de `payment.state-machine.spec.ts` evolua quando novos estados surgirem.
  5. Substituir o fallback para `CreateBookingDto.totalPrice` por manipuladores explicitos para cada `pricingType` (`backend-cleaning/src/bookings/bookings.service.ts:452`).
  6. Verificar que o `ThrottlerGuard` global (configurado com `APP_GUARD` em `AppModule`) continue protegendo `/bookings` e `/payments/pix-charge`, ajustando limites via `@Throttle` quando necessário (`backend-cleaning/src/app.module.ts:90-155`, `backend-cleaning/src/bookings/bookings.controller.ts:82`, `backend-cleaning/src/payments/payments.controller.ts:65`).
  7. Documentar `GET /pricing/config` como fonte única para `minHourlyMinutes` e `currency`, mantendo `MIN_HOURLY_MINUTES` centralizado em `backend-cleaning/src/common/constants/pricing.ts` (`backend-cleaning/src/pricing/pricing.controller.ts:83-88`, `backend-cleaning/src/pricing/pricing.controller.spec.ts:1-17`).
  8. Manter `BLOCKED_BOOKING_STATUSES` atualizado (atualmente inclui `PENDING_PROVIDER_CONFIRMATION`) e expandir os testes de conflito sempre que novos status forem introduzidos (`backend-cleaning/src/bookings/bookings.constants.ts:1-8`, `backend-cleaning/src/bookings/bookings.service.spec.ts:152-167`).
  9. Introduzir refresh tokens/rota `/auth/refresh` para evitar re-logins forcados (`backend-cleaning/src/auth/dto/auth-response.dto.ts:1`).
  10. Disponibilizar metricas sem login ou com credencial de servico para facilitar monitoramento (`backend-cleaning/src/metrics/metrics.controller.ts:8`).

## 1) Arquitetura atual (mapa)
- Frontend: o Expo Router mapeia `app/client`, `app/provider` e `app/auth`; os conjuntos `CLIENT_ROUTES`, `PROVIDER_ROUTES` e `AUTH_ROUTES` ficam em `app/routes.ts:13`, `app/routes.ts:27` e `app/routes.ts:55`, e `_layout.tsx` agrupa `AuthProvider`, `AppProvider`, `ProviderRegistrationProvider`, `AppQueryClientProvider` e checa `getBookingsForUser` para renderizar o floating pill de um atendimento ativo (`app/_layout.tsx:1`, `app/_layout.tsx:34`, `app/_layout.tsx:86`).
- Backend: `AppModule` injeta Auth, Bookings, Payments, Providers, Availability, Queues, Metrics, Health, Sentry e Throttler (`backend-cleaning/src/app.module.ts:1`), e `main.ts` inicializa Prometheus, OpenTelemetry, Sentry, CORS, pipes globais e middleware raw-body antes de subir o aplicativo (`backend-cleaning/src/main.ts:1`).
- Banco/Cache/Filas: o Postgres e acessado via `PrismaService` (`backend-cleaning/src/prisma/prisma.service.ts:1`), O `CacheModule` usa KeyvRedis (`backend-cleaning/src/cache/cache.module.ts:1`) com logs de hits/misses em `CacheService` (`backend-cleaning/src/cache/cache.service.ts:1`) e o `QueuesModule` (`backend-cleaning/src/app.module.ts:49`) alimenta jobs de notificacao usados por servicos como `PaymentsService` (`backend-cleaning/src/payments/payments.service.ts:360`).
- Integracoes externas: `PaymentsService` conversa com PagSeguro (`backend-cleaning/src/payments/payments.service.ts:60`), o guard `PspWebhookGuard` valida assinatura/timestamp/replay (`backend-cleaning/src/payouts/guards/psp-webhook.guard.ts:1`), Firebase Admin e inicializado automaticamente (`backend-cleaning/src/main.ts:80`) e o `HttpMetricsMiddleware` coleta latencia/status (`backend-cleaning/src/common/middleware/http-metrics.middleware.ts:1`).

## 2) Backend (NestJS)

### 2.1 Auth & Roles
- [OK] O `JwtAuthGuard` e o `RolesGuard` estao em `backend-cleaning/src/auth/guards/jwt-auth.guard.ts:1` e `backend-cleaning/src/auth/guards/roles.guard.ts:1`, com o `BookingsController` pedindo `JwtAuthGuard`, `RolesGuard` e as roles corretas (`backend-cleaning/src/bookings/bookings.controller.ts:86`). O `AuthController` adiciona `@Throttle` em login e forgot-password (`backend-cleaning/src/auth/auth.controller.ts:86`, `:110`).
- [WARN] O `AuthResponseDto` so retorna `accessToken` e `AuthService.login` nao emite refresh tokens nem possui rota `/auth/refresh`, portanto os clients precisam re-logar apos cada expiracao (`backend-cleaning/src/auth/dto/auth-response.dto.ts:1`, `backend-cleaning/src/auth/auth.service.ts:80`).
- [MISSING] Ainda nao existe persistencia de sessoes ou refresh tokens no backend, o que impede revogar tokens em massa.
- [RISK] Essa ausencia torna a experiencia em dispositivos moveis e scripts long-lived mais fragil, pois qualquer expiracao obriga reautenticacao completa.
- [FIX] Recomenda-se implementar refresh tokens rotativos com endpoint seguro (prioridade P1) e documentar o TTL atual dos JWTs.
-  Esse modelo aumenta a frequencia de re-login em dispositivos moveis e scripts long-lived.
-  Correcoes recomendadas: implementar refresh tokens rotativos com endpoint seguro (prioridade P1) e documentar o TTL dos JWTs.

### 2.2 Bookings & Schedule
- [OK] `POST /bookings` e `/bookings/schedule-and-pay` estao protegidos por JWT/roles (`backend-cleaning/src/bookings/bookings.controller.ts:86`, `:110`), `CreateBookingDto` exige endereco e duracao obrigatorios (`backend-cleaning/src/bookings/dto/create-booking.dto.ts:18`) e o `BookingsService` usa o `BookingStateMachine` (`backend-cleaning/src/bookings/states/booking.state-machine.ts:61`) junto com o `AvailabilityService` (`backend-cleaning/src/availability/availability.service.ts:110`) para validar o slot.
- [INFO] O backend centraliza `MIN_HOURLY_MINUTES = 240` em `backend-cleaning/src/common/constants/pricing.ts:1` e disponibiliza esse valor (mais a `currency: 'BRL'`) via GET `/pricing/config` (`backend-cleaning/src/pricing/pricing.controller.ts:83-88`, `backend-cleaning/src/pricing/pricing.controller.spec.ts:1-17`), garantindo uma fonte única para o mínimo de duração.
- [MISSING] `backend-cleaning/src/bookings/booking.policy.ts:1` continua um placeholder sem policy documentada para transicoes.
- [RISK] `BookingsService.create` ainda depende de um policy documentado para novas transições e precisa manter cobertura total sobre os `pricingType`s existentes antes de abrir espaço para variantes adicionais.
- [FIX] Continuar evoluindo o policy file e documentar as transições de booking enquanto estabilizamos os novos handlers de pricing e a state machine (prioridade P1).

### 2.3 Payments (PIX) & Webhooks
-  `/payments/pix-charge` existe em `backend-cleaning/src/payments/payments.controller.ts:26`, `PaymentsService.createPixCharge` chama PagSeguro com injecao de `PaymentIntentLocker` (`backend-cleaning/src/payments/payment-intent-locker.ts:1`) e o webhook `payments/webhook/pix` passa pelo guard antes do `handlePixWebhook` (`backend-cleaning/src/payments/payments.webhooks.controller.ts:1`, `backend-cleaning/src/payments/payments.service.ts:459`). Quando `PAGSEGURO_API_TOKEN` ou `API_BASE_URL` estao ausentes o handler retorna `HttpException('PSP not configured', HttpStatus.SERVICE_UNAVAILABLE)` antes de gerar qualquer QR, garantindo que o endpoint fique inacessivel enquanto a integracao nao esta configurada (`backend-cleaning/src/payments/payments.service.ts:1016-1033`).
-  A validacao HMAC depende de `PIX_WEBHOOK_SECRET`; na falta dele `validateHmac` retorna false e `handlePaymentWebhook` lanca `ForbiddenException`. O guard `PspWebhookGuard` repete o check e registra `ForbiddenException` se o secret nao existe, exceto quando `ALLOW_INSECURE_WEBHOOKS=true` e o webhook for PIX (`backend-cleaning/src/payments/payments.service.ts:198-260`, `backend-cleaning/src/payouts/guards/psp-webhook.guard.ts:37-70`).
-  [INFO] O bootstrap em `backend-cleaning/src/main.ts:45-90` valida `PIX_WEBHOOK_SECRET`, `psp.webhookSecret`, `PAGSEGURO_API_TOKEN` e `API_BASE_URL` quando `NODE_ENV=production`, e lança `Error` antes de ouvir a porta se algum secret critico estiver ausente para evitar fluxos de PSP incompletos.
-  `backend-cleaning/src/payments/payment.state-machine.ts:1-34` ja declara `PaymentIntentState`, o mapa `PAYMENT_TRANSITIONS` e as funcoes `canTransition`, `assertTransition` e `applyTransition`. O `PaymentsService` importa `canTransition` (`backend-cleaning/src/payments/payments.service.ts:46`) e usa o helper em `handlePaymentWebhook` e em confirmacoes manuais (`backend-cleaning/src/payments/payments.service.ts:311`, `:707`), enquanto `payment.state-machine.spec.ts:1-17` cobre as transicoes validas e invalidas.
-  `logMissingConfigOnce` deduplica os avisos sobre secrets ausentes em ambientes de desenvolvimento/teste, mas em producao os logs ainda sao emitidos a cada evento. `PaymentsService` e `PspWebhookGuard` usam essa funcao para avisar sobre `PAGSEGURO_API_TOKEN`, `API_BASE_URL`, `PIX_WEBHOOK_SECRET` e `psp.webhookSecret` faltando (`backend-cleaning/src/common/logging/missing-config.logger.ts:1-10`, `backend-cleaning/src/payments/payments.service.ts:220-237`, `backend-cleaning/src/payouts/guards/psp-webhook.guard.ts:41-70`).

### 2.4 Providers & Services
-  `ProvidersService` filtra apenas providers aprovados (`backend-cleaning/src/providers/providers.service.ts:1038`) e `BookingsService.create` busca o provider antes de criar um booking (`backend-cleaning/src/bookings/bookings.service.ts:419`).
-  As queries no providers service carregam muitos includes (reviews, availability, services) sem cache, o que pode degradar payloads conforme o volume aumenta (`backend-cleaning/src/providers/providers.service.ts:314`).
-  [INFO] `GET /providers` (search/list) e `GET /providers/:id` reutilizam `CacheService` por 60s (`backend-cleaning/src/providers/providers.service.ts:1015-1505`, `:604-613`, `:1499-1505`); as chaves seguem o padrão `all_approved_providers:search:<JSON dto>` (ex.: `...:"limit":5,"offset":10,"city":"Campinas"...`) e `all_approved_providers:<providerId>`, entregando respostas públicas para Ads-heavy traffic sem recarregar o Postgres.
-  `BookingsService.create` nao verifica se o provider esta `VerificationStatus.APPROVED` antes de aceitar o booking, portanto um prestador pendente ainda pode ser agendado se o front nao bloquear.
-  Isso expoe atendimentos a prestadores em revisao, o que impacta compliance.
-  Validar `verificationStatus === APPROVED` antes de criar o booking e aplicar caches seletivos nos includes volumosos (prioridade P1).

### 2.5 Observabilidade
-  `main.ts` inicializa Prometheus, OpenTelemetry e Sentry, aplica CORS, validation pipe, filtros e raw body para webhooks (`backend-cleaning/src/main.ts:1`), enquanto o `HttpMetricsMiddleware` registra latencia/status (`backend-cleaning/src/common/middleware/http-metrics.middleware.ts:1`) e ha controllers de metricas e health (`backend-cleaning/src/metrics/metrics.controller.ts:1`, `backend-cleaning/src/health/health.controller.ts:1`).
-  O `MetricsController` exige JWT (`backend-cleaning/src/metrics/metrics.controller.ts:8`), portanto integracoes externas precisam da autenticacao de um usuario.
-  O `prometheus.controller` expoe metricas basicas, mas nao ha credenciais dedicadas para scraping automatico (`backend-cleaning/src/metrics/prometheus.controller.ts:1`).
-  A readiness check toca Redis e Postgres e lanca `ServiceUnavailable` se qualquer dependencia falhar (`backend-cleaning/src/health/health.controller.ts:16`).
-  Criar um service account para metricas publicas e alertas de health pode melhorar a operacao (prioridade P1).

## Operacao (Ads-safe)
-  [INFO] `docs/RUNBOOK_ADS_SAFE.md` concentra o checklist de pre-deploy, smoke tests, observabilidade, rollback, ondas de expansao e politicas de mudanca para o lancamento Ads-safe.
-  [INFO] A secao de pre-deploy valida secretos criticos, conexoes de health, throttling global, pricing config e integracoes PagSeguro; o smoke testa booking -> schedule-and-pay, `pix-charge` com PSP ativo e desligado, webhooks e idempotencia.
-  [INFO] Observabilidade foca em WARN/ERROR, metricas de latencia/4xx/5xx, cache de providers TTL 60s e uso do `HttpMetricsMiddleware`; os rollbacks obedecem a limites de 5xx ou falhas no pix-charge.

## 3) Frontend (Expo)

### 3.1 Rotas (Expo Router)
-  As rotas UTILITARIAS estao em `app/routes.ts:13`, `app/routes.ts:27` e `app/routes.ts:55`, e `_layout.tsx` monta provedores de contexto e o floating pill que consome `getBookingsForUser` (`app/_layout.tsx:1`, `app/_layout.tsx:34`, `app/_layout.tsx:86`).
-  `frontend_routes.json` esta disponivel mas nao e consumido automaticamente, entao ha duplicacao de strings nas telas.
-  Nao ha validacao tipada para garantir que o `CLIENT_ROUTES.PROVIDER_DETAILS` seja sempre atualizado junto ao nome da rota.
-  `_layout.tsx` injeta widgets como `NotificationUIService` e responde ao estado de um booking ativo, podendo falhar ao buscar bookings (`app/_layout.tsx:34`, `:86`).
- `useNotificationsSocket` agora interpreta AppEvent (type + dedupeKey + payload), manda ack silencioso para `/notifications/:id/ack` e reconcilia eventos faltantes via `/notifications/stream` ao reconectar/retornar do background.
-  Fortalecer tipos das rotas e documentar o padrao de redirecionamento ajudaria novos devs a usar o router sem errar (prioridade P2).

### 3.2 Fluxo de booking (UI)
-  `app/client/bookings/schedule-service.tsx` invoca `getProviderAvailability`, `getProviderDetails`, `generateDailySlots` e o `createBooking`/`createBookingAndPixCharge` (`app/client/bookings/schedule-service.tsx:35`, `:638`, `:1569`), e `services/bookingService.ts:1` encapsula as chamadas REST.
-  `app/client/bookings/schedule-service.tsx` agora usa `useBookingQuote` + `services/quoteService` para chamar `POST /bookings/quote` (debounce 300ms) e exibir sempre o subtotal/total retornado pelo backend, mantendo `createBooking` alinhado com `totalPrice` calculado e enviando `quoteId`/`quoteHash`.
-  O backend verifica `quoteHash` no `POST /bookings` e responde 409 `PRICE_MISMATCH` com a nova cotação quando detecta divergencia, enquanto o front re-quotta automaticamente, exibe o toast “Preço atualizado” e libera o botão para o cliente reconfirmar.
-  O backend centraliza `MIN_HOURLY_MINUTES = 240` em `backend-cleaning/src/common/constants/pricing.ts:1` e publica esse valor via GET `/pricing/config`, que retorna `minHourlyMinutes` e `currency` (`backend-cleaning/src/pricing/pricing.controller.ts:83-88`, `backend-cleaning/src/pricing/pricing.controller.spec.ts:1-17`). Incentivar o frontend a consultar este endpoint evita divergencias de regra de negocio.
-  Buscar o minimo e o valor final via API/config compartilhada antes de habilitar o botao de agendar reduz discrepancias (prioridade P1).

### 3.3 Provider UI (ProviderID / icones / confianca)
-  A pagina `app/client/explore/[providerId].tsx:1209` importa `BookServiceButton`, `InfoChip` e `SideIcon` para construir a experiencia de confianca, exibindo nota, icones e botao de agendamento fixo.
-  `SideIcon`/`InfoChip` usam assets estaticos e nao exibem dados dinamicos de `verificationStatus` (`components/client/explore/provider/SideIcon.tsx`).
-  Nao ha fallback visual quando um provider nao possui disponibilidade ou esta em revisao; o layout continua o mesmo.
-  O `BookServiceButton` exige autenticacao antes de seguir para `/client/bookings/schedule-service` (`components/client/explore/provider/BookServiceButton.tsx`), mantendo o fluxo protegido.
-  Expor badges reais de confianca com `ProviderDisplayInfo.verificationStatus` melhora a percepcao de seguranca (prioridade P2).

## 4) Seguranca (pontos criticos)
- Webhooks (assinatura + timestamp + replay):  `PaymentsService.validateHmac` e `PspWebhookGuard` validam assinatura e janela de tempo (`backend-cleaning/src/payments/payments.service.ts:198`, `backend-cleaning/src/payouts/guards/psp-webhook.guard.ts:29`).  Ambas as validacoes dependem de secrets de ambiente; sem eles o fluxo inteiro trava.  A cache de replay utiliza Redis e registra `webhookReplay` no banco, limitando replays (`backend-cleaning/src/payouts/guards/psp-webhook.guard.ts:65`).
- Autorizacao por role:  `RolesGuard` aplica `@Roles` e e usado em controllers criticos (`backend-cleaning/src/auth/guards/roles.guard.ts:1`, `backend-cleaning/src/bookings/bookings.controller.ts:86`).  Nao ha refresh tokens, entao revogar acesso forcado fica limitado.
- Rate limiting:  `ThrottlerModule` e configurado via `forRootAsync` em `AppModule` e o `ThrottlerGuard` e registrado como `APP_GUARD`, de forma que todos os endpoints compartilham a guard default enquanto controllers como `AuthController`, `DisputeController`, `PaymentsController` e `BookingsController` usam `@Throttle` para ajustar limites especificos (`backend-cleaning/src/app.module.ts:90-155`, `backend-cleaning/src/auth/auth.controller.ts:86`, `backend-cleaning/src/disputes/dispute.controller.ts:31`, `backend-cleaning/src/payments/payments.controller.ts:65`, `backend-cleaning/src/bookings/bookings.controller.ts:82`). Em especial, `POST /bookings` usa `@Throttle({ limit: 20, ttl: 60 })`, `POST /bookings/schedule-and-pay` usa `@Throttle({ limit: 15, ttl: 60 })` e `POST /payments/pix-charge` usa `@Throttle({ limit: 18, ttl: 60 })`, complementando o limite global default (`throttle.limit`, `throttle.ttl` em `CustomConfigModule`) para manter o tráfego pago seguro sem impactar dev/test.
- Dados sensiveis em logs:  os logs do `AuthService` mostram IDs e roles, nao senhas (`backend-cleaning/src/auth/auth.service.ts:80`).  E preciso manter esse padrao ao adicionar novos logs ou telemetria.

### 4.1 Production secrets (fail-fast)
| Secret | Validado no bootstrap | Enforce runtime |
| --- | --- | --- |
| `PIX_WEBHOOK_SECRET` | `backend-cleaning/src/main.ts:45-90` (fail-fast quando `NODE_ENV=production`) | `PaymentsService.validateHmac` + `PspWebhookGuard` para WEBHOOK PIX |
| `psp.webhookSecret` | `backend-cleaning/src/main.ts:45-90` (fail-fast) | `PspWebhookGuard` + `Payouts` webhooks que assinaturas PSP |
| `PAGSEGURO_API_TOKEN` | `backend-cleaning/src/main.ts:45-90` (fail-fast) | `PaymentsService.createPixCharge` retorna 503 quando ausente e impede criação de QR |
| `API_BASE_URL` | `backend-cleaning/src/main.ts:45-90` (fail-fast) | `PaymentsService.createPixCharge` depende de `appBaseUrl` e o webhook de PIX usa esse host para callbacks outdoors |

## 5) Gap analysis (Docs vs Codigo)
| Regra/feature | Doc | Codigo | Status | Prioridade |
| --- | --- | --- | --- | --- |
| Criacao de booking (cliente) | `BUSINESS_RULES_SPEC.md:7` | `backend-cleaning/src/bookings/bookings.controller.ts:86` | OK | P0 |
| Schedule-and-pay com PIX | `BUSINESS_RULES_SPEC.md:10` | `backend-cleaning/src/bookings/bookings.controller.ts:110`, `backend-cleaning/src/payments/payments.service.ts:875` | OK | P0 |
| Reserva de slot e disponibilidade | `BUSINESS_RULES_SPEC.md:19` | `backend-cleaning/src/availability/availability.service.ts:110` | OK | P1 |
| Criacao de intent PIX | `BUSINESS_RULES_SPEC.md:31` | `backend-cleaning/src/payments/payments.controller.ts:26` | OK | P0 |
| Politica de reembolso | `BUSINESS_RULES_SPEC.md:37` | `backend-cleaning/src/payments/payments.controller.ts:91` | OK | P1 |
| Onboarding de providers | `BUSINESS_RULES_SPEC.md:45` | `backend-cleaning/src/auth/auth.controller.ts:25` | OK | P1 |
| Regras extras de review (open questions) | `BUSINESS_RULES_SPEC.md:102` | nao encontrado | Ausente | P2 |

## 6) Plano de acao
- P0 (24-72h)
  1. *DONE*: o bootstrap já valida `PIX_WEBHOOK_SECRET`, `psp.webhookSecret`, `PAGSEGURO_API_TOKEN` e `API_BASE_URL` em producao e aborta se faltar (`backend-cleaning/src/main.ts:45-90`); manter alertas/monitoramento para esses launches.
  2. Documentar o comportamento de `/payments/pix-charge` quando `PAGSEGURO_API_TOKEN`/`API_BASE_URL` estiverem ausentes (resposta `HttpException('PSP not configured', HttpStatus.SERVICE_UNAVAILABLE)`), para que o time saiba habilitar o PSP apenas quando os segredos existirem (`backend-cleaning/src/payments/payments.service.ts:1016-1033`).
  3. Garantir que o `ThrottlerGuard` global (`APP_GUARD` em `AppModule`) continue ativo e que os `@Throttle` de `Auth`, `Dispute`, `Payments` e `Bookings` ajustem limites pontuais (`backend-cleaning/src/app.module.ts:90-155`, `backend-cleaning/src/auth/auth.controller.ts:86`, `backend-cleaning/src/disputes/dispute.controller.ts:31`, `backend-cleaning/src/payments/payments.controller.ts:65`, `backend-cleaning/src/bookings/bookings.controller.ts:82`).
- P1 (1-2 semanas)
  1. Garantir que `payments/payment.state-machine.ts` continue a documentar e testar as transicoes atuais (`canTransition`, `assertTransition`, `applyTransition`) e que quaisquer novos estados alimentem `payment.state-machine.spec.ts` (`backend-cleaning/src/payments/payment.state-machine.ts:1-34`, `backend-cleaning/src/payments/payment.state-machine.spec.ts:1-17`).
  2. Tratar cada `pricingType` em `BookingsService.create` e eliminar o fallback para `CreateBookingDto.totalPrice` (`backend-cleaning/src/bookings/bookings.service.ts:452`).
  3. Documentar `GET /pricing/config` como a fonte de `minHourlyMinutes` e `currency` para os clientes, usando a constante `MIN_HOURLY_MINUTES` de `backend-cleaning/src/common/constants/pricing.ts:1` (`backend-cleaning/src/pricing/pricing.controller.ts:83-88`).
  4. Manter `BLOCKED_BOOKING_STATUSES` sincronizado (inclui `PENDING_PROVIDER_CONFIRMATION`) e expandir os testes de conflito quando novos status forem adicionados (`backend-cleaning/src/bookings/bookings.constants.ts:1-8`, `backend-cleaning/src/bookings/bookings.service.spec.ts:152-167`).
- P2 (backlog)
  1. Documentar as regras de review mencionadas em `BUSINESS_RULES_SPEC.md:102` e implementa-las no backend.
  2. Enriquecer a UI do provider com badges reais de `verificationStatus` (`app/client/explore/[providerId].tsx:1209`, `components/client/explore/provider/SideIcon.tsx`).
  3. Adicionar testes de integracao para a state machine de bookings e para os webhooks PIX.

## 7) Apendice: Comandos usados
- `pwd`
- `ls`
- `Get-ChildItem -Name backend-cleaning`
- `Get-ChildItem backend-cleaning/src`
- `Get-ChildItem backend-cleaning/src/bookings`
- `Get-ChildItem backend-cleaning/src/bookings/states`
- `Get-Content backend-cleaning/src/bookings/bookings.service.ts -TotalCount 200`
- `Get-Content backend-cleaning/src/bookings/states/booking.state-machine.ts -TotalCount 200`
- `Get-Content backend-cleaning/src/bookings/states/booking.state-machine.ts -TotalCount 400`
- `rg -n "Pix" backend-cleaning/src/payments/payments.service.ts`
- `Get-Content backend-cleaning/src/payments/payments.service.ts | Select-Object -Skip 820 -First 200`
- `Get-Content backend-cleaning/src/payments/payments.service.ts | Select-Object -Skip 420 -First 200`
- `Get-Content backend-cleaning/src/payments/payments.webhooks.controller.ts`
- `Get-Content backend-cleaning/src/payouts/guards/psp-webhook.guard.ts`
- `rg -n "MIN_HOURLY_MINUTES" backend-cleaning/src/bookings`
- `Get-Content backend-cleaning/src/bookings/dto/create-booking.dto.ts`
- `Select-String -Path backend-cleaning/src/bookings/states/booking.state-machine.ts -Pattern "bookingTransitions" -Context 2`
- `Select-String -Path backend-cleaning/src/bookings/bookings.controller.ts -Pattern "schedule-and-pay" -Context 2`
- `Select-String -Path backend-cleaning/src/common/constants/pricing.ts -Pattern "MIN_HOURLY_MINUTES"`
- `Select-String -Path backend-cleaning/src/bookings/dto/create-booking.dto.ts -Pattern "requestedDurationMinutes" -Context 2`
- `Select-String -Path backend-cleaning/src/payments/payments.service.ts -Pattern "async createPixCharge"`
- `Select-String -Path backend-cleaning/src/payments/payments.service.ts -Pattern "handlePixWebhook"`
- `Get-ChildItem backend-cleaning/src/availability`
- `Select-String -Path backend-cleaning/src/availability/availability.service.ts -Pattern "BookingStatus"`
- `Get-ChildItem backend-cleaning/src/metrics`
- `Get-Content backend-cleaning/src/metrics/metrics.controller.ts`
- `Get-ChildItem backend-cleaning/src/health`
- `Get-Content backend-cleaning/src/health/health.controller.ts`
- `Get-Content backend-cleaning/src/app.module.ts | Select-Object -First 200`
- `Get-Content backend-cleaning/src/common/middleware/http-metrics.middleware.ts`
- `Get-Content backend-cleaning/src/cache/cache.service.ts | Select-Object -First 200`
- `Get-Content backend-cleaning/src/cache/cache.module.ts`
- `Get-Content backend-cleaning/src/prisma/prisma.service.ts | Select-Object -First 200`
- `Get-ChildItem app`
- `Get-ChildItem app/client/explore`
- `Get-ChildItem app/client/bookings`
- `Get-Content app/routes.ts`
- `Get-Content -LiteralPath app/client/explore/[providerId].tsx | Select-Object -First 200`
- `Select-String -LiteralPath "app/client/explore/[providerId].tsx" -Pattern "BookServiceButton" -Context 5`
- `Get-ChildItem services`
- `Get-Content services/bookingService.ts | Select-Object -First 200`
- `Get-Content services/bookingService.ts | Select-Object -Skip 200 -First 200`
- `Get-Content components/client/explore/provider/BookServiceButton.tsx`
- `Get-Content components/client/explore/provider/InfoChip.tsx`
- `Get-Content components/client/explore/provider/SideIcon.tsx`
- `Get-Content -LiteralPath "app/client/bookings/schedule-service.tsx" | Select-Object -First 200`
- `Select-String -Path "app/client/bookings/schedule-service.tsx" -Pattern "MIN_HOURLY_MINUTES"`
- `Select-String -Path "app/client/bookings/schedule-service.tsx" -Pattern "generateDailySlots"`
- `Select-String -Path "app/client/bookings/schedule-service.tsx" -Pattern "useBookingPricing"`
- `Get-Content utils/useBookingPricing.ts`
- `Get-Content utils/timeSlots.ts`
- `rg -n "PIX" BUSINESS_RULES_SPEC.md`
- `Get-Content BUSINESS_RULES_SPEC.md | Select-Object -First 200`
- `Get-ChildItem docs`
- `Get-Content backend-cleaning/src/auth/auth.service.ts | Select-Object -First 200`
- `Select-String -Path backend-cleaning/src/auth/auth.controller.ts -Pattern "@Throttle" -Context 1`
- `Select-String -Path backend-cleaning/src/bookings/bookings.service.ts -Pattern "status: {" -Context 2`
- `Select-String -Path backend-cleaning/src/providers/providers.service.ts -Pattern "status: { in" -Context 2`
- `Select-String -Path backend-cleaning/src/bookings/bookings.service.ts -Pattern "const provider = await"`
- `rg -n "handlePaymentWebhook" backend-cleaning/src`
- `git rev-parse --short HEAD`
- `git branch --show-current`
- `Get-Date -Format yyyy-MM-dd`
