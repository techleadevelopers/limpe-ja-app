Documentacao Oficial LimpeJa
================================

Esta documentacao descreve a plataforma LimpeJa conforme o estado atual do repositorio `relax-app`. Ela consolida o funcionamento do backend (`backend-cleaning`), do aplicativo Expo/React Native (`app`), dos servicos compartilhados (`services`) e das tipagens (`types`). O objetivo e alinhamento tecnico 100% com o codigo atual, cobrindo fluxos principais, integracoes, dependencias e responsabilidades de cada modulo.

1. Visao Geral
--------------

- **Proposito**: Marketplace de servicos de limpeza que conecta clientes a prestadores. O produto cobre cadastro, verificacao, exploracao de servicos, agendamentos, pagamentos PIX, missao e fidelidade, chat, suporte e disputas.
- **Monorepo**: Diretorios principais:
  - `backend-cleaning`: API NestJS com Prisma/PostgreSQL, Bull/Redis, Sentry, Firebase Admin, Google Cloud.
  - `app`: Frontend mobile Expo Router com rotas por papel (`(auth)`, `(client)`, `(provider)`, `(common)`).
  - `services`: Camada de integracao REST usando Axios, com interceptores centralizados.
  - `types/backend`: Tipos TypeScript espelhando o schema Prisma e DTOs da API.
  - Outros: `components`, `constants`, `contexts`, `hooks`, `i18n`, `utils` e scripts auxiliares.
- **Fluxos chave**:
  1. Onboarding de cliente ou prestador (com geocodificacao).
  2. Exploracao de prestadores e criacao de booking (com cupons, pricing dinamico, missao).
  3. Pagamento via PIX, atualizacao de ledger, notificacoes e chat.
  4. Conclusao, reviews, loyalty, missoes e ranking.
  5. Suporte, disputas e resolucoes financeiras.

2. Backend LimpeJa (`backend-cleaning`)
---------------------------------------

### 2.1 Tecnologias e Configuracao
- **Framework**: NestJS + TypeScript.
- **Banco**: PostgreSQL com extensao PostGIS.
- **ORM**: Prisma (`prisma/schema.prisma` contem modelos, enums e indices).
- **Fila**: Bull + Redis (`queues`).
- **Observabilidade**: Sentry (`src/main.ts` e `@sentry/nestjs`), logs estruturados e metricas via `Logger`.
- **Configuracao**: `src/config` expande `ConfigModule`, validando variaveis (DB, Redis, GCS, Stripe/Pagar.me, Sentry).
- **Bootstrap**: `src/main.ts`
  - ValidationPipe com mensagens localizadas.
  - AllExceptionsFilter com i18n e padronizacao de respostas.
  - CORS whitelist (`localhost`, backend Railway).
  - Swagger em `/api`.
  - Inicializacao condicional do Firebase Admin (automatico ou via credencial).

### 2.2 Estrutura Modular
- `src/app.module.ts`: Importa modulos de dominio (auth, users, providers, services, bookings, payments, offers, loyalty, missions, support, disputes, safety, dashboard, metrics, referrals, queues, admin, locks, geocoding).
- Modulos principais:
  - **Auth**: Registro/login clientes e provedores, JWT, roles, guards HTTP e WebSocket.
  - **Users/Clients/Providers**: Perfis, geocodificacao, KYC, upload de documentos via `document-processing`.
  - **Provider Services**: Catalogo de servicos ofertados, pricing type (fixed, hourly, by size, custom).
  - **Bookings**:
    - `bookings.service.ts`: Cria booking com Redis lock, precificacao, cupons, loyalty/missions, notificacoes.
    - Atualiza status, cancela, resolve disputas e gera ledger (earning, fee, refund).
    - Endpoints complementares: verificacao de chat ativo, detalhes e listagens.
  - **Payments/Payouts/Earnings**: Intencoes PIX, conciliacao, ledger de creditos/debitos, take rate, gerenciamento de saques.
  - **Offers/Coupons/Loyalty/Missions/Ranking**: Promocoes dirigidas, pontos, missao baseada em eventos, boosts e gamificacao.
  - **Support/Disputes/Notifications**: Tickets com SLA, mensagens, escalonamento; disputas com workflow; envio de push/email.
  - **Queues**: `BullModule` configurado com filas (`verification`, `notifications`, `disputes`, `data_export`, `subscription-generation`, `emails`, `support-escalations`, `payouts`). `queues.service.ts` padroniza add/remove, status e retry.
  - **Geocoding/Location**: Integracao com Google Maps; `verification/document-processing` usa Google Cloud Vision para OCR e liveness.
  - **Metrics/Dashboard**: Consolida dados de prestadores (aceitacao, resposta), rankings e dashboards administrativos.

### 2.3 Modelo de Dados (Prisma)
- Enum principais (`UserRole`, `VerificationStatus`, `BookingStatus`, `PricingType`, `TransactionType`, `SupportTicketStatus`, `MissionKind`).
- Modelos core: `User`, `Client`, `Provider`, `ProviderService`, `Service`, `Address`, `Booking`, `PaymentIntent`, `Transaction`, `LedgerEntry`, `Payout`, `Coupon`, `Offer`, `LoyaltyPoint`, `Mission`, `MissionProgress`, `SupportTicket`, `SupportMessage`, `Dispute`, `Review`.
- Campos especializados:
  - Geoposicionamento (`Address` com latitude/longitude).
  - PIX (`PixKey`, `PaymentIntent.status`).
  - Gamificacao (`provider.badges`, `rankingBoost` placeholders).
  - Logs de SLA de suporte, historico de missoes e progressos.

### 2.4 Fluxos Backend Criticos
1. **Criacao de Booking** (`BookingsService.create`):
   - Lock Redis para evitar conflitos.
   - Validacao de disponibilidade e preco via `PricingService`.
   - Aplicacao de cupom (`CouponsService`) e loyalty/missions.
   - Criacao de intent PIX (`PaymentsService`) e notificacao (fila).
2. **Atualizacao/Cancelamento**:
   - `updateBookingStatus`, `cancelBooking`, `resolveDispute`.
   - Ledger entries idempotentes para earnings, fees e refunds.
   - Notificacoes para cliente e provedor.
3. **Metricas de Provedor**:
   - `providers.service.ts` calcula `acceptanceRate` (ultimos 30 dias) e `averageResponseTime` placeholder (necessita integracao real com chat).
   - `getProviderOffers` combina ofertas gerais e especificas.
4. **Verificacao e KYC**:
   - Upload para GCS ou armazenamento local, OCR/liveness via `DocumentProcessingService`.
   - Estados de `VerificationStatus` progressivos.
5. **Suporte e Disputas**:
   - Tickets com SLA (fila `support-escalations`).
   - Disputas geram refunds e notificacoes; resolucao atualiza ledger e status.

3. Aplicativo Expo (`app`)
--------------------------

### 3.1 Fundamentos
- **Expo Router**: Estrutura de rotas por papel.
  - `_layout.tsx`: Autenticacao, sockets (`socket.io-client`), Sentry, Toast, overlay global e pill de booking ativo para provedores.
  - Layouts especificos em `(client)/_layout.tsx`, `(provider)/_layout.tsx`, `(auth)/_layout.tsx`.
- **Contextos**:
  - `AuthContext`: Estado de sessao, login/logout, refresh via `userService`, integracao com `pushService` e interceptores 401.
  - `AppContext`: Temas, configuracoes gerais.
  - `ProviderRegistrationContext`: Wizard de onboarding de prestador.
- **Query Client**: `components/provider/query-client-provider.tsx` com @tanstack/react-query (staleTime 5 min, retries 2).
- **Styles & Assets**: `constants/appStyles.ts`, `constants/icons3d`, `assets/` para imagens, `styles/` para temas.
- **Internacionalizacao**: `i18n` com `react-i18next`; strings em `i18n/locales/pt-BR.json` e arquivo backend equivalente.

### 3.2 Servicos Frontend (camada `services`)
- `api.ts`: Axios configurado com:
  - Descoberta de base URL (Expo extra, env, fallback local).
  - Interceptor request: token JWT, cabecalho Idempotency-Key (paths sensiveis), X-Client-Request-Id.
  - Interceptor response: retry exponencial, modo silencioso (`meta.silent`), dedupe de toasts, fallback guest em `/users/me`, limpeza de sessao em 401.
- Servicos especializados:
  - `authService.ts`: Login, registro (cliente/provedor), logout, refresh (fallback), AsyncStorage.
  - `bookingService.ts`: CRUD de bookings, normalizacao de status (CANCELED↔CANCELLED), checkActiveChatBooking.
  - `providerService.ts`: Detalhes, metrics, offers, dashboard, availability, upload de avatar, search.
  - Outros: `categoryService`, `couponService`, `dashboardService`, `missionService`, `notificationService`, `paymentService`, `supportService`, etc., todos alinhados aos endpoints do backend.
- Adapters (`services/adapters/*`): Normalizam enums, status e DTOs.

### 3.3 Modulos do App

#### Autenticacao (`app/(auth)`)
- Telas de login, registro cliente (`client-register.tsx`), registro prestador multi-etapas.
- Validacoes e feedbacks integrados com `NotificationUIService`.

#### Area do Cliente (`app/(client)`)
- **Explore** (`app/(client)/explore`):
  - Home com `CarouselBannerItem`, `SecaoPrestadores`, `HorizontalMiniGrid`, `RecomendacaoCard`.
  - Tela de detalhe do prestador (`[providerId].tsx`): animacoes com Animated API, chips de info, banner de seguranca, offers filtradas, reviews, integracao com chat e `BookServiceButton`.
  - Estilos compartilhados em `styles/providerStyles.ts`.
- **Bookings**:
  - Lista (`bookings/index.tsx`): filtros animados, normalizacao de status, integracao com `getBookingsForUser`.
  - Detalhe (`bookings/[bookingId].tsx`) e sucesso (`bookings/success.tsx`).
  - Componentes: `BookingSummaryCard`, `SuccessPixInfo`, `SecurityInfoSection`.
- **Offers/Missions/Loyalty/Ranking**: Telas para cupons ativos, progresso de missoes, ranking gamificado, notificacoes.
- **Support**: Abertura de ticket, acompanhamento e integracao com endpoints de suporte.

#### Area do Prestador (`app/(provider)`)
- **Dashboard** (`dashboard.tsx`): Cards com ganhos, proximos agendamentos, metricas, reviews recentes.
- **Agenda / Disponibilidade**: `schedule/manage-availability.tsx` com edicao de slots.
- **Servicos**: `profile/edit-services.tsx`.
- **Bookings Ativos**: `active-booking/[bookingId].tsx` com status em tempo real.
- **Mensagens**: Integracao chat (socket) condicionada a booking ativo.
- **Retiradas**: `withdraw/index.tsx` e `earnings.tsx`.

#### Rotas Comuns (`app/(common)`)
- Feedbacks, termos e componentes reutilizados.

### 3.4 UI/UX e Comportamentos
- **Animacoes**: Uso intensivo de `Animated` (pulsing, fade, scale) e `Easing`.
- **Feedbacks**: `NotificationUIService` centraliza toasts (sucesso/info/erro), `OverlayMessage.tsx` para alertas globais.
- **Acessibilidade**: Uso de `useSafeAreaInsets`, `Platform.select` para sombra/elevation.
- **Chat/GPS**: Chat liberado via `checkActiveChatBooking`; mapa placeholder com notificacao informativa.
- **Fallbacks**: Imagens placeholder, filtro ultra agressivo de offers com descricao suspeita, reviews mock para Joana quando necessario (dados de demonstração).

4. Tipos Compartilhados (`types/backend`)
-----------------------------------------

- Diretoria `types/backend` contem interfaces e enums:
  - `auth.ts`: `AuthResponse`, `UserProfile`, `VerificationStatus`, `UserRole`.
  - `bookings.ts`: `BookingStatus`, `CreateBookingDto`, `BookingDetails`, `BookingAddress`, `BookingPricing`.
  - `providers.ts`: `ProviderDisplayInfo`, `ProviderMetrics`, `ProviderDashboard`, `ProviderTransaction`, `ProviderAvailability`.
  - `provider-service.ts`, `offers.ts`, `payments.ts`, `support.ts`, etc.
- Tipos refletem fielmente os DTOs do backend (`Prisma` + DTOs Nest); qualquer alteracao no backend deve ser replicada aqui para manter type safety na camada de servicos e componentes React.
- Adapters garantem consistencia (ex.: `TransactionType`, `PricingType`, `SupportTicketStatus`).

5. Fluxos End-to-End
--------------------

### 5.1 Onboarding Cliente
1. Registro em `auth/register/client` com endereco completo (`CreateAddressDto`) e opcional `referralCode`.
2. Geocodificacao e criacao de `Client` e `Address`.
3. AuthContext armazena token, role e perfil; `useAuth` disponibiliza `isAuthenticated`.
4. Usuario redirecionado para `(client)/explore`.

### 5.2 Onboarding Prestador
1. Formulario multi-etapas com dados pessoais, documentos, experiencia, disponibilidade.
2. `ProviderRegistrationContext` gerencia progresso. `VerificationStatus` inicia como `PENDING_INITIAL_REVIEW`.
3. Upload de documentos via `DocumentProcessingService` (GCS + Vision).
4. Dashboard bloqueado ate aprovacao; rotas controladas em `_layout.tsx`.

### 5.3 Criacao de Booking
1. Cliente escolhe prestador na tela de detalhes, aciona `BookServiceButton`.
2. Modal de agendamento envia `CreateBookingDto` (`scheduledDate`, `scheduledTime`, endereco, preco, cupom).
3. Backend cria booking com PIX (intent) e retorna `BookingDetails`.
4. App mostra tela de sucesso com QR PIX (`SuccessPixInfo`), overlay de status e notificacoes.
5. `FloatingActiveServicePill` monitora bookings proximos/in-progress (polling em `getBookingsForUser`).

### 5.4 Chat e Comunicacao
1. `checkActiveChatBooking` valida se ha booking confirmado/in-progress entre cliente e prestador.
2. Se permitido, rota `/messages/[chatId]` e liberada com parametros de destinatario.
3. Senao, `NotificationUIService.showInfo` informa indisponibilidade (sem alert blocking).

### 5.5 Conclusao e Feedback
1. Ao completar booking, backend gera `LedgerEntry` (earning, fee) e atualiza `BookingStatus`.
2. Cliente pode avaliar (`ReviewCard`), contribuindo para `ProviderDisplayInfo.reviews`.
3. Missao/loyalty atualizadas e exibidas em `(client)/missions` e `(client)/metrics`.

### 5.6 Suporte e Disputa
1. Cliente ou provedor abre ticket (`supportService`).
2. Backend cria `SupportTicket`, processa mensagens, monitora SLA (fila).
3. Disputas resolvidas recalculam ledger, notificam ambas as partes e podem gerar reembolso PIX.

6. Seguranca, Compliance e Observabilidade
-----------------------------------------

- **Auth**: JWT stateless. Guards para papel (CLIENT, PROVIDER, ADMIN, SUPPORT_AGENT). `ws-auth.guard` para sockets.
- **Validacao**: DTOs com `class-validator`, erros padronizados e localizados.
- **Monitoring**: Sentry em backend (`SentryModule.forRoot()`) e frontend (`@sentry/react-native`).
- **Logs**: Logger Nest + console no app (condicional `__DEV__`).
- **Storage**: GCS para documentos; fallback local para dev/test.
- **Privacidade**: Dados sensiveis mascarados (`pixKeyMasked`), fluxo de KYC.
- **Confiabilidade**: Redis locks, retry de fila, idempotencia no cliente (cabecalho), dedupe de erros (interceptor).
- **TODO conhecido**: `averageResponseTime` no backend ainda usa valor mock; necessita integracao com historico de chat para acuracia.

7. Desenvolvimento e Operacao
-----------------------------

- **Scripts**:
  - Backend: `npm run start:dev`, `prisma migrate deploy`, `prisma generate`.
  - Frontend: `npx expo start`, `expo prebuild` se necessario, `eas build`.
  - Testes e2e: scripts `test-*-flow.sh`, `run_all_tests.sh`.
- **Codificacao**: Preferencia ASCII para evitar corrupcao (evitar acentos em arquivos `.md` se problemas de encoding persistirem).
- **Testing**:
  - Backend possui estrutura Jest (`backend-cleaning/test`) mas cobertura ainda limitada.
  - App utiliza Detox (scripts em `documentation/run-detox.md`) e testes manuais para fluxos chave.
- **Ambientes**:
  - `backend-cleaning/.env` exemplos para DB, Redis, GCS, PIX gateway.
  - `app.config.ts` expo extra environment (API base, Sentry DSN, etc.).
  - `eas.json` configura build profiles.
- **Deploy**:
  - Backend: Cloud Run/Railway (ver `documentation/deploy-gcloud.md`).
  - Frontend: Expo EAS.

8. Roadmap Tecnico Imediato
---------------------------

1. Substituir metricas mock de resposta de provedor por calculo real (timestamps de mensagens e SLA).
2. Revisar dados fallback hardcoded em `providerService.ts` para ambientes de producao.
3. Normalizar encoding UTF-8 (hoje ha historico de caracteres corrompidos).
4. Expandir testes automatizados (bookings, pagamentos, disputas) e observabilidade (dashboards, alertas).
5. Integrar cartao de credito como segundo metodo de pagamento (planejado) mantendo PIX como prioridade.

9. Anexos e Referencias Internas
--------------------------------

- Backend:
  - `src/bookings/bookings.service.ts`, `src/providers/providers.service.ts`, `src/payments`, `src/support`, `src/queues`.
  - `prisma/schema.prisma` para relacoes completas.
- App:
  - `_layout.tsx` (root), `app/(client)/explore/[providerId].tsx`, `app/(client)/bookings`, `app/(provider)/dashboard.tsx`.
  - Componentes em `components/client/explore` e `components/client/booking`.
- Servicos:
  - `services/api.ts`, `services/bookingService.ts`, `services/providerService.ts`, `services/notificationUIService.ts`.
- Tipos:
  - `types/backend/providers.ts`, `types/backend/bookings.ts`, `types/backend/auth.ts`.
- Documentos extras: `documentation/deploy-gcloud.md`, `documentation/run-detox.md`, `documentation/redis-run.md`, `documentation/gamificacao.md`.

Esta documentacao deve ser revisitada sempre que houver alteracoes nos fluxos de negocio, endpoints ou estrutura de diretorios, garantindo que LimpeJa permaneça plenamente alinhado entre codigo e material de referencia.
