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