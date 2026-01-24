Commit: 47db0db2d23a815adcc498cbff64b886423aaa62
Generated: 2025-12-20 12:11:36
Scope: backend-cleaning (webhooks)

# WEBHOOK SECURITY REPORT

## 1. Webhook inventory
### /payments/webhook/pix (PaymentsWebhooksController.handlePixWebhook)
- **Signature validation:** guarded by PspWebhookGuard (ackend-cleaning/src/payouts/guards/psp-webhook.guard.ts:1-122) which enforces header x-event-id, timestamp window (x-event-time), and HMAC verification via erifyPspSignature with psp.webhookSecret. If the secret is missing or the HMAC fails, the guard returns ForbiddenException.
- **Idempotency & replay protection:** guard writes TTL key webhook:psp: into CacheService (psp-webhook.guard.ts:56-74) so duplicate event IDs are stopped and replayed requests short-circuit with { ok: true, replay: true }.
- **Logs/sensitive data:** PaymentsService.handlePixWebhook logs the entire parsed payload with console.log('>>> WEBHOOK PARSED:', data); and warns on JSON parsing failure (payments.service.ts:454-620), potentially exposing PIX references; raw body logging occurs earlier in main.ts middleware (ackend-cleaning/src/main.ts:67-99).
- **Gaps:** the controller still calls erifyPspSignature indirectly but psp-webhook.guard depends on psp.webhookSecret being configured (config.module.ts:69-78 warns when missing); also the guard only caches event IDs but does not persist to WebhookReplay table (exists in schema prisma/schema.prisma:1057-1062).
- **Minimal patch proposal:** (1) extend PaymentsService.handlePixWebhook to avoid console.log of full payload, replacing with structured logs that mask eference_id (e.g., logger.log('PIX webhook for booking=...', { referenceId: ref })). (2) Leverage WebhookReplay table inside guard when TTL cache misses to persist seen IDs, preventing cross-instance replay if cache cleared. (3) Ensure psp.webhookSecret (and PIX_WEBHOOK_SECRET for HMAC) are required in production via config validation (config.module.ts).

### /payments/webhook/withdrawal (PaymentsWebhooksController.handleWithdrawalWebhook)
- **Signature validation:** same guard PspWebhookGuard validates x-signature, x-event-id, and timestamp before hitting controller (payments.webhooks.controller.ts:25-57). The controller also receives raw headers so it does not re-validate.
- **Idempotency/replay:** guard handles caching/response as above. The service PaymentsService.handleWithdrawalWebhook (see payments.service.ts near signature) may check ledger but relies on guard for replay.
- **Logs:** not explicit; ensure service avoids logging sensitive event payload without masking (currently not printed). main.ts raw body middleware also prints success/failure messages when parsing, which could log webhook body if configured.
- **Patch suggestion:** ensure PaymentsService.handleWithdrawalWebhook logs only event metadata (IDs/status) and consider reusing WebhookReplay persistence for audit long-term (psp-webhook.guard.ts insult). Without code, recommendation is to add logger.debug with masked data.

### /payouts/webhook/gateway (PayoutsWebhookController.handleGatewayWebhook)
- **Signature validation:** same PspWebhookGuard guard applies (controller is decorated with @UseGuards(PspWebhookGuard) and shares signature/timestamp logic). Guard ensures psp.webhookSecret, x-signature, x-event-id, tolerance window, and TTL cache for replay detection.
- **Idempotency:** guard caches eventId TTL but the service also stores WebhookReplay records (ackend-cleaning/src/payouts/payouts.service.ts:576-615) during handleGatewayWebhook, returning early when exists. That covers persistent replay detection across nodes.
- **Logs:** current implementation logs standard info (PayoutsService.handleGatewayWebhook likely logs status) but does not print entire payload. However, main.ts still logs raw parse success for both PIX and PSP on each request, which may log sensitive amounts/ids if not silenced. payouts.service also uses logger.warn when signature fails (per guard). Additional caution needed for eq.rawBody in middleware.
- **Gaps:** signature guard uses cacheService TTL but not the WebhookReplay DB for PIX (only for payouts service). For /payouts/webhook/gateway, service already writes to table, so consistent. Another gap is absence of strict request body schema validation; suggestions include applying DTO (class-validator) for payload to avoid processing unexpected fields.
- **Patch suggestion:** minimal patch to PayoutsWebhookController is to add class-validator DTO for payload and ensure logs mask payload data; also adjust middleware main.ts to remove console.log('[Webhook PIX] JSON parseado com sucesso') that prints the raw payload.

## 2. Additional notes
- main.ts middleware (ackend-cleaning/src/main.ts:67-146) reads raw body for both /payments/webhook/pix and /payouts/webhook/gateway, logging success or failure; these logs currently include the raw JSON string, which is sensitive. Recommendation: reduce to debug-level message without payload, and sanitize (mask eference_id/charge_id).
- Config validation (config.module.ts:69-80) warns when PIX_WEBHOOK_SECRET or PSP_WEBHOOK_SECRET missing; ensure production enforces these secrets (currently warning only). Add fail-fast to block service start when missing to avoid skipping signature validation.
- For PIX webhooks, once guard-based signature passes, PaymentsService.handlePixWebhook logs ledger creation but ensures idempotency at ledger entry level; consider also persisting event_id to WebhookReplay or similar to reconcile with global guard TTL.

## 3. Summary
- Pix webhook: guard ensures signature and replay via cache; service logs raw payload—mask before shipping; consider persisting event IDs for cross-instance replays.
- Withdrawal webhook: guard same as above; add structured logging and ensure service not exposing sensitive data; consider verifying idempotency-key header for webhook-specific id (if available).
- Payout gateway webhook: guard + service handle signature and replay (with WebhookReplay table). Add DTO validation and reduce logging noise.
- All: remove console.log statements in main.ts middleware that echo raw bodies, require secrets via config validation, and optionally persist event IDs for audit.

Open Questions
- Should WebhookReplay entries be cleaned up or capped to avoid storage bloat? (INFERRED: table exists but no TTL). 
- Are there other webhook endpoints (e.g., analytics) needing signature protection? Not found in current code. 
