# Audit Compliance Backend

## Consent Wiring
- **Status**: PASS
- **Details**: `/compliance/consents` now logs structured metadata and `AuthService.registerClient`/`registerProvider` call `ComplianceService.recordConsent` with the default `TERMS`, `PRIVACY`, and `COOKIES` versions, persisting IP/UA context and supporting idempotent upserts for every new user (`src/compliance/compliance.service.ts`, `src/auth/auth.controller.ts`, `src/auth/auth.service.ts`).

## Backend
- Compliance routes and module wiring were finalized so that the service is available globally, the controller consumes `RecordConsentDto`, and onboarding automatically records consents before returning the login payload (`src/compliance/compliance.controller.ts`, `src/compliance/compliance.module.ts`, `src/app.module.ts`, `src/auth/auth.module.ts`).

## Insurance & Consent Tests
- Consent behavior is covered by `backend-cleaning/src/compliance/compliance.service.spec.ts`, proving metadata persistence and idempotency.

## Booking Insurance Summary
- **Status**: UPDATED
- **Details**: The booking review front-end now consumes backend-driven `quote.insuranceOptions` and honors the extra “Sem Proteção” choice without hardcoding plan data, keeping `insurancePlanId`/`insuranceFeeCents` tied to the persisted insurance plan selection (`components/booking/InsuranceOptionsCard.tsx`, `app/client/bookings/schedule-service.tsx`).

## Contact Leak Guard
- **Status**: PASS
- **Details**: Introduced regex detection for PHONE/EMAIL/LINK leaks, a `MessagePolicyHit` audit table, and the `ContactLeakPolicyService`, which hashes detections, persists hits, drives SANITIZED/BLOCKED enforcement inside chat/dispute flows, and fires metric counters and notifications whenever sensitive content is discovered (`prisma/schema.prisma`, `prisma/migrations/20260105120000_add_message_policy_hit/migration.sql`, `src/common/services/contact-leak-policy.service.ts`, `src/chat/chat.service.ts`, `src/disputes/dispute.service.ts`, `src/metrics/prometheus.ts`).

## Testing
- Leak detection is validated by `backend-cleaning/src/common/services/contact-leak-detector.service.spec.ts`, covering the PHONE/EMAIL/LINK regexes and the hashed match helper.
