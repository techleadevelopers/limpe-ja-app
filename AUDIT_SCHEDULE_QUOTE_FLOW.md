# Audit Schedule Quote Flow

## Summary
- Stabilized the schedule→quote interaction with a single source of truth for the inputs that build the booking quote, versioning the request key (`pricingVersion=v1`) so cached quotes stay aligned with pricing rules, and keeping the last fetched quote during background refreshes.
- Hardened the backend quote machinery by deriving `quoteHash` (and the Redis cache key) from a normalized request key, introducing a 60-second cache, and giving each price validation error a `code`+`message`.
- Updated related UI pieces so coupons/insurance toggle state and slot touches naturally trigger new quotes without calling `refreshQuote` during render.

## Frontend
- Added `useDebouncedValue` to derive a stable request key from provider time slots, location, insurance selection, and coupon, and rewired `useBookingQuote` to consume only that key plus the sanitized payload.
- Reimplemented `useBookingQuote` to dedupe inflight requests, honor rate-limited responses, stall-for-refresh (stale-while-revalidate), expose `(quote, status, error, refreshQuote, canQuote, lastRequestKey, rateLimitResetAt)`, and surface a `'refreshing'` status plus rate-limit timers so the UI can keep the old quote visible while refreshing.
- Split coupon input/value tracking so applying a coupon merely updates state and lets the debounced key trigger a quote, while `useCouponValidation`, `BookingSummaryPreview`, and `InsuranceOptionsCard` no longer call `refreshQuote` during render.
- Time slot taps now exit early when the slot is already selected and memoize render callbacks/items to reduce re-renders.

## Backend
- `quotePrice` now normalizes a request key (with `pricingVersion`), logs every request/cache hit, checks the Redis cache (TTL 60s), and only recalculates pricing when the cache misses; the same key is hashed to produce `quoteHash`.
- `create` now validates client-sent `quoteExpiresAt`, rejecting stale quotes with `QUOTE_EXPIRED` before persisting so the completed booking never relies on an outdated price.
- `calculateQuoteForBooking` accepts the prebuilt request key/payload so the hash stays consistent between quoting and booking, narrowing the scope for `PRICE_MISMATCH`.
- All price validations from `calculateServiceTotalPrice` now throw `BadRequestException` payloads that include both a `code` and a localized `message`.

## Testing
- `hooks/useBookingQuote.test.tsx`: new coverage for missing payloads, stale responses, forced refreshes, and 400 handling under the rewritten hook.
- `backend-cleaning/src/bookings/bookings.service.spec.ts`: added cache interaction tests and deterministic `quoteHash` assertions.
- `backend-cleaning/src/bookings/bookings.service.spec.ts`: also validates that expired quotes are rejected before creating a booking.
- `backend-cleaning/src/bookings/pricing/price-calculator.spec.ts`: extended assertions to cover error codes for missing hourly prices, missing duration, and negative totals.
