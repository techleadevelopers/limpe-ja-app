Documentação Técnica do Frontend do Aplicativo "LimpeJá"
1. Introdução
Este documento técnico detalha a arquitetura e a implementação do frontend do aplicativo "LimpeJá", construído com React Native e Expo. O aplicativo visa conectar clientes a provedores de serviços de limpeza e organização, oferecendo funcionalidades como registro de usuário (cliente/provedor), autenticação, agendamento de serviços, gerenciamento de perfil, chat em tempo real, visualização de ganhos e notificações.

A aplicação segue uma arquitetura modular e baseada em componentes, utilizando o Expo Router para navegação, React Context API para gerenciamento de estado global, e uma camada de serviços para interação com o backend.

2. Visão Geral da Arquitetura do Frontend
O frontend do LimpeJá é estruturado para ser escalável, manutenível e performático, seguindo princípios de arquitetura de software modernos.

Expo Router (app/): Gerencia o roteamento e a navegação entre as telas. A estrutura de pastas reflete as rotas do aplicativo, com layouts (_layout.tsx) definindo grupos de telas e suas configurações de navegação (ex: abas, cabeçalhos). O arquivo app/index.tsx serve como a tela de carregamento inicial da aplicação, exibindo um indicador de atividade enquanto o sistema inicializa. A tela app/+not-found.tsx é responsável por exibir uma mensagem de "Página Não Encontrada" para rotas inválidas, e app/welcome.tsx atua como uma tela de boas-vindas inicial, com animações e redirecionamento automático.
Configuração do Projeto (app.json, eas.json):
app.json: Este arquivo centraliza a configuração do aplicativo Expo, incluindo metadados como name, slug, version, orientation, icon, scheme e userInterfaceStyle. Ele também especifica configurações específicas para iOS (bundleIdentifier, supportsTablet) e Android (package, adaptiveIcon, permissions), além de definir os plugins do Expo utilizados (como expo-router, expo-splash-screen, expo-secure-store, expo-location, expo-image-picker). Crucialmente, a seção extra armazena variáveis públicas, como o projectId do EAS e a backendApiUrl, que é utilizada pela camada de serviços para configurar a URL base da API.
eas.json: Este arquivo define os perfis de build e submissão para o serviço EAS Build do Expo. Ele configura diferentes ambientes (ex: development, apk_direct_test, production), especificando o tipo de build (APK ou AAB), a imagem do ambiente de build (latest) e o tipo de distribuição (internal para testes, store para lojas de aplicativos). Isso garante builds consistentes e automatizados para diferentes propósitos.
Componentes React Native (components/, app/(...)/): Blocos de construção da interface do usuário. São divididos em:
Componentes de UI Reutilizáveis (components/ui/): Elementos básicos e genéricos (inputs, botões, ícones SVG animados, etc.) que podem ser usados em várias telas.
Componentes Específicos de Seção/Tela (app/(...)/components/): Componentes que encapsulam partes maiores da UI ou lógica específica de uma tela.
Gerenciamento de Estado Global (Context API e Hooks):
AuthContext (contexts/AuthContext.tsx, hooks/useAuth.ts): Gerencia o estado de autenticação do usuário (isAuthenticated, user, token). Fornece métodos para signIn, signUp, signOut, e updateUser. Persiste o token JWT e informações básicas do usuário no AsyncStorage.
ProviderRegistrationContext (contexts/ProviderRegistrationContext.tsx): Gerencia o estado transitório durante o processo de registro multi-etapas de provedores, permitindo que os dados sejam compartilhados entre as telas de registro.
AppContext (contexts/AppContext.tsx): Gerencia configurações globais do aplicativo, como preferências de notificação e modo de tema (themeMode, notificationsEnabled).
Camada de Serviços (services/):
Responsável por toda a comunicação com o backend (API RESTful).
Utiliza axios para requisições HTTP, configurado na instância api.ts.
Cada arquivo de serviço (bookingService.ts, clientService.ts, earningService.ts, faqService.ts, notificationService.ts, offerService.ts, paymentService.ts, providerService.ts, reviewService.ts, uploadService.ts, verificationService.ts, etc.) agrupa funções relacionadas a uma entidade ou funcionalidade do backend.
Lida com a passagem do token de autenticação (JWT) para requisições protegidas via interceptors.
Tipagem (types/):
Interfaces TypeScript (.ts files) que espelham os DTOs e modelos do backend, garantindo segurança de tipo em todo o frontend. Isso inclui tipos para autenticação (auth.ts), agendamentos (bookings.ts), chat (chat.ts), clientes (clients.ts), FAQs (faqs.ts), notificações (notifications.ts), ofertas (offers.ts), pagamentos (payments.ts), provedores (providers.ts), avaliações (reviews.ts), serviços (services.ts), upload (upload.ts), usuários (users.ts) e verificação (verification.ts).
Estilização (constants/Colors.ts, constants/theme.ts, StyleSheet.create):
Utiliza StyleSheet.create para definir estilos.
Cores e dimensões são centralizadas em Colors.ts (para temas claro/escuro) e theme.ts (para tamanhos de fonte, espaçamentos, etc.), promovendo consistência visual.
Platform.select é usado para estilos específicos de iOS/Android.
Animações (Animated, react-native-reanimated, expo-linear-gradient, expo-blur, react-native-svg):
A API Animated do React Native é amplamente utilizada para criar transições suaves, efeitos de entrada/saída, feedback de toque e carregamento.
react-native-reanimated é empregado para animações mais complexas e performáticas.
expo-linear-gradient e expo-blur são usados para efeitos visuais modernos como o glassmorphism.
react-native-svg é utilizado para renderizar ícones e gráficos complexos de forma programática.
Utilitários (utils/helpers.ts, utils/permissions.ts, utils/storage.ts): Funções auxiliares para formatação de dados (datas, telefones), validações comuns, gerenciamento de permissões do dispositivo e operações de armazenamento local via AsyncStorage.
Testes (app.controller.spec.ts, test-connection.tsx):
app.controller.spec.ts é um exemplo de teste unitário básico.
test-connection.tsx é uma tela utilitária para testar a conectividade com o backend e os fluxos de autenticação/registro diretamente do aplicativo.
3. Componentes de UI Reutilizáveis (components/ui/)
Estes componentes formam a base da interface do usuário, promovendo a consistência visual e a reutilização de código.

StandardInput.tsx:
Propósito: Um campo de entrada de texto padrão com rótulo e mensagem de erro.
Props: label, errorMessage?, containerStyle?, animationDelay?, e todas as TextInputProps nativas.
Estado/Lógica: Utiliza Animated.Value e useEffect para uma animação de entrada (fade-in e slide-up) com um delay configurável.
Estilo: StyleSheet.create para estilos base, com Platform.select para sombras específicas de cada OS.
InputWithIcon.tsx:
Propósito: Um campo de entrada de texto com um ícone à esquerda, rótulo e mensagem de erro.
Props: label, iconName, errorMessage?, containerStyle?, rightComponent?, animationDelay?, e TextInputProps.
Estado/Lógica: Similar ao StandardInput para animação de entrada. O rightComponent permite adicionar elementos como um botão de "mostrar senha".
Estilo: flexDirection: 'row', alignItems: 'center' para alinhar ícone e input.
DatePickerInput.tsx:
Propósito: Um componente de entrada de data que abre um seletor de data nativo.
Props: label, value? (Date), onChange, errorMessage?, maximumDate?, animationDelay?.
Estado/Lógica: showDatePicker (useState) controla a visibilidade do DateTimePicker. onDateChange atualiza o value e esconde o seletor (automaticamente no Android, precisa ser manual no iOS). Animação de entrada similar aos outros inputs.
Dependências: @react-native-community/datetimepicker, @expo/vector-icons (Ionicons).
SectionHeader.tsx:
Propósito: Um cabeçalho estilizado para seções do formulário.
Props: title, animationDelay?.
Estado/Lógica: Animação de entrada (fade-in e slide-up).
AnimatedErrorMessage.tsx:
Propósito: Exibir mensagens de erro com uma animação suave de fade-in/slide-in quando aparecem.
Props: message, isVisible.
Estado/Lógica: Animated.Value e useEffect para controlar a opacidade e translação Y com base na prop isVisible.
ToastMessage.tsx:
Propósito: Exibir mensagens de feedback temporárias (sucesso, erro, info) na parte superior da tela.
Props: message, type, onHide.
Estado/Lógica: Utiliza Animated para animações de slide-in/out. useEffect para controlar o tempo de exibição e chamar onHide.
Dependências: react-native-toast-message (inferido, mas o código fornecido é um componente customizado para o Toast).
ServiceItemSkeleton.tsx:
Propósito: Componente de placeholder para exibir um estado de carregamento (esqueleto) para itens de serviço em listas.
Props: delay?.
Estado/Lógica: Animação de "shimmer" (translateX em loop) e animação de fade-in para o próprio esqueleto.
Dependências: expo-linear-gradient.
StarRating.tsx:
Propósito: Exibir uma avaliação em formato de estrelas (preenchidas, meio-preenchidas, vazias).
Props: rating, size?, color?.
Lógica: Mapeia o valor da rating para renderizar ícones de estrela (Ionicons).
InfoChip.tsx:
Propósito: Exibir pequenas informações em formato de "chip" com ícone e texto.
Props: iconName, text.
Dependências: @expo/vector-icons (Ionicons).
ReviewCard.tsx:
Propósito: Exibir uma única avaliação de serviço.
Props: review (do tipo ProviderReview).
Lógica: Renderiza o nome do avaliador, avatar, rating (usando StarRating), comentário e data.
Dependências: @expo/vector-icons (Ionicons), StarRating.
InfoIcon.tsx:
Propósito: Ícone de informação estilizado com animação.
Props: size?, color?, animationTrigger.
Lógica: Utiliza react-native-svg para desenhar o ícone e react-native-reanimated (useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing) para animar a escala do ícone. Inclui sombras e gradientes.
EyeIcon.tsx:
Propósito: Ícone de olho (usado para visibilidade de senha, por exemplo) com animação.
Props: size?, color?, animationTrigger.
Lógica: Desenha o olho e a pupila com react-native-svg. A pupila possui uma animação de escala (pupilScale) usando react-native-reanimated para simular um piscar ou foco.
CheckmarkIcon.tsx:
Propósito: Ícone de marca de verificação com animação de traçado.
Props: size?, color?, animationTrigger.
Lógica: Desenha o caminho do checkmark com react-native-svg. A animação (dashOffset) usa react-native-reanimated (useAnimatedProps, withTiming) para simular o desenho da marca de verificação.
Bubble.tsx:
Propósito: Componente para renderizar bolhas animadas de fundo, criando um efeito visual dinâmico.
Props: size, initialX, initialY, animationDelay, animationDuration, color1, color2, motionOffset, yOffsetAmplitude.
Lógica: Utiliza react-native-reanimated (translateX, translateY, scale, opacity, wobbleY) para criar movimentos complexos (flutuação, escala, opacidade) e expo-linear-gradient para o preenchimento da bolha.
XMarkIcon.tsx:
Propósito: Ícone de "X" (fechar, cancelar) com animação de rotação.
Props: size?, color?, animationTrigger.
Lógica: Desenha duas barras cruzadas com react-native-svg. A animação (rotation) usa react-native-reanimated para girar o ícone continuamente.
SliderPickerIcon.tsx:
Propósito: Ícone que simula um slider ou seletor de valor com um "polegar" deslizante.
Props: size?, color?, animationTrigger.
Lógica: Desenha uma barra e um círculo (polegar) com react-native-svg. O polegar possui uma animação de translação (thumbTranslateX) usando react-native-reanimated para simular o movimento de um slider.
RightArrowIcon.tsx:
Propósito: Ícone de seta para a direita com animação de pulsação.
Props: size?, color?, animationTrigger.
Lógica: Desenha a forma da seta com react-native-svg. A animação (translateX) usa react-native-reanimated para mover a seta ligeiramente para a direita e para a esquerda, simulando um "empurrão".
ProgressCircleIcon.tsx:
Propósito: Ícone de círculo de progresso com animação de preenchimento.
Props: size?, color?, animationTrigger, progress?.
Lógica: Desenha um círculo com react-native-svg e anima seu strokeDashoffset com react-native-reanimated para representar o progresso de 0 a progress (padrão 0.75).
4. Fluxos e Módulos Principais
4.1. Fluxo de Autenticação e Registro (app/(auth)/)
Este é o ponto de entrada para novos e existentes usuários, gerenciando o registro, login e recuperação de senha.

app/_layout.tsx: O layout raiz da aplicação. Ele envolve todo o aplicativo com AuthProvider, ProviderRegistrationProvider e AppProvider, garantindo que os contextos de autenticação, registro de provedor e configurações globais estejam disponíveis para todas as telas. A lógica de redirecionamento inicial (para welcome, login ou dashboard do usuário autenticado) é gerenciada aqui, usando useAuth e AsyncStorage para verificar o status de autenticação e se a tela de boas-vindas já foi vista.
app/index.tsx: A tela de entrada padrão da aplicação. Exibe um ActivityIndicator e uma mensagem "Iniciando Limpejá...", servindo como um splash screen funcional enquanto o _layout.tsx decide para onde redirecionar o usuário.
app/welcome.tsx: A tela de boas-vindas inicial do aplicativo. Apresenta o logo com animações de escala e reflexo (react-native-reanimated, expo-linear-gradient), criando uma experiência visual envolvente. Após um período de tempo definido, ela define uma flag no AsyncStorage (WELCOME_SCREEN_VIEWED_KEY) e redireciona automaticamente o usuário para a tela de login.
app/+not-found.tsx: Uma tela padrão exibida quando uma rota não é encontrada. Contém uma mensagem de erro e um link para retornar à tela inicial.
app/(auth)/_layout.tsx:
Propósito: Define o layout e as opções de navegação para todas as telas do fluxo de autenticação.
Navegação: Utiliza Stack.Screen para cada rota, com headerShown: false para login e provider-register (indicando que essas telas gerenciam seus próprios cabeçalhos ou são parte de um fluxo maior).
app/(auth)/login.tsx:
Propósito: Tela de login de usuário.
Estado: username (email), password, showPassword, isLoading, generalError.
Lógica:
useEffect: Redireciona o usuário para o dashboard apropriado (/(client)/explore ou /(provider)/dashboard) se já estiver autenticado (isAuthenticated). Também gerencia animações de entrada.
validateInputs: Validação básica de campos.
handleLogin: Chama useAuth().signIn({ email, password }). O signIn do AuthContext é responsável por fazer a chamada à API de login do backend (authService.login), armazenar o token JWT e o perfil do usuário no AsyncStorage, e atualizar o estado global de autenticação.
Interação com useAuth: É o consumidor primário do signIn do AuthContext.
Animações: Animações de entrada para elementos principais, e feedback de toque para botões (createButtonAnimations).
Dependências: useAuth, expo-router, AsyncStorage, jwt-decode, @expo/vector-icons (Ionicons).
app/(auth)/register-options.tsx:
Propósito: Permite ao usuário escolher se deseja se registrar como "Cliente" ou "Profissional".
Navegação: router.push para /(auth)/client-register ou /(auth)/provider-register.
Animações: Animações escalonadas de entrada para logo, títulos e botões, criando uma experiência visual agradável. Feedback de toque para botões.
Dependências: expo-router, @expo/vector-icons (Ionicons, MaterialCommunityIcons).
app/(auth)/client-register.tsx:
Propósito: Tela de registro multi-etapas para clientes.
Estado: currentStep, username (fullName), email, password, phone, cep, street, number, neighborhood, city, state, isLoading, generalError.
Lógica:
validateStep1, validateStep2: Validações de campos para cada etapa.
handleNext: Avança para a próxima etapa após validação da etapa atual.
handleSignUp: No final da Etapa 2, chama useAuth().signUpClient(registerData). O signUpClient do AuthContext é responsável por enviar os dados de registro (incluindo RegisterClientDto com CreateAddressDto aninhado) para o backend (authService.registerClient), processar a resposta de autenticação e persistir a sessão.
Interação com useAuth: Consumidor do signUpClient.
Animações: Animações de entrada e feedback de toque.
Dependências: useAuth, expo-router, @expo/vector-icons (Ionicons), RegisterClientDto, CreateAddressDto.
app/(auth)/provider-register/layout.tsx:
Propósito: Define o layout e o contexto para as telas de registro de provedor.
Contexto: Envolve as telas com ProviderRegistrationProvider, que fornece o ProviderRegistrationContext para gerenciar o estado do formulário multi-etapas.
app/(auth)/provider-register/index.tsx:
Propósito: Tela principal de registro de provedor (Etapa 1 e 2).
Estado: username, email, password, cpf, dateOfBirth, cep, street, number, neighborhood, city, state, isLoading, isSubmitting, generalError, e estados para detalhes do serviço (Etapa 3) que são preenchidos por service-details.tsx.
Lógica:
formatDateForDisplay: Utilitário para formatar a data de nascimento (DD/MM/AAAA).
pureValidateStep1, pureValidateStep2: Validações de campos para as etapas 1 e 2.
handleNext:
Na Etapa 1: Valida campos pessoais e avança para a Etapa 2 (endereço).
Na Etapa 2: Valida campos de endereço. Chama useAuth().signUpProvider(providerData) para registrar o provedor no backend (authService.registerProvider). Após sucesso, avança para a Etapa 3 (service-details.tsx).
Na Etapa 3: Chama handleServiceDetailsSubmit (que é a lógica da Etapa 3).
handleServiceDetailsSubmit: (Lógica principal da Etapa 3, que também está em service-details.tsx). Valida os detalhes do serviço, simula o upload do avatar (uploadService.uploadImageToCloud), salva os dados no ProviderRegistrationContext (setServiceDetails), e chama submitRegistration() do ProviderRegistrationContext para enviar todos os dados (pessoais, endereço, serviço) para o backend.
Interação com Contextos/Hooks: Consumidor de useAuth().signUpProvider e useProviderRegistration().
Animações: Animações de entrada escalonadas, feedback de toque, e animações para o avatar (onPressInAvatar, onPressOutAvatar).
Simulações: mockFirebaseStorageApi para upload de imagens (no código real, uploadService é usado).
Dependências: useAuth, useProviderRegistration, expo-router, @expo/vector-icons, expo-image-picker.
app/(auth)/provider-register/personal-details.tsx:
Propósito: Etapa 2 do registro de provedor (dados pessoais e endereço). Este arquivo parece ser uma versão mais modularizada da Etapa 1 e 2 do index.tsx do provider-register.
Componentes de UI: Utiliza InputWithIcon, StandardInput, DatePickerInput, SectionHeader (componentes de UI reutilizáveis).
Lógica:
handleCpfChange, handleTelefoneChange, handleCepChange: Funções para formatar inputs.
fetchAddressFromCep: Simula a busca de endereço por CEP (mockViaCepApi).
validateForm: Validação completa de todos os campos da tela.
handleNext: Salva os dados no ProviderRegistrationContext (setPersonalDetails) e navega para service-details.
Interação com Contexto: Consumidor de useProviderRegistration().setPersonalDetails.
Animações: Animações de entrada escalonadas para cada input.
Simulações: mockViaCepApi.
app/(auth)/provider-register/service-details.tsx:
Propósito: Etapa 3 do registro de provedor (detalhes do serviço).
Estado: experiencia, descricaoTrabalho, estruturaPreco, areasAtendimento, anosExperiencia, pixKey, avatarUri, avatarUrl, e estados de erro.
Componentes de UI: Utiliza InputWithIcon (customizado para esta tela), ErrorMessage.
Lógica:
handlePickImage: Permite selecionar uma imagem da galeria (expo-image-picker) para o avatar.
handleAreasAtendimentoChange, handleSelectAreaSuggestion: Lógica para sugestões de áreas de atendimento (mockadas).
validateForm: Validação de todos os campos do serviço.
handleFinalRegister:
Upload de Avatar: Se avatarUri estiver presente e avatarUrl não, chama uploadService.uploadImageToCloud para simular o upload e obter a URL final.
Salvar no Contexto: Salva os dados do serviço no ProviderRegistrationContext (setServiceDetails).
Submissão Final: Chama submitRegistration() do ProviderRegistrationContext. Este método é crucial, pois ele reúne todos os dados (pessoais, endereço, serviço) e os envia para o backend para o registro final do provedor, tipicamente via providerService.updateMyProviderProfile após o registro inicial.
Feedback e Redirecionamento: Exibe um Alert de sucesso e redireciona para o dashboard do provedor.
Interação com Contextos/Hooks: Consumidor de useProviderRegistration(), useAuth().setIsRegistrationInProgress.
Simulações: uploadService.uploadImageToCloud.
Dependências: useProviderRegistration, useAuth, expo-router, @expo/vector-icons, expo-image-picker.
app/(auth)/verify-account.tsx:
Propósito: Tela para o provedor passar pelo processo de verificação de conta (CPF, documento, selfie).
Estado: currentVerificationStep, cpf, documentPhotoFront, selfieWithDocument, isLoading, generalError.
Lógica:
pickImage, takePhoto: Funções para selecionar imagem da galeria ou tirar foto com a câmera (expo-image-picker).
validateStep1, validateStep2, validateStep3: Validações para cada etapa da verificação.
handleNextVerificationStep:
Fluxo Sequencial: Avança pelas etapas de verificação.
Integração com Backend: Chama verificationService.submitCpf, verificationService.uploadDocumentPhoto e verificationService.uploadSelfie para interagir com o backend. Em um ambiente real, essas chamadas atualizariam o verificationStatus do provedor no backend.
Redirecionamento: Após a submissão final, redireciona para o dashboard do provedor.
Simulações: verificationService.
Animações: Animações de entrada e feedback de toque.
Dependências: expo-router, @expo/vector-icons, expo-image-picker.
app/(auth)/forgot-password.tsx:
Propósito: Tela para solicitar redefinição de senha.
Estado: email, isLoading, message, isSuccess.
Lógica:
handleResetPassword: Valida o email e chama authService.forgotPassword(email) para enviar a solicitação de redefinição.
Dependências: expo-router, @expo/vector-icons.
app/(auth)/test-connection.tsx:
Propósito: Utilitário de desenvolvimento para testar a conectividade com o backend e os fluxos de autenticação/registro diretamente do aplicativo.
Estado: Vários estados para dados de teste (testEmail, testPassword, etc.), loading, response, error, currentJwt, currentUserInfo.
Lógica:
makeRequest: Função genérica para fazer requisições axios ao backend, incluindo o cabeçalho Authorization com o JWT.
testRegisterClient, testRegisterProvider, testLogin, testForgotPassword, testGetProfile, testLogout: Funções que chamam makeRequest com os dados e caminhos apropriados.
JWT Handling: Armazena e recupera o JWT do AsyncStorage e decodifica-o (jwt-decode) para exibir informações do usuário.
Dependências: axios, AsyncStorage, jwt-decode, LoginDto, RegisterClientDto, RegisterProviderDto, ForgotPasswordDto, AuthResponseDto, MessageResponseDto.
4.2. Fluxo de Cliente e Exploração (app/(client)/explore/)
Este fluxo permite aos usuários clientes explorar serviços, provedores e ofertas disponíveis.

app/(client)/_layout.tsx:
Propósito: Define o layout de abas (tabs) para o cliente, incluindo ícones e títulos para cada aba (explore, bookings, messages, profile).
Navegação: Utiliza Tabs.Screen para cada aba.
app/(client)/explore/index.tsx:
Propósito: Tela principal de exploração para clientes. Agrega e exibe diversas informações.
Estado: userProfile, serviceCategories, recommendations, providers, currentOffer, loading, error.
Lógica:
fetchData: Função assíncrona que orquestra a busca de todos os dados necessários:
clientService.getUserProfile(): Obtém o perfil do usuário logado (cliente ou provedor).
clientService.getServiceCategories(): Busca as categorias de serviço.
providerService.getRecommendedProviders(): Busca provedores recomendados.
providerService.getNearbyProviders(): Busca provedores próximos.
offerService.getOffers(): Busca ofertas ativas.
Animações: Animações escalonadas de entrada para HeaderSuperior, Categorias, BannerOferta, Recomendações e Prestadores, e NavBar.
handleCategoryPress: Navega para category-details com id e name da categoria.
handleProviderPress: Navega para provider-details com o id do provedor.
Interação com Serviços: Consumidor de clientService, providerService, offerService.
Componentes de UI: HeaderSuperior, NavBar, CategoriaCard, SecaoContainer, SecaoPrestadores, SecaoRecomendacoes, PrestadorCard, RecomendacaoCard, BannerOferta.
Dependências: expo-router, useAuth, clientService, providerService, offerService, UserProfile, Service, ProviderDisplayInfo, Offer.
app/(client)/explore/components/home/HeaderSuperior.tsx:
Propósito: O cabeçalho superior da tela de exploração, exibindo saudação, endereço do usuário e barra de busca.
Props: userName, userAddress.
Lógica:
formattedAddress: Formata o objeto userAddress em uma string legível.
handleProfilePress, handleMenuPress: Navegação para perfil e menu lateral.
handleSearchSubmit: Lida com a submissão da busca, navegando para search-results.
Animação: Efeito de reflexo (reflexTranslateX, reflexTranslateY, reflexRotate) usando react-native-reanimated para um visual dinâmico.
Dependências: expo-router, react-native-reanimated, expo-linear-gradient, @expo/vector-icons (Ionicons).
app/(client)/explore/components/home/NavBar.tsx:
Propósito: Barra de navegação inferior personalizada.
Props: unreadMessagesCount?.
Lógica: Mapeia navItems para criar botões de navegação. isRouteActive verifica a rota atual. Suporta ícones Ionicons, MaterialCommunityIcons e imagens customizadas (para o botão central).
Dependências: expo-router, @expo/vector-icons (Ionicons, MaterialCommunityIcons), react-native-safe-area-context.
app/(client)/explore/components/home/CategoriaCard.tsx:
Propósito: Exibir um cartão para cada categoria de serviço.
Props: item (ServiceDetailsDto), onPress.
Lógica: getIconSource mapeia o nome do ícone (do backend) para o require da imagem local. Animação de escala ao toque.
Dependências: expo-linear-gradient, expo-blur.
app/(client)/explore/components/home/SecaoContainer.tsx:
Propósito: Um componente genérico para encapsular seções de lista horizontal (ou vertical) com um título e um botão "Ver tudo".
Props: titulo, data, renderItem, onVerTudoPress?, horizontal?.
Lógica: Utiliza FlatList para renderização eficiente. Inclui validação defensiva para data e item para evitar erros de renderização.
Dependências: FlatList, @expo/vector-icons (Ionicons).
app/(client)/explore/components/home/SecaoRecomendacoes.tsx / SecaoPrestadores.tsx:
Propósito: Componentes específicos para seções de provedores, com título e botão "Ver Tudo".
Props: titulo, data (ProviderDisplayInfo[]), onVerTudoPress, renderItem.
Lógica: Similares ao SecaoContainer, mas adaptados para provedores.
app/(client)/explore/components/home/RecomendacaoCard.tsx:
Propósito: Exibir um cartão de provedor em seções de recomendação, com foco na avaliação e preço.
Props: item (ProviderDisplayInfo).
Lógica: renderStars para exibir estrelas de avaliação. handleCardPress navega para os detalhes do provedor. Formata averagePrice e shortBio.
Dependências: expo-router, @expo/vector-icons (Ionicons).
app/(client)/explore/components/home/PrestadorCard.tsx:
Propósito: Exibir um cartão de provedor em seções de prestadores próximos, com foco na especialidade e status de verificação.
Props: item (ProviderDisplayInfo), onPress.
Lógica: renderStars para avaliação. Exibe specialtyName (do primeiro serviço oferecido) e servicePrice. Badge de "Verificado" com base em verificationStatus.
Animações: Animação de fade-in e slide-up para o card.
Dependências: expo-router, @expo/vector-icons (Ionicons).
app/(client)/ofertas/components/BannerOferta.tsx:
Propósito: Exibir um banner promocional.
Props: id, title, description, imageUrl, discountPercentage, onPress, e outras props de personalização.
Lógica: Animação de escala ao toque.
Dependências: expo-router, @expo/vector-icons (Ionicons).
app/(client)/explore/[providerId].tsx:
Propósito: Tela de detalhes de um provedor específico.
Estado: provider, isLoading, error.
Lógica:
useEffect: Busca os detalhes do provedor usando providerService.getProviderDetails(providerId).
Tratamento de estados de carregamento e erro.
Animações: Animações de entrada para o cabeçalho (HeaderSection) e o conteúdo principal.
Interação com Serviços: Consumidor de providerService.getProviderDetails.
Componentes de UI: HeaderSection, StarRating, InfoChip, ActionButtons, ReviewCard, BookServiceButton.
Dependências: expo-router, @expo/vector-icons (Ionicons), providerService, ProviderDisplayInfo, ProviderReview, VerificationStatus.
app/(client)/explore/components/provider/HeaderSection.tsx:
Propósito: Cabeçalho da tela de detalhes do provedor, exibindo a imagem de fundo do provedor e botões de navegação.
Props: provider (ProviderDetails), onBackPress.
Estilo: Utiliza ImageBackground e StyleSheet.absoluteFillObject para o overlay.
app/(client)/explore/components/provider/BookServiceButton.tsx:
Propósito: Botão flutuante na parte inferior da tela de detalhes do provedor para agendar um serviço.
Props: providerId, serviceId?, router, bookNowButtonAnim.
Lógica: Navega para a tela de agendamento (schedule-service), passando providerId e serviceId. Animação de slide-up e fade-in.
Dependências: expo-linear-gradient, react-native-safe-area-context.
app/(client)/explore/components/provider/DetailsContent.tsx:
Propósito: Exibir os serviços oferecidos por um provedor e sua biografia.
Props: provider (ProviderDetails).
Lógica: Mapeia providerServices para exibir nome, descrição e preço de cada serviço.
app/(client)/explore/components/provider/OverviewContent.tsx:
Propósito: Exibir uma visão geral do provedor, incluindo avaliação, chips de informação, biografia e avaliações recentes.
Props: provider (ProviderDisplayInfo).
Lógica: Reutiliza StarRating, InfoChip, ActionButtons, ReviewCard.
app/(client)/explore/components/provider/ActionButtons.tsx:
Propósito: Botões de ação rápida (Ligar, Chat, Mapa, Compartilhar) no perfil do provedor.
Props: providerPhone?, providerUserId?, providerAddress?.
Lógica: Utiliza Linking para abrir o discador de telefone ou aplicativos de mapa. Simula as funcionalidades de chat e compartilhamento.
Dependências: @expo/vector-icons (Ionicons), Linking.
app/(client)/explore/search-results.tsx:
Propósito: Exibir resultados de busca.
Lógica: Recebe parâmetros de busca (query, location, date) via useLocalSearchParams. Atualmente, exibe mock data.
app/(client)/explore/servicos-por-categoria.tsx:
Propósito: Exibir serviços filtrados por uma categoria específica.
Lógica: Recebe categoriaId e categoriaNome via useLocalSearchParams.
app/(client)/explore/todas-categorias.tsx:
Propósito: Tela para listar todas as categorias de serviço.
app/(client)/explore/todos-prestadores-proximos.tsx:
Propósito: Tela para listar todos os prestadores próximos.
app/(client)/explore/resultados-busca.tsx:
Propósito: Tela para exibir resultados de busca (duplicidade com search-results.tsx).
4.3. Fluxo de Agendamentos (app/(client)/bookings/)
Gerencia a visualização e criação de agendamentos para clientes.

app/(client)/bookings/_layout.tsx:
Propósito: Define o layout para as telas de agendamento.
app/(client)/bookings/schedule-service.tsx: (Não fornecido, mas inferido como a tela para iniciar um novo agendamento)
Interação: Receberia providerId e serviceId de BookServiceButton. Utilizaria bookingService.createBooking para criar um novo agendamento e paymentService.createPixCharge para iniciar o processo de pagamento via PIX.
app/(client)/bookings/index.tsx: (Não fornecido, mas inferido como a tela que lista os agendamentos do cliente)
Interação: Listaria os agendamentos do cliente, provavelmente usando bookingService.getBookingsForUser.
4.4. Fluxo de Mensagens/Chat (app/(client)/messages/, app/(provider)/messages/)
Permite a comunicação em tempo real entre clientes e provedores.

app/(client)/messages/index.tsx:
Propósito: Lista de conversas do cliente.
Estado: conversations, isLoading.
Lógica:
useEffect: Simula o carregamento de conversas (MOCK_CONVERSATIONS) e as ordena por timestamp.
handleConversationPress: Navega para a tela de chat individual ([chatId].tsx), passando chatId, recipientName, recipientId, recipientAvatarUrl.
Animações: Animações de entrada escalonadas para cada item da conversa.
Componentes de UI: AnimatedConversationItem.
app/(client)/messages/[chatId].tsx:
Propósito: Tela de chat individual.
Estado: messages, inputText, isLoading.
Lógica:
useEffect:
Carregamento Inicial: Chama chatService.getChatMessages(chatId) para carregar o histórico.
Conexão WebSocket: Conecta-se ao servidor WebSocket (socket.io-client) usando o token do usuário para autenticação.
socket.on('connect'): Emite joinChat para entrar na sala de chat.
socket.on('receiveMessage'): Adiciona novas mensagens ao estado, rola a lista para o final.
handleSendMessage:
Se o WebSocket estiver conectado, emite sendMessage via socket.
Caso contrário, envia a mensagem via API REST (chatService.sendMessage).
renderMessage: Renderiza cada balão de mensagem, diferenciando mensagens do usuário logado.
Interação com Serviços: Consumidor de chatService.getChatMessages, chatService.sendMessage.
Dependências: socket.io-client, useAuth, chatService, Message, GetMessagesQuery, SendMessageDto.
app/(provider)/messages/index.tsx:
Propósito: Lista de conversas do provedor.
Lógica: Similar à versão do cliente, mas com MOCK_CONVERSATIONS para provedores.
app/(provider)/messages/[chatId].tsx:
Propósito: Tela de chat individual para provedores.
Lógica: Atualmente um placeholder, mas reutilizaria a lógica da tela de chat do cliente.
4.5. Fluxo de Perfil e Configurações (app/(client)/profile/, app/(common)/, app/(provider)/profile/)
Gerencia as informações do usuário, configurações do aplicativo e documentos legais.

app/(client)/profile/index.tsx:
Propósito: Tela de perfil do cliente.
Lógica: Exibe informações do usuário (name, email, phone, avatarUrl).
handleLogout: Chama useAuth().signOut() para deslogar o usuário.
handleWIP: Alerta para funcionalidades em desenvolvimento.
Animações: Animações de entrada para o cabeçalho e itens de menu. Feedback de toque para avatar e itens de menu.
Componentes de UI: AnimatedMenuItem.
app/(client)/profile/edit.tsx:
Propósito: Tela para editar o perfil do cliente.
Estado: name, email, address, phone, avatarUri, isLoading, isUploadingAvatar, e estados de erro.
Lógica:
handlePickImage: Permite selecionar uma nova imagem de perfil (expo-image-picker).
handleSaveChanges: Valida os campos (name, phone, address), chama clientService.updateClientProfile(updateData) para enviar as alterações ao backend, e updateUser() do useAuth para atualizar o estado global. O upload da imagem é feito via uploadService.uploadImageToCloud.
handlePhoneChange: Formata o número de telefone.
Animações: Animações de entrada, feedback de toque, e animação de borda para inputs com erro.
Interação com Serviços: Consumidor de clientService.updateClientProfile, uploadService.uploadImageToCloud.
Interação com useAuth: Consumidor de updateUser.
Dependências: useAuth, expo-router, @expo/vector-icons, expo-image-picker, UserProfile, BookingAddress, UpdateClientProfileDto, formatDate, isValidPhoneNumber, formatPhoneNumber (de utils/helpers).
app/(common)/_layout.tsx:
Propósito: Define o layout para telas "comuns" (settings, help, notifications, feedback).
app/(common)/settings.tsx:
Propósito: Tela de configurações do aplicativo.
Estado: notificationsEnabled, darkModeEnabled (do AppContext).
Lógica:
handleToggleNotifications: Atualiza notificationsEnabled no AppContext e simula integração com push notifications.
handleToggleDarkMode: Chama toggleTheme() do AppContext para mudar o tema.
openURL: Abre links externos (Linking).
Exibe a versão do aplicativo (Constants.expoConfig).
Interação com Contextos: Consumidor de useAppContext().
Componentes de UI: AnimatedSettingSwitchItem, AnimatedSettingNavigationItem.
Dependências: useAppContext, expo-router, @expo/vector-icons, expo-constants, Linking.
app/(common)/help.tsx:
Propósito: Central de ajuda com Perguntas Frequentes (FAQ) e opções de contato.
Estado: searchTerm, faqs, isLoadingFaqs.
Lógica:
loadFaqs: Busca FAQs do backend usando faqService.getFaqs().
filteredFaqs: useMemo para filtrar FAQs com base no searchTerm.
handleContactSupportEmail, handleContactSupportPhone: Utiliza Linking para iniciar e-mail ou chamada.
Interação com Serviços: Consumidor de faqService.getFaqs.
Componentes de UI: AnimatedFaqItem, AnimatedContactButton.
Dependências: expo-router, @expo/vector-icons, Linking.
app/(common)/privacidade.tsx:
Propósito: Exibir a Política de Privacidade do aplicativo.
Conteúdo: Texto estático com informações sobre coleta, uso, compartilhamento e segurança de dados, e direitos do usuário.
app/(common)/termos.tsx:
Propósito: Exibir os Termos de Serviço do aplicativo.
Conteúdo: Texto estático detalhando os termos de uso da plataforma.
app/(common)/feedback/[targetId].tsx:
Propósito: Tela genérica para o usuário enviar feedback ou avaliação (para serviço, provedor, ou app).
Parâmetros: targetId, type, serviceName?, providerName?, providerId? via useLocalSearchParams.
Estado: rating, comment, isLoading.
Lógica:
handleSubmitFeedback: Valida os campos (estrelas, comentário). Obtém userId do useAuth(). Chama reviewService.submitFeedback(feedbackData) para enviar o feedback ao backend.
Interação com Serviços: Consumidor de reviewService.submitFeedback.
Interação com useAuth: Consumidor de user.id.
Componentes de UI: StarRating (customizado para feedback), TextInput.
Dependências: expo-router, @expo/vector-icons, useAuth, reviewService, SubmitReviewDto.
app/(common)/notifications.tsx:
Propósito: Lista de notificações do usuário.
Estado: notifications, isLoading, isRefreshing.
Lógica:
loadNotifications: Busca notificações do backend (notificationService.getNotifications()).
handleNotificationPress: Marca a notificação como lida (notificationService.markNotificationAsRead()) e navega para item.navigateTo.
handleMarkAllAsRead: Marca todas as notificações como lidas (notificationService.markAllNotificationsAsRead()).
formatNotificationTimestamp: Formata o timestamp da notificação.
getNotificationIcon: Retorna o ícone e a cor com base no tipo de notificação.
Interação com Serviços: Consumidor de notificationService.
Componentes de UI: AnimatedNotificationItem.
Dependências: expo-router, @expo/vector-icons (Ionicons, MaterialCommunityIcons), useAuth, notificationService, NotificationEntity.
app/(provider)/_layout.tsx:
Propósito: Define o layout de abas (tabs) para o provedor, incluindo ícones e títulos para cada aba (dashboard, schedule, services, earnings, messages, profile).
app/(provider)/dashboard.tsx:
Propósito: Tela principal do painel do provedor, exibindo um resumo de informações importantes.
Estado: dashboardData, upcomingServices, isLoading, isRefreshing.
Lógica:
fetchData: Busca dashboardData (providerService.getMyProviderDashboard()) e upcomingServices (solicitações pendentes e confirmadas via bookingService.getBookingsForUser()).
handleAcceptRequest, handleRejectRequest: Atualiza o status do agendamento (bookingService.updateBookingStatus()).
handleChatWithClient: Navega para a tela de chat (/(provider)/messages/[chatId]).
Interação com Serviços: Consumidor de providerService, bookingService, chatService.
Componentes de UI: DashboardHeader, FinancialSummaryCard, QuickActionsSection, RequestItem, ConfirmedServiceItem, LogoutSection.
Dependências: useAuth, expo-router, @expo/vector-icons, providerService, bookingService, chatService, BookingDetails, BookingStatus, ProviderDashboard, ProviderReview.
app/(provider)/components/dashboard/DashboardHeader.tsx:
Propósito: Cabeçalho do dashboard do provedor.
Props: providerName, avatarUrl, onProfilePress.
Lógica: Exibe saudação dinâmica, nome do provedor e avatar.
app/(provider)/components/dashboard/FinancialSummaryCard.tsx:
Propósito: Exibir um resumo dos ganhos do provedor.
Props: totalEarnings, pendingWithdrawals, onViewEarnings.
Lógica: Formata valores monetários. Animação de escala ao toque para o botão "Gerenciar Ganhos".
app/(provider)/components/dashboard/QuickActionsSection.tsx:
Propósito: Exibir botões de ação rápida para funcionalidades comuns.
Props: actions (lista de QuickActionItem), isLoading.
Lógica: Mapeia actions para renderizar AnimatedQuickActionButton. Inclui esqueleto de carregamento.
app/(provider)/components/dashboard/AnimatedQuickActionButton.tsx:
Propósito: Botão de ação rápida com animações de entrada e feedback de toque.
Props: label, iconName, onPress, delay, iconType?.
app/(provider)/components/dashboard/ProviderOverviewSection.tsx:
Propósito: Seção de visão geral do provedor no dashboard, incluindo solicitações pendentes, próximos serviços e link para mensagens.
Props: upcomingServices, onServicePress, onViewAllServicesPress, onViewAllMessagesPress, onAcceptRequest, onRejectRequest, onChatWithClient, unreadMessagesCount?.
Lógica: Filtra upcomingServices em pendingRequests e confirmedUpcomingServices.
Componentes de UI: RequestItem, ConfirmedServiceItem.
app/(provider)/components/dashboard/RequestItem.tsx:
Propósito: Exibir uma única solicitação de serviço pendente.
Props: item (BookingDetails), onAccept?, onReject?, onDetails, onChat?.
Lógica: Exibe detalhes do serviço, cliente, preço, data/hora, endereço. Botões de "Aceitar", "Recusar", "Detalhes" e "Chat". Animação de entrada e feedback de toque.
app/(provider)/components/dashboard/ConfirmedServiceItem.tsx:
Propósito: Exibir um único serviço confirmado.
Props: item (BookingDetails), onPress.
Lógica: Exibe detalhes do serviço, cliente, data/hora. Animação de entrada e feedback de toque.
app/(provider)/components/dashboard/RecentReviewsSection.tsx:
Propósito: Exibir as avaliações mais recentes do provedor.
Props: recentReviews (ProviderReview[]), onViewAllReviewsPress, onPressReview.
Lógica: Mapeia recentReviews para RecentReviewItem. Inclui esqueleto de carregamento.
app/(provider)/components/dashboard/RecentReviewItem.tsx:
Propósito: Exibir uma única avaliação recente.
Props: review (ProviderReview), index, onPressReview.
Lógica: Exibe avatar do cliente, nome, data, estrelas, emoji de avaliação e comentário.
app/(provider)/components/dashboard/LogoutSection.tsx:
Propósito: Seção com botão de logout.
Props: onLogoutPress.
app/(provider)/earnings.tsx:
Propósito: Tela de detalhes de ganhos do provedor.
Estado: dashboardData, recentTransactions, chartData, isLoading, isRefreshing.
Lógica:
fetchData: Busca dashboardData (providerService.getMyProviderDashboard()) e earningsData (earningService.getMyProviderEarnings()). Prepara os dados para o gráfico de linha (chartData).
handleWithdrawalRequest: Lida com a solicitação de saque (paymentService.requestWithdrawal()).
Interação com Serviços: Consumidor de providerService, earningService, paymentService.
Componentes de UI: CustomHeader, EarningsSummaryCard, EarningsChartSection, RecentTransactionsSection.
app/(provider)/earnings/components/EarningsSummaryCard.tsx:
Propósito: Card de resumo financeiro no topo da tela de ganhos.
Props: dashboardData, animation, onWithdrawalRequest.
Lógica: Exibe saldo disponível, saques pendentes e ganhos do mês. Botão "Solicitar Saque".
app/(provider)/earnings/components/MainEarningsChartSection.tsx:
Propósito: Exibir um gráfico circular de progresso para ganhos brutos e cartões de resumo semanal/mensal.
Props: totalGrossSales, earningsSummary, isLoading, onChartDetailPress.
Lógica: Animação do valor do total de vendas. Inclui esqueleto de carregamento.
app/(provider)/earnings/components/CircularProgressChart.tsx:
Propósito: Componente customizado para um gráfico circular de progresso.
Props: progress, radius, strokeWidth, color, backgroundColor, value, label, onDetailPress?.
Lógica: Utiliza react-native-svg para desenhar o círculo e Animated para animar o progresso.
app/(provider)/earnings/components/EarningsChartSection.tsx:
Propósito: Exibir um gráfico de linha para ganhos ao longo do tempo.
Props: chartData, animation.
Lógica: Utiliza react-native-chart-kit para renderizar o gráfico.
app/(provider)/earnings/components/RecentTransactionsSection.tsx:
Propósito: Exibir uma lista das transações mais recentes do provedor.
Props: transactions (ProviderTransaction[]), animation.
Lógica: Renderiza AnimatedTransactionItem para cada transação. Exibe estado vazio se não houver transações.
app/(provider)/earnings/components/AnimatedTransactionItem.tsx:
Propósito: Exibir um único item de transação com detalhes expansíveis.
Props: item (ProviderTransaction), delay.
Lógica: Animações de entrada e expansão/colapso (isExpanded). Exibe ícone, descrição, data e valor.
app/(provider)/schedule/index.tsx:
Propósito: Tela de agenda do provedor, exibindo um calendário e a lista de agendamentos para a data selecionada.
Estado: selectedDate, allAppointments, isLoading, isRefreshing.
Lógica:
loadAppointments: Busca todos os agendamentos do provedor (fetchProviderAppointments - mockado).
appointmentsForSelectedDate: useMemo para filtrar agendamentos da data selecionada.
markedDates: useMemo para marcar datas no calendário com base nos agendamentos existentes (cores diferentes para status).
onDayPress: Atualiza a data selecionada.
handleAppointmentPress: Navega para os detalhes do agendamento.
Componentes de UI: Calendar (de react-native-calendars), AnimatedAppointmentItem.
Dependências: react-native-calendars, LocaleConfig, DateData, useAuth, expo-router, @expo/vector-icons.
app/(provider)/schedule/manage-availability.tsx:
Propósito: Tela para o provedor gerenciar seus horários de disponibilidade semanais.
Estado: weeklyAvailability (estrutura complexa para dias e slots), isLoading, isSaving, saveSuccess, showTimePicker, currentPickerMode, editingDayIndex, editingSlotId, timePickerDate, slotsToDelete.
Lógica:
loadInitialAvailability: Busca a disponibilidade do provedor do backend (providerService.getProviderAvailability()) e mapeia para a estrutura interna DailyAvailability[].
handleToggleDayAvailability: Ativa/desativa a disponibilidade de um dia inteiro.
openTimePicker, onTimeChange: Gerencia o seletor de hora (DateTimePicker) para editar startTime e endTime de slots.
addSlot: Adiciona um novo slot de horário para um dia.
removeSlot: Remove um slot, marcando-o para exclusão no backend (slotsToDelete).
validateSlots: Lógica crítica de validação para garantir que startTime < endTime e que não haja sobreposição de horários dentro de um dia.
handleSaveChanges:
Validação Final: Verifica hasValidationErrors.
Sincronização com Backend: Prepara slotsToUpdateOrCreate (para novos/editados) e itera sobre slotsToDelete.
Chama providerService.updateProviderAvailability() (para atualizar/criar em massa) e providerService.deleteProviderAvailability() (para deletar slots específicos).
Interação com Serviços: Consumidor de providerService.getProviderAvailability, updateProviderAvailability, deleteProviderAvailability.
Componentes de UI: AnimatedDayCard, BlockDateSection, SaveChangesButton.
Dependências: expo-router, DateTimePicker, @expo/vector-icons, useAuth, providerService, ProviderAvailability, UpdateAvailabilityData.
app/(provider)/schedule/components/manager/AnimatedDayCard.tsx:
Propósito: Exibir um cartão para cada dia da semana no gerenciamento de disponibilidade.
Props: day, dayIdx, onToggleAvailability, onAddSlot, onOpenPicker, onRemoveSlot, delay.
Lógica: Contém um Switch para o dia inteiro e renderiza AnimatedTimeSlot para cada slot de horário. Animação de entrada.
app/(provider)/schedule/components/manager/AnimatedTimeSlot.tsx:
Propósito: Exibir um único slot de horário com opções de edição e remoção.
Props: slot, onOpenPicker, onRemove, delay.
Lógica: TouchableOpacity para abrir o seletor de hora. handleRemove com Alert de confirmação. Animação de entrada e feedback de toque. Animação de borda para slots com erro.
app/(provider)/schedule/components/manager/BlockDateSection.tsx:
Propósito: Seção para bloquear datas específicas (funcionalidade "em breve").
Props: animation.
app/(provider)/schedule/components/manager/SaveChangesButton.tsx:
Propósito: Botão para salvar alterações na disponibilidade.
Props: isSaving, saveSuccess, hasValidationErrors, onPress, animation.
Lógica: Exibe ActivityIndicator quando salvando, ícone de sucesso, ou texto do botão. Desabilita se estiver salvando ou houver erros de validação.
app/(provider)/profile/index.tsx:
Propósito: Tela de perfil do provedor.
Lógica: Similar à tela de perfil do cliente, mas com opções específicas do provedor.
app/(provider)/profile/edit.tsx:
Propósito: Tela para editar o perfil do provedor.
Lógica: Similar à tela de edição de perfil do cliente, mas com campos específicos do provedor.
app/(provider)/profile/edit-services.tsx:
Propósito: Tela para o provedor adicionar, editar e remover os serviços que oferece.
Estado: services (ServiceOffering[]), isLoading, isEditing, serviceName, serviceDesc, servicePrice, serviceDuration.
Lógica:
handleSaveServices: Simula o salvamento de todas as alterações no backend.
handleAddOrUpdateService: Adiciona um novo serviço ou atualiza um existente.
startEdit: Preenche o formulário com os dados do serviço a ser editado.
deleteService: Remove um serviço da lista.
Componentes de UI: AnimatedServiceItem.
app/(provider)/profile/components/AnimatedServiceItem.tsx (em edit-services):
Propósito: Exibir um único serviço oferecido pelo provedor com botões de edição e exclusão.
Props: item (ServiceOffering), onEdit, onDelete, delay.
Lógica: Animações de entrada e feedback de toque. Alert de confirmação para exclusão.
5. Gerenciamento de Estado Global
AuthContext (contexts/AuthContext.tsx, hooks/useAuth.ts):
Provedor: AuthProvider.
Consumidores: useAuth hook.
Estado: user (objeto UserProfile que inclui UserRole), token (JWT), isAuthenticated (booleano), isLoading (booleano, para estado de carregamento da autenticação), isRegistrationInProgress (booleano, para gerenciar o fluxo de registro multi-etapas).
Métodos Exportados:
signIn(credentials): Autentica o usuário, armazena token e user em AsyncStorage e no estado.
signUpClient(data): Registra um novo cliente, autentica e armazena a sessão.
signUpProvider(data): Registra um novo provedor, autentica e armazena a sessão.
signOut(): Limpa o AsyncStorage e o estado de autenticação.
updateUser(updatedUserData): Atualiza o objeto user no estado global e no AsyncStorage.
setIsRegistrationInProgress(boolean): Define o status do registro em andamento.
Fluxo de Inicialização: No _layout.tsx raiz, o AuthProvider tenta carregar o token e o perfil do usuário do AsyncStorage na inicialização do aplicativo para restaurar a sessão.
ProviderRegistrationContext (contexts/ProviderRegistrationContext.tsx):
Provedor: ProviderRegistrationProvider.
Consumidores: useProviderRegistration hook.
Estado: personalDetails, serviceDetails (dados do formulário multi-etapas).
Métodos Exportados:
setPersonalDetails(data): Salva os dados da primeira etapa.
setServiceDetails(data): Salva os dados da segunda etapa.
submitRegistration(): Reúne todos os dados e os envia para o backend via providerService.updateMyProviderProfile (após o registro inicial via authService.registerProvider).
Propósito: Simplifica a coleta de dados de formulários complexos divididos em várias telas.
AppContext (contexts/AppContext.tsx):
Provedor: AppProvider.
Consumidores: useAppContext hook.
Estado: settings (ex: notificationsEnabled, themeMode).
Métodos Exportados:
updateSettings(newSettings): Atualiza configurações específicas.
toggleTheme(): Alterna entre temas claro/escuro.
Propósito: Gerenciar configurações e preferências globais do aplicativo.
6. Camada de Serviços (services/)
A camada de serviços é responsável por abstrair a comunicação com o backend, tornando as chamadas de API reutilizáveis e fáceis de gerenciar.

Configuração Base:
appConfig.ts: Define configurações globais do aplicativo, como a apiUrl.
api.ts: Configura a instância axios centralizada. A baseURL é obtida de Constants.expoConfig?.extra?.backendApiUrl (definida em app.json), garantindo que a URL da API seja configurável via ambiente Expo.
Interceptors: Interceptores de requisição axios são usados para adicionar o token JWT (Authorization: Bearer <token>) a todas as requisições protegidas, obtendo-o do AsyncStorage (auth_token). Interceptores de resposta são configurados para lidar com erros 401 (Não Autorizado) de forma centralizada, limpando a sessão do usuário (AsyncStorage.removeItem) e alertando sobre a necessidade de reautenticação.
Serviços Específicos:
authService.ts: Funções para login, registerClient, registerProvider, forgotPassword, e logout. Gerencia a persistência do token JWT, user_role e user_id no AsyncStorage.
bookingService.ts: Funções para createBooking, getBookingsForUser, getBookingDetails, updateBookingStatus, e cancelBooking.
chatService.ts: Funções para findOrCreateChat, getChatMessages, e sendMessage.
clientService.ts: Funções para getServiceCategories, searchProviders, getUserProfile, getOffers, getProviderDetails, e updateClientProfile.
earningService.ts: Funções para getMyProviderEarnings (busca dados de ganhos do provedor) e requestWithdrawal (solicita saque).
faqService.ts: Funções para getFaqs (busca perguntas frequentes).
notificationService.ts: Funções para getNotifications, markNotificationAsRead, markAllNotificationsAsRead, e deleteNotification.
offerService.ts: Funções para getOffers e getOfferDetails (busca ofertas promocionais).
paymentService.ts: Funções para createPixCharge (cria cobrança PIX) e requestWithdrawal (solicita saque).
providerService.ts: Funções abrangentes para provedores, incluindo getProviderDetails, getProviderAvailability, updateMyProviderProfile, getMyProviderDashboard, getMyProviderEarnings, updateProviderAvailability, addProviderAvailability, deleteProviderAvailability, getProviderServicesOffered, addProviderServiceOffering, updateProviderServiceOffering, deleteProviderServiceOffering, getRecommendedProviders, getNearbyProviders, e searchProviders.
reviewService.ts: Funções para submitFeedback (envia avaliações/feedback).
uploadService.ts: Função uploadImageToCloud para simular (e, no futuro, implementar) o upload de imagens para o backend e, consequentemente, para o Google Cloud Storage.
verificationService.ts: Funções para submitCpf, uploadDocumentPhoto, uploadSelfie, e getProviderVerificationInfo (para o processo de verificação de provedores).
Interação com Backend: Cada função de serviço faz uma requisição axios para o endpoint apropriado do backend, passando os DTOs de entrada e recebendo os DTOs de saída.
7. Navegação (expo-router)
O Expo Router é a espinha dorsal da navegação, utilizando um sistema de roteamento baseado em arquivos que espelha a estrutura de pastas do projeto.

Estrutura de Pastas:
app/(auth)/: Grupo de rotas de autenticação (login, registro).
app/(client)/: Grupo de rotas para usuários clientes (explore, bookings, messages, profile).
app/(provider)/: Grupo de rotas para usuários provedores (dashboard, schedule, services, earnings, messages, profile).
app/(common)/: Grupo de rotas comuns a ambos os tipos de usuário (settings, help, notifications, legal docs).
routes.ts: Este arquivo define constantes para os caminhos das rotas, organizando-os por grupos (AUTH_ROUTES, CLIENT_ROUTES, PROVIDER_ROUTES, COMMON_ROUTES). O uso de as const garante tipagem literal de string, o que é útil para navegação programática e para evitar erros de digitação.
app/index.tsx: O ponto de entrada padrão do aplicativo, exibindo uma tela de carregamento.
app/welcome.tsx: A tela de boas-vindas que é exibida uma única vez na primeira inicialização do aplicativo, antes de qualquer autenticação.
app/+not-found.tsx: A tela padrão para rotas não encontradas.
Layouts (_layout.tsx):
app/_layout.tsx: O layout raiz, que contém o AuthProvider, AppProvider e ProviderRegistrationProvider para disponibilizar contextos globalmente. É responsável pela lógica de redirecionamento inicial.
app/(auth)/_layout.tsx, app/(client)/_layout.tsx, app/(provider)/_layout.tsx, app/(common)/_layout.tsx: Definem layouts específicos para seus respectivos grupos de rotas (ex: Tabs para cliente/provedor, Stack para autenticação/comum).
useRouter Hook: Usado para navegação programática (router.push, router.replace, router.back).
useLocalSearchParams Hook: Usado para acessar parâmetros da URL passados entre telas.
Deep Linking: O Expo Router suporta deep linking, permitindo que URLs externas abram telas específicas no aplicativo.
8. Estilização e Animações
StyleSheet.create: O método padrão para definir estilos no React Native. Os estilos são frequentemente centralizados em arquivos como styles/providerStyles.ts ou definidos localmente dentro dos componentes.
Colors.ts: Define a paleta de cores para os temas claro e escuro do aplicativo. Inclui cores primárias, secundárias, de texto, fundo, e cores específicas para elementos como ganhos e ícones de transação.
theme.ts: Agrupa as definições de SIZES (para espaçamentos, raios, padding, tamanhos de fonte) e FONTS (família de fontes, tamanhos, line heights). Ele também exporta lightTheme e darkTheme, que combinam as cores de Colors.ts com as definições de tamanho e fonte, criando objetos de tema completos que podem ser usados por bibliotecas de UI ou contextos de tema.
useColorScheme.ts e useThemeColor.ts:
useColorScheme.ts: Um hook para detectar o esquema de cores preferido do sistema (claro ou escuro).
useThemeColor.ts: Um hook utilitário que permite que os componentes selecionem automaticamente a cor correta com base no tema ativo (light ou dark), utilizando as definições de Colors.ts.
Platform.select: Usado para aplicar estilos condicionalmente com base na plataforma (iOS ou Android), comum para sombras, elevações e ajustes de status bar.
API Animated (React Native):
Animated.Value: Cria um valor animável.
Animated.timing: Anima um valor ao longo do tempo.
Animated.spring: Anima um valor com um efeito de mola, ideal para feedback de toque.
Animated.parallel / Animated.sequence / Animated.stagger: Orquestram múltiplas animações.
interpolate: Mapeia um intervalo de entrada para um intervalo de saída, usado para efeitos como fade-in/out, slide-in/out, escala.
useNativeDriver: true: Otimização crucial que envia as animações para o thread nativo da UI, melhorando o desempenho e a fluidez, especialmente em dispositivos de baixo custo.
react-native-reanimated:
Utilizado em componentes como HeaderSuperior.tsx para o efeito de reflexo animado, e nos ícones SVG (InfoIcon.tsx, EyeIcon.tsx, CheckmarkIcon.tsx, XMarkIcon.tsx, SliderPickerIcon.tsx, RightArrowIcon.tsx, ProgressCircleIcon.tsx, Bubble.tsx). Proporciona animações mais complexas e performáticas que não podem ser feitas com a API Animated padrão, como useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, e useAnimatedProps para propriedades de SVG.
expo-linear-gradient:
Usado para criar gradientes de cor em fundos de componentes (ex: HeaderSuperior, BannerOferta, GlassmorphicCard, CustomHeader em earnings.tsx, Bubble.tsx).
expo-blur:
Usado para aplicar efeitos de desfoque (blur) em componentes, criando um visual "glassmorphism" moderno (ex: GlassmorphicCard, CustomHeader em services/index.tsx).
react-native-svg:
Fundamental para a renderização dos ícones personalizados (InfoIcon, EyeIcon, CheckmarkIcon, XMarkIcon, SliderPickerIcon, RightArrowIcon, ProgressCircleIcon). Permite desenhar formas vetoriais diretamente no React Native, que podem ser animadas com react-native-reanimated.
Padrões de Animação Comuns:
Entrada de Componentes: Muitos componentes (StandardInput, InputWithIcon, SectionHeader, AnimatedErrorMessage, AnimatedConversationItem, AnimatedNotificationItem, AnimatedAppointmentItem, AnimatedServiceItem, AnimatedDayCard, AnimatedTimeSlot, AnimatedQuickActionButton, GlassmorphicCard, Bubble) usam animações de fade-in e slide-up (translateY) com delay escalonado para criar uma experiência de carregamento e transição visualmente agradável.
Feedback de Toque: Botões e itens clicáveis frequentemente implementam animações de escala (scaleAnim) ao onPressIn e onPressOut para fornecer feedback tátil e visual ao usuário.
Animações de Fundo: O componente Bubble.tsx é um exemplo de animação de fundo complexa, com bolhas flutuantes que se movem, escalam e mudam de opacidade de forma independente, criando um ambiente dinâmico.
Animações de Ícones: Os ícones SVG utilizam animações específicas para seu propósito, como a rotação do XMarkIcon ou o traçado do CheckmarkIcon.
9. Gerenciamento de Dados e Fluxo de Informações
O fluxo de dados no frontend segue o padrão Unidirecional do React, com o estado fluindo de componentes pai para filhos, e eventos/callbacks fluindo de filhos para pais.

Fontes de Dados:
Backend API: Principal fonte de dados, acessada via camada de serviços (services/).
Contextos Globais: AuthContext, ProviderRegistrationContext, AppContext armazenam dados que precisam ser acessíveis em várias partes da aplicação sem a necessidade de prop drilling.
Estado Local (useState): Para dados específicos de um componente ou formulário.
Armazenamento Local (AsyncStorage via utils/storage.ts): O módulo utils/storage.ts fornece funções utilitárias (storeData, getData, removeData, clearAllData) para interagir com o AsyncStorage, facilitando a persistência de dados menos sensíveis, como preferências do usuário e cache.
Tipagem (types/backend/):
Uma parte fundamental do gerenciamento de dados é a tipagem rigorosa, garantida pelos arquivos .ts dentro de src/types/backend/. Essas interfaces espelham as estruturas de dados (DTOs e entidades) esperadas do backend, assegurando a segurança de tipo em todas as operações.
auth.ts: Define DTOs para autenticação (LoginDto, RegisterClientDto, RegisterProviderDto, ForgotPasswordDto), respostas de autenticação (AuthResponseDto, MessageResponseDto), e o enum UserRole. Inclui também CreateAddressDto para endereços aninhados.
bookings.ts: Define o enum BookingStatus, interfaces para BookingAddress, CreateBookingDto, BookingDetails (e seu sinônimo Booking), e UpdateBookingStatusDto.
chat.ts: Define interfaces para ChatDetails, Message, SendMessageDto, GetMessagesQuery, e ChatSummary.
clients.ts: Define interfaces para Client, SearchResult, e UpdateClientProfileDto.
faqs.ts: Define a interface FAQItem para perguntas frequentes.
notifications.ts: Define interfaces para NotificationEntity e MarkAsReadDto.
offers.ts: Define a interface Offer para ofertas promocionais.
payments.ts: Define interfaces para CreatePixChargeDto, PixChargeResponseDto, RequestWithdrawalDto, e TransactionEntity relacionadas a pagamentos.
providers.ts: Define enums como VerificationStatus, e interfaces complexas para ServiceDetailsDto, ProviderServiceOffering, ProviderDisplayInfo, ProviderSearchQuery, UpdateProviderProfileData, CreateProviderServiceData, UpdateProviderServiceData, ProviderAvailability, UpdateAvailabilityData, ProviderReview, ProviderDashboard, TransactionType, ProviderTransaction, WithdrawalRequestDto, WithdrawalResponseDto, e EarningsResponseDto.
reviews.ts: Define interfaces para SubmitReviewDto e ReviewEntity.
services.ts: Define a interface Service para tipos de serviço.
upload.ts: Define a interface UploadResponseDto para respostas de upload de arquivos.
users.ts: Define a interface UserProfile, que agrega informações de usuário, cliente e provedor.
verification.ts: Define o enum VerificationStatus e interfaces para SubmitCpfRequest, DocumentPhotoType, VerificationResponse, e ProviderVerificationInfo para o processo de verificação.
Fluxo de Dados Típico (Ex: Dashboard do Provedor):
Montagem da Tela: app/(provider)/dashboard.tsx monta.
useEffect & fetchData: O useEffect na tela dashboard.tsx (dependente de user?.id do useAuth) chama fetchData.
Serviços de Backend: fetchData invoca:
providerService.getMyProviderDashboard(): Busca ProviderDashboard (nome, ganhos totais, saques pendentes, avaliações recentes).
bookingService.getBookingsForUser(BookingStatus.PENDING): Busca solicitações pendentes.
bookingService.getBookingsForUser(BookingStatus.CONFIRMED): Busca próximos serviços confirmados.
Atualização de Estado Local: Os dados recebidos são armazenados nos estados dashboardData e upcomingServices via useState.
Renderização de Componentes Filhos:
DashboardHeader: Recebe dashboardData?.fullName e user?.avatarUrl como props.
FinancialSummaryCard: Recebe dashboardData?.totalEarnings e dashboardData?.pendingWithdrawals como props.
QuickActionsSection: Recebe callbacks (onViewAllServicesPress, onViewAllMessagesPress, onManageAvailability) como props.
ProviderOverviewSection: Recebe upcomingServices e callbacks (onAcceptRequest, onRejectRequest, onChatWithClient, onServicePress) como props.
RecentReviewsSection: Recebe dashboardData?.reviews como props.
Interação do Usuário:
Ação em RequestItem (Aceitar/Rejeitar): O usuário clica em "Aceitar" ou "Recusar". O onAccept ou onReject callback (passado de dashboard.tsx) é chamado com o bookingId.
dashboard.tsx (Callback): handleAcceptRequest ou handleRejectRequest é executado.
Serviço de Backend: bookingService.updateBookingStatus(bookingId, newStatus) é chamado.
Re-fetch de Dados: Após a atualização bem-sucedida, fetchData() é chamado novamente para atualizar o dashboard com os dados mais recentes, refletindo a mudança de status.
Chat: handleChatWithClient navega para a tela de chat, passando clientId e clientName como parâmetros.
10. Tratamento de Erros e Feedback do Usuário
O aplicativo implementa uma estratégia robusta para lidar com erros e fornecer feedback claro ao usuário.

Erros de Validação de Formulário:
class-validator nos DTOs do backend garante que os dados sejam validados antes de chegar à lógica de negócios.
No frontend, validações locais (validateStep1, validateForm) são realizadas antes do envio.
AnimatedErrorMessage e mensagens de erro específicas (nameError, phoneError) são exibidas abaixo dos campos de input para feedback imediato.
Erros de API:
Blocos try-catch são usados em todas as chamadas de serviço (axios).
Mensagens de erro do backend (err.response?.data?.message) são capturadas e exibidas ao usuário via Alert.alert ou ToastMessage.
generalError é usado para erros que afetam o formulário como um todo.
Estados de Carregamento:
isLoading (useState) é usado em muitas telas para controlar a exibição de ActivityIndicator em tela cheia ou inline, indicando que uma operação está em andamento.
isRefreshing (useState) com RefreshControl é usado para indicar operações de "pull-to-refresh".
ServiceItemSkeleton e outros esqueletos são usados para melhorar a percepção de desempenho durante o carregamento de listas.
Feedback de Sucesso/Informação:
Alert.alert é usado para mensagens importantes de sucesso ou falha.
ToastMessage fornece feedback não intrusivo para operações rápidas (ex: "Serviços atualizados!").
Feedback Tátil (Haptics): expo-haptics é usado para fornecer feedback tátil em interações importantes (ex: onPressInItem em AnimatedServiceItem).
Gerenciamento de Permissões (utils/permissions.ts):
O módulo utils/permissions.ts centraliza a lógica para verificar e solicitar permissões do dispositivo (câmera, galeria de mídia, localização, notificações).
Funções como checkCameraPermissions, requestCameraPermissions, checkMediaLibraryPermissions, requestMediaLibraryPermissions, checkLocationPermissions, requestLocationPermissions, getCurrentLocation, checkNotificationPermissions, e requestNotificationPermissions fornecem uma API consistente.
Ele inclui lógica para showPermissionDeniedAlert que orienta o usuário a abrir as configurações do aplicativo, melhorando a experiência em casos de permissões negadas.
11. Bibliotecas de Terceiros Chave
expo-router: Sistema de roteamento baseado em arquivos.
@react-native-async-storage/async-storage: Armazenamento persistente de dados no dispositivo.
axios: Cliente HTTP para comunicação com o backend.
jwt-decode: Decodificação de tokens JWT no cliente.
@expo/vector-icons: Coleção de ícones (Ionicons, MaterialCommunityIcons) amplamente utilizada em toda a UI.
@react-native-community/datetimepicker: Seletores de data e hora nativos.
expo-image-picker: Seleção e captura de imagens da galeria/câmera.
react-native-calendars: Componente de calendário personalizável.
socket.io-client: Cliente WebSocket para comunicação em tempo real (chat).
expo-linear-gradient: Componente para renderizar gradientes de cor.
expo-blur: Componente para aplicar efeitos de desfoque.
react-native-reanimated: Biblioteca para criar animações de alto desempenho.
react-native-svg: Biblioteca para renderizar gráficos e ícones vetoriais em SVG.
expo-haptics: API para feedback tátil.
react-native-chart-kit: Componentes de gráfico para React Native.
react-native-toast-message: Biblioteca para exibir mensagens de toast.
12. Padrões e Boas Práticas
Componentização: A aplicação é fortemente componentizada, com componentes pequenos e reutilizáveis que encapsulam sua própria lógica e estilo.
Separação de Preocupações: Claramente visível na separação entre componentes de UI, lógica de negócio (serviços), gerenciamento de estado (contextos) e navegação.
Tipagem Forte (TypeScript): O uso extensivo de TypeScript em todas as camadas (componentes, contextos, serviços, tipos) garante segurança de tipo, melhora a legibilidade e facilita a refatoração.
Hooks do React: useState, useEffect, useRef, useCallback, useMemo são utilizados para gerenciar o estado, efeitos colaterais e otimizar o desempenho.
Memoização (useCallback, useMemo): Funções e valores computados são memoizados para evitar re-renderizações desnecessárias de componentes e otimizar o desempenho.
Otimização de Listas (FlatList): FlatList é usado para renderizar listas grandes de forma eficiente, com keyExtractor e ItemSeparatorComponent.
Animações Performáticas: Uso de useNativeDriver: true sempre que possível para animações, e react-native-reanimated para animações no thread nativo.
Feedback Visual e Tátil: Uso consistente de indicadores de carregamento, mensagens de erro/sucesso, e feedback tátil para melhorar a experiência do usuário.
Utilitários Comuns (utils/helpers.ts): O arquivo helpers.ts centraliza funções de utilidade para tarefas comuns como formatação de datas (formatDate), validação de e-mails (isValidEmail), validação de senhas (isValidPassword), capitalização de strings (capitalizeFirstLetter), geração de IDs simples (generateSimpleId), formatação de moeda (formatCurrency), truncamento de strings (truncateString), validação de números de telefone (isValidPhoneNumber) e formatação de números de telefone (formatPhoneNumber).
Internacionalização (constants/strings.ts): Embora básico, o arquivo strings.ts serve como um placeholder para strings comuns, indicando uma estrutura futura para internacionalização (i18n) via bibliotecas como i18next ou react-i18next.
Acessibilidade: Alguns componentes incluem props de acessibilidade (accessibilityLabel, accessibilityRole, accessibilityHint).

```markdown
Documentação Técnica do Backend
1. Introdução
Este documento detalha a arquitetura e as funcionalidades do backend de uma aplicação de marketplace de serviços, construída com NestJS, utilizando Prisma ORM para interação com um banco de dados PostgreSQL. O objetivo principal é conectar clientes a provedores de serviços, facilitando agendamentos, pagamentos, comunicação e um robusto sistema de verificação e avaliação. A aplicação segue os princípios de uma arquitetura modular, com cada funcionalidade encapsulada em seu próprio módulo NestJS, promovendo a manutenibilidade, escalabilidade e clareza do código.

2. Visão Geral da Arquitetura
O backend é construído sobre o framework NestJS, que adota uma arquitetura inspirada em Angular, utilizando módulos, controllers, services, providers e DTOs (Data Transfer Objects). A aplicação inicia-se através do main.ts, que configura o NestJS, habilita CORS, aplica um ValidationPipe global para validação de dados, e um HttpExceptionFilter para tratamento padronizado de erros.

Módulos (*.module.ts): Agrupam funcionalidades relacionadas. Cada módulo pode exportar serviços que podem ser injetados em outros módulos. O AppModule é o módulo raiz que importa todos os outros módulos principais da aplicação, agindo como o orquestrador central da aplicação.
Controladores (*.controller.ts): Responsáveis por lidar com as requisições HTTP de entrada, rotear para os serviços apropriados e retornar as respostas. O AppController fornece um endpoint básico de saúde (/health) para monitoramento e uma mensagem de boas-vindas (/). Eles atuam como a camada de interface da API.
Serviços (*.service.ts): Contêm a lógica de negócios principal da aplicação, interagindo com o banco de dados (via Prisma) e orquestrando operações complexas que podem envolver múltiplos modelos de dados e chamadas a outros serviços. O AppService é um serviço simples que retorna uma mensagem de boas-vindas.
DTOs (*.dto.ts): Definem a estrutura dos dados para entrada (requisições) e saída (respostas), utilizando class-validator para validação de dados em tempo de execução e class-transformer para transformar objetos planos em instâncias de classes, garantindo a integridade e o formato esperado dos dados.
Entidades (*.entity.ts): Representações tipadas dos modelos de dados, muitas vezes estendendo os tipos gerados pelo Prisma, usadas para tipagem interna do código, consistência entre camadas e para enriquecer a documentação Swagger da API.
Guards (*.guard.ts): Implementam lógica de autenticação e autorização, protegendo rotas e garantindo que apenas usuários com as permissões corretas possam acessar determinados recursos.
Filtros (*.filter.ts): Capturam e processam exceções HTTP globalmente, padronizando as respostas de erro da API para o cliente, o que melhora a experiência do desenvolvedor frontend e a consistência da API.
Prisma ORM: Gerencia a conexão e as operações com o banco de dados PostgreSQL, mapeando os modelos de dados definidos no schema.prisma para tabelas de banco de dados e fornecendo uma API Type-Safe para consultas e mutações.
A estrutura de pastas reflete a modularidade, com cada domínio de negócio (ex: auth, users, providers, bookings) residindo em sua própria pasta, contendo seus respectivos controladores, serviços, DTOs e entidades. Esta organização facilita a navegação, a manutenção e a escalabilidade do projeto.

3. Esquema do Banco de Dados (Prisma)
O schema.prisma é o coração do modelo de dados, definindo todas as entidades, seus campos, tipos, relações e enums, e é a fonte única de verdade para a estrutura do banco de dados.

Enums
UserRole: Define os papéis dos usuários na aplicação.
CLIENT: Usuário que contrata serviços.
PROVIDER: Usuário que oferece serviços.
ADMIN: Usuário com privilégios administrativos.
SYSTEM: (NOVO) Papel para operações internas do sistema (ex: webhooks).
VerificationStatus: Controla o status do processo de verificação de provedores.
PENDING_INITIAL_REVIEW: Após registro básico, aguardando dados de verificação.
PENDING_DOCUMENTS_UPLOAD: Aguardando fotos do documento e selfie.
PENDING_BACKGROUND_CHECK: Dados enviados, aguardando resultado da verificação criminal.
PENDING_MANUAL_REVIEW: Se houver necessidade de revisão humana.
APPROVED: Verificação concluída e aprovada.
REJECTED: Verificação concluída e rejeitada.
BLOCKED: Conta bloqueada por questões de segurança graves.
BookingStatus: Descreve o estado de um agendamento.
PENDING: Pendente de confirmação do provedor.
CONFIRMED: Confirmado pelo provedor.
COMPLETED: Serviço concluído.
CANCELED: Agendamento cancelado.
RESCHEDULED: Agendamento reagendado.
IN_PROGRESS: (Adicionado) Serviço em andamento.
PENDING_PROVIDER_CONFIRMATION: (Adicionado) Aguardando confirmação do provedor.
REJECTED: (Adicionado) Agendamento rejeitado.
TransactionType: Categoriza os tipos de transações financeiras.
PAYMENT: Pagamento de cliente para plataforma/provedor.
WITHDRAWAL: Saque de provedor da plataforma.
COMMISSION: Comissão da plataforma.
Modelos (Tabelas)
User:
Propósito: Entidade base para todos os usuários do sistema.
Campos Chave: id (UUID), email (único), passwordHash, role (UserRole).
Novidade: avatarUrl (String, opcional) para armazenar a URL da imagem de perfil do usuário.
Relações: Client? (1:1), Provider? (1:1), messagesSent[] (1:N com Message), messagesReceived[] (1:N com Message), notifications[] (1:N com Notification), chatsAsParticipant1[] (1:N com Chat), chatsAsParticipant2[] (1:N com Chat).
Client:
Propósito: Detalhes específicos de usuários com o papel CLIENT.
Campos Chave: id (UUID), userId (único, FK para User).
Campos: fullName, phone?, createdAt, updatedAt.
Relações: user (1:1 com User), address? (1:1, via ClientAddress com Address), bookings[] (1:N com Booking), reviewsMade[] (1:N com Review).
Provider:
Propósito: Detalhes específicos de usuários com o papel PROVIDER.
Campos Chave: id (UUID), userId (único, FK para User).
Campos: fullName, cpf (único), dateOfBirth, phone?, yearsOfExperience?, avatarUrl?, bio?.
Novos Campos de Verificação: verificationStatus (VerificationStatus, padrão PENDING_INITIAL_REVIEW), documentPhotoFrontUrl?, documentPhotoBackUrl?, selfieWithDocumentUrl?, backgroundCheckResult? (JSON para resultados detalhados), rejectionReason?.
Novidade: pixKey? para informações de pagamento.
Relações: user (1:1 com User), address? (1:1, via ProviderAddress com Address), providerServices[] (1:N com ProviderService), availability[] (1:N com Availability), bookings[] (1:N com Booking), reviewsReceived[] (1:N com Review), earnings[] (1:N com Transaction).
Address:
Propósito: Armazena informações de endereço.
Campos Chave: id (UUID).
Campos: cep, street, number, complement?, neighborhood, city, state.
Relações: client? (1:1 com Client), provider? (1:1 com Provider), booking? (1:1, via BookingAddress com Booking).
Service:
Propósito: Define os tipos de serviços que podem ser oferecidos (e.g., "Limpeza Padrão", "Eletricista").
Campos Chave: id (UUID), name (único).
Novidade: price (Decimal) adicionado diretamente ao modelo Service (pode ser um preço base ou sugerido), icon?.
Campos: description?, createdAt, updatedAt.
Relações: providerServices[] (1:N com ProviderService).
ProviderService:
Propósito: Representa um serviço específico oferecido por um Provider. É uma tabela de junção entre Provider e Service.
Campos Chave: id (UUID).
Campos: providerId (FK), serviceId (FK), price (Decimal, preço que o provedor cobra), durationMinutes, description?.
Restrição: @@unique([providerId, serviceId]) garante que um provedor não ofereça o mesmo tipo de serviço duas vezes.
Relações: provider (M:1 com Provider), service (M:1 com Service), bookings[] (1:N com Booking).
Booking:
Propósito: Representa um agendamento de serviço.
Campos Chave: id (UUID).
Campos: clientId (FK), providerId (FK), providerServiceId (FK), scheduledDate, scheduledTime, status (BookingStatus), totalPrice (Decimal), notes?, createdAt, updatedAt.
Novidade: addressId? (único, FK para Address) e address (1:1, via BookingAddress com Address) para o endereço específico do agendamento.
Relações: client (M:1 com Client), provider (M:1 com Provider), providerService (M:1 com ProviderService), review? (1:1 com Review), transactions[] (1:N com Transaction).
Chat:
Propósito: Representa uma conversa entre dois usuários.
Campos Chave: id (UUID).
Campos: participant1Id (FK), participant2Id (FK).
Restrição: @@unique([participant1Id, participant2Id]) garante um único chat entre um par de usuários.
Relações: participant1 (M:1 com User), participant2 (M:1 com User), messages[] (1:N com Message).
Message:
Propósito: Armazena mensagens de chat.
Campos Chave: id (UUID).
Campos: chatId (FK), senderId (FK), receiverId (FK), content, timestamp, isRead.
Relações: chat (M:1 com Chat), sender (M:1 com User), receiver (M:1 com User).
Notification:
Propósito: Armazena notificações para usuários.
Campos Chave: id (UUID).
Campos: userId (FK), type, message, isRead, targetUrl?, createdAt.
Relações: user (M:1 com User).
Review:
Propósito: Armazena avaliações de serviços.
Campos Chave: id (UUID), bookingId (único, FK para Booking).
Campos: clientId (FK), providerId (FK), rating (Int), comment?, createdAt.
Novidade: updatedAt adicionado.
Restrição: @@unique([bookingId, clientId, providerId]) garante uma única avaliação por agendamento por cliente por provedor.
Relações: booking (1:1 com Booking), client (M:1 com Client), provider (M:1 com Provider).
Offer:
Propósito: Gerencia ofertas e promoções.
Campos Chave: id (UUID).
Campos: title, description?, discountPercentage? (Float), fixedDiscountAmount? (Float), validUntil, imageUrl?, createdAt, updatedAt.
Transaction:
Propósito: Registra todas as transações financeiras.
Campos Chave: id (UUID).
Campos: providerId (FK), amount (Decimal), type (TransactionType), status (String), description?, createdAt.
Novidade: bookingId? (único, FK para Booking) e booking (1:1 com Booking) para associar transações a agendamentos.
Relações: provider (M:1 com Provider), booking? (1:1 com Booking).
Availability:
Propósito: Define a disponibilidade dos provedores.
Campos Chave: id (UUID).
Campos: providerId (FK), dayOfWeek (Int, 0=Dom, 6=Sáb), startTime (String, HH:mm), endTime (String, HH:mm), isAvailable (Boolean, padrão true).
Relações: provider (M:1 com Provider).
4. Módulos e Funcionalidades Principais
4.1. Configuração Global (src/main.ts, src/app.module.ts, src/prisma/, src/common/filters/, src/config/)
Esta seção descreve a infraestrutura global da aplicação, que é fundamental para o funcionamento de todos os outros módulos.

main.ts: Ponto de entrada da aplicação.
Orquestração: Utiliza NestFactory.create(AppModule) para inicializar a aplicação NestJS.
CORS: app.enableCors() permite requisições de diferentes origens, essencial para comunicação entre frontend e backend.
Validação Global: app.useGlobalPipes(new ValidationPipe(...)) ativa a validação de DTOs em todas as rotas. O ValidationPipe (do @nestjs/common) em conjunto com class-validator e class-transformer garante que os dados de entrada da API estejam sempre no formato e com os valores esperados. whitelist: true remove propriedades não definidas no DTO, forbidNonWhitelisted: true rejeita requisições com propriedades inesperadas, e transform: true converte automaticamente os tipos de dados.
Tratamento de Exceções Global: app.useGlobalFilters(new HttpExceptionFilter()) registra um filtro de exceções global.
Porta: Obtém a porta de execução do ConfigService (PORT do .env), padronizando para 3000 se não definida.
Inicialização: await app.listen(port, '0.0.0.0') inicia o servidor HTTP, tornando a aplicação acessível.
app.module.ts: O módulo raiz da aplicação.
Agregação: Importa e agrupa todos os módulos funcionais da aplicação (Auth, Users, Providers, Clients, etc.). Esta é a "árvore" de dependências de alto nível do backend.
Configuração Global: ConfigModule.forRoot({ isGlobal: true }) carrega variáveis de ambiente e as torna acessíveis em toda a aplicação.
prisma/ (prisma.module.ts, prisma.service.ts): Módulo e serviço para interação com o banco de dados.
PrismaModule: Marcado com @Global(), ele exporta PrismaService, tornando-o injetável em qualquer outro módulo sem a necessidade de importação explícita em cada um.
PrismaService: Estende PrismaClient e implementa OnModuleInit e OnModuleDestroy para gerenciar o ciclo de vida da conexão com o banco de dados ($connect() e $disconnect()). Inclui lógica para enableShutdownHooks utilizando process.on('SIGINT') e process.on('SIGTERM') para garantir um desligamento gracioso da aplicação, fechando a conexão com o banco de dados antes que o processo Node.js seja encerrado.
common/filters/ (http-exception.filter.ts):
HttpExceptionFilter: Implementa ExceptionFilter para capturar HttpExceptions.
Padronização: Intercepta exceções e formata a resposta JSON para o cliente, incluindo statusCode, timestamp, path, message (uma string concatenada de erros) e errors (um array de strings, útil para erros de validação do ValidationPipe). Isso garante uma API consistente na forma como os erros são comunicados.
config/ (config.module.ts, configuration.ts, validation-schema.ts): Gerenciamento de variáveis de ambiente.
ConfigModule: Importa NestConfigModule.forRoot para configurar o carregamento das variáveis de ambiente.
configuration.ts: Define uma função que carrega variáveis de ambiente do process.env e as organiza em um objeto tipado, permitindo acesso fácil e seguro às configurações da aplicação.
validation-schema.ts: Utiliza a biblioteca Joi para definir um esquema de validação rigoroso para as variáveis de ambiente. Isso impede que a aplicação inicie com configurações inválidas ou ausentes, aumentando a robustez.
4.2. Autenticação e Autorização (auth/)
Este módulo é responsável por gerenciar o acesso dos usuários ao sistema, incluindo registro, login e controle de permissões.

Modelos Chave: User (base), Client, Provider.
Fluxo de Autenticação (Login):
Requisição: Um cliente envia credenciais (email, password) para POST /auth/login.
AuthController: A rota é protegida por LocalAuthGuard.
LocalAuthGuard: Ativa a LocalStrategy.
LocalStrategy: Injeta AuthService. Chama authService.validateUser(email, password).
AuthService.validateUser:
Consulta PrismaService (prisma.user.findUnique) para encontrar o usuário pelo email.
Compara a password fornecida com o passwordHash armazenado usando bcrypt.compare.
Retorna o objeto User (sem o hash da senha) se as credenciais forem válidas, ou null.
LocalStrategy: Se validateUser retornar um usuário, o LocalStrategy anexa o objeto User validado ao req.user.
AuthController.login: Recebe o req.user validado. Chama authService.login(req.user).
AuthService.login:
Busca o fullUser do PrismaService com todas as relações necessárias (client, provider e suas sub-relações) usando include para construir o UserProfileDto.
Cria um payload JWT contendo email, sub (ID do usuário) e role.
Gera um accessToken usando JwtService.sign(payload).
Instancia UserProfileDto com o fullUser para formatar a resposta do perfil.
Retorna AuthResponseDto contendo o accessToken e o user (UserProfileDto).
Fluxo de Autorização (JWT):
Requisição: Um cliente envia uma requisição para uma rota protegida por JwtAuthGuard (e opcionalmente RolesGuard), com o accessToken no cabeçalho Authorization: Bearer <token>.
JwtAuthGuard: Ativa a JwtStrategy.
JwtStrategy:
Extrai o token do cabeçalho Authorization.
Verifica o token usando JwtService.verify() com o JWT_SECRET do ConfigService.
Valida o payload (que contém sub, email, role).
Consulta PrismaService (prisma.user.findUnique) para buscar o User completo, incluindo as relações client ou provider dependendo do role do usuário. Isso é crucial para que os controladores e serviços subsequentes tenham acesso fácil aos detalhes do perfil associado.
Anexa o objeto User (com as relações incluídas) ao req.user.
RolesGuard (se presente):
Utiliza Reflector para obter os requiredRoles definidos pelo decorator @Roles() na rota ou controlador.
Compara o user.role (do req.user populado pela JwtStrategy) com os requiredRoles.
Permite ou nega o acesso com base nesta comparação.
Controlador/Serviço: A rota é executada e o req.user está disponível com o userId, email, role e os objetos client ou provider (se incluídos na query).
Fluxo de Registro:
Requisição: Cliente envia RegisterClientDto ou RegisterProviderDto para POST /auth/register/client ou POST /auth/register/provider.
AuthController: Recebe o DTO.
AuthService.registerClient / AuthService.registerProvider:
Verifica se o email já existe (prisma.user.findUnique). registerProvider também verifica cpf.
Gera um passwordHash usando bcrypt.hash.
Cria um novo User no PrismaService com o role apropriado.
Cria o perfil Client ou Provider associado, incluindo a criação de um Address aninhado. Para provedores, o verificationStatus é inicializado como PENDING_INITIAL_REVIEW.
Chama this.login(newUser) para autenticar automaticamente o novo usuário e retornar AuthResponseDto.
Módulos:
AuthModule: Importa PrismaModule (para PrismaService), PassportModule (para estratégias de autenticação), JwtModule (para geração/verificação de JWTs, configurado assincronamente com ConfigService para carregar JWT_SECRET e JWT_EXPIRATION_TIME), e UsersModule (para UsersService, necessário para AuthService em algumas operações). Exporta AuthService, JwtModule (para que outros módulos possam injetar JwtService), e WsAuthGuard.
Guards:
LocalAuthGuard: Estende AuthGuard('local'), usado para autenticação de credenciais de login.
JwtAuthGuard: Estende AuthGuard('jwt'), usado para proteger rotas com tokens JWT.
RolesGuard: Implementa CanActivate, usa Reflector para ler metadados @Roles() e verifica se o req.user.role corresponde aos papéis permitidos.
WsAuthGuard: Implementa CanActivate para WebSockets. Extrai o token JWT do client.handshake.headers.authorization ou client.handshake.query.token, verifica-o com JwtService, e anexa o payload do usuário (userId, role) ao client.data do socket para uso posterior.
DTOs:
LoginDto: Define a estrutura para as credenciais de login.
RegisterClientDto / RegisterProviderDto: Definem a estrutura para os dados de registro, incluindo campos específicos para cada papel e um CreateAddressDto aninhado.
ForgotPasswordDto: Define a estrutura para a solicitação de redefinição de senha.
AuthResponseDto: Encapsula o accessToken gerado e o UserProfileDto do usuário autenticado.
4.3. Gerenciamento de Usuários (Clientes e Provedores) (users/, clients/, providers/)
Este conjunto de módulos gerencia a criação, recuperação e atualização dos perfis de usuário, que são divididos em User (base), Client e Provider.

Hierarquia de Modelos:
User: O modelo base no schema.prisma que contém informações de autenticação (email, passwordHash, role) e um avatarUrl genérico.
Client: Estende User com campos específicos para clientes (fullName, phone, address, bookings, reviewsMade).
Provider: Estende User com campos específicos para provedores (fullName, cpf, dateOfBirth, yearsOfExperience, bio, address, verificationStatus, providerServices, reviewsReceived, earnings).
Serviços:
UsersService: Atua como um serviço central para operações de alto nível na entidade User.
findOne(id: string): Busca um User por ID, incluindo condicionalmente suas relações client ou provider com todas as sub-relações necessárias (address, bookings, reviewsMade, providerServices, reviewsReceived). O tipo UserWithAllRelations é crucial para tipagem precisa.
findByEmail(email: string): Similar ao findOne, mas busca por email, também retornando UserWithAllRelations.
update(id: string, updateUserDto: UpdateUserDto): Atualiza campos do User e retorna o UserWithAllRelations atualizado.
remove(id: string): Deleta um User, com tratamento de erros P2025 (não encontrado) e P2003 (violação de chave estrangeira).
ClientsService: Focado em operações de perfil de Client.
findClientById(id: string) / findClientByUserId(userId: string): Recupera um Client completo, incluindo user, address, bookings e reviewsMade. O tipo ClientWithIncludes garante que todas as relações esperadas sejam carregadas.
updateClient(clientId: string, updateClientProfileDto: UpdateClientProfileDto): Atualiza campos do perfil do Client.
getClientDashboardData(clientId: string): Orquestra a coleta de dados para o dashboard do cliente. Consulta prisma.client com include para bookings e reviewsMade, filtra agendamentos pendentes/concluídos, identifica o próximo agendamento, agendamentos recentes e avaliações pendentes.
ProvidersService: Focado em operações de perfil de Provider.
findOne(id: string) / findByUserId(userId: string): Busca um Provider por ID ou userId, incluindo user, address, providerServices e reviewsReceived (com client.user aninhado para avatarUrl). O tipo ProviderWithIncludes é usado para garantir a estrutura completa.
updateByUserId(userId: string, data: UpdateProviderProfileDto): Atualiza o perfil do Provider, incluindo a lógica de upsert para o address.
remove(id: string): Deleta um Provider.
search(searchDto: ProviderSearchDto): Implementa a lógica de busca complexa. Constrói uma cláusula WHERE dinâmica com OR para fullName, email, service.name e bio. Inclui providerServices e reviewsReceived para calcular averageRating e reviewCount. Filtra e ordena os resultados com base em minRating, sortBy (Rating, Experience). Retorna ProviderWithCalculatedRating[].
findTopRatedOrExperiencedProviders() / findAllProviders(): Métodos para buscar provedores com base em critérios específicos (ex: top avaliados, mais experientes, todos com filtros).
Módulos:
UsersModule: Importa PrismaModule. Exporta UsersService para que AuthService e outros módulos possam utilizá-lo.
ClientsModule: Importa UsersModule (para UsersService) e PrismaModule. Exporta ClientsService.
ProvidersModule: Importa PrismaModule e UsersModule. Exporta ProvidersService.
Controladores:
UsersController:
GET /users/me: Protegido por JwtAuthGuard. Obtém o userId do req.user e chama usersService.findOne para retornar o UserProfileDto do usuário logado.
PATCH /users/me: Protegido por JwtAuthGuard. Permite que o usuário logado atualize seu perfil.
GET /users/:id: Protegido por JwtAuthGuard e RolesGuard (apenas ADMIN). Permite que administradores obtenham o perfil de qualquer usuário.
DELETE /users/:id: Protegido por JwtAuthGuard e RolesGuard (apenas ADMIN). Permite que administradores deletem usuários.
ClientsController:
GET /clients/me/dashboard: Protegido por JwtAuthGuard e RolesGuard (CLIENT role). Obtém o userId do req.user, encontra o clientId associado e chama clientsService.getClientDashboardData.
PATCH /clients/me: Protegido por JwtAuthGuard e RolesGuard (CLIENT role). Permite que o cliente logado atualize seu perfil.
GET /clients/:id: Protegido por JwtAuthGuard e RolesGuard (ADMIN role). Permite que administradores obtenham o perfil de qualquer cliente.
ProvidersController:
Rotas Públicas:
GET /providers/recommended: Retorna provedores recomendados (top avaliados ou experientes).
GET /providers/nearby: Retorna provedores próximos (simulado como findAllProviders com limite).
GET /providers: Permite buscar provedores com diversos filtros e opções de ordenação (ProviderSearchDto).
Rotas Autenticadas (JwtAuthGuard):
GET /providers/me: Retorna o perfil completo do provedor logado.
PATCH /providers/me: Permite que o provedor logado atualize seu perfil.
Rotas com Parâmetros Dinâmicos:
GET /providers/:id: Retorna detalhes de um provedor específico por ID (público).
DELETE /providers/:id: Protegido por JwtAuthGuard e RolesGuard (ADMIN role). Permite que administradores deletem provedores.
DTOs:
CreateAddressDto: Usado para dados de endereço em criação/atualização de perfis e agendamentos. Inclui validações para cep, street, number, complement, neighborhood, city, state.
UserProfileDto: DTO de saída abrangente para perfis de usuário, incluindo id, email, avatarUrl, role, createdAt, updatedAt, e aninhadamente clientDetails ou providerDetails.
UpdateUserDto: DTO para atualização de campos gerais do User (como email).
ClientDetailsDto: DTO de saída para detalhes de Client, incluindo fullName, phone, address, createdAt, updatedAt, ordersCount.
UpdateClientProfileDto: DTO para atualização de perfil de Client.
ClientDashboardDto: DTO para o dashboard do cliente, agregando fullName, pendingBookingsCount, completedBookingsCount, nextBooking, recentBookings, popularServices, pendingReviews.
ProviderDetailsDto: DTO de saída detalhado para Provider, incluindo fullName, email, avatarUrl, yearsOfExperience, verificationStatus, address, bio, averageRating, reviewCount, providerServices (como ProviderServiceOfferingDto), e reviews (como ProviderReviewDto).
UpdateProviderProfileDto: DTO para atualização de perfil de Provider.
ProviderSearchDto: DTO de entrada para a busca de provedores, com campos como searchTerm, serviceId, location, minRating, limit, offset, latitude, longitude, radius, sortBy.
Entidades:
AddressEntity: Representação tipada do modelo Address.
ClientEntity: Representação tipada do modelo Client.
ProviderEntity: Representação tipada do modelo Provider.
4.4. Gerenciamento de Tipos de Serviço (services/)
Este módulo lida com a definição e manutenção dos tipos de serviços genéricos que podem ser oferecidos na plataforma (ex: "Limpeza Padrão", "Instalação Elétrica").

Modelos Chave: Service.
Serviços:
ServicesService: Implementa as operações CRUD básicas para o modelo Service.
create(createServiceDto: CreateServiceDto): Cria um novo tipo de serviço.
findAll(): Retorna todos os tipos de serviço.
findOne(id: string): Busca um tipo de serviço por ID.
update(id: string, updateServiceDto: UpdateServiceDto): Atualiza um tipo de serviço, com tratamento para NotFoundException (P2025).
remove(id: string): Deleta um tipo de serviço, com tratamento para NotFoundException (P2025) e P2003 (erro de integridade referencial se o serviço estiver em uso).
Módulos:
ServicesModule: Não importa outros módulos além do PrismaModule (implícito, via @Global() no PrismaModule). Exporta ServicesService para que outros módulos (como ProviderServicesModule ou SearchModule) possam injetá-lo.
Controladores:
ServicesController:
POST /services: Protegido por JwtAuthGuard e RolesGuard (ADMIN role). Permite que administradores criem novos tipos de serviço.
GET /services: Rota pública. Retorna uma lista de todos os tipos de serviço.
GET /services/:id: Rota pública. Retorna os detalhes de um tipo de serviço específico por ID.
PATCH /services/:id: Protegido por JwtAuthGuard e RolesGuard (ADMIN role). Permite que administradores atualizem tipos de serviço.
DELETE /services/:id: Protegido por JwtAuthGuard e RolesGuard (ADMIN role). Permite que administradores deletem tipos de serviço.
DTOs:
CreateServiceDto: Define a estrutura para a criação de um novo Service, incluindo name (obrigatório), description?, price (obrigatório, number), e icon?.
UpdateServiceDto: Estende PartialType(CreateServiceDto), tornando todas as propriedades opcionais para atualizações parciais.
ServiceDetailsDto: DTO de saída para detalhes de Service, incluindo id, name, description?, icon?, createdAt, updatedAt, e price. O construtor é flexível para aceitar tanto um Service do Prisma quanto um ProviderService (quando aninhado em ProviderDetailsDto).
Entidades:
ServiceEntity: Representação tipada do modelo Service, incluindo o campo price como Prisma.Decimal.
4.5. Serviços Oferecidos por Provedores (provider-services/)
Este módulo gerencia a relação específica entre um provedor e um tipo de serviço, permitindo que cada provedor defina seus próprios preços e descrições para os serviços que oferece.

Modelos Chave: ProviderService, Provider, Service.
Serviços:
ProviderServicesService: Lógica de negócios para ProviderService.
create(providerId: string, createProviderServiceDto: CreateProviderServiceDto): Adiciona um novo serviço oferecido por um provedor. Realiza validações cruciais:
Verifica se o providerId existe (providersService.findUnique).
Verifica se o serviceId (tipo de serviço base) existe (servicesService.findUnique).
Verifica se o provedor já oferece este serviceId (prisma.providerService.findUnique com providerId_serviceId único), lançando ConflictException se duplicado.
findAllByProviderId(providerId: string): Retorna todos os ProviderServices de um provedor, incluindo os detalhes do Service base.
findOne(id: string, providerId: string): Busca um ProviderService específico, garantindo que ele pertença ao providerId fornecido.
update(id: string, providerId: string, updateProviderServiceDto: UpdateProviderServiceDto): Atualiza um ProviderService, com validação de propriedade (findOne).
remove(id: string, providerId: string): Deleta um ProviderService, com validação de propriedade.
Módulos:
ProviderServicesModule: Importa PrismaModule. Exporta ProviderServicesService.
Controladores:
ProviderServicesController: As rotas são aninhadas sob /providers/:providerId/services, o que implica que a operação é sempre contextualizada a um provedor específico.
validateProviderOwnership(req: Request, providerId: string): Um método auxiliar crucial que, usando o userId do token JWT (req.user['userId']) e providersService.findByUserId, verifica se o provedor logado é de fato o proprietário do providerId na URL, evitando que um provedor manipule os serviços de outro. Lança ForbiddenException se não houver permissão.
POST /providers/:providerId/services: Protegido por JwtAuthGuard. Permite que um provedor adicione um novo serviço que ele oferece. Retorna ProviderServiceEntity.
GET /providers/:providerId/services: Rota pública. Lista todos os serviços oferecidos por um provedor específico.
PATCH /providers/:providerId/services/:id: Protegido por JwtAuthGuard. Permite que um provedor atualize um de seus serviços oferecidos.
DELETE /providers/:providerId/services/:id: Protegido por JwtAuthGuard. Permite que um provedor remova um de seus serviços oferecidos.
DTOs:
CreateProviderServiceDto: Define a estrutura para adicionar um serviço oferecido, incluindo serviceId, price, durationMinutes, e description?.
UpdateProviderServiceDto: Define os campos opcionais para atualizar um ProviderService, como price?, durationMinutes?, description?.
Entidades:
ProviderServiceEntity: Representação tipada do modelo ProviderService, incluindo o campo price como Prisma.Decimal.
4.6. Agendamentos (bookings/)
Este módulo gerencia todo o ciclo de vida dos agendamentos de serviços, desde a criação até a atualização de status.

Modelos Chave: Booking, Client, Provider, ProviderService, Address, Review, Transaction.
Serviços:
BookingsService: A principal orquestrador das operações de agendamento.
create(clientUserId: string, createBookingDto: CreateBookingDto):
Validação de Entidades: Injeta e chama clientsService.findClientByUserId, providersService.findOne, e providerServicesService.findOne para garantir que o cliente, provedor e serviço do provedor existam e sejam válidos.
Criação de Endereço: Cria um novo registro Address no PrismaService com os dados fornecidos em createBookingDto.address. Isso garante que cada agendamento tenha um endereço de serviço específico, mesmo que o cliente já tenha um endereço cadastrado.
Criação do Agendamento: Cria o Booking no PrismaService, vinculando-o ao cliente, provedor, serviço do provedor e ao novo Address criado. O totalPrice é convertido para Prisma.Decimal. O status inicial é PENDING.
Retorno Detalhado: Retorna o Booking criado com todas as relações (client, provider, providerService, review, address) incluídas, usando o tipo BookingWithDetailsRelations.
createBookingAndPixCharge(clientUserId: string, createBookingDto: CreateBookingDto):
Orquestração Multi-Serviço: Primeiro, chama this.create(clientUserId, createBookingDto) para criar o agendamento.
Integração com Pagamentos: Em seguida, chama paymentsService.createPixCharge para gerar uma cobrança PIX. É crucial que o providerId correto seja extraído do booking recém-criado e passado para o serviço de pagamentos.
Resposta Combinada: Retorna um objeto contendo o booking e a resposta da pixCharge.
findUserBookings(userId: string, role: UserRole, status?: string):
Filtro por Papel: Determina a cláusula WHERE baseada no role do usuário (clientId para CLIENT, providerId para PROVIDER). ADMINs podem ver todos.
Validação de Status: Valida e converte a string status (do query param) para o enum BookingStatus do Prisma.
Consulta: Retorna uma lista de Bookings com detalhes completos.
findOne(id: string): Busca um Booking por ID com todas as relações detalhadas.
updateStatus(id: string, newStatus: BookingStatus, userRole: UserRole):
Validação de Existência: Verifica se o agendamento existe.
Lógica de Permissão/Transição: Implementa regras de negócio complexas para transições de status:
CLIENTs só podem CANCELED (e não podem cancelar agendamentos já COMPLETED ou CANCELED).
PROVIDERs podem CONFIRMED (de PENDING), COMPLETED (de CONFIRMED), CANCELED, ou RESCHEDULED, com restrições similares para status finais.
ADMINs têm permissão total para alterar status.
Atualização: Atualiza o status do Booking no PrismaService.
findUpcomingBookings(providerId: string):
Filtro de Data/Hora: Busca agendamentos para um providerId com status PENDING, CONFIRMED ou RESCHEDULED.
Filtra scheduledDate a partir da data atual.
Pós-filtro em Memória: Uma filtragem adicional em memória garante que agendamentos no dia atual que já passaram do scheduledTime não sejam incluídos, fornecendo uma lista precisa de "próximos" agendamentos.
Módulos:
BookingsModule: Importa PrismaModule, ClientsModule, ProvidersModule, ProviderServicesModule. Utiliza forwardRef(() => PaymentsModule) para resolver uma dependência circular, já que BookingsService precisa de PaymentsService e PaymentsService pode precisar de BookingsService (para atualizar o status do booking via webhook, por exemplo). Exporta BookingsService.
Controladores:
BookingsController:
POST /bookings: Protegido por JwtAuthGuard e RolesGuard (CLIENT role). Permite que um cliente crie um agendamento.
POST /bookings/schedule-and-pay: Protegido por JwtAuthGuard e RolesGuard (CLIENT role). Nova rota que orquestra a criação do agendamento e a geração da cobrança PIX em uma única chamada de API. Retorna BookingAndPixResponseDto.
GET /bookings/me: Protegido por JwtAuthGuard. Retorna os agendamentos do usuário logado (seja cliente ou provedor), com filtro opcional por status.
GET /bookings/:id: Protegido por JwtAuthGuard. Retorna detalhes de um agendamento específico. Inclui lógica de autorização para garantir que apenas o cliente, provedor ou um ADMIN associado ao agendamento possa visualizá-lo.
PATCH /bookings/:id/status: Protegido por JwtAuthGuard e RolesGuard (PROVIDER ou CLIENT role). Permite a atualização do status do agendamento, delegando a lógica de permissão e transição ao BookingsService.
PATCH /bookings/:id/cancel: Protegido por JwtAuthGuard e RolesGuard (CLIENT role). Um endpoint específico para clientes cancelarem seus agendamentos, chamando bookingsService.updateStatus com BookingStatus.CANCELED.
DTOs:
CreateBookingDto: Define os dados de entrada para criar um agendamento, incluindo providerId, providerServiceId, scheduledDate, scheduledTime, totalPrice, notes?, e um address aninhado (CreateAddressDto).
UpdateBookingStatusDto: Define o novo status para a atualização do agendamento.
BookingDetailsDto: DTO de saída abrangente para um agendamento, transformando o Booking do Prisma (com suas relações) em um formato amigável para a API. Inclui clientFullName, clientEmail, providerFullName, providerEmail, serviceName, servicePrice, serviceDurationMinutes, scheduledDateTime (combinando data e hora), status, totalPrice, notes, createdAt, updatedAt, e address.
BookingAndPixResponseDto: Combina BookingDetailsDto e PixChargeResponseDto para a resposta da operação schedule-and-pay.
Entidades:
BookingEntity: Representação tipada do modelo Booking, incluindo o campo totalPrice como Prisma.Decimal e o addressId.
4.7. Pagamentos (payments/)
Este módulo gerencia as operações financeiras, como a criação de cobranças e o processamento de saques, além de lidar com webhooks de gateways de pagamento.

Modelos Chave: Transaction, Provider, Booking.
Serviços:
PaymentsService: Orquestra as operações de pagamento.
createPixCharge(clientId: string, dto: CreatePixChargeDto):
Validação: Verifica a existência do providerId fornecido no DTO.
Criação de Transação: Cria um registro Transaction no PrismaService com type: TransactionType.PAYMENT e status: 'PENDING'.
Simulação de Gateway: Simula a resposta de um gateway PIX, gerando brCode, qrCodeImage e expiresAt.
Atualização de Booking: Se um bookingId for fornecido, busca o Booking correspondente e atualiza seu status para BookingStatus.PENDING, indicando que o pagamento está aguardando.
Retorno: Retorna PixChargeResponseDto com os detalhes da cobrança.
requestWithdrawal(providerId: string, dto: RequestWithdrawalDto):
Validação: Verifica a existência do providerId.
Criação de Transação: Cria um registro Transaction com type: TransactionType.WITHDRAWAL e status: 'REQUESTED'.
Retorno: Retorna MessageResponseDto de sucesso.
handlePixWebhook(webhookData: any):
Processamento de Webhook: Este é um método crítico para a comunicação assíncrona com gateways de pagamento.
Validação de Dados: Verifica a presença de transactionId e status nos dados do webhook.
Busca de Transação: Encontra a Transaction correspondente no PrismaService.
Evitar Duplicidade: Ignora o webhook se o status da transação já for o mesmo.
Atualização de Status: Mapeia o status do webhook (COMPLETED, PAID, FAILED, CANCELED, REFUNDED) para um novo status de Transaction e BookingStatus (CONFIRMED ou CANCELED).
Atualização de Booking: Se a transação estiver associada a um bookingId, atualiza o status do Booking correspondente.
Logging: Utiliza Logger extensivamente para depuração e monitoramento do fluxo do webhook.
Módulos:
PaymentsModule: Importa PrismaModule. Não utiliza forwardRef para BookingsModule em sua própria definição, mas BookingsModule usa forwardRef para PaymentsModule, o que resolve a dependência circular. Exporta PaymentsService.
Controladores:
PaymentsController:
POST /payments/pix-charge: Protegido por JwtAuthGuard. Permite que um cliente crie uma cobrança PIX.
POST /payments/withdrawal: Protegido por JwtAuthGuard. Permite que um provedor solicite um saque.
POST /payments/webhook/pix: Endpoint público. Este endpoint é projetado para ser chamado por gateways de pagamento externos. Não requer autenticação, pois a segurança é tratada pela origem do webhook e validação interna dos dados.
DTOs:
CreatePixChargeDto: Define os dados para iniciar uma cobrança PIX, incluindo amount, description, e opcionalmente bookingId e providerId.
PixChargeResponseDto: Retorna os detalhes da cobrança PIX gerada, como transactionId, status, brCode, qrCodeImage, expiresAt, amount, description, e o bookingId associado.
RequestWithdrawalDto: Define os dados para uma solicitação de saque, incluindo amount, bankName, agencyNumber, accountNumber, accountType, e notes?.
MessageResponseDto: Um DTO genérico para respostas simples de sucesso.
Entidades:
TransactionEntity: Representação tipada do modelo Transaction, incluindo amount como Prisma.Decimal e bookingId.
4.8. Ganhos do Provedor (earnings/)
Este módulo fornece aos provedores uma visão detalhada de seus ganhos e a funcionalidade para solicitar saques.

Modelos Chave: Booking, Transaction, Provider.
Serviços:
EarningsService:
getEarnings(userId: string):
Busca de Provedor: Primeiro, encontra o Provider associado ao userId usando providersService.findByUserId.
Cálculo de Ganhos Totais: Soma totalPrice de todos os Bookings com status: BookingStatus.COMPLETED para o provedor.
Cálculo de Saques Pendentes: Soma amount de Transactions com type: TransactionType.WITHDRAWAL e status: 'PENDING'.
Cálculo de Saldo Disponível: Calcula totalEarnings - totalWithdrawn (todos os saques, concluídos e pendentes), garantindo que o resultado não seja negativo.
Transações Recentes: Busca as 10 Transactions mais recentes do provedor.
Breakdown Mensal: Agrega os ganhos (TransactionType.PAYMENT) por mês nos últimos 12 meses para um earningsBreakdown.
Retorno: Retorna EarningsResponseDto com todos esses dados agregados.
requestWithdrawal(userId: string, withdrawalDto: WithdrawalRequestDto):
Validação de Saldo: Recalcula o availableBalance em tempo real (total de ganhos - total sacado) para garantir que o provedor tenha saldo suficiente para o saque solicitado.
Criação de Transação: Cria uma nova Transaction com type: TransactionType.WITHDRAWAL e status: 'PENDING'.
Tratamento de Erro: Captura erros de banco de dados e lança BadRequestException.
Retorno: Retorna WithdrawalResponseDto com sucesso e transactionId.
Módulos:
EarningsModule: Importa PrismaModule e ProvidersModule (para ProvidersService). Exporta EarningsService.
Controladores:
EarningsController: As rotas são aninhadas sob /providers/me/earnings.
GET /providers/me/earnings: Protegido por AuthGuard('jwt'). Permite que o provedor logado obtenha seus dados de ganhos.
POST /providers/me/earnings/withdrawal: Protegido por AuthGuard('jwt'). Permite que o provedor logado solicite um saque.
DTOs:
TransactionDto: DTO auxiliar para representar transações no EarningsResponseDto.
EarningsResponseDto: DTO de saída para o dashboard de ganhos, incluindo totalEarnings, availableForWithdrawal, pendingWithdrawals, recentTransactions, e earningsBreakdown.
WithdrawalRequestDto: DTO de entrada para uma solicitação de saque, incluindo amount e withdrawalAccountInfo?.
WithdrawalResponseDto: DTO de saída para a resposta de uma solicitação de saque.
4.9. Avaliações (reviews/)
Este módulo permite que clientes avaliem os serviços prestados pelos provedores e gerencia a recuperação dessas avaliações.

Modelos Chave: Review, Booking, Client, Provider.
Serviços:
ReviewsService:
submitReview(clientId: string, submitReviewDto: SubmitReviewDto):
Validação de Agendamento: Busca o Booking pelo bookingId e verifica se ele existe.
Autorização: Garante que o clientId que está enviando a avaliação é o mesmo clientId do agendamento.
Regras de Negócio: Verifica se o Booking.status é COMPLETED (avaliações apenas para serviços concluídos) e se o agendamento ainda não possui uma avaliação (booking.review). Lança BadRequestException ou ConflictException conforme necessário.
Criação: Cria o registro Review no PrismaService, vinculando-o ao bookingId, clientId e providerId.
findReviews(getReviewsDto: GetReviewsDto):
Filtros Dinâmicos: Constrói uma cláusula WHERE dinâmica baseada em providerId?, clientId?, minRating?, maxRating?.
Inclusões: Inclui client (com fullName e user.avatarUrl), provider (com fullName), e booking (com scheduledDate, scheduledTime) para enriquecer os dados da avaliação.
Ordenação: Ordena por createdAt em ordem decrescente.
findRecentReviewsByProviderId(providerId: string): Busca as 5 avaliações mais recentes para um providerId específico, incluindo detalhes do cliente (fullName, user.avatarUrl).
findOne(id: string): Busca uma única avaliação por ID, incluindo detalhes básicos do cliente, provedor e agendamento.
Módulos:
ReviewsModule: Importa PrismaModule, BookingsModule, ClientsModule, ProvidersModule, ProviderServicesModule. Exporta ReviewsService.
Controladores:
ReviewsController:
POST /reviews: Protegido por JwtAuthGuard e RolesGuard (CLIENT role). Permite que um cliente envie uma nova avaliação.
GET /reviews: Rota pública. Permite obter avaliações com filtros.
GET /reviews/:id: Rota pública. Permite obter detalhes de uma avaliação específica por ID.
DTOs:
SubmitReviewDto: Define os dados de entrada para enviar uma avaliação, incluindo bookingId, rating, e comment?.
GetReviewsDto: Define os parâmetros de consulta para filtrar avaliações, incluindo providerId?, clientId?, minRating?, maxRating?.
ReviewDto: DTO de saída para uma avaliação, incluindo id, bookingId, clientId, providerId, rating, comment?, createdAt, updatedAt, e client (com fullName e avatarUrl).
Entidades:
ReviewEntity: Representação tipada do modelo Review, incluindo updatedAt e a restrição @@unique([bookingId, clientId, providerId]).
4.10. Verificação de Provedores (verification/)
Este módulo implementa um processo de verificação multifacetado para provedores, garantindo a legitimidade e segurança da plataforma.

Modelos Chave: Provider.
Serviços:
CriminalBackgroundCheckService:
checkCpf(cpf: string): Simulação. Este serviço simula a verificação de antecedentes criminais de um CPF. Em um ambiente de produção, seria integrado a uma API de terceiros (ex: ClearSale, Serasa). A simulação inclui um delay e uma lógica para CPFs de teste que sempre falham.
DocumentProcessingService:
uploadImage(file: File, path: string): Simulação. Simula o upload de um arquivo de imagem para um armazenamento externo, retornando uma URL mockada.
processDocumentOcr(file: File): Simulação. Simula o processamento OCR de um documento para extrair texto.
compareFaces(selfieFile: File, documentImageUrl: string): Simulação. Simula a comparação facial entre uma selfie e uma imagem de documento.
performLivenessCheck(selfieFile: File): Simulação. Simula a verificação de prova de vida (liveness check) em uma selfie.
VerificationService: Orquestra o fluxo de verificação, utilizando os serviços de simulação.
submitCpfForBackgroundCheck(providerId: string, cpf: string):
Atualização de CPF: Atualiza o campo cpf do Provider.
Verificação: Chama criminalBackgroundCheckService.checkCpf.
Atualização de Status: Atualiza Provider.backgroundCheckResult e define Provider.verificationStatus para PENDING_MANUAL_REVIEW se hasIssues for true, ou PENDING_DOCUMENTS_UPLOAD caso contrário.
uploadDocumentPhoto(providerId: string, file: File, type: 'FRONT' | 'BACK'):
Upload: Chama documentProcessingService.uploadImage para o arquivo.
Atualização de URL: Atualiza Provider.documentPhotoFrontUrl ou Provider.documentPhotoBackUrl.
Transição de Status: Se ambas as fotos (frente e verso) estiverem presentes e o status for PENDING_DOCUMENTS_UPLOAD, o verificationStatus é atualizado para PENDING_MANUAL_REVIEW.
uploadSelfieWithDocument(providerId: string, file: File):
Upload: Chama documentProcessingService.uploadImage para a selfie.
Atualização de URL: Atualiza Provider.selfieWithDocumentUrl.
Atualização de Status: Chama updateProviderVerificationStatus para reavaliar o status geral.
updateProviderVerificationStatus(providerId: string):
Lógica de Transição: Verifica o estado atual do provedor (CPF verificado, documentos e selfie carregados).
Se todos os requisitos forem atendidos e não houver pendências criminais, e o status não for PENDING_MANUAL_REVIEW, o verificationStatus é definido como APPROVED.
Caso contrário, se os requisitos forem atendidos mas houver pendências (ou outros motivos), o status pode ser definido como PENDING_MANUAL_REVIEW.
rejectProvider(providerId: string, reason: string): Define o verificationStatus como REJECTED e registra o rejectionReason.
Módulos:
VerificationModule: Importa PrismaModule, ProvidersModule. Exporta VerificationService.
Controladores:
VerificationController:
POST /verification/cpf: Protegido por JwtAuthGuard. Permite que um provedor envie seu CPF para verificação.
POST /verification/documents/identity: Protegido por JwtAuthGuard. Utiliza FileInterceptor('file') para lidar com o upload de arquivos e ParseFilePipe para validação (tamanho, tipo de arquivo). Permite o upload de fotos de documentos de identidade (frente/verso).
POST /verification/documents/selfie: Protegido por JwtAuthGuard. Similar ao anterior, permite o upload de uma selfie com documento.
DTOs:
SubmitCpfDto: Define o cpf para submissão, com validações de formato e comprimento.
UploadDocumentDto: Define o type (FRONT ou BACK) para o upload de documentos.
UploadSelfieDto: Atualmente não possui campos adicionais, apenas o arquivo.
Enums:
VerificationStatus: Enum para os diferentes estados do processo de verificação.
DocumentPhotoType: Enum para o tipo de foto do documento (FRONT ou BACK).
4.11. Notificações (notifications/)
Este módulo gerencia o sistema de notificações da aplicação, permitindo a criação, recuperação e gerenciamento do status de leitura das notificações para os usuários.

Modelos Chave: Notification, User.
Serviços:
NotificationsService:
createNotification(userId: string, type: string, message: string, targetUrl?: string): Cria um novo registro de Notification para um userId específico.
getUserNotifications(userId: string, includeRead: boolean = false): Retorna uma lista de notificações para um userId, com a opção de incluir ou excluir notificações já lidas. Ordena por createdAt em ordem decrescente.
markNotificationsAsRead(userId: string, markAsReadDto: MarkAsReadDto): Marca notificações como lidas. Se notificationIds forem fornecidos no DTO, marca apenas as específicas; caso contrário, marca todas as notificações não lidas do usuário. Garante que o usuário só possa marcar suas próprias notificações.
markNotificationByIdAsRead(notificationId: string, userId: string): Marca uma única notificação como lida, com validação de propriedade.
deleteNotification(notificationId: string, userId: string): Deleta uma notificação, com validação de propriedade.
Módulos:
NotificationsModule: Importa PrismaModule e AuthModule (para JwtAuthGuard). Exporta NotificationsService para que outros módulos possam criar notificações.
Controladores:
NotificationsController: Todas as rotas são protegidas por JwtAuthGuard.
GET /notifications/me: Retorna as notificações do usuário logado, com um query param includeRead para filtrar.
PATCH /notifications/me/mark-as-read: Permite que o usuário logado marque várias notificações como lidas (em lote).
PATCH /notifications/:id/mark-as-read: Permite que o usuário logado marque uma notificação específica como lida.
DELETE /notifications/:id: Permite que o usuário logado exclua uma notificação específica.
DTOs:
MarkAsReadDto: Define uma lista opcional de notificationIds para marcar como lidas.
NotificationEntity: Representação tipada do modelo Notification.
Entidades:
NotificationEntity: Representação tipada do modelo Notification.
4.12. Chat (Mensagens) (chat/)
Este módulo facilita a comunicação em tempo real entre usuários (clientes e provedores) através de mensagens de chat, utilizando tanto HTTP quanto WebSockets.

Modelos Chave: Chat, Message, User.
Serviços:
ChatService: Contém a lógica de negócios para o chat.
findOrCreateChat(clientId: string, providerId: string):
Lógica de Chat Único: Tenta encontrar um Chat existente entre os dois participantes (clientId e providerId), verificando ambas as ordens de participant1Id/participant2Id.
Criação Condicional: Se nenhum chat for encontrado, cria um novo Chat no PrismaService.
Retorno: Retorna um ChatDetailsDto contendo o chatId.
createMessage(chatId: string, senderId: string, receiverId: string, content: string):
Validação de Chat: Verifica se o chatId existe no PrismaService.
Validação de Participantes: Garante que senderId e receiverId são participantes válidos do chat e que um usuário não pode enviar mensagem para si mesmo.
Criação de Mensagem: Cria o registro Message no PrismaService com o conteúdo, remetente, destinatário, timestamp e status de leitura.
getMessagesByChatId(chatId: string, offset: number = 0, limit: number = 50):
Paginação: Retorna mensagens de um chatId específico, com opções de offset e limit para paginação.
Ordenação: Ordena as mensagens por timestamp em ordem crescente.
Inclusões: Inclui dados básicos do sender e receiver (id, email).
Módulos:
ChatModule: Importa PrismaModule e AuthModule (para WsAuthGuard). Exporta ChatService.
Controladores:
ChatController: Lida com requisições HTTP relacionadas ao chat. Todas as rotas são protegidas por JwtAuthGuard.
GET /chat/find-or-create/provider/:providerId/client/:clientId: Permite encontrar ou criar um chat. Inclui validações de permissão para garantir que apenas o cliente ou provedor envolvido (ou um ADMIN) possa iniciar/acessar o chat.
POST /chat/:chatId/messages: Permite o envio de mensagens via API RESTful. O senderId é obtido do token JWT.
GET /chat/:chatId/messages: Permite a recuperação do histórico de mensagens de um chat via API RESTful, com paginação.
Gateways (WebSockets):
ChatGateway: Lida com a comunicação em tempo real.
@WebSocketGateway: Configurado com cors: { origin: '*', credentials: true } para permitir conexões WebSocket de diferentes origens.
handleConnection(client: Socket): Registra a conexão de um novo cliente WebSocket.
handleDisconnect(client: Socket): Registra a desconexão de um cliente WebSocket.
@SubscribeMessage('sendMessage'):
Autenticação: Protegido por WsAuthGuard, que autentica o cliente WebSocket e anexa o userId ao client.data.
Criação de Mensagem: Chama chatService.createMessage com os dados do payload e o senderId autenticado.
Emissão em Tempo Real: this.server.to(payload.chatId).emit('newMessage', message) emite a nova mensagem para todos os clientes conectados à sala de chat correspondente, garantindo a atualização em tempo real.
@SubscribeMessage('joinChat'): Permite que um cliente WebSocket se junte a uma "sala" de chat específica (client.join(chatId)), para que possa receber mensagens destinadas a essa conversa.
DTOs:
ChatDetailsDto: DTO de saída simples que retorna o chatId após encontrar ou criar um chat.
SendMessageDto: Define os dados para enviar uma mensagem, incluindo chatId, receiverId, e content.
GetMessagesDto: Define os parâmetros de consulta para paginar mensagens, incluindo offset? e limit?.
Entidades:
Message (from message.entity.ts): Representação tipada do modelo Message.
4.13. Busca (search/)
Este módulo oferece uma funcionalidade de busca unificada para diferentes tipos de entidades na plataforma, como provedores e serviços.

Modelos Chave: Provider, Service.
Serviços:
SearchService: Atua como um fachada para a funcionalidade de busca.
performSearch(searchQueryDto: SearchQueryDto):
Orquestração: Delega a busca para providersService.search (para provedores) e servicesService.findAll (para tipos de serviço).
Filtro Condicional: Realiza a busca para providers, services ou all com base no type especificado no searchQueryDto.
Mapeamento de DTOs: Mapeia os resultados retornados pelos serviços para ProviderDetailsDto e ServiceDetailsDto para garantir uma resposta padronizada.
Módulos:
SearchModule: Importa ProvidersModule e ServicesModule para que SearchService possa injetar ProvidersService e ServicesService.
Controladores:
SearchController:
GET /search: Rota pública. Recebe um SearchQueryDto como parâmetros de consulta e retorna um SearchResultDto que contém listas de ProviderDetailsDto e ServiceDetailsDto.
DTOs:
SearchQueryDto: Define os parâmetros de entrada para a busca, incluindo query? (termo de busca geral), type? (tipo de entidade a buscar: providers, services, offers, all), location?, date?, limit?, offset?, latitude?, longitude?, radius?, e sortBy? (SortByOption).
SearchResultDto: DTO de saída que agrega os resultados da busca, contendo providers: ProviderDetailsDto[] e services: ServiceDetailsDto[].
SortByOption: Enum para as opções de ordenação (Rating, Distance, Experience, CreatedAt, UpdatedAt, FullName).
4.14. Dashboard do Provedor (dashboard/)
Este módulo fornece uma visão consolidada e resumida de informações importantes para o provedor logado, como agendamentos futuros, ganhos e avaliações recentes.

Modelos Chave: Provider, Booking, Transaction, Review.
Serviços:
DashboardService:
getDashboardData(userId: string):
Orquestração: Atua como um agregador de dados de múltiplos serviços.
Provedor: Busca o Provider associado ao userId usando providersService.findByUserId.
Agendamentos Futuros: Chama bookingsService.findUpcomingBookings(provider.id).
Sumário de Ganhos: Chama earningsService.getEarnings(userId).
Avaliações Recentes: Chama reviewsService.findRecentReviewsByProviderId(provider.id).
Retorno: Agrega todas essas informações em um DashboardDto.
Módulos:
DashboardModule: Importa ProvidersModule, BookingsModule, EarningsModule, e ReviewsModule.
Controladores:
DashboardController:
GET /providers/me/dashboard: Protegido por AuthGuard('jwt'). Permite que o provedor logado acesse seu dashboard. O userId é extraído do token JWT.
DTOs:
DashboardDto: DTO de saída para o dashboard do provedor, incluindo fullName, upcomingBookings?, totalEarnings, pendingWithdrawals, e reviews?.
4.15. Ofertas/Promoções (offers/)
Este módulo gerencia a criação, recuperação, atualização e exclusão de ofertas e promoções disponíveis na plataforma.

Modelos Chave: Offer.
Serviços:
OffersService: Implementa as operações CRUD para o modelo Offer.
create(createOfferDto: CreateOfferDto): Cria uma nova oferta, convertendo validUntil de string para Date.
findAll(): Retorna todas as ofertas, ordenadas por createdAt em ordem decrescente.
findOne(id: string): Busca uma oferta por ID.
update(id: string, updateOfferDto: UpdateOfferDto): Atualiza uma oferta existente, com tratamento para NotFoundException. Converte validUntil se presente.
remove(id: string): Deleta uma oferta, com tratamento para NotFoundException.
Módulos:
OffersModule: Importa PrismaModule. Exporta OffersService.
Controladores:
OffersController:
POST /offers: Protegido por JwtAuthGuard e RolesGuard (ADMIN role). Permite que administradores criem novas ofertas.
GET /offers: Rota pública. Retorna uma lista de todas as ofertas.
GET /offers/:id: Rota pública. Retorna os detalhes de uma oferta específica por ID. Lança NotFoundException se a oferta não for encontrada.
PATCH /offers/:id: Protegido por JwtAuthGuard e RolesGuard (ADMIN role). Permite que administradores atualizem ofertas.
DELETE /offers/:id: Protegido por JwtAuthGuard e RolesGuard (ADMIN role). Permite que administradores excluam ofertas.
DTOs:
CreateOfferDto: Define a estrutura para a criação de uma oferta, incluindo title, description?, discountPercentage?, fixedDiscountAmount?, validUntil (como string ISO 8601), e imageUrl?.
UpdateOfferDto: Estende PartialType(CreateOfferDto), tornando todas as propriedades opcionais para atualizações parciais.
Entidades:
Offer (from offer.entity.ts): Representação tipada do modelo Offer.
4.16. Disponibilidade do Provedor (availability/)
Este módulo permite que os provedores gerenciem seus horários de disponibilidade e que os clientes visualizem esses horários, levando em consideração os agendamentos já confirmados.

Modelos Chave: Availability, Provider, Booking.
Serviços:
AvailabilityService:
getAvailability(providerId: string, query: GetAvailabilityDto):
Validação: Verifica a existência do providerId. Exige o parâmetro date na query.
Cálculo de Dia da Semana (UTC): Correção Crítica: Converte a date fornecida para um objeto Date em UTC (Date.UTC(year, month - 1, day)) e obtém o dia da semana em UTC (getUTCDay()). Isso é fundamental para evitar problemas de fuso horário que poderiam levar a cálculos incorretos do dia da semana.
Disponibilidade Configurada: Busca todos os slots de Availability configurados para o providerId e o dayOfWeek calculado.
Horários Ocupados: Busca Bookings com status: CONFIRMED ou COMPLETED para o providerId na date específica (também usando UTC para a comparação de datas). Mapeia os scheduledTimes desses bookings para occupiedTimes.
Retorno: Retorna um objeto contendo available (slots configurados) e occupiedTimes (horários já agendados).
updateAvailability(providerId: string, updateAvailabilityDtos: UpdateAvailabilityDto[]):
Operações em Lote: Permite adicionar, atualizar ou deletar múltiplos slots de disponibilidade em uma única chamada.
Lógica Condicional: Para cada DTO:
Se id existe e isAvailable === false, deleta o slot.
Se id existe e isAvailable !== false, atualiza o slot existente.
Se id não existe, cria um novo slot.
Validação de Conflito: Antes de criar um novo slot, verifica se já existe um slot com o mesmo dayOfWeek, startTime e endTime para o provedor, lançando ConflictException.
createAvailability(providerId: string, createDto: UpdateAvailabilityDto): Adiciona um único slot de disponibilidade, com validação de provedor e conflito.
deleteAvailability(availabilityId: string, providerId: string): Deleta um slot de disponibilidade, com validação de propriedade.
Módulos:
AvailabilityModule: Importa ProvidersModule (para ProvidersService).
Controladores:
AvailabilityController: As rotas são aninhadas sob /providers/:providerId/availability.
validateProviderOwnership(req: Request, providerId: string): Método auxiliar para garantir que apenas o provedor logado possa gerenciar sua própria disponibilidade, similar ao ProviderServicesController.
GET /providers/:providerId/availability: Rota pública. Retorna os horários de disponibilidade de um provedor, incluindo os horários já ocupados por agendamentos. Requer o query param date.
PATCH /providers/:providerId/availability: Protegido por JwtAuthGuard e RolesGuard (PROVIDER role). Permite que um provedor atualize seus horários de disponibilidade em lote.
POST /providers/:providerId/availability: Protegido por JwtAuthGuard e RolesGuard (PROVIDER role). Permite que um provedor adicione um novo slot de disponibilidade.
DELETE /providers/:providerId/availability/:availabilityId: Protegido por JwtAuthGuard e RolesGuard (PROVIDER role). Permite que um provedor delete um slot de disponibilidade.
DTOs:
UpdateAvailabilityDto: Define os dados para criar, atualizar ou deletar um slot de disponibilidade, incluindo id?, dayOfWeek, startTime, endTime, e isAvailable?.
GetAvailabilityDto: Define os parâmetros de consulta para buscar a disponibilidade, incluindo dayOfWeek? e date?. O campo date é crucial para a lógica de horários ocupados.
Entidades:
AvailabilityEntity: Representação tipada do modelo Availability.
5. Aspectos Transversais
5.1. Tratamento de Erros (common/filters/http-exception.filter.ts)
HttpExceptionFilter: Implementa a interface ExceptionFilter do NestJS e é registrado globalmente em main.ts.
Funcionalidade: Intercepta todas as exceções do tipo HttpException (e suas subclasses como NotFoundException, BadRequestException, UnauthorizedException, etc.) que são lançadas na aplicação.
Padronização da Resposta: Transforma a exceção em uma resposta JSON consistente para o cliente. A resposta inclui:
statusCode: O código HTTP da exceção (ex: 404, 400).
timestamp: A data e hora em que o erro ocorreu.
path: A URL da requisição que causou o erro.
message: Uma string que pode ser a mensagem da exceção ou uma concatenação de mensagens de validação (se o erro for um BadRequestException de ValidationPipe).
errors: Um array de strings, especialmente útil para erros de validação, onde cada item representa uma falha de validação específica.
Benefício: Garante uma experiência consistente para o cliente em caso de erros, facilitando o tratamento de erros no frontend e melhorando a clareza da API.
5.2. Validação de Dados (main.ts, common/pipes/validation.pipe.ts)
ValidationPipe (global): Configurado em main.ts com app.useGlobalPipes(new ValidationPipe(...)).
Integração: Trabalha em conjunto com as bibliotecas class-validator e class-transformer.
class-validator: Permite a definição de regras de validação declarativas diretamente nas classes DTO (ex: @IsString(), @IsEmail(), @MinLength(), @IsUUID(), @Min(), @Max(), @Matches(), @ValidateNested()).
class-transformer: Facilita a transformação de objetos planos (recebidos via requisições HTTP) em instâncias das classes DTO, permitindo que os validadores funcionem corretamente. Também é usado com @Type(() => ClassName) para transformar objetos aninhados (como CreateAddressDto dentro de CreateBookingDto).
Configurações do ValidationPipe:
whitelist: true: Remove automaticamente quaisquer propriedades do corpo da requisição que não estejam definidas no DTO correspondente.
forbidNonWhitelisted: true: Lança um erro se a requisição contiver propriedades que não estão definidas no DTO, garantindo que apenas dados esperados sejam processados.
transform: true: Converte automaticamente os tipos de dados da requisição para os tipos definidos no DTO (ex: string para number, string ISO para Date).
transformOptions: { enableImplicitConversion: true }: Habilita a conversão implícita de tipos, como strings numéricas para números.
CustomValidationPipe (exemplo): Embora o ValidationPipe padrão do NestJS seja robusto, um CustomValidationPipe (como o fornecido no anexo validation.pipe.ts) pode ser usado para personalizar ainda mais a formatação dos erros de validação, agregando-os de uma forma específica.
Benefício: Garante a integridade dos dados de entrada da API, reduzindo a quantidade de código boilerplate para validação em cada rota e fornecendo mensagens de erro claras para o cliente.
5.3. Configuração de Ambiente (config/validation-schema.ts, config/configuration.ts, config/config.module.ts)
ConfigService: Módulo do NestJS (@nestjs/config) para carregar e gerenciar variáveis de ambiente de forma segura e estruturada.
validation-schema.ts: Utiliza a biblioteca Joi para definir um esquema de validação rigoroso para as variáveis de ambiente essenciais (ex: NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRATION_TIME). Isso garante que todas as variáveis críticas estejam presentes e tenham o formato correto antes que a aplicação inicie.
configuration.ts: Define uma função que carrega as variáveis de ambiente do process.env e as organiza em um objeto JavaScript estruturado. Isso permite que as configurações sejam acessadas de forma tipada e organizada em toda a aplicação (ex: configService.get('jwt.secret')).
config.module.ts: Importa o NestConfigModule.forRoot com as seguintes opções:
isGlobal: true: Torna o ConfigService disponível para injeção em qualquer módulo da aplicação sem a necessidade de importação explícita.
load: [configuration]: Carrega as configurações definidas em configuration.ts.
validationSchema: Aplica o esquema de validação Joi para as variáveis de ambiente.
envFilePath: '.env': Especifica o caminho para o arquivo .env onde as variáveis de ambiente estão definidas.
Benefício: Garante que o ambiente de execução esteja configurado corretamente antes da inicialização da aplicação, prevenindo erros de tempo de execução relacionados a variáveis ausentes ou mal formatadas, e promove a segurança ao centralizar o acesso a segredos.
5.4. Logging
Logger do NestJS: Uma classe utilitária (@nestjs/common) utilizada em vários serviços e controladores (BookingsService, AvailabilityService, ChatGateway, PaymentsService, ProvidersService, DashboardService, ReviewsService, WsAuthGuard).
Funcionalidade: Permite registrar mensagens de diferentes níveis (log, error, warn, debug, verbose) para monitorar o comportamento da aplicação em tempo de execução.
Implementação: Instanciado com o nome da classe (private readonly logger = new Logger(ClassName.name);) para facilitar a identificação da origem dos logs.
Benefício: Ajuda na monitorização da aplicação em produção, na depuração de problemas durante o desenvolvimento e na auditoria de eventos importantes.
6. Considerações de Desenvolvimento e Implantação
Prisma binaryTargets: A configuração binaryTargets = ["native", "debian-openssl-1.1.x", "debian-openssl-3.0.x"] no schema.prisma é uma otimização crucial para ambientes de implantação baseados em Docker ou Linux. Ela garante que o motor de consulta binário do Prisma Client seja compatível com diferentes distribuições Linux e versões do OpenSSL, evitando erros comuns de "library not found" em contêineres.
Prisma.Decimal para Valores Monetários: O uso do tipo Decimal do Prisma (@db.Decimal(10, 2)) para campos como price, totalPrice, e amount é uma prática recomendada para lidar com valores monetários. Ao contrário dos tipos de ponto flutuante (Float), Decimal garante precisão exata em cálculos financeiros, evitando erros de arredondamento. No código, isso requer a conversão explícita usando new Prisma.Decimal(value) ao gravar e value.toNumber() ao ler para interagir com tipos number do TypeScript.
Consistência na Manipulação de Datas (Date Objects): A aplicação mantém uma consistência rigorosa na manipulação de datas. Datas são armazenadas como DateTime no Prisma. No backend, são convertidas entre objetos Date do JavaScript e strings ISO 8601 (toISOString()) para transmissão via API. O BookingDetailsDto e AvailabilityService demonstram um tratamento defensivo e preciso para combinar partes de data e hora e lidar com fusos horários (usando Date.UTC e getUTCDay()) para garantir a correta interpretação e comparação de datas/horários, independentemente do fuso horário do servidor.
Hooks de Desligamento do Prisma: O PrismaService implementa OnModuleInit e OnModuleDestroy para gerenciar o ciclo de vida da conexão com o banco de dados. Além disso, a lógica de enableShutdownHooks utilizando process.on('SIGINT') e process.on('SIGTERM') garante que a conexão com o banco de dados seja graciosamente fechada quando o processo da aplicação recebe um sinal de encerramento (ex: Ctrl+C, docker stop), prevenindo vazamentos de conexão e garantindo a integridade dos dados.
Separação de Entidades e DTOs: A arquitetura utiliza classes de entidade (ex: AddressEntity, BookingEntity, ClientEntity, AvailabilityEntity) para tipagem interna e representação do modelo de domínio, enquanto DTOs (ex: CreateAddressDto, BookingDetailsDto, ClientDetailsDto) são usados para validação de entrada e formatação de saída da API. Essa separação clara de preocupações:
Melhora a Segurança: Dados sensíveis ou internos do modelo de domínio não são expostos automaticamente na API.
Facilita a Validação: DTOs são o local ideal para aplicar class-validator e class-transformer.
Otimiza a Performance: DTOs de saída podem ser otimizados para incluir apenas os campos necessários para o cliente da API, reduzindo o tamanho da carga útil.
Rica Documentação API: A integração com Swagger via @ApiProperty e @ApiPropertyOptional em DTOs e entidades resulta em uma documentação de API interativa e completa.
Modularidade e Injeção de Dependência: O NestJS promove fortemente a modularidade e a injeção de dependência. Cada módulo encapsula uma funcionalidade específica e exporta seus serviços, que podem ser injetados em outros módulos. Isso cria um grafo de dependências claro, facilitando a testabilidade (mocking de dependências), a manutenção (alterações em um módulo têm impacto limitado) e a escalabilidade (novas funcionalidades podem ser adicionadas como novos módulos). O uso de forwardRef (como em BookingsModule para PaymentsModule) é uma técnica para resolver dependências circulares entre módulos.
7. Próximos Passos e Oportunidades de Melhoria (TODOs)
Com base nos comentários TODO encontrados nos arquivos, aqui estão algumas oportunidades de melhoria e funcionalidades a serem implementadas:

Integração Real com APIs Externas:
Verificação de Antecedentes: Substituir a simulação em CriminalBackgroundCheckService.checkCpf por uma chamada real a um serviço de background check de terceiros (ex: ClearSale, Serasa, Serpro). Isso exigirá gerenciamento de chaves de API e tratamento de respostas complexas.
Processamento de Documentos: Integrar DocumentProcessingService com serviços reais de armazenamento de objetos (AWS S3, Google Cloud Storage) para uploadImage, e com APIs de OCR, comparação facial e prova de vida (ex: KRYPTUS, FaceTec, CAF). Isso envolverá considerações de latência e custo.
Gateway de Pagamento PIX: Integrar PaymentsService com um gateway de pagamento PIX real (ex: Stripe, PagSeguro, Cielo, Banco Central do Brasil para Open Banking/PIX Direto). Isso implicará em lidar com fluxos de pagamento assíncronos, conciliação e tratamento de falhas.
Gerenciamento de Usuários - Refinamento de Tipagem:
UserProfileDto: Ajustar a tipagem do UserProfileDto e do retorno dos métodos findOne e update em UsersService para garantir compatibilidade total com os dados do Prisma, eliminando o uso de any casts e garantindo a segurança de tipo em toda a camada de apresentação.
Busca - Expansão de Funcionalidades:
Ofertas na Busca: Considerar a implementação de busca por ofertas (OffersModule) no SearchService, expandindo o escopo da busca abrangente. Isso exigirá a definição de critérios de busca específicos para ofertas e sua integração na lógica de performSearch.
Ganhos - Robustez Financeira:
Atomicidade de Saques: Implementar uma solução mais robusta para a atomicidade das transações de saque. Isso pode envolver o uso de transações de banco de dados explícitas (prisma.$transaction) para garantir que o saldo seja deduzido e a transação de saque registrada de forma atômica. Para maior complexidade e escala, um modelo de "Carteira" (Wallet) explícito no banco de dados com mecanismos de bloqueio otimista ou pessimista pode ser considerado.
Chat - Permissões e Escalabilidade:
Lógica de Permissões: Refinar a lógica de permissões no ChatController e ChatService para verificar se o usuário autenticado é um participante válido de um chat antes de permitir acesso ou envio de mensagens. Isso pode envolver a criação de um ChatParticipantGuard ou lógica de serviço mais granular.
Histórico de Mensagens: Otimizar a recuperação de histórico de mensagens para grandes volumes, talvez com indexação de texto completo ou estratégias de paginação mais avançadas.
Otimização de Query Prisma:
include Statements: Revisar as inclusões (include) nas queries do Prisma em todos os serviços. O objetivo é garantir que apenas os dados estritamente necessários para cada operação sejam carregados, evitando N+1 problemas e eager loading excessivo, o que pode otimizar significativamente o desempenho da base de dados e reduzir o uso de memória no backend.
Documentação Swagger - Continuidade:
Refinamento Contínuo: Continuar refinando os DTOs e entidades com @ApiProperty e @ApiPropertyOptional para garantir que a documentação gerada pelo Swagger seja precisa, completa e reflita as últimas mudanças na API, especialmente para campos de relação e tipos complexos.
Internacionalização (i18n):
Suporte a Múltiplos Idiomas: Embora a aplicação use mensagens em português, para uma expansão global, a implementação de um sistema de internacionalização (i18n) é fundamental. Isso envolveria a externalização de todas as strings de UI e mensagens de erro para arquivos de tradução.