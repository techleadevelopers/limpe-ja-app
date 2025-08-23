
## JA FORAM INTEGRADOS DE FORMA COMPLETA NO FRONT E NO BACK 


1. Adicionar Geolocalização Precisa para Busca de Provedores Próximos
Backend:

src/providers/providers.controller.ts
src/providers/providers.service.ts
src/search/search.controller.ts
src/search/search.service.ts
src/search/search-query.dto.ts
src/prisma/prisma.service.ts
src/geocoding/geocoding.service.ts
src/common/dto/create-address.dto.ts
Frontend:

LimpeJaApp/app/(client)/explore/index.tsx
LimpeJaApp/app/(client)/explore/[providerId].tsx
LimpeJaApp/app/services/clientService.ts
LimpeJaApp/app/types/backend/search.ts
LimpeJaApp/app/types/backend/clients.ts
2. Criar Lógica de Promoções e Descontos Especiais por Provedor
Backend:

src/providers/providers.service.ts
src/coupons/coupons.controller.ts
src/coupons/coupons.service.ts
src/coupons/coupon.entity.ts
src/offers/offers.controller.ts
src/offers/offers.service.ts
src/offers/offer.entity.ts
src/pricing/pricing.service.ts
src/bookings/bookings.service.ts
Frontend:

LimpeJaApp/app/(client)/explore/[providerId].tsx
LimpeJaApp/app/(client)/schedule-service.tsx
LimpeJaApp/app/services/clientService.ts
LimpeJaApp/app/types/backend/bookings.ts
3. Expandir Missões e Gamificação para Aumentar Engajamento dos Prestadores
Backend:

src/missions/missions.service.ts
src/missions/missions.controller.ts
src/missions/mission.entity.ts
src/providers/providers.service.ts
src/loyalty/loyalty.service.ts
src/coupons/coupons.service.ts
src/notifications/notifications.service.ts
Frontend:

LimpeJaApp/app/(provider)/dashboard/index.tsx
LimpeJaApp/app/(provider)/profile/index.tsx
LimpeJaApp/app/(provider)/missions/index.tsx (Possível novo arquivo)
Componentes de UI reutilizáveis (para exibir status da missão, progresso e recompensas)
4. Conectar Métricas de Performance (ex: Taxa de Aceitação, Tempo Médio de Resposta)
Backend:

src/providers/providers.service.ts
src/providers/provider.entity.ts
src/providers/provider-details.dto.ts
src/bookings/bookings.service.ts
src/chat/chat.service.ts
src/dashboard/dashboard.service.ts
src/dashboard/dashboard.dto.ts
src/prisma/prisma.service.ts
Frontend:

LimpeJaApp/app/(provider)/dashboard/index.tsx
LimpeJaApp/app/(client)/explore/[providerId].tsx
Novos componentes de UI (para visualização de métricas como gráficos, indicadores de progresso)