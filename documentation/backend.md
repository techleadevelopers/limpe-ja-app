Documentação Técnica do Backend

Introdução
Este documento detalha a arquitetura e as funcionalidades do backend de uma aplicação de marketplace de serviços, construída com NestJS, utilizando Prisma ORM para interação com um banco de dados PostgreSQL. O objetivo principal é conectar clientes a provedores de serviços, facilitando agendamentos, pagamentos, comunicação e um robusto sistema de verificação e avaliação. A aplicação segue os princípios de uma arquitetura modular, com cada funcionalidade encapsulada em seu próprio módulo NestJS, promovendo a manutenibilidade, escalabilidade e clareza do código.

Visão Geral da Arquitetura
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

Esquema do Banco de Dados (Prisma)
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
Novidade: location (Unsupported("geometry(Point, 4326)")?) para suportar dados geoespaciais e busca por proximidade.
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
Novidade: bookingId? (FK para Booking) e booking (1:1 com Booking) para associar transações a agendamentos. O @unique para bookingId foi removido para permitir múltiplas transações por agendamento.
Relações: provider (M:1 com Provider), booking? (1:1 com Booking).
Availability:
Propósito: Define a disponibilidade dos provedores.
Campos Chave: id (UUID).
Campos: providerId (FK), dayOfWeek (Int, 0=Dom, 6=Sáb), startTime (String, HH:mm), endTime (String, HH:mm), isAvailable (Boolean, padrão true).
Relações: provider (M:1 com Provider).

Módulos e Funcionalidades Principais
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
validation-schema.ts: Utiliza a biblioteca Joi para definir um esquema de validação rigoroso para as variáveis de ambiente essenciais (ex: NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRATION_TIME). Isso garante que todas as variáveis críticas estejam presentes e tenham o formato correto antes que a aplicação inicie.
Atualização: Variáveis de ambiente do GCS (GCS_PROJECT_ID, GCS_KEY_FILE, GCS_BUCKET_NAME) foram adicionadas ao validation-schema.ts e configuration.ts, e o config.module.ts está configurado para carregá-las.
Benefício: Garante que o ambiente de execução esteja configurado corretamente antes da inicialização da aplicação, prevenindo erros de tempo de execução relacionados a variáveis ausentes ou mal formatadas, e promove a segurança ao centralizar o acesso a segredos.

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
Atualização: A lógica de search e findAllProviders foi implementada para incluir a estrutura para busca geoespacial (latitude, longitude, radius) com Prisma.$queryRaw e funções ST_DWithin/ST_DistanceSphere.

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
uploadImage(file: File, path: string): Lógica real implementada para upload para o Google Cloud Storage (GCS).
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
CreateOfferDto: Define a estrutura para a criação de uma oferta, incluindo title, description?, discountPercentage? (Float), fixedDiscountAmount? (Float), validUntil (como string ISO 8601), e imageUrl?.
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

7. Próximos Passos e Oportunidades de Melhoria (TODOs):

Com base nos comentários TODO encontrados nos arquivos e nas discussões, aqui estão as oportunidades de melhoria e funcionalidades a serem implementadas:

Integração Real com APIs Externas:

Verificação de Provedores: Substituir as simulações existentes em CriminalBackgroundCheckService.checkCpf e DocumentProcessingService (processDocumentOcr, compareFaces, performLivenessCheck) por integrações reais com serviços de terceiros (ex: ClearSale, Serasa, Google Cloud Vision API para OCR, e soluções especializadas como KRYPTUS, FaceTec, CAF para comparação facial robusta e prova de vida). Isso exigirá gerenciamento de chaves de API e tratamento de respostas complexas.

Gateway de Pagamento PIX: Integrar PaymentsService com um gateway de pagamento PIX real (ex: Stripe, PagSeguro, Cielo, Banco Central do Brasil para Open Banking/PIX Direto). Isso implicará em lidar com fluxos de pagamento assíncronos, conciliação e tratamento de falhas.

Refinamento de Tipagem de Usuários:

UserProfileDto: Ajustar a tipagem do UserProfileDto e do retorno dos métodos findOne e update em UsersService para garantir compatibilidade total com os dados do Prisma, eliminando o uso de any casts e garantindo a segurança de tipo em toda a camada de apresentação.

Expansão da Busca:

Ofertas na Busca: Considerar a implementação de busca por ofertas (OffersModule) no SearchService, expandindo o escopo da busca abrangente. Isso exigirá a definição de critérios de busca específicos para ofertas e sua integração na lógica de performSearch.

Robustez Financeira:

Atomicidade de Saques: Implementar uma solução mais robusta para a atomicidade das transações de saque. Isso pode envolver o uso de transações de banco de dados explícitas (prisma.$transaction) para garantir que o saldo seja deduzido e a transação de saque registrada de forma atômica. Para maior complexidade e escala, um modelo de "Carteira" (Wallet) explícito no banco de dados com mecanismos de bloqueio otimista ou pessimista pode ser considerado.

Chat - Permissões e Escalabilidade:

Lógica de Permissões: Refinar a lógica de permissões no ChatController e ChatService para verificar se o usuário autenticado é um participante válido de um chat antes de permitir acesso ou envio de mensagens. Isso pode envolver a criação de um ChatParticipantGuard ou lógica de serviço mais granular.

Otimização do Histórico de Mensagens: Otimizar a recuperação de histórico de mensagens para grandes volumes, talvez com indexação de texto completo ou estratégias de paginação mais avançadas.

Otimização de Queries Prisma:

include statements: Realizar uma auditoria completa de todos os include statements nos serviços para carregar apenas os dados estritamente necessários para cada operação, evitando N+1 problemas e eager loading excessivo, o que pode otimizar significativamente o desempenho da base de dados e reduzir o uso de memória no backend.

Refinamento Contínuo da Documentação Swagger:

Continuar refinando os DTOs e entidades com @ApiProperty e @ApiPropertyOptional para garantir que a documentação gerada pelo Swagger seja precisa, completa e reflita as últimas mudanças na API, especialmente para campos de relação e tipos complexos.

Implementação de Internacionalização (i18n):

Para uma expansão global, a implementação de um sistema de internacionalização (i18n) é fundamental. Isso envolveria a externalização de todas as strings de UI e mensagens de erro para arquivos de tradução.

Análise do Relatório e Próximos Passos por Integração
1. Backend (NestJS)

A maior parte dos próximos passos críticos e das integrações com APIs externas está concentrada no backend.

Integração Real com APIs Externas para Verificação de Provedores:

Objetivo: Substituir as simulações existentes por integrações reais para OCR, comparação facial, prova de vida e verificação de antecedentes.
APIs Envolvidas: Google Cloud Vision API (para OCR e detecção facial), e serviços de terceiros (como ClearSale, Serasa, FaceTec, CAF, AWS Rekognition para comparação facial robusta e prova de vida).
Arquivos Principais:
src/verification/document-processing.service.ts: Este arquivo será o ponto central para a integração com a Google Cloud Vision API (para processDocumentOcr e compareFaces - detecção de faces). Também será o local para integrar serviços de terceiros para performLivenessCheck e para a lógica de compareFaces se a Google Cloud Vision API não for suficiente para a comparação de similaridade robusta.
src/verification/criminal-background-check.service.ts: Este arquivo será integrado com serviços de terceiros (ex: ClearSale, Serasa Experian) para a verificação de CPF e antecedentes (checkCpf).
src/verification/verification.controller.ts: Embora não exija grandes mudanças lógicas, é importante garantir que o tratamento de erros (try-catch) seja robusto para lidar com as exceções que as APIs reais podem lançar.
Integração Real com Gateway de Pagamento PIX:

Objetivo: Conectar o sistema a um gateway de pagamento PIX real para processar transações.
APIs Envolvidas: Gateways de pagamento (ex: Stripe, PagSeguro, Cielo, ou APIs diretas do Banco Central do Brasil para Open Banking/PIX).
Arquivos Principais:
src/payments/payments.service.ts: Será o local para implementar a lógica de createPixCharge e handlePixWebhook com a API do gateway escolhido.
Refinamento de Tipagem de Usuários:

Objetivo: Garantir a compatibilidade total e segurança de tipo para os dados de usuário.
Arquivos Principais:
src/users/users.service.ts: Para ajustar o retorno dos métodos findOne e update.
DTOs relacionados ao perfil do usuário (ex: src/users/dto/user-profile.dto.ts - se existir ou for criado).
Expansão da Busca (Ofertas):

Objetivo: Incluir ofertas nos resultados da busca abrangente.
Arquivos Principais:
src/search/search.service.ts: Para integrar a lógica de busca por ofertas no método performSearch.
src/offers/offers.module.ts: (Contexto) O módulo de ofertas já existe, mas a integração da busca será no SearchService.
Robustez Financeira (Atomicidade de Saques):

Objetivo: Assegurar a integridade das transações de saque.
Arquivos Principais:
src/payments/payments.service.ts: Provavelmente, pois é onde as operações financeiras são gerenciadas.
Pode envolver a criação de um novo modelo/serviço src/wallet/wallet.service.ts se uma carteira explícita for implementada.
Chat - Permissões e Escalabilidade:

Objetivo: Refinar o controle de acesso e otimizar o histórico de mensagens.
Arquivos Principais:
src/chat/chat.controller.ts: Para implementar a lógica de permissões.
src/chat/chat.service.ts: Para a lógica de permissões e otimização da recuperação de mensagens.
Otimização de Queries Prisma:

Objetivo: Melhorar o desempenho do banco de dados revisando as cláusulas include.
Arquivos Principais: Esta é uma tarefa de otimização que afetará todos os serviços que utilizam o Prisma para consultas ao banco de dados, como src/providers/providers.service.ts, src/bookings/bookings.service.ts, src/chat/chat.service.ts, etc.
Refinamento Contínuo da Documentação Swagger:

Objetivo: Manter a documentação da API precisa e atualizada.
Arquivos Principais: Afeta todos os DTOs e controladores no backend que utilizam anotações @ApiProperty e @ApiQuery.
Implementação de Internacionalização (i18n):

Objetivo: Preparar o aplicativo para múltiplos idiomas.
Arquivos Principais: Esta é uma tarefa transversal que afetará praticamente todos os arquivos que contêm strings visíveis ao usuário ou mensagens de erro, tanto no backend quanto no frontend.
2. Frontend (React Native / Expo)

Integração com as APIs Reais de Verificação e Pagamento:

Objetivo: Consumir os endpoints do backend que agora estarão integrados com as APIs reais.
Arquivos Principais:
services/verificationService.ts: Para chamar os endpoints de verificação do backend.
services/paymentService.ts: Para chamar os endpoints de pagamento do backend.
Chat - Acesso Condicional na UI:

Objetivo: Controlar a visibilidade e funcionalidade do chat com base no status do agendamento.
Arquivos Principais:
app/(client)/messages/index.tsx
app/(client)/messages/[chatId].tsx
app/(provider)/messages/index.tsx
app/(provider)/messages/[chatId].tsx
app/(client)/explore/[providerId].tsx (para exibir/ocultar o botão de chat no perfil do provedor)
LimpeJaApp/services/bookingService.ts: Pode ser necessário um novo método ou modificação para verificar o status de agendamentos entre um cliente e um provedor específico, que será usado pela lógica da UI.
Implementação de Internacionalização (i18n):

Objetivo: Suportar múltiplos idiomas na interface do usuário.
Arquivos Principais: Afetará todos os componentes de UI que exibem texto.
Testes de Integração de Ponta a Ponta:

Objetivo: Garantir que todos os fluxos funcionem corretamente após as novas integrações.
Arquivos Principais: Esta é uma atividade de teste, não um arquivo de código específico, mas os testes serão escritos utilizando os fluxos de usuário do aplicativo.
Refinamento da Experiência do Usuário e Otimização de Performance:

Objetivo: Melhorar a usabilidade e o desempenho geral do aplicativo.
Arquivos Principais: Esta é uma tarefa contínua que pode impactar qualquer componente ou serviço do frontend que precise de otimização ou ajustes de UI/UX.
Resumo dos Próximos Passos e Arquivos Chave para Integração de APIs:

Funcionalidade	Integração Necessária	Arquivos Principais
Verificação - OCR (Real)	Google Cloud Vision API	src/verification/document-processing.service.ts
Verificação - Facial (Real)	Google Cloud Vision API / Serviço de Terceiros (ex: FaceTec)	src/verification/document-processing.service.ts
Verificação - Prova de Vida	Serviço de Terceiros (Específico, ex: FaceTec, CAF)	src/verification/document-processing.service.ts
Verificação - CPF/Antecedentes	Serviço de Terceiros (Específico, ex: ClearSale, Serasa)	src/verification/criminal-background-check.service.ts
Gateway Pagamento PIX	API de Gateway Real (ex: Stripe, PagSeguro)	src/payments/payments.service.ts
Busca Geoespacial (Real)	PostGIS (PostgreSQL) + Prisma.$queryRaw	src/providers/providers.service.ts, prisma/schema.prisma
Integração Frontend Verificação	Consumir APIs de Backend	services/verificationService.ts (frontend)
Integração Frontend Pagamento	Consumir APIs de Backend	services/paymentService.ts (frontend)
Controle de Chat na UI	Lógica de UI baseada no status de agendamento	app/(client)/messages/index.tsx, app/(client)/messages/[chatId].tsx, app/(provider)/messages/index.tsx, app/(provider)/messages/[chatId].tsx, app/(client)/explore/[providerId].tsx, LimpeJaApp/services/bookingService.ts
Este roteiro fornece uma visão clara dos próximos passos e dos arquivos que serão o foco principal para a integração das APIs e a finalização das funcionalidades. O fato de as permissões IAM básicas no Google Cloud já estarem configuradas com roles/editor simplifica o início da implementação das integrações com os serviços GCP.