Gamificação “amisinegligente” (backend)
0) Princípios de negócio (guard-rails)

Meta: aumentar pedidos/usuário (F), reduzir CAC e churn.

Custo de incentivo por usuário (CI) sempre ≤ Margem bruta esperada do ciclo (MG) × probabilidade de recompra induzida (p).

Regra: CI ≤ MG × p. Para 15% de take rate e ticket R$300 → MG ≈ R$45; se p ~ 0,6, CI ≤ R$27.

Subsídio progressivo: mais desconto no 1º/2º pedido, decrescendo depois (o LTV paga a conta).

1) Pontos & Tiers (LoyaltyModule)
1.1 Pontos por pedido

Base: pontos_base = floor(α × valor_liquido_cliente)

Recom.: α = 0.5 ponto por R$1 (pedido de R$300 → 150 pontos).

Multiplicadores:

Tier: Bronze 1.0×, Prata 1.1×, Ouro 1.25×, Platina 1.5×

Streak (semanas consecutivas com ≥1 reserva): m_streak = 1 + 0.05 × min(semanas_consec, 6) (máx. +30%)

NPS/Review: +10% se avaliou a última reserva (≥4★) nas últimas 4 semanas.

Fórmula final:
pontos = floor(pontos_base × m_tier × m_streak × m_review)

1.2 Tiers (upgrade/downgrade)

Acúmulo rolling de 90 dias:

Bronze: < 600 pts (default)

Prata: ≥ 600 pts

Ouro: ≥ 1.500 pts

Platina: ≥ 3.000 pts

Decaimento: pontos expiram em 180 dias sem uso (gera notificação de “pontos vencendo”).

1.3 Conversão pontos → cupom

Tabela fixa (configurável): 1.000 pts → R$10; 2.500 pts → R$30; 5.000 pts → R$70.

Regra: redeemPoints(userId, pts) → emite cupom RewardType.COUPON amarrado ao usuário.

Backend: LoyaltyModule.addPoints|redeemPoints, LoyaltyTransactionType.{REFERRAL_CONVERSION, MISSION_COMPLETED, PROFILE_COMPLETION}; CouponsModule.issueCoupon no resgate. 

2) Missões (MissionsModule)
2.1 Tipos & gatilhos

COUNT_EVENT: “3 reservas no mês” → trackEvent(userId, 'booking_completed')

STREAK_DAYS: “3 semanas seguidas com 1 reserva” → consolidado por cron semanal

WITHIN_WINDOW: “Avalie o serviço em até 48h” → trackEvent(userId, 'review_submitted')

Provider:

'booking_accepted', 'chat_response_time_met' (≤ X min), 'rating_maintained' (≥ 4.8★ por 30 dias)

2.2 Recompensas

Cliente: cupom R$XX ou +Y pontos (config por missão).

Provedor: destaque de listagem 72h (flag no RankingModule) ou isenção parcial de taxa em 1 pedido (cupom lado provedor).

2.3 Matemática de progressão

COUNT_EVENT: progresso = min(event_count, meta)

STREAK_DAYS (semanal): progresso = semanas_consec (reseta se semana sem reserva)

WITHIN_WINDOW: progresso = 1 se evento ocorrer no intervalo

Backend: claimMission() emite RewardType.COUPON via CouponsModule.issueCouponFromMission(missionId, userId); eventos vindos de Bookings/Reviews/Chat. 

3) Cupons (CouponsModule)
3.1 Targets & uso

NEW_CUSTOMER, REFERRAL_REFERRED, REFERRAL_REFERRER, MISSION_REWARD, REPEAT_CUSTOMER.

firstBookingOnly=true valida no back: só permite se completed_bookings(userId) = 0.

Retorno (ativação): cupom 7 dias pós-reserva (R$30 ou 20%).

Recorrência: “4 agendamentos no mês → 30% OFF no 5º” (emitido ao completar a missão).

3.2 Caps e regras de margem

Desconto máx.: min(30%, R$50) para aquisição; min(20%, R$40) para retenção normal.

Stacking: não acumulável com outros cupons; preferência a cupom de maior valor absoluto.

Rate-limit por usuário: ≤ 1 cupom de aquisição + 1 de retorno /30d + 1 de missão /30d.

Expiração: default 7–14 dias; notificar a 72h e 24h do vencimento.

3.3 Endpoint de resolução

GET /coupons/resolve/:code → retorna couponId, valor, expiraEm, target, firstBookingOnly, eligibility.

Backend: applyCoupon no BookingsModule grava couponId e discountAmount em BookingDetails; usageCount++ ao completar. 

4) Indicação (ReferralsModule)
4.1 Fluxo de recompensa dupla

Indicado (NEW): recebe cupom REFERRAL_REFERRED (ex.: R$30 ou 20%, firstBookingOnly).

Indicador: ao first_booking_completed(referredUser) →

Opção A: +300 pontos (≈ R$3 de valor)

Opção B: cupom REFERRAL_REFERRER R$20 (expira em 14d).

4.2 Antifraude mínima

Bloquear se: mesmo CPF/PIX/telefone/endereço, mesmo device fingerprint, IP & geolocalização idênticos por 24h; limite 5 convites válidos/mês por usuário.

Score de risco: score = soma(pesos × sinais); se score ≥ T, hold manual.

Backend: handleBookingCompletedForReferral(referredUserId, bookingId) centraliza conversão; gera pontos/cupom. 

5) Ranking & Destaque (efeito na descoberta)
5.1 Boosts de gamificação (provedor)

Badge “Top do Bairro”: +β no score por 72h (β ~ 0.05).

Missão “Atenda 10 no mês”: +γ (γ ~ 0.03) enquanto missão ativa/concluída.

Tempo de resposta (SLA chat) ≥ 90% em ≤ 5 min: +δ (δ ~ 0.02).

5.2 Score total (exemplo)

score = 0.35·rating_norm + 0.2·share5⭐ + 0.15·recency_norm + 0.15·(1 - distance_norm) + 0.1·acceptanceRate + 0.05·(1/avgResponseTime_norm) + boosts_gamificação

Esses campos já são exibidos/previstos (acceptanceRate, averageResponseTime), e o ranking faz parte da descoberta. 

6) Notificações & Telemetria
6.1 Eventos (críticos)

coupon_viewed|copied|applied|redeemed

mission_started|progress_updated|completed|claimed

referral_created|converted

loyalty_points_earned|redeemed

6.2 Push & agendados

Cupom emitido (welcome/retorno/missão/referral)

Cupom expirando (T-72h, T-24h)

Missão progrediu e pronta para resgate

“Seu amigo concluiu a 1ª reserva!”

Backend: NotificationsModule + BullMQ para jobs (emitir/lembrar/expirar); Sentry para exceções e traços. 

🧱 Modelagem (Prisma/campos essenciais)
Coupons

id, code, target, valueType('PERCENT'|'FIXED'), value, maxDiscount, firstBookingOnly:boolean, issuedToUserId?, issuedBy(‘SYSTEM’|‘MISSION’|‘REFERRAL’), expiresAt, usageCount, usageLimit(=1), status('ACTIVE'|'USED'|'EXPIRED')

Missions / MissionProgress

mission(id, kind, audience('CLIENT'|'PROVIDER'), goal, windowDays?, rewardType('COUPON'|'POINTS'), rewardValue, activeFrom, activeTo)

progress(id, missionId, userId, current, status('IN_PROGRESS'|'COMPLETED'|'CLAIMED'), lastEventAt)

Loyalty

ledger(id, userId, points, type, meta, createdAt); user_tier(userId, tier, points90d, updatedAt)

Referrals

code(id, userId, code, createdAt, disabledAt?)

conversion(id, referrerId, referredId, bookingId?, status('PENDING'|'CONVERTED'|'REJECTED'), reason?)

Todos os módulos já têm contrapartes na doc (Coupons/Offers/Missions/Bookings/Reviews/Notifications); acima é o “mínimo comum” para amarrar a engine. 

⚙️ Orquestração & Idempotência

Hooks:

BookingsModule: em COMPLETED → trackEvent('booking_completed'), first_booking_completed? → emitir retorno e referral.

ReviewsModule: em submit → trackEvent('review_submitted').

Locks curtos (Redis) para createBooking, applyCoupon, mission.claim, referral.convert.

Idempotency-Key por evento; DLQ para falhas na emissão de cupom/missão.

📊 KPIs para a semana 1 (produção)

VTR Card de Boas-Vindas = redeemed / viewed

2ª compra em 7 dias (ativação)

% recompra 30d por coorte recém-adquirida

Custo de cupom / usuário vs. MG efetiva

Conversão de referral (cadastro→1ª compra)

Uso de missões (start→claim)

🗺️ Checklist de entrega (backend)

CouponsModule

Targets + firstBookingOnly no applyCoupon; issueReturnCoupon, issueCouponFromMission, issueReferralCoupon; GET /coupons/resolve/:code.

MissionsModule

trackEvent() para todos gatilhos; claimMission() → issueCouponFromMission|addPoints.

LoyaltyModule

addPoints (com multiplicadores), redeemPoints → cupom; cálculo de tiers rolling 90d + jobs de expiração 180d.

ReferralsModule

generateReferralCode, handleBookingCompletedForReferral; antifraude básica (CPF/PIX/telefone/device/IP).

Bookings/Reviews

Emits: booking_completed, first_booking_completed, review_submitted.

Notifications + Telemetry

Pushs (emitido/expira/claim/referral) + logs de eventos (Sentry + data warehouse).