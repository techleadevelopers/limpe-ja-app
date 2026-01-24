Commit: 47db0db2d23a815adcc498cbff64b886423aaa62
Generated: 2025-12-20 12:11:36
Scope: backend-cleaning + app (Expo Router)

# TECH DOSSIER

## Frontend architecture overview
- **Expo Router / folder convention:** O app está dividido em uth/, client/, provider/, common/ com _layout.tsx em cada grupo e +not-found handlers; o scanner pp/frontend_routes.md:9-88 confirma 30+ páginas index e 16 layouts.
- **Typed navigation:** pp/routes.ts:1-64 define COMMON_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES, AUTH_ROUTES e helpers dinâmicos (CHAT, PROVIDER_DETAILS, ACTIVE_BOOKING) para substituir literais, centralizando destinos e reduzindo o escopo de bugs de rota.
- **NavBar e components:** a barra inferior (components/client/explore/home/NavBar.tsx:13-66) ainda usa literais como /client/explore e outer.push(path as any), o que fere a nova convenção e gera entradas “literal: /explore” no scanner (pp/frontend_routes.md:200-220).
- **Routing + UX flows:** o uth/register-options.tsx, client/bookings/..., provider/dashboard.tsx e common/support/index.tsx referenciam caminhos via outer/Link, e a consistência poderá ser reforçada puxando essas rotas de outes.ts e eliminando s any (veja pp/frontend_routes.md:133-190).

## Backend architecture overview
- **Modular NestJS:** há módulos dedicados para uth, ookings, payments, disputes, dmin, providers, loyalty, 
otifications, nalytics, eferrals, safety, support, queues, common, 	racing (ackend-cleaning/src/*). Cada controller aplica JwtAuthGuard, RolesGuard e/ou ThrottlerGuard conforme necessário.
- **Bootstrap e infra:** main.ts:1-200 instala Prometheus (initPrometheus()), tracing OTEL (initTracing()), Sentry, interceptors (TracingInterceptor), ValidationPipe global (whitelist/forbidNonWhitelisted/transform) e filtros globais AllExceptionsFilter, além de middlewares raw body para webhooks PIX/PSP (/payments/webhook/pix, /payouts/webhook/gateway).
- **Guards e rate limiting:** uth.controller.ts aplica @Throttle(5,60) no login e @Throttle(3,60) no forgot-password; dispute.controller.ts e nalytics.controller.ts também usam ThrottlerGuard para evitar abuso. JwtAuthGuard e RolesGuard protegem booking, payments, admin e payouts (ackend-cleaning/src/auth/guards/*).
- **Prisma + schema com postgis:** ackend-cleaning/prisma/schema.prisma:12-668 declara enums (BookingStatus, PayoutStatus, DisputeStatus, LoyaltyTransactionType, etc.), modelos principais (User, Provider, Booking, Transaction, PaymentIntent, Payout, Coupon, Loyalty, Referral) e índices para consultas críticas.
- **Observability + logging:** main.ts habilita logs e tracing; loyalty.service.ts e eferrals.service.ts registram telemetria textual; uth.controller.ts mascara emails (ver maskEmail).

## Critical flows (full-stack)
1. **Booking ? Payment ? Notification:** pp/client/bookings/schedule-service.tsx dispara POST /bookings/schedule-and-pay (ookings.controller.ts:111-147) que chama BookingsService.createBookingAndPixCharge e PaymentsService.createPixCharge; o provider acompanha status via ookings.controller.ts:452-522 e o backend dispara notificações via 
otifications.service.ts. 
2. **Provider onboarding/verificação:** pp/auth/provider-register/service-details.tsx e erify-account.tsx alimentam egisterProvider no backend (uth.controller.ts) e erification/providers.service.ts atualizam VerificationStatus (prisma/schema.prisma:381-431). 
3. **Disputas e garantia:** pp/common/feedback/dispute/index.tsx e ookings.controller.ts:369-404 geram disputas; dispute.controller.ts:1-150 aplica rate limiting, dispute.service.ts:96-492 move status PENDING ? IN_REVIEW ? RESOLVED/REJECTED e ookings.controller.ts:406-448 resolve/autoriza refunds. 
4. **Admin dashboards e refunds:** dmin-dashboard.controller.ts:1-27 e payments.controller.ts:91-146 exibem métricas e permitem refund/listagem, com JwtAuthGuard + RolesGuard + @Roles(UserRole.ADMIN) e checagens inline de rol.

## Known pitfalls
- **Literais em navegação importante:** NavBar.tsx:31-66 e vários arquivos listados em pp/frontend_routes.md:133-220 ainda usam /client/explore, /client/bookings, /client/coupons, /common/support em outer.push/eplace + s any, o que impede auditoria de rotas e causa expirado /h e /help nos relatórios.
- **/client/messages/limpeja não aparece no scanner oficial:** apesar de existir pp/client/messages/limpeja.tsx, as rotas derivadas (index.*) não listam /client/messages/limpeja, causando dúvidas se a URL pode ser atingida; isso complica ossos de logs e deep links (pp/frontend_routes.md lista apenas /client/messages).
- **Strings literais em rotas dinâmicas:** provider/dashboard.tsx usa '/provider/schedule/manage-availability?preset=...' e '/provider/messages/[chatId]' em literais (pp/frontend_routes.md:360-430), duplicando lógica e criando risco de typos.
- **Backend raw-webhook parsing:** main.ts injeta raw body para /payments/webhook/pix e /payouts/webhook/gateway sem assinatura/verificação adicional além de parse JSON manual, exigindo vigilância para replay e idempotência.

## Open Questions
- Quais esquemas externos (admin-web, analytics) consomem os endpoints dmin/queues, dmin/settings e metrics? Documentação adicional ajudaria a mapear dependências. 
- Como o App lida com deep links curtas (ex.: /welcome, /support fora do Expo Router)? É necessário uniformizar via outes.ts para evitar rotas “fantasmas”. 
