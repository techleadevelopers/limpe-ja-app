Documentação do Módulo services (LimpeJá App)

O módulo services no aplicativo LimpeJá atua como uma camada de abstração para a comunicação com o backend da aplicação. Ele encapsula a lógica de requisições HTTP, tratamento de erros comuns e manipulação de dados antes de serem consumidos pelos componentes da interface do usuário. Essa abordagem centraliza a lógica de acesso à API, promove a reutilização de código, facilita a manutenção e melhora a testabilidade.

Estrutura do Módulo services
stylus

Copiar
services/
├── aiSuggestionsService.ts
├── analyticsService.ts
├── api.ts
├── authService.ts
├── bookingService.ts
├── chatService.ts
├── clientService.ts
├── complianceService.ts
├── couponService.ts
├── dashboardService.ts
├── disputeService.ts
├── earningService.ts
├── faqService.ts
├── guaranteeService.ts
├── incentiveService.ts
├── locationService.ts
├── metricsService.ts
├── missionService.ts
├── notificationService.ts
├── offerService.ts
├── paymentService.ts
├── providerService.ts
├── rankingService.ts
├── referralService.ts
├── reviewService.ts
├── safetyService.ts
├── securityService.ts
├── subscriptionService.ts
├── supportService.ts
├── uploadService.ts
└── userService.ts
1. aiSuggestionsService.ts
Caminho: LimpeJaApp/app/services/aiSuggestionsService.ts

Propósito: Fornece funcionalidades para buscar sugestões inteligentes baseadas em IA e insights de clientes/mercado para provedores, auxiliando na tomada de decisões e otimização de serviços.

Funções/Métodos Chave:

AISuggestionsService.getSmartSuggestions(providerId: string): Busca sugestões personalizadas (preços, agendamento, melhoria de serviço) para um provedor.
AISuggestionsService.getCustomerInsights(providerId: string): Obtém insights detalhados sobre os clientes de um provedor (total, repetidos, avaliação média, serviços populares).
AISuggestionsService.getMarketTrends(): Recupera tendências de mercado relevantes (serviços em crescimento, sazonalidade, análise de concorrência).
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
2. analyticsService.ts
Caminho: LimpeJaApp/app/services/analyticsService.ts

Propósito: Oferece métodos para coletar e visualizar dados analíticos relacionados ao desempenho do provedor e insights de negócios.

Funções/Métodos Chave:

AnalyticsService.getPerformanceMetrics(providerId: string): Busca métricas de desempenho para um provedor (tempo de resposta, taxa de conclusão, satisfação do cliente).
AnalyticsService.getBusinessInsights(providerId: string, period: 'week' | 'month' | 'quarter'): Obtém insights de negócios para um provedor em um período específico (receita total, agendamentos, valor médio do trabalho).
AnalyticsService.trackEvent(event: string, properties?: Record<string, any>): Envia eventos de rastreamento para o backend.
AnalyticsService.getCompetitorAnalysis(location: string): Realiza uma análise da concorrência com base na localização.
AnalyticsService.generateReport(type: 'monthly' | 'quarterly', providerId: string): Gera relatórios analíticos para um provedor.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
3. api.ts
Caminho: LimpeJaApp/app/services/api.ts

Propósito: Configura e exporta a instância principal do Axios para todas as requisições HTTP na aplicação. Inclui interceptores para adicionar o token JWT automaticamente, tratar erros de autenticação (401/403) e exibir mensagens de erro genéricas via Toast.

Funções/Métodos Chave:

setUnauthorizedCallback(callback: () => Promise<void>): Permite que outros módulos (como AuthContext) registrem um callback para ser executado quando uma requisição retorna 401 (Não Autorizado), geralmente para forçar o logout.
Interceptor de Requisição: Adiciona o token auth_token do AsyncStorage ao cabeçalho Authorization de cada requisição.
Interceptor de Resposta:
Trata erros 401, acionando o onUnauthorizedCallback e exibindo um Toast.
Exibe mensagens de erro específicas para 404, 422, 409 e erros de servidor (5xx).
Exibe um Toast para erros de rede (sem resposta do servidor).
Dependências:

axios: Biblioteca para requisições HTTP.
@react-native-async-storage/async-storage: Para armazenar e recuperar o token JWT.
expo-constants: Para acessar variáveis de ambiente configuradas no app.config.ts.
react-native-toast-message: Para exibir mensagens de notificação.
../i18n: Para internacionalização das mensagens de erro.
4. authService.ts
Caminho: LimpeJaApp/services/authService.ts

Propósito: Gerencia todas as operações relacionadas à autenticação do usuário, incluindo login, logout, registro de clientes e provedores, e persistência dos dados de autenticação.

Funções/Métodos Chave:

AuthService.getInstance(): Retorna a instância singleton do serviço.
login(credentials): Autentica o usuário com email e senha, salvando os dados de autenticação.
logout(): Limpa os dados de autenticação do armazenamento e do Axios.
registerClient(userData): Registra um novo cliente e salva os dados de autenticação.
registerProvider(userData): Registra um novo provedor e salva os dados de autenticação.
sendPasswordReset(email): Solicita um link de redefinição de senha.
loadAuthData(): Carrega os dados de autenticação persistidos do AsyncStorage.
storeAuthData(authData): Salva os dados de autenticação no AsyncStorage.
setAuthToken(token): Define o token JWT no cabeçalho padrão do Axios.
getAuthToken(): Retorna o token JWT atual.
Dependências:

@react-native-async-storage/async-storage: Para persistência dos dados de autenticação.
./api: Para fazer requisições à API de autenticação.
./clientService: Para buscar o perfil completo do usuário após o registro/login.
5. bookingService.ts
Caminho: LimpeJaApp/app/services/bookingService.ts

Propósito: Lida com todas as operações relacionadas a agendamentos (bookings), como criação, recuperação de detalhes, atualização de status e cancelamento.

Funções/Métodos Chave:

createBooking(data): Cria um novo agendamento.
getBookingsForUser(status?: BookingStatus): Obtém a lista de agendamentos para o usuário logado, com opção de filtrar por status.
getBookingDetails(bookingId: string): Recupera os detalhes de um agendamento específico.
updateBookingStatus(bookingId: string, data): Atualiza o status de um agendamento.
cancelBooking(bookingId: string): Cancela um agendamento.
checkActiveChatBooking(clientId: string, providerId: string): Verifica se existe um agendamento ativo entre um cliente e um provedor, indicando se o chat pode ser iniciado.
checkConfirmedBookingBetweenUsers(clientId: string, providerId: string): Verifica se existe um agendamento confirmado entre dois usuários.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
6. chatService.ts
Caminho: LimpeJaApp/app/services/chatService.ts

Propósito: Gerencia as funcionalidades de chat, incluindo encontrar/criar conversas, obter histórico de mensagens e enviar novas mensagens.

Funções/Métodos Chave:

findOrCreateChat(providerId: string, clientId: string): Encontra um chat existente entre um provedor e um cliente ou cria um novo.
getChatMessages(chatId: string, query?: GetMessagesQuery): Obtém o histórico de mensagens para um chat específico, com opções de paginação.
sendMessage(messageData): Envia uma nova mensagem para um chat.
getChatListForUser(): Busca a lista de conversas do usuário logado.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
7. clientService.ts
Caminho: LimpeJaApp/app/services/clientService.ts

Propósito: Oferece funcionalidades específicas para a interface do cliente, como busca de serviços e provedores, gerenciamento de perfil, e interação com missões e recompensas.

Funções/Métodos Chave:

getServiceCategories(): Busca as categorias de serviço disponíveis.
searchProviders(query): Realiza uma busca geral por provedores.
searchProvidersWithLocation(params): Realiza uma busca de provedores baseada em localização.
getUserProfile(): Obtém o perfil do usuário logado (cliente ou provedor).
getOffers(): Obtém a lista de ofertas disponíveis.
getProviderOffers(providerId: string): Obtém as ofertas disponíveis para um provedor específico.
applyCoupon(bookingId: string, code: string): Aplica um cupom a um agendamento.
getProviderDetails(providerId: string): Obtém os detalhes de um provedor específico.
getProviderMetrics(providerId: string): Obtém as métricas de performance de um provedor.
updateClientProfile(data): Atualiza o perfil do cliente logado.
getClientMissions(): Obtém a lista de missões disponíveis para o cliente.
claimClientReward(missionId: string): Resgata a recompensa de uma missão concluída pelo cliente.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
8. complianceService.ts
Caminho: LimpeJaApp/app/services/complianceService.ts

Propósito: Gerencia as funcionalidades relacionadas à conformidade legal e regulatória para provedores e usuários, incluindo status de documentos, requisitos legais e privacidade de dados.

Funções/Métodos Chave:

ComplianceService.getComplianceStatus(providerId: string): Busca o status de conformidade de um provedor.
ComplianceService.getLegalRequirements(): Obtém uma lista de requisitos legais aplicáveis.
ComplianceService.uploadComplianceDocument(type: string, file): Envia documentos para fins de conformidade.
ComplianceService.getDataPrivacyInfo(): Retorna informações sobre privacidade de dados.
ComplianceService.requestDataExport(): Solicita a exportação de dados do usuário.
ComplianceService.requestAccountDeletion(reason: string): Solicita a exclusão da conta do usuário.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
9. couponService.ts
Caminho: LimpeJaApp/services/couponService.ts

Propósito: Lida com a aplicação de cupons de desconto em agendamentos.

Funções/Métodos Chave:

applyCoupon(data): Envia os dados de um cupom para o backend para aplicação em um agendamento, retornando o resultado da aplicação.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
10. dashboardService.ts
Caminho: LimpeJaApp/app/services/dashboardService.ts

Propósito: Fornece dados para o painel do provedor, exibindo um resumo das atividades e métricas importantes.

Funções/Métodos Chave:

getMyProviderDashboard(): Obtém os dados completos do painel do provedor logado.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
11. disputeService.ts
Caminho: LimpeJaApp/services/disputeService.ts

Propósito: Gerencia a funcionalidade de reportar e obter detalhes de disputas relacionadas a agendamentos.

Funções/Métodos Chave:

disputeService.reportDispute(bookingId: string, data): Reporta uma nova disputa para um agendamento específico.
disputeService.getDisputeByBookingId(bookingId: string): Obtém os detalhes de uma disputa associada a um agendamento.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
12. earningService.ts
Caminho: LimpeJaApp/app/services/earningsService.ts

Propósito: Lida com a recuperação de dados de ganhos do provedor e solicitações de saque.

Funções/Métodos Chave:

getMyProviderEarnings(): Busca todos os dados de ganhos do provedor logado.
requestWithdrawal(withdrawalDto): Envia uma solicitação de saque de ganhos para o provedor logado.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
13. faqService.ts
Caminho: LimpeJaApp/app/services/faqService.ts

Propósito: Fornece métodos para buscar perguntas frequentes (FAQs) do backend.

Funções/Métodos Chave:

getFaqs(): Busca a lista completa de FAQs.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
14. guaranteeService.ts
Caminho: LimpeJaApp/services/guaranteeService.ts

Propósito: Gerencia a funcionalidade de garantia, permitindo que usuários submetam e visualizem reclamações de garantia.

Funções/Métodos Chave:

submitClaim(data): Envia uma nova reclamação de garantia.
getClaimsForUser(): Obtém todas as reclamações de garantia feitas pelo usuário logado.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
15. incentiveService.ts
Caminho: LimpeJaApp/services/incentiveService.ts

Propósito: Compõe e gerencia mensagens de incentivo para exibição na tela inicial, como cupons de boas-vindas, referências e cashback. Também lida com o descarte (snooze) de incentivos.

Funções/Métodos Chave:

getIncentivesForHome(): Reúne e prioriza incentivos disponíveis para a tela inicial.
dismissIncentive(id: string, hours = 48): Marca um incentivo como descartado por um período.
Dependências:

@react-native-async-storage/async-storage: Para persistir o estado de descarte dos incentivos.
./clientService: Para obter dados como ofertas e perfil do usuário.
16. locationService.ts
Caminho: LimpeJaApp/app/services/locationService.ts

Propósito: Fornece utilitários para interagir com os serviços de localização do dispositivo, incluindo gerenciamento de permissões, obtenção da posição atual e monitoramento contínuo.

Funções/Métodos Chave:

ensureLocationPermission(): Solicita e verifica as permissões de localização em primeiro plano.
getCurrentPosition(): Obtém a posição geográfica atual do dispositivo.
watchPosition(handler, interval): Inicia o monitoramento contínuo da posição, chamando um handler com as atualizações.
stopWatchingPosition(): Para o monitoramento da posição.
Dependências:

expo-location: Biblioteca Expo para acesso aos serviços de localização.
17. metricsService.ts
Caminho: LimpeJaApp/app/services/metricsService.ts

Propósito: Fornece métodos para buscar métricas de clientes, incluindo resumos, dados de séries temporais e funis de conversão.

Funções/Métodos Chave:

metricsService.getMetricsSummary(): Busca um resumo das métricas.
metricsService.getMetricsTimeseries(period): Busca dados de séries temporais para métricas em um período específico.
metricsService.getMetricsFunnel(): Busca dados do funil de conversão.
Dependências:

axios: Para fazer requisições HTTP.
18. missionService.ts
Caminho: LimpeJaApp/services/missionService.ts

Propósito: Gerencia as missões e o progresso do usuário nelas, permitindo que os usuários visualizem suas missões, resgatem recompensas e rastreiem eventos.

Funções/Métodos Chave:

getMyMissions(audience: MissionAudience): Lista as missões do usuário logado com seu progresso.
claimMission(missionId: string): Resgata a recompensa de uma missão concluída.
trackMissionEvent(event: string, payload: any): Envia um evento de rastreamento para o backend (para progresso da missão).
getMyCoupons(): Lista os cupons do usuário (opcional, pode ser usado para exibir recompensas de missão).
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
19. notificationService.ts
Caminho: LimpeJaApp/app/services/notificationService.ts

Propósito: Gerencia as notificações do usuário, incluindo busca, marcação como lida, exclusão e envio de notificações push. Também oferece sugestões inteligentes para notificações.

Funções/Métodos Chave:

NotificationService.getNotificationsMe(): Busca a lista de notificações para o usuário logado.
NotificationService.markNotificationAsReadMe(notificationId: string): Marca uma notificação específica como lida.
NotificationService.markAllNotificationsAsReadMe(): Marca todas as notificações do usuário como lidas.
NotificationService.deleteNotificationMe(notificationId: string): Deleta uma notificação específica.
NotificationService.sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>): Envia uma notificação push para um usuário.
NotificationService.getSmartSuggestions(context: string): Busca sugestões inteligentes baseadas em IA para notificações.
NotificationService.executeQuickAction(action: string, data?: any): Executa uma ação rápida associada a uma notificação.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
20. offerService.ts
Caminho: LimpeJaApp/app/services/offerService.ts

Propósito: Lida com a recuperação de informações sobre ofertas e promoções disponíveis na plataforma.

Funções/Métodos Chave:

getOffers(): Busca a lista de todas as ofertas disponíveis.
getOfferDetails(offerId: string): Busca os detalhes de uma oferta específica por ID.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
21. paymentService.ts
Caminho: LimpeJaApp/app/services/paymentService.ts

Propósito: Gerencia operações de pagamento, como criação de cobranças PIX e solicitações de saque de ganhos.

Funções/Métodos Chave:

createPixCharge(clientUserId: string, data): Cria uma cobrança PIX.
requestWithdrawal(data): Solicita um saque de ganhos do provedor.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
22. providerService.ts
Caminho: LimpeJaApp/app/services/providerService.ts

Propósito: Fornece funcionalidades abrangentes para interagir com dados de provedores, incluindo detalhes do perfil, disponibilidade, serviços oferecidos, painel e busca.

Funções/Métodos Chave:

getProviderDetails(providerId: string): Obtém os detalhes completos de um provedor.
getProviderAvailability(providerId: string, date?: string): Obtém a disponibilidade de um provedor para agendamento.
updateMyProviderProfile(data): Atualiza o perfil do provedor logado.
getMyProviderDashboard(): Obtém os dados do painel do provedor logado.
getMyProviderEarnings(): Obtém o histórico de transações de ganhos do provedor logado.
updateProviderAvailability(providerId: string, data): Atualiza a disponibilidade semanal de um provedor.
addProviderAvailability(providerId: string, data): Adiciona um novo slot de disponibilidade.
deleteProviderAvailability(providerId: string, availabilityId: string): Deleta um slot de disponibilidade.
getProviderServicesOffered(providerId: string): Obtém a lista de serviços oferecidos por um provedor.
addProviderServiceOffering(providerId: string, data): Adiciona um novo serviço oferecido.
updateProviderServiceOffering(providerId: string, serviceOfferingId: string, data): Atualiza um serviço oferecido.
deleteProviderServiceOffering(providerId: string, serviceOfferingId: string): Deleta um serviço oferecido.
getRecommendedProviders(): Obtém provedores recomendados.
getNearbyProviders(): Obtém provedores próximos.
getProvidersByServiceCategory(categoryId: string): Obtém provedores por categoria de serviço.
searchProviders(query): Realiza uma busca geral por provedores com filtros.
getProviderMetrics(providerId: string): Obtém métricas específicas para um provedor.
getProviderOffers(providerId: string): Obtém ofertas disponíveis para um provedor.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
23. rankingService.ts
Caminho: LimpeJaApp/app/services/rankingService.ts

Propósito: Gerencia a recuperação e o cache de dados do ranking (leaderboard) dos provedores.

Funções/Métodos Chave:

RankingService.getLeaderboard(period: LeaderboardPeriod): Obtém a classificação dos provedores para um período específico, com cache em memória.
RankingService.getMyRank(period: LeaderboardPeriod): Obtém a posição do usuário logado no ranking.
RankingService.prefetchNeighbors(current: LeaderboardPeriod): Pré-carrega dados de períodos vizinhos para melhorar a UX.
RankingService.getCached(period: LeaderboardPeriod): Expõe o cache para acesso direto (opcional).
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
24. referralService.ts
Caminho: LimpeJaApp/services/referralService.ts

Propósito: Lida com a criação e recuperação de indicações (referrals) de usuários.

Funções/Métodos Chave:

referralService.createReferral(data): Cria uma nova indicação.
referralService.getReferralsMadeByUser(userId: string): Obtém todas as indicações feitas por um usuário.
referralService.getReferredUsers(referrerId: string): Obtém os usuários que foram indicados por um usuário.
referralService.getReferralById(referralId: string): Obtém os detalhes de uma indicação específica.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
25. reviewService.ts
Caminho: LimpeJaApp/app/services/reviewService.ts

Propósito: Gerencia avaliações e feedbacks, incluindo submissão, análise detalhada, sugestões inteligentes e respostas.

Funções/Métodos Chave:

submitFeedback(data): Envia um feedback ou avaliação.
getDetailedRatingBreakdown(providerId: string): Obtém uma análise detalhada das avaliações de um provedor.
getSmartSuggestions(providerId: string): Obtém sugestões inteligentes baseadas em IA para um provedor.
ReviewService.getReviews(providerId: string): Busca avaliações para um provedor.
ReviewService.submitReview(review): Envia uma avaliação.
ReviewService.getSuggestedResponse(reviewId: string): Obtém uma resposta sugerida por IA para uma avaliação.
ReviewService.respondToReview(reviewId: string, response: string): Responde a uma avaliação.
ReviewService.flagInappropriateReview(reviewId: string, reason: string): Reporta uma avaliação inadequada.
ReviewService.getReviewTrends(providerId: string, period: string): Busca tendências de avaliações para um provedor.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
26. safetyService.ts
Caminho: LimpeJaApp/services/safetyService.ts

Propósito: Implementa funcionalidades relacionadas à segurança, como o acionamento de pânico e o registro de incidentes.

Funções/Métodos Chave:

reportPanic(data): Reporta um evento de pânico (método mais antigo).
reportIncident(data): Reporta um incidente.
getIncidentsForUser(): Obtém incidentes reportados pelo usuário.
triggerPanic(payload): Inicia um evento de pânico com localização.
updatePanicLocation(panicId: string, coords): Atualiza a localização de um evento de pânico ativo.
endPanic(panicId: string): Encerra um evento de pânico ativo.
createIncidentReport(panicId: string, data): Cria um relatório de incidente associado a um evento de pânico.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
27. securityService.ts
Caminho: LimpeJaApp/services/securityService.ts

Propósito: Gerencia as configurações e funcionalidades de segurança do aplicativo, incluindo biometria, autenticação de dois fatores, timeout de sessão e alertas de segurança.

Funções/Métodos Chave:

SecurityService.initSecurity(): Inicializa as configurações de segurança (biometria, timeout).
SecurityService.enableBiometric(): Ativa a autenticação biométrica.
SecurityService.authenticateWithBiometric(): Realiza a autenticação biométrica.
SecurityService.secureStoreToken(token: string): Armazena o token de forma segura.
SecurityService.getSecureToken(): Recupera o token armazenado de forma segura.
SecurityService.validateSession(): Valida a sessão do usuário com o backend.
SecurityService.getSecurityAlerts(): Obtém alertas de segurança.
SecurityService.reportSuspiciousActivity(activity: string, details: any): Reporta uma atividade suspeita.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
@react-native-async-storage/async-storage: Para armazenar configurações de segurança.
expo-local-authentication: Para funcionalidades biométricas.
expo-secure-store: Para armazenamento seguro de dados sensíveis.
28. subscriptionService.ts
Caminho: LimpeJaApp/services/subscriptionService.ts

Propósito: Lida com as operações relacionadas a assinaturas (subscriptions).

Funções/Métodos Chave:

createSubscription(data): Cria uma nova assinatura.
getSubscriptionsForUser(): Obtém as assinaturas do usuário logado.
getSubscriptionDetails(id: string): Obtém os detalhes de uma assinatura específica.
updateSubscription(id: string, data): Atualiza uma assinatura existente.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
29. supportService.ts
Caminho: LimpeJaApp/app/services/supportService.ts

Propósito: Gerencia o sistema de tickets de suporte, permitindo que usuários criem, visualizem e interajam com tickets de suporte.

Funções/Métodos Chave:

supportService.createTicket(payload): Cria um novo ticket de suporte.
supportService.getTickets(): Busca todos os tickets de suporte do usuário autenticado.
supportService.getTicketDetails(ticketId: string): Busca os detalhes de um ticket específico, incluindo mensagens.
supportService.addMessageToTicket(ticketId: string, payload): Adiciona uma nova mensagem a um ticket existente.
supportService.updateTicketStatus(ticketId: string, status): Atualiza o status de um ticket de suporte.
Dependências:

axios: Para fazer requisições HTTP (usa axios diretamente em vez da instância api centralizada, o que pode ser uma inconsistência a ser verificada).
30. uploadService.ts
Caminho: LimpeJaApp/app/services/uploadService.ts

Propósito: Lida com o upload de arquivos de imagem para o backend, categorizando-os por propósito (avatar, documentos, selfie).

Funções/Métodos Chave:

uploadImageToCloud(uri: string, filePurpose: FilePurpose): Envia uma imagem para o backend com um propósito específico, retornando a URL do arquivo carregado.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
axios: Para tratamento de erros específicos do Axios.
expo-constants: Para acessar a URL base da API.
expo-file-system: Para manipulação de arquivos locais.
31. userService.ts
Caminho: LimpeJaApp/services/userService.ts

Propósito: Fornece métodos para interagir com os dados do perfil do usuário.

Funções/Métodos Chave:

getMe(): Obtém o perfil completo do usuário autenticado.
Dependências:

./api: Instância configurada do Axios para requisições HTTP.
Conclusão
O módulo services é um pilar fundamental da arquitetura do aplicativo LimpeJá, pois centraliza e padroniza a comunicação com o backend. Ao encapsular a lógica de requisições, ele oferece uma interface limpa e consistente para os componentes da UI, desacoplando-os dos detalhes de implementação da API. Isso resulta em um código mais organizado, fácil de manter, testar e escalar, além de garantir um tratamento uniforme de erros e autenticação em toda a aplicação.