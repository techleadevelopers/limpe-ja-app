# Backend Business Analysis
- Files scanned: **328**
- Controllers: **45**
- Services: **54**
- DTOs: **91**

## Routes

- **GET** `/` → `getHello`
- **GET** `/health` → `getHealth`
- **GET** `/admin/dashboard/metrics` → `getMetrics`
- **GET** `/admin/dashboard/revenue-trend` → `getRevenueTrend`
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
- **POST** `/analytics/events` → `receiveEvent`
- **POST** `/auth/register/client` → `registerClient`
- **POST** `/auth/register/provider` → `registerProvider`
- **POST** `/auth/login` → `login`
- **POST** `/auth/forgot-password` → `forgotPassword`
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
- **POST** `/bookings/schedule-and-pay` → `scheduleAndPay`
- **GET** `/bookings/me` → `findMyBookings`
- **GET** `/bookings/:id` → `findOne`
- **PATCH** `/bookings/:id/status` → `updateStatus`
- **PATCH** `/bookings/:id/cancel` → `cancelBooking`
- **GET** `/bookings/check-active-chat/:clientId/:providerId` → `checkActiveChat`
- **POST** `/bookings/:id/report-issue` → `reportIssue`
- **POST** `/bookings/:id/dispute` → `reportDispute`
- **PATCH** `/bookings/:id/resolve-dispute` → `resolveDispute`
- **POST** `/bookings/:id/on-the-way` → `onTheWay`
- **POST** `/bookings/:id/arrived` → `arrive`
- **POST** `/bookings/:id/start` → `start`
- **POST** `/bookings/:id/complete` → `complete`
- **POST** `/bookings/auto-complete-overdue` → `autoCompleteOverdue`
- **GET** `/bookings/:id/can-review` → `canReview`
- **GET** `/chat/find-or-create/provider/:providerId/client/:clientId` → `findOrCreateChat`
- **POST** `/chat/:chatId/messages` → `sendMessage`
- **GET** `/chat/:chatId/messages` → `getMessages`
- **GET** `/chat/me/conversations` → `getMyConversations`
- **GET** `/clients/me/dashboard` → `getClientDashboard`
- **PATCH** `/clients/me` → `updateMyProfile`
- **GET** `/clients/:id` → `findOne`
- **PATCH** `/clients/:id` → `updateById`
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
- **GET** `/loyalty/me` → `getMyPoints`
- **GET** `/loyalty/me/history` → `getMyLoyaltyHistory`
- **POST** `/loyalty/redeem` → `redeemPoints`
- **GET** `/loyalty/rewards` → `getRewards`
- **GET** `/v1/metrics/me/summary` → `getCustomerSummaryMetrics`
- **GET** `/v1/metrics/me/timeseries` → `getCustomerTimeseriesMetrics`
- **GET** `/v1/metrics/me/funnel` → `getCustomerFunnelMetrics`
- **GET** `/metrics/prometheus` → `getMetrics`
- **GET** `/missions/my` → `myMissions`
- **POST** `/missions/claim` → `claim`
- **POST** `/notifications` → `create`
- **GET** `/notifications/me` → `getUserNotifications`
- **PATCH** `/notifications/me/mark-as-read` → `markNotificationsAsRead`
- **PATCH** `/notifications/:id/mark-as-read` → `markNotificationByIdAsRead`
- **DELETE** `/notifications/:id` → `deleteNotification`
- **POST** `/notifications/send` → `send`
- **POST** `/notifications/qa/send` → `sendQaNotification`
- **POST** `/notifications/schedule` → `schedule`
- **GET** `/notifications/suggestions` → `getSuggestions`
- **POST** `/notifications/quick-action/:action` → `executeQuickAction`
- **POST** `/notifications/register-token` → `registerToken`
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
- **POST** `/providers/:providerId/services` → `create`
- **GET** `/providers/:providerId/services` → `findAll`
- **PATCH** `/providers/:providerId/services/:id` → `update`
- **DELETE** `/providers/:providerId/services/:id` → `remove`
- **GET** `/providers/recommended` → `findRecommendedProviders`
- **GET** `/providers/nearby` → `findNearbyProviders`
- **GET** `/providers` → `search`
- **GET** `/providers/me` → `getMyProfile`
- **PATCH** `/providers/me` → `updateMyProfile`
- **POST** `/providers/me/avatar` → `uploadAvatar`
- **GET** `/providers/:providerId/metrics` → `getProviderMetrics`
- **GET** `/providers/:providerId/offers` → `getProviderOffers`
- **PUT** `/providers/me/settings` → `saveMySettings`
- **GET** `/providers/me/settings` → `getMySettings`
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

### `AppService` (app.service.ts)

### `AdminDashboardService` (admin\admin-dashboard.service.ts)
- Prisma `user`: {'count': 1}
- Prisma `provider`: {'count': 2}
- Prisma `booking`: {'count': 1, 'aggregate': 1, 'findMany': 1}

### `AuthService` (auth\auth.service.ts)
- Prisma `user`: {'findUnique': 8, 'create': 2, 'findFirst': 1}
- Prisma `client`: {'findUnique': 1}
- Prisma `provider`: {'findUnique': 1, 'create': 1}
- Prisma `address`: {'create': 1}
- Calls:
  - `login` → {'jwtService': ['sign'], 'logger': ['log']}
  - `registerClient` → {'geocodingService': ['geocodeAddress'], 'logger': ['log', 'log', 'error']}
  - `registerProvider` → {'logger': ['log', 'log', 'log', 'error']}
  - `forgotPassword` → {'logger': ['warn', 'log', 'log', 'error', 'log'], 'jwtService': ['sign'], 'emailService': ['sendEmail']}
  - `handleReferralCode` → {'referralsService': ['createReferral', 'createReferral'], 'logger': ['warn', 'warn', 'log']}

### `AvailabilityService` (availability\availability.service.ts)
- Prisma `provider`: {'findUnique': 3}
- Prisma `availability`: {'findMany': 2, 'delete': 2, 'update': 1, 'findFirst': 2, 'create': 2}
- Prisma `booking`: {'findMany': 1, 'findFirst': 2}

### `` (availability\locks\redis-lock.service.ts)

### `BookingsService` (bookings\bookings.service.ts)
- Status: PROCESSED
- Prisma `booking`: {'findUnique': 12, 'update': 1, 'findFirst': 4, 'create': 2, 'count': 1, 'findMany': 3}
- Prisma `address`: {'create': 1}
- Prisma `client`: {'findUnique': 1, 'update': 3}
- Prisma `provider`: {'findUnique': 1, 'update': 1}
- Prisma `ledgerEntry`: {'findFirst': 4, 'createMany': 1, 'create': 2}
- Prisma `transaction`: {'create': 1}
- Calls:
  - `notifyClientStatusUpdate` → {'queuesService': ['addNotificationJob'], 'logger': ['warn']}
  - `create` → {'logger': ['log', 'log', 'log', 'log', 'log', 'error', 'log', 'error', 'log', 'error', 'log', 'error', 'log', 'log', 'warn', 'log', 'log', 'log', 'warn', 'log', 'log', 'log', 'log', 'warn', 'log', 'error', 'log'], 'redisLockService': ['acquireLock', 'releaseLock'], 'i18n': ['translate', 'translate', 'translate', 'translate', 'translate', 'translate', 'translate', 'translate', 'translate', 'translate', 'translate'], 'clientsService': ['findClientByUserId'], 'providersService': ['findOne'], 'providerServicesService': ['findOne'], 'pricingService': ['calculatePrice'], 'couponsService': ['applyCoupon', 'markCouponAsUsed'], 'missionsService': ['trackEvent']}
  - `createBookingFromSubscription` → {'providerServicesService': ['findOne'], 'i18n': ['translate']}
  - `createBookingAndPixCharge` → {'logger': ['log', 'log', 'log', 'log', 'log', 'log', 'log', 'error'], 'paymentsService': ['createPixCharge'], 'i18n': ['translate']}
  - `findUserBookings` → {'logger': ['log', 'error', 'error', 'log', 'error', 'log', 'warn', 'log'], 'i18n': ['translate', 'translate', 'translate']}
  - `findOne` → {'logger': ['log'], 'i18n': ['translate']}
  - `updateStatus` → {'logger': ['log', 'error', 'log', 'log', 'log', 'warn', 'log', 'warn', 'log', 'log', 'log', 'log', 'log', 'log', 'log', 'log', 'error', 'warn', 'warn', 'log', 'log', 'log', 'warn', 'log', 'log', 'warn', 'log'], 'i18n': ['translate', 'translate', 'translate', 'translate', 'translate', 'translate'], 'providersService': ['findByUserId'], 'clientsService': ['findClientByUserId'], 'loyaltyService': ['addPoints'], 'queuesService': ['addNotificationJob', 'scheduleBookingReminders', 'addNotificationJob', 'addNotificationJob'], 'missionsService': ['trackEvent', 'trackEvent'], 'couponsService': ['issueReturnCoupon'], 'referralsService': ['handleBookingCompletedForReferral']}
  - `findUpcomingBookings` → {'logger': ['log', 'log', 'log']}
  - `onTheWayService` → {'logger': ['log']}
  - `arriveAtLocation` → {'logger': ['log']}
  - `startService` → {'queuesService': ['addNotificationJob']}
  - `completeService` → {'queuesService': ['addNotificationJob', 'addNotificationJob'], 'logger': ['warn']}
  - `autoCompleteOverdueBookings` → {'logger': ['log', 'warn'], 'queuesService': ['addNotificationJob', 'addNotificationJob']}
  - `cronAutoCompleteOverdue` → {'logger': ['warn']}
  - `reportIssue` → {'logger': ['log', 'log'], 'i18n': ['translate', 'translate', 'translate', 'translate'], 'clientsService': ['findClientByUserId'], 'providersService': ['findByUserId'], 'queuesService': ['addNotificationJob']}
  - `reportDispute` → {'logger': ['log', 'log', 'log'], 'i18n': ['translate', 'translate', 'translate'], 'clientsService': ['findClientByUserId'], 'providersService': ['findByUserId'], 'queuesService': ['addDisputeJob']}
  - `resolveDispute` → {'logger': ['log', 'log', 'log', 'log', 'log', 'log'], 'i18n': ['translate', 'translate', 'translate', 'translate'], 'queuesService': ['addNotificationJob', 'addNotificationJob']}

### `CacheService` (cache\cache.service.ts)
- Calls:
  - `constructor` → {'logger': ['debug', 'debug', 'error', 'debug', 'error'], 'cacheManager': ['set']}
  - `del` → {'cacheManager': ['del'], 'logger': ['debug', 'error', 'error'], 'redisClient': ['set']}
  - `reset` → {'cacheManager': ['clear'], 'logger': ['warn', 'error']}

### `ChatService` (chat\chat.service.ts)
- Prisma `chat`: {'findFirst': 1, 'create': 1, 'findUnique': 3, 'findMany': 1}
- Prisma `client`: {'findUnique': 6}
- Prisma `provider`: {'findUnique': 6}
- Prisma `booking`: {'findFirst': 4}
- Prisma `message`: {'create': 1, 'findMany': 1, 'count': 1}
- Calls:
  - `findOrCreateChat` → {'logger': ['log', 'log', 'log']}
  - `createMessage` → {'logger': ['log', 'error', 'error', 'error', 'error', 'warn', 'warn', 'log']}
  - `getMessagesByChatId` → {'logger': ['log', 'error', 'error', 'error', 'warn', 'warn', 'log']}
  - `getConversationsForUser` → {'logger': ['log', 'log']}
  - `isUserParticipantOfChat` → {'logger': ['log', 'log', 'log']}

### `ClientsService` (clients\clients.service.ts)
- Prisma `client`: {'findUnique': 4, 'update': 1}
- Calls:
  - `findClientById` → {'logger': ['log', 'warn']}
  - `findClientByUserId` → {'logger': ['log', 'warn']}
  - `updateClient` → {'logger': ['log', 'log', 'log', 'error']}
  - `getClientDashboardData` → {'logger': ['log', 'log']}

### `I18nService` (common\i18n\i18n.service.ts)
- Calls:
  - `loadTranslations` → {'logger': ['warn', 'log', 'warn', 'warn'], 'translations': ['set']}
  - `translate` → {'translations': ['get', 'get']}

### `RedisLockService` (common\locks\redis-lock.service.ts)
- Calls:
  - `acquireLock` → {'redisClient': ['set']}
  - `releaseLock` → {'redisClient': ['eval']}
  - `onModuleDestroy` → {'redisClient': ['disconnect']}

### `EmailService` (common\services\email.service.ts)
- Calls:
  - `constructor` → {'logger': ['error', 'log', 'log', 'error', 'warn']}
  - `sendEmail` → {'transporter': ['sendMail'], 'logger': ['log', 'log', 'error']}
  - `simulateSendEmail` → {'logger': ['warn', 'debug']}

### `GeocodingService` (common\services\geocoding.service.ts)
- Calls:
  - `constructor` → {'logger': ['warn', 'log']}
  - `geocodeAddress` → {'logger': ['log', 'error', 'warn', 'error', 'warn', 'error']}
  - `simulateGeocoding` → {'logger': ['warn']}

### `SmsService` (common\services\sms.service.ts)
- Calls:
  - `constructor` → {'logger': ['log', 'error', 'warn']}
  - `sendSms` → {'logger': ['log', 'error']}
  - `simulateSendSms` → {'logger': ['warn', 'debug']}

### `ComplianceService` (compliance\compliance.service.ts)
- Prisma `user`: {'findUnique': 3, 'update': 1}
- Prisma `userConsent`: {'upsert': 1, 'findUnique': 1, 'deleteMany': 1}
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

### `ConnectService` (connect\connect.service.ts)
- Calls:
  - `getAccessToken` → {'logger': ['error']}
  - `saveTokens` → {'cache': ['set', 'set', 'set']}
  - `runChallenge` → {'logger': ['log', 'error']}
  - `createApplication` → {'logger': ['error']}

### `CouponsService` (coupons\coupons.service.ts)
- Prisma `coupon`: {'findUnique': 6, 'create': 1, 'findMany': 2, 'update': 3, 'findFirst': 1}
- Prisma `client`: {'findUnique': 2}
- Calls:
  - `create` → {'logger': ['log', 'log']}
  - `update` → {'logger': ['log', 'log']}
  - `applyCoupon` → {'logger': ['warn', 'log', 'warn', 'warn', 'warn', 'warn', 'warn', 'warn', 'warn', 'warn', 'warn', 'log', 'log', 'log']}
  - `markCouponAsUsed` → {'logger': ['warn', 'log', 'log', 'log']}
  - `issueCouponFromMission` → {'logger': ['log', 'log']}
  - `issueReturnCoupon` → {'logger': ['log', 'log']}
  - `issueReferralReferredCoupon` → {'logger': ['log', 'log']}
  - `issueReferralReferrerCoupon` → {'logger': ['log', 'log']}
  - `resolveCoupon` → {'logger': ['log', 'log']}
  - `getMyCoupons` → {'logger': ['log']}
  - `ensureWelcomeCoupon` → {'logger': ['log']}

### `DashboardService` (dashboard\dashboard.service.ts)
- Calls:
  - `getDashboardData` → {'logger': ['log', 'error', 'log', 'log', 'log', 'log', 'log', 'log', 'log', 'log'], 'providersService': ['findByUserId'], 'bookingsService': ['findUpcomingBookings'], 'earningsService': ['getEarnings'], 'reviewsService': ['findRecentReviewsByProviderId']}

### `DisputeService` (disputes\dispute.service.ts)
- Prisma `booking`: {'findUnique': 4}
- Prisma `dispute`: {'findFirst': 1, 'create': 1, 'findUnique': 3, 'findMany': 1, 'update': 1}
- Prisma `ledgerEntry`: {'create': 3, 'aggregate': 1}
- Prisma `supportTicket`: {'findFirst': 1, 'create': 1}
- Prisma `user`: {'findUnique': 1}
- Prisma `disputeMessage`: {'create': 1}
- Calls:
  - `createDispute` → {'logger': ['log', 'warn', 'log', 'error'], 'bookingsService': ['updateStatus'], 'notificationsService': ['createNotification']}
  - `addMessageToDispute` → {'notificationsService': ['createNotification', 'createNotification'], 'logger': ['error']}
  - `updateDisputeStatus` → {'logger': ['log', 'warn', 'log', 'error'], 'bookingsService': ['updateStatus'], 'notificationsService': ['createNotification', 'createNotification']}

### `DocumentProcessingService` (document-processing\document-processing.service.ts)
- Calls:
  - `uploadImage` → {'uploadService': ['uploadFile'], 'logger': ['log', 'error']}
  - `processDocumentOcr` → {'logger': ['warn']}
  - `compareFaces` → {'logger': ['warn']}
  - `performLivenessCheck` → {'logger': ['warn']}

### `LocalStorageService` (document-processing\local-storage.service.ts)
- Calls:
  - `uploadFile` → {'logger': ['log', 'log', 'error']}
  - `processDocumentForOcr` → {'logger': ['warn']}
  - `processSelfieForLiveness` → {'logger': ['warn']}
  - `compareFaces` → {'logger': ['warn']}

### `EarningsService` (earnings\earnings.service.ts)
- Prisma `ledgerEntry`: {'aggregate': 2, 'findMany': 2}
- Calls:
  - `getEarnings` → {'providersService': ['findByUserId']}
  - `requestWithdrawal` → {'payoutsService': ['requestWithdrawal']}

### `EmailService` (email\email.service.ts)
- Prisma `user`: {'findUnique': 1}
- Calls:
  - `constructor` → {'logger': ['warn']}
  - `sendEmail` → {'logger': ['log', 'error']}
  - `sendPanicAlertEmail` → {'logger': ['warn']}
  - `sendIncidentStatusUpdateEmail` → {'logger': ['warn']}
  - `sendAdminWithdrawalFailedEmail` → {'logger': ['warn']}

### `FaqsService` (faqs\faqs.service.ts)
- Prisma `fAQItem`: {'create': 1, 'findMany': 1, 'findUnique': 3, 'update': 1, 'delete': 1}

### `GeocodingService` (geocoding\geocoding.service.ts)
- Calls:
  - `constructor` → {'logger': ['warn']}
  - `geocodeAddress` → {'logger': ['error', 'log', 'log', 'warn', 'error', 'error', 'error']}
  - `getZoneByCoordinates` → {'logger': ['log']}

### `GuaranteeService` (guarantee\guarantee.service.ts)
- Status: PENDING
- Prisma `booking`: {'findUnique': 1}
- Prisma `guaranteeClaim`: {'create': 1, 'findMany': 1, 'findUnique': 2, 'update': 1}
- Prisma `user`: {'findMany': 1}
- Calls:
  - `submitClaim` → {'notificationsService': ['sendPushNotification']}
  - `updateClaimStatus` → {'notificationsService': ['sendPushNotification']}

### `LoyaltyService` (loyalty\loyalty.service.ts)
- Status: FINISHED
- Prisma `loyalty`: {'findUnique': 2, 'update': 3, 'findMany': 1}
- Prisma `reward`: {'findUnique': 1, 'findMany': 1}
- Prisma `loyaltyTransaction`: {'create': 2, 'findMany': 2, 'aggregate': 1}
- Prisma `userTier`: {'findUnique': 1}
- Prisma `client`: {'findUnique': 2}
- Prisma `booking`: {'findMany': 1}
- Prisma `review`: {'findFirst': 1}
- Calls:
  - `addPoints` → {'logger': ['log', 'warn', 'log', 'log']}
  - `redeemPoints` → {'logger': ['log', 'warn', 'warn', 'warn', 'log', 'log'], 'couponsService': ['create']}
  - `getUserTier` → {'logger': ['warn']}
  - `getUserBookingStreak` → {'logger': ['warn']}
  - `hasRecentGoodReview` → {'logger': ['warn']}
  - `recalculateUserTiers` → {'logger': ['log', 'log', 'log']}
  - `expireOldPoints` → {'logger': ['log', 'debug', 'log', 'warn', 'log']}

### `MetricsService` (metrics\metrics.service.ts)
- Calls:
  - `getCustomerSummary` → {'privacyPolicy': ['ensureUserAccess'], 'bookingsRepo': ['countBookings', 'countBookings', 'countBookings'], 'reviewsRepo': ['getAverageRating'], 'paymentsRepo': ['getTotalSpent']}
  - `getCustomerTimeseries` → {'privacyPolicy': ['ensureUserAccess'], 'bookingsRepo': ['getBookingCountsByGranularity'], 'paymentsRepo': ['getTotalSpentByGranularity']}
  - `getCustomerFunnel` → {'privacyPolicy': ['ensureUserAccess'], 'bookingsRepo': ['countBookings', 'countBookings', 'countBookings'], 'paymentsRepo': ['countPaymentIntents', 'countPaidPayments']}

### `MissionsService` (missions\missions.service.ts)
- Prisma `missionProgress`: {'findUnique': 1, 'update': 1}
- Calls:
  - `trackEvent` → {'logger': ['log', 'log', 'log', 'log', 'log'], 'missionsProgressService': ['trackEvent']}
  - `getMyMissions` → {'missionsProgressService': ['getUserMissionsWithProgress']}
  - `claimMission` → {'logger': ['log', 'warn', 'log', 'log'], 'couponsService': ['issueCouponFromMission'], 'loyaltyService': ['addPoints']}

### `MissionsProgressService` (missions\progress.service.ts)
- Prisma `missionEvent`: {'create': 1, 'findMany': 1, 'count': 1}
- Prisma `mission`: {'findMany': 2, 'findUnique': 3}
- Prisma `missionProgress`: {'findMany': 1, 'deleteMany': 1, 'findUnique': 2, 'update': 4, 'create': 1}
- Calls:
  - `applyEventToMission` → {'logger': ['error']}

### `NotificationsService` (notifications\notifications.service.ts)
- Status: CONFIRMED
- Prisma `notification`: {'create': 1, 'findMany': 1, 'updateMany': 2, 'findUnique': 2, 'update': 1, 'delete': 1}
- Prisma `user`: {'findUnique': 1, 'update': 2, 'updateMany': 1}
- Prisma `booking`: {'update': 1}
- Calls:
  - `createNotification` → {'logger': ['error', 'error']}
  - `getUserNotifications` → {'logger': ['error']}
  - `markNotificationsAsRead` → {'logger': ['error']}
  - `markNotificationByIdAsRead` → {'i18n': ['translate'], 'logger': ['error']}
  - `sendPushNotification` → {'logger': ['log', 'warn', 'log']}
  - `isAxiosError` → {'logger': ['warn', 'log', 'error']}
  - `deleteNotification` → {'i18n': ['translate']}
  - `executeQuickAction` → {'logger': ['log', 'log', 'log', 'log', 'log', 'log', 'log', 'error'], 'i18n': ['translate']}
  - `registerDeviceToken` → {'logger': ['warn', 'error']}

### `OffersService` (offers\offers.service.ts)
- Prisma `offer`: {'create': 1, 'findMany': 2, 'findUnique': 3, 'update': 1, 'delete': 1}

### `PaymentsService` (payments\payments.service.ts)
- Status: APPROVED, CONFIRMED, FAILED, PAID, PENDING, REFUNDED, REJECTED
- Prisma `paymentIntent`: {'findFirst': 4, 'update': 1, 'upsert': 1, 'findUnique': 1}
- Prisma `booking`: {'update': 4, 'findUnique': 4}
- Prisma `transaction`: {'findMany': 1, 'findUnique': 1, 'update': 1, 'create': 1}
- Prisma `payout`: {'findMany': 1, 'update': 2}
- Prisma `user`: {'findUnique': 1}
- Prisma `provider`: {'findUnique': 1}
- Calls:
  - `constructor` → {'logger': ['log', 'warn', 'warn', 'warn']}
  - `handlePaymentWebhook` → {'logger': ['log', 'warn', 'error', 'log', 'log', 'warn', 'log', 'warn'], 'queues': ['addNotificationJob', 'addNotificationJob', 'addNotificationJob']}
  - `validateHmac` → {'logger': ['error']}
  - `confirmPixPayment` → {'logger': ['log', 'warn', 'warn', 'log', 'log', 'warn']}
  - `registerPixWebhook` → {'connectService': ['getAccessToken'], 'pagseguroApiBaseUrl': ['replace'], 'logger': ['error']}
  - `registerPayoutsWebhook` → {'connectService': ['getAccessToken'], 'pagseguroApiBaseUrl': ['replace'], 'logger': ['error']}
  - `rejectWithdrawal` → {'logger': ['warn']}
  - `createPixCharge` → {'logger': ['log', 'error']}
  - `requestWithdrawal` → {'payoutsService': ['requestWithdrawal']}
  - `handleWithdrawalWebhook` → {'payoutsService': ['handleGatewayWebhook']}

### `PayoutsService` (payouts\payouts.service.ts)
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

### `PricingService` (pricing\pricing.service.ts)
- Prisma `providerService`: {'findFirst': 1}
- Prisma `service`: {'findUnique': 1}
- Prisma `pricingRule`: {'create': 1, 'findMany': 2, 'findUnique': 2, 'update': 1, 'delete': 1}
- Calls:
  - `createRule` → {'settings': ['appendPricingAudit']}
  - `updateRule` → {'settings': ['appendPricingAudit']}
  - `deleteRule` → {'settings': ['appendPricingAudit']}
  - `getDemandForContext` → {'bookingsService': ['getDemandCountForArea'], 'cacheService': ['set']}

### `PrismaService` (prisma\prisma.service.ts)

### `ProviderServicesService` (provider-services\provider-services.service.ts)
- Prisma `providerService`: {'findUnique': 1, 'create': 1, 'findMany': 1, 'findFirst': 1, 'update': 1, 'deleteMany': 1}
- Prisma `provider`: {'findUnique': 1}
- Calls:
  - `create` → {'providersService': ['findOne'], 'servicesService': ['findOne']}

### `ProvidersService` (providers\providers.service.ts)
- Status: ACTIVE, FINISHED
- Prisma `availability`: {'findMany': 1}
- Prisma `booking`: {'findMany': 1}
- Prisma `provider`: {'findUnique': 9, 'update': 6, 'findMany': 5}
- Prisma `offer`: {'findMany': 1}
- Calls:
  - `applyRadiusFilter` → {'settingsService': ['getProviderRadiusKm']}
  - `updateAvatar` → {'logger': ['log', 'warn', 'log', 'log', 'log', 'log', 'error'], 'documentProcessingService': ['uploadImage'], 'cacheService': ['del', 'del', 'del']}
  - `getPendingProviders` → {'logger': ['log']}
  - `findOne` → {'logger': ['log', 'log', 'log', 'log'], 'cacheService': ['set']}
  - `findByUserId` → {'logger': ['log', 'log', 'log'], 'cacheService': ['set']}
  - `updateByUserId` → {'logger': ['log', 'warn', 'log', 'log', 'log'], 'cacheService': ['del', 'del', 'del']}
  - `updateById` → {'logger': ['log', 'warn', 'log'], 'cacheService': ['del', 'del']}
  - `remove` → {'logger': ['log', 'warn', 'log', 'log', 'log'], 'cacheService': ['del', 'del', 'del']}
  - `search` → {'logger': ['log', 'log', 'log']}
  - `json_build_object` → {'logger': ['error', 'log', 'log', 'log'], 'cacheService': ['set']}
  - `findAllProviders` → {'logger': ['log']}
  - `findTopRatedOrExperiencedProviders` → {'logger': ['log', 'log', 'log']}
  - `updateProviderBadges` → {'logger': ['log', 'warn', 'log', 'log'], 'cacheService': ['del', 'del', 'del', 'del']}
  - `updateProviderPerformanceMetrics` → {'logger': ['log', 'warn', 'log', 'log'], 'cacheService': ['del', 'del', 'del', 'del']}
  - `getProviderPerformanceMetrics` → {'logger': ['log']}
  - `getProviderOffers` → {'logger': ['log']}
  - `applyRankingBoost` → {'logger': ['log', 'log', 'log']}

### `QueuesService` (queues\queues.service.ts)
- Calls:
  - `getQueueInstance` → {'logger': ['error', 'log', 'error']}
  - `removeJob` → {'logger': ['log', 'warn', 'error']}
  - `scheduleBookingReminders` → {'i18n': ['translate', 'translate']}
  - `getAllQueuesStatus` → {'queueNames': ['map']}
  - `getJobsByStatus` → {'logger': ['error']}
  - `retryJobById` → {'logger': ['log', 'log']}

### `RankingService` (ranking\ranking.service.ts)
- Calls:
  - `getProviderRanking` → {'logger': ['log', 'log'], 'providersService': ['search']}
  - `getProviderPositionInRanking` → {'logger': ['log', 'log']}

### `ReferralsService` (referrals\referrals.service.ts)
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

### `ReviewsService` (reviews\reviews.service.ts)
- Status: FINISHED
- Prisma `booking`: {'findUnique': 1}
- Prisma `client`: {'findUnique': 1}
- Prisma `review`: {'findMany': 3, 'findUnique': 1}
- Prisma `provider`: {'findUnique': 1}
- Calls:
  - `submitReview` → {'logger': ['log', 'log', 'log', 'log', 'log', 'warn', 'log'], 'loyaltyService': ['addPoints', 'addPoints'], 'missionsService': ['trackEvent'], 'providersService': ['updateProviderBadges']}
  - `findRecentReviewsByProviderId` → {'logger': ['log', 'log']}

### `SafetyService` (safety\safety.service.ts)
- Status: ACTIVE, PENDING_REVIEW
- Prisma `panicAlert`: {'create': 1, 'findMany': 1, 'findUnique': 1, 'update': 1}
- Prisma `user`: {'findUnique': 1, 'findMany': 1}
- Prisma `booking`: {'findUnique': 1}
- Prisma `incident`: {'create': 1, 'findMany': 2, 'findUnique': 1, 'update': 1}
- Calls:
  - `reportPanic` → {'notificationsService': ['sendPushNotification'], 'smsService': ['sendPanicAlertSms'], 'emailService': ['sendPanicAlertEmail'], 'queuesService': ['addJob']}
  - `reportIncident` → {'queuesService': ['addJob']}
  - `updateIncidentStatus` → {'notificationsService': ['sendPushNotification'], 'emailService': ['sendIncidentStatusUpdateEmail']}

### `SearchService` (search\search.service.ts)
- Calls:
  - `performSearch` → {'pricingService': ['calculatePrice'], 'logger': ['error'], 'providersService': ['search'], 'offersService': ['searchOffers']}

### `ServicesService` (services\services.service.ts)
- Prisma `service`: {'create': 1, 'findMany': 1, 'findUnique': 1, 'update': 1, 'delete': 1}
- Calls:
  - `create` → {'cacheService': ['del']}
  - `findAll` → {'cacheService': ['set']}
  - `findOne` → {'cacheService': ['set']}
  - `update` → {'cacheService': ['del', 'del']}
  - `remove` → {'cacheService': ['del', 'del']}

### `SettingsService` (settings\settings.service.ts)
- Calls:
  - `getSlaSettings` → {'config': ['get', 'get', 'get', 'get']}
  - `updateSlaSettings` → {'cache': ['set'], 'logger': ['warn', 'log']}
  - `setProviderRadiusKm` → {'logger': ['log']}
  - `getProviderRadiusKm` → {'logger': ['debug']}
  - `getGeneralSettings` → {'config': ['get']}
  - `updateGeneralSettings` → {'cache': ['set', 'set'], 'logger': ['warn']}
  - `appendPricingAudit` → {'cache': ['set']}

### `SmsService` (sms\sms.service.ts)
- Calls:
  - `constructor` → {'logger': ['log', 'log', 'log', 'log', 'error', 'log']}
  - `sendSms` → {'logger': ['error', 'log', 'log', 'error', 'error']}
  - `sendPanicAlertSms` → {'logger': ['error', 'warn', 'warn', 'error', 'error']}
  - `startVerification` → {'logger': ['log', 'log', 'error', 'error']}
  - `checkVerification` → {'logger': ['log', 'log', 'log', 'warn', 'error', 'error']}

### `SubscriptionsService` (subscriptions\subscriptions.service.ts)
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

### `SupportService` (support\support.service.ts)
- Prisma `supportTicket`: {'create': 1, 'findMany': 1, 'findUnique': 1, 'update': 2}
- Prisma `supportMessage`: {'create': 1}
- Prisma `supportSlaLog`: {'create': 1}
- Prisma `user`: {'findUnique': 1}
- Calls:
  - `createTicket` → {'notificationsService': ['sendPushNotification'], 'slaPolicy': ['getSlaDueDate'], 'escalationsQueue': ['add']}
  - `addMessageToTicket` → {'notificationsService': ['sendPushNotification', 'sendPushNotification']}
  - `updateTicketStatus` → {'stateMachine': ['canTransition'], 'notificationsService': ['sendPushNotification']}
  - `assignTicket` → {'notificationsService': ['sendPushNotification']}
  - `handleSlaEscalation` → {'notificationsService': ['sendPushNotification']}

### `UploadService` (upload\upload.service.ts)
- Calls:
  - `uploadFile` → {'logger': ['log', 'log', 'error'], 'utapi': ['uploadFiles']}

### `UsersService` (users\users.service.ts)
- Status: FINISHED
- Prisma `user`: {'findUnique': 7, 'findMany': 1, 'update': 3}
- Prisma `client`: {'update': 1}
- Prisma `provider`: {'update': 1}
- Calls:
  - `findOne` → {'logger': ['log', 'log', 'warn', 'error']}
  - `findByEmail` → {'logger': ['log', 'warn', 'error']}
  - `findAllUsers` → {'logger': ['log', 'log', 'error']}
  - `update` → {'logger': ['log', 'log', 'log', 'log', 'log', 'error']}
  - `remove` → {'logger': ['log', 'log', 'log', 'error']}
  - `requestDataExport` → {'logger': ['log', 'log', 'log', 'error'], 'queuesService': ['addDataExportJob'], 'notificationsService': ['createNotification']}
  - `requestAccountDeletion` → {'logger': ['log', 'log', 'log', 'error'], 'notificationsService': ['createNotification']}

### `` (utils\geocoding.service.ts)

### `CriminalBackgroundCheckService` (verification\criminal-background-check.service.ts)
- Status: SUCCESS
- Calls:
  - `checkCpf` → {'logger': ['log', 'error', 'log', 'error', 'log', 'error']}

### `VerificationService` (verification\verification.service.ts)
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
