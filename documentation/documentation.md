Documentação Abrangente do Projeto Cleaning
1. Sumário Executivo
O Cleaning surge como uma plataforma inovadora no mercado de serviços sob demanda, com o objetivo de conectar clientes a profissionais de limpeza e conservação, funcionando como um "Airbnb para serviços de limpeza". Este mercado global está em expansão, com projeção de atingir US$ 460 bilhões até 2030. A proposta de valor do Cleaning reside na facilidade de agendamento, na garantia de qualidade do serviço e na otimização da experiência do usuário, tanto para clientes quanto para prestadores.

A arquitetura do aplicativo é robusta, com frontend em React Native/Expo e backend em NestJS/PostgreSQL, utilizando Prisma como ORM e Socket.IO para comunicação em tempo real. Esta base tecnológica sólida, aliada a princípios de design modernos, garante escalabilidade e manutenibilidade.

A estratégia de monetização inicial baseia-se em uma comissão de 20% sobre os ganhos dos prestadores, um modelo competitivo dentro do setor. No entanto, o sucesso sustentável do Cleaning dependerá da implementação rigorosa de um arcabouço robusto de confiança e segurança, de uma estratégia de aquisição e retenção dual (clientes e prestadores), da busca pela excelência operacional e de uma diferenciação clara da marca. A capacidade de navegar pelas complexidades regulatórias brasileiras e de otimizar continuamente a experiência do usuário e do prestador será fundamental para transformar o potencial do Cleaning em liderança de mercado.

2. Introdução: Contexto e Propósito do Cleaning
O Cleaning visa revolucionar a forma como serviços de limpeza são contratados e gerenciados. Para clientes, oferece uma plataforma intuitiva para descobrir profissionais qualificados, verificar avaliações, agendar serviços com datas e horários flexíveis, e realizar pagamentos seguros. Para os profissionais de limpeza, o Cleaning é uma ferramenta poderosa para expandir sua clientela, gerenciar sua agenda de forma autônoma, e receber pagamentos de forma garantida e simplificada. [README.md]

Construído com tecnologia de ponta, o aplicativo oferece uma experiência de usuário fluida e moderna, tanto para quem busca um ambiente limpo quanto para quem oferece o serviço de limpeza. O setor de limpeza no Brasil se consolidou como uma indústria estratégica e essencial, com a valorização da higiene intensificada após a pandemia de COVID-19, o que representa uma oportunidade estrutural para o Cleaning. [README.md]

3. Análise de Mercado e Cenário Competitivo
3.1. Tamanho do Mercado e Trajetória de Crescimento
O mercado global de serviços de limpeza é substancial e está em crescimento contínuo. Em 2023, foi avaliado em cerca de US$ 300 bilhões e há uma projeção de que alcançará US$ 460 bilhões até 2030, demonstrando uma Taxa Composta de Crescimento Anual (CAGR) de 6,3%. A limpeza residencial constitui um segmento principal dentro deste mercado. Este tamanho de mercado considerável e o crescimento consistente indicam uma oportunidade robusta e em expansão para novos participantes como o Cleaning. [Análise Estratégica]

3.2. Principais Impulsionadores do Mercado e Comportamento do Consumidor
Os impulsionadores do mercado incluem o aumento da urbanização, estilos de vida agitados, o crescimento da renda disponível e uma maior conscientização sobre higiene e saúde. Os clientes priorizam conveniência, confiabilidade, acessibilidade e personalização nos serviços de limpeza. Além disso, 80% dos usuários confiam em avaliações e classificações ao escolher um provedor de serviços. A alta dependência de avaliações não se refere apenas à qualidade; trata-se fundamentalmente de mitigar o risco percebido e construir confiança. [Análise Estratégica]

3.3. Impacto Tecnológico e Prontidão Digital
Aplicativos móveis, Inteligência Artificial (IA) e Internet das Coisas (IoT) estão aprimorando a eficiência, os processos de reserva e a personalização no setor de limpeza. No Brasil, a penetração da internet é de 70%, e o uso de smartphones é de 90%, indicando alta prontidão digital para a adoção de aplicativos. O modelo baseado em aplicativo do Cleaning está bem posicionado para capitalizar esses avanços tecnológicos e as altas taxas de adoção digital. [Análise Estratégica]

3.4. Análise do Cenário Competitivo
O mercado é fragmentado, com concorrentes diretos como TaskRabbit, Handy e Thumbtack, juntamente com inúmeras empresas de limpeza locais e limpadores independentes. O Cleaning enfrenta concorrência significativa de players estabelecidos e do mercado de limpeza tradicional. Uma estratégia de diferenciação clara e uma expansão geográfica direcionada são cruciais. [Análise Estratégica]

Tabela 1: Análise do Cenário Competitivo

Característica	Cleaning (Proposto)	Concorrentes de Plataforma (Ex: Handy, TaskRabbit)	Agências de Limpeza Locais	Limpadores Independentes
Modelo de Negócio	Plataforma de Economia Gig (Marketplace)	Plataforma de Economia Gig (Marketplace)	Empresa Tradicional	Autônomo/Informal
Mercado-Alvo	Residencial (foco inicial), pot. comercial	Residencial, comercial, tarefas gerais	Residencial, comercial	Residencial, comercial
Modelo de Preços	Comissão de 20% do prestador	Comissão (15-30%), taxas de serviço	Taxa horária/fixa, pacotes	Negociação direta
Principais Características	Verificação de antecedentes, seguro, avaliações, Pix	Verificações, avaliações, suporte	Equipe própria, supervisão	Flexibilidade, custo baixo
Pontos Fortes	Conveniência, confiança, formalização para prestadores	Reconhecimento de marca, grande base de usuários	Consistência, responsabilidade da agência	Custo baixo, relacionamento direto
Pontos Fracos	Necessidade de construir marca e base	Taxas mais altas, qualidade inconsistente	Menos flexibilidade, burocracia	Falta de garantia, inconsistência, informalidade
Diferencial do Cleaning	Foco na confiança e segurança, formalização de prestadores informais, adaptação local (Pix, PEC das Domésticas)			
3.5. Demanda do Mercado no Brasil (Contexto Local)
Aproximadamente 60% dos lares brasileiros utilizam serviços domésticos, com 30% fazendo-o regularmente. A economia gig no Brasil está crescendo 20% anualmente. Essas estatísticas confirmam uma forte demanda existente e um ambiente favorável para plataformas de economia gig no Brasil, tornando-o um mercado inicial atraente para o Cleaning. [Análise Estratégica]

4. Modelo de Negócio e Proposta de Valor do Cleaning
4.1. Modelo de Negócio Central: O Conceito "Airbnb para Limpeza"
O Cleaning opera como um marketplace de dois lados, conectando usuários que buscam serviços de limpeza com prestadores de serviços independentes. Este modelo aproveita a tecnologia para facilitar a reserva, o pagamento e a comunicação, espelhando o sucesso de plataformas como o Airbnb em outros setores. O sucesso depende da atração de ambos os lados, criando fortes efeitos de rede. [Análise Estratégica]

4.2. Proposta de Valor para Usuários
A proposta de valor do Cleaning para os usuários é multifacetada, focando em:

Conveniência: Facilidade de reserva, agendamento e pagamento através de um aplicativo móvel.
Confiabilidade e Confiança: Acesso a profissionais verificados e com antecedentes checados, enfatizando avaliações e classificações.
Acessibilidade e Transparência: Preços competitivos com estruturas claras.
Personalização: Capacidade de especificar necessidades e preferências de limpeza. [Análise Estratégica]
4.3. Proposta de Valor para Prestadores de Serviço
A atração e retenção de prestadores de alta qualidade são críticas. O Cleaning oferece:

Oportunidades de Trabalho Flexíveis: Capacidade de definir seus próprios horários e escolher trabalhos.
Potencial de Ganhos Aumentado: Acesso a uma base de clientes mais ampla, levando a trabalho mais consistente.
Redução da Carga Administrativa: O Cleaning lida com marketing, aquisição de clientes, agendamento e processamento de pagamentos.
Suporte e Comunidade: Potencial para suporte da plataforma, treinamento e um senso de comunidade.
Formalização: Oportunidade para trabalhadores informais obterem trabalho mais formal. [Análise Estratégica]
5. Arquitetura e Tecnologias do Cleaning
5.1. Tecnologias Principais
O projeto Cleaning é construído sobre uma pilha tecnológica robusta e moderna, garantindo eficiência e escalabilidade em todas as camadas. [README.md]

Frontend

Framework UI: React Native - Para construção de interfaces de usuário nativas para iOS e Android a partir de uma única base de código. [README.md, doc.md]
Navegação: Expo Router (v5) - Sistema de roteamento baseado em arquivos para aplicativos Expo e React Native, oferecendo navegação robusta e tipada. [README.md, doc.md]
Gerenciamento de Estado Global: React Context API - Para gerenciar estados compartilhados, como o contexto de autenticação (AuthContext). [README.md, doc.md]
Tipagem: TypeScript - Essencial para a segurança e consistência dos dados, especialmente na integração com o backend. [README.md, doc.md]
Requisições HTTP: Axios - Para chamadas HTTP à API backend. [README.md, doc.md]
Serviços Expo: EAS (Expo Application Services) - Para um fluxo de desenvolvimento gerenciado, builds e atualizações. [README.md]
Backend

Framework: NestJS (Node.js) - Escolhido por sua modularidade, forte tipagem (TypeScript) e aderência a padrões de arquitetura (MVC, DDD). [README.md, doc.md]
Linguagem: TypeScript - Oferece segurança de tipo e melhora a manutenibilidade do código. [README.md, doc.md]
Banco de Dados: PostgreSQL - Um sistema de banco de dados relacional robusto e escalável. [README.md, doc.md]
ORM: Prisma - ORM moderno para acesso a dados type-safe e migrações declarativas. [README.md, doc.md]
Autenticação: JWT (JSON Web Tokens) com Passport.js - Para autenticação stateless e segura. [README.md, doc.md]
Comunicação em Tempo Real: Socket.IO - Para funcionalidades de chat e notificações em tempo real. [README.md, doc.md]
Validação: Class-validator e Class-transformer - Para validação declarativa de DTOs. [README.md, doc.md]
Documentação API: Swagger (OpenAPI) - Para documentação automática e interativa da API. [README.md, doc.md]
5.2. Arquitetura Geral do Sistema e Fluxo de Requisição End-to-End
O projeto Cleaning adota uma arquitetura em camadas clara, dividida principalmente entre o Backend (API) e o Frontend (Aplicativo Móvel), que se comunicam através de APIs RESTful e WebSockets. [README.md, doc.md]

Fluxo de Requisição Típica:

Cliente (Usuário): Interage com a interface do usuário no Frontend. [README.md, doc.md]
Frontend (Aplicativo Móvel): Coleta e valida dados, realiza chamadas a serviços internos, formata a requisição (HTTP ou WebSocket) e a envia para o Backend, incluindo o token JWT para requisições protegidas. [README.md, doc.md]
Backend (NestJS API):
Guards: Interceptam para validação de autenticação (JWT) e autorização. [README.md, doc.md]
Pipes: Validam e transformam os DTOs de entrada. [README.md, doc.md]
Controller: Recebe a requisição e delega a lógica de negócios para o Service. [README.md, doc.md]
Service: Contém a lógica de negócios, interage com PrismaService e orquestra operações. [README.md, doc.md]
PrismaService: Camada de acesso a dados, executa operações no Banco de Dados. [README.md, doc.md]
Banco de Dados (PostgreSQL): Persiste e recupera os dados. [README.md, doc.md]
Resposta: O Service retorna dados ao Controller, que os formata e envia de volta ao Frontend. [README.md, doc.md]
Filters: Capturam exceções HTTP, formatando respostas de erro. [README.md, doc.md]
Frontend (Aplicativo Móvel): Recebe a resposta do Backend, processa os dados e atualiza a interface do usuário. [README.md, doc.md]
5.3. Estrutura de Módulos (NestJS Backend)
O backend é organizado em módulos coesos, seguindo o princípio de responsabilidade única. Cada módulo encapsula funcionalidades específicas, incluindo seus próprios controladores, serviços, DTOs e entidades. [README.md, doc.md]

src/auth: Gerenciamento de autenticação.
src/users: Operações genéricas sobre usuários.
src/clients: Lógica específica para cliente.
src/providers: Lógica específica para provedor.
src/availability: Gestão de horários dos provedores.
src/services: Gerenciamento de tipos de serviços globais.
src/provider-services: Gerenciamento de serviços específicos oferecidos por provedores.
src/bookings: Criação e gestão de agendamentos.
src/payments: Processamento de pagamentos e saques.
src/chat: Funcionalidades de chat.
src/notifications: Gestão de notificações.
src/reviews: Submissão e consulta de avaliações.
src/offers: Gerenciamento de ofertas e promoções.
src/search: Motor de busca abrangente.
src/prisma: Módulo global para PrismaService.
src/config: Módulo global para gerenciamento de configurações.
src/common: Componentes reutilizáveis. [README.md, doc.md]
5.4. Modelo de Dados (Prisma Schema)
O prisma/schema.prisma define o modelo de dados relacional e é a fonte da verdade para a estrutura do banco de dados. As principais entidades e suas relações incluem: User, Client, Provider, Address, Service, ProviderService, Booking, Message, Notification, Review, Offer, Transaction, Availability. [README.md, doc.md]

5.5. Princípios de Design e Padrões de Projeto (Global)
O projeto Cleaning adere a princípios de design e padrões de projeto que promovem a qualidade, manutenibilidade e escalabilidade em todo o stack. [README.md, doc.md]

Arquitetura em Camadas: Separação de preocupações (Controladores/Telas, Serviços/Lógica de Negócios, Acesso a Dados).
Data Transfer Objects (DTOs): Validação de entrada e tipagem de saída.
Autenticação e Autorização: JWT e RBAC (Role-Based Access Control).
Tratamento Centralizado de Erros: Respostas de erro padronizadas.
Modularidade: Organização, testabilidade e reuso de código.
Segurança de Tipos (Type-Safety): Uso extensivo de TypeScript com Prisma.
Injeção de Dependência: Facilita testabilidade e modularidade.
Componentização (Frontend): Divisão da UI em componentes reutilizáveis.
Gerenciamento de Estado: Hooks do React e Context API.
Navegação Declarativa: Expo Router para gestão de rotas.
Animações e Responsividade: Design fluido e adaptável. [README.md, doc.md]
6. Integração Frontend-Backend
A interligação entre o Frontend (React Native/Expo) e o Backend (NestJS) do projeto Cleaning é um pilar fundamental da arquitetura, garantindo comunicação eficiente e segura. [README.md, doc.md]

Padrão de Comunicação: APIs RESTful (HTTP) para operações transacionais e WebSockets para comunicação em tempo real (chat, notificações). [README.md, doc.md]
Autenticação JWT: O AuthContext no frontend gerencia o ciclo de vida do token JWT, armazenado e incluído nas requisições protegidas. [README.md, doc.md]
Consistência de Dados (DTOs e Interfaces TypeScript): Alinhamento rigoroso entre interfaces TypeScript do frontend e DTOs do backend para validação e consistência. [README.md, doc.md]
Tratamento de Erros: O HttpExceptionFilter do backend padroniza respostas de erro para o frontend. [README.md, doc.md]
Serviços Centralizados: Chamadas de API encapsuladas em serviços centralizados (authService.ts, clientService.ts, providerService.ts) usando Axios. [README.md, doc.md]
6.2. Mapeamento de Rotas da API
Fluxo/Tela do Frontend	Endpoint do Backend (Método HTTP, Caminho)	DTOs (Requisição/Resposta)
Fluxo de Autenticação		
Registro de Cliente	POST /auth/register/client	RegisterClientDto / AuthResponseDto
Login	POST /auth/login	LoginDto / AuthResponseDto
Gerenciamento de Usuário/Perfil		
Obter Perfil do Usuário	GET /users/me	UserProfileDto
Atualizar Perfil do Cliente	PATCH /clients/me	UpdateClientProfileDto / ClientEntity
Fluxo do Cliente		
Buscar Provedores/Serviços	GET /search	SearchQueryDto / SearchResultDto
Criar Agendamento	POST /bookings	CreateBookingDto / BookingDetailsDto
Criar Cobrança PIX	POST /payments/pix-charge	CreatePixChargeDto / PixChargeResponseDto
Fluxo do Provedor		
Obter Agendamentos do Provedor	GET /bookings/me	BookingDetailsDto[]
Gerenciar Disponibilidade	PATCH /providers/:providerId/availability	UpdateAvailabilityDto[] / AvailabilityDto[]
Fluxo Comum		
Obter Mensagens do Chat	GET /chat/:chatId/messages	GetMessagesDto / Message[]
Enviar Mensagem de Chat	POST /chat/:chatId/messages	SendMessageDto / Message
Enviar Avaliação	POST /reviews	SubmitReviewDto / ReviewEntity
7. Estrutura de Pastas do Projeto
O projeto Cleaning é um monorepo, contendo as pastas para o frontend (LimpeJaApp/) e para o backend (backend-cleaning/). [README.md]

7.1. Estrutura de Pastas (Frontend)

CleaningApp/
├── app/
│   ├── (auth)/ # Fluxo de Autenticação
│   │   ├── api/
│   │   ├── components/
│   │   ├── provider-register/
│   │   │   ├── components/
│   │   │   ├── index.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── personal-details.tsx
│   │   │   └── service-details.tsx
│   │   ├── client-register.tsx
│   │   ├── forgot-password.tsx
│   │   ├── layout.tsx
│   │   ├── login.tsx
│   │   ├── README.md
│   │   ├── register-options.tsx
│   │   └── test-connection.tsx
│   ├── (client)/ # Funcionalidades do Cliente
│   │   ├── bookings/ # Agendamentos do Cliente
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [bookingId].tsx
│   │   │   ├── index.tsx
│   │   │   ├── schedule-service.tsx
│   │   │   └── success.tsx
│   │   ├── explore/ # Explorar Serviços/Profissionais
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── data/
│   │   │   ├── styles/
│   │   │   ├── [providerId].tsx
│   │   │   ├── index.tsx
│   │   │   ├── resultados-busca.tsx
│   │   │   ├── search-results.tsx
│   │   │   ├── servicos-por-categoria.tsx
│   │   │   ├── todas-categorias.tsx
│   │   │   └── todos-prestadores-proximos.tsx
│   │   ├── messages/ # Mensagens do Cliente
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [chatId].tsx
│   │   │   └── index.tsx
│   │   ├── ofertas/ # Ofertas do Cliente
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   └── [ofertaId].tsx
│   │   └── profile/ # Perfil do Cliente
│   │       ├── api/
│   │       ├── components/
│   │       ├── edit.tsx
│   │       ├── index.tsx
│   │       ├── layout.tsx
│   │       └── layout.tsx
│   ├── (common)/ # Funcionalidades Comuns (cliente e provedor)
│   │   ├── api/
│   │   ├── components/
│   │   ├── feedback/
│   │   │   └── [targetId].tsx
│   │   ├── help.tsx
│   │   ├── layout.tsx
│   │   ├── notifications.tsx
│   │   ├── privacidade.tsx
│   │   ├── README.md
│   │   ├── settings.tsx
│   │   └── termos.tsx
│   ├── (provider)/ # Funcionalidades do Provedor
│   │   ├── api/
│   │   ├── components/
│   │   ├── messages/ # Mensagens do Provedor
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [chatId].tsx
│   │   │   └── index.tsx
│   │   ├── profile/ # Perfil do Provedor
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── edit-services.tsx
│   │   │   └── index.tsx
│   │   ├── schedule/ # Agenda/Disponibilidade do Provedor
│   │   │   ├── api/
│   │   │   └── components/
│   │   │   └── index.tsx
│   │   ├── services/ # Serviços/Solicitações do Provedor
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [serviceId].tsx
│   │   │   └── index.tsx
│   │   ├── dashboard.tsx
│   │   ├── earnings.tsx
│   │   ├── layout.tsx
│   │   ├── README.md
│   │   └── services/
│   │       ├── authService.ts
│   │       └── clientService.ts
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── doc.md
│   ├── index.tsx
│   ├── README.md
│   └── welcome.tsx
├── assets/ # Recursos estáticos
│   ├── fonts/
│   ├── images/
│   └── lottie/
├── components/ # Componentes de UI verdadeiramente reutilizáveis e atômicos (globais)
│   ├── layout/
│   └── ui/
├── config/
│   ├── AppConfig.ts
│   ├── firebase.ts
│   └── firebaseClient.ts
├── constants/
│   ├── Colors.ts
│   ├── routes.ts
│   ├── strings.ts
│   └── theme.ts
├── contexts/
│   ├── AppContext.tsx
│   ├── AuthContext.tsx
│   └── ProviderRegistrationContext.tsx
├── documentation/
├── hooks/
│   ├── useAuth.ts
│   ├── useColorScheme.ts
│   ├── useColorScheme.web.ts
│   ├── useFormValidation.ts
│   └── useThemeColor.ts
├── node_modules/
├── scripts/
│   └── reset-project.js
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── clientService.ts
│   ├── firebaseConfig.ts
│   ├── paymentService.ts
│   └── providerService.ts
├── types/
│   ├── auth.ts
│   ├── booking.ts
│   ├── index.ts
│   ├── navigation.ts
│   ├── provider.ts
│   ├── service.ts
│   ├── types.ts
│   └── user.ts
├── utils/
│   ├── helpers.ts
│   ├── permissions.ts
│   └── storage.ts
├── .env
├── .gitignore
├── app.json
├── babel.config.js
├── eas.json
├── eslint.config.js
├── expo-env.d.ts
├── LICENSE
├── metro.config.js
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json


7.2. Estrutura de Pastas (Backend)
backend-cleaning/
├── dist/
├── node_modules/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── availability/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── availability.controller.ts
│   │   ├── availability.module.ts
│   │   └── availability.service.ts
│   ├── bookings/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── bookings.controller.ts
│   │   ├── bookings.module.ts
│   │   └── bookings.service.ts
│   ├── chat/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── gateway/
│   │   ├── chat.controller.ts
│   │   ├── chat.module.ts
│   │   └── chat.service.ts
│   ├── clients/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── clients.controller.ts
│   │   ├── clients.module.ts
│   │   └── clients.service.ts
│   ├── common/
│   │   ├── constants/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── config/
│   │   ├── config.module.ts
│   │   ├── configuration.ts
│   │   └── validation-schema.ts
│   ├── notifications/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── notifications.controller.ts
│   │   ├── notifications.module.ts
│   │   └── notifications.service.ts
│   ├── offers/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── offers.controller.ts
│   │   ├── offers.module.ts
│   │   └── offers.service.ts
│   ├── payments/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── payments.controller.ts
│   │   ├── payments.module.ts
│   │   └── payments.service.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── provider-services/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── provider-services.controller.ts
│   │   ├── provider-services.module.ts
│   │   └── provider-services.service.ts
│   ├── providers/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── providers.controller.ts
│   │   ├── providers.module.ts
│   │   └── providers.service.ts
│   ├── reviews/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── reviews.controller.ts
│   │   ├── reviews.module.ts
│   │   └── reviews.service.ts
│   ├── search/
│   │   ├── dto/
│   │   ├── search.controller.ts
│   │   ├── search.module.ts
│   │   └── search.service.ts
│   └── services/
│       ├── dto/
│       ├── update-service.dto.ts
│       ├── entities/
│       ├── services.controller.ts
│       ├── services.module.ts
│       └── services.service.ts
├── shared/
│   ├── enums/
│   ├── interfaces/
│   └── types/
├── users/
│   ├── dto/
│   ├── entities/
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── app.controller.spec.ts
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── main.ts
└── test/
├── .env
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── package-lock.json
├── package.json
├── README.md
├── src.rar
├── tsconfig.build.json
└── tsconfig.json



8. Desafios e Estratégias de Mitigação
8.1. Controle de Qualidade e Consistência do Serviço
Desafio: Garantir a consistência da qualidade do serviço em uma rede descentralizada de prestadores independentes. A qualidade inconsistente leva à rotatividade de usuários. [Análise Estratégica]

Mitigação: Implementar um processo rigoroso de verificação para prestadores, usar um sistema robusto de avaliação e classificação, considerar um sistema de prestadores em camadas ou um programa "Cleaning Certificado", e fornecer diretrizes de serviço claras e recursos de treinamento opcionais. [Análise Estratégica]

Tabela 1: Comparativo de Mecanismos de Controle de Qualidade (Cleaning vs. Referências de Mercado)

Característica/Mecanismo	Cleaning (Atual - Documentação)	Parafuzo (App Referência)	Triider (App Referência)	Maria Brasileira (Franquia Referência)	Padrões de Adm. Pública (Ideal)	Implicação/Recomendação para Cleaning
Processo de Cadastro/Vetting	Coleta dados pessoais, de serviço, endereço, upload de foto de perfil.	Exige 3 avaliações para aprovação definitiva, cancelamento por média <4.6.	Cadastro extenso, prova de experiência, referências.	Plataforma de verificação profissional.	Profissionais com CBO, qualificados, com EPIs e uniformes.	Reforçar verificação de identidade/antecedentes (se legalmente permitido), prova de experiência.
Sistema de Avaliação	Invoca submitReview e onReviewCreatedUpdateProviderRating (cliente avalia provedor).	Avaliações recíprocas (cliente e profissional), média das últimas 100 avaliações.	Não especificado detalhadamente, mas há avaliações.	Sistema de gestão proprietário para monitoramento de satisfação.	ANS com indicadores de sujeira/manchas, qualidade de produtos, etc.	Implementar avaliações recíprocas. Permitir que profissionais respondam/contestem avaliações.
Treinamento de Profissionais	Não especificado na documentação.	Não especificado detalhadamente, mas há programa de categorias.	Não especificado.	Treinamento contínuo para franqueados e equipes.	Treinamento periódico em segurança, higiene, redução de resíduos.	Desenvolver programa de treinamento online (técnicas, segurança, atendimento).
Suporte ao Profissional	Não especificado na documentação.	Não especificado detalhadamente.	Não especificado.	Suporte administrativo completo, consultoria especializada.	Fiscalização e acompanhamento direto.	Criar canal de suporte dedicado e talvez um fórum/comunidade.
Transparência de Critérios	Não especificado detalhadamente.	Critérios de cancelamento por média de avaliação.	Não especificado.	Não especificado.	Critérios claros para qualidade e produtividade (m²/h).	Publicar critérios claros para avaliações e desempenho.
Resolução de Conflitos	Não especificado na documentação.	Não especificado detalhadamente; exclusão unilateral.	Não especificado.	Departamento de Sucesso do Cliente, ouvidoria e suporte jurídico.	Inspeção e controle da administração, poder de substituição.	Estabelecer um processo claro de resolução de conflitos e mediação.
Incentivos de Qualidade	Não especificado na documentação.	Isenção de taxa para média 4.9+, programa de Categorias (ouro, prata, bronze).	Não especificado.	Não especificado.	Não aplicável diretamente, mas há bonificações por desempenho.	Implementar sistema de "badges" ou "níveis" com benefícios (prioridade, taxas reduzidas).
8.2. Aquisição e Retenção de Prestadores
Desafio: Altos custos associados à aquisição de prestadores e à retenção em uma economia gig competitiva. Prestadores podem abandonar a plataforma se o trabalho for inconsistente ou a remuneração percebida como baixa. [Análise Estratégica]

Mitigação: Otimizar o funil de integração, oferecer incentivos competitivos de integração, priorizar volume de trabalho consistente, fomentar comunidade de prestadores e oferecer canais de suporte. Explorar serviços de valor agregado para prestadores. [Análise Estratégica]

8.3. Pressão de Preços e Saturação do Mercado
Desafio: A intensa concorrência e a saturação do mercado em algumas áreas podem levar à pressão sobre os preços, dificultando a manutenção da lucratividade. [Análise Estratégica]

Mitigação: Diferenciar-se por qualidade de serviço superior, recursos exclusivos ou foco em nicho. Implementar modelos de precificação dinâmica. Explorar serviços de valor agregado ou níveis premium para usuários. [Análise Estratégica]

8.4. Riscos Regulatórios e de Classificação Trabalhista
Desafio: Navegar por regulamentações complexas da economia gig e a possível classificação incorreta de contratados independentes como funcionários, especialmente no Brasil com suas leis trabalhistas específicas (PEC das Domésticas). [Análise Estratégica]

Mitigação: Consultar especialistas jurídicos para garantir conformidade. Definir claramente a relação de contratado independente. Defender regulamentações claras da economia gig. Considerar oferta de benefícios opcionais ou caminhos de formalização que não comprometam o status de contratado independente. [Análise Estratégica]

9. Estratégia de Monetização: Análise Aprofundada da Comissão de 20%
9.1. Viabilidade da Taxa de Comissão de 20%
As taxas de comissão da indústria para plataformas semelhantes variam de 15% a 30%. Os 20% do Cleaning estão dentro dessa faixa, posicionando-o como competitivo. A viabilidade depende de atingir volume de transações e valor médio de serviço suficientes para cobrir custos operacionais e gerar lucro. [Análise Estratégica]

9.2. Impacto nos Prestadores de Serviço
A comissão de 20% significa que os prestadores ganham 80% da taxa de serviço. Isso deve ser percebido como uma compensação justa pelo seu trabalho, considerando seus próprios custos e o valor que o Cleaning oferece. A retenção de prestadores é altamente dependente de remuneração justa e trabalho consistente. [Análise Estratégica]

9.3. Impacto nos Usuários e Estratégia de Preços
A comissão de 20% é tipicamente oculta do usuário, incorporada no preço do serviço. O Cleaning deve garantir que seus preços finais de serviço permaneçam competitivos enquanto cobrem a comissão e fornecem valor. [Análise Estratégica]

9.4. Modelos de Monetização Alternativos e Complementares
Considerar a exploração de fluxos de receita adicionais à medida que a plataforma amadurece:

Modelos de Assinatura: Para usuários frequentes.
Recursos Premium para Prestadores: Listagem preferencial, análises, ferramentas avançadas.
Taxas de Geração de Leads: Para leads específicos de alto valor.
Publicidade: Para marcas de produtos de limpeza ou serviços relacionados. [Análise Estratégica]
Tabela 2: Análise de Sensibilidade do Modelo de Monetização (Comissão de 20%)

Cenário	Nº de Reservas Mensais	Custo Médio do Serviço (R$)	Receita Bruta por Reserva (R$)	Comissão Cleaning (20%) (R$)	Receita Mensal Total de Comissão (R$)	Custos Operacionais Mensais Estimados (R$)	Lucro/Prejuízo Líquido Mensal (R$)	Nº de Prestadores Necessários (Estimado)
Baixo Volume	100	300	300	60	6.000	10.000	(4.000)	10
Volume Médio	500	300	300	60	30.000	15.000	15.000	50
Alto Volume	1.500	300	300	60	90.000	25.000	65.000	150
Alto Volume (Serviço Premium)	1.000	500	500	100	100.000	20.000	80.000	100
10. Recomendações Estratégicas para Lançamento, Crescimento e Otimização
10.1. Estratégia de Lançamento Fases
Uma abordagem faseada minimiza o risco e permite o desenvolvimento ágil:

Fase Piloto (MVP): Lançar em uma área urbana específica para testar o modelo e coletar feedback.
Fase de Crescimento Inicial: Expandir para bairros ou cidades adjacentes, aproveitando as lições aprendidas. [Análise Estratégica]
10.2. Recomendações de Marketing e Branding
O marketing eficaz é crucial para impulsionar a adoção:

Campanhas Digitais Direcionadas: Utilizar mídias sociais, marketing de busca e SEO local.
Programas de Referência: Implementar fortes incentivos de referência.
Marketing de Conteúdo: Criar conteúdo valioso (dicas de limpeza, destaques de prestadores).
Parcerias: Colaborar com empresas locais, agentes imobiliários. [Análise Estratégica]
10.3. Melhoria Contínua e Otimização
O mercado é dinâmico, e a melhoria contínua é essencial:

Análise de Dados: Implementar análises robustas para rastrear KPIs.
Loops de Feedback: Estabelecer canais claros para feedback de usuários e prestadores.
Atualizações Tecnológicas: Aprimorar continuamente os recursos do aplicativo e a eficiência do backend. [Análise Estratégica]
Tabela 3: Indicadores Chave de Desempenho (KPIs) para a Saúde da Plataforma

Categoria	KPI	Definição	Meta/Referência	Frequência de Medição
Saúde do Marketplace	Número de Usuários Ativos	Usuários que fizeram pelo menos 1 reserva no mês	Crescimento de 10-15% M/M	Mensal
Número de Prestadores Ativos	Prestadores que aceitaram pelo menos 1 trabalho no mês	Crescimento de 5-10% M/M	Mensal
Taxa de Conversão de Reserva	% de visitas ao app que resultam em reserva	>5%	Semanal
Métricas de Usuário	Taxa de Retenção de Usuários	% de usuários que repetem a reserva em X meses	>60% (3 meses)	Mensal
Custo de Aquisição de Cliente (CAC)	Custo médio para adquirir um novo usuário	< R$ 50	Mensal
Valor de Vida Útil do Cliente (CLTV)	Receita total esperada de um usuário ao longo do tempo	> 3x CAC	Mensal
Net Promoter Score (NPS)	Mede a probabilidade de um usuário recomendar o Cleaning	> 50	Trimestral
Métricas de Prestador	Taxa de Rotatividade de Prestadores	% de prestadores que param de aceitar trabalhos	< 15% M/M	Mensal
Custo de Aquisição de Prestador (PAC)	Custo médio para integrar um novo prestador	< R$ 100	Mensal
Satisfação do Prestador	Pesquisas e feedback sobre a experiência na plataforma	Média > 4.0/5.0	Mensal
Métricas Financeiras	Receita Recorrente Mensal (MRR)	Receita total de comissão em um mês	Crescimento de 15-20% M/M	Mensal
Margem Bruta de Comissão	(Receita de Comissão - Custos Diretos) / Receita de Comissão	> 70%	Mensal
Ponto de Equilíbrio	Número de reservas/receita para cobrir custos	Definir meta de tempo	Mensal
Métricas de Qualidade	Avaliação Média do Serviço	Média das classificações dos usuários para os serviços	> 4.5/5.0	Diário/Semanal
Tempo de Resolução de Disputas	Tempo médio para resolver reclamações/disputas	< 24 horas	Semanal
% de Serviços Concluídos	% de reservas aceitas que são concluídas com sucesso	> 98%	Mensal
10.4. Conformidade Legal e Operacional (Específico do Brasil)
Operar no Brasil exige atenção específica ao seu ambiente regulatório único:

Compreender e cumprir rigorosamente as leis trabalhistas brasileiras, particularmente a "PEC das Domésticas".
Aproveitar os métodos de pagamento locais como o Pix para transações contínuas. [Análise Estratégica]
11. Conclusão
O Cleaning possui uma base técnica sólida e uma documentação detalhada, que são ativos valiosos para seu desenvolvimento contínuo. O mercado brasileiro de serviços sob demanda e limpeza apresenta oportunidades significativas, impulsionadas pela crescente demanda por conveniência, qualidade e especialização. No entanto, o aplicativo também enfrenta desafios consideráveis relacionados à gestão da qualidade dos profissionais, à alta rotatividade, ao cenário regulatório em evolução e à necessidade de transparência na precificação. [README.md, Análise Estratégica]

Ao refinar sua documentação técnica, tornando-a mais clara e completa, e ao implementar as recomendações estratégicas de produto e mercado, o Cleaning pode não apenas superar essas barreiras, mas também se posicionar como um player diferenciado e confiável. A chave para o sucesso a longo prazo reside na capacidade de equilibrar a inovação tecnológica com uma atenção profunda às necessidades e expectativas humanas, tanto dos clientes que buscam um serviço de excelência quanto dos prestadores que buscam um ambiente de trabalho justo e valorizado. [README.md, Análise Estratégica]

12. Recursos e Suporte
Para informações detalhadas e suporte sobre as tecnologias e o ecossistema do projeto Cleaning, consulte os seguintes recursos oficiais: [README.md, doc.md]

Documentação NestJS
Documentação React Native
Documentação Expo Router
Documentação Prisma ORM
Documentação Socket.IO
Documentação Passport.js
Documentação OpenAPI (Swagger)
Documentação Joi (Validação)
Documentação PostgreSQL
Documentação Expo
13. Como Começar (Setup Local)
Para configurar e rodar o projeto localmente, siga os passos abaixo: [README.md]

Pré-requisitos
Certifique-se de ter as seguintes ferramentas instaladas:

Node.js (versão LTS recomendada)
npm ou Yarn
Git
Docker (para rodar o PostgreSQL localmente)
Expo CLI (npm install -g expo-cli) [README.md]
Instalação
Clone o repositório:
bash

Copiar
git clone https://github.com/techleadevelopers/limpe-ja-app.git
cd limpe-ja-app
Instale as dependências do Frontend:
bash

Copiar
cd LimpeJaApp
npm install # ou yarn install
cd ..
Instale as dependências do Backend:
bash

Copiar
cd backend-cleaning
npm install # ou yarn install
cd ..
Configure o banco de dados (PostgreSQL com Docker):
Crie um arquivo .env na raiz da pasta backend-cleaning com as variáveis de ambiente do banco de dados. Exemplo:

Copiar
DATABASE_URL="postgresql://user:password@localhost:5432/cleaning_db"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRATION_TIME="1h"
Suba o container Docker do PostgreSQL:
bash

Copiar
docker-compose up -d postgres # Assumindo que você tem um docker-compose.yml configurado para o postgres
Execute as migrações do Prisma para criar o esquema do banco de dados:
bash

Copiar
cd backend-cleaning
npx prisma migrate dev --name init
npx prisma generate
cd ..
``` [README.md]
Rodando Localmente
Inicie o Backend:
bash

Copiar
cd backend-cleaning
npm run start:dev # ou yarn start:dev
O backend estará disponível em http://localhost:3000 (ou na porta configurada). [README.md]
Inicie o Frontend:
Abra um novo terminal.
bash

Copiar
cd LimpeJaApp
npx expo start
Isso abrirá o Metro Bundler. Você pode escanear o QR code com o aplicativo Expo Go no seu celular, ou usar um emulador/simulador Android Studio Emulator / iOS Simulator. [README.md]
Gerando um APK para Teste (Android)
Para gerar um APK de teste para Android, você pode usar o EAS Build:

Certifique-se de estar logado no Expo: expo login
Na pasta LimpeJaApp, execute:
bash

Copiar
eas build --platform android --profile development
Isso iniciará um processo de build na nuvem da Expo. Ao final, você receberá um link para baixar o APK. [README.md]
