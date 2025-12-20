# Loyalty Module

`LoyaltyModule` is the gamification engine that tracks, awards and redeems points for users. It stitches together `PrismaModule`, `UsersModule`, `CouponsModule` and `MissionsModule`, exposes protected endpoints (`LoyaltyController`) and encloses the business rules inside `LoyaltyService` (multipliers, ledger, redemption, tier recalculation).

## Architecture & dependencies

- **loyalty.module.ts** imports `PrismaModule`, `forwardRef(() => UsersModule)`, `CouponsModule`, `MissionsModule`, registers `LoyaltyController` and `LoyaltyService`, and exports the service for other modules (e.g., `bookings`, `missions`).  
- **loyalty.controller.ts** is guarded with `JwtAuthGuard`; Swagger decorators document `/me`, `/me/history`, `/rewards`, and `/redeem`.  
- **loyalty.service.ts** depends on `PrismaService` and `CouponsService`. It offers idempotent point grants (`addPoints`), redemption into coupons (`redeemPoints`), point balance/history reads, catalog queries (`getActiveRewards`), tier recalculations, and placeholder helpers for streaks/reviews. Logging includes telemetry tags (`loyalty_points_earned`, `loyalty_redeem_attempt`, etc.).

## Endpoints (`loyalty.controller.ts`)

| Method | Route | Guard + Role | Responsibility |
| --- | --- | --- | --- |
| `GET /loyalty/me` | `JwtAuthGuard` | Returns `{ userId, currentPoints }` via `getUserPoints`. |
| `GET /loyalty/me/history` | `JwtAuthGuard` | Streams authenticated user’s loyalty transactions (`getLoyaltyHistory`). |
| `GET /loyalty/rewards` | `JwtAuthGuard` | Paginates active rewards with optional `limit`, `offset`, `type`, `q` filters (`getActiveRewards`). |
| `POST /loyalty/redeem` | `JwtAuthGuard` | Accepts `RedeemPointsDto` (points, rewardId, rewardType) and delegates to `redeemPoints` to emit a coupon reward and decrement balance. |

## Service flows (`loyalty.service.ts`)

1. **`addPoints(dto)`** – Validates `userId` and positive points, applies tier/streak/review multipliers (placeholders log warnings until implemented), enforces idempotency on `{userId,type,referenceId}`, upserts `loyalty.currentPoints`, writes a `loyaltyTransaction`, logs telemetry, and returns the new balance. Campaign hooks (e.g., referral doubling in August) apply before persistence.
2. **`redeemPoints(userId, redeemData)`** – Ensures reward type is `DISCOUNT_COUPON`, points match reward cost, verifies the catalog entry (`Reward`), creates a personalized coupon via `CouponsService.create`, decrements `loyalty.currentPoints`, records a negative transaction, logs telemetry (`loyalty_points_redeemed`), and returns `{ success, couponCode, expiresAt }`.
3. **`getUserPoints` / `getLoyaltyHistory`** – Simple reads guarded by `BadRequestException` when `userId` missing; history returns DESC transactions.
4. **`getActiveRewards(limit?, offset?, type?, q?)`** – Queries `Reward` table for active entries, supports filters, ordering, and pagination. Used by `/loyalty/rewards`.
5. **Tier & decay helpers** – `recalculateUserTiers` iterates loyalty rows, sums points over the last 90 days, determines tier (`BRONZE`, `PRATA`, `OURO`, `PLATINA`) and (placeholder) writes to loyalty records; `expireOldPoints` sketches logic for aging points older than 180 days (calls are conceptual, pending real modeling). Helper stubs (`getUserTier`, `getUserBookingStreak`, `hasRecentGoodReview`) log warnings and currently return defaults but indicate where logic should live.

## DTOs and models

- `AddPointsDto` (`userId`, `points`, `type`, `referenceId`) drives external modules (`missions`, `bookings`, `referrals`) to credit points.  
- `RedeemPointsDto` (`pointsToRedeem`, `rewardType`, `rewardId`) powers `/loyalty/redeem`.  
- `CouponApplicationResult` is generated when loyalty redemption emits a coupon via `CouponsService`.  
- Prisma models: `Loyalty` (userId PK, currentPoints) and `LoyaltyTransaction` (points, type enum) plus `Reward`.  
- Enums: `LoyaltyTransactionType` includes `REFERRAL`, `REDEEM`, etc., and guides telemetry/duplicates.

## Operational notes

- **Idempotency** – `addPoints` checks `loyaltyTransaction` unique index on `(userId, type, referenceId)` to avoid double-crediting; existing records return current balance unchanged.  
- **Telemetry/logging** – Logger statements embed `[TELEMETRY] loyalty_*` tags to track issuance, redemption attempts, tier recalculation, and expiration warnings.  
- **Coupons integration** – Redemption creates single-use coupons (`issuedBy: 'LOYALTY_REDEEM'`), tying them to `userId` so only the redeemer can apply them.  
- **Multipliers** – Tier, streak and review multipliers are placeholders but show the intended points formula (`floor(points × m_tier × m_streak × m_review)`); addPoints also demonstrates seasonal boosts (e.g., doubling referral points in August).  
- **Rewards catalog** – `getActiveRewards` shows friendly metadata (name, description, costPoints, value) for the UI; controllers parse `limit/offset/type/q` from query strings.

## Recommendations

1. Connect `addPoints` to downstream hooks (bookings completion, missions, referrals, review submission) and supply meaningful `referenceId`/`type` so idempotency works; log the source for each credit.  
2. Materialize the tier/streak/review helpers by reading actual booking/review tables (and adding `UserTier` or extra columns) before leaning on `recalculateUserTiers` or `expireOldPoints`.  
3. When adding more reward types, expand `redeemPoints` to branch on `rewardType` (wallet credits, badges) and keep `Reward` entries synchronized with front-end catalog filters.  
