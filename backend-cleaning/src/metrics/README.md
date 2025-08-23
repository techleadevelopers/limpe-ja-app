3) Novo módulo metrics/ (dashboard do cliente)

Objetivo: expor métricas pessoais e funnel do cliente no app (não confundir com “observabilidade”).
Escopo mínimo (API REST):

src/metrics/
  metrics.module.ts
  metrics.controller.ts
  metrics.service.ts
  dto/
    customer-metrics.query.dto.ts   // período, timezone, agrupamento (dia/semana/mês)
  repositories/
    bookings.metrics.repo.ts        // queries agregadas Prisma
    payments.metrics.repo.ts
    reviews.metrics.repo.ts
  policies/
    privacy.policy.ts               // filtros LGPD por usuário
  __tests__/...

Endpoints (cliente autenticado)

GET /v1/metrics/me/summary?from=&to=

total_bookings, completed, canceled, avg_rating, total_spent_centavos, repeat_rate

GET /v1/metrics/me/timeseries?metric=bookings|spent&granularity=day|week|month&from=&to=

GET /v1/metrics/me/funnel

search → view_provider → start_checkout → payment_initiated → paid → completed

GET /v1/metrics/me/reviews?from=&to=&limit=

Agregações (Prisma exemplo)

Bookings por status/data, gasto total (somar payments.captured_amount), média de rating (reviews).

Cuidado com timezone do cliente (converter para UTC internamente e apresentar no tz do usuário).

Segurança/LGPD

Só retornar dados do próprio usuário (userId do JWT).

Retenção: manter agregados sem PII onde possível.

Exportável em CSV (endpoint opcional GET /v1/metrics/me/export)