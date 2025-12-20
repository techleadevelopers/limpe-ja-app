# Coupons Module

`CouponsModule` manages creation, validation, and application of promo codes. It wires `PrismaModule` plus DTOs (`CreateCouponDto`, `UpdateCouponDto`, `apply-coupon`), exposes admin/public routes (`CouponsController`), and keeps telemetry/logs inside `CouponsService`. The service also supports mission/referral/return issuance and ensures the welcome coupon exists.

## Architecture & imports

- `coupons.module.ts` registers `CouponsService` with `PrismaModule`.  
- `CouponsController` uses `JwtAuthGuard`, `RolesGuard`, and `@Roles(UserRole.CLIENT)` to protect ownership flows; Swagger annotations describe resolve/list/apply payloads.  
- `CouponsService` depends solely on `PrismaService`, but coordinates with `BookingsService` (first-booking flag, hooking `USAGE`), notifications/queues (outside this file), and telemetry via structured logger messages (`[TELEMETRY] coupon_*`).  
- Helpers `normalizeValueType` and `normalizeTarget` map legacy strings to `CouponType`/`CouponTarget` enums so DTOs can stay flexible.

## Controller endpoints (`coupons.controller.ts`)

- `GET /coupons/resolve/:code` – Authenticated clients can peek at a coupon, its eligibility, preview discount and message before applying; this method builds `bookingData` from optional query params and delegates to `CouponsService.resolveCoupon`.  
- `GET /coupons/me` – Lists active/general coupons plus any issued to the user; controller logs the request and returns DTOs via `CouponsService.getMyCoupons`.  
- `POST /coupons/apply` – Protected by JWT; expects `{code, bookingData}` (original price, optional provider/service/scheduled date). Ensures `clientId` is filled and returns `CouponApplicationResult` after `CouponsService.applyCoupon`.  
- (Comments show typical admin CRUD endpoints: create, list, update, find. They can be uncommented later if needed.)

## Service responsibilities (`coupons.service.ts`)

1. **CRUD fundamentals** – `create`, `findByCode`, `findAll`, `update` wrap Prisma operations, log telemetry (`coupon_created`, `coupon_updated`), normalize enum inputs, enforce uniqueness on `code`, and map `valueType`/`target`.  
2. **Apply coupon logic** – `applyCoupon` enforces validity window, `maxUses`, `status` (`CouponStatus.ACTIVE`), `issuedToUserId` ownership, `firstBookingOnly` (checks `client.completedBookingsCount`), and target restrictions (service/provider). The calculation respects `CouponType.PERCENT` vs `FIXED`, caps with `maxDiscount`, never returns negative totals, logs progress, and returns `CouponApplicationResult` with discount/new total/message/coupon details.  
3. **State transitions** – `markCouponAsUsed` increments `usesCount`, flips to `CouponStatus.USED_UP` when the limit is reached, logs `coupon_used` telemetry, and is intended to be invoked from the booking completion flow.  
4. **Issuance helpers** –  
   * `issueCouponFromMission` creates mission rewards (`CouponType.PERCENT`, general target) with `issuedBy: 'MISSION'`.  
   * `issueReturnCoupon` seeds return-to-platform credits after a booking (`RETURN_COUPON`).  
   * `issueReferralReferredCoupon` & `issueReferralReferrerCoupon` issue welcomed/referrer redemptions with `firstBookingOnly` and `CouponType.PERCENT`/`FIXED` values, logging `referral_*` telemetry.  
5. **Resolve endpoint** – `resolveCoupon` reuses `applyCoupon` to surface `eligibility` plus previewed discount (but does not mutate coupon) and logs `coupon_resolved`.  
6. **User-facing lists** – `getMyCoupons` ensures `ensureWelcomeCoupon` ran, fetches active/used/expired coupons filtered by `issuedToUserId` or general target, derives statuses, and returns sorted list.  
7. **Welcome coupon guard** – `ensureWelcomeCoupon` creates a personalized `WELCOME_NEW_USER` coupon (20% up to R$50, first-booking only) if not already issued.

## DTOs & models

- `CreateCouponDto` – `code`, `validFrom`, `validUntil`, `type`, `target`, `value`, `targetId`, `maxUses`, `firstBookingOnly`, optional `issuedToUserId/issuedBy/maxDiscount`.  
- `UpdateCouponDto` – partial version for modifying `value`, `status`, `expires`, `target`, `maxDiscount`, `maxUses`.  
- `CouponApplicationResult` – returned by both `applyCoupon` and `resolveCoupon`, includes `discountAmount`, `newTotalPrice`, `message`, and the `coupon` entity.  
- Prisma `Coupon` entity contains `code`, `valueType` (`PERCENT`/`FIXED`), `target` (NEW_CLIENTS, SPECIFIC_SERVICE, etc.), `usesCount/maxUses`, `status`, `issuedToUserId`, `issuedBy`, `firstBookingOnly`, `maxDiscount`, timestamps, and `validFrom/validUntil`.  
- `CouponTarget` and `CouponType` enums drive eligibility and calculations.

## Operational notes

- Logging is pervasive (`Logger`), helping trace coupon creation, application, issuance, telemetry events, and warnings (invalid code, unauthorized user, exhausted coupon).  
- The service is idempotent for application: it never mutates `usesCount` when computing a preview; increments happen explicitly via `markCouponAsUsed`.  
- `normalization` helpers keep old payloads working by mapping strings like `NEW_CUSTOMER`, `REFERRAL_REFERRER` or `FIXED_AMOUNT` into Prisma enums.  
- Telemetry tags (`coupon_created`, `coupon_applied`, `mission_coupon_issued`, etc.) record coupon lifecycle events, simplifying analytics and marketing/audit trails.  
- Example integration: call `ensureWelcomeCoupon` before listing user coupons so each account gets a welcome offer automatically.

## Recommendations

1. Tie `bookings` completion hook to `CouponsService.markCouponAsUsed` so that coupons attached to bookings increment `usesCount` only after payment/finish.  
2. Cache popular codes somewhere (Redis) if `applyCoupon` becomes hot, invalidating when `update`/`markCouponAsUsed` runs.  
3. Extend resolve/apply responses with metadata (`target`, `issuedBy`, `maxDiscount`, `expiresAt`) for richer UI copy and better marketing telemetry.
