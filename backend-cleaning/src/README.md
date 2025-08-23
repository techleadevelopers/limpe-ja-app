🚀 Backend LimpeJá: API de Serviços Domésticos
Este documento detalha a arquitetura, os módulos e as funcionalidades do backend da plataforma LimpeJá, uma aplicação robusta construída com NestJS para conectar clientes a prestadores de serviços domésticos. O sistema é projetado para ser escalável, seguro e eficiente, oferecendo uma experiência completa desde o agendamento até o pagamento e o gerenciamento de disputas.

🎯 Visão Geral do Projeto
O backend do LimpeJá é o cérebro da plataforma, orquestrando todas as interações entre clientes, prestadores e administradores. Ele gerencia o ciclo de vida dos usuários, o catálogo de serviços, o agendamento, os pagamentos, a comunicação em tempo real, a gamificação, a segurança e muito mais.

Principais Pilares:

Modularidade: Organizado em módulos independentes e coesos, facilitando a manutenção e o desenvolvimento.
Escalabilidade: Utiliza filas assíncronas (BullMQ/Redis) para processamento de tarefas pesadas e otimização de performance.
Segurança: Implementa autenticação JWT, controle de acesso baseado em papéis (RBAC), validação de dados rigorosa e monitoramento de erros.
Experiência do Usuário: Suporta funcionalidades como chat em tempo real, notificações, sistema de pontos de fidelidade, missões gamificadas e um painel de controle para prestadores.
Confiança: Módulos dedicados à verificação de identidade, gestão de incidentes, disputas e garantia de serviço.
🛠️ Tecnologias Principais
Framework: NestJS (Node.js)
Linguagem: TypeScript
Banco de Dados: PostgreSQL (via Prisma ORM)
Filas Assíncronas: BullMQ (com Redis)
Cache: Cache-Manager (com Redis)
Autenticação: JWT (JSON Web Tokens)
Documentação API: Swagger
Monitoramento de Erros/Performance: Sentry
Armazenamento de Arquivos: Google Cloud Storage (GCS) ou armazenamento local (para desenvolvimento)
Serviços Externos: Firebase Admin SDK (para notificações push, etc.), Twilio (para SMS e verificação de telefone), APIs de Geocodificação (Google Maps/OpenStreetMap), PagSeguro (para pagamentos).
Validação: class-validator e Joi (para variáveis de ambiente)
🏗️ Estrutura e Arquitetura
O backend segue a arquitetura modular do NestJS, que é inspirada no Angular. A aplicação é dividida em módulos de funcionalidades, cada um com seus próprios controladores, serviços, entidades e DTOs (Data Transfer Objects).

src/main.ts (Bootstrap da Aplicação)
Este é o ponto de entrada da aplicação. Ele configura e inicializa o aplicativo NestJS, aplicando configurações globais essenciais:

Criação do Aplicativo: NestFactory.create(AppModule).
Configuração de CORS: Permite requisições de origens específicas (http://localhost:5173, http://localhost:8081).
Pipes Globais:
ValidationPipe: Garante que todos os dados de entrada (DTOs) sejam validados automaticamente. Configurado com whitelist: true (remove propriedades não definidas no DTO), forbidNonWhitelisted: true (lança erro para propriedades não permitidas) e transform: true (converte tipos automaticamente). As mensagens de erro de validação são localizadas.
Filtros Globais:
AllExceptionsFilter: Captura todas as exceções não tratadas na aplicação, garantindo uma resposta padronizada e tratamento de erros centralizado. Utiliza o I18nService para mensagens de erro internacionalizadas.
Integração Sentry: Inicializa o SDK do Sentry para monitoramento de erros e performance, usando SENTRY_DSN e NODE_ENV.
Firebase Admin SDK: Inicializa o SDK para interações com serviços Firebase (ex: notificações push), com lógica para inicialização automática em ambientes Cloud Run/GCP ou via GOOGLE_APPLICATION_CREDENTIALS.
Swagger (Documentação API): Configura a documentação interativa da API em /api, incluindo autenticação via Bearer Token (JWT).
Limites de Requisição: Configura o express.json() e express.urlencoded() com limite de payload de 10mb.
Inicialização: A aplicação escuta em uma porta definida pela variável de ambiente PORT (padrão 3000).
src/app.module.ts (Módulo Raiz)
O AppModule é o módulo principal que agrega todos os outros módulos de funcionalidade da aplicação.

ConfigModule.forRoot(): Carrega as variáveis de ambiente, valida-as usando um schema Joi (validationSchema) e as disponibiliza globalmente.
ThrottlerModule.forRootAsync(): Implementa rate limiting (limitação de taxa de requisições) para proteger a API contra abusos, configurável via variáveis de ambiente (THROTTLE_TTL, THROTTLE_LIMIT).
SentryModule.forRoot(): Configuração do módulo Sentry para NestJS, complementando a inicialização em main.ts.
Importação de Módulos de Funcionalidade: Todos os módulos de domínio (Auth, Users, Bookings, Payments, etc.) são importados aqui, construindo a árvore de dependências da aplicação.
src/config/ (Configuração)
Este diretório contém a lógica para carregar e validar as variáveis de ambiente.

configuration.ts: Exporta uma função que retorna um objeto com todas as variáveis de ambiente mapeadas para propriedades tipadas, facilitando o acesso via ConfigService.
validation-schema.ts: Define um schema Joi para validar as variáveis de ambiente necessárias para o funcionamento da aplicação (ex: DATABASE_URL, JWT_SECRET, SENTRY_DSN, credenciais de serviços externos como Twilio, Google Maps, etc.). Garante que o ambiente esteja corretamente configurado antes da inicialização.
src/prisma/ (Integração com o Banco de Dados)
Contém o serviço e o módulo para integração com o Prisma ORM.

prisma.service.ts: Estende PrismaClient, fornecendo uma instância do cliente Prisma que se conecta e desconecta do banco de dados durante o ciclo de vida da aplicação (onModuleInit, onModuleDestroy). Inclui um método enableShutdownHooks para desligamento gracioso da aplicação quando o Prisma emite o evento beforeExit.
prisma.module.ts: Um módulo global que exporta o PrismaService, tornando-o injetável em qualquer outro módulo da aplicação.
src/common/ (Módulos Comuns e Utilitários)
Este módulo agrupa funcionalidades compartilhadas e utilitários que são utilizados em toda a aplicação.

filters/: Contém os filtros de exceção globais (all-exceptions.filter.ts, http-exception.filter.ts) para tratamento consistente de erros.
i18n/: Módulo de internacionalização, incluindo i18n.service.ts para gerenciar traduções e i18n.module.ts para disponibilizá-lo.
middlewares/: Contém locale.middleware.ts para definir o idioma da requisição com base no cabeçalho Accept-Language.
services/: Contém serviços utilitários como email.service.ts (para envio de e-mails), sms.service.ts (para envio de SMS e verificação de telefone via Twilio) e geocoding.service.ts (para conversão de endereços em coordenadas).
pipes/: Pode conter pipes customizados, como validation.pipe.ts (embora o ValidationPipe global já seja amplamente utilizado).
utils/: Contém funções utilitárias genéricas, como code-generator.ts para gerar códigos aleatórios.
📦 Módulos de Funcionalidade (Domínio)
Abaixo, uma descrição detalhada de cada módulo de funcionalidade do backend:

👤 Auth Module (src/auth/)
Objetivo: Gerencia a autenticação e autorização de usuários (registro, login, recuperação de senha, gestão de permissões).
Funcionalidades:
Registro de clientes e prestadores.
Login via e-mail/senha ou telefone.
Recuperação de senha.
Geração e validação de JWTs para acesso a rotas protegidas.
Guards (JwtAuthGuard, RolesGuard, LocalAuthGuard, WsAuthGuard) para proteger rotas e verificar permissões.
Integrações: UsersModule, NotificationsModule, ProvidersModule.
👤 Users Module (src/users/)
Objetivo: Centraliza o ciclo de vida do usuário (CLIENT/PROVIDER/ADMIN), perfil, preferências e integrações transversais.
Funcionalidades:
CRUD e gerenciamento de perfil de usuário (nome, avatar, telefone, etc.).
Gestão de preferências e tokens (ex: FCM para push).
Suporte a remoção planejada (soft delete) para conformidade com LGPD.
Integrações: PrismaModule, NotificationsModule, QueuesModule, AuthModule, ProvidersModule, MissionsModule, LoyaltyModule.
👨‍🔧 Providers Module (src/providers/)
Objetivo: Gerencia o ciclo de vida dos prestadores de serviços na plataforma.
Funcionalidades:
Criação, atualização, busca e listagem de prestadores.
Gestão de informações de perfil profissional e serviços oferecidos.
Integrações: ProviderServicesModule, BookingsModule, RankingModule, NotificationsModule, MissionsModule, UsersModule.
🧑‍💻 Clients Module (src/clients/)
Objetivo: Controla o ciclo de vida completo dos usuários consumidores da plataforma.
Funcionalidades:
Cadastro, atualização e consulta de dados dos clientes.
Fornecimento de dados para dashboards e lógica de missão/cupom.
Integrações: MissionsModule, LoyaltyModule, CouponsModule, NotificationsModule, BookingsModule, ReviewsModule, UsersModule.
📚 Services Module (src/services/)
Objetivo: Gerencia o catálogo de serviços base (ex: "Limpeza Residencial").
Funcionalidades:
CRUD do catálogo de serviços (admin-first).
Definição de metadados padrão (descrição, ícone, tipo de precificação padrão).
Integrações: ProviderServicesModule, BookingsModule, SearchModule, PricingModule, MissionsModule.
📌 Provider Services Module (src/provider-services/)
Objetivo: Gerencia os serviços específicos oferecidos por cada prestador.
Funcionalidades:
CRUD para serviços de um provider (preço, duração, status).
Controle de disponibilidade.
Integrações: BookingsModule, RankingModule, NotificationsModule, LoyaltyModule, CouponsModule, ServicesModule, ProvidersModule.
📅 Availability Module (src/availability/)
Objetivo: Gerencia a agenda e a disponibilidade dos prestadores de serviço.
Funcionalidades:
Permite que prestadores configurem, atualizem e deletem seus horários de disponibilidade (slots).
Fornece endpoint para clientes buscarem horários livres.
Integrações: BookingsModule, ProvidersModule.
🗓️ Bookings Module (src/bookings/)
Objetivo: Orquestra todo o ciclo de vida de um serviço agendado.
Funcionalidades:
Criação e gerenciamento de agendamentos de serviços por clientes.
Prestadores podem visualizar e responder a solicitações (aceitar/rejeitar).
Manutenção do status e histórico de cada agendamento.
Integrações: PaymentsModule, ChatModule, ProvidersModule, ClientsModule, NotificationsModule, ReviewsModule, AvailabilityModule, SubscriptionsModule.
⭐ Reviews Module (src/reviews/)
Objetivo: Permite que clientes avaliem serviços concluídos, alimentando métricas de qualidade.
Funcionalidades:
Criação e consulta de avaliações.
Atribuição de pontos de fidelidade ao cliente.
Atualização de badges/indicadores do prestador.
Disparo de eventos de missão (review.created).
Integrações: BookingsModule, ProvidersModule, LoyaltyModule, MissionsModule.
💬 Chat Module (src/chat/)
Objetivo: Facilita a comunicação em tempo real entre clientes e prestadores.
Funcionalidades:
API REST para histórico de conversas.
Gateway de WebSockets para comunicação em tempo real.
Criação e gerenciamento de threads de chat por agendamento.
Integrações: BookingsModule, ProvidersModule, ClientsModule, NotificationsModule.
🔔 Notifications Module (src/notifications/)
Objetivo: Centraliza o envio, listagem e gerenciamento de notificações.
Funcionalidades:
Disparo de notificações automáticas ou manuais (push, in-app, e-mail).
Marcação como lida, categorização e rastreio.
Integrações: BookingsModule, EarningsModule, MissionsModule, LoyaltyModule, RankingModule, QueuesModule (para envio assíncrono).
📖 Offers Module (src/offers/)
Objetivo: Gerencia ofertas promocionais dentro da plataforma.
Funcionalidades:
Criação de campanhas de desconto ou benefícios para clientes.
Vinculação de ofertas a serviços ou provedores específicos.
Gerenciamento de histórico e status de ofertas.
Integrações: SearchModule, BookingsModule, NotificationsModule, CouponsModule, PricingModule.
💸 Payments Module (src/payments/)
Objetivo: Gerencia a criação de cobranças, controle de transações financeiras e gerenciamento de repasses.
Funcionalidades:
Geração de cobranças via PIX.
Registro de transações (cobranças, repasses, saques).
Gerenciamento de saques e transferências para prestadores.
Integrações: EarningsModule, NotificationsModule, DashboardModule, LoyaltyModule, BookingsModule.
📌 Search Module (src/search/)
Objetivo: Fornece mecanismos de busca inteligente de serviços e provedores.
Funcionalidades:
Permite que clientes localizem serviços e profissionais disponíveis.
Filtros por query, localização, categorias, preço, etc.
Retorno de resultados estruturados com informações de serviço e provedor.
Integrações: PrismaModule, ProvidersModule, ReviewsModule, ServicesModule, ProviderServicesModule.
📑 Verification Module (src/verification/)
Objetivo: Responsável pelo processo de validação de identidade de prestadores de serviço.
Funcionalidades:
Upload de documentos oficiais (RG, CNH, passaporte) e selfies (prova de vida).
Processamento e avaliação de documentos (OCR, validação facial, prova de vida).
Gestão do status de verificação (UNVERIFIED, UNDER_REVIEW, VERIFIED, REJECTED).
Integrações: PrismaModule, ProvidersModule, QueuesModule (para processamento assíncrono), NotificationsModule, DocumentProcessingModule.
📊 Dashboard Module (src/dashboard/)
Objetivo: Centraliza os dados operacionais e de performance dos prestadores.
Funcionalidades:
Exibição de KPIs e métricas consolidadas (serviços realizados, avaliações, faturamento, missões).
Ajuda o profissional a entender seu desempenho e reforça o engajamento.
Integrações: BookingsModule, ReviewsModule, LoyaltyModule, EarningsModule, RankingModule.
💰 Earnings Module (src/earnings/)
Objetivo: Controla os ganhos dos prestadores, incluindo acúmulo por serviços, histórico e requisição de saques.
Funcionalidades:
Registro de ganhos após finalização de serviço.
Cálculo de saldo disponível para saque.
Permite requisição de repasse por PIX.
Integrações: BookingsModule, PaymentsModule, DashboardModule, NotificationsModule.
📚 Faqs Module (src/faqs/)
Objetivo: Centraliza e gerencia a base de perguntas frequentes (FAQs).
Funcionalidades:
Fornece respostas objetivas a dúvidas comuns.
Reduz a dependência do suporte humano.
Integrações: DisputeModule, SupportModule (se houver).
📦 Queues Module (src/queues/)
Objetivo: Processamento desacoplado e escalável de tarefas críticas e não bloqueantes.
Funcionalidades:
Processa notificações (push, e-mail).
Processa verificação documental (OCR, selfie, antecedentes).
Processa resolução de disputas.
Tecnologia: BullMQ (com Redis).
Integrações: NotificationsModule, VerificationModule, DisputeModule, BookingsModule, SmsModule, EmailModule.
💾 Cache Module (src/cache/)
Objetivo: Fornece um mecanismo de cache para otimizar a performance da aplicação.
Funcionalidades:
Armazenamento e recuperação de dados em cache (Redis).
Métodos para definir, obter, deletar e resetar o cache.
Tecnologia: @nestjs/cache-manager com KeyvRedis.
🤝 Referrals Module (src/referrals/)
Objetivo: Gerencia o registro de indicações de usuários.
Funcionalidades:
Permite que um usuário indique outro para usar o app.
Atribuição de pontos de fidelidade ao indicador.
Disparo de eventos de missão (referral.created, referral.converted).
Integrações: LoyaltyModule, MissionsModule, BookingsModule, UsersModule.
🔁 Subscriptions Module (src/subscriptions/)
Objetivo: Gerencia assinaturas de serviços recorrentes.
Funcionalidades:
Criação e atualização de assinaturas.
Geração automática de agendamentos recorrentes.
Integração com serviços de pagamento para cobranças recorrentes.
Cálculo da próxima data de geração de agendamento.
Integrações: PrismaModule, BookingsModule, PaymentsModule, QueuesModule.
🛡️ Safety Module (src/safety/)
Objetivo: Garante a segurança de clientes e prestadores, fornecendo mecanismos de relato de incidentes e alerta de pânico.
Funcionalidades:
Relato de incidentes (tipo, descrição, bookingId).
Disparo de alertas de pânico (localização, userId).
Monitoramento e auditoria de incidentes e alertas.
Integrações: NotificationsModule, SmsModule, EmailModule.
🎟️ Coupons Module (src/coupons/)
Objetivo: Gerencia a criação, aplicação e rastreamento de cupons de desconto.
Funcionalidades:
Criação de cupons com regras (data, limite, tipo).
Aplicação de cupons a usuários autenticados.
Validação de elegibilidade e impacto no preço.
Integrações: LoyaltyModule, PaymentsModule, MissionsModule, DashboardModule, PricingModule.
🛡️ Guarantee Module (src/guarantee/)
Objetivo: Fornece a infraestrutura para clientes submeterem, rastrearem e resolverem solicitações de garantia.
Funcionalidades:
Criação de solicitações de garantia para agendamentos.
Gerenciamento do fluxo de status (PENDING, APPROVED, REJECTED, SETTLED).
Notificação de usuários sobre o progresso das solicitações.
Integrações: BookingsModule, NotificationsModule, PrismaModule, AuthModule.
📊 Pricing Module (src/pricing/)
Objetivo: Define, gerencia e aplica as regras de precificação dos serviços.
Funcionalidades:
CRUD de regras de precificação (globais, por serviço, por provedor).
Cálculo do preço final de um serviço em tempo real, aplicando todas as regras válidas.
Suporte a diferentes tipos de regras (BASE, PERCENTAGE, FIXED_DISCOUNT, MIN_PRICE, MAX_PRICE).
Integrações: ServicesModule, ProviderServicesModule, BookingsModule, CouponsModule, LoyaltyModule, OffersModule.
🗺️ Geocoding Module (src/geocoding/)
Objetivo: Converte endereços em coordenadas geográficas e vice-versa.
Funcionalidades:
geocodeAddress: Converte string de endereço em latitude/longitude.
reverseGeocode: Converte coordenadas em endereço legível.
validateCoverage: Verifica se endereço pertence a área de cobertura.
Integrações: ClientsModule, ProvidersModule, BookingsModule.
🎁 Loyalty Module (src/loyalty/)
Objetivo: Gerencia o sistema de pontos de fidelidade.
Funcionalidades:
Permite que usuários acumulem pontos por ações (missões, serviços, indicações).
Permite que usuários resgatem pontos por benefícios (cupons, selos).
Integrações: MissionsModule, ReviewsModule, ReferralsModule, CouponsModule, NotificationsModule, RankingModule.
🏆 Ranking Module (src/ranking/)
Objetivo: Calcula, classifica e disponibiliza os rankings dos prestadores de serviço.
Funcionalidades:
Cálculo de score global baseado em avaliações, pontualidade, frequência de serviços, taxa de aceitação, histórico de incidentes, participação em missões.
Fornece rankings gerais e individuais de prestadores.
Integrações: ReviewsModule, BookingsModule, MissionsModule, NotificationsModule, LoyaltyModule, SafetyModule, ProvidersModule, DashboardModule.
⚖️ Dispute Module (src/disputes/)
Objetivo: Fornece a infraestrutura para que clientes e prestadores possam reportar e resolver problemas.
Funcionalidades:
Criação e submissão de disputas relacionadas a agendamentos.
Visualização do histórico de disputas.
Gerenciamento do fluxo de status (PENDING, IN_REVIEW, RESOLVED).
Integrações: BookingsModule, UsersModule, ChatModule, NotificationsModule, QueuesModule.
✅ Compliance Module (src/compliance/)
Objetivo: Centraliza regras de segurança, validação de identidade, documentos e verificação de antecedentes.
Funcionalidades:
Validação de documentos (formato, integridade, validade).
Verificação de foto de perfil/selfie para identidade.
Consulta de registros externos (futuro).
Integrações: ProvidersModule, ClientsModule, NotificationsModule, DashboardModule, QueuesModule, VerificationModule.
⚙️ Document Processing Module (src/document-processing/)
Objetivo: Fornece serviços para upload e processamento de documentos e imagens.
Funcionalidades:
Upload de imagens para Google Cloud Storage (GCS) ou armazenamento local.
Processamento OCR (Optical Character Recognition) de documentos.
Comparação facial entre selfie e documento.
Verificação de prova de vida (liveness check).
Integrações: VerificationModule.
🚀 Como Rodar o Projeto (Visão Geral)
Para rodar o backend do LimpeJá, você precisará configurar o ambiente e as dependências.

Variáveis de Ambiente: Crie um arquivo .env na raiz do projeto. Preencha com as variáveis necessárias, como:

NODE_ENV (ex: development)
PORT (ex: 3000)
DATABASE_URL (string de conexão do PostgreSQL)
JWT_SECRET, JWT_EXPIRATION_TIME
SENTRY_DSN (se usar Sentry)
Credenciais de GCS (GCS_PROJECT_ID, GCS_KEY, GCS_BUCKET_NAME)
Credenciais de Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_VERIFY_SERVICE_SID)
Credenciais de serviços de e-mail (ex: SENDGRID_API_KEY ou SMTP_HOST, SMTP_PORT, etc.)
Credenciais de geocodificação (ex: GOOGLE_MAPS_API_KEY)
REDIS_URL (para BullMQ e Cache)
APP_BASE_URL (URL base da sua aplicação, importante para webhooks)
THIRD_PARTY_FACEMATCH_API_URL, THIRD_PARTY_FACEMATCH_API_KEY (se usar Cellereit Facematch)
PAGSEGURO_API_TOKEN, PAGSEGURO_API_BASE_URL (se usar PagSeguro)
Banco de Dados: Configure uma instância PostgreSQL e atualize a DATABASE_URL no seu .env. Execute as migrações do Prisma para criar o schema do banco de dados:


npx prisma migrate dev --name init
Redis: Tenha uma instância Redis em execução e configure a REDIS_URL no seu .env.

Instalar Dependências:


npm install
Rodar a Aplicação:


npm run start:dev
A API estará disponível em http://localhost:3000 (ou na porta configurada).
A documentação Swagger estará em http://localhost:3000/api.

Este README visa fornecer uma compreensão abrangente do backend do LimpeJá, sua estrutura e suas funcionalidades. Para detalhes específicos de cada módulo, consulte os arquivos de código-fonte e os