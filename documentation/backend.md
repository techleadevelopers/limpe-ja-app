Com certeza! Enquanto o Firebase instala, posso criar uma documentação detalhada (em formato Markdown, como um README_BACKEND.md ou uma seção para o seu README principal) sobre o backend que esboçamos e como o frontend precisará se integrar a ele.

Esta documentação será baseada na estrutura de Cloud Functions com Firebase que planejamos.

Documentação do Backend LimpeJá (Firebase Cloud Functions)
Este documento descreve a arquitetura e os módulos principais do backend do LimpeJá, construído com Firebase Cloud Functions, e como o frontend (Expo/React Native) se integra a ele.

1. Visão Geral da Arquitetura
O backend do LimpeJá utiliza uma abordagem serverless com Firebase Cloud Functions para a lógica de negócios e APIs, Cloud Firestore como banco de dados NoSQL principal, Firebase Authentication para gerenciamento de usuários, e Firebase Storage para armazenamento de arquivos (como fotos de perfil).

Principais Vantagens desta Abordagem:

Escalabilidade: Os serviços Firebase são projetados para escalar automaticamente.
Desenvolvimento Ágil: Muitos recursos prontos (autenticação, banco de dados em tempo real) aceleram o desenvolvimento.
Custo-Benefício: Modelo de precificação baseado no uso, geralmente vantajoso para startups.
Integração com Frontend: SDKs cliente do Firebase facilitam a comunicação.
2. Tecnologias Utilizadas (Backend)
Firebase Cloud Functions (Node.js com TypeScript): Para toda a lógica de backend.
Firebase Authentication: Para registro, login e gerenciamento de sessão de usuários (clientes e prestadores).
Cloud Firestore: Banco de dados NoSQL para armazenar perfis de usuários, detalhes de serviços, agendamentos, avaliações, chats, etc.
Firebase Storage: Para armazenar imagens (fotos de perfil, fotos de serviços, documentos de verificação).
Firebase Cloud Messaging (FCM): Para enviar notificações push.
(Gateway de Pagamento Externo para PIX): Um Provedor de Serviço de Pagamento (PSP) brasileiro com API PIX, integrado através de Cloud Functions.
3. Estrutura de Pastas do Backend (functions/)
functions/
├── src/                  # Código fonte TypeScript
│   ├── index.ts          # Ponto de entrada principal, exporta todas as functions
│   ├── auth/             # Autenticação customizada (triggers, http se necessário)
│   │   ├── triggers.ts
│   │   └── http.ts       # (Opcional, se SDK cliente não for suficiente)
│   ├── users/            # Gerenciamento de perfis de usuário (callable, triggers)
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── providers/        # Lógica de prestadores (callable, triggers)
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── bookings/         # Lógica de agendamentos (http, callable, triggers)
│   │   ├── http.ts
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── payments/         # Pagamentos e comissões (http, callable, triggers)
│   │   ├── http.ts
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── reviews/          # Avaliações (callable, triggers)
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── notifications/    # Lógica de notificações (triggers, callable, utils)
│   │   ├── triggers.ts
│   │   ├── callable.ts
│   │   └── utils.ts
│   ├── chat/             # Lógica de backend para chat (triggers)
│   │   └── triggers.ts
│   ├── admin/            # Funções para o painel de administração (callable)
│   │   └── callable.ts
│   ├── services/         # Lógica de negócios compartilhada
│   │   ├── firestore.service.ts
│   │   ├── paymentGateway.service.ts
│   │   └── notification.service.ts
│   ├── types/            # Definições de tipo TypeScript para o backend
│   │   ├── index.ts      # Exporta todos os tipos
│   │   ├── user.types.ts
│   │   ├── provider.types.ts
│   │   ├── booking.types.ts
│   │   ├── service.types.ts
│   │   ├── review.types.ts
│   │   ├── notification.types.ts
│   │   └── payment.types.ts
│   ├── utils/            # Funções utilitárias (helpers, validators)
│   │   ├── helpers.ts
│   │   └── validators.ts
│   └── config/           # Configuração do Firebase Admin SDK e variáveis de ambiente
│       ├── firebaseAdmin.ts
│       └── environment.ts
├── lib/                  # Código JavaScript transpilado (ignorado pelo Git)
├── node_modules/
├── package.json
├── tsconfig.json
└── .eslintrc.js          # (Opcional)
(Arquivos como .firebaserc, firebase.json, firestore.rules, storage.rules ficam na raiz do projeto LimpeJá, fora da pasta functions/)

4. Módulos Principais do Backend e Integração com Frontend
4.1. Autenticação e Gerenciamento de Usuários (functions/src/auth/ e functions/src/users/)
Backend (Cloud Functions):
auth/triggers.ts -> processNewUser:
Disparador: Criação de um novo usuário no Firebase Authentication.
Lógica: Cria um documento correspondente na coleção users do Firestore com informações básicas (email, UID) e um role padrão (ex: "client"). Define Custom Claims no token do usuário (ex: { role: "client" }) para controle de acesso.
Integração Frontend: O frontend usa o SDK do Firebase (firebase/auth) para createUserWithEmailAndPassword ou login social. Este trigger age no backend em resposta.
auth/triggers.ts -> cleanupUser:
Disparador: Deleção de um usuário no Firebase Authentication.
Lógica: Deleta o documento correspondente em users e providerProfiles no Firestore, e outros dados relacionados (anonimizar agendamentos passados, etc.).
Integração Frontend: Se o usuário deletar a conta pelo app, o app chama uma função (Callable ou HTTP) que, por sua vez, deleta o usuário do Firebase Auth, disparando este trigger.
users/callable.ts -> updateUserProfile:
Chamada: O frontend (ex: tela profile/edit.tsx) chama esta função para atualizar dados como nome, telefone, avatarURL.
Lógica: Valida os dados, atualiza o documento do usuário em users no Firestore e também o perfil no Firebase Authentication (admin.auth().updateUser()). Se o avatar foi alterado, a URI local da imagem (enviada pelo frontend) precisaria ser primeiro carregada para o Firebase Storage (por esta função ou uma dedicada), e então a URL do Storage seria salva no perfil.
Integração Frontend: O AuthContext e o services/clientService.ts (ou providerService.ts) no frontend chamariam esta função.
users/callable.ts -> addUserAddress (e outras para gerenciar endereços):
Chamada: Tela de gerenciamento de endereços do cliente.
Lógica: Adiciona/edita/remove endereços na subcoleção addresses do perfil do usuário no Firestore.
users/triggers.ts -> onUserProfileUpdate:
Disparador: Atualização de um documento na coleção users.
Lógica: Denormaliza dados alterados (como name, avatarUrl) para outras coleções onde eles são referenciados (ex: providerProfiles, bookings, reviews, chats) para otimizar leituras no frontend.
Integração Frontend: Indireta. O frontend verá os dados atualizados em outras telas devido à denormalização.
4.2. Lógica de Prestadores (functions/src/providers/)
Backend (Cloud Functions):
providers/callable.ts -> submitProviderRegistration:
Chamada: Pelo frontend ao final do fluxo de cadastro de múltiplas etapas do prestador (provider-register/service-details.tsx).
Lógica: Recebe todos os dados coletados (pessoais, de serviço, disponibilidade), valida-os, cria/atualiza o documento em providerProfiles no Firestore, e atualiza o role do usuário para "provider" no documento users e nos Custom Claims do Firebase Auth. Pode iniciar um processo de verificação.
Integração Frontend: O Contexto de cadastro do prestador no frontend agregaria os dados e chamaria esta função.
providers/callable.ts -> updateOfferedServices, updateWeeklyAvailability, updateBlockedDates:
Chamada: Pelas telas de gerenciamento de perfil/agenda do prestador no frontend.
Lógica: Atualizam os respectivos campos no documento providerProfiles do prestador no Firestore.
providers/triggers.ts -> onProviderProfileWrite:
Disparador: Criação/Atualização de um providerProfiles.
Lógica: Pode enviar notificações para admins (novo prestador para aprovar), para o próprio prestador (perfil atualizado), ou atualizar dados agregados.
admin/callable.ts -> setProviderVerificationStatus:
Chamada: Por um painel de administração.
Lógica: Atualiza o status isVerified do ProviderProfile.
Integração Frontend (Prestador): O prestador veria seu status de verificação atualizado no perfil.
4.3. Agendamentos (functions/src/bookings/)
Backend (Cloud Functions):
bookings/http.ts -> POST / (ou uma Callable Function createBooking):
Chamada: Pelo cliente na tela schedule-service.tsx para solicitar um novo agendamento.
Lógica: Valida os dados (disponibilidade do prestador, dados do cliente), calcula preço inicial (se aplicável), cria um novo documento na coleção bookings com status inicial (ex: pending_provider_confirmation).
Integração Frontend: O services/clientService.ts chamaria este endpoint/função.
bookings/callable.ts -> updateBookingStatus:
Chamada: Tanto pelo cliente (para cancelar) quanto pelo prestador (para confirmar, cancelar, marcar como em andamento/concluído) a partir das telas de detalhes do agendamento.
Lógica: Valida permissões e a transição de status, atualiza o status do agendamento no Firestore.
bookings/triggers.ts -> onBookingCreatedSendNotifications, onBookingUpdateSendNotifications:
Disparador: Criação ou atualização de um documento booking.
Lógica: Envia notificações push para cliente e/ou prestador sobre o novo agendamento ou mudança de status.
Integração Frontend: Os usuários recebem as notificações e podem ser direcionados para a tela de detalhes do agendamento.
4.4. Pagamentos e Comissões (functions/src/payments/)
Backend (Cloud Functions):
payments/http.ts -> POST /create-pix-charge:
Chamada: Pelo frontend do cliente quando ele precisa pagar por um serviço agendado (pode ser no momento do agendamento ou depois, dependendo do seu fluxo).
Lógica: Interage com o paymentGateway.service.ts (que chama a API do PSP PIX) para gerar um QR Code/Copia e Cola PIX. Retorna esses dados para o frontend.
Integração Frontend: A tela de pagamento no frontend exibe o PIX.
payments/http.ts -> POST /pix-webhook:
Chamada: Pelo Provedor de Serviço de Pagamento (PSP) PIX quando um pagamento é confirmado.
Lógica: Valida o webhook. Se o pagamento foi confirmado, atualiza o paymentStatus do booking correspondente no Firestore para paid. Pode então chamar internamente a lógica de finalização (ou disparar o trigger onBookingFinalizedProcessPayment).
payments/triggers.ts -> onBookingFinalizedProcessPayment:
Disparador: Quando um booking é atualizado e seu status se torna finalized E paymentStatus é paid.
Lógica: Calcula a comissão do LimpeJá, calcula os ganhos do prestador, atualiza esses valores no documento booking. Atualiza o pendingBalance no providerProfile. (TODO: Inicia o processo de repasse real).
Integração Frontend: O prestador vê seu saldo atualizado e o cliente vê o agendamento como finalizado.
payments/callable.ts -> requestProviderPayout:
Chamada: Pelo prestador em sua tela de ganhos/financeiro para solicitar um saque.
Lógica: Verifica saldo, registra a solicitação, atualiza pendingBalance. Notifica admin.
payments/callable.ts -> getMyPaymentHistory:
Chamada: Pelas telas de histórico financeiro do cliente ou prestador.
Lógica: Busca e formata o histórico de transações.
payments/callable.ts -> retryBookingPayment:
Chamada: Pelo cliente se um pagamento anterior falhou.
Lógica: Tenta gerar uma nova cobrança PIX para o agendamento.
4.5. Avaliações (functions/src/reviews/)
Backend (Cloud Functions):
reviews/callable.ts -> submitReview:
Chamada: Pelo cliente (ou prestador, se houver avaliação mútua) na tela de feedback (app/(common)/feedback/[targetId].tsx).
Lógica: Valida a avaliação, salva na coleção reviews, e atualiza o booking com o clientReviewId ou providerReviewId.
reviews/triggers.ts -> onReviewCreatedUpdateProviderRating:
Disparador: Criação de uma nova review.
Lógica: Se a avaliação for para um prestador, recalcula e atualiza averageRating e totalReviews no providerProfile correspondente.
Integração Frontend: O perfil do prestador e os resultados da busca mostrarão a avaliação atualizada.
4.6. Notificações (functions/src/notifications/)
Backend (Cloud Functions):
notification.service.ts (em functions/src/services/): Contém as funções sendPushNotification e getUserFcmTokens.
notifications/triggers.ts: Contém triggers para enviar notificações em resposta a eventos específicos (ex: lembrete de agendamento, nova avaliação para prestador).
Integração Frontend: Usuários recebem notificações push. O notification.service.ts também salva as notificações no Firestore para um histórico na tela app/(common)/notifications.tsx.
notifications/callable.ts: Funções como markNotificationsAsRead, getNotificationsHistory.
Integração Frontend: A tela app/(common)/notifications.tsx chama essas funções para gerenciar o estado das notificações.
4.7. Chat (functions/src/chat/)
Backend (Cloud Functions):
chat/triggers.ts -> onNewChatMessage:
Disparador: Nova mensagem na subcoleção messages de um chat.
Lógica: Atualiza lastMessageText, lastMessageTimestamp, unreadCount no documento chat pai. Envia notificação push para o destinatário.
Integração Frontend: A tela app/(client)/messages/index.tsx (lista de conversas) e app/(client)/messages/[chatId].tsx (tela de chat) podem usar listeners do Firestore para atualizações em tempo real.
4.8. Administração (functions/src/admin/)
Backend (Cloud Functions):
admin/callable.ts -> setProviderVerificationStatus, setUserDisabledStatus, getPlatformAnalytics:
Chamada: Por um painel de administração frontend (separado ou parte do app com acesso restrito).
Lógica: Executa ações administrativas protegidas.
Integração Frontend (Admin): Um frontend de admin faria chamadas para estas funções.
5. Variáveis de Ambiente e Configuração (functions/src/config/)
firebaseAdmin.ts: Inicializa o firebase-admin SDK. O frontend não interage diretamente com este arquivo, mas ele é a base para todas as operações do backend com o Firebase.
environment.ts: Carrega configurações sensíveis (como chaves de API de gateways de pagamento, segredos de webhook) do ambiente de configuração do Firebase Functions (firebase functions:config:set ...).
Integração Frontend: Nenhuma direta. O frontend envia dados, e o backend usa essas chaves configuradas para interagir com serviços de terceiros de forma segura.