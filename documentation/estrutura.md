app/
├── ofertas/
│   └── [ofertaId].tsx
├── profile/
│   ├── edit.tsx
│   ├── index.tsx
│   ├── layout.tsx
│   └── README.md
├── (common)/
│   ├── feedback/
│   │   ├── [targetId].tsx
│   │   ├── help.tsx
│   │   ├── layout.tsx
│   │   └── notifications.tsx
│   ├── privacidade.tsx
│   ├── README.md
│   ├── settings.tsx
│   └── termos.tsx
├── (provider)/
│   ├── messages/
│   │   ├── [chatId].tsx
│   │   └── index.tsx
│   ├── profile/
│   │   ├── edit-services.tsx
│   │   └── index.tsx
│   ├── schedule/
│   │   ├── index.tsx
│   │   └── manage-availability.tsx
│   └── services/
│       ├── [serviceId].tsx
│       └── index.tsx
├── dashboard.tsx
├── earnings.tsx
├── index.tsx
├── layout.tsx
├── README.md
├── _layout.tsx
├── +not-found.tsx
├── doc.md
├── index.tsx
├── palhetas.md
├── README.md
└── welcome.tsx
assets/
├── fonts/
├── images/
└── lottie/
backend-cleaning/
├── dist/
├── node_modules/
├── prisma/
│   ├── migrations/
│   ├── seed/
│   │   └── seed.ts
│   └── schema.prisma
└── src/
    ├── auth/
    │   ├── decorators/
    │   │   └── roles.decorator.ts
    │   ├── dto/
    │   │   ├── auth-response.dto.ts
    │   │   ├── forgot-password.dto.ts
    │   │   ├── login.dto.ts
    │   │   ├── message-response.dto.ts
    │   │   ├── otp-login.dto.ts
    │   │   ├── phone-auth.dto.ts
    │   │   ├── register-client.dto.ts
    │   │   └── register-provider.dto.ts
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts
    │   │   ├── local-auth.guard.ts
    │   │   ├── roles.guard.ts
    │   │   └── ws-auth.guard.ts
    │   ├── strategies/
    │   │   ├── jwt.strategy.ts
    │   │   └── local.strategy.ts
    │   ├── auth.controller.ts
    │   ├── auth.module.ts
    │   └── auth.service.ts
    ├── availability/
    │   ├── dto/
    │   │   ├── get-availability.dto.ts
    │   │   └── update-availability.dto.ts
    │   ├── entities/
    │   │   └── availability.entity.ts
    │   ├── availability.controller.ts
    │   ├── availability.module.ts
    │   └── availability.service.ts
    └── bookings/
        └── dto/
            ├── booking-and-pix-response.dto.ts
            ├── booking-details.dto.ts
            ├── create-booking.dto.ts
            └── update-booking-status.dto.ts
 │   ├── entities/
        │   │   └── booking.entity.ts
        │   ├── bookings.controller.ts
        │   ├── bookings.module.ts
        │   └── bookings.service.ts
        ├── chat/
        │   ├── dto/
        │   │   ├── chat-details.dto.ts
        │   │   ├── conversation-item.dto.ts
        │   │   ├── get-messages.dto.ts
        │   │   └── send-message.dto.ts
        │   ├── entities/
        │   │   └── message.entity.ts
        │   ├── gateway/
        │   │   └── chat.gateway.ts
        │   ├── chat.controller.ts
        │   ├── chat.module.ts
        │   └── chat.service.ts
        ├── clients/
        │   ├── dto/
        │   │   ├── client-dashboard.dto.ts
        │   │   ├── client-details.dto.ts
        │   │   └── update-client-profile.dto.ts
        │   ├── entities/
        │   │   └── client.entity.ts
        │   ├── clients.controller.ts
        │   ├── clients.module.ts
        │   └── clients.service.ts
        ├── common/
        │   ├── constants/
        │   │   └── roles.enum.ts
        │   ├── decorators/
        │   │   └── api-response.decorator.ts
        │   ├── dto/
        │   │   ├── address-details.dto.ts
        │   │   ├── create-address.dto.ts
        │   │   └── message-response.dto.ts
        │   ├── entities/
        │   │   └── address.entity.ts
        │   ├── enums/
        │   │   └── pricing-type.enum.ts
        │   ├── filters/
        │   │   └── http-exception.filter.ts
        │   └── interceptors/
        │       └── transform.interceptor.ts
    │   ├── modules/
        │   │   ├── email.module.ts
        │   │   └── geocoding.module.ts
        │   ├── pipes/
        │   │   └── validation.pipe.ts
        │   └── services/
        │       ├── email.service.ts
        │       ├── geocoding.service.ts
        │       └── sms.service.ts
        ├── config/
        │   ├── config.module.ts
        │   ├── configuration.ts
        │   └── validation-schema.ts
        ├── dashboard/
        │   ├── dto/
        │   │   └── dashboard.dto.ts
        │   ├── dashboard.controller.ts
        │   ├── dashboard.module.ts
        │   └── dashboard.service.ts
        ├── earnings/
        │   ├── dto/
        │   │   └── earnings.dto.ts
        │   ├── earnings.controller.ts
        │   ├── earnings.module.ts
        │   └── earnings.service.ts
        ├── faqs/
        │   ├── dto/
        │   │   ├── create-faq.dto.ts
        │   │   └── update-faq.dto.ts
        │   ├── entities/
        │   │   └── faq-item.entity.ts
        │   ├── faqs.controller.ts
        │   ├── faqs.module.ts
        │   └── faqs.service.ts
        ├── notifications/
        │   ├── dto/
        │   │   ├── create-notification.dto.ts
        │   │   ├── mark-as-read.dto.ts
        │   │   └── update-notification.dto.ts
        │   ├── entities/
        │   │   └── notification.entity.ts
        │   ├── notifications.controller.ts
        │   ├── notifications.module.ts
        │   └── notifications.service.ts
    ├── offers/
        │   ├── dto/
        │   │   ├── create-offer.dto.ts
        │   │   ├── offer-details.dto.ts
        │   │   └── update-offer.dto.ts
        │   ├── entities/
        │   │   └── offer.entity.ts
        │   ├── offers.controller.ts
        │   ├── offers.module.ts
        │   └── offers.service.ts
        ├── payments/
        │   ├── dto/
        │   │   ├── create-pix-charge.dto.ts
        │   │   └── request-withdrawal.dto.ts
        │   ├── entities/
        │   │   └── transaction.entity.ts
        │   ├── payments.controller.ts
        │   ├── payments.module.ts
        │   └── payments.service.ts
        ├── prisma/
        │   ├── prisma.module.ts
        │   └── prisma.service.ts
        ├── providers/
        │   ├── dto/
        │   │   ├── provider-details.dto.ts
        │   │   ├── provider-search.dto.ts
        │   │   ├── provider-service.offering.dto.ts
        │   │   └── update-provider-profile.dto.ts
        │   ├── entities/
        │   │   └── provider.entity.ts
        │   ├── providers.controller.ts
        │   ├── providers.module.ts
        │   └── providers.service.ts
        ├── provider-services/
        │   ├── dto/
        │   │   ├── create-provider-service.dto.ts
        │   │   ├── provider-service-details.dto.ts
        │   │   └── update-provider-service.dto.ts
        │   ├── entities/
        │   │   └── provider-service.entity.ts
        │   ├── provider-services.controller.ts
        │   ├── provider-services.module.ts
        │   └── provider-services.service.ts
        ├── reviews/
        │   ├── dto/
        │   │   └── get-reviews.dto.ts
    │   │   ├── review.dto.ts
        │   │   ├── smart-suggestions.dto.ts
        │   │   └── submit-review.dto.ts
        │   ├── entities/
        │   │   └── review.entity.ts
        │   ├── reviews.controller.ts
        │   ├── reviews.module.ts
        │   └── reviews.service.ts
        ├── search/
        │   ├── dto/
        │   │   ├── provider-service-search-result.dto.ts
        │   │   └── search-query.dto.ts
        │   ├── search.controller.ts
        │   ├── search.module.ts
        │   └── search.service.ts
        ├── services/
        │   ├── dto/
        │   │   ├── create-service.dto.ts
        │   │   ├── service-details.dto.ts
        │   │   └── update-service.dto.ts
        │   ├── entities/
        │   │   └── service.entity.ts
        │   ├── services.controller.ts
        │   ├── services.module.ts
        │   └── services.service.ts
        ├── sms/
        │   ├── sms.module.ts
        │   └── sms.service.ts
        ├── types/
        │   └── express-request.d.ts
        ├── users/
        │   ├── dto/
        │   │   ├── update-user.dto.ts
        │   │   └── user-profile.dto.ts
        │   ├── entities/
        │   │   └── user.entity.ts
        │   ├── users.controller.ts
        │   ├── users.module.ts
        │   └── users.service.ts
  │   ├── verification/
    │   │   ├── dto/
    │   │   │   ├── liveness-result.dto.ts
    │   │   │   ├── ocr-result.dto.ts
    │   │   │   ├── submit-cpf.dto.ts
    │   │   │   ├── upload-document.dto.ts
    │   │   │   └── upload-selfie.dto.ts
    │   │   ├── entities/
    │   │   │   └── ... (entidades de verificação se houver)
    │   │   ├── services/
    │   │   │   ├── criminal-background-check.service.ts
    │   │   │   └── document-processing.service.ts
    │   │   ├── verification.controller.ts
    │   │   ├── verification.module.ts
    │   └── │   └── verification.service.ts
    │   ├── app.controller.spec.ts
    │   ├── app.controller.ts
    │   ├── app.module.ts
    │   ├── app.service.ts
    │   └── main.ts
    ├── test/
    │   ├── app.e2e-spec.ts
    │   └── otp_retriever.py