Ranking Module — README
Visão geral

O módulo Ranking calcula e expõe o ranking de prestadores (Providers) para fins de listagem, destaque e busca.
Ele consolida sinais como avaliações, volume/recência de agendamentos concluídos, taxa de 5⭐, responsividade e (se disponível) proximidade geográfica para ordenar resultados.

Objetivo: entregar uma ordenação justa e transparente, priorizando qualidade, confiabilidade e atividade recente.

Principais componentes

ranking.module.ts
Declara o módulo, importa dependências (PrismaModule, etc.) e exporta o RankingService.

ranking.service.ts
Motor de ranking.

Consulta dados no Prisma (Providers, Reviews, Bookings).

Normaliza sinais.

Aplica fórmula de score com pesos configuráveis.

Aplica filtros (serviço, cidade, distância) e paginação.

Pode usar cache (in-memory/Redis) para respostas quentes.

ranking.controller.ts
Endpoints REST:

GET /ranking/providers — lista ranqueada com filtros e paginação.

GET /ranking/top — atalho para top N.

POST /ranking/rebuild — força rebuild/invalidação de cache (ADMIN).

provider-ranking.dto.ts
DTO de saída para itens ranqueados (shape de resposta do provider no ranking).

Dependências de dados (Prisma)

O serviço lê das tabelas já existentes:

Provider
Campos relevantes:

id, fullName, userId

bookings (para contagem de concluídos recentes)

reviewsReceived (média e distribuição de notas)

monthlyBookingsCount (sinal de atividade)

fiveStarReviewCount (sinal de excelência)

address (para cidade/geo, se disponível)

providerServices (para filtrar por serviceId)

Review
Para média de rating, total de reviews, taxa de 5 estrelas.

Booking
Para concluídos no período (ex.: últimos 90 dias) e consistência/atividade.

Se latitude/longitude estiverem disponíveis no Address, o módulo pode calcular distância (Haversine) para nearby.

Fórmula de scoring (padrão)

A pontuação consolidada usa uma combinação ponderada dos sinais.
Pesos padrão (ajustáveis via RankingService):

Qualidade (rating médio) — wRating = 0.45

Atividade (bookings concluídos 90d) — wRecentBookings = 0.25

Excelência (taxa de 5⭐) — wFiveStar = 0.15

Recência de review (decay) — wRecency = 0.10

Proximidade (se “nearby”) — wDistance = 0.05 (inverso: mais perto, maior score)

Score final (0..1):

score = clamp01(
  wRating        * normalizeRating(avgRating) +
  wRecentBookings* normalizeCount(completed90d) +
  wFiveStar      * normalizeRatio(fiveStarRate) +
  wRecency       * recencyBoost(lastReviewAt) +
  wDistance      * distanceBoost(km)  // se aplicável
)

Normalizações

normalizeRating(r) → mapeia [3..5] para [0..1], com clamp

normalizeCount(c) → c / max(10, p95) (p95 da amostra), clamp 1

normalizeRatio(x) → já está em [0..1]

recencyBoost(dt) → decai ao longo de 90 dias; recente ≈ 1, antigo → ~0.3

distanceBoost(km) → se houver lat/lng; <= 3km ≈ 1, 3–10km ~0.7, 10–25km ~0.4, >25km ~0.2

Dica: se a base for esparsa, o serviço usa defaults conservadores (ex.: providers novos não ficam zerados; recebem um bootstrapping leve).

Filtros e paginação
Query params suportados

GET /ranking/providers

serviceId?: string — filtra por serviço oferecido

city?: string — filtra por cidade

nearbyLat?: number / nearbyLng?: number — ativa boost por proximidade (opcional)

radiusKm?: number — distância máxima (opcional; default 25)

sort?: 'score' | 'rating' | 'recent' — ordenação; default score

page?: number — default 1

limit?: number — default 20 (máx. 50)

Resposta
{ items: ProviderRankingDto[], total: number, page: number, limit: number }

ProviderRankingDto (exemplo):

{
  providerId: string;
  name: string;
  avatarUrl?: string;
  city?: string;
  services: { id: string; name: string; priceFrom?: number }[];
  rating: { avg: number; count: number; fiveStarRate: number };
  activity: { completed90d: number; monthlyBookingsCount: number };
  lastReviewAt?: string; // ISO
  distanceKm?: number;
  score: number; // 0..1
  badges?: string[];     // ex.: “Top Rated”, “Muito requisitado”
}

Top N

GET /ranking/top?limit=5&serviceId=...&city=...

Endpoints
1) Listagem ranqueada
GET /ranking/providers?serviceId=...&city=...&nearbyLat=-23.5&nearbyLng=-46.6&radiusKm=12&sort=score&page=1&limit=20
Auth: público (CLIENT/PROVIDER/ANÔNIMO)

2) Top N
GET /ranking/top?limit=5&serviceId=...
Auth: público

3) Rebuild/Invalidate cache
POST /ranking/rebuild
Auth: ADMIN
Body: opcional { hard?: boolean } // hard=true recalcula estats base

Segurança & Rate limiting

Os endpoints de leitura são públicos, mas podem herdar Throttler global (já configurado no app).

O endpoint POST /ranking/rebuild exige role ADMIN (via @Roles(UserRole.ADMIN)).

Caching

L2: opcional Redis (chave composta por filtros).

TTL sugerido: 60–300s.

Invalidações:

Após criação de review relevante.

Após mudanças de disponibilidade grandes.

Job noturno/horário pode executar rebuild leve (médias e p95).

O serviço lida bem sem cache; porém, em produção com tráfego, ative cache.

Integrações
Missões (Missions)

Quando review é criada ou booking é concluído, outros módulos já disparam missionsService.trackEvent(...).

O Ranking não dispara eventos diretamente, mas se beneficia do aumento de qualidade/atividade que o sistema de Missões incentiva.

Loyalty/Cupons

Indireta: reviews/atividades geradas por incentivos (pontos/cupom) impactam sinais do ranking.

Badges (opcional)

O RankingService pode atribuir “badges” a partir de limiares simples:

Top Rated — avgRating >= 4.8 e count >= 20

Muito requisitado — completed90d >= 15

Consistente — fiveStarRate >= 0.6 e count >= 30

Badges são retornadas no DTO e exibidas no app.

Estratégia anti-gaming (resumo)

Ponderação entre qualidade e volume; avaliações isoladas não dominam.

Decay temporal: inércia de reviews antigas é reduzida.

Mínimos estatísticos: alguns boosts exigem limiar de amostragem.

Cap por sinal: evita explosões por outliers.

Exemplos
cURL — listagem
curl "http://localhost:3000/ranking/providers?serviceId=abc123&city=Sao%20Paulo&sort=score&page=1&limit=10"

cURL — top 5 próximos de mim
curl "http://localhost:3000/ranking/top?limit=5&nearbyLat=-23.56&nearbyLng=-46.64&radiusKm=8"

cURL — rebuild (ADMIN)
curl -X POST "http://localhost:3000/ranking/rebuild" \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"hard":true}'

Erros comuns

400 parâmetros inválidos (ex.: limit > 50, lat/lng inválidos).

403 quando POST /ranking/rebuild sem ADMIN.

500 erros internos (ex.: indisponibilidade de banco).

Configuração/Env (opcional)

RANKING_CACHE_TTL=120 (segundos)

RANKING_WINDOW_DAYS=90

Pesos podem ser definidos via config service (se desejar externalizar):

RANKING_W_RATING=0.45

RANKING_W_RECENT=0.25

RANKING_W_FIVESTAR=0.15

RANKING_W_RECENCY=0.10

RANKING_W_DISTANCE=0.05

Testes (checklist)

 Retorna lista ordenada por score com dados mistos

 Filtro serviceId e city funcionando

 Boost de distância quando nearbyLat/nearbyLng presentes

 Páginas, page/limit e total corretos

 top respeita limit

 rebuild invalida cache (ADMIN only)

 Providers sem reviews/booking não quebram (defaults aplicados)

 Cálculo de score está em [0..1] (clamp)

Roadmap

Considerar SLA/No-show no score (quando disponível).

Ajuste dinâmico de pesos por A/B testing.

Cache distribuído (Redis) e pré-computação em job.

Métrica de tempo de resposta (mensagens/aceite rápido).

Personalização por usuário (aprendizado/afinidade) — fase 2.

FAQ rápido

Q: O ranking altera dados do banco?
A: Não, é read-only (com exceção de rebuild que só invalida cache).

Q: Como evitar que um novo provedor com poucas reviews vá para o topo?
A: Pesos + mínimos estatísticos + decay resolvem; novos entram com score moderado.

Q: É obrigatório usar distância?
A: Não. Se nearbyLat/nearbyLng não forem informados, o peso de distância é 0.

Se quiser, eu também escrevo um OPENAPI (Swagger) curto desses endpoints e/ou adiciono os decorators @ApiQuery/@ApiResponse no controller para aparecer tudo bonitinho no Swagger da sua API.