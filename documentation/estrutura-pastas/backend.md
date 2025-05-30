Ótimo! Você tem um backend incrivelmente bem documentado e uma estrutura de frontend que está alinhada com as melhores práticas. Agora, vamos juntar tudo isso em uma documentação coesa para o seu backend, focando nas integrações finais e sugeridas, para que o frontend saiba exatamente como consumir essas funcionalidades.

🚀 Documentação do Backend LimpeJá (Firebase Cloud Functions)
Este documento descreve a arquitetura e os módulos principais do backend do LimpeJá, construído com Firebase Cloud Functions, e como o frontend (Expo/React Native) se integra a ele.

1. Visão Geral da Arquitetura
O backend do LimpeJá utiliza uma abordagem serverless com Firebase Cloud Functions para a lógica de negócios e APIs, Cloud Firestore como banco de dados NoSQL principal, Firebase Authentication para gerenciamento de usuários, e Firebase Storage para armazenamento de arquivos (como fotos de perfil).

Principais Vantagens desta Abordagem:
Escalabilidade: Os serviços Firebase são projetados para escalar automaticamente, lidando com o aumento da demanda sem intervenção manual.
Desenvolvimento Ágil: Muitos recursos prontos (autenticação, banco de dados em tempo real, notificações) aceleram o desenvolvimento e permitem focar na lógica de negócio.
Custo-Benefício: Modelo de precificação baseado no uso (pay-as-you-go), geralmente vantajoso para startups e projetos com tráfego variável.
Integração Simplificada: SDKs cliente do Firebase facilitam a comunicação direta e segura com o backend a partir do frontend.
2. Tecnologias Utilizadas (Backend)
Firebase Cloud Functions (Node.js com TypeScript): Para toda a lógica de backend, incluindo APIs HTTP, funções Callable (invocadas diretamente pelo cliente) e Triggers (disparadas por eventos no Firestore, Authentication, etc.).
Cloud Firestore: Banco de dados NoSQL flexível e escalável, usado para armazenar dados estruturados como perfis de usuários, detalhes de serviços, agendamentos, avaliações, chats, etc.
Firebase Authentication: Serviço completo para registro, login, gerenciamento de sessão de usuários (clientes e prestadores), e controle de acesso via Custom Claims.
Firebase Storage: Para armazenamento de objetos grandes, como fotos de perfil de usuários e provedores, ou imagens de serviços.
Firebase Cloud Messaging (FCM): Serviço de mensagens cross-platform para enviar notificações push confiáveis e eficientes para os dispositivos dos usuários.
Axios: Cliente HTTP para realizar requisições a APIs externas (ex: gateways de pagamento, serviços de CEP).
Zod: Biblioteca de validação de esquemas para garantir a integridade e o formato dos dados de entrada nas funções.
firebase-admin SDK: Biblioteca Node.js para interagir com os serviços Firebase a partir de ambientes privilegiados (como Cloud Functions), permitindo operações administrativas.
3. Estrutura de Pastas do Backend (functions/)
A organização do código-source das Cloud Functions (functions/src/) é modular, agrupando funções por domínio de negócio. Isso promove a separação de responsabilidades, reutilização de código e escalabilidade independente de cada módulo.

functions/
├── src/
│   ├── index.ts              # Ponto de entrada principal, exporta todas as funções de cada domínio.
│   │                         # Ex: export * from './auth/functions';
│   │                         #     export * from './bookings/functions';
│   │                         #     ...
│   │
│   ├── auth/                 # Módulo de Autenticação e Gerenciamento de Usuários
│   │   ├── functions.ts      # Exporta as Cloud Functions de auth (createUser, loginUser, updateUserProfile, deleteUserAccount)
│   │   ├── service.ts        # Lógica de negócio específica de auth (ex: validação de email, hashing de senha se não for Firebase Auth)
│   │   └── triggers.ts       # Triggers do Firebase Auth (ex: onCreate, onDelete de usuários)
│   │
│   ├── bookings/             # Módulo de Agendamentos
│   │   ├── functions.ts      # Exporta as Cloud Functions de agendamentos (createAppointment, updateAppointmentStatus, getUserAppointments)
│   │   ├── service.ts        # Lógica de negócio de agendamento (ex: verificação de disponibilidade, regras de agendamento recorrente, lógica idempotente)
│   │   └── triggers.ts       # Triggers do Firestore para agendamentos (ex: onCreate, onUpdate de 'appointments')
│   │
│   ├── chat/                 # Módulo de Chat
│   │   ├── functions.ts      # Exporta as Cloud Functions de chat (se houver HTTP/Callable)
│   │   ├── service.ts        # Lógica de negócio de chat
│   │   └── triggers.ts       # Triggers do Firestore para mensagens/chat (ex: onCreate de 'messages')
│   │
│   ├── common/               # Funções e utilitários COMUNS a múltiplos domínios ou de propósito muito geral.
│   │   ├── constants.ts      # Constantes globais (ex: STATUS_AGENDAMENTO)
│   │   ├── errors.ts         # Definições de erros customizados
│   │   ├── interfaces.ts     # Interfaces globais ou genéricas
│   │   ├── utils.ts          # Funções utilitárias genéricas (ex: formatadores de data, geradores de ID)
│   │   └── validators.ts     # Funções de validação genéricas
│   │
│   ├── config/               # Configurações e inicialização do Firebase Admin SDK
│   │   ├── firebaseAdmin.ts  # Inicialização do app Firebase Admin
│   │   └── index.ts          # Exporta a instância do Admin
│   │
│   ├── notifications/        # Módulo de Notificações
│   │   ├── functions.ts      # Exporta as Cloud Functions de notificação (sendAppointmentConfirmation, sendPaymentConfirmation, sendServiceReminder)
│   │   ├── service.ts        # Lógica de envio de notificações (integração com FCM/SendGrid/outros)
│   │   └── triggers.ts       # Triggers para disparo de notificações (ex: onCreate de 'appointments', onUpdate de 'transactions')
│   │
│   ├── payments/             # Módulo de Pagamentos
│   │   ├── functions.ts      # Exporta as Cloud Functions de pagamento (createPaymentIntent, refundPayment)
│   │   ├── service.ts        # Lógica de negócio de pagamento (ex: cálculo de comissão, regras de reembolso, integração com Stripe/MercadoPago)
│   │   └── triggers.ts       # Triggers do Firestore para pagamentos, ou HTTP webhook para gateways de pagamento
│   │
│   ├── providers/            # Módulo de Prestadores (gerenciamento de dados de prestadores, não necessariamente as funções de autenticação deles)
│   │   ├── functions.ts      # Exporta Cloud Functions relacionadas a prestadores (ex: getProviderProfile, updateProviderAvailability)
│   │   ├── service.ts        # Lógica de negócio de prestadores (ex: curadoria, verificação)
│   │   └── triggers.ts       # Triggers do Firestore para perfis de prestadores
│   │
│   ├── reviews/              # Módulo de Avaliações
│   │   ├── functions.ts      # Exporta Cloud Functions de avaliações (ex: submitReview, getReviewsForProvider)
│   │   ├── service.ts        # Lógica de negócio de avaliações (ex: cálculo de média, validação)
│   │   └── triggers.ts       # Triggers do Firestore para avaliações
│   │
│   ├── services/             # Módulo de Serviços (o "que" é oferecido, como limpeza, jardinagem)
│   │   ├── functions.ts      # Exporta Cloud Functions de serviços (ex: listAvailableServices, getServiceDetails)
│   │   ├── service.ts        # Lógica de negócio de serviços (ex: regras de precificação, categorização)
│   │   └── triggers.ts       # Triggers do Firestore para serviços
│   │
│   ├── admin/                # Funções de Admin (operações que só o admin pode fazer)
│   │   ├── functions.ts      # Funções Callable ou HTTP restritas para o painel de admin
│   │   └── service.ts        # Lógica de negócio de admin (ex: aprovar prestador, gerenciar usuários)
│   │
│   ├── dal/                  # Data Access Layer (Camada de Acesso a Dados)
│   │   ├── firestore.ts      # Funções genéricas para interagir com o Firestore (CRUD básico, transações atômicas)
│   │   └── models/           # Definição de modelos de dados Firestore (ex: user.model.ts, appointment.model.ts)
│   │       └── index.ts      # Exporta todos os modelos
│   │
│   └── types/                # Definições de tipos TypeScript ESPECÍFICOS para a API de funções/backend
│       ├── index.ts
│       ├── auth.d.ts         # Tipos para payload de request/response de auth
│       ├── booking.d.ts      # Tipos para payload de request/response de booking
│       └── common.d.ts       # Tipos comuns de API (ex: ApiResponse)
└── ... (outros arquivos de configuração do projeto Firebase)
4. Módulos Principais do Backend e Integração com Frontend
4.1. Configuração e Inicialização
functions/src/config/firebaseAdmin.ts:
Propósito: Inicializa o Firebase Admin SDK, garantindo que a conexão com os serviços Firebase seja estabelecida uma única vez.
Funcionalidade: Exporta instâncias de admin.firestore(), admin.auth(), admin.storage() e admin.messaging() para serem utilizadas em outras funções.
Integração Frontend: Indireta. Este arquivo é a base para todas as operações do backend que interagem com o Firebase.
functions/src/config/environment.ts:
Propósito: Carrega variáveis de ambiente e configurações sensíveis (como chaves de API de gateways de pagamento, segredos de webhook) de forma segura.
Funcionalidade: Utiliza functions.config() para acessar variáveis configuradas via firebase functions:config:set. Inclui verificações para garantir que as chaves críticas estejam presentes.
Integração Frontend: Nenhuma direta. O frontend envia dados, e o backend usa essas chaves configuradas para interagir com serviços de terceiros de forma segura.
functions/src/index.ts:
Propósito: O ponto de entrada principal para as Cloud Functions. Exporta todas as funções que serão implantadas no Firebase.
Funcionalidade: Importa e re-exporta as funções HTTP, Callable e Triggers de seus respectivos módulos. Inclui uma função helloLimpeJaBackend para testes básicos de conectividade.
Integração Frontend: Indireta. O frontend invoca as funções que são exportadas por este arquivo.
4.2. Autenticação e Gerenciamento de Usuários
Este módulo lida com o ciclo de vida do usuário, desde a criação da conta até a atualização de perfil e deleção.

functions/src/auth/triggers.ts:
processNewUser (Auth Trigger onCreate):
Disparador: Criação de um novo usuário no Firebase Authentication.
Lógica: Cria um documento correspondente na coleção users do Firestore com informações básicas (email, UID, nome padrão) e um role padrão ("client"). Define Custom Claims ({ role: "client" }) no token do usuário para controle de acesso baseado em role.
Integração Frontend: O frontend usa o SDK do Firebase (firebase/auth) para createUserWithEmailAndPassword ou login social. Este trigger age no backend em resposta à criação da conta.
cleanupUser (Auth Trigger onDelete):
Disparador: Deleção de um usuário no Firebase Authentication.
Lógica: Realiza uma limpeza completa dos dados do usuário no Firestore: deleta o perfil do usuário (users), o perfil de provedor (providerProfiles se existir), tokens FCM (fcmTokens). Para agendamentos futuros onde o usuário era cliente, tenta reembolsar o pagamento (se pago) e cancela o agendamento, notificando o prestador. Para agendamentos futuros onde o usuário era prestador, tenta reembolsar o cliente e cancela o agendamento, notificando o cliente. Utiliza db.batch() para operações atômicas.
Integração Frontend: Se o usuário deletar a conta pelo app, o app chama uma função (Callable ou HTTP) que, por sua vez, deleta o usuário do Firebase Auth, disparando este trigger.
functions/src/auth/functions.ts (substitui http.ts e callable.ts em auth/ e users/):
checkAuthStatus (HTTP Endpoint GET /checkAuthStatus):
Chamada: Pelo frontend (app/(auth)/api/authService.ts) para verificar o status de autenticação do usuário.
Lógica: Utiliza um middleware (checkIfAuthenticated) para validar o Firebase ID Token. Retorna informações básicas do usuário e seus Custom Claims (incluindo role) para o frontend. Opcionalmente, busca dados adicionais do UserProfile no Firestore.
Integração Frontend: O frontend pode chamar este endpoint para revalidar a sessão do usuário ou obter dados do perfil após o login.
updateUserProfile (Callable Function):
Chamada: Pelo frontend (app/(auth)/api/authService.ts ou app/(client)/profile/api/profileService.ts) para atualizar dados como nome, telefone, avatarURL.
Lógica: Atualiza o documento do usuário em users no Firestore e também o perfil no Firebase Authentication (admin.auth().updateUser()).
Integração Frontend: O AuthContext e os serviços de perfil no frontend chamam esta função.
addUserAddress (Callable Function):
Chamada: Pela tela de gerenciamento de endereços do cliente.
Lógica: Adiciona um novo endereço na subcoleção addresses do perfil do usuário no Firestore. Inclui validação para campos obrigatórios do endereço.
Integração Frontend: app/(auth)/api/addressService.ts fará a chamada para este endpoint após validação de CEP.
functions/src/users/triggers.ts (agora parte do módulo auth/):
onUserProfileUpdate (Firestore Trigger onUpdate em users/{userId}):
Disparador: Atualização de um documento na coleção users.
Lógica: Realiza a denormalização de dados alterados (como name, avatarUrl) para outras coleções onde eles são referenciados (ex: providerProfiles, bookings, reviews, chats) para otimizar leituras no frontend. Utiliza db.batch() para atualizações atômicas em múltiplos documentos.
Integração Frontend: Indireta. O frontend verá os dados atualizados em outras telas devido à denormalização.
4.3. Lógica de Prestadores
Este módulo gerencia o cadastro, perfil e serviços oferecidos pelos profissionais.

functions/src/providers/functions.ts (substitui callable.ts em providers/):
submitProviderRegistration (Callable Function):
Chamada: Pelo frontend ao final do fluxo de cadastro de múltiplas etapas do prestador (app/(auth)/provider-register/service-details.tsx).
Lógica: Recebe todos os dados coletados (pessoais, de serviço, disponibilidade), valida-os (usando Zod), cria/atualiza o documento em providerProfiles no Firestore, e atualiza o role do usuário para "provider" no documento users e nos Custom Claims do Firebase Auth. O provedor inicia como não verificado (isVerified: false).
Integração Frontend: O ProviderRegistrationContext no frontend agregaria os dados e chamaria esta função.
updateOfferedServices (Callable Function):
Chamada: Pelas telas de gerenciamento de serviços do prestador no frontend (app/(provider)/profile/edit-services.tsx).
Lógica: Atualiza o array servicesOffered no documento providerProfiles do prestador no Firestore.
updateWeeklyAvailability (Callable Function):
Chamada: Pelas telas de gerenciamento de agenda do prestador no frontend (app/(provider)/schedule/manage-availability.tsx).
Lógica: Atualiza o array weeklyAvailability no documento providerProfiles do prestador no Firestore.
updateBlockedDates (Callable Function):
Chamada: Pelas telas de gerenciamento de agenda do prestador no frontend.
Lógica: Atualiza o array blockedDates no documento providerProfiles do prestador no Firestore.
functions/src/providers/triggers.ts:
onProviderProfileWrite (Firestore Trigger onWrite em providerProfiles/{providerId}):
Disparador: Criação, atualização ou deleção de um documento na coleção providerProfiles.
Lógica:
Deleção: Se um perfil de provedor é deletado, desativa a conta de autenticação do usuário, marca os serviços oferecidos como inativos e envia um e-mail de alerta para os administradores. Remove o provedor do índice de busca.
Criação/Atualização:
Atualiza o UserProfile correspondente (isProvider: true, isProviderVerified).
Se o status isVerified mudar para true, envia uma notificação push e e-mail de boas-vindas/aprovação para o provedor.
Se o status isVerified mudar para false (rejeitado/suspenso), envia notificação e e-mail informando a mudança.
Se isDisabledByAdmin mudar, ativa/desativa a conta de autenticação e notifica o provedor.
Reindexa o provedor no serviço de busca (simulado por searchService.indexProvider) para que as informações estejam atualizadas para clientes que buscam por provedores.
4.4. Agendamentos
Este módulo gerencia a criação, status e interações relacionadas aos agendamentos de serviços.

functions/src/bookings/functions.ts (substitui http.ts e callable.ts em bookings/):
createBooking (HTTP Endpoint POST /bookings):
Chamada: Pelo cliente na tela app/(client)/bookings/schedule-service.tsx para solicitar um novo agendamento.
Lógica: Valida os dados da requisição (usando Zod), busca informações do serviço oferecido, cria um novo documento na coleção bookings com status inicial "pending_provider_confirmation" e paymentStatus "pending_payment".
Integração Frontend: O app/(client)/bookings/api/bookingService.ts chamaria este endpoint.
getBookings (HTTP Endpoint GET /bookings/client, GET /bookings/provider):
Chamada: Pelas telas de listagem de agendamentos (app/(client)/bookings/index.tsx, app/(provider)/schedule/index.tsx).
Lógica: Busca agendamentos no Firestore com base no clientId ou providerId e retorna os dados.
getBookingDetails (HTTP Endpoint GET /bookings/:bookingId):
Chamada: Pelas telas de detalhes de agendamento (app/(client)/bookings/[bookingId].tsx).
Lógica: Busca um agendamento específico e verifica permissões de acesso.
updateBookingStatus (HTTP Endpoint PATCH /bookings/:bookingId/status ou Callable Function):
Chamada: Tanto pelo cliente (para cancelar) quanto pelo prestador (para confirmar, cancelar, marcar como em andamento/concluído) a partir das telas de detalhes do agendamento.
Lógica: Valida permissões e a transição de status (ex: um agendamento completed não pode ser confirmed_by_provider). Atualiza o status do agendamento no Firestore. Se for uma Callable Function, adiciona validação de CallableContext e db.runTransaction para atomicidade.
requestBookingReschedule (Callable Function):
Chamada: Por cliente ou provedor para solicitar um reagendamento.
Lógica: Cria um novo documento na coleção rescheduleRequests com a nova data/hora proposta e motivo. Atualiza o status do agendamento para "reschedule_requested" e armazena o ID da solicitação de reagendamento.
acceptBookingReschedule (Callable Function):
Chamada: Apenas pelo provedor para aceitar uma solicitação de reagendamento.
Lógica: Atualiza o scheduledDateTime do agendamento para a data/hora proposta na solicitação de reagendamento. Atualiza o status da solicitação de reagendamento para "accepted" e remove o rescheduleRequestId do booking.
functions/src/bookings/triggers.ts:
onBookingCreatedSendNotifications (Firestore Trigger onCreate em bookings/{bookingId}):
Disparador: Criação de um novo documento booking.
Lógica: Envia uma notificação push para o provedor sobre a nova solicitação de agendamento.
onBookingUpdateSendNotifications (Firestore Trigger onUpdate em bookings/{bookingId}):
Disparador: Atualização de um documento booking.
Lógica: Envia notificações push para o cliente e/ou prestador sobre a mudança de status do agendamento (confirmado, cancelado, em andamento, concluído, reagendamento solicitado) ou mudança no status de pagamento.
4.5. Pagamentos e Comissões
Este módulo gerencia o processamento de pagamentos, webhooks e repasses para os prestadores.

functions/src/payments/functions.ts (substitui http.ts e callable.ts em payments/):
createPixCharge (HTTP Endpoint POST /payments/create-pix-charge):
Chamada: Pelo frontend do cliente (app/(client)/bookings/schedule-service.tsx ou tela de pagamento) quando ele precisa pagar por um serviço agendado.
Lógica: Autentica o usuário, valida o amountInCents e bookingId. Chama o serviço de gateway de pagamento para gerar um QR Code/Copia e Cola PIX junto ao PSP. Atualiza o booking com os dados da cobrança PIX e o paymentStatus para "awaiting_payment_confirmation".
Integração Frontend: A tela de pagamento no frontend exibe o PIX gerado.
pixWebhook (HTTP Endpoint POST /payments/pix-webhook):
Chamada: Pelo Provedor de Serviço de Pagamento (PSP) PIX quando um evento de pagamento ocorre (ex: pagamento confirmado).
Lógica: Crucial para segurança, valida a assinatura do webhook (validatePixWebhookSignature - atualmente mockado, mas deve ser real em produção). Se a assinatura é válida e o pagamento foi confirmado, chama handlePixWebhook para processar a lógica de negócio (atualizar status do booking, saldo do provedor).
requestProviderPayout (Callable Function):
Chamada: Pelo prestador em sua tela de ganhos/financeiro (app/(provider)/earnings.tsx) para solicitar um saque.
Lógica: Verifica o saldo pendente do provedor, o valor mínimo de saque e se a chave PIX está configurada. Cria um registro da solicitação de repasse (payoutRequests) com status "pending_approval". Decrementa o saldo pendente do provedor imediatamente.
getMyPaymentHistory (Callable Function):
Chamada: Pelas telas de histórico financeiro do cliente ou prestador.
Lógica: Busca e formata o histórico de transações (bookings com status "finalized", payoutRequests) para o usuário autenticado, retornando uma lista de PaymentHistoryItem.
retryBookingPayment (Callable Function):
Chamada: Pelo cliente se um pagamento anterior falhou ou expirou.
Lógica: Verifica o status do agendamento. Se o pagamento puder ser refeito, gera uma nova cobrança PIX (createPixCharge) e atualiza o booking com os novos dados do PIX.
functions/src/payments/triggers.ts:
onBookingFinalizedProcessPayment (Firestore Trigger onUpdate em bookings/{bookingId}):
Disparador: Quando um booking é atualizado e seu status se torna "finalized" E paymentStatus é "paid".
Lógica: Calcula a comissão do LimpeJá e os ganhos do prestador. Atualiza esses valores no documento booking. Atualiza o pendingBalance e totalEarnedHistorical no providerProfile. Envia notificação push para o provedor sobre os ganhos. Tenta iniciar o repasse automático para o provedor se a chave PIX estiver configurada, chamando processPixPayout. Se o repasse falhar ou não for possível (ex: PIX não configurado), marca o booking com um status de erro ou payout_manual_required.
functions/src/dal/firestore.ts (para paymentGateway.service.ts do original functions/src/services/):
Propósito: Esta lógica agora reside no payments/service.ts e interage com o PSP através de um serviço específico.
createPixCharge: Cria uma cobrança PIX no PSP.
validatePixWebhookSignature: CRÍTICO para validar a autenticidade dos webhooks do PSP (atualmente mockado, mas deve ser real em produção).
handlePixWebhook: Processa o payload do webhook do PSP, atualizando o status do booking para "paid" e o saldo do provedor.
processPixPayout: Inicia um repasse PIX para a conta de um provedor no PSP.
Integração Frontend: Indireta. As funções Callable e HTTP do backend (functions/src/payments/functions.ts) chamam este serviço para interagir com o PSP.
4.6. Avaliações
Este módulo gerencia a submissão e o processamento de avaliações de serviços e profissionais.

functions/src/reviews/functions.ts (substitui callable.ts em reviews/):
submitReview (Callable Function):
Chamada: Pelo cliente (ou prestador, se houver avaliação mútua) na tela de feedback (app/(common)/feedback/[targetId].tsx).
Lógica: Valida a avaliação (rating, bookingId). Determina o revieweeId (quem está sendo avaliado) e revieweeRole com base no bookingId e reviewerId. Verifica se o agendamento está em um status que permite avaliação (completed ou finalized) e se o usuário já avaliou. Salva a avaliação na coleção reviews e atualiza o booking com o clientReviewId ou providerReviewId.
functions/src/reviews/triggers.ts:
onReviewCreatedUpdateProviderRating (Firestore Trigger onCreate em reviews/{reviewId}):
Disparador: Criação de um novo documento review.
Lógica: Se a avaliação for para um provedor (revieweeRole === "provider"), recalcula e atualiza averageRating e totalReviews no providerProfile correspondente. Utiliza db.runTransaction para garantir atomicidade.
Integração Frontend: O perfil do prestador e os resultados da busca mostrarão a avaliação atualizada.
4.7. Notificações
Este módulo é responsável por enviar e gerenciar notificações push e armazenar um histórico de notificações no Firestore.

functions/src/notifications/service.ts (substitui functions/src/services/notification.service.ts):
Propósito: Serviço centralizado para envio de notificações push via FCM e gerenciamento de tokens FCM.
Funcionalidade:
getUserFcmTokens: Busca os tokens FCM de um usuário específico na coleção users.
sendPushNotification: Envia notificações push para um ou múltiplos tokens FCM. Permite salvar a notificação no Firestore para um histórico.
Integração Frontend: Indireta. Outras funções Callable/HTTP/Triggers do backend chamam este serviço.
functions/src/notifications/triggers.ts:
sendBookingReminderMaybe (Firestore Trigger onUpdate em bookings/{bookingId}):
Disparador: Atualização de um documento booking.
Lógica: Verifica se um agendamento confirmado está próximo (ex: 24-25 horas antes) e se um lembrete já não foi enviado. Se as condições forem atendidas, envia notificações de lembrete para o cliente e o provedor, e marca o booking como reminderSent: true.
onNewReviewForProvider (Firestore Trigger onCreate em reviews/{reviewId}):
Disparador: Criação de um novo documento review.
Lógica: Se a avaliação for para um provedor, envia uma notificação push para o provedor informando sobre a nova avaliação.
functions/src/notifications/functions.ts (substitui callable.ts em notifications/):
markNotificationsAsRead (Callable Function):
Chamada: Pelo frontend (app/(common)/notifications.tsx) para marcar notificações como lidas.
Lógica: Permite marcar notificações específicas por ID, todas as não lidas, ou todas as notificações até um determinado timestamp.
getNotificationsHistory (Callable Function):
Chamada: Pelo frontend (app/(common)/notifications.tsx) para buscar o histórico de notificações de um usuário.
Lógica: Busca notificações na coleção userNotifications para o usuário autenticado, com opções de paginação (limit, startAfterId).
4.8. Chat
Este módulo lida com a lógica de backend para o sistema de chat.

functions/src/chat/triggers.ts:
onNewChatMessage (Firestore Trigger onCreate em chats/{chatId}/messages/{messageId}):
Disparador: Criação de um novo documento de mensagem em uma subcoleção messages de um chat.
Lógica: Atualiza o documento pai do chat (chats/{chatId}) com os detalhes da última mensagem (lastMessageText, lastMessageTimestamp, lastMessageSenderId). Incrementa a contagem de mensagens não lidas para o destinatário e envia uma notificação push para o destinatário sobre a nova mensagem.
4.9. Administração
Este módulo contém funções para ações administrativas que podem ser invocadas por um painel de administração (não fornecido, mas implicitamente necessário).

functions/src/admin/functions.ts (substitui callable.ts em admin/):
setProviderVerificationStatus (Callable Function):
Chamada: Por um painel de administração.
Lógica: Atualiza o status isVerified do ProviderProfile e o updatedAt. A função onProviderProfileWrite (providers/triggers.ts) lida com as notificações e reindexação.
setUserDisabledStatus (Callable Function):
Chamada: Por um painel de administração.
Lógica: Desativa/ativa a conta de autenticação do usuário no Firebase Auth (admin.auth().updateUser()) e atualiza o campo isDisabled no UserProfile no Firestore.
getPlatformAnalytics (Callable Function):
Chamada: Por um painel de administração.
Lógica: Coleta métricas básicas da plataforma (ex: total de usuários, provedores, agendamentos) contando documentos nas coleções do Firestore.
5. Variáveis de Ambiente e Configuração
functions/src/config/environment.ts:
Propósito: Centraliza o acesso a variáveis de ambiente sensíveis.
Configuração: As variáveis são definidas usando firebase functions:config:set, por exemplo:
Bash

firebase functions:config:set pix_provider.apikey="SUA_CHAVE_API"
firebase functions:config:set pix_provider.secret="SEU_SEGREDO"
firebase functions:config:set pix_provider.base_url="https://api.seu-psp.com/v1"
firebase functions:config:set pix_provider.webhook_secret="SEU_WEBHOOK_SECRET"
Uso: As funções acessam essas variáveis através do objeto environment.
functions/src/common/utils.ts (substitui functions/src/utils/helpers.ts):
Propósito: Contém funções utilitárias para validação de autenticação e roles, e formatação de datas.
Funcionalidade:
assertAuthenticated: Garante que uma função Callable foi chamada por um usuário autenticado.
assertRole: Verifica se o usuário autenticado possui um ou mais roles esperados (obtidos dos Custom Claims do Firebase Auth).
formatDate: Formata objetos Date, string ou admin.firestore.Timestamp para um formato legível, com opções de localização (pt-BR).
functions/src/common/validators.ts (substitui functions/src/utils/validators.ts):
Propósito: Define esquemas de validação de dados usando a biblioteca Zod.
Funcionalidade: Contém esquemas para validação de campos comuns (e-mail, senha, CPF, telefone, CEP, datas) e esquemas mais complexos para dados de registro de usuário, atualização de perfil, serviços oferecidos e criação de agendamentos. Inclui um customErrorMap para mensagens de erro em português.
Uso: As funções Callable e HTTP utilizam validateDataWithSchema ou tryValidateDataWithSchema para garantir que os dados de entrada estejam corretos antes de processá-los.
6. Tipos (functions/src/types/)
A pasta types/ centraliza todas as definições de interface e tipo TypeScript utilizadas em todo o backend, garantindo consistência e segurança de tipo.

index.ts: Re-exporta todos os tipos definidos nos outros arquivos da pasta types/, facilitando a importação em outras partes do código (import { TypeName } from "../types";).
user.types.ts: Define UserRole ("client", "provider", "admin") e interfaces para UserProfile (incluindo campos como fcmTokens, isProviderVerified, isDisabledByAdmin) e UserAddress.
provider.types.ts: Define interfaces para OfferedService (serviços que um provedor oferece), DailyAvailability, BlockedDate, BankAccountDetails, e ProviderProfile (estendendo UserProfile com campos específicos de provedor como bio, servicesOffered, averageRating, pendingBalance, location).
booking.types.ts: Define BookingStatus, PaymentStatus, BookedServiceSnapshot, Booking (estrutura completa de um agendamento), BookingRequestData (dados para criar um agendamento) e RescheduleRequest (para solicitações de reagendamento).
service.types.ts: Atualmente re-exporta OfferedService de provider.types.ts, sugerindo que o catálogo de serviços da plataforma e os serviços oferecidos pelos provedores compartilham a mesma estrutura.
review.types.ts: Define a interface Review para avaliações de serviços/provedores, incluindo reviewerId, revieweeId, rating, comment, etc.
notification.types.ts: Define NotificationType (tipos específicos de notificação), NotificationPayload (estrutura do payload para envio de push) e StoredNotification (como as notificações são salvas no Firestore).
payment.types.ts: Define PaymentHistoryItem para o histórico financeiro de usuários.
chat.types.ts: Define ChatMessage e ChatRoom para a estrutura de dados do sistema de chat.
