Compreendido. Com base nos arquivos que você forneceu e nas descrições do fluxo que você detalhou, aqui está a documentação atualizada e completa do fluxo da área do provedor no aplicativo LimpeJá.

Documentação do Fluxo da Área do Provedor (LimpeJá App)
Esta documentação detalha a estrutura de rotas, o fluxo de navegação e as funcionalidades presentes na área do provedor, baseando-se nos arquivos React Native fornecidos (dashboard.tsx, earnings.tsx, _layout.tsx, schedule/index.tsx, schedule/manage-availability.tsx, services/[serviceId].tsx, services/index.tsx, messages/[chatId].tsx, e AnimatedQuickActionButton.tsx).

1. Autenticação e Redirecionamento Inicial
Logs Observados:

[InitialLayout] WelcomeScreen JÁ vista. Verificando autenticação.
[InitialLayout] Autenticado. Usuário: provider
[InitialLayout] Redirecionando usuário provider para /(provider)/dashboard. Pathname atual: /
[InitialLayout] Rota inicial já decidida, pathname atual: /dashboard
Fluxo: Após a tela de boas-vindas (WelcomeScreen), o sistema verifica o status de autenticação do usuário. Se o usuário estiver autenticado como um "provedor", ele é automaticamente redirecionado para a rota /(provider)/dashboard. Este é o ponto de entrada principal para a experiência do provedor.

2. Layout Principal da Área do Provedor (app/(provider)/_layout.tsx)
O arquivo _layout.tsx define a estrutura de abas (Tabs) para a navegação principal dentro da área do provedor, utilizando o Expo Router.

Componente Principal: ProviderTabLayout

Apresentação: Utiliza expo-router's Tabs para criar uma navegação baseada em abas na parte inferior da tela, permitindo uma transição fluida entre as principais seções do painel do provedor.

Rotas e Ícones das Abas:

Painel (dashboard)

Rota: /dashboard
Ícone: Ionicons "grid-outline"
Função: Visão geral do dia/semana/mês do provedor, com resumos de ganhos, próximos serviços e avaliações. É a tela de aterrissagem após o login do provedor.
Agenda (schedule)

Rota: /schedule
Ícone: Ionicons "calendar-outline"
Função: Gerenciamento detalhado de agendamentos e disponibilidade do provedor.
Serviços (services)

Rota: /services
Ícone: MaterialCommunityIcons "briefcase-check-outline"
Função: Lista e gerenciamento de solicitações de serviço pendentes, serviços agendados e concluídos/cancelados.
Ganhos (earnings)

Rota: /earnings
Ícone: Ionicons "cash-outline"
Função: Detalhes financeiros, resumo de ganhos e histórico de transações do provedor.
Mensagens (messages)

Rota: /messages
Ícone: Ionicons "chatbubbles-outline"
Função: Lista de conversas com clientes para comunicação direta.
Perfil (profile)

Rota: /profile
Ícone: Ionicons "person-circle-outline"
Função: Gerenciamento do perfil do provedor, dados pessoais, e dos tipos de serviços oferecidos.
3. Painel do Provedor (app/(provider)/dashboard.tsx)
A tela dashboard.tsx é a página inicial e a visão geral para o provedor, fornecendo um resumo das atividades e acessos rápidos.

Rota: /(provider)/dashboard

Dados Exibidos (Mockados):

Próximos serviços (fetchUpcomingServices)
Resumo de ganhos (fetchEarningsSummary)
Avaliações recentes (fetchRecentReviews)
Componentes/Seções:

DashboardLoadingIndicator: Exibido durante o carregamento inicial dos dados.
DashboardHeader: Cabeçalho animado com o título da tela e um botão para navegar para a tela de perfil do provedor.
WelcomeSection: Exibe uma mensagem de boas-vindas personalizada com o primeiro nome do usuário logado.
EarningsSnapshotSection: Nova seção que apresenta um resumo dos ganhos e um link para a tela de "Todos os Ganhos".
ProviderOverviewSection: Uma nova seção combinada que lista os próximos serviços e pode incluir alertas para novas mensagens ou solicitações pendentes.
Ao clicar em um serviço: navega para /(provider)/services/[id].
Ao clicar em "Ver Todos os Serviços": navega para /(provider)/services.
Ao clicar em "Ver Todas as Mensagens": navega para /(provider)/messages.
QuickActionsSection: Uma seção que contém botões de acesso rápido para funcionalidades comuns.
"Gerenciar Disponibilidade": navega para /(provider)/schedule/manage-availability.
"Editar Meus Serviços": navega para /(provider)/profile/edit-services.
"Configurações da Conta": navega para /(common)/settings (assumindo uma rota comum).
"Ajuda e Suporte": navega para /(common)/help (assumindo uma rota comum).
LogoutSection: Botão para deslogar da conta, com uma confirmação via Alert.
Animações: A tela incorpora animações de fade-in e slide-in para os elementos do cabeçalho, seção de boas-vindas e o conteúdo principal após o carregamento. Há também uma reflectionAnim para efeitos glassmorphic em componentes internos.

Interação: O provedor pode visualizar um resumo de suas atividades, acessar serviços específicos e navegar rapidamente para outras seções importantes do aplicativo.

4. Agenda do Provedor (app/(provider)/schedule/index.tsx)
Esta tela permite ao provedor visualizar e gerenciar seus agendamentos diários.

Rota: /(provider)/schedule

Dados Exibidos (Mockados):

Agendamentos (fetchProviderAppointments)
Componentes/Seções:

Custom Header: Cabeçalho animado com o título "Minha Agenda" e um botão para "Gerenciar Disponibilidade".
Ao clicar no ícone de configurações: navega para /(provider)/schedule/manage-availability.
Calendar: Calendário interativo (react-native-calendars) para seleção de datas, com datas de agendamentos marcadas.
Agenda List Header: Exibe a data selecionada por extenso.
AnimatedAppointmentItem: Renderiza cada agendamento em um card animado, mostrando nome do cliente, tipo de serviço, horário e status.
Ao clicar em um agendamento: navega para /(provider)/services/[id].
Loading/Empty States: Indicador de carregamento ou mensagem de "Nenhum serviço agendado para este dia".
Animações: Animações de entrada para o cabeçalho, calendário, e itens da lista de agendamentos (escalonadas).

Interação: O provedor pode selecionar datas no calendário para ver os agendamentos daquele dia e clicar em um agendamento para ver os detalhes.

5. Gerenciar Disponibilidade (app/(provider)/schedule/manage-availability.tsx)
Esta tela permite ao provedor definir seus horários de trabalho semanais e gerenciar sua disponibilidade.

Rota: /(provider)/schedule/manage-availability

Dados Exibidos (Mockados):

Disponibilidade semanal (WeeklyAvailability)
Componentes/Seções:

Custom Header: Cabeçalho animado com o título "Gerenciar Disponibilidade" e um botão de voltar.
Main Header Title/Subtitle: Títulos informativos sobre a funcionalidade.
AnimatedDayCard: Componente para cada dia da semana, com um switch para ativar/desativar a disponibilidade e uma lista de TimeSlots.
AnimatedTimeSlot: Componente para cada horário de trabalho, permitindo editar e remover.
DateTimePicker: Usado para selecionar os horários (@react-native-community/datetimepicker).
Botão Adicionar Horário: Adiciona um novo slot de tempo para o dia.
Seção de Datas Específicas: Placeholder para uma futura funcionalidade de bloquear datas (férias, feriados, etc.).
Botão Salvar Alterações: Envia as configurações de disponibilidade para o backend (simulado).
Animações: Animações de entrada para o cabeçalho, botão de salvar, seção especial e cada card de dia da semana (escalonadas), além de animações para os slots de horário.

Interação: O provedor pode ativar/desativar a disponibilidade para cada dia, adicionar múltiplos horários, editar horários existentes e remover slots.

6. Meus Serviços (app/(provider)/services/index.tsx)
Esta tela centraliza a visualização e gerenciamento de todas as solicitações de serviço e agendamentos do provedor.

Rota: /(provider)/services

Dados Exibidos (Mockados):

Serviços com diferentes status (ALL_PROVIDER_SERVICES), filtrados por tipo.
Componentes/Seções:

Custom Header: Cabeçalho animado com o título "Meus Serviços" e um botão "Adicionar" (para gerenciar tipos de serviço).
Ao clicar no ícone "Adicionar": navega para /(provider)/profile/edit-services.
Filter Container: Botões de filtro para Solicitações (Pendente), Próximos (Confirmado e futuro) e Histórico (Concluído/Cancelado/Recusado).
AnimatedServiceItem: Renderiza cada item de serviço em um card animado, mostrando nome do cliente, tipo de serviço, data/hora e status.
Ao clicar em um serviço: navega para /(provider)/services/[id] para ver os detalhes.
Loading/Empty States: Indicador de carregamento ou mensagem de "Nenhum serviço encontrado".
Animações: Animações de entrada para o cabeçalho, filtros e itens da lista (escalonadas). Animações de fade-out/fade-in para a lista ao mudar de filtro.

Interação: O provedor pode filtrar os serviços por status (solicitações pendentes, próximos agendamentos, histórico) e clicar em qualquer item para ver seus detalhes.

7. Detalhes do Serviço (app/(provider)/services/[serviceId].tsx)
Esta tela exibe os detalhes completos de uma solicitação de serviço ou agendamento específico.

Muito: /(provider)/services/[serviceId]

Parâmetro de Rota: serviceId (ID do serviço/solicitação).

Dados Exibidos (Mockados):

Detalhes do serviço (MOCK_SERVICE_DETAILS).tsx].
Componentes/Seções:

Custom Header: Cabeçalho animado com o título "Detalhes do Serviço" e um botão de voltar.tsx].
Card de Informações do Cliente: Nome do cliente, telefone (com opção de ligar/enviar mensagem via chat), endereço e avatar.tsx].
Card de Detalhes do Serviço: Tipo de serviço, data e horário.tsx].
Card de Observações do Cliente: Notas adicionais do cliente.tsx].
Seção de Status: Badge colorido indicando o status atual do serviço (Pendente, Confirmado, Concluído, etc.).tsx].
Seção de Ações: Botões de ação dinâmicos com base no status do serviço:
Pendente: "Aceitar Solicitação", "Recusar Solicitação", "Contatar Cliente".tsx].
Confirmado: "Marcar como Concluído", "Contatar Cliente".tsx].
Concluído/Cancelado/Recusado: "Ver Detalhes Completos" (placeholder).tsx].
Loading/Empty States: Indicadores de carregamento ou mensagem de "Serviço não encontrado".tsx].
Animações: Animações de entrada para o cabeçalho e cada card de seção (escalonadas). Animações para os botões de ação quando clicados.tsx].

Interação: O provedor pode visualizar todas as informações de um serviço, tomar ações (aceitar, recusar, concluir) e contatar o cliente.

8. Mensagens - Chat com Cliente (app/(provider)/messages/[chatId].tsx)
Esta tela representa a interface de chat com um cliente específico, permitindo comunicação direta.

Muito: /(provider)/messages/[chatId]

Parâmetros de Rota: chatId (ID do chat), recipientName (nome do cliente).

Componente Principal: ProviderChatScreen (atualmente um placeholder simples).

Função: Servir como a tela de comunicação direta com um cliente. A lógica completa de chat (envio/recebimento de mensagens, histórico) seria implementada aqui, possivelmente reutilizando um componente genérico de chat.

Interação: Permitir que o provedor se comunique diretamente com os clientes.

9. Editar Meus Serviços (app/(provider)/profile/edit-services.tsx)
Esta tela permite ao provedor cadastrar e gerenciar os tipos de serviços que ele oferece no seu perfil.

Muito: /(provider)/profile/edit-services

Dados Exibidos (Mockados):

Lista de serviços oferecidos (ServiceOffering).
Componentes/Seções:

Custom Header: Cabeçalho animado com o título "Editar Meus Serviços" e um botão de voltar.
Formulário Adicionar/Editar Serviço: Inputs para nome, descrição, preço e duração do serviço.
Botões "Adicionar Serviço" / "Atualizar Serviço" e "Cancelar Edição".
AnimatedServiceItem: Renderiza cada serviço oferecido em um card animado com opções de "Editar" e "Excluir".
Botão Salvar Todas as Alterações: Para persistir as mudanças no backend (simulado).
Loading/Empty States: Indicadores de carregamento ou mensagem de "Você ainda não adicionou nenhum serviço.".
Animações: Animações de entrada para o cabeçalho, formulário, cabeçalho da lista e botão de salvar. Animações escalonadas para os itens da lista de serviços.

Interação: O provedor pode adicionar novos tipos de serviço, editar detalhes de serviços existentes, excluir serviços e salvar todas as alterações.


(provider)
├── api
├── components
│   └── dashboard
├── messages
│   ├── api
│   ├── components
│   ├── [chatid].tsx
│   └── index.tsx
├── profile
│   ├── api
│   ├── components
│   ├── edit-services.tsx
│   └── index.tsx
├── schedule
│   ├── api
│   ├── components
│   ├── index.tsx
│   └── manage-availability.tsx
├── services
│   ├── api
│   ├── components
│   ├── [serviceId].tsx
│   └── index.tsx
├── dashboard.tsx
├── earnings.tsx
├── layout.tsx
└── README.md

(provider)/
 ├── active-booking/
 │    └── [bookingId].tsx
 ├── messages/
 │    ├── [chatId].tsx
 │    └── index.tsx
 ├── notifications/
 │    └── index.tsx
 ├── profile/
 │    ├── edit-services.tsx
 │    └── index.tsx
 ├── schedule/
 │    ├── index.tsx
 │    └── manage-availability.tsx
 ├── services/
 │    ├── [serviceId].tsx
 │    └── index.tsx
 ├── dashboard.tsx
 ├── earnings.tsx
 ├── index.tsx
 ├── layout.tsx
 └── README.md

## Saque (Wallet) – Produção

Esta seção documenta o fluxo de saque de valores para provedores (wallet interna), os endpoints usados pelo app e os pré‑requisitos para produção com PagBank.

### Pré‑requisitos (produção)
- PagBank Connect (OAuth) habilitado e tokens válidos por ambiente.
- Desafio do Connect (challenge) aprovado e certificado mTLS emitido.
- Variáveis no backend (`backend-cleaning/.env`):
  - `PAGSEGURO_API_BASE_URL=https://api.pagseguro.com` (prod) ou sandbox
  - `PAGSEGURO_CONNECT_CLIENT_ID`, `PAGSEGURO_CONNECT_CLIENT_SECRET`, `PAGSEGURO_CONNECT_REDIRECT_URI`
  - `PAGSEGURO_PUBLIC_KEY_PATH` (para o challenge)
  - `PAGSEGURO_MTLS_CERT_PATH`, `PAGSEGURO_MTLS_KEY_PATH`, `PAGSEGURO_MTLS_CA_PATH`
  - `PSP_WEBHOOK_SECRET` (assinatura HMAC dos webhooks de payout)
  - `PIX_WEBHOOK_SECRET` (assinatura HMAC dos webhooks de PIX)

### Endpoints usados pelo app (provider)
- Saldo disponível (wallet)
  - GET `/payouts/balance`
  - Resposta: `{ available: number }`

- Solicitar saque
  - POST `/payouts/withdrawals`
  - Headers: `idempotency-key: <string único por ação>` (obrigatório)
  - Body (JSON):
    - `amount: number` (mín. 0.01)
    - `pixKeyType: 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'RANDOM'`
    - `pixKey: string`
    - `notes?: string`
  - Resposta: `{ message: string, payoutId: string, status: 'PENDING' | 'PROCESSING' | ... }`

### Estados do saque
- `PENDING`: solicitado; débito lançado em ledger (WITHDRAWAL/FEE).
- `PROCESSING`: enviado ao PSP ou em fila de processamento.
- `PAID`: liquidado; sem alteração adicional no ledger (débito já lançado na solicitação).
- `FAILED`/`CANCELED`: rollback automático via ledger (cria RELEASE para devolver o valor ao saldo).

### Painel/Admin (backoffice)
- Listar saques
  - GET `/admin/withdrawals?status=PENDING&email=<parte>&userId=<id>&from=YYYY-MM-DD&to=YYYY-MM-DD&sortBy=requestedAt|amount|status&sortDir=asc|desc`
- Confirmar como pago
  - PATCH `/admin/withdrawals/:id/confirm`
  - Body opcional: `{ "gatewayTxnId": "psp-123", "note": "Liquidado manualmente" }`
- Marcar como falho / cancelar (com rollback)
  - PATCH `/admin/withdrawals/:id/fail`  (FAILED)
  - PATCH `/admin/withdrawals/:id/cancel` (CANCELED)

### Webhooks (produção)
- Payouts webhook (PSP → backend)
  - POST `/payouts/webhook/gateway`
  - Headers: `x-signature: sha256=<hmac-hex>`, `x-event-id: <id>`
  - Assinatura: HMAC‑SHA256 do corpo JSON stringificado com `PSP_WEBHOOK_SECRET`.
  - Efeito: atualiza `Payout.status` e cria RELEASE no ledger quando FAILED/CANCELED.

### Comandos de teste (PowerShell)
- Saldo
```
curl -H "Authorization: Bearer <PROVIDER_JWT>" http://localhost:3000/payouts/balance
```

- Solicitar saque (idempotência obrigatória)
```
$idem = "wd-$(Get-Random)";
curl -X POST http://localhost:3000/payouts/withdrawals \
 -H "Authorization: Bearer <PROVIDER_JWT>" \
 -H "Content-Type: application/json" \
 -H "idempotency-key: $idem" \
 -d '{"amount":50.0,"pixKeyType":"CPF","pixKey":"12345678901","notes":"Saque teste"}'
```

- Admin – listar e confirmar
```
curl -H "Authorization: Bearer <ADMIN_JWT>" "http://localhost:3000/admin/withdrawals?status=PENDING"
curl -X PATCH -H "Authorization: Bearer <ADMIN_JWT>" -H "Content-Type: application/json" \
 http://localhost:3000/admin/withdrawals/<PAYOUT_ID>/confirm \
 -d '{"gatewayTxnId":"psp-123","note":"Liquidado manualmente"}'
```

### Alinhamento do app (RN)
- A tela de saque em `app/(provider)/withdraw/index.tsx` consome os endpoints acima e envia `idempotency-key` por requisição.
- O serviço `services/paymentService.ts` usa `POST /payouts/withdrawals` (padronizado).
- Em produção, saques reais exigem Connect + mTLS. Em dev, sem PSP/token, o backend pode simular PAID (somente fora de produção).
