Documentação do Frontend LimpeJáApp
O LimpeJáApp é uma aplicação mobile construída com React Native e Expo, projetada para conectar clientes a profissionais de limpeza e organização. Este frontend robusto e interativo gerencia todo o ciclo de vida do usuário, desde o registro e autenticação até o agendamento de serviços, comunicação e gestão de perfis.

1. Visão Geral da Arquitetura
O frontend do LimpeJáApp segue uma arquitetura modular e baseada em componentes, utilizando as seguintes tecnologias e padrões:

React Native & Expo: Para desenvolvimento de aplicações multiplataforma (iOS e Android).
Expo Router: Para roteamento e navegação declarativa, com suporte a layouts aninhados e grupos de rotas.
Context API (React): Para gerenciamento de estado global (autenticação, configurações do aplicativo, dados de registro de provedor).
Axios: Para requisições HTTP à API de backend, com interceptadores para tratamento de autenticação e erros globais.
TypeScript: Para tipagem estática, garantindo maior robustez e manutenibilidade do código.
Reanimated: Para animações fluidas e de alto desempenho.
Estrutura de Pastas: Organizada por funcionalidades e papéis ((auth), (client), (provider), (common)), facilitando a localização e o isolamento de responsabilidades.
2. Módulos Core e Utilitários
Esta seção descreve os módulos fundamentais que suportam a operação de toda a aplicação.

2.1. api.ts
Caminho: LimpeJaApp/app/services/api.ts
Propósito: Configura e exporta uma instância global do Axios para todas as requisições HTTP ao backend. Centraliza a lógica de autenticação (JWT) e tratamento de erros (401 Unauthorized).
Dependências: axios, @react-native-async-storage/async-storage, expo-constants.
Exporta: Uma instância api do Axios como default export.
Funcionalidades Chave:
API_BASE_URL: Define a URL base do backend, obtida de Constants.expoConfig.extra.backendApiUrl ou http://localhost:3000 para desenvolvimento local.
Interceptors de Requisição: Adiciona automaticamente o token JWT (auth_token) ao cabeçalho Authorization de cada requisição, se disponível no AsyncStorage.
Interceptors de Resposta: Intercepta respostas da API. Em caso de 401 Unauthorized, tenta chamar um callback de logout (onUnauthorizedCallback) registrado, e remove os dados de autenticação do AsyncStorage para forçar o relogin. Isso previne loops infinitos de autenticação.
Interconexões: É importado por quase todos os serviços (authService, providerService, clientService, etc.) para realizar chamadas HTTP.
2.2. authService.ts
Caminho: LimpeJaApp/services/authService.ts
Propósito: Gerencia a lógica de autenticação do usuário, incluindo login, registro, redefinição de senha e logout, interagindo diretamente com a API de backend. Armazena e recupera dados de autenticação no AsyncStorage.
Dependências: @react-native-async-storage/async-storage, api.ts, AuthResponse, UserRole, UserProfile.
Exporta: Uma instância singleton de AuthService.
Funcionalidades Chave:
login(credentials): Envia credenciais para /auth/login, salva o accessToken, user.role, user.id e user completo no AsyncStorage. Define o token no cabeçalho do Axios.
registerClient(userData): Envia dados para /auth/register/client, salva os dados de autenticação.
registerProvider(userData): Envia dados para /auth/register/provider, salva os dados de autenticação.
sendPasswordReset(email): Envia uma requisição real ao endpoint de redefinição de senha do backend (POST /auth/forgot-password).
logout(): Remove todos os dados de autenticação do AsyncStorage e limpa o token do Axios.
loadAuthData(): Carrega dados de autenticação do AsyncStorage na inicialização do app.
storeAuthData(): Método público para salvar dados de autenticação programaticamente.
setAuthToken(token) / getAuthToken(): Gerencia o token JWT em memória e no cabeçalho do Axios.
Interconexões: Utilizado pelo AuthContext para executar as operações de autenticação e persistir o estado do usuário.
2.3. contexts/AuthContext.tsx
Caminho: LimpeJaApp/contexts/AuthContext.tsx
Propósito: Fornece um contexto global para o estado de autenticação do usuário (isAuthenticated, user, isLoading) e funções relacionadas (login, logout, signUpClient, signUpProvider, refreshUser, updateUser).
Dependências: React, AuthService, UserProfile, AuthResponse, UserRole, VerificationStatus, LoginDto, RegisterClientDto, RegisterProviderDto, UpdateProviderProfileData, UpdateClientProfileDto.
Exporta: AuthProvider (componente provedor) e useAuth (hook customizado).
Funcionalidades Chave:
Carregamento Inicial: Na montagem, tenta carregar dados de autenticação do AsyncStorage via AuthService.loadAuthData().
login(credentials): Chama AuthService.login(), atualiza o estado do contexto.
logout(): Chama AuthService.logout(), limpa o estado do contexto.
signUpClient(data) / signUpProvider(data): Chama AuthService.registerClient() / AuthService.registerProvider(), atualiza o estado.
refreshUser(): Recarrega o perfil do usuário do backend via userService.getMe().
updateUser(partialUser): Atualiza parcialmente o objeto user no contexto e no AsyncStorage.
isRegistrationInProgress: Sinaliza se um registro de provedor está em andamento, usado para direcionar o fluxo de verificação.
Interconexões: É o coração da gestão de sessão. Componentes da UI (login.tsx, client-register.tsx, dashboard/index.tsx, _layout.tsx) consomem este contexto para exibir informações do usuário, controlar acesso e navegar.
2.4. _layout.tsx (Root)
Caminho: LimpeJaApp/app/_layout.tsx
Propósito: O layout raiz da aplicação, responsável por inicializar os provedores de contexto (AuthProvider, ProviderRegistrationProvider, AppProvider) e gerenciar a lógica de roteamento e redirecionamento baseada no estado de autenticação e no papel/status de verificação do usuário.
Dependências: expo-router, AuthContext, ProviderRegistrationContext, AppContext, UserRole, VerificationStatus, AUTH_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES.
Funcionalidades Chave:
SplashScreen.preventAutoHideAsync(): Mantém a splash screen visível até que o app esteja pronto.
Lógica de Redirecionamento: O useEffect principal decide para onde redirecionar o usuário com base em:
Não Autenticado: Redireciona para /welcome ou mantém em rotas de autenticação.
Autenticado (Provedor):
APPROVED: Redireciona para o dashboard do provedor.
PENDING_INITIAL_REVIEW: Redireciona para provider-register/service-details.
PENDING_DOCUMENTS_UPLOAD / Outros pendentes: Redireciona para provider-register/verify-account.
Autenticado (Cliente/Admin): Redireciona para a tela de exploração do cliente.
Interconexões: Depende fortemente do AuthContext para obter o estado de autenticação e os detalhes do usuário. É o ponto de entrada para a navegação principal da aplicação.
3. Autenticação e Registro
Esta seção detalha as telas e o fluxo para autenticação e registro de novos usuários.

3.1. welcome.tsx
Caminho: LimpeJaApp/app/welcome.tsx
Propósito: Tela inicial de boas-vindas com animações de logo, que redireciona automaticamente para a tela de login.
Dependências: react-native-reanimated, expo-router, expo-linear-gradient.
Funcionalidades Chave:
Exibe um logo animado com efeitos de escala, rotação e reflexo.
Redireciona automaticamente para a tela de login (/(auth)/login) após um curto período.
Interconexões: É a primeira tela que o usuário vê ao abrir o aplicativo, antes de qualquer lógica de autenticação ser processada.
3.2. login.tsx
Caminho: LimpeJaApp/app/(auth)/login.tsx
Propósito: Tela de login para usuários existentes, permitindo autenticação via e-mail e senha.
Dependências: expo-router, React, Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, LinearGradient, useAuth, UserRole, AnimatedReanimated, Easing, Extrapolate, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming, AnimatedErrorMessage, InputWithIcon.
Funcionalidades Chave:
Formulário de entrada para e-mail e senha.
Animações de entrada e de loop para o logo.
handleLogin(): Valida e-mail e senha, chama login() do AuthContext. Exibe mensagens de erro ou sucesso.
Links para cadastro e recuperação de senha.
Interconexões: Interage com AuthContext para realizar o login. O redirecionamento pós-login é gerenciado pelo _layout.tsx raiz.
3.3. register-options.tsx
Caminho: LimpeJaApp/app/(auth)/register-options.tsx
Propósito: Permite ao usuário escolher se deseja se cadastrar como "Cliente" ou "Profissional".
Dependências: React, Animated, StatusBar, StyleSheet, TouchableOpacity, View, Image, Platform, Stack, useRouter, Link, Ionicons, MaterialCommunityIcons.
Funcionalidades Chave:
Botões animados para "Sou Cliente" e "Sou Profissional".
Link para a tela de login para usuários existentes.
Animações de entrada escalonadas para os elementos da tela.
Interconexões: Redireciona para client-register.tsx ou para o grupo provider-register.
3.4. client-register.tsx
Caminho: LimpeJaApp/app/(auth)/client-register.tsx
Propósito: Gerencia o fluxo de registro de um novo cliente em três etapas: informações básicas, dados pessoais e endereço. Integra-se com a API ViaCEP para preenchimento automático de endereço.
Dependências: React, Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Stack, useRouter, useAuth, CreateAddressDto, RegisterClientDto, AnimatedErrorMessage.
Funcionalidades Chave:
Fluxo Multi-etapas: Controla a navegação entre as etapas de registro.
Validação por Etapa: Funções validateStep1(), validateStep2(), validateStep3() para garantir a integridade dos dados antes de avançar.
fetchAddressFromRealCepApi(cep): Função utilitária para buscar dados de endereço na API ViaCEP.
fetchAddressFromCep(): Dispara a busca de CEP e preenche os campos de endereço.
handleSignUp(): Coleta todos os dados, chama signUpClient() do AuthContext para registrar o cliente no backend.
Formatação de telefone, CPF e data de nascimento em tempo real.
Interconexões: Interage com AuthContext para o registro.
3.5. forgot-password.tsx
Caminho: LimpeJaApp/app/(auth)/forgot-password.tsx
Propósito: Permite que o usuário solicite um link de redefinição de senha para seu e-mail.
Dependências: React, Stack, useRouter, Ionicons, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform.
Funcionalidades Chave:
Formulário para inserir o e-mail.
AuthService.sendPasswordReset(email): Chama o método sendPasswordReset da instância AuthService para enviar uma requisição real ao backend.
Exibe mensagens de sucesso ou erro.
Botão para voltar à tela de login.
Interconexões: Interage com AuthService para a funcionalidade de redefinição de senha.
3.6. _layout.tsx (Auth Group)
Caminho: LimpeJaApp/app/(auth)/_layout.tsx
Propósito: Define o layout de navegação para todas as telas dentro do grupo de autenticação ((auth)).
Dependências: expo-router.
Funcionalidades Chave:
Configura Stack.Screen para cada tela de autenticação, definindo headerShown e title.
O diretório provider-register é tratado como uma tela, permitindo que seu próprio _layout.tsx gerencie as sub-rotas.
Interconexões: É um layout aninhado do _layout.tsx raiz.
4. Gestão de Provedores e Onboarding
Esta seção detalha o fluxo de registro e as funcionalidades específicas para provedores de serviços.

4.1. provider-register/_layout.tsx
Caminho: LimpeJaApp/app/(auth)/provider-register/_layout.tsx
Propósito: Define o layout de navegação para as etapas do registro de provedor.
Dependências: expo-router, ProviderRegistrationProvider.
Funcionalidades Chave:
Envolve as telas de registro de provedor com o ProviderRegistrationProvider.
Define os títulos do cabeçalho para cada etapa do registro.
Interconexões: É um layout aninhado dentro do grupo de autenticação.
4.2. contexts/ProviderRegistrationContext.tsx
Caminho: LimpeJaApp/contexts/ProviderRegistrationContext.tsx
Propósito: Gerencia o estado e a lógica de registro de provedores em várias etapas, persistindo os dados entre as telas e orquestrando a submissão final ao backend.
Dependências: React, useAuth, RegisterProviderDto, ServiceDetailsFormData.
Exporta: ProviderRegistrationProvider (componente provedor) e useProviderRegistration (hook customizado).
Funcionalidades Chave:
personalDetails / serviceDetails: Armazena os dados coletados nas diferentes etapas do registro.
submitRegistration(serviceDetailsData): Coleta todos os dados (pessoais + serviço), chama signUpProvider() do AuthContext para registrar o provedor. Após o registro inicial, atualiza o perfil do provedor com os detalhes do serviço via updateMyProviderProfile().
Interconexões: Consumido pelas telas de registro de provedor (index.tsx, personal-details.tsx, service-details.tsx) para compartilhar e persistir dados.
4.3. provider-register/index.tsx
Caminho: LimpeJaApp/app/(auth)/provider-register/index.tsx
Propósito: Primeira etapa do registro de provedor, coletando informações básicas (nome, e-mail, telefone).
Dependências: React, Animated, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Ionicons, MaterialCommunityIcons, ImagePicker, Stack, useRouter, useAuth, useProviderRegistration, RegisterProviderDto, AnimatedErrorMessage, uploadService.
Funcionalidades Chave:
Formulário para nome, e-mail e telefone.
Validação local dos campos.
handlePickImage(): Permite ao usuário selecionar uma foto de perfil.
fetchAddressByCep(): Integração com ViaCEP para preencher endereço automaticamente (embora a lógica principal de endereço tenha sido movida para personal-details.tsx em refatorações posteriores).
handleNext(): Valida os campos e avança para a próxima etapa. Na etapa 3, chama signUpProvider() do AuthContext para o registro inicial.
handleServiceDetailsSubmit(): Na última etapa, gerencia o upload da foto de perfil (uploadService.uploadImageToCloud) e chama submitRegistration() do ProviderRegistrationContext para finalizar o registro.
Interconexões: Interage com AuthContext para o registro inicial e ProviderRegistrationContext para a submissão final dos detalhes do serviço.
4.4. provider-register/personal-details.tsx
Caminho: LimpeJaApp/app/(auth)/provider-register/personal-details.tsx
Propósito: Segunda etapa do registro de provedor, coletando dados pessoais (CPF, data de nascimento, senha) e detalhes de endereço.
Dependências: React, Animated, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Ionicons, ActivityIndicator, Stack, useRouter, useProviderRegistration, DatePickerInput, InputWithIcon, SectionHeader, StandardInput.
Funcionalidades Chave:
Formulário para CPF, data de nascimento, senha e endereço completo.
Integração com mockViaCepApi (simulação) para preenchimento automático de endereço via CEP.
Validação de todos os campos.
handleNext(): Valida os campos, salva os personalDetails no ProviderRegistrationContext e navega para a próxima etapa.
Interconexões: Consome e atualiza o ProviderRegistrationContext.
4.5. provider-register/service-details.tsx
Caminho: LimpeJaApp/src/app/(provider)/provider-register/service-details.tsx (Nota: o caminho no código é diferente do (auth) group, o que pode indicar uma refatoração ou erro no caminho do arquivo)
Propósito: Terceira etapa do registro de provedor, coletando detalhes sobre os serviços oferecidos, experiência, estrutura de preços e chave PIX.
Dependências: React, Animated, Alert, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Ionicons, LinearGradient, ImagePicker, useRouter, useAuth, updateMyProviderProfile, addProviderServiceOffering, updateProviderServiceOffering, getProviderServicesOffered, verificationService.
Funcionalidades Chave:
Formulário para descrição do serviço, anos de experiência, preço base, chave PIX, especialidades e áreas de atendimento.
handleImagePicker(): Permite selecionar uma foto de perfil.
handleContinue():
Faz upload da foto de perfil via verificationService.uploadSelfie().
Atualiza o perfil do provedor (updateMyProviderProfile).
Busca serviços já oferecidos (getProviderServicesOffered).
Adiciona ou atualiza os serviços oferecidos (addProviderServiceOffering, updateProviderServiceOffering), mapeando especialidades para serviceIds.
Atualiza o user no AuthContext com a nova avatarUrl.
Redireciona para a tela de verificação de conta.
Interconexões: Interage com useAuth e vários serviços de provedor para persistir os dados no backend.
4.6. provider-register/verify-account.tsx
Caminho: LimpeJaApp/app/(auth)/provider-register/verify-account.tsx
Propósito: Gerencia o fluxo de verificação de conta do provedor, incluindo upload de documentos e verificação de status.
Dependências: React, Animated, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, View, ActivityIndicator, Stack, useRouter, DocumentUploadScreen, ToastMessage, useAuth, verificationService, DocumentPhotoType, VerificationStatus, PROVIDER_ROUTES.
Funcionalidades Chave:
Exibe diferentes etapas de verificação (splash, upload de documentos, análise).
handleStepCompletion(): Lida com a conclusão de etapas, chamando verificationService.uploadDocumentPhoto() para o upload.
useEffect (periódico): Verifica o status de verificação do provedor (verificationService.getProviderVerificationInfo()) a cada 5 segundos. Se aprovado, atualiza o AuthContext e redireciona para o dashboard.
Interconexões: Interage com useAuth para obter o status do provedor e verificationService para operações de verificação.
4.7. verification.ts
Caminho: LimpeJaApp/app/types/backend/verification.ts
Propósito: Define as interfaces e enums relacionadas ao processo de verificação de provedores, incluindo DTOs para submissão de CPF e tipos de fotos de documento.
Dependências: VerificationStatus (de auth.ts).
Exporta: SubmitCpfRequest, DocumentPhotoType, VerificationResponse, ProviderVerificationInfo.
Funcionalidades Chave:
DocumentPhotoType: Enum para FRONT e BACK das fotos de documento.
ProviderVerificationInfo: Detalhes do status de verificação de um provedor.
4.8. verificationService.ts
Caminho: LimpeJaApp/app/services/verificationService.ts
Propósito: Fornece funções para interagir com os endpoints de verificação do backend (submissão de CPF, upload de documentos/selfie, consulta de status).
Dependências: axios, Platform, FileSystem (expo), api.ts, DocumentPhotoType, ProviderVerificationInfo, SubmitCpfRequest, VerificationResponse.
Exporta: Uma instância singleton de VerificationService.
Funcionalidades Chave:
submitCpf(cpf): Envia CPF para verificação.
uploadDocumentPhoto(imageUri, type): Faz upload de fotos da frente/verso do documento.
uploadSelfie(imageUri): Faz upload da selfie.
getProviderVerificationInfo(providerId): Busca o status de verificação de um provedor.
Lógica para converter URIs de imagem em Blob para FormData e lidar com multipart/form-data.
Interconexões: Utilizado por provider-register/verify-account.tsx e provider-register/service-details.tsx.
4.9. profile/edit-services.tsx
Caminho: LimpeJaApp/app/(provider)/profile/edit-services.tsx
Propósito: Permite que provedores editem e gerenciem os serviços que oferecem, incluindo preço e tipo de precificação.
Dependências: React, Animated, Alert, FlatList, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Picker (@react-native-picker/picker), Stack, useRouter, useAuth, Ionicons, MaterialCommunityIcons, PricingType.
Funcionalidades Chave:
Lista de serviços obtidos do backend via getProviderServicesOffered.
Formulário para adicionar/editar serviços com campos para nome, descrição, preço, tipo de precificação (FIXED_PRICE, HOURLY, BY_SIZE) e duração/preços por tamanho.
handleAddOrUpdateService(): Adiciona um novo serviço ou atualiza um existente, persistindo as alterações no backend via addProviderServiceOffering ou updateProviderServiceOffering do providerService.ts.
handleSaveServices(): Persiste as alterações no backend. As operações de adição, atualização e exclusão de serviços são realizadas individualmente através de chamadas a addProviderServiceOffering, updateProviderServiceOffering e deleteProviderServiceOffering do providerService.ts.
formatPriceDisplay(): Função auxiliar para exibir o preço de acordo com o PricingType.
Interconexões: Interage com providerService.ts para persistir os dados.
4.10. dashboard/index.tsx (Provider Dashboard)
Caminho: LimpeJaApp/app/(provider)/dashboard/index.tsx
Propósito: A tela principal para provedores, exibindo um resumo de atividades, ganhos, solicitações pendentes, próximos serviços e avaliações recentes.
Dependências: React, Animated, Alert, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Ionicons, MaterialCommunityIcons, Stack, useRouter, useAuth, getBookingsForUser, updateBookingStatus, getMyProviderDashboard, getMyProviderEarnings, BookingDetails, BookingStatus, ProviderDashboard, ProviderReview, AdvancedReviewsSection, SmartInsightsSection.
Funcionalidades Chave:
fetchData(): Carrega dados do dashboard (getMyProviderDashboard()) e agendamentos (getBookingsForUser()) na inicialização e ao atualizar.
DashboardHeader: Exibe nome e avatar do provedor.
FinancialSummaryCard: Mostra ganhos totais e saques pendentes.
QuickActionsSection: Botões de acesso rápido para agenda, serviços e mensagens.
RequestItem: Componente para exibir solicitações de agendamento pendentes, com ações de aceitar/rejeitar (updateBookingStatus()) e iniciar chat.
ConfirmedServiceItem: Componente para exibir próximos serviços confirmados.
AdvancedReviewsSection: Exibe avaliações recentes.
handleLogout(): Permite ao provedor sair da conta.
Suporte a pull-to-refresh.
Interconexões: Consome useAuth, bookingService, dashboardService e providerService. Navega para diversas telas de provedor.
4.11. schedule/index.tsx (Provider Schedule)
Caminho: LimpeJaApp/app/(provider)/schedule/index.tsx
Propósito: Exibe a agenda do provedor com um calendário e uma lista de agendamentos para o dia selecionado.
Dependências: React, Animated, Alert, FlatList, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Stack, useRouter, Calendar, LocaleConfig, DateData, Ionicons, MaterialCommunityIcons, formatDate.
Funcionalidades Chave:
Calendar (react-native-calendars): Componente de calendário para seleção de datas.
markedDates: Marca os dias no calendário que possuem agendamentos.
loadAppointments(): Realiza uma chamada real à API (getBookingsForUser do bookingService.ts) para buscar os agendamentos do provedor.
appointmentsForSelectedDate: Filtra e exibe os agendamentos para a data selecionada.
AnimatedAppointmentItem: Componente para exibir cada agendamento na lista.
Botão para gerenciar disponibilidade.
Interconexões: Navega para manage-availability.tsx e para telas de detalhes de serviço/agendamento.
4.12. schedule/manage-availability.tsx
Caminho: LimpeJaApp/app/(provider)/schedule/manage-availability.tsx
Propósito: Permite que o provedor defina e gerencie sua disponibilidade de horários semanais.
Dependências: React, Animated, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useRouter, Ionicons, DateTimePicker (@react-native-community/datetimepicker), useAuth, deleteProviderAvailability, getProviderAvailability, updateProviderAvailability, ProviderAvailability, UpdateAvailabilityData, AnimatedDayCard, BlockDateSection, SaveChangesButton.
Funcionalidades Chave:
weeklyAvailability: Estado que armazena a disponibilidade por dia da semana, incluindo slots de horário.
loadInitialAvailability(): Carrega a disponibilidade existente do backend via getProviderAvailability().
handleToggleDayAvailability(): Ativa/desativa a disponibilidade de um dia.
addSlot() / removeSlot(): Adiciona ou remove slots de horário para um dia específico.
openTimePicker() / onTimeChange(): Gerencia a seleção de horários via DateTimePicker.
validateSlots(): Valida sobreposição e ordem dos slots de horário.
handleSaveChanges(): Persiste as alterações no backend. Envia slots para updateProviderAvailability() e deleteProviderAvailability() (para slots removidos).
slotsToDelete: Set para rastrear IDs de slots a serem excluídos no backend.
Interconexões: Interage com useAuth e providerService para operações CRUD de disponibilidade.
4.13. earnings/index.tsx (Provider Earnings)
Caminho: LimpeJaApp/app/(provider)/earnings/index.tsx
Propósito: Exibe um resumo dos ganhos do provedor, histórico de transações e permite solicitar saques.
Dependências: React, Animated, Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useRouter, Ionicons, getMyProviderEarnings (do earningService), requestWithdrawal (do paymentService), getMyProviderDashboard (do providerService), EarningsResponseDto, ProviderDashboard, ProviderTransaction, MainEarningsChartSection, EarningsChartSection, EarningsSummaryCard, RecentTransactionsSection.
Funcionalidades Chave:
fetchData(): Carrega dados do dashboard (getMyProviderDashboard()) e detalhes de ganhos (getMyProviderEarnings()).
setChartData(): Processa os dados de ganhos para exibição em gráficos.
handleWithdrawalRequest(): Permite ao provedor solicitar um saque via requestWithdrawal().
Exibe um resumo financeiro, gráficos de ganhos e transações recentes.
Links rápidos para "Meus Serviços Oferecidos" e "Minhas Avaliações".
Interconexões: Consome dashboardService, earningService e paymentService.
5. Gestão de Clientes
Esta seção aborda as funcionalidades específicas para usuários com o papel de cliente.

5.1. clients.ts
Caminho: LimpeJaApp/src/types/backend/clients.ts
Propósito: Define as interfaces relacionadas ao perfil do cliente e DTOs para busca e atualização.
Dependências: UserRole (de auth.ts), BookingAddress (de bookings.ts).
Exporta: Client, SearchResult (para busca de provedores/serviços), UpdateClientProfileDto, ClientDetails.
Funcionalidades Chave:
Client: Representa o perfil completo de um cliente.
UpdateClientProfileDto: DTO para atualizar o perfil do cliente.
5.2. clientService.ts
Caminho: LimpeJaApp/app/services/clientService.ts
Propósito: Fornece funções para interagir com os endpoints do backend relacionados a clientes, incluindo categorias de serviço, busca de provedores e atualização de perfil.
Dependências: axios, api.ts, UpdateClientProfileDto, Offer, ProviderDisplayInfo, ProviderSearchQuery, Service, UserProfile.
Exporta: getServiceCategories, searchProviders, getUserProfile, getOffers, getProviderDetails, updateClientProfile.
Funcionalidades Chave:
getServiceCategories(): Busca as categorias de serviço disponíveis.
searchProviders(query): Realiza uma busca por provedores.
getUserProfile(): Obtém o perfil do usuário logado (cliente ou provedor).
getOffers(): Obtém ofertas promocionais.
getProviderDetails(providerId): Obtém detalhes de um provedor específico.
updateClientProfile(data): Atualiza o perfil do cliente logado.
Interconexões: Utilizado por diversas telas do cliente (explore/index.tsx, profile/edit.tsx, schedule-service.tsx).
5.3. profile/index.tsx (Client Profile)
Caminho: LimpeJaApp/app/(client)/profile/index.tsx
Propósito: Exibe o perfil do cliente e oferece opções de navegação para gerenciar conta, preferências e suporte.
Dependências: React, Animated, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Stack, useRouter, useAuth, Ionicons, MaterialCommunityIcons.
Funcionalidades Chave:
Exibe nome, e-mail e avatar do usuário logado.
AnimatedMenuItem: Componente reutilizável para itens de menu com animações.
handleLogout(): Chama logout() do AuthContext para encerrar a sessão.
handleWIP(): Placeholder para funcionalidades em desenvolvimento.
Links para editar perfil, endereços, formas de pagamento, notificações, configurações do app, ajuda, termos e política de privacidade.
Interconexões: Consome useAuth. Navega para profile/edit.tsx, settings.tsx, help.tsx, termos.tsx, privacidade.tsx.
5.4. profile/edit.tsx (Client Profile Edit)
Caminho: LimpeJaApp/app/(client)/profile/edit.tsx
Propósito: Permite que o cliente edite suas informações de perfil, incluindo nome, telefone e endereço.
Dependências: React, Animated, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Stack, useRouter, useAuth, Ionicons, MaterialCommunityIcons, ImagePicker, updateClientProfile, BookingAddress, UpdateClientProfileDto, formatPhoneNumber, isValidPhoneNumber.
Funcionalidades Chave:
Formulário para nome, e-mail (somente leitura), telefone e endereço.
handlePickImage(): Permite selecionar uma nova foto de perfil (upload simulado).
handleSaveChanges(): Valida os campos, chama updateClientProfile() do clientService para persistir as alterações no backend. Atualiza o user no AuthContext.
Formatação e validação de telefone.
Interconexões: Interage com useAuth e clientService.
6. Serviços e Agendamentos
Esta seção detalha o fluxo de agendamento de serviços e a gestão de agendamentos.

6.1. services.ts
Caminho: LimpeJaApp/src/types/backend/services.ts
Propósito: Define as interfaces e enums relacionadas aos tipos de serviços oferecidos na plataforma.
Exporta: PricingType (enum para tipo de precificação: FIXED_PRICE, HOURLY, BY_SIZE, CUSTOM_QUOTE), Service (interface para um tipo de serviço como "Limpeza de Casa"), ServiceDetails.
Funcionalidades Chave:
Service: Contém id, name, icon, backgroundColor, description, price.
6.2. bookings.ts
Caminho: LimpeJaApp/src/types/backend/bookings.ts
Propósito: Define as interfaces e enums para agendamentos, incluindo status, endereço e DTOs para criação/atualização.
Dependências: ProviderDisplayInfo (de providers.ts), Service (de services.ts).
Exporta: BookingStatus (enum para status do agendamento), BookingAddress, CreateBookingDto, BookingDetails, UpdateBookingStatusDto.
Funcionalidades Chave:
BookingStatus: Enum para estados como PENDING, CONFIRMED, COMPLETED, CANCELED, etc.
BookingAddress: Estrutura de endereço.
BookingDetails: Representa um agendamento completo com detalhes do cliente, provedor e serviço.
6.3. bookingService.ts
Caminho: LimpeJaApp/app/services/bookingService.ts
Propósito: Fornece funções para interagir com os endpoints de agendamento do backend.
Dependências: axios, api.ts, BookingDetails, BookingStatus, CreateBookingDto, UpdateBookingStatusDto.
Exporta: createBooking, getBookingsForUser, getBookingDetails, updateBookingStatus, cancelBooking, checkActiveChatBooking, checkConfirmedBookingBetweenUsers.
Funcionalidades Chave:
createBooking(data): Cria um novo agendamento.
getBookingsForUser(status?): Obtém agendamentos do usuário logado, opcionalmente filtrados por status.
getBookingDetails(bookingId): Obtém detalhes de um agendamento específico.
updateBookingStatus(bookingId, data): Atualiza o status de um agendamento.
cancelBooking(bookingId): Cancela um agendamento.
checkActiveChatBooking(clientId, providerId): Verifica se há um agendamento ativo para permitir o chat.
Interconexões: Utilizado por schedule-service.tsx, bookings/index.tsx, bookings/[bookingId].tsx, dashboard/index.tsx, e telas de chat.
6.4. schedule-service.tsx
Caminho: LimpeJaApp/app/(client)/schedule-service.tsx
Propósito: Permite ao cliente agendar um serviço com um provedor específico, selecionando data, horário e fornecendo detalhes de endereço.
Dependências: React, Animated, Alert, Dimensions, Easing, Platform, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useLocalSearchParams, useRouter, Ionicons, BlurView, Clipboard, LinearGradient, useAuth, createBooking, getProviderAvailability, getProviderDetails, BookingAddress, BookingDetails, CreateBookingDto, ProviderAvailability, ProviderDisplayInfo, ProviderServiceOffering, UserProfile, PricingType, AddressSection, CalendarHeader, ProviderBrief, TimeSlotsSection.
Funcionalidades Chave:
Recebe providerId e serviceId via parâmetros de rota.
fetchBookingAndProviderDetails(): Carrega detalhes do provedor e do serviço, além do endereço do usuário logado.
prefetchAvailability(): Pré-carrega a disponibilidade do provedor para meses adjacentes e armazena em cache.
generateCalendarDays(): Gera os dias do calendário para exibição.
fetchAndProcessSlotsForDate(): Busca e processa os horários disponíveis para a data selecionada, considerando a configuração do provedor e horários já ocupados.
handleConfirmBooking(): Valida os dados e chama createBooking() do bookingService. Redireciona para a tela de sucesso.
Animações ricas para a UI.
Interconexões: Consome useAuth, providerService, bookingService. Navega para bookings/success.tsx.
6.5. bookings/index.tsx (Client Bookings List)
Caminho: LimpeJaApp/app/(client)/bookings/index.tsx
Propósito: Exibe uma lista dos agendamentos do cliente, com filtros por status (solicitações, próximos, histórico, cancelados).
Dependências: React, Animated, Alert, FlatList, Image, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Link, Stack, useRouter, Ionicons, MaterialCommunityIcons, formatDate, useAuth, getBookingsForUser, BookingDetails, BookingStatus.
Funcionalidades Chave:
loadBookings(): Busca agendamentos do backend via getBookingsForUser(), filtrando por status e ordenando.
Filtros: Permite alternar entre "requests", "upcoming", "completed" e "cancelled".
AnimatedBookingItem: Componente para exibir cada agendamento com animação de entrada.
Suporte a pull-to-refresh.
Exibe feedback visual para listas vazias.
Interconexões: Consome useAuth e bookingService. Navega para bookings/[bookingId].tsx.
6.6. bookings/[bookingId].tsx (Client Booking Details)
Caminho: LimpeJaApp/app/(client)/bookings/[bookingId].tsx
Propósito: Exibe os detalhes de um agendamento específico e oferece ações como cancelar, contatar o provedor, avaliar o serviço ou ver o perfil do provedor.
Dependências: React, Animated, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useLocalSearchParams, useRouter, Ionicons, formatDate, cancelBooking, getBookingDetails, BookingDetails, BookingStatus.
Funcionalidades Chave:
Recebe bookingId via parâmetros de rota.
fetchBooking(): Carrega os detalhes do agendamento do backend via getBookingDetails().
handleCancelBooking(): Cancela o agendamento via cancelBooking().
handleContactProvider(): Navega para a tela de chat com o provedor.
handleReviewService(): Navega para a tela de feedback para avaliar o serviço.
handleViewProviderProfile(): Navega para a tela de detalhes do provedor.
Animações para os cards e botões de ação.
getStatusStyle(): Retorna estilos e ícones baseados no BookingStatus.
Interconexões: Consome bookingService. Navega para messages/[chatId].tsx, feedback/[targetId].tsx, explore/[providerId].tsx.
6.7. bookings/success.tsx
Caminho: LimpeJaApp/app/(client)/bookings/success.tsx
Propósito: Tela exibida após um agendamento bem-sucedido, mostrando um resumo do agendamento e, opcionalmente, detalhes de pagamento PIX.
Dependências: React, Animated, Alert, ColorValue, Dimensions, Easing, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, BlurView, Clipboard, Calendar (expo), LinearGradient, Stack, useLocalSearchParams, useRouter, Toast, BookingSummaryCard, MainActionButtons, SuccessHeader, SuccessLoadingError, getBookingDetails, getProviderDetails, BookingDetails, ProviderDisplayInfo, useAuth, createPixCharge, CreatePixChargeDto, PixChargeResponseDto.
Funcionalidades Chave:
Recebe bookingId, paymentMethod e totalPrice via parâmetros de rota.
fetchBookingAndProviderDetails(): Carrega detalhes do agendamento e do provedor.
createPixCharge(): Se o método de pagamento for PIX, gera uma cobrança PIX no backend e exibe os detalhes (QR Code, BR Code).
handleCopyPixQrCode(): Copia o código PIX para a área de transferência.
handleAddToCalendar(): Adiciona o agendamento ao calendário do dispositivo.
handleContactProvider(): Navega para o chat com o provedor.
Animações para a entrada do conteúdo e elementos de fundo.
Interconexões: Consome useAuth, bookingService, providerService, paymentService. Navega para bookings/index.tsx, explore/index.tsx, messages/[chatId].tsx.
7. Busca e Descoberta
Esta seção descreve as funcionalidades de busca e exploração de serviços e provedores.

7.1. search.ts
Caminho: LimpeJaApp/types/backend/search.ts
Propósito: Define as interfaces e enums relacionadas aos parâmetros e resultados de busca na plataforma.
Dependências: ProviderDetails (de providers.ts), ServiceDetails (de services.ts), ProviderServiceDetails (de provider-service.ts).
Exporta: SearchType (enum para tipos de busca: PROVIDERS, SERVICES, OFFERS, ALL, PROVIDER_SERVICES), SortByOption (enum para opções de ordenação), SearchQuery (interface para parâmetros de consulta de busca), ProviderServiceSearchResult (interface para resultados de serviço de provedor), SearchResult (interface para a resposta completa da API de busca).
Funcionalidades Chave:
SearchQuery: Contém campos como query, type, location, latitude, longitude, radius, sortBy.
7.2. explore/index.tsx (Client Explore)
Caminho: LimpeJaApp/app/(client)/explore/index.tsx
Propósito: A tela principal para clientes, exibindo categorias de serviço, ofertas, provedores recomendados e próximos.
Dependências: React, Animated, Alert, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useRouter, ViewToken, getOffers, getServiceCategories, getUserProfile, getNearbyProviders, getRecommendedProviders, Offer, ProviderDisplayInfo, Service, UserProfile, CLIENT_ROUTES, CarouselBannerItem, CategoriaCard, HeaderSuperior, NavBar, PrestadorCard, RecomendacaoCard, SecaoContainer, SecaoPrestadores, SecaoRecomendacoes.
Funcionalidades Chave:
fetchData(): Carrega o perfil do usuário, categorias de serviço, provedores recomendados, provedores próximos e ofertas.
HeaderSuperior: Exibe o nome e endereço do usuário.
SecaoContainer: Componente reutilizável para exibir listas de categorias.
CarouselBannerItem: Carrossel de banners promocionais.
SecaoRecomendacoes / SecaoPrestadores: Exibem listas de provedores.
NavBar: Barra de navegação inferior.
Animações de entrada escalonadas para todas as seções.
Interconexões: Consome clientService e providerService. Navega para telas de busca, detalhes de provedor e outras telas de navegação.
7.3. explore/[providerId].tsx (Provider Details for Client)
Caminho: LimpeJaApp/app/(client)/explore/[providerId].tsx
Propósito: Exibe os detalhes de um provedor de serviços para o cliente, incluindo informações de contato, biografia, avaliações e serviços oferecidos.
Dependências: React, Animated, Alert, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useLocalSearchParams, useRouter, useSafeAreaInsets, Ionicons, BookServiceButton, InfoChip, ReviewCard, StarRating, styles (de providerStyles.ts), useAuth, checkActiveChatBooking, getProviderDetails, ProviderDisplayInfo, ProviderReview, ProviderServiceOffering, VerificationStatus, PricingType.
Funcionalidades Chave:
Recebe providerId via parâmetros de rota.
getProviderDetails(): Carrega os detalhes do provedor.
checkActiveChatBooking(): Verifica se o cliente tem um agendamento ativo com o provedor para habilitar o botão de chat.
Exibe nome, localização, preço, anos de experiência, status de verificação, biografia e avaliações.
Botões de ação (Ligar, Chat, Mapa, Compartilhar).
BookServiceButton: Botão fixo na parte inferior para agendar um serviço com o provedor.
formatPriceDisplay(): Formata o preço com base no PricingType.
Interconexões: Consome useAuth, providerService, bookingService. Navega para schedule-service.tsx e messages/[chatId].tsx.
7.4. explore/todas-categorias.tsx, explore/todos-prestadores-proximos.tsx, explore/servicos-por-categoria.tsx, explore/search-results.tsx, explore/resultados-busca.tsx
Caminho: LimpeJaApp/app/(client)/explore/*.tsx
Propósito: Estas são telas placeholder ou de resultados de busca que ainda precisam de implementação completa da lógica de busca e exibição.
Funcionalidades Chave (a serem implementadas):
todas-categorias.tsx: Listar todas as categorias de serviço.
todos-prestadores-proximos.tsx: Listar todos os provedores próximos.
servicos-por-categoria.tsx: Listar serviços filtrados por uma categoria específica.
search-results.tsx / resultados-busca.tsx: Exibir resultados de busca com base em parâmetros.
8. Comunicação (Chat e Notificações)
Esta seção aborda as funcionalidades de comunicação dentro do aplicativo.

8.1. chat.ts
Caminho: LimpeJaApp/src/types/backend/chat.ts
Propósito: Define as interfaces e DTOs para o sistema de chat, incluindo detalhes do chat, mensagens e parâmetros de envio/busca.
Exporta: ChatDetails, Message, SendMessageDto, GetMessagesQuery, ChatSummary.
Funcionalidades Chave:
Message: Contém id, chatId, senderId, receiverId, content, createdAt, isRead.
8.2. chatService.ts
Caminho: LimpeJaApp/app/services/chatService.ts
Propósito: Fornece funções para interagir com a API de chat.
Dependências: axios, api.ts, ChatDetails, GetMessagesQuery, Message, SendMessageDto.
Exporta: ConversationItem (interface para item de conversa no frontend), findOrCreateChat, getChatMessages, sendMessage, getChatListForUser.
Funcionalidades Chave:
findOrCreateChat(providerId, clientId): Encontra ou cria um chat entre provedor e cliente.
getChatMessages(chatId, query?): Busca o histórico de mensagens de um chat.
sendMessage(messageData): Envia uma nova mensagem.
getChatListForUser(userId): Tenta buscar a lista de conversas de um usuário do backend. Nota: Esta função depende de um endpoint específico (/chat/me/conversations) no backend que pode precisar ser implementado.
Interconexões: Utilizado por telas de chat (messages/[chatId].tsx) e dashboards/perfis para iniciar conversas.
8.3. messages/index.tsx (Client/Provider Chat List)
Caminho: LimpeJaApp/app/(client)/messages/index.tsx e LimpeJaApp/app/(provider)/messages/index.tsx
Propósito: Exibe a lista de conversas (chats) ativas do usuário (cliente ou provedor).
Dependências: React, Animated, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useRouter, Ionicons, formatDate, useAuth, getChatListForUser.
Funcionalidades Chave:
loadConversations(): Carrega a lista de conversas do backend via getChatListForUser().
AnimatedConversationItem: Componente para exibir cada conversa com avatar, última mensagem e contador de não lidas.
formatTimestamp(): Formata o timestamp da última mensagem.
Animações de entrada para o cabeçalho e itens da lista.
Interconexões: Consome useAuth e chatService. Navega para messages/[chatId].tsx.
8.4. messages/[chatId].tsx (Client/Provider Chat Screen)
Caminho: LimpeJaApp/app/(client)/messages/[chatId].tsx e LimpeJaApp/app/(provider)/messages/[chatId].tsx
Propósito: A tela de chat para uma conversa específica, permitindo o envio e recebimento de mensagens em tempo real via WebSocket.
Dependências: React, Animated, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Stack, useLocalSearchParams, useRouter, Ionicons, io, Socket, appConfig, useAuth, getBookingDetails, getChatMessages, sendMessage (do chatService), BookingStatus, Message, SendMessageDto.
Funcionalidades Chave:
Recebe chatId, recipientName, recipientId, recipientAvatarUrl e bookingId via parâmetros de rota.
loadChatData(): Carrega o histórico de mensagens (getChatMessages()) e verifica o status do agendamento (getBookingDetails()) para determinar se o chat deve ser bloqueado.
Integração WebSocket: Conecta-se a um servidor WebSocket para comunicação em tempo real.
socket.on('connect'): Confirma a conexão.
socket.emit('joinChat', chatId): Entra na sala de chat.
socket.on('newMessage'): Recebe novas mensagens e atualiza a UI.
socket.on('errorMessage'): Lida com erros do WebSocket.
handleSendMessage(): Envia mensagens via WebSocket (socket.emit('sendMessage')) ou via REST (sendChatMessage()) como fallback.
Bloqueia o input de mensagens se o chat estiver encerrado (serviço concluído/cancelado).
Interconexões: Consome useAuth, bookingService, chatService.
8.5. notifications.ts
Caminho: LimpeJaApp/src/types/backend/notifications.ts
Propósito: Define as interfaces e DTOs para o sistema de notificações.
Exporta: NotificationEntity, MarkAsReadDto.
Funcionalidades Chave:
NotificationEntity: Representa uma notificação individual com id, type, title, body, createdAt, readAt, navigateTo, relatedId, userId.
8.6. notificationService.ts
Caminho: LimpeJaApp/app/services/notificationService.ts
Propósito: Fornece funções para interagir com os endpoints de notificações do backend.
Dependências: axios, api.ts, MessageResponseDto, NotificationEntity.
Exporta: NotificationService (classe com métodos estáticos).
Funcionalidades Chave:
getNotifications() / getNotificationsMe(): Busca a lista de notificações para o usuário logado.
markAsRead(notificationId) / markNotificationAsReadMe(): Marca uma notificação específica como lida.
markAllAsRead() / markAllNotificationsAsReadMe(): Marca todas as notificações como lidas.
deleteNotification(notificationId) / deleteNotificationMe(): Deleta uma notificação.
enhanceNotifications(): (Função interna) Adiciona sugestões e ações rápidas às notificações (lógica de frontend).
executeQuickAction(): (Função interna) Simula a execução de ações rápidas.
getSmartSuggestions(): (Função interna) Simula sugestões inteligentes.
Interconexões: Utilizado por notifications/index.tsx.
8.7. notifications/index.tsx (Notifications List)
Caminho: LimpeJaApp/app/(common)/notifications/index.tsx
Propósito: Exibe a lista de notificações do usuário, permitindo marcá-las como lidas e navegar para conteúdos relacionados.
Dependências: React, Animated, Alert, FlatList, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useRouter, Ionicons, MaterialCommunityIcons, useAuth, getNotifications, markAllNotificationsAsRead, markNotificationAsRead, NotificationEntity.
Funcionalidades Chave:
loadNotifications(): Carrega as notificações do backend via getNotifications().
AnimatedNotificationItem: Componente para exibir cada notificação com ícone, título, corpo e timestamp.
handleNotificationPress(): Marca a notificação como lida e navega para a rota navigateTo se especificada.
handleMarkAllAsRead(): Marca todas as notificações como lidas.
formatNotificationTimestamp(): Formata o timestamp da notificação de forma relativa.
getNotificationIcon(): Retorna o ícone e a biblioteca apropriados para o tipo de notificação.
Suporte a pull-to-refresh.
Interconexões: Consome useAuth e notificationService.
9. Pagamentos
Esta seção descreve as funcionalidades relacionadas a pagamentos.

9.1. payments.ts
Caminho: LimpeJaApp/src/types/backend/payments.ts
Propósito: Define as interfaces e DTOs para operações de pagamento, como cobranças PIX e solicitações de saque.
Exporta: CreatePixChargeDto, PixChargeResponseDto, RequestWithdrawalDto, TransactionEntity.
Funcionalidades Chave:
CreatePixChargeDto: DTO para criar uma cobrança PIX.
PixChargeResponseDto: Resposta do backend para uma cobrança PIX (inclui brCode, qrCodeImage, expiresAt).
RequestWithdrawalDto: DTO para solicitar um saque.
9.2. paymentService.ts
Caminho: LimpeJaApp/app/services/paymentService.ts
Propósito: Fornece funções para interagir com os endpoints de pagamento do backend.
Dependências: axios, api.ts, MessageResponseDto, CreatePixChargeDto, PixChargeResponseDto, RequestWithdrawalDto.
Exporta: createPixCharge, requestWithdrawal.
Funcionalidades Chave:
createPixCharge(clientUserId, data): Cria uma cobrança PIX.
requestWithdrawal(data): Solicita um saque de ganhos.
Interconexões: Utilizado por bookings/success.tsx (para PIX) e earnings/index.tsx (para saques).
10. Feedback e Avaliações
Esta seção detalha as funcionalidades para feedback e avaliações.

10.1. reviews.ts
Caminho: LimpeJaApp/src/types/backend/reviews.ts
Propósito: Define as interfaces e DTOs para o sistema de avaliações e feedback.
Exporta: SubmitReviewDto, ReviewEntity.
Funcionalidades Chave:
SubmitReviewDto: DTO para enviar uma avaliação (rating, comment, targetId, type, userId).
ReviewEntity: Representa uma avaliação retornada pelo backend.
10.2. reviewService.ts
Caminho: LimpeJaApp/app/services/reviewService.ts
Propósito: Fornece funções para interagir com os endpoints de avaliações do backend.
Dependências: axios, api.ts, MessageResponseDto, ReviewEntity, SubmitReviewDto.
Exporta: submitFeedback, getDetailedRatingBreakdown, getSmartSuggestions (função e classe ReviewService).
Funcionalidades Chave:
submitFeedback(data): Envia um feedback ou avaliação.
getDetailedRatingBreakdown(providerId): Obtém análise detalhada de avaliações.
getReviews(providerId): Busca avaliações de um provedor.
getReviewAnalytics(providerId): Obtém dados analíticos de avaliações do backend via getDetailedRatingBreakdown.
getSuggestedResponse(reviewId): Obtém respostas sugeridas por IA para avaliações do backend.
respondToReview(reviewId, response): Responde a uma avaliação.
Interconexões: Utilizado por feedback/[targetId].tsx e dashboard/index.tsx.
10.3. feedback/[targetId].tsx
Caminho: LimpeJaApp/app/(common)/feedback/[targetId].tsx
Propósito: Permite ao usuário enviar feedback ou uma avaliação para um serviço, profissional ou o próprio aplicativo.
Dependências: React, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Stack, useLocalSearchParams, useRouter, Ionicons, submitFeedback, useAuth, SubmitReviewDto.
Funcionalidades Chave:
Recebe targetId, type, serviceName, providerName, providerId via parâmetros de rota.
StarRating: Componente para seleção de avaliação por estrelas.
handleSubmitFeedback(): Valida os dados, chama submitFeedback() do reviewService para enviar a avaliação.
Interconexões: Consome useAuth e reviewService.
11. Outras Telas Comuns
Esta seção descreve telas acessíveis a ambos os tipos de usuários.

11.1. settings.tsx
Caminho: LimpeJaApp/app/(common)/settings.tsx
Propósito: Permite ao usuário configurar preferências do aplicativo, como notificações e modo escuro, e acessar links relacionados à conta e informações legais.
Dependências: React, Animated, Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View, Stack, useRouter, useAppContext, Ionicons, MaterialCommunityIcons, Constants.
Funcionalidades Chave:
AnimatedSettingSwitchItem / AnimatedSettingNavigationItem: Componentes reutilizáveis para itens de configuração com animações.
handleToggleNotifications(): Gerencia a preferência de notificações.
handleToggleDarkMode(): Alterna o tema do aplicativo via toggleTheme() do AppContext.
Links para gerenciar dados, excluir conta, termos de serviço, política de privacidade.
Exibe a versão do aplicativo.
Interconexões: Consome useAppContext. Navega para profile/edit.tsx, help.tsx, termos.tsx, privacidade.tsx.
11.2. help.tsx
Caminho: LimpeJaApp/app/(common)/help.tsx
Propósito: Central de ajuda com perguntas frequentes (FAQs) e opções de contato com o suporte.
Dependências: React, Animated, Alert, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Stack, useRouter, Ionicons, getFaqs.
Funcionalidades Chave:
loadFaqs(): Carrega as FAQs do backend via getFaqs().
Campo de busca para filtrar FAQs.
AnimatedFaqItem: Componente para exibir cada FAQ.
AnimatedContactButton: Botões para contato via e-mail, telefone e chat (simulado).
Interconexões: Consome faqService.
11.3. termos.tsx
Caminho: LimpeJaApp/app/(common)/termos.tsx
Propósito: Exibe os Termos de Serviço do aplicativo.
Dependências: React, ScrollView, StyleSheet, Text, View, Stack.
Funcionalidades Chave:
Exibe o texto completo dos termos de serviço.
11.4. privacidade.tsx
Caminho: LimpeJaApp/app/(common)/privacidade.tsx
Propósito: Exibe a Política de Privacidade do aplicativo.
Dependências: React, ScrollView, StyleSheet, Text, View, Stack.
Funcionalidades Chave:
Exibe o texto completo da política de privacidade.
11.5. _layout.tsx (Common Group)
Caminho: LimpeJaApp/app/(common)/_layout.tsx
Propósito: Define o layout de navegação para as telas comuns a clientes e provedores.
Dependências: expo-router.
Funcionalidades Chave:
Configura Stack.Screen para cada tela comum, definindo title.
Interconexões: É um layout aninhado do _layout.tsx raiz.
12. Tipagens e DTOs
As tipagens são cruciais para a robustez do aplicativo. Elas são definidas principalmente na pasta LimpeJaApp/src/types/backend/.

auth.ts: DTOs de login/registro, UserRole, VerificationStatus.
bookings.ts: DTOs e interfaces para agendamentos, BookingStatus.
chat.ts: DTOs e interfaces para mensagens de chat.
clients.ts: Interfaces para o perfil do cliente e DTOs de atualização.
dashboard.ts: Interfaces para dados do dashboard (pode ser redundante com providers.ts).
faqs.ts: Interface para itens de FAQ.
notifications.ts: Interfaces para notificações.
offers.ts: Interface para ofertas promocionais.
payments.ts: DTOs para operações de pagamento (PIX, saques).
provider-service.ts: Detalhes de um serviço oferecido por um provedor.
providers.ts: Interfaces para o perfil do provedor, disponibilidade e DTOs relacionados.
reviews.ts: DTOs e interfaces para avaliações.
search.ts: DTOs e interfaces para busca.
services.ts: Interfaces para tipos de serviço e PricingType.
upload.ts: DTO para respostas de upload.
users.ts: Interface UserProfile (perfil completo do usuário).
verification.ts: DTOs e enums para o processo de verificação.
13. Componentes Reutilizáveis (components/)
A pasta components/ contém diversos componentes reutilizáveis para construir a UI de forma consistente e eficiente. Exemplos incluem:

auth/components/: Componentes específicos para formulários de autenticação (e.g., InputWithIcon, AnimatedErrorMessage).
client/: Componentes específicos para o cliente (e.g., booking/success, explore/home, explore/provider).
provider/: Componentes específicos para o provedor (e.g., dashboard, earnings, schedule/manager).
ui/: Componentes de UI genéricos (e.g., ToastMessage).
ServiceItemSkeleton: Componente de placeholder para carregamento de itens de serviço.
14. Fluxo de Navegação Principal
O Expo Router é fundamental para o fluxo de navegação, utilizando um sistema de arquivos para definir rotas e layouts aninhados.

/: Ponto de entrada, redireciona para /welcome ou para o fluxo de autenticação/dashboard via _layout.tsx raiz.
/welcome: Tela de boas-vindas.
/(auth): Grupo de rotas de autenticação.
/login: Login.
/register-options: Escolha de tipo de registro.
/client-register: Registro de cliente.
/provider-register: Grupo de rotas de registro de provedor.
/index: Informações básicas.
/personal-details: Dados pessoais e endereço.
/service-details: Detalhes do serviço (provedor).
/verify-account: Verificação de conta (provedor).
/forgot-password: Recuperação de senha.
/(client): Grupo de rotas para clientes.
/explore: Tela principal de exploração.
/[providerId]: Detalhes do provedor.
/todas-categorias, /todos-prestadores-proximos, etc.: Telas de listagem/busca.
/schedule-service: Agendamento de serviço.
/bookings: Lista de agendamentos.
/[bookingId]: Detalhes de um agendamento.
/success: Tela de sucesso do agendamento.
/messages: Lista de mensagens.
/[chatId]: Tela de chat.
/profile: Perfil do cliente.
/edit: Edição do perfil.
/(provider): Grupo de rotas para provedores.
/dashboard: Painel de controle do provedor.
/schedule: Agenda do provedor.
/index: Visão geral da agenda.
/manage-availability: Gerenciamento de disponibilidade.
/services: Lista de serviços (agendamentos) do provedor.
/[serviceId]: Detalhes de um agendamento.
/earnings: Ganhos do provedor.
/messages: Lista de mensagens.
/[chatId]: Tela de chat.
/profile: Perfil do provedor.
/edit-services: Edição de serviços oferecidos.
/(common): Grupo de rotas comuns a ambos os papéis.
/settings: Configurações do aplicativo.
/help: Central de ajuda (FAQ).
/notifications: Lista de notificações.
/feedback/[targetId]: Envio de feedback/avaliação.
/termos: Termos de Serviço.
/privacidade: Política de Privacidade.
15. Considerações Finais
Esta documentação fornece uma visão aprofundada do frontend do LimpeJáApp, destacando sua estrutura modular, o uso extensivo de tipagem (TypeScript), gerenciamento de estado via Context API e a integração com o backend via Axios. As animações e a organização do código contribuem para uma experiência de usuário fluida e um código-base manutenível. A clareza nas interconexões entre arquivos e a separação de responsabilidades são pilares importantes para o desenvolvimento contínuo do aplicativo.

📱 Documentação do Frontend — LimpeJáApp

O LimpeJáApp é uma aplicação mobile construída com React Native + Expo, projetada para conectar clientes a profissionais de limpeza e organização.
O frontend gerencia todo o ciclo de vida do usuário: registro, autenticação, agendamentos, pagamentos, métricas, suporte e perfis.

1. Visão Geral da Arquitetura

React Native & Expo → multiplataforma (iOS/Android).

Expo Router → navegação baseada em pastas com layouts aninhados.

React Context API → estado global (auth, provider registration, app settings).

Axios → camada de serviços HTTP, com interceptors para autenticação e tratamento de erros.

TypeScript → tipagem estática e DTOs alinhados ao backend.

AsyncStorage → persistência local de sessão/cache.

Reanimated → animações de alto desempenho.

Sentry → rastreamento de erros.

Estrutura modular → pastas separadas por papel/contexto:

app/
 ├─ (auth)      → login, registro, verificação
 ├─ (client)    → telas do cliente
 ├─ (common)    → telas comuns (notificações, suporte, configurações)
 └─ (provider)  → telas do provedor

2. Módulos Core e Utilitários
2.1. app/services/api.ts

Instância global do Axios.

Adiciona JWT em headers.

Trata erros 401 → força logout pelo AuthContext.

Injeta traceId em headers para observabilidade.

2.2. authService.ts

Login/logout.

Registro de cliente/provedor.

Redefinição de senha.

Persiste auth_token + user no AsyncStorage.

2.3. contexts/AuthContext.tsx

Estado global: user, isAuthenticated, role, verificationStatus.

Integração com metrics: dispara eventos (login, booking.created, payment.paid).

Fornece métodos: login, logout, signUpClient, signUpProvider, refreshUser.

2.4. _layout.tsx (Root)

Decide para onde redirecionar:

Não autenticado → (auth)/welcome.

Cliente → (client)/explore.

Provedor APPROVED → (provider)/dashboard.

Provedor PENDING → (auth)/provider-register/....

3. Estrutura (auth)

login.tsx → tela de login.

register-options.tsx → escolher “Cliente” ou “Profissional”.

client-register.tsx → cadastro multi-etapas de cliente.

provider-register/

index.tsx → dados básicos.

personal-details.tsx → CPF, senha, endereço.

service-details.tsx → serviços, preços, chave PIX.

verify-account.tsx → upload de documentos/selfie.

forgot-password.tsx → redefinição de senha.

test-connection.tsx → tela de debug (ping backend).

layout.tsx → stack do grupo auth.

Integrações Backend: /auth/*, /verification/*.

4. Estrutura (client)

explore/

Busca e descoberta: GET /providers/search com filtros (distância, score, preço).

bookings/

Criação via POST /bookings.

Usa locks distribuídos → se slot já estiver ocupado, app mostra erro amigável.

Detalhes → bookings/[bookingId].tsx.

Tela de sucesso com QR PIX → bookings/success.tsx.

category/ → lista categorias de serviço.

messages/ → chat cliente ↔ provedor.

metrics/ → tela de métricas do cliente (serviços feitos, GMV, missões).

misions/ → gamificação, missões concluídas.

offers/ e ofertas/ → cupons e promoções.

profile/ → perfil e preferências LGPD (/me/data/export, /me/data/delete).

subscriptions/ → planos recorrentes.

layout.tsx → shell do cliente (abas/exploração).

5. Estrutura (common)

active-booking/ → card persistente do serviço em andamento.

feedback/ → envio de reviews.

safety/ → botão de pânico e fallback SMS.

support/

help.tsx → abrir e acompanhar tickets.

Backend: /support/tickets.

Integração com BullMQ → notificações de status.

loyalty.tsx → pontos/recompensas.

notifications.tsx → inbox de notificações.

privacidade.tsx → política de privacidade e consentimento.

referrals.tsx → convites.

settings.tsx → idioma, tema, export/delete dados.

termos.tsx → termos de uso.

layout.tsx → layout comum.

6. Estrutura (provider)

dashboard.tsx → visão geral (agenda, ganhos, pedidos pendentes).

schedule/

index.tsx → calendário de agendamentos.

manage-availability.tsx → slots e disponibilidade.

Usa locks distribuídos → aceitar serviço dispara conflito amigável se já alocado.

services/ → edição de serviços e preços.

messages/ → chat com clientes.

notifications/ → notificações de pedidos.

active-booking/ → execução em andamento.

earnings.tsx → ganhos e payouts (GET /payouts).

profile/ → perfil, KYC, documentos.

layout.tsx → shell do provedor (abas).

7. Integrações Transversais

Locks distribuídos

Cliente: ao reservar (bookings/create).

Provedor: ao aceitar (schedule/index).

Métricas

Cliente: (client)/metrics lê /metrics/user.

Provedor: /metrics/provider.

Eventos enviados: login, booking.created, payment.paid, review.created.

Suporte

(common)/support/help.tsx → criar e acompanhar tickets.

Notificações push em status (PENDING → IN_REVIEW → RESOLVED).

LGPD

Consentimento salvo em (common)/privacidade.tsx.

Exportação/eliminação em (common)/settings.tsx.

8. Navegação (Expo Router)
app/
 ├─ (auth)/
 │   ├─ login.tsx, register-options.tsx, client-register.tsx, provider-register/*
 │   ├─ forgot-password.tsx, test-connection.tsx, layout.tsx
 │
 ├─ (client)/
 │   ├─ explore/, bookings/, category/, messages/
 │   ├─ metrics/, misions/, offers/, ofertas/, profile/, subscriptions/
 │   ├─ layout.tsx
 │
 ├─ (common)/
 │   ├─ active-booking/, feedback/, safety/, support/help.tsx
 │   ├─ loyalty.tsx, notifications.tsx, privacidade.tsx, referrals.tsx
 │   ├─ settings.tsx, termos.tsx, layout.tsx
 │
 └─ (provider)/
     ├─ dashboard.tsx, schedule/, services/, messages/, notifications/
     ├─ active-booking/, earnings.tsx, profile/, layout.tsx

9. Considerações Finais

Frontend e Backend estão 100% alinhados:

Locks (concorrência resolvida).

Métricas (eventos disparados pelo app).

Suporte (tickets integrados).

LGPD (consent, export/delete).

Próximos passos sugeridos:

Adicionar testes e2e no app (Jest + Detox).

Melhorar UX em casos de conflito de lock.

Evoluir gamificação em misions.