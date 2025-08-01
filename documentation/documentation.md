Documentação de Arquitetura e Funcionalidades do Aplicativo Móvel LimpeJá

Introdução e Visão Geral
O LimpeJá é um aplicativo móvel inovador que atua como uma plataforma de marketplace, conectando clientes que buscam serviços de limpeza e organização residencial com profissionais de limpeza qualificados e verificados. A aplicação visa simplificar o processo de agendamento, comunicação e pagamento, garantindo uma experiência segura e eficiente para ambas as partes.

Proposta de Valor:

Para Clientes: Facilidade em encontrar e agendar serviços de limpeza de qualidade, com profissionais verificados e avaliados.

Para Profissionais: Oportunidade de gerenciar sua agenda, oferecer seus serviços, expandir sua clientela e receber pagamentos de forma eficiente.

Público-alvo: Indivíduos e famílias que necessitam de serviços de limpeza, e profissionais autônomos ou microempreendedores que oferecem esses serviços.

Estrutura da Aplicação e Tecnologias
O LimpeJá é construído com uma arquitetura moderna e escalável, utilizando tecnologias amplamente adotadas no ecossistema mobile e web.

2.1. Frontend (Mobile Application)
Framework: React Native com Expo. O Expo simplifica o desenvolvimento, build e deploy, oferecendo acesso a APIs nativas de forma unificada.

Linguagem: TypeScript para garantir tipagem forte, melhorando a manutenibilidade e reduzindo erros em tempo de desenvolvimento.

Navegação: Expo Router para um roteamento baseado em sistema de arquivos, facilitando a criação de rotas aninhadas e dinâmicas.

Requisições HTTP: Axios é a biblioteca principal para chamadas à API. Uma instância centralizada (api.ts) é configurada com interceptadores para injeção de tokens JWT e tratamento global de erros 401. A URL base da API (apiUrl) é configurada através do appConfig.ts, que obtém o valor da variável de ambiente EXPO_PUBLIC_API_BASE_URL.

Gerenciamento de Estado Global: React Context API é utilizada para gerenciar estados globais como autenticação (AuthContext.tsx), configurações do aplicativo (AppContext.tsx) e dados de formulários multi-etapa (ProviderRegistrationContext.tsx). O useAuth.ts é um hook customizado que simplifica o consumo do AuthContext.

Persistência de Dados Local:

@react-native-async-storage/async-storage: Para armazenamento de dados não sensíveis (ex: configurações do app, dados de perfil do usuário). O arquivo storage.ts fornece funções utilitárias (storeData, getData, removeData, clearAllData) que encapsulam o uso do AsyncStorage com um prefixo (@LimpeJa:) para evitar colisões de chaves.

expo-secure-store: Para armazenamento seguro de dados sensíveis (ex: tokens de autenticação), conforme implementado no AuthService.

Integração Firebase: O arquivo firebaseClient.ts é responsável pela inicialização do aplicativo Firebase, utilizando firebase/app e firebase/auth (API modular para web) e @react-native-firebase/app, @react-native-firebase/auth (para ambiente nativo). As credenciais do Firebase são carregadas de variáveis de ambiente do Expo (Constants.expoConfig.extra). A firebaseInitializationPromise garante que o Firebase esteja pronto antes do início da aplicação.

Recursos Nativos e Permissões: O Expo fornece acesso a diversas funcionalidades do dispositivo. O módulo permissions.ts centraliza o gerenciamento de permissões, exibindo alertas padronizados e direcionando o usuário para as configurações do aplicativo quando necessário:

expo-image-picker: Seleção e captura de imagens (fotos de perfil, documentos), com funções checkCameraPermissions, requestCameraPermissions, checkMediaLibraryPermissions, requestMediaLibraryPermissions.

expo-location: Obtenção da localização do usuário, com funções checkLocationPermissions, requestLocationPermissions, getCurrentLocation.

expo-notifications: Gerenciamento de notificações push, com funções checkNotificationPermissions, requestNotificationPermissions.

expo-calendar: Adicionar agendamentos ao calendário do usuário.

expo-clipboard: Copiar texto para a área de transferência (ex: chave PIX).

expo-linking: Abrir URLs externas (e-mail, telefone, links de termos).

expo-haptics: Feedback tátil para interações do usuário.

Animações:

React Native Animated API: Utilizada extensivamente para transições suaves, feedback visual em botões, entradas de tela e elementos dinâmicos.

react-native-reanimated: Para animações mais complexas e performáticas, especialmente em elementos como o logo na tela de login/boas-vindas.

Real-time Communication: Socket.IO Client é empregado para o módulo de chat, permitindo a troca de mensagens em tempo real entre clientes e profissionais.

Componentes UI/UX e Estilos:

expo-linear-gradient: Para fundos e elementos com gradientes de cor.

expo-blur: Para efeitos de desfoque (glassmorphism).

@expo/vector-icons: Biblioteca de ícones (Ionicons, MaterialCommunityIcons) para uma iconografia consistente.

Componentes customizados e reutilizáveis para inputs, botões, cards, etc.

Theming: O useColorScheme.ts (e useColorScheme.web.ts para web) e useThemeColor.ts permitem a aplicação dinâmica de temas (claro/escuro) baseados nas preferências do sistema ou do usuário, utilizando a paleta de cores definida em Colors.ts.

Funções de Apoio UI: O ui-helpers.tsx fornece funções como renderStars para renderização consistente de avaliações.

Utilitários Gerais: O helpers.ts agrupa funções utilitárias como formatDate, isValidEmail, isValidPassword, capitalizeFirstLetter, generateSimpleId, formatCurrency, truncateString, isValidPhoneNumber e formatPhoneNumber, essenciais para validação e formatação de dados em toda a aplicação.

2.2. Backend
O backend da aplicação LimpeJá é construído utilizando o framework NestJS, um framework progressivo Node.js para a construção de aplicações corporativas eficientes, escaláveis e baseadas em TypeScript. Ele utiliza uma arquitetura modular, inspirada no Angular, promovendo a separação de responsabilidades e a manutenibilidade do código.

2.2.1. Tecnologias Principais do Backend
Framework: NestJS.

Linguagem: TypeScript.

ORM: Prisma ORM para interação com o banco de dados, permitindo consultas tipadas e facilitando a gestão do schema.

Banco de Dados: PostgreSQL (com PostGIS), utilizado para armazenamento de dados, incluindo funcionalidades geoespaciais (geometry(Point, 4326) e funções ST_DistanceSphere, ST_DWithin).

Autenticação: JWT (JSON Web Tokens) para autenticação e autorização de usuários. Passport.js para NestJS, integrada com estratégias Local e JWT. O backend valida o ID Token gerado pelo Firebase no frontend, permitindo um login/registro seguro e escalável.

Comunicação em Tempo Real: WebSockets (Socket.IO) para o módulo de chat.

Documentação API: Swagger (OpenAPI) para documentação automática da API e interface interativa para testes.

Integração Firebase: Firebase Admin SDK para inicialização automática e verificação de tokens.

Gateway de Pagamento: PagSeguro para processamento de transações PIX.

Armazenamento de Arquivos: Google Cloud Storage (GCS) para fotos de perfil, documentos e selfies.

Visão Computacional: Google Cloud Vision API para processamento de OCR em documentos e detecção/comparação facial para verificação de identidade.

Hashing de Senhas: bcrypt.

Serviços de Comunicação: Integração com serviços de e-mail e SMS para comunicações transacionais (ex: redefinição de senha, OTP).

2.2.2. Estrutura Modular do Backend
A aplicação segue uma estrutura modular bem definida, onde cada funcionalidade principal reside em seu próprio módulo, promovendo a reutilização de código e facilitando o desenvolvimento, testes e manutenção.

Módulos Principais Identificados:

AppModule (Módulo Raiz)

PrismaModule (Global, para acesso ao banco de dados)

ConfigModule (Global, para gestão de configurações)

AuthModule (Autenticação e Autorização)

UsersModule (Gestão de Usuários - base para clientes/provedores)

ClientsModule (Lógica específica para Clientes)

ProvidersModule (Lógica específica para Provedores)

ServicesModule (Gestão de tipos de serviços oferecidos na plataforma)

ProviderServicesModule (Serviços específicos oferecidos por um Provedor)

AvailabilityModule (Gestão de disponibilidade de Provedores)

BookingsModule (Gestão de Agendamentos)

ReviewsModule (Gestão de Avaliações)

ChatModule (Comunicação em tempo real entre clientes e provedores)

NotificationsModule (Gerenciamento e envio de notificações)

OffersModule (Gestão de ofertas promocionais)

PaymentsModule (Processamento de pagamentos e saques)

SearchModule (Funcionalidade de busca abrangente)

VerificationModule (Processo de verificação de provedores)

DashboardModule (Dados agregados para dashboards de provedores)

EarningsModule (Gestão de ganhos de provedores)

FaqsModule (Gerenciamento de Perguntas Frequentes)

2.2.3. Prisma Schema (schema.prisma)
O arquivo schema.prisma é a fonte única de verdade para a definição do modelo de dados da aplicação. Ele define as tabelas do banco de dados, seus campos, tipos, relações e as enumerações utilizadas.

Configurações e Extensões:

generator client: Configurado para prisma-client-js com previewFeatures = ["postgresqlExtensions"]. Inclui binaryTargets (native, debian-openssl-1.1.x, debian-openssl-3.0.x) para garantir compatibilidade em diferentes ambientes Linux.

datasource db: Define o provedor de banco de dados como postgresql e utiliza a URL da variável de ambiente DATABASE_URL. Habilita a extensão PostGIS no PostgreSQL para funcionalidades geoespaciais.

Enumerações (enum):

UserRole: Define os papéis dos usuários: CLIENT, PROVIDER, ADMIN, SYSTEM.

VerificationStatus: Gerencia o status do processo de verificação de provedores: PENDING_INITIAL_REVIEW, PENDING_DOCUMENTS_UPLOAD, PENDING_BACKGROUND_CHECK, PENDING_MANUAL_REVIEW, APPROVED, REJECTED, BLOCKED.

NOVO: PricingType: Define o tipo de precificação do serviço: FIXED_PRICE, HOURLY, BY_SIZE, CUSTOM_QUOTE.

BookingStatus: Define os possíveis status de um agendamento: PENDING, CONFIRMED, COMPLETED, CANCELED, PENDING_DISPUTE, RESCHEDULED, IN_PROGRESS, PENDING_PROVIDER_CONFIRMATION, REJECTED.

TransactionType: Define os tipos de transações financeiras: PAYMENT, WITHDRAWAL, COMMISSION.

Modelos de Dados (model):

User: Base para Client e Provider, com campos para autenticação (email, phone, passwordHash, firebaseUid), papel (role), avatarUrl e timestamps. REMOVIDOS: otpCode e otpExpiresAt.

Client: Representa um cliente, com userId, fullName, phone, cpf (agora como campo corrigido), e relações para address, bookings e reviewsMade. NOVO: completedBookingsCount para programa de fidelidade.

Provider: Representa um provedor, com userId, fullName, cpf, dateOfBirth, phone, yearsOfExperience, avatarUrl, bio, pixKey. Inclui campos detalhados para o processo de verificação: verificationStatus, documentPhotoFrontUrl, documentPhotoBackUrl, selfieWithDocumentUrl, backgroundCheckResult (JSON), ocrResult (JSON), livenessResult (JSON), rejectionReason. NOVOS: fiveStarReviewCount e monthlyBookingsCount para bonificações.

Address: Representa um endereço, com campos para cep, street, number, complement, neighborhood, city, state. Inclui um campo geoespacial location (geometry(Point, 4326)) para PostGIS e relações para Client, Provider e Booking.

Service: Representa um tipo de serviço (categoria), com name, description, price (agora como Decimal), icon.

ProviderService: Representa um serviço oferecido por um provedor específico, com providerId, serviceId, price (alterado para Decimal), durationMinutes, description. Garante unicidade por providerId e serviceId. NOVOS: pricingType, pricePerSquareMeter e pricePerRoom.

Booking: Representa um agendamento de serviço, com clientId, providerId, providerServiceId, scheduledDate, scheduledTime, status, totalPrice (alterado para Decimal), notes. Inclui um addressId para o endereço específico do agendamento.

Chat: Representa uma conversa de chat entre dois usuários, com participant1Id, participant2Id e relação para Message. Garante unicidade para o par de participantes.

Message: Representa uma mensagem de chat, com chatId, senderId, receiverId, content, timestamp, isRead, targetUrl.

Notification: Representa uma notificação para um usuário, com userId, type, message, isRead, targetUrl.

Review: Representa uma avaliação de um agendamento, com bookingId, clientId, providerId, rating, comment. NOVO: updatedAt. Garante uma única avaliação por agendamento por cliente por provedor.

Offer: Representa uma oferta ou promoção, com title, description, discountPercentage, fixedDiscountAmount, validUntil, imageUrl.

Transaction: Representa uma transação financeira, com providerId, amount (alterado para Decimal), type, status, description. Inclui gatewayTransactionId e qrCodeUrl para integração com gateways de pagamento. MODIFICADO: bookingId não é mais único.

Availability: Representa os horários de disponibilidade de um provedor, com providerId, dayOfWeek, startTime, endTime, isAvailable.

FAQItem: Novo modelo para Perguntas Frequentes (FAQs), com question, answer, category, order.

2.2.4. Dados de Seed (seed.ts)
O arquivo seed.ts é responsável por popular o banco de dados com dados de teste para facilitar o desenvolvimento e testes, incluindo usuários, serviços, provedores com diferentes status de verificação, clientes, disponibilidade de horários, agendamentos e transações.

2.2.5. Fluxo de Requisições do Backend
As requisições HTTP/WebSocket entram no main.ts. O aplicativo configura CORS, aplica ValidationPipe (para validação de DTOs) e HttpExceptionFilter (para tratamento de erros consistentes) globalmente. JwtAuthGuard, LocalAuthGuard, WsAuthGuard e RolesGuard protegem as rotas e verificam permissões. O controlador recebe a requisição, valida os dados e delega a lógica de negócio para o serviço. O serviço contém a lógica de negócio, interage com o PrismaService para acesso ao banco de dados e pode chamar outros serviços. O PrismaService interage diretamente com o banco de dados PostgreSQL. A resposta é formatada e enviada de volta ao cliente.

2.2.6. Banco de Dados e ORM
O Prisma ORM é central para a interação com o banco de dados, fornecendo um cliente ORM tipado. O PrismaService é um serviço global que gerencia a conexão e desconexão com o banco de dados, incluindo lógica para desligamento gracioso. Os modelos definidos no schema.prisma são refletidos como tipos TypeScript, garantindo segurança de tipo.

2.2.7. Tratamento de Erros e Validação
Um HttpExceptionFilter global captura HttpException e formata as respostas de erro de forma consistente. ValidationPipe (e CustomValidationPipe) utilizam class-validator e class-transformer para validar os DTOs de entrada, garantindo que os dados recebidos estejam em conformidade.

2.2.8. Configuração
O ConfigModule do NestJS é utilizado para gerenciar as variáveis de ambiente. O configuration.ts define a estrutura das configurações, e o validation-schema.ts usa Joi para validar as variáveis de ambiente no início da aplicação.

Funcionalidades Principais e Fluxos de Usuário
O aplicativo LimpeJá oferece um conjunto rico de funcionalidades, divididas entre clientes e profissionais, além de recursos gerais.

3.1. Autenticação e Gerenciamento de Usuários
Login por Telefone (OTP): O usuário insere o número de telefone. Um código OTP é enviado via SMS através do Firebase Authentication. O frontend obtém o ID Token do Firebase e o envia ao backend (AuthService.verifyFirebaseIdToken) para verificação e emissão do JWT da aplicação. Os dados do usuário são armazenados no AuthContext.

Registro de Usuário: O usuário pode escolher entre "Cliente" ou "Profissional".

Registro de Cliente: Formulário multi-etapa (client-register.tsx) para criar uma conta de cliente, utilizando RegisterClientDto. Inclui campos como fullName, email, phone, cpf (agora corrigido) e address. O helpers.ts fornece funções para formatar CPF e telefone. O endereço é geocodificado e as coordenadas são salvas no banco de dados.

Registro de Profissional: Processo multi-etapa (provider-register/index.tsx, personal-details.tsx, service-details.tsx, verify-account.tsx):

Etapa 1 (Dados Pessoais): Coleta de email, password, fullName, cpf, dateOfBirth, phone e address. O helpers.ts auxilia na formatação. O endereço é geocodificado.

Etapa 2 (Detalhes do Serviço): Coleta de experiencia (bio), servicosOferecidos (agora com PricingType), estruturaPreco, areasAtendimento, anosExperiencia, pixKey e avatarUrl.

Etapa 3 (Verificação de Conta):

Upload de Documentos: Fotos da frente (DocumentPhotoType.FRONT) e verso (DocumentPhotoType.BACK) de um documento de identidade (document-upload.tsx, utilizando verificationService.uploadDocumentPhoto). O backend processa OCR no documento e armazena o resultado.

Reconhecimento Facial: Selfie segurando o documento ao lado do rosto para validação de identidade (facial-recognition.tsx, utilizando verificationService.uploadSelfie). O backend realiza comparação facial e verificação de vivacidade (liveness check) e armazena os resultados.

Verificação de Antecedentes: O backend interage com serviços externos para verificação de CPF e antecedentes criminais.

Após o envio, as informações são submetidas para análise e o provedor aguarda aprovação. O VerificationStatus enum (auth.ts, verification.ts) gerencia os estados do processo.

Recuperação de Senha: Fluxo de "Esqueci a Senha" (forgot-password.tsx) via e-mail, utilizando ForgotPasswordDto. O backend envia e-mails reais através de um serviço dedicado.

Gerenciamento de Perfil: Clientes (edit.tsx) e profissionais podem editar suas informações de perfil (nome, telefone, endereço, avatar). Profissionais podem gerenciar seus serviços oferecidos (edit-services.tsx) e disponibilidade (manage-availability.tsx).

Logout: Encerra a sessão do usuário, limpando dados de autenticação locais via AuthService.logout().

3.2. Módulo do Profissional (Provedor)
Painel (Dashboard) (dashboard.tsx): Visão geral dos ganhos totais (totalEarnings) e saques pendentes (pendingWithdrawals). Ações rápidas: acesso direto à agenda, serviços e mensagens. Novas solicitações de serviço (PENDING_PROVIDER_CONFIRMATION ou PENDING), com opções de aceitar e rejeitar. Próximos serviços confirmados. Avaliações recentes de clientes. Insights e sugestões inteligentes. NOVOS: Exibição de fiveStarReviewCount e monthlyBookingsCount.

Agenda e Disponibilidade:

Minha Agenda (schedule/index.tsx): Visualização de agendamentos por dia em um calendário, com status e detalhes do cliente.

Gerenciar Disponibilidade (manage-availability.tsx): Configuração de horários de trabalho semanais e bloqueio de datas específicas.

Serviços Oferecidos (services/index.tsx, edit-services.tsx): Listagem de todos os serviços que o profissional oferece. Funcionalidade para adicionar, editar e excluir serviços, incluindo nome, descrição, preço e duração. INTEGRADO: Suporte para seleção de PricingType (preço fixo, por hora, por metragem/cômodo) e entrada de valores correspondentes.

Ganhos (earnings.tsx): Resumo financeiro detalhado, gráfico de tendências de ganhos, histórico de transações recentes. Solicitação de saque para a conta bancária cadastrada.

Mensagens (messages/index.tsx, messages/[chatId].tsx): Lista de conversas com clientes. Chat em tempo real com clientes para discutir detalhes dos serviços, utilizando Socket.IO.

3.3. Módulo do Cliente
Exploração de Serviços (explore/index.tsx): Página inicial com banners promocionais, categorias de serviço, profissionais recomendados e profissionais próximos. Pesquisa de profissionais por filtros, com resultados. Visualização de todas as categorias e todos os profissionais próximos.

Detalhes do Profissional ([providerId].tsx): Perfil completo do profissional: nome, especialidade, avaliação, descrição, serviços oferecidos, fotos, status de verificação. Opções de contato direto (ligar, chat). Visualização de avaliações de outros clientes. Botão "Agendar Serviço".

Agendamento de Serviços (schedule-service.tsx): Processo multi-etapa para agendar um serviço com um profissional específico: seleção de data e horário, confirmação do endereço do cliente (pré-preenchido do perfil), adição de notas/observações, confirmação do valor total. Criação do agendamento via CreateBookingDto. INTEGRADO: Lógica para coletar requestedDurationMinutes, requestedSquareMeters ou requestedRoomCount com base no PricingType do serviço selecionado.

Acompanhamento de Agendamentos (bookings/index.tsx, bookings/[bookingId].tsx): Lista de agendamentos com filtros por BookingStatus. Detalhes de cada agendamento: serviço, profissional, data/hora, endereço, valor, notas. Ações disponíveis: Cancelar agendamento, contatar profissional, avaliar serviço (após conclusão), ver perfil do profissional. Tela de sucesso pós-agendamento com detalhes do PIX e opção de adicionar ao calendário. INTEGRADO: Lógica para notificar o cliente para deixar uma avaliação após o status COMPLETED.

Ofertas (ofertas/[ofertaId].tsx): Visualização de ofertas especiais disponíveis na plataforma. Detalhes da oferta: título, descrição, percentual de desconto, preço original, termos e condições, validade.

Mensagens (messages/index.tsx, messages/[chatId].tsx): Lista de conversas com profissionais. Chat em tempo real para comunicação sobre agendamentos ou dúvidas, utilizando Socket.IO.

3.4. Funcionalidades Gerais do Aplicativo
Notificações (notifications.tsx): Central de notificações para o usuário. Marcação individual ou em massa de notificações como lidas. O backend agora possui um módulo NotificationsModule completo para gerenciar o envio, armazenamento e marcação de notificações.

Configurações (settings.tsx): Preferências gerais (AppContext.tsx): ativar/desativar notificações push (notificationsEnabled), modo claro/escuro (themeMode). Informações da conta: gerenciar dados, alterar senha, excluir conta. Informações sobre o aplicativo (versão via Constants.expoConfig).

Ajuda e Suporte (help.tsx): Seção de Perguntas Frequentes (FAQ) com funcionalidade de busca. Opções de contato com o suporte (e-mail, telefone, chat online). O backend agora possui um FaqsModule completo para gerenciar as FAQs.

Informações Legais (termos.tsx, privacidade.tsx): Acesso aos Termos de Serviço e Política de Privacidade do LimpeJá.

Design e Experiência do Usuário (UI/UX)
O design do LimpeJá foca em uma experiência de usuário intuitiva, moderna e agradável, com forte uso de elementos visuais e animações.

4.1. Sistema de Design
Paleta de Cores: Definida em Colors.ts com suporte a modos claro e escuro. Inclui cores para texto, fundo, ações primárias, secundárias, alertas, e elementos específicos como cards e sombras. Predominância de Azuis, transmitindo profissionalismo, confiança e limpeza. Cores de Ação/Destaque (Verde, Amarelo/Laranja, Vermelho) para sucesso, avisos e erros. Neutros (Tons de cinza) para legibilidade e harmonia. Gradientes são utilizados extensivamente para criar profundidade e modernidade.

Tipografia: Definida em theme.ts com tamanhos (SIZES) e famílias de fonte (FONTS) consistentes em todo o aplicativo.

Tematização: Suporte a modos claro e escuro, permitindo que o usuário escolha sua preferência visual. O useThemeColor.ts e useColorScheme.ts (com useColorScheme.web.ts para web) aplicam as cores do Colors.ts de forma dinâmica.

Componentes Reutilizáveis: A aplicação utiliza uma biblioteca de componentes UI customizados (ex: InputWithIcon, AnimatedErrorMessage, ServiceItemSkeleton, ToastMessage, StarRating, InfoChip, ReviewCard, DashboardHeader, etc.) para garantir consistência visual e otimizar o desenvolvimento. O ui-helpers.tsx fornece a função renderStars para renderização padronizada de estrelas.

4.2. Animações e Feedback Visual
Animações de Entrada: A maioria das telas e listas utiliza animações de fade-in e slide-up para uma transição suave e agradável ao carregar o conteúdo.

Feedback de Toque: Botões e itens clicáveis respondem ao toque com animações de escala (useAnimatedTouch), proporcionando uma experiência tátil e visual responsiva.

Animações Contínuas/Loop: Elementos como o logo na tela de boas-vindas (welcome.tsx) e fundos abstratos utilizam animações em loop (rotação, pulso, flutuação) para adicionar dinamismo e vivacidade à interface.

Haptics: Feedback tátil (expo-haptics) é integrado em interações chave para enriquecer a experiência do usuário.

Efeitos Visuais: Utilização de LinearGradient e BlurView para criar efeitos de "glassmorphism" e profundidade, especialmente em cabeçalhos e cards.

4.3. Responsividade
O design da interface utiliza Dimensions e Platform.OS para adaptar layouts e estilos a diferentes tamanhos de tela e sistemas operacionais (iOS/Android), garantindo uma experiência otimizada em diversos dispositivos.

Fluxo de Dados e Gerenciamento de Estado
O gerenciamento de dados e estado no LimpeJá segue um padrão claro e modular.

Camada de Serviços (Service Layer): Arquivos dedicados (ex: authService.ts, providerService.ts, bookingService.ts, paymentService.ts, reviewService.ts, notificationService.ts, chatService.ts, faqService.ts, earningService.ts, complianceService.ts, analyticsService.ts, aiSuggestionsService.ts, clientService.ts, uploadService.ts, securityService.ts) que encapsulam toda a lógica de comunicação com o backend. Cada serviço é responsável por um domínio específico.

Instância Centralizada do Axios (api.ts): Uma única instância do Axios é configurada com a baseURL do backend. Interceptadores de Requisição adicionam automaticamente o token JWT. Interceptadores de Resposta tratam erros 401.

Context API para Estado Global: AuthContext.tsx (usuário logado, autenticação), AppContext.tsx (configurações globais), ProviderRegistrationContext.tsx (dados de registro do profissional).

Estado Local dos Componentes: useState e useRef são utilizados para gerenciar o estado específico de cada componente e suas animações.

Persistência de Dados Locais: AsyncStorage e SecureStore (para tokens) são usados para manter o estado da sessão e configurações do usuário entre as inicializações do aplicativo.

Comunicação em Tempo Real: O módulo de chat utiliza Socket.IO para estabelecer uma conexão persistente com o backend.

Contratos de Dados (Interfaces e Enums): O diretório types/backend contém todas as interfaces e enums que definem os contratos de dados entre o frontend e o backend, espelhando fielmente o schema.prisma e as entidades do backend. INTEGRADO: Atualização de interfaces para refletir PricingType, pricePerSquareMeter, pricePerRoom e campos de fidelidade.

Navegação
A navegação no LimpeJá é gerenciada pelo Expo Router, que utiliza um sistema de roteamento baseado em arquivos.

Estrutura de Rotas: As rotas são organizadas em diretórios e arquivos, refletindo a estrutura da aplicação (ex: (auth), (client), (provider), (common)).

Tipos de Navegação:

Stack Navigation: Utilizada para fluxos sequenciais (ex: autenticação, detalhes de agendamento).

Tab Navigation: Implementada para as principais seções do aplicativo (ex: (client)/explore, (client)/bookings, (client)/messages, (client)/profile e suas equivalentes para o provedor), facilitando a alternância entre módulos.

Rotas Nomeadas (routes.ts): Um arquivo routes.ts define constantes para as rotas, melhorando a legibilidade e a segurança de tipo ao navegar programaticamente.

Rotas Dinâmicas: A aplicação faz uso extensivo de rotas dinâmicas (ex: [providerId].tsx, [bookingId].tsx, [chatId].tsx, [ofertaId].tsx, [targetId].tsx, [serviceId].tsx, [categoriaId].tsx, [termoBusca].tsx) para exibir detalhes específicos de entidades.

Redirecionamento Condicional: O _layout.tsx principal gerencia o redirecionamento de usuários com base no estado de autenticação, função (UserRole) e status de registro/verificação (VerificationStatus), garantindo que o usuário seja sempre direcionado para a tela apropriada.

Internacionalização (i18n)
Atualmente, o aplicativo utiliza um placeholder básico (strings.ts) para strings comuns. O helpers.ts contém funções como formatDate e formatCurrency que utilizam o locale pt-BR, indicando um foco inicial no mercado brasileiro. A estrutura permite uma futura expansão para suportar múltiplos idiomas através de uma biblioteca de i18n dedicada.

Tratamento de Erros
O LimpeJá implementa uma estratégia robusta de tratamento de erros:

Centralizado no Axios: O interceptador de resposta do Axios (api.ts) captura e trata erros HTTP (ex: 401 Unauthorized), garantindo uma experiência consistente.

try-catch em Serviços e Componentes: Cada chamada de API nos serviços e a lógica de negócios nos componentes são envolvidas em blocos try-catch para capturar e lidar com exceções.

Tratamento de Erros de Permissão: O módulo permissions.ts oferece funções para verificar e solicitar permissões, exibindo alertas padronizados e direcionando o usuário para as configurações do aplicativo quando necessário.

Tratamento de Erros de Armazenamento: As funções em storage.ts incluem blocos try-catch para lidar com falhas de leitura/escrita no AsyncStorage.

Tratamento de Erros de Validação: Funções em helpers.ts como isValidEmail, isValidPassword, isValidPhoneNumber fornecem validações básicas no lado do cliente antes do envio de dados.

Feedback ao Usuário:

Alert: Para mensagens críticas ou que exigem uma ação imediata do usuário.

ToastMessage: Um componente de UI para exibir notificações temporárias de sucesso, erro ou informação.

AnimatedErrorMessage: Para exibir mensagens de erro inline em formulários, com animações sutis.

Estados de Carregamento/Erro: Indicadores de isLoading e mensagens de error são usados em todas as telas para informar o usuário sobre o status das operações.

Considerações de Segurança
As seguintes práticas de segurança são observadas e implementadas no LimpeJá:

Autenticação JWT: Padrão da indústria para sessões seguras.

SecureStore: Armazenamento de tokens em local seguro no dispositivo.

Firebase Authentication: Utilizado para a robustez na verificação de números de telefone e gerenciamento de usuários (firebaseClient.ts). O backend valida o ID Token do Firebase para garantir a autenticidade da autenticação.

Verificação de Antecedentes: Processo explícito e aprimorado para profissionais (verification.ts), incluindo validação de CPF, upload de documentos e reconhecimento facial. O backend agora armazena resultados de OCR e liveness check, e a estrutura está pronta para integração com serviços de verificação de antecedentes criminais reais. O VerificationStatus enum detalha os estados de verificação.

Gerenciamento de Permissões: O módulo permissions.ts garante que o aplicativo solicite e gerencie o acesso a recursos sensíveis do dispositivo de forma apropriada.

LGPD Compliance: A Política de Privacidade (privacidade.tsx) aborda a coleta, uso e compartilhamento de dados em conformidade com a LGPD.

HTTPS: Implícito nas chamadas de API.

Tratamento de Dados Sensíveis: Dados de pagamento são processados por gateways seguros (PagSeguro), não sendo armazenados diretamente no frontend.

Validações de Input: Funções em helpers.ts como isValidEmail, isValidPassword, isValidPhoneNumber fornecem validações básicas no lado do cliente.

Geocodificação de Endereços: Implementada no backend para converter endereços textuais em coordenadas geográficas, armazenando-as no banco de dados para buscas geoespaciais.

Envio de SMS/E-mail: Serviços dedicados no backend para envio de e-mails (redefinição de senha) e SMS (OTP), substituindo simulações e preparando para integrações reais com provedores.

2.3. Painel de Administração Web (admin-web)
O painel de administração é uma aplicação web separada, construída com React, que consome os mesmos endpoints do backend NestJS. Ele é a ferramenta central para gerenciar e monitorar a plataforma, oferecendo funcionalidades avançadas para o administrador.

2.3.1. Tecnologias Principais do Painel Web
Framework: React.
Routing: React Router ou Wouter para navegação.
Gerenciamento de Estado: React Query (TanStack Query) para gerenciamento de estado do servidor, otimizando o cache e sincronização de dados.
UI/Estilo: Tailwind CSS para estilização e um sistema de design consistente (ex: shadcn/ui) para componentes acessíveis.
Animações: Framer Motion para animações fluidas e efeitos visuais.

2.3.2. Fluxo e Funcionalidades do Painel Web
O painel de administração é acessível apenas para usuários com o papel ADMIN. Ele se comunica com o backend utilizando as rotas protegidas pelo RolesGuard.

Módulos Principais:

Dashboard Avançado:

Métricas em Tempo Real: Exibição de dados chave como total de usuários, provedores aprovados e agendamentos.

Análise Financeira: Gráficos e resumos de receita total de comissões e volume de transações.

Mapeamento Geoespacial: Um mapa dinâmico para visualizar a distribuição de provedores na plataforma, utilizando os dados PostGIS do banco de dados.

Gerenciamento de Provedores e Verificação:

Fila de Verificação: Uma seção dedicada para revisar perfis de provedores com status PENDING_DOCUMENTS_UPLOAD ou PENDING_MANUAL_REVIEW.

Revisão de Perfil: O administrador pode visualizar os documentos enviados (documentPhotoFrontUrl, documentPhotoBackUrl), a selfie (selfieWithDocumentUrl) e os resultados do processamento automático (ocrResult, livenessResult).

Controle de Ações: Botões de APROVAR, REJEITAR ou BLOQUEAR o perfil, com a opção de fornecer um motivo de rejeição (rejectionReason) que será armazenado.

Visualização de Dados: Acesso às estatísticas do provedor, como fiveStarReviewCount e monthlyBookingsCount.

Gestão de Conteúdo (CMS):

Ofertas: Uma interface completa de CRUD (criar, ler, atualizar, deletar) para gerenciar promoções. Inclui campos para discountPercentage, fixedDiscountAmount, validUntil e imageUrl.

FAQs: Um editor para criar e atualizar a seção de Perguntas Frequentes.

Gerenciamento Financeiro:

Monitoramento de Transações: Lista completa de transações com filtros por tipo (PAYMENT, WITHDRAWAL, COMMISSION).

Auditoria de Comissão: Visibilidade do fluxo de 15% de comissão sobre cada serviço.

Gestão de Saques: Interface para processar manualmente as solicitações de saque dos provedores.

Suporte e Resolução de Disputas:

Fila de Disputas: Uma seção para gerenciar agendamentos com o status PENDING_DISPUTE.

Visualização de Problemas: Interface para ler o motivo do problema e tomar ações para resolvê-lo.

O painel de administração é um projeto vital para a escalabilidade e manutenção da plataforma, e a sua criação como uma aplicação web separada é a abordagem mais adequada para a sua complexidade e uso.