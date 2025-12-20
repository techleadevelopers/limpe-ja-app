# Módulo Admin

O `AdminModule` centraliza tudo o que a equipe de operações precisa para monitorar métricas, gerenciar filas e ajustar configurações críticas do sistema. Ele expõe apenas rotas protegidas com JWT + papel `ADMIN` e compõe-se de três controladores principais com dependências em `PrismaModule`, `QueuesModule` e `SettingsModule`.

## Arquitetura e dependências

- **AdminDashboardController / Service** – consulta o Prisma diretamente (`users`, `providers`, `bookings`) para alimentar o painel com contadores e séries de receita. O `getRevenueTrend` agrupa bookings finalizados por mês, respeitando um intervalo mínimo de 1 e máximo de 24 meses, garantindo buckets contínuos mesmo sem dados.
- **AdminQueuesController → QueuesService** – abre o acesso operacional às filas críticas (`verification`, `notifications`, `disputes`, `data_export`, `subscription-generation`, `emails`, `support-escalations`, `payouts`) para inspeção, listagem e reexecução manual de jobs.
- **AdminSettingsController → SettingsService** – centraliza a leitura/atualização de SLAs de disputas e suporte, configuração de comissão e histórico de auditoria, tudo armazenado em cache Redis com TTL configurável e eventos de auditoria detalhando `before/after` + ator (`actorUserId`).

## Segurança

- Guarda global: `JwtAuthGuard` + `RolesGuard`.
- Decorador `@Roles(UserRole.ADMIN)` em cada controller garante que apenas administradores podem invocar esses endpoints.

## Endpoints expostos

| Rota | Método | Responsabilidade |
| --- | --- | --- |
| `GET /admin/dashboard/metrics` | `getDashboardMetrics()` | Retorna totais: usuários ativos verificados, provedores aprovados, serviços concluídos, receita final e verificações pendentes. |
| `GET /admin/dashboard/revenue-trend?months=X` | `getRevenueTrend(months)` | Série mensal de receita de bookings finalizados. Limita o `months` para 1..24 e normaliza buckets com `Intl.DateTimeFormat('pt-BR')`. |
| `GET /admin/queues/status` | `getAllQueuesStatus()` | Resumo simultâneo de cada fila (contagens e estado pausado). |
| `GET /admin/queues/:queueName/jobs?status=...` | `getJobs(queueName, status)` | Retorna até 50 jobs filtrados por status (`waiting`, `active`, `completed`, `failed`, `delayed`, `paused`, `all`), com dados completos (state, timestamps, falha). |
| `POST /admin/queues/:queueName/jobs/:jobId/retry` | `retryJob(queueName, jobId)` | Reposiciona manualmente um job, aceitando retries em `failed` ou movendo `completed/delayed` de volta para `waiting`. |
| `GET /admin/settings/slas` | `getSlas()` | Recupera SLAs de disputas/support, com fallbacks em variáveis `DISPUTE_SLA_*` e caches Redis TTL padrão 30 dias. |
| `PUT /admin/settings/slas` | `updateSlas(body)` | Valida horas (1..168), persiste no Redis e grava evento de auditoria (`SlaAuditEvent`). |
| `GET /admin/settings/slas/history` | `getSlasHistory(limit, cursor)` | Pagina o histórico em cache (até 500 eventos). |
| `GET /admin/settings/general` | `getGeneral()` | Retorna taxa de comissão (fallback `DEFAULT_COMMISSION_RATE_PERCENT`). |
| `PUT /admin/settings/general` | `updateGeneral(body)` | Insere novo valor 0..100, arredonda para 2 casas e registra `GeneralAuditEvent`. |
| `GET /admin/settings/general/history` | `getGeneralHistory(limit, cursor)` | Históricos paginados do cache. |
| `GET /admin/settings/pricing/history` | `getPricingHistory(limit, cursor)` | Permite auditar ações (`create`, `update`, `delete`) em regras de precificação com até 1000 eventos armazenados. |

## Fluxos e lógica relevantes

- O `AdminDashboardService` faz um `Promise.all` para executar métricas paralelas e calcula `totalRevenue` a partir do `aggregate._sum.totalPrice` garantindo zero quando não houver bookings.
- `getRevenueTrend` formata meses em português para dashboards e acumula rendimento por bucket usando `Map` para preservar ordem cronológica.
- `QueuesService` atua como fachada para todas as filas Bull: adiciona jobs com opções padrões (3 tentativas, backoff exponencial), permite scheduling especial (notificações de lembrete com tradução via `I18nService`) e oferece endpoints para inspeção manual.
- A atualização de SLAs/general settings usa o `CacheService` com chaves prefixadas, validações rígidas e TTL configurável. Historias de auditoria são limitadas (500 registros para SLA/general, 1000 para pricing) para evitar growth descontrolado.

## Auditoria e rastreamento

- Cada atualização de configuração grava `actorUserId`, `before/after` e timestamp para facilitar investigações.
- Logs de nível `warn`/`error` informam falhas no cache ou na manipulação de filas, garantindo visibilidade operacional sem bloquear o fluxo principal.

## Recomendações operacionais

1. Use os endpoints de histórico (`/slas/history`, `/general/history`, `/pricing/history`) antes de reverter manualmente qualquer ajuste.
2. Para reexecutar jobs falhos, prefira o `POST /admin/queues/:queueName/jobs/:jobId/retry` e monitore via dashboard de filas antes e após a ação.
3. Ajustes de SLA ou comissão devem ser testados em staging, pois valores incorretos impactam SLAs críticos ou repasse financeiro.

