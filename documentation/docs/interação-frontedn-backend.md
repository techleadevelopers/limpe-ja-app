🤝 Interação Frontend-Backend: O Coração do LimpeJá
Este documento detalha a lógica exata de comunicação e fluxo de dados entre o frontend (aplicativo móvel Expo/React Native) e o backend (Firebase Cloud Functions) do LimpeJá. Ele explica como as ações do usuário no frontend são traduzidas em operações seguras e escaláveis ​​no backend, e como os dados são sincronizados entre as duas camadas.

1. Visão Geral da Conexão
O frontend do LimpeJá, construído com React Native e Expo Router v5 , se comunica diretamente com o backend baseado em Firebase Cloud Functions . Esta arquitetura serverless garante escalabilidade, segurança e modularidade por domínio de negócio.

Tipos de Comunicação
O frontend realiza chamadas ao backend utilizando dois mecanismos principais:

Funções HTTP : Requisições HTTP(S) padrão (GET, POST, PATCH, etc.) para endpoints expostos pelas Cloud Functions. São ideais para APIs RESTful, webhooks e integrações com serviços externos (ex: gateways de pagamento).
Funções Callable : Funções invocadas diretamente pelo SDK do Firebase no cliente. Oferecem uma interface mais simples e segura para operações que se beneficiam da autenticação Firebase integrada e de um payload de dados tipado.
A autenticação é gerenciada principalmente pelo Firebase Authentication , tanto no cliente (via SDK firebase/auth) quanto no servidor (via firebase-adminSDK). As operações são protegidas por validação de Custom Claims , middlewares ( checkIfAuthenticated) e validação de dados com Zod .

2. Mapeamento de Fluxos e Interações
Esta seção detalha como as principais funcionalidades do frontend interagem com os módulos e funções correspondentes no backend.

2.1. Autenticação e Gerenciamento de Usuários
Este fluxo abrange o registro, login, recuperação de senha e atualização de dados de perfil.

Frontend (Arquivo/Componente)	Ação do Usuário	Backend (Módulo/Função)	Tipo de Chamada	Detalhes da Interação
app/(auth)/login.tsx	Login de usuário	functions/src/auth/functions.ts( loginUser)	Chamavel	O useAuth( hooks/useAuth.ts) invoca authService.login( app/(auth)/api/authService.ts), que por sua vez chama a função loginUserno backend.
app/(auth)/client-register.tsx	Cadastro de cliente	functions/src/auth/functions.ts( createUser)	Chamavel	authService.register( app/(auth)/api/authService.ts) chama a função createUserno backend.
app/(auth)/provider-register/personal-details.tsx	Cadastro de profissionais (Etapa 2 - Endereço)	functions/src/auth/functions.ts( addUserAddress)	Chamavel	Após busca de CEP (via ViaCEP API), addressService.ts( app/(auth)/api/addressService.ts) chama addUserAddresspara salvar o endereço.
app/(auth)/provider-register/service-details.tsx	Cadastro de profissional (Etapa 3 - Finalização)	functions/src/providers/functions.ts( submitProviderRegistration)	Chamavel	O ProviderRegistrationContext( contexts/ProviderRegistrationContext.tsx) agrega os dados e chama submitProviderRegistration.
app/(client)/profile/edit.tsx	Atualização de perfil (cliente)	functions/src/auth/functions.ts( updateUserProfile)	Chamavel	profileService.updateProfile( app/(client)/profile/api/profileService.ts) chama updateUserProfile.
app/(auth)/forgot-password.tsx	Recuperação de senha	firebase/auth(SDK)	Direta (SDK do cliente)	O frontend invoca firebase.auth().sendPasswordResetEmaildiretamente.
app/_layout.tsx,app/index.tsx	Verificação de sessão/função	functions/src/auth/functions.ts( checkAuthStatus)	HTTP (OBTER)	useAuth( hooks/useAuth.ts) chama checkAuthStatuspara validar o token e obter a função do usuário.
N/A (Gatilho de backend)	Novo usuário criado	functions/src/auth/triggers.ts( processNewUser)	Gatilho (Aut.)	Disparado pela criação de usuário via Firebase Auth SDK, cria perfil no Firestore e define Custom Claims.
N/A (Gatilho de backend)	Perfil do usuário atualizado	functions/src/users/triggers.ts( onUserProfileUpdate)	Gatilho (Firestore)	Realiza desnormalização de dados (ex: nome, avatar) em outras coleções (ex: providerProfiles, bookings).
2.2. Agendamentos
Este fluxo gerencia a criação, visualização, atualização e cancelamento de agendamentos de serviços.

Frontend (Arquivo/Componente)	Ação do Usuário	Backend (Módulo/Função)	Tipo de Chamada	Detalhes da Interação
app/(client)/explore/[providerId].tsx,app/(client)/bookings/schedule-service.tsx	Seleção de profissionais/serviços e horários	functions/src/providers/functions.ts( getProviderProfile), functions/src/providers/functions.ts( getProviderAvailability)	Chamavel	providerService.getProfilee schedulingService.getAvailableSlots( app/(client)/bookings/api/schedulingService.ts) busca detalhes do provedor e seus horários.
app/(client)/bookings/schedule-service.tsx	Confirmar nova agendamento	functions/src/bookings/functions.ts( createBooking)	HTTP (POST)	bookingService.createBooking( app/(client)/bookings/api/bookingService.ts) envia os dados do agendamento.
app/(client)/bookings/index.tsx	Listar agendamentos do cliente	functions/src/bookings/functions.ts( getBookings)	HTTP (OBTER)	bookingService.getClientBookingsbuscar os agendamentos.
app/(provider)/schedule/index.tsx,app/(provider)/services/index.tsx	Listar agendamentos do provedor	functions/src/bookings/functions.ts( getBookings)	HTTP (OBTER)	bookingService.getProviderBookingsbuscar os agendamentos.
app/(client)/bookings/[bookingId].tsx,app/(provider)/services/[serviceId].tsx	Ver detalhes do agendamento	functions/src/bookings/functions.ts( getBookingDetails)	HTTP (OBTER)	bookingService.getBookingDetailsprocure os detalhes.
app/(client)/bookings/[bookingId].tsx,app/(provider)/services/[serviceId].tsx	Cancelar/Aceitar/Marcar como Concluído	functions/src/bookings/functions.ts( updateBookingStatus)	HTTP (PATCH) ou Callable	bookingService.updateStatusenvie uma atualização de status.
app/(client)/bookings/[bookingId].tsx	Solicitar reagendamento	functions/src/bookings/functions.ts( requestBookingReschedule)	Chamavel	O cliente solicita um novo horário.
app/(provider)/schedule/manage-availability.tsx	Gerenciar disponibilidade semanal	functions/src/providers/functions.ts( updateWeeklyAvailability)	Chamavel	O provedor atualiza seus blocos de horários disponíveis.
app/(provider)/schedule/manage-availability.tsx	Bloquear dados específicos	functions/src/providers/functions.ts( updateBlockedDates)	Chamavel	O provedor define períodos de indisponibilidade.
N/A (Gatilho de backend)	Agendamento criado	functions/src/bookings/triggers.ts( onBookingCreatedSendNotifications)	Gatilho (Firestore)	Envia notificação push ao provedor sobre nova solicitação.
N/A (Gatilho de backend)	Agendamento atualizado	functions/src/bookings/triggers.ts( onBookingUpdateSendNotifications)	Gatilho (Firestore)	Envia notificações push para cliente/provedor sobre mudança de status.
2.3. Pagamentos e Ganhos
Este fluxo gerencia o processamento de pagamentos de clientes e os saques de ganhos por provedores.

Frontend (Arquivo/Componente)	Ação do Usuário	Backend (Módulo/Função)	Tipo de Chamada	Detalhes da Interação
app/(client)/bookings/schedule-service.tsx	Pagar via PIX	functions/src/payments/functions.ts( createPixCharge)	HTTP (POST)	schedulingService.createPixCharge( app/(client)/bookings/api/schedulingService.ts) solicitar a geração de uma cobrança PIX.
app/(provider)/earnings.tsx	Solicitar saque de ganhos	functions/src/payments/functions.ts( requestProviderPayout)	Chamavel	O provedor inicia o processo de saque do seu saldo.
app/(provider)/earnings.tsx	Ver histórico de ganhos	functions/src/payments/functions.ts( getMyPaymentHistory)	Chamavel	O provedor de consulta suas transações financeiras.
N/A (Webhook de back-end)	Confirmação de pagamento PIX	functions/src/payments/functions.ts( pixWebhook)	HTTP (POST)	Webhook do PSP notifica o backend sobre o pagamento.
N/A (Gatilho de backend)	Agendamento finalizado/pago	functions/src/payments/triggers.ts( onBookingFinalizedProcessPayment)	Gatilho (Firestore)	Calcula comissão, atualiza saldo do provedor e pode iniciar repasse automático.
2.4. Chat e Mensagens
Este fluxo permite a comunicação direta entre clientes e profissionais.

Frontend (Arquivo/Componente)	Ação do Usuário	Backend (Módulo/Função)	Tipo de Chamada	Detalhes da Interação
app/(client)/messages/index.tsx,app/(provider)/messages/index.tsx	Listar conversas	functions/src/chat/functions.ts( getChatRooms)	Chamavel	chatService.getConversations( app/(client)/messages/api/chatService.tsou similar no provedor) busca as salas de chat.
app/(client)/messages/[chatId].tsx,app/(provider)/messages/[chatId].tsx	Enviar mensagem	functions/src/chat/functions.ts( sendMessage)	Chamavel	chatService.sendMessageenvia a mensagem.
app/(client)/messages/[chatId].tsx,app/(provider)/messages/[chatId].tsx	Ver histórico de mensagens	functions/src/chat/functions.ts( getMessages)	Ouvintes Callable ou Firestore	chatService.getMessagesbusca o histórico. Você pode usar ouvintes em tempo real para novas mensagens.
N/A (Gatilho de backend)	Nova mensagem no chat	functions/src/chat/triggers.ts( onNewChatMessage)	Gatilho (Firestore)	Atualiza o chat pai (última mensagem, não lida) e envia notificação push ao destinatário.
2.5. Avaliações e Feedback
Este fluxo permite que os clientes avaliem serviços e profissionais.

Frontend (Arquivo/Componente)	Ação do Usuário	Backend (Módulo/Função)	Tipo de Chamada	Detalhes da Interação
app/(common)/feedback/[targetId].tsx	Enviar avaliação/feedback	functions/src/reviews/functions.ts( submitReview)	Chamavel	feedbackService.submitFeedback( app/(common)/api/feedbackService.ts) envia para avaliação.
N/A (Gatilho de backend)	Nova avaliação incluída	functions/src/reviews/triggers.ts( onReviewCreatedUpdateProviderRating)	Gatilho (Firestore)	Recalcula e atualiza a avaliação média e total de avaliações do provedor.
2.6. Notificações
Este fluxo gerencia a coleta e o histórico de notificações.

Frontend (Arquivo/Componente)	Ação do Usuário	Backend (Módulo/Função)	Tipo de Chamada	Detalhes da Interação
app/(common)/notifications.tsx	Listar histórico de notificações	functions/src/notifications/functions.ts( getNotificationsHistory)	Chamavel	notificationService.getHistory( app/(common)/api/notificationService.ts) busca as notificações.
app/(common)/notifications.tsx	Marcar notificações como lidas	functions/src/notifications/functions.ts( markNotificationsAsRead)	Chamavel	notificationService.markAsReadenvia a solicitação.
N/A (Gatilho de backend)	Lembrete de agendamento	functions/src/notifications/triggers.ts( sendBookingReminderMaybe)	Gatilho (Firestore)	Envia notificação push para cliente/provedor sobre agendamento próximo.
N/A (Gatilho de backend)	Nova avaliação para provedor	functions/src/notifications/triggers.ts( onNewReviewForProvider)	Gatilho (Firestore)	Envia notificação push para o provedor.
N/A (Serviço de Backend)	Envio de notificações push	functions/src/notifications/service.ts( sendPushNotification)	Estagiário (Backend)	Chamado por outras funções/triggers do backend para enviar notificações via FCM.
3. Segurança e Validações na Interação
A é um pilar fundamental na comunicação entre frontend e backend.

Autenticação e Autorização : Todas as funções Callable e endpoints HTTP protegidos no backend utilizam:
assertAuthenticated: Garante que a requisição vem de um usuário autenticado.
assertRole: Verifique se o usuário autenticado possui o role(cliente, provedor, admin) necessário para executar a ação.
Essas validações são inovadoras em functions/src/common/utils.ts.
Validação de Dados : Os dados são validados rigorosamente em ambos os lados:
Frontend : Validação inicial (ex: useFormValidation, regex) para feedback imediato ao usuário.
Backend : Validação de esquema com Zod ( functions/src/common/validators.ts) para todas as entradas de funções Callable e HTTP, garantindo a integridade dos dados antes do processamento e armazenamento no Firestore.
Tipos Compartilhados : A pasta types/na raiz do frontend e functions/src/types/no backend contém definições de interface TypeScript idênticas. Isso garante type-safetye consistência dos dados que trafegam entre as camadas, funcionando como um contrato de API formal e autodocumentado.
Tokens FCM : Tokens de Firebase Cloud Messaging são armazenados e usados ​​para o envio de notificações push em tempo real, garantindo que as mensagens cheguem aos dispositivos corretos.
4. Fluxo de Dados Típico (Exemplo: Agendamento e Pagamento)
Para ilustrar a sinergia, considere o fluxo de um cliente agendando e pagando por um serviço:

Frontend (Cliente - app/(client)/bookings/schedule-service.tsx) :
O usuário seleciona um provedor, dados e localização.
Ao clicar em "Agendar Serviço", a função handleConfirmBookingé acionada.
Esta função chama bookingService.createBooking( app/(client)/bookings/api/bookingService.ts).
Front-end ( bookingService.ts) :
createBookingmonta o objeto de dados do agendamento ( BookingRequestData).
Faz uma requisição HTTP POST para o endpoint /bookingsda Cloud Function ( https://sua-regiao-seuprojeto.cloudfunctions.net/api/v1/bookings).
O Firebase ID Tokenusuário foi enviado no cabeçalho da requisição de autenticação.
Backend (Função em Nuvem - functions/src/bookings/functions.ts- createBooking) :
Uma função do Cloud recebe uma requisição.
O middleware checkIfAuthenticatedvalida o token do usuário.
Os dados são validados com o esquema Zod.
A lógica de negócio verifica a disponibilidade do provedor ( functions/src/providers/service.ts).
Um novo documento foi criado na coleção bookingsdo Firestore com status "pending_provider_confirmation" e paymentStatus"pending_payment".
A função retorna uma resposta de sucesso para o frontend.
Frontend ( schedule-service.tsxe bookingService.ts) :
Receba uma resposta de sucesso.
Chama schedulingService.createPixCharge( app/(client)/bookings/api/schedulingService.ts).
Front-end ( schedulingService.ts) :
createPixChargemonta o payload para cobrança PIX.
Faz uma requisição HTTP POST para o endpoint /payments/create-pix-charge( https://sua-regiao-seuprojeto.cloudfunctions.net/api/v1/payments/create-pix-charge).
Backend (Função em Nuvem - functions/src/payments/functions.ts- createPixCharge) :
Receber uma requisição.
Valida os dados e o bookingId.
Chama o serviço de gateway de pagamento (simulado em functions/src/payments/service.ts) para gerar um QR Code/Cópia e Cola PIX.
Atualiza o documento do bookingFirestore com os dados de cobrança PIX e o paymentStatuspara "awaiting_payment_confirmation".
Retorna os dados do PIX (QR Code, Copia e Cola) para o frontend.
Front-end ( schedule-service.tsx) :
Exibe o QR Code PIX e a chave Copia e Cola para o cliente.
Backend (Função em Nuvem - functions/src/payments/functions.ts- pixWebhook) :
Após o cliente realizar o pagamento via seu banco, o Provedor de Serviço de Pagamento (PSP) PIX envia um webhook HTTP POST para este endpoint.
A função pixWebhookvalida a assinatura do webhook para garantir a proteção.
Se for válido, handlePixWebhooké chamado para atualizar ou fazer paymentStatuspara booking"pago" no Firestore e pode acionar outras lógicas (ex: notificação para o provedor).
Backend (Função em Nuvem - functions/src/payments/triggers.ts- onBookingFinalizedProcessPayment) :
Disparado por uma atualização no bookingFirestore (status "finalizado" e paymentStatus"pago").
Calcule a comissão do LimpeJá e os ganhos do provedor.
Atualiza ou pendingBalancenão totalEarnedHistoricaldo providerProfileprovedor.
Envia uma notificação push para o provedor sobre os ganhos.
Este exemplo demonstra o uso combinado de chamadas HTTP, funções Callable, SDKs do Firebase e Triggers do Firestore para criar um fluxo de negócio completo e seguro.