Referrals Module

Módulo responsável por registro de indicações de usuários (quem indica → quem foi indicado), consulta e integrações com Loyalty (pontos) e Missões (via trackEvent).

Objetivos de negócio

Permitir que um usuário indique outro usuário para usar o app.

Garantir unicidade de relação (mesmo par indicador–indicado não se repete).

Atribuir pontos de fidelidade ao indicador (modelo básico) e viabilizar missões (ex.: “Indique um amigo”).

Preparar o fluxo para conversão de indicação (quando o indicado conclui o primeiro serviço).

Principais componentes
1) Modelo (Prisma)
model Referral {
  id             String   @id @default(uuid())
  referredUserId String   @unique
  referredUser   User     @relation("ReferredByUser", fields: [referredUserId], references: [id])
  referrerUserId String
  referrerUser   User     @relation("ReferrerOfUser", fields: [referrerUserId], references: [id])
  referralCode   String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([referredUserId, referrerUserId])
}


Regras importantes:

referredUserId é único: um usuário só pode ser indicado uma vez.

Par (referredUserId, referrerUserId) também é único: evita duplicidades do mesmo par.

2) DTO

CreateReferralDto (anexado):

referredUserId: string (UUID) — usuário indicado

referrerUserId: string (UUID) — usuário indicador

referralCode?: string — código opcional usado na indicação

3) Service

ReferralsService (anexado, com logs e validações):

createReferral(dto: CreateReferralDto): Promise<Referral>

Regras:

Não permite autoindicação (referredUserId === referrerUserId → 400).

Verifica existência de ambos os usuários.

Garante unicidade (confere se já existe o vínculo).

Ações:

Cria a indicação.

Loyalty: credita pontos para o indicador (ex.: +50 pontos) com LoyaltyTransactionType.REFERRAL.

(Opcional/futuro) Emite evento de missão (referral.created) se desejar pontuar a “indicação enviada” como missão.

findReferralsByReferrer(referrerUserId: string): Promise<Referral[]>

Lista todas as indicações feitas por um usuário.

findOne(id: string): Promise<Referral | null>

Busca uma indicação pelo id.

⚠️ Observação: O fluxo ideal de pontos de indicação é no momento da conversão (quando o indicado conclui o primeiro booking). O service atual demonstra os pontos ao criar a indicação; você pode mover/duplicar a regra para a conversão (ver seção Integrações).

4) Controller

ReferralsController (anexado):

POST /referrals – cria a indicação. Requer payload CreateReferralDto.

GET /referrals/:id – detalhe de uma indicação.

GET /referrals/me (ou equivalente, conforme seu guard/role) – lista as indicações feitas pelo usuário logado.

(As anotações de guards/roles podem variar conforme seu projeto; as versões anexadas costumam usar JwtAuthGuard/RolesGuard.)

5) Module

ReferralsModule (anexado):

Imports: PrismaModule, LoyaltyModule.

Providers: ReferralsService.

Exports: ReferralsService (para outros módulos injetarem — p.ex. BookingsService na conversão).

Sem forwardRef salvo necessidade específica de circularidade; o arquivo anexado já está pronto.

Integrações
A) Loyalty

Quando uma indicação é criada:

LoyaltyService.addPoints({ userId: referrerUserId, points: 50, type: LoyaltyTransactionType.REFERRAL, referenceId: referral.id })

Ajuste o valor/estratégia conforme a sua política de pontos.
O cenário recomendado é premiar na conversão (ver abaixo).

B) Missões (Missions)

Eventos sugeridos:

referral.created – quando o indicador cadastra uma indicação (use se existir missão do tipo “envie X convites”).

referral.converted – quando o indicado conclui o primeiro booking.
Esse é o melhor ponto para recompensas (pontos/cupom) ao indicador em termos de ROI.

Como emitir o evento de conversão:

No BookingsService.updateStatus(), quando um booking do usuário indicado mudar para COMPLETED e for o primeiro completed desse usuário:

Verifique se ele tem registro em Referral como referredUserId.

Se for o primeiro COMPLETED, emita:

await missionsService.trackEvent(referrerUserId, 'referral.converted', { referredUserId, bookingId });


Opcional: dar pontos/cupom ao referrerUserId aqui (ou deixar para uma missão com claim).

Se ainda não implementou o helper handleBookingCompletedForReferral, crie-o no ReferralsService para centralizar essa validação (contagem de bookings concluídos do indicado e emissão do evento).

Regras de negócio recomendadas

Não permitir autoindicação.

Um indicado só pode ter um indicador.

Pontos:

Criação da indicação → opcional (baixa intenção).

Conversão (1º COMPLETED) → recomendado (alta intenção).

Missões:

COUNT_EVENT de referral.converted com targetValue=1 (ou 3 indicações em 30 dias via WITHIN_WINDOW com timeWindowDays=30).

claim → gera cupom ou pontos conforme Mission.rewardType.

Exemplos de uso
1) Criar indicação

Request

POST /referrals
Authorization: Bearer <token>
Content-Type: application/json

{
  "referredUserId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "referrerUserId": "f0e9d8c7-b6a5-4321-0987-fedcba987654",
  "referralCode": "LIMPEJA123"
}


Responses

201 – objeto Referral

400 – autoindicação / payload inválido

404 – usuário indicado/indicador não existe

409 – indicação duplicada

2) Listar minhas indicações (indicador)

Request

GET /referrals/me
Authorization: Bearer <token>


Response

[
  {
    "id": "…",
    "referredUserId": "…",
    "referrerUserId": "…",
    "referralCode": "LIMPEJA123",
    "createdAt": "…",
    "updatedAt": "…",
    "referredUser": { "id": "…", "email": "amigo@ex.com" }
  }
]

Erros & Mensagens

BadRequestException:

“Um usuário não pode indicar a si mesmo.”

“Dados inválidos.”

ConflictException:

“Esta indicação já foi registrada.”

NotFoundException:

“Usuário indicado/indicador não encontrado.”

Segurança

Endpoints protegidos por JwtAuthGuard.

RolesGuard pode restringir quem pode criar (geralmente CLIENT) e listar (o próprio usuário).

Não expor dados sensíveis do usuário indicado ao indicador além do necessário (e-mails/ids básicos já estão na versão anexada).

Boas práticas & próximos passos

Conversão de Indicação
Implementar no BookingsService:

Detectar primeiro booking COMPLETED do referredUser.

Chamar ReferralsService.handleBookingCompletedForReferral(referredUserId, bookingId).

Dentro do helper:

Emitir missionsService.trackEvent(referrerUserId, 'referral.converted', { referredUserId, bookingId }).

(Opcional) Creditar pontos/cupom direto.

Restrições contra fraude

Bloquear indicação cruzada, e-mails temporários, etc.

Relatórios

Quantos convites viram conversões.

LTV/ROI por canal/código.

Cupom de indicação

Criar cupom para o indicado (ex.: “10% no primeiro serviço”) no momento do cadastro da indicação.

Checklist de Integração

 ReferralsModule importa PrismaModule e LoyaltyModule, exporta ReferralsService.

 ReferralsService.createReferral com validações e LoyaltyService.addPoints.

 DTO CreateReferralDto.

 Endpoints básicos no ReferralsController.

 (Missões) Emissão de referral.converted no 1º booking COMPLETED do indicado.

 (Opcional) Emissão de referral.created na criação do vínculo.

Qualquer ajuste de regras (p.ex. mover pontos para a conversão, emitir eventos adicionais ou gerar cupom para indicado) me fala e eu já deixo o README e o código coerentes com a nova política.