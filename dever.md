booking + notificações perto do horário + push no device, sem mexer na UX, só blindando lógica e testes.

Prompt 1 — Suite “Reminder Notifications” (T-60/T-15) + dedupe + ack + deepLink
Você é um engenheiro senior. OBJETIVO: criar uma suíte Jest/RTL no FRONT (Expo Router) que blinde o pipeline de notificações “perto do horário” no lado CLIENT, sem alterar UX, apenas garantindo comportamento correto e sem duplicação.

CONTEXTO DO PROJETO:
- Já existe AppEvent envelope (id, type, dedupeKey, severity, deepLink, bookingId, ttlSeconds, createdAt) e o front dedupa via notificationUIService.showAppEvent + ack via notificationService. Existe stream (/notifications/stream) e socket em useNotificationsSocket, e o RootLayout (_layout.tsx) integra tudo.
- Testes já rodam via `npx jest --runInBand` dentro de `app/` e há helpers tipo `renderWithProviders`.

MISSÃO:
1) Criar `app/client/__tests__/preServiceNotifications.test.tsx` (ou pasta equivalente) com 4 cenários:
   A. Evento BOOKING_REMINDER_60M (severity info): mostra UI (toast/overlay) UMA vez, chama ack silencioso e NÃO duplica se repetir com mesmo dedupeKey.
   B. Evento BOOKING_REMINDER_15M (severity critical): no foreground toca “efeito” (mock) e mostra overlay/alert UMA vez, chama ack.
   C. Evento BOOKING_REASSIGNED: mostra mensagem e dispara navegação pro deepLink do booking (mock router).
   D. Ordem trocada: mesmo evento chega por socket e depois por stream (ou vice-versa) com mesmo dedupeKey => UI apenas uma vez.

2) Não testar push real do SO aqui. Apenas testar que, ao receber um AppEvent CRITICAL quando o app está “backgrounded” (mock AppState), o código chama a função responsável por agendar notificação local (mock expo-notifications scheduleNotificationAsync) OU chama um wrapper localNotificationService (se existir). Se não existir wrapper, crie um wrapper mínimo em `services/localNotificationService.ts` só com função `scheduleFromAppEvent(event)` e use no pipeline; sem mudar UX.

3) Mocks obrigatórios:
   - mock `notificationService.ackNotification` e `notificationService.getNotificationStream`
   - mock `notificationUIService.showAppEvent` (ou spy) para validar dedupe
   - mock `expo-notifications` scheduleNotificationAsync
   - mock AppState (foreground/background) e timers (jest.useFakeTimers) se necessário
   - mock `expo-router` router.push/replace para deepLink
   - garantir limpeza de mocks e restore timers

4) Critérios de aceite:
   - Testes determinísticos, sem warnings de act.
   - `npx jest --runInBand preServiceNotifications.test.tsx` passa.
   - Nenhum comportamento de UI real alterado; somente testes + wrapper se necessário.

ENTREGÁVEIS:
- Arquivo(s) de teste + qualquer helper mínimo (fixtures AppEvent, helper buildEvent) em `app/__tests__/fixtures/` ou similar.
- Se criar wrapper localNotificationService, incluir testes unitários simples dele.
- Atualizar (se necessário) jest.setup.ts apenas para mocks; não suprimir logs gerais.

Faça as mudanças com o menor delta possível.

Prompt 2 — Pós-booking: “PIX_CONFIRMED chega enquanto usuário está na tela” + refresh booking
Você é um engenheiro senior. OBJETIVO: blindar o fluxo de pós-booking do CLIENT para que o app reaja corretamente quando chega PIX_CONFIRMED (AppEvent) enquanto a tela de success/detalhe está aberta, sem duplicar UI e garantindo que o booking/payment reflita o estado final.

CONTEXTO:
- Existe BookingSuccessScreen test já passando.
- Existe PaymentConfirmedOverlay e eventos pixPaymentConfirmed / AppEvent PIX_CONFIRMED.
- Existe quote/meta/allowedActions, QueryClient e api interceptor.
- notification pipeline tem ack + stream.

MISSÃO:
1) Criar/atualizar testes em:
   - `app/client/bookings/__tests__/BookingSuccessScreen.test.tsx`
   - (e/ou) `app/client/bookings/__tests__/BookingDetailsScreen.test.tsx`
   para cobrir estes cenários:
   A) Tela aberta + chega AppEvent PIX_CONFIRMED com bookingId: deve:
      - mostrar PaymentConfirmedOverlay (ou chamar UI helper correspondente)
      - chamar ack do event
      - invalidar/refetch booking details (QueryClient invalidateQueries ou refetch hook) e renderizar status “Pago/Confirmado” (conforme meta/statuses)
      - NÃO disparar createPixCharge novamente
   B) “Pending then confirmed”: mock fetchPaymentIntent retornando PENDING inicialmente e depois CONFIRMED, garantindo:
      - polling com limite/backoff (se existir)
      - sem duplicar toasts
      - UI final correta
   C) Erro 503/timeout no polling:
      - mostra fallback amigável (já existente)
      - NÃO entra em loop infinito
      - permite retry manual se houver

2) Mocks obrigatórios:
   - paymentService.fetchPaymentIntent/createPixCharge
   - bookingService.getBookingDetails (ou getBookingsForUser se usado)
   - notificationService.ackNotification
   - notificationUIService.showAppEvent / showInfo
   - metaService.getStatuses (se a tela depender)
   - QueryClient: usar helper `renderWithProviders` e expor query client pra inspecionar invalidations (spy).

3) Critérios de aceite:
   - `npx jest --runInBand BookingSuccessScreen.test.tsx` passa.
   - Sem flakiness com timers. Use fake timers se polling usa setTimeout.
   - Nenhuma alteração de UX: apenas fortalecer reação e testes. Se precisar de ajuste mínimo, que seja interno (ex: extrair função handleAppEvent) sem mudar UI.

ENTREGÁVEIS:
- Testes robustos com fixtures de Booking + PaymentIntent + AppEvent
- Pequenos helpers/fixtures reutilizáveis em `app/__tests__/fixtures/` e `app/__tests__/helpers/`
- Se encontrar gap no código (ex: não invalida booking após PIX_CONFIRMED), implemente a correção mínima + teste.

Prompt 3 — Push “no device”: blindar registro + background handler (Jest) + checklist smoke
Você é um engenheiro senior. OBJETIVO: garantir que o fluxo de push notifications do front esteja correto para produção (token register + background scheduling), com testes Jest (sem device real) e documentação de smoke test no iPhone.

MISSÃO:
1) Criar testes Jest em `app/services/__tests__/pushService.test.ts` (ou equivalente) cobrindo:
   A) registerDevicePushToken:
      - pede permissões (mock expo-notifications)
      - obtém token (ExpoPushToken / FCM/APNs conforme implementado)
      - chama endpoint `/notifications/register-token` via api com payload correto (platform, token, deviceId se existir)
      - falhas não quebram login (best-effort)
   B) logout/teardown:
      - ao SESSION_REVOKED/LOGOUT, chama best-effort `/auth/logout-device` (se existir) e limpa tokens locais
   C) background/local notification:
      - dado um AppEvent CRITICAL, chama Notifications.scheduleNotificationAsync com title/body/deepLink data.

2) Mocks obrigatórios:
   - `expo-notifications` (getPermissionsAsync, requestPermissionsAsync, getExpoPushTokenAsync, scheduleNotificationAsync)
   - `services/api` (mock axios instance)
   - `expo-constants`/device info se usados

3) Documentar smoke test (sem automatizar) em FRONT_STATE_PROJECT.md:
   - passos exatos para validar push no iPhone real: permissões, app em background, disparo evento do backend, push aparece, toca e abre deepLink.

CRITÉRIOS DE ACEITE:
- `npx jest --runInBand pushService.test.ts` passa.
- Não muda UX.
- Documentação clara e curta adicionada.

ENTREGÁVEIS:
- Arquivo de teste + fixtures
- Pequenos ajustes no pushService se faltar injeção de dependência para mock (fazer ajuste mínimo).


Se você quiser mais “sniper” ainda, eu também posso te mandar uma 4ª mensagem pronta só com:
✅ “onde criar os arquivos”, ✅ “nomes exatos”, ✅ “mocks que o Codex costuma esquecer (expo-router + AppState + timers)”.