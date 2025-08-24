9.3) Disputas (Mediação) — Lógica de Sucesso
Objetivo

Resolver conflitos rápido, justo e auditável, preservando confiança e margem:

TTR (tempo-até-resolução) alvo: ≤ 72h

Chargeback evitado, preferência por reembolso PIX (quando aplicável) ou crédito/cupom.

Payout do provedor em hold até decisão final.

A) Quando abrir disputa

Durante o serviço (IN_PROGRESS) ou até 48h após COMPLETED.

Quem pode abrir: cliente ou provedor (com motivos distintos).

Bloqueios:

Sem disputa duplicada para o mesmo bookingId.

Se chargeback já aberto, disputa interna vira somente mediação (sem execução financeira automática).

B) Estados (state machine)

OPENED → WAITING_PROVIDER → NEGOTIATION → MEDIATION → DECISION_PENDING → RESOLVED_* → CLOSED

OPENED: cria caso e coloca payout em HOLD se ainda não liquidado.

WAITING_PROVIDER (T=24h): provedor responde (proposta/evidências).

NEGOTIATION (T=24h): troca de propostas entre as partes.

MEDIATION (T=24–48h): moderador do marketplace decide.

DECISION_PENDING: executa refund/ajuste/novo agendamento.

RESOLVED_FULL_REFUND | RESOLVED_PARTIAL_REFUND | RESOLVED_REDO | RESOLVED_REJECTED.

CLOSED: encerra, aplica sanções (se houver) e libera/estorna fundos.

Timeouts automáticos: a cada SLA expirado, auto-escalonar para o próximo estado.
Idempotência: toda transição exige disputeVersion + Idempotency-Key.

C) Evidências aceitas

Cliente: fotos “antes/depois”, checklist não cumprido, logs de chat, geolocalização/chegada, faturas de danos (se houver).

Provedor: fotos do resultado, checklist assinado/aprovado no app, logs de chat/chegadas.

Restrições: arquivos até 5MB, somente imagem/pdf; sanitização anti-contato (mesmas regras do chat).

D) Classificação do motivo (taxonomia)

NO_SHOW (prestador não compareceu)

LATE (atraso > X min)

QUALITY (serviço mal executado / checklist incompleto)

DAMAGE (dano material)

MISCONDUCT (conduta inadequada)

OTHER

E) Cálculo objetivo de solução

Parâmetros configuráveis no ConfigService.

1) Tabelas base (por motivo)
Motivo	Ação padrão	Base % do valor	Cap R$
NO_SHOW	Reembolso integral	100%	—
LATE	Parcial + cupom “boa-fé”	20%	40
QUALITY	Parcial	30–60% (score)	120
DAMAGE	Escala p/ seguro	—	—
MISCONDUCT	Integral + sanção provedor	100%	—
2) “QUALITY” com score objetivo

Calcular quality_score ∈ [0,1] a partir de evidências:

quality_score = 0.5·(1 - checklist_coverage) 
              + 0.3·photo_mismatch 
              + 0.2·nps_flag


checklist_coverage: % tarefas marcadas como concluídas e aceitas (0…1)

photo_mismatch: classificador simples (0/1) por divergência antes/depois

nps_flag: 1 se NPS ≤ 6 na última interação

Reembolso:

refund_pct = 0.3 + 0.6·quality_score     // 30% a 90%
refund_amt = min(refund_pct × total_pago, CAP_QUALITY_R$)

3) “LATE”
refund_pct = min( atraso_min / 120 , 0.20 )   // até 20%
refund_amt = min(refund_pct × total_pago, CAP_LATE_R$)


Além do reembolso parcial, emitir cupom (ex.: R$ 20, 14 dias).

F) Execução financeira

Antes de payout: abater do HOLD e liberar saldo remanescente ao provedor.

Após payout: criar saldo negativo do provedor para compensação nos próximos pagamentos; se PIX devolução suportado pelo PSP, usar fluxo de devolução; se não, crédito/cupom para o cliente.

Cupom de boa-fé: opcional, quando reembolso for < 100% (mantém satisfação sem zerar margem).

G) Efeitos colaterais (reputação & ranking)

NO_SHOW/MISCONDUCT: redução de ranking_boost, bloqueio temporário de aceite, badge negativo interno; auditoria de reincidência.

QUALITY/LATE recorrentes: penalidade progressiva no ranking (ex.: −δ por 14 dias).

Clientes com alta taxa de disputas: colocar em watchlist (score de risco).

H) Notificações & SLAs

Abertura: push + in-app para ambas as partes (T0).

Lembretes: T+12h e T+22h para cada SLA de resposta.

Decisão: push + resumo da decisão + próximos passos (reagendar/reembolso/crédito).

Telemetria: dispute_opened, dispute_auto_escalated, dispute_decided, dispute_refund_executed.

I) API (alto nível)

POST /disputes { bookingId, reason, description, evidence[] }

POST /disputes/:id/messages { text | evidence }

POST /disputes/:id/settlement/propose { action, percent?, amount?, coupon? }

POST /disputes/:id/escalate

POST /disputes/:id/resolve { outcome, refundPercent|refundAmount?, coupon?, redoAt? }

GET /disputes/:id (inclui linha do tempo e SLAs)

Idempotência: cada ação recebe Idempotency-Key; transições checam currentState e disputeVersion.

J) Modelagem (Prisma — campos mínimos)

dispute
id, bookingId, openerUserId, state, reason, openedAt, escalatedAt?, decidedAt?, closedAt?, holdPayout:boolean

dispute_message
id, disputeId, authorId, sanitizedBody, blockedReason?, createdAt

dispute_evidence
id, disputeId, byUserId, type('PHOTO'|'PDF'), url, createdAt

dispute_decision
id, disputeId, outcome('FULL_REFUND'|'PARTIAL_REFUND'|'REDO'|'REJECTED'), refundPercent?, refundAmount?, couponId?, redoAt?, decidedByUserId, decidedAt

dispute_sla_log
id, disputeId, kind('WAITING_PROVIDER'|'NEGOTIATION'|'MEDIATION'), dueAt, notifiedAt?, escalatedAt?

K) Pseudocódigo de decisão
function decide(dispute: Dispute, booking: Booking): Decision {
  if (dispute.reason === 'NO_SHOW') return fullRefund();

  if (dispute.reason === 'MISCONDUCT') return fullRefundWithPenalty();

  if (dispute.reason === 'LATE') {
    const pct = Math.min(dispute.delayMin / 120, CONFIG.LATE_MAX_PCT); // até 20%
    return partialRefund(pct, CONFIG.CAP_LATE_RS).withGoodwillCoupon(CONFIG.GOODWILL_COUPON_RS);
  }

  if (dispute.reason === 'QUALITY') {
    const score = 0.5*(1 - checklistCoverage(dispute)) 
                + 0.3*photoMismatch(dispute)
                + 0.2*npsFlag(dispute, booking.clientId);
    const pct = 0.3 + 0.6*score; // 30%..90%
    return partialRefundCapped(pct, CONFIG.CAP_QUALITY_RS);
  }

  return rejectWithCoupon(CONFIG.GOODWILL_COUPON_RS);
}

L) QA (casos críticos)

Duplicidade de disputa para o mesmo bookingId.

Timeouts automáticos (24h/24h/48h) com escalonamento.

Reembolso antes/pois de payout; PIX devolução ok/falha.

Evidência maliciosa (arquivo inválido, link/telefone/arroba no texto do chat de disputa).

Idempotência de transições e retriable jobs (DLQ).



README — Módulo de Disputas (Backend LimpeJá)

Objetivo: Documentar a versão lógica real de produção do módulo de Disputas (Mediação) com base nos arquivos presentes (dispute.controller.ts, dispute.module.ts, dispute.service.ts, create-dispute.dto.ts, update-dispute.dto.ts) e nos fluxos de negócio consolidados do LimpeJá. Este README serve para engenharia, produto e suporte.

1) Escopo e responsabilidades

Receber, processar e resolver disputas entre cliente e prestador relacionadas a um booking.

Orquestrar SLA/Timers, hold/liberação de payout, reembolsos/cupom, reagendamento e sanções.

Assegurar idempotência, auditoria e compliance (anti-desintermediação, LGPD, trilhas).

Fora de escopo: abertura de chargeback no PSP (quando houver chargeback, a disputa interna torna-se mediação informativa).

2) Arquitetura (NestJS)

Controller: DisputeController — expõe a API REST.

Service: DisputeService — regras de negócio, state machine, integração financeira.

Module: DisputeModule — providers, imports (Bookings, Payments, Coupons, Notifications, Support, Cache/Redis, BullMQ), guards.

DTOs: CreateDisputeDto, UpdateDisputeDto (+ dtos internos: AddMessageDto, ProposeSettlementDto, ResolveDisputeDto).

Entidades: Dispute, DisputeMessage, DisputeEvidence, DisputeDecision, DisputeSlaLog.

3) Máquina de estados

Estados e transições determinísticas com efeitos colaterais explícitos:

OPENED → WAITING_PROVIDER → NEGOTIATION → MEDIATION → DECISION_PENDING →
  RESOLVED_FULL_REFUND | RESOLVED_PARTIAL_REFUND | RESOLVED_REDO | RESOLVED_REJECTED → CLOSED

Regra de criação:

Ao criar (OPENED):

Se payout do booking ainda não liquidado ⇒ aplicar HOLD (travamento de repasse).

Se já liquidado ⇒ marcar saldo negativo do prestador para compensação (próximo payout) ou preparar PIX devolução ao cliente.

SLAs/Timers (BullMQ) — automações de avanço:

WAITING_PROVIDER: 24h para resposta do prestador.

NEGOTIATION: 24h para contrapropostas.

MEDIATION: 24–48h para decisão do moderador.

Vencido o prazo ⇒ auto-escalar para o próximo estado.

Idempotência & concorrência:

Toda transição usa Idempotency-Key e verifica disputeVersion (optimistic lock).

Locks curtos em Redis no par (disputeId, action).

4) Endpoints (REST)
Método	Rota	Auth	Descrição
POST	/disputes	CLIENT/PROVIDER	Abrir disputa de um booking (motivo, descrição, evidências).
GET	/disputes/:id	OWNER/ADMIN	Detalhar disputa (linha do tempo, mensagens, SLAs).
POST	/disputes/:id/messages	OWNER/ADMIN	Adicionar mensagem/evidência (com moderação anti-contato).
POST	/disputes/:id/settlement/propose	OWNER/ADMIN	Propor acordo (percentual/valor, cupom, reagendamento).
POST	/disputes/:id/escalate	OWNER/ADMIN	Escalonar para mediação do marketplace.
POST	/disputes/:id/resolve	ADMIN	Decidir disputa (refund, parcial, redo, rejeitado).

Erros comuns: DISPUTE_DUPLICATE, BOOKING_INELIGIBLE, INVALID_STATE, SLA_EXPIRED, NOT_OWNER, CONTACT_INFO_BLOCKED, ATTACHMENT_NOT_ALLOWED.

5) DTOs & validações
5.1 CreateDisputeDto
class CreateDisputeDto {
  @IsUUID() bookingId: string;
  @IsEnum(['NO_SHOW','LATE','QUALITY','DAMAGE','MISCONDUCT','OTHER']) reason: string;
  @IsString() @MaxLength(2000) description: string;
  @IsArray() @ArrayMaxSize(6) @IsUrl({}, { each: true }) evidenceUrls?: string[]; // S3/GCS
}
5.2 UpdateDisputeDto
class UpdateDisputeDto {
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsEnum(['OPENED','WAITING_PROVIDER','NEGOTIATION','MEDIATION','DECISION_PENDING','RESOLVED_FULL_REFUND','RESOLVED_PARTIAL_REFUND','RESOLVED_REDO','RESOLVED_REJECTED','CLOSED']) state?: string;
}
5.3 Auxiliares
class AddMessageDto { @IsString() @MaxLength(2000) text: string; @IsArray() @ArrayMaxSize(3) evidenceUrls?: string[] }
class ProposeSettlementDto { @IsOptional() @IsNumber() refundPercent?; @IsOptional() @IsNumber() refundAmount?; @IsOptional() @IsString() couponCode?; @IsOptional() @IsDateString() redoAt?; }
class ResolveDisputeDto { @IsEnum(['FULL_REFUND','PARTIAL_REFUND','REDO','REJECTED']) outcome: string; @IsOptional() @IsNumber() refundPercent?; @IsOptional() @IsNumber() refundAmount?; @IsOptional() @IsString() couponCode?; @IsOptional() @IsDateString() redoAt?; }

Pipes/Guards: anti‑contato (regex para telefone/e‑mail/URL/redes) no AddMessageDto.text; limite de anexos; OnlyBookingPartiesGuard.

6) Service (API interna)

Assinaturas típicas — pontos de integração em cada operação.

open(userId: string, dto: CreateDisputeDto): Promise<Dispute>
addMessage(userId: string, disputeId: string, dto: AddMessageDto): Promise<DisputeMessage>
proposeSettlement(userId: string, disputeId: string, dto: ProposeSettlementDto): Promise<void>
escalate(adminId: string, disputeId: string): Promise<void>
resolve(adminId: string, disputeId: string, dto: ResolveDisputeDto): Promise<DisputeDecision>
getById(userId: string, id: string): Promise<DisputeWithTimeline>

Efeitos por operação

open: cria disputa, HOLD payout (se não liquidado), agenda WAITING_PROVIDER SLA, notifica partes.

addMessage: sanitiza texto (anti‑contato), persiste mensagem, notifica contraparte.

proposeSettlement: registra proposta, alterna para NEGOTIATION se aplicável, notifica contraparte.

escalate: força MEDIATION, abre Support Ticket interno para time de mediação.

resolve: aplica cálculo (refund parcial/integral, cupom, redo), executa efeito financeiro e finaliza estados.

7) Lógica de decisão (resumo)

NO_SHOW: reembolso integral; sanção de ranking/provedor.

LATE: refund até 20% (cap R$40) + cupom boa‑fé.

QUALITY: refund 30%–90% conforme quality_score (checklist, fotos, NPS), cap R$120.

MISCONDUCT: reembolso integral + sanções.

OTHER: decisão do moderador; default cupom boa‑fé quando cabível.

Sempre preferir devolução de PIX; se impossível, crédito/cupom.

8) Integrações

Bookings: leitura de status/horário; marca hold/liberação de payout; gatilhos para fechar chat, reagendar.

Payments: consulta/execução de reembolso; saldo negativo do provedor quando necessário.

Coupons: emissão de cupom de boa‑fé (cliente) e cupom/isenção parcial (provedor, quando política permitir).

Support: criação de ticket em MEDIATION e no 3º strike de anti‑contato.

Notifications: pushes de abertura, lembretes de SLA, decisão final.

Chat: canal de conversa com moderação (sem telefone/e‑mail/links/redes sociais).

9) Segurança & Compliance

Anti‑desintermediação: bloqueio de números/links/emails/menções; anexos somente image/* ≤ 5MB; vCard/QR bloqueados.

LGPD: armazenar somente mensagem sanitizada e metadados de bloqueio; evidências em storage seguro (GCS/S3) com URL expirada.

RBAC: OWNER = cliente ou provedor do booking; ADMIN = mediação interna.

10) Telemetria & Alertas

Eventos: dispute_opened, dispute_waiting_provider_timeout, dispute_negotiation_timeout, dispute_escalated, dispute_decided, dispute_refund_executed, dispute_closed, chat_message_blocked.

KPIs: TTR (≤72h), % resolução sem admin, % reembolso parcial/integral, taxa de reincidência por provedor/cliente, disputas por 100 bookings.

11) Modelagem (Prisma)
model Dispute {
  id           String   @id @default(uuid())
  bookingId    String   @unique
  openerUserId String
  reason       String
  state        String   // OPENED..CLOSED
  openedAt     DateTime @default(now())
  escalatedAt  DateTime?
  decidedAt    DateTime?
  closedAt     DateTime?
  holdPayout   Boolean  @default(true)
  messages     DisputeMessage[]
  evidences    DisputeEvidence[]
  decision     DisputeDecision?
  slaLogs      DisputeSlaLog[]
  @@index([state])
}


model DisputeMessage {
  id            String   @id @default(uuid())
  disputeId     String
  authorId      String
  sanitizedBody String
  blockedReason String?
  createdAt     DateTime @default(now())
}


model DisputeEvidence {
  id        String   @id @default(uuid())
  disputeId String
  byUserId  String
  type      String   // PHOTO|PDF
  url       String
  createdAt DateTime @default(now())
}


model DisputeDecision {
  id            String   @id @default(uuid())
  disputeId     String   @unique
  outcome       String   // FULL_REFUND|PARTIAL_REFUND|REDO|REJECTED
  refundPercent Float?
  refundAmount  Int?
  couponId      String?
  redoAt        DateTime?
  decidedBy     String
  decidedAt     DateTime @default(now())
}


model DisputeSlaLog {
  id        String   @id @default(uuid())
  disputeId String
  kind      String   // WAITING_PROVIDER|NEGOTIATION|MEDIATION
  dueAt     DateTime
  notifiedAt DateTime?
  escalatedAt DateTime?
}
12) Sequências principais
12.1 Abrir disputa

POST /disputes → valida elegibilidade (janela ≤48h após COMPLETED ou durante IN_PROGRESS) → cria OPENED → aplica HOLD no payout → agenda SLA → notifica partes.

12.2 Proposta/negociação

POST /disputes/:id/settlement/propose → registra proposta → muda p/ NEGOTIATION → notifica contraparte.

12.3 Mediação/decisão

POST /disputes/:id/escalate → entra em MEDIATION → abre ticket de suporte interno.

POST /disputes/:id/resolve → calcula refund/redireciona cupom/reagendamento → executa financeiro → RESOLVED_* → CLOSED.

13) QA — Casos críticos

Disputa duplicada para o mesmo booking.

Timeouts automáticos e avanço de estado.

Refund antes/depois de payout; falha do PSP (devolução PIX).

Mensagem bloqueada por telefone/link/arroba; tentativa com número espaçado.

Evidência inválida (tipo/tamanho) e expiração de URL.

Idempotência (reenvio de resolve/propose).

14) Feature flags e config

DISPUTE_ENABLED=true

DISPUTE_WAITING_PROVIDER_HOURS=24

DISPUTE_NEGOTIATION_HOURS=24

DISPUTE_MEDIATION_HOURS=48

DISPUTE_OPEN_WINDOW_HOURS=48 (após COMPLETED)

DISPUTE_LATE_MAX_PCT=0.20, DISPUTE_LATE_CAP_RS=40

DISPUTE_QUALITY_CAP_RS=120

GOODWILL_COUPON_RS=20

15) Observações finais

Toda ação sensível usa Idempotency-Key e checagem de estado atual.

Logs e trilhas devem permitir reconstruir a linha do tempo completa.

Integrações financeiras e de cupom devem ser transacionais (commit/rollback atômico por booking).