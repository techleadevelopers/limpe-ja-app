Missions Module — README

Este documento explica como funciona o módulo de Missões no backend (NestJS + Prisma), quais entidades ele usa, como os eventos são rastreados, como o progresso é calculado, como ocorre o resgate de recompensas (cupom/pontos) e onde integrar (Bookings, Reviews, Referrals, etc.).

Visão geral

O módulo de Missões permite criar objetivos gamificados (ex.: “concluir 1º serviço”, “3 serviços em 30 dias”, “fazer 1 review”) que, ao serem atingidos, geram recompensas para o usuário (cliente), como cupons ou pontos de fidelidade.

Fluxo resumido

Evento acontece (ex.: booking.completed, review.created, referral.converted).

MissionsService.trackEvent(userId, eventName, meta?) grava o evento e recalcula o progresso de todas as missões que escutam esse evento.

Quando a missão atingir o target, o status passa para COMPLETED.

O usuário chama claimMission (via endpoint) → o módulo emite cupom (via CouponsService) ou credita pontos (via LoyaltyService) e marca a missão como CLAIMED.

Modelos (Prisma)
Enums

MissionAudience: CLIENT | PROVIDER (hoje usamos CLIENT)

MissionKind: COUNT_EVENT | STREAK_DAYS | WITHIN_WINDOW

RewardType: COUPON | POINTS

MissionStatus: ACTIVE | COMPLETED | CLAIMED

Tabelas
Mission

code (único), title, description

audience (CLIENT/PROVIDER — hoje CLIENT)

kind (regra de contagem)

eventName (ex.: booking.completed, review.created, referral.converted)

targetValue (ex.: 1, 3, 10)

timeWindowDays? (opcional para janelas, ex.: 30)

rewardType (COUPON | POINTS)

rewardValue (percentual para cupom ou pontos inteiros)

couponTemplateId? (reserva para integração futura)

isActive

MissionProgress

Chave única (userId, missionId)

currentValue, status (ACTIVE | COMPLETED | CLAIMED)

lastEventAt?, completedAt?, claimedAt?

MissionEvent

userId, name (string do evento)

meta (JSON opcional)

createdAt

Serviços principais
MissionsService
trackEvent(userId: string, name: string, meta?: any)

O que faz: grava um MissionEvent e recalcula o progresso para todas as missões ativas com eventName = name e audience = CLIENT.

Cálculo de progresso por kind:

COUNT_EVENT

Sem janela: incrementa currentValue em +1.

Com janela (timeWindowDays): recalc via COUNT de eventos no período.

WITHIN_WINDOW

Sempre recalc via COUNT de eventos dentro da janela (se não houver, conta desde o início).

STREAK_DAYS

Conta dias únicos com evento dentro da janela (simplificado).

Atualiza MissionProgress:

currentValue, lastEventAt

status = COMPLETED se currentValue >= targetValue (e seta completedAt)

caso contrário, status = ACTIVE

Importante: este método é idempotente para os modos de janela (WITHIN_WINDOW, COUNT_EVENT com timeWindowDays), porque recalcula via contagem. Para COUNT_EVENT sem janela, o incremento é +1 por evento disparado.

getMyMissions(userId: string)

Retorna as missões ativas (Mission.isActive = true, audience = CLIENT) com o snapshot do progresso do usuário:

currentValue, targetValue, status, percent (0–100), completedAt, claimedAt

canClaim = (status === COMPLETED)

claimMission(userId: string, missionId: string)

Validações:

Existe MissionProgress para (userId, missionId)?

status === COMPLETED e ainda não claimedAt?

Recompensa (de acordo com Mission.rewardType):

COUPON → chama CouponsService.issueCouponFromMission(...) e retorna o cupom criado.

POINTS → LoyaltyService.addPoints({ userId, points: mission.rewardValue, type: 'MISSION_COMPLETED', referenceId: mission.id }).

Marca MissionProgress.status = CLAIMED e claimedAt = now.

Retorna: { mission, reward }

Integrações (origem dos eventos)

Você deve disparar trackEvent nos momentos certos:

Bookings

Essencial: quando o status muda para COMPLETED → booking.completed

Local: src/bookings/bookings.service.ts dentro de updateStatus(...) após concluir.

Também é onde você já faz a lógica de loyalty e cupom usado.

Reviews

Após criar uma avaliação → review.created

Local: src/reviews/reviews.service.ts após this.prisma.review.create(...).

Referrals

Quando o indicado conclui o primeiro booking → referral.converted (evento contado para o indicador)

Local: src/referrals/referrals.service.ts

Helper sugerido: handleBookingCompletedForReferral(referredUserId, bookingId).

Esses disparos conectam os eventos do negócio às missões. Sem eles, o progresso não evolui.

Recompensas
Cupom (via CouponsService)

Método: issueCouponFromMission({ userId, mission, validityDays? })

Padrões:

valueType = 'PERCENT'

value = rewardValue / 100 (20% ⇒ 0.20)

target = 'GENERAL' (modelo atual não vincula cupom a usuário; se quiser exclusivo, ver Roadmap abaixo)

maxUses = 1

validade padrão: 30 dias

código: MIS-<MISSION_CODE>-<RANDOM>

Pontos (via LoyaltyService)

Método: addPoints({ userId, points, type: 'MISSION_COMPLETED', referenceId: mission.id })

Endpoints públicos (API)

Os nomes podem variar conforme seu MissionsController. Estes são os mais comuns:

GET /missions/my

Retorna a lista das missões ativas + progresso do usuário logado

Requer autenticação (JWT). Role: CLIENT

POST /missions/claim

Body: { missionId: string }

Se a missão estiver COMPLETED e não CLAIMED, emite recompensa e marca como CLAIMED

Requer autenticação (JWT). Role: CLIENT

Dependências e Módulos

MissionsModule exporta MissionsService

Módulos que devem importar MissionsModule (via forwardRef quando houver ciclo):

BookingsModule

ReviewsModule

ReferralsModule

MissionsService depende de:

PrismaService

CouponsService (cupom como recompensa)

LoyaltyService (pontos como recompensa)

As importações típicas:

// src/missions/missions.module.ts (exemplo)
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => CouponsModule),
    forwardRef(() => LoyaltyModule),
  ],
  providers: [MissionsService],
  exports: [MissionsService],
})
export class MissionsModule {}


E em módulos que usam as missões:

// src/bookings/bookings.module.ts
imports: [
  // ...
  forwardRef(() => MissionsModule),
  // ...
]

// src/reviews/reviews.module.ts
imports: [
  // ...
  forwardRef(() => MissionsModule),
  // ...
]

// src/referrals/referrals.module.ts
imports: [
  // ...
  forwardRef(() => MissionsModule),
  // ...
]

Conjunto de missões sugeridas (seed)

Você pode criar um seed inicial na tabela Mission:

FIRST_SERVICE

kind = COUNT_EVENT

eventName = 'booking.completed'

targetValue = 1

rewardType = COUPON

rewardValue = 20 (→ 20%)

THREE_BOOKINGS_30D

kind = COUNT_EVENT

eventName = 'booking.completed'

targetValue = 3

timeWindowDays = 30

rewardType = POINTS

rewardValue = 100

FIRST_REVIEW

kind = COUNT_EVENT

eventName = 'review.created'

targetValue = 1

rewardType = POINTS

rewardValue = 50

REFERRAL_CONVERTED

kind = COUNT_EVENT

eventName = 'referral.converted'

targetValue = 1

rewardType = COUPON

rewardValue = 30 (→ 30%)

Observação: STREAK_DAYS está implementado de forma simples (dias únicos com evento na janela). Ajuste conforme sua regra de negócio.

Mensagens e erros comuns

trackEvent: não lança erro — grava evento e recalcula progresso.

claimMission:

404 Not Found: progresso não encontrado para (userId, missionId)

400 Bad Request: missão não está COMPLETED ou já foi CLAIMED

Emissão de cupom:

Gera cupom individual (1 uso), percent, validade padrão 30 dias.

Crédito de pontos:

Usa LoyaltyService.addPoints com type = 'MISSION_COMPLETED'.

Boas práticas de integração

Bookings

Dispare trackEvent(userId, 'booking.completed', { bookingId }) após a transição válida para COMPLETED.

Reviews

Dispare trackEvent(userId, 'review.created', { reviewId, bookingId }) após create.

Referrals

No helper de conversão, após detectar que foi o 1º booking concluído do indicado:

Dispare trackEvent(referrerUserId, 'referral.converted', { referredUserId, bookingId }).

Essa ordem garante que missões não avancem indevidamente.

Testes (checklist)

COUNT_EVENT sem janela

Dispare N eventos ⇒ currentValue soma N.

COUNT_EVENT com janela

Insira eventos fora/ dentro da janela ⇒ recálculo confere.

WITHIN_WINDOW

Varia timestamps e garanta que a contagem corresponda à janela.

STREAK_DAYS

Eventos em dias diferentes ⇒ currentValue = dias únicos.

Claim

Somente quando COMPLETED e não CLAIMED.

COUPON ⇒ cupom criado com 1 uso, percent, validade 30 dias.

POINTS ⇒ pontos creditados.

Idempotência

Repetir trackEvent não deve “quebrar” o progresso em missões com janela.

Permissões

Endpoints protegidos com JWT e role CLIENT.

Roadmap (opcional)

Cupons por usuário: adicionar SPECIFIC_USER em Coupon.target OU criar tabela CouponAssignment (couponId, userId) para vincular explicitamente o cupom ao usuário que resgatou.

Missoes para Providers: permitir audience = PROVIDER.

Regra de STREAK mais robusta: validação de dias consecutivos com “buracos” tolerados, etc.

UI/UX: badges, animações, banners de conclusão, toasts de progresso.

Anexos úteis

Endpoints Cliente (frontend):

GET /missions/my — listar missões e progresso

POST /missions/claim { missionId } — resgatar recompensa

(Opcional) GET /coupons/my — listar cupons ativos

Eventos suportados (hoje):

booking.completed

review.created

referral.converted

(Fácil adicionar novos: bastar criar missões usando um novo eventName e disparar trackEvent.)

Se quiser, posso te gerar um seed SQL/TS com os exemplos de missões acima e/ou um MissionsController enxuto com os dois endpoints citados.