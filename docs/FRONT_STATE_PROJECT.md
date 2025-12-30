# FRONT_STATE_PROJECT

## 1. VisÃ£o geral do front + Ã¡rvore de mÃ³dulos
- O ponto de entrada `app/_layout.tsx` inicializa Sentry/SplashScreen/fonts, dispara `useNotificationsSocket`/`NotificationUIService`, envolve `AuthProvider`, `ProviderRegistrationProvider`, `AppQueryClientProvider` e `AppProvider`, monta o canal de overlays e exibe o `PaymentConfirmedOverlay` + a `FloatingActiveServicePill` para prestadores ativos.
- A Ã¡rvore do `app/` Ã© dividida em grupos lÃ³gicos: `(auth)` contÃ©m fluxo de login/cadastro, `client` entrega toda a UX de agendamento/mensagens/finanÃ§as, `provider` controla dashboard/agendamentos/empresa, `common` agrega feedback/safety/support/loyalty e `_shared` reÃºne helpers reutilizados.
- Fora de `app/`, `components/` Ã© organizado por domÃ­nio (auth, client, provider, UI, navigation e gesto), `services/` centraliza as chamadas HTTP, `types/backend/` espelha contratos do backend, e `hooks/`, `utils/`, `contexts/` e `config/` sustentam estados, formataÃ§Ã£o e variÃ¡veis de ambiente.
- Documentos auxiliares (`app/dev-panel.tsx`, `app/doc.md`, `app/frontend_routes.json/md`, `app/components.md`) e assets (`components/images`, `assets/`) ficam fora do roteamento principal mas estÃ£o incluÃ­dos no inventÃ¡rio abaixo para garantir 100% de cobertura.

## 2. Mapa real de rotas (Expo Router)
- `RootLayout` usa `useAuth`, `segments` e `verify` para redirecionar guests para `/auth/register-options`, garantir que apenas clientes alcancem `/client/*` e que prestadores verificados permaneÃ§am em `/provider/*` (mesmo bloqueando `client` quando o `UserRole` Ã© `PROVIDER`). Rota QA (`/dev-panel`) sÃ³ abre com `process.env.EXPO_PUBLIC_ENABLE_QA_PANEL` ou no modo `__DEV__`.
- A tabela abaixo cruza os caminhos do filesystem (`find app -type f`/`frontend_routes.json`) com as guardas aplicadas e os principais serviÃ§os/hooks envolvidos; `constants/routes.ts`/`app/routes.ts` abastecem redireÃ§Ãµes e deep links usados em `welcome.tsx`, `_layout.tsx` e telas de cadastro.

| Route | File | Guard | Dependencies |
| --- | --- | --- | --- |
| `/` | `app/index.tsx` | Public spinner; `_layout` resolve expiraÃ§Ã£o/tokens antes de trocar para autenticaÃ§Ã£o. | `ActivityIndicator`, `Text`. |
| `/welcome` | `app/welcome.tsx` | Public landing que sempre encaminha para `/auth/register-options`. | `react-native-reanimated`, `LinearGradient`, `expo-router`. |
| `/auth/login` | `app/auth/login.tsx` | Public (guest only). | `useAuth` (`AuthContext`/`authService`), `CLIENT_ROUTES`, `PROVIDER_ROUTES`, `Toast` para erros. |
| `/auth/register-options` | `app/auth/register-options.tsx` | Public guest funnel. | `router`, `AUTH_ROUTES`. |
| `/auth/client-register` | `app/auth/client-register.tsx` | Public form that sets client auth. | `AuthContext.signUpClient`, `NotificationUIService`, `utils` validators. |
| `/auth/forgot-password` | `app/auth/forgot-password.tsx` | Public. | `authService.sendPasswordReset`, `NotificationUIService`. |
| `/auth/provider-register` | `app/auth/provider-register/index.tsx` | Ingress to provider path; guard by onboarding status. | `ProviderRegistrationContext`, `AuthContext`, `providerService.updateMyProviderProfile`, `uploadService`. |
| `/auth/provider-register/personal-details` | `app/auth/provider-register/personal-details.tsx` | Same guard. | `ProviderRegistrationContext`, CPF/date validators. |
| `/auth/provider-register/service-details` | `app/auth/provider-register/service-details.tsx` | Same guard. | `ProviderRegistrationContext.submitRegistration`, `uploadService`, `providerService`. |
| `/auth/provider-register/coverage-availability` | `app/auth/provider-register/coverage-availability.tsx` | Same guard. | `useProviderAvailability`, `providerService.getMyProviderAvailability`. |
| `/auth/provider-register/verify-account` | `app/auth/provider-register/verify-account.tsx` | Locked until docs upload. | `ProviderRegistrationContext`, `uploadService`, `verificationService`. |
| `/auth/provider-register/verification/background-check-status` | `app/auth/provider-register/verification/background-check-status.tsx` | Specialized step. | Background check status poll/service. |
| `/auth/provider-register/verification/document-upload` | `.../document-upload.tsx` | Specialized. | `uploadService`, `NotificationUIService`. |
| `/auth/provider-register/verification/facial-recognition` | `.../facial-recognition.tsx` | Specialized. | Camera access, `NotificationUIService`. |
| `/client/bookings` | `app/client/bookings/index.tsx` | Client auth guard. | `bookingService.getBookingsForUser`, `notificationService`, `providerService.getProviderAvatar`, `useAuth`, `useDevice`, `_shared/uiFeedback`. |
| `/client/bookings/[bookingId]` | `app/client/bookings/[bookingId].tsx` | Client auth | `bookingService.getBookingDetails/cancelBooking`, `providerService.getProviderDetails`, `useProviderServices`, `useTutorial`. |
| `/client/bookings/schedule-service` | `app/client/bookings/schedule-service.tsx` | Client auth | `providerService.getProviderAvailability/details`, `bookingService.createBooking`, `paymentService`, `configService`, `useCouponValidation`, `useBookingQuote`, `services/quoteService`, `NotificationUIService`. |
| `/client/bookings/success` | `app/client/bookings/success.tsx` | Client auth post-booking. | `paymentService.fetchPaymentIntent/createPixCharge`, `bookingService`, `providerService`, `loyaltyService`, `clientService.getOffers`, `NotificationUIService`. |
| `/client/category/[categoryId]` | `app/client/category/[categoryId].tsx` | Client auth | `clientService.getProvidersByServiceCategory`, `useDevice`. |
| `/client/coupons` | `app/client/coupons/index.tsx` | Client auth | `clientService.getOffers`, `couponService`. |
| `/client/explore` | `app/client/explore/index.tsx` | Public (guest allowed). | `clientService.getRecommendedProviders`, `searchProvidersWithLocation`, `getBookingsForUser`, `locationService`, `notificationService`, `useOverlayMessage`, `useTutorial`. |
| `/client/explore/[providerId]` | `app/client/explore/[providerId].tsx` | Public but pushes to client guard when booking. | `providerService.getProviderDetails`, `bookingService.checkActiveChatBooking`, `chatService`, `NotificationUIService`. |
| `/client/explore/menu` | `app/client/explore/menu/index.tsx` | Public. | Navigation tiles referencing `CLIENT_ROUTES`. |
| `/client/explore/ranking` | `app/client/explore/ranking/index.tsx` | Public. | `rankingService`, `clientService`. |
| `/client/explore/security` | `app/client/explore/security/index.tsx` | Public. | Safety cards, `common/safety` components. |
| `/client/explore/servicos-por-categoria` | `app/client/explore/servicos-por-categoria.tsx` | Public. | `clientService.searchProviders`, categories list. |
| `/client/explore/todas-categorias` | `app/client/explore/todas-categorias.tsx` | Public. | `clientService.getServiceCategories`. |
| `/client/explore/todos-prestadores-proximos` | `app/client/explore/todos-prestadores-proximos.tsx` | Public. | `clientService.searchProvidersWithLocation`, `Location`. |
| `/client/explore/search-results` | `app/client/explore/search-results.tsx` | Public. | `searchService`, `clientService`. |
| `/client/messages` | `app/client/messages/index.tsx` | Client auth | `chatService.getChatListForUser`, `NotificationUIService`. |
| `/client/messages/[chatId]` | `app/client/messages/[chatId].tsx` | Client auth | `chatService.getChatMessages/sendMessage`, `NotificationUIService`. |
| `/client/metrics` | `app/client/metrics/index.tsx` | Client auth | `metricsService`, `bookingService`, `loyaltyService`. |
| `/client/missions` | `app/client/missions/index.tsx` | Client auth | `clientService.getClientMissions`, `missionService`. |
| `/client/notifications` | `app/client/notifications/index.tsx` | Client auth | `notificationService` + `markNotificationAsRead`. |
| `/client/profile` | `app/client/profile/index.tsx` | Client auth | `clientService.getUserProfile`, `referralService`. |
| `/client/profile/edit` | `app/client/profile/edit.tsx` | Client auth | `clientService.updateClientProfile`, `AuthContext.updateUser`. |
| `/client/ranking` | `app/client/ranking/index.tsx` | Client auth | `rankingService`, `NotificationUIService`. |
| `/client/referrals` | `app/client/referrals/index.tsx` | Client auth | `referralService`. |
| `/client/subscriptions` | `app/client/subscriptions/index.tsx` | Client auth | `subscriptionService`, `bookingService`. |
| `/client/subscriptions/[subscriptionId]` | `app/client/subscriptions/[subscriptionId].tsx` | Client auth | `subscriptionService` detail, `bookingService`. |
| `/client/support` | `app/client/support/index.tsx` | Client auth | `supportService.getTickets`, `supportService`. |
| `/client/support/tutorials` | `app/client/support/tutorials.tsx` | Client auth | Local tutorials + `supportService`. |
| `/client/wallet/cashback` | `app/client/wallet/cashback.tsx` | Client auth | `loyaltyService`, `clientService`. |
| `/client/wallet/rewards` | `app/client/wallet/rewards.tsx` | Client auth | `loyaltyService`, `missionService`. |
| `/client/ofertas/[ofertaId]` | `app/client/ofertas/[ofertaId].tsx` | Client auth | `offerService.getOfferDetails`, `setSafeError`. |
| `/common/feedback` | `app/common/feedback/index.tsx` | Public | `clientService`/`feedbackService` for categories, `bookingService`. |
| `/common/feedback/[targetId]` | `app/common/feedback/[targetId].tsx` | Public | `feedbackService`, `NotificationUIService`. |
| `/common/feedback/dispute` | `app/common/feedback/dispute/index.tsx` | Public | `disputeService`, `bookingService`. |
| `/common/feedback/dispute/[bookingId]` | `app/common/feedback/dispute/[bookingId].tsx` | Public | `disputeService`. |
| `/common/help` | `app/common/help.tsx` | Public | `faqService`, `Toast`, `Skeleton`. |
| `/common/loyalty` | `app/common/loyalty.tsx` | Public | `loyaltyService`, `missionService`. |
| `/common/notifications` | `app/common/notifications.tsx` | Public | `notificationService`, `NotificationUIService`. |
| `/common/referrals` | `app/common/referrals.tsx` | Public | `referralService`. |
| `/common/safety` | `app/common/safety/index.tsx` | Public | Links to `/common/safety/*`. |
| `/common/safety/defense` | `app/common/safety/defense.tsx` | Public | Static content, links to `/common/safety/panic`. |
| `/common/safety/incident-report` | `app/common/safety/incident-report.tsx` | Public | Form; sends to `safetyService`. |
| `/common/safety/panic` | `app/common/safety/panic.tsx` | Public | `safetyService`. |
| `/common/support` | `app/common/support/index.tsx` | Public | `supportService`. |
| `/common/support/create-ticket` | `app/common/support/create-ticket.tsx` | Public | `supportService.createTicket`. |
| `/common/support/[ticketId]` | `app/common/support/[ticketId].tsx` | Public | `supportService.getTicketDetails/addMessageToTicket`. |
| `/common/privacidade` | `app/common/privacidade.tsx` | Public | Static. |
| `/common/settings` | `app/common/settings.tsx` | Public | `AuthContext.logout`, `NotificationUIService`. |
| `/common/termos` | `app/common/termos.tsx` | Public | Static. |
| `/provider` | `app/provider/index.tsx` | Provider + verification guard | `bookingService.getBookingsForUser`, `dashboardService.getMyProviderDashboard`, `notificationUIService`, `ProviderNavBar`. |
| `/provider/messages` | `app/provider/messages/index.tsx` | Provider | `chatService`, `useAuth`. |
| `/provider/messages/[chatId]` | `app/provider/messages/[chatId].tsx` | Provider | `chatService.getChatMessages/sendMessage`, `NotificationUIService`. |
| `/provider/messages/limpeja` | `app/provider/messages/limpeja.tsx` | Provider (support). | Static copy & CTA to `/provider/messages`. |
| `/provider/missions` | `app/provider/missions/index.tsx` | Provider | `missionService`, `NotificationUIService`. |
| `/provider/notifications` | `app/provider/notifications/index.tsx` | Provider | `notificationService`. |
| `/provider/profile` | `app/provider/profile/index.tsx` | Provider | `providerService.getProviderDetails`, `AuthContext.updateUser`. |
| `/provider/profile/edit-services` | `app/provider/profile/edit-services.tsx` | Provider | `providerService.updateProviderServiceOffering`, `useProviderServices`. |
| `/provider/promotions` | `app/provider/promotions/index.tsx` | Provider | `providerPromotionsService`. |
| `/provider/reviews` | `app/provider/reviews/index.tsx` | Provider | `reviewService`, `bookingService`. |
| `/provider/schedule` | `app/provider/schedule/index.tsx` | Provider | `providerService.getMyProviderAvailability`, `useProviderAvailability`. |
| `/provider/schedule/manage-availability` | `app/provider/schedule/manage-availability.tsx` | Provider | `providerService.updateMyProviderAvailability`. |
| `/provider/services` | `app/provider/services/index.tsx` | Provider | `providerService.getProviderServicesOffered`, `providerService.listAllServices`. |
| `/provider/services/[serviceId]` | `app/provider/services/[serviceId].tsx` | Provider | `providerService` detail, `useBookingPricing`. |
| `/provider/support` | `app/provider/support/index.tsx` | Provider | `supportService`. |
| `/provider/withdraw` | `app/provider/withdraw/index.tsx` | Provider | `providerService.getMyProviderEarnings`, `paymentService.requestWithdrawal`. |
| `/provider/active-booking/[bookingId]` | `app/provider/active-booking/[bookingId].tsx` | Provider | `bookingService.getBookingDetails`, `notificationService`. |
| `/dev-panel` | `app/dev-panel.tsx` | Dev only (QA flag). | `bookingService`, `NotificationUIService`, log helpers. |

## 3. Auditoria Client (app/client)

### 3.1 Bookings & pós-agendamento
- pp/client/bookings/index.tsx agrupa todos os estados de agendamento (requests/upcoming/completed) com ookingService.getBookingsForUser, providerService.getProviderAvatar e 
otificationService.getMyNotifications. Loading e pull-to-refresh estão alinhados com useDevice/Animated e protegem guests via _layout.
- schedule-service.tsx orquestra disponibilidade (providerService.getProviderAvailability), precificação (o hook `useBookingQuote` chama `services/quoteService` e o endpoint `POST /bookings/quote` com debounce de 300ms para manter subtotal/total alinhados com o backend), cupons (useCouponValidation) e criação do agendamento (ookingService.createBooking). O fluxo posta Idempotency-Key e X-Client-Request-Id pelo interceptor global e trata 409 `PRICE_MISMATCH` reatravando o quote e exibindo um toast “Preço atualizado”.
- Pós-booking (pp/client/bookings/success.tsx) reconcilia paymentService.fetchPaymentIntent/createPixCharge, ookingService, providerService, loyaltyService, clientService.getOffers e o overlay NotificationUIService. O componente vigia estados de polling e reage a PIX com PaymentIntentStatus.
- Detalhes (pp/client/bookings/[bookingId].tsx) chamam ookingService.getBookingDetails/cancelBooking, providerService.getProviderDetails e useProviderServices, exibindo lembretes (TutorialOverlay) e validações de status para permitir cancelamentos/compartilhamentos.

### 3.2 Exploração, descoberta e ofertas
- client/explore/* (index, [providerId], menu, 
anking, security, servicos-por-categoria, 	odas-categorias, 	odos-prestadores-proximos, search-results) mistura clientService, searchService, providerService, locationService e ookingService. O useOverlayMessage além de useTutorial entrega respostas contextualizadas e mapas de próximos prestadores com CTA de segurança via common/safety.
- A tela de prestador detalha ookingService.checkActiveChatBooking, chatService e useProviderServices para listar serviços e reviews; CLIENT_ROUTES/PROVIDER_ROUTES guiam os deep links para chat, bookings e perfil.
- `components/client/explore/provider/BookServiceButton.tsx` now receives `verificationStatus`, disables the CTA when the provider is not `APPROVED`, and surfaces the verification notice with ?Em verifica??o/Aguardando aprova??o? plus the ?Entenda a verifica??o? link to `/client/explore/security`; `app/client/bookings/schedule-service.tsx` reuses the same notice, keeps the confirm button locked, and handles `provider-not-approved` errors with a localized message before returning to the booking flow.
- client/ofertas/[ofertaId].tsx busca offerService.getOfferDetails, valida a existência do cupom e conduz para schedule-service com setSafeError como fallback silencioso.

### 3.3 Mensagens, suporte e segurança
- client/messages/[chatId] dependem do chatService (/chat/me/conversations, /chat/:chatId/messages) e exibem ConversationItems animados; a rota exige autenticação e NotificationUIService lida com erros silenciosos.
- common/support (index, create-ticket, [ticketId]) consome supportService (/v1/support/tickets, /v1/support/tickets/:id/messages), com cards coloridos e retry logic (mensagens de erro reutilizam setSafeError).
- common/safety/* (defense, incident-report, panic) são canais estáticos que referenciam safetyService e fornecem links para common/support e outros recursos.

### 3.4 Wallet, loyalty, missões, métricas e programas
- client/wallet, client/missions, client/metrics e common/loyalty consomem loyaltyService, missionService, metricsService e clientService.getClientMissions. Todos mantêm estados isLoading/error/
efresh, respeitando useAuth antes de mostrar gráficos e badges (components/common/loyalty).
- client/subscriptions junta subscriptionService e ookingService para mostrar planos, e client/referrals usa 
eferralService + ppConfig.referrals para divulgar benefícios.
- client/profile e profile/edit sincronizam dados com clientService.getUserProfile/updateClientProfile e acionam AuthContext.updateUser para manter cache local e token.

### 3.5 Cupons, feedback e tutoriais
- client/coupons combina clientService.getOffers e couponService com componentes como CouponPill e CouponNudge, validando códigos em tela com NotificationUIService.
- common/feedback, common/feedback/[targetId] e common/feedback/dispute/* fazem uso de disputeService e ookingService para registrar reclamações, anexar provas e seguir o fluxo oficial de disputas.
- Tutoriais (por exemplo useTutorial em ookings/[bookingId]) e content locks reaproveitam NotificationUIService para evitar toasts duplicados (o hook deduplica por título em 3s via useOverlayMessage).

## 4. Auditoria Provider (app/provider)

### 4.1 Dashboard & active booking
- pp/provider/index.tsx (duplicado com dashboard.tsx) consome dashboardService.getMyProviderDashboard, ookingService.getBookingsForUser e 
otificationUIService, exibindo ProviderNavBar, ProviderNudgeContainer e quick actions para PROVIDER_ROUTES. O _layout exibe o FloatingActiveServicePill com getBookingsForUser e encaminha providers para /provider ou /provider/active-booking dependendo do status.
- ?? O pill agora respeita `booking.allowedActions` e metas via `/meta/statuses`, caindo em "Em atualiza??o" se o status for desconhecido.
- ctive-booking/[bookingId].tsx mostra dados em tempo real via ookingService e insiste no guard do provedor.

### 4.2 Agenda & disponibilidade
- provider/schedule/index.tsx e manage-availability.tsx chamam providerService.getMyProviderAvailability e updateMyProviderAvailability e delegam a complexidade para useProviderAvailability, que aplica presets, bloqueia slots antigos e transforma selectedSlots em blocos usando convertSlotsToBlocks.
- useProviderAvailability também garante 	ermsAcceptedAt e filtra isPastSlot antes de chamar o service, o que reforça o fluxo de aceitação dos termos para mudanças de agenda.

### 4.3 Serviços, perfil e promoções
- provider/services/[serviceId] listam providerService.getProviderServicesOffered, listAllServices e permitem edição via providerService.updateProviderServiceOffering. profile/profile/edit-services chamam providerService.updateMyProviderProfile, uploadMyAvatar e cceptProviderTerms para manter ProviderDisplayInfo sincronizado.
- provider/promotions usa providerPromotionsService e o Offer DTO; provider/reviews exibe 
eviewService + ookingService para responder feedbacks.

### 4.4 Missões, notificações, mensagens e pagamentos
- provider/missions chama missionService e exibe progresso (via MissionProgressSnack), enquanto provider/notifications lista 
otificationService com deep links.
- provider/messages e [chatId] replicam o chatService do cliente; o componente MessagesOrchestrator é responsável por abrir chats internos.
- provider/withdraw usa providerService.getMyProviderEarnings e paymentService.requestWithdrawal com idempotency-key; os erros são notificados via NotificationUIService. provider/support conecta supportService para escalas.

## 5. Components (components/)

- **Domínio global:** components/common/*, components/ui/*, components/layout/* (ScreenContainer, CustomHeader, ToastProvider, OverlayMessage) fornecem átomos reutilizáveis com tokens (AppColors, AppShadows). PaymentConfirmedOverlay, OverlayPortal e Toast encapsulam o pipeline de notificação sem chamar services diretamente.
- **Client:** components/client/booking/* cobre calendário (ScheduleCalendar), horários, resumo, segurança (SecurityRef) e pagamento; o cluster components/client/explore/home monta cards e banners com PrestadorCard, CarouselBannerItem e NavBar. Componentes de cupons/referrals (CouponPill, ReferralSheet) injetam dados de clientService e 
eferralService via props.
- **Provider:** components/provider/* inclui ProviderNudgeContainer, ProviderNavBar, GlassmorphicCard, EarningsSnapshotSection, UpcomingServicesSection e ProviderOverviewSection. ProviderServicesInline é um dos poucos componentes que ainda expõe chamadas diretas a providerService e merece atenção quando migrar para hooks.
- **UI utilities & confiança:** components/Skeleton, Toast, ErrorMessage, MissionReminderCard, BadgeMissionCard e ProviderBadge sustentam feedbacks críticos, com props como ariant, status e onPrimaryAction. Componentes  trusted (ProviderBadge, PaymentConfirmedOverlay, SecurityInfoSection) reforçam o branding de segurança e pagamentos protegidos.

## 6. Services/HTTP Client

- services/api.ts cria a instância Axios com baseURL vindo de Constants.expoConfig.extra.backendApiUrl (queda para EXPO_PUBLIC_API_BASE_URL ou http://localhost:3000). Em produção é verificado se ainda aponta para localhost. O interceptor de requisição adiciona Authorization, Idempotency-Key (paths listados: /bookings, /missions/track, /reviews, /payments/*, /providers/me/availability, /payouts/withdrawals), X-Client-Request-Id e mistura x-silent/config.meta.silent para toasts. O interceptor de resposta agora detecta o `code` retornado pelo backend: em `TOKEN_EXPIRED` dispara um refresh único via AuthService, emite `SESSION_REFRESHED` para que o AuthContext atualize token, reforce o push token e permita que o socket reconfigure o connection-id; em `TOKEN_REVOKED` limpa AsyncStorage, QueryClient e header Authorization, aciona a mesma mensagem `common.session_revoked` e emite `SESSION_REVOKED` para descadastrar push/socket antes de callar setUnauthorizedCallback. O fallback continua com retries exponenciais, dedupe de messageKey, NotificationUIService.showError (exceto x-silent), Sentry.captureException sem duplicação e setUnauthorizedCallback para 401 genéricos.

| Service | Métodos-chave | Endpoints principais | Cabeçalhos/resiliência | Riscos e notas |
| --- | --- | --- | --- | --- |
| uthService | login, 
egisterClient, 
egisterProvider, 
efreshSession, loadAuthData | POST /auth/login, /auth/register/client, /auth/register/provider, /auth/refresh | x-silent em login, armazenamento em AsyncStorage | 
efreshPromise compartilha estado; 401 desencadeia logout e router replace. |
| ookingService | getBookingsForUser, createBooking, updateBookingStatus, startBooking, completeBooking, cancelBooking, checkActiveChatBooking | GET /bookings/me, POST /bookings, PATCH /bookings/:id/status, POST /bookings/:id/start/complete/cancel, GET /bookings/check-active-chat/:client/:provider | Idempotency para POST/PATCH /bookings, x-silent em checkActiveChatBooking | Usa mapBookingStatus para ajustar string statuses e emite Error com mensagens do backend. |
| clientService | getServiceCategories, searchProviders, searchProvidersWithLocation, pplyCoupon, getUserProfile, getClientMissions, claimClientReward, getOffers, getProviderDetails, updateClientProfile | GET /services, GET /providers, POST /bookings/:id/apply-coupon, GET /users/me, GET /missions/my | X-Silent em preview, fallback silencioso em falhas | Reusa providerService (alguns endpoints duplicados) e ignora 401/403 via toasts. |
| providerService | getProviderDetails, getMyProviderAvailability, updateMyProviderAvailability, getProviderServicesOffered, updateProviderServiceOffering, getMyProviderDashboard, getMyProviderEarnings, getProviderOffers, uploadMyAvatar, cceptProviderTerms | /providers/:id, /providers/me, /providers/me/dashboard, /providers/me/earnings, /providers/me/availability, /providers/:id/services | Normaliza uploads via multipart/form-data, usa VerificationStatus na UI | Endpoints como getServicesByCategoryId assumem /services?categoryId; cuide ao alinhar backend. |
| paymentService | createPixCharge, 
equestWithdrawal, etchPaymentIntent | POST /payments/pix-charge, POST /payouts/withdrawals, GET /payments/intent/:bookingId | Idempotency customizada e x-silent em etchPaymentIntent | Converte CANCELLED/CANCELED para EXPIRED; 401 salta para logout via AuthContext. |
| chatService | indOrCreateChat, getChatMessages, sendMessage, getChatListForUser | GET /chat/find-or-create/provider/:providerId/client/:clientId, GET /chat/:chatId/messages, POST /chat/:chatId/messages, GET /chat/me/conversations | Sem cabeçalhos extras, centraliza ConversationItem | Nenhum fallback automático de paginação, erros lançam Error simples. |
| supportService | createTicket, getMeta, getTickets, getTicketDetails, ddMessageToTicket, updateTicketStatus | /v1/support/tickets, /v1/support/tickets/:id/messages, /v1/support/meta | Usa pi para todos os requests | Erros logados com console.error e relançados, sem retries automáticos. |
| offerService | getOffers, getOfferDetails | GET /offers, GET /offers/:id | Normaliza OfferTarget e status | Converte status inesperados e supõe couponCode presente. |
| notificationService | getMyNotifications, getNotificationStream, markAllNotificationsAsRead, markNotificationAsRead, ackNotification | /notifications/me, /notifications/stream, /notifications/me/mark-as-read, /notifications/:id/mark-as-read, /notifications/:id/ack | Normaliza AppEvent+Notification, apoia stream/ack/re-quote, expõe dedupeKey/ttl para a UI | useNotificationsSocket escuta AppEvents, envia ack silencioso e recarrega stream ao reconectar. |

## 7. Types/Contracts (types/backend)
- 	ypes/backend/bookings.ts define BookingStatus (incluindo PENDING_PROVIDER_CONFIRMATION, RESCHEDULED, NO_SHOW) e BookingDetails (com couponId, discountAmount, subscriptionId, incidents). O frontend normaliza via 
ormalizeBooking e mapBookingStatus para manter consistência com o Prisma.
- 	ypes/backend/auth.ts cobre RegisterClientDto, RegisterProviderDto, UpdateProviderProfileDto, UserRole e VerificationStatus. Esses contratos alimentam o AuthContext, ProviderRegistrationContext e as validações de rota em _layout.
- Os arquivos 	ypes/backend/payments.ts, providers.ts, provider-service.ts, offers.ts, missions.ts, 
otifications.ts, support.ts e chat.ts são usados pelas services e components. Atenção: alguns fluxos ainda usam strings literais (status de ticket/pagamento) em vez de enums fortemente tipados.
- 	ypes/backend/search.ts, clients.ts, 
eferrals.ts e metrics.ts sustentam os DTOs exibidos em cards; qualquer alteração nos enums como OfferTarget ou PaymentIntentStatus exige revisão conjunta com o backend.

## 8. Notifications (in-app + push + socket)
- pp/_layout.tsx instancia useNotificationsSocket (socket.io usando 
esolveSocketUrl a partir de EXPO_PUBLIC_WS_URL ou do ackendApiUrl) e escuta eventos 
otification, mission-progress, disparando NotificationUIService.showInfo, um som MP3 (via expo-av) para prestadores em foreground e notificações locais (expo-notifications) para reforçar serviços críticos.
- `useNotificationsSocket` agora interpreta o envelope AppEvent (type + dedupeKey + payload), dispara `NotificationUIService.showAppEvent`, envia ack silencioso via `/notifications/:id/ack` e, ao reconectar ou voltar ao foreground, chama `/notifications/stream?since=` para processar eventos faltantes sem duplicações.

- NotificationUIService deduplica mensagens, supre green toasts de agendamentos/Pix, amplia o texto em erros 5xx e usa showOverlay (com useOverlayMessage) para renderizar o componente OverlayMessage global.
- pushService registra tokens Expo/FCM/APNs, pedindo permissões (
equestNotificationPermissions) e postando /notifications/register-token. O AuthContext chama 
egisterDevicePushToken após login/refresh e limpa os tokens depois de logout.
- AuthContext também cria um socket de pagamento (via socket.io) que escuta pixPaymentConfirmed, exibe o PaymentConfirmedOverlay, e apaga a notificação em 3,5 s. 
otificationBus oferece um pub/sub local para casos que não precisam do socket direto.

## 9. Config/Build
- pp.config.ts define nome (LimpeJá), slug, versão (1.0.14), orientação, ícones e plugins (expo-router, expo-localization, expo-build-properties com useFrameworks: dynamic). extra.backendApiUrl vem de EXPO_PUBLIC_API_BASE_URL (fallback Railway) e extra.eas.projectId expõe o ID do projeto EAS.
- eas.json declara perfis development, preflight_ios, internal_ios, pk_direct_test e production, amarrando imagem base (latest), 
ode 20.19.5 e distribution/uildType. O perfil pk_direct_test injeta todas as variáveis Firebase (EXPO_PUBLIC_FIREBASE_*).
- config/appConfig.ts centraliza piUrl (mesmo EXPO_PUBLIC_API_BASE_URL) e textos de referral (benefícios do promotor/refereado mais link de termos). O objeto ppConfig.referrals alimenta client/referrals e banners de indicação.
- config/firebaseClient.ts lê Constants.expoConfig.extra.firebaseApiKey etc. Se alguma credencial estiver vazia, o módulo loga erros detalhados e rejeita a inicialização, exigindo que builds gerenciados preencham extra.firebase* no pp.config.ts ou .env.

## 10. Apêndice

### Contagem de arquivos por diretório
- app/ 127 arquivos
- components/ 233 arquivos
- services/ 48 arquivos
- types/ 33 arquivos
- hooks/ 21 arquivos
- utils/ 21 arquivos
- contexts/ 4 arquivos
- config/ 2 arquivos

### Lista completa de arquivos inspecionados
- app/:
  ```text
  app/+not-found.tsx
  app/analyze_frontend_expo_router.py
  app/auth/client-register.tsx
  app/auth/forgot-password.tsx
  app/auth/layout.tsx
  app/auth/login.tsx
  app/auth/provider-register/coverage-availability.tsx
  app/auth/provider-register/index.tsx
  app/auth/provider-register/layout.tsx
  app/auth/provider-register/personal-details.tsx
  app/auth/provider-register/service-details.tsx
  app/auth/provider-register/verification/background-check-status.tsx
  app/auth/provider-register/verification/document-upload.tsx
  app/auth/provider-register/verification/facial-recognition.tsx
  app/auth/provider-register/verify-account.tsx
  app/auth/README.md
  app/auth/register-options.tsx
  app/client/bookings/doc.md
  app/client/bookings/index.tsx
  app/client/bookings/schedule-service.tsx
  app/client/bookings/success.tsx
  app/client/bookings/[bookingId].tsx
  app/client/bookings/_layout.tsx
  app/client/category/[categoryId].tsx
  app/client/coupons/index.tsx
  app/client/explore/index.tsx
  app/client/explore/menu/index.tsx
  app/client/explore/ranking/index.tsx
  app/client/explore/resultados-busca.tsx
  app/client/explore/search-results.tsx
  app/client/explore/security/index.tsx
  app/client/explore/servicos-por-categoria.tsx
  app/client/explore/todas-categorias.tsx
  app/client/explore/todos-prestadores-proximos.tsx
  app/client/explore/[providerId].tsx
  app/client/explore/_layout.tsx
  app/client/feedback/[targetId].tsx
  app/client/layout.tsx
  app/client/messages/index.tsx
  app/client/messages/limpeja.tsx
  app/client/messages/[chatId].tsx
  app/client/messages/_layout.tsx
  app/client/metrics/index.tsx
  app/client/metrics/_layout.tsx
  app/client/missions/index.tsx
  app/client/missions/missions.tsx
  app/client/missions/README.md
  app/client/notifications/index.tsx
  app/client/ofertas/[ofertaId].tsx
  app/client/ofertas/_layout.tsx
  app/client/profile/edit.tsx
  app/client/profile/index.tsx
  app/client/ranking/index.tsx
  app/client/README.md
  app/client/referrals/index.tsx
  app/client/subscriptions/index.tsx
  app/client/subscriptions/[subscriptionId].tsx
  app/client/subscriptions/_layout.tsx
  app/client/support/index.tsx
  app/client/support/tutorials.tsx
  app/client/wallet/cashback.tsx
  app/client/wallet/rewards.tsx
  app/client/_layout.tsx
  app/common/active-booking/[bookingId].tsx
  app/common/active-booking/_layout.tsx
  app/common/feedback/dispute/index.tsx
  app/common/feedback/dispute/[bookingId].tsx
  app/common/feedback/dispute/_layout.tsx
  app/common/feedback/index.tsx
  app/common/feedback/[targetId].tsx
  app/common/help.tsx
  app/common/layout.tsx
  app/common/loyalty.tsx
  app/common/notifications.tsx
  app/common/privacidade.tsx
  app/common/README.md
  app/common/referrals.tsx
  app/common/safety/defense.tsx
  app/common/safety/incident-report.tsx
  app/common/safety/index.tsx
  app/common/safety/panic.tsx
  app/common/safety/_layout.tsx
  app/common/settings.tsx
  app/common/support/create-ticket.tsx
  app/common/support/index.tsx
  app/common/support/[ticketId].tsx
  app/common/support/_layout.tsx
  app/common/termos.tsx
  app/components.md
  app/dev-panel.tsx
  app/doc.md
  app/frontend_routes.json
  app/frontend_routes.md
  app/index.tsx
  app/palhetas.md
  app/provider/active-booking/[bookingId].tsx
  app/provider/active-booking/_layout.tsx
  app/provider/dashboard.tsx
  app/provider/earnings.tsx
  app/provider/index.tsx
  app/provider/layout.tsx
  app/provider/messages/index.tsx
  app/provider/messages/limpeja.tsx
  app/provider/messages/[chatId].tsx
  app/provider/messages/_layout.tsx
  app/provider/missions/index.tsx
  app/provider/notifications/index.tsx
  app/provider/profile/edit-services.tsx
  app/provider/profile/index.tsx
  app/provider/promotions/index.tsx
  app/provider/README.md
  app/provider/reviews/index.tsx
  app/provider/schedule/index.tsx
  app/provider/schedule/manage-availability.tsx
  app/provider/services/index.tsx
  app/provider/services/[serviceId].tsx
  app/provider/services/_layout.tsx
  app/provider/support/index.tsx
  app/provider/withdraw/index.tsx
  app/provider/_layout.tsx
  app/README.md
  app/routes.ts
  app/welcome.tsx
  app/_layout.tsx
  app/_shared/errors/uiFeedback.ts
  app/_shared/errors/userError.ts
  app/_shared/ui/parity.ts
  ```

- components/:
  ```text
  components/auth/components/AnimatedErrorMessage.tsx
  components/auth/components/DatePickerInput.tsx
  components/auth/components/deploy-gcloud.md
  components/auth/components/InputWithIcon.tsx
  components/auth/components/ProgressBar.tsx
  components/auth/components/SectionHeader.tsx
  components/auth/components/StandardInput.tsx
  components/auth/PremiumServiceChip.tsx
  components/auth/ServiceDetailsStep5Premium.tsx
  components/BadgeMissionCard.tsx
  components/booking/ProviderServicesInline.tsx
  components/BubblesRN.tsx
  components/CategoryProviderCard.tsx
  components/client/banner/BannerOferta.tsx
  components/client/booking/schedule/AddressSection.tsx
  components/client/booking/schedule/ConfirmBookingButton.tsx
  components/client/booking/schedule/NotesInputSection.tsx
  components/client/booking/schedule/PaymentMethodSelection.tsx
  components/client/booking/schedule/PixPaymentDetails.tsx
  components/client/booking/schedule/ProviderBrief.tsx
  components/client/booking/schedule/ScheduleCalendar.tsx
  components/client/booking/schedule/ScheduleHeader.tsx
  components/client/booking/schedule/SecurityRef.tsx
  components/client/booking/schedule/ServiceDetailsInput.tsx
  components/client/booking/schedule/TimeSlotButton.tsx
  components/client/booking/schedule/TimeSlotsSection.tsx
  components/client/booking/success/AdditionalBookingDetails.tsx
  components/client/booking/success/BookingDetailSection.tsx
  components/client/booking/success/BookingSummaryCard.tsx
  components/client/booking/success/DateTimeCards.tsx
  components/client/booking/success/ImmediateActionButtons.tsx
  components/client/booking/success/LoyaltyTeaserSection.tsx
  components/client/booking/success/MainActionButtons.tsx
  components/client/booking/success/PaymentConfirmationCard.tsx
  components/client/booking/success/ProviderInfoSection.tsx
  components/client/booking/success/ReturnCouponCard.tsx
  components/client/booking/success/SecurityInfoSection.tsx
  components/client/booking/success/SuccessHeader.tsx
  components/client/booking/success/SuccessLoadingError.tsx
  components/client/booking/success/SuccessPixInfo.tsx
  components/client/CouponWelcomeCard.tsx
  components/client/explore/category/CategoryProviderCard.tsx
  components/client/explore/home/CarouselBannerItem.tsx
  components/client/explore/home/CategoriaCard.tsx
  components/client/explore/home/CategoryCard2.tsx
  components/client/explore/home/DEFENSE_SOS.tsx
  components/client/explore/home/DrawerMenu.tsx
  components/client/explore/home/FAB_SOS.tsx
  components/client/explore/home/HorizontalMiniGrid.tsx
  components/client/explore/home/MainCategoryButton.tsx
  components/client/explore/home/NavBar.tsx
  components/client/explore/home/NavBar2.tsx
  components/client/explore/home/NewHeader.tsx
  components/client/explore/home/Points.tsx
  components/client/explore/home/PrestadorCard.tsx
  components/client/explore/home/RecomendacaoCard.tmp
  components/client/explore/home/RecomendacaoCard.tsx
  components/client/explore/home/SearchComponent.tsx
  components/client/explore/home/SecaoContainer.tsx
  components/client/explore/home/SecaoPrestadores.tsx
  components/client/explore/home/SecaoRecomendacoes.tsx
  components/client/explore/home/ServiceCategoryCard.tsx
  components/client/explore/provider/ActionButtons.tsx
  components/client/explore/provider/BookServiceButton.tsx
  components/client/explore/provider/DetailsContent.tsx
  components/client/explore/provider/HeaderSection.tsx
  components/client/explore/provider/InfoChip.tsx
  components/client/explore/provider/OverviewContent.tsx
  components/client/explore/provider/PulsingRing.tsx
  components/client/explore/provider/ReviewCard.tsx
  components/client/explore/provider/SideIcon.tsx
  components/client/explore/provider/StarRating.tsx
  components/client/PersistentCouponPill.tsx
  components/client/profile/AnimatedMenuItem.tsx
  components/common/Badges/ProviderBadge.tsx
  components/common/BottomSlideInCard.tsx
  components/common/Button.tsx
  components/common/Card.tsx
  components/common/Chip.tsx
  components/common/Header.tsx
  components/common/loyalty/HowToEarnSection.tsx
  components/common/loyalty/LoyaltySummaryCard.tsx
  components/common/loyalty/RewardItem.tsx
  components/common/PrimaryButton.tsx
  components/common/ScreenContainer.tsx
  components/common/TextInputWithIcon.tsx
  components/common/theme/colors.ts
  components/common/theme/shadows.ts
  components/common/theme/typography.ts
  components/common/utils/sentry.ts
  components/components_analysis.json
  components/CouponModalOverlay.tsx
  components/coupons/CouponApplyInline.tsx
  components/coupons/CouponModal.tsx
  components/coupons/CouponNudge.tsx
  components/coupons/CouponPill.tsx
  components/coupons/CouponWelcomeCard.tsx
  components/coupons/HtmlCouponCard.tsx
  components/coupons/ReturnCouponCard.tsx
  components/CouponWelcomeCard
  components/EmptyState.tsx
  components/global/PaymentConfirmedOverlay.tsx
  components/images/adaptive-icon.png
  components/images/banner.png
  components/images/central-icon.png
  components/images/default-avatar.png
  components/images/face.png
  components/images/facer.png
  components/images/facial-Photoroom.png
  components/images/facial.png
  components/images/favicon.png
  components/images/header.png
  components/images/icon.png
  components/images/icons/check.png
  components/images/icons/comercial.png
  components/images/icons/doc.png
  components/images/icons/escritorio.png
  components/images/icons/estofados.png
  components/images/icons/map.png
  components/images/icons/obra.png
  components/images/icons/passadoria.png
  components/images/icons/residencial.png
  components/images/icons/vidro.png
  components/images/limp-Photoroom.png
  components/images/logo.png
  components/images/logo2.png
  components/images/partefrente.png
  components/images/partetras.png
  components/images/partial-react-logo.png
  components/images/pix.png
  components/images/react-logo.png
  components/images/react-logo@2x.png
  components/images/react-logo@3x.png
  components/images/safe-icon.png
  components/images/safe.png
  components/images/spash-icon.png
  components/images/splash-icon.png
  components/images/splash.png
  components/images/tp.png
  components/images/tp2.png
  components/images/woman.png
  components/incentives/IncentiveHub.tsx
  components/KPIValue.tsx
  components/layout/components/Bubble.tsx
  components/layout/components/CheckmarkIcon.tsx
  components/layout/components/EyeIcon.tsx
  components/layout/components/InfoIcon.tsx
  components/layout/components/ProgressCircleIcon.tsx
  components/layout/components/RightArrowIcon.tsx
  components/layout/components/SliderPickerIcon.tsx
  components/layout/components/XMarkIcon.tsx
  components/layout/CustomHeader.tsx
  components/layout/ScreenContainer.tsx
  components/layout/utils/constants.ts
  components/MessagesOrchestrator.tsx
  components/missions/MissionItem.tsx
  components/missions/MissionList.tsx
  components/missions/MissionProgressSnack.tsx
  components/missions/MissionReminderCard.tsx
  components/nudges/IncentiveNudge.tsx
  components/nudges/SecurityNudge.tsx
  components/nudges/SmartNudge.tsx
  components/ProtocolPremiumModal.tsx
  components/provider/dashboard/AdvancedReviewsSection.tsx
  components/provider/dashboard/AnimatedQuickActionButton.tsx
  components/provider/dashboard/CircularProgressChart.tsx
  components/provider/dashboard/DashboardHeader.tsx
  components/provider/dashboard/DashboardLoadingIndicator.tsx
  components/provider/dashboard/EarningsSnapshotSection.tsx
  components/provider/dashboard/GlassmorphicCard.tsx
  components/provider/dashboard/LogoutSection.tsx
  components/provider/dashboard/MainEarningsChartSection.tsx
  components/provider/dashboard/ProviderOverviewSection.tsx
  components/provider/dashboard/QuickActionsSection.tsx
  components/provider/dashboard/RecentReviewsSection.tsx
  components/provider/dashboard/SmartInsightsSection.tsx
  components/provider/dashboard/UpcomingServiceItem.tsx
  components/provider/dashboard/UpcomingServicesSection.tsx
  components/provider/dashboard/WelcomeSection.tsx
  components/provider/earnings/AnimatedTransactionItem.tsx
  components/provider/earnings/EarningsChartSection.tsx
  components/provider/earnings/EarningsSummaryCard.test.tsx
  components/provider/earnings/EarningsSummaryCard.tsx
  components/provider/earnings/RecentTransactionsSection.tsx
  components/provider/navigation/ProviderNavBar.tsx
  components/provider/ProviderNudgeContainer.tsx
  components/provider/query-client-provider.tsx
  components/ProviderCard.backup.tsx
  components/ProviderCard.tsx
  components/ranking/RankingBadge.tsx
  components/ranking/RankingCard.tsx
  components/ranking/SLAResponseChip.tsx
  components/README.md
  components/referrals/ReferralBanner.tsx
  components/referrals/ReferralSheet.tsx
  components/safety/PanicBanner.tsx
  components/schedule/manager/AnimatedDayCard.tsx
  components/schedule/manager/AnimatedErrorMessage.tsx
  components/schedule/manager/AnimatedTimeSlot.tsx
  components/schedule/manager/BlockDateSection.tsx
  components/schedule/manager/SaveChangesButton.tsx
  components/service/skeletons/ServiceItemSkeleton.tsx
  components/ServiceCard.tsx
  components/ServiceItemSkeleton.tsx
  components/Sheet.tsx
  components/Skeleton.tsx
  components/support/SupportTicketStatus.tsx
  components/Toast.tsx
  components/ui/AndroidAlertDialog.tsx
  components/ui/Bubble.tsx
  components/ui/Card.tsx
  components/ui/DropShape.tsx
  components/ui/ErrorMessage.tsx
  components/ui/Icon3D.tsx
  components/ui/Input.tsx
  components/ui/outros/ExternalLink.tsx
  components/ui/outros/HapticTab.tsx
  components/ui/outros/HelloWave.tsx
  components/ui/outros/ParallaxScrollView.tsx
  components/ui/outros/SaudacaoContainer.tsx
  components/ui/outros/ThemedText.tsx
  components/ui/outros/ThemedView.tsx
  components/ui/OverlayMessage.tsx
  components/ui/shadow.ts
  components/ui/TabBarBackground.ios.tsx
  components/ui/TabBarBackground.tsx
  components/ui/ToastMessage.tsx
  components/ui/ToastProvider.tsx
  components/ui/TutorialOverlay.tsx
  components/UnifiedHeader.tsx
  components/utils/useFadeSlideIn.ts
  components/utils/usePressScale.ts
  components/utils/useReducedMotion.ts
  ```

- services/:
  ```text
  services/adapters/bookingStatus.ts
  services/aiSuggestionsService.ts
  services/analyticsService.ts
  services/api.ts
  services/authService.ts
  services/bookingService.ts
  services/categoryService.ts
  services/chatService.ts
  services/clientService.ts
  services/commonServiceCatalog.ts
  services/complianceService.ts
  services/configService.ts
  services/couponService.ts
  services/dashboardService.ts
  services/disputeService.ts
  services/earningService.ts
  services/faqService.ts
  services/fileService.ts
  services/guaranteeService.ts
  services/incentiveService.ts
  services/locationService.ts
  services/logging.ts
  services/loyaltyService.ts
  services/metricsService.ts
  services/missionService.ts
  services/notificationBus.ts
  services/notificationService.ts
  services/notificationUIService.ts
  services/offerService.ts
  services/paymentService.ts
  services/providerPromotionsService.ts
  services/providerService.ts
  services/providerSettingsService.ts
  services/pushService.ts
  services/queuesService.ts
  services/rankingService.ts
  services/README.md
  services/referralService.ts
  services/reviewService.ts
  services/safetyService.ts
  services/searchService.ts
  services/securityService.ts
  services/smsService.ts
  services/subscriptionService.ts
  services/supportService.ts
  services/uploadService.ts
  services/userService.ts
  services/verificationService.ts
  ```

- types/:
  ```text
  types/backend/auth.ts
  types/backend/bookings.ts
  types/backend/chat.ts
  types/backend/clients.ts
  types/backend/coupons.ts
  types/backend/dashboard.ts
  types/backend/disputes.ts
  types/backend/earning.ts
  types/backend/faqs.ts
  types/backend/guarantee.ts
  types/backend/incentives.ts
  types/backend/IProvider.ts
  types/backend/metrics.ts
  types/backend/mission.ts
  types/backend/notifications.ts
  types/backend/offers.ts
  types/backend/payments.ts
  types/backend/provider-service.ts
  types/backend/providerPromotions.ts
  types/backend/providers.ts
  types/backend/ranking.ts
  types/backend/README.md
  types/backend/referrals.ts
  types/backend/reviews.ts
  types/backend/safety.ts
  types/backend/search.ts
  types/backend/services.ts
  types/backend/subscriptions.ts
  types/backend/support.ts
  types/backend/upload.ts
  types/backend/users.ts
  types/backend/verification.ts
  types/expo-av.d.ts
  ```

- hooks/:
  ```text
  hooks/useAccordion.ts
  hooks/useAndroidDialog.tsx
  hooks/useAuth.ts
  hooks/useCardHoverAnimation.ts
  hooks/useColorScheme.ts
  hooks/useColorScheme.web.ts
  hooks/useCountUp.ts
  hooks/useFadeIn.ts
  hooks/useFormValidation.ts
  hooks/useOverlayMessage.tsx
  hooks/usePlusButtonReflectionAnimation.ts
  hooks/usePlusButtonTrembleAnimation.ts
  hooks/useProviderAvailability.ts
  hooks/useProviderBookings.ts
  hooks/useProviderDashboard.ts
  hooks/useProviderMetrics.ts
  hooks/useProviderServices.ts
  hooks/useScalePress.ts
  hooks/useStaggerList.ts
  hooks/useThemeColor.ts
  hooks/useTutorial.ts
  ```

- utils/:
  ```text
  utils/address.ts
  utils/alerts.ts
  utils/app.txt
  utils/constants.ts
  utils/formatters.ts
  utils/helpers.ts
  utils/navbar.txt
  utils/normalize.ts
  utils/paymentIntentHooks.ts
  utils/permissions.ts
  utils/platformFix.ts
  utils/responsive.ts
  utils/scripts/postinstall.js
  utils/scripts/reset-project.js
  utils/service-helpers.ts
  utils/storage.ts
  utils/time.ts
  utils/timeSlots.ts
  utils/ui-helpers.tsx
  utils/useBookingPricing.ts
  utils/useCouponValidation.ts
  ```

- contexts/:
  ```text
  contexts/AppContext.tsx
  contexts/AuthContext.tsx
  contexts/ProviderRegistrationContext.tsx
  contexts/README.md
  ```

- config/:
  ```text
  config/appConfig.ts
  config/firebaseClient.ts
  ```

### Lista de arquivos ignorados e motivo
- node_modules/, android/, ios/, .expo/, build/, dist/: dependências, binários e builds que não entram na auditoria de lógica do app.
- assets/* (fonts, images, sounds, js, lottie): ativos binários usados pelos components mas sem lógica TypeScript executável.
- .git/, .vscode/, logs/: configurações e históricos mantidos intactos.

### Comandos usados
- Get-ChildItem app -Recurse -File | Measure-Object
- Get-ChildItem components -Recurse -File | Measure-Object
- Get-ChildItem services -Recurse -File | Measure-Object
- Get-ChildItem types -Recurse -File | Measure-Object
- Get-ChildItem hooks -Recurse -File | Measure-Object
- Get-ChildItem utils -Recurse -File | Measure-Object
- Get-ChildItem contexts -Recurse -File | Measure-Object
- Get-ChildItem config -Recurse -File | Measure-Object
- Get-Content docs/FRONT_STATE_PROJECT.md -Tail 80
- Get-Content docs/FRONT_STATE_PROJECT.md -Raw
- Get-Content tmp/app_files.txt
- Get-Content tmp/components_files.txt
- Get-Content tmp/services_files.txt
- Get-Content tmp/types_files.txt
- Get-Content tmp/hooks_files.txt
- Get-Content tmp/utils_files.txt
- Get-Content tmp/contexts_files.txt
- Get-Content tmp/config_files.txt
- ls tmp
