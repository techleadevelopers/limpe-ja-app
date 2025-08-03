Documentação Técnica do Backend LimpeJá (Atualizada)
Visão Geral e Propósito
O backend do LimpeJá é a espinha dorsal da plataforma, responsável por gerenciar toda a lógica de negócios, persistência de dados e comunicação com o frontend (aplicativo móvel e futuras interfaces). Seu propósito primordial é conectar clientes que buscam serviços de limpeza e manutenção com provedores qualificados, facilitando o agendamento, a gestão de serviços, pagamentos, comunicação e avaliações.

Construído com NestJS, um framework progressivo de Node.js, este backend adota uma arquitetura modular e escalável, garantindo robustez, manutenibilidade e alta performance para suportar o crescimento da base de usuários e a expansão de funcionalidades.

Arquitetura
2.1. Tecnologias Principais
Framework: NestJS (Node.js) - Escolhido por sua modularidade, forte tipagem (TypeScript), e aderência a padrões de arquitetura (MVC, DDD).
Linguagem: TypeScript - Oferece segurança de tipo, melhorando a qualidade e manutenibilidade do código.
Banco de Dados: PostgreSQL (ou outro DB relacional configurado via DATABASE_URL) - Um banco de dados relacional robusto e escalável.
ORM: Prisma - Um ORM moderno que oferece segurança de tipo, migrações declarativas e um cliente de banco de dados intuitivo.
Autenticação: JWT (JSON Web Tokens) com Passport.js - Para autenticação stateless e segura.
Comunicação em Tempo Real: Socket.IO - Para funcionalidades de chat e notificações em tempo real.
Validação: Class-validator e Class-transformer - Para validação declarativa de DTOs.
Documentação API: Swagger (OpenAPI) - Para documentação automática e interativa da API.
Variáveis de Ambiente: @nestjs/config com Joi - Para gerenciamento e validação de configurações.

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
src/payments: Processamento de pagamentos (PIX simulado) e saques.
src/chat: Funcionalidades de chat (REST e WebSocket).
src/notifications: Gestão de notificações para usuários.
src/reviews: Submissão e consulta de avaliações.
src/offers: Gerenciamento de ofertas e promoções.
src/search: Motor de busca abrangente.
src/dashboard: Gerenciamento de dados do painel para provedores.
src/verification: Gerenciamento do processo de verificação de provedores (documentos, selfie, OCR, liveness).
src/prisma: Módulo global para o PrismaService.
src/config: Módulo global para gerenciamento de configurações.
src/common: Componentes reutilizáveis (pipes, filtros de exceção, DTOs genéricos, enums).


2.3. Fluxo de Requisição
Requisição HTTP/WebSocket: O frontend envia uma requisição para um endpoint específico.
Guards (Autenticação/Autorização): JwtAuthGuard valida o token JWT. RolesGuard verifica se o usuário autenticado possui as roles necessárias para acessar a rota.
Pipes (Validação/Transformação): CustomValidationPipe (globalmente aplicado) valida os DTOs de entrada, garantindo a integridade dos dados e transformando-os para o tipo correto.
Controller: Recebe a requisição validada, extrai os parâmetros e delega a lógica de negócios para o serviço apropriado.
Service: Contém a lógica de negócios principal, interagindo com o PrismaService para acessar o banco de dados. Pode injetar outros serviços para orquestrar operações complexas.
PrismaService: Atua como a camada de acesso a dados, executando operações no banco de dados.
Resposta: O serviço retorna os dados para o controlador, que os formata (geralmente usando DTOs de resposta) e os envia de volta ao frontend.
Filters (Tratamento de Exceções): HttpExceptionFilter captura exceções HTTP, formatando as respostas de erro de forma consistente para o frontend.

Módulos e Funcionalidades Detalhadas

3.1. Módulo de Autenticação (AuthModule)
Responsabilidade: Gerenciar o ciclo de vida da autenticação.
Controlador (AuthController):
POST /auth/register/client: Registra um novo cliente.
POST /auth/register/provider: Registra um novo provedor.
POST /auth/login: Autentica um usuário (cliente/provedor) e retorna um JWT.
POST /auth/forgot-password: Inicia o processo de redefinição de senha.
Serviço (AuthService): Lógica de registro (hash de senha, criação de usuário/cliente/provedor), validação de credenciais, geração de JWT. **Removida a autenticação baseada em telefone/OTP. O registro de cliente e provedor agora inclui o tratamento de coordenadas geoespaciais para o endereço.**
DTOs: LoginDto, RegisterClientDto, RegisterProviderDto, ForgotPasswordDto, AuthResponseDto, MessageResponseDto.
Guards: LocalAuthGuard (para login), JwtAuthGuard.


3.2. Módulo de Usuários (UsersModule)
Responsabilidade: Gerenciar perfis de usuário genéricos (base para clientes e provedores).
Controlador (UsersController):
GET /users/me: Obtém o perfil completo do usuário logado.
PATCH /users/me: Atualiza o perfil básico do usuário logado (e-mail).
GET /users/:id (ADMIN): Obtém o perfil de qualquer usuário por ID.
DELETE /users/:id (ADMIN): Deleta um usuário por ID.
Serviço (UsersService): Lógica para buscar (findOne com includes para client/provider e suas relações), atualizar e remover usuários.
DTOs: UserProfileDto, UpdateUserDto.

3.3. Módulo de Clientes (ClientsModule)
Responsabilidade: Gerenciar a lógica específica para o papel de cliente.
Controlador (ClientsController):
GET /clients/me/dashboard (CLIENT): Obtém dados do dashboard do cliente logado.
PATCH /clients/me (CLIENT): Atualiza o perfil do cliente logado (nome, telefone, endereço).
GET /clients/:id (ADMIN): Obtém o perfil de qualquer cliente por ID.
Serviço (ClientsService): Lógica para buscar clientes por ID/UserID, atualizar dados do cliente, e compilar dados para o dashboard.
DTOs: ClientDashboardDto, UpdateClientProfileDto, ClientDetailsDto.

3.4. Módulo de Provedores (ProvidersModule)
Responsabilidade: Gerenciar a lógica específica para o papel de provedor.
Controlador (ProvidersController):
GET /providers/:id: Obtém detalhes públicos de um provedor.
GET /providers/me (PROVIDER): Obtém o perfil completo do provedor logado.
PATCH /providers/me (PROVIDER): Atualiza o perfil do provedor logado (nome, CPF, data de nascimento, telefone, bio, endereço, etc.), **incluindo a chave PIX e o status de verificação**.
DELETE /providers/:id (ADMIN): Deleta um provedor por ID.
GET /providers: Busca provedores com filtros (termo, localização, rating, geoespacial).
GET /providers/recommended: Obtém uma lista de provedores recomendados.
GET /providers/nearby: Obtém uma lista de provedores próximos, possivelmente com base na localização do usuário.
POST /providers/:providerId/services (PROVIDER): Adiciona um novo serviço à lista de serviços oferecidos por um provedor.
GET /providers/:providerId/services: Lista todos os serviços oferecidos por um provedor específico.
PATCH /providers/:providerId/services/:id (PROVIDER): Atualiza um serviço específico oferecido por um provedor.
DELETE /providers/:providerId/services/:id (PROVIDER): Remove um serviço específico oferecido por um provedor.
Serviço (ProvidersService): Lógica para buscar provedores por ID/UserID, atualizar dados do provedor, e realizar buscas complexas. **Aprimorado com busca geoespacial utilizando PostGIS (ST_DistanceSphere, ST_DWithin) para encontrar provedores por proximidade, além de filtros por termo, serviço, localização e rating. Inclui `fiveStarReviewCount` e `monthlyBookingsCount` nos resultados. Contém métodos para buscar provedores pendentes de verificação (`getPendingProviders`) e provedores recomendados/experientes (`findTopRatedOrExperiencedProviders`).**
DTOs: ProviderDetailsDto, UpdateProviderProfileDto, ProviderSearchDto.


3.5. Módulo de Disponibilidade (AvailabilityModule)
Responsabilidade: Gerenciar os horários de disponibilidade dos provedores.
Controlador (AvailabilityController):
GET /providers/:providerId/availability: Obtém horários de disponibilidade de um provedor.
PATCH /providers/:providerId/availability (PROVIDER): Atualiza múltiplos slots de disponibilidade (cria, atualiza, deleta).
POST /providers/:providerId/availability (PROVIDER): Adiciona um novo slot de disponibilidade.
DELETE /providers/:providerId/availability/:availabilityId (PROVIDER): Deleta um slot específico.
Serviço (AvailabilityService): Lógica para CRUD de slots de disponibilidade, incluindo validação de propriedade do provedor.
DTOs: GetAvailabilityDto, UpdateAvailabilityDto.

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

3.7. Módulo de Serviços Oferecidos por Provedores (ProviderServicesModule)
Responsabilidade: Gerenciar os serviços específicos que cada provedor oferece (e.g., "Maria oferece Limpeza Padrão por R$100").
Controlador (ProviderServicesController):
POST /providers/:providerId/services (PROVIDER): Adiciona um serviço oferecido por um provedor.
GET /providers/:providerId/services: Lista todos os serviços oferecidos por um provedor.
PATCH /providers/:providerId/services/:id (PROVIDER): Atualiza um serviço oferecido.
DELETE /providers/:providerId/services/:id (PROVIDER): Remove um serviço oferecido.
Serviço (ProviderServicesService): Lógica para CRUD de ProviderService, incluindo validações de existência e unicidade. **Agora suporta diferentes tipos de precificação (por preço fixo, por hora, por tamanho, por cômodo) com campos `pricePerSquareMeter` e `pricePerRoom`.**
DTOs: CreateProviderServiceDto, UpdateProviderServiceDto.



3.8. Módulo de Agendamentos (BookingsModule)
Responsabilidade: Gerenciar o ciclo de vida dos agendamentos de serviços.
Controlador (BookingsController):
POST /bookings (CLIENT): Cria um novo agendamento.
GET /bookings/me: Obtém agendamentos do usuário logado (cliente ou provedor).
GET /bookings/:id: Obtém detalhes de um agendamento específico.
PATCH /bookings/:id/status (CLIENT/PROVIDER): Atualiza o status de um agendamento.
PATCH /bookings/:id/cancel (CLIENT): Cancela um agendamento.
Serviço (BookingsService): Lógica para criação de agendamentos (verificando provedor/serviço), busca de agendamentos por usuário/role, e transições de status complexas.
DTOs: CreateBookingDto, UpdateBookingStatusDto, BookingDetailsDto.


3.9. Módulo de Pagamentos (PaymentsModule)
Responsabilidade: Gerenciar operações de pagamento e saque.
Controlador (PaymentsController):
POST /payments/pix-charge: Cria uma cobrança PIX (simulada).
POST /payments/withdrawal: Solicita um saque de um provedor.
POST /payments/webhook/pix: **NOVO ENDPOINT.** Recebe notificações de webhook de pagamento PIX do gateway (PagSeguro).
Serviço (PaymentsService):
- `createPixCharge`: Lógica para criar cobranças PIX, incluindo busca de detalhes completos do cliente (email, nome, telefone, CPF, endereço) e do agendamento/serviço. Integração com a API do PagSeguro para geração de QR Code e BR Code, e atualização do status do agendamento para PENDING.
- `requestWithdrawal`: Processa solicitações de saque de provedores, validando o saldo disponível e registrando a transação.
- `handlePixWebhook`: **NOVO MÉTODO.** Processa notificações de webhook de PIX, atualizando o status da transação e do agendamento (para CONFIRMED ou CANCELED) conforme o retorno do gateway.
DTOs: CreatePixChargeDto, PixChargeResponseDto, RequestWithdrawalDto, MessageResponseDto.


3.10. Módulo de Chat (ChatModule)
Responsabilidade: Gerenciar a comunicação de mensagens entre usuários.
Controlador (ChatController): (REST fallback)
GET /chat/find-or-create/provider/:providerId/client/:clientId: Encontra um chat existente ou cria um novo entre um provedor e um cliente.
POST /chat/:chatId/messages: Envia uma nova mensagem.
GET /chat/:chatId/messages: Obtém o histórico de mensagens de uma conversa.
Gateway (ChatGateway): (WebSocket)
@SubscribeMessage('sendMessage'): Lida com o envio de mensagens em tempo real.
@SubscribeMessage('joinChat'): Permite que clientes entrem em salas de chat.
Serviço (ChatService): Lógica para criar e buscar mensagens.
DTOs: SendMessageDto, GetMessagesDto.
3.11. Módulo de Notificações (NotificationsModule)
Responsabilidade: Gerenciar o envio e status de notificações para usuários.
Controlador (NotificationsController):
GET /notifications/me: Obtém notificações do usuário logado.
PATCH /notifications/me/mark-as-read: Marca múltiplas/todas as notificações como lidas.
PATCH /notifications/:id/mark-as-read: Marca uma notificação específica como lida.
DELETE /notifications/:id: Deleta uma notificação.
Serviço (NotificationsService): Lógica para criar, buscar, marcar como lidas e deletar notificações.
DTOs: MarkAsReadDto.
3.12. Módulo de Avaliações (ReviewsModule)
Responsabilidade: Gerenciar a submissão e consulta de avaliações de serviços.
Controlador (ReviewsController):
POST /reviews (CLIENT): Envia uma nova avaliação para um serviço concluído.
GET /reviews: Obtém avaliações com filtros (provedor, cliente, rating).
GET /reviews/:id: Obtém uma avaliação por ID.
Serviço (ReviewsService): Lógica para submeter avaliações (verificando agendamento, status, duplicidade) e buscar avaliações.
DTOs: SubmitReviewDto, GetReviewsDto.
3.13. Módulo de Ofertas (OffersModule)
Responsabilidade: Gerenciar ofertas e promoções da plataforma.
Controlador (OffersController):
POST /offers (ADMIN): Cria uma nova oferta.
GET /offers: Lista todas as ofertas.
GET /offers/:id: Obtém detalhes de uma oferta específica.
PATCH /offers/:id (ADMIN): Atualiza uma oferta existente.
DELETE /offers/:id (ADMIN): Exclui uma oferta.
Serviço (OffersService): Lógica para CRUD de ofertas.
DTOs: CreateOfferDto, UpdateOfferDto.
3.14. Módulo de Busca (SearchModule)
Responsabilidade: Fornecer um endpoint unificado para busca abrangente.
Controlador (SearchController):
GET /search: Realiza uma busca por provedores, serviços, etc., usando diversos critérios.
Serviço (SearchService): Orquestra chamadas a outros serviços (ProvidersService, ServicesService) para compilar resultados de busca.
DTOs: SearchQueryDto.
3.15. Módulo de Aplicação (AppModule / Geral)
Responsabilidade: Gerenciar rotas de nível de aplicação e verificações de saúde.
Controlador (AppController):
GET /: Rota raiz, geralmente para verificar se a API está online ou retornar uma mensagem de boas-vindas.
GET /health: Endpoint para verificações de saúde da aplicação.
Serviço (AppService): Lógica para as rotas gerais da aplicação.
DTOs: Nenhum DTO específico para estas rotas.

3.16. Módulo de Verificação (VerificationModule)
Responsabilidade: Gerenciar o processo de verificação de provedores, incluindo upload e processamento de documentos, selfie, OCR, verificação de vivacidade (liveness), comparação facial e aprovação/rejeição manual.
Controlador (VerificationController):
GET /verification/pending-queue (ADMIN): Obtém a lista de provedores com status de verificação pendente de revisão manual ou upload de documentos.
POST /verification/upload-document/:type (PROVIDER): Permite que o provedor faça upload da foto da frente ou verso de um documento de identificação. Processa OCR no documento.
POST /verification/upload-selfie (PROVIDER): Permite que o provedor faça upload de uma selfie com o documento. Realiza verificação de vivacidade (liveness check) e comparação facial com o documento enviado anteriormente.
PATCH /verification/:providerId/status (ADMIN): Atualiza manualmente o status de verificação de um provedor (APROVADO, REJEITADO, etc.).
POST /verification/reject/:providerId (ADMIN): Rejeita um provedor, exigindo um motivo.
GET /verification/status/:providerId (ADMIN, PROVIDER): Obtém o status atual da verificação de um provedor, incluindo o progresso dos uploads e resultados de OCR/Liveness.
Serviço (VerificationService): Orquestra o fluxo de verificação. Responsável por:
- Gerenciar uploads de arquivos para armazenamento.
- Chamar `DocumentProcessingService` para OCR, liveness check e comparação facial.
- Atualizar o `verificationStatus` do provedor automaticamente com base no progresso das verificações (`updateProviderVerificationStatus`).
- Permitir atualizações manuais de status e registro de motivos de rejeição.
DTOs: UploadDocumentDto, UploadSelfieDto, UpdateVerificationStatusDto.

3.17. Módulo de Dashboard (DashboardModule)
Responsabilidade: Fornecer dados sumarizados e relevantes para o painel do provedor logado.
Controlador (DashboardController):
GET /providers/me/dashboard (PROVIDER): Obtém todos os dados necessários para o dashboard de um provedor, incluindo agendamentos futuros, ganhos, avaliações recentes, contagem de avaliações 5 estrelas e contagem de agendamentos mensais.
Serviço (DashboardService): Agrega dados de diversos serviços (ProvidersService, BookingsService, EarningsService, ReviewsService) para compilar o `DashboardDto`.
DTOs: DashboardDto.

Modelo de Dados (Prisma Schema)
O schema.prisma (prisma/schema.prisma) define o modelo de dados relacional e é a fonte da verdade para a estrutura do banco de dados. As principais entidades e suas relações são:

User: Entidade central, com email, passwordHash e role (CLIENT, PROVIDER, ADMIN). Relaciona-se 1:1 com Client ou Provider.
Client: Detalhes específicos do cliente (fullName, phone). Relaciona-se com Address (1:1), Booking (1:N), Review (1:N, avaliações feitas).
Provider: Detalhes específicos do provedor (fullName, cpf, dateOfBirth, bio, yearsOfExperience, verified). Relaciona-se com Address (1:1), ProviderService (1:N), Availability (1:N), Booking (1:N), Review (1:N, avaliações recebidas), Transaction (1:N, ganhos).
Address: Endereço, relacionado 1:1 com Client ou Provider.
Service: Tipos de serviço globais (name, description).
ProviderService: Associa um Provider a um Service com price e durationMinutes.
Booking: Agendamento, conectando Client, Provider e ProviderService. Possui scheduledDate, scheduledTime, totalPrice e status (com transições bem definidas). Relaciona-se 1:1 com Review.
Message: Mensagens de chat, ligando sender e receiver (User).
Notification: Notificações de usuário, ligando a um User.
Review: Avaliações, ligando Client, Provider e Booking.
Offer: Ofertas/promoções.
Transaction: Registros financeiros de ganhos/saques de provedores.
Availability: Slots de disponibilidade de provedores por dia da semana e horário.

Princípios de Design e Padrões de Projeto
5.1. Arquitetura em Camadas
O backend segue uma arquitetura em camadas clara:

Controladores: Camada de interface, recebem requisições e delegam.
Serviços: Camada de lógica de negócios, orquestram operações e manipulam dados.
PrismaService: Camada de acesso a dados, abstrai a interação direta com o banco de dados.
5.2. Data Transfer Objects (DTOs)
Uso extensivo de DTOs para:

Validação de Entrada: Garantir que os dados recebidos estejam no formato e com as restrições corretas (class-validator).
Tipagem de Saída: Definir a estrutura exata dos dados retornados pela API, garantindo consistência para o frontend.
Segurança: Evitar a exposição de dados sensíveis do banco de dados diretamente.
5.3. Autenticação e Autorização
JWT: Tokens de acesso para autenticação stateless.
Guards (JwtAuthGuard, RolesGuard, WsAuthGuard): Protegem as rotas, garantindo que apenas usuários autenticados e com as roles corretas possam acessá-las.
Decoradores (@Roles): Sintaxe declarativa para definir roles necessárias.
5.4. Tratamento Centralizado de Erros
O HttpExceptionFilter garante que todas as exceções HTTP sejam capturadas e transformadas em um formato de resposta JSON padronizado, facilitando o tratamento de erros no frontend.

5.5. Modularidade
A estrutura de módulos do NestJS promove a separação de preocupações, tornando o código mais organizado, testável e reutilizável.

5.6. Segurança de Tipos (Type-Safety)
O uso de TypeScript em conjunto com o Prisma (que gera tipos automaticamente a partir do schema) garante que o código seja fortemente tipado, reduzindo erros em tempo de execução e melhorando a experiência de desenvolvimento.

Considerações de Desenvolvimento e Operação
6.1. Variáveis de Ambiente e Configuração
Todas as configurações sensíveis e específicas do ambiente são gerenciadas via variáveis de ambiente (.env).
O ConfigModule as carrega e valida, garantindo que o ambiente esteja corretamente configurado.
6.2. Gerenciamento de Banco de Dados (Prisma Migrations)
O schema.prisma é a fonte da verdade para o banco de dados.
Alterações no schema devem ser acompanhadas de migrações (npx prisma migrate dev), garantindo a evolução controlada do esquema do banco de dados.
npx prisma generate deve ser executado após qualquer alteração no schema para atualizar o Prisma Client.
6.5. Escalabilidade (WebSockets)
A implementação do chat via WebSockets (Socket.IO) é um ponto de partida. Para alta escalabilidade, considerar:

Redis Adapter: Para permitir que múltiplos instâncias do backend compartilhem o estado do WebSocket.
Load Balancers: Configurados para suportar sticky sessions para WebSockets.
7. Roadmap e Próximas Etapas
O backend do LimpeJá está em um estágio avançado de desenvolvimento, com a maioria dos fluxos essenciais implementados e alinhados com o frontend. As próximas etapas focam em aprimoramentos e expansão:

7.1. Funcionalidades de Gestão (Admin)
Gerenciamento de Tipos de Serviço Globais: Desenvolver UI no frontend para POST, PATCH, DELETE em /services.
Gerenciamento de Ofertas: Desenvolver UI no frontend para POST, PATCH, DELETE em /offers.
Gerenciamento de Usuários/Provedores: Expandir a UI para DELETE /providers/:id e DELETE /users/:id.
7.2. Aprimoramentos de Funcionalidades Existentes
Cálculo de walletBalance: Implementar a lógica para calcular e popular o walletBalance para clientes (e provedores, se aplicável) com base nas Transactions ou adicionar um campo dedicado no Client no schema.prisma.
Busca Avançada de Provedores: Implementar lógica geoespacial (sortBy: Distance, latitude, longitude, radius) usando PostGIS ou uma solução de geocoding.
Exibição Completa de Reviews: Desenvolver UI no frontend para consumir GET /reviews e GET /reviews/:id para exibir listas e detalhes de avaliações.
Transições de Status de Agendamento: Refinar a lógica de transição de status para cobrir todos os cenários e edge cases.
7.3. Integrações Futuras
Gateway de Pagamento Real: Substituir a simulação PIX por uma integração real com um gateway de pagamento (e.g., Stripe, PagSeguro, Mercado Pago).
Notificações Push: Integrar com serviços de notificação push (e.g., Firebase Cloud Messaging) para notificações móveis.
Sistema de Mensagens Robusto: Implementar persistência de conversas de chat e funcionalidades como "digitando...", "visto por último".
Esta documentação serve como um ponto de referência sólido para todos os envolvidos no projeto LimpeJá. Mantenha-a atualizada à medida que o sistema evolui.

Atenciosamente,

Paulo Silas de Campos Filho - Tech Lead

cleaning-backend/
├── src/
│   ├── main.ts                     # Ponto de entrada da aplicação
│   ├── app.module.ts               # Módulo raiz da aplicação
│   ├── app.controller.ts           # Controlador raiz (health checks)
│   ├── app.service.ts              # Serviço raiz
│   │
│   ├── auth/                       # Módulo de Autenticação (Login, Registro, Reset de Senha)
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   └── roles.decorator.ts
│   │   └── dto/
│   │       ├── register-client.dto.ts
│   │       ├── register-provider.dto.ts
│   │       ├── login.dto.ts
│   │       ├── forgot-password.dto.ts
│   │       └── auth-response.dto.ts
│   │
│   ├── users/                      # Módulo de Gerenciamento de Usuários (comum a clientes e provedores)
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dto/
│   │       └── user-profile.dto.ts
│   │
│   ├── clients/                    # Módulo Específico para Clientes
│   │   ├── clients.module.ts
│   │   ├── clients.controller.ts
│   │   ├── clients.service.ts
│   │   ├── entities/
│   │   │   └── client.entity.ts
│   │   └── dto/
│   │       ├── update-client-profile.dto.ts
│   │       └── client-dashboard.dto.ts
│   │
│   ├── providers/                  # Módulo Específico para Provedores
│   │   ├── providers.module.ts
│   │   ├── providers.controller.ts
│   │   ├── providers.service.ts
│   │   ├── entities/
│   │   │   └── provider.entity.ts
│   │   └── dto/
│   │       ├── update-provider-profile.dto.ts
│   │       ├── provider-details.dto.ts
│   │       └── provider-search.dto.ts
│   │
│   ├── services/                   # Módulo de Gerenciamento de Tipos de Serviço (Limpeza Padrão, Pesada, etc.)
│   │   ├── services.module.ts
│   │   ├── services.controller.ts
│   │   ├── services.service.ts
│   │   ├── entities/
│   │   │   └── service.entity.ts
│   │   └── dto/
│   │       ├── create-service.dto.ts
│   │       ├── update-service.dto.ts
│   │       └── service-details.dto.ts
│   │
│   ├── provider-services/          # Módulo para Serviços Oferecidos por um Provedor Específico
│   │   ├── provider-services.module.ts
│   │   ├── provider-services.controller.ts
│   │   ├── provider-services.service.ts
│   │   ├── entities/
│   │   │   └── provider-service.entity.ts
│   │   └── dto/
│   │       ├── create-provider-service.dto.ts
│   │       └── update-provider-service.dto.ts
│   │
│   ├── availability/               # Módulo de Disponibilidade do Provedor
│   │   ├── availability.module.ts
│   │   ├── availability.controller.ts
│   │   ├── availability.service.ts
│   │   └── dto/
│   │       ├── update-availability.dto.ts
│   │       └── get-availability.dto.ts
│   │
│   ├── bookings/                   # Módulo de Agendamentos
│   │   ├── bookings.module.ts
│   │   ├── bookings.controller.ts
│   │   ├── bookings.service.ts
│   │   └── dto/
│   │       └── create-booking.dto.ts
│   │
│   ├── payments/                   # Módulo de Pagamentos e Repasses
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── entities/
│   │   │   └── transaction.entity.ts
│   │   └── dto/
│   │       ├── create-pix-charge.dto.ts
│   │       └── request-withdrawal.dto.ts
│   │
│   ├── chat/                       # Módulo de Chat/Mensagens
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   ├── gateway/
│   │   │   └── chat.gateway.ts
│   │   ├── entities/
│   │   │   └── message.entity.ts
│   │   └── dto/
│   │       ├── send-message.dto.ts
│   │       └── get-messages.dto.ts
│   │
│   ├── notifications/              # Módulo de Notificações
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   ├── entities/
│   │   │   └── notification.entity.ts
│   │   └── dto/
│   │       └── mark-as-read.dto.ts
│   │
│   ├── reviews/                    # Módulo de Avaliações e Feedback
│   │   ├── reviews.module.ts
│   │   ├── reviews.controller.ts
│   │   ├── reviews.service.ts
│   │   ├── entities/
│   │   │   └── review.entity.ts
│   │   └── dto/
│   │       ├── submit-review.dto.ts
│   │       └── get-reviews.dto.ts
│   │
│   ├── offers/                     # Módulo de Ofertas/Promoções
│   │   ├── offers.module.ts
│   │   ├── offers.controller.ts
│   │   ├── offers.service.ts
│   │   ├── entities/
│   │   │   └── offer.entity.ts
│   │   └── dto/
│   │       ├── create-offer.dto.ts
│   │       └── update-offer.dto.ts
│   │
│   ├── search/                     # Módulo de Busca
│   │   ├── search.module.ts
│   │   ├── search.controller.ts
│   │   ├── search.service.ts
│   │   └── dto/
│   │       └── search-query.dto.ts
│   │
│   ├── common/                     # Componentes comuns, filtros, interceptors, pipes
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── constants/
│   │   │   └── roles.enum.ts
│   │   ├── dto/
│   │   │   ├── create-address.dto.ts
│   │   │   └── message-response.dto.ts
│   │   └── entities/
│   │       └── address.entity.ts
│   │
│   ├── config/                     # Módulo de Configuração
│   │   ├── config.module.ts
│   │   └── configuration.ts
│   │
│   └── prisma/                     # Integração com Prisma
│       ├── prisma.service.ts
│       └── prisma.module.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
2. Análise dos Componentes Principais
2.1. Ponto de Entrada (main.ts)
O arquivo main.ts é o ponto de partida da aplicação. Ele configura o aplicativo NestJS, habilita o CORS para permitir requisições de diferentes origens, e aplica globalmente o ValidationPipe e o HttpExceptionFilter.

ValidationPipe: Garante que todos os dados de entrada (DTOs) sejam validados automaticamente. Configurado com whitelist: true (remove propriedades não definidas no DTO), forbidNonWhitelisted: true (lança erro para propriedades não definidas) e transform: true (transforma payloads em instâncias de DTO, com enableImplicitConversion para conversão de tipos).
HttpExceptionFilter: Um filtro de exceções global que padroniza as respostas de erro para todas as HttpException lançadas na aplicação, fornecendo um formato consistente com statusCode, timestamp, path, message e um array de errors.
2.2. Módulo Raiz (app.module.ts)
O AppModule é o módulo principal que agrega e orquestra todos os outros módulos funcionais da aplicação. Ele importa módulos como ConfigModule, PrismaModule, AuthModule, UsersModule, ClientsModule, ProvidersModule, ServicesModule, ProviderServicesModule, AvailabilityModule, BookingsModule, PaymentsModule, ChatModule, NotificationsModule, ReviewsModule, OffersModule, e SearchModule, garantindo que suas funcionalidades e provedores estejam disponíveis para o restante da aplicação.

2.3. Módulos de Funcionalidade
Cada pasta dentro de src/ representa um módulo NestJS dedicado a um domínio específico do negócio. Dentro de cada módulo, a estrutura é consistente:

*.module.ts: Define o módulo, importa dependências (outros módulos), declara controladores e provedores (serviços), e exporta os provedores que devem ser acessíveis por outros módulos.
*.controller.ts: Responsável por lidar com as requisições HTTP, definir as rotas (endpoints) e delegar a lógica de negócio para os serviços. Utiliza decoradores como @Get(), @Post(), @Patch(), @Delete(), @Param(), @Body(), @Query(), e @UseGuards() para proteger rotas.
*.service.ts: Contém a lógica de negócio principal do módulo. Interage com o banco de dados (via PrismaService) e pode se comunicar com outros serviços para orquestrar operações complexas.
entities/: Contém as classes que representam os modelos de dados, geralmente espelhando as definições do schema.prisma e enriquecidas com decoradores @ApiProperty do Swagger para documentação da API.
dto/ (Data Transfer Objects): Classes que definem a forma dos dados que entram (corpo da requisição, parâmetros de consulta) e saem (corpo da resposta) da sua API. São essenciais para validação de entrada e tipagem de saída.
2.4. Componentes Globais (common/, config/, prisma/)
common/:
filters/http-exception.filter.ts: Implementa o filtro de exceções global mencionado, padronizando as respostas de erro.
constants/roles.enum.ts: Define o enum UserRole (CLIENT, PROVIDER, ADMIN), usado para controle de acesso baseado em função.
dto/create-address.dto.ts: DTO para criação de endereços, reutilizável em diferentes contextos (registro de cliente/provedor).
dto/message-response.dto.ts: DTO genérico para respostas simples de mensagem, como confirmações de sucesso.
entities/address.entity.ts: Entidade base para endereços.
config/:
config.module.ts: Utiliza o @nestjs/config para carregar variáveis de ambiente de forma segura e tipada. É configurado como isGlobal: true, tornando o ConfigService disponível em toda a aplicação.
configuration.ts: Carrega variáveis de ambiente como PORT, DATABASE_URL, JWT_SECRET, e JWT_EXPIRATION_TIME.
prisma/:
prisma.module.ts: Módulo global (@Global()) que exporta o PrismaService, tornando-o injetável em qualquer outro módulo.
prisma.service.ts: Estende PrismaClient, encapsulando a conexão com o banco de dados. Gerencia a conexão ($connect) e desconexão ($disconnect) durante o ciclo de vida da aplicação e implementa enableShutdownHooks para um desligamento gracioso.
3. Modelagem de Dados com Prisma (prisma/schema.prisma)
O schema.prisma define a estrutura do banco de dados, incluindo modelos, campos, tipos e relações.

prisma
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

// Enum para os diferentes papéis de usuário
enum UserRole {
  CLIENT
  PROVIDER
  ADMIN
}

// Modelo de Usuário (base para Cliente e Provedor)
model User {
  id             String         @id @default(uuid())
  email          String         @unique
  passwordHash   String         // Armazenar hash da senha, nunca a senha em texto claro
  role           UserRole       @default(CLIENT)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  client         Client?
  provider       Provider?
  messagesSent   Message[]      @relation("SentMessages")
  messagesReceived Message[]    @relation("ReceivedMessages")
  notifications  Notification[]
  chatsAsParticipant1 Chat[]    @relation("ChatParticipant1") // Nova relação para Chat
  chatsAsParticipant2 Chat[]    @relation("ChatParticipant2") // Nova relação para Chat
}

// Modelo para Cliente
model Client {
  id             String   @id @default(uuid())
  userId         String   @unique
  user           User     @relation(fields: [userId], references: [id])
  fullName       String
  phone          String?
  address        Address? @relation("ClientAddress")
  bookings       Booking[]
  reviewsMade    Review[] @relation("ClientReviews") // Avaliações que o cliente fez
}

// Modelo para Provedor
model Provider {
  id                 String          @id @default(uuid())
  userId             String          @unique
  user               User            @relation(fields: [userId], references: [id])
  fullName           String
  cpf                String          @unique // CPF para verificação
  dateOfBirth        DateTime
  phone              String?
  address            Address?        @relation("ProviderAddress")
  yearsOfExperience  Int?
  avatarUrl          String?
  verified           Boolean         @default(false) // Para verificação facial/documental
  bio                String?         // PROPRIEDADE 'BIO' ADICIONADA AQUI
  providerServices   ProviderService[]
  availability       Availability[]
  bookings           Booking[]
  reviewsReceived    Review[]        @relation("ProviderReviews") // Avaliações que o provedor recebeu
  earnings           Transaction[]
}

// Modelo de Endereço (pode ser relacionado a Cliente ou Provedor)
model Address {
  id           String   @id @default(uuid())
  cep          String
  street       String
  number       String
  complement   String?
  neighborhood String
  city         String
  state        String
  clientId     String?  @unique
  providerId   String?  @unique
  client       Client?  @relation("ClientAddress", fields: [clientId], references: [id])
  provider     Provider? @relation("ProviderAddress", fields: [providerId], references: [id])
}

// Modelo para Tipos de Serviço (e.g., "Limpeza Padrão", "Limpeza Pesada")
model Service {
  id               String            @id @default(uuid())
  name             String            @unique
  description      String?
  price            Decimal           @db.Decimal(10, 2) // CAMPO 'PRICE' ADICIONADO AQUI COM TIPO DECIMAL
  icon             String?           // Campo para armazenar o nome do arquivo do ícone da categoria
  providerServices ProviderService[]
}

// Modelo para Serviços Oferecidos por um Provedor Específico
model ProviderService {
  id              String    @id @default(uuid())
  providerId      String
  serviceId       String
  price           Decimal   @db.Decimal(10, 2) // ALTERADO DE 'Float' PARA 'Decimal'
  durationMinutes Int       // Duração estimada em minutos
  description     String?
  provider        Provider  @relation(fields: [providerId], references: [id])
  service         Service   @relation(fields: [serviceId], references: [id])
  bookings        Booking[] // Campo reverso para Booking

  @@unique([providerId, serviceId]) // Um provedor não pode oferecer o mesmo tipo de serviço duas vezes
}

// Enum para o status do agendamento
enum BookingStatus {
  PENDING     // Pendente de confirmação do provedor
  CONFIRMED   // Confirmado pelo provedor
  COMPLETED   // Serviço concluído
  CANCELED    // Agendamento cancelado
  RESCHEDULED // Agendamento reagendado
}

// Modelo de Agendamento
model Booking {
  id                String        @id @default(uuid())
  clientId          String
  providerId        String
  providerServiceId String
  client            Client        @relation(fields: [clientId], references: [id])
  provider          Provider      @relation(fields: [providerId], references: [id])
  providerService   ProviderService @relation(fields: [providerServiceId], references: [id])
  scheduledDate     DateTime      // Data do agendamento
  scheduledTime     String        // Horário do agendamento (e.g., "09:00")
  status            BookingStatus @default(PENDING)
  totalPrice        Decimal       @db.Decimal(10, 2) // ALTERADO DE 'Float' PARA 'Decimal'
  notes             String?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  review            Review?       // Relação 1:1 com Review. Um agendamento pode ter uma avaliação.
}

// Modelo de Chat (NOVO)
model Chat {
  id              String    @id @default(uuid())
  participant1Id  String
  participant1    User      @relation("ChatParticipant1", fields: [participant1Id], references: [id])
  participant2Id  String
  participant2    User      @relation("ChatParticipant2", fields: [participant2Id], references: [id])
  messages        Message[] // Mensagens associadas a este chat

  @@unique([participant1Id, participant2Id]) // Garante que não há chats duplicados para o mesmo par de usuários
}

// Modelo de Mensagem de Chat
model Message {
  id         String   @id @default(uuid())
  chatId     String   // ID da conversa (pode ser um UUID gerado para cada par cliente-provedor)
  chat       Chat     @relation(fields: [chatId], references: [id]) // Relação com o modelo Chat
  senderId   String
  receiverId String
  content    String
  timestamp  DateTime @default(now())
  isRead     Boolean  @default(false)
  sender     User     @relation("SentMessages", fields: [senderId], references: [id])
  receiver   User     @relation("ReceivedMessages", fields: [receiverId], references: [id])
}

// Modelo de Notificação
model Notification {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      String   // Tipo de notificação (e.g., "BOOKING_CONFIRMED", "NEW_MESSAGE")
  message   String
  isRead    Boolean  @default(false)
  targetUrl String?  // URL para navegação no app ao clicar na notificação
  createdAt DateTime @default(now())
}

// Modelo de Avaliação
model Review {
  id         String   @id @default(uuid())
  booking    Booking  @relation(fields: [bookingId], references: [id]) // Relação 1:1 com Booking
  bookingId  String   @unique // Uma avaliação por agendamento
  clientId   String
  providerId String
  rating     Int      // Removido @min(1) @max(5) - validação na aplicação
  comment    String?
  createdAt  DateTime @default(now())
  client     Client   @relation("ClientReviews", fields: [clientId], references: [id])
  provider   Provider @relation("ProviderReviews", fields: [providerId], references: [id])
}

// Modelo de Oferta/Promoção
model Offer {
  id                String   @id @default(uuid())
  title             String
  description       String?
  discountPercentage Float?  // Desconto em percentual
  fixedDiscountAmount Float? // Desconto em valor fixo
  validUntil        DateTime // Data de expiração da oferta
  imageUrl          String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Enum para o tipo de transação financeira
enum TransactionType {
  PAYMENT    // Pagamento de cliente para plataforma
  WITHDRAWAL // Saque de provedor da plataforma
  COMMISSION // Comissão da plataforma
}

// Modelo de Transação Financeira
model Transaction {
  id          String        @id @default(uuid())
  providerId  String
  provider    Provider      @relation(fields: [providerId], references: [id])
  amount      Decimal       @db.Decimal(10, 2) // ALTERADO DE 'Float' PARA 'Decimal'
  type        TransactionType
  status      String        // Status da transação (e.g., "PENDING", "COMPLETED", "FAILED")
  description String?
  createdAt   DateTime      @default(now())
}

// Modelo de Disponibilidade do Provedor
model Availability {
  id          String   @id @default(uuid())
  providerId  String
  provider    Provider @relation(fields: [providerId], references: [id])
  dayOfWeek   Int      // 0 para Domingo, 1 para Segunda, etc.
  startTime   String   // Horário de início (e.g., "09:00")
  endTime     String   // Horário de término (e.g., "17:00")
  isAvailable Boolean  @default(true) // Se o provedor está disponível neste slot
}


4. Metodologias e Funções Globais
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
Uma função auxiliar crucial (availability_controller.ts, provider_services_controller.ts) que verifica se o provedor logado (req.user['userId']) é o proprietário dos recursos (e.g., disponibilidade, serviços oferecidos) que está tentando modificar. Isso evita que um provedor manipule dados de outro.
5. Interligação entre Módulos e Serviços
A arquitetura modular do NestJS facilita a comunicação entre diferentes partes da aplicação:

AppModule: Atua como o orquestrador principal, importando todos os módulos funcionais e garantindo que seus provedores estejam disponíveis.
AuthModule: Depende do UsersModule para criar e validar usuários durante os processos de registro e login.
ClientsService e ProvidersService: Utilizam o UsersService para gerenciar a relação entre os perfis de cliente/provedor e as contas de usuário base. Ambos interagem diretamente com o PrismaService para operações de banco de dados.
BookingsService: É um serviço central que depende de ClientsService, ProvidersService e ProviderServicesService para validar a existência e a elegibilidade de clientes, provedores e serviços antes de criar um agendamento. Ele também gerencia as transições de status dos agendamentos.
ReviewsService: Interage com o BookingsService para garantir que as avaliações sejam submetidas apenas para agendamentos concluídos e que o cliente que envia a avaliação seja o cliente do agendamento.
SearchService: Orquestra a busca de informações, consultando ProvidersService para provedores e ServicesService para tipos de serviço, agregando os resultados.
PaymentsService: Utiliza o PrismaService para registrar transações financeiras e pode atualizar o status de agendamentos (BookingStatus.PENDING) após a criação de uma cobrança PIX.
ChatService: Responsável por armazenar e recuperar mensagens de chat, utilizando o PrismaService. O ChatGateway (WebSocket) utiliza o ChatService para persistir as mensagens em tempo real.
NotificationsService: Gerencia a criação, recuperação e marcação de notificações, interagindo com o PrismaService.
ProviderServicesService: Valida a existência de provedores e tipos de serviço antes de associá-los como um serviço oferecido, além de verificar se o provedor já oferece um determinado serviço para evitar duplicatas.
6. Integração com o Frontend (Expo Router)
A comunicação entre o frontend (Expo Router) e o backend (NestJS) é primariamente via APIs RESTful (HTTP) e, para funcionalidades de chat, pode ser estendida com WebSockets para comunicação em tempo real.

URL Base da API: O frontend será configurado com a URL base do backend (e.g., http://localhost:3000 durante o desenvolvimento).
Autenticação (JWT):
O frontend envia credenciais para POST /auth/login.
O backend retorna um JWT, que o frontend armazena e inclui no cabeçalho Authorization (Bearer <token>) de todas as requisições protegidas.
Consistência de Dados (DTOs): Os DTOs definidos no NestJS garantem que a estrutura de dados esperada e enviada entre frontend e backend seja consistente e validada.
Tratamento de Erros: O HttpExceptionFilter do backend fornece respostas de erro padronizadas, permitindo que o frontend exiba mensagens significativas ao usuário.
Comunicação em Tempo Real (Chat): O ChatGateway com @nestjs/platform-socket.io permite comunicação bidirecional para o chat, proporcionando uma experiência de usuário fluida.
Variáveis de Ambiente: O backend utiliza arquivos .env para gerenciar configurações sensíveis e específicas do ambiente.
7. Mapeamento de Rotas da API
A tabela abaixo detalha o mapeamento entre as funcionalidades do frontend e os endpoints da API do backend:

Fluxo/Tela do Frontend	Endpoint do Backend (Método HTTP, Caminho)	DTOs (Requisição/Resposta)
Fluxo de Autenticação		
Registro de Cliente	POST /auth/register/client	RegisterClientDto / AuthResponseDto
Registro de Provedor	POST /auth/register/provider	RegisterProviderDto / AuthResponseDto
Login	POST /auth/login	LoginDto / AuthResponseDto
Esqueci a Senha	POST /auth/forgot-password	ForgotPasswordDto / MessageResponseDto
Gerenciamento de Usuário/Perfil		
Obter Perfil do Usuário	GET /users/me (protegido)	UserProfileDto
Atualizar Perfil do Usuário	PATCH /providers/me (provedor) / PATCH /clients/me (cliente) (protegido)	UpdateProviderProfileDto / UpdateClientProfileDto / ProviderDetailsDto / ClientEntity
Fluxo do Cliente		
Obter Dados do Dashboard do Cliente	GET /clients/me/dashboard (protegido)	ClientDashboardDto
Obter Todos os Tipos de Serviço	GET /services	ServiceDetailsDto[]
Buscar Provedores/Serviços	GET /search	SearchQueryDto / SearchResultDto
Obter Agendamentos do Cliente	GET /bookings/me (protegido, com filtro de status)	BookingDetailsDto[]
Obter Detalhes do Agendamento	GET /bookings/:id (protegido)	BookingDetailsDto
Atualizar Status Agendamento (Cliente)	PATCH /bookings/:id/status (cliente só pode cancelar) (protegido)	UpdateBookingStatusDto / BookingDetailsDto
Obter Detalhes do Provedor	GET /providers/:id	ProviderDetailsDto
Obter Horários Disponíveis	GET /providers/:providerId/availability	GetAvailabilityDto / AvailabilityDto[]
Criar Agendamento	POST /bookings (protegido)	CreateBookingDto / BookingDetailsDto
Criar Cobrança PIX	POST /payments/pix-charge (protegido)	CreatePixChargeDto / PixChargeResponseDto
Obter Mensagens do Chat	GET /chat/:chatId/messages (protegido)	GetMessagesDto / Message[]
Enviar Mensagem de Chat	POST /chat/:chatId/messages (protegido)	SendMessageDto / Message
Obter Detalhes da Oferta	GET /offers/:id	Offer
Enviar Avaliação	POST /reviews (protegido)	SubmitReviewDto / ReviewEntity
Fluxo do Provedor		
Obter Agendamentos do Provedor	GET /bookings/me (protegido, com filtro de status)	BookingDetailsDto[]
Atualizar Status Agendamento (Provedor)	PATCH /bookings/:id/status (provedor) (protegido)	UpdateBookingStatusDto / BookingDetailsDto
Solicitar Saque	POST /payments/withdrawal (protegido)	RequestWithdrawalDto / MessageResponseDto
Gerenciar Disponibilidade	PATCH /providers/:providerId/availability (protegido)	UpdateAvailabilityDto[] / AvailabilityDto[]
Adicionar Slot de Disponibilidade	POST /providers/:providerId/availability (protegido)	UpdateAvailabilityDto / AvailabilityDto
Deletar Slot de Disponibilidade	DELETE /providers/:providerId/availability/:availabilityId (protegido)	void
Gerenciar Serviços Oferecidos	GET /providers/:providerId/services (protegido)	ProviderServiceEntity[]
Adicionar Serviço Oferecido	POST /providers/:providerId/services (protegido)	CreateProviderServiceDto / ProviderServiceEntity
Atualizar Serviço Oferecido	PATCH /providers/:providerId/services/:id (protegido)	UpdateProviderServiceDto / ProviderServiceEntity
Excluir Serviço Oferecido	DELETE /providers/:providerId/services/:id (protegido)	void
Fluxo Comum		
Obter Notificações	GET /notifications/me (protegido)	NotificationEntity[]
Marcar Notificações como Lidas	PATCH /notifications/me/mark-as-read (protegido)	MarkAsReadDto / { count: number }
Marcar Notificação por ID como Lida	PATCH /notifications/:id/mark-as-read (protegido)	NotificationEntity
Excluir Notificação	DELETE /notifications/:id (protegido)	void
Obter Avaliações (com filtros)	GET /reviews	GetReviewsDto / ReviewEntity[]
Esta documentação fornece uma visão clara e detalhada do backend do LimpeJá, facilitando o desenvolvimento, a manutenção e a colaboração da equipe.



<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
