# Módulo de Notifications

O `NotificationsModule` é a fonte central de notificações do backend: mantém o centro in‑app, orquestra o envio de push (com retries/backoff) e expõe APIs para leitura, marcação e envio manual. Ele depende de `PrismaModule` para persistência, de `AuthModule` (via `forwardRef`) para validação JWT e oferece `NotificationsService` como recurso compartilhado para outros módulos.

## Arquitetura e dependências

- **Module** – `NotificationsModule` importa `PrismaModule`, injeta o `NotificationsService`, exporta o service e provê `I18nModule` para traduções.
- **Controller** – `NotificationsController` protege todas as rotas com `JwtAuthGuard`, usa `RolesGuard` apenas em endpoints administrativos (`@Roles(UserRole.ADMIN)`) e publica uma coleção de endpoints REST (`/notifications`, `/notifications/me`, `/notifications/:id` etc.).
- **Service** – `NotificationsService` delega para o Prisma, Sentry (captura erros) e `I18nService` (mensagens amigáveis), oferecendo lógica real de criação, leitura, marcação e envio.
- **Entity/DTOs** – `NotificationEntity` padroniza a resposta JSON; `CreateNotificationDto` define payloads aceitos; `MarkAsReadDto` suporta listas/flag de leitura.

## Endpoints expostos (`notifications.controller.ts`)

| Método | Rota | Guardas + Papel | Responsabilidade |
| --- | --- | --- | --- |
| `POST /notifications` | criar nova notificação | `JwtAuthGuard` + `RolesGuard` + `@Roles(ADMIN)` | Persiste via `createNotification`, adiciona campos de imagem/ações/categoria e dispara o envio push (ver service). |
| `GET /notifications/me` | listar notificações do usuário logado | `JwtAuthGuard` | Retorna in-app center (opcional `includeRead=true`) ordenado por `createdAt desc`. |
| `PATCH /notifications/me/mark-as-read` | marcar lote como lido | `JwtAuthGuard` | Usa `MarkAsReadDto` para atualizar `isRead` via `updateMany`; sem IDs marca tudo pendente. |
| `PATCH /notifications/:id/mark-as-read` | marcar uma notificação | `JwtAuthGuard` | Verifica propriedade (`userId`) e retorna entidade atualizada. |
| `DELETE /notifications/:id` | remover uma notificação | `JwtAuthGuard` | Limpa o registro apenas se pertence ao usuário logado. |
| `POST /notifications/send` | alias imediato | `JwtAuthGuard` + `RolesGuard` + `ADMIN` | Chama `createNotification` (mesmo fluxo) para quadros administrativos. |
| `POST /notifications/qa/send` | painel QA | `JwtAuthGuard` | Só funciona quando a flag `QA_PANEL_ENABLED` é verdadeira e cria notificação para o usuário autenticado ou para o `userId` informado. |
| `POST /notifications/schedule` | agendamento | `JwtAuthGuard` + `RolesGuard` + `ADMIN` | Atualmente dispara `createNotification` (sem fila adicional), deixando aberto para evolução. |
| `GET /notifications/suggestions?context=...` | sugestão inteligente | `JwtAuthGuard` | Retorna frases predefinidas por contexto (`booking_flow`, `service_quality`, `customer_retention`, `dispute`). |
| `POST /notifications/quick-action/:action` | ações rápidas | `JwtAuthGuard` | `executeQuickAction` movimenta bookings/disputas/conecta a logs e valida `action`. |
| `POST /notifications/register-token` | registro de tokens push | `JwtAuthGuard` | Atualiza `User.fcmToken`, remove tokens duplicados e garante que cada token siga atrelado a apenas um usuário. |

## DTOs e modelo

- **CreateNotificationDto** – exige `userId`, `type`, `message`; aceita `title`, `targetUrl`, `category`, `imageUrl`, `actionButtons` (JSON livre). Utilizado nos endpoints de criação/admin/QA.
- **MarkAsReadDto** – opcional `notificationIds: string[]`; vazio sinaliza "marcar todas pendentes".
- **NotificationEntity** – representa o Prisma `Notification` com campos extras como `category`, `actionButtons`, `imageUrl` e `idempotencyKey`/`scheduledAt`/`priority`/`readAt`.

## Fluxos do serviço (`notifications.service.ts`)

- **createNotification** (principal)** – Persiste `Notification` com `isRead = false`, adiciona títulos/ações/categoria e chama `sendPushNotification(...)` de forma assíncrona. Captura falhas no Logger/Sentry e mantém o fluxo estável.
- **getUserNotifications** – Busca todas as notificações do usuário com filtro `includeRead`, ordenando por `createdAt desc`.
- **markNotificationsAsRead** – Atualiza via `updateMany` com filtro em `userId` e `isRead=false`; retorna contagem de registros alterados.
- **markNotificationByIdAsRead** – Valida propriedade, traduz erros com `i18n.translate('notification.notFound')` e evita regravação se já lida.
- **deleteNotification** – Deleta somente se a notificação pertence ao usuário e existe.
- **getSmartSuggestions** – Mapa fixo de contextos; usado pelo endpoint `/suggestions`.
- **executeQuickAction** – Permite fluxos (accept/view bookings, respond/view review, view dispute/resolution) com validações de dados e log, usando `Booking` e `Logger`.
- **registerDeviceToken** – Tenta atualizar `User.fcmToken`, remove tokens duplicados de outros usuários (via `updateMany`) e retorna `{ ok: true }`.

## Envio de push (FCM + fallback)

- `sendPushNotification` consulta `Prisma` (`user.fcmToken`). Se não houver token, registra warning no logger/Sentry.
- Se `FCM_SERVER_KEY` estiver presente, faz POST para `https://fcm.googleapis.com/fcm/send` (axios com timeout 5s) contendo `notification` e `data` do payload (incluindo `channelId` e `priority`). Em caso de falha HTTP/log, grava warning com status e resposta.
- Quando não há chave ou a requisição falha, o método registra um log simulado (`[SIMULADO] Push ...`) para manter visibilidade.
- Utiliza `Sentry.addBreadcrumb` para alertar sobre tokens ausentes e `Sentry.captureException` para erros graves, mantendo o `Logger` em todas as ramificações.

## Observabilidade e segurança

- Todos os endpoints usam `JwtAuthGuard`; as rotas administrativas combinam com `RolesGuard` e `@Roles(UserRole.ADMIN)`.
- O controller lança `UnauthorizedException`/`ForbiddenException` quando necessário e fornece respostas Swagger (`ApiResponse`).
- O serviço usa `Logger` para success/error/warning e faz `Sentry.captureException` (erro real) além de `addBreadcrumb` (tokens faltantes).
- `I18nService` traduz mensagens `notification.notFound` e `notification.badRequest.unknownAction`.

## Flags, QA e ambiente

- `QA_PANEL_ENABLED` (a partir de `EXPO_PUBLIC_ENABLE_QA_PANEL`, `QA_PANEL_ENABLED` ou `ENABLE_QA_PANEL`) habilita `/notifications/qa/send`.
- `FCM_SERVER_KEY` determina o envio real de push; quando ausente o envio é logado.
- `axios` com timeout 5s garante que o backend não bloqueie longamente (falhas são capturadas).

## Pontos de atenção

1. O agendamento (`/notifications/schedule`) ainda compartilha `createNotification`; implementar fila/crontab futuramente.
2. `executeQuickAction` usa `Prisma.booking.update` diretamente; garantir permissões no escopo chamador para evitar uso indevido.
3. `register-token` sobrepõe tokens e limpa duplicatas, mas depende de `User.fcmToken` ser único no schema Prisma.
