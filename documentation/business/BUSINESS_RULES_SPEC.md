Commit: 47db0db2d23a815adcc498cbff64b886423aaa62
Generated: 2025-12-20 12:11:36
Scope: backend-cleaning (booking/payments/provider/admin)

# BUSINESS RULES SPEC

## Booking rules
1. **Criação de booking (cliente)** – POST /bookings exige cliente autenticado (JwtAuthGuard, RolesGuard(@Roles CLIENT)), valida CreateBookingDto e persiste Booking em estado PENDING. Fonte: ackend-cleaning/src/bookings/bookings.controller.ts:80-108. Exemplo: client agenda um serviço com providerId/data/price, recebe BookingDetailsDto com status=PENDING.
2. **Schedule-and-pay** – POST /bookings/schedule-and-pay combina criação e cobrança PIX: after validation, chama BookingsService.createBookingAndPixCharge, gera PaymentIntent e PixChargeResponseDto, além de setar Booking e ledger (lines ackend-cleaning/src/bookings/bookings.controller.ts:111-147 + ackend-cleaning/src/payments/payments.service.ts:26-180). Exemplo: cliente finaliza checkout, backend retorna pixCharge.qrCodeUrl e ooking.id confirmando status=PENDING até webhook PIX pagar.
3. **Reserva de slot e disponibilidade** – AvailabilityService.getAvailability filtra apenas slots para o provedor e dia da semana em UTC, ignorando agendamentos com status PENDING/CONFIRMED/STARTED/FINISHED (ackend-cleaning/src/availability/availability.service.ts:20-120). updateAvailability impede horários conflitantes ou passados (vailability.service.ts:120-200). Exemplo: provider tenta abrir slot 09:00 mas há booking confirmado no mesmo dia; request lança ConflictException.
4. **Cancelamento / No-show** – BookingsService.changeBookingStatus só permite transições definidas em ookingTransitions (ackend-cleaning/src/bookings/bookings.service.ts:77-150), mantendo regras como PENDING ? CANCELED ou STARTED ? FINISHED. BookingsService protege contra cancelamentos em status final e garante telemetria. Exemplo: cliente cancela um booking status=ACCEPTED, service verifica permissões e atualiza para CANCELED (linha ackend-cleaning/src/bookings/bookings.service.ts:1203-1529).
5. **Disputa (cliente ou provedor)** – POST /bookings/:id/report-dispute exige autenticação e eason não vazia, muda status para PENDING_DISPUTE, chama DisputeService.createDispute e registra motivo (ackend-cleaning/src/bookings/bookings.controller.ts:369-404). Exemplo: provedor reporta problema e a reserva entra em disputa enquanto o admin analisa.
6. **Elegibilidade para review** – GET /bookings/:id/can-review só autoriza se Booking.status === FINISHED e o requester for client dono, prevenindo avaliações antecipadas (ackend-cleaning/src/bookings/bookings.controller.ts:541-552).

## Payments rules
1. **PIX intent creation** – POST /payments/pix-charge precisa de JwtAuthGuard, lê CreatePixChargeDto, cria PaymentIntent e retorna PixChargeResponseDto com QR code (ackend-cleaning/src/payments/payments.controller.ts:26-75). Exemplo: cliente inicia pagamento e recebe paymentIntentId e qrCodeUrl para leitura.
2. **Expiração / reemissão** – PaymentsService monitora statuses PaymentIntentStatus e, ao receber webhook com FAILED/EXPIRED, atualiza intent para EXPIRED e booking volta para PENDING (payments.service.ts:520-640). Reemissão implica gerar novo PixCharge se a anterior expirar.
3. **Refund policy** – POST /payments/:transactionId/refund validado só por admin, checa eq.user.role === 'ADMIN' e delega para PaymentsService.initiateRefund, que cria Transaction do tipo REFUND e ajusta ledger. Exemplo: admin cancela cobrança e Transaction.status vira REFUNDED (ackend-cleaning/src/payments/payments.controller.ts:91-118).

## Provider rules
1. **Onboarding** – fluxo pp/auth/provider-register/* alimenta AuthController.registerProvider, persiste Provider com VerificationStatus.PENDING_INITIAL_REVIEW e inicia uploads (ackend-cleaning/src/auth/auth.controller.ts:25-82). Exemplo: novo provedor envia docs, token retorna erificationStatus= PENDING_DOCUMENTS_UPLOAD.
2. **Verificação documental** – VerificationService (not shown) atualiza Provider.verificationStatus e providers.service.ts mantém dados documentPhotoFrontUrl, ackgroundCheckResult e ejectionReason (ackend-cleaning/prisma/schema.prisma:381-431). Exemplo: após revisão manual, status passa para APPROVED e provider ganha acesso a dashboard.
3. **Disponibilidade e aceitação** – Providers cadastrados usam AvailabilityService para horários e providers.service.ts filtra bookings status IN [PENDING, CONFIRMED, STARTED] (providers.service.ts:314-2061). Aceitação/rejeição atualiza status via BookingsService.updateStatus, exigindo UserRole.PROVIDER. Exemplo: provider aceita job e Booking.status transita para ON_THE_WAY apenas depois de autorização e notificação.

## Admin rules
1. **Escopo de acesso** – controllers dmin/dashboard, ookings, disputes, payments aplicam @UseGuards(JwtAuthGuard, RolesGuard) e @Roles(UserRole.ADMIN) (ex: dmin-dashboard.controller.ts:1-29, ookings.controller.ts:54-76, dispute.controller.ts:70-150, payments.controller.ts:91-118). Admins podem listar/refund transações, resolver disputas, auto-completar bookings, mas **não atuam em fluxos client/provider ordinary**.
2. **Proibições explícitas** – admin não pode criar bookings ou emitir PIX charges para si mesmo; essas rotas exigem client/token. Admins devem operar via PATCH /bookings/:id/resolve-dispute com payload esolution e opcional efundAmount (ookings.controller.ts:406-448).
3. **Observabilidade e SLAs** – main.ts inicializa Prometheus/OTEL, e admins consultam dmin/dashboard/metrics (protected) para medir SLAs (main.ts:1-200, dmin-dashboard.controller.ts:1-27).

## Open questions
- Há regras adicionais de review (ex: tempo mínimo após COMPLETED) implementadas nos services? Não encontrado em controllers.
- Que policy define quando equestWithdrawal deve recusar (daily limit, status)? Documentado no PayoutsService mas requer revisão para incluí-la aqui.
