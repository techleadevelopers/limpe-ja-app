# Bookings Module

`BookingsModule` is the operational hub of the Limpeja marketplace. It keeps the booking lifecycle coherent (from client request to provider completion and payment), coordinates notifications and disputes, and integrates financial ledger entries, loyalty, missions, referrals, pricing, coupons, and PIN/PIX charges.

## Architecture and dependencies

- **bookings.module.ts** wires `PrismaModule`, `ClientsService`, `ProvidersService`, `ProviderServicesService`, `PaymentsService` (via `forwardRef`), `NotificationsService`, `QueuesService`, `PricingService`, `CouponsService`, `LoyaltyService`, `MissionsService`, `ReferralsService`, `RedisLockService`, and `I18nService`.
- **bookings.controller.ts** protects each route with `JwtAuthGuard` and uses `RolesGuard`/`@Roles` for admin/client/provider flows; Swagger decorators describe every endpoint.
- **bookings.service.ts** hosts the business logic, handling locks, status transitions, cron jobs, ledger entries, telemetry logs, loyalty boosts, missions events, and notification dispatch through helper methods such as `notifyClientStatusUpdate`, `getScheduledAtInSaoPaulo`, and `BookingWithDetailsRelations` includes.
- **Supporting DTOs** include `BookingDetailsDto`, `BookingAndPixResponseDto`, `ReportDisputeDto`, and primitives like `BookingStatus`.

## Main endpoints (bookings.controller.ts)

| Method | Route | Guards / Role | Responsibility |
| --- | --- | --- | --- |
| `GET /bookings` | admin list | `JwtAuthGuard` + `RolesGuard` + `@Roles(UserRole.ADMIN)` | List all bookings with optional `status` filter and detailed relations. |
| `POST /bookings` | create booking | `@Roles(UserRole.CLIENT)` | Calls `create`, enforces redis lock, applies pricing/coupons, logs telemetry, and returns `BookingDetailsDto`. |
| `POST /bookings/schedule-and-pay` | create + PIX | `@Roles(UserRole.CLIENT)` | Wraps `create` + `PaymentsService.createPixCharge`, returning `BookingAndPixResponseDto`. |
| `GET /bookings/me` | user list | `JwtAuthGuard` | `findUserBookings` with optional `status` for clients/providers/admins. |
| `GET /bookings/:id` | booking detail | `JwtAuthGuard` | Returns `BookingDetailsDto` via `findOne`. |
| `PATCH /bookings/:id/status` | update status | `@Roles(UserRole.CLIENT, UserRole.PROVIDER)` | `updateStatus` enforces allowed transitions, windows, payments, notifications, ledger entries, loyalty, missions, and referral logic. |
| `PATCH /bookings/:id/cancel` | cancel by client | `@Roles(UserRole.CLIENT)` | Cancels (status -> `CANCELED`) after verifying ownership. |
| `GET /bookings/check-active-chat/:clientId/:providerId` | chat availability | `JwtAuthGuard` | `checkActiveChatBooking` tracks confirmed/started bookings to decide if chat can open. |
| `POST /bookings/:id/report-issue` | report problem | `@Roles(UserRole.CLIENT, UserRole.PROVIDER)` | Signs reason, notifies admin, and flips status to `PENDING_DISPUTE`. |
| `POST /bookings/:id/dispute` | file dispute | same guards | Queues `process-booking-dispute` job and updates status via service. |
| `PATCH /bookings/:id/resolve-dispute` | resolve dispute | `@Roles(UserRole.ADMIN)` | Applies refunds (if any), updates status (default `FINISHED`), records ledger entries, sends notifications, and logs telemetry. |
| `POST /bookings/:id/on-the-way` | provider en route | `@Roles(UserRole.PROVIDER)` | Moves `CONFIRMED → ON_THE_WAY` and notifies the client. |
| `POST /bookings/:id/arrived` | provider arrived | same guard | `ON_THE_WAY → ARRIVED`, updates timestamp, notifies, and allows start. |
| `POST /bookings/:id/start` | start service | `@Roles(UserRole.PROVIDER)` | Validates ±15 min window, sets `startedAt`, and transitions to `STARTED`. |
| `POST /bookings/:id/complete` | complete service | same guard | Requires payment `PAID`, updates `completedAt`, notifies finish, and prepares ledger entries. |
| `POST /bookings/auto-complete-overdue` | admin trigger | `@Roles(UserRole.ADMIN)` | Forces `STARTED` bookings past expected end to `FINISHED`. |
| `GET /bookings/:id/can-review` | review eligibility | `JwtAuthGuard` | `canReview` ensures `FINISHED`, payment `PAID`, time window passed, and review not already stored. |

## BookingService flows (bookings.service.ts)

1. **Create** – `create` uses `RedisLockService` to guard concurrent requests, fetches client/provider/providerService, normalizes duration/areas, runs pricing/coupon logic, persists the booking with rich relations, applies loyalty/missions/referral hooks, and enqueues notifications (`QueuesService` + `NotificationsService`). Telemetry `booking_created` captures ids, amounts, and coupon usage.
2. **Schedule + pay** – `createBookingAndPixCharge` reuses `create`, maps `BookingDetailsDto`, and requests a PIX charge from `PaymentsService`, surfaced through `/schedule-and-pay`.
3. **Lookup helpers** – `findUserBookings`, `findOne`, `findUpcomingBookings`, `checkConfirmedBookingBetweenUsers`, `checkActiveChatBooking`, `canReview`, `getDemandCountForArea` provide filtered reads with all includes (`client.user`, `provider.user`, `providerService.service`, `paymentIntent`, `coupon`, `incidents`, `guaranteeClaims`, `address`, `subscription`).
4. **Status transitions** – `updateStatus` enforces allowed transitions per role, checks for payment completion, enforces start/end windows, increments counters (`completedBookingsCount`, `monthlyBookingsCount`), awards loyalty points, triggers missions (`booking.completed`, `first_booking_completed`), enqueues review requests, and creates ledger entries (`EARNING`, `HOLD`/`FEE`) using `COMMISSION_RATE`. Admin role bypasses restrictions.
5. **Provider workflow helpers** – `onTheWayService`, `arriveAtLocation`, `startService`, `completeService` wrap the commonly used chains, rely on `notifyClientStatusUpdate` to push `QueuesService` updates, and each feeds `BookingDetailsDto`.
6. **Dispute management** – `reportIssue`/`reportDispute` both validate ownership via `ClientsService`/`ProvidersService`, set status `PENDING_DISPUTE`, and enqueue queue-based jobs (`addNotificationJob`, `addDisputeJob`). `resolveDispute` handles refunds (`prisma.transaction`), updates ledger entries, notifies both sides, and emits `dispute_resolved` telemetry.
7. **Auto-complete cron** – `autoCompleteOverdueBookings` scans `STARTED` bookings whose expected end passed, ensures payment `PAID` (no refunds or chargebacks), marks them `FINISHED`, notifies client/provider, and runs automatically every minute through `@Cron(CronExpression.EVERY_MINUTE)`.
8. **Subscription + demand helpers** – `createBookingFromSubscription` allows subscriptions to seed bookings with duration/overlap checks; `getDemandCountForArea` counts future bookings within a 2-hour window for a service, supporting dynamic pricing.

## Models and DTOs

- **`BookingDetailsDto`** – maps `BookingWithDetailsRelations` to API responses, bundling client/provider info, review data, address, payment intent, coupon, timestamps, and status.
- **`BookingAndPixResponseDto`** – pairs the booking DTO with the PIX charge response from `PaymentsService`.
- **`ReportDisputeDto`** – exposes `reason`, `description`, optional `refundAmount`, and attachments to the dispute queue.
- **`BookingWithDetailsRelations`** – Prisma payload including `client` (with user), `provider` (with user), `providerService` (with service), `review`, `address`, `subscription`, `incidents`, `guaranteeClaims`, `coupon`, `paymentIntent`.
- **`BookingStatus` enum** – defines `PENDING`, `CONFIRMED`, `ON_THE_WAY`, `ARRIVED`, `STARTED`, `FINISHED`, `CANCELED`, `REJECTED`, `RESCHEDULED`, `PENDING_DISPUTE`, etc., and fuels state machine logic inside `updateStatus`.

## Observability, locking, and security

- **Logging + I18n** – methods log intent (`[BookingsService] ...`) and translate error messages (`booking.notFound`, `booking.badRequest.*`, `dispute.forbidden.*`) via `I18nService`.
- **Redis locking** – `create` uses `redisLockService.acquireLock`/`releaseLock` with TTL 15s to avoid duplicated bookings for the same client/provider/slot, returning `booking.conflict.concurrentCreation` on clashes.
- **Telemetry** – the service emits structured telemetry for loyalty points, booking creation, dispute reporting/resolution, refund processing, etc.
- **Notification queues** – `QueuesService` and `NotificationsService` send status updates, dispute resolution alerts, review requests, and also back the dispute worker (`addDisputeJob`). The `notifyClientStatusUpdate` helper centralizes messages for ON_THE_WAY, ARRIVED, STARTED, and FINISHED.
- **Financial guardrails** – `PaymentsService`, `PaymentIntentStatus`, ledger entries, and `COMMISSION_RATE` ensure bookings only finish when paid, and the platform fee is captured (`LedgerEntryType.EARNING`, `FEE`).

## Recommendations

1. Monitor the cron `autoCompleteOverdueBookings` (requires `ScheduleModule`) so overdue `STARTED` bookings cannot linger; alert if the job fails frequently.  
2. Keep client POSTs idempotent: reuse the redis lock key and optionally send `Idempotency-Key` headers to avoid duplicate bookings.  
3. Always resolve blocking disputes through `reportDispute` + `resolveDispute` before manual ledger adjustments; the queue job captures attachments and records telemetry for audits.  
