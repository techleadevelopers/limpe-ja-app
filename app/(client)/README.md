Documentação Técnica do Frontend LimpeJá - Módulo Cliente (app/(client))
1. Visão Geral e Propósito
O módulo app/(client) do aplicativo LimpeJá representa a interface principal para os usuários clientes. Seu propósito central é fornecer uma experiência intuitiva e completa, permitindo que os clientes descubram e agendem serviços de limpeza e manutenção, gerenciem seus agendamentos, comuniquem-se com provedores e mantenham seu perfil pessoal atualizado.

Construído com React Native e Expo, este módulo se integra de forma transparente com o backend, utilizando uma arquitetura baseada em componentes e fluxos de dados bem definidos para garantir escalabilidade e manutenibilidade.

1.1. Tecnologias Principais
Framework UI: React Native
Navegação: Expo Router
Gerenciamento de Estado Global: React Context API (ex: AuthContext)
Tipagem: TypeScript
Estilização: StyleSheet do React Native
Animações: React Native Animated API
Ícones: @expo/vector-icons (Ionicons, MaterialCommunityIcons)
Utilitários: expo-image-picker, expo-clipboard, react-native-safe-area-context, @react-native-picker/picker, @tanstack/react-query, react-native-chart-kit, socket.io-client.
2. Arquitetura de Navegação
A navegação principal da área do cliente é gerenciada pelo Expo Router, utilizando um Tabs Navigator (app/(client)/_layout.tsx). Esta abordagem oferece uma estrutura de abas na parte inferior da tela, permitindo que o usuário alterne facilmente entre as seções primárias do aplicativo.

2.1. app/(client)/_layout.tsx
Este arquivo define o layout raiz para todas as telas do módulo cliente, configurando as abas de navegação e suas respectivas rotas e ícones.

Tipo de Navegação: Tabs Navigation
Propósito: Facilitar o acesso rápido e intuitivo às funcionalidades centrais do cliente.
Telas Principais (Abas):
Explorar (explore)
Rota: /(client)/explore
Título: 'Explorar'
Ícone: Ionicons "search"
Agendamentos (bookings)
Rota: /(client)/bookings
Título: 'Agendamentos'
Ícone: Ionicons "calendar-outline"
Mensagens (messages)
Rota: /(client)/messages
Título: 'Mensagens'
Ícone: Ionicons "chatbubbles-outline"
Perfil (profile)
Rota: /(client)/profile
Título: 'Perfil'
Ícone: Ionicons "person-circle-outline"
3. Módulos e Funcionalidades Detalhadas
Cada seção a seguir descreve uma funcionalidade ou tela específica dentro do módulo cliente, detalhando seu propósito, componentes envolvidos, fluxo de dados e interações com o backend.

3.1. Gerenciamento de Perfil (app/(client)/profile/)
3.1.1. Tela Principal do Perfil (app/(client)/profile/index.tsx)
Propósito: Fornecer uma visão geral do perfil do usuário, acesso rápido a informações da conta, missões, métricas e configurações gerais.
Rota: /(client)/profile
Componentes Principais: ScrollView, Animated.View, TouchableOpacity, Image, TextInput, AnimatedMenuItem (customizado com suporte a ícones 3D).
Fluxo de Dados e Interações:
Entrada: Dados do perfil do usuário (user) obtidos via useAuth().
Dados Exibidos: Nome completo, e-mail, pontos do usuário (simulado), contagem de missões pendentes (simulado).
Animações:
headerAnim, profileHeaderAnim, searchBarAnim, missionsCardAnim: Animações de entrada escalonadas para o cabeçalho, cartão de perfil, barra de busca e cartão de missões.
avatarScaleAnim: Feedback de toque para o avatar.
missionIconPulseAnim, missionIconRotateAnim: Efeitos sutis para o ícone de missões.
searchReflectionAnim, missionsCardReflectionAnim: Efeitos de reflexo (glassmorphism) para a barra de busca e o cartão de missões.
AnimatedMenuItem: Animações de fade, slide e escala para cada item do menu.
Interação:
handleLogout: Desloga o usuário e navega para a tela de login.
handleWIP: Exibe um Alert para funcionalidades em desenvolvimento.
Navegação: Direciona para /(client)/bookings, /(client)/profile/edit, /(common)/safety, /(client)/metrics, /(common)/referrals, /(common)/loyalty, /(common)/termos, /(common)/privacidade, /(common)/help, /(client)/missions.
3.1.2. Tela de Edição de Perfil (app/(client)/profile/edit.tsx)
Propósito: Permitir que o cliente visualize e atualize suas informações pessoais, incluindo nome, telefone, endereço e foto de perfil.
Rota: /(client)/profile/edit
Componentes Principais: KeyboardAvoidingView, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, AnimatedErrorMessage (customizado para erros inline), Sheet (para seleção de avatar), Button (customizado para ações).
Fluxo de Dados e Interações:
Entrada: Dados do perfil do usuário (user) obtidos via useAuth().
API Calls (Backend Endpoints):
updateClientProfile: PATCH /clients/me (Requisição: UpdateClientProfileDto).
uploadImageToCloud: Para upload de avatar (FilePurpose: 'avatar').
Animações:
headerAnim, contentAnim: Animações de entrada para o cabeçalho e o conteúdo do formulário.
avatarScaleAnim: Feedback de toque para o avatar.
saveButtonScaleAnim, linkButtonScaleAnim: Feedback de toque para botões.
fullNameBorderAnim, phoneBorderAnim: Animações de borda para TextInput com base no foco e erros.
Considerações de Implementação:
Integração com expo-image-picker para seleção de imagem de perfil (galeria ou câmera).
Validações de formulário inline para nome e telefone, com feedback visual animado.
Formatação automática do número de telefone.
Exibição de EmptyState se o endereço estiver incompleto.
Utiliza Toast para mensagens de sucesso/erro.
3.2. Exploração e Busca de Serviços (app/(client)/explore/)
3.2.1. Tela Principal de Exploração (app/(client)/explore/index.tsx)
Propósito: Tela inicial do cliente, oferecendo categorias de serviço, banners promocionais, recomendações de provedores e provedores próximos.
Rota: /(client)/explore
Componentes Principais: ScrollView, FlatList (para banners), Animated.View, HeaderSuperior, NavBar, SecaoContainer, CategoriaCard, CarouselBannerItem, SecaoRecomendacoes, RecomendacaoCard, SecaoPrestadores, PrestadorCard, DEFENSE_SOS, HtmlCouponCard, CouponPill, ReferralBanner, ReferralSheet, BottomSlideInCard.
Fluxo de Dados e Interações:
Entrada: Dados do perfil do usuário (userProfile) via getUserProfile().
API Calls (Backend Endpoints):
getUserProfile: GET /users/me.
getServiceCategories: GET /services/categories.
getRecommendedProviders: GET /providers/recommended.
searchProvidersWithLocation: GET /providers/search (com parâmetros de localização).
getOffers: GET /offers.
Localização: Solicita permissão de localização (expo-location) para buscar provedores próximos.
Promoções: Gerencia a exibição de cupons de boas-vindas e banners de indicação usando AsyncStorage para persistência de estados (dispensado/resgatado).
Animações:
headerAnim, categoriesAnim, bannerAnim, recommendationsAnim, providersAnim, navBarAnim: Animações de entrada escalonadas para as principais seções da tela.
FlatList de banners: Animações de paginação e rolagem.
Interação:
handleCategoryPress: Navega para /(client)/explore/search-results com categoryId.
handleProviderPress: Navega para /(client)/explore/[providerId].
handleUseWelcomeCoupon: Aplica o cupom e navega para schedule-service.
handleDismissWelcomeCoupon: Dispensa o cupom e o marca como tal.
handleReopenWelcomeCoupon: Reabre o card do cupom.
handleShareReferral: Compartilha o código de indicação via Share nativo.
handleHowItWorksReferral: Abre o ReferralSheet.
onRefresh: Permite puxar para atualizar os dados da tela.
3.2.2. Tela de Resultados de Busca (app/(client)/explore/search-results.tsx)
Propósito: Exibir uma lista de provedores de serviço com base em um termo de busca ou categoria.
Rota: /(client)/explore/search-results
Parâmetros de Rota: query (termo de busca), categoryId.
Componentes Principais: FlatList, ActivityIndicator, ProviderCard, TouchableOpacity.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints): searchProviders (do providerService).
Gerenciamento de Estado: Utiliza @tanstack/react-query para gerenciar o estado de carregamento, erro e dados da busca.
Interação:
onRefresh: Permite puxar para atualizar os resultados da busca.
router.push: Navega para /(client)/explore/[providerId] (detalhes do provedor).
3.2.3. Tela de Provedores por Categoria (app/(client)/services/category/[categoryId].tsx)
Propósito: Exibir provedores filtrados por uma categoria de serviço específica.
Rota: /(client)/services/category/[categoryId]
Parâmetros de Rota: categoryId, categoryName.
Componentes Principais: FlatList, ActivityIndicator, CategoryProviderCard.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints): getProvidersByServiceCategory (do providerService).
Animações: headerAnim, feedbackAnim para animações de entrada e feedback visual.
Interação:
onRefresh: Permite puxar para atualizar a lista de provedores.
handleProviderPress: Navega para /(client)/explore/[providerId].
3.2.4. Tela de Detalhes do Prestador (app/(client)/explore/[providerId].tsx)
Propósito: Fornecer uma visão abrangente do perfil de um provedor de serviços, incluindo bio, serviços oferecidos, avaliações, ofertas e ações de contato/agendamento.
Rota: /(client)/explore/[providerId]
Parâmetro de Rota: providerId.
Componentes Principais: ScrollView, Animated.View, Image, StarRating, InfoChip, BookServiceButton, ReviewCard, SideIcon (para informações de segurança/avaliação flutuantes).
Fluxo de Dados e Interações:
API Calls (Backend Endpoints):
getProviderDetails: GET /providers/:id.
getProviderMetrics: GET /providers/:id/metrics.
getProviderOffers: GET /providers/:id/offers.
checkActiveChatBooking: GET /bookings/check-active-chat (para determinar se o chat pode ser iniciado).
Animações:
mainContentAnim, bookNowButtonAnim, imageFadeAnim, imageScaleAnim, infoChipAnim: Animações de entrada para as seções da tela.
callButtonAnim, chatButtonAnim, mapButtonAnim, shareButtonAnim: Feedback de toque para botões de ação.
addReviewButtonPulseAnim: Animação de pulso para o botão de adicionar avaliação.
Interação:
handleChatPress: Inicia um chat com o provedor se houver um booking ativo.
handleCopyCouponCode: Copia o código do cupom para a área de transferência.
Ações: Ligar (simulado), ver mapa (simulado), compartilhar (simulado).
BookServiceButton: Navega para schedule-service.
3.2.5. Telas Placeholder (todas-categorias.tsx, todos-prestadores-proximos.tsx, servicos-por-categoria.tsx, resultados-busca.tsx)
Propósito: Representam telas futuras para expandir as funcionalidades de exploração e busca. Atualmente, exibem apenas um título e um texto TODO.
3.3. Gerenciamento de Agendamentos (app/(client)/bookings/)
3.3.1. Tela de Lista de Agendamentos (app/(client)/bookings/index.tsx)
Propósito: Exibir uma lista de todos os agendamentos do cliente, com opções de filtragem por status (solicitações, próximos, histórico, cancelados).
Rota: /(client)/bookings
Componentes Principais: FlatList, TouchableOpacity (para filtros), AnimatedBookingItem.
Fluxo de Dados e Interações:
Entrada: user.id via useAuth().
API Calls (Backend Endpoints): getBookingsForUser (do bookingService), filtrando por BookingStatus (ex: PENDING_PROVIDER_CONFIRMATION, CONFIRMED, COMPLETED, CANCELLED, REJECTED).
Animações:
filterButtonAnims: Feedback de toque para os botões de filtro.
contentAnim: Animação de fade para o conteúdo da lista ao mudar de filtro.
AnimatedBookingItem: Animações de entrada em cascata para cada item da lista.
Interação:
handleFilterChange: Altera o filtro ativo e recarrega os agendamentos.
handleRefresh: Permite puxar para atualizar a lista de agendamentos.
router.push: Navega para /(client)/bookings/[bookingId] (detalhes do agendamento) ou /(client)/explore (se a lista estiver vazia).
3.3.2. Tela de Detalhes do Agendamento (app/(client)/bookings/[bookingId].tsx)
Propósito: Exibir os detalhes completos de um agendamento específico e permitir ações contextuais (cancelar, contatar, avaliar, ver perfil do provedor).
Rota: /(client)/bookings/[bookingId]
Parâmetro de Rota: bookingId.
Componentes Principais: ScrollView, Image, TouchableOpacity, Animated.View, PanicBanner.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints):
getBookingDetails: GET /bookings/:id.
cancelBooking: PATCH /bookings/:id/cancel.
Animações:
providerSectionAnim, detailsCardAnim, actionsCardAnim: Animações de entrada escalonadas para as seções da tela.
cancelButtonScaleAnim, contactButtonScaleAnim, reviewButtonScaleAnim, profileButtonScaleAnim: Feedback de toque para botões de ação.
Interação:
handleCancelBooking: Cancela o agendamento após confirmação.
handleContactProvider: Navega para a tela de chat (/(client)/messages) com o provedor.
handleReviewService: Navega para a tela de feedback (/(common)/feedback/[targetId]) para avaliar o serviço.
handleViewProviderProfile: Navega para o perfil do provedor (/(client)/explore/[providerId]).
handlePanic: Simula o acionamento do botão de pânico.
3.3.3. Tela de Agendamento de Serviço (app/(client)/schedule-service.tsx)
Propósito: Guiar o cliente através do processo de agendamento de um serviço, desde a seleção da data/hora e detalhes do serviço até a aplicação de cupons e confirmação.
Rota: /(client)/schedule-service
Parâmetros de Rota: providerId, serviceId, servicePrice, couponCode (opcional, para pré-preencher cupom).
Componentes Principais: ScrollView, Animated.View, TextInput, ScheduleHeader, ProviderBrief, AddressSection, ScheduleCalendar, TimeSlotsSection, ServiceDetailsInput, NotesInputSection, CouponInputSection, BookingSummaryPreview, ConfirmBookingButton.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints):
getProviderDetails: GET /providers/:id.
getProviderAvailability: GET /providers/:providerId/availability.
applyCoupon: POST /coupons/apply (valida e aplica cupom).
createBooking: POST /bookings.
Animações: Diversas animações de entrada, pulso, rotação e brilho para elementos da UI, incluindo um indicador de progresso multi-etapas.
Interação:
handleDaySelect, handleTimeSelect: Seleção de data e hora.
setAddress, setNotes, setDurationInMinutes, setSquareMeters: Atualização dos detalhes do serviço.
handleApplyCoupon: Aplica o código do cupom, atualizando o desconto.
showCancellationPolicy: Exibe Alert com a política de cancelamento.
handleConfirmBooking: Finaliza o agendamento e navega para a tela de sucesso.
handlePanic: Simula o acionamento do botão de pânico.
3.3.4. Tela de Sucesso do Agendamento (app/(client)/bookings/success.tsx)
Propósito: Confirmar visualmente ao cliente que seu agendamento foi realizado com sucesso e fornecer opções de navegação subsequentes, além de detalhes de pagamento PIX e teasers de recompensas.
Rota: /(client)/bookings/success
Parâmetros de Rota: bookingId, paymentMethod, totalPrice, couponApplied, couponCode.
Componentes Principais: LinearGradient, BlurView, ScrollView, Animated.View, SuccessHeader, BookingSummaryCard, MainActionButtons, ImmediateActionButtons, SecurityInfoSection, LoyaltyTeaserSection, ReturnCouponCard, MissionReminderCard.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints):
getBookingDetails: GET /bookings/:id.
getProviderDetails: GET /providers/:id.
createPixCharge: POST /payments/pix-charge (se o método de pagamento for PIX).
Integração: expo-calendar para adicionar ao calendário, expo-clipboard para copiar código PIX.
Animações: Animações de entrada para o conteúdo principal e efeitos de fundo (animatedBlob).
Interação:
handleGoToBookings: Navega para a lista de agendamentos.
handleGoHome: Navega para a tela inicial.
handleAddToCalendar: Adiciona o agendamento ao calendário do dispositivo.
handleContactProvider: Navega para a tela de chat com o provedor.
handleCopyPixQrCode: Copia o código PIX.
handleRebookNow: Navega para schedule-service com um cupom de retorno.
handleGoToMission: Navega para a tela de missões.
handleDismissMissionReminder: Dispensa o lembrete de missão.
3.4. Detalhes de Oferta (app/(client)/ofertas/)
3.4.1. Tela de Detalhes da Oferta (app/(client)/ofertas/[ofertaId].tsx)
Propósito: Exibir os detalhes completos de uma oferta promocional, incluindo título, descrição, termos, validade e um botão de ação.
Rota: /(client)/ofertas/[ofertaId]
Parâmetro de Rota: ofertaId.
Componentes Principais: ScrollView, Animated.View, Image, TouchableOpacity.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints): getOfferDetails (do offerService).
Animações: headerAnim, contentAnim, imageAnim para animações de entrada, e ctaButtonScaleAnim para feedback de toque no botão de ação.
Interação:
router.back(): Volta para a tela anterior.
Botão de Ação: Placeholder para navegar para o agendamento com a oferta.
3.5. Mensagens (app/(client)/messages/)
3.5.1. Tela de Lista de Conversas (app/(client)/messages/index.tsx)
Propósito: Exibir uma lista de todas as conversas de chat do cliente com provedores.
Rota: /(client)/messages
Componentes Principais: FlatList, Animated.View, TouchableOpacity, Image, TextInput (para busca), AnimatedConversationItem.
Fluxo de Dados e Interações:
Entrada: user.id e isAuthenticated via useAuth().
API Calls (Backend Endpoints): getChatListForUser (do chatService).
Animações: headerAnim, feedbackAnim para animações de entrada.
AnimatedConversationItem: Animações de fade, slide e escala para cada item da lista.
Interação:
handleConversationPress: Navega para /(client)/messages/[chatId] (chat individual).
setActiveTab: Altera a aba de filtro de conversas.
3.5.2. Tela de Chat Individual (app/(client)/messages/[chatId].tsx)
Propósito: Fornecer a interface de chat para comunicação em tempo real com um provedor específico.
Rota: /(client)/messages/[chatId]
Parâmetros de Rota: chatId, recipientName, recipientId, recipientAvatarUrl, bookingId.
Componentes Principais: KeyboardAvoidingView, FlatList, TextInput, TouchableOpacity, CustomChatHeader, PanicBanner.
Fluxo de Dados e Interações:
Entrada: user.id, token, isAuthenticated via useAuth().
API Calls (Backend Endpoints):
getChatMessages: GET /chat/:chatId/messages.
getBookingDetails: GET /bookings/:id (para verificar status do chat).
sendMessage (do chatService): POST /chat/:chatId/messages (fallback para Socket.IO).
Comunicação em Tempo Real: Integração com socket.io-client para joinChat e sendMessage.
Animações: chatBlockedAnim, inputContainerAnim, sendButtonScaleAnim para feedback visual e estados de chat.
Interação:
handleSendMessage: Envia mensagens via Socket.IO ou API REST.
handlePanic: Simula o acionamento do botão de pânico.
flatListRef: Auto-rolagem para o final do chat.
3.6. Métricas (app/(client)/metrics/)
3.6.1. Layout da Seção de Métricas (app/(client)/metrics/_layout.tsx)
Propósito: Define a pilha de navegação para todas as telas relacionadas às métricas do cliente.
Rota: /(client)/metrics
Componente Principal: MetricsLayout
Apresentação: Utiliza expo-router's Stack. O cabeçalho é desativado (headerShown: false) pois a tela interna implementa seu próprio cabeçalho customizado.
3.6.2. Tela de Métricas do Cliente (app/(client)/metrics/index.tsx)
Propósito: Exibir um dashboard com diversas métricas para o cliente, incluindo um resumo geral, dados de séries temporais (agendamentos e receita) e um funil de conversão.
Rota: /(client)/metrics
Componentes Principais: ScrollView, ActivityIndicator, LineChart (react-native-chart-kit), KPIValue (customizado), Skeleton, EmptyState.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints):
metricsService.getMetricsSummary(): GET /metrics/summary.
metricsService.getMetricsTimeseries('month'): GET /metrics/timeseries?period=month.
metricsService.getMetricsFunnel(): GET /metrics/funnel.
Interação:
fetchMetrics: Carrega todos os dados das métricas.
router.back(): Volta para a tela anterior.
router.push('/(client)/explore'): Navega para explorar serviços se não houver dados.
3.7. Missões (app/(client)/missions/)
3.7.1. Tela Principal de Missões (app/(client)/missions/index.tsx)
Propósito: Gerenciar e exibir as missões do cliente, com simulador de desconto, preferências, abas de filtro e lista de missões.
Rota: /(client)/missions
Parâmetros de Rota: name (nome do usuário), estimate (preço estimado para o simulador).
Componentes Principais: ScrollView, Animated.View, LinearGradient, FeaturedDiscountCard, PreferencesSection, HowItWorks, MissionList, MissionReminderCard, MissionProgressSnack.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints):
getMyMissions(MissionAudience.CLIENT): GET /missions?audience=CLIENT.
claimMission(missionId): POST /missions/:id/claim.
Animações: headerAnim, contentAnim, pulseAnim para animações de entrada e efeitos visuais.
Interação:
setBasePrice: Ajusta o preço base no simulador de desconto.
handleClaimMission: Resgata a recompensa de uma missão.
onRefresh: Permite puxar para atualizar as missões.
setActiveTab: Filtra as missões por status (ativas, prontas para resgatar, resgatadas).
setPrefAutoApply, setPrefPushEnabled, setPrefMonthlyOptIn: Atualiza as preferências locais.
router.push('/(client)/explore'): Navega para explorar serviços.
3.8. Ofertas (app/(client)/ofertas/)
3.8.1. Tela de Detalhes da Oferta (app/(client)/ofertas/[ofertaId].tsx)
Propósito: Exibir os detalhes completos de uma oferta promocional, incluindo título, descrição, termos, validade e um botão de ação.
Rota: /(client)/ofertas/[ofertaId]
Parâmetro de Rota: ofertaId.
Componentes Principais: ScrollView, Animated.View, Image, TouchableOpacity.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints): getOfferDetails (do offerService).
Animações: headerAnim, contentAnim, imageAnim para animações de entrada, e ctaButtonScaleAnim para feedback de toque no botão de ação.
Interação:
router.back(): Volta para a tela anterior.
Botão de Ação: Placeholder para navegar para o agendamento com a oferta.
3.9. Ranking (app/(client)/ranking/)
3.9.1. Tela de Ranking (app/(client)/ranking/index.tsx)
Propósito: Exibir o leaderboard (ranking) dos usuários, com os top 3 destacados e a posição do usuário logado.
Rota: /(client)/ranking
Componentes Principais: FlatList, Animated.View, LinearGradient, RankingCard, RankingBadge, SLAResponseChip.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints): RankingService.getLeaderboard(period).
Gerenciamento de Estado: Utiliza @tanstack/react-query (implícito pelo RankingService) para gerenciar o estado dos dados do ranking.
Animações: headerAnim, heroAnim para animações de entrada.
Interação:
setPeriod: Altera o período do ranking (dia, semana, mês).
onRefresh: Permite puxar para atualizar o ranking.
jumpToMe: Rola a lista para a posição do usuário logado.
shareMyRank: Compartilha a posição do usuário no ranking via Share nativo.
3.10. Assinaturas (app/(client)/subscriptions/)
3.10.1. Tela de Lista de Assinaturas (app/(client)/subscriptions/index.tsx)
Propósito: Exibir uma lista das assinaturas ativas do cliente.
Rota: /(client)/subscriptions
Componentes Principais: FlatList, TouchableOpacity.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints): getSubscriptionsForUser (do subscriptionService).
Gerenciamento de Estado: Utiliza @tanstack/react-query para gerenciar o estado de carregamento, erro e dados das assinaturas.
Interação:
router.push: Navega para /(client)/subscriptions/[subscriptionId] (detalhes da assinatura).
3.10.2. Tela de Detalhes da Assinatura (app/(client)/subscriptions/[subscriptionId].tsx)
Propósito: Exibir os detalhes completos de uma assinatura específica e permitir ações como pausar, reativar ou cancelar.
Rota: /(client)/subscriptions/[subscriptionId]
Parâmetro de Rota: subscriptionId.
Componentes Principais: ScrollView, ActivityIndicator, TouchableOpacity.
Fluxo de Dados e Interações:
API Calls (Backend Endpoints):
getSubscriptionDetails: GET /subscriptions/:id.
updateSubscription: PATCH /subscriptions/:id.
Gerenciamento de Estado: Utiliza @tanstack/react-query para gerenciar o estado dos dados e mutações.
Interação:
handleStatusChange: Altera o status da assinatura (ativo, pausado, cancelado) após confirmação.
router.push: Navega para /(client)/bookings/[bookingId] (detalhes de agendamentos gerados pela assinatura).
4. Integração com o Backend
A comunicação entre o frontend do LimpeJá (módulo cliente) e o backend é estabelecida principalmente através de APIs RESTful (HTTP) para a maioria das operações e WebSockets para funcionalidades de comunicação em tempo real (chat).

Padrão de Comunicação: Todas as chamadas de API são realizadas através de serviços centralizados (authService.ts, clientService.ts, providerService.ts, bookingService.ts, chatService.ts, metricsService.ts, missionService.ts, offerService.ts, paymentService.ts, rankingService.ts, subscriptionService.ts, uploadService.ts) que utilizam uma instância configurada do Axios (api.ts).
Autenticação JWT: O AuthContext (via useAuth hook) gerencia o ciclo de vida do token JWT, armazenando-o no AsyncStorage e anexando-o aos cabeçalhos de requisição (Authorization: Bearer <token>) para todas as chamadas protegidas.
Consistência de Dados (DTOs): Há um forte alinhamento entre as interfaces TypeScript do frontend (presentes em LimpeJaApp/src/types/backend/) e os DTOs do backend, garantindo que a estrutura dos dados enviados e recebidos seja validada e consistente.
Tratamento de Erros: As chamadas de API incluem blocos try-catch para lidar com erros de rede ou respostas de erro do backend, muitas vezes relançando exceções com mensagens amigáveis para o usuário.
5. Princípios de Design e Padrões de Projeto (Frontend)
O desenvolvimento do módulo cliente segue os seguintes princípios para garantir um código limpo, testável e escalável:

Componentização: A UI é dividida em componentes pequenos e reutilizáveis (ex: PrestadorCard, RecomendacaoCard, HeaderSuperior, StarRating, InfoChip, AnimatedMenuItem, BookingSummaryCard, MissionList), promovendo a modularidade e a reutilização de código.
Gerenciamento de Estado:
Hooks do React: useState, useEffect, useRef, useCallback, useMemo são amplamente utilizados para gerenciar o estado local dos componentes e seus efeitos colaterais.
Context API: O AuthContext é um exemplo chave, fornecendo um estado global para informações de autenticação e perfil do usuário (user, token, isAuthenticated, isLoading).
@tanstack/react-query: Utilizado em diversas telas (search-results, metrics, ranking, subscriptions) para gerenciamento de estado assíncrono, cache, retries e otimização de requisições.
Navegação Declarativa: O Expo Router é utilizado para definir as rotas e gerenciar o fluxo de navegação de forma declarativa e baseada no sistema de arquivos.
Tipagem Forte (TypeScript): O uso rigoroso de TypeScript em todas as interfaces e componentes minimiza erros em tempo de execução e melhora a manutenibilidade do código, especialmente na integração com o backend.
Animações: A Animated API do React Native é empregada para criar transições suaves, feedback visual ao toque e efeitos de carregamento, aprimorando a experiência do usuário.
Responsividade: O uso de Dimensions e Platform.OS permite ajustes de layout e comportamento para diferentes tamanhos de tela e sistemas operacionais.
Internacionalização: Utiliza react-i18next para suporte a múltiplos idiomas, com chaves de tradução sendo passadas para componentes.
6. Histórico de Atualizações e Refatorações Recentes
Durante o processo de desenvolvimento e depuração, diversos componentes foram submetidos a refatorações significativas para resolver erros de tipagem, alinhar a estrutura de dados com as interfaces do backend e aprimorar a experiência do usuário:

bookings/index.tsx:
Correção de Tipagem: BookingDetails e BookingStatus foram importados centralizadamente para garantir consistência.
Filtros: Mapeamento correto de filtros do frontend para os BookingStatus do backend (ex: PENDING_PROVIDER_CONFIRMATION para 'requests', CANCELLED para 'cancelled').
bookings/[bookingId].tsx:
Tipagem: BookingDetails e BookingStatus importados de forma centralizada.
Formatação de Data/Hora: Correção para combinar scheduledDate e scheduledTime em um objeto Date para formatação.
Navegação de Feedback: Ajuste do pathname para /(common)/feedback/[targetId].
schedule-service.tsx:
Integração de Cupom: Adição de estados e lógica para couponCode, discountAmount, isApplyingCoupon, com animações de feedback.
Internacionalização: Integração com useTranslation para textos traduzidos.
Componentes Customizados: Refatoração em múltiplos componentes menores (ScheduleHeader, ScheduleCalendar, NotesInputSection, ConfirmBookingButton, BookingSummaryPreview, CouponInputSection).
Indicador de Progresso: Adição de um indicador de progresso multi-etapas.
success.tsx:
Integração PIX: Lógica para gerar cobrança PIX via createPixCharge.
Teasers de Recompensa: Adição de ReturnCouponCard e MissionReminderCard para engajamento pós-agendamento.
explore/index.tsx:
Gerenciamento de Promoções: Lógica aprimorada para exibir HtmlCouponCard, ReferralBanner, CouponPill e ReferralSheet com base na elegibilidade e interação do usuário, utilizando AsyncStorage.
Localização: Melhor tratamento da obtenção de localização para busca de provedores.
explore/[providerId].tsx:
Animações: Adição de animações de entrada e feedback de toque para botões de ação.
Ofertas: Exibição de ofertas específicas do provedor.
Componentes de Segurança: Integração de SideIcon para exibir informações de segurança flutuantes.
messages/index.tsx:
Tipagem: ConversationItem importado do chatService para consistência.
Dados Mockados: Inclusão de dados mockados que se conformam à interface ConversationItem.
messages/[chatId].tsx:
Verificação de Chat: Lógica para verificar o status do agendamento (BookingStatus) e bloquear o chat se o serviço estiver concluído ou cancelado.
Animações: chatBlockedAnim, inputContainerAnim, sendButtonScaleAnim para feedback visual e estados de chat.
PanicBanner: Integração do componente PanicBanner.
metrics/index.tsx:
Componentes de Visualização: Integração de LineChart, KPIValue, Skeleton, EmptyState.
useCallback: Uso de useCallback para fetchMetrics para otimização.
missions/index.tsx:
Estrutura de UI: Implementação de um dashboard de missões com simulador de desconto, seções de preferências e "como funciona", e abas de filtro.
Ícones 3D: Uso de ImageSourcePropType para ícones 3D.
profile/index.tsx:
Animações: Efeitos sutis de pulso, rotação e reflexo (glassmorphism) para elementos da UI.
Ícones 3D: Uso de ImageSourcePropType para ícones 3D nos itens de menu.
profile/edit.tsx:
Validação de Formulário: Melhoria na validação de campos (fullName, phone, address) com AnimatedErrorMessage.
Seleção de Avatar: Uso de Sheet para opções de seleção/remoção de avatar.
Componente Button: Inclusão do código do Button customizado diretamente no arquivo para demonstração.
ranking/index.tsx:
Visualização: Implementação de pílulas DeltaPill e ícones 3D para coroa e estatísticas.
FlatList: Uso de getItemLayout para otimização da FlatList.
subscriptions/index.tsx e subscriptions/[subscriptionId].tsx:
Gerenciamento de Estado: Uso de @tanstack/react-query para busca e mutação de dados.
Ações: Implementação de ações de pause, cancel e resume para assinaturas.
Esta documentação serve como um guia abrangente para o módulo cliente do LimpeJá App, detalhando sua estrutura, funcionalidades, integração com o backend e os princípios de desenvolvimento adotados.