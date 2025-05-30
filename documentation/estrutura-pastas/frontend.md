Fantástico! Sua documentação de frontend é extremamente detalhada e mostra um design pensado, especialmente com a arquitetura de rotas do Expo Router e o uso de animações. Agora, vamos refinar essa documentação para que ela reflita a estrutura final otimizada e, mais importante, o alinhamento direto com o backend Firebase Cloud Functions que detalhamos.

A principal mudança será a remoção do conceito de "mocks" e a descrição das integrações reais com as APIs do backend, usando as funções Callable e os endpoints HTTP que você definiu. Também vamos reforçar o papel do types/ global.

📱 Documentação do Frontend LimpeJá (Expo / React Native)
Este documento descreve a arquitetura, estrutura de pastas e principais componentes do frontend do aplicativo LimpeJá, construído com React Native e Expo.

1. Visão Geral da Arquitetura Frontend
O frontend do LimpeJá é construído utilizando React Native com o framework Expo, garantindo um desenvolvimento ágil e acesso a um rico ecossistema de bibliotecas e ferramentas. A navegação é gerenciada pelo Expo Router (v5), que permite uma estrutura de rotas baseada em arquivos, intuitiva e com forte tipagem com TypeScript.

O estado global da aplicação, como informações de autenticação do usuário e configurações gerais do app (ex: tema, notificações), é gerenciado através da Context API do React. A comunicação com o backend é realizada por uma camada de serviços que utiliza Axios para interagir diretamente com as Firebase Cloud Functions e os SDKs do Firebase (Auth, Firestore, Storage) para operações diretas e em tempo real.

A interface do usuário é rica em animações, utilizando a API Animated do React Native para transições suaves, feedback de toque e efeitos visuais modernos, como o "glassmorphism" e gradientes dinâmicos, proporcionando uma experiência de usuário envolvente e fluida.

2. Tecnologias Principais
React Native: Framework para desenvolvimento de aplicativos móveis nativos para iOS e Android a partir de uma única base de código JavaScript/TypeScript.
Expo (SDK 53): Plataforma e conjunto de ferramentas que simplificam o desenvolvimento, build e deploy de apps React Native, fornecendo acesso a APIs nativas e um fluxo de trabalho otimizado.
Expo Router (v5): Sistema de navegação baseado em arquivos, que mapeia a estrutura de pastas do projeto para rotas de navegação. Oferece suporte a rotas dinâmicas, layouts aninhados e tipagem forte com TypeScript.
TypeScript: Superset do JavaScript que adiciona tipagem estática, melhorando a manutenibilidade, detecção de erros em tempo de desenvolvimento e clareza do código.
Context API (React): Utilizada para gerenciamento de estado global, evitando a necessidade de "prop drilling" e centralizando dados importantes como autenticação (AuthContext) e configurações do aplicativo (AppContext).
Firebase Client SDKs: Para interações diretas e seguras com Firebase Authentication (login, registro), Cloud Firestore (leitura e escrita em tempo real, se aplicável, e consultas) e Firebase Storage (upload de arquivos).
Axios: Cliente HTTP para realizar requisições para os endpoints HTTP das Firebase Cloud Functions.
@expo/vector-icons: Biblioteca abrangente de ícones (Ionicons, MaterialCommunityIcons, etc.) para uso consistente em toda a interface do usuário.
expo-linear-gradient: Para criar fundos e elementos com gradientes de cor.
expo-blur: Para aplicar efeitos de desfoque (blur), fundamental para o efeito de "glassmorphism".
@react-native-async-storage/async-storage: Armazenamento persistente de dados simples no dispositivo.
@react-native-community/datetimepicker: Componente nativo para seleção de data e hora.
expo-clipboard: Para funcionalidades de copiar para a área de transferência.
expo-image-picker: Para seleção de imagens da galeria do dispositivo.
3. Estrutura de Pastas do Frontend
A estrutura de pastas segue o padrão do Expo Router, onde a maioria das rotas é definida pela hierarquia de arquivos dentro da pasta app/. Esta organização por funcionalidade melhora a modularidade e a manutenibilidade.

LimpeJaApp/
├── app/
│   ├── (auth)/ # Fluxo de Autenticação
│   │   ├── api/
│   │   │   ├── authService.ts        # Integração com funções de autenticação do backend (login, register, update profile)
│   │   │   ├── addressService.ts     # Integração com ViaCep API (externa) e função de backend para salvar endereço
│   │   │   └── storageService.ts     # Integração direta com Firebase Storage para upload de avatar
│   │   ├── components/
│   │   │   ├── AnimatedErrorMessage.tsx # Componente de erro animado
│   │   │   └── ErrorMessage.tsx      # Componente de erro simples
│   │   ├── provider-register/
│   │   │   ├── index.tsx
│   │   │   ├── _layout.tsx
│   │   │   ├── personal-details.tsx
│   │   │   └── service-details.tsx
│   │   ├── client-register.tsx
│   │   ├── forgot-password.tsx
│   │   ├── _layout.tsx               # Layout do grupo de autenticação
│   │   ├── login.tsx
│   │   └── register-options.tsx
│   │
│   ├── (client)/ # Funcionalidades do Cliente
│   │   ├── bookings/ # Agendamentos do Cliente
│   │   │   ├── api/
│   │   │   │   ├── bookingService.ts # Integração com funções de agendamento do backend
│   │   │   │   └── schedulingService.ts # Integração para slots disponíveis e detalhes de serviço
│   │   │   ├── components/
│   │   │   │   ├── AnimatedBookingItem.tsx
│   │   │   │   └── PaymentMethodSelection.tsx # Se for específico do agendamento do cliente
│   │   │   ├── [bookingId].tsx
│   │   │   ├── index.tsx
│   │   │   ├── schedule-service.tsx
│   │   │   └── success.tsx
│   │   ├── explore/ # Explorar Serviços/Profissionais
│   │   │   ├── api/
│   │   │   │   └── providerService.ts # Integração com funções de provedores e serviços do backend
│   │   │   ├── components/
│   │   │   │   ├── CategoriaCard.tsx
│   │   │   │   ├── PrestadorCard.tsx
│   │   │   │   ├── SecaoContainer.tsx
│   │   │   │   ├── SecaoPrestadores.tsx
│   │   │   │   └── SaudacaoContainer.tsx
│   │   │   ├── [providerId].tsx
│   │   │   ├── index.tsx
│   │   │   ├── search-results.tsx
│   │   │   ├── services-by-category.tsx
│   │   │   ├── all-categories.tsx
│   │   │   └── all-nearby-providers.tsx
│   │   ├── messages/ # Mensagens do Cliente
│   │   │   ├── api/
│   │   │   │   └── chatService.ts # Integração com funções de chat do backend
│   │   │   ├── components/
│   │   │   │   └── AnimatedConversationItem.tsx
│   │   │   ├── [chatId].tsx
│   │   │   └── index.tsx
│   │   ├── offers/ # Ofertas do Cliente
│   │   │   ├── api/
│   │   │   │   └── offerService.ts # Integração com funções de ofertas do backend
│   │   │   ├── components/
│   │   │   │   └── BannerOferta.tsx
│   │   │   └── [ofertaId].tsx
│   │   └── profile/ # Perfil do Cliente
│   │       ├── api/
│   │       │   └── profileService.ts # Integração com funções de perfil de usuário do backend
│   │       ├── components/
│   │       │   └── AnimatedMenuItem.tsx
│   │       ├── edit.tsx
│   │       ├── index.tsx
│   │       └── _layout.tsx         # Layout do grupo de perfil do cliente
│   ├── _layout.tsx                   # Layout das abas do cliente
│
│   ├── (common)/ # Funcionalidades Comuns (cliente e provedor)
│   │   ├── api/
│   │   │   ├── feedbackService.ts    # Integração com funções de reviews do backend
│   │   │   └── notificationService.ts # Integração com funções de notificações do backend
│   │   ├── components/
│   │   │   ├── AnimatedFaqItem.tsx
│   │   │   ├── AnimatedContactButton.tsx
│   │   │   ├── AnimatedNotificationItem.tsx
│   │   │   ├── AnimatedSettingNavigationItem.tsx
│   │   │   └── AnimatedSettingSwitchItem.tsx
│   │   ├── feedback/
│   │   │   └── [targetId].tsx
│   │   ├── help.tsx
│   │   ├── _layout.tsx               # Layout do grupo comum
│   │   ├── notifications.tsx
│   │   ├── privacy-policy.tsx
│   │   ├── settings.tsx
│   │   └── terms-and-conditions.tsx
│   │
│   ├── (provider)/ # Funcionalidades do Provedor
│   │   ├── api/
│   │   │   ├── earningsService.ts    # Integração com funções de pagamentos (ganhos) do backend
│   │   │   └── providerProfileService.ts # Integração com funções de perfil de provedor (dados bancários, etc.)
│   │   ├── messages/ # Mensagens do Provedor
│   │   │   ├── api/
│   │   │   │   └── chatService.ts    # Integração com funções de chat do backend
│   │   │   ├── components/
│   │   │   │   └── AnimatedConversationItem.tsx
│   │   │   ├── [chatId].tsx
│   │   │   └── index.tsx
│   │   ├── profile/ # Perfil do Provedor
│   │   │   ├── api/
│   │   │   │   └── providerService.ts # Integração com funções de provedor (edit-services, etc.)
│   │   │   ├── components/
│   │   │   │   └── AnimatedServiceItem.tsx
│   │   │   ├── edit-services.tsx
│   │   │   └── index.tsx
│   │   ├── schedule/ # Agenda/Disponibilidade do Provedor
│   │   │   ├── api/
│   │   │   │   ├── scheduleService.ts # Integração com funções de agendamentos e agenda do backend
│   │   │   │   └── availabilityService.ts # Integração com funções de disponibilidade do provedor
│   │   │   ├── components/
│   │   │   │   ├── AnimatedAppointmentItem.tsx
│   │   │   │   ├── AnimatedTimeSlot.tsx
│   │   │   │   └── AnimatedDayCard.tsx
│   │   │   ├── index.tsx
│   │   │   └── manage-availability.tsx
│   │   └── services/ # Serviços/Solicitações do Provedor
│   │       ├── api/
│   │       │   └── serviceRequestService.ts # Integração com funções de agendamentos e serviços (solicitações)
│   │       ├── components/
│   │       │   └── AnimatedServiceItem.tsx
│   │       ├── [serviceId].tsx
│   │       └── index.tsx
│   │   ├── dashboard.tsx             # Tela principal do painel do provedor
│   │   ├── earnings.tsx              # Tela de ganhos do provedor
│   │   ├── _layout.tsx               # Layout das abas do provedor
│   │
│   ├── _layout.tsx                   # Layout raiz global (Expo Router)
│   ├── +not-found.tsx
│   ├── index.tsx                     # Lógica de redirecionamento inicial
│   └── welcome.tsx                   # Tela de boas-vindas inicial
│
├── assets/ # Recursos estáticos
│   ├── fonts/
│   └── images/
│
├── components/ # Componentes de UI verdadeiramente reutilizáveis e atômicos (globais)
│   ├── layout/
│   │   ├── CustomHeader.tsx
│   │   ├── HeaderSuperior.tsx
│   │   └── NavBar.tsx
│   ├── schedule/ # Componentes de agendamento que são usados por ambos os papéis
│   │   ├── AddressSection.tsx
│   │   ├── CalendarHeader.tsx
│   │   ├── PaymentMethodSelection.tsx
│   │   └── TimeSlotButton.tsx
│   ├── ui/ # Componentes de UI genéricos e atômicos
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Collapsible.tsx
│   │   ├── ExternalLink.tsx
│   │   ├── HapticTab.tsx
│   │   ├── HelloWave.tsx
│   │   ├── IconSymbol.ios.tsx
│   │   ├── IconSymbol.tsx
│   │   ├── Input.tsx
│   │   ├── ParallaxScrollView.tsx
│   │   ├── TabBarBackground.ios.tsx
│   │   ├── TabBarBackground.tsx
│   │   ├── ThemedText.tsx
│   │   └── ThemedView.tsx
│
├── config/
│   └── appConfig.ts
│
├── constants/
│   ├── Colors.ts
│   ├── routes.ts
│   ├── strings.ts
│   └── theme.ts
│
├── contexts/ # Contextos globais
│   ├── AppContext.tsx
│   ├── AuthContext.tsx
│   └── ProviderRegistrationContext.tsx
│
├── hooks/ # Hooks globais
│   ├── useAuth.ts
│   ├── useColorScheme.ts
│   ├── useColorScheme.web.ts
│   ├── useFormValidation.ts
│   └── useThemeColor.ts
│
├── types/ # Interfaces e tipos TypeScript globais (do backend)
│   ├── auth.ts
│   ├── booking.ts
│   ├── common.ts
│   ├── provider.ts
│   └── ... (outros tipos compartilhados do backend)
│
├── utils/ # Funções utilitárias globais (não componentes)
│   ├── helpers.ts
│   ├── permissions.ts
│   └── storage.ts
4. Detalhamento dos Fluxos e Telas
4.1. Fluxo Inicial e Autenticação (app/, app/(auth)/)
Este fluxo gerencia a entrada do usuário no aplicativo, desde a tela de boas-vindas até o login e registro.

app/_layout.tsx (Layout Raiz):
Propósito: O ponto de entrada principal do aplicativo. Envolve toda a aplicação com os provedores de contexto (AuthProvider, AppProvider).
Funcionalidade: Gerencia a lógica inicial de redirecionamento. Verifica se a tela de boas-vindas (welcome.tsx) já foi visualizada e se o usuário está autenticado. Redireciona para a tela de login, boas-vindas ou para o painel apropriado (cliente/provedor).
UI/UX: Exibe um ActivityIndicator com uma mensagem de carregamento enquanto verifica o estado de autenticação e o AsyncStorage.
app/index.tsx (Tela de Redirecionamento Inicial):
Propósito: Serve como um ponto de entrada rápido para redirecionamento.
Funcionalidade: Verifica o estado de autenticação (isAuthenticated, isLoading do useAuth) e redireciona o usuário para a rota apropriada (/(client)/explore, /(provider)/dashboard ou /(auth)/login).
UI/UX: Exibe um ActivityIndicator com uma mensagem de "Carregando App..." durante a verificação.
app/welcome.tsx (Tela de Boas-Vindas):
Propósito: Tela introdutória exibida na primeira vez que o usuário abre o aplicativo.
Funcionalidade: Utiliza AsyncStorage para marcar que a tela foi visualizada. Após um tempo definido, redireciona para a tela de login.
UI/UX: Apresenta um logo centralizado em um círculo branco, com animações de escala e opacidade (react-native-reanimated) e um fundo azul sólido, criando um efeito de splash screen moderno.
app/(auth)/_layout.tsx (Layout de Autenticação):
Propósito: Define o layout de navegação para todas as telas relacionadas à autenticação.
Funcionalidade: Utiliza Stack.Screen para cada tela do fluxo de autenticação, controlando a visibilidade do cabeçalho (headerShown: false para login) e o título de cada tela.
app/(auth)/login.tsx (Tela de Login):
Propósito: Permite que usuários existentes acessem suas contas.
Funcionalidade: Coleta e-mail (ou nome de usuário) e senha. Utiliza useAuth para a lógica de signIn que invoca firebase.auth().signInWithEmailAndPassword diretamente ou a função Callable loginUser do backend (functions/src/auth/functions.ts). Inclui validação de campos e tratamento de erros. Possui botões de login rápido para perfis de teste.
UI/UX: Design moderno com campos de entrada em formato de "pill" com ícones e sombras sutis, efeito de "olho" para mostrar/esconder senha, botões de login social e animações de entrada (Animated) para os elementos principais.
app/(auth)/register-options.tsx (Opções de Cadastro):
Propósito: Permite ao usuário escolher se deseja se cadastrar como cliente ou profissional.
Funcionalidade: Apresenta duas etapas de cadastro (informações pessoais e endereço) para um fluxo de registro unificado.
UI/UX: Design limpo com campos de entrada estilizados, animações de entrada para os elementos e botões de navegação entre as etapas.
app/(auth)/client-register.tsx (Cadastro de Cliente):
Propósito: Formulário para novos clientes criarem uma conta.
Funcionalidade: Coleta nome, e-mail, telefone, senha e confirmação de senha. Invoca a função createUser do backend (functions/src/auth/functions.ts) após validação. Inclui validação de campos, formatação de telefone e um checkbox para aceitar termos e condições.
UI/UX: Apresenta um cabeçalho animado, campos de entrada com bordas animadas ao focar, e um botão de registro com feedback visual ao pressionar.
app/(auth)/provider-register/_layout.tsx (Layout de Cadastro de Profissional):
Propósito: Define o layout de navegação para as etapas de cadastro de profissional.
Funcionalidade: Utiliza Stack.Screen para cada etapa, com títulos específicos para indicar o progresso.
app/(auth)/provider-register/index.tsx (Cadastro Profissional - Etapa 1):
Propósito: Tela introdutória para o cadastro de profissionais, destacando vantagens e requisitos.
Funcionalidade: Não coleta dados, apenas informa. Redireciona para a próxima etapa.
UI/UX: Títulos e subtítulos animados, cards de vantagens e requisitos com animações de escala e opacidade, e uma lista de itens com ícones e animações escalonadas.
app/(auth)/provider-register/personal-details.tsx (Cadastro Profissional - Etapa 2):
Propósito: Coleta dados pessoais do profissional.
Funcionalidade: Campos para nome, CPF (com formatação), data de nascimento (com DateTimePicker), telefone (com formatação) e endereço (com busca de CEP via ViaCEP API e posterior chamada a addUserAddress do backend functions/src/auth/functions.ts para salvar). Os dados são gerenciados pelo useProviderRegistration context.
UI/UX: Cabeçalho e formulário animados, campos de entrada com ícones e validação inline, e um ActivityIndicator durante a busca de CEP.
app/(auth)/provider-register/service-details.tsx (Cadastro Profissional - Etapa 3):
Propósito: Coleta detalhes sobre os serviços e experiência do profissional.
Funcionalidade: Campos para descrição da experiência, anos de experiência, serviços oferecidos, estrutura de preços, áreas de atendimento e upload de foto de perfil (via Firebase Storage SDK no storageService.ts). Os dados são salvos no useProviderRegistration context e o cadastro é finalizado aqui chamando a função submitProviderRegistration do backend (functions/src/providers/functions.ts).
UI/UX: Cabeçalho e formulário animados, um avatarPicker com feedback visual ao toque, e campos de texto com multiline para descrições mais longas.
app/(auth)/forgot-password.tsx (Esqueci a Senha):
Propósito: Permite que o usuário redefina sua senha.
Funcionalidade: Coleta o e-mail do usuário e invoca firebase.auth().sendPasswordResetEmail para enviar um link de redefinição de senha.
UI/UX: Layout simples com campo de e-mail, botão de envio e mensagens de sucesso/erro.
4.2. Fluxo do Cliente (app/(client)/)
Este fluxo é para usuários logados como clientes, permitindo-lhes explorar serviços, gerenciar agendamentos, conversar com profissionais e gerenciar seu perfil.

app/(client)/_layout.tsx (Layout de Abas do Cliente):
Propósito: Define a navegação principal por abas para o cliente.
Funcionalidade: Utiliza Tabs do Expo Router para criar a barra de navegação inferior com ícones e títulos para as seções "Explorar", "Agendamentos", "Mensagens" e "Perfil".
app/(client)/explore/index.tsx (Explorar - Home do Cliente):
Propósito: Tela principal para o cliente descobrir serviços e profissionais.
Funcionalidade: Exibe categorias populares (obtidas via listAvailableServices do backend functions/src/services/functions.ts), banners de ofertas (via getOffers do backend functions/src/services/functions.ts ou um módulo offers/), e profissionais próximos (via getProviderProfile e filtragem, do backend functions/src/providers/functions.ts). Permite navegar para telas de detalhes ou listas completas.
UI/UX: Utiliza animações de entrada escalonadas para o cabeçalho, categorias, banner e lista de prestadores. Componentes reutilizáveis como HeaderSuperior, SecaoContainer, BannerOferta, SecaoPrestadores e CategoriaCard.
app/(client)/explore/[providerId].tsx (Detalhes do Profissional):
Propósito: Exibe informações detalhadas de um profissional específico.
Funcionalidade: Carrega dados do profissional (nome, especialidade, avaliação, serviços, reviews) usando useLocalSearchParams e a função getProviderProfile do backend (functions/src/providers/functions.ts). Possui abas para "Visão Geral" e "Detalhes", e um botão para agendar serviço.
UI/UX: Cabeçalho com imagem de fundo e sobreposição, seção de avaliação com estrelas azuis robustas, chips de informação, botões de ação (ligar, chat, mapa, compartilhar) e cards de reviews. O botão "Agendar Serviço" é fixo na parte inferior da tela, com animação de entrada.
app/(client)/explore/search-results.tsx (Resultados de Busca):
Propósito: Exibir resultados de busca por serviços ou profissionais.
Funcionalidade: Filtra e exibe profissionais/serviços com base nos critérios de busca, usando listAvailableServices ou getProviderProfile com parâmetros de filtro.
UI/UX: Layout de lista com componentes PrestadorCard ou ServiceCard.
app/(client)/explore/services-by-category.tsx, all-categories.tsx, all-nearby-providers.tsx:
Propósito: Telas para listagens de serviços por categoria, todas as categorias e todos os prestadores próximos, respectivamente, consumindo as APIs de serviços e provedores do backend.
app/(client)/bookings/index.tsx (Meus Agendamentos):
Propósito: Lista os agendamentos do cliente.
Funcionalidade: Permite filtrar agendamentos por "Próximos", "Anteriores" e "Cancelados". Carrega dados usando getBookings (HTTP GET /bookings/client) do backend (functions/src/bookings/functions.ts) e exibe-os em uma FlatList.
UI/UX: Botões de filtro animados com feedback de toque, e itens de agendamento na lista com animações de entrada escalonadas. Badges de status coloridos para cada agendamento.
app/(client)/bookings/[bookingId].tsx (Detalhes do Agendamento):
Propósito: Exibe informações detalhadas de um agendamento específico.
Funcionalidade: Carrega detalhes do agendamento usando getBookingDetails (HTTP GET /bookings/:bookingId) do backend (functions/src/bookings/functions.ts). Permite cancelar agendamento (chamando updateBookingStatus do backend), contatar o prestador e avaliar o serviço (chamando submitReview do backend functions/src/reviews/functions.ts se concluído).
UI/UX: Cards com sombras aprimoradas, seções de detalhes e ações com animações de entrada. Botões de ação com feedback visual ao toque e estilos específicos para cancelar, contatar e avaliar.
app/(client)/bookings/schedule-service.tsx (Agendar Serviço):
Propósito: Permite ao cliente agendar um novo serviço com um profissional.
Funcionalidade: Exibe detalhes do profissional, um calendário para seleção de data, horários disponíveis para a data selecionada (obtidos via schedulingService.ts que consulta getProviderAvailability do backend functions/src/providers/functions.ts), e opções de pagamento (chamando createPixCharge do backend functions/src/payments/functions.ts). O agendamento é criado via createBooking do backend (functions/src/bookings/functions.ts).
UI/UX: Componentes reutilizáveis para cabeçalho do calendário (CalendarHeader), seção de endereço (AddressSection), botões de horários (TimeSlotButton) e seleção de método de pagamento (PaymentMethodSelection). Inclui animações de brilho no endereço e feedback visual para seleção de horários.
app/(client)/bookings/success.tsx (Agendamento Confirmado):
Propósito: Tela de confirmação de agendamento bem-sucedido.
Funcionalidade: Exibe um resumo dos detalhes do agendamento (prestador, serviço, data, hora, endereço, valor, método de pagamento). Permite navegar para a lista de agendamentos ou para a tela inicial.
UI/UX: Design "ultra moderno" inspirado em um "Boarding Pass", com um gradiente de três cores no fundo da tela simulando um efeito de reflexo. O cabeçalho possui botões de voltar e de três pontos (menu) no estilo da imagem de referência. O card principal utiliza LinearGradient e BlurView para o efeito "glassmorphism", com uma linha tracejada e círculos para simular o efeito de "rasgado". Inclui a avaliação do prestador por estrelas.
app/(client)/messages/index.tsx (Minhas Mensagens - Cliente):
Propósito: Lista as conversas do cliente com os profissionais.
Funcionalidade: Carrega conversas (via getChatRooms do backend functions/src/chat/functions.ts), exibe a última mensagem, timestamp e contagem de mensagens não lidas. Permite navegar para a tela de chat.
UI/UX: Cabeçalho customizado, lista de conversas com animações de entrada escalonadas, avatares de perfil e badges para mensagens não lidas.
app/(client)/messages/[chatId].tsx (Chat com Profissional - Cliente):
Propósito: Tela de chat para o cliente conversar com um profissional.
Funcionalidade: Exibe histórico de mensagens (pode usar leituras em tempo real do Firestore ou getMessages do backend). Permite enviar novas mensagens (via sendMessage Callable ou HTTP endpoint do backend functions/src/chat/functions.ts, ou diretamente pelo SDK do Firestore). Inclui validação para evitar compartilhamento de informações de contato. Simula status de "digitando..." do outro lado.
UI/UX: Cabeçalho customizado com avatar e nome do destinatário, balões de mensagem com gradientes (para mensagens do usuário) e efeitos de sombra. O campo de entrada de texto é animado ao focar/desfocar. Alerta sobre compartilhamento de dados sensíveis.
app/(client)/offers/index.tsx (Ofertas do Cliente):
Propósito: Exibir ofertas e promoções disponíveis para o cliente.
Funcionalidade: Carrega dados de ofertas via getOffers do backend (functions/src/services/functions.ts ou um novo módulo offers/functions.ts).
UI/UX: Utiliza BannerOferta.tsx para exibir as promoções.
app/(client)/profile/index.tsx (Meu Perfil - Cliente):
Propósito: Exibe o perfil do cliente e oferece opções para gerenciar a conta.
Funcionalidade: Mostra nome, e-mail, telefone e avatar do usuário (obtidos via useAuth e checkAuthStatus do backend). Lista opções de menu para editar perfil, gerenciar endereços, formas de pagamento, notificações, configurações do app, ajuda, termos e política de privacidade. Possui um botão para sair da conta (signOut do useAuth).
UI/UX: Cabeçalho customizado, seção de perfil com avatar animado ao toque e um badge de edição. Itens de menu com animações de entrada escalonadas e feedback visual ao toque.
app/(client)/profile/edit.tsx (Editar Perfil - Cliente):
Propósito: Permite ao cliente editar suas informações de perfil.
Funcionalidade: Campos para nome, e-mail (não editável), telefone. Permite selecionar e fazer upload de nova foto de perfil (via storageService.ts e Firebase Storage SDK). Salva as alterações chamando updateUserProfile do backend (functions/src/auth/functions.ts).
UI/UX: Cabeçalho e formulário animados, avatarContainer com feedback visual ao toque e um ícone de câmera. Campos de entrada com bordas animadas ao focar e validação inline. Botões de "Salvar" e "Alterar Senha" com animações de feedback.
4.3. Fluxo do Profissional (app/(provider)/)
Este fluxo é para usuários logados como profissionais, permitindo-lhes gerenciar seu painel, agenda, serviços, ganhos e mensagens.

app/(provider)/_layout.tsx (Layout de Abas do Profissional):
Propósito: Define a navegação principal por abas para o profissional.
Funcionalidade: Utiliza Tabs do Expo Router para criar a barra de navegação inferior com ícones e títulos para as seções "Painel", "Agenda", "Serviços", "Ganhos", "Mensagens" e "Perfil".
app/(provider)/dashboard.tsx (Painel do Profissional):
Propósito: Visão geral da atividade do profissional no LimpeJá.
Funcionalidade: Exibe um resumo de dados como próximos serviços, novas solicitações, ganhos semanais/mensais e total de clientes. Obtém esses dados de APIs do backend (ex: getBookings para status pendente e próximos, getMyPaymentHistory para ganhos, do backend functions/src/bookings/functions.ts e functions/src/payments/functions.ts). Oferece ações rápidas para gerenciar disponibilidade, editar serviços, etc.
UI/UX: Cabeçalho customizado, seção de boas-vindas animada, cards de resumo com ícones e animações de entrada/feedback de toque. Inclui um placeholder para um gráfico de ganhos e botões de ação rápida com ícones.
app/(provider)/schedule/index.tsx (Minha Agenda):
Propósito: Permite ao profissional visualizar e gerenciar seus agendamentos.
Funcionalidade: Exibe um calendário (react-native-calendars) onde as datas com agendamentos são marcadas (dados obtidos via getBookings do backend functions/src/bookings/functions.ts com filtro de provedor). Ao selecionar uma data, lista os agendamentos para aquele dia.
UI/UX: Cabeçalho customizado, calendário animado, e lista de agendamentos com animações de entrada escalonadas. Badges de status coloridos para cada agendamento.
app/(provider)/schedule/manage-availability.tsx (Gerenciar Disponibilidade):
Propósito: Permite ao profissional definir seus horários de trabalho semanais e gerenciar exceções.
Funcionalidade: Para cada dia da semana, permite ativar/desativar a disponibilidade e adicionar/remover blocos de horários (TimeSlot). Utiliza DateTimePicker para seleção de horários. As atualizações são enviadas via updateWeeklyAvailability e updateBlockedDates do backend (functions/src/providers/functions.ts).
UI/UX: Cabeçalho e seções animadas. Cards para cada dia da semana com um Switch para disponibilidade. Itens de TimeSlot com botões para editar horários e remover, todos com animações de entrada e feedback de toque. Inclui um placeholder para bloquear datas específicas.
app/(provider)/services/index.tsx (Meus Serviços - Profissional):
Propósito: Lista as solicitações e agendamentos de serviços para o profissional.
Funcionalidade: Permite filtrar serviços por "Solicitações" (pendentes), "Próximos" (confirmados) e "Histórico" (concluídos/cancelados/recusados). Carrega dados via getBookings (HTTP GET /bookings/provider) do backend (functions/src/bookings/functions.ts).
UI/UX: Cabeçalho customizado, botões de filtro animados com feedback visual ao toque, e itens de serviço na lista com animações de entrada escalonadas e badges de status.
app/(provider)/services/[serviceId].tsx (Detalhes do Serviço - Profissional):
Propósito: Exibe informações detalhadas de um serviço/solicitação específica para o profissional.
Funcionalidade: Carrega dados do serviço (cliente, tipo de serviço, data, hora, endereço, notas, status) via getBookingDetails do backend (functions/src/bookings/functions.ts). Permite ao profissional aceitar/recusar solicitações, marcar como concluído ou contatar o cliente (chamando updateBookingStatus do backend).
UI/UX: Cabeçalho customizado, cards de informações (cliente, serviço, observações, status) com animações de entrada. Botões de ação com estilos específicos para cada tipo de ação (aceitar, recusar, concluir, contatar) e feedback de processamento.
app/(provider)/profile/edit-services.tsx (Editar Meus Serviços - Profissional):
Propósito: Permite ao profissional adicionar, editar e remover os tipos de serviço que oferece.
Funcionalidade: Formulário para adicionar/editar nome, descrição, preço e duração do serviço. Lista os serviços cadastrados e permite editá-los ou excluí-los. As alterações são enviadas via updateOfferedServices do backend (functions/src/providers/functions.ts).
UI/UX: Cabeçalho e formulário animados. Campos de entrada para detalhes do serviço. Botões de ação para adicionar/atualizar e cancelar edição. A lista de serviços utiliza FlatList com itens animados individualmente.
app/(provider)/earnings.tsx (Meus Ganhos):
Propósito: Permite ao profissional visualizar um resumo de seus ganhos e transações.
Funcionalidade: Exibe saldo total, saque pendente, último pagamento. Lista transações recentes (pagamentos por serviço, saques). Obtém esses dados via getMyPaymentHistory do backend (functions/src/payments/functions.ts). Permite solicitar saque (requestProviderPayout do backend functions/src/payments/functions.ts).
UI/UX: Cabeçalho customizado, seções de resumo e transações com animações de entrada. Cards de resumo com ícones e valores financeiros. Placeholder para um gráfico de ganhos. Botões de saque com feedback visual.
app/(provider)/messages/index.tsx (Mensagens - Profissional):
Propósito: Lista as conversas do profissional com os clientes.
Funcionalidade: Similar à tela de mensagens do cliente, carrega conversas via getChatRooms do backend (functions/src/chat/functions.ts), exibe a última mensagem, timestamp e contagem de mensagens não lidas.
UI/UX: Cabeçalho customizado, lista de conversas com animações de entrada escalonadas, avatares de perfil e badges para mensagens não lidas.
app/(provider)/messages/[chatId].tsx (Chat com Cliente - Profissional):
Propósito: Tela de chat para o profissional conversar com um cliente.
Funcionalidade: Reutiliza a lógica e os componentes da tela de chat do cliente, interagindo com as mesmas funções de chat do backend.
4.4. Fluxo Comum (app/(common)/)
Este fluxo contém telas que são acessíveis por ambos os tipos de usuários autenticados, ou até mesmo por usuários não autenticados dependendo da configuração do layout.

app/(common)/_layout.tsx (Layout Comum):
Propósito: Define o layout de navegação para telas que são compartilhadas entre diferentes perfis de usuário.
Funcionalidade: Utiliza Stack.Screen para cada tela comum, garantindo um cabeçalho padrão.
app/(common)/settings.tsx (Configurações):
Propósito: Permite ao usuário ajustar as configurações do aplicativo.
Funcionalidade: Gerencia preferências como notificações e modo escuro (via AppContext). Exibe informações da versão do app e links para termos/política de privacidade. As preferências podem ser salvas no Firestore via uma função updateUserSettings no backend (novo, ou parte de auth/functions.ts).
UI/UX: Cabeçalho customizado, seções de configurações com títulos e itens de configuração com Switch (para ativar/desativar) ou TouchableOpacity (para navegação), todos com animações de entrada escalonadas.
app/(common)/help.tsx (Central de Ajuda):
Propósito: Fornece respostas a perguntas frequentes (FAQ) e opções de contato com o suporte.
Funcionalidade: Permite buscar em uma lista de FAQs e oferece botões para contatar o suporte via e-mail, telefone ou chat (as funcionalidades de contato podem invocar funções do backend para enviar e-mails ou iniciar chats).
UI/UX: Cabeçalho customizado, campo de busca com ícone e botão de limpar, itens de FAQ animados. Botões de contato com ícones e feedback visual.
app/(common)/feedback/[targetId].tsx (Enviar Feedback):
Propósito: Permite ao usuário enviar feedback sobre um serviço, profissional ou o próprio aplicativo.
Funcionalidade: Coleta uma avaliação por estrelas (StarRating componente) e um comentário. O tipo de feedback (serviço, profissional, app) e o ID do alvo são passados via useLocalSearchParams. Submete o feedback via submitReview do backend (functions/src/reviews/functions.ts).
UI/UX: Tela de formulário simples com estrelas interativas, campo de texto para comentário e botão de envio.
app/(common)/privacy-policy.tsx (Política de Privacidade) e app/(common)/terms-and-conditions.tsx (Termos de Serviço):
Propósito: Telas para exibir o conteúdo legal do aplicativo.
UI/UX: Layout básico de ScrollView para conteúdo textual.
app/(common)/notifications.tsx (Notificações):
Propósito: Lista as notificações do usuário.
Funcionalidade: Carrega notificações via getNotificationsHistory do backend (functions/src/notifications/functions.ts), exibe título, corpo, timestamp e status de leitura. Permite marcar todas como lidas via markNotificationsAsRead do backend.
UI/UX: Cabeçalho customizado com um botão para marcar todas como lidas (se houver não lidas). Lista de notificações com animações de entrada escalonadas, ícones por tipo de notificação e um ponto visual para indicar notificações não lidas.
4.5. Telas de Erro
app/+not-found.tsx (Página Não Encontrada):
Propósito: Tela exibida quando o usuário tenta acessar uma rota que não existe.
UI/UX: Mensagem clara de erro e um link para voltar à tela inicial.
5. Contextos e Hooks Customizados
contexts/AppContext.tsx:
Propósito: Gerencia configurações e preferências globais do aplicativo que não estão diretamente ligadas à autenticação.
Funcionalidade: Armazena configurações como notificationsEnabled e themeMode. Fornece funções para updateSettings e toggleTheme. As mudanças podem ser persistidas via AsyncStorage localmente e, para configurações globais, enviadas ao backend (ex: updateUserSettings).
contexts/AuthContext.tsx:
Propósito: Gerencia o estado de autenticação do usuário em toda a aplicação.
Funcionalidade: Armazena informações do usuário (user), tokens de autenticação (tokens), e o estado de carregamento (isLoading). Fornece funções para signIn (login), signOut (logout) e updateUser (atualizar dados do usuário).
Dependências: AsyncStorage para persistência de sessão. Interage diretamente com Firebase Authentication SDK para login/registro e com as Cloud Functions de autenticação para operações como atualização de perfil.
contexts/ProviderRegistrationContext.tsx:
Propósito: Hook customizado para gerenciar o estado e a lógica do fluxo de cadastro de profissional em várias etapas.
Funcionalidade: Armazena dados das etapas (personalDetails, serviceDetails) e fornece funções para setPersonalDetails, setServiceDetails e submitRegistration (que invoca a função submitProviderRegistration do backend functions/src/providers/functions.ts).
hooks/useAuth.ts:
Propósito: Hook customizado para facilitar o acesso e a interação com o AuthContext.
Funcionalidade: Abstrai a lógica de useContext(AuthContext) e fornece diretamente o user, isAuthenticated, isLoading, signIn, signOut e updateUser.
hooks/useFormValidation.ts:
Propósito: Hook genérico para validação de formulários.
Funcionalidade: Encapsula a lógica de validação de campos, gerenciamento de erros e estado de formulário.
6. Serviços (api/)
A pasta api/ dentro de cada módulo (app/(funcionalidade)/api/) contém os serviços responsáveis por orquestrar as chamadas às APIs do backend. Estes arquivos não são mais mocks, mas sim as implementações reais que interagem com as Firebase Cloud Functions (via SDKs do Firebase ou Axios para HTTP endpoints).

Exemplos de Interação:

app/(auth)/api/authService.ts:
TypeScript

import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase'; // Configuração do client SDK
import { AuthRequest, AuthResponse } from '../../types/auth'; // Tipos do backend

const loginUserCallable = httpsCallable<AuthRequest, AuthResponse>(functions, 'loginUser');
const createUserCallable = httpsCallable<AuthRequest, AuthResponse>(functions, 'createUser');
// ... outros callables

export const authService = {
  async login(credentials: AuthRequest): Promise<AuthResponse> {
    const result = await loginUserCallable(credentials);
    return result.data;
  },
  async register(data: AuthRequest): Promise<AuthResponse> {
    const result = await createUserCallable(data);
    return result.data;
  },
  // ...
};
app/(client)/bookings/api/bookingService.ts:
TypeScript

import axios from 'axios';
import { Booking, BookingRequestData } from '../../types/booking'; // Tipos do backend

const API_BASE_URL = 'https://us-central1-your-project-id.cloudfunctions.net/api/v1'; // Sua URL base HTTP

export const bookingService = {
  async createBooking(data: BookingRequestData): Promise<Booking> {
    const response = await axios.post<Booking>(`${API_BASE_URL}/bookings`, data);
    return response.data;
  },
  async getClientBookings(): Promise<Booking[]> {
    const response = await axios.get<Booking[]>(`${API_BASE_URL}/bookings/client`);
    return response.data;
  },
  // ...
};
7. Utilitários e Tipos
utils/helpers.ts: Contém funções utilitárias reutilizáveis e agnósticas a componentes, como formatDate para formatar datas em diferentes formatos.
utils/permissions.ts: Funções relacionadas ao gerenciamento de permissões do dispositivo (câmera, localização, notificações).
utils/storage.ts: Funções para interagir com o AsyncStorage ou outros mecanismos de armazenamento local.
types/: Esta pasta centraliza todas as definições de interface e tipo TypeScript que são compartilhadas com o backend. É crucial importar esses tipos do backend (ou ter uma cópia idêntica) para garantir a segurança de tipo e a consistência dos dados entre as duas camadas da aplicação. Isso inclui tipos para User, Booking, ProviderProfile, PaymentHistoryItem, etc.