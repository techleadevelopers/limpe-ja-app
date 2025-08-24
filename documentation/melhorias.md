1. Cupons & Ofertas (Boas-vindas e Retorno)
Frontend:

/app/(client)/explore/index.tsx
/components/client/CouponWelcomeCard.tsx
/app/(client)/schedule-service.tsx
/app/(client)/bookings/success.tsx
/app/services/clientService.ts
/app/constants/appStyles.ts
/app/constants/routes.ts
/app/types/backend/offers.ts
/app/types/backend/bookings.ts
/app/types/backend/clients.ts
/app/types/backend/users.ts
/app/(common)/notifications/index.tsx
/app/services/notificationService.ts
Backend:

/src/auth/auth.module.ts (e arquivos relacionados como auth.service.ts, auth-response.dto.ts, user-profile.dto.ts)
/src/coupons/coupons.module.ts (e arquivos relacionados como coupons.service.ts, coupon.entity.ts, create-coupon.dto.ts, apply-coupon.dto.ts)
/src/offers/offers.module.ts (e arquivos relacionados como offers.service.ts, offer.entity.ts, create-offer.dto.ts)
/src/bookings/bookings.module.ts (e arquivos relacionados como bookings.service.ts, create-booking.dto.ts, booking.entity.ts)
/src/notifications/notifications.module.ts (e arquivos relacionados como notifications.service.ts, notification.entity.ts)
/src/pricing/pricing.module.ts (e arquivos relacionados como pricing.service.ts)
/src/clients/clients.module.ts (e arquivos relacionados como clients.service.ts)
/src/users/users.module.ts (e arquivos relacionados como users.service.ts, user.entity.ts)
Arquivos de configuração e telemetria (ex: src/config/configuration.ts, src/instrument.ts para Sentry/logs).
2. Referrals Simples (Dupla Recompensa)
Frontend:

/components/referrals/ReferralBanner.tsx
/components/referrals/ReferralSheet.tsx
/app/(client)/explore/index.tsx
Backend:

/src/referrals/referrals.module.ts (e arquivos relacionados como referrals.service.ts, referral.entity.ts, create-referral.dto.ts)
/src/coupons/coupons.module.ts (e arquivos relacionados como coupons.service.ts)
/src/loyalty/loyalty.module.ts (e arquivos relacionados como loyalty.service.ts, loyalty.entity.ts, add-points.dto.ts)
/src/bookings/bookings.module.ts (e arquivos relacionados como bookings.service.ts)
/src/missions/missions.module.ts (e arquivos relacionados como missions.service.ts)
/src/notifications/notifications.module.ts (e arquivos relacionados como notifications.service.ts)
/src/auth/auth.module.ts (e arquivos relacionados)
/src/users/users.module.ts (e arquivos relacionados)
Arquivos de telemetria.
3. Missions "Starter"
Frontend:

/app/(provider)/missions/index.tsx
/app/types/backend/missions.ts
Backend:

/src/missions/missions.module.ts (e arquivos relacionados como missions.service.ts, mission.entity.ts, mission-progress.entity.ts, mission-event.entity.ts)
/src/coupons/coupons.module.ts (e arquivos relacionados como coupons.service.ts)
/src/loyalty/loyalty.module.ts (e arquivos relacionados como loyalty.service.ts)
/src/bookings/bookings.module.ts (e arquivos relacionados como bookings.service.ts)
/src/reviews/reviews.module.ts (e arquivos relacionados como reviews.service.ts)
/src/notifications/notifications.module.ts (e arquivos relacionados como notifications.service.ts)
Arquivos de telemetria.
4. Ranking com Boosts Leves
Frontend:

/app/(client)/explore/index.tsx
/components/client/explore/home/PrestadorCard.tsx
/components/client/explore/home/RecomendacaoCard.tsx
/app/(client)/explore/[providerId].tsx
/app/types/backend/providers.ts
Backend:

/src/ranking/ranking.module.ts (e arquivos relacionados como ranking.service.ts, ranking.controller.ts, provider-ranking.dto.ts)
/src/providers/providers.module.ts (e arquivos relacionados como providers.service.ts, provider.entity.ts)
/src/bookings/bookings.module.ts (e arquivos relacionados como bookings.service.ts)
/src/chat/chat.module.ts (e arquivos relacionados como chat.service.ts, message.entity.ts)
/src/reviews/reviews.module.ts (e arquivos relacionados como reviews.service.ts)
/src/search/search.module.ts (e arquivos relacionados como search.service.ts, search-query.dto.ts)
5. Safety + Support Operante
Frontend:

/components/client/explore/home/FAB_SOS.tsx
/app/(common)/safety/panic.tsx
/app/(common)/help.tsx
/app/(common)/_layout.tsx
/app/types/backend/notifications.ts
Backend:

/src/safety/safety.module.ts (e arquivos relacionados como safety.controller.ts, safety.service.ts, incident.entity.ts, panic-alert.entity.ts, report-incident.dto.ts, report-panic.dto.ts)
/src/support/support.module.ts (e arquivos relacionados como support.controller.ts, support.service.ts, support-ticket.entity.ts, support-message.entity.ts, create-support-ticket.dto.ts, add-support-message.dto.ts)
/src/queues/queues.module.ts (e arquivos relacionados como queues.service.ts, escalations.job.ts)
/src/notifications/notifications.module.ts (e arquivos relacionados como notifications.service.ts)
/src/users/users.module.ts (e arquivos relacionados)
/src/bookings/bookings.module.ts (e arquivos relacionados)
/src/common/services/email.service.ts
/src/sms/sms.service.ts
6. Pricing Estável + Search
Frontend:

/app/(client)/schedule-service.tsx
/app/(client)/explore/index.tsx
/app/(client)/explore/[providerId].tsx
/app/types/backend/services.ts
Backend:

/src/pricing/pricing.module.ts (e arquivos relacionados como pricing.controller.ts, pricing.service.ts, pricing-rule.entity.ts, calculate-price.dto.ts, create-pricing-rule.dto.ts)
/src/search/search.module.ts (e arquivos relacionados como search.controller.ts, search.service.ts, search-query.dto.ts)
/src/provider-services/provider-services.module.ts (e arquivos relacionados como provider-services.service.ts, provider-service.entity.ts)
/src/services/services.module.ts (e arquivos relacionados como services.service.ts, service.entity.ts)
/src/bookings/bookings.module.ts (e arquivos relacionados como bookings.service.ts)
/src/coupons/coupons.module.ts (e arquivos relacionados como coupons.service.ts)
/src/offers/offers.module.ts (e arquivos relacionados como offers.service.ts)
/src/cache/cache.module.ts (e arquivos relacionados como cache.service.ts)
/src/config/config.module.ts (e arquivos relacionados como configuration.ts, validation-schema.ts)a

README — Lógica de Negócio do LimpeJá (MVP)

Documento de referência para engenharia e produto. Foca nas regras de negócio em produção e nos cálculos que governam agendamentos, pagamentos, cupons, missões, fidelidade, ranking e suporte. Parâmetros numéricos são configuráveis e versionados via ConfigService/BD (tabela app_config).

0) Objetivos & Guard‑rails

Metas: (i) aumentar pedidos/usuário (F), (ii) reduzir CAC, (iii) reduzir churn, (iv) elevar NPS.

Economia da promoção:

Take rate atual: 15% (parâmetro de negócio). Ticket médio alvo: R$ 300.

Margem bruta por booking (MG) ≈ 0,15 × ticket ⇒ R$ 45.

Regra de segurança de subsídio: CI ≤ MG × p, onde CI = custo do incentivo por usuário e p = probabilidade de recompra induzida. Ex.: p = 0,6 ⇒ CI ≤ R$ 27.

Subsídio progressivo: desconto maior na 1ª/2ª compra, decrescendo conforme o LTV cobre a aquisição.

Orquestração & Idempotência:

Toda emissão/consumo de cupom, conversão de referral, mudança de status de booking e eventos de missão passam por Redis Lock curto + Idempotency-Key.

Fila (BullMQ) com DLQ para reprocesso de falhas em emissão de cupons/missões e webhooks de pagamento.

1) Autenticação, Usuários & Indicação
1.1 Registro (cliente e provedor)

Validação de CPF, telefone e CEP no onboarding (ViaCEP). Fluxo de redefinição de senha integrado ao backend.

1.2 Referral (código de indicação)

Campo opcional referralCode no registro.

Conversão: quando o indicado conclui a 1ª reserva, o indicador ganha (config):

Opção A: +pontos (ex.: +300 pts), ou

Opção B: cupom específico do indicador (ex.: R$ 20; expira em 14d).

Anti‑fraude mínimo: bloqueio por chaves de identidade (CPF/PIX/telefone/endereço), device fingerprint, IP/geo similares; cap 5 convites válidos/mês.

2) Catálogo & Provedores
2.1 Serviços & Preços

Provedor define serviços/categorias, preço fixo ou por hora, raio de atendimento e disponibilidade semanal.

2.2 Métricas de performance do provedor

acceptanceRate (aceitação) e averageResponseTime (tempo médio de resposta) são calculadas e expostas em perfil/dashboard. Usadas no ranking e descoberta.

3) Busca & Ranking
3.1 Objetivo

Maximizar match qualidade/tempo/custo priorizando distância, reputação e desempenho.

3.2 Sinais do score (cliente → lista de provedores)

rating_norm, share5stars, recency_norm (recentes), distance_norm, acceptanceRate, avgResponseTime_norm + boosts de gamificação.

3.3 Fórmula (parametrizável)
score = 0.35·rating_norm
      + 0.20·share5stars
      + 0.15·recency_norm
      + 0.15·(1 - distance_norm)
      + 0.10·acceptanceRate
      + 0.05·(1/avgResponseTime_norm)
      + boosts_gamificacao

Pesos mantidos em configuração. distance_norm ∈ [0,1] por raio; recency_norm pondera reservas recentes. boosts_gamificacao aplica bônus temporários (badges/missões concluídas) — ver §7.

4) Bookings (Reservas)
4.1 Estados & Máquina

REQUESTED → CONFIRMED → IN_PROGRESS → COMPLETED | CANCELLED.

Locks de concorrência no createBooking para impedir double‑book de slots.

4.2 Regras-chave

Chat só habilita se existir booking ativo/confirmado entre cliente↔provedor.

Aplicação de cupom/oferta ocorre no createBooking: resolve código → valida elegibilidade → grava couponId e discountAmount no BookingDetails.

Ao concluir (COMPLETED): usageCount++ do cupom e disparam eventos (missões, referral, cupom de retorno).

5) Pricing & Pagamentos
5.1 PIX & Saques

createPixCharge(clientUserId, data) → retorna brCode, qrCodeImage, expiresAt.

requestWithdrawal() no app do provedor; Earnings consolidam ganhos, com histórico e resumo.

5.2 Estados de pagamento

PaymentIntent + PaymentIntentStatus e trilha de PaymentEvent (webhooks) para reconciliação.

6) Cupons & Ofertas
6.1 Alvos (targets)

NEW_CUSTOMER, REFERRAL_REFERRED, REFERRAL_REFERRER, MISSION_REWARD, REPEAT_CUSTOMER.

6.2 Elegibilidade & Regras

firstBookingOnly=true: só permite se completed_bookings = 0.

Caps (config):

Aquisição: min(30%, R$50)

Retenção: min(20%, R$40)

Stacking: não acumulável; aplica o maior valor absoluto.

Rate‑limit: ≤ 1 cupom de aquisição + 1 de retorno/30d + 1 de missão/30d por usuário.

Expiração: default 7–14 dias; lembretes T‑72h/T‑24h.

6.3 Endpoint de resolução

GET /coupons/resolve/:code → devolve couponId, value, valueType, maxDiscount, expiresAt, target, firstBookingOnly, eligibility.

6.4 Emissão automática

Pós‑booking (ativação): cupom de retorno 7 dias.

Missão concluída: emite cupom de recompensa.

Referral: emite cupom p/ indicado; cupom ou pontos p/ indicador.

7) Fidelidade & Gamificação
7.1 Pontos (clientes)

Base: pontos_base = floor(α × valor_liquido_cliente); default α = 0,5 pt/R$.

Multiplicadores:

Tier: Bronze 1.0×, Prata 1.1×, Ouro 1.25×, Platina 1.5×

Streak semanal: m_streak = 1 + 0,05 × min(weeks_consec, 6) (máx. +30%)

Review recente (≥4★/≤4 semanas): +10%

Fórmula: pontos = floor(pontos_base × m_tier × m_streak × m_review)

Expiração: pontos expiram em 180 dias sem uso (notificação pró‑ativa).

7.2 Tiers (rolling 90 dias)

Bronze < 600; Prata ≥ 600; Ouro ≥ 1.500; Platina ≥ 3.000 (configurável).

7.3 Resgate (pontos → cupom)

Tabela (config): 1.000 → R$10; 2.500 → R$30; 5.000 → R$70.

redeemPoints(userId, pts) emite cupom amarrado ao usuário.

7.4 Missões (clientes e provedores)

Tipos:

COUNT_EVENT (p.ex. 3 reservas/mês),

STREAK_DAYS (3 semanas seguidas com 1 reserva),

WITHIN_WINDOW (avaliar serviço em 48h). Gatilhos: booking_completed, first_booking_completed, review_submitted, e (provedor) booking_accepted, chat_response_time_met, rating_maintained. Recompensas: cupom ou pontos; para provedor, destaque no ranking por 72h ou redução de taxa 1x.

7.5 Boosts no Ranking (provedor)

Badge “Top do Bairro”: +β (ex.: 0,05) por 72h.

Missão “10 no mês”: +γ (ex.: 0,03) enquanto ativa/concluída.

SLA chat ≥90% em ≤5min: +δ (ex.: 0,02).

8) Chat & Notificações (revisado)
8.1 Chat — Política de habilitação e uso

Visibilidade: o entrypoint do chat fica sempre visível (detalhe do booking / perfil do provedor).

Envio (gating): o input só habilita quando

booking.paymentStatus ∈ {CONFIRMED, AUTHORIZED} ou booking.status ∈ {CONFIRMED, IN_PROGRESS}.

Após COMPLETED, permanece habilitado por 48h (CHAT_ALLOWED_AFTER_COMPLETION_HOURS) para pós-atendimento/re-agendamento.

Em REQUESTED/PENDING sem pagamento confirmado: input desabilitado + CTA “Finalize o pagamento para conversar”.

Disputa aberta (DISPUTE_OPEN): mensagens intermediadas pelo Suporte; links/anexos bloqueados.

Anti-spam: 10 msgs / 10 min / usuário, com backoff progressivo.

8.2 Moderação anti-desintermediação (server-side)

Bloquear troca de contato direto (telefone, e-mail, redes sociais, links) no gateway do chat antes de persistir/emitir.

Detecta e bloqueia:

Telefones BR/intl (ex.: (?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?\d{4,5}[-.\s]?\d{4}).

E-mails (RFC simplificado, ex.: \b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b).

URLs e encurtadores (http(s)://, www., bit.ly, lnkd.in, t.me, wa.me, fb.me, instagr.am).

Palavras-chave/redes (instagram, linkedin, facebook, tiktok, whatsapp, telegram, zap) e menções @usuario.

Ação: rejeitar com CHAT_E_CONTACT_INFO + aviso “Por segurança, não é permitido compartilhar contatos”.

Escalonamento (3 strikes):

bloqueia + aviso; 2) mute 1h; 3) mute 24h + abre ticket Support/Safety.

Anexos: só após CONFIRMED, apenas image/*, até 5MB; bloquear vCards/QRs/arquivos com metadados de contato.

Auditoria: salvar mensagem sanitizada + motivo (não guardar conteúdo sensível em claro).

8.3 Notificações (push/in-app)

Enviar apenas para mensagens aceitas pela moderação.

Gatilhos: emissão/expiração de cupom (T-72h/T-24h), missão (progresso/claim), referral convertido.

Infra: BullMQ + DLQ; eventos de telemetria chat_message_blocked / chat_message_sent.

8.4 Config (feature flags)
CHAT_ENABLED = true
CHAT_MIN_BOOKING_STATUS = CONFIRMED
CHAT_ALLOWED_AFTER_COMPLETION_HOURS = 48
CHAT_PROHIBITED_PATTERNS = [regex...]
CHAT_ATTACHMENT_ALLOWED_AFTER_CONFIRMED = true
CHAT_RATE_LIMIT = "10/10min"
CHAT_STRIKES_WINDOW_DAYS = 30

Tarefas rápidas de backend (para isso funcionar)

ChatGateway/Service: interceptar sendMessage → rodar validadores; lançar CHAT_E_CONTACT_INFO; não persistir payload recusado.

Message model: campos sanitizedBody, blockedReason?, blockedAt?.

ConfigService: carregar CHAT_* do BD/env.

Support hook: ao 3º strike, SupportService.createTicket(userId, bookingId, reason='DISINTERMEDIATION_ATTEMPT').

Rate-limit: limiter por booking+usuário (Redis).

Tests: casos com telefones/links/“arroba” e números espaçados, e anexos.

9) Suporte & SLA
9.1 Tickets de suporte

Estados: OPEN → IN_PROGRESS → AWAITING_USER → RESOLVED | ESCALATED | CLOSED.

SLA por prioridade (padrão): Urgente ≤4h, Alta ≤8h, Média ≤24h, Baixa ≤48h.

Auditoria completa: logs de estado e carimbo de tempo; painel para time de suporte.

9.2 Safety (pânico/incidentes)

Botão de pânico, fluxo de incidente e auditoria; integração com suporte (SLA dedicado) e trilhas de atividades.

10) LGPD & Compliance

KYC: OCR de documento + selfie com prova de vida + checagem de antecedentes.

Trilhas de auditoria de consentimento e acesso a dados.

Retention policy + relatórios de portabilidade.

11) Telemetria & Observabilidade
11.1 Eventos (chaves)

Cupons: coupon_viewed, coupon_copied, coupon_applied, coupon_redeemed.

Missões: mission_started, mission_progress_updated, mission_completed, mission_claimed.

Referral: referral_created, referral_converted.

Fidelidade: loyalty_points_earned, loyalty_points_redeemed.

Bookings: booking_created, booking_confirmed, booking_completed, booking_cancelled.

Pagamentos: payment_intent_created/confirmed/failed, pix_charge_created, withdrawal_requested.

11.2 Dashboards & Alertas (semana 1)

VTR do Card de Boas‑Vindas = redeemed / viewed.

2ª compra em 7 dias pós‑cupom de retorno.

Churn 30d por coorte adquirida vs. controle.

Conversão de referral (cadastro → 1ª compra).

Uso de missões (start → claim).

12) Modelagem (Prisma — campos essenciais)

Coupons: id, code, target, valueType('PERCENT'|'FIXED'), value, maxDiscount, firstBookingOnly, issuedToUserId, issuedBy, expiresAt, usageCount, usageLimit, status.

Missions/MissionProgress: mission(id, kind, audience, goal, windowDays, rewardType('COUPON'|'POINTS'), rewardValue, activeFrom, activeTo); progress(id, missionId, userId, current, status, lastEventAt).

Loyalty: ledger(id, userId, points, type, meta, createdAt); user_tier(userId, tier, points90d, updatedAt).

Referrals: code(id, userId, code, createdAt, disabledAt?); conversion(id, referrerId, referredId, bookingId?, status, reason?).

Bookings: id, clientId, providerId, status, scheduledAt, address, couponId?, discountAmount?, totalPrice, createdAt.

Payments: paymentIntent(id, bookingId, status, amount, method, metadata), paymentEvent, transaction.

13) Endpoints/Integrações (alto nível)

Bookings: POST /bookings (aplica cupom), PATCH /bookings/:id/status, GET /bookings.

Coupons/Offers: GET /offers, GET /coupons/resolve/:code, POST /coupons/issue (mission/referral/retorno).

Missions: GET /missions, POST /missions/:id/claim, POST /missions/track (eventos).

Loyalty: POST /loyalty/add, POST /loyalty/redeem (gera cupom), GET /loyalty/tier.

Referrals: POST /referrals/generate, POST /referrals/convert (em 1ª compra do indicado).

Payments: POST /payments/pix/charge, POST /payments/withdrawal.

Search/Ranking: GET /providers/search (lat/lon/radius + sinais de score).

Support: POST /support/tickets, PATCH /support/tickets/:id/state (SLA), GET /support/tickets.

14) Sequência de Entrega (produção — semana atual)

CouponsModule: firstBookingOnly robusto; emissão retorno/referral/mission; resolver /:code com elegibilidade; telemetria coupon_*.

MissionsModule: trackEvent (booking/review/provedor), claim → issueCoupon/addPoints.

LoyaltyModule: multiplicadores + tiers (rolling 90d); redeemPoints → cupom; job de expiração (180d).

ReferralsModule: gerar código; conversão em 1ª reserva; anti‑fraude mínimo.

Bookings: locks + gravação de couponId/discountAmount; eventos *_completed.

Payments: PIX + saques; reconciliação por PaymentEvent.

Ranking: aplicar boosts de gamificação.

Notifications: lembretes de cupom (T‑72h/T‑24h), missões prontas para claim.

Support/Safety: SLA enforce + pânico/incidentes.

15) Observações finais

Parâmetros (pesos, caps, prazos) são feature‑flagáveis. Mantenha scripts de migração/seed dos valores defaults.

Todo endpoint sensível (cupom/claim/referral/withdrawal) deve validar idempotência e autorização.

LGPD: registrar consentimentos e acessos; priorizar transparência e opt‑out simples