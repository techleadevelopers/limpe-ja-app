Reviews Module — README

Este documento descreve o módulo de Avaliações (Reviews) da plataforma: responsabilidades, modelos de dados, regras de negócio, eventos (integração com Missões), API pública, permissões, fluxos principais e orientações de testes.

Objetivo

Permitir que clientes avaliem serviços concluídos, alimentar métricas de qualidade de prestadores, gerar pontos de fidelidade, acionar missões/recompensas, e fornecer insumos para ranking e insights.

Arquitetura & Dependências

ReviewsController
Exponde endpoints REST para criar e consultar avaliações.

ReviewsService
Contém a lógica de negócio: validações, criação, métricas e integrações.

PrismaService
Persistência (ORM).

BookingsService (leitura)
Validação de vínculo/estado do agendamento avaliado.

ProvidersService (leitura/escrita)
Atualização de badges/indicadores do prestador após novas reviews.

LoyaltyService
Créditos de pontos por avaliações (primeira e subsequentes).

MissionsService (opcional / quando integrado)
Emissão de eventos de missão (review.created).

Módulos importados pelo ReviewsModule (conforme sua base):
PrismaModule, BookingsModule, ClientsModule, ProvidersModule, ProviderServicesModule, LoyaltyModule.

Modelo de Dados (resumo)

Tabela Review (Prisma):

id (PK)

bookingId (unique) — avaliação 1:1 com agendamento

clientId

providerId

rating (Int)

comment (String?)

createdAt / updatedAt

Índices e unicidades importantes:

@@unique([bookingId, clientId, providerId]) — evita avaliações duplicadas/mismatch.

bookingId único — um booking só pode ter uma avaliação.

Relacionamentos relevantes:

Review → Booking (agendamento avaliado)

Review → Client (autor)

Review → Provider (avaliado)

Regras de Negócio
1) Elegibilidade para avaliar

Apenas cliente do booking pode avaliar.

O booking deve estar COMPLETED (concluído).

Não pode existir review prévia para o mesmo booking.

2) Pontuação (Loyalty)

Primeira avaliação do cliente → +20 pontos (LoyaltyTransactionType.FIRST_REVIEW).

Avaliações subsequentes → +5 pontos (LoyaltyTransactionType.REVIEW_SUBMITTED).

Esses valores são configuráveis no serviço; ajuste conforme sua política.

3) Eventos de Missão (opcional)

Ao criar uma avaliação, o módulo pode disparar o evento:

review.created → consumido pelo MissionsService para atualizar progresso de missões.

Se o evento for crucial para o seu negócio, garanta a injeção/operação do MissionsService ou componha via filas/worker.

4) Indicadores do Provedor

Após cada review, o serviço chama ProvidersService.updateProviderBadges(providerId) para recalcular/atualizar:

Badges (ex.: Top Rated, Rápido em respostas, etc.).

Contadores como fiveStarReviewCount, médias, e outras métricas internas.

5) Métricas & Insights

ReviewsService oferece utilitários para dashboards:

getDetailedRatingBreakdown(providerId):

Média geral (overall)

Dimensões simuladas (pontualidade, qualidade, comunicação, value)

Tendência recente (últimos 30d vs 30d anteriores): improving|declining|stable

satisfactionRate (% de notas ≥ 4)

responseTime (simulado; use caso tenha SLO real)

generateSmartSuggestions(providerId):

Sugestões baseadas em rating, volume e serviços do provedor:

Pricing (ajuste de preço)

Availability (ampliar horários)

Service improvement (foco em qualidade)

Marketing (explorar avaliações altas)

Os cálculos de dimensões além do overall estão simulados como placeholder; integre dados reais conforme precisar.

Endpoints
POST /reviews

Criar avaliação

Body (SubmitReviewDto):

{
  "bookingId": "uuid-do-agendamento",
  "rating": 5,
  "comment": "Excelente serviço!"
}


Regras:

Autenticado (JwtAuthGuard).

Autor deve ser o cliente do booking.

Booking precisa estar COMPLETED.

Única review por booking.

Efeitos colaterais:

Cria Review.

Credita pontos de loyalty (20 se 1ª review do cliente; senão 5).

Dispara review.created (se integrado ao Missions).

Atualiza badges/indicadores do provedor.

Responses:

201 → Review criada.

400 → Booking não está COMPLETED / payload inválido.

403 → Usuário não é o cliente do booking.

409 → Review já existe para este booking.

404 → Booking inexistente.

GET /reviews

Listar avaliações (filtros opcionais via GetReviewsDto)

Query params (opcionais):

providerId

clientId

minRating

maxRating

Retorna as últimas N (padrão 10; adapte se precisar) com includes úteis para UI:

client.user.avatarUrl (quando necessário)

provider.user.fullName

booking.providerService.service (nome do serviço)

GET /reviews/:id

Buscar uma avaliação específica (com includes básicos)

GET /reviews/:providerId/breakdown

(Se exposto) Retorna DetailedRatingBreakdown para um provedor.

GET /reviews/:providerId/suggestions

(Se exposto) Retorna SmartSuggestion[] para um provedor.

Permissões & Guards

Endpoints de criação exigem JWT válido.

A criação garante que somente o cliente do booking avaliado possa postar.

Leituras em geral são públicas/semipúblicas (conforme sua política); mantenha o JwtAuthGuard se necessário.

Integrações
Missões (MissionsService)

Evento: review.created

Quando o cliente envia review, chamamos missionsService.trackEvent(userId, 'review.created', { bookingId, providerId, rating }).

Missões típicas:

“Avalie um serviço” → alvo 1 no período.

“Avalie 5 serviços no mês” → alvo 5 com timeWindowDays = 30.

Fidelidade (LoyaltyService)

addPoints({ userId, points, type, referenceId })

Transações registradas em LoyaltyTransaction para auditoria.

Provedores (ProvidersService)

updateProviderBadges(providerId) após cada review para refletir conquistas.

Fluxos Principais
Fluxo: Cliente envia avaliação

Valida: booking existe, pertence ao cliente, e está COMPLETED.

Garante unicidade: não existe review para bookingId.

Cria Review.

Pontua: chama LoyaltyService.addPoints (20 ou 5).

Evento Missão: dispara review.created (se ativo).

Badges: atualiza provider badges/indicadores.

Fluxo: Listagem para UI do provedor

findRecentReviewsByProviderId(providerId) → últimas 5 com nome/face do cliente (avatar).

getDetailedRatingBreakdown(providerId) → KPIs para card “reputação”.

(Opcional) generateSmartSuggestions(providerId) → dicas acionáveis.

Erros e Mensagens Comuns

NotFoundException("Agendamento... não encontrado")

ForbiddenException("Você não tem permissão...")

BadRequestException("A avaliação só pode ser enviada para agendamentos concluídos.")

ConflictException("Agendamento já possui uma avaliação.")

Mantenha logs no ReviewsService (Logger) para auditoria.

Testes (checklist)

Unitários

submitReview():

Reprova se booking não é do cliente

Reprova se status != COMPLETED

Reprova se já existe review

Cria review com rating/comentário corretos

1ª review → +20 pontos; subsequentes → +5

Dispara review.created (se Missions estiver mockado/injetado)

Chama providersService.updateProviderBadges

getDetailedRatingBreakdown():

Sem reviews → zeros e stable

Com reviews → média correta e satisfactionRate coerente

generateSmartSuggestions():

Sugestões coerentes vs. entradas (ex.: média baixa → improvement)

E2E

Criar booking, finalizar (COMPLETED), autenticar cliente e POST /reviews

GETs devem refletir review recém-criada

Verificar side-effects: loyalty, missão (se habilitada), badges

Observações de Implementação

Dimensões de rating (pontualidade, etc.) estão simuladas.
Se precisar granularidade real, adicione os campos no DTO/DB e ajuste o cálculo.

O limite da listagem (10) e as regras de pontos são parametrizáveis.

Integração com Missions fica atrás de injeção padrão; caso o serviço não esteja presente, trate a chamada como opcional (ou via fila).

Exemplos (cURL)

Criar avaliação:

curl -X POST https://api.sua-base.com/reviews \
 -H "Authorization: Bearer <JWT>" \
 -H "Content-Type: application/json" \
 -d '{
   "bookingId": "b6f1b3a2-...",
   "rating": 5,
   "comment": "Excelente!"
 }'


Listar por provedor:

curl "https://api.sua-base.com/reviews?providerId=prov-123&minRating=4"

Roadmap / Melhorias Futuras

Campos de rating granulares (ex.: punctuality, quality, communication, value) persistidos no DB.

Sistema de moderação de reviews (denúncia, ocultar, contestar).

Badges dinâmicos configuráveis via painel admin.

Integração com RankingModule para impacto direto da reputação no ranqueamento.

Suporte a media (fotos/vídeos) na review.