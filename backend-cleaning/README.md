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
src/payments: Processamento de pagamentos (PIX simulado) e saques.
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
Suporte Empresarial (NestJS Enterprise): Para empresas que buscam assistência dedicada, o NestJS oferece serviços de consultoria, revisão arquitetônica, mentoria de equipe, resolução de problemas de segurança e desempenho, revisões de código aprofundadas, suporte de longo prazo (LTS) e assistência para atualizações, e até mesmo aumento de equipe com membros da equipe principal do NestJS. [enterprise.nestjs.com]
Devtools: Uma ferramenta para visualizar o grafo da sua aplicação NestJS e interagir com ela em tempo real. [devtools.nestjs.com]
Deploy with Mau: Uma plataforma oficial para facilitar a implantação de aplicações NestJS na AWS. [mau.nestjs.com]
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

Copiar
$ npm install
Compile and run the project
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