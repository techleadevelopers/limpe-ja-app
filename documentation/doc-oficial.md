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
registerClient(userData): Envia dados para /auth/register/client, salva os dados de autenticação. Agora aceita um `referralCode` opcional para vincular o novo usuário a um indicador.
registerProvider(userData): Envia dados para /auth/register/provider, salva os dados de autenticação. Agora aceita um `referralCode` opcional para vincular o novo usuário a um indicador.
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
Caminho: LimpeJaApp/src/app/(provider)/provider-register/service-details.tsx
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
Propósito: A tela principal para provedores, exibindo um resumo de atividades, ganhos, solicitações pendentes, próximos serviços, avaliações recentes e métricas de performance como taxa de aceitação e tempo médio de resposta.
Dependências: React, Animated, Alert, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Ionicons, MaterialCommunityIcons, Stack, useRouter, useAuth, getBookingsForUser, updateBookingStatus, getMyProviderDashboard, getMyProviderEarnings, BookingDetails, BookingStatus, ProviderDashboard, ProviderReview, AdvancedReviewsSection, SmartInsightsSection.
Funcionalidades Chave:

fetchData(): Carrega dados do dashboard (getMyProviderDashboard()) e agendamentos (getBookingsForUser()) na inicialização e ao atualizar.
DashboardHeader: Exibe nome e avatar do provedor.
FinancialSummaryCard: Mostra ganhos totais e saques pendentes.
QuickActionsSection: Botões de acesso rápido para agenda, serviços e mensagens.
RequestItem: Componente para exibir solicitações de agendamento pendentes, com ações de aceitar/rejeitar (updateBookingStatus()) e iniciar chat.
ConfirmedServiceItem: Componente para exibir próximos serviços confirmados.
AdvancedReviewsSection: Exibe avaliações recentes.
Exibição de Métricas de Performance: Integração para mostrar `acceptanceRate` e `averageResponseTime` do provedor, que são calculadas e atualizadas no backend e influenciam o ranking e a visibilidade.
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
4.14. (provider)/missions/index.tsx (NOVO)
Caminho: LimpeJaApp/app/(provider)/missions/index.tsx
Propósito: Exibe as missões gamificadas disponíveis para o provedor, seu progresso e a opção de resgatar recompensas.
Dependências: React, FlatList, StyleSheet, Text, View, ActivityIndicator, Stack, useRouter, useAuth, getMissionsForProvider, claimMission, MissionProgress, MissionStatus.
Funcionalidades Chave:

loadMissions(): Busca as missões e o progresso do provedor no backend.
Exibe o título, descrição, progresso atual e status de cada missão.
Botão "Resgatar Recompensa" para missões COMPLETED e não CLAIMED, que chama claimMission().
Animações para o progresso da missão.
Interconexões: Consome useAuth e um futuro missionService (ou diretamente missions endpoints via api.ts).
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
searchProviders(query): Realiza uma busca por provedores, agora com suporte a parâmetros de geolocalização (latitude, longitude, radius) para encontrar provedores próximos.
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
BookingDetails: Representa um agendamento completo com detalhes do cliente, provedor e serviço, incluindo `couponId` e `discountAmount` se um cupom foi aplicado.
6.3. bookingService.ts
Caminho: LimpeJaApp/app/services/bookingService.ts
Propósito: Fornece funções para interagir com os endpoints de agendamento do backend.
Dependências: axios, api.ts, BookingDetails, BookingStatus, CreateBookingDto, UpdateBookingStatusDto.
Exporta: createBooking, getBookingsForUser, getBookingDetails, updateBookingStatus, cancelBooking, checkActiveChatBooking, checkConfirmedBookingBetweenUsers.
Funcionalidades Chave:

createBooking(data): Cria um novo agendamento, com a lógica de backend utilizando RedisLockService para garantir a concorrência e evitar a dupla reserva de slots. Agora, ao criar um agendamento com um cupom, ele chama `CouponsModule.applyCoupon` e armazena `couponId` e `discountAmount` em `BookingDetails`. Após a conclusão (COMPLETED), o `coupon.usageCount` é atualizado. Dispara eventos para `MissionsModule.trackEvent` ('booking_completed', 'first_booking_completed').
getBookingsForUser(status?): Obtém agendamentos do usuário logado, opcionalmente filtrados por status.
getBookingDetails(bookingId): Obtém detalhes de um agendamento específico.
updateBookingStatus(bookingId, data): Atualiza o status de um agendamento.
cancelBooking(bookingId): Cancela um agendamento.
checkActiveChatBooking(clientId, providerId): Verifica se há um agendamento ativo para permitir o chat.
Interconexões: Utilizado por schedule-service.tsx, bookings/index.tsx, bookings/[bookingId].tsx, dashboard/index.tsx, e telas de chat.
6.4. schedule-service.tsx
Caminho: LimpeJaApp/app/(client)/schedule-service.tsx
Propósito: Permite ao cliente agendar um serviço com um provedor específico, selecionando data, horário e fornecendo detalhes de endereço, com a possibilidade de aplicar cupons de desconto e visualizar promoções especiais.
Dependências: React, Animated, Alert, Dimensions, Easing, Platform, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useLocalSearchParams, useRouter, Ionicons, BlurView, Clipboard, LinearGradient, useAuth, createBooking, getProviderAvailability, getProviderDetails, BookingAddress, BookingDetails, CreateBookingDto, ProviderAvailability, ProviderDisplayInfo, ProviderServiceOffering, UserProfile, PricingType, AddressSection, CalendarHeader, ProviderBrief, TimeSlotsSection.
Funcionalidades Chave:

Recebe `providerId` e `serviceId` via parâmetros de rota.
`fetchBookingAndProviderDetails()`: Carrega detalhes do provedor e do serviço, além do endereço do usuário logado.
`prefetchAvailability()`: Pré-carrega a disponibilidade do provedor para meses adjacentes e armazena em cache.
`generateCalendarDays()`: Gera os dias do calendário para exibição.
`fetchAndProcessSlotsForDate()`: Busca e processa os horários disponíveis para a data selecionada, considerando a configuração do provedor e horários já ocupados.
Aplicação de Cupons/Ofertas: Agora aceita `couponCode` vindo da navegação (`useLocalSearchParams`) e pré-preenche o campo de cupom. Recalcula preço e destaca economia; confirmação chama `createBooking()` com `couponId` resolvido no backend. A exibição de preços reflete o breakdown completo retornado pela API de precificação do backend, incluindo todos os componentes (base, add-ons, taxa de distância, surge, descontos).
`handleConfirmBooking()`: Valida os dados e chama `createBooking()` do bookingService. Redireciona para a tela de sucesso.
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
Exibe um card de retorno (7 dias) com um cupom, incentivando uma nova reserva.
Interconexões: Consome useAuth, bookingService, providerService, paymentService. Navega para bookings/index.tsx, explore/index.tsx, messages/[chatId].tsx.
7. Busca e Descoberta
Esta seção descreve as funcionalidades de busca e exploração de serviços e provedores.

7.1. search.ts
Caminho: LimpeJaApp/types/backend/search.ts
Propósito: Define as interfaces e enums relacionadas aos parâmetros e resultados de busca na plataforma.
Dependências: ProviderDetails (de providers.ts), ServiceDetails (de services.ts), ProviderServiceDetails (de provider-service.ts).
Exporta: SearchType (enum para tipos de busca: PROVIDERS, SERVICES, OFFERS, ALL, PROVIDER_SERVICES), SortByOption (enum para opções de ordenação), SearchQuery (interface para parâmetros de consulta de busca), ProviderServiceSearchResult (interface para resultados de serviço de provedor), SearchResult (interface para a resposta completa da API de busca).
Funcionalidades Chave:

SearchQuery: Contém campos como query, type, location, latitude, longitude, radius, sortBy, permitindo buscas geolocalizadas precisas para provedores próximos.
7.2. explore/index.tsx (Client Explore)
Caminho: LimpeJaApp/app/(client)/explore/index.tsx
Propósito: A tela principal para clientes, exibindo categorias de serviço, ofertas, provedores recomendados e próximos, com base na geolocalização do usuário para relevância.
Dependências: React, Animated, Alert, Dimensions, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useRouter, ViewToken, getOffers, getServiceCategories, getUserProfile, getNearbyProviders, getRecommendedProviders, Offer, ProviderDisplayInfo, Service, UserProfile, CLIENT_ROUTES, CarouselBannerItem, CategoriaCard, HeaderSuperior, NavBar, PrestadorCard, RecomendacaoCard, SecaoContainer, SecaoPrestadores, SecaoRecomendacoes.
Funcionalidades Chave:

fetchData(): Carrega o perfil do usuário, categorias de serviço, provedores recomendados, provedores próximos e ofertas. A busca por provedores próximos agora utiliza a localização do usuário.
HeaderSuperior: Exibe o nome e endereço do usuário.
SecaoContainer: Componente reutilizável para exibir listas de categorias.
CarouselBannerItem: Carrossel de banners promocionais.
SecaoRecomendacoes / SecaoPrestadores: Exibem listas de provedores.
NavBar: Barra de navegação inferior.
Animações de entrada escalonadas para todas as seções.
Renderiza condicionalmente o `CouponWelcomeCard` no topo, logo abaixo do header, se for um novo cliente e houver uma oferta `NEW_CLIENTS` disponível, verificando também o `AsyncStorage` para o estado de dispensa.
Renderiza condicionalmente o `ReferralBanner` se o usuário tiver um código de indicação.
Interconexões: Consome clientService e providerService. Navega para telas de busca, detalhes de provedor e outras telas de navegação.
7.3. explore/[providerId].tsx (Provider Details for Client)
Caminho: LimpeJaApp/app/(client)/explore/[providerId].tsx
Propósito: Exibe os detalhes de um provedor de serviços para o cliente, incluindo informações de contato, biografia, avaliações e serviços oferecidos. Pode exibir promoções ou descontos específicos do provedor e métricas de performance públicas.
Dependências: React, Animated, Alert, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Stack, useLocalSearchParams, useRouter, useSafeAreaInsets, Ionicons, BookServiceButton, InfoChip, ReviewCard, StarRating, styles (de providerStyles.ts), useAuth, checkActiveChatBooking, getProviderDetails, ProviderDisplayInfo, ProviderReview, ProviderServiceOffering, VerificationStatus, PricingType.
Funcionalidades Chave:

Recebe providerId via parâmetros de rota.
getProviderDetails(): Carrega os detalhes do provedor.
checkActiveChatBooking(): Verifica se o cliente tem um agendamento ativo com o provedor para habilitar o botão de chat.
Exibe nome, localização, preço, anos de experiência, status de verificação, biografia e avaliações.
Exibição de Promoções/Descontos: Integração para exibir ofertas ou cupons específicos do provedor.
Exibição de Métricas de Performance: Agora exibe `acceptanceRate` e `averageResponseTime` se forem consideradas públicas.
Botões de ação (Ligar, Chat, Mapa, Compartilhar).
BookServiceButton: Botão fixo na parte inferior para agendar um serviço com o provedor.
formatPriceDisplay(): Formata o preço com base no PricingType.
Interconexões: Consome useAuth, providerService, bookingService. Navega para schedule-service.tsx e messages/[chatId].tsx.
7.4. explore/todas-categorias.tsx, explore/todos-prestadores-proximos.tsx, explore/servicos-por-categoria.tsx, explore/search-results.tsx, explore/resultados-busca.tsx
Caminho: LimpeJaApp/app/(client)/explore/*.tsx
Propósito: Estas são telas placeholder ou de resultados de busca que ainda precisam de implementação completa da lógica de busca e exibição.
Funcionalidades Chave (a serem implementadas):

todas-categorias.tsx: Listar todas as categorias de serviço.
todos-prestadores-proximos.tsx: Listar todos os provedores próximos, utilizando a funcionalidade de geolocalização.
servicos-por-categoria.tsx: Listar serviços filtrados por uma categoria específica.
search-results.tsx / resultados-busca.tsx: Exibir resultados de busca com base em parâmetros. As chamadas de busca (`clientService.searchProviders`) agora incluem parâmetros de geolocalização e os resultados exibem o `priceFrom` de forma proeminente.
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
Caminho: LimpeJaApp/app/(client)/messages/[chatId].tsx e LimpeJaApp/app/(provider)/messages/chatId.tsx
Propósito: A tela de chat para uma conversa específica, permitindo o envio e recebimento de mensagens em tempo real via WebSocket.
Dependências: React, Animated, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Stack, useLocalSearchParams, useRouter, Ionicons, io, Socket, appConfig, useAuth, getBookingDetails, getChatMessages, sendMessage (do chatService), BookingStatus, Message, SendMessa geDto.
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
Exporta: CreatePixChargeDto, PixChargeResponseDto, RequestWithdrawalDto, TransactionEntity, PaymentIntentStatus, PaymentIntent, PaymentEvent.
Funcionalidades Chave:

CreatePixChargeDto: DTO para criar uma cobrança PIX.
PixChargeResponseDto: Resposta do backend para uma cobrança PIX (inclui brCode, qrCodeImage, expiresAt).
RequestWithdrawalDto: DTO para solicitar um saque.
PaymentIntentStatus: Enum para o status da intenção de pagamento.
PaymentIntent: Representa uma intenção de pagamento/cobrança.
PaymentEvent: Modelo para eventos de pagamento (webhooks, notificações).
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

submitFeedback(data): Envia um feedback ou avaliação. Dispara `MissionsModule.trackEvent` ('review_submitted') ao enviar avaliação.
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
AnimatedContactButton: Botões para contato via e-mail, telefone e chat (simulado), com a intenção de integração com o módulo de Suporte.
Fornece opções claras para contato com o suporte, integrando com o módulo de suporte do backend para abrir tickets.
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
bookings.ts: DTOs e interfaces para agendamentos, BookingStatus, incluindo `couponId` e `discountAmount`.
chat.ts: DTOs e interfaces para mensagens de chat.
clients.ts: Interfaces para o perfil do cliente e DTOs de atualização.
dashboard.ts: Interfaces para dados do dashboard (pode ser redundante com providers.ts).
faqs.ts: Interface para itens de FAQ.
notifications.ts: Interfaces para notificações.
offers.ts: Interface para ofertas promocionais, incluindo OfferTarget e OfferStatus. Agora inclui `NEW_CLIENTS` no `OfferTarget`.
payments.ts: DTOs para operações de pagamento (PIX, saques), incluindo PaymentIntentStatus, PaymentIntent, PaymentEvent.
provider-service.ts: Detalhes de um serviço oferecido por um provedor.
providers.ts: Interfaces para o perfil do provedor, disponibilidade e DTOs relacionados, agora com `acceptanceRate` e `averageResponseTime`.
reviews.ts: DTOs e interfaces para avaliações.
search.ts: DTOs e interfaces para busca, incluindo latitude, longitude, radius em SearchQuery.
services.ts: Interfaces para tipos de serviço e PricingType.
upload.ts: DTO para respostas de upload.
users.ts: Interface UserProfile (perfil completo do usuário).
verification.ts: DTOs e enums para o processo de verificação.
support.ts (NOVO): Interfaces e DTOs para o módulo de suporte, incluindo SupportTicketStatus, SupportTicketCategory, SupportTicket, SupportMessage, SupportSlaLog.
missions.ts (NOVO): Interfaces e DTOs para o módulo de missões, incluindo MissionAudience, MissionKind, RewardType, MissionStatus, Mission, MissionProgress, MissionEvent.
referrals.ts (NOVO): Interfaces e DTOs para o módulo de indicações, incluindo Referral, CreateReferralDto.
13. Componentes Reutilizáveis (components/)
A pasta components/ contém diversos componentes reutilizáveis para construir a UI de forma consistente e eficiente. Exemplos incluem:

auth/components/: Componentes específicos para formulários de autenticação (e.g., InputWithIcon, AnimatedErrorMessage).
client/: Componentes específicos para o cliente (e.g., booking/success, explore/home, explore/provider). Inclui o novo `CouponWelcomeCard.tsx` para exibir ofertas de boas-vindas.
provider/: Componentes específicos para o provedor (e.g., dashboard, earnings, schedule/manager).
referrals/: Inclui `ReferralBanner.tsx` e `ReferralSheet.tsx` para o sistema de indicações.
ui/: Componentes de UI genéricos (e.g., ToastMessage).
ServiceItemSkeleton: Componente de placeholder para carregamento de itens de serviço.
client/explore/home/FAB_SOS.tsx: Botão de Ação Flutuante para acesso rápido ao módulo de segurança.
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
/missions (NOVO): Tela de missões gamificadas.
/(common): Grupo de rotas comuns a ambos os papéis.
/settings: Configurações do aplicativo.
/help: Central de ajuda (FAQ).
/notifications: Lista de notificações.
/feedback/[targetId]: Envio de feedback/avaliação.
/termos: Termos de Serviço.
/privacidade: Política de Privacidade.
/safety/panic: Tela de alerta de pânico.
15. Considerações Finais
Esta documentação fornece uma visão aprofundada do frontend do LimpeJáApp, destacando sua estrutura modular, o uso extensivo de tipagem (TypeScript), gerenciamento de estado via Context API e a integração com o backend via Axios. As animações e a organização do código contribuem para uma experiência de usuário fluida e um código-base manutenível. A clareza nas interconexões entre arquivos e a separação de responsabilidades são pilares importantes para o desenvolvimento contínuo do aplicativo.

Documentação do Backend Limpeja
I. Visão Geral da Arquitetura do Backend Limpeja
A. Objetivo Geral da Plataforma
A plataforma Limpeja visa conectar clientes que buscam serviços de limpeza com prestadores de serviço qualificados. O backend é o coração do sistema, gerenciando usuários, agendamentos, pagamentos, comunicações, verificações de segurança e gamificação, garantindo uma experiência segura, eficiente e confiável para todos os usuários.

B. Tecnologias Principais
O backend da Limpeja é construído sobre uma base robusta de tecnologias modernas:

NestJS: Um framework progressivo Node.js para a construção de aplicações server-side eficientes, escaláveis e de fácil manutenção, utilizando TypeScript. Sua arquitetura modular e baseada em injeção de dependências facilita a organização do código.
Prisma: Um ORM (Object-Relational Mapping) de próxima geração para Node.js e TypeScript. Ele simplifica o acesso ao banco de dados, oferecendo um cliente de banco de dados type-safe e um fluxo de trabalho intuitivo para migrações e modelagem de dados. (src/prisma/prisma.service.ts)
PostgreSQL: O banco de dados relacional utilizado para persistência de dados, escolhido por sua robustez, escalabilidade e suporte a funcionalidades avançadas como tipos geoespaciais (PostGIS).
Bull (Queues): Uma biblioteca para Node.js que implementa filas de processamento de jobs, utilizando Redis como broker. Essencial para tarefas assíncronas e de longa duração, como envio de notificações e processamento de documentos, escalonamento de tickets de suporte, entre outros.
JWT (JSON Web Tokens): Utilizado para autenticação e autorização de usuários, garantindo que apenas usuários autenticados e com as permissões corretas acessem os recursos protegidos.
Swagger/OpenAPI: Ferramentas para documentação e teste de APIs, gerando uma documentação interativa que facilita o consumo dos endpoints por parte do frontend e outros serviços. (src/bookings/bookings.controller.ts, src/clients/clients.controller.ts, src/auth/auth.controller.ts)
Sentry: Ferramenta de monitoramento de erros e performance, integrada para capturar exceções e rastrear o desempenho da aplicação em tempo real. (src/instrument.ts, src/app.module.ts)
Redis: Utilizado como broker para as filas do BullMQ e como serviço de lock distribuído para controle de concorrência.
C. Estrutura Geral dos Módulos e Interconexões
O backend é organizado em módulos coesos, cada um com responsabilidades bem definidas, promovendo a separação de preocupações e a manutenibilidade do código. A injeção de dependências do NestJS facilita a comunicação entre os módulos.

II. Documentação Detalhada por Módulo
1. Módulo Auth (Autenticação e Autorização)
Objetivo: Gerenciar o registro, login e autenticação de usuários (clientes, provedores, administradores e agentes de suporte), além de controlar o acesso a rotas protegidas.
Arquitetura:

Controladores: auth.controller.ts (expõe endpoints HTTP para registro, login e recuperação de senha).
Serviços: auth.service.ts (contém a lógica de negócio para validação de credenciais, criação de usuários, hash de senhas e geração de tokens JWT).
Estratégias:
local.strategy.ts: Implementa a estratégia de autenticação local (e-mail e senha).
jwt.strategy.ts: Implementa a estratégia de autenticação JWT, validando tokens e anexando informações do usuário (userId, email, role, clientId, providerId) ao objeto de requisição.
Guards:
local-auth.guard.ts: Utilizado para proteger rotas de login com e-mail/senha.
jwt-auth.guard.ts: Protege rotas que exigem um token JWT válido.
ws-auth.guard.ts: Um guard específico para autenticação em WebSockets, validando o token JWT do handshake.
roles.guard.ts: Trabalha em conjunto com @Roles para restringir o acesso a rotas com base na função do usuário (CLIENT, PROVIDER, ADMIN, SUPPORT_AGENT).
Decorators: @Roles (utilizado para definir quais papéis de usuário têm permissão para acessar uma rota).
DTOs: login.dto.ts, register-client.dto.ts, register-provider.dto.ts, forgot-password.dto.ts, auth-response.dto.ts, message-response.dto.ts.
Fluxos de Negócio:
Registro de Cliente: Um novo usuário se registra como cliente, fornecendo e-mail, senha, nome completo, telefone, CPF e endereço. O sistema verifica a unicidade do e-mail, telefone e CPF, faz o hash da senha e cria um novo User com o papel CLIENT e um Client associado. O endereço é geocodificado. Agora, o registro aceita um `referralCode` opcional; se presente, o novo usuário é vinculado ao indicador via `ReferralsModule` e o `CouponsModule.issueCoupon` é acionado para o indicado.
Registro de Provedor: Similar ao registro de cliente, mas com dados adicionais como data de nascimento e anos de experiência. Cria um User com o papel PROVIDER e um Provider associado. O status de verificação inicial do provedor é PENDING_INITIAL_REVIEW. O endereço é geocodificado. Assim como o registro de cliente, agora aceita um `referralCode` opcional.
Login (Email/Senha): O usuário envia e-mail e senha. O LocalAuthGuard valida as credenciais via AuthService.validateUser. Em caso de sucesso, o AuthService.login gera um accessToken JWT e retorna um UserProfileDto detalhado.
Recuperação de Senha: O usuário solicita a redefinição de senha via e-mail. O sistema gera um token de redefinição de senha (JWT com curta duração) e envia um link para o e-mail do usuário.
Autenticação WebSocket: O WsAuthGuard intercepta a conexão WebSocket, extrai e verifica o token de autenticação, anexando o payload do usuário ao objeto socket.data para uso posterior.
Regras de Negócio:
E-mails, telefones e CPFs devem ser únicos na plataforma.
Senhas possuem requisitos mínimos de segurança (comprimento, caracteres especiais).
A geocodificação de endereços é realizada durante o registro de clientes e provedores.
Tokens JWT têm tempo de expiração.
Integrações: PrismaModule (para acesso ao banco de dados), UsersModule (para mapeamento de perfil), ProvidersModule (para mapeamento de perfil de provedor), EmailModule (para envio de e-mails de recuperação de senha), GeocodingModule (para geocodificação de endereços), `ReferralsModule` (para o fluxo de indicação).
Endpoints:
POST /auth/register/client: Registra um novo cliente.
POST /auth/register/provider: Registra um novo provedor.
POST /auth/login: Realiza o login.
POST /auth/forgot-password: Solicita a redefinição de senha.
2. Módulo Users (Gerenciamento de Usuários)
Objetivo: Centralizar o ciclo de vida do usuário (CLIENT/PROVIDER/ADMIN/SYSTEM/SUPPORT_AGENT), perfil, preferências e integrações transversais.
Arquitetura:

users.controller.ts: Expõe endpoints para gerenciar o perfil do usuário logado e para administração de usuários.
users.service.ts: Contém a lógica de negócio para CRUD de usuários, atualização de perfil, gerenciamento de tokens e agendamento de exclusão.
user.entity.ts: Representa o modelo de dados do usuário.
user-profile.dto.ts: DTO para o perfil completo do usuário.
Fluxos de Negócio:
Criação & Onboarding: Usuário começa com role=CLIENT por padrão. Pode se tornar PROVIDER via ProvidersModule ou SUPPORT_AGENT via administração. Jobs de boas-vindas e notificações podem ser enfileirados.
Perfil: PATCH /users/me atualiza campos permitidos (fullName, phone, avatarUrl, preferredLanguage).
Segurança & LGPD: deletionScheduledAt permite agendar exclusão. Rotas protegidas exigem JWT e algumas @Roles(ADMIN).
Relações com Suporte: O modelo User agora inclui relações para supportTickets (tickets abertos pelo usuário), supportMessages (mensagens enviadas) e assignedTickets (tickets atribuídos a este usuário, se for um agente de suporte).
Regras de Negócio:
Usuário começa como CLIENT.
Atualizações sensíveis podem notificar o usuário.
Soft delete para LGPD.
Integrações: PrismaModule, NotificationsModule, QueuesModule, AuthModule, ProvidersModule, MissionsModule, SupportModule.
Endpoints:
GET /users/me: Retorna dados do usuário autenticado.
PATCH /users/me: Atualiza campos do perfil do usuário autenticado.
PATCH /users/me/avatar: Atualiza a URL do avatar.
PATCH /users/me/fcm-token: Salva/atualiza o token de push (FCM).
GET /users/:id (ADMIN): Busca um usuário por ID.
GET /users (ADMIN): Listagem paginada/filtrável de usuários.
DELETE /users/:id (ADMIN): Apaga ou agenda exclusão.
3. Módulo Clients (Gerenciamento de Clientes)
Objetivo: Gerenciar o perfil e dados específicos dos usuários com o papel de CLIENT.
Arquitetura:

clients.controller.ts: Expõe endpoints para o cliente acessar seu dashboard e atualizar seu perfil.
clients.service.ts: Contém a lógica de negócio para buscar e atualizar dados de clientes.
client.entity.ts: Representa a entidade Client.
update-client-profile.dto.ts: DTO para atualização de perfil do cliente.
client-dashboard.dto.ts: DTO para os dados do dashboard do cliente.
Fluxos de Negócio:
Atualização de Perfil: O cliente pode atualizar seu fullName e phone. O endereço pode ser atualizado se o DTO permitir.
Dashboard do Cliente: Retorna dados consolidados para o dashboard, incluindo contagem de agendamentos pendentes/concluídos, próximo agendamento, agendamentos recentes, serviços populares e avaliações pendentes.
Regras de Negócio:
Apenas clientes podem acessar/modificar seus próprios dados de perfil.
Administradores podem visualizar perfis de qualquer cliente.
Integrações: PrismaModule, UsersModule (para buscar dados do usuário associado).
Endpoints:
GET /clients/me/dashboard (CLIENT): Obtém dados do dashboard do cliente logado.
PATCH /clients/me (CLIENT): Atualiza o perfil do cliente logado.
GET /clients/:id (ADMIN): Obtém o perfil de um cliente por ID.
4. Módulo Providers (Gerenciamento de Prestadores)
Objetivo: Gerenciar o ciclo de vida completo dos prestadores de serviços na plataforma, incluindo métricas de performance como taxa de aceitação e tempo médio de resposta.
Arquitetura:

providers.controller.ts: Define endpoints REST para Providers.
providers.service.ts: Contém a lógica central de negócio (criação, atualização, busca, listagem, detalhamento de prestadores), incluindo o cálculo e atualização de `acceptanceRate` e `averageResponseTime`.
provider.entity.ts: Entidade que representa o modelo de Provider, agora com os campos `acceptanceRate` e `averageResponseTime`.
provider-details.dto.ts: DTO para retorno detalhado do provider.
update-provider-profile.dto.ts: DTO para atualização de perfil do provider.
Fluxos de Negócio:
Onboarding: Registro inicial de um usuário como provedor.
Customização de Perfil: Provedor atualiza informações (foto, descrição, localização).
Cadastro de Serviços: Provedor seleciona e define preços para os serviços que oferece.
Monitoramento de Performance: `acceptanceRate` (taxa de aceitação de agendamentos) e `averageResponseTime` (tempo médio para responder a mensagens/solicitações) são calculados e atualizados, influenciando o ranking e a visibilidade.
Regras de Negócio:
Um usuário pode ter apenas um perfil de provedor.
Apenas provedores com perfil completo e serviços ativos aparecem em buscas.
O ranking influencia os resultados de busca, agora considerando também as métricas de performance.
Integrações: ProviderServicesModule, BookingsModule, RankingModule, NotificationsModule, MissionsModule, ChatModule (para tempo de resposta).
Endpoints: Não explicitamente detalhados no README, mas inferidos:
POST /providers: Cria um novo provedor.
PATCH /providers/:id: Atualiza o perfil de um provedor.
GET /providers: Lista provedores.
GET /providers/recommended: Lista provedores recomendados.
GET /providers/nearby: Lista provedores próximos, utilizando geolocalização.
GET /providers/:id: Busca detalhes de um provedor.
GET /providers/me: Obtém o perfil do provedor autenticado.
PATCH /providers/me: Atualiza o perfil do provedor autenticado.
POST /providers/me/avatar: Atualiza o avatar do provedor.
DELETE /providers/:id: Apaga um provedor.
5. Módulo Services (Catálogo de Serviços Base)
Objetivo: Gerenciar o catálogo de serviços base (ex.: “Limpeza Residencial”). Serve como referência central para ProviderServices, Search, Bookings, Pricing e Missões.
Arquitetura:

services.controller.ts: Rotas/Swagger/guards para CRUD de serviços.
services.service.ts: Regras de negócio + Prisma.
service.entity.ts: DTO/entity de resposta.
create-service.dto.ts, update-service.dto.ts: DTOs para criação e atualização.
Fluxos de Negócio:
CRUD de Serviços: Criação, listagem, obtenção e atualização de serviços pelo ADMIN.
Regras de Negócio:
Unicidade do name do serviço.
price base coerente (sugestão para provedores).
defaultPricingType orienta a precificação.
Consistência referencial: remoção deve considerar vínculos.
Integrações: ProviderServices, Bookings, Search, Pricing, Missions.
Endpoints:
POST /services (ADMIN): Cria um serviço.
GET /services: Lista serviços (público autenticado).
GET /services/:id: Obtém um serviço por ID.
PATCH /services/:id (ADMIN): Atualiza um serviço.
DELETE /services/:id (ADMIN): Remove um serviço (opcional, com validação de vínculos).
6. Módulo Provider Services (Serviços Oferecidos por Prestadores)
Objetivo: Gerenciar os serviços específicos que cada prestador oferece, incluindo preço, duração e status.
Arquitetura:

provider-services.controller.ts: Define rotas REST para CRUD.
provider-services.service.ts: Contém a lógica central de negócio, validações e interação com Prisma.
provider-service.entity.ts: Define o modelo de dados de um ProviderService.
create-provider-service.dto.ts, update-provider-service.dto.ts, provider-service-details.dto.ts: DTOs para validação e resposta.
Fluxos de Negócio:
Cadastro de Serviço: Provedor cadastra um novo serviço com detalhes como nome, descrição, preço, duração e status.
Gerenciamento: Listagem, detalhamento, atualização e remoção de serviços oferecidos.
Regras de Negócio:
Um provedor pode ter múltiplos serviços ativos.
Preço e duração devem ser valores positivos.
Serviços inativos não podem ser reservados.
Cada serviço deve estar vinculado a um provedor válido.
Integrações: Bookings Module, Ranking Module, Notifications Module, Loyalty e Coupons.
Endpoints:
POST /provider-services: Cria um serviço oferecido pelo provedor.
GET /provider-services: Lista serviços oferecidos.
GET /provider-services/:id: Detalha um serviço oferecido.
PATCH /provider-services/:id: Atualiza um serviço oferecido.
DELETE /provider-services/:id: Remove um serviço oferecido.
7. Módulo Availability (Disponibilidade de Prestadores)
Objetivo: Gerenciar e consultar os horários de disponibilidade dos prestadores de serviço.
Arquitetura:

availability.controller.ts: Expõe endpoints para obter, atualizar, criar e deletar slots de disponibilidade.
availability.service.ts: Contém a lógica de negócio para gerenciar a disponibilidade e verificar horários ocupados por agendamentos.
update-availability.dto.ts: DTO para criar/atualizar slots de disponibilidade.
get-availability.dto.ts: DTO para consultar a disponibilidade por data.
availability.entity.ts: Representa um slot de disponibilidade.
Fluxos de Negócio:
Consulta de Disponibilidade: Clientes podem consultar os horários disponíveis de um provedor para uma data específica, que também considera agendamentos já confirmados.
Gerenciamento de Disponibilidade: Provedores podem adicionar, atualizar e remover seus slots de disponibilidade (dia da semana, hora de início/fim).
Regras de Negócio:
A disponibilidade é configurada por dia da semana e horário.
Horários ocupados por agendamentos confirmados (CONFIRMED, COMPLETED, IN_PROGRESS) são considerados indisponíveis.
Apenas o provedor dono pode gerenciar sua própria disponibilidade.
Integrações: PrismaModule, ProvidersModule (para validação de propriedade).
Endpoints:
GET /providers/:providerId/availability: Obtém horários de disponibilidade de um provedor para uma data específica.
PATCH /providers/:providerId/availability (PROVIDER): Atualiza horários de disponibilidade.
POST /providers/:providerId/availability (PROVIDER): Adiciona um novo slot de disponibilidade.
DELETE /providers/:providerId/availability/:availabilityId (PROVIDER): Deleta um slot de disponibilidade.
8. Módulo Bookings (Agendamentos)
Objetivo: Gerenciar todo o ciclo de vida dos agendamentos de serviços, desde a criação até a conclusão ou disputa.
Arquitetura:

bookings.controller.ts: Expõe endpoints HTTP para criação, consulta, atualização de status e reporte de problemas/disputas.
bookings.service.ts: Contém a lógica de negócio principal para agendamentos, incluindo validações, cálculo de preço, integração com pagamentos e notificações. Utiliza RedisLockService para garantir a concorrência na criação de agendamentos.
create-booking.dto.ts: DTO para criação de agendamentos.
update-booking-status.dto.ts: DTO para atualização de status.
booking-details.dto.ts: DTO para detalhes de agendamento.
booking-and-pix-response.dto.ts: DTO combinado para criação de agendamento e cobrança PIX.
report-dispute.dto.ts: DTO para reporte de disputas.
booking.entity.ts: Representa a entidade Booking, agora com relações para PaymentIntent e SupportTicket.
Fluxos de Negócio:
Criação de Agendamento: Cliente cria um agendamento para um provedor e serviço específicos. O sistema calcula o preço total com base no PricingType do ProviderService, aplica precificação dinâmica e cupons. Um novo endereço é criado. A operação é protegida por um lock distribuído para evitar race conditions. Ao `createBooking` com um cupom, ele chama `CouponsModule.applyCoupon` e armazena `couponId` e `discountAmount` em `BookingDetails`.
Criação de Agendamento com Pagamento PIX: Combina a criação do agendamento com a geração de uma cobrança PIX (PaymentIntent), retornando os detalhes do agendamento e os dados da cobrança.
Atualização de Status: Provedores e clientes podem atualizar o status do agendamento (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELED, REJECTED, RESCHEDULED, PENDING_DISPUTE). Regras de transição de status são aplicadas. Após a conclusão (COMPLETED), o `coupon.usageCount` é atualizado. O sistema mantém um flag/contador no `User` ou `Client` para identificar a primeira reserva `COMPLETED`. Dispara `MissionsModule.trackEvent` ('booking_completed') e, se for a primeira, ('first_booking_completed').
Cancelamento: Clientes podem cancelar agendamentos (com restrições de status).
Reporte de Problemas/Disputas: Clientes ou provedores podem reportar problemas ou disputas para um agendamento, alterando o status para PENDING_DISPUTE e enfileirando uma notificação para administradores.
Resolução de Disputas: Administradores podem resolver disputas, definindo um novo status, aplicando reembolsos e notificando as partes envolvidas.
Integração com Suporte: Um agendamento pode ter múltiplos SupportTicket associados.
Regras de Negócio:
Cálculo de preço baseado no PricingType (FIXED_PRICE, HOURLY, BY_SIZE) do ProviderService.
Aplicação de precificação dinâmica (PricingService) e cupons (CouponsService).
Transições de status controladas por papel de usuário e status atual.
Incremento de contadores (completedBookingsCount, monthlyBookingsCount, cancellationCount, noShowCount) para clientes e provedores.
Pontuação de fidelidade (LoyaltyService) para clientes após serviço concluído.
Notificação de avaliação após serviço concluído.
Eventos de missão (MissionsService) e conversão de indicação (ReferralsService) são disparados.
Disputas são processadas assincronamente via QueuesModule.
Integrações: PrismaModule, ClientsService, ProvidersService, ProviderServicesService, NotificationsService, QueuesService, PricingService, CouponsService, LoyaltyService, PaymentsService, MissionsService, ReferralsService, LocksModule, SupportModule.
Endpoints:
POST /bookings (CLIENT): Cria um novo agendamento.
POST /bookings/schedule-and-pay (CLIENT): Cria agendamento e gera cobrança PIX.
GET /bookings/me: Lista agendamentos do usuário logado.
GET /bookings/:id: Obtém detalhes de um agendamento específico.
PATCH /bookings/:id/status (PROVIDER/CLIENT): Atualiza o status de um agendamento.
PATCH /bookings/:id/cancel (CLIENT): Cancela um agendamento.
POST /bookings/:id/report-issue (CLIENT/PROVIDER): Reporta um problema.
POST /bookings/:id/dispute (CLIENT/PROVIDER): Reporta uma disputa.
PATCH /bookings/:id/resolve-dispute (ADMIN): Resolve uma disputa.
9. Módulo Payments (Pagamentos)
Objetivo: Gerenciar todo o fluxo de pagamentos, recebimentos e retiradas na plataforma, integrando com provedores de pagamento externos, incluindo o rastreamento de PaymentIntent e PaymentEvent.
Arquitetura:

payments.controller.ts: Define rotas HTTP para interagir com pagamentos e retiradas.
payments.service.ts: Contém a lógica de negócio dos fluxos financeiros.
payments.module.ts: Declara e organiza os providers relacionados ao módulo.
transaction.entity.ts: Representa a entidade de transação.
create-pix-charge.dto.ts: DTO para iniciar uma cobrança PIX.
request-withdrawal.dto.ts: DTO para solicitação de retirada.
payment-intent.entity.ts: Representa a intenção de pagamento.
payment-event.entity.ts: Representa os eventos de pagamento.
Fluxos de Negócio:
Criação de Cobrança via PIX: Cliente inicia pagamento de agendamento. O backend cria uma transação PIX_CHARGE (PENDING), um PaymentIntent associado, integra com provedor de pagamentos para gerar QR Code, e atualiza status para SUCCESS após confirmação. Eventos de webhook são registrados como PaymentEvent.
Registro e Rastreamento de Transações: Cada pagamento ou retirada é registrado na tabela Transaction para auditoria e relatórios. Tipos de transação incluem PIX_CHARGE, WITHDRAWAL, REFUND.
Solicitação de Retirada (Withdrawals): Provedor solicita retirada de valores acumulados. Cria uma transação WITHDRAWAL (PENDING), que é marcada como SUCCESS ou FAILED após processamento.
Regras de Negócio:
Apenas o usuário dono da transação pode visualizar ou solicitar ações.
Limites mínimos para retirada podem ser configurados.
Validação de saldo disponível para retirada.
Todas as operações financeiras são persistidas.
PaymentIntent garante idempotência e rastreamento de cada tentativa de cobrança.
PaymentEvent registra o histórico de interações com gateways de pagamento.
Integrações: BookingsModule, LoyaltyModule, MissionsModule, NotificationsModule.
Endpoints:
POST /payments/pix-charge: Cria uma cobrança PIX.
POST /payments/withdrawal: Solicita uma retirada.
GET /payments/transactions: Lista todas as transações do usuário autenticado.
POST /payments/webhook/pix: Endpoint para webhooks de PIX.
POST /payments/webhook/withdrawal: Endpoint para webhooks de retirada.
10. Módulo Pricing (Precificação Dinâmica)
Objetivo: Definir, gerenciar e aplicar regras de precificação dinâmica para os serviços, considerando também a aplicação de cupons e ofertas.
Arquitetura:

pricing.controller.ts: Expõe endpoints REST para CRUD de regras e cálculo de preço.
pricing.service.ts: Contém a lógica de negócio para CRUD de regras e a função principal `calculatePrice()`.
pricing-rule.entity.ts: Define a estrutura de uma regra de preço.
calculate-price.dto.ts: DTO para requisição de cálculo de preço.
create-pricing-rule.dto.ts, update-pricing-rule.dto.ts: DTOs para criação e atualização de regra.
Fluxos de Negócio:
Criação de Regras: Administradores podem criar regras de preço globais, por serviço ou por provedor (BASE, PERCENTAGE, FIXED_DISCOUNT, MIN_PRICE, MAX_PRICE), com condições flexíveis (JSON).
Atualização e Gerenciamento: Administradores podem ativar/inativar regras, ajustar valores e condições.
Cálculo de Preço (`calculatePrice`): Recebe `serviceId`, `providerId`, `basePrice`, `clientId` e `meta` (hora, localização). Busca regras ativas aplicáveis e as aplica em ordem específica, integrando com `CouponsService` e `OffersService` para aplicar descontos, retornando `originalPrice`, `finalPrice`, `appliedRules` e `discountsTotal`. O método `quote` foi refinado para aplicar todas as regras de precificação (surge, distância, cupons, ofertas) e retornar o breakdown detalhado.
Regras de Negócio:
Validação de compatibilidade entre type e value da regra.
Ordem de aplicação das regras (BASE -> MIN/MAX -> PERCENTAGE -> FIXED_DISCOUNT -> COUPON -> OFFER).
Apenas administradores podem criar/editar regras.
Integrações: BookingsModule (para cálculo de preço durante a criação do agendamento), CouponsModule, OffersModule.
Endpoints:
POST /pricing/rules (ADMIN): Cria uma regra de precificação.
PATCH /pricing/rules/:id (ADMIN): Atualiza uma regra existente.
GET /pricing/rules (ADMIN): Lista todas as regras.
POST /pricing/calculate: Calcula o preço de um serviço em tempo real.
11. Módulo Coupons (Cupons de Desconto)
Objetivo: Gerenciar a criação, aplicação e rastreamento de cupons de desconto, incluindo a capacidade de direcionar cupons a provedores e serviços específicos.
Arquitetura:

coupons.controller.ts: Expõe endpoints REST para CRUD de cupons e aplicação.
coupons.service.ts: Contém a lógica de negócio para criar, buscar, atualizar e aplicar cupons, além de integrar com missões.
create-coupon.dto.ts, update-coupon.dto.ts, apply-coupon.dto.ts: DTOs para validação e aplicação.
coupon.entity.ts: Define a estrutura da entidade Coupon e seus enums (CouponType, CouponTarget, CouponStatus).
Fluxos de Negócio:
CRUD de Cupons: Administradores podem criar, listar, buscar por código e atualizar cupons (código, tipo, valor, validade, usos, alvo, status). `CouponTarget` agora suporta `SPECIFIC_SERVICE` e `SPECIFIC_PROVIDER`.
Aplicação de Cupons: O `applyCoupon` verifica a validade do cupom (data, usos, status) e as regras de alvo (`target`). Implementa lógica robusta para `firstBookingOnly` (verificando `client.totalBookings` ou similar) e outras regras (expiração, usos). Calcula o `discountAmount` e `newTotalPrice`.
Emissão de Cupons via Missões: O `issueCouponFromMission` gera um cupom percentual de uso único com validade de 30 dias a partir da conclusão de uma missão. Adicionado métodos para geração de cupons: `issueReturnCoupon` (para retenção) e `issueReferralCoupon` (para indicado/indicador).
Regras de Negócio:
Códigos de cupom devem ser únicos.
Validação de datas de validade e maxUses.
Regras de alvo (target) determinam a aplicabilidade do cupom.
Cupons são marcados como usados (usesCount incrementado) após a conclusão do agendamento.
Apenas administradores podem criar/editar cupons.
Integrações: PrismaModule, MissionsModule (para emissão de cupons), BookingsModule (para aplicação e marcação de uso), PricingModule (para integração no cálculo de preço final).
Endpoints:
POST /coupons (ADMIN): Cria um novo cupom.
GET /coupons/:code (ADMIN): Busca um cupom por código.
PATCH /coupons/:id (ADMIN): Atualiza um cupom.
POST /coupons/apply (CLIENT): Aplica um cupom a um agendamento.
GET /coupons (ADMIN): Lista todos os cupons.
GET /coupons/resolve/:code: Expõe este endpoint para o frontend validar e obter detalhes de um cupom.
12. Módulo Offers (Ofertas Promocionais)
Objetivo: Gerenciar ofertas promocionais programadas e estratégicas, complementando cupons e precificação, com a capacidade de direcionar ofertas a provedores e serviços específicos.
Arquitetura:

offers.controller.ts: Expõe rotas REST para CRUD de ofertas.
offers.service.ts: Contém a lógica de negócio para criar, gerenciar e aplicar ofertas.
offer.entity.ts: Define o modelo da entidade Offer.
create-offer.dto.ts, update-offer.dto.ts, offer-details.dto.ts: DTOs para validação e resposta.
Fluxos de Negócio:
Criação de Ofertas: Administradores criam ofertas com discountValue, discountType, target (GENERAL, SPECIFIC_SERVICE, SPECIFIC_PROVIDER, NEW_CLIENTS), validFrom e validUntil. `OfferTarget` agora suporta `SPECIFIC_SERVICE` e `SPECIFIC_PROVIDER`, e também `NEW_CLIENTS`.
Validação Automática: Ofertas têm validações de data e valor. São automaticamente marcadas como EXPIRED ao passar da data de validade.
Aplicação de Ofertas: Durante busca ou checkout, o sistema consulta ofertas ativas e elegíveis (`getActiveOffersForUser`).
Atualização e Remoção: Atualizações podem alterar datas, status e valor. Remoções marcam a oferta como INACTIVE para preservar histórico.
Regras de Negócio:
Ofertas programadas com escopo alvo.
Validações de datas e valores.
Remoção é um soft delete.
Integrações: SearchModule, BookingsModule, NotificationsModule, PricingModule (para integração no cálculo de preço final).
Endpoints:
POST /offers (ADMIN): Cria uma nova oferta.
GET /offers/:id: Busca detalhes de uma oferta.
GET /offers: Lista todas as ofertas.
PATCH /offers/:id (ADMIN): Atualiza uma oferta.
DELETE /offers/:id (ADMIN): Remove ou inativa uma oferta.
13. Módulo Reviews (Avaliações)
Objetivo: Permitir que clientes avaliem serviços concluídos, alimentando métricas de qualidade de prestadores e gerando pontos de fidelidade.
Arquitetura:

reviews.controller.ts: Expõe endpoints REST para criar e consultar avaliações.
reviews.service.ts: Contém a lógica de negócio para validações, criação, métricas e integrações.
review.entity.ts: Representa a entidade Review.
Fluxos de Negócio:
Criação de Avaliação: Cliente envia avaliação para um agendamento COMPLETED. O sistema valida elegibilidade, credita pontos de fidelidade (LoyaltyService), dispara evento de missão (MissionsService) e atualiza indicadores do provedor (ProvidersService). Aciona `MissionsModule.trackEvent` ('review_submitted') ao submeter avaliações.
Listagem e Consulta: Lista avaliações com filtros opcionais (providerId, clientId, minRating, maxRating).
Regras de Negócio:
Apenas o cliente do booking pode avaliar.
Booking deve estar COMPLETED.
Apenas uma avaliação por booking.
Pontuação de fidelidade diferenciada para primeira avaliação e subsequentes.
Atualização de badges e contadores do provedor.
Integrações: PrismaModule, BookingsService, ProvidersService, LoyaltyService, MissionsService.
Endpoints:
POST /reviews: Cria uma avaliação.
GET /reviews: Lista avaliações.
GET /reviews/:id: Busca uma avaliação específica.
GET /reviews/:providerId/breakdown: Retorna o detalhamento de ratings para um provedor.
GET /reviews/:providerId/suggestions: Retorna sugestões inteligentes para um provedor.
14. Módulo Ranking (Ranqueamento de Prestadores)
Objetivo: Calcular e expor o ranking de prestadores para fins de listagem, destaque e busca, consolidando sinais de qualidade e atividade, incluindo as novas métricas de performance do provedor.
Arquitetura:

ranking.module.ts: Declara o módulo e exporta o RankingService.
ranking.service.ts: O motor de ranking, consulta dados, normaliza sinais, aplica fórmula de score com pesos configuráveis e filtros. O algoritmo de ranking foi modificado para incluir `acceptanceRate`, `averageResponseTime` e possíveis "badges" na pontuação.
ranking.controller.ts: Expõe endpoints REST para listagem ranqueada e rebuild de cache.
provider-ranking.dto.ts: DTO de saída para itens ranqueados.
Fluxos de Negócio:
Cálculo de Score: Utiliza uma fórmula ponderada de sinais como rating médio, bookings concluídos, taxa de 5 estrelas, recência de review, proximidade geográfica, taxa de aceitação e tempo médio de resposta.
Listagem Ranqueada: Retorna uma lista de provedores ordenada por score, com filtros opcionais por serviceId, city, nearbyLat/nearbyLng.
Regras de Negócio:
Fórmula de scoring com pesos ajustáveis.
Normalização de dados para o cálculo do score.
Decay temporal para reviews antigas.
Mínimos estatísticos para evitar manipulação.
Atribuição de "badges" com base em limiares.
Integrações: Prisma, Reviews, Bookings, ProvidersModule (para métricas de performance).
Endpoints:
GET /ranking/providers: Lista ranqueada com filtros e paginação.
GET /ranking/top: Atalho para top N provedores.
POST /ranking/rebuild (ADMIN): Força rebuild/invalidação de cache.
15. Módulo Search (Busca de Serviços e Provedores)
Objetivo: Fornecer mecanismos de busca inteligente de serviços e provedores, permitindo que clientes localizem ofertas e profissionais disponíveis, com suporte a busca por geolocalização precisa.
Arquitetura:

search.controller.ts: Expõe endpoints REST para busca.
search.service.ts: Contém a lógica de negócio para consultas ao banco via Prisma. Assegura que a busca por provedores retorne o `priceFrom` corretamente, refletindo a precificação.
search-query.dto.ts: Define parâmetros de entrada da busca, incluindo latitude, longitude e radius.
provider-service-search-result.dto.ts: Define o formato de resposta dos resultados.
Fluxos de Negócio:
Consulta de Busca: Cliente envia consulta com filtros (query, location, priceRange, categories). A busca pode ser aprimorada com latitude, longitude e radius para encontrar provedores geograficamente próximos.
Execução da Busca: SearchService utiliza Prisma para consultar ProviderService, aplicando filtros dinâmicos. A integração com PostGIS permite consultas geoespaciais eficientes.
Montagem dos Resultados: Retorno transformado em objetos padronizados com informações do serviço, provedor, preço, categoria, etc.
Regras de Negócio:
Validação de parâmetros via DTO.
Filtros dinâmicos.
Priorização de resultados baseada na distância para buscas geolocalizadas.
Integrações: Prisma ORM, Providers Module, Reviews Module (opcional), GeocodingModule.
Endpoints:
GET /search: Busca serviços/provedores.
16. Módulo Notifications (Notificações)
Objetivo: Gerenciar a criação, envio e atualização de notificações no sistema, garantindo que usuários e administradores recebam comunicações relevantes.
Arquitetura:

notifications.controller.ts: Expõe rotas HTTP.
notifications.service.ts: Contém a lógica de negócio.
notification.entity.ts: Define a estrutura da entidade Notification.
create-notification.dto.ts, update-notification.dto.ts: DTOs para validação.
Fluxos de Negócio:
Gatilho de Evento: Serviços chamam `notificationsService.create()` a partir de eventos (reserva criada, missão concluída). Inclui novos gatilhos como: cupom emitido (boas-vindas, missão, indicação), cupom expirando em breve, missão iniciada/progresso/concluída/resgatada, atualização de status de indicação (ex: "Seu amigo concluiu a primeira reserva!"), pontos de fidelidade ganhos/resgatados.
Persistência: Notificação é salva no banco.
Entrega: Notificação disponível na listagem do usuário.
Interação do Usuário: Marcada como READ ao ser visualizada.
Regras de Negócio:
ADMIN pode criar e atualizar notificações.
Usuário (CLIENTE/PROVIDER) pode listar e atualizar o status das próprias notificações.
Integrações: Prisma, QueuesModule (futura para envio em larga escala), FCM/APNs (futura para push).
Endpoints:
POST /notifications (ADMIN): Cria uma nova notificação.
PATCH /notifications/:id (ADMIN): Atualiza status ou conteúdo.
GET /notifications/me (USER): Lista notificações do usuário autenticado.
PATCH /notifications/me/mark-as-read: Marca todas as notificações do usuário como lidas.
PATCH /notifications/:id/mark-as-read: Marca uma notificação específica como lida.
DELETE /notifications/:id: Deleta uma notificação.
17. Módulo Queues (Filas de Processamento Assíncrono)
Objetivo: Processar tarefas assíncronas e trabalhos de longa duração fora do ciclo de requisição HTTP, reduzindo latência e melhorando a resiliência.
Arquitetura:

NestJS + @nestjs/bull + bull usando Redis como broker.
queues.module.ts: Registra filas e processors (workers).
queues.service.ts: Fachada para enfileirar jobs.
Casos de Uso Suportados:
Notificações: Envio assíncrono de push, e-mail ou in-app (ex.: solicitar avaliação, alertas administrativos).
Verificação (KYC / documentos): Processamento de análise de documentos e validações em background (OCR, liveness).
Disputas (Opcional/Previsto): Encaminhar carga de trabalho para uma fila específica de análise/resolução.
Geração de Agendamentos Recorrentes (Assinaturas): Gerar novos agendamentos automaticamente para assinaturas.
Escalonamento de Suporte: Processamento assíncrono de regras de SLA para tickets de suporte.
Como Funciona:
Produção do Job: Módulos injetam QueuesService e chamam métodos especializados (addNotificationJob, addVerificationJob, addDisputeJob, addSubscriptionGenerationJob, addSupportEscalationJob).
Encaminhamento e Persistência: Bull grava o job no Redis com metadados.
Processamento: O worker correspondente consome o job e executa a ação via serviços de domínio.
Retentativas, Backoff e DLQ: Falhas disparam retentativas automáticas.
APIs do QueuesService: Métodos para adicionar jobs de notificação, verificação, disputa e geração de assinaturas, com opções para jobId, delayMs, attempts, backoffMs, priority.
Workers:
notification.worker.ts: Processa jobs da fila notifications (ex.: send-notification).
verification.worker.ts: Processa jobs da fila verification (ex.: provider-verification, document-ocr).
subscription-generation.worker.ts (inferido): Processa jobs para gerar agendamentos de assinaturas.
escalations.job.ts (NOVO): Processa jobs da fila support-escalations para verificar e escalar tickets de suporte.
Boas Práticas: Idempotência com jobId, delays conscientes, backoff exponencial, segregação de filas, remoção de jobs, rate limit.
Observabilidade: Logs de workers, métricas (processados/falhados, tempo de processamento, tamanho da fila), UI de monitoramento (bull-board).
Integrações: NotificationsService, VerificationService, BookingsService, MissionsService, SubscriptionsService, SupportService.
18. Módulo Verification (Validação de Identidade)
Objetivo: Responsável pelo processo de validação de identidade de prestadores de serviço, garantindo segurança e confiabilidade.
Arquitetura:

verification.controller.ts: Define endpoints HTTP.
verification.service.ts: Contém toda a lógica de negócio (armazenar, processar e validar documentos).
document-processing.service.ts: Serviço auxiliar para upload e processamento de imagens (OCR, comparação facial, prova de vida) via Google Cloud Storage/Vision API.
verification.module.ts: Configura dependências.
DTOs: upload-document.dto.ts, upload-selfie.dto.ts, advance-status.dto.ts, reject-provider.dto.ts.
Fluxos de Negócio:
Upload de Documentos: Prestador envia imagens/documentos oficiais. Backend armazena e envia para DocumentProcessingService (OCR, autenticidade, cruzamento de dados).
Upload de Selfie (Prova de Vida): Prestador envia selfie. Pode ser comparada com foto do documento.
Processamento & Análise: VerificationService coordena o processamento, utilizando filas (QueuesModule) para tarefas assíncronas (OCR, validação facial, notificação ao compliance).
Resultado da Verificação: Status VERIFIED (aprovado), UNDER_REVIEW (pendente), REJECTED (rejeitado com notificação).
Gerenciamento Administrativo: Administradores podem avançar o status de verificação ou rejeitar um provedor com um motivo.
Regras de Negócio:
Apenas prestadores de serviço passam pelo fluxo.
Exige documento oficial válido e selfie de prova de vida.
Uso de filas para escalabilidade.
Prestador UNVERIFIED não pode aceitar serviços.
Integrações: PrismaModule, ProvidersModule, QueuesModule, NotificationsModule, DocumentProcessingModule.
Endpoints:
POST /verification/document: Upload de documento.
POST /verification/selfie: Upload de selfie.
GET /verification/status/:providerId: Consulta status de verificação.
GET /verification/pending-queue (ADMIN): Lista provedores com verificação pendente.
POST /verification/advance-status (ADMIN): Avança o status de verificação de um provedor.
POST /verification/reject/:providerId (ADMIN): Rejeita a verificação de um provedor.
PATCH /verification/:providerId/status (ADMIN): Atualiza o status de verificação (para uso interno ou admin).
POST /verification/upload-avatar: Upload de avatar (geral, não apenas para verificação).
19. Módulo Safety (Segurança e Incidentes)
Objetivo: Garantir a segurança de clientes e prestadores, fornecendo mecanismos de relato de incidentes e alerta de pânico.
Arquitetura:

safety.controller.ts: Expõe rotas da API.
safety.service.ts: Contém a lógica de negócio para registro, atualização e consulta. Implementa a lógica completa para `reportPanic` (com notificações via `notifications.service.ts` e SMS via `sms.service.ts`) e `reportIncident`.
Entities: incident.entity.ts, panic-alert.entity.ts.
DTOs: report-incident.dto.ts, update-incident.dto.ts, report-panic.dto.ts.
Fluxos de Negócio:
Relato de Incidentes: Usuário preenche detalhes do ocorrido (userId, bookingId, type, description). SafetyService cria registro PENDING, que pode ser revisado e atualizado (IN_REVIEW, RESOLVED, ESCALATED).
Alerta de Pânico: Usuário aciona botão no app (userId, location, bookingId, notes). SafetyService cria registro ACTIVE, dispara notificações para admins/suporte.
Monitoramento e Auditoria: Incidentes e alertas registrados para auditoria, análise de risco e aprimoramento da confiança.
Regras de Negócio:
Apenas usuários autenticados podem reportar.
Incidentes PENDING até revisão manual.
Alertas de pânico geram registros imediatos e ficam ativos até encerrados.
Logs completos para auditoria.
Integrações: Prisma, NotificationsModule, SmsModule (para alertas de pânico via SMS).
Endpoints:
Incidentes:
POST /safety/incident: Reportar incidente.
PATCH /safety/incident/:id/status: Atualizar status de incidente.
GET /safety/me/incidents: Listar incidentes reportados pelo usuário.
GET /safety/incident/:id: Buscar incidente específico.
Alertas de Pânico:
POST /safety/panic: Disparar alerta de pânico.
GET /safety/panic/:id: Consultar alerta específico.
GET /safety/panic: Listar alertas ativos/recentes.
20. Módulo Referrals (Indicações)
Objetivo: Gerenciar o registro de indicações de usuários, consulta e integrações com Loyalty e Missões.
Arquitetura:

Modelo (Prisma): Referral (com referredUserId único e par (referredUserId, referrerUserId) único).
DTO: CreateReferralDto.
referrals.service.ts: Lógica para criar e buscar indicações. Implementa `createReferral` para registrar a indicação, verificando autoindicação, existência de usuários e unicidade. Adiciona lógica para recompensar o indicador quando o indicado concluir sua primeira reserva (chamando `loyalty.service.ts.addPoints` ou `coupons.service.ts.issueCoupon`).
referrals.controller.ts: Expõe endpoints.
Fluxos de Negócio:
Criação de Indicação: `createReferral` verifica autoindicação, existência de usuários e unicidade. Cria a indicação e credita pontos de fidelidade (`LoyaltyService`) para o indicador.
Conversão de Indicação: Quando o `referredUser` tem sua primeira reserva `COMPLETED`, o `BookingsService` dispara um evento (`referral.converted`) para o `MissionsService`, recompensando o indicador. O método `handleBookingCompletedForReferral(referredUserId, bookingId)` centraliza essa lógica.
Geração de Código de Indicação: Adicionado endpoint/lógica `generateReferralCode(userId)` para usuários obterem seu código único.
Regras de Negócio:
Não permite autoindicação.
Um usuário só pode ser indicado uma vez.
Pontos de fidelidade podem ser dados na criação ou na conversão.
Integrações: PrismaModule, LoyaltyModule, MissionsModule, BookingsService.
Endpoints:
POST /referrals: Cria a indicação.
GET /referrals/:id: Detalhe de uma indicação.
GET /referrals/me: Lista indicações feitas pelo usuário logado.
GET /referrals/me/code: Endpoint para o usuário obter seu código de indicação.
21. Módulo Missions (Gamificação e Recompensas)
Objetivo: Criar objetivos gamificados que, ao serem atingidos, geram recompensas (cupons ou pontos de fidelidade) para o usuário, agora com suporte a missões direcionadas a provedores para aumentar o engajamento.
Arquitetura:

Modelos (Prisma): Mission, MissionProgress, MissionEvent.
Enums: MissionAudience, MissionKind, RewardType, MissionStatus.
missions.service.ts: Contém a lógica principal (`trackEvent`, `getMyMissions`, `claimMission`). Implementa `trackEvent(userId, eventName, meta?)` para registrar eventos e recalcular o progresso de missões ativas que escutam esse evento, incluindo novos gatilhos: `'first_booking_completed'` (acionado por BookingsModule), `'review_submitted'` (acionado por ReviewsModule), `'booking_accepted'` (acionado por BookingsModule), `'chat_response_time_met'` (requer nova lógica no ChatModule), `'rating_maintained'` (requer nova lógica ou integração com ReviewsModule). Implementa `claimMission` para validar e liberar recompensas (`cupons` via `CouponsService` ou `pontos` via `LoyaltyService`).
Fluxos de Negócio:
Rastreamento de Eventos: `MissionsService.trackEvent(userId, eventName, meta?)` grava o evento e recalcula o progresso de missões ativas que escutam esse evento.
Cálculo de Progresso: Baseado no MissionKind (COUNT_EVENT, STREAK_DAYS, WITHIN_WINDOW). Atualiza currentValue e status.
Resgate de Recompensas: Usuário chama `claimMission`. O módulo valida o status da missão (COMPLETED e não CLAIMED), emite cupom (`CouponsService`) ou credita pontos (`LoyaltyService`), e marca a missão como CLAIMED.
Missões para Provedores: `MissionAudience` agora inclui `PROVIDER`, permitindo a criação de missões específicas para engajar os prestadores (ex: "Complete 10 serviços no mês", "Mantenha taxa de aceitação acima de X%").
Regras de Negócio:
Missões definidas por código, título, tipo, evento, valor alvo e janela de tempo.
Recompensas podem ser cupons ou pontos.
`trackEvent` é idempotente para modos de janela.
`claimMission` valida elegibilidade e emite recompensa.
Integrações: PrismaService, CouponsService, LoyaltyService, BookingsModule, ReviewsModule, ReferralsModule, ProvidersModule (para missões de provedores).
Endpoints:
GET /missions/my (CLIENT/PROVIDER): Retorna a lista de missões ativas com progresso do usuário.
POST /missions/claim (CLIENT/PROVIDER): Resgata a recompensa de uma missão.
22. Módulo Chat (Comunicação em Tempo Real)
Objetivo: Fornecer funcionalidades de comunicação em tempo real entre clientes e provedores.
Arquitetura:

chat.controller.ts: Expõe endpoints REST para gerenciamento de chat.
chat.service.ts: Contém a lógica de negócio para encontrar/criar chats, enviar/receber mensagens. Pode contribuir para o cálculo de `averageResponseTime` do provedor.
chat.gateway.ts: Implementa a comunicação WebSocket para mensagens em tempo real.
message.entity.ts: Representa a entidade Message.
DTOs: send-message.dto.ts, get-messages.dto.ts, chat-details.dto.ts, conversation-item.dto.ts.
Fluxos de Negócio:
Encontrar ou Criar Chat: findOrCreateChat encontra um chat existente entre um cliente e um provedor ou cria um novo.
Enviar Mensagem: createMessage cria uma mensagem no banco de dados. O ChatGateway emite a mensagem em tempo real para os participantes via WebSocket.
Obter Mensagens: getMessagesByChatId busca mensagens de uma conversa específica.
Listar Conversas do Usuário: getConversationsForUser retorna uma lista de conversas do usuário logado, incluindo a última mensagem e contagem de não lidas.
Regras de Negócio:
Chats são permitidos apenas entre um cliente e um provedor.
Mensagens só podem ser enviadas se houver um agendamento CONFIRMED entre os participantes. Chats são bloqueados se o agendamento for COMPLETED ou CANCELED.
Validação de remetente e destinatário como participantes válidos do chat.
Contagem de mensagens não lidas.
Integrações: PrismaModule, AuthModule (para autenticação WebSocket), ProvidersModule (para métricas de tempo de resposta).
Endpoints:
GET /chat/find-or-create/provider/:providerId/client/:clientId: Encontra ou cria um chat.
POST /chat/:chatId/messages: Envia uma nova mensagem.
GET /chat/:chatId/messages: Obtém mensagens de uma conversa.
GET /chat/me/conversations: Obtém a lista de conversas do usuário logado.
23. Módulo Prisma (ORM e Acesso a Dados)
Objetivo: Fornecer uma camada de abstração para o acesso ao banco de dados PostgreSQL, garantindo operações type-safe e gerenciamento de conexões.
Arquitetura:

prisma.service.ts: Estende PrismaClient, gerenciando a conexão ($connect, $disconnect) e habilitando shutdown hooks para desligamento gracioso.
prisma.module.ts: Torna o PrismaService disponível globalmente via injeção de dependência.
Funcionalidades Principais:
Conexão e Desconexão: Gerencia o ciclo de vida da conexão com o banco de dados.
Type-Safety: Fornece um cliente de banco de dados totalmente tipado, reduzindo erros em tempo de execução.
Migrações: Suporta o fluxo de migrações de esquema do Prisma.
Query Building: Permite construir queries complexas de forma programática.
Raw Queries: Suporte para queries SQL brutas quando necessário ($executeRaw, Prisma.sql).
Suporte a Extensões: Configurado para utilizar extensões PostgreSQL como PostGIS para funcionalidades geoespaciais.
24. Módulo Config (Configuração da Aplicação)
Objetivo: Gerenciar as variáveis de ambiente e configurações da aplicação de forma centralizada e validada.
Arquitetura:

config.module.ts: Importa NestConfigModule, definindo que as configurações serão carregadas de .env e validadas.
configuration.ts: Define a estrutura da configuração, mapeando variáveis de ambiente para um objeto de configuração.
validation-schema.ts: Utiliza Joi para definir um esquema de validação rigoroso para todas as variáveis de ambiente necessárias, incluindo REDIS_URL.
Configurações Gerenciadas:
Gerais: PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRATION_TIME, APP_BASE_URL.
Serviços Externos: Google Cloud Storage (GCS), Cellereit Facematch (API de terceiros), Email Service (SendGrid/SMTP), SMS Service (Twilio), Geocoding Service (Google Maps/OpenStreetMap), PagSeguro.
Filas: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, QUEUE_ATTEMPTS_DEFAULT, etc. (REDIS_URL para conexão BullMQ e Locks).
Funcionalidades Principais:
Carregamento de .env: Carrega variáveis de ambiente do arquivo .env.
Validação: Garante que todas as variáveis de ambiente obrigatórias estejam presentes e no formato correto.
Acesso Tipado: Permite acessar as configurações de forma tipada através do ConfigService.
25. Módulo Cache (Gerenciamento de Cache)
Objetivo: Implementar uma camada de cache para melhorar a performance da aplicação, reduzindo a carga no banco de dados e acelerando o tempo de resposta.
Arquitetura:

cache.module.ts: Configura o NestCacheModule com Redis como store, utilizando KeyvRedis.
cache.service.ts: Fornece uma interface simplificada para interagir com o cache (get, set, del, reset).
Funcionalidades Principais:
Armazenamento em Redis: Utiliza Redis para armazenar dados em cache, permitindo escalabilidade e persistência.
Operações Básicas: Suporta operações de leitura, escrita, deleção e reset do cache.
TTL (Time-To-Live): Permite definir um tempo de vida para os itens em cache.
Logging: Registra hits/misses e erros do cache.
Integrações: ConfigModule (para obter configurações do Redis e TTL).
26. Módulo Loyalty (Fidelidade)
Objetivo: Gerenciar o sistema de pontos de fidelidade para usuários, recompensando ações na plataforma, incluindo a conclusão de missões gamificadas.
Arquitetura:

loyalty.module.ts: Declara o módulo.
loyalty.service.ts: Contém a lógica para adicionar e gerenciar pontos.
loyalty.controller.ts: Expõe endpoints para consulta de saldo e resgate de pontos.
DTOs: add-points.dto.ts, redeem-points.dto.ts.
Modelo (Prisma): LoyaltyTransaction (registra cada transação de pontos).
Enum (Prisma): LoyaltyTransactionType.
Fluxos de Negócio:
Adicionar Pontos: `addPoints` registra uma transação de pontos para um `userId` com um `type` e `referenceId`. Pode incluir lógica de campanhas (ex: dobrar pontos). Inclui novos tipos de transação: `REFERRAL_CONVERSION` (para indicações convertidas) e `MISSION_COMPLETED` (para missões concluídas).
Resgatar Pontos: `redeemPoints` permite ao usuário trocar pontos por recompensas (ex: cupons). Verifica saldo, busca recompensa, cria o cupom e debita os pontos. Implementado para converter pontos em `Coupons` (ex: 1000 pontos = R$10 cupom).
Consulta de Saldo e Histórico: `getUserPoints` e `getLoyaltyHistory` fornecem o saldo atual e o histórico de transações de pontos.
Regras de Negócio:
Pontos são concedidos por ações específicas (SERVICE_COMPLETED, FIRST_REVIEW, REVIEW_SUBMITTED, REFERRAL, MISSION_COMPLETED).
Cada transação é auditável.
Saldo insuficiente impede o resgate.
Integrações: PrismaModule, BookingsModule, ReviewsModule, ReferralsModule, MissionsModule (para recompensas de missões), CouponsModule (para emissão de cupons).
Endpoints:
GET /loyalty/me: Obtém o saldo de pontos do usuário logado.
GET /loyalty/me/history: Obtém o histórico de transações de pontos do usuário logado.
POST /loyalty/redeem: Resgata pontos por uma recompensa.
27. Módulo Compliance (Conformidade e LGPD)
Objetivo: Garantir a conformidade com regulamentações de privacidade de dados como a LGPD, gerenciando consentimentos e solicitações de titulares de dados.
Arquitetura:

compliance.service.ts: Contém a lógica para registro/verificação de consentimento, DSAR e exclusão de dados.
Modelo (Prisma): UserConsent.
Fluxos de Negócio:
Registro de Consentimento: recordConsent registra ou atualiza o consentimento de um usuário para termos de serviço ou política de privacidade, com controle de versão.
Verificação de Consentimento: checkConsent verifica se um usuário consentiu com uma versão específica de um documento.
Geração de Orçamento Itemizado (Placeholder): generateItemizedQuote é um método placeholder para gerar detalhes de orçamento para um agendamento.
Processamento de DSAR (Data Subject Access Request): processDataSubjectAccessRequest coleta e retorna todos os dados de um usuário para atender a uma solicitação de acesso do titular.
Processamento de Solicitação de Exclusão (Right to Erasure): processErasureRequest anonimiza os dados de um usuário em vez de excluí-los completamente para manter a integridade referencial e requisitos legais.
Regras de Negócio:
Consentimentos são versionados.
Anonimização de dados é a abordagem preferida para exclusão.
Acesso a dados sensíveis é logado.
Integrações: PrismaService.
Endpoints: Não explicitamente detalhados, mas operações de compliance geralmente são acessadas via rotas administrativas ou internas.
28. Módulo Dashboard (Painel de Provedor)
Objetivo: Fornecer dados consolidados e métricas chave para o painel de controle do provedor, incluindo métricas de performance como taxa de aceitação e tempo médio de resposta.
Arquitetura:

dashboard.controller.ts: Expõe o endpoint para obter os dados do dashboard.
dashboard.service.ts: Orquestra a coleta de dados de outros serviços para compor o dashboard.
dashboard.dto.ts: DTO de resposta para os dados do dashboard do provedor, agora incluindo `acceptanceRate` e `averageResponseTime`.
Fluxos de Negócio:
Obtenção de Dados: O serviço busca informações do provedor, agendamentos futuros, sumário de ganhos e avaliações recentes, além das métricas de performance calculadas pelo ProvidersService, consolidando-as em um único objeto de resposta.
Regras de Negócio:
Apenas provedores autenticados podem acessar seu próprio dashboard.
Integrações: ProvidersModule, BookingsModule, EarningsModule, ReviewsModule, NotificationsModule.
Endpoints:
GET /providers/me/dashboard (PROVIDER): Obtém dados do painel do provedor logado.
29. Módulo Dispute (Gerenciamento de Disputas)
Objetivo: Gerenciar o ciclo de vida das disputas relacionadas a agendamentos, permitindo o reporte, comunicação e resolução.
Arquitetura:

dispute.controller.ts: Expõe endpoints REST para criar, consultar, listar e atualizar disputas.
dispute.service.ts: Contém a lógica de negócio para o gerenciamento de disputas, incluindo validações, mensagens e processamento de reembolsos.
DTOs: create-dispute.dto.ts, update-dispute.dto.ts.
Fluxos de Negócio:
Criação de Disputa: Clientes ou provedores podem abrir uma disputa para um agendamento, fornecendo um motivo e descrição. O sistema verifica permissões, impede disputas duplicadas e atualiza o status do agendamento para PENDING_DISPUTE.
Comunicação na Disputa: Mensagens podem ser adicionadas à disputa por qualquer parte envolvida (cliente, provedor, admin) para facilitar a comunicação.
Listagem e Detalhes: Administradores podem listar e consultar detalhes de qualquer disputa. Clientes/provedores podem consultar suas próprias.
Atualização de Status e Resolução: Administradores podem atualizar o status da disputa (PENDING, IN_REVIEW, RESOLVED, etc.), adicionar notas de resolução e processar reembolsos.
Regras de Negócio:
Apenas clientes ou provedores envolvidos no agendamento, ou administradores, podem criar/acessar disputas.
Não pode haver múltiplas disputas ativas para o mesmo agendamento.
Notas de resolução são obrigatórias para disputas RESOLVED.
Reembolsos podem ser processados como parte da resolução.
Notificações são enviadas para todas as partes envolvidas em cada etapa.
Integrações: PrismaModule, BookingsModule (para atualizar status de agendamento), NotificationsModule (para enviar alertas).
Endpoints:
POST /disputes (CLIENT/PROVIDER): Cria uma nova disputa.
GET /disputes/:id: Busca os detalhes de uma disputa.
GET /disputes (ADMIN): Lista disputas com filtros.
POST /disputes/:id/message (CLIENT/PROVIDER/ADMIN): Adiciona uma mensagem a uma disputa.
PATCH /disputes/:id/status (ADMIN): Atualiza o status de uma disputa.
30. Módulo Earnings (Ganhos de Provedores)
Objetivo: Gerenciar e exibir os ganhos e o histórico de transações financeiras dos provedores.
Arquitetura:

earnings.controller.ts: Expõe endpoints para consulta de ganhos e solicitação de saques.
earnings.service.ts: Contém a lógica de negócio para calcular ganhos, gerenciar saques e buscar transações.
DTOs: earnings.dto.ts (EarningsResponseDto, WithdrawalRequestDto, WithdrawalResponseDto).
Fluxos de Negócio:
Consulta de Ganhos: Retorna o total de ganhos, valor disponível para saque, saques pendentes, transações recentes e um breakdown de ganhos por período.
Solicitação de Saque: Provedor solicita a retirada de um valor. O sistema verifica o saldo disponível e cria uma transação de saque com status PENDING.
Regras de Negócio:
Ganhos são calculados a partir de agendamentos COMPLETED.
Saques pendentes são deduzidos do valor disponível.
Transações de saque são registradas e aguardam processamento administrativo.
Verificação de saldo suficiente para saque.
Integrações: PrismaModule, ProvidersModule (para obter dados do provedor).
Endpoints:
GET /providers/me/earnings (PROVIDER): Obtém dados de ganhos e histórico de transações.
POST /providers/me/earnings/withdrawal (PROVIDER): Solicita um saque.
31. Módulo FAQS (Perguntas Frequentes)
Objetivo: Gerenciar uma base de dados de perguntas frequentes (FAQs) para clientes e provedores.
Arquitetura:

faqs.controller.ts: Expõe endpoints REST para CRUD de FAQs.
faqs.service.ts: Contém a lógica de negócio para criar, buscar, atualizar e remover itens de FAQ.
DTOs: create-faq.dto.ts, update-faq.dto.ts.
faq-item.entity.ts: Representa a entidade FAQItem.
Fluxos de Negócio:
CRUD de FAQs: Administradores podem criar, listar, buscar por ID, atualizar e remover itens de FAQ, incluindo pergunta, resposta, categoria e ordem de exibição.
Consulta Pública: Qualquer usuário pode consultar a lista de FAQs.
Regras de Negócio:
Apenas administradores podem gerenciar FAQs.
Integrações: PrismaModule, AuthModule (para autenticação e autorização).
Endpoints:
POST /faqs (ADMIN): Cria um novo item de FAQ.
GET /faqs: Obtém todos os itens de FAQ.
GET /faqs/:id: Obtém um item de FAQ por ID.
PATCH /faqs/:id (ADMIN): Atualiza um item de FAQ.
DELETE /faqs/:id (ADMIN): Exclui um item de FAQ.
32. Módulo Guarantee (Garantia de Serviço)
Objetivo: Gerenciar solicitações de garantia de serviço, permitindo que clientes reportem problemas após a conclusão do serviço e busquem resolução.
Arquitetura:

guarantee.controller.ts: Expõe endpoints REST para submeter, consultar e atualizar solicitações de garantia.
guarantee.service.ts: Contém a lógica de negócio para o gerenciamento de solicitações de garantia.
DTOs: submit-claim.dto.ts, update-claim.dto.ts.
guarantee-claim.entity.ts: Representa a entidade GuaranteeClaim.
Fluxos de Negócio:
Submissão de Solicitação: Cliente pode submeter uma solicitação de garantia para um bookingId, fornecendo descrição, anexos e valor estimado. O status inicial é PENDING.
Consulta de Solicitações: Clientes podem listar suas próprias solicitações. Administradores podem consultar qualquer solicitação.
Atualização de Status: Administradores podem atualizar o status da solicitação (PENDING, UNDER_REVIEW, APPROVED, REJECTED, SETTLED), adicionar notas de resolução e um valor resolvido.
Regras de Negócio:
Apenas clientes podem submeter solicitações para seus próprios agendamentos.
Apenas administradores podem atualizar o status das solicitações.
Notificações são enviadas ao cliente sobre atualizações de status.
Integrações: PrismaService, NotificationsService.
Endpoints:
POST /guarantee/claims (CLIENT): Submete uma nova solicitação de garantia.
GET /guarantee/claims/me (CLIENT): Lista as solicitações de garantia do usuário logado.
GET /guarantee/claims/:id (CLIENT/ADMIN): Obtém detalhes de uma solicitação de garantia.
PATCH /guarantee/claims/:id/status (ADMIN): Atualiza o status de uma solicitação de garantia.
33. Módulo Subscriptions (Assinaturas e Agendamentos Recorrentes)
Objetivo: Gerenciar assinaturas de serviços, permitindo a criação e automação de agendamentos recorrentes.
Arquitetura:

subscriptions.controller.ts: Expõe endpoints REST para criar, consultar e atualizar assinaturas.
subscriptions.service.ts: Contém a lógica de negócio para o gerenciamento de assinaturas, incluindo a geração de agendamentos recorrentes.
DTOs: create-subscription.dto.ts, update-subscription.dto.ts.
subscription.entity.ts: Representa a entidade Subscription e seus enums (SubscriptionFrequency, SubscriptionStatus).
Fluxos de Negócio:
Criação de Assinatura: Cliente cria uma assinatura para um providerId e providerServiceId com uma frequency e startDate. O sistema gera o primeiro agendamento imediatamente e agenda os próximos.
Geração de Agendamentos Recorrentes: Um job em fila (QueuesService) é agendado para gerar automaticamente novos agendamentos com base na frequência da assinatura.
Gerenciamento de Assinaturas: Clientes podem listar e consultar suas assinaturas. Podem pausar, cancelar ou reativar assinaturas.
Regras de Negócio:
Apenas clientes podem criar assinaturas para si mesmos.
Assinaturas podem ser ACTIVE, PAUSED, CANCELED ou COMPLETED.
A geração de agendamentos é baseada na nextGenerationDate e frequency.
O cancelamento/pausa de assinaturas pode cancelar jobs futuros e agendamentos pendentes.
Integrações: PrismaService, BookingsModule (para criar agendamentos), PaymentsModule (para configurar pagamentos recorrentes), QueuesModule (para agendamento de jobs de geração).
Endpoints:
POST /subscriptions (CLIENT): Cria uma nova assinatura.
GET /subscriptions/me (CLIENT): Obtém as assinaturas do usuário logado.
GET /subscriptions/:id (CLIENT/ADMIN): Obtém detalhes de uma assinatura.
PATCH /subscriptions/:id (CLIENT/ADMIN): Atualiza uma assinatura (status, frequência, etc.).
34. Módulo Locks (Controle de Concorrência Distribuído) - NOVO
Objetivo: Fornecer um mecanismo de lock distribuído baseado em Redis para garantir a atomicidade e evitar race conditions em operações críticas em um ambiente de múltiplos nós.
Arquitetura:

locks.module.ts: Configura e exporta o RedisLockService.
redis-lock.service.ts: Implementa a lógica para adquirir e liberar locks no Redis.
Fluxos de Negócio:
Aquisição de Lock: Antes de uma operação crítica (ex: criação de agendamento), o serviço tenta adquirir um lock com uma chave única e um tempo de expiração.
Liberação de Lock: Após a conclusão da operação (sucesso ou falha), o lock é liberado.
Tratamento de Concorrência: Se um lock não puder ser adquirido, indica que outra instância está processando a mesma operação, permitindo que a aplicação lide com isso (ex: lançar uma exceção de conflito).
Regras de Negócio:
Locks devem ter um tempo de vida (TTL) para evitar bloqueios permanentes.
A liberação do lock deve ser garantida (via try...finally).
Chaves de lock devem ser únicas para a operação que protegem.
Integrações: BookingsModule (para criação de agendamentos), e qualquer outro módulo que precise de controle de concorrência em operações de escrita.
Endpoints: Não expõe endpoints REST diretamente, é um módulo de infraestrutura interna.
35. Módulo Metrics (Métricas de Cliente) - NOVO
Objetivo: Calcular e expor métricas de performance e uso para clientes, fornecendo insights sobre seu comportamento na plataforma.
Arquitetura:

metrics.controller.ts: Expõe endpoints para consultar métricas de cliente.
metrics.service.ts: Contém a lógica para calcular as métricas, agregando dados de outros módulos.
bookings.metrics.repo.ts, payments.metrics.repo.ts, reviews.metrics.repo.ts: Repositórios auxiliares para consultas específicas de métricas.
customer-metrics.query.dto.ts, customer-metrics.summary.dto.ts, customer-metrics.timeseries.dto.ts, customer-metrics.funnel.dto.ts: DTOs para requisição e resposta de métricas.
Fluxos de Negócio:
Resumo do Cliente: Retorna um resumo do comportamento do cliente, incluindo total_bookings, completed_bookings, canceled_bookings, avg_rating, total_spent_centavos.
Séries Temporais: Fornece dados de métricas (ex: bookings, spent) agregados por granularidade (daily, weekly, monthly) ao longo do tempo.
Funil de Conversão: Simula ou calcula etapas do funil de usuário (busca, visualização, checkout, pagamento, conclusão de serviço).
Regras de Negócio:
Apenas o próprio cliente (CLIENT) ou um administrador (ADMIN) pode acessar as métricas de um usuário.
LGPD: Acesso aos dados é controlado pela PrivacyPolicy.
Integrações: PrismaModule, BookingsModule, PaymentsModule, ReviewsModule, PrivacyPolicy (para conformidade LGPD).
Endpoints:
GET /metrics/customer/summary (CLIENT/ADMIN): Obtém um resumo das métricas do cliente.
GET /metrics/customer/timeseries (CLIENT/ADMIN): Obtém métricas do cliente em formato de série temporal.
GET /metrics/customer/funnel (CLIENT/ADMIN): Obtém dados do funil de conversão do cliente.
36. Módulo Support (Suporte ao Cliente) - NOVO
Objetivo: Gerenciar o sistema de tickets de suporte, permitindo que usuários abram solicitações, se comuniquem com agentes e acompanhem o status, com regras de SLA e escalonamento.
Arquitetura:

support.controller.ts: Expõe endpoints REST para criar, consultar e interagir com tickets de suporte.
support.service.ts: Contém a lógica de negócio para gerenciamento de tickets, mensagens, atribuição e regras de SLA. Implementa o fluxo básico de tickets de suporte (`createSupportTicket`, `addSupportMessage`, `updateSupportTicketStatus`).
escalations.job.ts: Processador de fila para verificar e escalar tickets de suporte que excedem o SLA.
Modelos (Prisma): SupportTicket, SupportMessage, SupportSlaLog.
Enums (Prisma): SupportTicketStatus, SupportTicketCategory.
DTOs: create-support-ticket.dto.ts, add-support-message.dto.ts, update-support-ticket.dto.ts, support-ticket-details.dto.ts.
Fluxos de Negócio:
Abertura de Ticket: Usuários (CLIENT, PROVIDER) podem abrir tickets de suporte, classificando-os por categoria (PAYMENT, QUALITY, APP, OTHER) e fornecendo uma descrição. O ticket é criado com status OPEN.
Comunicação: Usuários e agentes (SUPPORT_AGENT, ADMIN) podem enviar mensagens e anexos para o ticket.
Atribuição: Tickets podem ser atribuídos a agentes de suporte.
Gerenciamento de Status: O status do ticket pode ser atualizado (OPEN, IN_PROGRESS, WAITING_USER, RESOLVED, CLOSED, ESCALATED).
SLA e Escalonamento: Regras de SLA são monitoradas por jobs em fila. Se um ticket exceder o tempo limite, ele pode ser automaticamente escalado, gerando notificações.
Auditoria: SupportSlaLog registra transições de status para auditoria de SLA.
Regras de Negócio:
UserRole.SUPPORT_AGENT é um novo papel para agentes de suporte.
Tickets podem ser vinculados a um Booking específico.
Apenas usuários envolvidos ou agentes/admins podem acessar um ticket.
Regras de SLA configuráveis por categoria e prioridade.
Integrações: PrismaModule, UsersModule, BookingsModule, NotificationsModule, QueuesModule (para escalonamento).
Endpoints:
POST /support/tickets (CLIENT/PROVIDER): Cria um novo ticket de suporte.
GET /support/tickets/me (CLIENT/PROVIDER): Lista os tickets do usuário logado.
GET /support/tickets/:id (CLIENT/PROVIDER/SUPPORT_AGENT/ADMIN): Obtém detalhes de um ticket.
POST /support/tickets/:id/messages (CLIENT/PROVIDER/SUPPORT_AGENT/ADMIN): Adiciona uma mensagem ao ticket.
PATCH /support/tickets/:id/status (SUPPORT_AGENT/ADMIN): Atualiza o status de um ticket.
PATCH /support/tickets/:id/assign (ADMIN): Atribui um ticket a um agente.
GET /support/tickets (SUPPORT_AGENT/ADMIN): Lista todos os tickets (para painel de suporte).
III. Funções Globais e Utilitários Comuns
Esta seção detalha os serviços e componentes que são compartilhados e utilizados por múltiplos módulos da aplicação.

A. Serviços Comuns (src/common/services)
EmailService (src/common/services/email.service.ts):
Objetivo: Enviar e-mails transacionais e de notificação.
Funcionalidades: Abstrai o envio de e-mails, com suporte a provedores como SMTP (via Nodemailer) e SendGrid. Inclui um modo de simulação se nenhum provedor real for configurado, útil para desenvolvimento e testes.
Integrações: ConfigService para obter credenciais (EMAIL_SERVICE_PROVIDER, SENDGRID_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, DEFAULT_EMAIL_FROM).

SmsService (src/sms/sms.service.ts):
Objetivo: Enviar mensagens SMS e gerenciar verificações de telefone (OTP).
Funcionalidades: Integra-se com o Twilio para envio de SMS tradicional, alertas de pânico e verificação de telefone (OTP) via startVerification e checkVerification.
Integrações: ConfigService para obter credenciais (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_VERIFY_SERVICE_SID).

GeocodingService (src/geocoding/geocoding.service.ts):
Objetivo: Converter endereços textuais em coordenadas geográficas (latitude e longitude) e vice-versa.
Funcionalidades: Integra-se com APIs de geocodificação como Google Maps. Oferece geocodeAddress para converter endereços em coordenadas e getZoneByCoordinates para determinar uma área geográfica.
Integrações: ConfigService para obter chaves de API (GOOGLE_MAPS_API_KEY).
DTOs: geocode-response.dto.ts (para o retorno de coordenadas).

DocumentProcessingService (src/verification/document-processing.service.ts):
Objetivo: Gerenciar o upload e o processamento de documentos e imagens, especialmente para fluxos de verificação.
Funcionalidades: Lida com upload de imagens para Google Cloud Storage (GCS) ou armazenamento local (para desenvolvimento/testes). Integra-se com Google Cloud Vision API para processDocumentOcr (extração de texto), compareFaces (comparação facial) e performLivenessCheck (prova de vida).
Integrações: ConfigService (STORAGE_TYPE, GCS_PROJECT_ID, GCS_BUCKET_NAME).
Nota: local-storage.service.ts (não é um módulo, mas um arquivo de serviço) é uma implementação mock/alternativa para DocumentProcessingService quando o STORAGE_TYPE não é gcs.

B. Utilitários e Helpers (src/common/utils)
Code Generator (src/common/utils/code-generator.ts):
Objetivo: Gerar códigos aleatórios alfanuméricos de um determinado comprimento.
Funcionalidades: Função generateRandomCode(length: number).

C. Pipes (src/common/pipes)
CustomValidationPipe (src/common/pipes/validation.pipe.ts):
Objetivo: Validar DTOs em requisições HTTP.
Funcionalidades: Um pipe global para validação de DTOs utilizando class-validator e class-transformer, formatando erros de validação de forma legível e consistente.

D. Filters (src/common/filters)
HttpExceptionFilter (src/common/filters/http-exception.filter.ts):
Objetivo: Padronizar as respostas de erro para o cliente.
Funcionalidades: Um filtro de exceções global que captura HttpException e formata a resposta de erro para o cliente, incluindo statusCode, timestamp, path e mensagens de erro detalhadas.

E. DTOs Comuns (src/common/dto)
CreateAddressDto (src/common/dto/create-address.dto.ts): DTO para criação de informações de endereço, incluindo CEP, rua, número, complemento, bairro, cidade, estado, latitude e longitude. Usado em registros e agendamentos.
AddressDetailsDto (src/common/dto/address-details.dto.ts): DTO para retorno detalhado de informações de endereço, incluindo o ID.
MessageResponseDto (src/common/dto/message-response.dto.ts): DTO simples para retornar mensagens de sucesso em operações.

F. Enums e Tipos Comuns (src/shared/enums, src/shared/types)
Estes arquivos re-exportam ou definem tipos e enums globais para serem usados em toda a aplicação, promovendo consistência.

UserRole (src/common/constants/roles.enum.ts e re-exportado em src/shared/enums/user-role.enum.ts): Define os papéis de usuário na plataforma (CLIENT, PROVIDER, ADMIN, SYSTEM, SUPPORT_AGENT).
VerificationStatus (src/shared/enums/verification-status.enum.ts): Define os estados do processo de verificação de provedores.
BookingStatus (src/shared/enums/booking-status.enum.ts): Define os estados do ciclo de vida de um agendamento.
PricingType (src/common/enums/pricing-type.enum.ts): Define os tipos de precificação de serviços (FIXED_PRICE, HOURLY, BY_SIZE, CUSTOM_QUOTE).
PaymentIntentStatus (src/shared/enums/payment-intent-status.enum.ts): Define os estados de uma intenção de pagamento.
PixKeyType (src/shared/enums/pix-key-type.enum.ts): Define os tipos de chave PIX.
DisputeReason (src/shared/enums/dispute-reason.enum.ts): Define os motivos de disputa.
DisputeStatus (src/shared/enums/dispute-status.enum.ts): Define os status de disputa.
SupportTicketStatus (src/shared/enums/support-ticket-status.enum.ts): Define os status de tickets de suporte.
SupportTicketCategory (src/shared/enums/support-ticket-category.enum.ts): Define as categorias de tickets de suporte.
SubscriptionStatus (src/shared/enums/subscription-status.enum.ts): Define os status de assinatura.
SubscriptionFrequency (src/shared/enums/subscription-frequency.enum.ts): Define as frequências de assinatura.
IncidentType (src/shared/enums/incident-type.enum.ts): Define os tipos de incidentes.
IncidentStatus (src/shared/enums/incident-status.enum.ts): Define os status de incidentes.
CouponType (src/shared/enums/coupon-type.enum.ts): Define os tipos de cupom.
CouponTarget (src/shared/enums/coupon-target.enum.ts): Define os alvos de cupom. Agora inclui `NEW_CUSTOMER`, `REFERRAL_REFERRED`, `REFERRAL_REFERRER`, `MISSION_REWARD`, `REPEAT_CUSTOMER`.
CouponStatus (src/shared/enums/coupon-status.enum.ts): Define os status de cupom.
ClaimStatus (src/shared/enums/claim-status.enum.ts): Define os status de reivindicação de garantia.
LoyaltyTransactionType (src/shared/enums/loyalty-transaction-type.enum.ts): Define os tipos de transação de fidelidade. Agora inclui `REFERRAL_CONVERSION` e `MISSION_COMPLETED`.
MissionAudience (src/shared/enums/mission-audience.enum.ts): Define o público-alvo da missão.
MissionKind (src/shared/enums/mission-kind.enum.ts): Define o tipo de missão.
RewardType (src/shared/enums/reward-type.enum.ts): Define o tipo de recompensa.
MissionStatus (src/shared/enums/mission-status.enum.ts): Define o status da missão.
OfferTarget (src/shared/enums/offer-target.enum.ts): Define o alvo da oferta. Agora inclui `NEW_CLIENTS`.
OfferStatus (src/shared/enums/offer-status.enum.ts): Define o status da oferta.
UserRoles (src/shared/types/user-roles.type.ts): Um tipo de união para os papéis de usuário.
G. Augmentação do Objeto Request (express-request.d.ts)
Objetivo: Estender a interface Request do Express para incluir propriedades personalizadas adicionadas pelos guards de autenticação (ex: req.user).
Detalhes: O arquivo express-request.d.ts declara um namespace global Express e aumenta a interface Request para incluir a propriedade user do tipo User (do Prisma), garantindo que as informações do usuário autenticado estejam disponíveis de forma tipada em todo o ciclo de vida da requisição.

H. Módulos e Controladores de Entrada (src/app)
AppModule (src/app.module.ts):
Objetivo: O módulo raiz da aplicação, responsável por importar e configurar todos os outros módulos.
Configurações Globais: Configura ConfigModule (para variáveis de ambiente), ThrottlerModule (para rate limiting), SentryModule (para monitoramento de erros) e PrismaModule (para acesso ao DB) como módulos globais.
Estrutura: Importa e organiza todos os módulos de domínio da aplicação, incluindo LocksModule, MetricsModule, SupportModule, e configura o BullModule para as filas assíncronas, como a fila support-escalations.

AppController (src/app.controller.ts):
Objetivo: O controlador raiz, fornecendo endpoints básicos para verificar o status da aplicação.
Endpoints:

GET /: Retorna uma mensagem de boas-vindas.
GET /health: Retorna um status ok, útil para verificações de saúde de infraestrutura.
AppService (src/app.service.ts):
Objetivo: O serviço raiz, contendo a lógica de negócio básica para o AppController.
Funcionalidades: Retorna a mensagem de boas-vindas.


[07:32:23] Starting compilation in watch mode...

[07:34:32] Found 0 errors. Watching for file changes.

[Nest] 1048  - 28/08/2025, 07:40:02     LOG [NestFactory] Starting Nest application...
[Nest] 1048  - 28/08/2025, 07:40:02     LOG [I18nService] Traduções carregadas: en-US (C:\Users\Paulo\desktop\relax-app\backend-cleaning\dist\common\i18n\locales\en-US.json)
[Nest] 1048  - 28/08/2025, 07:40:02     LOG [I18nService] Traduções carregadas: pt-BR (C:\Users\Paulo\desktop\relax-app\backend-cleaning\dist\common\i18n\locales\pt-BR.json)
[Nest] 1048  - 28/08/2025, 07:40:02     LOG [InstanceLoader] SentryModule dependencies initialized +30ms
[Nest] 1048  - 28/08/2025, 07:40:02     LOG [InstanceLoader] PrismaModule dependencies initialized +292ms
[Nest] 1048  - 28/08/2025, 07:40:02     LOG [InstanceLoader] PassportModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:02     LOG [InstanceLoader] BullModule dependencies initialized +1ms    
[Nest] 1048  - 28/08/2025, 07:40:02     LOG [InstanceLoader] I18nModule dependencies initialized +0ms    
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ConfigHostModule dependencies initialized +491ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] HttpModule dependencies initialized +1ms     
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] DiscoveryModule dependencies initialized +4ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] AppModule dependencies initialized +1ms      
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ConfigModule dependencies initialized +5ms   
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ConfigModule dependencies initialized +2ms   
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [GeocodingService] Provedor de geocodificação configurado: GOOGLE_MAPS
[Nest] 1048  - 28/08/2025, 07:40:03    WARN [EmailService] MAILGUN_API_KEY não configurada. O envio de e-mails pode não funcionar.
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [SmsService] [SmsService] Lendo configurações do Twilio:
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [SmsService] [SmsService]   Account SID: Configurado
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [SmsService] [SmsService]   Auth Token: Configurado
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [SmsService] [SmsService]   Verify Service SID: Configurado
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [SmsService] [SmsService] Twilio client inicializado com sucesso.
[Nest] 1048  - 28/08/2025, 07:40:03    WARN [DocumentProcessingService] Modo de armazenamento local ativado. Clientes GCS não foram inicializados.
[Nest] 1048  - 28/08/2025, 07:40:03    WARN [DocumentProcessingService] Modo de armazenamento local ativado. Clientes GCS não foram inicializados.
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] BullModule dependencies initialized +2ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] BullModule dependencies initialized +4ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] EmailModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] GeocodingModule dependencies initialized +0ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] GeocodingModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] EmailModule dependencies initialized +0ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] SmsModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] LocksModule dependencies initialized +0ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] DocumentProcessingModule dependencies initialized +0ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] RedisLockModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] JwtModule dependencies initialized +5ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ThrottlerModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] CacheModule dependencies initialized +17ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] CacheModule dependencies initialized +44ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] OffersModule dependencies initialized +4ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] CouponsModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] FaqsModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] BullModule dependencies initialized +0ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] BullModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] NotificationsModule dependencies initialized +0ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] MetricsModule dependencies initialized +3ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] LoyaltyModule dependencies initialized +2ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] GuaranteeModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] DisputeModule dependencies initialized +0ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] AvailabilityModule dependencies initialized +2ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] MissionsModule dependencies initialized +5ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ReferralsModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] QueuesModule dependencies initialized +2ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] PricingModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ChatModule dependencies initialized +3ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] SearchModule dependencies initialized +5ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ServicesModule dependencies initialized +4ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ProvidersModule dependencies initialized +12ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] RankingModule dependencies initialized +8ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] EarningsModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] VerificationModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ReviewsModule dependencies initialized +2ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] SupportModule dependencies initialized +3ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ProviderServicesModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] SafetyModule dependencies initialized +0ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] UsersModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] DashboardModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] AuthModule dependencies initialized +1ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] ClientsModule dependencies initialized +0ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] PaymentsModule dependencies initialized +6ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] SubscriptionsModule dependencies initialized +2ms
[Nest] 1048  - 28/08/2025, 07:40:03     LOG [InstanceLoader] BookingsModule dependencies initialized +0ms
NestAppCreation: 1.634s
[Sentry] Inicializado com sucesso.
[Firebase Admin] SDK inicializado automaticamente no ambiente Cloud Run ou GCP.
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [WebSocketsController] ChatGateway subscribed to the "sendMessage" message +866ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [WebSocketsController] ChatGateway subscribed to the "joinChat" message +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] AppController {/}: +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/, GET} route +3ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/health, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] AuthController {/auth}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/auth/register/client, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/auth/register/provider, POST} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/auth/login, POST} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/auth/forgot-password, POST} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] UsersController {/users}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/users/me, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/users/me, PATCH} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/users/:id, GET} route +7ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/users/:id, DELETE} route +8ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/users/data-export, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/users/delete-account, DELETE} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] NotificationsController {/notifications}: +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/notifications, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/notifications/me, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/notifications/me/mark-as-read, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/notifications/:id/mark-as-read, PATCH} route +5ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/notifications/:id, DELETE} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/notifications/suggestions, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/notifications/quick-action/:action, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] ProvidersController {/providers}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/recommended, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/nearby, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/me, GET} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/me, PATCH} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/me/avatar, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/:id, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/:id, DELETE} route +8ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] VerificationController {/verification}: +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/verification/pending-queue, GET} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/verification/upload-document/:type, POST} route +3ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/verification/upload-selfie, POST} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/verification/upload-avatar, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/verification/advance-status, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/verification/:providerId/status, PATCH} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/verification/reject/:providerId, POST} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/verification/status/:providerId, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] SubscriptionsController {/subscriptions}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/subscriptions, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/subscriptions/me, GET} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/subscriptions/:id, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/subscriptions/:id, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] BookingsController {/bookings}: +3ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/bookings, POST} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/bookings/schedule-and-pay, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/bookings/me, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/bookings/:id, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/bookings/:id/status, PATCH} route +5ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/bookings/:id/cancel, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/bookings/:id/report-issue, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/bookings/:id/dispute, POST} route +5ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/bookings/:id/resolve-dispute, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] ClientsController {/clients}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/clients/me/dashboard, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/clients/me, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/clients/:id, GET} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] ReferralsController {/referrals}: +3ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/referrals, POST} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/referrals/me, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/referrals/me/code, GET} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/referrals/:id, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] LoyaltyController {/loyalty}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/loyalty/me, GET} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/loyalty/me/history, GET} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/loyalty/redeem, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] CouponsController {/coupons}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/coupons/resolve/:code, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/coupons/me, GET} route +6ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] MissionsController {/missions}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/missions/my, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/missions/claim, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] ProviderServicesController {/providers/:providerId/services}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/:providerId/services, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/:providerId/services, GET} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/:providerId/services/:id, PATCH} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/:providerId/services/:id, DELETE} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] ServicesController {/services}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/services, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/services, GET} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/services/:id, GET} route +3ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/services/:id, PATCH} route +3ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/services/:id, DELETE} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] PaymentsController {/payments}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/payments/pix-charge, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/payments/withdrawal, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/payments/webhook/pix, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/payments/webhook/withdrawal, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] DisputeController {/disputes}: +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/disputes, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/disputes/:id, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/disputes, GET} route +4ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/disputes/:id/message, POST} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/disputes/:id/status, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] PricingController {/pricing}: +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/pricing/calculate, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/pricing/rules, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/pricing/rules, GET} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/pricing/rules/:id, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] AvailabilityController {/providers/:providerId/availability}: +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/:providerId/availability, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/:providerId/availability, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/:providerId/availability, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/:providerId/availability/:availabilityId, DELETE} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] ReviewsController {/reviews}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/reviews, POST} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/reviews, GET} route +3ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/reviews/:id, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/reviews/provider/:providerId/breakdown, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/reviews/provider/:providerId/suggestions, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] ChatController {/chat}: +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/chat/find-or-create/provider/:providerId/client/:clientId, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/chat/:chatId/messages, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/chat/:chatId/messages, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/chat/me/conversations, GET} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] OffersController {/offers}: +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/offers, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/offers, GET} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/offers/:id, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/offers/:id, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/offers/:id, DELETE} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] SearchController {/search}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/search, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] DashboardController {/providers/me/dashboard}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/me/dashboard, GET} route +5ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] EarningsController {/providers/me/earnings}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/me/earnings, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/providers/me/earnings/withdrawal, POST} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] FaqsController {/faqs}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/faqs, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/faqs, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/faqs/:id, GET} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/faqs/:id, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/faqs/:id, DELETE} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] SafetyController {/safety}: +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/safety/panic, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/safety/incident, POST} route +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/safety/me/incidents, GET} route +4ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/safety/incident/:id/status, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] GuaranteeController {/guarantee}: +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/guarantee/claims, POST} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/guarantee/claims/me, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/guarantee/claims/:id, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/guarantee/claims/:id/status, PATCH} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] RankingController {/ranking}: +0ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/ranking/providers/local, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/ranking/providers/:providerId/position, GET} route +2ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/v1/metrics/me/summary, GET} route +1ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/v1/metrics/me/timeseries, GET} route +6ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RouterExplorer] Mapped {/v1/metrics/me/funnel, GET} route +5ms
[Nest] 1048  - 28/08/2025, 07:40:04     LOG [RoutesResolver] SupportController {/v1/support}: +3ms
[07:41:23] Starting compilation in watch mode...

[07:41:57] Found 0 errors. Watching for file changes.

[Nest] 10812  - 28/08/2025, 07:42:10     LOG [NestFactory] Starting Nest application...
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [I18nService] Traduções carregadas: en-US (C:\Users\Paulo\desktop\relax-app\backend-cleaning\dist\common\i18n\locales\en-US.json)
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [I18nService] Traduções carregadas: pt-BR (C:\Users\Paulo\desktop\relax-app\backend-cleaning\dist\common\i18n\locales\pt-BR.json)
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] SentryModule dependencies initialized +29ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] PrismaModule dependencies initialized +5ms  
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] PassportModule dependencies initialized +2ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] BullModule dependencies initialized +2ms    
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] I18nModule dependencies initialized +2ms    
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ConfigHostModule dependencies initialized +62ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] HttpModule dependencies initialized +1ms     
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] DiscoveryModule dependencies initialized +3ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] AppModule dependencies initialized +0ms      
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ConfigModule dependencies initialized +3ms   
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ConfigModule dependencies initialized +0ms   
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [GeocodingService] Provedor de geocodificação configurado: GOOGLE_MAPS
[Nest] 10812  - 28/08/2025, 07:42:11    WARN [EmailService] MAILGUN_API_KEY não configurada. O envio de e-mails pode não funcionar.
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [SmsService] [SmsService] Lendo configurações do Twilio:
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [SmsService] [SmsService]   Account SID: Configurado
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [SmsService] [SmsService]   Auth Token: Configurado
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [SmsService] [SmsService]   Verify Service SID: Configurado
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [SmsService] [SmsService] Twilio client inicializado com sucesso.
[Nest] 10812  - 28/08/2025, 07:42:11    WARN [DocumentProcessingService] Modo de armazenamento local ativado. Clientes GCS não foram inicializados.
[Nest] 10812  - 28/08/2025, 07:42:11    WARN [DocumentProcessingService] Modo de armazenamento local ativado. Clientes GCS não foram inicializados.
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] BullModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] BullModule dependencies initialized +4ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] EmailModule dependencies initialized +0ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] GeocodingModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] GeocodingModule dependencies initialized +0ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] EmailModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] SmsModule dependencies initialized +0ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] LocksModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] DocumentProcessingModule dependencies initialized +0ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] RedisLockModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] JwtModule dependencies initialized +3ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ThrottlerModule dependencies initialized +0ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] CacheModule dependencies initialized +7ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] CacheModule dependencies initialized +59ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] OffersModule dependencies initialized +76ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] CouponsModule dependencies initialized +0ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] FaqsModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] BullModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] BullModule dependencies initialized +16ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] NotificationsModule dependencies initialized +4ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] MetricsModule dependencies initialized +3ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] LoyaltyModule dependencies initialized +6ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] GuaranteeModule dependencies initialized +0ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] DisputeModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] AvailabilityModule dependencies initialized +2ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] MissionsModule dependencies initialized +4ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ReferralsModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] QueuesModule dependencies initialized +2ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] PricingModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ChatModule dependencies initialized +5ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] SearchModule dependencies initialized +2ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ServicesModule dependencies initialized +2ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ProvidersModule dependencies initialized +2ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] RankingModule dependencies initialized +2ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] EarningsModule dependencies initialized +2ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] VerificationModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ReviewsModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] SupportModule dependencies initialized +3ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ProviderServicesModule dependencies initialized +3ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] SafetyModule dependencies initialized +4ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] UsersModule dependencies initialized +4ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] DashboardModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] AuthModule dependencies initialized +0ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] ClientsModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] PaymentsModule dependencies initialized +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] SubscriptionsModule dependencies initialized +3ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [InstanceLoader] BookingsModule dependencies initialized +2ms
NestAppCreation: 601.175ms
[Sentry] Inicializado com sucesso.
[Firebase Admin] SDK inicializado automaticamente no ambiente Cloud Run ou GCP.
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [WebSocketsController] ChatGateway subscribed to the "sendMessage" message +434ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [WebSocketsController] ChatGateway subscribed to the "joinChat" message +0ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [RoutesResolver] AppController {/}: +4ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [RouterExplorer] Mapped {/, GET} route +4ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [RouterExplorer] Mapped {/health, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [RoutesResolver] AuthController {/auth}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [RouterExplorer] Mapped {/auth/register/client, POST} route +3ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [RouterExplorer] Mapped {/auth/register/provider, POST} route +3ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [RouterExplorer] Mapped {/auth/login, POST} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:11     LOG [RouterExplorer] Mapped {/auth/forgot-password, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] UsersController {/users}: +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/users/me, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/users/me, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/users/:id, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/users/:id, DELETE} route +4ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/users/data-export, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/users/delete-account, DELETE} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] NotificationsController {/notifications}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/notifications, POST} route +3ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/notifications/me, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/notifications/me/mark-as-read, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/notifications/:id/mark-as-read, PATCH} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/notifications/:id, DELETE} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/notifications/suggestions, GET} route +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/notifications/quick-action/:action, POST} route +7ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] ProvidersController {/providers}: +6ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/recommended, GET} route +4ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/nearby, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers, GET} route +4ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/me, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/me, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/me/avatar, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/:id, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/:id, DELETE} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] VerificationController {/verification}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/verification/pending-queue, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/verification/upload-document/:type, POST} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/verification/upload-selfie, POST} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/verification/upload-avatar, POST} route +4ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/verification/advance-status, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/verification/:providerId/status, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/verification/reject/:providerId, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/verification/status/:providerId, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] SubscriptionsController {/subscriptions}: +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/subscriptions, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/subscriptions/me, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/subscriptions/:id, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/subscriptions/:id, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] BookingsController {/bookings}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/bookings, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/bookings/schedule-and-pay, POST} route +4ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/bookings/me, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/bookings/:id, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/bookings/:id/status, PATCH} route +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/bookings/:id/cancel, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/bookings/:id/report-issue, POST} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/bookings/:id/dispute, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/bookings/:id/resolve-dispute, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] ClientsController {/clients}: +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/clients/me/dashboard, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/clients/me, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/clients/:id, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] ReferralsController {/referrals}: +3ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/referrals, POST} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/referrals/me, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/referrals/me/code, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/referrals/:id, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] LoyaltyController {/loyalty}: +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/loyalty/me, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/loyalty/me/history, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/loyalty/redeem, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] CouponsController {/coupons}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/coupons/resolve/:code, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/coupons/me, GET} route +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] MissionsController {/missions}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/missions/my, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/missions/claim, POST} route +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] ProviderServicesController {/providers/:providerId/services}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/:providerId/services, POST} route +4ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/:providerId/services, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/:providerId/services/:id, PATCH} route +4ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/:providerId/services/:id, DELETE} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] ServicesController {/services}: +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/services, POST} route +3ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/services, GET} route +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/services/:id, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/services/:id, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/services/:id, DELETE} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] PaymentsController {/payments}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/payments/pix-charge, POST} route +4ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/payments/withdrawal, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/payments/webhook/pix, POST} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/payments/webhook/withdrawal, POST} route +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] DisputeController {/disputes}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/disputes, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/disputes/:id, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/disputes, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/disputes/:id/message, POST} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/disputes/:id/status, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] PricingController {/pricing}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/pricing/calculate, POST} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/pricing/rules, POST} route +3ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/pricing/rules, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/pricing/rules/:id, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] AvailabilityController {/providers/:providerId/availability}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/:providerId/availability, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/:providerId/availability, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/:providerId/availability, POST} route +3ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/:providerId/availability/:availabilityId, DELETE} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] ReviewsController {/reviews}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/reviews, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/reviews, GET} route +3ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/reviews/:id, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/reviews/provider/:providerId/breakdown, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/reviews/provider/:providerId/suggestions, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] ChatController {/chat}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/chat/find-or-create/provider/:providerId/client/:clientId, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/chat/:chatId/messages, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/chat/:chatId/messages, GET} route +3ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/chat/me/conversations, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] OffersController {/offers}: +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/offers, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/offers, GET} route +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/offers/:id, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/offers/:id, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/offers/:id, DELETE} route +3ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] SearchController {/search}: +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/search, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] DashboardController {/providers/me/dashboard}: +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/me/dashboard, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] EarningsController {/providers/me/earnings}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/me/earnings, GET} route +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/providers/me/earnings/withdrawal, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] FaqsController {/faqs}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/faqs, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/faqs, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/faqs/:id, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/faqs/:id, PATCH} route +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/faqs/:id, DELETE} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] SafetyController {/safety}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/safety/panic, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/safety/incident, POST} route +4ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/safety/me/incidents, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/safety/incident/:id/status, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] GuaranteeController {/guarantee}: +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/guarantee/claims, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/guarantee/claims/me, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/guarantee/claims/:id, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/guarantee/claims/:id/status, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] RankingController {/ranking}: +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/ranking/providers/local, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/ranking/providers/:providerId/position, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] MetricsController {/v1/metrics}: +0ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/v1/metrics/me/summary, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/v1/metrics/me/timeseries, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/v1/metrics/me/funnel, GET} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RoutesResolver] SupportController {/v1/support}: +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/v1/support/tickets, POST} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/v1/support/tickets, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/v1/support/tickets/:id, GET} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/v1/support/tickets/:id/messages, POST} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/v1/support/tickets/:id/status, PATCH} route +2ms
[Nest] 10812  - 28/08/2025, 07:42:12     LOG [RouterExplorer] Mapped {/v1/support/tickets/:id/assign/:agentId, PATCH} route +1ms
[Nest] 10812  - 28/08/2025, 07:42:13     LOG [NestApplication] Nest application successfully started +1721ms
AppListening: 2.009s


// schema.prisma
// Este arquivo é o ponto de partida para o seu banco de dados.
// Ele define os modelos de dados e como eles se relacionam.
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
  // ADICIONADO: Configuração para binaryTargets para resolver o problema de libssl no Docker
  binaryTargets   = ["native", "debian-openssl-1.1.x", "debian-openssl-3.0.x"]
}

datasource db {
  provider   = "postgresql" // Ou "mysql", "sqlite", etc., dependendo do seu DB
  url        = env("DATABASE_URL")
  // ADICIONADO: Habilitar extensão PostGIS para funcionalidades geoespaciais
  extensions = [postgis]
}

// ---------------------------------
// Enums
// ---------------------------------
// Enum para os diferentes papéis de usuário
enum UserRole {
  CLIENT
  PROVIDER
  ADMIN
  SYSTEM        // ADICIONADO: Papel para operações internas do sistema (ex: webhooks)
  SUPPORT_AGENT // NOVO: Papel para agentes de suporte
}

// NOVO: Enum para o status de verificação do provedor
enum VerificationStatus {
  PENDING_INITIAL_REVIEW
  PENDING_DOCUMENTS_UPLOAD
  PENDING_BACKGROUND_CHECK
  PENDING_MANUAL_REVIEW
  APPROVED
  REJECTED
  BLOCKED
}

// NOVO: Enum para o tipo de precificação do serviço
enum PricingType {
  FIXED_PRICE
  HOURLY
  BY_SIZE
  CUSTOM_QUOTE // Para orçamentos mais complexos (futuro)
}

// Enum para o status do agendamento
enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELED
  PENDING_DISPUTE
  RESCHEDULED
  IN_PROGRESS
  PENDING_PROVIDER_CONFIRMATION
  REJECTED
  NO_SHOW
}

// Enum para o tipo de transação financeira
enum TransactionType {
  PAYMENT
  WITHDRAWAL
  COMMISSION
  REFUND
}

// NOVO: Enum para o status de um Payment Intent (cobrança)
enum PaymentIntentStatus {
  PENDING    // Cobrança criada, aguardando pagamento
  PAID       // Pagamento recebido com sucesso
  EXPIRED    // Cobrança expirada (e.g., QR Code PIX expirou)
  REFUNDED   // Pagamento estornado
  CHARGEBACK // Pagamento contestado
}

// NOVO: Enum para os tipos de chave PIX
enum PixKeyType {
  CPF
  CNPJ
  EMAIL
  PHONE
  RANDOM
}

// NOVO: Enum para o motivo da disputa
enum DisputeReason {
  SERVICE_NOT_PERFORMED
  SERVICE_INCOMPLETE
  QUALITY_ISSUES
  PROVIDER_DID_NOT_SHOW
  CLIENT_DID_NOT_SHOW
  OTHER
}

// NOVO: Enum para o status da disputa
enum DisputeStatus {
  PENDING
  IN_REVIEW
  RESOLVED
  REJECTED
}

// NOVO: Enums para o módulo de suporte
enum SupportTicketStatus {
  OPEN
  IN_PROGRESS
  WAITING_USER
  RESOLVED
  CLOSED
  ESCALATED // Opcional, se você for usar este status
}

enum SupportTicketCategory {
  PAYMENT
  QUALITY
  APP
  OTHER
}

// ABS: NOVOS ENUMS PARA MÓDULOS AVANÇADOS
enum SubscriptionStatus {
  ACTIVE
  PAUSED
  CANCELED
  COMPLETED
}

enum SubscriptionFrequency {
  WEEKLY
  BI_WEEKLY
  MONTHLY
}

enum IncidentType {
  DAMAGE
  MISCONDUCT
  THEFT
  NO_SHOW
  OTHER
}

enum IncidentStatus {
  PENDING_REVIEW
  INVESTIGATING
  RESOLVED
  REJECTED
}

// ATUALIZADO: Enum para o tipo de cupom
enum CouponType {
  PERCENT // RENOMEADO de PERCENTAGE
  FIXED   // RENOMEADO de FIXED_AMOUNT
}

// ATUALIZADO: Enum para o alvo do cupom
enum CouponTarget {
  GENERAL           // <<-- FIXED: Renamed from ALL
  NEW_CLIENTS
  SPECIFIC_SERVICE
  SPECIFIC_PROVIDER
  NEW_CUSTOMER      // ADICIONADO
  REFERRAL_REFERRED // ADICIONADO
  REFERRAL_REFERRER // ADICIONADO
  MISSION_REWARD    // ADICIONADO
  REPEAT_CUSTOMER   // ADICIONADO
}

// NOVO: ENUM CouponStatus
enum CouponStatus {
  ACTIVE
  INACTIVE
  EXPIRED
  USED_UP
}

enum ClaimStatus {
  PENDING
  UNDER_REVIEW
  APPROVED
  REJECTED
  SETTLED
}

// NOVO: Enum para o tipo de transação de fidelidade (Loyalty)
enum LoyaltyTransactionType {
  SERVICE_COMPLETED
  REVIEW_SUBMITTED
  FIRST_REVIEW
  REFERRAL
  REDEEM
  MISSION_COMPLETED
  ADMIN_ADJUSTMENT
  REFERRAL_CONVERSION // ADICIONADO
  PROFILE_COMPLETION  // ADICIONADO
}

// ====== MISSIONS: NOVOS ENUMS (cada valor em uma linha) ======
enum MissionAudience {
  CLIENT
  PROVIDER
  GENERAL // ADICIONADO
}

enum MissionKind {
  COUNT_EVENT
  STREAK_DAYS
  WITHIN_WINDOW
}

enum RewardType {
  COUPON
  POINTS
}

enum MissionStatus {
  ACTIVE
  COMPLETED
  CLAIMED
}
// ====== FIM MISSIONS ENUMS ======

// NOVOS ENUMS PARA OFERTAS
enum OfferTarget {
  GENERAL
  SPECIFIC_SERVICE
  SPECIFIC_PROVIDER
  NEW_CLIENTS
}

enum OfferStatus {
  ACTIVE
  INACTIVE
  EXPIRED
}

// ---------------------------------
// Models
// ---------------------------------
// Modelo de Usuário (base para Cliente e Provedor)
model User {
  id                    String             @id @default(uuid())
  email                 String             @unique
  phone                 String?            @unique
  passwordHash          String?
  role                  UserRole           @default(CLIENT)
  avatarUrl             String?
  firebaseUid           String?            @unique
  fullName              String             @default("Nome Padrão")
  fcmToken              String?            @unique
  isPhoneVerified       Boolean            @default(false)
  isVerified            Boolean            @default(false)
  deletionScheduledAt   DateTime?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  preferredLanguage     String?            // NOVO: Para internacionalização (i18n) - idioma preferencial do usuário
  myReferralCode        String?            @unique // ADICIONADO: Código de indicação próprio do usuário

  client                Client?
  provider              Provider?
  messagesSent          Message[]          @relation("SentMessages")
  messagesReceived      Message[]          @relation("ReceivedMessages")
  notifications         Notification[]
  chatsAsParticipant1   Chat[]             @relation("ChatParticipant1")
  chatsAsParticipant2   Chat[]             @relation("ChatParticipant2")
  referredBy            Referral[]         @relation("ReferredByUser")
  referralsMade         Referral[]         @relation("ReferrerOfUser")
  disputesReported      Dispute[]          @relation("DisputeReporter")
  reportedIncidents     Incident[]         @relation("ReportedIncidents")
  panicAlerts           PanicAlert[]       @relation("PanicAlerts")
  userConsents          UserConsent[]
  disputeMessagesSent   DisputeMessage[]   @relation("DisputeSender")
  loyalty               Loyalty?
  loyaltyTransactions   LoyaltyTransaction[]
  couponUsages          CouponUsage[]
  issuedCoupons         Coupon[]           @relation("IssuedCoupons") // ADICIONADO

  // ====== MISSIONS: relações de conveniência ======
  missionProgress       MissionProgress[]
  missionEvents         MissionEvent[]
  // ====== FIM MISSIONS ======

  // NOVO: Relações para o módulo de suporte
  supportTickets        SupportTicket[]    // Tickets abertos pelo usuário
  supportMessages       SupportMessage[]   // Mensagens enviadas pelo usuário
  assignedTickets       SupportTicket[]    @relation("AssignedTickets") // Tickets atribuídos a este usuário (se for agente/admin)
}

// Modelo para Cliente
model Client {
  id                      String           @id @default(uuid())
  userId                  String           @unique
  user                    User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName                String
  completedBookingsCount  Int              @default(0)
  phone                   String?
  cpf                     String?          @unique
  dateOfBirth             DateTime?
  address                 Address?         @relation("ClientAddress")
  bookings                Booking[]
  reviewsMade             Review[]         @relation("ClientReviews")
  noShowCount             Int              @default(0)
  cancellationCount       Int              @default(0)
  subscriptions           Subscription[]
  guaranteeClaims         GuaranteeClaim[]
  createdAt               DateTime         @default(now())
  updatedAt               DateTime         @updatedAt
}

// Modelo para Provedor
model Provider {
  id                         String             @id @default(uuid())
  userId                     String             @unique
  user                       User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName                   String
  cpf                        String?            @unique
  dateOfBirth                DateTime
  phone                      String?
  address                    Address?           @relation("ProviderAddress")
  yearsOfExperience          Int?
  avatarUrl                  String?
  bio                        String?
  providerServices           ProviderService[]
  fiveStarReviewCount        Int                @default(0)
  monthlyBookingsCount       Int                @default(0)
  availability               Availability[]
  bookings                   Booking[]
  reviewsReceived            Review[]           @relation("ProviderReviews")
  earnings                   Transaction[]
  verificationStatus         VerificationStatus @default(PENDING_INITIAL_REVIEW)
  documentPhotoFrontUrl      String?
  documentPhotoBackUrl       String?
  selfieWithDocumentUrl      String?
  backgroundCheckResult      Json?
  ocrResult                  Json?
  livenessResult             Json?
  rejectionReason            String?
  pixKey                     String?            // Mantido, embora o PIX de saque seja na transação, pode ser um PIX padrão do provedor
  badges                     String[]           @default([])
  subscriptions              Subscription[]
  guaranteeClaims            GuaranteeClaim[]
  createdAt                  DateTime           @default(now())
  updatedAt                  DateTime           @updatedAt
  // NOVOS CAMPOS ADICIONADOS PARA MÉTRICAS DE PERFORMANCE
  acceptanceRate             Float              @default(0)
  averageResponseTime        Int                @default(0) // Em minutos
}

// Modelo de Endereço
model Address {
  id         String    @id @default(uuid())
  cep        String
  street     String
  number     String
  complement String?
  neighborhood String
  city       String
  state      String
  clientId   String?   @unique
  providerId String?   @unique
  client     Client?   @relation("ClientAddress", fields: [clientId], references: [id])
  provider   Provider? @relation("ProviderAddress", fields: [providerId], references: [id])
  booking    Booking?  @relation("BookingAddress")
  // --- ADIÇÃO PARA GEOESPACIAL (AGORA INTEGRADO) ---
  location   Unsupported("geometry(Point, 4326)")?
  latitude   Decimal?  @db.Decimal(10, 8)
  longitude  Decimal?  @db.Decimal(11, 8)
  // FIM ABS
}

// Modelo para Tipos de Serviço
model Service {
  id                  String            @id @default(uuid())
  name                String            @unique
  description         String?
  price               Decimal           @db.Decimal(10, 2)
  defaultPricingType  PricingType?
  icon                String?
  providerServices    ProviderService[]
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
}

// Modelo para Serviços Oferecidos por um Provedor Específico
model ProviderService {
  id                    String         @id @default(uuid())
  providerId            String
  serviceId             String
  price                 Decimal        @db.Decimal(10, 2)
  durationMinutes       Int?
  description           String?
  provider              Provider       @relation(fields: [providerId], references: [id], onDelete: Cascade)
  pricingType           PricingType    @default(FIXED_PRICE)
  pricePerSquareMeter   Decimal?       @db.Decimal(10, 2)
  pricePerRoom          Decimal?       @db.Decimal(10, 2)
  service               Service        @relation(fields: [serviceId], references: [id])
  bookings              Booking[]
  createdAt             DateTime       @default(now())
  updatedAt             DateTime       @updatedAt
  subscriptions         Subscription[] @relation("ProviderServiceSubscriptions")

  @@unique([providerId, serviceId])
}

// Modelo de Agendamento
model Booking {
  id                        String        @id @default(uuid())
  clientId                  String
  providerId                String
  providerServiceId         String
  client                    Client        @relation(fields: [clientId], references: [id], onDelete: Restrict)
  provider                  Provider      @relation(fields: [providerId], references: [id], onDelete: Restrict)
  providerService           ProviderService @relation(fields: [providerServiceId], references: [id])
  scheduledDate             DateTime
  scheduledTime             String
  status                    BookingStatus @default(PENDING)
  totalPrice                Decimal       @db.Decimal(10, 2)
  notes                     String?
  createdAt                 DateTime      @default(now())
  updatedAt                 DateTime      @updatedAt
  review                    Review?
  transactions              Transaction[]
  addressId                 String?       @unique
  address                   Address?      @relation("BookingAddress", fields: [addressId], references: [id])
  dispute                   Dispute?
  subscriptionId            String?
  subscription              Subscription? @relation("SubscriptionBookings", fields: [subscriptionId], references: [id])
  incidents                 Incident[]
  guaranteeClaims           GuaranteeClaim[]
  couponId                  String?
  coupon                    Coupon?       @relation(fields: [couponId], references: [id])
  couponUsage               CouponUsage?  @relation("BookingCouponUsage")
  discountAmount            Decimal?      @db.Decimal(10, 2) // ADICIONADO
  // NOVO: Relação para o módulo de suporte
  supportTickets            SupportTicket[]
  // REMOVIDO: paymentIntentId String? @unique // Esta chave estrangeira foi movida para PaymentIntent
  paymentIntent             PaymentIntent? // NOVO: Agora é a back-relation. Prisma infere o nome se não for ambíguo.
}

// Modelo de Chat
model Chat {
  id                String    @id @default(uuid())
  participant1Id    String
  participant1      User      @relation("ChatParticipant1", fields: [participant1Id], references: [id])
  participant2Id    String
  participant2      User      @relation("ChatParticipant2", fields: [participant2Id], references: [id])
  messages          Message[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@unique([participant1Id, participant2Id])
}

// Modelo de Mensagem de Chat
model Message {
  id         String   @id @default(uuid())
  chatId     String
  chat       Chat     @relation(fields: [chatId], references: [id])
  senderId   String
  sender     User     @relation("SentMessages", fields: [senderId], references: [id])
  receiverId String
  receiver   User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
  content    String
  timestamp  DateTime @default(now())
  isRead     Boolean  @default(false)
  targetUrl  String?
  createdAt  DateTime @default(now())
}

// Modelo de Notificação
model Notification {
  id           String   @id @default(uuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  type         String
  message      String
  isRead       Boolean  @default(false)
  targetUrl    String?
  createdAt    DateTime @default(now())
  imageUrl     String?
  actionButtons Json?
  title        String? // NEW: Added title to Notification model
}

// Modelo de Avaliação
model Review {
  id         String   @id @default(uuid())
  booking    Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  bookingId  String   @unique
  clientId   String
  providerId String
  rating     Int
  comment    String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  client     Client   @relation("ClientReviews", fields: [clientId], references: [id])
  provider   Provider @relation("ProviderReviews", fields: [providerId], references: [id])

  @@unique([bookingId, clientId, providerId])
}

// Modelo de Oferta/Promoção
model Offer {
  id                 String       @id @default(uuid())
  title              String
  description        String?
  discountPercentage Float?
  fixedDiscountAmount Float?
  validUntil         DateTime
  imageUrl           String?
  target             OfferTarget  // ADICIONADO
  targetId           String?      // ADICIONADO
  status             OfferStatus  // ADICIONADO
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
}

// Modelo de Transação Financeira (geral, pode ser o registro de um pagamento ou saque)
model Transaction {
  id                   String      @id @default(uuid())
  providerId           String
  provider             Provider    @relation(fields: [providerId], references: [id], onDelete: Cascade)
  amount               Decimal     @db.Decimal(10, 2)
  type                 TransactionType
  status               String
  description          String?
  createdAt            DateTime    @default(now())
  bookingId            String?
  booking              Booking?    @relation(fields: [bookingId], references: [id])
  gatewayTransactionId String?     @unique
  qrCodeUrl            String?
  transactionRef       String?
  couponId             String?
  coupon               Coupon?     @relation(fields: [couponId], references: [id])
  // NOVOS CAMPOS PARA SAQUE VIA PIX
  pixKeyType           PixKeyType? // Tipo da chave PIX (CPF, CNPJ, EMAIL, PHONE, RANDOM)
  pixKey               String?     // A chave PIX em si
}

// NOVO: Modelo para Payment Intent (representa uma intenção de pagamento/cobrança)
model PaymentIntent {
  id                 String              @id @default(uuid())
  bookingId          String              @unique // Esta é a chave estrangeira
  booking            Booking             @relation(fields: [bookingId], references: [id]) // Este lado define a relação
  amountCents        Int                 // Valor em centavos para evitar problemas de ponto flutuante
  status             PaymentIntentStatus @default(PENDING)
  gateway            String              // Ex: "PAGSEGURO", "STRIPE", "MERCADOPAGO"
  externalRef        String?             // ID da transação no gateway de pagamento
  idempotencyKey     String?             @unique // Chave para garantir idempotência de requisições
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  expiresAt          DateTime?           // Data de expiração da cobrança (e.g., QR Code PIX)
  qrCodeUrl          String?             // URL do QR Code PIX
  qrCodeText         String?             // Conteúdo do QR Code PIX (copia e cola)
  // Relação com eventos de pagamento (para rastrear webhooks, etc.)
  paymentEvents      PaymentEvent[]
}

// NOVO: Modelo para eventos de pagamento (webhooks, notificações)
model PaymentEvent {
  id              String        @id @default(uuid())
  paymentIntentId String
  paymentIntent   PaymentIntent @relation(fields: [paymentIntentId], references: [id])
  type            String        // Ex: "WEBHOOK_PAID", "WEBHOOK_EXPIRED", "MANUAL_CONFIRMATION"
  payload         Json?         // Conteúdo original do webhook/evento
  createdAt       DateTime      @default(now())
}

// Modelo de Disponibilidade do Provedor
model Availability {
  id          String   @id @default(uuid())
  providerId  String
  provider    Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  dayOfWeek   Int
  startTime   String
  endTime     String
  isAvailable Boolean  @default(true)
}

// NOVO: Modelo para Perguntas Frequentes (FAQs)
model FAQItem {
  id        String   @id @default(uuid())
  question  String   @unique
  answer    String
  category  String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// NOVO: Modelo para Indicação (Referral)
model Referral {
  id             String   @id @default(uuid())
  referredUserId String   @unique
  referredUser   User     @relation("ReferredByUser", fields: [referredUserId], references: [id])
  referrerUserId String
  referrerUser   User     @relation("ReferrerOfUser", fields: [referrerUserId], references: [id])
  referralCode   String?  // Este é o código que foi usado para a indicação
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([referredUserId, referrerUserId])
}

// NOVO: Modelo para Disputa de Agendamento
model Dispute {
  id                 String         @id @default(uuid())
  bookingId          String         @unique
  booking            Booking        @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  reporterUserId     String
  reporterUser       User           @relation("DisputeReporter", fields: [reporterUserId], references: [id])
  reason             DisputeReason
  description        String
  refundAmountProposed Decimal?       @db.Decimal(10, 2)
  attachments        String[]
  status             DisputeStatus  @default(PENDING)
  resolutionNotes    String?
  resolvedByUserId   String?
  resolvedAt         DateTime?
  createdAt          DateTime       @default(now())
  updatedAt          DateTime       @updatedAt
  messages           DisputeMessage[] @relation("DisputeMessages") // Adicione o nome da relação
}

// NOVO: Modelo para Mensagens de Disputa
model DisputeMessage {
  id           String        @id @default(uuid())
  ticketId     String
  ticket       SupportTicket @relation("DisputeMessageTicket", fields: [ticketId], references: [id], onDelete: Cascade) // CORRIGIDO: Adicionado nome da relação
  senderUserId String
  sender       User          @relation("DisputeSender", fields: [senderUserId], references: [id])
  content      String
  createdAt    DateTime      @default(now())
  disputeId    String        // Adicionado para a relação com Dispute
  dispute      Dispute       @relation("DisputeMessages", fields: [disputeId], references: [id]) // Relação com Dispute
}

// NOVO: Modelo para Consentimento do Usuário (LGPD)
model UserConsent {
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  documentType String
  version    String
  consentedAt DateTime @default(now())

  @@id([userId, documentType])
}

// ABS: NOVOS MODELOS PARA MÓDULOS AVANÇADOS

// ABS: Modelo para Assinaturas/Agendamentos Recorrentes
model Subscription {
  id                   String               @id @default(uuid())
  clientId             String
  client               Client               @relation(fields: [clientId], references: [id])
  providerId           String
  provider             Provider             @relation(fields: [providerId], references: [id])
  providerServiceId    String
  providerService      ProviderService      @relation("ProviderServiceSubscriptions", fields: [providerServiceId], references: [id])
  frequency            SubscriptionFrequency
  startDate            DateTime
  endDate              DateTime?
  status               SubscriptionStatus   @default(ACTIVE)
  totalPrice           Decimal              @db.Decimal(10, 2)
  nextGenerationDate   DateTime
  generatedBookings    Booking[]            @relation("SubscriptionBookings")
  createdAt            DateTime             @default(now())
  updatedAt            DateTime             @updatedAt
}

// ABS: Modelo para Relatório de Incidentes
model Incident {
  id          String         @id @default(uuid())
  reporterId  String
  reporter    User           @relation("ReportedIncidents", fields: [reporterId], references: [id])
  bookingId   String?
  booking     Booking?       @relation(fields: [bookingId], references: [id])
  type        IncidentType
  description String
  attachments String[]
  status      IncidentStatus @default(PENDING_REVIEW)
  resolution  String?
  resolvedBy  String?
  resolvedAt  DateTime?
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

// ABS: Modelo para Alertas de Pânico
model PanicAlert {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation("PanicAlerts", fields: [userId], references: [id])
  latitude  Decimal  @db.Decimal(10, 8)
  longitude Decimal  @db.Decimal(11, 8)
  message   String?
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())
}

// ABS: Modelo para Cupons de Desconto (Atualizado)
model Coupon {
  id             String         @id @default(uuid())
  code           String         @unique
  description    String?
  value          Decimal        @db.Decimal(10, 2)
  valueType      CouponType     // ATUALIZADO: Usando enum CouponType
  target         CouponTarget   // ATUALIZADO: Usando enum CouponTarget
  targetId       String?
  maxUses        Int?
  usesCount      Int            @default(0)
  validFrom      DateTime
  validUntil     DateTime
  status         CouponStatus   @default(ACTIVE)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  usages         CouponUsage[]
  bookings       Booking[]
  transactions   Transaction[]
  maxDiscount    Decimal?       @db.Decimal(10, 2) // ADICIONADO
  firstBookingOnly Boolean      @default(false) // ADICIONADO
  issuedToUserId String?        // ADICIONADO: ID do usuário para quem o cupom foi emitido
  issuedToUser   User?          @relation("IssuedCoupons", fields: [issuedToUserId], references: [id]) // ADICIONADO: Relação com o usuário que recebeu o cupom
  issuedBy       String?        // <<-- FIXED: Added issuedBy field
}

// ABS: Modelo para rastrear o uso de cupons (Novo) - ATUALIZADO COM appliedValue
model CouponUsage {
  id          String    @id @default(uuid())
  couponId    String
  coupon      Coupon    @relation(fields: [couponId], references: [id])
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  bookingId   String    @unique
  booking     Booking   @relation("BookingCouponUsage", fields: [bookingId], references: [id])
  appliedValue Decimal  @db.Decimal(10, 2)
  createdAt   DateTime  @default(now())
}

// ABS: Modelo para Solicitações de Garantia de Serviço
model GuaranteeClaim {
  id             String      @id @default(uuid())
  bookingId      String
  booking        Booking     @relation(fields: [bookingId], references: [id])
  clientId       String
  client         Client      @relation(fields: [clientId], references: [id])
  providerId     String
  provider       Provider    @relation(fields: [providerId], references: [id])
  description    String
  attachments    String[]
  estimatedValue Decimal?    @db.Decimal(10, 2)
  resolvedValue  Decimal?    @db.Decimal(10, 2)
  status         ClaimStatus @default(PENDING)
  resolutionNotes String?
  resolvedAt     DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

// ABS: Modelo para Regras de Precificação Dinâmica
model PricingRule {
  id             String   @id @default(uuid())
  zoneId         String?
  dayOfWeek      Int?
  startTime      String?
  endTime        String?
  demandThreshold Int?
  surgeFactor    Decimal  @db.Decimal(3, 2)
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

// NOVO: Modelo para o saldo de pontos de fidelidade do usuário
model Loyalty {
  id           String   @id @default(uuid())
  userId       String   @unique
  currentPoints Int     @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user         User     @relation(fields: [userId], references: [id])
}

// NOVO: Modelo para o histórico de transações de pontos de fidelidade
model LoyaltyTransaction {
  id          String             @id @default(uuid())
  userId      String
  user        User               @relation(fields: [userId], references: [id])
  points      Int
  type        LoyaltyTransactionType // ATUALIZADO: Usando enum LoyaltyTransactionType
  referenceId String?
  createdAt   DateTime           @default(now())
}

// NOVO: Modelo para as recompensas que podem ser resgatadas com pontos de fidelidade
model Reward {
  id          String   @id @default(uuid())
  name        String   @unique
  description String?
  costPoints  Int
  value       Decimal  @db.Decimal(10, 2)
  type        String   // Pode ser 'COUPON', 'CASHBACK', etc.
  couponCode  String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ====== MISSIONS: NOVOS MODELOS ======
model Mission {
  id              String         @id @default(uuid())
  code            String         @unique // ex: FIRST_SERVICE, THREE_BOOKINGS_MONTH
  title           String
  description     String
  audience        MissionAudience @default(CLIENT) // CLIENT, PROVIDER, GENERAL
  kind            MissionKind    // COUNT_EVENT, STREAK_DAYS, WITHIN_WINDOW
  eventName       String         // booking.completed, review.created, referral.converted, etc.
  targetValue     Int            // ex: 1 (primeiro), 3, 10
  timeWindowDays  Int?           // ex: 30 para "3 no mês" (opcional)
  rewardType      RewardType     // COUPON, POINTS
  rewardValue     Int            // ex: 20 (%), 100 (points)
  couponTemplateId String?       // opcional: template no módulo de coupons
  isActive        Boolean        @default(true)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  progress        MissionProgress[]
}

model MissionProgress {
  id           String        @id @default(uuid())
  userId       String
  missionId    String
  currentValue Int           @default(0)
  status       MissionStatus @default(ACTIVE) // ACTIVE, COMPLETED, CLAIMED
  lastEventAt  DateTime?
  completedAt  DateTime?
  claimedAt    DateTime?

  mission      Mission       @relation(fields: [missionId], references: [id])
  user         User          @relation(fields: [userId], references: [id]) // cliente

  @@unique([userId, missionId])
}

model MissionEvent {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String   // booking.completed, review.created, referral.converted
  meta      Json?
  createdAt DateTime @default(now())
}
// ====== FIM MISSIONS ENUMS ======

// NOVO: Modelos para o módulo de suporte
model SupportTicket {
  id             String              @id @default(uuid())
  userId         String
  user           User                @relation(fields: [userId], references: [id])
  role           UserRole            // Role do usuário que abriu o ticket
  subject        String
  category       SupportTicketCategory
  description    String
  bookingId      String?
  booking        Booking?            @relation(fields: [bookingId], references: [id])
  status         SupportTicketStatus @default(OPEN)
  assignedToId   String?
  assignedTo     User?               @relation("AssignedTickets", fields: [assignedToId], references: [id])
  createdAt      DateTime            @default(now())
  updatedAt      DateTime            @updatedAt
  closedAt       DateTime?

  messages       SupportMessage[]
  slaLogs        SupportSlaLog[]

  // Adicione a relação oposta para DisputeMessage
  disputeMessages DisputeMessage[] @relation("DisputeMessageTicket") // Nome da relação
}

model SupportMessage {
  id        String   @id @default(uuid())
  ticketId  String
  ticket    SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  role      UserRole // Role do usuário que enviou a mensagem (para auditoria)
  body      String
  attachments String[] // URLs para arquivos no GCS
  createdAt DateTime @default(now())
}

model SupportSlaLog {
  id         String              @id @default(uuid())
  ticketId   String
  ticket     SupportTicket       @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  fromStatus SupportTicketStatus
  toStatus   SupportTicketStatus
  createdAt  DateTime            @default(now())
}


🚀 Pitch Deck Final – LimpeJá (Versão Otimizada com Projeções)
Slide 1: Capa
Logo LimpeJá
Tagline: O app de diaristas mais prático e confiável do Brasil.

Slide 2: O Problema
Encontrar profissionais de limpeza confiáveis é um desafio persistente.

Para Clientes: Dificuldade em encontrar diaristas verificadas, insegurança com pagamentos informais, cancelamentos inesperados e falta de padronização.
Para Diaristas: Enfrentam a informalidade, falta de clientes, altas taxas em plataformas generalistas e incerteza no recebimento de pagamentos.
Plataformas Atuais: (Ex: GetNinjas) Não oferecem verificação robusta, cobram taxas elevadas dos prestadores e possuem processos de pagamento lentos, gerando desmotivação e uma experiência genérica.
Slide 3: A Solução – O que é o LimpeJá
LimpeJá é um marketplace mobile-first que conecta clientes a diaristas de forma rápida, segura e empoderadora.

Inspiração:
Airbnb: Camada de confiança robusta e sistema de reputação mútua.
Uber: Praticidade, agilidade e UX intuitiva para agendamento e serviço.
iFood: Mecanismos de atração e retenção de usuários (cupons, promoções).
Slide 4: Proposta de Valor
LimpeJá: Confiança e Praticidade para Clientes, Autonomia e Renda para Profissionais.
a
Para Clientes:
Agendamento fácil e rápido via app.
Pagamento seguro via PIX.
Profissionais verificados, avaliados e com histórico transparente.
UX limpa e intuitiva, sem fricção.
Para Diaristas:
0% de taxas de participação: Barreira de entrada zero.
Autonomia total: Definem preço, tipo de serviço e agenda.
Recebimento em até 24h via PIX: Elimina a dor da incerteza no pagamento.
Dashboard financeiro completo para gestão de ganhos.
Slide 5: Diferenciais Competitivos
LimpeJá: Construindo Confiança e Empoderamento onde os Concorrentes Falham.

✅ Verificação Robusta: OCR, selfie, antecedentes criminais – criando uma camada de confiança real, diferente dos generalistas.
✅ Repasse Instantâneo (PIX): Dinheiro na conta da diarista em até 24h, resolvendo a maior dor do setor informal.
✅ Custo Zero para Prestador: Perfil ativo sem taxas de entrada, atraindo um volume massivo de profissionais.
✅ Avaliação Mútua: Clientes e prestadores se avaliam, construindo um ecossistema de confiança e reputação.
✅ Precificação Dinâmica: Flexibilidade para definir preço por hora, cômodo, metragem ou valor fixo.
✅ Chat em Tempo Real: Comunicação direta e eficiente entre cliente e prestador no app.
✅ Experiência Premium: Design e UX de nível scale-up, transmitindo seriedade e segurança.
Slide 6: O Mercado
Um Oceano Azul de Oportunidades no Brasil.

Tamanho do Mercado: Limpeza residencial no Brasil movimenta R$ 40 bilhões/ano.
Digitalização Incipiente: Apenas 15% das diaristas estão digitalizadas, deixando um mercado vasto e inexplorado.
Mercado Piloto (Campinas-SP): Mais de 50 mil diaristas potenciais e uma crescente classe média com demanda por serviços de qualidade.
Slide 7: Modelo de Negócio
Monetização Transparente e Escalável.

Monetização: Comissão de 15% por serviço concluído, cobrada do cliente.
Ticket Médio Atualizado: R$ 300 por serviço.
Receita Unitária (Comissão): R$ 300 * 0,15 = R$ 45 por serviço.
Escalabilidade: Modelo replicável cidade a cidade, com alto potencial de crescimento.
Slide 8: Projeções Financeiras e Escala Nacional
Um Caminho Claro para a Liderança de Mercado e Milhões em MRR.

Projeções Iniciais (MRR):
Etapa	Serviços/Mês	Ticket Médio (R$)	Receita Bruta (R$)	Comissão (15%) - MRR (R$)
MVP Campinas	1.000	300	300.000	45.000
Pós-Marketing SP	2.500	300	750.000	112.500
Escala Regional (1 cidade)	5.000	300	1.500.000	225.000
Fase 1: Consolidação em Cidades Chave (Ex: 5 Capitais)

Cenário: LimpeJá replica o sucesso da "Escala Regional" (5.000 serviços/mês) em 5 grandes capitais ou cidades de alto potencial (ex: São Paulo, Rio de Janeiro, Belo Horizonte, Porto Alegre, Curitiba).
Serviços/Mês: 5 cidades * 5.000 serviços/cidade = 25.000 serviços/mês
MRR Projetado: 25.000 serviços * R$ 45/serviço = R$ 1.125.000 (mais de 1 milhão de reais em MRR!)
Impacto: Consolidação da marca, atração de talentos e validação do modelo de expansão.
Fase 2: Expansão para Cidades Médias e Outras Capitais (Ex: 20 Cidades)

Cenário: Com o sucesso nas primeiras 5 cidades, o LimpeJá expande para mais 15 cidades de porte médio ou outras capitais importantes, mantendo uma média de 5.000 serviços/mês por cidade.
Serviços/Mês: 20 cidades * 5.000 serviços/cidade = 100.000 serviços/mês
MRR Projetado: 100.000 serviços * R$ 45/serviço = R$ 4.500.000 (4,5 milhões de reais em MRR!)
Impacto: LimpeJá se torna um player nacional reconhecido, com forte presença em mercados estratégicos.
Fase 3: Liderança Nacional (Ex: 50+ Cidades)

Cenário: O LimpeJá atinge a liderança nacional, presente em 50 ou mais cidades, com volumes de serviço variados, mas mantendo a média de 5.000 serviços/mês por cidade.
Serviços/Mês: 50 cidades * 5.000 serviços/cidade = 250.000 serviços/mês
MRR Projetado: 250.000 serviços * R$ 45/serviço = R$ 11.250.000 (mais de 11 milhões de reais em MRR!)
Impacto: LimpeJá é o player dominante no setor, com uma base sólida de clientes e prestadores em todo o país.
Slide 9: Go-to-Market (Estratégia)
Expansão Inteligente: Hiperlocal para Liderança Nacional.

📍 Pré-Lançamento (Campinas, Ago/2025):

Meta: 20 diaristas ativas.
Canais: Grupos locais (WhatsApp, Facebook), boca a boca, panfletagem.
Incentivos early-bird.
📍 Pós-Lançamento (30 dias iniciais):

Suporte ativo via WhatsApp 24h.
Monitoramento intensivo de métricas de conversão.
Marketing orgânico (SEO local, Google Meu Negócio).
📍 Escala (60-90 dias e além):

Tráfego pago + influenciadores locais.
Expansão cidade a cidade, evitando nacionalização precoce para garantir qualidade e NPS alto.
Slide 10: Impacto Social e Econômico – Transformando Vidas
Além dos números, o LimpeJá gera um impacto profundo na sociedade brasileira.

Geração Massiva de Renda e Empregos:
Na fase de liderança nacional (250.000 serviços/mês), estamos falando de milhares de diaristas empoderadas (ex: 12.500 diaristas realizando 20 serviços/mês).
Transformamos a diarista em uma microempreendedora digital, tirando-a da informalidade precária.
Confiança e Segurança para Milhões:
Nosso "trust layer" robusto elimina as dores de cabeça para clientes e prestadores, construindo um ecossistema de serviço doméstico muito mais seguro e confiável em nível nacional.
Giro Econômico Acelerado:
O pagamento instantâneo via PIX garante que o dinheiro circule rapidamente na economia, beneficiando diretamente as diaristas e suas famílias.
Profissionalização do Setor:
Elevamos o status da diarista, oferecendo ferramentas de gestão, transparência financeira e autonomia, transformando um trabalho muitas vezes desvalorizado em uma carreira digna.
Criação de Empregos Diretos:
A estratégia de expansão cidade a cidade implica na necessidade de equipes locais para suporte, marketing e operação, gerando empregos diretos para o LimpeJá em todo o país.
Slide 11: Equipe
Execução de Ponta a Ponta por um Fundador Visionário.

Founder & CTO: Paulo Silas de Campos.
Desenvolvedor full-stack sênior com expertise em NestJS, React Native, Prisma, PostGIS.
Responsável por toda a arquitetura, desenvolvimento e estratégia de produto.
Experiência end-to-end: análise de mercado → UX design → backend → mobile app → estratégia de crescimento.
Roadmap: Primeiros 3 meses com foco em suporte e marketing. Expansão da equipe após validação do modelo e captação de investimento.
Slide 12: Investimento & Uso de Recursos
Capital para Escala e Aquisição, Não para Dívida Técnica.

Captação Inicial: R$ 250k – R$ 500k
Uso dos Recursos:
40% Marketing: Aquisição de clientes e prestadores.
30% Suporte & Operações: Garantir a qualidade do serviço e satisfação do usuário.
20% Tecnologia: Infraestrutura, escalabilidade e desenvolvimento de novas funcionalidades.
10% Legal & Compliance: Garantir conformidade e segurança jurídica (LGPD).
Slide 13: Visão de Futuro
Transformando o Setor de Limpeza no Brasil.

Ser o player nº 1 no Brasil em contratação de diaristas.
Transformar a diarista em uma microempreendedora digital, oferecendo autonomia, transparência financeira e dignidade.
Trazer segurança e confiança para os clientes, elevando o padrão do serviço doméstico.
Gerar um impacto social e econômico massivo, formalizando o setor e impulsionando a renda de milhares de famílias.
Slide 14: Fechamento
O LimpeJá é mais que um aplicativo; é o futuro do serviço de limpeza no Brasil.

Com um mercado gigantesco, um produto robusto e uma execução de excelência, estamos prontos para escalar.
Chamada para Investidores/Parceiros: Junte-se a nós nesta jornada para construir o maior e mais confiável marketplace de serviços de limpeza do país, com um impacto social e financeiro sem precedentes.
Obrigado!
(19) 99322-3932 / LinkedIn / Website



🚀 Superando as Barreiras – Estratégia LimpeJá
1. Diferenciação clara frente a GetNinjas e Parafuzo

GetNinjas: generalista, cobra caro dos prestadores, UX confusa.

Parafuzo: já validado em SP, mas engessado, pouco inovador em UX.

LimpeJá:

Foco único em diaristas → profundidade no nicho (trust layer, PIX, autonomia).

UI premium e simples → experiência no nível de Uber/iFood.

Modelo justo: 0% taxa para prestadores, comissão só do cliente.

Pagamento em 24h → diarista sente a diferença no bolso imediatamente
.

2. Criação de comunidade forte (como iFood com motoboys)

Empoderamento: diarista deixa de ser informal → vira microempreendedora digital.

Gamificação: badges, selos, ranking, status → gera orgulho e fidelidade
.

Dashboard financeiro: visão de ganhos e metas claras
.

Narrativa social: “LimpeJá é do povão” → contrasta com concorrentes elitistas ou distantes.

3. Retenção de clientes (anti-desintermediação)

Cupons & fidelidade estilo iFood Club:

Cliente fica porque contratar pelo app sai mais barato e seguro do que negociar no boca a boca.

Ex.: cashback em cupons, missões para ganhar descontos.

Seguro e confiança: apenas serviços pelo app têm garantia contra problemas (roubo, dano, não comparecimento).

Reputação mútua: cliente também é avaliado → aumenta confiança de prestadores.

Promoções locais: campanhas “primeira faxina com 20% off” para incentivar novos clientes.

4. Go-to-market inteligente

Validação inicial: MVP em Campinas → SP → replicar city-by-city (hiperlocal)
.

Equipe suporte logo no 1º giro: garante experiência premium e resolve disputas rápido.

Marketing de guerrilha + digital: panfletagem, grupos locais, influenciadores regionais.

Escalabilidade: modelo repetível em outras capitais → crescimento sustentado.

5. Blindagem contra grandes players (Uber/99, etc.)

Moat social: diaristas fidelizadas com ganhos rápidos + status gamificado.

Moat de confiança: OCR, antecedentes, seguro — não é trivial para player global copiar rápido
.

Moat de preço: cupons e comissão transparente → cliente sente valor imediato.

Moat de cultura: narrativa inclusiva e nacional (“feito para diarista brasileira”), algo que multinacionais não capturam facilmente.

🎯 Reputação desejada

“Se quero diarista confiável, pago no app, recebo nota, seguro e ainda desconto. No boca a boca é arriscado e sem garantia.”
→ Esse é o mesmo mindset shift que o iFood provocou: melhor pagar no app do que arriscar por fora.

Com UI premium + giro rápido de dinheiro + cupons/fidelidade + segurança, o LimpeJá cria lock-in natural para clientes e prestadores.

👉 Resultado: se executar nessa linha, vocês têm chance real de virar o iFood das diaristas e deixar GetNinjas/Parafuzo irrelevantes, mesmo eles tendo validado primeiro.

✅ LimpeJá – Implementações que superam fraquezas e ameaças
1. Concorrência consolidada (GetNinjas, Parafuzo)

Foco exclusivo em diaristas → profundidade no nicho.

0% taxa para prestadores (ganho líquido maior).

Validação hiperlocal (Campinas → SP) antes de escalar, como o iFood fez
.

UX/UI premium com experiência inspirada em iFood/Airbnb
.

2. Barreira de marketing (players grandes queimam caixa)

Go-to-market hiperlocal: panfletagem, WhatsApp, influenciadores locais
.

Economia unitária saudável → prestador ganha mais, cliente paga preço justo.

Experiência diferenciada (UI + PIX 24h) que gera boca a boca orgânico.

Plano de formar equipe de suporte/marketing já no 1º giro.

3. Confiabilidade (roubo, dano, fraude)

Trust Layer robusto: OCR de documento, selfie biométrica, antecedentes criminais
.

Avaliações mútuas (cliente ↔ prestador) + histórico transparente
.

Seguro opcional no agendamento para maior tranquilidade do cliente.

Sistema de reputação e métricas (taxa de aceitação, pontualidade, cancelamento) para destacar bons prestadores
.

4. Regulação (LGPD, vínculo trabalhista)

LGPD compliance desenhado desde o início
.

Modelo marketplace puro: prestador define preço, agenda e serviços (evita vínculo trabalhista).

Equipe legal prevista nos custos do projeto para blindagem jurídica
.

5. Entrada de players globais (Uber/99 pivotando)

Moat social: comunidade de diaristas fidelizada por ganhos rápidos + badges.

Moat de confiança: OCR + antecedentes + seguro → barreira regulatória/técnica para players internacionais.

Moat de preço: cupons, descontos e fidelidade (como iFood Club).

Narrativa inclusiva e nacional (“feito para diarista brasileira”) → difícil de copiar por globais.

6. Retenção / Desintermediação

Sistema de cupons & fidelidade → contratar dentro do app é sempre mais barato
.

Pagamentos garantidos em 24h → prestador prefere operar no app
.

Gamificação (selos, níveis, badges) → status e orgulho digital do prestador
.

Seguro e garantias só dentro do app → cliente entende que fechar fora = assumir risco.

Gestão de incidentes e disputas integrada para confiança mútua
.


🔥 LimpeJá – Blueprint de Escala & Ganhos Futuros
🎯 Visão

Ser o Airbnb das diaristas e serviços domésticos no Brasil, começando com limpeza, mas expandindo para pós-obra, Airbnb turnover e contratos B2B leves.

📍 Fases de Escala
Fase 1 – Campinas (MVP validado)

Supply: já temos >40 prestadoras interessadas (orgânico).

Meta: 800–1.000 serviços/mês em 90 dias.

CAC Cliente: ≤R$60.

Repeat: 35% em D30.

Unit: ticket médio R$300 → take R$45/serviço → R$36k–45k MRR (com 800–1.000 serviços).

🔑 Alvo: atingir product-channel fit → se repetir 3× + CAC ≤2 serviços, validamos.

Fase 2 – São Paulo (primeira capital)

Supply: 300–500 prestadoras.

Meta: 5.000 serviços/mês (1 cidade).

Unit: R$45 × 5.000 = R$225k MRR.

Ação: Ads hiperlocal + parcerias com academias/condomínios + planos recorrentes (semanal/quinzenal).

Defensivo: implementar rebook automático + fidelidade/cashback.

🔑 Alvo: CAC payback ≤2 meses e suporte escalável (disputas ≤3%).

Fase 3 – 5–10 Cidades Chave (interior + capitais)

Meta: 25–50k serviços/mês.

Unit: R$45 × 25k–50k = R$1,1M–2,2M MRR.

Produto: adicionar cartão + add-ons (geladeira/forno, pós-obra light) + parcerias Airbnb.

Growth: expandir modelo “B2B leve” (condomínios e coworkings).

🔑 Alvo: NPS ≥60 + repeat 40% → cria barreira cultural contra GetNinjas.

Fase 4 – Nacional (50+ cidades)

Meta: 200k serviços/mês.

Unit: R$45 × 200k = R$9M MRR (~R$108M ARR).

Ops: estrutura de suporte 24/7, seguro e garantias ampliadas, programa de níveis e microcrédito para diaristas.

Monetização adicional: SaaS para prestadores, fintech interna, marketplace de produtos de limpeza (B2B2C).

💰 Fontes de Receita (presentes & futuras)

Take por serviço (core) – 15% do ticket (R$45 médio).

Planos recorrentes premium – desconto para cliente + retenção garantida.

Publicidade local – fornecedores de materiais de limpeza anunciando dentro do app.

Marketplace B2B – venda de insumos e produtos de limpeza (direto para prestadoras).

Fintech/Wallet LimpeJá – antecipação de recebíveis, microcrédito, seguros.

SaaS white-label – agenda e faturamento para prestadoras B2B (condomínios, empresas).

📊 Projeções de Ganhos (3 anos)
Ano	Cidades	Serviços/mês	Receita Bruta (GMV)	Receita LimpeJá (15%)
2025	2–3 (Campinas+SP)	6k–7k	R$1,8–2,1M	R$270k–315k/mês
2026	10+	30k–40k	R$9–12M	R$1,35–1,8M/mês
2027	50+	200k	R$60M	R$9M/mês (R$108M/ano)
🛡️ Moats (defesas contra concorrência)

PIX em 24h → imbatível para supply.

KYC + reputação mútua → trust layer.

Gamificação + cashback → reduz desintermediação.

Plano recorrente automático → retém clientes.

Marca vertical (limpeza = LimpeJá) → foco contra generalistas.

🚀 Próximos 90 dias (ações táticas)

Onboarding seletivo (lista de espera + selo Bronze/Prata/Ouro).

Ads hiperlocal em Campinas (teste CAC).

Rebook automático + cashback.

Parcerias locais (condomínios, academias, imobiliárias).

1º contrato B2B leve (condomínio ou Airbnb host).

🌟 Pitch de visão

“O GetNinjas cobra moedas, o LimpeJá entrega limpeza justa, rápida e sem enrolação. Dinheiro no bolso da diarista em 24h e confiança para o cliente.”

👉 Mano, esse blueprint aqui já dá pra virar um pitch deck de investidor e também um playbook operacional.

Quer que eu monte uma planilha dinâmica (Excel/Google Sheets) com esses números (CAC, repeat, ticket médio) pra você brincar com cenários de Campinas, SP e Nacional?


Relatório de Análise: Potencial de Mercado do Projeto LimpeJá
Com base nos documentos fornecidos e na nossa discussão aprofundada, este relatório detalha a visão estratégica e o potencial do projeto LimpeJá. A análise foca em como o modelo de negócio, focado na frequência e volume de transações, o posiciona para ser um dos projetos mais promissores do mercado em 2025.

1. Visão do Projeto: O “Airbnb da Limpeza”
O LimpeJá é um marketplace que busca resolver um problema real e persistente: a informalidade no mercado de serviços de limpeza. A analogia com o Airbnb é precisa porque o projeto não se limita a conectar pessoas, mas sim a construir uma camada de confiança (trust layer) robusta.

Pontos-Chave da Visão:

Para Clientes: Oferece agendamento prático e a segurança de contratar profissionais verificados.

Para Diaristas: Proporciona autonomia, fluxo de trabalho contínuo, pagamento rápido e a segurança de um sistema formal.

Essa proposta de valor dupla é a base do sucesso de qualquer plataforma de marketplace.

2. Diferenciais Competitivos (Moats)
Os documentos (pitch.md, apresentation.html) detalham defesas estratégicas que protegem o projeto da concorrência e combatem a desintermediação:

PIX em 24h: Um diferencial crucial para atrair e reter prestadores de serviço, que valorizam o recebimento rápido.

KYC (Know Your Customer) e Reputação Mútua: Similar ao Airbnb, a verificação e o sistema de avaliações criam um ciclo de confiança que é difícil de replicar. É o principal fator de fidelização.

Gamificação e Cashback: Incentivos que recompensam a permanência dentro da plataforma, tornando menos atraente a negociação direta fora do app.

Foco e Marca Vertical: O LimpeJá se concentra exclusivamente em limpeza e higienização, permitindo que a marca se torne sinônimo do serviço, ao contrário de plataformas generalistas.

3. Análise de Rentabilidade: Frequência vs. Ticket Médio
Sua observação sobre a velocidade e o volume de transações é o ponto central que define o alto potencial do LimpeJá.

Característica	LimpeJá (Marketplace de Limpeza)	Projeto de Serviço Industrial (B2B)
Ticket Médio	Baixo (R$ 150 - R$ 300)	Alto (R$ 50k+)
Frequência de Compra	Alta (semanal ou quinzenal)	Baixa (anual ou por projeto)
Ciclo de Vendas	Curto (minutos via app)	Longo (meses de negociação)
Escalabilidade	Alta e Rápida (modelo "asset-light")	Lenta e Dependente de Vendas
Principal Métrica	LTV (Valor do Cliente ao Longo do Tempo)	Ticket Médio por Contrato

Exportar para as Planilhas
A rentabilidade do LimpeJá não depende de um único contrato de alto valor, mas sim do volume massivo de transações e da alta frequência com que os clientes retornam. Esse modelo é mais previsível e escalável, pois o custo de aquisição de um cliente é rapidamente recuperado e o lucro é gerado pela recorrência.

4. Conclusão: Um Projeto para o "Oscar" de 2025
O LimpeJá tem todas as características de um projeto com potencial para ser um dos mais rentáveis e impactantes de 2025. Ele resolve um problema de mercado real, possui diferenciais competitivos sólidos e se encaixa em um modelo de negócio de sucesso comprovado (o marketplace de alta frequência).

A execução do plano de expansão e a capacidade de manter a "camada de confiança" em escala nacional serão os principais desafios. No entanto, o plano de crescimento gradual e os mecanismos de defesa já projetados (relatorio.md) indicam que a equipe tem uma visão clara do caminho a seguir.

A aposta no LimpeJá como o projeto mais promissor faz sentido por sua capacidade de gerar impacto social e construir uma base de receita sólida e escalável, sem os riscos e a lentidão associados a modelos de negócio de alto ticket e baixo volume.

Veredito rápido (com percentuais)

Sucesso local (MVP em 1 cidade): 65–80% de chance — UX sólida, fluxo completo (cadastro, KYC/estágios de verificação, busca geo, agendamento, pagamento PIX, chat, cupons/missões, disputas), tudo já mapeado no front/back, o que reduz risco de execução inicial. 
 
 
 

Escala multi-cidade (5–20 cidades): 35–55% — depende de supply ops, suporte e unit economics positivos; a estratégia hiperlocal e os diferenciais (verificação robusta + PIX em 24h + 0% para prestador) aumentam a chance. 
 

Liderança nacional (50+ cidades): 15–25% — viável, mas só com máquina de aquisição/retensão afiada e defesa anti-desintermediação; há caminho projetado, porém execution-heavy. 

Critério de “sucesso” aqui: MRR positivo e crescente, NPS>60, repeat>40% em 60 dias, CAC recuperado em ≤3 meses, e ≥5.000 serviços/mês por cidade âncora. As projeções do pitch apontam a mesma ordem de grandeza (R$45 de take por serviço; 5k serviços = R$225k MRR por cidade). 

Por que o produto tem tração potencial
1) Produto/UX e completude de funil

Você já cobre ponta-a-ponta:

Auth + papéis + roteamento condicional por status de verificação (APPROVED / PENDING_*) via Expo Router + Contexts. 

KYC e onboarding do provedor em etapas, com persistência de estado e atualização posterior do perfil. 

Busca geolocalizada + recomendações + banners/ofertas (explore) — bom para CTR na home. 

Agendamento + pagamento PIX + comprovante/QR + adicionar ao calendário + chat — resolve fricções críticas e diminui no-show. 

Disputas/suporte + notificações + missões/cupons/loyalty — cria “trust layer” e motor de retenção (lock-in). 

Arquitetura RN/Expo com Axios, TS e interceptors JWT — base de código saudável para iterar rápido. 

2) Diferenciais competitivos claros

Verificação robusta + reputação mútua → confiança (dói nos generalistas).

Repasse em até 24h via PIX → “dinheiro rápido” é o maior imã de oferta.

0% de taxa para prestador; comissão do cliente (15%) → narrativa justa.

Gamificação, cupons e fidelidade → antídoto contra desintermediação. 
 
 

3) Mercado e timing

Pitch traz TAM ~R$40bi/ano e baixa digitalização (~15%) — espaço grande para vertical focado em diaristas; estratégia hiperlocal → escala está bem desenhada. 
 

Unit economics (modelo simples para guiar decisões)

Inputs do pitch: ticket médio R$300, take 15% ⇒ R$45/serviço. 

Sugestão de “regra de bolso”:

Meta CAC (cliente): ≤ R$90 (2 serviços para payback).

Meta CAC (prestador): ≤ R$60 (recuperado com 2–3 serviços gerados).

Contribuição por pedido (após custos variáveis):

taxas de pagamento PIX (~baixas), + suporte por pedido (R$3–5), + cupom médio (5–8% bruto) ⇒ contribuição líquida alvo ≥R$30.

LTV cliente = contribuição líquida × nº de serviços por 12 meses. Se repetir 4×/ano, LTV ≈ R$120; se 8×/ano, R$240.

Boa zona: LTV/CAC ≥ 3. Se LTV≈R$180, CAC deve ficar ≤R$60.

North Star: Serviços/mês por provedor ativo (meta inicial 15–25) + % de pedidos recorrentes (D30/D60).
Gatilhos de escala: quando Fill rate ≥85%, Cancelamentos ≤8%, NPS ≥60, Payback ≤3 meses, libera próxima cidade.

Riscos chave e mitigação (prioridade alta)

Desintermediação

Bloquear contato fora do app (telefone mascarado), rebook em 1 toque, garantia/seguro só no pedido in-app, club de fidelidade com cashback e cupons recorrentes. 
 

Equilíbrio supply/demand

Onboarding “calibrado”: listas de espera por região/horário, metas de ocupação; “hot zones” com preço dinâmico e missões para horários ociosos. 

Qualidade e confiança

KYC + métricas públicas (taxa de aceitação, pontualidade, cancelamento); treinamentos e niveis (Bronze/Prata/Ouro). 

Suporte/Disputas (custo por pedido)

Ferramentas de “pre-triagem” (flows, fotos antes/depois), SLA e tabelas de decisão; dispute center no app. 

Regulatório (vínculo/LGPD)

Marketplace puro (preço/agenda pelo prestador), DPA/LGPD e seguro de responsabilidade civil no roadmap. 

Foco em PIX apenas

PIX é ótimo para fluxo de caixa do prestador, mas inclua cartão na fase 2 para aumentar conversão e ticket (manter PIX como default do provedor). 

Aquisição cara em capitais

Manter hiperlocal + influência micro; otimizar SEO local/GMN e parcerias com condomínios/administradoras.

Nichos adjacentes: onde expandir (e onde NÃO agora)

Critérios: frequência, ticket, competição, risco regulatório, afinidade operacional, “trust need”, risco de desintermediação.

Nicho	Atratividade	Por quê / Como atacar
Pós-obra residencial	Alta	Ticket alto, forte “trust need”, pouca fidelidade a prestadores → bons para cupons e bundles.
Condomínios/Administradoras (áreas comuns)	Alta	B2B leve, contratos recorrentes, agenda previsível; exigir CNPJ e KYC reforçado.
Turnover de Airbnb/locação curta	Alta	Frequência alta, SLAs rígidos, upsell (enxoval). Integração com calendário do host.
Escritórios pequenos/co-work	Média-Alta	Recorrência forte; exigem padronização e checklists. Evitar contratos longos no início.
Passadoria/Lavanderia a domicílio	Média	Complementar ao cleaning; risco de desintermediação moderado. Testar como “add-on”.
Organização (home organizer light)	Média	Ticket bom, porém baixa frequência; usar campanhas sazonais.
Beleza em casa / Pet grooming	Baixa-Média	Mais concorrência vertical, requisitos e equipamentos; manter fora do core inicial.
Cuidado idoso/infantil	Baixa (no curto prazo)	Altíssimo risco regulatório e de responsabilidade; só com compliance pesado e seguros.

Recomendação: primeiro dominar “limpeza residencial + pós-obra + Airbnb”, depois B2B leve. Todos compartilham o mesmo core (agenda, KYC, geo, PIX, disputas).

Scorecard do produto (0–10)

Proposta de valor: 9 — clara para ambos os lados (confiança + dinheiro rápido). 

Completude de funil: 9 — fluxos e módulos essenciais já especificados/implementados. 
 

Moat/defensibilidade: 7 — KYC+PIX+fidelidade ajudam; precisa escala de comunidade. 

GTM/hiperlocal: 8 — plano coerente (Campinas→SP) com metas claras. 

Risco operacional: 6 — suporte e qualidade são intensivos; mitigáveis com tooling. 

Unidade econômica potencial: 7 — take de R$45 é bom; controlar cupons/suporte. 

Roadmap de 90/180/365 dias (objetivos mensuráveis)

D+90 (Campinas)

20–40 prestadores aprovados, ≥800 serviços/mês, repeat D60 ≥35%, NPS ≥60.

Lançar rebook 1 toque, telefone mascarado, cashback básico. 

Dispute center com templates e fotos antes/depois. 

D+180 (SP + 1 cidade)

5.000 serviços/mês/cidade líder; CAC cliente ≤R$70; payback ≤2 meses.

Cartão como 2º método, upsell de pós-obra e Airbnb turnover. 

D+365 (5–10 cidades)

25–50k serviços/mês no total; MRR 1,1–2,2M (R$45 × serviços). 

Programa de níveis do prestador (selos/bonificações), parcerias com condomínios.

Métricas que determinam o “sim” para escalar

Fill rate ≥85% (pedidos aceitos/executados).

Cancelamentos ≤8%; no-show ≤3%.

Repeat D30 ≥30%, D60 ≥40%.

CAC cliente ≤R$60–90 (cidade), prestador ≤R$60.

Suporte por pedido ≤R$4,5; reembolso ≤2% do GMV.

Tempo de repasse mediano ≤24h (PIX). 

Pontos de melhoria imediata no app

Planos recorrentes (semanal/quinzenal) com desconto automático → eleva LTV.

SKU de add-ons (geladeira/forno, pós-obra light, material incluso) na tela de agendamento. 

Preço dinâmico por janela/raio e “horários populares” com surcharge — já tem base de pricing/serviços. 

Checklist e fotos antes/depois embutidos no fluxo (ajuda em disputas). 

Notificações de re-engajamento (D+7, D+28) com cupom “volta logo”. 

Por que atribuí esses percentuais?

Alta prontidão técnica reduz risco de “time-to-first-value” no piloto. 

Go-to-market focado (hiperlocal) é adequado ao estágio e diminui CAC inicial. 

Moat prático (PIX 24h, KYC, fidelidade) cria vantagens, mas a escala nacional exige operação pesada (suporte, reputação, prevenção de fraudes), daí o range menor no cenário 50+ cidades. 
 

Conclusão

O LimpeJá tem altíssimo potencial de “product-channel fit” no nicho de diaristas: proposta clara, fricções corretas atacadas e base técnica sólida. Execute a sequência Campinas → SP → 5 cidades, mantendo disciplina em repeat, CAC e suporte por pedido. Expandir primeiro para pós-obra, Airbnb e B2B leve maximiza receita sem fugir do core.

Se quiser, monto um modelo financeiro sensível (planilha) com ranges de CAC/Repeat para você simular cenários de MRR e decidir o “go” por cidade.