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
signUpClient(data): Chama AuthService.registerClient(), atualiza o estado.
signUpProvider(data): Chama AuthService.registerProvider(), atualiza o estado.
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

registrationData: Armazena todos os dados coletados para o registro do provedor (informações básicas e detalhes do serviço).
submitRegistration(): Coleta todos os dados de registrationData, chama signUpProvider() do AuthContext para registrar o provedor. Após o registro inicial, atualiza o perfil do provedor com os detalhes do serviço via updateMyProviderProfile().
Interconexões: Consumido pelas telas de registro de provedor (service-details.tsx) para compartilhar e persistir dados.
4.3. provider-register/service-details.tsx
Caminho: LimpeJaApp/app/(auth)/provider-register/service-details.tsx
Propósito: Etapa principal do registro de provedor, consolidando todas as informações necessárias para a criação de uma conta de provedor. Coleta dados pessoais (nome completo, e-mail, telefone, CPF, data de nascimento, endereço completo com CEP) e detalhes sobre os serviços que o provedor oferecerá (anos de experiência, descrição do serviço, estrutura de preços, especialidades, áreas de atendimento e chave PIX).
Dependências: React, Animated, Alert, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Ionicons, LinearGradient, ImagePicker, useRouter, useAuth, updateMyProviderProfile, addProviderServiceOffering, updateProviderServiceOffering, getProviderServicesOffered, verificationService.
Funcionalidades Chave:

Formulário abrangente para coletar:
Informações de contato: nome completo, e-mail, telefone.
Dados pessoais: CPF, data de nascimento.
Endereço: CEP, rua, número, complemento, bairro, cidade, estado (com possível integração ViaCEP para preenchimento automático).
Detalhes do Serviço: anos de experiência, descrição do serviço, preço base, chave PIX, especialidades e áreas de atendimento.
handleImagePicker(): Permite ao provedor selecionar e fazer upload de uma foto de perfil (avatar).
handleContinue(): Valida todos os campos do formulário. Faz upload da foto de perfil via verificationService.uploadSelfie(). Atualiza o perfil do provedor (updateMyProviderProfile) com todos os dados coletados. Busca serviços já oferecidos (getProviderServicesOffered) e adiciona ou atualiza os serviços oferecidos (addProviderServiceOffering, updateProviderServiceOffering), mapeando especialidades para serviceIds. Atualiza o user no AuthContext com a nova avatarUrl. Redireciona para a tela de verificação de conta.
Interconexões: Interage com useAuth e vários serviços de provedor para persistir os dados no backend.
4.4. provider-register/verify-account.tsx
Caminho: LimpeJaApp/app/(auth)/provider-register/verify-account.tsx
Propósito: Gerencia o fluxo de verificação de conta do provedor, incluindo upload de documentos e verificação de status.
Dependências: React, Animated, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, View, ActivityIndicator, Stack, useRouter, DocumentUploadScreen, ToastMessage, useAuth, verificationService, DocumentPhotoType, VerificationStatus, PROVIDER_ROUTES.
Funcionalidades Chave:

Exibe diferentes etapas de verificação (splash, upload de documentos, análise).
handleStepCompletion(): Lida com a conclusão de etapas, chamando verificationService.uploadDocumentPhoto() para o upload.
useEffect (periódico): Verifica o status de verificação do provedor (verificationService.getProviderVerificationInfo()) a cada 5 segundos. Se aprovado, atualiza o AuthContext e redireciona para o dashboard.
Interconexões: Interage com useAuth para obter o status do provedor e verificationService para operações de verificação.
4.5. verification.ts
Caminho: LimpeJaApp/app/types/backend/verification.ts
Propósito: Define as interfaces e enums relacionadas ao processo de verificação de provedores, incluindo DTOs para submissão de CPF e tipos de fotos de documento.
Dependências: VerificationStatus (de auth.ts).
Exporta: SubmitCpfRequest, DocumentPhotoType, VerificationResponse, ProviderVerificationInfo.
Funcionalidades Chave:

DocumentPhotoType: Enum para FRONT e BACK das fotos de documento.
ProviderVerificationInfo: Detalhes do status de verificação de um provedor.
4.6. verificationService.ts
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
4.7. profile/edit-services.tsx
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
4.8. dashboard/index.tsx (Provider Dashboard)
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
4.9. schedule/index.tsx (Provider Schedule)
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
4.10. schedule/manage-availability.tsx
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
4.11. earnings/index.tsx (Provider Earnings)
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
handlePickImage(): Permite selecionar uma nova foto de perfil e faz o upload real para o servidor.
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
Propósito: Estas telas listam e exibem resultados de busca e categorias, com a lógica de busca e exibição já implementada.
Funcionalidades Chave:

todas-categorias.tsx: Lista todas as categorias de serviço.
todos-prestadores-proximos.tsx: Lista todos os provedores próximos.
servicos-por-categoria.tsx: Lista serviços filtrados por uma categoria específica.
search-results.tsx / resultados-busca.tsx: Exibe resultados de busca com base em parâmetros.
8. Comunicação (Chat e Notificações)
Esta seção aborda as funcionalidades de comunicação dentro do aplicativo.

8.1. chat.ts
Caminho: LimpeJaApp/src/types/backend/chat.ts
Propósito: Define as interfaces e DTOs para o sistema de chat, incluindo detalhes do chat, mensagens e parâmetros de envio/busca.
Exporta: ChatDetails, Message, SendMessageDto, GetMessagesQuery, ChatSummary.
Funcionalidades Chave:

Message: Contém id, chatId, senderId, receiverId, content, createdAt, isRead.
Observação: A interface ConversationItem é definida no chat.service.ts para uso interno do frontend, enquanto a classe ConversationItemDto é utilizada para a tipagem das respostas da API no chat.controller.ts.
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
Caminho: LimpeJaApp/app/(client)/messages/[chatId].tsx e LimpeJaApp/app/(provider)/messages/index.tsx
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
conversation-item.dto.ts: DTO para a representação da interface ConversationItem para fins de documentação da API.
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
/service-details: Etapa de registro de provedor para informações pessoais e detalhes do serviço.
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

Documentação Técnica do Backend LimpeJá (Atualizada)
1. Visão Geral e Propósito
O backend do LimpeJá é a espinha dorsal da plataforma, responsável por gerenciar toda a lógica de negócios, persistência de dados e comunicação com o frontend (aplicativo móvel e futuras interfaces). Seu propósito primordial é conectar clientes que buscam serviços de limpeza e manutenção com provedores qualificados, facilitando o agendamento, a gestão de serviços, pagamentos, comunicação e avaliações.

Construído com NestJS, um framework progressivo de Node.js, este backend adota uma arquitetura modular e escalável, garantindo robustez, manutenibilidade e alta performance para suportar o crescimento da base de usuários e a expansão de funcionalidades. O NestJS é conhecido por ser uma estrutura TypeScript-first que combina elementos de Programação Orientada a Objetos (OOP), Programação Funcional (FP) e Programação Reativa Funcional (FRP), utilizando o Express (com compatibilidade para Fastify) sob o capô. [GitHub - nestjs/nest] Sua filosofia é fornecer uma arquitetura de aplicação pronta para uso, permitindo a criação de aplicações altamente testáveis, escaláveis, pouco acopladas e de fácil manutenção, inspirada em frameworks front-end como o Angular. [GitHub - nestjs/nest]

2. Arquitetura
2.1. Tecnologias Principais
Framework: NestJS (Node.js) - Escolhido por sua modularidade, forte tipagem (TypeScript), e aderência a padrões de arquitetura (MVC, DDD). É um framework progressivo que permite construir aplicações eficientes, escaláveis e de nível empresarial. [GitHub - nestjs/nest, NestJS | LinkedIn]
Linguagem: TypeScript - Oferece segurança de tipo, melhorando a qualidade e manutenibilidade do código. O NestJS impõe as melhores práticas de desenvolvimento, como separação de módulos, gerenciamento de dependências e princípios SOLID. [NestJS | LinkedIn]
Banco de Dados: PostgreSQL (configurado via DATABASE_URL) - Um banco de dados relacional robusto e escalável, com suporte a extensões geoespaciais como PostGIS (utilizado para geocodificação).
ORM: Prisma - Um ORM moderno que oferece segurança de tipo, migrações declarativas e um cliente de banco de dados intuitivo. Utilizado para interagir com o PostgreSQL.
Autenticação: JWT (JSON Web Tokens) com Passport.js - Para autenticação stateless e segura.
Comunicação em Tempo Real: Socket.IO - Para funcionalidades de chat e notificações em tempo real. O ecossistema NestJS oferece suporte nativo para WebSockets. [NestJS | LinkedIn]
Validação: class-validator e class-transformer - Para validação declarativa de DTOs.
Documentação API: Swagger (OpenAPI) - Para documentação automática e interativa da API.
Variáveis de Ambiente: @nestjs/config com Joi - Para gerenciamento e validação de configurações.
Serviços Externos:
PagSeguro: Para processamento de pagamentos PIX.
Google Geocoding API: Para geocodificação de endereços.
Twilio: Para serviços de SMS/OTP (funcionalidade de OTP desativada na versão atual).
Firebase Admin SDK: Para funcionalidades como autenticação (se integrada), notificações push, etc.
Google Cloud Storage (GCS): Para armazenamento de arquivos como avatares e documentos.
2.2. Estrutura de Módulos (NestJS)
O backend é organizado em módulos coesos, seguindo o princípio de responsabilidade única. Cada módulo encapsula funcionalidades específicas, incluindo seus próprios controladores, serviços, DTOs e entidades.

src/auth: Gerenciamento de autenticação (registro, login, redefinição de senha).
src/users: Operações genéricas sobre usuários (perfis, dados básicos).
src/clients: Lógica específica para o papel de cliente.
src/providers: Lógica específica para o papel de provedor.
src/availability: Gestão da disponibilidade de horários dos provedores.
src/services: Gerenciamento de tipos de serviços globais (e.g., "Limpeza Padrão").
src/provider-services: Gerenciamento dos serviços específicos oferecidos por cada provedor.
src/bookings: Criação e gestão de agendamentos.
src/payments: Processamento de pagamentos (PIX) e saques.
src/chat: Funcionalidades de chat (REST e WebSocket).
src/notifications: Gestão de notificações para usuários.
src/reviews: Submissão e consulta de avaliações.
src/offers: Gerenciamento de ofertas e promoções.
src/search: Motor de busca abrangente.
src/dashboard: Gerenciamento de dados do painel para provedores.
src/verification: Gerenciamento do processo de verificação de provedores (documentos, selfie, OCR, liveness).
src/faqs: Gerenciamento de Perguntas Frequentes (FAQs).
src/earnings: Gerenciamento de ganhos e saques de provedores.
src/prisma: Módulo global para o PrismaService.
src/config: Módulo global para gerenciamento de configurações.
src/common: Componentes reutilizáveis (pipes, filtros de exceção, DTOs genéricos, enums, serviços utilitários como e-mail e geocodificação).
2.3. Fluxo de Requisição
Requisição HTTP/WebSocket: O frontend envia uma requisição para um endpoint específico.
Guards (Autenticação/Autorização): JwtAuthGuard valida o token JWT. RolesGuard verifica se o usuário autenticado possui as roles necessárias para acessar a rota. Para WebSockets, WsAuthGuard realiza a autenticação.
Pipes (Validação/Transformação): ValidationPipe (globalmente aplicado) valida os DTOs de entrada, garantindo a integridade dos dados e transformando-os para o tipo correto.
Controller: Recebe a requisição validada, extrai os parâmetros e delega a lógica de negócios para o serviço apropriado.
Service: Contém a lógica de negócios principal, interagindo com o PrismaService para acessar o banco de dados. Pode injetar outros serviços para orquestrar operações complexas.
PrismaService: Atua como a camada de acesso a dados, executando operações no banco de dados.
Resposta: O serviço retorna os dados para o controlador, que os formata (geralmente usando DTOs de resposta) e os envia de volta ao frontend.
Filters (Tratamento de Exceções): HttpExceptionFilter captura exceções HTTP, formatando as respostas de erro de forma consistente para o frontend.
3. Módulos e Funcionalidades Detalhadas
3.1. Módulo de Autenticação (AuthModule)
Responsabilidade: Gerenciar o ciclo de vida da autenticação.
Controlador (AuthController):

POST /auth/register/client: Registra um novo cliente.
POST /auth/register/provider: Registra um novo provedor.
POST /auth/login: Autentica um usuário (cliente/provedor) e retorna um JWT.
POST /auth/forgot-password: Inicia o processo de redefinição de senha.
Serviço (AuthService): Lógica de registro (hash de senha, criação de usuário/cliente/provedor), validação de credenciais, geração de JWT. Removida a autenticação baseada em telefone/OTP. O registro de cliente e provedor agora inclui o tratamento de coordenadas geoespaciais para o endereço.
DTOs: LoginDto, RegisterClientDto, RegisterProviderDto, ForgotPasswordDto, AuthResponseDto, MessageResponseDto.
Guards: LocalAuthGuard (para login), JwtAuthGuard, RolesGuard, WsAuthGuard.
Estratégias: LocalStrategy, JwtStrategy.
Decoradores: @Roles().
3.2. Módulo de Usuários (UsersModule)
Responsabilidade: Gerenciar perfis de usuário genéricos (base para clientes e provedores).
Controlador (UsersController):

GET /users/me: Obtém o perfil completo do usuário logado.
PATCH /users/me: Atualiza o perfil básico do usuário logado (e-mail).
GET /users/:id (ADMIN): Obtém o perfil de qualquer usuário por ID.
DELETE /users/:id (ADMIN): Deleta um usuário por ID.
Serviço (UsersService): Lógica para buscar (findOne com includes para client/provider e suas relações), atualizar e remover usuários.
DTOs: UserProfileDto, UpdateUserDto.
Entidades: UserEntity.
3.3. Módulo de Clientes (ClientsModule)
Responsabilidade: Gerenciar a lógica específica para o papel de cliente.
Controlador (ClientsController):

GET /clients/me/dashboard (CLIENT): Obtém dados do dashboard do cliente logado.
PATCH /clients/me (CLIENT): Atualiza o perfil do cliente logado (nome, telefone, endereço).
GET /clients/:id (ADMIN): Obtém o perfil de qualquer cliente por ID.
Serviço (ClientsService): Lógica para buscar clientes por ID/UserID, atualizar dados do cliente, e compilar dados para o dashboard.
DTOs: ClientDashboardDto, UpdateClientProfileDto, ClientDetailsDto.
Entidades: ClientEntity.
3.4. Módulo de Provedores (ProvidersModule)
Responsabilidade: Gerenciar a lógica específica para o papel de provedor.
Controlador (ProvidersController):

GET /providers/:id: Obtém detalhes públicos de um provedor.
GET /providers/me (PROVIDER): Obtém o perfil completo do provedor logado.
PATCH /providers/me (PROVIDER): Atualiza o perfil do provedor logado (nome, CPF, data de nascimento, telefone, bio, endereço, etc.), incluindo a chave PIX e o status de verificação.
POST /providers/me/avatar (PROVIDER): Faz upload da foto de perfil (avatar) do provedor logado.
DELETE /providers/:id (ADMIN): Deleta um provedor por ID.
GET /providers: Busca provedores com filtros (termo, localização, rating, geoespacial).
GET /providers/recommended: Obtém uma lista de provedores recomendados.
GET /providers/nearby: Obtém uma lista de provedores próximos, possivelmente com base na localização do usuário.
Serviço (ProvidersService): Lógica para buscar provedores por ID/UserID, atualizar dados do provedor, e realizar buscas complexas. Aprimorado com busca geoespacial utilizando PostGIS (ST_DistanceSphere, ST_DWithin) para encontrar provedores por proximidade, além de filtros por termo, serviço, localização e rating. Inclui fiveStarReviewCount e monthlyBookingsCount nos resultados. Contém métodos para buscar provedores pendentes de verificação (getPendingProviders) e provedores recomendados/experientes (findTopRatedOrExperiencedProviders).
DTOs: ProviderDetailsDto, UpdateProviderProfileDto, ProviderSearchDto, ProviderServiceOfferingDto.
Entidades: ProviderEntity.
3.5. Módulo de Disponibilidade (AvailabilityModule)
Responsabilidade: Gerenciar os horários de disponibilidade dos provedores.
Controlador (AvailabilityController): (Inferido)

GET /providers/:providerId/availability: Obtém horários de disponibilidade de um provedor.
PATCH /providers/:providerId/availability (PROVIDER): Atualiza múltiplos slots de disponibilidade (cria, atualiza, deleta).
POST /providers/:providerId/availability (PROVIDER): Adiciona um novo slot de disponibilidade.
DELETE /providers/:providerId/availability/:availabilityId (PROVIDER): Deleta um slot específico.
Serviço (AvailabilityService): (Inferido) Lógica para CRUD de slots de disponibilidade, incluindo validação de propriedade do provedor.
DTOs: GetAvailabilityDto, UpdateAvailabilityDto.
Entidades: AvailabilityEntity.
3.6. Módulo de Tipos de Serviço Globais (ServicesModule)
Responsabilidade: Gerenciar os tipos de serviços que a plataforma oferece (e.g., "Limpeza Padrão", "Eletricista").
Controlador (ServicesController):

POST /services (ADMIN): Cria um novo tipo de serviço.
GET /services: Lista todos os tipos de serviço.
GET /services/:id: Obtém um tipo de serviço por ID.
PATCH /services/:id (ADMIN): Atualiza um tipo de serviço.
DELETE /services/:id (ADMIN): Deleta um tipo de serviço.
Serviço (ServicesService): Lógica para CRUD de tipos de serviço.
DTOs: CreateServiceDto, UpdateServiceDto, ServiceDetailsDto.
Entidades: ServiceEntity.
3.7. Módulo de Serviços Oferecidos por Provedores (ProviderServicesModule)
Responsabilidade: Gerenciar os serviços específicos que cada provedor oferece (e.g., "Maria oferece Limpeza Padrão por R$100").
Controlador (ProviderServicesController):

POST /providers/:providerId/services (PROVIDER): Adiciona um serviço oferecido por um provedor.
GET /providers/:providerId/services: Lista todos os serviços oferecidos por um provedor.
PATCH /providers/:providerId/services/:id (PROVIDER): Atualiza um serviço oferecido.
DELETE /providers/:providerId/services/:id (PROVIDER): Remove um serviço oferecido.
Serviço (ProviderServicesService): Lógica para CRUD de ProviderService, incluindo validações de existência e unicidade. Agora suporta diferentes tipos de precificação (PricingType) como FIXED_PRICE, HOURLY, BY_SIZE, CUSTOM_QUOTE, com campos pricePerSquareMeter e pricePerRoom.
DTOs: CreateProviderServiceDto, UpdateProviderServiceDto, ProviderServiceDetailsDto.
Entidades: ProviderServiceEntity.
3.8. Módulo de Agendamentos (BookingsModule)
Responsabilidade: Gerenciar o ciclo de vida dos agendamentos de serviços.
Controlador (BookingsController):

POST /bookings (CLIENT): Cria um novo agendamento.
POST /bookings/schedule-and-pay (CLIENT): Cria um novo agendamento e gera a cobrança PIX associada em uma única chamada.
GET /bookings/me: Obtém agendamentos do usuário logado (cliente ou provedor).
GET /bookings/:id: Obtém detalhes de um agendamento específico.
PATCH /bookings/:id/status (CLIENT/PROVIDER): Atualiza o status de um agendamento.
PATCH /bookings/:id/cancel (CLIENT): Cancela um agendamento.
POST /bookings/:id/report-issue (CLIENT/PROVIDER): Permite reportar um problema com um agendamento.
Serviço (BookingsService): Lógica para criação de agendamentos (verificando provedor/serviço), busca de agendamentos por usuário/role, e transições de status complexas. Calcula o totalPrice com base no PricingType do ProviderService.
DTOs: CreateBookingDto, UpdateBookingStatusDto, BookingDetailsDto, BookingAndPixResponseDto.
Entidades: BookingEntity.
3.9. Módulo de Pagamentos (PaymentsModule)
Responsabilidade: Gerenciar operações de pagamento e saque.
Controlador (PaymentsController):

POST /payments/pix-charge: Cria uma cobrança PIX.
POST /payments/withdrawal: Solicita um saque de um provedor.
POST /payments/webhook/pix: NOVO ENDPOINT. Recebe notificações de webhook de pagamento PIX do gateway (PagSeguro).
Serviço (PaymentsService):
createPixCharge: Lógica para criar cobranças PIX, incluindo busca de detalhes completos do cliente (email, nome, telefone, CPF, endereço) e do agendamento/serviço. Integração com a API do PagSeguro para geração de QR Code e BR Code, e atualização do status do agendamento para PENDING.
requestWithdrawal: Processa solicitações de saque de provedores, validando o saldo disponível e registrando a transação.
handlePixWebhook: NOVO MÉTODO. Processa notificações de webhook de PIX, atualizando o status da transação e do agendamento (para CONFIRMED ou CANCELED) conforme o retorno do gateway.
DTOs: CreatePixChargeDto, PixChargeResponseDto, RequestWithdrawalDto, MessageResponseDto.
Entidades: TransactionEntity.
3.10. Módulo de Chat (ChatModule)
Responsabilidade: Gerenciar a comunicação de mensagens entre usuários.
Controlador (ChatController):

GET /chat/find-or-create/provider/:providerId/client/:clientId: Encontra um chat existente ou cria um novo entre um provedor e um cliente.
POST /chat/:chatId/messages: Envia uma nova mensagem.
GET /chat/:chatId/messages: Obtém o histórico de mensagens de uma conversa.
Gateway (ChatGateway): (WebSocket)
@SubscribeMessage('sendMessage'): Lida com o envio de mensagens em tempo real.
@SubscribeMessage('joinChat'): Permite que clientes entrem em salas de chat.
Serviço (ChatService): Lógica para criar e buscar mensagens. Implementa lógica de permissão: só permite enviar/acessar mensagens se houver um agendamento CONFIRMED entre os participantes. Bloqueia se o agendamento estiver COMPLETED ou CANCELED.
DTOs: SendMessageDto, GetMessagesDto, ChatDetailsDto.
Entidades: Message.
3.11. Módulo de Notificações (NotificationsModule)
Responsabilidade: Gerenciar o envio e status de notificações para usuários.
Controlador (NotificationsController):

POST /notifications (ADMIN): Cria uma nova notificação.
GET /notifications/me: Obtém notificações do usuário logado.
PATCH /notifications/me/mark-as-read: Marca múltiplas/todas as notificações como lidas.
PATCH /notifications/:id/mark-as-read: Marca uma notificação específica como lida.
DELETE /notifications/:id: Deleta uma notificação.
Serviço (NotificationsService): Lógica para criar, buscar, marcar como lidas e deletar notificações.
DTOs: CreateNotificationDto, UpdateNotificationDto, MarkAsReadDto.
Entidades: NotificationEntity.
3.12. Módulo de Avaliações (ReviewsModule)
Responsabilidade: Gerenciar a submissão e consulta de avaliações de serviços.
Controlador (ReviewsController):

POST /reviews (CLIENT): Envia uma nova avaliação para um serviço concluído.
GET /reviews: Obtém avaliações com filtros (provedor, cliente, rating).
GET /reviews/:id: Obtém uma avaliação por ID.
GET /reviews/provider/:providerId/breakdown: Obtém uma análise detalhada das avaliações de um provedor.
GET /reviews/provider/:providerId/suggestions: Obtém sugestões inteligentes para o provedor baseadas em IA.
Serviço (ReviewsService): Lógica para submeter avaliações (verificando agendamento, status, duplicidade) e buscar avaliações. Calcula detalhamento de avaliações e gera sugestões inteligentes (precificação, disponibilidade, melhoria de serviço, marketing) com base em dados de avaliação e agendamentos.
DTOs: SubmitReviewDto, GetReviewsDto, ReviewDto, SmartSuggestionDto, DetailedRatingBreakdownDto.
Entidades: ReviewEntity.
3.13. Módulo de Ofertas (OffersModule)
Responsabilidade: Gerenciar ofertas e promoções da plataforma.
Controlador (OffersController):

POST /offers (ADMIN): Cria uma nova oferta.
GET /offers: Lista todas as ofertas.
GET /offers/:id: Obtém detalhes de uma oferta específica.
PATCH /offers/:id (ADMIN): Atualiza uma oferta existente.
DELETE /offers/:id (ADMIN): Exclui uma oferta.
Serviço (OffersService): Lógica para CRUD de ofertas. Inclui método searchOffers para buscar ofertas por termo e validade.
DTOs: CreateOfferDto, UpdateOfferDto, OfferDetailsDto.
Entidades: Offer.
3.14. Módulo de Busca (SearchModule)
Responsabilidade: Fornecer um endpoint unificado para busca abrangente.
Controlador (SearchController):

GET /search: Realiza uma busca por provedores, serviços, etc., usando diversos critérios.
Serviço (SearchService): Orquestra chamadas a outros serviços (ProvidersService, ServicesService, ProviderServicesService, OffersService) para compilar resultados de busca.
DTOs: SearchQueryDto, ProviderServiceSearchResultDto.
3.15. Módulo de Aplicação (AppModule / Geral)
Responsabilidade: Gerenciar rotas de nível de aplicação e verificações de saúde.
Controlador (AppController):

GET /: Rota raiz, geralmente para verificar se a API está online ou retornar uma mensagem de boas-vindas.
GET /health: Endpoint para verificações de saúde da aplicação.
Serviço (AppService): Lógica para as rotas gerais da aplicação.
DTOs: Nenhum DTO específico para estas rotas.
3.16. Módulo de Verificação (VerificationModule)
Responsabilidade: Gerenciar o processo de verificação de provedores, incluindo upload e processamento de documentos, selfie, OCR, verificação de vivacidade (liveness), comparação facial e aprovação/rejeição manual.
Controlador (VerificationController): (Inferido)

GET /verification/pending-queue (ADMIN): Obtém a lista de provedores com status de verificação pendente de revisão manual ou upload de documentos.
POST /verification/upload-document/:type (PROVIDER): Permite que o provedor faça upload da foto da frente ou verso de um documento de identificação. Processa OCR no documento.
POST /verification/upload-selfie (PROVIDER): Permite que o provedor faça upload de uma selfie com o documento. Realiza verificação de vivacidade (liveness check) e comparação facial com o documento enviado anteriormente.
PATCH /verification/:providerId/status (ADMIN): Atualiza manualmente o status de verificação de um provedor (APROVADO, REJEITADO, etc.).
POST /verification/reject/:providerId (ADMIN): Rejeita um provedor, exigindo um motivo.
GET /verification/status/:providerId (ADMIN, PROVIDER): Obtém o status atual da verificação de um provedor, incluindo o progresso dos uploads e resultados de OCR/Liveness.
Serviço (VerificationService): (Inferido) Orquestra o fluxo de verificação. Responsável por:
Gerenciar uploads de arquivos para armazenamento (utilizando Google Cloud Storage).
Chamar DocumentProcessingService para OCR, liveness check e comparação facial (integrando com APIs de terceiros como Cellereit Facematch).
Atualizar o verificationStatus do provedor automaticamente com base no progresso das verificações (updateProviderVerificationStatus).
Permitir atualizações manuais de status e registro de motivos de rejeição.
DTOs: UploadDocumentDto, UploadSelfieDto.
3.17. Módulo de Dashboard (DashboardModule)
Responsabilidade: Fornecer dados sumarizados e relevantes para o painel do provedor logado.
Controlador (DashboardController):

GET /providers/me/dashboard (PROVIDER): Obtém todos os dados necessários para o dashboard de um provedor, incluindo agendamentos futuros, ganhos, avaliações recentes, contagem de avaliações 5 estrelas e contagem de agendamentos mensais.
Serviço (DashboardService): Agrega dados de diversos serviços (ProvidersService, BookingsService, EarningsService, ReviewsService) para compilar o DashboardDto.
DTOs: DashboardDto.
3.18. Módulo de Ganhos (EarningsModule)
Responsabilidade: Gerenciar os ganhos e solicitações de saque dos provedores.
Controlador (EarningsController):

GET /providers/me/earnings: Obtém os dados de ganhos do provedor logado.
POST /providers/me/earnings/withdrawal: Permite que o provedor solicite um saque.
Serviço (EarningsService): Calcula os ganhos totais, o valor disponível para saque e os saques pendentes com base nos agendamentos concluídos e transações. Inclui transações recentes e um detalhamento dos ganhos por período.
DTOs: EarningsResponseDto, WithdrawalRequestDto, WithdrawalResponseDto.
3.19. Módulo de FAQs (FaqsModule)
Responsabilidade: Gerenciar as Perguntas Frequentes (FAQs) da aplicação.
Controlador (FaqsController):

POST /faqs (ADMIN): Cria um novo item de FAQ.
GET /faqs: Obtém todos os itens de FAQ.
GET /faqs/:id: Obtém um item de FAQ por ID.
PATCH /faqs/:id (ADMIN): Atualiza um item de FAQ.
DELETE /faqs/:id (ADMIN): Exclui um item de FAQ.
Serviço (FaqsService): Lógica para CRUD de itens de FAQ.
DTOs: CreateFaqDto, UpdateFaqDto.
Entidades: FaqItemEntity.
3.20. Componentes Globais (common/, config/, prisma/)
common/:

filters/http-exception.filter.ts: Implementa o filtro de exceções global, padronizando as respostas de erro.
constants/roles.enum.ts: Define o enum UserRole (CLIENT, PROVIDER, ADMIN).
dto/create-address.dto.ts: DTO para criação de endereços.
dto/address-details.dto.ts: DTO para detalhes de endereço.
dto/message-response.dto.ts: DTO genérico para respostas simples de mensagem.
entities/address.entity.ts: Entidade base para endereços.
enums/pricing-type.enum.ts: Define o enum PricingType.
enums/booking-status.enum.ts: Define o enum BookingStatus.
enums/verification-status.enum.ts: Define o enum VerificationStatus.
services/email.service.ts: Serviço para envio de e-mails.
services/geocoding.service.ts: Serviço para geocodificação de endereços.
pipes/validation.pipe.ts: Exemplo de pipe de validação customizado.
config/:
config.module.ts: Utiliza o @nestjs/config para carregar variáveis de ambiente de forma segura e tipada.
configuration.ts: Carrega variáveis de ambiente como PORT, DATABASE_URL, JWT_SECRET, APP_BASE_URL, GCS_PROJECT_ID, GCS_KEY, GCS_BUCKET_NAME, THIRD_PARTY_FACEMATCH_API_URL, THIRD_PARTY_FACEMATCH_API_KEY, configurações de e-mail (EMAIL_SERVICE_PROVIDER, SENDGRID_API_KEY, SMTP_HOST, etc.), configurações de SMS (SMS_SERVICE_PROVIDER, TWILIO_ACCOUNT_SID, etc.), configurações de geocodificação (GEOCODING_API_PROVIDER, GOOGLE_MAPS_API_KEY, etc.), e configurações do PagSeguro (PAGSEGURO_API_TOKEN, PAGSEGURO_API_BASE_URL).
validation-schema.ts: Define o esquema de validação Joi para as variáveis de ambiente, garantindo que todas as configurações necessárias estejam presentes e no formato correto.
prisma/:
prisma.module.ts: Módulo global que exporta o PrismaService.
prisma.service.ts: Estende PrismaClient, encapsulando a conexão com o banco de dados.
4. Modelo de Dados (Prisma Schema)
O schema.prisma define a estrutura do banco de dados, incluindo modelos, campos, tipos e relações.

prisma

Copiar
// prisma/schema.prisma
// Este arquivo é o ponto de partida para o seu banco de dados.
// Ele define os modelos de dados e como eles se relacionam.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Ou "mysql", "sqlite", etc., dependendo do seu DB
  url      = env("DATABASE_URL")
}

// Enums
enum UserRole {
  CLIENT
  PROVIDER
  ADMIN
}

enum VerificationStatus {
  PENDING_INITIAL_REVIEW
  PENDING_DOCUMENTS_UPLOAD
  PENDING_BACKGROUND_CHECK
  PENDING_MANUAL_REVIEW
  APPROVED
  REJECTED
  BLOCKED
}

enum PricingType {
  FIXED_PRICE
  HOURLY
  BY_SIZE
  CUSTOM_QUOTE
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELED
  RESCHEDULED
  IN_PROGRESS
  PENDING_PROVIDER_CONFIRMATION
  REJECTED
  PENDING_DISPUTE // Adicionado para problemas reportados
}

enum TransactionType {
  PAYMENT
  WITHDRAWAL
  COMMISSION
}

// Modelos

model User {
  id                String         @id @default(uuid())
  email             String         @unique
  phone             String?        @unique // Telefone do usuário
  passwordHash      String?        // Hash da senha (pode ser nulo se autenticação for apenas por terceiros)
  role              UserRole       @default(CLIENT)
  avatarUrl         String?        // URL do avatar do usuário (geral)
  firebaseUid       String?        @unique // ID do usuário no Firebase Auth
  otpCode           String?        // Código OTP temporário
  otpExpiresAt      DateTime?      // Data de expiração do OTP
  isPhoneVerified   Boolean        @default(false) // Indica se o telefone foi verificado
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  client            Client?
  provider          Provider?
  messagesSent      Message[]      @relation("SentMessages")
  messagesReceived  Message[]      @relation("ReceivedMessages")
  notifications     Notification[]
  chatsAsParticipant1 Chat[]       @relation("ChatParticipant1")
  chatsAsParticipant2 Chat[]       @relation("ChatParticipant2")
}

model Client {
  id                    String    @id @default(uuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id])
  fullName              String
  phone                 String?   // Telefone do cliente (redundante com User.phone, mas para perfil)
  cpf                   String?   @unique // CPF do cliente
  addressId             String?   @unique
  address               Address?  @relation("ClientAddress", fields: [addressId], references: [id])
  bookings              Booking[]
  reviewsMade           Review[]  @relation("ClientReviews")
  completedBookingsCount Int      @default(0) // Contagem de agendamentos concluídos
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Provider {
  id                      String             @id @default(uuid())
  userId                  String             @unique
  user                    User               @relation(fields: [userId], references: [id])
  fullName                String
  cpf                     String             @unique
  dateOfBirth             DateTime
  phone                   String?            // Telefone do provedor (redundante com User.phone, mas para perfil)
  addressId               String?            @unique
  address                 Address?           @relation("ProviderAddress", fields: [addressId], references: [id])
  yearsOfExperience       Int?
  avatarUrl               String?            // URL do avatar do provedor (específico do provedor)
  bio                     String?            // Biografia do provedor
  verificationStatus      VerificationStatus @default(PENDING_INITIAL_REVIEW) // Status de verificação
  documentPhotoFrontUrl   String?            // URL da foto frontal do documento
  documentPhotoBackUrl    String?            // URL da foto traseira do documento
  selfieWithDocumentUrl   String?            // URL da selfie com o documento
  backgroundCheckResult   Json?              // Resultado da verificação de antecedentes (JSON)
  rejectionReason         String?            // Motivo da rejeição da verificação
  pixKey                  String?            // Chave PIX do provedor
  ocrResult               Json?              // Resultado do OCR no documento (JSON)
  livenessResult          Json?              // Resultado da verificação de vivacidade (JSON)
  fiveStarReviewCount     Int                @default(0) // Contagem de avaliações 5 estrelas
  monthlyBookingsCount    Int                @default(0) // Contagem de agendamentos concluídos no mês atual
  createdAt               DateTime           @default(now())
  updatedAt               DateTime           @updatedAt

  providerServices        ProviderService[]
  availability            Availability[]
  bookings                Booking[]
  reviewsReceived         Review[]           @relation("ProviderReviews")
  transactions            Transaction[]
}

model Address {
  id           String   @id @default(uuid())
  cep          String
  street       String
  number       String
  complement   String?
  neighborhood String
  city         String
  state        String
  // Campo de localização geoespacial para PostGIS
  location     Unsupported("geometry(Point, 4326)")? @db.Geometry(Point, 4326) // Tipo PostGIS

  clientId     String?  @unique
  providerId   String?  @unique
  client       Client?  @relation("ClientAddress", fields: [clientId], references: [id])
  provider     Provider? @relation("ProviderAddress", fields: [providerId], references: [id])
  bookingId    String?  @unique // Endereço específico para um booking
  booking      Booking? @relation("BookingAddress")
}

model Service {
  id               String            @id @default(uuid())
  name             String            @unique
  description      String?
  icon             String?
  price            Decimal           @db.Decimal(10, 2) // Preço padrão do serviço
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  providerServices ProviderService[]
}

model ProviderService {
  id                  String      @id @default(uuid())
  providerId          String
  serviceId           String
  price               Decimal     @db.Decimal(10, 2) // Preço cobrado pelo provedor
  durationMinutes     Int?        // Duração estimada em minutos
  description         String?
  pricingType         PricingType @default(FIXED_PRICE) // Tipo de precificação
  pricePerSquareMeter Decimal?    @db.Decimal(10, 2) // Preço por m²
  pricePerRoom        Decimal?    @db.Decimal(10, 2) // Preço por cômodo
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  provider            Provider    @relation(fields: [providerId], references: [id])
  service             Service     @relation(fields: [serviceId], references: [id])
  bookings            Booking[]

  @@unique([providerId, serviceId])
}

model Booking {
  id                String        @id @default(uuid())
  clientId          String
  providerId        String
  providerServiceId String
  scheduledDate     DateTime      // Data do agendamento
  scheduledTime     String        // Horário do agendamento (e.g., "09:00")
  status            BookingStatus @default(PENDING)
  totalPrice        Decimal       @db.Decimal(10, 2)
  notes             String?
  addressId         String        @unique // ID do endereço do agendamento
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  client            Client        @relation(fields: [clientId], references: [id])
  provider          Provider      @relation(fields: [providerId], references: [id])
  providerService   ProviderService @relation(fields: [providerServiceId], references: [id])
  address           Address       @relation("BookingAddress", fields: [addressId], references: [id])
  review            Review?       // Relação 1:1 com Review
}

model Chat {
  id              String    @id @default(uuid())
  participant1Id  String
  participant1    User      @relation("ChatParticipant1", fields: [participant1Id], references: [id])
  participant2Id  String
  participant2    User      @relation("ChatParticipant2", fields: [participant2Id], references: [id])
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  messages        Message[]

  @@unique([participant1Id, participant2Id])
}

model Message {
  id         String   @id @default(uuid())
  chatId     String
  chat       Chat     @relation(fields: [chatId], references: [id])
  senderId   String
  receiverId String
  content    String
  timestamp  DateTime @default(now())
  isRead     Boolean  @default(false)
  createdAt  DateTime @default(now()) // Adicionado para consistência
  targetUrl  String?  // URL de destino para notificação
  sender     User     @relation("SentMessages", fields: [senderId], references: [id])
  receiver   User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
}

model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String
  message   String
  isRead    Boolean  @default(false)
  targetUrl String?
  createdAt DateTime @default(now())
}

model Review {
  id         String   @id @default(uuid())
  bookingId  String   @unique
  booking    Booking  @relation(fields: [bookingId], references: [id])
  clientId   String
  providerId String
  rating     Int
  comment    String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt // Adicionado para consistência

  client     Client   @relation("ClientReviews", fields: [clientId], references: [id])
  provider   Provider @relation("ProviderReviews", fields: [providerId], references: [id])
}

model Offer {
  id                  String    @id @default(uuid())
  title               String
  description         String?
  discountPercentage  Float?    // Desconto em percentual
  fixedDiscountAmount Decimal?  @db.Decimal(10, 2) // Desconto em valor fixo
  validUntil          DateTime
  imageUrl            String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}

model Transaction {
  id                   String        @id @default(uuid())
  providerId           String
  provider             Provider      @relation(fields: [providerId], references: [id])
  amount               Decimal       @db.Decimal(10, 2)
  type                 TransactionType
  status               String        // Status da transação (e.g., "PENDING", "COMPLETED", "FAILED", "REQUESTED")
  description          String?
  bookingId            String?       @unique // ID do agendamento associado (para pagamentos)
  qrCodeUrl            String?       // URL do QR Code (para pagamentos PIX)
  gatewayTransactionId String?       @unique // ID da transação no gateway de pagamento
  createdAt            DateTime      @default(now())
}

model Availability {
  id          String   @id @default(uuid())
  providerId  String
  provider    Provider @relation(fields: [providerId], references: [id])
  dayOfWeek   Int
  startTime   String
  endTime     String
  isAvailable Boolean  @default(true)
  createdAt   DateTime @default(now()) // Adicionado para consistência
  updatedAt   DateTime @updatedAt // Adicionado para consistência
}

model FAQItem {
  id        String   @id @default(uuid())
  question  String
  answer    String
  category  String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
5. Metodologias e Funções Globais
Autenticação JWT: O sistema utiliza JSON Web Tokens (JWT) para autenticação.
LocalStrategy: Usada para o login inicial, validando credenciais (email e senha) e retornando um token JWT.
JwtStrategy: Validada em cada requisição protegida, decodificando o token e buscando o usuário no banco de dados para garantir sua validade e status.
JwtAuthGuard: Um guard do NestJS que protege as rotas, garantindo que apenas usuários autenticados com um JWT válido possam acessá-las.
Autorização Baseada em Papéis (RBAC):
@Roles Decorator: Um decorador customizado (auth/decorators/roles.decorator.ts) para especificar quais papéis de usuário (e.g., UserRole.ADMIN, UserRole.CLIENT) têm permissão para acessar uma rota.
RolesGuard: Um guard do NestJS que verifica o papel do usuário (obtido do payload do JWT) contra os papéis exigidos pela rota, concedendo ou negando acesso.
Validação de DTOs: A validação de dados de entrada é automatizada e robusta.
ValidationPipe: Configurado globalmente em main.ts, ele intercepta os dados de entrada das requisições e os valida contra as regras definidas nos DTOs usando class-validator e class-transformer.
Tratamento de Erros Centralizado:
HttpExceptionFilter: Garante que todas as exceções HTTP lançadas na aplicação sejam capturadas e formatadas em uma resposta JSON consistente e amigável para o cliente.
Injeção de Dependência: NestJS utiliza um poderoso sistema de Injeção de Dependência.
Serviços são @Injectable() e podem ser injetados em outros serviços ou controladores através de seus construtores, facilitando a testabilidade e a modularidade.
PrismaService é um provedor global, facilmente acessível em qualquer lugar que precise interagir com o banco de dados.
Validação de Propriedade (validateProviderOwnership):
Uma função auxiliar crucial (provider-services.controller.ts) que verifica se o provedor logado (req.user['userId']) é o proprietário dos recursos (e.g., disponibilidade, serviços oferecidos) que está tentando modificar. Isso evita que um provedor manipule dados de outro.
Filosofia NestJS:
O NestJS promove uma arquitetura que evita o "spaghetti code" e impõe as melhores práticas de desenvolvimento, como separação de módulos, gerenciamento de dependências, princípios SOLID e padrões de arquitetura testáveis. [NestJS | LinkedIn]
Isso significa que desenvolvedores, mesmo os juniores, são guiados a escrever código mais limpo e manutenível. [NestJS | LinkedIn]
6. Recursos e Suporte Oficiais do NestJS
O NestJS oferece uma vasta gama de recursos e suporte oficial para auxiliar no desenvolvimento e na adoção do framework:

Documentação Oficial: A fonte mais completa de informações sobre o framework, acessível em docs.nestjs.com. [Documentation | NestJS]
Comunidade Discord: Para perguntas e suporte da comunidade, o canal oficial do Discord (discord.com/invite/G7Qnnhy) é o local ideal. [NestJS | Discord]
Cursos Oficiais: A plataforma de cursos (courses.nestjs.com) oferece treinamento aprofundado em diversos tópicos, desde os fundamentos até conceitos avançados como Arquitetura e Padrões, Microserviços, Autenticação e Autorização, e GraphQL. Os cursos são ministrados pelo criador do NestJS, Kamil Myśliwiec, e pelo membro da equipe principal, Mark Pieszak, com acesso vitalício e certificados de conclusão. [Official Courses | NestJS]
Suporte Empresarial (NestJS Enterprise): Para empresas que buscam assistência dedicada, o NestJS oferece serviços de consultoria, revisão arquitetônica, mentoria de equipe, resolução de problemas de segurança e desempenho, revisões de código aprofundadas, suporte de longo prazo (LTS) e assistência para atualizações, e até mesmo aumento de equipe com membros da equipe principal do NestJS. enterprise.nestjs.com
Devtools: Uma ferramenta para visualizar o grafo da sua aplicação NestJS e interagir com ela em tempo real. devtools.nestjs.com
Deploy with Mau: Uma plataforma oficial para facilitar a implantação de aplicações NestJS na AWS. mau.nestjs.com
GitHub: O repositório oficial no GitHub (github.com/nestjs/nest) é onde o código-fonte é mantido, e onde a comunidade pode reportar issues e enviar pull requests. [GitHub - nestjs/nest]
LinkedIn: A página oficial do NestJS no LinkedIn (linkedin.com/company/nestjs) oferece atualizações sobre o framework, histórias de sucesso de empresas que o utilizam e engajamento com a comunidade. [NestJS | LinkedIn]
Popularidade: O NestJS atingiu a marca de 5 milhões de downloads semanais no NPM, demonstrando sua ampla adoção e maturidade. [NestJS | LinkedIn]
7. Interligação entre Módulos e Serviços
A arquitetura modular do NestJS facilita a comunicação entre diferentes partes da aplicação:

AppModule: Atua como o orquestrador principal, importando todos os módulos funcionais e garantindo que seus provedores estejam disponíveis.
AuthModule: Depende do UsersModule para criar e validar usuários durante os processos de registro e login.
ClientsService e ProvidersService: Utilizam o UsersService para gerenciar a relação entre os perfis de cliente/provedor e as contas de usuário base. Ambos interagem diretamente com o PrismaService para operações de banco de dados.
BookingsService: É um serviço central que depende de ClientsService, ProvidersService, ProviderServicesService e PaymentsService para validar a existência e a elegibilidade de clientes, provedores e serviços antes de criar um agendamento. Ele também gerencia as transições de status dos agendamentos e interage com NotificationsService.
ReviewsService: Interage com o BookingsService para garantir que as avaliações sejam submetidas apenas para agendamentos concluídos e que o cliente que envia a avaliação seja o cliente do agendamento. Também depende de ProvidersService para buscar dados de provedores e ClientsService para dados de clientes.
SearchService: Orquestra a busca de informações, consultando ProvidersService para provedores, ServicesService para tipos de serviço, ProviderServicesService para serviços oferecidos por provedores e OffersService para ofertas, agregando os resultados.
PaymentsService: Utiliza o PrismaService para registrar transações financeiras e pode atualizar o status de agendamentos (BookingStatus.PENDING) após a criação de uma cobrança PIX. Depende de ProvidersService e BookingsService.
ChatService: Responsável por armazenar e recuperar mensagens de chat, utilizando o PrismaService. O ChatGateway (WebSocket) utiliza o ChatService para persistir as mensagens em tempo real. Depende de ClientsService e ProvidersService para validação de participantes.
NotificationsService: Gerencia a criação, recuperação e marcação de notificações, interagindo com o PrismaService.
ProviderServicesService: Valida a existência de provedores e tipos de serviço (via ProvidersService e ServicesService) antes de associá-los como um serviço oferecido, além de verificar se o provedor já oferece um determinado serviço para evitar duplicatas.
EarningsService: Depende de ProvidersService para obter dados do provedor e PrismaService para acessar bookings e transações.
DashboardService: Agrega dados de ProvidersService, BookingsService, EarningsService e ReviewsService para compilar os dados do painel.
8. Integração com o Frontend (Expo Router)
A comunicação entre o frontend (Expo Router) e o backend (NestJS) é primariamente via APIs RESTful (HTTP) e, para funcionalidades de chat, é estendida com WebSockets para comunicação em tempo real.

URL Base da API: O frontend será configurado com a URL base do backend (e.g., http://localhost:3000 durante o desenvolvimento).
Autenticação (JWT):
O frontend envia credenciais para POST /auth/login.
O backend retorna um JWT, que o frontend armazena e inclui no cabeçalho Authorization (Bearer <token>) de todas as requisições protegidas.
Consistência de Dados (DTOs): Os DTOs definidos no NestJS garantem que a estrutura de dados esperada e enviada entre frontend e backend seja consistente e validada.
Tratamento de Erros: O HttpExceptionFilter do backend fornece respostas de erro padronizadas, permitindo que o frontend exiba mensagens significativas ao usuário.
Comunicação em Tempo Real (Chat): O ChatGateway com @nestjs/platform-socket.io permite comunicação bidirecional para o chat, proporcionando uma experiência de usuário fluida.
Variáveis de Ambiente: O backend utiliza arquivos .env para gerenciar configurações sensíveis e específicas do ambiente.
9. Mapeamento de Rotas da API
A tabela abaixo detalha o mapeamento entre as funcionalidades do frontend e os endpoints da API do backend:

Fluxo/Tela do Frontend	Endpoint do Backend (Método HTTP, Caminho)	DTOs (Requisição/Resposta)
Fluxo de Autenticação		
Registro de Cliente	POST /auth/register/client	RegisterClientDto / AuthResponseDto
Registro de Provedor	POST /auth/register/provider	RegisterProviderDto / AuthResponseDto
Login	POST /auth/login	LoginDto / AuthResponseDto
Esqueci a Senha	POST /auth/forgot-password	ForgotPasswordDto / MessageResponseDto
Gerenciamento de Usuário/Perfil		
Obter Perfil do Usuário	GET /users/me (protegido)	UserProfileDto
Atualizar Perfil do Usuário	PATCH /users/me (protegido)	UpdateUserDto / UserProfileDto
Obter Perfil do Provedor (público)	GET /providers/:id	ProviderDetailsDto
Fluxo do Cliente		
Obter Dados do Dashboard do Cliente	GET /clients/me/dashboard (protegido)	ClientDashboardDto
Atualizar Perfil do Cliente	PATCH /clients/me (protegido)	UpdateClientProfileDto / ClientEntity
Obter Todos os Tipos de Serviço	GET /services	ServiceDetailsDto[]
Buscar Provedores/Serviços	GET /providers (com filtros)	ProviderSearchDto / ProviderDetailsDto[]
Buscar Provedores/Serviços (Geral)	GET /search	SearchQueryDto / SearchResultDto
Obter Agendamentos do Cliente	GET /bookings/me (protegido, com filtro de status)	BookingDetailsDto[]
Obter Detalhes do Agendamento	GET /bookings/:id (protegido)	BookingDetailsDto
Atualizar Status Agendamento (Cliente)	PATCH /bookings/:id/status (cliente só pode cancelar) (protegido)	UpdateBookingStatusDto / BookingDetailsDto
Cancelar Agendamento (Cliente)	PATCH /bookings/:id/cancel (protegido)	BookingDetailsDto
Reportar Problema no Agendamento	POST /bookings/:id/report-issue (protegido)	BookingDetailsDto
Obter Horários Disponíveis	GET /providers/:providerId/availability	GetAvailabilityDto / AvailabilityEntity[]
Criar Agendamento	POST /bookings (protegido)	CreateBookingDto / BookingDetailsDto
Criar Agendamento e Cobrança PIX	POST /bookings/schedule-and-pay (protegido)	CreateBookingDto / BookingAndPixResponseDto
Obter Mensagens do Chat	GET /chat/:chatId/messages (protegido)	GetMessagesDto / Message[]
Enviar Mensagem de Chat	POST /chat/:chatId/messages (protegido)	SendMessageDto / Message
Encontrar/Criar Chat	GET /chat/find-or-create/provider/:providerId/client/:clientId (protegido)	ChatDetailsDto
Obter Detalhes da Oferta	GET /offers/:id	OfferDetailsDto
Enviar Avaliação	POST /reviews (protegido)	SubmitReviewDto / ReviewEntity
Fluxo do Provedor		
Obter Dados do Dashboard do Provedor	GET /providers/me/dashboard (protegido)	DashboardDto
Atualizar Perfil do Provedor	PATCH /providers/me (protegido)	UpdateProviderProfileDto / ProviderDetailsDto
Upload de Avatar do Provedor	POST /providers/me/avatar (protegido)	Multer.File / { message: string, url: string }
Obter Agendamentos do Provedor	GET /bookings/me (protegido, com filtro de status)	BookingDetailsDto[]
Atualizar Status Agendamento (Provedor)	PATCH /bookings/:id/status (provedor) (protegido)	UpdateBookingStatusDto / BookingDetailsDto
Obter Dados de Ganhos	GET /providers/me/earnings (protegido)	EarningsResponseDto
Solicitar Saque	POST /providers/me/earnings/withdrawal (protegido)	WithdrawalRequestDto / WithdrawalResponseDto
Gerenciar Disponibilidade	PATCH /providers/:providerId/availability (protegido)	UpdateAvailabilityDto[] / AvailabilityEntity[]
Adicionar Slot de Disponibilidade	POST /providers/:providerId/availability (protegido)	UpdateAvailabilityDto / AvailabilityEntity
Deletar Slot de Disponibilidade	DELETE /providers/:providerId/availability/:availabilityId (protegido)	void
Gerenciar Serviços Oferecidos	GET /providers/:providerId/services (protegido)	ProviderServiceEntity[]
Adicionar Serviço Oferecido	POST /providers/:providerId/services (protegido)	CreateProviderServiceDto / ProviderServiceEntity
Atualizar Serviço Oferecido	PATCH /providers/:providerId/services/:id (protegido)	UpdateProviderServiceDto / ProviderServiceEntity
Excluir Serviço Oferecido	DELETE /providers/:providerId/services/:id (protegido)	void
Obter Análise de Avaliações	GET /reviews/provider/:providerId/breakdown	DetailedRatingBreakdownDto
Obter Sugestões Inteligentes	GET /reviews/provider/:providerId/suggestions (protegido)	SmartSuggestionDto[]
Fluxo de Administrador		
Obter Perfil de Usuário por ID	GET /users/:id (protegido, ADMIN)	UserProfileDto
Deletar Usuário por ID	DELETE /users/:id (protegido, ADMIN)	void
Deletar Provedor por ID	DELETE /providers/:id (protegido, ADMIN)	void
Criar Tipo de Serviço	POST /services (protegido, ADMIN)	CreateServiceDto / ServiceDetailsDto
Atualizar Tipo de Serviço	PATCH /services/:id (protegido, ADMIN)	UpdateServiceDto / ServiceDetailsDto
Deletar Tipo de Serviço	DELETE /services/:id (protegido, ADMIN)	void
Criar Oferta	POST /offers (protegido, ADMIN)	CreateOfferDto / Offer
Atualizar Oferta	PATCH /offers/:id (protegido, ADMIN)	UpdateOfferDto / Offer
Excluir Oferta	DELETE /offers/:id (protegido, ADMIN)	Offer
Criar Item de FAQ	POST /faqs (protegido, ADMIN)	CreateFaqDto / FaqItemEntity
Atualizar Item de FAQ	PATCH /faqs/:id (protegido, ADMIN)	UpdateFaqDto / FaqItemEntity
Excluir Item de FAQ	DELETE /faqs/:id (protegido, ADMIN)	void
Criar Notificação	POST /notifications (protegido, ADMIN)	CreateNotificationDto / NotificationEntity
Fluxo Comum/Público		
Health Check	GET /health	{ status: string }
Obter Todos os FAQs	GET /faqs	FaqItemEntity[]
Obter FAQ por ID	GET /faqs/:id	FaqItemEntity
Obter Todas as Ofertas	GET /offers	Offer[]
Obter Notificações do Usuário	GET /notifications/me (protegido)	NotificationEntity[]
Marcar Notificações como Lidas	PATCH /notifications/me/mark-as-read (protegido)	MarkAsReadDto / { count: number }
Marcar Notificação por ID como Lida	PATCH /notifications/:id/mark-as-read (protegido)	NotificationEntity
Excluir Notificação	DELETE /notifications/:id (protegido)	void
Obter Avaliações (com filtros)	GET /reviews	GetReviewsDto / ReviewEntity[]
Esta documentação fornece uma visão clara e detalhada do backend do LimpeJá, facilitando o desenvolvimento, a manutenção e a colaboração da equipe.

Atenciosamente,

Paulo Silas de Campos Filho - Tech Lead

<p align="center">

<a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>

</p>

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

<p align="center">

<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>

<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>

<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>

<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>

<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>

<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>

<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>

<a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>

<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>

<a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>

</p>

<!--[![Backers on Open Collective]]

[![Sponsors on Open Collective]]-->

Description
[Nest] framework TypeScript starter repository.

Project setup
bash

bash

Copiar
$ npm install
Compile and run the project
bash

bash

Copiar
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
Run tests
bash

bash

Copiar
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
Deployment
When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation] for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau], our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

bash

bash

Copiar
$ npm install -g @nestjs/mau
$ mau deploy
With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

Resources
Check out a few resources that may come in handy when working with NestJS:

Visit the [NestJS Documentation] to learn more about the framework.
For questions and support, please visit our [Discord channel].
To dive deeper and get more hands-on experience, check out our official video [courses].
Deploy your application to AWS with the help of [NestJS Mau] in just a few clicks.
Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools].
Need help with your project (part-time to full-time)? Check out our official [enterprise support].
To stay in the loop and get updates, follow us on [X] and [LinkedIn].
Looking for a job, or have a job to offer? Check out our official [Jobs board].
Support
Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here].

Stay in touch
Author - [Kamil Myśliwiec]
Website - [https://nestjs.com]
Twitter - [@nestframework]
License
Nest is [MIT licensed].