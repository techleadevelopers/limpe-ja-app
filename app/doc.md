Documentação Técnica do Projeto Cleaning
Por: Paulo Silas de Campos Filho - Tech Lead

1. Visão Geral e Propósito
O projeto Cleaning é uma plataforma abrangente desenvolvida para conectar clientes que necessitam de serviços de limpeza e manutenção com provedores de serviços qualificados. Seu propósito central é simplificar o processo de agendamento, gestão de serviços, comunicação, pagamentos e avaliações, proporcionando uma experiência fluida e eficiente para ambas as partes.

A arquitetura do Cleaning é desenhada para ser modular, escalável e de alta performance, utilizando tecnologias modernas e padrões de projeto consolidados para garantir robustez, manutenibilidade e a capacidade de suportar o crescimento contínuo da base de usuários e a expansão de funcionalidades.

1.1. Tecnologias Principais
O projeto Cleaning é construído sobre uma pilha tecnológica robusta e moderna, garantindo eficiência e escalabilidade em todas as camadas:

Backend:

Framework: [NestJS] (Node.js) - Escolhido por sua modularidade, forte tipagem (TypeScript) e aderência a padrões de arquitetura (MVC, DDD).
Linguagem: TypeScript - Oferece segurança de tipo e melhora a manutenibilidade do código.
Banco de Dados: PostgreSQL - Um sistema de banco de dados relacional robusto e escalável.
ORM: [Prisma] - ORM moderno para acesso a dados type-safe e migrações declarativas.
Autenticação: JWT (JSON Web Tokens) com Passport.js - Para autenticação stateless e segura.
Comunicação em Tempo Real: [Socket.IO] - Para funcionalidades de chat e notificações em tempo real.
Validação: Class-validator e Class-transformer - Para validação declarativa de DTOs.
Documentação API: Swagger (OpenAPI) - Para documentação automática e interativa da API.
Frontend:

Framework UI: [React Native] - Para construção de interfaces de usuário nativas para iOS e Android a partir de uma única base de código.
Navegação: [Expo Router] - Sistema de roteamento baseado em arquivos para aplicativos Expo e React Native.
Gerenciamento de Estado Global: React Context API - Para gerenciar estados compartilhados, como o contexto de autenticação (AuthContext).
Tipagem: TypeScript - Essencial para a segurança e consistência dos dados, especialmente na integração com o backend.
Estilização: StyleSheet do React Native.
Animações: React Native Animated API.
Ícones: @expo/vector-icons.
Utilitários: expo-image-picker, expo-clipboard, react-native-safe-area-context.
2. Arquitetura Geral do Sistema
O projeto Cleaning adota uma arquitetura em camadas clara, dividida principalmente entre o Backend (API) e o Frontend (Aplicativo Móvel), que se comunicam através de APIs RESTful e WebSockets.

2.1. Fluxo de Requisição End-to-End
O fluxo de uma requisição típica no sistema Cleaning segue o seguinte caminho:

Cliente (Usuário): Interage com a interface do usuário no Frontend (Aplicativo Móvel).
Frontend (Aplicativo Móvel):
Coleta e valida os dados de entrada do usuário.
Realiza chamadas a serviços internos (ex: AuthContext, clientService.ts).
Formata a requisição (HTTP ou WebSocket) e a envia para o Backend.
Inclui o token JWT no cabeçalho Authorization para requisições protegidas.
Backend (NestJS API):
Guards: Interceptam a requisição para validação de autenticação (JWT) e autorização (papéis do usuário).
Pipes: Validam e transformam os DTOs de entrada.
Controller: Recebe a requisição validada, extrai parâmetros e delega a lógica de negócios para o Service apropriado.
Service: Contém a lógica de negócios principal, orquestrando operações e interagindo com o PrismaService. Pode injetar outros serviços para operações complexas.
PrismaService: Atua como a camada de acesso a dados, executando operações no Banco de Dados.
Banco de Dados (PostgreSQL): Persiste e recupera os dados.
Resposta: O Service retorna os dados ao Controller, que os formata (geralmente usando DTOs de resposta) e os envia de volta ao Frontend.
Filters: Capturam exceções HTTP, formatando as respostas de erro de forma consistente.
Frontend (Aplicativo Móvel):
Recebe a resposta do Backend.
Processa os dados e atualiza a interface do usuário, exibindo informações ou mensagens de erro ao Cliente.
3. Backend (cleaning-backend)
O backend do projeto Cleaning é a camada de serviço que gerencia toda a lógica de negócios, persistência de dados e a comunicação com o frontend.

3.1. Visão Geral e Propósito
Construído com [NestJS], o backend é responsável por conectar clientes e provedores, facilitando agendamentos, pagamentos, chat e avaliações. Sua arquitetura modular e escalável garante robustez e alta performance.

3.2. Estrutura de Módulos (NestJS)
O backend é organizado em módulos coesos, seguindo o princípio de responsabilidade única. Cada módulo encapsula funcionalidades específicas, incluindo seus próprios controladores, serviços, DTOs e entidades.

src/auth: Gerenciamento de autenticação (registro, login, redefinição de senha).
src/users: Operações genéricas sobre usuários (perfis, dados básicos).
src/clients: Lógica específica para o papel de cliente.
src/providers: Lógica específica para o papel de provedor.
src/availability: Gestão da disponibilidade de horários dos provedores.
src/services: Gerenciamento de tipos de serviços globais (ex: "Limpeza Padrão").
src/provider-services: Gerenciamento dos serviços específicos oferecidos por cada provedor.
src/bookings: Criação e gestão de agendamentos.
src/payments: Processamento de pagamentos (PIX simulado) e saques.
src/chat: Funcionalidades de chat (REST e WebSocket).
src/notifications: Gestão de notificações para usuários.
src/reviews: Submissão e consulta de avaliações.
src/offers: Gerenciamento de ofertas e promoções.
src/search: Motor de busca abrangente.
src/prisma: Módulo global para o PrismaService.
src/config: Módulo global para gerenciamento de configurações.
src/common: Componentes reutilizáveis (pipes, filtros de exceção, DTOs genéricos, enums).
3.3. Módulos e Funcionalidades Detalhadas (Backend - Exemplos de Interação)
Para uma lista completa de endpoints e DTOs, consulte a seção 7 do README.md do backend.

Autenticação (AuthModule):
POST /auth/register/client: Registro de cliente (Requisição: RegisterClientDto, Resposta: AuthResponseDto).
POST /auth/login: Autenticação de usuário (Requisição: LoginDto, Resposta: AuthResponseDto).
Usuários (UsersModule):
GET /users/me: Obtém perfil do usuário logado (Resposta: UserProfileDto).
Clientes (ClientsModule):
PATCH /clients/me: Atualiza perfil do cliente (Requisição: UpdateClientProfileDto, Resposta: UserProfile).
**Provedores (ProvidersModule):
GET /providers/:id: Obtém detalhes públicos de um provedor (Resposta: ProviderDetailsDto).
GET /providers: Busca provedores com filtros (Requisição: ProviderSearchDto, Resposta: ProviderDetailsDto[]).
Agendamentos (BookingsModule):
POST /bookings: Cria novo agendamento (Requisição: CreateBookingDto, Resposta: BookingDetailsDto).
GET /bookings/me: Obtém agendamentos do usuário logado (Resposta: BookingDetailsDto[]).
PATCH /bookings/:id/status: Atualiza status de agendamento (Requisição: UpdateBookingStatusDto, Resposta: BookingDetailsDto).
Pagamentos (PaymentsModule):
POST /payments/pix-charge: Cria cobrança PIX (Requisição: CreatePixChargeDto, Resposta: PixChargeResponseDto).
Chat (ChatModule):
GET /chat/:chatId/messages: Obtém histórico de mensagens (Resposta: Message[]).
POST /chat/:chatId/messages: Envia nova mensagem (Requisição: SendMessageDto, Resposta: Message).
3.4. Modelo de Dados (Prisma Schema)
O prisma/schema.prisma define o modelo de dados relacional e é a fonte da verdade para a estrutura do banco de dados. As principais entidades e suas relações incluem: User, Client, Provider, Address, Service, ProviderService, Booking, Message, Notification, Review, Offer, Transaction, Availability.

4. Frontend (app/(client))
O módulo app/(client) é a interface do usuário móvel, construída com React Native e Expo, focada na experiência do cliente.

4.1. Arquitetura de Navegação
A navegação principal é gerenciada pelo [Expo Router], utilizando um Tabs Navigator (app/(client)/_layout.tsx) para acesso rápido às seções primárias: Explorar, Agendamentos, Mensagens e Perfil.

4.2. Módulos e Funcionalidades Detalhadas (Frontend - Interação com Backend)
4.2.1. Gerenciamento de Perfil
Tela de Edição de Perfil (app/(client)/profile/edit.tsx)
Propósito: Atualizar informações pessoais (nome, telefone, foto).
Fluxo de Dados: Obtém UserProfile (via useAuth hook) do backend (GET /users/me). Envia UpdateClientProfileDto para PATCH /clients/me.
Tipagem: UserProfile (backend users DTO), UpdateClientProfileDto (backend clients DTO).
4.2.2. Exploração e Busca de Serviços
Seção de Provedores (SecaoPrestadores.tsx) & Cartão de Provedor (PrestadorCard.tsx)
Propósito: Exibir e interagir com provedores de serviços.
Fluxo de Dados: Recebe Provider[] (backend providers DTO) da tela pai. PrestadorCard usa ProviderWithDistance (extensão local de Provider para incluir distance). Dados são obtidos via GET /search ou GET /providers.
Tipagem: Provider, ProviderWithDistance, SearchQueryDto, SearchResultDto.
Seção de Recomendações (SecaoRecomendacoes.tsx) & Cartão de Recomendação (RecomendacaoCard.tsx)
Propósito: Exibir provedores recomendados.
Fluxo de Dados: Similar à seção de provedores, utilizando Provider[] via GET /search com filtros específicos.
Tipagem: Provider.
4.2.3. Gerenciamento de Agendamentos
Tela de Lista de Agendamentos (app/(client)/bookings/index.tsx)
Propósito: Visualizar agendamentos do cliente.
Fluxo de Dados: Obtém BookingDetailsDto[] do backend via GET /bookings/me.
Tipagem: BookingDetailsDto.
Tela de Detalhes do Agendamento (app/(client)/bookings/[bookingId].tsx)
Propósito: Exibir detalhes e ações para um agendamento específico.
Fluxo de Dados: Obtém BookingDetailsDto via GET /bookings/:id. Envia UpdateBookingStatusDto para PATCH /bookings/:id/status para cancelar.
Tipagem: BookingDetailsDto, UpdateBookingStatusDto.
Tela de Agendamento de Serviço (app/(client)/bookings/schedule-service.tsx)
Propósito: Guiar o agendamento de um serviço.
Fluxo de Dados: Obtém ProviderDetailsDto via GET /providers/:id, AvailabilityDto[] via GET /providers/:providerId/availability. Envia CreateBookingDto para POST /bookings. Cria PixChargeDto via POST /payments/pix-charge.
Tipagem: ProviderDetailsDto, AvailabilityDto, CreateBookingDto, BookingDetailsDto, CreatePixChargeDto, PixChargeResponseDto.
Tela de Sucesso do Agendamento (app/(client)/bookings/success.tsx)
Propósito: Confirmar agendamento.
Fluxo de Dados: Exibe dados já confirmados, sem novas chamadas de API.
4.2.4. Detalhes de Provedor
Tela de Detalhes do Prestador (app/(client)/bookings/[providerId].tsx)
Propósito: Visão abrangente do perfil de um provedor.
Fluxo de Dados: Obtém ProviderDetailsDto via GET /providers/:id. Pode obter ProviderServiceOffering[] via GET /providers/:providerId/services e ReviewEntity[] via GET /reviews.
Tipagem: ProviderDetailsDto, ProviderServiceOffering, ReviewEntity, GetReviewsDto.
Seção de Cabeçalho (HeaderSection.tsx)
Propósito: Componente reutilizável para cabeçalhos de tela de detalhes.
Fluxo de Dados: Recebe ProviderDetails (interface local) contendo id, fullName, avatarUrl.
4.2.5. Outras Funcionalidades
Tela de Mensagens (app/(client)/messages/index.tsx)
Propósito: Gerenciar conversas de chat.
Fluxo de Dados: Obtém Message[] via GET /chat/:chatId/messages. Envia SendMessageDto via POST /chat/:chatId/messages.
Comunicação em Tempo Real: Integração com [Socket.IO] (backend ChatGateway).
Tipagem: Message, GetMessagesDto, SendMessageDto.
5. Integração Frontend-Backend
A interligação entre o Frontend (React Native/Expo) e o Backend (NestJS) do projeto Cleaning é um pilar fundamental da arquitetura, garantindo comunicação eficiente e segura.

Padrão de Comunicação: Predominantemente APIs RESTful (HTTP) para operações transacionais e de consulta, e WebSockets para funcionalidades de comunicação em tempo real (chat, notificações).
Autenticação JWT: O AuthContext no frontend gerencia o ciclo de vida do token JWT, obtido via POST /auth/login. Este token é armazenado de forma segura no AsyncStorage e anexado automaticamente como Authorization: Bearer <token> em todas as requisições protegidas ao backend.
Consistência de Dados (DTOs e Interfaces TypeScript): Um alinhamento rigoroso é mantido entre as interfaces TypeScript do frontend (localizadas em LimpeJaApp/src/types/backend/) e os DTOs definidos no backend. Isso garante a validação e consistência da estrutura de dados em ambas as camadas, minimizando erros de tipagem e facilitando a colaboração.
Tratamento de Erros: O HttpExceptionFilter do backend padroniza as respostas de erro, permitindo que o frontend interprete e exiba mensagens significativas ao usuário. As chamadas de API no frontend incluem blocos try-catch para lidar com erros de rede e respostas de erro da API.
Serviços Centralizados: Chamadas de API são encapsuladas em serviços centralizados (authService.ts, clientService.ts, providerService.ts) que utilizam o Axios, promovendo reuso de código e padronização.
6. Princípios de Design e Padrões de Projeto (Global)
O projeto Cleaning adere a princípios de design e padrões de projeto que promovem a qualidade, manutenibilidade e escalabilidade em todo o stack.

Arquitetura em Camadas: Tanto o frontend quanto o backend seguem uma arquitetura em camadas clara (Controladores/Telas, Serviços/Lógica de Negócios, Acesso a Dados), promovendo a separação de preocupações.
Modularidade: Módulos coesos no backend (NestJS) e componentes reutilizáveis no frontend (React Native) garantem organização, testabilidade e reuso de código.
Segurança de Tipos (Type-Safety): O uso extensivo de TypeScript em ambas as camadas, complementado pelo Prisma no backend, assegura a consistência e integridade dos dados em tempo de compilação.
Data Transfer Objects (DTOs): Utilização rigorosa de DTOs para validação de entrada e tipagem de saída em todas as interações API, garantindo a integridade e segurança dos dados.
Autenticação e Autorização: Implementação robusta de JWT e RBAC (Role-Based Access Control) para proteger rotas e recursos.
Tratamento Centralizado de Erros: Respostas de erro padronizadas facilitam o tratamento de exceções em todo o sistema.
Injeção de Dependência: No backend (NestJS), facilita a testabilidade e modularidade dos serviços.
Componentização (Frontend): Divisão da UI em componentes pequenos e reutilizáveis, promovendo reuso e manutenibilidade.
Gerenciamento de Estado: Combinação de Hooks do React (estado local) e Context API (estado global) no frontend.
Navegação Declarativa: Uso do Expo Router para uma gestão de rotas intuitiva e baseada em arquivos.
Animações e Responsividade: Aplicação de animações fluidas e design responsivo para aprimorar a experiência do usuário em diferentes dispositivos.
7. Roadmap e Próximas Etapas
O projeto Cleaning está em um estágio avançado de desenvolvimento, com a maioria dos fluxos essenciais implementados. As próximas etapas focam em aprimoramentos, expansão de funcionalidades e otimização:

Funcionalidades de Gestão (Admin):
Frontend: Desenvolver interfaces de usuário para POST, PATCH, DELETE em /services e /offers.
Backend: Expandir a UI para DELETE /providers/:id e DELETE /users/:id.
Aprimoramentos de Funcionalidades Existentes:
Backend:
Cálculo de walletBalance para clientes e provedores.
Implementação de lógica geoespacial para busca avançada de provedores (sortBy: Distance, latitude, longitude, radius).
Refinar transições de status de agendamento.
Frontend:
Implementar UI para filtros geoespaciais na busca de provedores.
Desenvolver UI abrangente para consumir e exibir GET /reviews e GET /reviews/:id.
Refletir e gerenciar transições de status de agendamentos de forma mais robusta.
Integrações Futuras:
Backend:
Substituir a simulação PIX por uma integração real com um gateway de pagamento (ex: Stripe, PagSeguro, Mercado Pago).
Integrar com serviços de notificação push (ex: Firebase Cloud Messaging).
Implementar persistência de conversas de chat e funcionalidades como "digitando...", "visto por último".
Frontend:
Integrar com um gateway de pagamento real.
Implementar notificações push.
Aprimorar o sistema de mensagens com persistência e indicadores de status.
8. Recursos e Suporte
Para informações detalhadas e suporte sobre as tecnologias e o ecossistema do projeto Cleaning, consulte os seguintes recursos oficiais:

Documentação NestJS: [https://docs.nestjs.com]
Cursos Oficiais NestJS: [https://courses.nestjs.com/]
Implantação com Mau (AWS): [https://www.mau.nestjs.com/]
GitHub (Repositório Principal NestJS): [https://github.com/nestjs/nest]
LinkedIn (Página Oficial NestJS): [https://www.linkedin.com/company/nestjs]
Suporte Empresarial NestJS: [https://enterprise.nestjs.com]
Devtools NestJS: [https://devtools.nestjs.com]
Comunidade Discord NestJS: [https://discord.com/invite/G7Qnnhy]
Documentação React Native: [https://reactnative.dev/docs]
Documentação Expo Router: [https://docs.expo.dev/router/introduction/]
Documentação Prisma ORM: [https://www.prisma.io/docs]
Documentação Socket.IO: [https://socket.io/docs/]
Esta documentação serve como um ponto de referência sólido e abrangente para todos os envolvidos no projeto Cleaning, facilitando o desenvolvimento, a manutenção, a colaboração e a evolução contínua do sistema.

Related searches:

NestJS documentation
NestJS official courses
React Native documentation
Expo Router documentation
Prisma ORM documentation
JWT authentication best practices
NestJS deployment strategies
NestJS enterprise support
Socket.IO documentation