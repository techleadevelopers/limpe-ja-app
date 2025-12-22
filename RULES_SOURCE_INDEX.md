Commit: 47db0db2d23a815adcc498cbff64b886423aaa62
Generated: 2025-12-20 12:11:36
Scope: backend-cleaning + app (Expo Router)

# RULES SOURCE INDEX

## Bookings
### Regras de negócio
- Criação de bookings exige cliente autenticado (JwtAuthGuard + RolesGuard(@Roles CLIENT)) e validações via CreateBookingDto antes de persistir (ackend-cleaning/src/bookings/bookings.controller.ts:80-148).
- Fluxo "schedule-and-pay" gera PaymentIntent e Transaction atrelados ao booking em um único POST /bookings/schedule-and-pay (ackend-cleaning/src/bookings/bookings.controller.ts:111-147, ackend-cleaning/src/payments/payments.service.ts).
- Atualizações de status são restritas pelas regras definidas em ookingTransitions (ackend-cleaning/src/bookings/bookings.service.ts:77-150) e exigem guardas para client/provider (ackend-cleaning/src/bookings/bookings.controller.ts:218-263).
- Reportar problema transforma status em PENDING_DISPUTE e dispara validações de razão com eportIssue antes de notificar o provedor/admin (ackend-cleaning/src/bookings/bookings.controller.ts:369-404).
- Resolver disputa exige admin e pode aplicar efundAmount e 
ewStatus (chama ookings.controller.ts:406-448).

### Endpoints críticos
- POST /bookings – valida CreateBookingDto, requer client auth, cria objeto Booking e dispara notificações pelo service; status inicial PENDING (ookings.controller.ts:80-108).
- POST /bookings/schedule-and-pay – gera Booking + PIX charge, valida payload e chama PaymentsService.createPixCharge, retornando BookingAndPixResponseDto (ookings.controller.ts:111-147).
- PATCH /bookings/:id/status – aceita UpdateBookingStatusDto, apply guard JwtAuthGuard/RolesGuard, chama BookingsService.changeBookingStatus e altera BookingStatus conforme ookingTransitions (ookings.controller.ts:218-352).
- POST /bookings/:id/report-dispute – clients/providers podem abrir disputa, status vira PENDING_DISPUTE, dispara DisputeService.createDispute e telemetria (ookings.controller.ts:369-404).
- PATCH /bookings/:id/resolve-dispute – admin only, valida esolution, efundAmount, 
ewStatus, atualiza estados e possivelmente registra Transaction/LedgerEntry (ookings.controller.ts:406-448).

### Estado afetado
- BookingStatus segue máquina em ackend-cleaning/src/bookings/states/booking.state-machine.ts:3-45 com transições PENDING ? ACCEPTED/REJECTED ? ON_THE_WAY ? ARRIVED ? STARTED ? COMPLETED ? PAID ? REVIEWED, mais branches para PENDING_DISPUTE, RESCHEDULED e NO_SHOW.

## Payments
### Regras de negócio
- Cobranças PIX exigem clientId do token JWT e validam CreatePixChargeDto antes de delegar ao PaymentsService (ackend-cleaning/src/payments/payments.controller.ts:26-90).
- Admins podem listar transações e iniciar efund com checagem inline de ole === 'ADMIN' para evitar abusos (ackend-cleaning/src/payments/payments.controller.ts:91-132).
- Webhook PIX/PSP utiliza raw body no middleware do main.ts e precisa de idempotência (modelo WebhookReplay) apesar de a validação de assinatura ser atualmente "NÃO ENCONTRADO" (não há código de validação explícito além dos middlewares).

### Endpoints críticos
- POST /payments/pix-charge – JWT Guard, cria cobrança e retorna PixChargeResponseDto, vincula Booking e PaymentIntent (payments.controller.ts:26-75).
- GET /payments/intent/:bookingId – protege com JWT, retorna intent do booking (payments.controller.ts:76-108).
- POST /payments/withdrawal – JwtAuthGuard, requer providerId no token, aceita RequestWithdrawalDto e idempotency-key header para evitar duplicação (payments.controller.ts:109-142).
- GET /payments/transactions e POST /payments/:transactionId/refund – checkpoints de role admin e JwtAuthGuard, manipula Transaction entitades (payments.controller.ts:143-186).

### Side effects
- Criação de refund gera Transaction/LedgerEntry com status atualizado (payments.service.ts).
- Saques desbloqueiam saldo e enviam notificações via payouts service.

## Payouts
### Regras de negócio
- Saques via controller payouts.controller.ts compartilham guards JwtAuthGuard/RolesGuard e só ficam disponíveis para UserRole.PROVIDER (ackend-cleaning/src/payouts/payouts.controller.ts:1-40).
- RequestWithdrawalDto validado antes de chamar PayoutsService.requestWithdrawal e header opcional Idempotency-Key é repassado para o service.

### Endpoints críticos
- GET /payouts/balance – retorna saldo do provider autenticado (payouts.controller.ts:11-21).
- POST /payouts/withdrawals – requer providerId, valida DTO, passa idempotency-key e cria payout (payouts.controller.ts:22-40).

### Estados afetados
- PayoutStatus percorre PENDING ? PROCESSING ? PAID/FAILED/CANCELED conforme prisma/schema.prisma:247-255 e PayoutsService (controller menciona mas não altera diretamente; assuma que service manipula).

## Disputes
### Regras de negócio
- Criação e atualização cuidam de DisputeStatus com guardas ThrottlerGuard, JwtAuthGuard, RolesGuard (dispute.controller.ts:1-150).
- Update de status só admin; aceita header Idempotency-Key (teoricamente para idempotência, mas falta persistência explicita) (dispute.controller.ts:110-150).
- Mensagens devem ter conteúdo não vazio e autenticação do remetente (dispute.controller.ts:150-220).

### Endpoints críticos
- POST /disputes – valida DTO, exige client/provider, registra Dispute e possivelmente BookingStatus.PENDING_DISPUTE (dispute.controller.ts:1-134).
- PATCH /disputes/:id/status – admin only, atualiza status e dispara DisputeService.updateDisputeStatus (dispute.controller.ts:110-150).
- POST /disputes/:id/message – aceita mensagem não vazia e registra DisputeMessage (dispute.controller.ts:150-220).

### Estados alterados
- DisputeStatus flui PENDING ? IN_REVIEW ? RESOLVED/REJECTED registrado em dispute.service.ts:96-492.

## Availability
### Regras de negócio
- ssertFullHour garante horários arredondados (funcao em vailability.service.ts:1-40).
- getAvailability somente considera provedores existentes e filtra slots pelo dia da semana em UTC, excluindo bookings com status PENDING/CONFIRMED/STARTED/FINISHED (vailability.service.ts:20-120).
- updateAvailability bloqueia alterações em slots passados e conflitos com bookings futuros (checa BookingStatus.PENDING/CONFIRMED/STARTED/FINISHED) e valida intervalos (vailability.service.ts:120-200).

### Endpoints críticos
- GET /availability/:providerId (implícito no service) – busca disponibilidades e horários ocupados (vailability.service.ts:20-120).
- PATCH /availability/:providerId – atualiza múltiplos DTOs, valida full hours, e executa checagem de conflitos com bookings (vailability.service.ts:120-200).

## Coupons
### Regras de negócio
- CouponsService.create impede códigos duplicados, normaliza tipos/targets e registra CouponStatus coerente (ackend-cleaning/src/coupons/coupons.service.ts:1-140).
- Atualizações permitem alterar validade, limite de usos e status (coupons.service.ts:100-150).
- Aplicação de cupom valida existência, target, first-booking e reutiliza CouponApplicationResult com desconto calculado (coupons.service.ts:140-220).

### Endpoints críticos
- POST /coupons (presumido admin) – cria cupom com telemetria coupon_created e CouponStatus (coupons.service.ts).
- POST /coupons/apply – busca cupom por código, valida, calcula discountAmount e atualiza booking (coupons.service.ts:140-220).

## Loyalty
### Regras de negócio
- ddPoints aplica multiplicadores (tier, streak e review), impede duplicação via userId_type_referenceId, e registra telemetria loyalty_points_earned (ackend-cleaning/src/loyalty/loyalty.service.ts:12-120).
- edeemPoints só permite DISCOUNT_COUPON, valida ewardId, saldo e cria cupom com validade 30 dias (loyalty.service.ts:120-200).

### Endpoints críticos
- POST /loyalty/points (presumido) – credita pontos, atualiza saldo e chama coupons service; guardas/auth não especificadas (NÃO ENCONTRADO no trecho acessado).
- POST /loyalty/redeem – valida RedeemPointsDto, cria cupom POINTS-xxxx e decremente saldo (loyalty.service.ts:120-200).

## Referrals
### Regras de negócio
- createReferral impede auto-indicação, compara CPFs dos usuários, limita 5 indicações válidas nos últimos 30 dias e emite cupom REFERRAL_REFERRED (ackend-cleaning/src/referrals/referrals.service.ts:48-150).
- Conversão ocorre quando referido completa o primeiro booking; registra telemetria e chama loyalty/coupons (eferrals.service.ts:180-260).

### Endpoints críticos
- POST /referrals – valida CreateReferralDto, confere IDs, e armazena Referral com telemetria eferral_created (eferrals.service.ts:48-150).
- POST /referrals/convert (presumido) – acionado por BookingsService ao completar booking (não explicitado em controller; BookingsService.handleReferralCompletion?). **NÃO ENCONTRADO** no controller (somente service).

## Notifications
### Regras de negócio
- Todas as rotas usam JwtAuthGuard e ApiBearerAuth (
otifications.controller.ts:1-60).
- Apenas ADMIN pode criar/Enviar notificações (@Roles(UserRole.ADMIN) e RolesGuard).
- Usuários podem ler/marcar/excluir suas notificações e MarkAsReadDto valida os IDs (
otifications.controller.ts:60-180).

### Endpoints críticos
- POST /notifications – admin-only, cria notificação e retorna entidade (
otifications.controller.ts:60-110).
- GET /notifications/me – retorna notificações do usuário autenticado, opcional includeRead query (
otifications.controller.ts:110-140).
- PATCH /notifications/me/mark-as-read e PATCH /notifications/:id/mark-as-read – marcam notificações via DTO (
otifications.controller.ts:140-190).
- DELETE /notifications/:id – remove notificação do usuário autenticado; guardas aplicadas (
otifications.controller.ts:190-230).
- POST /notifications/send – alias admin para enviar imediatamente (
otifications.controller.ts:230-240).

## State Machines (source of truth)
- **BookingStatus** (ackend-cleaning/src/bookings/states/booking.state-machine.ts:3-45): PENDING ? ACCEPTED/REJECTED, ACCEPTED ? ON_THE_WAY ? ARRIVED ? STARTED ? COMPLETED ? PAID ? REVIEWED, com branches para PENDING_DISPUTE, RESCHEDULED, NO_SHOW; transições aplicadas em BookingsService (ackend-cleaning/src/bookings/bookings.service.ts:77-440).
- **DisputeStatus** (ackend-cleaning/src/disputes/dispute.service.ts:96-492): PENDING ? IN_REVIEW ? RESOLVED/REJECTED; métodos DisputeService.createDispute, updateDisputeStatus e BookingsService.resolveDispute gerenciam essas mudanças (dispute.service.ts:96-492, ookings.service.ts:406-448).
- **PayoutStatus** (ackend-cleaning/prisma/schema.prisma:247-255): PENDING ? PROCESSING ? PAID/FAILED/CANCELED; controlado por PayoutsService e exposto em PayoutsController (ackend-cleaning/src/payouts/payouts.controller.ts:1-40).
