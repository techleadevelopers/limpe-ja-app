BUSINESS DOSSIER — relax-app

1. Visão geral do produto
O que o app faz: Marketplace digital para agendamento e execução de serviços domésticos (limpeza/diaristas) entre clientes e prestadores.
Tipo de marketplace: Dois lados (cliente ↔ prestador) com supervisão administrativa e serviços financeiros integrados (pagamentos PIX, saques e disputas).
Público-alvo: Clientes que buscam limpeza rápida/recorrente e prestadores (providers) licenciados/avaliados; há um painel web/mobile por função.
Valor principal entregue: Facilita conexão, agendamento, pagamento e acompanhamento de serviços com contratos claros, notificações e garantias processadas via backend NestJS + Expo Router.
O que o app NÃO faz: Não oferece funcionalidades fora do domínio residencial (ex.: vendas de produtos), não aceita pagamentos fora do fluxo PIX gerado por paymentsService e não permite clientes criarem serviços para si no painel admin (sem rota pública).
2. Atores do sistema
Ator	Papel	Capacidades	Limitações	Fontes
Cliente	Consumidor	Cadastro/login, explorador (app/client/explore/*), agendamento (bookings.controller.ts), pagamento PIX (payments.controller.ts), chat/feedback/notifications (common/*)	Não altera disponibilidade nem aciona admin diretamente; depende de regras de BookingsService/PaymentsService.	app/auth/*, app/client/*, *.ts, *.ts, *.ts
Prestador / Provider	Operador do serviço	Onboarding/verificação (auth.controller.ts, provider-register), gerenciamento de serviços/disponibilidade (providers.service.ts, availability.service.ts), aceitações/status de booking (BookingsService, Provider rotas), saques (payouts.service.ts)	Só executa bookings confirmados; precisa passar por VerificationStatus.	*.ts, *.ts, *.ts, app/provider/*, app/common/support/*
Admin	Supervisão/Ops	Lista bookings/disputas (admin/* controllers), resolve disputas/pagos, observa métricas, rate limits e webhooks (guardas JWT+Roles).	Não usa o fluxo mobile comum, apenas painel backend; não cria bookings.	*.ts, *.ts, *.ts, *.ts
Sistema (jobs/webhooks)	Automação	Cron jobs de auto-complete (BookingsService@Cron), webhooks Pix/PSP (payments.service.ts, payouts.service.ts), notificações enfileiradas (QueuesService), guardas de replay/segurança.	Dependente de configurações (env, config.module.ts), precisa secrets (PIX_WEBHOOK_SECRET).	*.ts, *.ts, *.ts, *.ts, main.ts
3. Arquitetura funcional (alto nível)
Separação frontend vs backend: Frontend Expo Router (app/*, components/*) consome rotas/telas e usa view DTOs; backend NestJS (backend-cleaning/src/**) implementa autenticação, bookings, pagamentos, notificações e políticas de segurança (JWT, RolesGuard).
Onde regras de negócio vivem: Principalmente nos services backend: BookingsService, PaymentsService, ProvidersService, LoyaltyService. Frontend usa DTOs/props apenas para UI, sem regras (components/*, rotas).
Onde regras NÃO devem viver: Componentes ProviderCard, MissionItem e telas devem permanecer declarativos; lógica de status/roles ficou no backend (ViewDtos).
Contrato frontend-backend: BookingViewDto, ProviderViewDto, MissionViewDto, ProviderEarningsViewDto (backend-cleaning/src/*/dto), entregam flags (badgeLabel, showChatAction, isVerified, etc.) e impedem frontend de interpretar enums diretamente.
4. Domínios de negócio
Auth & Onboarding
Controla: Registro/login de clientes/provedores, forgot-password, verificação.
Entidades: User, Client, Provider, VerificationStatus (auth.controller.ts, auth.service.ts, provider-register/*).
Estados: UserRole, VerificationStatus (PENDING_DOCUMENTS_UPLOAD, APPROVED, etc.).
Fontes: backend-cleaning/src/auth/*, front app/auth/*.
Providers / Prestadores
Controla: Perfil, serviços cadastrados, disponibilidade, métricas, avaliações.
Entidades: Provider, ProviderService, AvailabilitySlot (providers.service.ts, provider-services.service.ts, availability.service.ts).
Estados: VerificationStatus, Provider.status.
Fontes: *.ts, *.ts, app/provider/*.
Bookings / Agendamentos
Controla: Criação, transições (PENDING → CONFIRMED → ...), chat, dispute, auto-complete.
Entidades: Booking, PaymentIntent, Incidents, GuaranteeClaims.
Estados: BookingStatus enum (schema.prisma, service.ts, booking-view.dto.ts).
Payments / PIX
Controla: Génereação de intents PIX, reemissão, expiração via webhook, refund básico.
Entidades: PaymentIntent, Transaction.
Estados: PaymentIntentStatus.
Fontes: *.ts, app/client/subscriptions/*.
Payouts / Saques
Controla: Solicitação/monitoramento de saques, integração PSP, deduplicação via WebhookReplay.
Entidades: Payout, LedgerEntry.
Estados: PayoutStatus.
Fontes: *.ts, guards/webhooks.
Disputes / Garantia
Controla: ReportIssue, reportDispute, resolveDispute, SLA via QueuesService.
Entidades: Dispute, BookingDispute.
Estados: DisputeStatus.
Fontes: *.ts, *.ts, frontend app/common/feedback/*.
Loyalty / Missões
Controla: Missões acumulam pontos, recompensas via missions.service.ts, gamificação.
Entidades: Mission, LoyaltyPoint.
Fontes: *.ts, frontend app/client/missions/*.
Referrals / Indicações
Controla: Convites/referrals com limites e antifraude (IP/CPF).
Entidades: Referral, ReferralCode.
Fontes: *.ts.
Notifications / Safety
Controla: Envio de push (QueuesService), safety (panic, incident report) e canais com status.
Entidades: NotificationToken, SupportTicket, Incident.
Fontes: *.ts, app/common/notifications, app/common/safety.
Admin / Observabilidade
Controla: Dashboards, métricas Prometheus, admin actions (disputes + reembolsos).
Entidades: AdminDashboard DTO, Metrics.
Fontes: *.ts, *.ts, *.ts.
5. Jornadas principais
Cliente
Login: login.tsx + auth.controller.ts (Throttler, JwtAuthGuard) → tokens com user role e view DTOs.
Exploração: index.tsx usa BookingsService/ProvidersService via API para listar prestadores (provider/details), refere ProviderViewDto.
Agendamento: UI schedule-service.tsx chama POST /bookings ou /schedule-and-pay (BookingsController.create/scheduleAndPay), valida via DTO CreateBookingDto.
Pagamento: BookingsService.createBookingAndPixCharge chama PaymentsService.createPixCharge e retorna QR code; webhook (PaymentsService.handlePixWebhook) atualiza BookingStatus.
Execução: Status notificado via BookingsService.changeBookingStatus (ON_THE_WAY → FINISHED); notificações via QueuesService.
Avaliação: BookingDetailsDto.canReview/endpoint GET /bookings/:id/can-review (BookingsController).
Disputa: POST /bookings/:id/report-dispute (BookingsService.reportDispute, DisputeService) e common/feedback/dispute.
Prestador
Onboarding: Rota auth/provider-register/* → AuthController.registerProvider, valida uploads e seta VerificationStatus.PENDING_INITIAL_REVIEW.
Verificação: VerificationService atualiza status e libera Provider nas rotas app/provider/*.
Disponibilidade: app/provider/schedule/manage-availability cria slots via AvailabilityService com validação de overlap.
Aceite de serviço: BookingsService habilita showAcceptRejectActions no DTO e BookingsController.updateStatus permite BookingStatus.CONFIRMED.
Execução: Provider atualiza status (ARRIVED, STARTED, FINISHED) via BookingsService e notifica cliente. Registra startedByUser/completedByUser.
Recebimento: PayoutsService e BookingsService mantêm ledger + ProviderEarningsViewDto com canWithdraw.
Métricas: app/provider/dashboard e backend dashboard.service.ts expõe stats e earnings.
Admin
Monitoramento: dashboard.service.ts, admin-dashboard.controller.ts, prom-client metrics (em main.ts).
Resolução de disputas: BookingsService.resolveDispute, DisputeService + auditorias.
Reembolsos: PaymentsController.refund e Transactions (via PaymentsService).
Métricas: dashboard/service + prom-client.
Intervenções: admin controllers usam @UseGuards(JwtAuthGuard, RolesGuard) e @Roles(UserRole.ADMIN).
6. Regras de negócio canônicas
Regra	Fonte backend	Frontend espelha?	Risco
Booking só novo se slot disponível (no overlap)	AvailabilityService + BookingsService.create	Exploração de disponibilidade no schedule-service.tsx replica slot list	Risco de divergência se front reconcilia mal
Transições válidas de status	BookingsService.changeBookingStatus com BOOKING_STATUS_TRANSITIONS (incluindo PENDING_PROVIDER_CONFIRMATION)	DTO BookingViewDto usa flags showAcceptRejectActions, showChatAction	Baixo
Pagamento PIX → webhook atualiza status	PaymentsService.handlePixWebhook + BookingStatus update	Front confia no DTO BookingDetailsDto.paymentStatus	Risco se webhook falhar (model WebhookReplay)
Refunds só por admins	PaymentsController.refund com @Roles(UserRole.ADMIN)	Não exposto ao cliente	-
Missões concluídas no serviço	MissionsService.completeMission	UI client/missions/* usa bandeiras isCompleted	Divergência se DTOs não alinhados
Saques depois de earnings e sem saldo negativo	PayoutsService.processPayout	Front usa ProviderEarningsViewDto.canWithdraw	Baixo se DTO atualizado
7. Máquinas de estado
BookingStatus: PENDING → PENDING_PROVIDER_CONFIRMATION? → CONFIRMED → ON_THE_WAY → ARRIVED → STARTED → FINISHED; também CANCELED, PENDING_DISPUTE, RESCHEDULED, NO_SHOW. Transições validadas em BOOKING_STATUS_TRANSITIONS (bookings.service.ts).
DisputeStatus: PENDING → IN_REVIEW → RESOLVED/REJECTED (model/DisputeService).
PayoutStatus: PENDING → PROCESSING → PAID, com backtracking via normalizeStatus (payouts.service.ts).
VerificationStatus: (via schema) PENDING_DOCUMENTS_UPLOAD → PENDING_INITIAL_REVIEW → APPROVED/REJECTED controlado em providers.service.ts e DTO ProviderViewDto.
8. Contrato frontend ↔ backend
ViewDtos: ProviderViewDto, MissionViewDto, BookingViewDto, ProviderEarningsViewDto (backend-cleaning/src/*/dto).
Flags derivadas: BookingViewDto fornece badgeLabel, showAcceptRejectActions, showChatAction; frontend nunca interpreta BookingStatus diretamente.
Frontend NÃO pode interpretar: enums BookingStatus, UserRole, VerificationStatus — deve confiar em DTOs e flags.
Quebras possíveis: se backend alterar booking.status sem atualizar BookingViewDto ou se DTOs omitirem campos esperados (ProviderViewDto.isVerified).
9. Segurança e proteção
Guards: JwtAuthGuard + RolesGuard aplicados em todos controllers sensíveis (auth, bookings, admin, payouts). PspWebhookGuard (testado em psp-webhook.guard.spec.ts).
Rate limiting: @Throttle aplicado em /analytics/events, /auth/login, /auth/forgot-password.
Webhooks: PaymentsService.handlePixWebhook e PayoutsService.handleGatewayWebhook usam WebhookReplay para anti-replay; secrets obrigatórios (via config.module.ts e checks em payments.service.ts).
Dados sensíveis: tokens/números logados apenas parcialmente; logs estruturados (ex.: logger.log com eventId) e maskEmail no auth.
Protegido vs público: /admin/* e /payouts/* requerem roles; /analytics/events é público mas throttled.
10. Observações técnicas relevantes
Arquitetura: Services são singletons com QueuesService, RedisLockService, NotificationsService para garantir consistência.
Dívidas técnicas: Uso de as any em alguns pontos (reduzido), TODOs de antifraude (referrals.service.ts) e webhooks sem assinatura ainda apresentados.
Riscos: Mudanças no enum BookingStatus exigem atualização do DTO e front que depende de BookingViewDto. Webhook PIX sem secret configurado (checado em config.module.ts).
Partes sensíveis: BookingsService.changeBookingStatus, PaymentsService.handlePixWebhook, payouts.service.ts (idempotência).
11. O que é CANÔNICO vs FLEXÍVEL
Regra	Fonte	Pode mudar sem quebrar app?
showAcceptRejectActions só para providers + status pendentes	BookingViewDto (booking-view.dto.ts)	Não (frontend depende desses flags)
Rate limits em auth/login/forgot-password	auth.controller.ts	Sim (ajustar só com coordenação)
Anti-replay via WebhookReplay	payouts.service.ts, payments.service.ts	Não (corrupção de pagamentos)
Onboarding flow com VerificationStatus	auth/provider-register/*, providers.service.ts	Não (afeta acesso a dashboard)
Mission completion derivada de backend	missions.service.ts + DTO	Não (frontend não pode recalcular)
12. Pontos abertos / Incertezas
Regras inferidas: Uso exato de PENDING_PROVIDER_CONFIRMATION no frontend (UpcomingServicesSection.tsx) sugere diferença entre “nova solicitação” e “confirmado”; validar se transição deve exigir revisão manual.
Códigos não utilizados: Rotas como /client/messages/limpeja aparecem no scanner mas não documentadas nos DTOs.
Fluxos incompletos: Webhooks de PSP mencionam “segurança removida” e WebhookReplay, mas não há assinatura válida (TODO em payouts.service.ts).
TODOs críticos: referrals.service.ts marca “TODO: AntifraudService”, payments.service.ts ainda depende de signature/rawBody no guard.
Esse dossiê pode ser usado para onboarding, planejamento de refatorações e alinhamento de times de produto/engenharia.