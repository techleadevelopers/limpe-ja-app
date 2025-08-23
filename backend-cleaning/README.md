Documentação do Backend Limpeja
I. Visão Geral da Arquitetura do Backend Limpeja
A. Objetivo Geral da Plataforma
A plataforma Limpeja visa conectar clientes que buscam serviços de limpeza com prestadores de serviço qualificados. O backend é o coração do sistema, gerenciando usuários, agendamentos, pagamentos, comunicações, verificações de segurança e gamificação, garantindo uma experiência segura, eficiente e confiável para todos os usuários.

B. Tecnologias Principais
O backend da Limpeja é construído sobre uma base robusta de tecnologias modernas:

NestJS: Um framework progressivo Node.js para a construção de aplicações server-side eficientes, escaláveis e de fácil manutenção, utilizando TypeScript. Sua arquitetura modular e baseada em injeção de dependências facilita a organização do código.
Prisma: Um ORM (Object-Relational Mapping) de próxima geração para Node.js e TypeScript. Ele simplifica o acesso ao banco de dados, oferecendo um cliente de banco de dados type-safe e um fluxo de trabalho intuitivo para migrações e modelagem de dados. (src/prisma/prisma.service.ts)
PostgreSQL: O banco de dados relacional utilizado para persistência de dados, escolhido por sua robustez, escalabilidade e suporte a funcionalidades avançadas como tipos geoespaciais.
Bull (Queues): Uma biblioteca para Node.js que implementa filas de processamento de jobs, utilizando Redis como broker. Essencial para tarefas assíncronas e de longa duração, como envio de notificações e processamento de documentos.
JWT (JSON Web Tokens): Utilizado para autenticação e autorização de usuários, garantindo que apenas usuários autenticados e com as permissões corretas acessem os recursos protegidos.
Swagger/OpenAPI: Ferramentas para documentação e teste de APIs, gerando uma documentação interativa que facilita o consumo dos endpoints por parte do frontend e outros serviços. (src/bookings/bookings.controller.ts, src/clients/clients.controller.ts, src/auth/auth.controller.ts)
Sentry: Ferramenta de monitoramento de erros e performance, integrada para capturar exceções e rastrear o desempenho da aplicação em tempo real. (src/instrument.ts, src/app.module.ts)
C. Estrutura Geral dos Módulos e Interconexões
O backend é organizado em módulos coesos, cada um com responsabilidades bem definidas, promovendo a separação de preocupações e a manutenibilidade do código. A injeção de dependências do NestJS facilita a comunicação entre os módulos.

II. Documentação Detalhada por Módulo
1. Módulo Auth (Autenticação e Autorização)
Objetivo: Gerenciar o registro, login e autenticação de usuários (clientes, provedores e administradores), além de controlar o acesso a rotas protegidas.
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
roles.guard.ts: Trabalha em conjunto com @Roles para restringir o acesso a rotas com base na função do usuário (CLIENT, PROVIDER, ADMIN).
Decorators: @Roles (utilizado para definir quais papéis de usuário têm permissão para acessar uma rota).
DTOs: login.dto.ts, register-client.dto.ts, register-provider.dto.ts, forgot-password.dto.ts, auth-response.dto.ts, message-response.dto.ts.
Fluxos de Negócio:
Registro de Cliente: Um novo usuário se registra como cliente, fornecendo e-mail, senha, nome completo, telefone, CPF e endereço. O sistema verifica a unicidade do e-mail, telefone e CPF, faz o hash da senha e cria um novo User com o papel CLIENT e um Client associado. O endereço é geocodificado.
Registro de Provedor: Similar ao registro de cliente, mas com dados adicionais como data de nascimento e anos de experiência. Cria um User com o papel PROVIDER e um Provider associado. O status de verificação inicial do provedor é PENDING_INITIAL_REVIEW. O endereço é geocodificado.
Login (Email/Senha): O usuário envia e-mail e senha. O LocalAuthGuard valida as credenciais via AuthService.validateUser. Em caso de sucesso, o AuthService.login gera um accessToken JWT e retorna um UserProfileDto detalhado.
Recuperação de Senha: O usuário solicita a redefinição de senha via e-mail. O sistema gera um token de redefinição de senha (JWT com curta duração) e envia um link para o e-mail do usuário.
Autenticação WebSocket: O WsAuthGuard intercepta a conexão WebSocket, extrai e verifica o token de autenticação, anexando o payload do usuário ao objeto socket.data para uso posterior.
Regras de Negócio:
E-mails, telefones e CPFs devem ser únicos na plataforma.
Senhas possuem requisitos mínimos de segurança (comprimento, caracteres especiais).
A geocodificação de endereços é realizada durante o registro de clientes e provedores.
Tokens JWT têm tempo de expiração.
Integrações: PrismaModule (para acesso ao banco de dados), UsersModule (para mapeamento de perfil), ProvidersModule (para mapeamento de perfil de provedor), EmailModule (para envio de e-mails de recuperação de senha), GeocodingModule (para geocodificação de endereços).
Endpoints:
POST /auth/register/client: Registra um novo cliente.
POST /auth/register/provider: Registra um novo provedor.
POST /auth/login: Realiza o login.
POST /auth/forgot-password: Solicita a redefinição de senha.
2. Módulo Users (Gerenciamento de Usuários)
Objetivo: Centralizar o ciclo de vida do usuário (CLIENT/PROVIDER/ADMIN), perfil, preferências e integrações transversais.
Arquitetura:
users.controller.ts: Expõe endpoints para gerenciar o perfil do usuário logado e para administração de usuários.
users.service.ts: Contém a lógica de negócio para CRUD de usuários, atualização de perfil, gerenciamento de tokens e agendamento de exclusão.
user.entity.ts: Representa o modelo de dados do usuário.
user-profile.dto.ts: DTO para o perfil completo do usuário.
Fluxos de Negócio:
Criação & Onboarding: Usuário começa com role=CLIENT por padrão. Pode se tornar PROVIDER via ProvidersModule. Jobs de boas-vindas e notificações podem ser enfileirados.
Perfil: PATCH /users/me atualiza campos permitidos (fullName, phone, avatarUrl).
Segurança & LGPD: deletionScheduledAt permite agendar exclusão. Rotas protegidas exigem JWT e algumas @Roles(ADMIN).
Regras de Negócio:
Usuário começa como CLIENT.
Atualizações sensíveis podem notificar o usuário.
Soft delete para LGPD.
Integrações: PrismaModule, NotificationsModule, QueuesModule, AuthModule, ProvidersModule, MissionsModule.
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
Objetivo: Gerenciar o ciclo de vida completo dos prestadores de serviços na plataforma.
Arquitetura:
providers.controller.ts: Define endpoints REST para Providers.
providers.service.ts: Contém a lógica central de negócio (criação, atualização, busca, listagem, detalhamento de prestadores).
provider.entity.ts: Entidade que representa o modelo de Provider.
provider-details.dto.ts: DTO para retorno detalhado do provider.
update-provider-profile.dto.ts: DTO para atualização de perfil do provider.
Fluxos de Negócio:
Onboarding: Registro inicial de um usuário como provedor.
Customização de Perfil: Provedor atualiza informações (foto, descrição, localização).
Cadastro de Serviços: Provedor seleciona e define preços para os serviços que oferece.
Regras de Negócio:
Um usuário pode ter apenas um perfil de provedor.
Apenas provedores com perfil completo e serviços ativos aparecem em buscas.
O ranking influencia os resultados de busca.
Integrações: ProviderServicesModule, BookingsModule, RankingModule, NotificationsModule, MissionsModule.
Endpoints: Não explicitamente detalhados no README, mas inferidos:
POST /providers: Cria um novo provedor.
PATCH /providers/:id: Atualiza o perfil de um provedor.
GET /providers: Lista provedores.
GET /providers/:id: Busca detalhes de um provedor.
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
bookings.service.ts: Contém a lógica de negócio principal para agendamentos, incluindo validações, cálculo de preço, integração com pagamentos e notificações.
create-booking.dto.ts: DTO para criação de agendamentos.
update-booking-status.dto.ts: DTO para atualização de status.
booking-details.dto.ts: DTO para detalhes de agendamento.
booking-and-pix-response.dto.ts: DTO combinado para criação de agendamento e cobrança PIX.
report-dispute.dto.ts: DTO para reporte de disputas.
booking.entity.ts: Representa a entidade Booking.
Fluxos de Negócio:
Criação de Agendamento: Cliente cria um agendamento para um provedor e serviço específicos. O sistema calcula o preço total com base no PricingType do ProviderService, aplica precificação dinâmica e cupons. Um novo endereço é criado.
Criação de Agendamento com Pagamento PIX: Combina a criação do agendamento com a geração de uma cobrança PIX, retornando os detalhes do agendamento e os dados da cobrança.
Atualização de Status: Provedores e clientes podem atualizar o status do agendamento (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELED, REJECTED, RESCHEDULED, PENDING_DISPUTE). Regras de transição de status são aplicadas.
Cancelamento: Clientes podem cancelar agendamentos (com restrições de status).
Reporte de Problemas/Disputas: Clientes ou provedores podem reportar problemas ou disputas para um agendamento, alterando o status para PENDING_DISPUTE e enfileirando uma notificação para administradores.
Resolução de Disputas: Administradores podem resolver disputas, definindo um novo status, aplicando reembolsos e notificando as partes envolvidas.
Regras de Negócio:
Cálculo de preço baseado no PricingType (FIXED_PRICE, HOURLY, BY_SIZE) do ProviderService.
Aplicação de precificação dinâmica (PricingService) e cupons (CouponsService).
Transições de status controladas por papel de usuário e status atual.
Incremento de contadores (completedBookingsCount, monthlyBookingsCount, cancellationCount, noShowCount) para clientes e provedores.
Pontuação de fidelidade (LoyaltyService) para clientes após serviço concluído.
Notificação de avaliação após serviço concluído.
Eventos de missão (MissionsService) e conversão de indicação (ReferralsService) são disparados.
Disputas são processadas assincronamente via QueuesModule.
Integrações: PrismaModule, ClientsService, ProvidersService, ProviderServicesService, NotificationsService, QueuesService, PricingService, CouponsService, LoyaltyService, PaymentsService, MissionsService, ReferralsService.
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
Objetivo: Gerenciar todo o fluxo de pagamentos, recebimentos e retiradas na plataforma, integrando com provedores de pagamento externos.
Arquitetura:
payments.controller.ts: Define rotas HTTP para interagir com pagamentos e retiradas.
payments.service.ts: Contém a lógica de negócio dos fluxos financeiros.
payments.module.ts: Declara e organiza os providers relacionados ao módulo.
transaction.entity.ts: Representa a entidade de transação.
create-pix-charge.dto.ts: DTO para iniciar uma cobrança PIX.
request-withdrawal.dto.ts: DTO para solicitação de retirada.
Fluxos de Negócio:
Criação de Cobrança via PIX: Cliente inicia pagamento de agendamento. O backend cria uma transação PIX_CHARGE (PENDING), integra com provedor de pagamentos para gerar QR Code, e atualiza status para SUCCESS após confirmação.
Registro e Rastreamento de Transações: Cada pagamento ou retirada é registrado na tabela Transaction para auditoria e relatórios. Tipos de transação incluem PIX_CHARGE, WITHDRAWAL, REFUND.
Solicitação de Retirada (Withdrawals): Provedor solicita retirada de valores acumulados. Cria uma transação WITHDRAWAL (PENDING), que é marcada como SUCCESS ou FAILED após processamento.
Regras de Negócio:
Apenas o usuário dono da transação pode visualizar ou solicitar ações.
Limites mínimos para retirada podem ser configurados.
Validação de saldo disponível para retirada.
Todas as operações financeiras são persistidas.
Integrações: BookingsModule, LoyaltyModule, MissionsModule, NotificationsModule.
Endpoints:
POST /payments/pix/charge: Cria uma cobrança PIX.
POST /payments/withdrawal: Solicita uma retirada.
GET /payments/transactions: Lista todas as transações do usuário autenticado.
10. Módulo Pricing (Precificação Dinâmica)
Objetivo: Definir, gerenciar e aplicar regras de precificação dinâmica para os serviços.
Arquitetura:
pricing.controller.ts: Expõe endpoints REST para CRUD de regras e cálculo de preço.
pricing.service.ts: Contém a lógica de negócio para CRUD de regras e a função principal calculatePrice().
pricing-rule.entity.ts: Define a estrutura de uma regra de preço.
calculate-price.dto.ts: DTO para requisição de cálculo de preço.
create-pricing-rule.dto.ts, update-pricing-rule.dto.ts: DTOs para criação e atualização de regra.
Fluxos de Negócio:
Criação de Regras: Administradores podem criar regras de preço globais, por serviço ou por provedor (BASE, PERCENTAGE, FIXED_DISCOUNT, MIN_PRICE, MAX_PRICE), com condições flexíveis (JSON).
Atualização e Gerenciamento: Administradores podem ativar/inativar regras, ajustar valores e condições.
Cálculo de Preço (calculatePrice): Recebe serviceId, providerId, basePrice, clientId e meta (hora, localização). Busca regras ativas aplicáveis e as aplica em ordem específica, retornando originalPrice, finalPrice, appliedRules e discountsTotal.
Regras de Negócio:
Validação de compatibilidade entre type e value da regra.
Ordem de aplicação das regras (BASE -> PERCENTAGE -> FIXED_DISCOUNT -> MIN_PRICE/MAX_PRICE).
Apenas administradores podem criar/editar regras.
Integrações: BookingsModule (para cálculo de preço durante a criação do agendamento), Coupons (futura), Loyalty (futura).
Endpoints:
POST /pricing/rules (ADMIN): Cria uma regra de precificação.
PATCH /pricing/rules/:id (ADMIN): Atualiza uma regra existente.
GET /pricing/rules (ADMIN): Lista todas as regras.
POST /pricing/calculate: Calcula o preço de um serviço em tempo real.
11. Módulo Coupons (Cupons de Desconto)
Objetivo: Gerenciar a criação, aplicação e rastreamento de cupons de desconto.
Arquitetura:
coupons.controller.ts: Expõe endpoints REST para CRUD de cupons e aplicação.
coupons.service.ts: Contém a lógica de negócio para criar, buscar, atualizar e aplicar cupons, além de integrar com missões.
create-coupon.dto.ts, update-coupon.dto.ts, apply-coupon.dto.ts: DTOs para validação e aplicação.
coupon.entity.ts: Define a estrutura da entidade Coupon e seus enums (CouponType, CouponTarget, CouponStatus).
Fluxos de Negócio:
CRUD de Cupons: Administradores podem criar, listar, buscar por código e atualizar cupons (código, tipo, valor, validade, usos, alvo, status).
Aplicação de Cupons: O applyCoupon verifica a validade do cupom (data, usos, status) e as regras de alvo (NEW_CLIENTS, SPECIFIC_SERVICE, SPECIFIC_PROVIDER). Calcula o discountAmount e newTotalPrice.
Emissão de Cupons via Missões: O issueCouponFromMission gera um cupom percentual de uso único com validade de 30 dias a partir da conclusão de uma missão.
Regras de Negócio:
Códigos de cupom devem ser únicos.
Validação de datas de validade e maxUses.
Regras de alvo (target) determinam a aplicabilidade do cupom.
Cupons são marcados como usados (usesCount incrementado) após a conclusão do agendamento.
Apenas administradores podem criar/editar cupons.
Integrações: PrismaModule, MissionsModule (para emissão de cupons), BookingsModule (para aplicação e marcação de uso).
Endpoints:
POST /coupons (ADMIN): Cria um novo cupom.
GET /coupons/:code (ADMIN): Busca um cupom por código.
PATCH /coupons/:id (ADMIN): Atualiza um cupom.
POST /coupons/apply (CLIENT): Aplica um cupom a um agendamento.
GET /coupons (ADMIN): Lista todos os cupons.
12. Módulo Offers (Ofertas Promocionais)
Objetivo: Gerenciar ofertas promocionais programadas e estratégicas, complementando cupons e precificação.
Arquitetura:
offers.controller.ts: Expõe rotas REST para CRUD de ofertas.
offers.service.ts: Contém a lógica de negócio para criar, gerenciar e aplicar ofertas.
offer.entity.ts: Define o modelo da entidade Offer.
create-offer.dto.ts, update-offer.dto.ts, offer-details.dto.ts: DTOs para validação e resposta.
Fluxos de Negócio:
Criação de Ofertas: Administradores criam ofertas com discountValue, discountType, target (GENERAL, SPECIFIC_SERVICE, SPECIFIC_PROVIDER, NEW_CLIENTS), validFrom e validUntil.
Validação Automática: Ofertas têm validações de data e valor. São automaticamente marcadas como EXPIRED ao passar da data de validade.
Aplicação de Ofertas: Durante busca ou checkout, o sistema consulta ofertas ativas e elegíveis (getActiveOffersForUser).
Atualização e Remoção: Atualizações podem alterar datas, status e valor. Remoções marcam a oferta como INACTIVE para preservar histórico.
Regras de Negócio:
Ofertas programadas com escopo alvo.
Validações de datas e valores.
Remoção é um soft delete.
Integrações: SearchModule, BookingsModule, NotificationsModule.
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
Criação de Avaliação: Cliente envia avaliação para um agendamento COMPLETED. O sistema valida elegibilidade, credita pontos de fidelidade (LoyaltyService), dispara evento de missão (MissionsService) e atualiza indicadores do provedor (ProvidersService).
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
Objetivo: Calcular e expor o ranking de prestadores para fins de listagem, destaque e busca, consolidando sinais de qualidade e atividade.
Arquitetura:
ranking.module.ts: Declara o módulo e exporta o RankingService.
ranking.service.ts: O motor de ranking, consulta dados, normaliza sinais, aplica fórmula de score com pesos configuráveis e filtros.
ranking.controller.ts: Expõe endpoints REST para listagem ranqueada e rebuild de cache.
provider-ranking.dto.ts: DTO de saída para itens ranqueados.
Fluxos de Negócio:
Cálculo de Score: Utiliza uma fórmula ponderada de sinais como rating médio, bookings concluídos, taxa de 5 estrelas, recência de review e proximidade geográfica.
Listagem Ranqueada: Retorna uma lista de provedores ordenada por score, com filtros opcionais por serviceId, city, nearbyLat/nearbyLng.
Regras de Negócio:
Fórmula de scoring com pesos ajustáveis.
Normalização de dados para o cálculo do score.
Decay temporal para reviews antigas.
Mínimos estatísticos para evitar manipulação.
Atribuição de "badges" com base em limiares.
Integrações: Prisma, Reviews, Bookings.
Endpoints:
GET /ranking/providers: Lista ranqueada com filtros e paginação.
GET /ranking/top: Atalho para top N provedores.
POST /ranking/rebuild (ADMIN): Força rebuild/invalidação de cache.
15. Módulo Search (Busca de Serviços e Provedores)
Objetivo: Fornecer mecanismos de busca inteligente de serviços e provedores, permitindo que clientes localizem ofertas e profissionais disponíveis.
Arquitetura:
search.controller.ts: Expõe endpoints REST para busca.
search.service.ts: Contém a lógica de negócio para consultas ao banco via Prisma.
search-query.dto.ts: Define parâmetros de entrada da busca.
provider-service-search-result.dto.ts: Define o formato de resposta dos resultados.
Fluxos de Negócio:
Consulta de Busca: Cliente envia consulta com filtros (query, location, priceRange, categories).
Execução da Busca: SearchService utiliza Prisma para consultar ProviderService, aplicando filtros dinâmicos.
Montagem dos Resultados: Retorno transformado em objetos padronizados com informações do serviço, provedor, preço, categoria, etc.
Regras de Negócio:
Validação de parâmetros via DTO.
Filtros dinâmicos.
Integrações: Prisma ORM, Providers Module, Reviews Module (opcional).
Endpoints:
POST /search: Busca serviços/provedores.
16. Módulo Notifications (Notificações)
Objetivo: Gerenciar a criação, envio e atualização de notificações no sistema, garantindo que usuários e administradores recebam comunicações relevantes.
Arquitetura:
notifications.controller.ts: Expõe rotas HTTP.
notifications.service.ts: Contém a lógica de negócio.
notification.entity.ts: Define a estrutura da entidade Notification.
create-notification.dto.ts, update-notification.dto.ts: DTOs para validação.
Fluxos de Negócio:
Gatilho de Evento: Serviços chamam notificationsService.create() a partir de eventos (reserva criada, missão concluída).
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
GET /notifications/:userId (USER): Lista notificações de um usuário.
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
Como Funciona:
Produção do Job: Módulos injetam QueuesService e chamam métodos especializados (addNotificationJob, addVerificationJob, addDisputeJob, addSubscriptionGenerationJob).
Encaminhamento e Persistência: Bull grava o job no Redis com metadados.
Processamento: O worker correspondente consome o job e executa a ação via serviços de domínio.
Retentativas, Backoff e DLQ: Falhas disparam retentativas automáticas.
APIs do QueuesService: Métodos para adicionar jobs de notificação, verificação, disputa e geração de assinaturas, com opções para jobId, delayMs, attempts, backoffMs, priority.
Workers:
notification.worker.ts: Processa jobs da fila notifications (ex.: send-notification).
verification.worker.ts: Processa jobs da fila verification (ex.: provider-verification, document-ocr).
subscription-generation.worker.ts (inferido): Processa jobs para gerar agendamentos de assinaturas.
Boas Práticas: Idempotência com jobId, delays conscientes, backoff exponencial, segregação de filas, remoção de jobs, rate limit.
Observabilidade: Logs de workers, métricas (processados/falhados, tempo de processamento, tamanho da fila), UI de monitoramento (bull-board).
Integrações: NotificationsService, VerificationService, BookingsService, MissionsService, SubscriptionsService.
18. Módulo Verification (Validação de Identidade)
Objetivo: Responsável pelo processo de validação de identidade de prestadores de serviço, garantindo segurança e confiabilidade.
Arquitetura:
verification.controller.ts: Define endpoints HTTP.
verification.service.ts: Contém toda a lógica de negócio (armazenar, processar e validar documentos).
document-processing.service.ts: Serviço auxiliar para upload e processamento de imagens (OCR, comparação facial, prova de vida) via Google Cloud Storage/Vision API.
verification.module.ts: Configura dependências.
DTOs: upload-document.dto.ts, upload-selfie.dto.ts.
Fluxos de Negócio:
Upload de Documentos: Prestador envia imagens/documentos oficiais. Backend armazena e envia para DocumentProcessingService (OCR, autenticidade, cruzamento de dados).
Upload de Selfie (Prova de Vida): Prestador envia selfie. Pode ser comparada com foto do documento.
Processamento & Análise: VerificationService coordena o processamento, utilizando filas (QueuesModule) para tarefas assíncronas (OCR, validação facial, notificação ao compliance).
Resultado da Verificação: Status VERIFIED (aprovado), UNDER_REVIEW (pendente), REJECTED (rejeitado com notificação).
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
19. Módulo Safety (Segurança e Incidentes)
Objetivo: Garantir a segurança de clientes e prestadores, fornecendo mecanismos de relato de incidentes e alerta de pânico.
Arquitetura:
safety.controller.ts: Expõe rotas da API.
safety.service.ts: Contém a lógica de negócio para registro, atualização e consulta.
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
POST /safety/incidents: Reportar incidente.
PATCH /safety/incidents/:id: Atualizar status/incidente.
GET /safety/incidents/:id: Buscar incidente específico.
GET /safety/incidents: Listar incidentes (admin).
Alertas de Pânico:
POST /safety/panic: Disparar alerta de pânico.
GET /safety/panic/:id: Consultar alerta específico.
GET /safety/panic: Listar alertas ativos/recentes.
20. Módulo Referrals (Indicações)
Objetivo: Gerenciar o registro de indicações de usuários, consulta e integrações com Loyalty e Missões.
Arquitetura:
Modelo (Prisma): Referral (com referredUserId único e par (referredUserId, referrerUserId) único).
DTO: CreateReferralDto.
referrals.service.ts: Lógica para criar e buscar indicações.
referrals.controller.ts: Expõe endpoints.
Fluxos de Negócio:
Criação de Indicação: createReferral verifica autoindicação, existência de usuários e unicidade. Cria a indicação e credita pontos de fidelidade (LoyaltyService) para o indicador.
Conversão de Indicação: (Idealmente) quando o indicado conclui o primeiro booking, o BookingsService dispara um evento (referral.converted) para o MissionsService, recompensando o indicador.
Regras de Negócio:
Não permite autoindicação.
Um usuário só pode ser indicado uma vez.
Pontos de fidelidade podem ser dados na criação ou na conversão.
Integrações: PrismaModule, LoyaltyModule, MissionsModule, BookingsService.
Endpoints:
POST /referrals: Cria a indicação.
GET /referrals/:id: Detalhe de uma indicação.
GET /referrals/me: Lista indicações feitas pelo usuário logado.
21. Módulo Missions (Gamificação e Recompensas)
Objetivo: Criar objetivos gamificados que, ao serem atingidos, geram recompensas (cupons ou pontos de fidelidade) para o usuário.
Arquitetura:
Modelos (Prisma): Mission, MissionProgress, MissionEvent.
Enums: MissionAudience, MissionKind, RewardType, MissionStatus.
missions.service.ts: Contém a lógica principal (trackEvent, getMyMissions, claimMission).
Fluxos de Negócio:
Rastreamento de Eventos: MissionsService.trackEvent(userId, eventName, meta?) grava o evento e recalcula o progresso de missões ativas que escutam esse evento.
Cálculo de Progresso: Baseado no MissionKind (COUNT_EVENT, STREAK_DAYS, WITHIN_WINDOW). Atualiza currentValue e status.
Resgate de Recompensas: Usuário chama claimMission. O módulo valida o status da missão (COMPLETED e não CLAIMED), emite cupom (CouponsService) ou credita pontos (LoyaltyService), e marca a missão como CLAIMED.
Regras de Negócio:
Missões definidas por código, título, tipo, evento, valor alvo e janela de tempo.
Recompensas podem ser cupons ou pontos.
trackEvent é idempotente para modos de janela.
claimMission valida elegibilidade e emite recompensa.
Integrações: PrismaService, CouponsService, LoyaltyService, BookingsModule, ReviewsModule, ReferralsModule.
Endpoints:
GET /missions/my (CLIENT): Retorna a lista de missões ativas com progresso do usuário.
POST /missions/claim (CLIENT): Resgata a recompensa de uma missão.
22. Módulo Chat (Comunicação em Tempo Real)
Objetivo: Fornecer funcionalidades de comunicação em tempo real entre clientes e provedores.
Arquitetura:
chat.controller.ts: Expõe endpoints REST para gerenciamento de chat.
chat.service.ts: Contém a lógica de negócio para encontrar/criar chats, enviar/receber mensagens.
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
Integrações: PrismaModule, AuthModule (para autenticação WebSocket).
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
24. Módulo Config (Configuração da Aplicação)
Objetivo: Gerenciar as variáveis de ambiente e configurações da aplicação de forma centralizada e validada.
Arquitetura:
config.module.ts: Importa NestConfigModule, definindo que as configurações serão carregadas de .env e validadas.
configuration.ts: Define a estrutura da configuração, mapeando variáveis de ambiente para um objeto de configuração.
validation-schema.ts: Utiliza Joi para definir um esquema de validação rigoroso para todas as variáveis de ambiente necessárias.
Configurações Gerenciadas:
Gerais: PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRATION_TIME, APP_BASE_URL.
Serviços Externos: Google Cloud Storage (GCS), Cellereit Facematch (API de terceiros), Email Service (SendGrid/SMTP), SMS Service (Twilio), Geocoding Service (Google Maps/OpenStreetMap), PagSeguro.
Filas: REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, QUEUE_ATTEMPTS_DEFAULT, etc.
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
Objetivo: Gerenciar o sistema de pontos de fidelidade para usuários, recompensando ações na plataforma.
Arquitetura:
loyalty.module.ts: Declara o módulo.
loyalty.service.ts: Contém a lógica para adicionar e gerenciar pontos.
loyalty.controller.ts: Expõe endpoints para consulta de saldo e resgate de pontos.
DTOs: add-points.dto.ts, redeem-points.dto.ts.
Modelo (Prisma): LoyaltyTransaction (registra cada transação de pontos).
Enum (Prisma): LoyaltyTransactionType.
Fluxos de Negócio:
Adicionar Pontos: addPoints registra uma transação de pontos para um userId com um type e referenceId. Pode incluir lógica de campanhas (ex: dobrar pontos).
Resgatar Pontos: redeemPoints permite ao usuário trocar pontos por recompensas (ex: cupons). Verifica saldo, busca recompensa, cria o cupom e debita os pontos.
Consulta de Saldo e Histórico: getUserPoints e getLoyaltyHistory fornecem o saldo atual e o histórico de transações de pontos.
Regras de Negócio:
Pontos são concedidos por ações específicas (SERVICE_COMPLETED, FIRST_REVIEW, REVIEW_SUBMITTED, REFERRAL, MISSION_COMPLETED).
Cada transação é auditável.
Saldo insuficiente impede o resgate.
Integrações: PrismaModule, BookingsModule, ReviewsModule, ReferralsModule, MissionsModule, CouponsModule (para emissão de cupons).
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
Objetivo: Fornecer dados consolidados e métricas chave para o painel de controle do provedor.
Arquitetura:
dashboard.controller.ts: Expõe o endpoint para obter os dados do dashboard.
dashboard.service.ts: Orquestra a coleta de dados de outros serviços para compor o dashboard.
dashboard.dto.ts: DTO de resposta para os dados do dashboard do provedor.
Fluxos de Negócio:
Obtenção de Dados: O serviço busca informações do provedor, agendamentos futuros, sumário de ganhos e avaliações recentes, consolidando-as em um único objeto de resposta.
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
Integrações: ConfigService (para STORAGE_TYPE, GCS_PROJECT_ID, GCS_BUCKET_NAME).
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

UserRole (src/common/constants/roles.enum.ts e re-exportado em src/shared/enums/user-role.enum.ts): Define os papéis de usuário na plataforma (CLIENT, PROVIDER, ADMIN).
VerificationStatus (src/shared/enums/verification-status.enum.ts): Define os estados do processo de verificação de provedores.
BookingStatus (src/shared/enums/booking-status.enum.ts): Define os estados do ciclo de vida de um agendamento.
PricingType (src/common/enums/pricing-type.enum.ts): Define os tipos de precificação de serviços (FIXED_PRICE, HOURLY, BY_SIZE, CUSTOM_QUOTE).
UserRoles (src/shared/types/user-roles.type.ts): Um tipo de união para os papéis de usuário.
G. Augmentação do Objeto Request (express-request.d.ts)
Objetivo: Estender a interface Request do Express para incluir propriedades personalizadas adicionadas pelos guards de autenticação (ex: req.user).
Detalhes: O arquivo express-request.d.ts declara um namespace global Express e aumenta a interface Request para incluir a propriedade user do tipo User (do Prisma), garantindo que as informações do usuário autenticado estejam disponíveis de forma tipada em todo o ciclo de vida da requisição.
H. Módulos e Controladores de Entrada (src/app)
AppModule (src/app.module.ts):
Objetivo: O módulo raiz da aplicação, responsável por importar e configurar todos os outros módulos.
Configurações Globais: Configura ConfigModule (para variáveis de ambiente), ThrottlerModule (para rate limiting), SentryModule (para monitoramento de erros) e PrismaModule (para acesso ao DB) como módulos globais.
Estrutura: Importa e organiza todos os módulos de domínio da aplicação.
AppController (src/app.controller.ts):
Objetivo: O controlador raiz, fornecendo endpoints básicos para verificar o status da aplicação.
Endpoints:
GET /: Retorna uma mensagem de boas-vindas.
GET /health: Retorna um status ok, útil para verificações de saúde de infraestrutura.
AppService (src/app.service.ts):
Objetivo: O serviço raiz, contendo a lógica de negócio básica para o AppController.
Funcionalidades: Retorna a mensagem de boas-vindas.