Documentação Técnica do Frontend LimpeJá
1. Visão Geral e Propósito
O frontend do LimpeJá é a interface principal para os usuários (clientes e provedores de serviço) interagirem com a plataforma. Seu propósito central é fornecer uma experiência intuitiva e completa, permitindo que os clientes descubram e agendem serviços de limpeza e manutenção, gerenciem seus agendamentos, comuniquem-se com provedores e mantenham seu perfil pessoal atualizado. Para os provedores, oferece ferramentas para gerenciar sua agenda, serviços, ganhos e comunicação com os clientes.

Construído com React Native e Expo, este frontend se integra de forma transparente com o backend NestJS, utilizando uma arquitetura baseada em componentes e fluxos de dados bem definidos para garantir escalabilidade e manutenibilidade.

2. Tecnologias Principais
Framework UI: React Native
Navegação: Expo Router (com Tabs Navigator e Stack Navigator)
Gerenciamento de Estado Global: React Context API (ex: AuthContext, AppContext, ProviderRegistrationContext) e React Query para gerenciamento de estado assíncrono.
Tipagem: TypeScript (uso rigoroso para garantir consistência com o backend e reduzir erros em tempo de execução).
Estilização: StyleSheet do React Native, LinearGradient (Expo), BlurView (Expo).
Animações: React Native Animated API (Animated, Easing), react-native-reanimated para animações mais complexas e performáticas.
Ícones: @expo/vector-icons (Ionicons, MaterialCommunityIcons).
Utilitários Expo: expo-image-picker, expo-haptics, expo-clipboard, expo-location, expo-calendar, expo-constants.
Requisições HTTP: axios (utilizado internamente pelos serviços).
Comunicação em Tempo Real: socket.io-client.
Monitoramento de Erros: Sentry.
Mensagens Toast: react-native-toast-message.
Componentes de Calendário: react-native-calendars.
Gráficos: react-native-chart-kit (implícito em earnings.tsx).
3. Arquitetura de Navegação
A navegação no LimpeJá é gerenciada pelo Expo Router, que utiliza um sistema de arquivos para definir rotas. O aplicativo é dividido em grupos principais ((auth), (client), (provider), (common)) que representam diferentes fluxos de usuário ou seções comuns.

3.1. app/_layout.tsx (Layout Raiz) [index.tsx, _layout.tsx]
Este é o layout mais alto do aplicativo. Ele encapsula toda a aplicação com provedores de contexto globais (AppProvider, AuthProvider, ProviderRegistrationProvider) e lida com a lógica inicial de carregamento, autenticação e redirecionamento de usuários com base em seu status e função (UserRole, VerificationStatus).

Propósito: Gerenciar o ciclo de vida da autenticação, exibir telas de carregamento inicial e direcionar o usuário para a área apropriada (autenticação, cliente, provedor) após a inicialização.
Componentes Principais: Slot (do Expo Router), SplashScreen, ActivityIndicator, Toast.
Fluxo de Dados e Interações:
Utiliza useAuth() para verificar isAuthenticated, isLoading e user (função e status de verificação).
Redireciona usuários não autenticados para /welcome.
Redireciona provedores com base em seu verificationStatus (PENDING_INITIAL_REVIEW para service-details, PENDING_DOCUMENTS_UPLOAD ou PENDING_MANUAL_REVIEW para verify-account, APPROVED para o dashboard do provedor).
Redireciona clientes e administradores para a área do cliente (/(client)/explore).
Exibe um ActivityIndicator durante o carregamento inicial ou a autenticação.
Integra Toast para mensagens globais.
3.2. app/welcome.tsx (Tela de Boas-Vindas) [welcome.tsx]
A primeira tela que o usuário vê se não estiver autenticado.

Propósito: Apresentar o aplicativo e direcionar o usuário para o login ou registro.
Componentes Principais: Animated.View, Image, LinearGradient, Text.
Implementação: Contém animações de loop (logoRotateY, logoPulseScale, reflectionTranslateY, reflectionSkewX) usando react-native-reanimated para um efeito visual dinâmico no logo e seu reflexo. Redireciona automaticamente para a tela de login após um curto período.
3.3. app/(auth)/_layout.tsx (Grupo de Autenticação) [layout.tsx]
Define o layout para todas as telas relacionadas à autenticação e registro.

Propósito: Agrupar e configurar as opções de cabeçalho para as telas de login, registro de cliente, registro de provedor e recuperação de senha.
Componentes Principais: Stack.Screen.
3.4. app/(auth)/login.tsx (Tela de Login) [login.tsx]
Permite que os usuários façam login com e-mail e senha.

Propósito: Autenticar usuários existentes.
Rota: /(auth)/login.
Componentes Principais: KeyboardAvoidingView, ScrollView, Animated.View, Image, Text, TouchableOpacity, TextInput (através de InputWithIcon), ActivityIndicator, LinearGradient, AnimatedErrorMessage.
Fluxo de Dados e Interações:
Gerencia estados locais para email, password, loading, errorMessage.
Chama a função login do AuthContext para autenticação.
Exibe mensagens de erro e sucesso usando Toast.
Animações de entrada (mainElementsOpacity, mainElementsTranslateY) e animações de loop para o logo (logoRotateY, logoPulseScale).
Links para registro e recuperação de senha.
3.5. app/(auth)/register-options.tsx (Opções de Registro) [register-options.tsx]
Permite que o usuário escolha se deseja se registrar como cliente ou profissional.

Propósito: Direcionar o usuário para o fluxo de registro apropriado.
Rota: /(auth)/register-options.
Componentes Principais: Animated.View, Image, Text, TouchableOpacity, Link.
Implementação: Contém animações de entrada escalonadas para todos os elementos visuais, incluindo o logo e os botões de opção.
3.6. app/(auth)/client-register.tsx (Registro de Cliente) [client-register.tsx]
Guia o usuário através de um processo de registro em várias etapas para criar uma conta de cliente.

Propósito: Coletar informações necessárias para criar um perfil de cliente.
Rota: /(auth)/client-register.
Componentes Principais: KeyboardAvoidingView, ScrollView, Animated.View, Image, Text, TextInput, TouchableOpacity, ActivityIndicator, AnimatedErrorMessage.
Fluxo de Dados e Interações:
Processo de registro em 3 etapas (currentStep).
Validação de formulário para cada etapa (validateStep1, validateStep2, validateStep3).
Formatação de inputs (formatPhoneNumber, formatCpf, formatDateOfBirth).
Busca de endereço por CEP (fetchAddressFromRealCepApi).
Geolocalização: Utiliza expo-location (Location.requestForegroundPermissionsAsync, Location.geocodeAsync) para obter latitude e longitude do endereço fornecido, enviando-as no RegisterClientDto.
Chama signUpClient do AuthContext para registrar o cliente.
Animações de entrada (mainElementsOpacity, mainElementsTranslateY) e feedback de toque para botões.
3.7. app/(auth)/provider-register/_layout.tsx (Layout de Registro de Provedor) [layout.tsx]
Define o layout e o provedor de contexto para o fluxo de registro de provedores.

Propósito: Agrupar as telas de registro de provedor e fornecer o ProviderRegistrationContext para compartilhar dados entre as etapas.
Componentes Principais: Stack.Screen, ProviderRegistrationProvider.
3.8. app/(auth)/provider-register/index.tsx (Registro de Provedor - Etapa 1) [index.tsx]
Inicia o processo de registro de provedor, coletando informações básicas.

Propósito: Coletar informações iniciais do provedor (nome, email, telefone).
Rota: /(auth)/provider-register.
Componentes Principais: KeyboardAvoidingView, ScrollView, Animated.View, Image, Text, TextInput, TouchableOpacity, ActivityIndicator, AnimatedErrorMessage.
Fluxo de Dados e Interações:
Primeira etapa de um fluxo multi-etapa (embora as etapas subsequentes sejam tratadas em arquivos separados).
Validação de campos básicos (pureValidateStep1).
Busca de endereço por CEP (fetchAddressByCep).
Geolocalização: Solicita permissão e utiliza expo-location (Location.geocodeAsync) para obter coordenadas do endereço.
Chama signUpProvider do AuthContext e setContextPersonalDetails do ProviderRegistrationContext para persistir os dados e avançar.
Animações de entrada e feedback de toque.
3.9. app/(auth)/provider-register/personal-details.tsx (Registro de Provedor - Dados Pessoais) [personal-details.tsx]
Coleta dados pessoais e de endereço do provedor.

Propósito: Coletar CPF, data de nascimento, telefone e endereço completo do provedor.
Rota: /(auth)/provider-register/personal-details.
Componentes Principais: KeyboardAvoidingView, ScrollView, Animated.View, Text, TouchableOpacity, ActivityIndicator, DatePickerInput, InputWithIcon, SectionHeader, StandardInput.
Fluxo de Dados e Interações:
Preenche campos com dados do ProviderRegistrationContext se disponíveis.
Validação de formulário (validateForm) para todos os campos.
Formatação de CPF e telefone.
Busca de endereço por CEP (mockViaCepApi.getEndereco).
Persiste dados no ProviderRegistrationContext (setPersonalDetails) e navega para a próxima etapa.
Animações de entrada para o cabeçalho e feedback de toque para botões.
3.10. app/(auth)/provider-register/service-details.tsx (Registro de Provedor - Detalhes do Serviço) [service-details.tsx]
Permite que o provedor insira informações sobre seus serviços, experiência e foto de perfil.

Propósito: Coletar detalhes profissionais do provedor, incluindo foto de perfil, descrição, anos de experiência, tipo de precificação, chave PIX e especialidades.
Rota: /(auth)/provider-register/service-details.
Componentes Principais: ScrollView, TouchableOpacity, Image, TextInput, Animated.View, LinearGradient, Ionicons.
Fluxo de Dados e Interações:
Permite seleção de imagem de perfil (ImagePicker.launchImageLibraryAsync).
Upload de Imagem: Utiliza verificationService.uploadAvatar para enviar a foto de perfil para a nuvem.
Atualiza o perfil do provedor (updateMyProviderProfile).
Gerencia a adição e atualização de serviços oferecidos (addProviderServiceOffering, updateProviderServiceOffering) com base em SERVICE_MAPPINGS.
Validação de Negócio: Garante que pelo menos um tipo de serviço e um tipo de precificação sejam selecionados.
Avanço de Status: Chama verificationService.advanceVerificationStatus para indicar que o provedor concluiu a etapa de detalhes do serviço.
Atualiza o usuário no AuthContext (updateUser).
Animações de entrada e feedback de toque.
3.11. app/(auth)/provider-register/verify-account.tsx (Registro de Provedor - Verificação de Conta) [verify-account.tsx]
Gerencia o processo de verificação de documentos do provedor.

Propósito: Orientar o provedor na submissão de documentos (frente e verso de identidade) para verificação.
Rota: /(auth)/provider-register/verify-account.
Componentes Principais: KeyboardAvoidingView, ScrollView, Animated.View, Image, Text, TouchableOpacity, ActivityIndicator, DocumentUploadScreen (componente aninhado), ToastMessage.
Fluxo de Dados e Interações:
Exibe diferentes etapas de verificação (currentVerificationStep): inicialização, upload de documentos, verificação em andamento, rejeição.
Polling: useEffect para verificar periodicamente o status de verificação do provedor (verificationService.getProviderVerificationInfo) e atualizar a UI ou redirecionar.
Integra DocumentUploadScreen para a lógica de seleção/captura de imagens.
Upload de Documentos: Chama verificationService.uploadDocumentPhoto para enviar as fotos.
Lida com o motivo da rejeição (rejectionReason) e permite tentar novamente.
Animações de entrada e transição entre etapas.
3.12. app/(auth)/forgot-password.tsx (Esqueci a Senha) [forgot-password.tsx]
Permite que os usuários solicitem um link de redefinição de senha.

Propósito: Iniciar o processo de recuperação de senha.
Rota: /(auth)/forgot-password.
Componentes Principais: KeyboardAvoidingView, ScrollView, Text, TextInput, TouchableOpacity, ActivityIndicator, Ionicons.
Fluxo de Dados e Interações:
Valida o formato do e-mail.
Chama AuthService.sendPasswordReset para enviar o link de redefinição.
Exibe mensagens de sucesso ou erro.
3.13. app/(client)/_layout.tsx (Layout do Cliente) [layout.tsx]
Define o layout de abas para a área do cliente.

Propósito: Fornecer uma navegação de abas consistente para as principais funcionalidades do cliente.
Componentes Principais: Tabs.Screen, Ionicons.
Abas: Explorar, Agendamentos, Mensagens, Perfil.
3.14. app/(client)/explore/index.tsx (Explorar - Home do Cliente) [index.tsx]
A tela inicial para clientes, exibindo categorias, recomendações e profissionais próximos.

Propósito: Oferecer um ponto de partida para a descoberta de serviços e provedores.
Rota: /(client)/explore.
Componentes Principais: ScrollView, FlatList, Animated.View, HeaderSuperior, SecaoContainer, CategoriaCard, CarouselBannerItem, SecaoRecomendacoes, RecomendacaoCard, SecaoPrestadores, PrestadorCard, NavBar.
Fluxo de Dados e Interações:
Busca dados de perfil do usuário (getUserProfile), categorias de serviço (getServiceCategories), provedores recomendados (getRecommendedProviders), provedores próximos (getNearbyProviders) e ofertas (getOffers).
Animações de entrada escalonadas para cada seção.
Carrossel de banners com paginação e animações.
Navegação para telas de busca por categoria, detalhes de provedor, etc.
3.15. app/(client)/explore/[categoryId].tsx (Provedores por Categoria) [categoryId].tsx]
Exibe uma lista de provedores filtrados por uma categoria de serviço específica.

Propósito: Mostrar provedores que oferecem serviços dentro de uma categoria selecionada.
Rota: /(client)/explore/[categoryId].
Parâmetros de Rota: categoryId, categoryName.
Componentes Principais: FlatList, ActivityIndicator, Ionicons, CategoryProviderCard.
Fluxo de Dados e Interações:
Busca provedores por ID da categoria (getProvidersByServiceCategory).
Lida com estados de carregamento, erro e lista vazia.
Funcionalidade de "Pull-to-Refresh".
Animações de entrada para o cabeçalho e feedback visual.
3.16. app/(client)/explore/search-results.tsx (Resultados da Busca) [search-results.tsx]
Exibe resultados de busca por provedores com base em uma consulta ou categoria.

Propósito: Apresentar provedores que correspondem aos critérios de busca do usuário.
Rota: /(client)/explore/search-results.
Parâmetros de Rota: query, categoryId.
Componentes Principais: FlatList, ActivityIndicator, Ionicons, ProviderCard.
Fluxo de Dados e Interações:
Utiliza useQuery (React Query) para gerenciar o estado da busca e refetching (searchProviders).
Lida com estados de carregamento, erro e lista vazia.
3.17. app/(client)/explore/todas-categorias.tsx (Todas as Categorias) [todas-categorias.tsx]
Um placeholder para a tela que listaria todas as categorias de serviço.

Propósito: Listar todas as categorias de serviço disponíveis.
Rota: /(client)/explore/todas-categorias.
Implementação: Atualmente um componente básico com um título.
3.18. app/(client)/explore/todos-prestadores-proximos.tsx (Todos os Prestadores Próximos) [todos-prestadores-proximos.tsx]
Um placeholder para a tela que listaria todos os provedores próximos.

Propósito: Listar todos os provedores de serviço localizados nas proximidades do usuário.
Rota: /(client)/explore/todos-prestadores-proximos.
Implementação: Atualmente um componente básico com um título.
3.19. app/(client)/explore/servicos-por-categoria.tsx (Serviços por Categoria) [servicos-por-categoria.tsx]
Um placeholder para a tela que listaria serviços dentro de uma categoria específica.

Propósito: Listar os serviços oferecidos dentro de uma categoria selecionada.
Rota: /(client)/explore/servicos-por-categoria.
Parâmetros de Rota: categoriaId, categoriaNome.
Implementação: Atualmente um componente básico com um título e o ID da categoria.
3.20. app/(client)/explore/[providerId].tsx (Detalhes do Prestador) [providerStyles.ts, [providerId].tsx]
Exibe o perfil detalhado de um provedor de serviços.

Propósito: Fornecer uma visão abrangente do perfil de um provedor, incluindo descrição, experiência, avaliações, e ações de contato/agendamento.
Rota: /(client)/explore/[providerId].
Parâmetro de Rota: providerId.
Componentes Principais: ScrollView, Animated.View, Image, TouchableOpacity, Text, Ionicons, LinearGradient, InfoChip, ReviewCard, StarRating, BookServiceButton.
Fluxo de Dados e Interações:
Busca detalhes do provedor (getProviderDetails).
Verifica se o chat pode ser iniciado (checkActiveChatBooking).
Exibe informações como anos de experiência, status de verificação (usando InfoChip).
Renderiza avaliações (ReviewCard).
Lida com ações como ligar, chat (condicional), mapa, compartilhar.
Responsividade: Utiliza Dimensions e Platform para ajustar estilos.
Estilos: Utiliza providerStyles.ts para padronização visual.
Animações de entrada para a imagem, conteúdo principal, chips de informação e pulso para o botão de avaliação.
Botão fixo "Agendar Serviço" (BookServiceButton) na parte inferior, que navega para schedule-service.tsx.
3.21. app/(client)/bookings/index.tsx (Meus Agendamentos) [index.tsx]
Lista os agendamentos do cliente com opções de filtragem.

Propósito: Exibir todos os agendamentos do usuário, categorizados por status (solicitações, próximos, histórico, cancelados).
Rota: /(client)/bookings.
Componentes Principais: FlatList, ActivityIndicator, Animated.View, TouchableOpacity, Text, Ionicons, MaterialCommunityIcons, AnimatedBookingItem.
Fluxo de Dados e Interações:
Busca agendamentos por status (getBookingsForUser).
Filtra e exibe agendamentos com base no activeFilter.
Lida com estados de carregamento, atualização (RefreshControl) e lista vazia.
Animações de entrada escalonadas para os itens da lista (AnimatedBookingItem).
Feedback háptico (expo-haptics) nos botões de filtro.
3.22. app/(client)/bookings/[bookingId].tsx (Detalhes do Agendamento) [[bookingId].tsx]
Exibe os detalhes completos de um agendamento específico.

Propósito: Fornecer informações detalhadas sobre um agendamento e permitir ações como cancelar, contatar o provedor, avaliar o serviço ou ver o perfil do provedor.
Rota: /(client)/bookings/[bookingId].
Parâmetro de Rota: bookingId.
Componentes Principais: ScrollView, ActivityIndicator, Animated.View, Image, Text, TouchableOpacity, Ionicons.
Fluxo de Dados e Interações:
Busca detalhes do agendamento (getBookingDetails).
Permite cancelar o agendamento (cancelBooking).
Navega para o chat, tela de feedback ou perfil do provedor.
Animações de entrada para as seções de informação e feedback de toque para os botões.
Lógica condicional para exibir botões de ação com base no BookingStatus (ex: avaliar serviço apenas se COMPLETED e não avaliado).
3.23. app/(client)/bookings/schedule-service.tsx (Agendar Serviço) [schedule-service.tsx]
Guia o cliente através do processo de agendamento de um serviço.

Propósito: Permitir que o cliente selecione data, hora, endereço, detalhes do serviço e finalize o agendamento.
Rota: /(client)/bookings/schedule-service.
Parâmetros de Rota: providerId, serviceId, servicePrice.
Componentes Principais: Animated.ScrollView, Animated.View, Text, TouchableOpacity, TextInput, LinearGradient, Ionicons, ProviderBrief, AddressSection, ScheduleCalendar, TimeSlotsSection, ServiceDetailsInput, NotesInputSection, CouponInputSection, BookingSummaryPreview, ConfirmBookingButton.
Fluxo de Dados e Interações:
Busca dados iniciais do provedor e serviço (getProviderDetails).
Disponibilidade: Busca horários disponíveis do provedor (getProviderAvailability) e utiliza um cache (availabilityCache) para otimizar.
Cálculo de Preço: Lógica de cálculo de subtotal e preço final com base no tipo de precificação (PricingType.HOURLY, PricingType.BY_SIZE, FIXED_PRICE) e desconto de cupom.
Cupom de Desconto: Simula aplicação de cupom (handleApplyCoupon) com feedback visual.
Geolocalização: Utiliza coordenadas do endereço do usuário para o agendamento.
Criação de Agendamento: Envia os dados para o backend (createBooking).
Pagamento PIX: Se o método de pagamento for PIX, gera uma cobrança (createPixCharge) e exibe os detalhes.
Animações de entrada para a tela, pulso para elementos, e efeitos de brilho.
Indicador de progresso multi-etapas.
Botão fixo de confirmação na parte inferior.
3.24. app/(client)/bookings/success.tsx (Sucesso do Agendamento) [success.tsx]
Confirma visualmente o agendamento e oferece opções pós-agendamento.

Propósito: Informar ao usuário que o agendamento foi bem-sucedido e fornecer ações subsequentes (ver agendamentos, adicionar ao calendário, contatar provedor).
Rota: /(client)/bookings/success.
Parâmetros de Rota: bookingId, paymentMethod, totalPrice.
Componentes Principais: LinearGradient, BlurView, ScrollView, Animated.View, Text, TouchableOpacity, Ionicons, Toast, BookingSummaryCard, MainActionButtons, SuccessHeader, SuccessLoadingError, ImmediateActionButtons, SecurityInfoSection, LoyaltyTeaserSection.
Fluxo de Dados e Interações:
Busca detalhes do agendamento (getBookingDetails) e do provedor (getProviderDetails).
Geração de PIX: Se paymentMethod for PIX, chama createPixCharge para gerar a cobrança e exibe o código PIX.
Permite copiar o código PIX para a área de transferência (Clipboard.setString).
Permite adicionar o agendamento ao calendário do dispositivo (Calendar.createEventAsync).
Navega para a lista de agendamentos ou para a tela inicial.
Animações de entrada e efeitos visuais de "glassmorphism".
3.25. app/(client)/messages/index.tsx (Lista de Mensagens do Cliente) [index.tsx]
Exibe uma lista de conversas do cliente com provedores.

Propósito: Permitir que o cliente visualize e acesse seus chats com provedores.
Rota: /(client)/messages.
Componentes Principais: FlatList, ActivityIndicator, Animated.View, Image, Text, TouchableOpacity, Ionicons, AnimatedConversationItem.
Fluxo de Dados e Interações:
Busca a lista de conversas (getChatListForUser).
Lida com estados de carregamento e lista vazia.
Animações de entrada para o cabeçalho e os itens da lista.
Navegação para a tela de chat (messages/[chatId].tsx).
3.26. app/(client)/messages/[chatId].tsx (Tela de Chat do Cliente) [[chatId].tsx]
Permite a comunicação em tempo real entre o cliente e o provedor.

Propósito: Facilitar a troca de mensagens entre o cliente e o provedor para um agendamento específico.
Rota: /(client)/messages/[chatId].
Parâmetros de Rota: chatId, recipientName, recipientId, recipientAvatarUrl, bookingId.
Componentes Principais: KeyboardAvoidingView, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Animated.View, Image, Text, Ionicons, CustomChatHeader.
Fluxo de Dados e Interações:
WebSockets: Conecta-se a um servidor WebSocket (socket.io-client) para comunicação em tempo real (joinChat, newMessage, sendMessage, errorMessage, disconnect).
Busca histórico de mensagens (getChatMessages).
Verifica o BookingStatus associado ao bookingId para determinar se o chat deve ser bloqueado (ex: COMPLETED, CANCELLED).
Exibe mensagens de erro ou bloqueio de chat.
Animações para o input e o botão de enviar.
3.27. app/(client)/profile/index.tsx (Perfil do Cliente) [index.tsx]
Exibe o perfil do cliente e oferece acesso a diversas configurações e funcionalidades.

Propósito: Permitir que o cliente visualize suas informações, acesse configurações de conta, histórico e outras funcionalidades.
Rota: /(client)/profile.
Componentes Principais: ScrollView, Animated.View, Image, Text, TouchableOpacity, TextInput, Ionicons, MaterialCommunityIcons, LinearGradient, AnimatedMenuItem.
Fluxo de Dados e Interações:
Exibe informações do usuário (user do AuthContext).
Animações de entrada para o cabeçalho, perfil, barra de pesquisa e itens de menu.
Animações de pulso e rotação para ícones (missionIconPulseAnim, missionIconRotateAnim).
Efeitos de reflexo em elementos (searchBarContainer, missionsCard) usando Animated.View e LinearGradient.
Navegação para diversas telas: editar perfil, agendamentos, missões, indicações, fidelidade, termos, privacidade, ajuda, e logout.
Feedback háptico para interações.
3.28. app/(client)/profile/edit.tsx (Editar Perfil do Cliente) [edit.tsx]
Permite que o cliente visualize e atualize suas informações pessoais e de contato.

Propósito: Permitir que o cliente edite seu nome, telefone e endereço, e altere sua foto de perfil.
Rota: /(client)/profile/edit.
Componentes Principais: KeyboardAvoidingView, ScrollView, Animated.View, Image, Text, TextInput, TouchableOpacity, ActivityIndicator, Ionicons, MaterialCommunityIcons, AnimatedErrorMessage.
Fluxo de Dados e Interações:
Preenche campos com dados do user do AuthContext.
Permite selecionar imagem de perfil (ImagePicker).
Upload de Imagem: Envia a nova foto de perfil para a nuvem (uploadImageToCloud) e atualiza o AuthContext.
Validação de formulário (fullName, phone, address).
Formatação de telefone (formatPhoneNumber).
Atualiza o perfil do cliente (updateClientProfile) e o AuthContext (updateUser).
Animações de entrada, feedback de toque para botões, e animações de borda para inputs.
3.29. app/(client)/subscriptions/index.tsx (Minhas Assinaturas) [index.tsx]
Lista as assinaturas ativas do cliente.

Propósito: Exibir uma lista de serviços recorrentes (assinaturas) que o cliente possui.
Rota: /(client)/subscriptions.
Componentes Principais: FlatList, Text, TouchableOpacity.
Fluxo de Dados e Interações:
Busca assinaturas do usuário (getSubscriptionsForUser) usando useQuery (React Query).
Lida com estados de carregamento, erro e lista vazia.
Navega para os detalhes da assinatura (subscriptions/[subscriptionId].tsx).
3.30. app/(client)/subscriptions/[subscriptionId].tsx (Detalhes da Assinatura) [[subscriptionId].tsx]
Exibe os detalhes de uma assinatura específica e permite gerenciá-la.

Propósito: Fornecer informações detalhadas sobre uma assinatura e permitir ações como pausar, reativar ou cancelar.
Rota: /(client)/subscriptions/[subscriptionId].
Parâmetro de Rota: subscriptionId.
Componentes Principais: ScrollView, ActivityIndicator, Text, TouchableOpacity.
Fluxo de Dados e Interações:
Busca detalhes da assinatura (getSubscriptionDetails) usando useQuery.
Permite atualizar o status da assinatura (updateSubscription) usando useMutation (React Query).
Invalida caches de react-query após alterações para garantir dados atualizados.
Exibe agendamentos gerados pela assinatura.
3.31. app/(client)/missions.tsx (Minhas Missões) [missions.tsx]
Exibe as missões disponíveis para o usuário e permite resgatar recompensas.

Propósito: Engajar o usuário com desafios e recompensas.
Rota: /(client)/home/missions.
Componentes Principais: ScrollView, Animated.View, Text, TouchableOpacity, Ionicons, MissionList.
Fluxo de Dados e Interações:
Chama claimMission para resgatar recompensas.
Força a remontagem da lista de missões para refletir as atualizações.
Animações de entrada para o cabeçalho e conteúdo.
3.32. app/(client)/ranking/index.tsx (Ranking Global) [index.tsx]
Exibe um ranking de usuários (simulado).

Propósito: Gamificar a experiência do usuário através de um ranking.
Rota: /(client)/ranking.
Componentes Principais: FlatList, Animated.Text, RankingCard.
Implementação: Usa dados simulados (dummyRankingData). Animação de entrada para o título.
3.33. app/(client)/ofertas/[ofertaId].tsx (Detalhes da Oferta) [[ofertaId].tsx]
Exibe os detalhes de uma oferta específica.

Propósito: Apresentar informações detalhadas sobre uma promoção ou oferta.
Rota: /(client)/ofertas/[ofertaId].
Parâmetro de Rota: ofertaId.
Componentes Principais: ScrollView, ActivityIndicator, Animated.View, Image, Text, TouchableOpacity, Ionicons.
Fluxo de Dados e Interações:
Busca detalhes da oferta (getOfferDetails).
Lida com estados de carregamento e erro.
Animações de entrada para o cabeçalho, imagem e conteúdo.
Botão de ação (ctaButton) com feedback de toque.
3.34. app/(provider)/_layout.tsx (Layout do Provedor) [layout.tsx]
Define o layout de abas para a área do provedor.

Propósito: Fornecer uma navegação de abas consistente para as principais funcionalidades do provedor.
Componentes Principais: Tabs.Screen, Ionicons, MaterialCommunityIcons.
Abas: Painel, Agenda, Serviços, Ganhos, Mensagens, Perfil.
3.35. app/(provider)/dashboard/index.tsx (Painel do Provedor) [index.tsx]
O painel principal para os provedores, exibindo um resumo de suas atividades e acesso rápido a funcionalidades.

Propósito: Fornecer uma visão geral do desempenho do provedor, incluindo ganhos, solicitações pendentes, próximos serviços e avaliações recentes.
Rota: /(provider)/dashboard.
Componentes Principais: ScrollView, ActivityIndicator, Animated.View, Text, TouchableOpacity, Ionicons, MaterialCommunityIcons, DashboardHeader, FinancialSummaryCard, QuickActionsSection, RequestItem, ConfirmedServiceItem, AdvancedReviewsSection, SmartInsightsSection.
Fluxo de Dados e Interações:
Busca dados do dashboard (getMyProviderDashboard), incluindo informações financeiras e avaliações.
Busca agendamentos pendentes e confirmados (getBookingsForUser).
Permite aceitar ou rejeitar solicitações de agendamento (updateBookingStatus).
Navegação para telas de ganhos, serviços, mensagens, perfil e agenda.
Animações de entrada e feedback de toque para botões.
Utiliza useAnimatedTouch para feedback visual em botões.
3.36. app/(provider)/schedule/index.tsx (Minha Agenda do Provedor) [index.tsx]
Exibe a agenda do provedor com agendamentos e um calendário.

Propósito: Permitir que o provedor visualize seus agendamentos diários e gerencie sua disponibilidade.
Rota: /(provider)/schedule.
Componentes Principais: Calendar, FlatList, Animated.View, Text, TouchableOpacity, ActivityIndicator, Ionicons, MaterialCommunityIcons, AnimatedAppointmentItem, Timeline.
Fluxo de Dados e Interações:
Busca agendamentos para o usuário logado (fetchProviderAppointments).
Marca datas no calendário com base nos agendamentos.
Permite selecionar datas e visualizar agendamentos específicos.
Funcionalidade de "Pull-to-Refresh".
Navegação para a tela de gerenciamento de disponibilidade.
Animações de entrada para o cabeçalho, calendário, lista de agendamentos e itens individuais.
Componente Timeline para uma representação visual dos horários.
3.37. app/(provider)/schedule/manage-availability.tsx (Gerenciar Disponibilidade do Provedor) [manage-availability.tsx]
Permite que o provedor defina seus horários de disponibilidade. (Parece ser uma cópia de schedule/index.tsx e precisa de implementação específica para disponibilidade).

Propósito: (A ser implementado) Permitir que o provedor configure seus horários de trabalho e bloqueie/desbloqueie slots.
Rota: /(provider)/schedule/manage-availability.
Componentes Principais: Atualmente os mesmos de schedule/index.tsx.
Fluxo de Dados e Interações: (A ser implementado) Interagir com um serviço de disponibilidade no backend.
3.38. app/(provider)/services/index.tsx (Meus Serviços do Provedor) [index.tsx]
Lista os serviços oferecidos pelo provedor com opções de filtragem.

Propósito: Exibir os agendamentos do provedor, categorizados por solicitações pendentes, próximos e histórico.
Rota: /(provider)/services.
Componentes Principais: FlatList, ActivityIndicator, Animated.View, TouchableOpacity, Text, Ionicons, MaterialCommunityIcons, LinearGradient, BlurView, ServiceItemSkeleton, ToastMessage, AnimatedServiceItem.
Fluxo de Dados e Interações:
Busca agendamentos por status (getBookingsForUser).
Filtra e exibe agendamentos com base no filter (requests, upcoming, completed).
Lida com estados de carregamento, atualização (RefreshControl) e lista vazia.
Animações de entrada para o cabeçalho, filtros e itens da lista.
Navegação para a tela de edição de serviços.
3.39. app/(provider)/services/[serviceId].tsx (Detalhes do Agendamento do Provedor) [[serviceId].tsx]
Exibe os detalhes de um agendamento específico para o provedor. (O nome do arquivo sugere serviceId, mas o conteúdo é para bookingId).

Propósito: Fornecer ao provedor informações detalhadas sobre um agendamento.
Rota: /(provider)/services/[serviceId] (na verdade, [bookingId]).
Parâmetro de Rota: serviceId (na verdade, bookingId).
Componentes Principais: Animated.View, TouchableOpacity, Image, Text, Ionicons, MaterialCommunityIcons.
Fluxo de Dados e Interações:
Busca detalhes do agendamento (getBookingsForUser).
Adaptação de getStatusStyle para BookingStatus.
Animações de entrada e feedback de toque.
3.40. app/(provider)/earnings/index.tsx (Ganhos do Provedor) [earnings.tsx]
Exibe um resumo dos ganhos do provedor e permite solicitar saques.

Propósito: Permitir que o provedor visualize seus ganhos totais, saques pendentes, histórico de transações e solicite saques.
Rota: /(provider)/earnings.
Componentes Principais: ScrollView, ActivityIndicator, Animated.View, Text, TouchableOpacity, Ionicons, MaterialCommunityIcons, MainEarningsChartSection, EarningsChartSection, EarningsSummaryCard, RecentTransactionsSection, CustomHeader.
Fluxo de Dados e Interações:
Busca dados do dashboard (getMyProviderDashboard) e ganhos detalhados (getMyProviderEarnings).
Formata dados para exibição em gráficos (ChartData).
Permite solicitar saques (requestWithdrawal).
Navegação para detalhes bancários, serviços e avaliações.
Animações de entrada para o cabeçalho e seções.
3.41. app/(provider)/messages/index.tsx (Lista de Mensagens do Provedor) [index.tsx]
Exibe uma lista de conversas do provedor com clientes.

Propósito: Permitir que o provedor visualize e acesse seus chats com clientes.
Rota: /(provider)/messages.
Componentes Principais: FlatList, ActivityIndicator, Animated.View, Image, Text, TouchableOpacity, Ionicons, AnimatedConversationItem.
Fluxo de Dados e Interações:
Busca a lista de conversas (getChatListForUser).
Lida com estados de carregamento e lista vazia.
Animações de entrada para o cabeçalho e os itens da lista.
Navegação para a tela de chat (messages/[chatId].tsx).
3.42. app/(provider)/messages/[chatId].tsx (Tela de Chat do Provedor) [[chatId].tsx]
Permite a comunicação em tempo real entre o provedor e o cliente.

Propósito: Facilitar a troca de mensagens entre o provedor e o cliente para um agendamento específico.
Rota: /(provider)/messages/[chatId].
Parâmetros de Rota: chatId, recipientName, recipientId, recipientAvatarUrl, bookingId.
Componentes Principais: KeyboardAvoidingView, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Animated.View, Image, Text, Ionicons.
Fluxo de Dados e Interações:
WebSockets: Conecta-se a um servidor WebSocket (socket.io-client) para comunicação em tempo real (joinChat, newMessage, sendMessage, errorMessage, disconnect).
Busca histórico de mensagens (getChatMessages).
Verifica o BookingStatus associado ao bookingId para determinar se o chat deve ser bloqueado.
Exibe mensagens de erro ou bloqueio de chat.
Animações para o input e o botão de enviar.
3.43. app/(provider)/profile/edit-services.tsx (Editar Serviços do Provedor) [edit-services.tsx]
Permite que o provedor adicione, edite e exclua os serviços que oferece.

Propósito: Gerenciar a lista de serviços oferecidos pelo provedor, incluindo detalhes de precificação e duração.
Rota: /(provider)/profile/edit-services.
Componentes Principais: KeyboardAvoidingView, ScrollView, TextInput, Picker, FlatList, TouchableOpacity, Animated.View, ActivityIndicator, Ionicons, AnimatedServiceItem.
Fluxo de Dados e Interações:
Busca serviços oferecidos (getProviderServicesOffered).
Permite adicionar (addProviderServiceOffering), atualizar (updateProviderServiceOffering) e deletar (deleteProviderServiceOffering) serviços.
Normaliza inputs de moeda (normalizeCurrencyInput).
Analisa duração em minutos (parseDurationToMinutes).
Lida com diferentes PricingType (FIXED_PRICE, HOURLY, BY_SIZE).
Validação de formulário para os detalhes do serviço.
Animações de entrada para o cabeçalho, formulário, lista e itens individuais.
3.44. app/(common)/_layout.tsx (Layout Comum) [layout.tsx]
Define o layout para telas acessíveis tanto por clientes quanto por provedores.

Propósito: Agrupar e configurar as opções de cabeçalho para telas como configurações, ajuda, notificações e feedback.
Componentes Principais: Stack.Screen.
3.45. app/(common)/settings.tsx (Configurações) [settings.tsx]
Permite que o usuário ajuste preferências do aplicativo.

Propósito: Gerenciar configurações gerais do aplicativo, como notificações e modo escuro, e acessar informações sobre a conta e o aplicativo.
Rota: /(common)/settings.
Componentes Principais: ScrollView, Switch, TouchableOpacity, Text, Animated.View, Ionicons, MaterialCommunityIcons, AnimatedSettingSwitchItem, AnimatedSettingNavigationItem.
Fluxo de Dados e Interações:
Utiliza AppContext para gerenciar configurações (settings, updateSettings, toggleTheme).
Exibe a versão do aplicativo (Constants.expoConfig).
Permite abrir URLs externas (Linking.openURL) para termos e política de privacidade.
Animações de entrada escalonadas para seções e itens de configuração.
3.46. app/(common)/help.tsx (Ajuda e Suporte) [help.tsx]
Fornece Perguntas Frequentes (FAQs) e opções de contato com o suporte.

Propósito: Ajudar o usuário a encontrar respostas para perguntas comuns e entrar em contato com o suporte.
Rota: /(common)/help.
Componentes Principais: ScrollView, Animated.View, Text, TextInput, TouchableOpacity, ActivityIndicator, Ionicons, AnimatedFaqItem, AnimatedContactButton.
Fluxo de Dados e Interações:
Busca FAQs (getFaqs).
Permite buscar FAQs por termo.
Opções de contato via e-mail (Linking.openURL('mailto:...')) e telefone (Linking.openURL('tel:...')).
Animações de entrada escalonadas para o cabeçalho, busca, seções e itens.
3.47. app/(common)/notifications.tsx (Notificações) [notifications.tsx]
Lista as notificações do usuário.

Propósito: Exibir notificações importantes para o usuário e permitir gerenciá-las.
Rota: /(common)/notifications.
Componentes Principais: FlatList, ActivityIndicator, Animated.View, Text, TouchableOpacity, Ionicons, MaterialCommunityIcons, RefreshControl, AnimatedNotificationItem.
Fluxo de Dados e Interações:
Busca notificações (getNotifications).
Permite marcar notificações como lidas (markNotificationAsRead) e todas como lidas (markAllNotificationsAsRead).
Navega para a rota associada à notificação (item.navigateTo).
Lida com estados de carregamento, atualização e lista vazia.
Animações de entrada escalonadas para o cabeçalho e itens.
3.48. app/(common)/feedback/[targetId].tsx (Enviar Feedback) [[targetId].tsx]
Permite que o usuário envie feedback ou avalie serviços/provedores.

Propósito: Coletar avaliações e comentários sobre serviços, provedores ou o próprio aplicativo.
Rota: /(common)/feedback/[targetId].
Parâmetros de Rota: targetId, type (service, provider_profile, app_feedback), serviceName, providerName, providerId.
Componentes Principais: ScrollView, Text, TextInput, TouchableOpacity, ActivityIndicator, Ionicons, StarRating.
Fluxo de Dados e Interações:
Permite selecionar uma avaliação por estrelas (StarRating).
Envia o feedback (submitFeedback) para o backend, incluindo userId.
Validação de campos (avaliação e comentário).
3.49. app/(common)/feedback/dispute/index.tsx (Minhas Disputas) [index.tsx]
Lista as disputas do usuário.

Propósito: Exibir uma lista de disputas abertas ou resolvidas pelo usuário.
Rota: /(common)/feedback/dispute.
Componentes Principais: FlatList, Text, TouchableOpacity, Card, PrimaryButton, Icon, DisputeListItem.
Implementação: Utiliza dados simulados (mockDisputes). Permite navegar para os detalhes da disputa.
3.50. app/(common)/feedback/dispute/[bookingId].tsx (Detalhes da Disputa) [[bookingId].tsx]
Exibe os detalhes de uma disputa específica e permite a comunicação.

Propósito: Fornecer informações detalhadas sobre uma disputa e permitir que o usuário envie mensagens e anexe arquivos.
Rota: /(common)/feedback/dispute/[bookingId].
Parâmetro de Rota: bookingId.
Componentes Principais: ScrollView, Text, TextInput, TouchableOpacity, Card, PrimaryButton, TextInputWithIcon, Icon.
Implementação: Utiliza dados simulados (mockDisputeDetails). Simula envio de mensagens e upload de arquivos.
3.51. app/(common)/privacidade.tsx (Política de Privacidade) [privacidade.tsx]
Exibe a política de privacidade do aplicativo.

Propósito: Informar o usuário sobre como seus dados pessoais são coletados, usados e protegidos.
Rota: /(common)/privacidade.
Componentes Principais: ScrollView, Animated.Text, Animated.View, Text.
Implementação: Conteúdo estático com animações de entrada para o título e o corpo do texto.
3.52. app/(common)/termos.tsx (Termos de Serviço) [termos.tsx]
Exibe os termos de serviço do aplicativo.

Propósito: Informar o usuário sobre as regras e condições de uso do aplicativo.
Rota: /(common)/termos.
Componentes Principais: ScrollView, Text.
Implementação: Conteúdo estático.
3.53. app/(common)/loyalty.tsx (Programa de Fidelidade) [loyalty.tsx]
Exibe informações sobre o programa de fidelidade do usuário.

Propósito: Engajar o usuário com um programa de recompensas baseado em pontos.
Rota: /(common)/loyalty.
Componentes Principais: ScrollView, Animated.View, Text, TouchableOpacity, Alert, LoyaltySummaryCard, RewardItem, HowToEarnSection.
Implementação: Utiliza dados simulados (mockLoyaltyData). Permite simular o resgate de recompensas. Animações de entrada escalonadas para as seções.
3.54. app/(common)/referrals.tsx (Indique e Ganhe) [referrals.tsx]
Permite que o usuário compartilhe um código de indicação e veja seus ganhos.

Propósito: Incentivar o usuário a indicar novos usuários para o aplicativo.
Rota: /(common)/referrals.
Componentes Principais: ScrollView, Animated.View, Text, TouchableOpacity, Share, Alert, Icon, AnimatedCard, PrimaryButton.
Implementação: Utiliza dados simulados (mockReferralData). Permite compartilhar o código (Share.share) e copiá-lo (Clipboard.setString). Animações de entrada escalonadas e feedback de toque para botões.
3.55. app/(common)/panic.tsx (Botão de Pânico) [panic.tsx]
Permite que o usuário envie um alerta de pânico com sua localização.

Propósito: Oferecer uma ferramenta de segurança para situações de emergência.
Rota: /(common)/safety/panic.
Componentes Principais: View, Text, TouchableOpacity, ActivityIndicator, Animated.View, Ionicons.
Fluxo de Dados e Interações:
Geolocalização: Solicita e obtém a localização do usuário (Location.requestForegroundPermissionsAsync, Location.getCurrentPositionAsync).
Contador regressivo antes do envio do alerta.
Envia o alerta de pânico (reportPanic).
Animações de entrada e pulso para o botão de pânico.
3.56. app/(common)/incident-report.tsx (Relatar Incidente) [incident-report.tsx]
Permite que o usuário relate um incidente.

Propósito: Fornecer um formulário para que os usuários relatem incidentes ocorridos durante ou após um serviço.
Rota: /(common)/safety/incident-report.
Componentes Principais: ScrollView, TextInput, TouchableOpacity, Picker, ActivityIndicator, Animated.View, Ionicons.
Fluxo de Dados e Interações:
Permite selecionar o tipo de incidente (IncidentType).
Permite anexar imagens (ImagePicker.launchImageLibraryAsync).
Envia o relatório de incidente (reportIncident).
Animações de entrada para o cabeçalho e o formulário.
3.57. app/(common)/bookings/[bookingId].tsx (Detalhes da Reserva Ativa) [[bookingId].tsx]
Um placeholder simples para detalhes de uma reserva ativa.

Propósito: (A ser implementado) Exibir detalhes de uma reserva que está atualmente em andamento.
Rota: /(common)/bookings/[bookingId].
Implementação: Atualmente um componente básico com um texto.
4. Integração com o Backend
A comunicação entre o frontend do LimpeJá e o backend NestJS é estabelecida principalmente através de APIs RESTful (HTTP) para a maioria das operações e WebSockets para funcionalidades de comunicação em tempo real (chat).

Padrão de Comunicação: Todas as chamadas de API são realizadas através de serviços centralizados (ex: authService.ts, clientService.ts, providerService.ts, bookingService.ts, chatService.ts, etc.) que utilizam uma instância configurada do Axios (api.ts).
Autenticação JWT: O AuthContext (via useAuth hook) gerencia o ciclo de vida do token JWT, armazenando-o no AsyncStorage e anexando-o aos cabeçalhos de requisição (Authorization: Bearer <token>) para todas as chamadas protegidas.
Consistência de Dados (DTOs): Há um forte alinhamento entre as interfaces TypeScript do frontend (presentes em LimpeJaApp/src/types/backend/) e os DTOs do backend, garantindo que a estrutura dos dados enviados e recebidos seja validada e consistente.
Tratamento de Erros: As chamadas de API incluem blocos try-catch para lidar com erros de rede ou respostas de erro do backend, muitas vezes relançando exceções com mensagens amigáveis para o usuário. Sentry é usado para monitoramento de erros em produção.
WebSockets: Para funcionalidades de chat, socket.io-client é utilizado para estabelecer uma conexão persistente com o backend (ChatGateway), permitindo o envio e recebimento de mensagens em tempo real.
5. Princípios de Design e Padrões de Projeto (Frontend)
O desenvolvimento do frontend do LimpeJá segue os seguintes princípios para garantir um código limpo, testável e escalável:

Componentização: A UI é dividida em componentes pequenos e reutilizáveis (ex: PrestadorCard, AnimatedMenuItem, InputWithIcon, StarRating), promovendo a modularidade e a reutilização de código.
Gerenciamento de Estado:
Hooks do React: useState, useEffect, useRef, useCallback, useMemo são amplamente utilizados para gerenciar o estado local dos componentes e seus efeitos colaterais.
Context API: O AuthContext, AppContext e ProviderRegistrationContext fornecem um estado global para informações de autenticação, preferências do usuário e dados de registro em fluxo multi-etapas.
React Query: Utilizado para gerenciamento de estado assíncrono (fetching, caching, sincronização e atualização de dados do servidor), reduzindo boilerplate e melhorando a experiência do desenvolvedor e do usuário.
Navegação Declarativa: O Expo Router é utilizado para definir as rotas e gerenciar o fluxo de navegação de forma declarativa e baseada no sistema de arquivos.
Tipagem Forte (TypeScript): O uso rigoroso de TypeScript em todas as interfaces e componentes minimiza erros em tempo de execução e melhora a manutenibilidade do código, especialmente na integração com o backend.
Animações: A Animated API do React Native e react-native-reanimated são empregadas para criar transições suaves, feedback visual ao toque, efeitos de carregamento e elementos dinâmicos (como o logo na tela de boas-vindas), aprimorando a experiência do usuário. Efeitos como pulse, scale, translateY, opacity, rotate, skew são comuns.
Responsividade: O uso de Dimensions e Platform.OS permite ajustes de layout e comportamento para diferentes tamanhos de tela e sistemas operacionais. Estilos são frequentemente definidos com base em porcentagens ou flex para se adaptar a diferentes tamanhos de tela.
Feedback Háptico: expo-haptics é utilizado para fornecer feedback tátil sutil em interações chave, como cliques em botões de filtro.
6. Responsividade
A responsividade no LimpeJá é abordada em vários níveis:

Flexbox: O uso extensivo de flexbox no StyleSheet permite que os componentes se ajustem dinamicamente ao espaço disponível.
Dimensions API: A API Dimensions do React Native (Dimensions.get('window').width, Dimensions.get('window').height) é usada para calcular tamanhos relativos de elementos (ex: SCREEN_WIDTH, IMAGE_HEIGHT em providerStyles.ts) e ajustar layouts para diferentes proporções de tela.
Platform.OS: Condicionais baseadas em Platform.OS são usadas para aplicar estilos ou comportamentos específicos para iOS e Android (ex: paddingTop para a StatusBar, shadowColor e elevation para sombras, KeyboardAvoidingView para o teclado).
Unidades Relativas: Embora não explicitamente visto em todos os lugares, o uso de padding, margin, fontSize em unidades absolutas é comum, mas a combinação com flex e Dimensions ajuda na adaptação. Para textos, lineHeight é ajustado para melhor legibilidade.
KeyboardAvoidingView: Usado em formulários para garantir que os inputs não sejam cobertos pelo teclado virtual.
7. Funções e Hooks Globais/Reutilizáveis
Várias funções e hooks são definidos e reutilizados em múltiplos componentes para promover a consistência e a modularidade:

useAuth(): Hook customizado que fornece acesso ao contexto de autenticação (isAuthenticated, user, login, logout, signUpClient, signUpProvider, refreshUser, setIsRegistrationInProgress). [login.tsx, _layout.tsx, client-register.tsx, provider-register/index.tsx, provider-register/service-details.tsx, provider-register/verify-account.tsx, [providerId].tsx, dashboard/index.tsx, earnings/index.tsx, messages/index.tsx, notifications.tsx, profile/edit.tsx, profile/index.tsx, schedule/index.tsx, services/index.tsx, schedule-service.tsx, [chatId].tsx]
useProviderRegistration(): Hook customizado para gerenciar o estado do formulário de registro de provedor em múltiplas etapas. [provider-register/index.tsx, provider-register/personal-details.tsx, provider-register/_layout.tsx, document-upload.tsx]
useAppContext(): Hook customizado para gerenciar configurações globais do aplicativo, como modo escuro. [settings.tsx]
useAnimatedTouch(): Hook customizado para adicionar feedback visual (escala) em botões ao serem pressionados. [dashboard/index.tsx, earnings/index.tsx]
formatDate(): Função utilitária para formatar datas em diferentes formatos de exibição. [schedule/index.tsx, bookings/index.tsx, services/index.tsx, [ofertaId].tsx, [chatId].tsx, missions.tsx]
formatPhoneNumber(): Função utilitária para formatar números de telefone. [client-register.tsx, profile/edit.tsx]
isValidPhoneNumber(): Função utilitária para validar o formato de números de telefone. [profile/edit.tsx]
formatCpf(): Função utilitária para formatar números de CPF. [client-register.tsx]
formatDateOfBirth(): Função utilitária para formatar datas de nascimento. [client-register.tsx]
normalizeCurrencyInput(): Função utilitária para normalizar e formatar inputs de moeda. [edit-services.tsx]
parseDurationToMinutes(): Função utilitária para converter strings de duração em minutos. [edit-services.tsx]
uploadImageToCloud(): Serviço para upload de imagens para um serviço de armazenamento em nuvem. [profile/edit.tsx, provider-register/index.tsx]
AnimatedErrorMessage: Componente reutilizável para exibir mensagens de erro com animação de fade. [client-register.tsx, login.tsx, provider-register/index.tsx, profile/edit.tsx]
InputWithIcon: Componente reutilizável para inputs de texto com um ícone. [personal-details.tsx, login.tsx]
DatePickerInput: Componente reutilizável para seleção de datas. [personal-details.tsx]
SectionHeader: Componente reutilizável para títulos de seção. [personal-details.tsx]
StandardInput: Componente reutilizável para inputs de texto padrão. [personal-details.tsx]
8. Observações e Refatorações Recentes
Durante o processo de desenvolvimento e depuração, os seguintes componentes foram submetidos a refatorações significativas para resolver erros de tipagem e alinhar a estrutura de dados com as interfaces do backend, além de melhorias de UI/UX:

Tipagens de DTOs: Houve um esforço contínuo para garantir que as interfaces TypeScript em src/types/backend/ correspondessem exatamente aos DTOs do backend, resolvendo erros como "A propriedade 'distance' não existe no tipo 'Provider'".
BookingStatus: Correção da tipagem e uso consistente do enum BookingStatus (ex: CANCELLED com dois 'L's em vez de CANCELED) em várias telas de agendamento (bookings/index.tsx, services/index.tsx, dashboard/index.tsx, [bookingId].tsx).
Serviços Reais: A transição de dados simulados (mocks) para chamadas de serviço reais (getFaqs, getChatListForUser, getNotifications, getOfferDetails, submitFeedback, getBookingsForUser, getMyProviderDashboard, getMyProviderEarnings, requestWithdrawal, createPixCharge, updateBookingStatus, cancelBooking, getProviderDetails, checkActiveChatBooking, updateClientProfile, uploadImageToCloud, updateMyProviderProfile, addProviderServiceOffering, updateProviderServiceOffering, deleteProviderServiceOffering, verificationService.uploadAvatar, verificationService.uploadDocumentPhoto, verificationService.advanceVerificationStatus) foi um ponto chave, garantindo que a aplicação interaja com o backend de forma funcional.
ProviderDashboard: A interface ProviderDashboard foi corrigida e seu uso padronizado para refletir os dados completos do painel do provedor, incluindo avaliações.
Animações: Implementação extensiva de animações de entrada escalonadas (Animated.stagger), pulso (Animated.loop), feedback de toque (Animated.spring) e efeitos visuais como reflexos e brilhos para melhorar a experiência do usuário e indicar estados de carregamento ou interação.
Componentização Aprimorada: Várias seções de telas complexas foram refatoradas em componentes menores e reutilizáveis (ex: ScheduleHeader, AddressSection, TimeSlotsSection, BookingSummaryPreview, CouponInputSection em schedule-service.tsx), tornando o código mais modular e legível.
Validações de Formulário: Melhoria das validações de formulário, com feedback visual animado e mensagens de erro claras.
Gerenciamento de Estado de Carregamento: Uso mais robusto de estados de isLoading e isRefreshing com ActivityIndicator e RefreshControl para feedback ao usuário.
useQuery e useMutation (React Query): Adição e expansão do uso desses hooks para gerenciar o estado assíncrono de fetching e mutação de dados, simplificando o código, melhorando o desempenho e a confiabilidade das atualizações de dados.
ToastMessage: Integração de um componente de Toast para exibir mensagens de sucesso/erro/informação de forma não intrusiva.
UI/UX: Várias telas (ex: schedule-service.tsx, [providerId].tsx, dashboard/index.tsx, messages/index.tsx) receberam atualizações visuais significativas para alinhar com um design mais moderno e intuitivo, incluindo novas paletas de cores, sombras, bordas arredondadas e ícones aprimorados.