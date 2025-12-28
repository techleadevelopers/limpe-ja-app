# STATE OF PROJECT
> Data: 2025-12-21 | Commit: 47db0db2 | Branch: main

## 0) TL;DR (1 pagina)
- Status geral: O backend NestJS entrega autenticacao JWT/roles, bookings (slots, regras minimas e state machine), payments PIX com webhooks e observabilidade (Prometheus, OTEL e health), enquanto o frontend Expo Router ja percorre explore, bookings e provider pages; o ciclo esta pronto para um beta controlado, mas depende de ajustes de configuracao (PIX/PSP secrets, rate limiting e consistencia de constantes).
- Testes unitários: `npx jest --config test/jest-unit.json --runInBand` agora passa todas as 30 suites (incluindo os dois testes restaurados em `test/unit/`), usando a nova configuração `test/jest-unit.json`, ajustando `AppController/AppService` e `PspWebhookGuard`, e cobrindo o novo comportamento de throttling nos endpoints de bookings/pagamentos e webhooks. Os warnings visíveis ocorrem apenas porque os secrets de webhook/PIX e o PSP token ainda faltam na `.env`.
- Top 10 riscos:
  1. `backend-cleaning/src/payments/payments.service.ts:198`  sem `PIX_WEBHOOK_SECRET`, `validateHmac` sempre falha e `handlePaymentWebhook` responde `ForbiddenException`, impedindo confirmacoes de PIX.
  2. `backend-cleaning/src/payouts/guards/psp-webhook.guard.ts:29`  quando `psp.webhookSecret` nao esta configurado o guard lanca `ForbiddenException` e bloqueia todos os webhooks PSP.
  3. `backend-cleaning/src/payments/payments.service.ts:157`  a ausencia de `PAGSEGURO_API_TOKEN` ou `API_BASE_URL` coloca o servico em modo placeholder, mas `/payments/pix-charge` continua exposto entregando QRs que nunca chegam ao PSP.
  4. `backend-cleaning/src/payments/payment.state-machine.ts:1`  o arquivo esta vazio, de forma que estados de pagamento sao tratados de forma ad hoc e correcoes futuras podem quebrar a consistencia do ledger.
  5. `backend-cleaning/src/bookings/bookings.service.ts:452`  tipos de precificacao desconhecidos usam o `totalPrice` enviado pelo cliente, permitindo manipular valores ate o backend suportar o novo tipo.
  6. `backend-cleaning/src/app.module.ts:68` e `backend-cleaning/src/bookings/bookings.controller.ts:86`  apenas Auth e Disputes recebem `ThrottlerGuard`, deixando `/bookings` e `/payments/pix-charge` expostos a DoS/brute-force.
  7. `app/client/bookings/schedule-service.tsx:53` vs `backend-cleaning/src/common/constants/pricing.ts:1`  o minimo de 4h e duplicado no front, sem uma fonte compartilhada, entao qualquer alteracao no backend quebra o UI sem aviso.
  8. `backend-cleaning/src/bookings/bookings.service.ts:583`  o check de conflito considera apenas os statuses `[PENDING..RESCHEDULED]`, ignorando `PENDING_PROVIDER_CONFIRMATION`, o que permite bookings sobrepostos.
  9. `backend-cleaning/src/auth/dto/auth-response.dto.ts:1`  o login retorna apenas `accessToken` e nao ha rota de refresh, forcando re-logins quando o token expira.
  10. `backend-cleaning/src/metrics/metrics.controller.ts:8`  todas as metricas ficam atras de `JwtAuthGuard`, obrigando ferramentas externas a obter um JWT valido.
- Top 10 proximos passos:
  1. Validar `PIX_WEBHOOK_SECRET` durante o bootstrap e abortar se faltar (`backend-cleaning/src/payments/payments.service.ts:198`).
  2. Garantir que `psp.webhookSecret` esteja presente antes de aceitar webhooks (`backend-cleaning/src/payouts/guards/psp-webhook.guard.ts:29`).
  3. Impedir `/payments/pix-charge` quando `PAGSEGURO_API_TOKEN`/`API_BASE_URL` estiverem ausentes (`backend-cleaning/src/payments/payments.service.ts:157`).
  4. Implementar `payments/payment.state-machine.ts` e reaproveita-lo nas transicoes de `PaymentIntent` para manter o ledger previsivel (arquivo atual vazio).
  5. Substituir o fallback para `CreateBookingDto.totalPrice` por manipuladores explicitos para cada `pricingType` (`backend-cleaning/src/bookings/bookings.service.ts:452`).
  6. Cobrir `/bookings` e `/payments/pix-charge` com `ThrottlerGuard` ou registrar o guard globalmente (`backend-cleaning/src/app.module.ts:68`, `backend-cleaning/src/bookings/bookings.controller.ts:86`).
  7. Publicar `minHourlyMinutes` via API ou config compartilhada para que `app/client/bookings/schedule-service.tsx:53` nao duplique `backend-cleaning/src/common/constants/pricing.ts:1`.
  8. Ampliar o check de conflito para considerar `PENDING_PROVIDER_CONFIRMATION` e outras flags pendentes (`backend-cleaning/src/bookings/bookings.service.ts:583`).
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
- [WARN] O minimo de 240 minutos aparece em `backend-cleaning/src/common/constants/pricing.ts:1`, mas o front repete `MIN_HOURLY_MINUTES` em `app/client/bookings/schedule-service.tsx:53`, aumentando o risco de divergencia quando a regra mudar.
- [MISSING] `backend-cleaning/src/bookings/booking.policy.ts:1` continua um placeholder sem policy documentada para transicoes.
- [RISK] `BookingsService.create` cai em `CreateBookingDto.totalPrice` quando encontra um `pricingType` desconhecido (`backend-cleaning/src/bookings/bookings.service.ts:452`) e o check de conflito revisa apenas `[PENDING..RESCHEDULED]` (`backend-cleaning/src/bookings/bookings.service.ts:583`), deixando brechas para bookings sobrepostos com `PENDING_PROVIDER_CONFIRMATION`.
- [FIX] Completar o policy file, tratar cada `pricingType` separadamente e estender o check de conflitos a todas as flags pendentes (prioridade P1).

### 2.3 Payments (PIX) & Webhooks
-  `/payments/pix-charge` existe em `backend-cleaning/src/payments/payments.controller.ts:26`, `PaymentsService.createPixCharge` chama PagSeguro com injecao de `PaymentIntentLocker` (`backend-cleaning/src/payments/payment-intent-locker.ts:1`) e o webhook `payments/webhook/pix` passa pelo guard antes do `handlePixWebhook` (`backend-cleaning/src/payments/payments.webhooks.controller.ts:1`, `backend-cleaning/src/payments/payments.service.ts:459`).
-  A validacao HMAC depende de `PIX_WEBHOOK_SECRET`; na falta dele `validateHmac` retorna false e `handlePaymentWebhook` lanca `ForbiddenException` (`backend-cleaning/src/payments/payments.service.ts:198`).
-  `backend-cleaning/src/payments/payment.state-machine.ts:1` esta vazio, entao nao ha uma camada unica para manter o fluxo de estados de pagamento.
-  A ausencia de `PAGSEGURO_API_TOKEN`/`API_BASE_URL` mantem o QR exposto mesmo sem integracao ativa (`backend-cleaning/src/payments/payments.service.ts:157`).
-  Falhar rapido sem esses secrets, implementar a state machine e adicionar testes de webhook sao correcoes P0/P1.

### 2.4 Providers & Services
-  `ProvidersService` filtra apenas providers aprovados (`backend-cleaning/src/providers/providers.service.ts:1038`) e `BookingsService.create` busca o provider antes de criar um booking (`backend-cleaning/src/bookings/bookings.service.ts:419`).
-  As queries no providers service carregam muitos includes (reviews, availability, services) sem cache, o que pode degradar payloads conforme o volume aumenta (`backend-cleaning/src/providers/providers.service.ts:314`).
-  `BookingsService.create` nao verifica se o provider esta `VerificationStatus.APPROVED` antes de aceitar o booking, portanto um prestador pendente ainda pode ser agendado se o front nao bloquear.
-  Isso expoe atendimentos a prestadores em revisao, o que impacta compliance.
-  Validar `verificationStatus === APPROVED` antes de criar o booking e aplicar caches seletivos nos includes volumosos (prioridade P1).

### 2.5 Observabilidade
-  `main.ts` inicializa Prometheus, OpenTelemetry e Sentry, aplica CORS, validation pipe, filtros e raw body para webhooks (`backend-cleaning/src/main.ts:1`), enquanto o `HttpMetricsMiddleware` registra latencia/status (`backend-cleaning/src/common/middleware/http-metrics.middleware.ts:1`) e ha controllers de metricas e health (`backend-cleaning/src/metrics/metrics.controller.ts:1`, `backend-cleaning/src/health/health.controller.ts:1`).
-  O `MetricsController` exige JWT (`backend-cleaning/src/metrics/metrics.controller.ts:8`), portanto integracoes externas precisam da autenticacao de um usuario.
-  O `prometheus.controller` expoe metricas basicas, mas nao ha credenciais dedicadas para scraping automatico (`backend-cleaning/src/metrics/prometheus.controller.ts:1`).
-  A readiness check toca Redis e Postgres e lanca `ServiceUnavailable` se qualquer dependencia falhar (`backend-cleaning/src/health/health.controller.ts:16`).
-  Criar um service account para metricas publicas e alertas de health pode melhorar a operacao (prioridade P1).

## 3) Frontend (Expo)

### 3.1 Rotas (Expo Router)
-  As rotas UTILITARIAS estao em `app/routes.ts:13`, `app/routes.ts:27` e `app/routes.ts:55`, e `_layout.tsx` monta provedores de contexto e o floating pill que consome `getBookingsForUser` (`app/_layout.tsx:1`, `app/_layout.tsx:34`, `app/_layout.tsx:86`).
-  `frontend_routes.json` esta disponivel mas nao e consumido automaticamente, entao ha duplicacao de strings nas telas.
-  Nao ha validacao tipada para garantir que o `CLIENT_ROUTES.PROVIDER_DETAILS` seja sempre atualizado junto ao nome da rota.
-  `_layout.tsx` injeta widgets como `NotificationUIService` e responde ao estado de um booking ativo, podendo falhar ao buscar bookings (`app/_layout.tsx:34`, `:86`).
-  Fortalecer tipos das rotas e documentar o padrao de redirecionamento ajudaria novos devs a usar o router sem errar (prioridade P2).

### 3.2 Fluxo de booking (UI)
-  `app/client/bookings/schedule-service.tsx` invoca `getProviderAvailability`, `getProviderDetails`, `generateDailySlots` e o `createBooking`/`createBookingAndPixCharge` (`app/client/bookings/schedule-service.tsx:35`, `:638`, `:1569`), e `services/bookingService.ts:1` encapsula as chamadas REST.
-  O subtotal e calculado localmente pelo hook `useBookingPricing` (`utils/useBookingPricing.ts:1`), sem garantir sincronizacao com o `dynamicFinalPrice` calculado no backend (`backend-cleaning/src/bookings/bookings.service.ts:500`).
-  O front nao confirma com o backend o valor final antes de gerar o QR, entao mudancas nas regras de preco podem rejeitar o pagamento no ultimo momento.
-  `MIN_HOURLY_MINUTES` e replicado em `app/client/bookings/schedule-service.tsx:53`, tornando o UI quebravel se o backend alterar o minimo (`backend-cleaning/src/common/constants/pricing.ts:1`).
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
- Rate limiting:  `ThrottlerModule` e configurado em `app.module.ts:68`, mas  apenas `AuthController` e `DisputeController` adicionam `ThrottlerGuard` (`backend-cleaning/src/auth/auth.controller.ts:86`, `backend-cleaning/src/disputes/dispute.controller.ts:31`), deixando o resto do trafego sem protecao.
- Dados sensiveis em logs:  os logs do `AuthService` mostram IDs e roles, nao senhas (`backend-cleaning/src/auth/auth.service.ts:80`).  E preciso manter esse padrao ao adicionar novos logs ou telemetria.

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
  1. Validar `PIX_WEBHOOK_SECRET` e `psp.webhookSecret` no bootstrap para nao subir sem essas secrets (`backend-cleaning/src/payments/payments.service.ts:198`, `backend-cleaning/src/payouts/guards/psp-webhook.guard.ts:29`).
  2. Bloquear `/payments/pix-charge` quando `PAGSEGURO_API_TOKEN`/`API_BASE_URL` nao estiverem configurados (`backend-cleaning/src/payments/payments.service.ts:157`).
  3. Cobrir `/bookings` e `/payments/pix-charge` com `ThrottlerGuard` ou registrar o guard globalmente (`backend-cleaning/src/app.module.ts:68`, `backend-cleaning/src/bookings/bookings.controller.ts:86`).
- P1 (1-2 semanas)
  1. Implementar a state machine do pagamento em `payments/payment.state-machine.ts` e reaproveitar nas atualizacoes de `PaymentIntent` (`backend-cleaning/src/payments/payment.state-machine.ts:1`).
  2. Tratar cada `pricingType` em `BookingsService.create` e eliminar o fallback para `CreateBookingDto.totalPrice` (`backend-cleaning/src/bookings/bookings.service.ts:452`).
  3. Publicar o valor minimo (4h) via API/config comum para que o front nao duplique a constante (`backend-cleaning/src/common/constants/pricing.ts:1`, `app/client/bookings/schedule-service.tsx:53`).
  4. Expandir o check de conflito para incluir `PENDING_PROVIDER_CONFIRMATION` e outras flags pendentes (`backend-cleaning/src/bookings/bookings.service.ts:583`).
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
