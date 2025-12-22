# Frontend–Backend Contract (ViewDto Guardrails)

## Principle
Frontend screens must rely exclusively on the ViewDto objects emitted by the backend. No client-side logic should inspect Prisma enums, status strings, or user roles. All business decisions (accept/reject visibility, verified badges, chat CTA, earnings availability) are delegated to the backend, so changes to these DTOs are breaking API contracts.

## ViewDto inventory

- `ProviderViewDto` – extends `ProviderDetailsDto` with `isVerified`.
- `MissionViewDto` – conveys mission metadata plus `isCompleted`.
- `BookingViewDto` – extends `BookingDetailsDto` and carries `badgeLabel`, `showAcceptRejectActions`, and `showChatAction`.
- `ProviderEarningsViewDto` – expresses `showEarnings` and `canWithdraw` controls.

## Contract language

1. Frontend must always render fields provided by these DTOs; never derive flags from `BookingStatus`, `MissionStatus`, `VerificationStatus`, or `UserRole`.
2. Altering a ViewDto's shape or semantics is a breaking change that requires API versioning / coordinated rollout.
3. Backend services remain the sole source of truth for navigation/CTA decisions; the frontend only paints what the DTO says.
