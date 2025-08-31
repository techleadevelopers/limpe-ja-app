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


Mapeamento das Funções do Módulo services (Frontend) para o admin-web
Este mapeamento demonstra como cada capacidade do aplicativo móvel (exposta via services/) exige uma contraparte de gestão no admin-web, garantindo que o dono ou coordenador possa monitorar e operar a plataforma em sua totalidade.

1. aiSuggestionsService.ts
Funções: getSmartSuggestions(providerId), getCustomerInsights(providerId), getMarketTrends().
Implicação para admin-web:
Painel de Insights e Sugestões: Uma área para visualizar as sugestões de IA geradas para provedores (preços, agendamento, melhoria de serviço).
Análise de Clientes e Mercado: Relatórios e dashboards com insights sobre o comportamento dos clientes (total, repetidos, avaliação média, serviços populares) e tendências de mercado.
Gestão de Regras de IA: Se as sugestões forem configuráveis, o admin precisaria de uma interface para ajustar os parâmetros da IA.
2. analyticsService.ts
Funções: getPerformanceMetrics(providerId), getBusinessInsights(providerId, period), trackEvent(event, properties), getCompetitorAnalysis(location), generateReport(type, providerId).
Implicação para admin-web:
Relatórios de Performance de Provedores: Dashboards detalhados com tempo de resposta, taxa de conclusão, satisfação do cliente, taxa de clientes recorrentes, crescimento de receita e ranking.
Insights de Negócio: Relatórios financeiros (receita total, agendamentos, valor médio do trabalho) e análise de concorrência por localização.
Geração de Relatórios: Capacidade de gerar relatórios analíticos (mensais, trimestrais) para provedores ou para a plataforma como um todo.
Monitoramento de Eventos: Embora trackEvent seja para o frontend, o admin precisa ver os resultados desses eventos (KPIs).
3. api.ts (Infraestrutura)
Funções: setUnauthorizedCallback, axios.create (interceptors para auth, tratamento de erros).
Implicação para admin-web:
Segurança e Auditoria: O mesmo sistema de autenticação e tratamento de erros do frontend garante que o admin-web seja seguro e que erros sejam registrados para auditoria.
4. authService.ts
Funções: login, logout, registerClient, registerProvider, sendPasswordReset, loadAuthData, storeAuthData, setAuthToken, getAuthToken.
Implicação para admin-web:
Gestão de Usuários (Completa): Além de listar, o admin pode precisar de funcionalidades para:
Resetar senhas de usuários/provedores.
Bloquear/desbloquear contas.
Verificar detalhes de registro (incluindo referralCode usado no registro).
Gerenciar roles (CLIENT, PROVIDER, ADMIN, SUPPORT_AGENT).
5. bookingService.ts
Funções: createBooking, getBookingsForUser, getBookingDetails, updateBookingStatus, cancelBooking, checkActiveChatBooking, checkConfirmedBookingBetweenUsers.
Implicação para admin-web:
Gestão de Agendamentos (Centralizada):
Visualizar todos os agendamentos (não apenas os do usuário logado), com filtros por cliente, provedor, serviço, status (PENDING, CONFIRMED, COMPLETED, CANCELED, PENDING_DISPUTE, RESCHEDULED, IN_PROGRESS, REJECTED, NO_SHOW).
Atualizar manualmente o status de um agendamento (em casos de suporte ou erro).
Cancelar agendamentos (com registro de motivo).
Visualizar detalhes completos do agendamento, incluindo couponId e discountAmount aplicados.
6. chatService.ts
Funções: findOrCreateChat, getChatMessages, sendMessage, getChatListForUser.
Implicação para admin-web:
Monitoramento e Auditoria de Chats:
Acesso a transcrições de chat (essencial para resolução de disputas e controle de qualidade).
Busca por conversas.
Monitoramento do averageResponseTime dos provedores (como métrica).
Capacidade de bloquear usuários de chat em casos de má conduta.
7. clientService.ts
Funções: getServiceCategories, searchProviders, searchProvidersWithLocation, getUserProfile, getOffers, getProviderOffers, applyCoupon, getProviderDetails, getProviderMetrics, updateClientProfile, getClientMissions, claimClientReward.
Implicação para admin-web:
Gestão de Clientes: Visualização e edição completa de perfis de clientes (além do que o próprio cliente pode editar).
Gestão de Ofertas e Cupons (Consolidado):
Visualizar todas as ofertas e cupons disponíveis (globais e específicos de provedores).
Monitorar a aplicação de cupons em agendamentos.
Gestão de Missões do Cliente: Visualizar o progresso das missões dos clientes e as recompensas resgatadas.
Análise de Provedores: Acesso aos ProviderMetrics (taxa de aceitação, tempo médio de resposta) e ProviderOffers para análise e gestão.
8. complianceService.ts
Funções: getComplianceStatus(providerId), getLegalRequirements(), uploadComplianceDocument(type, file), getDataPrivacyInfo(), requestDataExport(), requestAccountDeletion(reason).
Implicação para admin-web:
Painel de Conformidade (LGPD e Regulatória):
Visualizar o status de conformidade de provedores (documentos, antecedentes, seguros, impostos).
Gerenciar requisitos legais.
Revisar documentos de compliance enviados.
Processar solicitações de exportação de dados (requestDataExport).
Gerenciar solicitações de exclusão de conta (requestAccountDeletion), garantindo a anonimização.
9. couponService.ts
Funções: applyCoupon.
Implicação para admin-web:
Gestão de Cupons (Criação e Monitoramento):
Criar, editar e desativar cupons com regras complexas (CouponTargets como NEW_CUSTOMER, REFERRAL_REFERRED, MISSION_REWARD, REPEAT_CUSTOMER, SPECIFIC_SERVICE, SPECIFIC_PROVIDER).
Monitorar o usageCount de cada cupom.
Auditar a aplicação de cupons em agendamentos.
10. dashboardService.ts
Funções: getMyProviderDashboard().
Implicação para admin-web:
Painel do Provedor (Admin View): O admin precisa ter a capacidade de visualizar o dashboard de qualquer provedor, não apenas o seu próprio, para fins de suporte e monitoramento.
11. disputeService.ts
Funções: reportDispute(bookingId, data), getDisputeByBookingId(bookingId).
Implicação para admin-web:
Central de Resolução de Disputas:
Visualizar e gerenciar todas as disputas (DisputeStatus: PENDING, IN_REVIEW, RESOLVED, REJECTED).
Acessar detalhes da disputa (motivo, descrição, anexos).
Adicionar mensagens e propostas de acordo.
Definir a resolução da disputa (reembolso, rejeição, etc.).
Auditar o processo de resolução.
12. earningService.ts
Funções: getMyProviderEarnings(), requestWithdrawal(withdrawalDto).
Implicação para admin-web:
Gestão Financeira e Payouts de Provedores:
Visualizar os ganhos de todos os provedores (saldo disponível, pendente, em hold).
Acessar o ledger detalhado de transações financeiras por provedor.
Gerenciar e processar solicitações de saque (requestWithdrawal), incluindo aprovação/rejeição e rastreamento do status (REQUESTED, IN_REVIEW, PROCESSING, PAID, FAILED).
Configurar taxas de saque (WITHDRAWAL_FIXED_FEE_RS, WITHDRAWAL_PERCENT_FEE).
13. faqService.ts
Funções: getFaqs().
Implicação para admin-web:
Gestão de FAQs: Criar, editar, organizar por categoria e excluir perguntas frequentes.
14. guaranteeService.ts
Funções: submitClaim(data), getClaimsForUser().
Implicação para admin-web:
Gestão de Reclamações de Garantia:
Visualizar e gerenciar todas as reclamações de garantia (ClaimStatus: PENDING, UNDER_REVIEW, APPROVED, REJECTED, SETTLED).
Acessar detalhes da reclamação (descrição, anexos, valor estimado).
Definir a resolução e o valor resolvido.
15. incentiveService.ts
Funções: getIncentivesForHome(), dismissIncentive(id, hours).
Implicação para admin-web:
Gestão de Programas de Incentivo:
Configurar e ativar/desativar diferentes tipos de incentivos (cupons de boas-vindas, de retorno, promoções de indicação, mensagens de cashback).
Monitorar a performance e o engajamento com esses incentivos.
16. locationService.ts
Funções: ensureLocationPermission, getCurrentPosition, watchPosition, stopWatchingPosition.
Implicação para admin-web:
Principalmente para o app. No admin-web, pode implicar em Ferramentas de Geomonitoramento para visualizar a localização de provedores (se permitido e relevante para a operação) ou o mapa de calor de demanda.
17. metricsService.ts
Funções: getMetricsSummary(), getMetricsTimeseries(period), getMetricsFunnel().
Implicação para admin-web:
Painel de Métricas de Clientes: Dashboards com resumos de comportamento do cliente, séries temporais de métricas (agendamentos, gastos) e funis de conversão.
18. missionService.ts
Funções: getMyMissions(audience), claimMission(missionId), trackMissionEvent(event, payload), getMyCoupons().
Implicação para admin-web:
Gestão de Gamificação e Missões:
Criar, editar e desativar Missions com suas complexas regras (MissionAudience, MissionKind, eventName, targetValue, timeWindowDays, RewardType, rewardValue).
Monitorar o MissionProgress dos usuários (clientes e provedores).
Auditar MissionEvents e claimMissions.
Visualizar cupons gerados por missões.
19. notificationService.ts
Funções: getNotificationsMe, markNotificationAsReadMe, markAllNotificationsAsReadMe, deleteNotificationMe, sendPushNotification, getSmartSuggestions, executeQuickAction.
Implicação para admin-web:
Central de Notificações e Campanhas:
Visualizar e auditar todas as notificações enviadas pelo sistema.
Criar e enviar notificações em massa ou segmentadas (push, in-app).
Enviar notificações específicas para usuários (ex: para suporte).
Gerenciar templates de notificação.
Configurar e monitorar "ações rápidas" e "sugestões inteligentes" para notificações.
20. offerService.ts
Funções: getOffers(), getOfferDetails(offerId).
Implicação para admin-web:
Gestão de Ofertas Promocionais:
Criar, editar e desativar Offers com discountValue, discountType, target (GENERAL, SPECIFIC_SERVICE, SPECIFIC_PROVIDER, NEW_CLIENTS), validFrom, validUntil e status.
Monitorar a performance das ofertas.
21. paymentService.ts
Funções: createPixCharge(clientUserId, data), requestWithdrawal(data).
Implicação para admin-web:
Gestão de Pagamentos e Saques:
Visualizar todas as PixCharges criadas.
Gerenciar requestWithdrawals (conforme earningService).
Acessar detalhes de PaymentIntent e PaymentEvent para auditoria e conciliação.
22. providerService.ts
Funções: getProviderDetails, getProviderAvailability, updateMyProviderProfile, getMyProviderDashboard, getMyProviderEarnings, updateProviderAvailability, addProviderAvailability, deleteProviderAvailability, getProviderServicesOffered, addProviderServiceOffering, updateProviderServiceOffering, deleteProviderServiceOffering, getRecommendedProviders, getNearbyProviders, getProvidersByServiceCategory, searchProviders, getProviderMetrics, getProviderOffers.
Implicação para admin-web:
Gestão de Provedores (Completa):
Visualizar e editar perfis de provedores (incluindo acceptanceRate e averageResponseTime).
Gerenciar Availability (disponibilidade semanal e slots).
Gerenciar ProviderServiceOfferings (serviços que cada provedor oferece, preços, durações).
Monitorar e ajustar a lógica de provedores "recomendados" e "próximos".
Acessar ProviderMetrics detalhadas.
23. rankingService.ts
Funções: getLeaderboard(period), getMyRank(period), prefetchNeighbors(current), getCached(period).
Implicação para admin-web:
Configuração e Monitoramento de Ranking:
Visualizar os leaderboards e o ranking de provedores.
Acessar a "decomposição" do score de ranking para entender como ele é calculado.
Configurar pesos da fórmula de ranking (se exposto ao admin).
Aplicar/remover boosts e penalidades manuais (se não totalmente automatizado pelo backend).
Disparar recálculos de ranking ou invalidação de cache.
24. referralService.ts
Funções: createReferral, getReferralsMadeByUser, getReferredUsers, getReferralById.
Implicação para admin-web:
Gestão do Programa de Indicações:
Visualizar todas as indicações feitas.
Rastrear a conversão de indicações (quando o indicado completa o primeiro booking).
Auditar recompensas de indicação.
Gerenciar códigos de indicação.
25. reviewService.ts
Funções: submitFeedback, getDetailedRatingBreakdown, getSmartSuggestions, getReviews, submitReview, getSuggestedResponse, respondToReview, flagInappropriateReview, getReviewTrends.
Implicação para admin-web:
Gestão e Moderação de Avaliações:
Visualizar e moderar todas as Reviews (aprovar, rejeitar, sinalizar como inadequada).
Acessar DetailedRatingBreakdowns para provedores.
Monitorar ReviewTrends.
Auditar respostas de provedores às avaliações.
Acessar SmartSuggestions para respostas (se o admin também responder).
26. safetyService.ts
Funções: reportPanic, reportIncident, getIncidentsForUser, triggerPanic, updatePanicLocation, endPanic, createIncidentReport.
Implicação para admin-web:
Central de Emergência e Gestão de Incidentes:
Painel de Alerta de Pânico em Tempo Real: Visualizar PanicAlerts ativos, localização, status e gerenciar o ciclo de vida (acionar, atualizar localização, encerrar).
Gestão de Incidentes: Visualizar, filtrar, atribuir, atualizar status e adicionar notas a Incidents.
Processar relatórios de incidentes (vindos de pânico ou diretos).
Acessar anexos e evidências de incidentes.
27. securityService.ts
Funções: initSecurity, enableBiometric, authenticateWithBiometric, secureStoreToken, getSecureToken, validateSession, getSecurityAlerts, reportSuspiciousActivity.
Implicação para admin-web:
Monitoramento de Segurança e Auditoria:
Visualizar SecurityAlerts (logins suspeitos, novos dispositivos, anomalias de pagamento).
Auditar SuspiciousActivitys reportadas pelos usuários.
Acessar logs de sessão.
28. subscriptionService.ts
Funções: createSubscription, getSubscriptionsForUser, getSubscriptionDetails, updateSubscription.
Implicação para admin-web:
Gestão de Assinaturas e Recorrência:
Visualizar e gerenciar todas as Subscriptions.
Controlar o SubscriptionStatus (ativar, pausar, cancelar).
Visualizar agendamentos recorrentes gerados por assinaturas.
29. supportService.ts
Funções: createTicket, getTickets, getTicketDetails, addMessageToTicket, updateTicketStatus.
Implicação para admin-web:
Sistema de Ticketing de Suporte (Help Desk):
Visualizar e gerenciar todos os SupportTickets.
Atribuir tickets a agentes.
Comunicar-se com usuários via mensagens no ticket.
Atualizar SupportTicketStatus (OPEN, IN_PROGRESS, WAITING_USER, RESOLVED, CLOSED, ESCALATED).
Monitorar SLAs de atendimento.
30. uploadService.ts (Infraestrutura)
Funções: uploadImageToCloud.
Implicação para admin-web:
Gestão de Mídias/Anexos: O admin precisa ter acesso para visualizar e, se necessário, gerenciar (excluir, moderar) as imagens e documentos carregados pelos usuários (avatares, documentos de verificação, anexos de disputas/incidentes).
31. userService.ts
Funções: getMe().
Implicação para admin-web:
Gestão de Perfis de Usuários: O admin precisa de uma interface para buscar e visualizar o perfil completo de qualquer usuário, não apenas o seu próprio.
Conclusão: O admin-web como a Torre de Controle da LimpeJá
Com base na integração das funcionalidades expostas pelo módulo services do frontend, o admin-web se configura como uma torre de controle completa e robusta, permitindo ao dono ou coordenador:

Monitoramento 360°: Ter uma visão em tempo real de todas as operações, desde o onboarding de provedores até a resolução de disputas financeiras e incidentes de segurança.
Gestão Ativa: Não apenas visualizar, mas também intervir e gerenciar ativamente cada aspecto da plataforma (usuários, provedores, agendamentos, finanças, promoções, suporte).
Tomada de Decisão Estratégica: Acesso a dados analíticos e insights de IA para otimizar preços, serviços, programas de incentivo e a experiência geral do usuário.
Garantia de Qualidade e Segurança: Ferramentas para gerenciar a verificação de provedores, moderar avaliações, resolver disputas e incidentes, e monitorar a segurança.
Escalabilidade Operacional: A capacidade de gerenciar volumes crescentes de dados e interações, essencial para o crescimento da LimpeJá para múltiplas cidades.
Essa visão consolidada mostra que o admin-web não é apenas um painel básico, mas sim uma ferramenta operacional estratégica, fundamental para a eficiência, profissionalismo e sucesso em escala da plataforma LimpeJá, alinhando-se perfeitamente com a complexidade e riqueza das lógicas de negócio que você implementou.