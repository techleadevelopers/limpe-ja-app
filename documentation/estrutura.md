LimpeJaApp/
├── app/
│   ├── ofertas/
│   │   └── [ofertaId].tsx
│   ├── profile/
│   │   ├── edit.tsx
│   │   ├── index.tsx
│   │   ├── layout.tsx
│   │   └── README.md
│   ├── (common)/
│   │   ├── feedback/
│   │   │   ├── dispute/
│   │   │   │   ├── [bookingId].tsx
│   │   │   │   └── index.tsx
│   │   │   ├── [targetId].tsx
│   │   │   ├── help.tsx
│   │   │   ├── layout.tsx
│   │   │   └── notifications.tsx
│   │   ├── loyalty.tsx
│   │   ├── privacidade.tsx
│   │   ├── README.md
│   │   ├── referrals.tsx
│   │   ├── safety/                      // NOVO: Módulo de segurança
│   │   │   ├── panic.tsx                // NOVO
│   │   │   └── incident-report.tsx      // NOVO
│   │   ├── settings.tsx
│   │   └── termos.tsx
│   ├── (provider)/
│   │   ├── messages/
│   │   │   ├── [chatId].tsx
│   │   │   └── index.tsx
│   │   ├── profile/
│   │   │   ├── edit-services.tsx
│   │   │   └── index.tsx
│   │   ├── schedule/
│   │   │   ├── index.tsx
│   │   │   └── manage-availability.tsx
│   │   └── services/
│   │       ├── [serviceId].tsx
│   │       └── index.tsx
│   ├── dashboard.tsx
│   ├── earnings.tsx
│   ├── index.tsx
│   ├── layout.tsx
│   ├── README.md
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── doc.md
│   ├── index.tsx
│   ├── palhetas.md
│   ├── README.md
│   ├── welcome.tsx
│   └── (client)/
│       ├── _layout.tsx
│       ├── bookings/
│       │   ├── [bookingId].tsx
│       │   ├── index.tsx
│       │   └── success.tsx
│       ├── explore/
│       │   ├── [providerId].tsx
│       │   ├── index.tsx
│       │   ├── resultados-busca.tsx
│       │   ├── search-results.tsx
│       │   ├── servicos-por-categoria.tsx
│       │   ├── todas-categorias.tsx
│       │   └── todos-prestadores-proximos.tsx
│       ├── profile/
│       │   ├── edit.tsx
│       │   └── index.tsx
│       ├── schedule-service.tsx
│       ├── subscriptions/             // NOVO: Gerenciamento de assinaturas
│       │   ├── index.tsx              // NOVO
│       │   └── [subscriptionId].tsx   // NOVO
│       └── offers/
│           └── [ofertaId].tsx
├── assets/
│   ├── fonts/
│   ├── images/
│   └── lottie/
├── components/
│   ├── auth/
│   ├── client/
│   ├── common/
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── ScreenContainer.tsx
│   │   ├── TextInputWithIcon.tsx
│   │   └── Badges/                // NOVO: Componentes para exibir badges
│   │       └── ProviderBadge.tsx  // NOVO
│   ├── provider/
│   ├── ui/
│   └── ServiceItemSkeleton.tsx
├── contexts/
│   ├── AuthContext.tsx
│   └── ProviderRegistrationContext.tsx
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── bookingService.ts
│   ├── chatService.ts
│   ├── clientService.ts
│   ├── complianceService.ts
│   ├── disputeService.ts
│   ├── faqService.ts
│   ├── notificationService.ts
│   ├── paymentService.ts
│   ├── providerService.ts
│   ├── referralService.ts
│   ├── reviewService.ts
│   ├── aiSuggestionsService.ts
│   ├── safetyService.ts             // NOVO: Serviço para botão de pânico/incidentes
│   ├── subscriptionService.ts       // NOVO: Serviço de assinaturas
│   ├── couponService.ts             // NOVO: Serviço de cupons
│   └── guaranteeService.ts          // NOVO: Serviço de garantia de serviço
├── src/
│   ├── providers/
│   │   └── query-client-provider.tsx
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── shadows.ts
│   │   └── typography.ts
│   ├── types/
│   │   ├── backend/
│   │   │   ├── auth.ts
│   │   │   ├── bookings.ts
│   │   │   ├── chat.ts
│   │   │   ├── clients.ts
│   │   │   ├── conversation-item.dto.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── faqs.ts
│   │   │   ├── notifications.ts
│   │   │   ├── offers.ts
│   │   │   ├── payments.ts
│   │   │   ├── provider-service.ts
│   │   │   ├── providers.ts
│   │   │   ├── referrals.ts
│   │   │   ├── reviews.ts
│   │   │   ├── search.ts
│   │   │   ├── services.ts
│   │   │   ├── upload.ts
│   │   │   ├── users.ts
│   │   │   ├── verification.ts
│   │   │   ├── safety.ts                // NOVO: DTOs para segurança/incidentes
│   │   │   ├── subscriptions.ts         // NOVO: DTOs para assinaturas
│   │   │   ├── coupons.ts               // NOVO: DTOs para cupons
│   │   │   └── guarantee.ts             // NOVO: DTOs para garantia de serviço
│   │   └── frontend/
│   │       └── ... (tipagens específicas do frontend)
│   └── utils/
│       └── sentry.ts
├── backend-cleaning/
│   ├── dist/
│   ├── node_modules/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── seed/
│   │   │   └── seed.ts
│   │   └── schema.prisma                // MODIFICADO: Adição de novas entidades/campos
│   └── src/
│       ├── auth/
│       │   ├── decorators/
│       │   │   └── roles.decorator.ts
│       │   ├── dto/
│       │   │   ├── auth-response.dto.ts
│       │   │   ├── forgot-password.dto.ts
│       │   │   ├── login.dto.ts
│       │   │   ├── message-response.dto.ts
│       │   │   ├── otp-login.dto.ts
│       │   │   ├── phone-auth.dto.ts
│       │   │   ├── register-client.dto.ts
│       │   │   └── register-provider.dto.ts
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts
│       │   │   ├── local-auth.guard.ts
│       │   │   ├── roles.guard.ts
│       │   │   └── ws-auth.guard.ts
│       │   ├── strategies/
│       │   │   ├── jwt.strategy.ts
│       │   │   └── local.strategy.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.module.ts
│       │   └── auth.service.ts
│       ├── availability/
│       │   ├── dto/
│       │   │   ├── get-availability.dto.ts
│       │   │   └── update-availability.dto.ts
│       │   ├── entities/
│       │   │   └── availability.entity.ts
│       │   ├── availability.controller.ts
│       │   ├── availability.module.ts
│       │   └── availability.service.ts
│       ├── bookings/                    // MODIFICADO: Lógica para agendamentos recorrentes, métricas de cliente
│       │   ├── dto/
│       │   │   ├── booking-and-pix-response.dto.ts
│       │   │   ├── booking-details.dto.ts
│       │   │   ├── create-booking.dto.ts
│       │   │   ├── report-dispute.dto.ts
│       │   │   └── update-booking-status.dto.ts
│       │   ├── entities/
│       │   │   └── booking.entity.ts
│       │   ├── bookings.controller.ts
│       │   ├── bookings.module.ts
│       │   └── bookings.service.ts
│       ├── cache/
│       │   ├── cache.module.ts
│       │   └── cache.service.ts
│       ├── chat/
│       │   ├── dto/
│       │   │   ├── chat-details.dto.ts
│       │   │   ├── conversation-item.dto.ts
│       │   │   ├── get-messages.dto.ts
│       │   │   └── send-message.dto.ts
│       │   ├── entities/
│       │   │   └── message.entity.ts
│       │   ├── gateway/
│       │   │   └── chat.gateway.ts
│       │   ├── chat.controller.ts
│       │   ├── chat.module.ts
│       │   └── chat.service.ts
│       ├── clients/                     // MODIFICADO: Adição de métricas de cliente (no-show, cancelamento)
│       │   ├── dto/
│       │   │   ├── client-dashboard.dto.ts
│       │   │   ├── client-details.dto.ts
│       │   │   └── update-client-profile.dto.ts
│       │   ├── entities/
│       │   │   └── client.entity.ts
│       │   ├── clients.controller.ts
│       │   ├── clients.module.ts
│       │   └── clients.service.ts
│       ├── common/
│       │   ├── constants/
│       │   │   └── roles.enum.ts
│       │   ├── decorators/
│       │   │   └── api-response.decorator.ts
│       │   ├── dto/
│       │   │   ├── address-details.dto.ts
│       │   │   ├── create-address.dto.ts
│       │   │   └── message-response.dto.ts
│       │   ├── entities/
│       │   │   └── address.entity.ts
│       │   ├── enums/
│       │   │   └── pricing-type.enum.ts
│       │   ├── filters/
│       │   │   └── http-exception.filter.ts
│       │   ├── interceptors/
│       │   │   └── transform.interceptor.ts
│       │   ├── modules/
│       │   │   ├── email.module.ts
│       │   │   └── geocoding.module.ts
│       │   ├── pipes/
│       │   │   └── validation.pipe.ts
│       │   └── services/
│       │       ├── email.service.ts
│       │       ├── geocoding.service.ts
│       │       └── sms.service.ts
│       ├── config/
│       │   ├── config.module.ts
│       │   ├── configuration.ts
│       │   └── validation-schema.ts
│       ├── coupons/                     // NOVO MÓDULO: Gerenciamento de cupons
│       │   ├── dto/                     // NOVO
│       │   ├── entities/                // NOVO
│       │   ├── coupons.controller.ts    // NOVO
│       │   ├── coupons.module.ts        // NOVO
│       │   └── coupons.service.ts       // NOVO
│       ├── dashboard/                   // MODIFICADO: Inclusão de mais métricas de performance
│       │   ├── dto/
│       │   │   └── dashboard.dto.ts
│       │   ├── dashboard.controller.ts
│       │   ├── dashboard.module.ts
│       │   └── dashboard.service.ts
│       ├── earnings/
│       │   ├── dto/
│       │   │   └── earnings.dto.ts
│       │   ├── earnings.controller.ts
│       │   ├── earnings.module.ts
│       │   └── earnings.service.ts
│       ├── faqs/
│       │   ├── dto/
│       │   │   ├── create-faq.dto.ts
│       │   │   └── update-faq.dto.ts
│       │   ├── entities/
│       │   │   └── faq-item.entity.ts
│       │   ├── faqs.controller.ts
│       │   ├── faqs.module.ts
│       │   └── faqs.service.ts
│       ├── guarantee/                   // NOVO MÓDULO: Gerenciamento de garantia de serviço/seguro
│       │   ├── dto/                     // NOVO
│       │   ├── entities/                // NOVO
│       │   ├── guarantee.controller.ts  // NOVO
│       │   ├── guarantee.module.ts      // NOVO
│       │   └── guarantee.service.ts     // NOVO
│       ├── notifications/               // MODIFICADO: Suporte a rich media
│       │   ├── dto/
│       │   │   ├── create-notification.dto.ts
│       │   │   ├── mark-as-read.dto.ts
│       │   │   └── update-notification.dto.ts
│       │   ├── entities/
│       │   │   └── notification.entity.ts
│       │   ├── notifications.controller.ts
│       │   ├── notifications.module.ts
│       │   └── notifications.service.ts
│       ├── offers/
│       │   ├── dto/
│       │   │   ├── create-offer.dto.ts
│       │   │   ├── offer-details.dto.ts
│       │   │   └── update-offer.dto.ts
│       │   ├── entities/
│       │   │   └── offer.entity.ts
│       │   ├── offers.controller.ts
│       │   ├── offers.module.ts
│       │   └── offers.service.ts
│       ├── payments/                    // MODIFICADO: Aplicação de cupons
│       │   ├── dto/
│       │   │   ├── create-pix-charge.dto.ts
│       │   │   └── request-withdrawal.dto.ts
│       │   ├── entities/
│       │   │   └── transaction.entity.ts
│       │   ├── payments.controller.ts
│       │   ├── payments.module.ts
│       │   └── payments.service.ts
│       ├── pricing/                     // NOVO MÓDULO: Lógica de precificação dinâmica/surge pricing
│       │   ├── dto/                     // NOVO
│       │   ├── entities/                // NOVO
│       │   ├── pricing.controller.ts    // NOVO
│       │   ├── pricing.module.ts        // NOVO
│       │   └── pricing.service.ts       // NOVO
│       ├── prisma/
│       │   ├── prisma.module.ts
│       │   └── prisma.service.ts
│       ├── providers/                   // MODIFICADO: Lógica de smart matching, badges/níveis de reputação
│       │   ├── dto/
│       │   │   ├── provider-details.dto.ts
│       │   │   ├── provider-search.dto.ts
│       │   │   ├── provider-service.offering.dto.ts
│       │   │   └── update-provider-profile.dto.ts
│       │   ├── entities/
│       │   │   └── provider.entity.ts
│       │   ├── providers.controller.ts
│       │   ├── providers.module.ts
│       │   └── providers.service.ts
│       ├── provider-services/
│       │   ├── dto/
│       │   │   ├── create-provider-service.dto.ts
│       │   │   ├── provider-service-details.dto.ts
│       │   │   └── update-provider-service.dto.ts
│       │   ├── entities/
│       │   │   └── provider-service.entity.ts
│       │   ├── provider-services.controller.ts
│       │   ├── provider-services.module.ts
│       │   └── provider-services.service.ts
│       ├── queues/
│       │   ├── queues.module.ts
│       │   ├── queues.service.ts
│       │   └── workers/
│       │       ├── notification.worker.ts
│       │       └── verification.worker.ts
src/geocoding/dto/geocode-response.dto.ts
src/geocoding/geocoding.service.ts
src/geocoding/geocoding.module.ts
│       ├── referrals/
│       │   ├── dto/
│       │   │   └── create-referral.dto.ts
│       │   ├── entities/
│       │   │   └── referral.entity.ts
│       │   ├── referrals.controller.ts
│       │   ├── referrals.module.ts
│       │   └── referrals.service.ts
│       ├── reviews/                     // MODIFICADO: Lógica para badges/níveis de reputação
│       │   ├── dto/
│       │   │   ├── get-reviews.dto.ts
│       │   │   ├── review.dto.ts
│       │   │   ├── smart-suggestions.dto.ts
│       │   │   └── submit-review.dto.ts
│       │   ├── entities/
│       │   │   └── review.entity.ts
│       │   ├── reviews.controller.ts
│       │   ├── reviews.module.ts
│       │   └── reviews.service.ts
│       ├── safety/                      // NOVO MÓDULO: Botão de pânico/relatório de incidentes
│       │   ├── dto/                     // NOVO
│       │   ├── entities/                // NOVO
│       │   ├── safety.controller.ts     // NOVO
│       │   ├── safety.module.ts         // NOVO
│       │   └── safety.service.ts        // NOVO
│       ├── search/                      // MODIFICADO: Integração com smart matching
│       │   ├── dto/
│       │   │   ├── provider-service-search-result.dto.ts
│       │   │   └── search-query.dto.ts
│       │   ├── search.controller.ts
│       │   ├── search.module.ts
│       │   └── search.service.ts
│       ├── services/
│       │   ├── dto/
│       │   │   ├── create-service.dto.ts
│       │   │   ├── service-details.dto.ts
│       │   │   └── update-service.dto.ts
│       │   ├── entities/
│       │   │   └── service.entity.ts
│       │   ├── services.controller.ts
│       │   ├── services.module.ts
│       │   └── services.service.ts
│       ├── sms/
│       │   ├── sms.module.ts
│       │   └── sms.service.ts
│       ├── subscriptions/               // NOVO MÓDULO: Gerenciamento de assinaturas/agendamentos recorrentes
│       │   ├── dto/                     // NOVO
│       │   ├── entities/                // NOVO
│       │   ├── subscriptions.controller.ts // NOVO
│       │   ├── subscriptions.module.ts  // NOVO
│       │   └── subscriptions.service.ts // NOVO
│       ├── types/
│       │   └── express-request.d.ts
│       ├── users/
│       │   ├── dto/
│       │   │   ├── update-user.dto.ts
│       │   │   └── user-profile.dto.ts
│       │   ├── entities/
│       │   │   └── user.entity.ts
│       │   ├── users.controller.ts
│       │   ├── users.module.ts
│       │   └── users.service.ts
│       ├── verification/
│       │   ├── dto/
│       │   │   ├── liveness-result.dto.ts
│       │   │   ├── ocr-result.dto.ts
│       │   │   ├── submit-cpf.dto.ts
│       │   │   ├── upload-document.dto.ts
│       │   │   └── upload-selfie.dto.ts
│       │   ├── entities/
│       │   │   └── ... (entidades de verificação se houver)
│       │   ├── services/
│       │   │   ├── criminal-background-check.service.ts
│       │   │   └── document-processing.service.ts
│       │   ├── verification.controller.ts
│       │   ├── verification.module.ts
│       │   └── verification.service.ts
│       ├── app.controller.spec.ts
│       ├── app.controller.ts
│       ├── app.module.ts
│       ├── app.service.ts
│       └── main.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── otp_retriever.py
├── src/providers/
│   └── query-client-provider.tsx
├── src/utils/
│   └── sentry.ts
└── documentation.md


     1. Key Strengths & Core Differentiators
Modern, Scalable Architecture
• React Native + Expo Router + TanStack Query on frontend
• NestJS + PostgreSQL (PostGIS) + Redis + BullMQ + WebSockets on backend
→ ready for horizontal scaling, real-time chat, geospatial search.
Robust Provider Onboarding & Verification
• Multi-step flow: profile, documents, selfie, OCR/liveness, background-check.
• Queued backend processing avoids timeouts and boosts trust.
Brazil-Native Payments
• Combined “schedule-and-pay” PIX flow with PagSeguro webhook and refund support.
• Fast, familiar for Brazilians—critical edge over platforms still reliant on boleto.
Growth Modules Built-In
• Referral (invite) and Loyalty (points/levels) frameworks ready to activate.
Real-Time Chat & Dispute Management
• Socket.IO (Redis-adapter) for instant messaging, with REST fallback.
• Formal dispute workflow (PENDING_DISPUTE) for added resolution trust.
2. Essential Features to Scale in Brazilian Mid/Large Cities
✅ Geo-search & Filtering via PostGIS for “nearby” and radius-based listings
✅ Dynamic Calendar & Availability: weekly slots + date-blocking for vacations/holidays
✅ Global State & Caching (TanStack Query + Redis) for performance under load
✅ Session Security: biometric login, secure store, session timeout
✅ LGPD Compliance: data export/deletion endpoints

⚠️ Needs Improvement

Smart Matching: currently manual selection; needs algorithmic matching by proximity, rating, skill.
Dynamic Pricing: surge/urgency pricing per region/time to balance supply/demand.
Multi-City Zoning: area-based service boundaries and pricing tiers for national rollout.
3. Payment Flow, Onboarding & Trust/Safety Alignment
Payment Flow
• “Schedule-and-pay” single API: seamless for users.
• Transaction records with gatewayTransactionId, qrCodeUrl → auditability.
Provider Onboarding
• Stepwise guided UX; persists data across screens (ProviderRegistrationContext).
• Real-time polling of verification status; immediate feedback loops.
Trust & Safety
• Identity verification (documents + liveness) exceeds many local competitors.
• Ratings, reviews and dispute service formalized.
• Gap: no formal client verification (e.g. no-show tracking) and no incident reporting or “panic” feature.
4. Missing Features / Weak Points
4.1 Safety & Trust
• No in-app Emergency/Panic button for providers or clients.
• No formal police-record or Serasa KYC integration.
4.2 Provider & Client Incentives
• No service-damage insurance or “service guarantee”.
• Badges/levels for top performers under-leveraged.
• No client rating history (cancel/no-show).
4.3 Growth & Monetization
• No coupon engine or time-based promotions.
• No subscription/recurring-cleaning plans.
4.4 Logistics & UX Resilience
• No real-time GPS tracking en route.
• Offline caching and rich push notifications not specified.
4.5 National Roll-out Controls
• Lacks zone-based service boundaries and demand-forecast matching.

5. 2–3 Standout Features / Growth Loops to Integrate
In-App Emergency/Panic Button
• Instantly alert support and share live location. Builds safety reputation.
Automated Smart Matching & Surge Pricing
• Algorithm picks best-fit provider by proximity, rating, past performance.
• Variable pricing for peak hours or high-demand zones.
Subscription & Service Guarantee
• Recurring plans (weekly/biweekly) with discounted rates.
• Optional “Garantia LimpeJá” insurance covering accidental damage.
6. Go-to-Market Readiness
🟢 Ready for Soft Launch MVP in 1–2 target cities:
• Core booking, payments, chat, onboarding, dispute, referral & loyalty are in place.
• Brazilian users will recognize familiar flows (PIX, PagSeguro, chat).

🔶 Before Aggressive Scale, implement:
• Emergency/Panic & incident-reporting for safety.
• Smart match + surge pricing to optimize utilization.
• Subscription models and service insurance for retention.
• Zone management for multi-city rollout.

With those enhancements, LimpeJá will outpace local incumbents and approach the sophistication of global marketplace leaders.


LimpeJaApp/
├── app/
│   ├── (client)/
│   │   └── subscriptions/             // NOVO: Gerenciamento de assinaturas
│   │       ├── index.tsx              // NOVO
│   │       └── [subscriptionId].tsx   // NOVO
│   ├── (common)/
│   │   └── safety/                      // NOVO: Módulo de segurança
│   │       ├── panic.tsx                // NOVO
│   │       └── incident-report.tsx      // NOVO
├── components/
│   ├── common/
│   │   └── Badges/                // NOVO: Componentes para exibir badges
│   │       └── ProviderBadge.tsx  // NOVO
├── services/
│   ├── safetyService.ts             // NOVO: Serviço para botão de pânico/incidentes
│   ├── subscriptionService.ts       // NOVO: Serviço de assinaturas
│   ├── couponService.ts             // NOVO: Serviço de cupons
│   └── guaranteeService.ts          // NOVO: Serviço de garantia de serviço
├── src/
│   └── types/
│       └── backend/
│           ├── safety.ts                // NOVO: DTOs para segurança/incidentes
│           ├── subscriptions.ts         // NOVO: DTOs para assinaturas
│           ├── coupons.ts               // NOVO: DTOs para cupons
│           └── guarantee.ts             // NOVO: DTOs para garantia de serviço
├── backend-cleaning/
│   ├── prisma/
│   │   └── schema.prisma                // MODIFICADO: Adição de novas entidades/campos
│   └── src/
│       ├── bookings/                    // MODIFICADO: Lógica para agendamentos recorrentes, métricas de cliente
│       ├── clients/                     // MODIFICADO: Adição de métricas de cliente (no-show, cancelamento)
│       ├── coupons/                     // NOVO MÓDULO: Gerenciamento de cupons
│       │   ├── dto/                     // NOVO
│       │   ├── entities/                // NOVO
│       │   ├── coupons.controller.ts    // NOVO
│       │   ├── coupons.module.ts        // NOVO
│       │   └── coupons.service.ts       // NOVO
│       ├── dashboard/                   // MODIFICADO: Inclusão de mais métricas de performance
│       ├── guarantee/                   // NOVO MÓDULO: Gerenciamento de garantia de serviço/seguro
│       │   ├── dto/                     // NOVO
│       │   ├── entities/                // NOVO
│       │   ├── guarantee.controller.ts  // NOVO
│       │   ├── guarantee.module.ts      // NOVO
│       │   └── guarantee.service.ts     // NOVO
│       ├── notifications/               // MODIFICADO: Suporte a rich media
│       ├── payments/                    // MODIFICADO: Aplicação de cupons
│       ├── pricing/                     // NOVO MÓDULO: Lógica de precificação dinâmica/surge pricing
│       │   ├── dto/                     // NOVO
│       │   ├── entities/                // NOVO
│       │   ├── pricing.controller.ts    // NOVO
│       │   ├── pricing.module.ts        // NOVO
│       │   └── pricing.service.ts       // NOVO
│       ├── providers/                   // MODIFICADO: Lógica de smart matching, badges/níveis de reputação
│       ├── reviews/                     // MODIFICADO: Lógica para badges/níveis de reputação
│       ├── safety/                      // NOVO MÓDULO: Botão de pânico/relatório de incidentes
│       │   ├── dto/                     // NOVO
│       │   ├── entities/                // NOVO
│       │   ├── safety.controller.ts     // NOVO
│       │   ├── safety.module.ts         // NOVO
│       │   └── safety.service.ts        // NOVO
│       ├── search/                      // MODIFICADO: Integração com smart matching
│       └── subscriptions/               // NOVO MÓDULO: Gerenciamento de assinaturas/agendamentos recorrentes
│           ├── dto/                     // NOVO
│           ├── entities/                // NOVO
│           ├── subscriptions.controller.ts // NOVO
│           ├── subscriptions.module.ts  // NOVO
│           └── subscriptions.service.ts // NOVO