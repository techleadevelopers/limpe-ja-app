# Backend Business Analysis
- Files scanned: **16820**
- Controllers: **62**
- Services: **75**
- DTOs: **121**

## Routes

- **GET** `/` → `getHello`
- **POST** `/'<%= dasherize(name` → `create`
- **GET** `/'<%= dasherize(name` → `findAll`
- **GET** `/'<%= dasherize(name/:id` → `findOne`
- **PATCH** `/'<%= dasherize(name/:id` → `update`
- **DELETE** `/'<%= dasherize(name/:id` → `remove`
- **GET** `/` → `getHello`
- **GET** `/` → `getHello`
- **GET** `/health` → `getHealth`
- **GET** `/admin/dashboard/metrics` → `getMetrics`
- **GET** `/admin/dashboard/revenue-trend` → `getRevenueTrend`
- **GET** `/admin/health` → `getHealth`
- **POST** `/admin/payments/pix/force-confirm` → `forceConfirm`
- **POST** `/admin/payments/bookings/:id/force-status` → `forceStatus`
- **GET** `/admin/providers` → `listProviders`
- **PATCH** `/admin/providers/:id/visibility` → `updateVisibility`
- **GET** `/admin/queues/status` → `getQueuesStatus`
- **GET** `/admin/queues/:queueName/jobs` → `getJobs`
- **POST** `/admin/queues/:queueName/jobs/:jobId/retry` → `retryJob`
- **GET** `/admin/settings/slas` → `getSlas`
- **PUT** `/admin/settings/slas` → `updateSlas`
- **GET** `/admin/settings/slas/history` → `getSlasHistory`
- **GET** `/admin/settings/general` → `getGeneral`
- **PUT** `/admin/settings/general` → `updateGeneral`
- **GET** `/admin/settings/general/history` → `getGeneralHistory`
- **GET** `/admin/settings/pricing/history` → `getPricingHistory`
- **GET** `/live-status` → `getLiveStatus`
- **POST** `/analytics/events` → `receiveEvent`
- **GET** `/admin/activities` → `getActivities`
- **POST** `/auth/register/client` → `registerClient`
- **POST** `/auth/register/provider` → `registerProvider`
- **POST** `/auth/login` → `login`
- **POST** `/auth/logout-device` → `logoutDevice`
- **POST** `/auth/forgot-password` → `forgotPassword`
- **POST** `/auth/password/reset/confirm` → `confirmPasswordReset`
- **GET** `/providers/:providerId/availability` → `getAvailability`
- **PATCH** `/providers/:providerId/availability` → `updateAvailability`
- **POST** `/providers/:providerId/availability` → `createAvailability`
- **DELETE** `/providers/:providerId/availability/:availabilityId` → `deleteAvailability`
- **GET** `/providers/me/availability` → `getMyAvailability`
- **PATCH** `/providers/me/availability` → `updateMyAvailability`
- **POST** `/providers/me/availability` → `createMyAvailability`
- **POST** `/providers/me/availability/bulk` → `createBulkAvailability`
- **DELETE** `/providers/me/availability/:availabilityId` → `deleteMyAvailability`
- **GET** `/bookings` → `findAllBookings`
- **POST** `/bookings` → `create`
- **POST** `/bookings/quote` → `quote`
- **POST** `/bookings/schedule-and-pay` → `scheduleAndPay`
- **POST** `/bookings/:id/proof/checkin` → `submitCheckinProof`
- **POST** `/bookings/:id/proof/checkout` → `submitCheckoutProof`
- **GET** `/bookings/me` → `findMyBookings`
- **GET** `/bookings/:id` → `findOne`
- **PATCH** `/bookings/:id/status` → `updateStatus`
- **POST** `/bookings/:id/accept` → `acceptBooking`
- **PATCH** `/bookings/:id/cancel` → `cancelBooking`
- **GET** `/bookings/check-active-chat/:clientId/:providerId` → `checkActiveChat`
- **POST** `/bookings/:id/report-issue` → `reportIssue`
- **POST** `/bookings/:id/dispute` → `reportDispute`
- **PATCH** `/bookings/:id/resolve-dispute` → `resolveDispute`
- **POST** `/bookings/:id/on-the-way` → `onTheWay`
- **POST** `/bookings/:id/arrived` → `arrive`
- **POST** `/bookings/:id/start` → `start`
- **POST** `/bookings/:id/start/manual` → `requestManualStart`
- **POST** `/bookings/:id/complete` → `complete`
- **POST** `/bookings/auto-complete-overdue` → `autoCompleteOverdue`
- **GET** `/bookings/:id/can-review` → `canReview`
- **GET** `/chat/find-or-create/provider/:providerId/client/:clientId` → `findOrCreateChat`
- **POST** `/chat/conversations/get-or-create` → `getOrCreateConversation`
- **POST** `/chat/:chatId/messages` → `sendMessage`
- **GET** `/chat/:chatId/messages` → `getMessages`
- **GET** `/chat/me/conversations` → `getMyConversations`
- **GET** `/clients/me/dashboard` → `getClientDashboard`
- **PATCH** `/clients/me` → `updateMyProfile`
- **GET** `/clients/:id` → `findOne`
- **PATCH** `/clients/:id` → `updateById`
- **POST** `/compliance/consents` → `recordConsent`
- **GET** `/compliance/consents/me` → `listConsents`
- **POST** `/compliance/dsar` → `requestAccess`
- **POST** `/compliance/erasure` → `requestErasure`
- **GET** `/config/pricing` → `getPricingConfig`
- **GET** `/connect/authorize` → `authorize`
- **GET** `/connect/callback` → `callback`
- **GET** `/connect/public-key` → `Key`
- **POST** `/connect/challenge` → `challenge`
- **POST** `/connect/application` → `createApplication`
- **GET** `/connect/application/:clientId` → `getApplication`
- **GET** `/coupons/resolve/:code` → `resolveCoupon`
- **GET** `/coupons/me` → `getMyCoupons`
- **POST** `/coupons` → `createCoupon`
- **GET** `/coupons/:code` → `findByCode`
- **GET** `/coupons` → `findAll`
- **PATCH** `/coupons/:id` → `updateCoupon`
- **POST** `/coupons/apply` → `applyCoupon`
- **GET** `/providers/me/dashboard` → `getDashboardData`
- **POST** `/disputes` → `create`
- **GET** `/disputes/pending-count` → `getPendingCount`
- **GET** `/disputes/:id` → `findOne`
- **GET** `/disputes` → `findAll`
- **POST** `/disputes/:id/message` → `addMessage`
- **PATCH** `/disputes/:id/status` → `updateStatus`
- **GET** `/providers/me/earnings` → `getEarnings`
- **POST** `/providers/me/earnings/withdrawal` → `requestWithdrawal`
- **POST** `/faqs` → `create`
- **GET** `/faqs` → `findAll`
- **GET** `/faqs/:id` → `findOne`
- **PATCH** `/faqs/:id` → `update`
- **DELETE** `/faqs/:id` → `remove`
- **POST** `/guarantee/claims` → `submitClaim`
- **GET** `/guarantee/claims/me` → `getClaimsForUser`
- **GET** `/guarantee/claims/:id` → `getClaimDetails`
- **PATCH** `/guarantee/claims/:id/status` → `updateClaimStatus`
- **GET** `/health/liveness` → `liveness`
- **GET** `/health/readiness` → `readiness`
- **POST** `/incidents` → `createClaim`
- **GET** `/incidents/:id` → `getClaim`
- **GET** `/insurance/plans` → `getPlans`
- **GET** `/loyalty/me` → `getMyPoints`
- **GET** `/loyalty/me/history` → `getMyLoyaltyHistory`
- **POST** `/loyalty/redeem` → `redeemPoints`
- **GET** `/loyalty/rewards` → `getRewards`
- **GET** `/meta/statuses` → `getStatuses`
- **GET** `/v1/metrics/me/summary` → `getCustomerSummaryMetrics`
- **GET** `/v1/metrics/me/timeseries` → `getCustomerTimeseriesMetrics`
- **GET** `/v1/metrics/me/funnel` → `getCustomerFunnelMetrics`
- **GET** `/metrics/prometheus` → `getMetrics`
- **GET** `/missions/my` → `myMissions`
- **POST** `/missions/claim` → `claim`
- **POST** `/notifications` → `create`
- **GET** `/notifications/me` → `getUserNotifications`
- **GET** `/notifications/stream` → `stream`
- **PATCH** `/notifications/me/mark-as-read` → `markNotificationsAsRead`
- **PATCH** `/notifications/:id/mark-as-read` → `markNotificationByIdAsRead`
- **POST** `/notifications/:id/ack` → `ackNotification`
- **DELETE** `/notifications/:id` → `deleteNotification`
- **POST** `/notifications/send` → `send`
- **POST** `/notifications/qa/send` → `sendQaNotification`
- **POST** `/notifications/schedule` → `schedule`
- **GET** `/notifications/suggestions` → `getSuggestions`
- **POST** `/notifications/quick-action/:action` → `executeQuickAction`
- **POST** `/notifications/register-token` → `registerToken`
- **POST** `/webhooks/whatsapp` → `handle`
- **POST** `/offers` → `create`
- **GET** `/offers` → `findAll`
- **GET** `/offers/:id` → `findOne`
- **PATCH** `/offers/:id` → `update`
- **DELETE** `/offers/:id` → `remove`
- **POST** `/payments/pix-charge` → `createPixCharge`
- **GET** `/payments/intent/:bookingId` → `getPaymentIntent`
- **POST** `/payments/withdrawal` → `requestWithdrawal`
- **GET** `/payments/transactions` → `listTransactions`
- **POST** `/payments/:transactionId/refund` → `refund`
- **GET** `/payments/withdrawals` → `listWithdrawals`
- **POST** `/payments/webhooks/register` → `registerWebhooks`
- **PATCH** `/payments/withdrawals/:id/approve` → `approveWithdrawal`
- **PATCH** `/payments/withdrawals/:id/reject` → `rejectWithdrawal`
- **POST** `/payments/test-orders` → `testOrdersDirect`
- **POST** `/payments/webhook/pix` → `handlePixWebhook`
- **POST** `/payments/webhook/withdrawal` → `handleWithdrawalWebhook`
- **GET** `/admin/withdrawals` → `list`
- **PATCH** `/admin/withdrawals/:id/confirm` → `confirm`
- **PATCH** `/admin/withdrawals/:id/fail` → `fail`
- **PATCH** `/admin/withdrawals/:id/cancel` → `cancel`
- **GET** `/payouts/balance` → `getBalance`
- **POST** `/payouts/withdrawals` → `createWithdrawal`
- **POST** `/payouts/webhook/gateway` → `handleGatewayWebhook`
- **POST** `/pricing/calculate` → `calculatePrice`
- **POST** `/pricing/rules` → `createRule`
- **GET** `/pricing/rules` → `findAllRules`
- **PATCH** `/pricing/rules/:id` → `updateRule`
- **DELETE** `/pricing/rules/:id` → `deleteRule`
- **GET** `/pricing/config` → `getPublicPricingConfig`
- **GET** `/provider/promotions` → `findAll`
- **POST** `/provider/promotions` → `create`
- **PATCH** `/provider/promotions/:id` → `update`
- **POST** `/providers/:providerId/services` → `create`
- **GET** `/providers/:providerId/services` → `findAll`
- **PATCH** `/providers/:providerId/services/:id` → `update`
- **DELETE** `/providers/:providerId/services/:id` → `remove`
- **GET** `/providers/recommended` → `findRecommendedProviders`
- **GET** `/providers/nearby` → `findNearbyProviders`
- **GET** `/providers/availability-summary` → `getAvailabilitySummary`
- **GET** `/providers` → `search`
- **GET** `/providers/me` → `getMyProfile`
- **GET** `/providers/me/visibility` → `getMyVisibility`
- **PATCH** `/providers/me` → `updateMyProfile`
- **POST** `/providers/me/avatar` → `uploadAvatar`
- **GET** `/providers/:providerId/metrics` → `getProviderMetrics`
- **GET** `/providers/:providerId/offers` → `getProviderOffers`
- **PUT** `/providers/me/settings` → `saveMySettings`
- **GET** `/providers/me/settings` → `getMySettings`
- **POST** `/providers/me/accept-terms` → `acceptTerms`
- **GET** `/providers/promotions-center` → `getPromotionsCenter`
- **PATCH** `/providers/:id` → `updateProviderById`
- **GET** `/providers/:id` → `findOne`
- **DELETE** `/providers/:id` → `remove`
- **GET** `/ranking/providers/local` → `getLocalProviderRanking`
- **GET** `/ranking/providers/:providerId/position` → `getProviderPosition`
- **POST** `/referrals` → `createReferral`
- **GET** `/referrals/me` → `getMyReferrals`
- **GET** `/referrals/me/code` → `getMyReferralCode`
- **GET** `/referrals/:id` → `getReferralById`
- **POST** `/reviews` → `submitReview`
- **GET** `/reviews` → `getReviews`
- **GET** `/reviews/provider/:providerId` → `getReviewsByProviderId`
- **GET** `/reviews/:id` → `getReviewById`
- **GET** `/reviews/provider/:providerId/breakdown` → `getProviderRatingBreakdown`
- **GET** `/reviews/provider/:providerId/suggestions` → `getSmartSuggestions`
- **POST** `/safety/panic` → `reportPanic`
- **POST** `/safety/incident` → `reportIncident`
- **GET** `/safety/me/incidents` → `getIncidentsForUser`
- **GET** `/safety/incidents` → `getAllIncidents`
- **PATCH** `/safety/incident/:id/status` → `updateIncidentStatus`
- **GET** `/safety/panic-alerts` → `listPanicAlerts`
- **GET** `/safety/pending-count` → `getPendingCount`
- **PATCH** `/safety/panic-alerts/:id/status` → `updatePanicStatus`
- **GET** `/search` → `search`
- **POST** `/services` → `create`
- **GET** `/services` → `findAll`
- **GET** `/services/:id` → `findOne`
- **PATCH** `/services/:id` → `update`
- **DELETE** `/services/:id` → `remove`
- **POST** `/subscriptions` → `create`
- **GET** `/subscriptions/me` → `getSubscriptionsForUser`
- **GET** `/subscriptions` → `findAll`
- **GET** `/subscriptions/:id` → `getSubscriptionDetails`
- **PATCH** `/subscriptions/:id` → `update`
- **GET** `/v1/support/meta` → `getMeta`
- **POST** `/v1/support/tickets` → `createTicket`
- **GET** `/v1/support/tickets` → `getTickets`
- **GET** `/v1/support/tickets/:id` → `getTicketDetails`
- **POST** `/v1/support/tickets/:id/messages` → `addMessage`
- **PATCH** `/v1/support/tickets/:id/status` → `updateTicketStatus`
- **PATCH** `/v1/support/tickets/:id/assign/:agentId` → `assignTicket`
- **POST** `/admin/telemetry/force-logout/:userId` → `forceLogout`
- **POST** `/test/seed` → `seed`
- **POST** `/upload/avatar` → `uploadAvatar`
- **POST** `/upload/document` → `uploadDocument`
- **POST** `/upload/selfie` → `uploadSelfie`
- **GET** `/users/me` → `getMyProfile`
- **PATCH** `/users/me` → `updateMyProfile`
- **GET** `/users` → `findAll`
- **DELETE** `/users/me` → `deleteMyAccount`
- **GET** `/users/:id` → `findOne`
- **DELETE** `/users/:id` → `remove`
- **POST** `/users/data-export` → `requestDataExport`
- **GET** `/verification/pending-queue` → `getPendingVerificationQueue`
- **POST** `/verification/upload-document/:type` → `uploadDocument`
- **POST** `/verification/upload-selfie` → `uploadSelfie`
- **POST** `/verification/upload-avatar` → `uploadAvatar`
- **POST** `/verification/advance-status` → `advanceVerificationStatus`
- **PATCH** `/verification/:providerId/status` → `updateVerificationStatus`
- **POST** `/verification/reject/:providerId` → `rejectProvider`
- **GET** `/verification/status/:providerId` → `getVerificationStatus`

## Services

### `AppService` (node_modules\@nestjs\schematics\dist\lib\application\files\ts\src\app.service.ts)

### `` (node_modules\@nestjs\schematics\dist\lib\library\files\ts\src\__name__.service.ts)

### `` (node_modules\@nestjs\schematics\dist\lib\resource\files\ts\__name__.service.ts)

### `` (node_modules\@nestjs\schematics\dist\lib\service\files\ts\__name__.service.ts)

### `` (node_modules\@nestjs\schematics\dist\lib\sub-app\files\ts\src\__name__.service.ts)

### `AppService` (src\app.service.ts)

### `AdminDashboardService` (src\admin\admin-dashboard.service.ts)
- Prisma `user`: {'count': 1}
- Prisma `provider`: {'count': 2}
- Prisma `booking`: {'count': 1, 'aggregate': 1, 'findMany': 1}

### `AdminObservabilityService` (src\admin\admin-observability.service.ts)
- Prisma `booking`: {'count': 1}
- Prisma `bookingInsurance`: {'groupBy': 1}
- Calls:
  - `getSnapshot` → {'logger': ['warn'], 'observabilityService': ['getLatencySeries']}
  - `normalizeRouteKey` → {'logger': ['error']}
  - `computeInsuranceConversion` → {'insuranceBuckets': ['map']}
  - `estimateActiveSessions` → {'cacheService': ['getRedisClient'], 'logger': ['error']}
  - `fetchSentrySnapshot` → {'logger': ['warn']}

### `LiveStatusService` (src\admin\live-status.service.ts)
- Prisma `provider`: {'findMany': 1}
- Calls:
  - `fetchBookingsByStatus` → {'bookingsService': ['findUserBookings']}

### `AuditLogService` (src\audit\audit-log.service.ts)
- Prisma `auditLog`: {'create': 1, 'findMany': 1}

### `AuthService` (src\auth\auth.service.ts)
- Prisma `user`: {'findUnique': 8, 'create': 2, 'update': 1, 'findFirst': 1}
- Prisma `client`: {'findUnique': 1}
- Prisma `provider`: {'findUnique': 1, 'create': 1}
- Prisma `address`: {'create': 1}
- Prisma `passwordResetToken`: {'deleteMany': 1, 'create': 1, 'findFirst': 1, 'update': 1}
- Calls:
  - `login` → {'jwtService': ['sign'], 'logger': ['log']}
  - `registerClient` → {'geocodingService': ['geocodeAddress'], 'logger': ['log', 'log', 'error'], 'complianceService': ['recordConsent']}
  - `registerProvider` → {'logger': ['log', 'log', 'log', 'error']}
  - `forgotPassword` → {'logger': ['warn', 'log', 'log', 'error', 'log'], 'jwtService': ['sign'], 'emailService': ['sendEmail']}
  - `recordDefaultConsents` → {'complianceService': ['recordConsent']}
  - `confirmPasswordReset` → {'logger': ['warn']}
  - `handleReferralCode` → {'referralsService': ['createReferral', 'createReferral'], 'logger': ['warn', 'warn', 'log']}

### `AvailabilityService` (src\availability\availability.service.ts)
- Prisma `provider`: {'findUnique': 3}
- Prisma `booking`: {'findMany': 3}
- Prisma `availability`: {'findMany': 1, 'delete': 2, 'update': 1, 'findFirst': 2, 'create': 2}
- Prisma `slotHoldStrike`: {'count': 1}

### `` (src\availability\locks\redis-lock.service.ts)

### `BookingsService` (src\bookings\bookings.service.ts)
- Status: PROCESSED
- Prisma `client`: {'findUnique': 2, 'update': 1}
- Prisma `booking`: {'findUnique': 15, 'update': 3, 'findFirst': 4, 'create': 1, 'count': 2, 'findMany': 4, 'groupBy': 1}
- Prisma `bookingProof`: {'findUnique': 1, 'create': 1}
- Prisma `provider`: {'findUnique': 1, 'update': 1}
- Prisma `transaction`: {'create': 1}
- Prisma `ledgerEntry`: {'findFirst': 2, 'create': 2}
- Calls:
  - `ensureWeeklyLimit` → {'logger': ['warn']}
  - `buildWeeklyLockValue` → {'redisLockService': ['acquireLock', 'releaseLock'], 'logger': ['warn', 'debug', 'debug']}
  - `logGpsEvent` → {'logger': ['log']}
  - `submitProof` → {'notificationService': ['sendToUser'], 'logger': ['log', 'warn']}
  - `acceptBooking` → {'i18n': ['translate', 'translate'], 'logger': ['log']}
  - `notifyClientStatusUpdate` → {'queuesService': ['addNotificationJob'], 'logger': ['warn']}
  - `notifyClientAcceptance` → {'queuesService': ['addNotificationJob'], 'logger': ['warn']}
  - `create` → {'logger': ['log', 'log', 'log', 'log', 'log', 'log', 'error', 'log', 'error', 'log', 'warn', 'error', 'log', 'warn', 'error', 'warn', 'warn', 'log'], 'redisLockService': ['acquireLock'], 'i18n': ['translate', 'translate', 'translate', 'translate', 'translate'], 'clientsService': ['findClientByUserId'], 'complianceService': ['checkConsent'], 'providersService': ['findOne'], 'providerServicesService': ['findOne'], 'availabilityService': ['canHoldSlot']}
  - `async` → {'logger': ['log', 'log', 'log', 'log', 'log', 'warn', 'log', 'log', 'warn', 'error', 'log'], 'paymentsService': ['createPixCharge'], 'missionsService': ['trackEvent'], 'notificationService': ['sendToUser'], 'cacheService': ['set'], 'i18n': ['translate', 'translate', 'translate'], 'redisLockService': ['releaseLock']}
  - `quotePrice` → {'clientsService': ['findClientByUserId'], 'i18n': ['translate', 'translate', 'translate'], 'providersService': ['findOne'], 'providerServicesService': ['findOne'], 'logger': ['log', 'log', 'error', 'error'], 'cacheService': ['set']}
  - `calculateQuoteForBooking` → {'i18n': ['translate'], 'pricingService': ['calculatePrice'], 'logger': ['log', 'log', 'warn', 'warn'], 'couponsService': ['applyCoupon'], 'insuranceService': ['getPlans']}
  - `createBookingFromSubscription` → {'providerServicesService': ['findOne'], 'i18n': ['translate']}
  - `runWhatsappForStatus` → {'logger': ['warn']}
  - `handleBookingWhatsappNotification` → {'whatsappService': ['notifyNewOrder', 'notifyPaymentConfirmed']}
  - `createBookingAndPixCharge` → {'logger': ['log', 'log', 'log', 'log', 'log', 'log', 'log', 'log', 'error'], 'paymentsService': ['createPixCharge'], 'whatsappService': ['notifyNewOrder'], 'i18n': ['translate']}
  - `findUserBookings` → {'logger': ['log', 'error', 'error', 'log', 'error', 'log', 'warn', 'log', 'log'], 'i18n': ['translate', 'translate', 'translate']}
  - `findOne` → {'logger': ['log'], 'i18n': ['translate']}
  - `updateStatus` → {'logger': ['log', 'error', 'log', 'warn'], 'i18n': ['translate', 'translate', 'translate'], 'schedulerService': ['scheduleBookingReminders'], 'queuesService': ['addNotificationJob']}
  - `systemChangeStatus` → {'logger': ['log']}
  - `findUpcomingBookings` → {'logger': ['log', 'log', 'log']}
  - `onTheWayService` → {'logger': ['log']}
  - `arriveAtLocation` → {'logger': ['log']}
  - `startService` → {'schedulerService': ['notifyJobStarted'], 'notificationService': ['sendToUser'], 'logger': ['log', 'warn']}
  - `requestManualStart` → {'queuesService': ['addNotificationJob'], 'logger': ['warn']}
  - `completeService` → {'schedulerService': ['notifyJobEnded'], 'couponsService': ['markCouponAsUsed'], 'queuesService': ['addNotificationJob', 'addNotificationJob'], 'logger': ['warn'], 'notificationService': ['notifyBookingStatusPush']}
  - `autoCompleteOverdueBookings` → {'logger': ['log', 'warn'], 'queuesService': ['addNotificationJob', 'addNotificationJob'], 'notificationService': ['notifyBookingStatusPush']}
  - `cronAutoCompleteOverdue` → {'logger': ['warn']}
  - `reportIssue` → {'logger': ['log', 'log'], 'i18n': ['translate', 'translate', 'translate', 'translate'], 'clientsService': ['findClientByUserId'], 'providersService': ['findByUserId'], 'queuesService': ['addNotificationJob']}
  - `reportDispute` → {'logger': ['log', 'log', 'log'], 'i18n': ['translate', 'translate', 'translate'], 'clientsService': ['findClientByUserId'], 'providersService': ['findByUserId'], 'queuesService': ['addDisputeJob']}
  - `resolveDispute` → {'logger': ['log', 'log', 'log', 'log', 'log', 'log'], 'i18n': ['translate', 'translate', 'translate', 'translate'], 'queuesService': ['addNotificationJob', 'addNotificationJob']}

### `CacheService` (src\cache\cache.service.ts)
- Calls:
  - `constructor` → {'logger': ['debug', 'debug', 'error', 'debug', 'error'], 'cacheManager': ['set']}
  - `del` → {'cacheManager': ['del'], 'logger': ['debug', 'error', 'error'], 'redisClient': ['set']}
  - `reset` → {'cacheManager': ['clear'], 'logger': ['warn', 'error']}

### `ChatRateLimitService` (src\chat\chat-rate-limit.service.ts)
- Calls:
  - `readEntry` → {'inMemoryStore': ['get', 'delete']}
  - `writeEntry` → {'cacheService': ['set'], 'inMemoryStore': ['set']}
  - `setTimeout` → {'inMemoryStore': ['delete']}

### `ChatService` (src\chat\chat.service.ts)
- Prisma `booking`: {'findFirst': 2, 'findUnique': 1}
- Prisma `chat`: {'findFirst': 1, 'create': 1, 'findUnique': 3, 'findMany': 1}
- Prisma `client`: {'findUnique': 6}
- Prisma `provider`: {'findUnique': 7}
- Prisma `message`: {'create': 1, 'findMany': 1, 'count': 1}
- Prisma `user`: {'findUnique': 1}
- Calls:
  - `findOrCreateChat` → {'logger': ['log', 'log', 'log']}
  - `getOrCreateConversationForBooking` → {'logger': ['log', 'warn', 'warn', 'warn']}
  - `createMessage` → {'logger': ['log', 'error', 'error', 'error', 'error', 'warn', 'warn', 'warn', 'error', 'log'], 'contactLeakPolicyService': ['evaluatePolicy']}
  - `getMessagesByChatId` → {'logger': ['log', 'error', 'error', 'error', 'warn', 'warn', 'log']}
  - `getConversationsForUser` → {'logger': ['log', 'log']}
  - `isUserParticipantOfChat` → {'logger': ['log', 'log', 'log']}

### `ClientsService` (src\clients\clients.service.ts)
- Prisma `client`: {'findUnique': 4, 'update': 1}
- Calls:
  - `findClientById` → {'logger': ['log', 'warn']}
  - `findClientByUserId` → {'logger': ['log', 'warn']}
  - `updateClient` → {'logger': ['log', 'log', 'log', 'error']}
  - `getClientDashboardData` → {'logger': ['log', 'log']}

### `I18nService` (src\common\i18n\i18n.service.ts)
- Calls:
  - `loadTranslations` → {'logger': ['warn', 'log', 'warn', 'warn'], 'translations': ['set']}
  - `translate` → {'translations': ['get', 'get']}

### `RedisLockService` (src\common\locks\redis-lock.service.ts)
- Calls:
  - `acquireLock` → {'redisClient': ['set']}
  - `releaseLock` → {'redisClient': ['eval']}
  - `onModuleDestroy` → {'redisClient': ['disconnect']}

### `ContactLeakDetector` (src\common\services\contact-leak-detector.service.ts)

### `ContactLeakPolicyService` (src\common\services\contact-leak-policy.service.ts)
- Prisma `messagePolicyHit`: {'count': 1, 'create': 1}
- Calls:
  - `evaluatePolicy` → {'contactLeakDetector': ['detect', 'hashMatch'], 'logger': ['warn'], 'notificationsService': ['createNotification', 'createNotification']}

### `EmailService` (src\common\services\email.service.ts)
- Calls:
  - `constructor` → {'logger': ['error', 'log', 'log', 'error', 'warn']}
  - `sendEmail` → {'transporter': ['sendMail'], 'logger': ['log', 'log', 'error']}
  - `simulateSendEmail` → {'logger': ['warn', 'debug']}

### `GeocodingService` (src\common\services\geocoding.service.ts)
- Calls:
  - `constructor` → {'logger': ['warn', 'log']}
  - `geocodeAddress` → {'logger': ['log', 'error', 'warn', 'error', 'warn', 'error']}
  - `simulateGeocoding` → {'logger': ['warn']}

### `SmsService` (src\common\services\sms.service.ts)
- Calls:
  - `constructor` → {'logger': ['log', 'error', 'warn']}
  - `sendSms` → {'logger': ['log', 'error']}
  - `simulateSendSms` → {'logger': ['warn', 'debug']}

### `ComplianceService` (src\compliance\compliance.service.ts)
- Prisma `user`: {'findUnique': 3, 'update': 1}
- Prisma `userConsent`: {'create': 1, 'findFirst': 1, 'findMany': 1, 'deleteMany': 1}
- Prisma `booking`: {'findUnique': 1}
- Prisma `client`: {'update': 1}
- Prisma `provider`: {'update': 1}
- Prisma `notification`: {'deleteMany': 1}
- Calls:
  - `recordConsent` → {'logger': ['log', 'log']}
  - `checkConsent` → {'logger': ['log', 'warn', 'log']}
  - `generateItemizedQuote` → {'logger': ['log', 'log']}
  - `processDataSubjectAccessRequest` → {'logger': ['log', 'log']}
  - `processErasureRequest` → {'logger': ['warn', 'log']}

### `ConnectService` (src\connect\connect.service.ts)
- Calls:
  - `getAccessToken` → {'logger': ['error']}
  - `saveTokens` → {'cache': ['set', 'set', 'set']}
  - `runChallenge` → {'logger': ['log', 'error']}
  - `createApplication` → {'logger': ['error']}

### `CouponsService` (src\coupons\coupons.service.ts)
- Prisma `coupon`: {'findUnique': 6, 'create': 1, 'findMany': 2, 'update': 3, 'findFirst': 1}
- Prisma `couponUsage`: {'findFirst': 1}
- Prisma `client`: {'findUnique': 2}
- Calls:
  - `create` → {'logger': ['log', 'log']}
  - `update` → {'logger': ['log', 'log']}
  - `applyCoupon` → {'logger': ['warn', 'log', 'warn', 'warn', 'warn', 'warn', 'warn', 'warn', 'warn', 'warn', 'warn', 'warn', 'log', 'log', 'log']}
  - `markCouponAsUsed` → {'logger': ['warn', 'log', 'log', 'log']}
  - `issueCouponFromMission` → {'logger': ['log', 'log']}
  - `issueReturnCoupon` → {'logger': ['log', 'log']}
  - `issueReferralReferredCoupon` → {'logger': ['log', 'log']}
  - `issueReferralReferrerCoupon` → {'logger': ['log', 'log']}
  - `resolveCoupon` → {'logger': ['log', 'log']}
  - `getMyCoupons` → {'logger': ['log']}
  - `ensureWelcomeCoupon` → {'logger': ['log']}

### `DashboardService` (src\dashboard\dashboard.service.ts)
- Calls:
  - `getDashboardData` → {'logger': ['log', 'error', 'log', 'error', 'error', 'error', 'log', 'log', 'log', 'log'], 'providersService': ['findByUserId']}

### `DisputeService` (src\disputes\dispute.service.ts)
- Prisma `booking`: {'findUnique': 4}
- Prisma `dispute`: {'findFirst': 1, 'create': 1, 'findUnique': 3, 'findMany': 1, 'count': 1, 'update': 1}
- Prisma `ledgerEntry`: {'create': 3, 'aggregate': 1}
- Prisma `supportTicket`: {'findFirst': 1, 'create': 1}
- Prisma `user`: {'findUnique': 1}
- Prisma `disputeMessage`: {'create': 1}
- Calls:
  - `createDispute` → {'logger': ['log', 'warn', 'log', 'error'], 'bookingsService': ['updateStatus'], 'notificationsService': ['createNotification']}
  - `addMessageToDispute` → {'contactLeakPolicyService': ['evaluatePolicy'], 'logger': ['warn', 'error'], 'notificationsService': ['createNotification', 'createNotification']}
  - `updateDisputeStatus` → {'logger': ['log', 'warn', 'log', 'error'], 'bookingsService': ['updateStatus'], 'notificationsService': ['createNotification', 'createNotification']}

### `DocumentProcessingService` (src\document-processing\document-processing.service.ts)
- Calls:
  - `uploadImage` → {'uploadService': ['uploadFile'], 'logger': ['log', 'error']}
  - `processDocumentOcr` → {'logger': ['warn']}
  - `compareFaces` → {'logger': ['warn']}
  - `performLivenessCheck` → {'logger': ['warn']}

### `LocalStorageService` (src\document-processing\local-storage.service.ts)
- Calls:
  - `uploadFile` → {'logger': ['log', 'log', 'error']}
  - `processDocumentForOcr` → {'logger': ['warn']}
  - `processSelfieForLiveness` → {'logger': ['warn']}
  - `compareFaces` → {'logger': ['warn']}

### `EarningsService` (src\earnings\earnings.service.ts)
- Prisma `ledgerEntry`: {'aggregate': 2, 'findMany': 2}
- Calls:
  - `getEarnings` → {'providersService': ['findByUserId']}
  - `requestWithdrawal` → {'payoutsService': ['requestWithdrawal']}

### `EmailService` (src\email\email.service.ts)
- Prisma `user`: {'findUnique': 1}
- Calls:
  - `constructor` → {'logger': ['warn']}
  - `sendEmail` → {'logger': ['log', 'error']}
  - `sendPanicAlertEmail` → {'logger': ['warn']}
  - `sendIncidentStatusUpdateEmail` → {'logger': ['warn']}
  - `sendAdminWithdrawalFailedEmail` → {'logger': ['warn']}

### `FaqsService` (src\faqs\faqs.service.ts)
- Prisma `fAQItem`: {'create': 1, 'findMany': 1, 'findUnique': 3, 'update': 1, 'delete': 1}

### `GeocodingService` (src\geocoding\geocoding.service.ts)
- Calls:
  - `constructor` → {'logger': ['warn']}
  - `geocodeAddress` → {'logger': ['error', 'log', 'log', 'warn', 'error', 'error', 'error']}
  - `getZoneByCoordinates` → {'logger': ['log']}

### `GuaranteeService` (src\guarantee\guarantee.service.ts)
- Status: PENDING
- Prisma `booking`: {'findUnique': 1}
- Prisma `guaranteeClaim`: {'create': 1, 'findMany': 1, 'findUnique': 2, 'update': 1}
- Prisma `user`: {'findMany': 1}
- Calls:
  - `submitClaim` → {'notificationsService': ['sendPushNotification']}
  - `updateClaimStatus` → {'notificationsService': ['sendPushNotification']}

### `IncidentsService` (src\incidents\incidents.service.ts)
- Prisma `booking`: {'findUnique': 1}
- Prisma `insuranceClaim`: {'create': 1, 'findUnique': 1}

### `InsuranceService` (src\insurance\insurance.service.ts)

### `LoyaltyService` (src\loyalty\loyalty.service.ts)
- Status: FINISHED
- Prisma `loyalty`: {'findUnique': 2, 'update': 3, 'findMany': 1}
- Prisma `reward`: {'findUnique': 1, 'findMany': 1}
- Prisma `loyaltyTransaction`: {'create': 2, 'findMany': 2, 'aggregate': 1}
- Prisma `userTier`: {'findUnique': 1}
- Prisma `client`: {'findUnique': 2}
- Prisma `booking`: {'findMany': 1}
- Prisma `review`: {'findFirst': 1}
- Calls:
  - `addPoints` → {'logger': ['log', 'warn', 'log', 'log', 'log', 'warn'], 'notificationService': ['sendToUser']}
  - `redeemPoints` → {'logger': ['log', 'warn', 'warn', 'warn', 'log', 'log'], 'couponsService': ['create']}
  - `getUserTier` → {'logger': ['warn']}
  - `getUserBookingStreak` → {'logger': ['warn']}
  - `hasRecentGoodReview` → {'logger': ['warn']}
  - `recalculateUserTiers` → {'logger': ['log', 'log', 'log']}
  - `expireOldPoints` → {'logger': ['log', 'debug', 'log', 'warn', 'log']}

### `MetaService` (src\meta\meta.service.ts)

### `MetricsService` (src\metrics\metrics.service.ts)
- Calls:
  - `getCustomerSummary` → {'privacyPolicy': ['ensureUserAccess'], 'bookingsRepo': ['countBookings', 'countBookings', 'countBookings'], 'reviewsRepo': ['getAverageRating'], 'paymentsRepo': ['getTotalSpent']}
  - `getCustomerTimeseries` → {'privacyPolicy': ['ensureUserAccess'], 'bookingsRepo': ['getBookingCountsByGranularity'], 'paymentsRepo': ['getTotalSpentByGranularity']}
  - `getCustomerFunnel` → {'privacyPolicy': ['ensureUserAccess'], 'bookingsRepo': ['countBookings', 'countBookings', 'countBookings'], 'paymentsRepo': ['countPaymentIntents', 'countPaidPayments']}

### `MissionsService` (src\missions\missions.service.ts)
- Prisma `mission`: {'findMany': 1}
- Prisma `missionProgress`: {'findUnique': 1, 'update': 1}
- Calls:
  - `trackEvent` → {'logger': ['log', 'log', 'log', 'log', 'log', 'log', 'warn'], 'missionsProgressService': ['trackEvent'], 'notificationService': ['sendToUser']}
  - `getMyMissions` → {'missionsProgressService': ['getUserMissionsWithProgress']}
  - `claimMission` → {'logger': ['log', 'warn', 'log', 'log'], 'couponsService': ['issueCouponFromMission'], 'loyaltyService': ['addPoints']}

### `MissionsProgressService` (src\missions\progress.service.ts)
- Prisma `missionEvent`: {'create': 1, 'findMany': 1, 'count': 1}
- Prisma `mission`: {'findMany': 2, 'findUnique': 3}
- Prisma `missionProgress`: {'findMany': 1, 'deleteMany': 1, 'findUnique': 2, 'update': 4, 'create': 1}
- Calls:
  - `applyEventToMission` → {'logger': ['error']}

### `NotificationsService` (src\notifications\notifications.service.ts)
- Status: CONFIRMED
- Prisma `notification`: {'findUnique': 4, 'findFirst': 1, 'create': 1, 'findMany': 2, 'update': 2, 'updateMany': 2, 'delete': 1}
- Prisma `user`: {'findUnique': 1, 'update': 3, 'updateMany': 1}
- Prisma `booking`: {'update': 1}
- Calls:
  - `createNotification` → {'logger': ['error', 'error']}
  - `getUserNotifications` → {'logger': ['error']}
  - `ackNotification` → {'i18n': ['translate']}
  - `markNotificationsAsRead` → {'logger': ['error']}
  - `markNotificationByIdAsRead` → {'i18n': ['translate'], 'logger': ['error']}
  - `sendPushNotification` → {'logger': ['log', 'warn', 'log']}
  - `isAxiosError` → {'logger': ['warn', 'log', 'error']}
  - `deleteNotification` → {'i18n': ['translate']}
  - `executeQuickAction` → {'logger': ['log', 'log', 'log', 'log', 'log', 'log', 'log', 'error'], 'i18n': ['translate']}
  - `registerDeviceToken` → {'logger': ['warn', 'error']}
  - `unregisterDeviceToken` → {'logger': ['warn']}

### `ObservabilityService` (src\observability\observability.service.ts)
- Calls:
  - `recordLatency` → {'latencyBuffers': ['get', 'set']}
  - `getLatencySeries` → {'latencyBuffers': ['get']}

### `OffersService` (src\offers\offers.service.ts)
- Prisma `offer`: {'create': 1, 'findMany': 2, 'findUnique': 3, 'update': 1, 'delete': 1}

### `PaymentsService` (src\payments\payments.service.ts)
- Status: APPROVED, FAILED, PAID, REFUNDED, REJECTED
- Prisma `paymentIntent`: {'findFirst': 4, 'update': 3, 'findUnique': 1}
- Prisma `booking`: {'update': 3, 'findUnique': 3}
- Prisma `transaction`: {'findMany': 1, 'findUnique': 1, 'update': 1, 'create': 1}
- Prisma `payout`: {'findMany': 1, 'update': 2}
- Prisma `user`: {'findUnique': 1}
- Prisma `provider`: {'findUnique': 1}
- Calls:
  - `constructor` → {'logger': ['log', 'warn', 'warn']}
  - `handlePaymentWebhook` → {'logger': ['log', 'warn', 'warn', 'error', 'log', 'log', 'warn', 'log', 'log', 'warn', 'warn'], 'bookingsService': ['systemChangeStatus'], 'queues': ['addNotificationJob', 'addNotificationJob', 'addNotificationJob'], 'whatsappService': ['notifyPaymentConfirmed']}
  - `validateHmac` → {'logger': ['error']}
  - `handlePixWebhook` → {'logger': ['debug', 'warn', 'log']}
  - `finalizePixPayment` → {'logger': ['warn']}
  - `timer` → {'logger': ['error']}
  - `confirmPixPayment` → {'logger': ['log', 'warn', 'warn']}
  - `registerPixWebhook` → {'connectService': ['getAccessToken'], 'pagseguroApiBaseUrl': ['replace'], 'logger': ['error']}
  - `registerPayoutsWebhook` → {'connectService': ['getAccessToken'], 'pagseguroApiBaseUrl': ['replace'], 'logger': ['error']}
  - `rejectWithdrawal` → {'logger': ['warn']}
  - `createPixCharge` → {'logger': ['log', 'log', 'error'], 'intentLocker': ['claimPaymentIntent', 'waitForIntentReady']}
  - `persistPaymentConfirmedNotification` → {'notificationsService': ['createNotification'], 'logger': ['warn']}
  - `requestWithdrawal` → {'payoutsService': ['requestWithdrawal']}
  - `handleWithdrawalWebhook` → {'payoutsService': ['handleGatewayWebhook']}

### `PayoutsService` (src\payouts\payouts.service.ts)
- Prisma `payout`: {'findMany': 1, 'findUnique': 6, 'update': 1}
- Prisma `notification`: {'create': 3}
- Prisma `webhookReplay`: {'findFirst': 1, 'create': 1}
- Calls:
  - `constructor` → {'logger': ['log', 'warn']}
  - `requestWithdrawal` → {'logger': ['error', 'debug', 'log', 'error', 'log'], 'minWithdrawal': ['toFixed'], 'maxWithdrawal': ['toFixed'], 'dailyLimit': ['sub'], 'queues': ['addJob', 'addNotificationJob'], 'redisLock': ['releaseLock']}
  - `processPayout` → {'logger': ['warn', 'debug', 'warn', 'log']}
  - `handleGatewayWebhook` → {'logger': ['log', 'debug', 'log', 'log', 'warn', 'warn'], 'paymentsService': ['handlePixWebhook']}
  - `applyGatewayUpdate` → {'logger': ['warn'], 'queues': ['addNotificationJob']}
  - `tryAcquireLock` → {'redisLock': ['acquireLock']}
  - `initiateGatewayTransfer` → {'connectService': ['getAccessToken'], 'pspBaseUrl': ['replace'], 'logger': ['error']}
  - `markGatewayFailure` → {'logger': ['warn', 'error'], 'queues': ['pauseQueue']}
  - `markGatewaySuccess` → {'queues': ['resumeQueue'], 'logger': ['log']}

### `PricingService` (src\pricing\pricing.service.ts)
- Prisma `providerService`: {'findFirst': 1}
- Prisma `service`: {'findUnique': 1}
- Prisma `pricingRule`: {'create': 1, 'findMany': 2, 'findUnique': 2, 'update': 1, 'delete': 1}
- Calls:
  - `createRule` → {'settings': ['appendPricingAudit']}
  - `updateRule` → {'settings': ['appendPricingAudit']}
  - `deleteRule` → {'settings': ['appendPricingAudit']}
  - `getDemandForContext` → {'bookingsService': ['getDemandCountForArea'], 'cacheService': ['set']}

### `PrismaService` (src\prisma\prisma.service.ts)

### `ProviderPromotionsService` (src\provider-promotions\provider-promotions.service.ts)
- Prisma `providerPromotion`: {'findMany': 1, 'create': 1, 'findUnique': 1, 'update': 1}
- Prisma `provider`: {'findUnique': 2}

### `ProviderServicesService` (src\provider-services\provider-services.service.ts)
- Prisma `providerService`: {'findUnique': 1, 'create': 1, 'findMany': 1, 'findFirst': 1, 'update': 1, 'deleteMany': 1}
- Prisma `provider`: {'findUnique': 1}
- Calls:
  - `create` → {'providersService': ['findOne'], 'servicesService': ['findOne']}

### `ProviderPromotionsService` (src\providers\provider-promotions.service.ts)
- Prisma `coupon`: {'findMany': 1}
- Prisma `loyalty`: {'findUnique': 1}
- Prisma `reward`: {'findMany': 1}
- Calls:
  - `getPromotionsCenter` → {'providersService': ['findByUserId'], 'missionsService': ['getMyMissions'], 'earningsService': ['getEarnings']}

### `ProvidersService` (src\providers\providers.service.ts)
- Status: ACTIVE, FINISHED
- Prisma `provider`: {'findMany': 7, 'findUnique': 11, 'update': 7, 'count': 1}
- Prisma `booking`: {'count': 4}
- Prisma `review`: {'count': 1}
- Prisma `offer`: {'findMany': 1}
- Calls:
  - `applyRadiusFilter` → {'settingsService': ['getProviderRadiusKm']}
  - `getProvidersAvailabilitySummary` → {'logger': ['log']}
  - `calculateNextAvailable` → {'availabilityService': ['getAvailability']}
  - `invalidateProviderCache` → {'cacheService': ['del', 'del', 'del']}
  - `updateAvatar` → {'logger': ['log', 'warn', 'log', 'log', 'log', 'log', 'log', 'error'], 'documentProcessingService': ['uploadImage']}
  - `setProviderVisibility` → {'logger': ['warn', 'log', 'log']}
  - `getPendingProviders` → {'logger': ['log']}
  - `getAdminProvidersPage` → {'logger': ['log']}
  - `findOne` → {'logger': ['log', 'log', 'log', 'log'], 'cacheService': ['set']}
  - `resolveMonthlyBookingsCount` → {'cacheService': ['set']}
  - `calculateAcceptanceRate` → {'cacheService': ['set']}
  - `countCompletedBookingsLast30Days` → {'cacheService': ['set']}
  - `hydrateProviderExtras` → {'logger': ['error']}
  - `findByUserId` → {'logger': ['log', 'log', 'log'], 'cacheService': ['set']}
  - `updateByUserId` → {'logger': ['log', 'warn', 'log', 'log', 'log'], 'cacheService': ['del', 'del', 'del']}
  - `updateById` → {'logger': ['log', 'warn', 'log'], 'cacheService': ['del', 'del']}
  - `remove` → {'logger': ['log', 'warn', 'log', 'log', 'log'], 'cacheService': ['del', 'del', 'del']}
  - `search` → {'logger': ['log', 'log', 'log']}
  - `findAllProviders` → {'logger': ['log']}
  - `findTopRatedOrExperiencedProviders` → {'logger': ['log', 'log', 'log']}
  - `json_build_object` → {'logger': ['error', 'log', 'log', 'error', 'log'], 'cacheService': ['set']}
  - `updateProviderBadges` → {'logger': ['log', 'warn', 'log', 'log'], 'cacheService': ['del', 'del', 'del', 'del']}
  - `updateProviderPerformanceMetrics` → {'logger': ['log', 'warn', 'log', 'log'], 'cacheService': ['del', 'del', 'del', 'del', 'del']}
  - `getProviderPerformanceMetrics` → {'logger': ['debug', 'log'], 'cacheService': ['set']}
  - `getProviderOffers` → {'logger': ['log']}
  - `applyRankingBoost` → {'logger': ['log', 'log', 'log']}

### `QueuesService` (src\queues\queues.service.ts)
- Calls:
  - `getQueueInstance` → {'logger': ['error', 'log', 'error']}
  - `removeJob` → {'logger': ['log', 'warn', 'error']}
  - `updateQueueDepth` → {'logger': ['debug']}
  - `pauseQueue` → {'logger': ['warn']}
  - `resumeQueue` → {'logger': ['log']}
  - `getAllQueuesStatus` → {'queueNames': ['map']}
  - `getJobsByStatus` → {'logger': ['error']}
  - `retryJobById` → {'logger': ['log', 'log']}

### `RankingService` (src\ranking\ranking.service.ts)
- Calls:
  - `getProviderRanking` → {'logger': ['log', 'log'], 'providersService': ['search']}
  - `getProviderPositionInRanking` → {'logger': ['log', 'log']}

### `ReferralsService` (src\referrals\referrals.service.ts)
- Status: PENDING
- Prisma `user`: {'findUnique': 3, 'update': 1}
- Prisma `client`: {'findUnique': 3}
- Prisma `referral`: {'count': 1, 'findFirst': 1, 'create': 1, 'findUnique': 2, 'findMany': 1}
- Calls:
  - `createReferral` → {'logger': ['log', 'log', 'log', 'log', 'error', 'log'], 'antifraudService': ['isSuspiciousReferral'], 'couponsService': ['issueReferralReferredCoupon']}
  - `handleBookingCompletedForReferral` → {'logger': ['log', 'log', 'warn', 'log', 'log', 'log', 'log', 'error', 'log', 'error', 'log', 'error', 'log', 'log', 'log', 'log', 'error', 'log', 'log', 'log'], 'loyaltyService': ['addPoints', 'addPoints'], 'missionsService': ['trackEvent', 'trackEvent'], 'couponsService': ['issueReferralReferrerCoupon']}
  - `generateReferralCode` → {'logger': ['log']}
  - `findReferralsByReferrer` → {'logger': ['log']}
  - `findOne` → {'logger': ['log']}

### `ReviewsService` (src\reviews\reviews.service.ts)
- Status: FINISHED
- Prisma `booking`: {'findUnique': 1}
- Prisma `client`: {'findUnique': 1}
- Prisma `review`: {'findMany': 3, 'findUnique': 1}
- Prisma `provider`: {'findUnique': 1}
- Calls:
  - `submitReview` → {'logger': ['log', 'log', 'log', 'log', 'log', 'warn', 'log'], 'loyaltyService': ['addPoints', 'addPoints'], 'missionsService': ['trackEvent'], 'providersService': ['updateProviderBadges']}
  - `findRecentReviewsByProviderId` → {'logger': ['log', 'log']}

### `SafetyService` (src\safety\safety.service.ts)
- Status: ACTIVE, PENDING_REVIEW
- Prisma `panicAlert`: {'create': 1, 'findMany': 1, 'count': 1, 'findUnique': 1, 'update': 1}
- Prisma `user`: {'findUnique': 1, 'findMany': 1}
- Prisma `booking`: {'findUnique': 1}
- Prisma `incident`: {'create': 1, 'findMany': 2, 'findUnique': 1, 'update': 1, 'count': 1}
- Calls:
  - `reportPanic` → {'notificationsService': ['sendPushNotification'], 'smsService': ['sendPanicAlertSms'], 'emailService': ['sendPanicAlertEmail'], 'queuesService': ['addJob']}
  - `reportIncident` → {'queuesService': ['addJob']}
  - `updateIncidentStatus` → {'notificationsService': ['sendPushNotification'], 'emailService': ['sendIncidentStatusUpdateEmail']}

### `SchedulerService` (src\scheduler\scheduler.service.ts)
- Prisma `notificationSchedule`: {'findMany': 2, 'updateMany': 1, 'findUnique': 1, 'update': 4, 'create': 1}
- Calls:
  - `scheduleBookingReminders` → {'logger': ['warn', 'debug']}
  - `rehydratePendingSchedules` → {'logger': ['debug', 'error']}
  - `scheduleTimer` → {'timers': ['set']}
  - `clearTimer` → {'timers': ['get']}
  - `clearTimeout` → {'timers': ['delete']}
  - `processSchedule` → {'timers': ['delete']}
  - `deliver` → {'logger': ['warn', 'warn', 'error'], 'notificationsService': ['createNotification']}
  - `translate` → {'i18n': ['translate'], 'logger': ['warn']}

### `SearchService` (src\search\search.service.ts)
- Calls:
  - `performSearch` → {'pricingService': ['calculatePrice'], 'logger': ['error'], 'providersService': ['search'], 'offersService': ['searchOffers']}

### `ServicesService` (src\services\services.service.ts)
- Prisma `service`: {'create': 1, 'findMany': 1, 'findUnique': 1, 'update': 1, 'delete': 1}
- Calls:
  - `create` → {'cacheService': ['del']}
  - `findAll` → {'cacheService': ['set']}
  - `findOne` → {'cacheService': ['set']}
  - `update` → {'cacheService': ['del', 'del']}
  - `remove` → {'cacheService': ['del', 'del']}

### `SettingsService` (src\settings\settings.service.ts)
- Calls:
  - `getSlaSettings` → {'config': ['get', 'get', 'get', 'get']}
  - `updateSlaSettings` → {'cache': ['set'], 'logger': ['warn', 'log']}
  - `setProviderRadiusKm` → {'logger': ['log']}
  - `getProviderRadiusKm` → {'logger': ['debug']}
  - `getGeneralSettings` → {'config': ['get']}
  - `updateGeneralSettings` → {'cache': ['set', 'set'], 'logger': ['warn']}
  - `appendPricingAudit` → {'cache': ['set']}

### `SmsService` (src\sms\sms.service.ts)
- Calls:
  - `constructor` → {'logger': ['log', 'log', 'log', 'log', 'error', 'log']}
  - `sendSms` → {'logger': ['error', 'log', 'log', 'error', 'error']}
  - `sendPanicAlertSms` → {'logger': ['error', 'warn', 'warn', 'error', 'error']}
  - `startVerification` → {'logger': ['log', 'log', 'error', 'error']}
  - `checkVerification` → {'logger': ['log', 'log', 'log', 'warn', 'error', 'error']}

### `SubscriptionsService` (src\subscriptions\subscriptions.service.ts)
- Status: CANCELED_BY_SUBSCRIPTION
- Prisma `client`: {'findUnique': 1}
- Prisma `provider`: {'findUnique': 1}
- Prisma `providerService`: {'findUnique': 1}
- Prisma `subscription`: {'create': 1, 'findMany': 2, 'findUnique': 3, 'update': 2}
- Prisma `booking`: {'updateMany': 1}
- Calls:
  - `create` → {'paymentsService': ['setupRecurringPayment']}
  - `update` → {'paymentsService': ['pauseRecurringPayment', 'resumeRecurringPayment']}
  - `generateRecurringBooking` → {'bookingsService': ['createBookingFromSubscription']}
  - `scheduleNextBookingGeneration` → {'queuesService': ['removeSubscriptionGenerationJob', 'addSubscriptionGenerationJob', 'addSubscriptionGenerationJob']}
  - `cancelFutureRecurringBookings` → {'queuesService': ['removeSubscriptionGenerationJob']}

### `SupportService` (src\support\support.service.ts)
- Prisma `user`: {'findMany': 1, 'findUnique': 1}
- Prisma `supportTicket`: {'count': 1, 'create': 1, 'findMany': 1, 'findUnique': 1, 'update': 2}
- Prisma `supportMessage`: {'create': 1}
- Prisma `supportSlaLog`: {'create': 1}
- Calls:
  - `notifyAdmins` → {'logger': ['warn'], 'notificationService': ['sendToUser']}
  - `createTicket` → {'logger': ['log'], 'slaPolicy': ['getSlaDueDate'], 'escalationsQueue': ['add']}
  - `addMessageToTicket` → {'notificationService': ['sendToUser']}
  - `updateTicketStatus` → {'stateMachine': ['canTransition'], 'notificationService': ['sendToUser']}
  - `assignTicket` → {'notificationService': ['sendToUser']}

### `TelemetryEventsService` (src\telemetry\telemetry.events.service.ts)

### `TelemetryNotificationService` (src\telemetry\telemetry.notification.service.ts)
- Calls:
  - `constructor` → {'events': ['on']}
  - `handleAnomaly` → {'logger': ['warn', 'warn']}

### `TelemetryService` (src\telemetry\telemetry.service.ts)
- Calls:
  - `recordRequest` → {'logger': ['debug', 'debug', 'warn'], 'cacheService': ['set'], 'events': ['publishAnomaly']}
  - `markForceLogout` → {'cacheService': ['set'], 'logger': ['warn']}
  - `incrementCounter` → {'cacheService': ['getRedisClient', 'set'], 'logger': ['error']}

### `UploadService` (src\upload\upload.service.ts)
- Calls:
  - `uploadFile` → {'logger': ['log', 'log', 'error'], 'utapi': ['uploadFiles']}

### `UsersService` (src\users\users.service.ts)
- Status: FINISHED
- Prisma `user`: {'findUnique': 7, 'findMany': 1, 'update': 3}
- Prisma `client`: {'update': 1}
- Prisma `provider`: {'update': 1}
- Calls:
  - `findOne` → {'logger': ['log', 'log', 'warn', 'error']}
  - `findByEmail` → {'logger': ['log', 'warn', 'error']}
  - `findAllUsers` → {'logger': ['log', 'log', 'error']}
  - `update` → {'logger': ['log', 'log', 'log', 'log', 'log', 'log', 'log', 'log', 'log', 'error']}
  - `remove` → {'logger': ['log', 'log', 'log', 'error']}
  - `requestDataExport` → {'logger': ['log', 'log', 'log', 'error'], 'queuesService': ['addDataExportJob'], 'notificationsService': ['createNotification']}
  - `requestAccountDeletion` → {'logger': ['log', 'log', 'log', 'error'], 'notificationsService': ['createNotification']}

### `` (src\utils\geocoding.service.ts)

### `CriminalBackgroundCheckService` (src\verification\criminal-background-check.service.ts)
- Status: SUCCESS
- Calls:
  - `checkCpf` → {'logger': ['log', 'error', 'log', 'error', 'log', 'error']}

### `VerificationService` (src\verification\verification.service.ts)
- Prisma `provider`: {'update': 11, 'findUnique': 1}
- Calls:
  - `getPendingProviders` → {'logger': ['log'], 'providersService': ['getPendingProviders']}
  - `uploadAvatar` → {'logger': ['log', 'warn', 'log', 'log'], 'providersService': ['findOne'], 'documentProcessingService': ['uploadImage']}
  - `uploadDocumentPhoto` → {'logger': ['log', 'warn', 'log', 'log'], 'providersService': ['findOne'], 'documentProcessingService': ['uploadImage']}
  - `uploadSelfieWithDocument` → {'logger': ['log', 'warn', 'log', 'log'], 'providersService': ['findOne'], 'documentProcessingService': ['uploadImage']}
  - `updateStatusForManualReview` → {'logger': ['log', 'warn', 'log', 'log'], 'providersService': ['findOne']}
  - `updateProviderVerificationStatusManually` → {'logger': ['log', 'warn', 'log'], 'providersService': ['findOne']}
  - `updateProviderOcrResult` → {'logger': ['log']}
  - `updateProviderLivenessResult` → {'logger': ['log']}
  - `updateProviderFaceComparisonResult` → {'logger': ['log']}
  - `rejectProvider` → {'logger': ['log', 'log'], 'providersService': ['findOne']}
  - `advanceVerificationStatus` → {'logger': ['log', 'warn', 'log'], 'providersService': ['findOne']}
