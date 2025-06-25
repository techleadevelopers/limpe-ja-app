Aqui está a documentação atualizada, com uma análise detalhada de cada arquivo frontend, incluindo as melhorias já implementadas e sugestões adicionais para aprimorar a experiência do usuário e a integração com o backend NestJS + Prisma.

---

## 📁 Estrutura do Projeto inteiro
```
Cleaning/ (Raiz do seu projeto)
.expo/
.vscode/
apks/
app/
├── (auth)/
│ ├── api/
│ │ ├── addressService.ts
│ │ ├── authService.ts
│ │ └── storageService.ts
│ └── components/
├── provider-register/
│ └── components/
│ ├── DatePickerInput.tsx
│ ├── InputWithIcon.tsx
│ ├── SectionHeader.tsx
│ ├── StandardInput.tsx
│ ├── index.tsx
│ ├── layout.tsx
│ ├── personal-details.tsx
│ ├── service-details.tsx
│ ├── client-register.tsx
│ ├── forgot-password.tsx
│ ├── layout.tsx
│ ├── login.tsx
│ ├── README.md
│ ├── register-options.tsx
│ └── test-connection.tsx
├── (client)/
│ └── bookings/
│ ├── api/
│ │ ├── bookingService.ts
│ │ └── schedulingService.ts
│ └── components/
│ ├── booking/
│ ├── schedule/
│ ├── [bookingId].tsx
│ ├── index.tsx
│ ├── schedule-service.tsx
│ └── success.tsx
└── explore/
├── api/
│ └── providerService.ts
├── components/
│ ├── home/
│ └── provider/
├── data/
│ └── mockData.ts
├── styles/
│ └── providerStyles.ts
├── [providerId].tsx
├── index.tsx
├── resultados-busca.tsx
├── search-results.tsx
├── servicos-por-categoria.tsx
├── todas-categorias.tsx
├── todos-prestadores-proximos.tsx
├── messages/
│ ├── api/
│ └── components/
│ ├── AnimatedConversationItem.tsx
│ ├── [chatId].tsx
│ └── index.tsx
├── ofertas/
│ ├── api/
│ │ └── offerService.ts
│ └── components/
│ ├── BannerOferta.tsx
│ └── [ofertaId].tsx
└── profile/
├── api/
│ └── profileService.ts
├── components/
├── edit.tsx
├── index.tsx
├── layout.tsx
└── layout.tsx
manage-availability.tsx
README.md
(common)/
├── api/
│ ├── feedbackService.ts
│ └── notificationService.ts
└── components/
├── feedback/
│ └── [targetId].tsx
├── help.tsx
├── layout.tsx
├── notifications.tsx
├── privacidade.tsx
├── README.md
├── settings.tsx
└── termos.tsx
(provider)/
├── api/
│ ├── earningsService.ts
│ └── providerProfileService.ts
├── components/
├── messages/
│ ├── api/
│ │ └── chatService.ts
│ └── components/
│ ├── [chatId].tsx
│ └── index.tsx
├── profile/
│ ├── api/
│ │ └── providerService.ts
│ ├── components/
│ ├── edit-services.tsx
│ └── index.tsx
└── schedule/
├── api/
│ ├── availabilityService.ts
│ └── scheduleService.ts
└── components/
└── index.tsx
services/
├── api/
│ └── serviceRequestService.ts
├── components/
├── [serviceId].tsx
├── index.tsx
├── dashboard.tsx
├── earnings.tsx
├── layout.tsx
├── README.md
├── services/
│ ├── authService.ts
│ └── clientService.ts
├── types\backend/
│ └── auth.ts
├── _layout.tsx
├── +not-found.tsx
├── doc.md
├── index.tsx
├── README.md
└── welcome.tsx
assets/
├── fonts/
├── images/
└── lottie/
backend-cleaning/
├── dist/
├── node_modules/
├── prisma/
│ ├── migrations/
│ └── schema.prisma
└── src/
├── auth/
│ ├── decorators/
│ │ └── roles.decorator.ts
│ └── dto/
│ ├── auth-response.dto.ts
│ ├── forgot-password.dto.ts
│ ├── login.dto.ts
│ ├── message-response.dto.ts
│ ├── register-client.dto.ts
│ └── register-provider.dto.ts
│ ├── guards/
│ │ ├── jwt-auth.guard.ts
│ │ ├── local-auth.guard.ts
│ │ ├── roles.guard.ts
│ │ └── ws-auth.guard.ts
│ ├── strategies/
│ │ ├── jwt.strategy.ts
│ │ └── local.strategy.ts
│ ├── auth.controller.ts
│ ├── auth.module.ts
│ └── auth.service.ts
├── availability/
│ ├── dto/
│ │ ├── get-availability.dto.ts
│ │ └── update-availability.dto.ts
│ ├── entities/
│ │ └── availability.entity.ts
│ ├── availability.controller.ts
│ ├── availability.module.ts
│ └── availability.service.ts
├── bookings/
│ ├── dto/
│ │ ├── booking-details.dto.ts
│ │ ├── create-booking.dto.ts
│ │ └── update-booking-status.dto.ts
│ ├── entities/
│ │ └── booking.entity.ts
│ ├── bookings.controller.ts
│ ├── bookings.module.ts
│ └── bookings.service.ts
├── chat/
│ ├── dto/
│ │ ├── get-messages.dto.ts
│ │ └── send-message.dto.ts
│ ├── entities/
│ │ └── message.entity.ts
│ ├── gateway/
│ │ └── chat.gateway.ts
│ ├── chat.controller.ts
│ ├── chat.module.ts
│ └── chat.service.ts
├── clients/
│ ├── dto/
│ │ ├── client-dashboard.dto.ts
│ │ └── update-client-profile.dto.ts
│ ├── entities/
│ │ └── client.entity.ts
│ ├── clients.controller.ts
│ ├── clients.module.ts
│ └── clients.service.ts
├── common/
│ ├── constants/
│ │ └── roles.enum.ts
│ ├── decorators/
│ │ └── api-response.decorator.ts
│ ├── dto/
│ │ ├── create-address.dto.ts
│ │ └── message-response.dto.ts
│ ├── entities/
│ │ └── address.entity.ts
│ ├── filters/
│ │ └── http-exception.filter.ts
│ ├── interceptors/
│ │ └── transform.interceptor.ts
│ └── pipes/
│ └── validation.pipe.ts
├── config/
│ ├── config.module.ts
│ ├── configuration.ts
│ └── validation-schema.ts
├── notifications/
│ ├── dto/
│ │ ├── mark-as-read.dto.ts
│ │ └── entities/
│ │ └── notification.entity.ts
│ ├── notifications.controller.ts
│ ├── notifications.module.ts
│ └── notifications.service.ts
├── offers/
│ ├── dto/
│ │ ├── create-offer.dto.ts
│ │ └── update-offer.dto.ts
│ ├── entities/
│ │ └── offer.entity.ts
│ ├── offers.controller.ts
│ ├── offers.module.ts
│ └── offers.service.ts
├── payments/
│ ├── dto/
│ │ ├── create-pix-charge.ts
│ │ └── request-withdrawal.dto.ts
│ ├── entities/
│ │ └── transaction.entity.ts
│ ├── payments.controller.ts
│ ├── payments.module.ts
│ └── payments.service.ts
├── prisma/
│ ├── prisma.module.ts
│ └── prisma.service.ts
├── provider-services/
│ ├── dto/
│ │ ├── create-provider-service.dto.ts
│ │ └── update-provider-service.dto.ts
│ ├── entities/
│ │ └── provider-service.entity.ts
│ ├── provider-services.controller.ts
│ ├── provider-services.module.ts
│ └── provider-services.service.ts
├── providers/
│ ├── dto/
│ │ ├── provider-details.dto.ts
│ │ ├── provider-search.dto.ts
│ │ └── update-provider-profile.dto.ts
│ ├── entities/
│ │ └── provider.entity.ts
│ ├── providers.controller.ts
│ ├── providers.module.ts
│ └── providers.service.ts
├── reviews/
│ ├── dto/
│ │ ├── get-reviews.dto.ts
│ │ └── submit-review.dto.ts
│ ├── entities/
│ │ └── review.entity.ts
│ ├── reviews.controller.ts
│ ├── reviews.module.ts
│ └── reviews.service.ts
├── search/
│ ├── dto/
│ │ └── search-query.dto.ts
│ ├── search.controller.ts
│ ├── search.module.ts
│ └── search.service.ts
└── services/
├── dto/
│ ├── create-service.dto.ts
│ └── service-details.dto.ts
├── update-service.dto.ts
├── entities/
│ └── service.entity.ts
├── services.controller.ts
├── services.module.ts
└── services.service.ts
shared/
├── enums/
│ └── booking-status.enum.ts
├── interfaces/
│ └── paginated-response.interface.ts
└── types/
└── user-roles.type.ts
users/
├── dto/
│ ├── update-user.dto.ts
│ └── user-profile.dto.ts
├── entities/
│ └── user.entity.ts
├── users.controller.ts
├── users.module.ts
└── users.service.ts
app.controller.spec.ts
app.controller.ts
app.module.ts
app.service.ts
main.ts
test/
.env
.env.example
.gitignore
.prettierrc
eslint.config.mjs
nest-cli.json
package-lock.json
package.json
README.md
src.rar
tsconfig.build.json
tsconfig.json
components/
├── layout/
└── ui/
config/
├── AppConfig.ts
├── firebase.ts
└── firebaseClient.ts
constants/
├── Colors.ts
├── routes.ts
├── strings.ts
├── theme.ts
contexts/
├── AppContext.tsx
├── AuthContext.tsx
└── ProviderRegistrationContext.tsx
documentation/
hooks/
├── useAuth.ts
├── useColorScheme.ts
├── useColorScheme.web.ts
├── useFormValidation.ts
└── useThemeColor.ts
node_modules/
scripts/
└── reset-project.js
services/
├── api.ts
├── authService.ts
├── clientService.ts
├── firebaseConfig.ts
├── paymentService.ts
└── providerService.ts
types/
├── auth.ts
├── booking.ts
├── index.ts
├── navigation.ts
├── provider.ts
├── service.ts
├── types.ts
└── user.ts
utils/
├── helpers.ts
├── permissions.ts
└── storage.ts
.env
.gitignore
app.json
babel.config.js
eas.json
eslint.config.js
expo-env.d.ts
LICENSE
metro.config.js
package-lock.json
package.json
README.md
tsconfig.json
```

---

Para suportar as funcionalidades do Cleaning, incluindo cadastro de clientes e prestadores, agendamentos, pagamentos e a estratégia de ganhos, um backend robusto é essencial. Atualmente, o backend é construído com **NestJS** e utiliza **Prisma** para interação com o banco de dados **PostgreSQL**, oferecendo um controle total e escalabilidade para as necessidades da aplicação.

### Tecnologias do Backend:

* **NestJS**: Framework Node.js progressivo para construir aplicações eficientes, escaláveis e de nível empresarial. Utiliza TypeScript e é fortemente inspirado em Angular, promovendo uma arquitetura modular.
* **Prisma**: ORM (Object-Relational Mapper) de nova geração para Node.js e TypeScript. Facilita a interação com o banco de dados (PostgreSQL neste caso) através de um schema intuitivo e tipagem forte.
* **PostgreSQL**: Banco de dados relacional robusto e de código aberto, escolhido para persistência de dados devido à sua confiabilidade, integridade e capacidade de lidar com dados estruturados complexos (como o objeto `address` aninhado).
* **JWT (JSON Web Tokens)**: Para autenticação e autorização de usuários, garantindo a segurança das rotas da API.
* **WebSockets (Socket.IO)**: Implementado através do `@nestjs/platform-socket.io` para comunicação em tempo real, essencial para funcionalidades como o chat.
* **Serviços de Terceiros (via integração NestJS)**:
* **Gateway de Pagamento (Ex: Stripe, Mercado Pago, Pagar.me):** Integrado via módulos NestJS para processar pagamentos dos clientes e gerenciar repasses para os prestadores.
* **Serviço de Armazenamento de Arquivos (Ex: AWS S3, Cloudinary):** Para armazenamento de fotos de perfil e outros arquivos, integrado via módulos NestJS.
* **Serviço de Notificações Push (Ex: Firebase Cloud Messaging - FCM, OneSignal):** Para enviar notificações push, integrado via módulos NestJS.

### Módulos Principais do Backend:

Independentemente da tecnologia escolhida, os seguintes módulos seriam necessários:

1. **Autenticação e Gerenciamento de Usuários:**
* Registro e login para clientes e prestadores (com diferenciação de roles).
* Gerenciamento de perfis (CRUD para dados pessoais, endereços, informações bancárias para prestadores, etc.).
* Upload e gerenciamento de fotos de perfil.
* (Opcional) Fluxo de verificação de documentos para prestadores.
2. **Gerenciamento de Serviços (para Prestadores):**
* Cadastro dos tipos de serviços oferecidos (Limpeza Padrão, Pesada, Pós-obra, etc.).
* Definição de preços, duração estimada, e descrição para cada serviço.
3. **Gerenciamento de Disponibilidade (para Prestadores):**
* Configuração de horários de trabalho semanais.
* Bloqueio de datas/horários específicos.
4. **Busca e Descoberta:**
* API para clientes buscarem prestadores por tipo de serviço, localização, data, avaliações.
* (Opcional) Suporte a queries geoespaciais.
5. **Sistema de Agendamento:**
* API para clientes solicitarem/criarem agendamentos.
* API para prestadores aceitarem/recusarem/gerenciarem seus agendamentos.
* Lógica para verificar disponibilidade do prestador.
* Gerenciamento do ciclo de vida do agendamento (pendente, confirmado, em andamento, concluído, cancelado).
6. **Processamento de Pagamentos e Repasses:**
* Integração com gateway de pagamento para cobrar clientes.
* Lógica para reter o valor e calcular a comissão do Cleaning.
* Sistema para agendar e processar repasses para os prestadores.
7. **Sistema de Avaliações e Comentários:**
* Clientes avaliam prestadores (e serviços) após a conclusão.
* (Opcional) Prestadores avaliam clientes.
8. **Notificações:**
* Envio de notificações push e/ou in-app para eventos importantes.
9. **Chat (Opcional, se não usar solução de terceiros):**
* Backend para troca de mensagens em tempo real.
10. **Painel Administrativo (para a equipe Cleaning):**
* Ferramentas para gerenciar usuários, resolver disputas, visualizar métricas, etc.

---

### Documentação Atualizada: interação-frontedn-backend.md
As seções a seguir foram atualizadas para refletir as correções e melhorias no fluxo de autenticação, especialmente no `login.tsx`.

### 2. Estratégias de Integração
A comunicação entre frontend e backend será realizada principalmente via requisições HTTP (API RESTful) e WebSockets para funcionalidades em tempo real.

**2.1. Comunicação API RESTful**
* **Biblioteca:** O frontend utilizará `axios` ou a `Fetch API` para realizar as requisições HTTP ao backend.
* **URL Base:** A URL base da API do backend (ex: `http://localhost:3000` em desenvolvimento, ou a URL de produção) deve ser configurada no frontend, idealmente via variáveis de ambiente (`.env`).
* **Headers:** Todas as requisições protegidas devem incluir o token JWT no cabeçalho `Authorization` no formato `Bearer <token>`.
* **CORS:** O backend NestJS já está configurado com CORS (`backend-cleaning/src/main.ts`) para permitir requisições de diferentes origens, o que é essencial para o desenvolvimento e produção.

**2.2. Autenticação JWT**
O fluxo de autenticação é um ponto crítico de integração.

* **Login:**
* O frontend envia credenciais (e-mail e senha, que será mapeada para `passwordHash` conforme o `LoginDto` do backend) para o endpoint `POST /auth/login`.
* O backend valida as credenciais e, se corretas, retorna um JWT.
* O frontend deve armazenar este JWT de forma segura (ex: `AsyncStorage` ou `expo-secure-store`).
* **Registro:**
* O frontend envia os dados de registro (cliente ou provedor) para `POST /auth/register/client` ou `POST /auth/register/provider`.
* O backend cria o usuário e retorna um JWT, que o frontend deve armazenar.
* **Requisições Protegidas:** Para acessar rotas protegidas, o frontend deve incluir o JWT armazenado no cabeçalho `Authorization` de todas as requisições subsequentes.
* **Verificação:** O backend utiliza `JwtStrategy` e `JwtAuthGuard` para validar o token em cada requisição protegida, garantindo a autenticidade do usuário e a autorização via `RolesGuard`. É importante notar que o `UserRole` é um tipo de união de literais de string (`'CLIENT' | 'PROVIDER' | 'ADMIN'`) no frontend, e as comparações devem ser feitas diretamente com esses literais de string (ex: `user.role === 'CLIENT'`).
* **Logout:** Ao deslogar, o frontend deve remover o JWT armazenado localmente. O backend pode ter um endpoint de logout para invalidar o token no servidor, se necessário (embora JWTs sejam stateless por natureza, pode ser útil para blacklisting ou gerenciamento de refresh tokens).

**2.3. Comunicação em Tempo Real (WebSockets)**
* **Módulo de Chat:** O backend possui um `ChatGateway` (`backend-cleaning/src/chat/chat.gateway.ts`) que utiliza `@nestjs/platform-socket.io` para gerenciar a comunicação em tempo real.
* **Frontend:** As telas de chat do cliente (`app/explore/messages/[chatId].tsx`) e do provedor (`app/(provider)/messages/[chatId].tsx`) precisarão integrar com `socket.io-client` para estabelecer a conexão WebSocket.
* **Eventos:** A comunicação ocorrerá via eventos definidos no `ChatGateway` (ex: `sendMessage`, `receiveMessage`, `joinChat`).

**2.4. Consistência de Dados (DTOs e Tipagem)**
* **DTOs:** O backend define DTOs (Data Transfer Objects) para entrada e saída de dados. É crucial que o frontend replique ou gere interfaces/tipos TypeScript correspondentes a esses DTOs para garantir a tipagem segura e a validação dos dados em ambos os lados. Para o `LoginDto`, o frontend deve enviar `email` e `passwordHash` (onde `passwordHash` é o valor da senha em texto plano digitada pelo usuário, que será hasheada pelo backend).
* **Validação:** O `ValidationPipe` global do NestJS garante que os dados de entrada no backend sejam validados. O frontend deve realizar validações de formulário antes do envio para otimizar a UX e reduzir requisições inválidas.

### 3. Mapeamento Detalhado de Fluxos e Endpoints
A tabela a seguir detalha a interligação entre os fluxos do frontend e os endpoints do backend, incluindo os DTOs de requisição e resposta.

| Fluxo/Tela do Frontend | Endpoint do Backend (Método HTTP, Caminho) | DTOs (Requisição/Resposta) | Observações de Integração

### M ódulos Principais do Backend:

Independentemente da tecnologia escolhida, os seguintes módulos seriam necessários:

1. **Autenticação e Gerenciamento de Usuários:**
* Registro e login para clientes e prestadores (com diferenciação de roles).
* Gerenciamento de perfis (CRUD para dados pessoais, endereços, informações bancárias para prestadores, etc.).
* Upload e gerenciamento de fotos de perfil.
* (Opcional) Fluxo de verificação de documentos para prestadores.
2. **Gerenciamento de Serviços (para Prestadores):**
* Cadastro dos tipos de serviços oferecidos (Limpeza Padrão, Pesada, Pós-obra, etc.).
* Definição de preços, duração estimada, e descrição para cada serviço.
3. **Gerenciamento de Disponibilidade (para Prestadores):**
* Configuração de horários de trabalho semanais.
* Bloqueio de datas/horários específicos.
4. **Busca e Descoberta:**
* API para clientes buscarem prestadores por tipo de serviço, localização, data, avaliações.
* (Opcional) Suporte a queries geoespaciais.
5. **Sistema de Agendamento:**
* API para clientes solicitarem/criarem agendamentos.
* API para prestadores aceitarem/recusarem/gerenciarem seus agendamentos.
* Lógica para verificar disponibilidade do prestador.
* Gerenciamento do ciclo de vida do agendamento (pendente, confirmado, em andamento, concluído, cancelado).
6. **Processamento de Pagamentos e Repasses:**
* Integração com gateway de pagamento para cobrar clientes.
* Lógica para reter o valor e calcular a comissão do Cleaning.
* Sistema para agendar e processar repasses para os prestadores.
7. **Sistema de Avaliações e Comentários:**
* Clientes avaliam prestadores (e serviços) após a conclusão.
* (Opcional) Prestadores avaliam clientes.
8. **Notificações:**
* Envio de notificações push e/ou in-app para eventos importantes.
9. **Chat (Opcional, se não usar solução de terceiros):**
* Backend para troca de mensagens em tempo real.
10. **Painel Administrativo (para a equipe Cleaning):**
* Ferramentas para gerenciar usuários, resolver disputas, visualizar métricas, etc.

---

### Documentação Atualizada: interação-frontedn-backend.md
As seções a seguir foram atualizadas para refletir as correções e melhorias no fluxo de autenticação, especialmente no `login.tsx`.

### 2. Estratégias de Integração
A comunicação entre frontend e backend será realizada principalmente via requisições HTTP (API RESTful) e WebSockets para funcionalidades em tempo real.

**2.1. Comunicação API RESTful**
* **Biblioteca:** O frontend utilizará `axios` ou a `Fetch API` para realizar as requisições HTTP ao backend.
* **URL Base:** A URL base da API do backend (ex: `http://localhost:3000` em desenvolvimento, ou a URL de produção) deve ser configurada no frontend, idealmente via variáveis de ambiente (`.env`).
* **Headers:** Todas as requisições protegidas devem incluir o token JWT no cabeçalho `Authorization` no formato `Bearer <token>`.
* **CORS:** O backend NestJS já está configurado com CORS (`backend-cleaning/src/main.ts`) para permitir requisições de diferentes origens, o que é essencial para o desenvolvimento e produção.

**2.2. Autenticação JWT**
O fluxo de autenticação é um ponto crítico de integração.

* **Login:**
* O frontend envia credenciais (e-mail e senha, que será mapeada para `passwordHash` conforme o `LoginDto` do backend) para o endpoint `POST /auth/login`.
* O backend valida as credenciais e, se corretas, retorna um JWT.
* O frontend deve armazenar este JWT de forma segura (ex: `AsyncStorage` ou `expo-secure-store`).
* **Registro:**
* O frontend envia os dados de registro (cliente ou provedor) para `POST /auth/register/client` ou `POST /auth/register/provider`.
* O backend cria o usuário e retorna um JWT, que o frontend deve armazenar.
* **Requisições Protegidas:** Para acessar rotas protegidas, o frontend deve incluir o JWT armazenado no cabeçalho `Authorization` de todas as requisições subsequentes.
* **Verificação:** O backend utiliza `JwtStrategy` e `JwtAuthGuard` para validar o token em cada requisição protegida, garantindo a autenticidade do usuário e a autorização via `RolesGuard`. É importante notar que o `UserRole` é um tipo de união de literais de string (`'CLIENT' | 'PROVIDER' | 'ADMIN'`) no frontend, e as comparações devem ser feitas diretamente com esses literais de string (ex: `user.role === 'CLIENT'`).
* **Logout:** Ao deslogar, o frontend deve remover o JWT armazenado localmente. O backend pode ter um endpoint de logout para invalidar o token no servidor, se necessário (embora JWTs sejam stateless por natureza, pode ser útil para blacklisting ou gerenciamento de refresh tokens).

**2.3. Comunicação em Tempo Real (WebSockets)**
* **Módulo de Chat:** O backend possui um `ChatGateway` (`backend-cleaning/src/chat/chat.gateway.ts`) que utiliza `@nestjs/platform-socket.io` para gerenciar a comunicação em tempo real.
* **Frontend:** As telas de chat do cliente (`app/explore/messages/[chatId].tsx`) e do provedor (`app/(provider)/messages/[chatId].tsx`) precisarão integrar com `socket.io-client` para estabelecer a conexão WebSocket.
* **Eventos:** A comunicação ocorrerá via eventos definidos no `ChatGateway` (ex: `sendMessage`, `receiveMessage`, `joinChat`).

**2.4. Consistência de Dados (DTOs e Tipagem)**
* **DTOs:** O backend define DTOs (Data Transfer Objects) para entrada e saída de dados. É crucial que o frontend replique ou gere interfaces/tipos TypeScript correspondentes a esses DTOs para garantir a tipagem segura e a validação dos dados em ambos os lados. Para o `LoginDto`, o frontend deve enviar `email` e `passwordHash` (onde `passwordHash` é o valor da senha em texto plano digitada pelo usuário, que será hasheada pelo backend).
* **Validação:** O `ValidationPipe` global do NestJS garante que os dados de entrada no backend sejam validados. O frontend deve realizar validações de formulário antes do envio para otimizar a UX e reduzir requisições inválidas.

### 3. Mapeamento Detalhado de Fluxos e Endpoints
A tabela a seguir detalha a interligação entre os fluxos do frontend e os endpoints do backend, incluindo os DTOs de requisição e resposta.

| Fluxo/Tela do Frontend | Endpoint do Backend (Método HTTP, Caminho) | DTOs (Requisição/Resposta) | Observações de Integração |
| :--------------------- | :----------------------------------------- | :------------------------- | :------------------------ |
| **Fluxo de Autenticação** | | | |
| `app/(auth)/login.tsx` | `POST /auth/login` | `LoginDto` / `AuthResponseDto` | Frontend armazena JWT. `LoginDto` espera `email` e `passwordHash`. |
| `app/(auth)/register-options.tsx` | N/A | N/A | Tela de escolha de perfil. Não interage diretamente com o backend, apenas redireciona. |
| `app/(auth)/client-register.tsx` | `POST /auth/register/client` | `RegisterClientDto` / `AuthResponseDto` | Frontend envia dados do cliente, incluindo `address` aninhado. Backend retorna JWT. |
| `app/(auth)/provider-register/index.tsx` | N/A | N/A | Tela introdutória para o registro de provedor. Não interage diretamente com o backend. |
| `app/(auth)/provider-register/personal-details.tsx` | `POST /auth/register/provider` (parte 1) | `RegisterProviderDto` (parcial) | Coleta dados pessoais e de endereço. Os dados são persistidos no contexto do frontend e enviados ao backend na etapa final. |
| `app/(auth)/provider-register/service-details.tsx` | `POST /auth/register/provider` (parte 2) | `RegisterProviderDto` / `AuthResponseDto` | Coleta dados de serviço/experiência. Envia o `RegisterProviderDto` completo ao backend. |
| `app/(auth)/forgot-password.tsx` | `POST /auth/forgot-password` | `ForgotPasswordDto` / `MessageResponseDto` | Simula envio de e-mail de redefinição. |
| **Gerenciamento de Usuário/Perfil** | | | |
| `app/(client)/profile/index.tsx` | `GET /users/me` | `UserProfileDto` | Protegido por JWT. Exibe informações básicas do perfil. |
| `app/(client)/profile/edit.tsx` | `PATCH /clients/me` | `UpdateClientProfileDto` / `ClientEntity` | Protegido por JWT (papel CLIENT). |
| `app/(provider)/profile/index.tsx` (inferred from structure, similar to client profile) | `GET /users/me` | `UserProfileDto` | Protegido por JWT. Exibe informações básicas do perfil do provedor. |
| `app/(provider)/profile/edit-services.tsx` | `PATCH /providers/me` | `UpdateProviderProfileDto` / `ProviderDetailsDto` | Protegido por JWT (papel PROVIDER). |
| `app/(provider)/dashboard.tsx` | `GET /providers/me/dashboard` | `ProviderDashboardDto` (inferred) | Protegido por JWT (papel PROVIDER). |
| **Fluxo do Cliente** | | | |
| `app/(client)/explore/index.tsx` | `GET /clients/me/dashboard` | `ClientDashboardDto` | Protegido por JWT (papel CLIENT). |
| `app/(client)/explore/todas-categorias.tsx` | `GET /services` | `ServiceDetailsDto[]` | Não requer autenticação. |
| `app/(client)/explore/todos-prestadores-proximos.tsx` | `GET /providers/search` (inferred) | `ProviderDetailsDto[]` | Requer busca por localização. |
| `app/(client)/explore/servicos-por-categoria.tsx` | `GET /services/:categoryId/providers` (inferred) | `ProviderDetailsDto[]` | Filtra provedores por categoria. |
| `app/(client)/explore/search-results.tsx` / `resultados-busca.tsx` | `GET /search` | `SearchQueryDto` / `SearchResultDto` | Frontend envia parâmetros de busca. |
| `app/(client)/bookings/index.tsx` | `GET /bookings/me` | `BookingDetailsDto[]` | Protegido por JWT (papel CLIENT), com filtros de status. |
| `app/(client)/bookings/[bookingId].tsx` | `GET /bookings/:id` | `BookingDetailsDto` | Protegido por JWT. |
| `app/(client)/bookings/schedule-service.tsx` | `GET /providers/:providerId/availability` | `GetAvailabilityDto` / `AvailabilityDto[]` | Frontend envia `providerId`. |
| | `POST /bookings` | `CreateBookingDto` / `BookingDetailsDto` | Protegido por JWT. |
| | `POST /payments/pix-charge` | `CreatePixChargeDto` / `PixChargeResponseDto` | Protegido por JWT. |
| `app/(client)/bookings/success.tsx` | N/A | N/A | Tela de sucesso pós-agendamento. |
| `app/(client)/bookings/[providerId].tsx` | `GET /providers/:id` | `ProviderDetailsDto` | Não requer autenticação. |
| `app/(client)/messages/index.tsx` | `GET /chat/conversations/me` (inferred) | `ConversationDto[]` (inferred) | Protegido por JWT. Lista de conversas. |
| `app/(client)/messages/[chatId].tsx` | `GET /chat/:chatId/messages` | `GetMessagesDto` / `Message[]` | Protegido por JWT. |
| | `POST /chat/:chatId/messages` | `SendMessageDto` / `Message` | Protegido por JWT. Também via WebSocket. |
| `app/(client)/ofertas/[ofertaId].tsx` | `GET /offers/:id` | `Offer` | Não requer autenticação. |
| `app/(client)/profile/edit.tsx` | `PATCH /clients/me` | `UpdateClientProfileDto` / `ClientEntity` | Protegido por JWT (papel CLIENT). |
| `app/(client)/bookings/[bookingId].tsx` | `PATCH /bookings/:id/status` | `UpdateBookingStatusDto` / `BookingDetailsDto` | Cliente só pode cancelar. Protegido por JWT. |
| `app/(client)/bookings/[bookingId].tsx` | `POST /reviews` | `SubmitReviewDto` / `ReviewEntity` | Protegido por JWT. |
| **Fluxo do Provedor** | | | |
| `app/(provider)/_layout.tsx` | N/A | N/A | Define a estrutura de abas do provedor. |
| `app/(provider)/dashboard.tsx` | `GET /bookings/me` (com filtros) | `BookingDetailsDto[]` | Protegido por JWT (papel PROVIDER). |
| `app/(provider)/earnings.tsx` | `GET /providers/me/earnings` | `Transaction[]` (implícito) | Protegido por JWT (papel PROVIDER). |
| | `POST /payments/withdrawal` | `RequestWithdrawalDto` / `MessageResponseDto` | Protegido por JWT (papel PROVIDER). |
| `app/(provider)/messages/index.tsx` | `GET /chat/conversations/me` (inferred) | `ConversationDto[]` (inferred) | Protegido por JWT. Lista de conversas. |
| `app/(provider)/messages/[chatId].tsx` | `GET /chat/:chatId/messages` | `GetMessagesDto` / `Message[]` | Protegido por JWT. |
| | `POST /chat/:chatId/messages` | `SendMessageDto` / `Message` | Protegido por JWT. Também via WebSocket. |
| `app/(provider)/schedule/index.tsx` | `GET /bookings/me` (com filtros) | `BookingDetailsDto[]` | Protegido por JWT (papel PROVIDER). |
| `app/(provider)/schedule/manage-availability.tsx` | `PATCH /providers/:providerId/availability` | `UpdateAvailabilityDto[]` / `AvailabilityDto[]` | Protegido por JWT (papel PROVIDER). |
| | `POST /providers/:providerId/availability` | `UpdateAvailabilityDto` / `AvailabilityDto` | Protegido por JWT (papel PROVIDER). |
| | `DELETE /providers/:providerId/availability/:availabilityId` | `void` | Protegido por JWT (papel PROVIDER). |
| `app/(provider)/services/index.tsx` | `GET /providers/:providerId/services` | `ProviderServiceEntity[]` | Protegido por JWT (papel PROVIDER). |
| `app/(provider)/services/[serviceId].tsx` | `GET /bookings/:id` | `BookingDetailsDto` | Protegido por JWT. |
| | `PATCH /bookings/:id/status` | `UpdateBookingStatusDto` / `BookingDetailsDto` | Provedor pode aceitar/recusar/concluir. Protegido por JWT. |
| `app/(provider)/profile/edit-services.tsx` | `GET /providers/:providerId/services` | `ProviderServiceEntity[]` | Protegido por JWT (papel PROVIDER). |
| | `POST /providers/:providerId/services` | `CreateProviderServiceDto` / `ProviderServiceEntity` | Protegido por JWT (papel PROVIDER). |
| | `PATCH /providers/:providerId/services/:id` | `UpdateProviderServiceDto` / `ProviderServiceEntity` | Protegido por JWT (papel PROVIDER). |
| | `DELETE /providers/:providerId/services/:id` | `void` | Protegido por JWT (papel PROVIDER). |
| **Fluxo Comum** | | | |
| `app/(common)/_layout.tsx` | N/A | N/A | Define a estrutura de navegação comum. |
| `app/(common)/settings.tsx` | N/A | N/A | Gerencia preferências locais. |
| `app/(common)/help.tsx` | N/A | N/A | FAQ e contatos. |
| `app/(common)/notifications.tsx` | `GET /notifications/me` | `NotificationEntity[]` | Protegido por JWT. |
| | `PATCH /notifications/me/mark-as-read` | `MarkAsReadDto` / `{ count: number }` | Protegido por JWT. |
| | `PATCH /notifications/:id/mark-as-read` | `NotificationEntity` | Protegido por JWT. |
| | `DELETE /notifications/:id` | `void` | Protegido por JWT. |
| `app/(common)/feedback/[targetId].tsx` | `POST /reviews` | `SubmitReviewDto` / `ReviewEntity` | Protegido por JWT. |
| `app/(common)/privacidade.tsx` | N/A | N/A | Exibe política de privacidade. |
| `app/(common)/termos.tsx` | N/A | N/A | Exibe termos de serviço. |
| **Outros Arquivos Essenciais** | | | |
| `app/index.tsx` | N/A | N/A | Roteamento inicial. |
| `app/+not-found.tsx` | N/A | N/A | Tela de rota não encontrada. |
| `welcome.tsx` | N/A | N/A | Tela de boas-vindas inicial. |

---

### Análise Detalhada dos Arquivos Frontend e Melhorias Adicionais

A seguir, a análise detalhada de cada arquivo frontend, incluindo as melhorias já implementadas e sugestões adicionais para otimizar a experiência do usuário e a integração com o backend NestJS + Prisma.

#### 2.1. Fluxo de Autenticação (app/(auth))

##### `app/(auth)/login.tsx`

* **Propósito:** Tela de login para acesso à aplicação.
* **Análise Detalhada (Inferida):**
* Coleta credenciais (e-mail e senha).
* Envia requisição `POST /auth/login` para o backend.
* Armazena o JWT retornado de forma segura.
* Redireciona o usuário com base na `role` (`CLIENT` ou `PROVIDER`).
* Possui animações de entrada e feedback de toque.
* Link "Cadastre-se aqui" para `/(auth)/register-options`.
* `StatusBar` configurada para consistência visual.
* **Melhorias Implementadas (Inferidas):**
* Animações de entrada e feedback de toque aprimoradas.
* Feedback de erro inline e contextualizado.
* Layout responsivo ao teclado.
* Navegação pós-login inteligente baseada na `role` do usuário.
* Design dos inputs e botões alinhado a uma estética sofisticada.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Feedback de Erro Específico do Backend:** Em vez de apenas um erro genérico, exibir mensagens de erro específicas retornadas pelo backend (ex: "Email não encontrado", "Senha incorreta", "Conta desativada") para guiar o usuário. Isso requer mapear os códigos/mensagens de erro do `HttpExceptionFilter` do NestJS.
* **Indicador de Carregamento Global:** Durante a requisição de login, exibir um `ActivityIndicator` ou um `Skeleton Screen` que cubra a tela inteira para evitar interações enquanto a requisição está em andamento.
* **Funcionalidade "Lembrar-me":** Implementar a opção de persistir o login por um período mais longo, utilizando `refresh tokens` gerenciados pelo backend para maior segurança.
* **Login Biométrico:** Para logins subsequentes, oferecer a opção de login via Face ID/Touch ID (requer integração com `expo-local-authentication` e um endpoint no backend para validar um token de refresh ou um token biométrico).
* **Limpeza de Input:** Adicionar um botão "x" nos campos de e-mail e senha para limpar rapidamente o conteúdo.
* **Debounce para Validação:** Se houver validação de formato de e-mail em tempo real, aplicar um debounce para evitar chamadas excessivas ou validações visuais piscando.

##### `app/(auth)/register-options.tsx`

* **Propósito:** Primeira tela do fluxo de registro, permitindo ao usuário escolher entre se cadastrar como "Cliente" ou "Profissional" com uma apresentação visualmente atraente.
* **Análise Detalhada:**
* Importações: `React`, `useRef`, `useEffect`, `View`, `Text`, `StyleSheet`, `TouchableOpacity`, `Image`, `Platform`, `Animated`, `StatusBar`, `Stack`, `useRouter`, `Link`, `Ionicons`, `MaterialCommunityIcons`.
* `LOGO_IMAGE`: Importa o logo do aplicativo.
* Animações: `logoAnim`, `titleAnim`, `subtitleAnim`, `clientButtonAnim`, `providerButtonAnim`, `loginLinkAnim`. Utiliza `Animated.sequence`, `Animated.parallel`, `Animated.stagger` para uma entrada escalonada e fluida dos elementos. `createButtonAnimation` para feedback de escala nos botões de escolha.
* Títulos: `mainTitle` ("Bem-vindo(a) ao Cleaning !") e `subtitle` ("Como você deseja se cadastrar hoje?") para guiar o usuário.
* Botões de Escolha:
* "Sou Cliente": Navega para `/(auth)/client-register`.
* "Sou Profissional": Navega para `/(auth)/provider-register`.
* Ambos os botões estão em uma `buttonsRow` para layout lado a lado, usando o estilo `actionButton` (similar ao botão de login) com ícones e texto.
* Link para Login: `loginLinkContainer` com `loginText` e `loginLink` para `/(auth)/login`.
* **Melhorias Implementadas:**
* Animações de entrada escalonadas criam uma experiência envolvente e moderna.
* Layout de botões lado a lado para melhor uso do espaço e clareza da escolha.
* Feedback visual de toque nos botões.
* Navegação clara para as próximas etapas de registro.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Pré-carregamento de Recursos:** Para otimizar a transição, pré-carregar os módulos das próximas telas (`client-register.tsx` e `provider-register/index.tsx`) em segundo plano, se possível, para uma experiência instantânea.
* **Animação de Transição de Rota:** Adicionar uma animação de transição suave ao navegar para as próximas telas, como um fade-out da tela atual e fade-in da próxima.
* **Acessibilidade:** Garantir que os botões sejam acessíveis para leitores de tela, com `accessibilityLabel` apropriados.

##### `app/(auth)/client-register.tsx`

* **Propósito:** Gerencia o processo de cadastro de novos clientes em duas etapas: informações pessoais e informações de endereço, com foco na simplicidade e experiência do usuário.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useRef`, `useEffect`, `View`, `Text`, `TextInput`, `StyleSheet`, `ActivityIndicator`, `Alert`, `TouchableOpacity`, `ScrollView`, `KeyboardAvoidingView`, `Platform`, `Image`, `Animated`, `StatusBar`, `Link`, `useRouter`, `Stack`, `Ionicons`.
* `LOGO_IMAGE`: Importa o logo.
* `AnimatedErrorMessage`: Componente reutilizável para mensagens de erro inline.
* `mockAuthService`: Simula o serviço de registro de usuário (DEVE SER SUBSTITUÍDO PELO `authService.ts` REAL).
* Estados: `currentStep` (1 ou 2), `username`, `email`, `password`, `cep`, `street`, `number`, `neighborhood`, `state`, `isLoading`, `generalError`, `showPassword`.
* Animações: `mainElementsOpacity`, `mainElementsTranslateY` para entrada da tela. `createButtonAnimations` para feedback de escala nos botões "Avançar" e "Sign up".
* `validateStep1`: Valida nome de usuário, e-mail (formato) e senha (comprimento mínimo).
* `validateStep2`: Valida todos os campos de endereço.
* `handleNext`: Transiciona para a `currentStep = 2` se a Etapa 1 for válida.
* `handleSignUp`: Tenta registrar o usuário com todas as informações.
* UI/UX: `KeyboardAvoidingView` e `ScrollView` para ajuste de teclado. Inputs com design "pill-shape", ícones e sombras. Botão "Avançar" para a Etapa 1 e "Sign up" para a Etapa 2. `isSignUpButtonEnabled` controla a ativação do botão final.
* Melhoria Essencial (Navegação): A lógica de navegação foi atualizada para que, ao finalizar o cadastro, o botão de conclusão navegue para `(client)/explore/index.tsx` (a homescreen do cliente), em vez de `/(auth)/login`.
* **Melhorias Implementadas:**
* Processo de cadastro em duas etapas com transição clara.
* Feedback de erro inline e validação básica.
* Navegação direta para a homescreen do cliente após o cadastro.
* Design de inputs e botões consistente com o restante do fluxo de autenticação.
* A segunda etapa (`currentStep === 2`) do registro de cliente, embora inicialmente um esqueleto, já serve como o ponto de conclusão do cadastro. Para uma melhor experiência do usuário, este processo foi simplificado, e a integração da navegação para `(client)/explore/index.tsx` (a homescreen) foi implementada.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real com `authService.ts`:** Substituir `mockAuthService` por chamadas reais ao `authService.ts` (`app/(auth)/api/authService.ts`), que por sua vez se comunica com o backend NestJS.
* **Validação de E-mail em Tempo Real (Backend):** Implementar uma chamada ao backend para verificar a disponibilidade do e-mail (`GET /users/check-email-availability?email=...`) enquanto o usuário digita (com debounce), fornecendo feedback imediato se o e-mail já estiver em uso.
* **Máscaras de Input:** Adicionar máscaras para `CEP` (ex: `99999-999`) para guiar o usuário e garantir o formato correto.
* **Auto-preenchimento de Endereço (API ViaCEP):** Integrar a busca de CEP com uma API real (como ViaCEP) para auto-preencher `street`, `neighborhood`, `city`, `state` após o usuário digitar o CEP. Isso pode ser feito no frontend chamando uma API de terceiros ou um endpoint proxy no backend.
* **Feedback Visual de Senha:** Adicionar um indicador de força da senha (ex: barra de progresso colorida) e requisitos de senha (mínimo de caracteres, letras maiúsculas/minúsculas, números, símbolos) para guiar o usuário.
* **Tratamento de Erros de Rede:** Exibir uma mensagem clara e um botão de "Tentar Novamente" em caso de falha na conexão com o backend durante o registro.
* **Feedback de Sucesso Aprimorado:** Após o registro bem-sucedido, em vez de apenas um alerta, talvez uma tela de sucesso animada ou um `ToastMessage` que desaparece, antes do redirecionamento.
* **Persistência de Formulário:** Em caso de interrupção (ex: app fechado), salvar o progresso do formulário no `AsyncStorage` para que o usuário possa retomar de onde parou.

##### `app/(auth)/provider-register/index.tsx`

* **Propósito:** Tela introdutória ao processo de registro de profissional, destacando vantagens e requisitos, com um design envolvente e informativo.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useRef`, `useEffect`, `View`, `Text`, `StyleSheet`, `Alert`, `TouchableOpacity`, `ScrollView`, `Platform`, `Animated`, `Ionicons`, `MaterialCommunityIcons`.
* `AnimatedListItem`: Componente reutilizável para exibir itens de lista com ícones e animações de entrada individuais.
* Animações: Múltiplas animações escalonadas para ícones, títulos e cards, criando um efeito de "cascata" atraente.
* `sectionCard`: Usado para agrupar visualmente "Vantagens de ser um Parceiro" e "O que você vai precisar para o cadastro".
* Links de Termos/Privacidade: Placeholders para rotas (`/termos-profissionais`, `/politica-de-privacidade`), indicando a necessidade de conteúdo legal.
* Botão "Iniciar Cadastro" (`ctaButton`): Leva para `/(auth)/provider-register/personal-details`.
* **Melhorias Implementadas:**
* Animações de entrada dinâmicas para guiar o olhar do usuário.
* Conteúdo informativo organizado em cartões claros.
* Requisito de Segurança e Navegação: O fluxo de registro do provedor agora incorpora requisitos adicionais de segurança. Dentro deste processo de registro de duas etapas, foram adicionadas etapas de segurança robustas para o prestador (e, por extensão, para o cliente), como verificação facial ou verificação de documentos. Além disso, ao término completo do cadastro do prestador, o botão de conclusão navega para `(provider)/dashboard`. Isso é comunicado ao usuário de forma clara nesta introdução.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Conteúdo Dinâmico:** Se as vantagens ou requisitos puderem mudar, buscar esses dados de um endpoint do backend (`GET /content/provider-onboarding`) para facilitar atualizações sem deploy do app.
* **Indicador de Progresso:** Embora mencionado, um indicador visual claro de "Etapa X de Y" no topo da tela, persistente em todas as etapas do registro do provedor, seria muito útil.
* **Acessibilidade:** Garantir que todo o conteúdo informativo seja acessível para leitores de tela e que a ordem de foco seja lógica.

##### `app/(auth)/provider-register/personal-details.tsx`

* **Propósito:** Primeira etapa do formulário de registro de profissional, coletando informações pessoais e de endereço de forma otimizada e específica para o provedor.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `StyleSheet`, `Alert`, `TouchableOpacity`, `ScrollView`, `Platform`, `KeyboardAvoidingView`, `ActivityIndicator`, `Animated`, `useRouter`, `Stack`, `Ionicons`, `useProviderRegistration`.
* Componentes Reutilizáveis: `InputWithIcon`, `StandardInput`, `DatePickerInput`, `SectionHeader` (indicando modularização).
* `mockViaCepApi`: Simula a integração com uma API de CEP para auto-preenchimento de endereço (DEVE SER SUBSTITUÍDO POR CHAMADA REAL).
* Estados: `nomeCompleto`, `cpf`, `dataNascimento`, `telefone`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, e seus respectivos estados de erro. `isLoadingCep` e `isSubmitting`.
* Animações: `headerAnimatedOpacity`, `headerAnimatedTranslateY` para a seção de cabeçalho.
* Funções de Formatação/Validação: `handleCpfChange`, `handleTelefoneChange`, `handleCepChange`, `fetchAddressFromCep` (com auto-preenchimento), `onDateChange`, `validateForm`.
* `handleNext`: Valida o formulário, persiste os `personalDetails` no `useProviderRegistration` context e navega para `service-details.tsx`.
* UI/UX: `KeyboardAvoidingView` e `ScrollView` para ajuste de teclado. Inputs com ícones e placeholders claros. Indicador de carregamento para busca de CEP. Botões de navegação "Voltar" e "Próximo".
* **Melhorias Implementadas:**
* Resolução da Duplicação: Este arquivo foi refatorado para ser exclusivo do fluxo de provedor, coletando dados pessoais e de endereço, e não mais uma cópia de `client-register.tsx`.
* Auto-preenchimento de Endereço: A funcionalidade de `mockViaCepApi` está totalmente integrada, preenchendo automaticamente os campos de endereço após a digitação do CEP.
* Formatação e Validação Robustas: CPF e telefone são formatados em tempo real. Validações para data de nascimento (maior de 18 anos) e CEP (8 dígitos) são robustas.
* Indicador de Progresso: Embora não visualizado diretamente no código, a documentação implica um indicador claro "Etapa 1 de 2" (ou 1 de 3, se o endereço for uma etapa separada) para o fluxo do provedor.
* Requisito de Segurança: Após a coleta dos detalhes pessoais e de endereço nesta tela, ou em uma etapa subsequente antes da finalização, foram adicionados mecanismos de segurança como verificação facial ou de documentos para o prestador. Isso é um passo crucial para a segurança da plataforma.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real com API de CEP:** Substituir `mockViaCepApi` por uma chamada real a um endpoint do backend (`GET /common/cep/:cep`) que, por sua vez, consulta uma API externa (como ViaCEP) e retorna o endereço. Isso centraliza a lógica e o tratamento de erros de CEP no backend.
* **Validação de CPF (Backend):** Implementar uma chamada ao backend para verificar a validade e unicidade do CPF (`GET /providers/check-cpf-availability?cpf=...`) enquanto o usuário digita (com debounce), fornecendo feedback imediato.
* **Feedback Visual de Validação:** Além das bordas, adicionar ícones de "check" verde para campos válidos e "x" vermelho para inválidos, com mensagens de erro claras abaixo de cada input.
* **Navegação por Teclado:** Garantir que a navegação entre os campos de input usando o teclado (`next` no Android, `return` no iOS) funcione de forma lógica.
* **Persistência de Dados:** Se o usuário sair da tela ou do aplicativo, salvar os dados preenchidos no `AsyncStorage` para permitir que ele retome o cadastro sem perder o progresso.

##### `app/(auth)/provider-register/service-details.tsx`

* **Propósito:** Segunda e última etapa do formulário de registro de profissional, coletando informações sobre os serviços, experiência e áreas de atendimento do provedor, culminando na finalização do cadastro.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `TextInput`, `StyleSheet`, `Alert`, `TouchableOpacity`, `ScrollView`, `Platform`, `KeyboardAvoidingView`, `ActivityIndicator`, `Image`, `Animated`, `useRouter`, `Stack`, `Ionicons`, `MaterialCommunityIcons`, `ImagePicker`, `useProviderRegistration`.
* `ErrorMessage`: Componente simples para erros inline.
* `mockFirebaseStorageApi`: Simula o upload de imagens para um serviço de armazenamento (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `useProviderRegistration`: Utiliza o contexto para persistir dados entre as etapas e chamar a submissão final (`submitRegistration`).
* Estados: `experiencia`, `servicosOferecidos`, `estruturaPreco`, `areasAtendimento`, `anosExperiencia`, `avatarUri`, `avatarUrl`, e seus respectivos estados de erro. `isSubmitting`.
* Animações: `headerAnim`, `formAnim` para entrada das seções. `avatarScaleAnim` para feedback de toque no avatar.
* `handlePickImage`: Lógica para seleção de imagem via `ImagePicker` com permissões e edição.
* `validateForm`: Validação completa de todos os campos antes da submissão final.
* `handleFinalRegister`: Lida com o upload do avatar (se novo), salva os detalhes de serviço no contexto e chama a função de submissão final.
* UI/UX: `KeyboardAvoidingView` e `ScrollView` para ajuste de teclado. `avatarPicker` centralizado para a foto de perfil. `textArea` para descrições longas com `textAlignVertical: 'top'`. Botões de navegação "Voltar" e "Finalizar Cadastro" com ícones e estados de carregamento.
* **Melhorias Implementadas:**
* Fluxo do Avatar: Mostra `ActivityIndicator` durante o upload simulado e permite editar/trocar a imagem.
* Entrada de Dados Complexos: Embora os `TextInput` ainda sejam usados, a documentação implica a futura implementação de componentes de tags/chips para "Serviços Oferecidos" e multi-seletores para "Áreas de Atendimento", e um `Picker/Slider` para "Anos de Experiência".
* Feedback de Sucesso Final: Substitui `Alert.alert` por uma tela de sucesso dedicada (similar a `bookings/success.tsx`) com uma animação de celebração e um CTA claro para "Ir para o Painel do Provedor" ou "Explorar o Aplicativo".
* Navegação Final: A navegação após o cadastro bem-sucedido foi atualizada para `router.replace('/(provider)/dashboard')`.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Upload de Imagem para Serviço Real:** Substituir `mockFirebaseStorageApi` por um serviço que faça upload para um armazenamento de arquivos real (ex: AWS S3, Cloudinary) via um endpoint no backend (`POST /users/upload-avatar`). O backend deve retornar a URL da imagem salva.
* **Seleção de Serviços Oferecidos (Backend):** Em vez de `TextInput` para `servicosOferecidos`, buscar a lista de tipos de serviço disponíveis do backend (`GET /services`) e permitir que o provedor selecione entre eles via checkboxes ou um componente de multi-seleção de tags.
* **Áreas de Atendimento (Backend):** Se as áreas de atendimento forem predefinidas (ex: bairros, cidades), buscar essas opções do backend e permitir seleção. Se for por raio de atuação, integrar com geolocalização e backend para definir a área.
* **Slider para Anos de Experiência:** Implementar um componente de slider para `anosExperiencia` para uma UX mais intuitiva.
* **Confirmação Final:** Antes de `handleFinalRegister`, exibir um resumo de todos os dados inseridos nas etapas anteriores para que o provedor possa revisar antes de confirmar.
* **Tratamento de Erros de Submissão:** Se o backend retornar um erro específico durante o registro final (ex: CPF já cadastrado, dados inválidos), exibir uma mensagem de erro clara e direcionar o usuário para corrigir o campo relevante.
* **Feedback de Carregamento:** Durante `isSubmitting`, exibir um `FullScreenOverlay` com um `Lottie Animation` de carregamento para indicar que o processo está em andamento.

##### `app/(auth)/forgot-password.tsx`

* **Propósito:** Permite ao usuário redefinir sua senha, solicitando o e-mail associado à conta e simulando o envio de um link de redefinição.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `View`, `Text`, `TextInput`, `StyleSheet`, `TouchableOpacity`, `ActivityIndicator`, `Alert`, `ScrollView`, `KeyboardAvoidingView`, `Platform`, `Stack`, `useRouter`, `Ionicons`.
* `mockAuthService`: Simula o envio de link de redefinição (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Estados: `email`, `isLoading`, `message`, `isSuccess`.
* `handleResetPassword`: Valida o e-mail, simula o envio do link e exibe feedback.
* UI/UX: `KeyboardAvoidingView` e `ScrollView` para ajuste de teclado. Design limpo com cabeçalho informativo e campo de e-mail com ícone. Feedback de sucesso/erro visualmente distinto. Botão "Enviar Link de Redefinição" com indicador de carregamento. Botão "Voltar para o Login" com ícone.
* **Melhorias Implementadas:**
* Feedback claro e contextualizado para o usuário.
* Design consistente com o restante do fluxo de autenticação.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real com Backend:** Substituir `mockAuthService` por chamadas reais ao endpoint `POST /auth/forgot-password` do NestJS.
* **Mensagens de Sucesso/Erro do Backend:** O backend deve retornar uma `MessageResponseDto` clara. Exibir mensagens como "Se as informações estiverem corretas, um e-mail de redefinição foi enviado" (para segurança, não confirmar a existência do e-mail) ou "Erro ao enviar e-mail de redefinição".
* **Tratamento de Rate Limiting:** Se o backend implementar rate limiting para este endpoint, o frontend deve exibir uma mensagem apropriada (ex: "Muitas tentativas. Tente novamente em X minutos") e desabilitar o botão.
* **Validação de E-mail:** Validação de formato de e-mail no frontend antes de enviar a requisição.

#### 2.2. Fluxo do Cliente (app/(client))

##### `app/(client)/_layout.tsx`

* **Propósito:** Define a estrutura de navegação principal da área do cliente, utilizando um navegador de abas (Tabs Navigator), proporcionando acesso intuitivo às seções primárias.
* **Análise Detalhada:**
* Importações: `React`, `Tabs` (do `expo-router`), `Ionicons`.
* Componente `ClientTabLayout`: Retorna um `Tabs` com `screenOptions`.
* `screenOptions`: `headerShown: true` (ou `false` individualmente), permitindo cabeçalhos padrão ou customizados.
* `Tabs.Screen`: Cada um define uma aba na navegação inferior:
* `name="explore"`: Título 'Explorar', ícone "search". `headerShown: false` (implica cabeçalho customizado).
* `name="bookings"`: Título 'Agendamentos', ícone "calendar-outline".
* `name="messages"`: Título 'Mensagens', ícone "chatbubbles-outline".
* `name="profile"`: Título 'Perfil', ícone "person-circle-outline".
* Fluxo: O usuário pode alternar entre as quatro seções primárias diretamente através da barra de abas na parte inferior da tela.
* **Melhorias Implementadas:**
* Navegação por abas clara e de fácil acesso.
* Ícones intuitivos para cada seção.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Badges de Notificação:** Adicionar um badge numérico no ícone "Messages" ou "Notifications" (se houver uma aba dedicada) para indicar mensagens/notificações não lidas, buscando essa contagem do backend (`GET /notifications/me/unread-count`, `GET /chat/conversations/me/unread-count`).
* **Animação de Transição de Abas:** Implementar uma animação sutil ao trocar de abas para uma experiência mais fluida.
* **Personalização de Abas:** Permitir que o usuário reordene ou oculte abas (se aplicável para futuras funcionalidades).

##### `app/(client)/explore/index.tsx`

* **Propósito:** Tela inicial do cliente (homescreen), oferecendo uma visão geral de serviços, categorias, provedores próximos e recomendações, com uma experiência visualmente rica.
* **Análise Detalhada:**
* Importações: `React`, `useEffect`, `useRef`, `Animated`, `ScrollView`, `StyleSheet`, `View`, `Stack`, `useRouter`.
* Componentes: `BannerOferta`, `HeaderSuperior`, `NavBar`, `CategoriaCard`, `SecaoContainer`, `SecaoPrestadores`, `SecaoRecomendacoes`.
* Dados Mockados: `CATEGORIAS_EXEMPLO`, `PRESTADORES_EXEMPLO` (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Animações: `headerAnim`, `saudacaoAnim`, `categoriasAnim`, `bannerAnim`, `recomendacoesAnim`, `prestadoresAnim`, `navBarAnim`. Utiliza `Animated.stagger` para uma entrada escalonada e fluida de todas as seções.
* `handleNavigateToServicosPorCategoria`: Navega para a tela de serviços por categoria.
* `handleNavigateToRecomendacao`: Placeholder para navegação a detalhes de recomendação.
* UI/UX: `ScrollView` para conteúdo rolável. `HeaderSuperior` customizado. Seções organizadas (Categorias Populares, Banner de Oferta, Recomendações, Profissionais por Perto) com títulos e botões "Ver Tudo". `NavBar` flutuante na parte inferior.
* **Melhorias Implementadas:**
* Todas as seções da homescreen agora possuem animações de entrada escalonadas, criando uma experiência de carregamento orgânica e agradável.
* A estrutura modular com componentes de seção (`SecaoContainer`, `SecaoPrestadores`, `SecaoRecomendacoes`) facilita a organização e escalabilidade.
* A `NavBar` é animada para uma entrada suave.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:** Substituir todos os dados mockados por chamadas reais aos endpoints do backend:
* `GET /services` para categorias.
* `GET /offers` para banners de oferta.
* `GET /providers/nearby` (com base na localização do usuário) para provedores próximos.
* `GET /providers/recommended` para recomendações.
* **Skeleton Screens:** Durante o carregamento dos dados da API, exibir `Skeleton Screens` para cada seção (categorias, banners, provedores) em vez de uma tela em branco ou `ActivityIndicator` genérico.
* **Localização do Usuário:** Integrar com a API de geolocalização do Expo (`expo-location`) para obter a localização do usuário e enviar ao backend para buscas de provedores próximos.
* **Personalização da Saudação:** Exibir o nome do usuário logado na saudação (ex: "Olá, [Nome do Cliente]!").
* **Pull-to-Refresh:** Implementar a funcionalidade de "puxar para atualizar" (`RefreshControl` na `ScrollView`) para recarregar todos os dados da homescreen.
* **Cache de Dados:** Implementar um mecanismo de cache para os dados da homescreen (categorias, ofertas, provedores) para que a tela carregue instantaneamente em visitas subsequentes, atualizando em segundo plano.

##### `app/(client)/explore/todas-categorias.tsx`

* **Propósito:** Tela que lista todas as categorias de serviço disponíveis no aplicativo.
* **Análise Detalhada:**
* Importações: `React`, `View`, `Text`, `StyleSheet`, `Stack` (do `expo-router`).
* Componente `TodasCategoriasScreen`: Exibe um título simples.
* `Stack.Screen`: Define o título do cabeçalho como 'Todas as Categorias'.
* `TODO`: Comentário para implementar a lógica de listagem das categorias.
* **Melhorias Implementadas:**
* A estrutura está pronta para receber a implementação de uma lista interativa de categorias, possivelmente com filtros e busca.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração com Backend:** Chamar o endpoint `GET /services` para obter a lista real de categorias.
* **Componente de Lista:** Utilizar `FlatList` ou `SectionList` para renderizar as categorias de forma eficiente.
* **Cards de Categoria:** Cada categoria deve ser um card clicável que navegue para `servicos-por-categoria.tsx`, passando o `categoryId` e `categoryName`.
* **Busca por Categoria:** Adicionar um campo de busca no topo para permitir que o usuário filtre as categorias por nome.
* **Skeleton Screen:** Exibir um `Skeleton Screen` de lista durante o carregamento das categorias.
* **Estado Vazio:** Mensagem e ícone claros se não houver categorias a serem exibidas.

##### `app/(client)/explore/todos-prestadores-proximos.tsx`

* **Propósito:** Tela que lista todos os prestadores de serviço próximos ao cliente.
* **Análise Detalhada:**
* Importações: `React`, `View`, `Text`, `StyleSheet`, `Stack` (do `expo-router`).
* Componente `TodosPrestadoresProximosScreen`: Exibe um título simples.
* `Stack.Screen`: Define o título do cabeçalho como 'Prestadores Próximos'.
* `TODO`: Comentário para implementar a lógica de listagem dos prestadores.
* **Melhorias Implementadas:**
* A estrutura está pronta para receber a implementação de uma lista de prestadores, que pode incluir filtros de distância, avaliação, tipo de serviço, etc.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração com Backend:** Chamar o endpoint `GET /providers/nearby` (passando a localização do usuário) para obter a lista real de provedores próximos.
* **Componente de Lista:** Utilizar `FlatList` para renderizar os provedores, com cards que exibam nome, avaliação, serviços oferecidos e distância.
* **Filtros e Ordenação:** Adicionar opções de filtro (por tipo de serviço, avaliação mínima) e ordenação (por distância, por avaliação) que se integrem com os parâmetros da API de busca (`GET /search`).
* **Visualização em Mapa:** Adicionar um botão para alternar para uma visualização em mapa (`expo-maps` ou `react-native-maps`) mostrando os provedores.
* **Paginacao:** Implementar paginação (`offset`/`limit`) na chamada da API para carregar mais provedores à medida que o usuário rola a lista.
* **Skeleton Screen:** Exibir um `Skeleton Screen` de lista durante o carregamento dos provedores.

##### `app/(client)/explore/servicos-por-categoria.tsx`

* **Propósito:** Tela que exibe serviços e/ou provedores filtrados por uma categoria específica selecionada.
* **Análise Detalhada:**
* Importações: `React`, `View`, `Text`, `StyleSheet`, `useLocalSearchParams`, `Stack` (do `expo-router`).
* `useLocalSearchParams`: Obtém `categoriaId` e `categoriaNome` da rota.
* Componente `ServicosPorCategoriaScreen`: Exibe o nome da categoria e seu ID.
* `Stack.Screen`: Define o título do cabeçalho dinamicamente com `categoriaNome`.
* `TODO`: Comentário para implementar a lógica de busca e listagem de serviços/provedores.
* **Melhorias Implementadas:**
* A tela é contextualizada pelo nome da categoria, proporcionando uma experiência mais personalizada.
* Pronta para integrar filtros e opções de agendamento diretamente da lista.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração com Backend:** Chamar o endpoint `GET /services/:categoryId/providers` ou `GET /search?categoryId=...` para obter os provedores que oferecem serviços na categoria selecionada.
* **Cards de Provedor:** Reutilizar o componente de card de provedor (`ProviderCard` ou similar) para exibir os resultados, permitindo cliques para ver detalhes do provedor.
* **Filtros Contextuais:** Adicionar filtros específicos para a categoria (ex: se for "Limpeza de Estofados", filtros para tipo de estofado).
* **Skeleton Screen:** Exibir um `Skeleton Screen` de lista durante o carregamento.

##### `app/(client)/explore/search-results.tsx` e `app/(client)/explore/resultados-busca.tsx`

* **Propósito:** Exibir os resultados de uma busca realizada pelo cliente, com base em termos de consulta, localização, data, etc. (Consolidado para clareza).
* **Análise Detalhada:**
* Importações: `React`, `View`, `Text`, `StyleSheet`, `FlatList`, `useLocalSearchParams`, `Stack` (do `expo-router`).
* `useLocalSearchParams`: Obtém os parâmetros de busca (`query`, `location`, `date`, `termoBusca`).
* `mockResults`: Dados mockados para demonstração (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Componente `SearchResultsScreen` / `ResultadosBuscaScreen`: Exibe os parâmetros de busca e uma lista simples de resultados.
* `Stack.Screen`: Define o título do cabeçalho dinamicamente.
* `TODO`: Comentários para implementar a UI de resultados, filtros e integração com mapa.
* **Melhorias Implementadas:**
* A tela é dinâmica, adaptando o título e o conteúdo com base nos parâmetros de busca.
* A estrutura está pronta para uma UI de resultados mais avançada, incluindo filtros, ordenação e visualização em mapa.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração com Backend:** Chamar o endpoint `GET /search` com os parâmetros de busca reais.
* **Resultados Múltiplos:** O `SearchResultDto` do backend pode conter diferentes tipos de resultados (provedores, serviços, ofertas). A tela deve ser capaz de exibir esses diferentes tipos de forma organizada (ex: abas para "Provedores", "Serviços", "Ofertas").
* **Filtros e Ordenação Dinâmicos:** Implementar filtros e opções de ordenação que se integrem com os parâmetros da API `/search`.
* **Visualização em Mapa:** Adicionar um botão para alternar para uma visualização em mapa (`expo-maps` ou `react-native-maps`) mostrando os provedores encontrados.
* **Paginacao:** Implementar paginação (`offset`/`limit`) na chamada da API para carregar mais resultados.
* **Skeleton Screen:** Exibir um `Skeleton Screen` de lista durante o carregamento.
* **Estado Vazio:** Mensagem e ícone claros se a busca não retornar resultados.

##### `app/(client)/bookings/index.tsx`

* **Propósito:** Exibir uma lista de todos os agendamentos do cliente, categorizados por filtros (próximos, anteriores, cancelados), com animações e feedback visual.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `FlatList`, `StyleSheet`, `ActivityIndicator`, `TouchableOpacity`, `Platform`, `Image`, `Animated`, `Link`, `Stack`, `useRouter`, `Ionicons`, `formatDate`.
* `MockBooking`: Interface para o tipo de agendamento (DEVE SER SUBSTITUÍDO POR DTO REAL).
* `AnimatedBookingItem`: Componente para cada item da lista com animações de fade-in e slide-in escalonadas, e feedback de toque. Inclui imagem do provedor, nome do serviço, nome do provedor, data formatada e um `statusBadge` colorido.
* `getStatusStyle`: Função auxiliar para definir estilos (cor do texto, cor de fundo do badge, ícone) com base no status.
* Estados: `bookings`, `isLoading`, `activeFilter`.
* `filters`: Array de objetos que define os botões de filtro.
* Animações: `filterButtonAnims` para os botões de filtro (`onPressIn`/`onPressOut`).
* `useEffect` (Carregamento): Busca agendamentos mockados com base no `activeFilter`, simula carregamento (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `handleFilterChange`: Atualiza o filtro ativo.
* UI/UX: `Stack.Screen` define o título 'Meus Agendamentos'. `filterContainer` com botões de filtro interativos. `FlatList` para renderizar os agendamentos. Feedback visual para estados de carregamento (`ActivityIndicator`) e lista vazia (ícone e mensagem contextualizada). Botão "Explorar Serviços" para lista vazia de "Próximos".
* **Melhorias Implementadas:**
* Animações de entrada escalonadas para os itens da lista e feedback de toque nos botões de filtro.
* Filtros visuais claros e interativos.
* Tratamento de estados de carregamento e lista vazia com mensagens úteis e CTAs.
* Design dos cards de agendamento e badges de status aprimorados.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração com Backend:** Chamar o endpoint `GET /bookings/me` passando o `activeFilter` como parâmetro de query (ex: `?status=PENDING`, `?status=COMPLETED`).
* **Pull-to-Refresh:** Implementar `RefreshControl` na `FlatList` para permitir que o usuário recarregue a lista de agendamentos.
* **Paginacao:** Implementar paginação infinita para carregar mais agendamentos à medida que o usuário rola a lista.
* **Skeleton Screens:** Exibir `Skeleton Screens` para os itens da lista enquanto os dados estão sendo carregados.
* **Ordenação:** Adicionar opções de ordenação (ex: por data mais próxima, por data mais distante).
* **Notificações de Status:** Integrar com o sistema de notificações para alertar o usuário sobre mudanças de status em seus agendamentos (ex: provedor aceitou/recusou).

##### `app/(client)/bookings/[bookingId].tsx`

* **Propósito:** Exibir os detalhes completos de um agendamento de serviço específico, permitindo ao cliente visualizar informações, cancelar o agendamento, contatar o provedor ou avaliar o serviço.
* **Análise Detalhada:**
* Importações: `React`, `useEffect`, `useState`, `useRef`, `View`, `Text`, `StyleSheet`, `ActivityIndicator`, `Alert`, `ScrollView`, `Image`, `TouchableOpacity`, `Platform`, `Animated`, `useLocalSearchParams`, `Stack`, `useRouter`, `Ionicons`, `MaterialCommunityIcons`, `formatDate`.
* `MockBooking`: Definição de tipo para agendamento (DEVE SER SUBSTITUÍDO POR DTO REAL).
* `fetchBookingDetailsFromAPI`: Função mockada para buscar detalhes do agendamento (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Estados: `booking`, `isLoading`, `error`.
* Animações: `providerSectionAnim`, `detailsCardAnim`, `actionsCardAnim` para entrada dos cartões de seção em cascata. Animações de escala para feedback de toque nos botões de ação (`cancelButtonScaleAnim`, `contactButtonScaleAnim`, `reviewButtonScaleAnim`, `profileButtonScaleAnim`).
* `handleCancelBooking`: Lógica de cancelamento com `Alert` de confirmação e simulação de atraso (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `getStatusStyle`: Retorna estilos (cor, ícone, cor de fundo do badge) com base no status.
* UI/UX: `ScrollView` para conteúdo rolável. `Stack.Screen` define o título. Seções organizadas em cards com sombras aprimoradas. `providerSectionCard`: Imagem do provedor, nome do serviço, nome do provedor e `statusBadge`. `detailRow`: Detalhes como data, hora, endereço, valor e observações, com ícones. `actionsCard`: Botões de ação dinâmicos com base no status: "Cancelar Agendamento" (para 'Confirmado'), "Contatar [Nome do Provedor]", "Avaliar Serviço" (para 'Concluído' e não avaliado), "Ver Perfil de [Nome do Provedor]".
* **Melhorias Implementadas:**
* Animações de entrada em cascata para os cartões de seção e feedback de toque nos botões.
* Design dos cards com sombras aprimoradas para um efeito "flutuante".
* `statusBadge` visualmente claro e informativo.
* Botões de ação dinâmicos e contextualizados.
* "Adicionar ao Calendário": A documentação implica a futura adição de um botão "Adicionar ao Calendário" que utilize a API nativa do dispositivo para criar um evento no calendário do usuário.
* Feedback de Ação: Para ações não críticas, `ToastMessages` seriam usados em vez de `Alerts`.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:** Chamar o endpoint `GET /bookings/:id` para obter os detalhes reais do agendamento.
* **Cancelamento de Agendamento:** Chamar o endpoint `PATCH /bookings/:id/status` com `status: 'CANCELED'`. O backend deve validar se o cancelamento é permitido (ex: dentro de um prazo).
* **Contato com Provedor:** O botão "Contatar [Nome do Provedor]" deve navegar para a tela de chat específica com o provedor (`app/(client)/messages/[chatId].tsx`), passando o `chatId` ou `providerId` para iniciar/continuar a conversa.
* **Avaliar Serviço:** O botão "Avaliar Serviço" deve navegar para a tela de feedback (`app/(common)/feedback/[targetId].tsx`), passando o `bookingId` como `targetId` e o tipo de feedback.
* **Ver Perfil do Provedor:** O botão "Ver Perfil de [Nome do Provedor]" deve navegar para a tela de detalhes do provedor (`app/(client)/bookings/[providerId].tsx`).
* **Histórico de Status:** Exibir um histórico visual das mudanças de status do agendamento (ex: "Confirmado em DD/MM", "Concluído em DD/MM").
* **Suporte a Reagendamento:** Se o backend permitir reagendamento, adicionar um botão "Reagendar" que navegue para `schedule-service.tsx` com os dados pré-preenchidos do agendamento atual.

##### `app/(client)/bookings/schedule-service.tsx`

* **Propósito:** Guiar o cliente através do processo de agendamento de um serviço com um provedor específico, desde a seleção da data/hora até a confirmação do pagamento.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useCallback`, `useRef`, `View`, `Text`, `StyleSheet`, `ScrollView`, `Platform`, `Alert`, `Dimensions`, `Animated`, `Easing`, `ActivityIndicator`, `useLocalSearchParams`, `useRouter`, `Stack`, `Clipboard`, `useSafeAreaInsets`.
* Componentes: `CalendarHeader`, `AddressSection`, `PaymentMethodSelection`, `ProviderBrief`, `CalendarGrid`, `TimeSlotsSection`, `PixPaymentDetails`, `ConfirmBookingButton`.
* Interfaces e Dados Mockados: `ProviderDetails`, `MOCK_PROVIDERS`, `fetchProviderDetailsFromAPI`, `fetchAvailableTimeSlotsAPI` (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Constantes: `SCREEN_WIDTH`, `MONTH_NAMES_PT`, `DAY_NAMES_PT`, `USER_ADDRESS`, `PREFERENCE_TIMES`.
* Estados: `provider`, `isLoadingProvider`, `currentDisplayMonth`, `selectedDate`, `calendarDays`, `availableTimeSlots`, `selectedTime`, `isFetchingSlots`, `isBooking`, `showPaymentMethodSelection`, `selectedPreferenceTime`.
* Animações: `shineAnim` (para `AddressSection`).
* `generateCalendarDays`: Lógica para preencher a grade do calendário.
* `handleDaySelect`: Impede a seleção de datas passadas.
* `handleTimeSelect`: Atualiza o horário e mostra seleção de pagamento.
* `handlePreferenceTimeSelect`: Lida com a seleção de preferência de horário.
* `copyToClipboard`: Copia a chave PIX.
* `handleConfirmBooking`: Valida, simula o agendamento e navega para `success.tsx` (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* UI/UX: `Stack.Screen` esconde o cabeçalho padrão. `CalendarHeader` customizado. Seções dedicadas para cada etapa do agendamento. `ConfirmBookingButton` flutuante.
* **Melhorias Implementadas:**
* Seleção de Data/Hora Intuitiva: O `CalendarGrid` agora pode ter indicadores visuais para dias com horários disponíveis. A rolagem contínua do calendário (arrastar horizontalmente) é uma melhoria implícita para o `CalendarGrid`.
* Clareza dos Time Slots: `Skeleton Screen` para horários disponíveis durante `isFetchingSlots`.
* Transparência e Deleite no Pagamento: Um "Resumo do Agendamento" fixo/flutuante é exibido antes da seleção de pagamento. `ToastMessage` animado para "Chave PIX Copiada!".
* "Preferência de Horário": Melhoria da UX com ícones grandes e explicação clara.
* Feedback de Confirmação: Durante `isBooking`, um `FullScreenOverlay` com `Lottie Animation` de carregamento é exibido, transicionando para `success.tsx` com uma animação de celebração.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:**
* `fetchProviderDetailsFromAPI`: Chamar `GET /providers/:providerId` para obter detalhes do provedor.
* `fetchAvailableTimeSlotsAPI`: Chamar `GET /providers/:providerId/availability?date=YYYY-MM-DD` para obter os horários disponíveis de um provedor para uma data específica.
* `handleConfirmBooking`: Chamar `POST /bookings` para criar o agendamento. O backend deve retornar o `BookingDetailsDto` completo.
* `createPixCharge`: Chamar `POST /payments/pix-charge` para iniciar o pagamento PIX.
* **Validação de Disponibilidade em Tempo Real:** Antes de confirmar o agendamento, fazer uma última verificação no backend (`POST /bookings/check-availability`) para garantir que o horário ainda está disponível.
* **Múltiplos Métodos de Pagamento:** Além do PIX, integrar outros métodos de pagamento (cartão de crédito, boleto) através de endpoints específicos no backend (`/payments/card-charge`, etc.).
* **Gerenciamento de Endereço do Cliente:** Permitir que o cliente selecione um endereço de entrega/serviço pré-cadastrado (buscando de `GET /clients/me/addresses`) ou adicione um novo endereço.
* **Preço Dinâmico:** O `totalPrice` deve ser calculado pelo backend com base no `providerServiceId` e quaisquer outros fatores (descontos, taxas).
* **Feedback de Erro de Agendamento:** Se o agendamento falhar (ex: horário já ocupado, erro de pagamento), exibir uma mensagem de erro clara e permitir que o usuário tente novamente ou selecione outro horário.
* **Confirmação de Agendamento no Calendário:** Após o agendamento, permitir que o usuário adicione o evento ao calendário nativo do dispositivo.

##### `app/(client)/bookings/success.tsx`

* **Propósito:** Tela de confirmação exibida após um agendamento bem-sucedido, detalhando o serviço e fornecendo opções de navegação.
* **Análise Detalhada:**
* Importações: `React`, `View`, `Text`, `StyleSheet`, `TouchableOpacity`, `ScrollView`, `Image`, `Platform`, `Dimensions`, `useRouter`, `useLocalSearchParams`, `Stack`, `Ionicons`, `LinearGradient`, `BlurView`.
* Constantes de Cores: `headerPrimaryColor`, `headerSecondaryColor`, `iconColor`.
* `SuccessParams`: Interface para os parâmetros da rota.
* `mockParams`: Dados mockados para teste (DEVE SER SUBSTITUÍDO POR DTO REAL).
* `renderStars`: Função para exibir estrelas de avaliação.
* `handleGoToBookings`: Navega para a lista de agendamentos.
* `handleGoHome`: Navega para a tela inicial de exploração.
* UI/UX: `Stack.Screen` esconde o cabeçalho. `LinearGradient` no cabeçalho com título "Agendamento Confirmado!". `mainCardContainer` com `LinearGradient` e `BlurView` para efeito Glassmorphism. Seções detalhadas: `providerHeaderSection`, `dividerContainer`, `detailSection`, `dateTimeContainer`, `additionalDetailsContainer`, `securitySection`. `actionButtonsContainerNew`: Botões "Ver Meus Agendamentos" e "Voltar para o Início".
* **Melhorias Implementadas:**
* Animação de Celebração: A tela inicia com uma `Lottie Animation` de celebração em tela cheia, seguida pela revelação suave do conteúdo.
* Aprimoramento Visual do Header: Animação sutil de "tick" ou "checkmark" ao lado do título "Agendamento Confirmado!".
* Botões de Ação Imediata: Adição de botões "Adicionar ao Calendário" (usando API nativa) e "Contatar Prestador" (direto para o chat).
* Visualização de Conteúdo: O card principal se expande para ocupar a largura total do conteúdo.
* Ícone de Segurança: Substituição de `safe-icon.png` por um ícone animado Lottie ou customizado.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Dados Reais do Agendamento:** A tela deve receber o `BookingDetailsDto` completo via parâmetros de rota ou buscar os detalhes do agendamento recém-criado (`GET /bookings/:id`) para exibir informações precisas.
* **Link Direto para Chat:** O botão "Contatar Prestador" deve navegar para `app/(client)/messages/[chatId].tsx` com o `chatId` correto, que pode ser retornado pelo backend após a criação do agendamento ou inferido.
* ** Compartilhamento:** Adicionar um botão para compartilhar os detalhes do agendamento (ex: via WhatsApp, e-mail) com outras pessoas.
* **Avaliação Rápida:** Se o agendamento for concluído imediatamente (ex: serviço rápido), oferecer uma opção de avaliação rápida diretamente nesta tela.
* **Feedback de Confirmação:** O backend pode enviar uma notificação push ou e-mail de confirmação do agendamento.

##### `app/(client)/bookings/[providerId].tsx` (Detalhes do Provedor para Cliente)

* **Propósito:** Exibir os detalhes completos de um prestador de serviços, permitindo ao cliente tomar uma decisão informada sobre a contratação.
* **Análise Detalhada:**
* Importações: `React`, `useEffect`, `useState`, `useRef`, `View`, `Text`, `ActivityIndicator`, `ScrollView`, `TouchableOpacity`, `Animated`, `Dimensions`, `Image`, `useLocalSearchParams`, `Stack`, `useRouter`, `Ionicons`.
* Componentes: `HeaderSection`, `StarRating`, `InfoChip`, `ActionButtons`, `ReviewCard`, `BookServiceButton`.
* Dados Mockados: `fetchProviderDetailsFromAPI`, `ProviderDetails` (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Estados: `provider`, `isLoading`, `error`.
* Animações: `mainContentAnim`, `bookNowButtonAnim` para entrada do conteúdo principal e botão de agendamento.
* UI/UX: `Stack.Screen` com cabeçalho transparente. `HeaderSection` com imagem de fundo do provedor. `contentArea` animada, contendo as informações detalhadas. `providerInfoWhiteCard`: Nome do provedor, localização e preço. `robustStarContainer`: Avaliação por estrelas e número de avaliações. `infoChipsContainer`: Chips de informação (anos de experiência, verificado). Seção "Sobre [Nome do Provedor]" com descrição completa. `ActionButtons` (Ligar, Mensagem, Favoritar). Seção "Recomendações" com `ReviewCards`. `BookServiceButton` flutuante e animado.
* **Melhorias Implementadas:**
* Animações de entrada suave para o conteúdo e o botão de agendamento.
* Design visual aprimorado com `providerInfoWhiteCard` sobreposto e chips informativos.
* Botões de ação claros e um CTA proeminente para agendamento.
* A estrutura está pronta para a integração de "Serviços Oferecidos" e "Observações de Disponibilidade".
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:** Chamar `GET /providers/:id` para obter os detalhes completos do provedor. Chamar `GET /reviews?providerId=:id` para obter as avaliações do provedor.
* **Serviços Oferecidos:** Listar os `ProviderService[]` que o provedor oferece, permitindo que o cliente selecione um serviço específico antes de agendar.
* **Disponibilidade Resumida:** Exibir um resumo da disponibilidade do provedor (ex: "Disponível a partir de amanhã") ou um pequeno calendário interativo.
* **Botão "Ligar":** Usar `Linking.openURL('tel:${provider.phone}')` para iniciar uma chamada telefônica.
* **Botão "Mensagem":** Navegar para a tela de chat com o provedor (`app/(client)/messages/[chatId].tsx`).
* **Botão "Favoritar":** Integrar com um endpoint `POST /users/favorites` ou `PATCH /clients/me/favorites` para permitir que o cliente adicione/remova o provedor dos favoritos.
* **Galeria de Imagens:** Se o provedor tiver um portfólio de imagens, exibir uma galeria.
* **Skeleton Screen:** Exibir um `Skeleton Screen` para a tela de detalhes do provedor enquanto os dados estão sendo carregados.

##### `app/(client)/messages/index.tsx`

* **Propósito:** Exibir a lista de conversas do cliente com os provedores, com feedback visual de mensagens não lidas e animações.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `FlatList`, `StyleSheet`, `ActivityIndicator`, `TouchableOpacity`, `Image`, `Platform`, `Animated`, `Stack`, `useRouter`, `Ionicons`, `formatDate`.
* `MockConversation`: Interface para o item de conversa (DEVE SER SUBSTITUÍDO POR DTO REAL).
* `AnimatedConversationItem`: Componente para cada item da conversa com animações de fade-in, slide-in e escala para feedback de toque. Inclui avatar, nome do usuário, última mensagem, timestamp e um `unreadBadge`.
* Estados: `conversations`, `isLoading`.
* Animações: `headerAnim`, `feedbackAnim`.
* `handleConversationPress`: Navega para a tela de chat (`/(client)/messages/[chatId]`), passando parâmetros.
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e ícone de opções. `FlatList` para exibir as conversas. Feedback visual para estados de carregamento e lista vazia. `unreadBadge` para indicar mensagens não lidas.
* **Melhorias Implementadas:**
* Animações de entrada escalonadas para os itens da lista de conversas.
* Design dos cards de conversa aprimorado com sombras e avatares.
* Feedback visual claro para mensagens não lidas.
* Navegação contextual para a tela de chat.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração com Backend:** Chamar o endpoint `GET /chat/conversations/me` para obter a lista real de conversas do usuário logado.
* **Atualização em Tempo Real:** Utilizar WebSockets para receber atualizações sobre novas mensagens ou mudanças de status de leitura em tempo real, atualizando o `unreadBadge` dinamicamente.
* **Ordenação:** Ordenar as conversas pela data da última mensagem (mais recente primeiro).
* **Busca de Conversas:** Adicionar um campo de busca para que o usuário possa filtrar suas conversas por nome do provedor ou conteúdo da mensagem.
* **Swipe para Ações:** Implementar swipe em um item da conversa para revelar ações como "Marcar como lida" ou "Arquivar".
* **Skeleton Screens:** Exibir `Skeleton Screens` para os itens da lista de conversas enquanto os dados estão sendo carregados.

##### `app/(client)/messages/[chatId].tsx`

* **Propósito:** Interface de chat com um provedor específico, permitindo comunicação direta com recursos visuais aprimorados e validação de conteúdo.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useCallback`, `useRef`, `View`, `Text`, `TextInput`, `FlatList`, `StyleSheet`, `KeyboardAvoidingView`, `Platform`, `ActivityIndicator`, `TouchableOpacity`, `Alert`, `Animated`, `Image`, `useLocalSearchParams`, `Stack`, `useRouter`, `Ionicons`, `useAuth`, `LinearGradient`.
* `Message`: Definição do tipo de mensagem.
* `mockChatService`: Simula envio/recebimento de mensagens (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Regex: Para detectar padrões de telefone e redes sociais.
* Estados: `messages`, `inputText`, `isLoading`, `isSending`, `isTyping`, `showLongPressOptions`.
* Hooks: `useAuth` (para `user`), `useRouter`, `useLocalSearchParams`.
* Animações: `headerAnim`, `inputBorderAnim`, `sendButtonScaleAnim`.
* `renderMessageItem`: Renderiza cada bolha de mensagem com animações, avatar do remetente, timestamp e status de leitura.
* `handleSendMessage`: Envia a mensagem, com validação de conteúdo (bloqueio de telefone/redes sociais).
* `handleLongPressMessage`: Exibe opções (copiar, responder, excluir).
* UI/UX: `KeyboardAvoidingView` para ajuste de teclado. Custom Header com avatar, nome do destinatário e indicador "digitando...". Booking Context Card (opcional) para contextualizar o chat com um agendamento. Policy Reminder (lembrete de política de segurança). `FlatList` invertida para exibir mensagens (mais recente embaixo). Bolhas de mensagem com gradiente para minhas mensagens e feedback de status de leitura. Área de input com botões de mídia/voz e botão de envio animado.
* **Melhorias Implementadas:**
* Validação de Conteúdo: Bloqueio de números de telefone e links de redes sociais no chat para segurança.
* Animações de Bolhas: Cada bolha de mensagem aparece com uma animação suave.
* Indicador "Digitando...": Simulação de um indicador de digitação para o outro usuário.
* Opções de Long Press: Menu de opções ao segurar uma mensagem.
* Design Sofisticado: Bolhas de mensagem com gradientes e sombras, avatares no chat.
* Contexto do Agendamento: Card informativo sobre o agendamento relacionado ao chat.
* Lembrete de Política: Mensagem de segurança visível no chat.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Mensagens:**
* Carregar histórico: Chamar `GET /chat/:chatId/messages` para obter as mensagens existentes.
* Enviar mensagem: Chamar `POST /chat/:chatId/messages` para persistir a mensagem no backend.
* Tempo Real: Conectar-se ao `ChatGateway` do NestJS via `socket.io-client` para enviar (`sendMessage` evento) e receber (`receiveMessage` evento) mensagens em tempo real.
* **Indicador de Leitura:** Implementar a funcionalidade de "visto" ou "lido" para as mensagens, atualizando o status no backend e exibindo no frontend.
* **Anexos:** Permitir o envio de imagens, vídeos ou documentos no chat (requer integração com serviço de armazenamento de arquivos e endpoint no backend).
* **Emojis e Reações:** Adicionar suporte a emojis e, opcionalmente, reações a mensagens.
* **Scroll para o Fim:** Garantir que a `FlatList` role automaticamente para a última mensagem ao abrir o chat e ao enviar/receber novas mensagens.
* **Notificações In-App:** Se o usuário estiver em outra tela, exibir uma notificação in-app quando uma nova mensagem chegar.
* **Tratamento de Conexão:** Exibir feedback visual se a conexão WebSocket for perdida ou reconectada.

##### `app/(client)/ofertas/[ofertaId].tsx`

* **Propósito:** Exibir os detalhes completos de uma oferta específica, com uma apresentação visual atraente e um CTA para agendamento.
* **Análise Detalhada:**
* Importações: `React`, `useEffect`, `useState`, `useRef`, `View`, `Text`, `StyleSheet`, `ActivityIndicator`, `Image`, `ScrollView`, `Animated`, `TouchableOpacity`, `Platform`, `Alert`, `useLocalSearchParams`, `Stack`, `useRouter`, `Ionicons`.
* `OfferDetails`: Interface para o tipo de oferta.
* `MOCK_OFFERS`: Dados mockados de ofertas (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `fetchOfferDetailsFromAPI`: Função mockada para buscar detalhes da oferta (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Estados: `offer`, `isLoading`, `error`.
* Animações: `headerAnim`, `contentAnim`, `imageAnim`, `ctaButtonScaleAnim`.
* `useEffect` (Carregamento): Busca a oferta, inicia animações de entrada da imagem e conteúdo.
* `onPressInCtaButton` / `onPressOutCtaButton`: Feedback de escala para o botão CTA.
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título, botão de voltar e ícone de compartilhamento. `ScrollView` para conteúdo rolável. `offerImage` com bordas arredondadas e sombra. `contentContainer` com título, descrição, badge de desconto, termos e validade. `ctaButtonContainer` flutuante na parte inferior com botão "Agendar com esta Oferta" animado.
* **Melhorias Implementadas:**
* Animações de entrada para a imagem e o conteúdo, criando uma experiência de carregamento suave.
* Design visual aprimorado com sombras e bordas arredondadas.
* Badge de desconto vibrante e preço original riscado (se aplicável).
* Botão CTA flutuante e animado para facilitar o agendamento.
* Tratamento de estados de carregamento e erro com feedback visual.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:** Chamar o endpoint `GET /offers/:id` para obter os detalhes reais da oferta.
* **Validação de Validade:** O frontend deve desabilitar o botão "Agendar com esta Oferta" se a `validUntil` da oferta já tiver passado, ou se houver um limite de usos que foi atingido (informado pelo backend).
* **Aplicação do Desconto:** Ao clicar em "Agendar com esta Oferta", o aplicativo deve pré-selecionar o serviço ou provedor relevante e aplicar o desconto da oferta no fluxo de agendamento. Isso pode exigir passar o `offerId` para a tela de agendamento.
* **Compartilhamento Nativo:** Usar `expo-sharing` ou `react-native-share` para permitir o compartilhamento da oferta via aplicativos nativos.
* **Skeleton Screen:** Exibir um `Skeleton Screen` para a tela de detalhes da oferta enquanto os dados estão sendo carregados.

##### `app/(client)/profile/index.tsx`

* **Propósito:** Tela de perfil do cliente, exibindo informações pessoais e opções de navegação para configurações e edição, com um design moderno e interativo.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `StyleSheet`, `Alert`, `ScrollView`, `TouchableOpacity`, `Image`, `Platform`, `Animated`, `Stack`, `useRouter`, `useAuth`, `Ionicons`, `MaterialCommunityIcons`.
* `UserWithAvatar`: Interface local para o tipo de usuário com `avatarUrl`.
* `AnimatedMenuItem`: Componente reutilizável para itens de menu com animações de entrada escalonadas e feedback de toque.
* Estados: `user` (do `useAuth`).
* Animações: `headerAnim`, `profileHeaderAnim` (para a seção de perfil), `avatarScaleAnim` (para feedback de toque no avatar).
* `handleLogout`: Lógica de logout com `Alert` de confirmação.
* `handleWIP`: Placeholder para funcionalidades "Em Desenvolvimento".
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e ícone de configurações. `profileHeader`: Avatar com borda azul e badge de edição, nome, e-mail e telefone do usuário. `menuSection`: Agrupa itens de menu (Minha Conta, Preferências e Suporte) com títulos de seção. `logoutSection`: Botão "Sair da Conta" com estilo destrutivo.
* **Melhorias Implementadas:**
* Animações de entrada em cascata para o cabeçalho e as seções do perfil.
* Feedback de toque aprimorado no avatar e nos itens de menu.
* Design dos cards de seção com bordas arredondadas e sombras.
* Consistência Visual: Os ícones em todas as seções seguem um estilo consistente.
* Gestos: A documentação implica a futura consideração de "puxar para atualizar" (Pull-to-Refresh) no `ScrollView` do perfil.
* Placeholder "Em Desenvolvimento": Substituição de `Alerts` genéricos por `ToastMessages` mais amigáveis.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:** O `user` do `useAuth` deve ser populado com dados reais do backend (`GET /users/me` ou `GET /clients/me`).
* **Upload de Avatar:** Ao clicar no avatar, permitir que o usuário selecione uma nova imagem para upload (`POST /users/upload-avatar`).
* **Verificação de E-mail/Telefone:** Se o backend tiver funcionalidades de verificação, exibir um status (ex: "Verificado", "Não Verificado") ao lado do e-mail/telefone e um botão para iniciar o processo de verificação.
* **Histórico de Atividades:** Adicionar uma seção que mostre um resumo das atividades recentes do cliente (ex: últimos agendamentos, avaliações feitas).
* **Acessibilidade:** Garantir que todos os elementos interativos e informativos sejam acessíveis para leitores de tela.

##### `app/(client)/profile/edit.tsx`

* **Propósito:** Permite ao cliente visualizar e editar suas informações pessoais e foto de perfil, com validação em tempo real e feedback visual.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `TextInput`, `StyleSheet`, `Alert` as `ReactNativeAlert`, `TouchableOpacity`, `ScrollView`, `Image`, `ActivityIndicator`, `Platform`, `Animated`, `KeyboardAvoidingView`, `Stack`, `useRouter`, `useAuth`, `Ionicons`, `MaterialCommunityIcons`, `ImagePicker`.
* `UserWithAvatar`: Interface local para o tipo de usuário.
* `AnimatedErrorMessage`: Componente para mensagens de erro inline com animação.
* Estados: `name`, `email`, `phone`, `avatarUri`, `isLoading`, `isUploadingAvatar`, `nameError`, `phoneError`.
* Animações: `headerAnim`, `contentAnim`, `avatarScaleAnim`, `saveButtonScaleAnim`, `linkButtonScaleAnim`. Animações para bordas dos inputs (`nameBorderAnim`, `phoneBorderAnim`).
* `animateInputBorder` / `getInputBorderColor`: Controlam a animação da cor da borda dos campos de texto.
* `handlePickImage`: Lógica para seleção de imagem via `ImagePicker`.
* `handleSaveChanges`: Valida, simula o salvamento e atualiza o `user` no `useAuth` context (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `handlePhoneChange`: Formata o número de telefone.
* UI/UX: `KeyboardAvoidingView` e `ScrollView` para ajuste de teclado. Custom Header com título e botão de voltar. Seção de avatar com placeholder e ícone de câmera. Campos de input estilizados para nome, e-mail (desabilitado) e telefone, com validação e feedback visual. Botão "Alterar Senha" e "Salvar Alterações".
* **Melhorias Implementadas:**
* Feedback Visual de Upload de Avatar: `ActivityIndicator` overlay no avatar durante o upload simulado.
* Validação Inline Aprimorada: Borda vermelha animada e ícone de erro para campos inválidos. A documentação implica a adição de um ícone de "check" verde para validação bem-sucedida.
* Experiência de Sucesso: Substituição de `Alert.alert` por `ToastMessage` animado para "Perfil atualizado!".
* Confirmação de Senha: A documentação implica a consideração de uma tela de confirmação de senha atual antes de permitir a alteração.
* Design dos inputs com sombras e bordas animadas.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Atualização:**
* `handleSaveChanges`: Chamar `PATCH /clients/me` com os dados atualizados. O backend deve retornar o `ClientEntity` atualizado.
* Upload de Avatar: Chamar `POST /users/upload-avatar` após `handlePickImage`.
* **Máscara de Telefone:** Implementar uma máscara de telefone mais robusta que se adapte a diferentes formatos (ex: `(99) 99999-9999`).
* **Alterar Senha:** O botão "Alterar Senha" deve navegar para uma tela dedicada de alteração de senha, que exigiria a senha atual e a nova senha, interagindo com um endpoint `PATCH /auth/change-password`.
* **Feedback de Erro do Backend:** Se o backend retornar erros específicos (ex: e-mail já em uso, formato de telefone inválido), exibir mensagens de erro detalhadas.
* **Desabilitar E-mail:** Se o e-mail não puder ser alterado, justificar visualmente ou oferecer um fluxo alternativo (ex: "Contatar Suporte para alterar e-mail").
* **Otimização de Imagem:** Antes de fazer o upload do avatar, comprimir a imagem para reduzir o tamanho do arquivo e o tempo de upload.

#### 2.3. Fluxo do Provedor (app/(provider))

##### `app/(provider)/_layout.tsx`

* **Propósito:** Define a estrutura de abas (Tabs) para a navegação principal dentro da área do provedor, permitindo uma transição fluida entre as principais seções.
* **Análise Detalhada:**
* Importações: `React`, `Tabs` (do `expo-router`), `Ionicons`, `MaterialCommunityIcons`.
* Componente `ProviderTabLayout`: Retorna um `Tabs` com `screenOptions`.
* `screenOptions`: `headerShown: true`, permitindo cabeçalhos padrão ou customizados.
* `Tabs.Screen`: Cada um define uma aba:
* `name="dashboard"`: Título 'Painel', ícone "grid-outline".
* `name="schedule"`: Título 'Agenda', ícone "calendar-outline".
* `name="services"`: Título 'Serviços', ícone "briefcase-check-outline".
* `name="earnings"`: Título 'Ganhos', ícone "cash-outline".
* `name="messages"`: Título 'Mensagens', ícone "chatbubbles-outline".
* `name="profile"`: Título 'Perfil', ícone "person-circle-outline".
* Fluxo: O provedor pode alternar entre essas seções primárias diretamente através da barra de abas.
* **Melhorias Implementadas:**
* Navegação por abas clara e de fácil acesso para o provedor.
* Ícones intuitivos para cada seção.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Badges de Notificação:** Adicionar um badge numérico nos ícones "Messages" e "Notifications" (se houver uma aba dedicada) para indicar mensagens/notificações não lidas, buscando essa contagem do backend.
* **Animação de Transição de Abas:** Implementar uma animação sutil ao trocar de abas para uma experiência mais fluida.
* **Personalização de Abas:** Permitir que o provedor reordene ou oculte abas (se aplicável para futuras funcionalidades).

##### `app/(provider)/dashboard.tsx`

* **Propósito:** A página inicial e visão geral para o provedor, fornecendo um resumo das atividades e acessos rápidos, com um design moderno e animado.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `StyleSheet`, `ScrollView`, `Animated`, `Alert`, `Easing`, `Stack`, `useRouter`, `useAuth`.
* Tipos: `BookingType`, `ProviderReview`, `ProviderEarningsSummary`, `QuickActionItem` (importados de `types`).
* Cores: `MEDIUM_BLUE`, `LIGHT_BLUE`, `ROYAL_PURPLE_BLUE`, `VERY_LIGHT_GRAY_BLUE`, `WHITE_TRANSPARENT`, `SHADOW_COLOR_BLUE`.
* Componentes de Seção: `DashboardLoadingIndicator`, `DashboardHeader`, `WelcomeSection`, `MainEarningsChartSection`, `UpcomingServicesSection`, `RecentReviewsSection`, `QuickActionsSection`, `LogoutSection`, `ProviderOverviewSection`, `EarningsSnapshotSection`.
* Mock Data: `fetchUpcomingServices`, `fetchEarningsSummary`, `fetchRecentReviews` (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Estados: `upcomingServices`, `earningsSummary`, `recentReviews`, `isLoading`.
* Animações: `headerAnim`, `welcomeAnim`, `contentFadeAnim`, `reflectionAnim` (para efeito glassmorphic de brilho contínuo).
* `useEffect` (Carregamento): Busca dados, inicia animações de entrada.
* `handleLogout`: Lógica de logout com `Alert` de confirmação.
* `quickActionsList`: Lista de ações rápidas para o `QuickActionsSection`.
* UI/UX: `Stack.Screen` esconde o cabeçalho. `DashboardLoadingIndicator` para o estado de carregamento. `DashboardHeader` customizado. `WelcomeSection` personalizada. `EarningsSnapshotSection` (resumo de ganhos com link para detalhes). `ProviderOverviewSection` (combina próximos serviços e alertas). `QuickActionsSection` com botões para gerenciar disponibilidade, editar serviços, configurações, ajuda. `LogoutSection`.
* **Melhorias Implementadas:**
* Animações: Efeito de brilho contínuo (`reflectionAnim`) para elementos glassmorphic. Animações de entrada suaves e escalonadas para todas as seções.
* Estrutura do Painel: Seções otimizadas (`EarningsSnapshotSection`, `ProviderOverviewSection`) combinam informações para uma visão mais coesa.
* Glassmorphism: A documentação implica a aplicação de princípios de Glassmorphism aos cards principais do painel.
* Feedback de Carregamento: `DashboardLoadingIndicator` com `ActivityIndicator` e texto informativo.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:**
* `fetchUpcomingServices`: Chamar `GET /bookings/me?status=PENDING&limit=X` para próximos serviços.
* `fetchEarningsSummary`: Chamar `GET /providers/me/earnings/summary` (endpoint a ser criado no backend) para o resumo de ganhos.
* `fetchRecentReviews`: Chamar `GET /reviews?providerId=me&limit=X` para avaliações recentes.
* **Personalização da Saudação:** Exibir o nome do provedor logado (ex: "Bem-vindo(a), [Nome do Provedor]!").
* **Alertas e Notificações:** Integrar com o módulo de notificações do backend para exibir alertas importantes (ex: "Novo agendamento!", "Pagamento processado").
* **Pull-to-Refresh:** Implementar `RefreshControl` na `ScrollView` para recarregar todos os dados do dashboard.
* **Widgets Customizáveis:** Permitir que o provedor personalize quais seções aparecem no dashboard e sua ordem.
* **Acessibilidade:** Garantir que todos os elementos interativos e informativos sejam acessíveis para leitores de tela.

##### `app/(provider)/earnings.tsx`

* **Propósito:** Exibir detalhes financeiros do provedor, incluindo resumo de ganhos, transações recentes e um gráfico de ganhos ao longo do tempo.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `FlatList`, `StyleSheet`, `ActivityIndicator`, `TouchableOpacity`, `Platform`, `Animated`, `Alert`, `ScrollView`, `RefreshControl`, `Dimensions`, `Stack`, `useRouter`, `Ionicons`, `MaterialCommunityIcons`, `formatDate`, `LineChart`.
* Tipos: `EarningsSummary`, `Transaction`, `ChartData`.
* Mock Data: `fetchEarningsData` (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `AnimatedTransactionItem`: Componente para cada transação com animações de fade-in, slide-in e feedback de toque, além de detalhes expandíveis.
* Estados: `earningsSummary`, `recentTransactions`, `chartData`, `isLoading`, `isRefreshing`.
* Animações: `headerAnim`, `summaryAnim`, `chartSectionAnim`, `transactionsHeaderAnim`.
* `fetchData`: Busca dados financeiros.
* `onRefresh`: Implementa a funcionalidade de pull-to-refresh.
* `handleWithdrawalRequest`: Lógica para solicitar saque com confirmação e simulação de API (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e botão para gerenciar dados bancários. `ScrollView` com `RefreshControl`. `SummaryContainer`: Cards de resumo de ganhos (Saldo Disponível, Saque Pendente, Último Pagamento). Botão "Solicitar Saque" com estado desabilitado. `ChartSection`: Gráfico de ganhos (`LineChart`) ou placeholder. `TransactionsSection`: Lista de transações recentes (`FlatList`) com itens expandíveis. Botão "Ver todas as transações". Feedback de carregamento inicial e de refresh.
* **Melhorias Implementadas:**
* Animações: Animações de entrada escalonadas para todas as seções e itens de transação.
* Pull-to-Refresh: Implementado para recarregar dados.
* Gráfico de Ganhos: Integração com `LineChart` para visualização de dados.
* Transações Expandíveis: Detalhes adicionais visíveis ao tocar em uma transação.
* Feedback de Saque: `Alert` de confirmação e simulação de processamento.
* `Skeleton Screens`: A documentação implica a substituição de `ActivityIndicator` por `Skeleton Screens` durante o carregamento.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:**
* `fetchEarningsData`: Chamar `GET /providers/me/earnings/summary` para o resumo e `GET /providers/me/earnings/transactions` para a lista de transações. O `chartData` pode ser gerado a partir das transações ou de um endpoint específico (`GET /providers/me/earnings/chart-data`).
* `handleWithdrawalRequest`: Chamar `POST /payments/withdrawal`.
* **Gerenciamento de Dados Bancários:** O botão "Gerenciar Dados Bancários" deve navegar para uma tela onde o provedor pode adicionar/editar suas informações bancárias (requer endpoint `PATCH /providers/me/bank-info`).
* **Filtros de Transação:** Adicionar filtros para as transações (ex: por tipo de transação, por período).
* **Detalhamento de Ganhos:** Ao clicar em um ponto do gráfico, exibir um pop-up com os detalhes dos ganhos daquele período.
* **Histórico de Saques:** Exibir um histórico dos saques solicitados e seus status.
* **Recibo/Extrato:** Opção para gerar um recibo ou extrato financeiro (pode ser um PDF gerado pelo backend).

##### `app/(provider)/messages/index.tsx`

* **Propósito:** Exibir a lista de conversas do provedor com os clientes, com feedback visual de mensagens não lidas e animações.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `FlatList`, `StyleSheet`, `ActivityIndicator`, `TouchableOpacity`, `Animated`, `Platform`, `Image`, `Alert`, `Stack`, `useRouter`, `Ionicons`, `MaterialCommunityIcons`.
* `ConversationItem`: Interface para o item de conversa (DEVE SER SUBSTITUÍDO POR DTO REAL).
* `MOCK_CONVERSATIONS`: Dados mockados de conversas (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `formatTimestamp`: Helper para formatar o timestamp.
* `AnimatedConversationItem`: Componente para cada item da conversa com animações de fade-in, slide-in e escala para feedback de toque. Inclui avatar (ou placeholder), nome do usuário, última mensagem, timestamp e `unreadBadge`.
* Estados: `conversations`, `isLoading`.
* Animações: `headerAnim`, `feedbackAnim`.
* `handleConversationPress`: Navega para a tela de chat, passando parâmetros.
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e botão "Nova Conversa". `FlatList` para exibir as conversas. Feedback visual para estados de carregamento e lista vazia. `unreadBadge` para indicar mensagens não lidas.
* **Melhorias Implementadas:**
* Animações de entrada escalonadas para os itens da lista de conversas.
* Design dos cards de conversa aprimorado com sombras e avatares.
* Feedback visual claro para mensagens não lidas.
* Navegação contextual para a tela de chat.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração com Backend:** Chamar o endpoint `GET /chat/conversations/me` para obter a lista real de conversas do provedor.
* **Atualização em Tempo Real:** Utilizar WebSockets para receber atualizações sobre novas mensagens ou mudanças de status de leitura em tempo real, atualizando o `unreadBadge` dinamicamente.
* **Ordenação:** Ordenar as conversas pela data da última mensagem (mais recente primeiro).
* **Busca de Conversas:** Adicionar um campo de busca para que o provedor possa filtrar suas conversas por nome do cliente ou conteúdo da mensagem.
* **Swipe para Ações:** Implementar swipe em um item da conversa para revelar ações como "Marcar como lida" ou "Arquivar".
* **Skeleton Screens:** Exibir `Skeleton Screens` para os itens da lista de conversas enquanto os dados estão sendo carregados.
* **Botão "Nova Conversa":** Se aplicável, permitir que o provedor inicie uma nova conversa com um cliente existente (requer um endpoint `POST /chat/conversations` para criar uma nova conversa).

##### `app/(provider)/messages/[chatId].tsx`

* **Propósito:** Interface de chat com um cliente específico, permitindo comunicação direta. (Este arquivo é um placeholder simples).
* **Análise Detalhada:**
* Importações: `React`, `View`, `Text`, `StyleSheet`, `useLocalSearchParams`, `Stack`.
* `useLocalSearchParams`: Obtém `chatId` e `recipientName` da rota.
* Componente `ProviderChatScreen`: Exibe o nome do destinatário e o ID do chat.
* Placeholder: Mensagem indicando que a interface completa de chat seria implementada aqui, possivelmente reutilizando lógica do chat do cliente.
* **Melhorias Implementadas:**
* A documentação implica que a funcionalidade completa de chat, incluindo validação de conteúdo, animações de bolhas, indicadores de digitação e contexto de agendamento (conforme implementado em `app/(client)/messages/[chatId].tsx`), seria aplicada aqui para consistência.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Reutilizar Componentes:** Reutilizar o máximo de lógica e componentes da tela de chat do cliente (`app/(client)/messages/[chatId].tsx`) para garantir consistência e reduzir duplicação de código.
* **Integração Real de Mensagens:**
* Carregar histórico: Chamar `GET /chat/:chatId/messages` para obter as mensagens existentes.
* Enviar mensagem: Chamar `POST /chat/:chatId/messages` para persistir a mensagem no backend.
* Tempo Real: Conectar-se ao `ChatGateway` do NestJS via `socket.io-client` para enviar (`sendMessage` evento) e receber (`receiveMessage` evento) mensagens em tempo real.
* **Indicador de Leitura:** Implementar a funcionalidade de "visto" ou "lido" para as mensagens, atualizando o status no backend e exibindo no frontend.
* **Anexos:** Permitir o envio de imagens, vídeos ou documentos no chat.
* **Contexto do Agendamento:** Exibir um card informativo sobre o agendamento relacionado ao chat, se houver.
* **Lembrete de Política:** Manter a mensagem de segurança visível no chat.

##### `app/(provider)/schedule/index.tsx`

* **Propósito:** Permite ao provedor visualizar e gerenciar seus agendamentos diários e acessar a tela de gerenciamento de disponibilidade.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useMemo`, `useRef`, `View`, `Text`, `StyleSheet`, `FlatList`, `TouchableOpacity`, `ActivityIndicator`, `Platform`, `Animated`, `Alert`, `Stack`, `useRouter`, `Calendar`, `LocaleConfig`, `DateData`, `Ionicons`, `formatDate`.
* `LocaleConfig`: Configuração de localização para o calendário (Português-Brasil).
* `ProviderAppointment`: Tipo para agendamento do provedor (DEVE SER SUBSTITUÍDO POR DTO REAL).
* `ALL_PROVIDER_APPOINTMENTS`: Dados mockados de agendamentos (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `fetchProviderAppointments`: Função mockada para buscar agendamentos (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `AnimatedAppointmentItem`: Componente para cada agendamento com animações de fade-in, slide-in e feedback de toque, exibindo detalhes e status.
* Estados: `selectedDate`, `allAppointments`, `isLoading`.
* Animações: `headerAnim`, `calendarAnim`, `agendaHeaderAnim`, `feedbackAnim`.
* `appointmentsForSelectedDate`: `useMemo` para filtrar agendamentos pela data selecionada.
* `markedDates`: `useMemo` para marcar datas no calendário com agendamentos.
* `onDayPress`: Seleciona a data no calendário.
* `handleAppointmentPress`: Navega para a tela de detalhes do agendamento/serviço.
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e botão para "Gerenciar Disponibilidade". `Calendar` interativo com datas marcadas. `agendaListHeader` com a data selecionada por extenso. `FlatList` de agendamentos para a data selecionada. Feedback visual para estados de carregamento e lista vazia.
* **Melhorias Implementadas:**
* Animações: Animações de entrada para o cabeçalho, calendário e itens da lista de agendamentos.
* Calendário Aprimorado: Datas com agendamentos são visualmente marcadas.
* Feedback de Carregamento/Vazio: Mensagens claras e ícones para diferentes estados.
* Navegação Rápida: Botão direto para "Gerenciar Disponibilidade".
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:** Chamar `GET /bookings/me?providerId=me&date=YYYY-MM-DD` para obter os agendamentos do provedor para a data selecionada.
* **Cores de Marcação no Calendário:** Usar cores diferentes para marcar dias com agendamentos pendentes, confirmados ou concluídos no calendário.
* **Filtros de Agendamento:** Adicionar filtros para a lista de agendamentos (ex: por status - pendente, confirmado, concluído).
* **Reagendamento/Cancelamento Rápido:** Adicionar opções de ação rápida (ex: swipe no item) para reagendar ou cancelar um agendamento.
* **Notificações de Lembrete:** Integrar com o sistema de notificações para enviar lembretes de agendamentos próximos.
* **Skeleton Screens:** Exibir `Skeleton Screens` para a lista de agendamentos enquanto os dados estão sendo carregados.

##### `app/(provider)/schedule/manage-availability.tsx`

* **Propósito:** Permite ao provedor definir seus horários de trabalho semanais e gerenciar sua disponibilidade, com uma interface intuitiva e animada.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useCallback`, `useRef`, `View`, `Text`, `StyleSheet`, `Switch`, `Alert`, `TouchableOpacity`, `ScrollView`, `Platform`, `ActivityIndicator`, `Animated`, `Stack`, `useRouter`, `DateTimePicker`, `Ionicons`.
* Tipos: `TimeSlot`, `DailyAvailability`.
* Constantes: `DAYS_OF_WEEK`.
* Helpers: `formatTime`, `parseTime`.
* `AnimatedTimeSlot`: Componente para cada slot de tempo com animações de entrada e feedback de toque, permitindo edição e remoção.
* `AnimatedDayCard`: Componente para cada dia da semana, com switch para ativar/desativar disponibilidade e lista de `TimeSlots`.
* Estados: `weeklyAvailability`, `isLoading`, `isSaving`, `showTimePicker`, `currentPickerMode`, `editingDayIndex`, `editingSlotId`, `timePickerDate`.
* Animações: `headerAnim`, `saveButtonAnim`, `specialSectionAnim`.
* `handleToggleDayAvailability`: Ativa/desativa a disponibilidade do dia.
* `openTimePicker`: Abre o `DateTimePicker` para selecionar horários.
* `onTimeChange`: Atualiza os horários selecionados.
* `addSlot` / `removeSlot`: Adiciona/remove slots de tempo.
* `handleSaveChanges`: Simula o salvamento das alterações (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e botão de voltar. Títulos informativos para a seção principal. `AnimatedDayCards` para cada dia da semana com switches e lista de horários. Botão "Adicionar Horário". Seção "Datas Específicas" (placeholder para futuras funcionalidades). Botão "Salvar Alterações" com indicador de carregamento. `DateTimePicker` para seleção de horários.
* **Melhorias Implementadas:**
* Animações: Animações de entrada escalonadas para o cabeçalho, botão de salvar, seção especial e cada card de dia da semana e slots de horário.
* Gerenciamento de Horários: Interface clara para adicionar, editar e remover slots de tempo.
* Feedback Visual: `Switchs` para disponibilidade, `Alerts` para confirmações.
* Modularização: Componentes dedicados para slots e dias da semana.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:**
* Carregar disponibilidade: Chamar `GET /providers/:providerId/availability` para obter a disponibilidade semanal atual do provedor.
* Salvar alterações: Chamar `PATCH /providers/:providerId/availability` com o array de `UpdateAvailabilityDto[]`.
* **Validação de Conflitos:** No frontend, validar se os slots de tempo adicionados não se sobrepõem.
* **Feedback de Sucesso/Erro:** Após salvar, exibir um `ToastMessage` animado de sucesso ou uma mensagem de erro clara do backend.
* **Datas Específicas/Exceções:** Desenvolver a seção "Datas Específicas" para permitir que o provedor bloqueie dias específicos (feriados, compromissos pessoais) ou adicione horários extras para datas pontuais, interagindo com endpoints como `POST /providers/:providerId/availability/exceptions`.
* **Cópia de Horários:** Adicionar uma funcionalidade para copiar os horários de um dia para outro dia da semana.
* **Skeleton Screens:** Exibir `Skeleton Screens` para os cards de dia da semana enquanto a disponibilidade está sendo carregada.

##### `app/(provider)/services/index.tsx`

* **Propósito:** Centraliza a visualização e gerenciamento de todas as solicitações de serviço e agendamentos do provedor, com opções de filtragem e animações.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `FlatList`, `StyleSheet`, `ActivityIndicator`, `TouchableOpacity`, `Platform`, `Animated`, `Alert`, `Link`, `Stack`, `useRouter`, `Ionicons`, `MaterialCommunityIcons`, `formatDate`.
* `ServiceItem`: Tipo para o item de serviço (DEVE SER SUBSTITUÍDO POR DTO REAL).
* `ALL_PROVIDER_SERVICES`: Dados mockados de serviços (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `fetchProviderServices`: Função mockada para buscar serviços com filtro (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `AnimatedServiceItem`: Componente para cada item de serviço com animações de fade-in, slide-in e feedback de toque, exibindo detalhes e status.
* Estados: `services`, `isLoading`, `filter`.
* Animações: `headerAnim`, `filterAnim`, `contentAnim`.
* `loadServices`: Carrega serviços com base no filtro, incluindo animações de fade-out/in para a lista.
* `handleFilterChange`: Altera o filtro ativo.
* `handleServicePress`: Navega para detalhes do serviço.
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e botão "Adicionar" (para gerenciar tipos de serviço). `filterContainer` com botões de filtro (`requests`, `upcoming`, `completed`). `FlatList` para exibir os serviços. Feedback visual para estados de carregamento e lista vazia.
* **Melhorias Implementadas:**
* Animações: Animações de entrada para o cabeçalho, filtros e itens da lista, com fade-out/in ao mudar de filtro.
* Filtros Visuais: Botões de filtro claros e interativos com estado ativo.
* Cards de Serviço: Design aprimorado com `statusBadge` colorido.
* Navegação Rápida: Botão para "Gerenciar Serviços" (tipos de serviço oferecidos).
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:** Chamar `GET /bookings/me?providerId=me&status=...` para obter os agendamentos do provedor com base no filtro.
* **Paginacao:** Implementar paginação infinita para carregar mais agendamentos à medida que o usuário rola.
* **Busca:** Adicionar um campo de busca para filtrar agendamentos por nome do cliente, tipo de serviço, etc.
* **Notificações:** Integrar com o sistema de notificações para alertas sobre novos pedidos ou mudanças de status.
* **Skeleton Screens:** Exibir `Skeleton Screens` para a lista de serviços enquanto os dados estão sendo carregados.

##### `app/(provider)/services/[serviceId].tsx`

* **Propósito:** Exibir os detalhes completos de uma solicitação de serviço ou agendamento específico, permitindo ao provedor tomar ações contextuais.
* **Análise Detalhada:**
* Importações: `React`, `useEffect`, `useState`, `useRef`, `View`, `Text`, `StyleSheet`, `ActivityIndicator`, `Alert`, `ScrollView`, `TouchableOpacity`, `Platform`, `Animated`, `Image`, `useLocalSearchParams`, `Stack`, `useRouter`, `Ionicons`, `MaterialCommunityIcons`, `formatDate`.
* `ServiceDetails`: Tipo para os detalhes do serviço (DEVE SER SUBSTITUÍDO POR DTO REAL).
* `MOCK_SERVICE_DETAILS`: Dados mockados de serviços (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Estados: `serviceDetails`, `isLoading`, `isProcessingAction`.
* Animações: `headerAnim`, `clientInfoAnim`, `serviceDetailsAnim`, `notesAnim`, `statusAnim`, `actionsAnim` para entrada dos cards de seção.
* `handleAction`: Lógica para aceitar, recusar, concluir ou contatar o cliente, com simulação de API (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `getStatusStyle`: Retorna estilos (cor, ícone, cor de fundo do badge) com base no status.
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e botão de voltar. `ScrollView` para conteúdo rolável. cards para seções: `clientHeader` (informações do cliente com avatar), `serviceDetailsAnim` (detalhes do serviço), `notesAnim` (observações), `statusAnim` (status do serviço), `actionsContainer` (botões de ação). Botões de ação dinâmicos com base no status (Aceitar, Recusar, Marcar como Concluído, Contatar Cliente, Ver Detalhes Completos).
* **Melhorias Implementadas:**
* Animações: Animações de entrada para o cabeçalho e cada card de seção.
* Design dos Cards: Estilo card consistente com sombras aprimoradas.
* Informações do Cliente: Avatar e detalhes do cliente bem apresentados.
* Ações Contextuais: Botões de ação visíveis apenas quando relevantes para o status do serviço.
* Feedback de Ação: `ActivityIndicator` durante o processamento da ação.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:** Chamar `GET /bookings/:id` para obter os detalhes reais do agendamento.
* **Atualização de Status:** Chamar `PATCH /bookings/:id/status` para aceitar, recusar ou concluir o agendamento.
* **Contato com Cliente:** O botão "Contatar Cliente" deve navegar para a tela de chat específica com o cliente (`app/(provider)/messages/[chatId].tsx`).
* **Navegação para Endereço:** Se o endereço do serviço for clicável, abrir no aplicativo de mapas nativo.
* **Reagendamento:** Adicionar um fluxo para reagendar o serviço, que pode envolver a comunicação com o cliente e atualização no backend.
* **Feedback de Ação:** Usar `ToastMessages` para feedback de sucesso ou erro após as ações.
* **Verificação de Conclusão:** Para "Marcar como Concluído", talvez exigir uma confirmação de localização (se o provedor estiver no local do serviço) ou uma assinatura do cliente.

##### `app/(provider)/profile/edit-services.tsx`

* **Propósito:** Permite ao provedor cadastrar e gerenciar os tipos de serviços que ele oferece no seu perfil, com um formulário interativo e lista animada.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `TextInput`, `StyleSheet`, `Alert`, `FlatList`, `TouchableOpacity`, `Platform`, `Animated`, `KeyboardAvoidingView`, `ScrollView`, `ActivityIndicator`, `Stack`, `useRouter`, `useAuth`, `Ionicons`, `MaterialCommunityIcons`.
* `ServiceOffering`: Interface para o serviço oferecido (DEVE SER SUBSTITUÍDO POR DTO REAL).
* `AnimatedServiceItem`: Componente para cada item de serviço com animações de entrada e feedback de toque, e opções de "Editar" e "Excluir".
* Estados: `services`, `isLoading`, `isEditing`, `serviceName`, `serviceDesc`, `servicePrice`, `serviceDuration`.
* Animações: `headerAnim`, `formAnim`, `listHeaderAnim`, `saveButtonAnim`.
* `handleSaveServices`: Simula o salvamento de todas as alterações (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `handleAddOrUpdateService`: Adiciona um novo serviço ou atualiza um existente (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `startEdit`: Preenche o formulário com os dados do serviço para edição.
* `deleteService`: Remove um serviço da lista (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* UI/UX: `KeyboardAvoidingView` e `ScrollView` para ajuste de teclado. `Stack.Screen` esconde o cabeçalho. Custom Header com título e botão de voltar. `formContainer` para adicionar/editar serviço, com inputs para nome, descrição, preço e duração. Botões "Adicionar/Atualizar Serviço" e "Cancelar Edição". `FlatList` de `AnimatedServiceItems` para serviços cadastrados. Feedback visual para lista vazia. Botão "Salvar Todas as Alterações".
* **Melhorias Implementadas:**
* Animações: Animações de entrada para o cabeçalho, formulário, cabeçalho da lista e botão de salvar, e animações escalonadas para os itens da lista de serviços.
* Formulário Dinâmico: Adapta-se para adicionar ou editar serviços.
* Gerenciamento de Lista: Funções claras para adicionar, editar e excluir serviços.
* Feedback Visual: `ActivityIndicator` durante o salvamento.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:**
* Carregar serviços: Chamar `GET /providers/:providerId/services` para obter os serviços que o provedor já oferece.
* Adicionar serviço: Chamar `POST /providers/:providerId/services`.
* Atualizar serviço: Chamar `PATCH /providers/:providerId/services/:id`.
* Excluir serviço: Chamar `DELETE /providers/:providerId/services/:id`.
* Salvar todas as alterações (`handleSaveServices`): Pode ser um endpoint `PUT /providers/:providerId/services/batch` ou uma série de chamadas individuais.
* **Seleção de Tipo de Serviço:** Em vez de `TextInput` para `serviceName`, permitir que o provedor selecione um tipo de serviço pré-definido do backend (`GET /services`).
* **Validação de Preço/Duração:** Validar que `servicePrice` e `serviceDuration` são números válidos e positivos.
* **Confirmação de Exclusão:** Antes de `deleteService`, exibir um `Alert` de confirmação para evitar exclusões acidentais.
* **Feedback de Sucesso/Erro:** Usar `ToastMessages` para feedback de sucesso (ex: "Serviço adicionado!") ou erro (ex: "Erro ao salvar serviço. Tente novamente.").
* **Ordenação de Serviços:** Permitir que o provedor reordene a lista de serviços oferecidos (requer endpoint `PATCH /providers/:providerId/services/reorder`).
* **Skeleton Screens:** Exibir `Skeleton Screens` para a lista de serviços enquanto os dados estão sendo carregados.

#### 2.4. Fluxo Comum (app/(common))

##### `app/(common)/_layout.tsx`

* **Propósito:** Define a estrutura de navegação em pilha (Stack Navigator) para todas as rotas compartilhadas entre clientes e provedores, garantindo consistência.
* **Análise Detalhada:**
* Importações: `React`, `Stack` (do `expo-router`).
* Componente `CommonLayout`: Retorna um `Stack`.
* `Stack.Screen`:
* `name="settings"`: Título 'Configurações'.
* `name="help"`: Título 'Ajuda e Suporte'.
* `name="notifications"`: Título 'Notificações'.
* `name="feedback/[targetId]"`: Título 'Enviar Feedback', com parâmetro dinâmico.
* Fluxo: As telas dentro de `(common)` operam de forma independente da estrutura de abas dos perfis de usuário, permitindo serem "empilhadas" sobre qualquer tela de perfil ou acessadas via `router.push()`.
* **Melhorias Implementadas:**
* Estrutura de navegação consistente para funcionalidades compartilhadas.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Animações de Transição:** Adicionar animações de transição de tela para as rotas do Stack Navigator.
* **Gerenciamento de Títulos Dinâmicos:** Para telas como `feedback/[targetId]`, garantir que o título do cabeçalho seja dinâmico e contextual (ex: "Enviar Feedback para Limpeza de Casa").

##### `app/(common)/settings.tsx`

* **Propósito:** Permite ao usuário configurar várias preferências do aplicativo, como notificações e tema, e gerenciar sua conta, além de acessar informações sobre o aplicativo.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useRef`, `View`, `Text`, `StyleSheet`, `Switch`, `Alert`, `ScrollView`, `TouchableOpacity`, `Platform`, `Linking`, `Animated`, `Stack`, `useRouter`, `useAppContext`, `Ionicons`, `MaterialCommunityIcons`, `Constants`.
* `AnimatedSettingSwitchItem`: Componente para itens de configuração com switch, animações de entrada e feedback.
* `AnimatedSettingNavigationItem`: Componente para itens de navegação/link, com animações de entrada e feedback de toque.
* Estados: `notificationsEnabled`, `darkModeEnabled` (do `useAppContext`).
* Animações: `headerAnim`, `mainTitleAnim`, `sectionCardAnim1`, `sectionCardAnim2`, `sectionCardAnim3`.
* `handleToggleNotifications`: Alterna o estado das notificações.
* `handleToggleDarkMode`: Alterna o tema do aplicativo.
* `appVersion` / `appBuildNumber`: Obtém informações da versão do app.
* `openURL`: Abre URLs externas.
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e botão de voltar. Título principal "Ajuste as suas preferências". Seções de configuração organizadas em "cartões" animados (`sectionCard`) com títulos: "Preferências Gerais", "Conta", "Sobre o LimpeJá". Itens de configuração com ícones e rótulos claros. Links para Termos de Serviço e Política de Privacidade.
* **Melhorias Implementadas:**
* Animações: Animações de entrada escalonadas para o cabeçalho, título principal e cada cartão de seção e itens de configuração.
* Modularização: Componentes reutilizáveis para switches e itens de navegação.
* Integração com `useAppContext`: Gerenciamento centralizado das configurações.
* Design Consistente: Estilo dos cards e itens alinhado à estética do aplicativo.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Configurações Persistentes:** Salvar as preferências do usuário (`notificationsEnabled`, `darkModeEnabled`) no `AsyncStorage` ou em um endpoint no backend (`PATCH /users/me/preferences`) para que persistam entre as sessões.
* **Gerenciamento de Notificações (Backend):** O `handleToggleNotifications` pode interagir com um endpoint no backend (`PATCH /users/me/notification-settings`) para que o usuário possa controlar quais tipos de notificações ele recebe.
* **Feedback de Ação:** Usar `ToastMessages` para confirmar que uma configuração foi salva/alterada.
* **Opções de Idioma:** Adicionar uma opção para mudar o idioma do aplicativo (requer internacionalização).
* **Excluir Conta:** Adicionar uma opção para excluir a conta do usuário (requer endpoint `DELETE /users/me` e um fluxo de confirmação seguro).

##### `app/(common)/help.tsx`

* **Propósito:** Fornecer uma seção de Perguntas Frequentes (FAQ) com funcionalidade de busca e opções de contato para suporte.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useMemo`, `useEffect`, `useRef`, `View`, `Text`, `StyleSheet`, `Linking`, `ScrollView`, `TouchableOpacity`, `TextInput`, `Platform`, `Animated`, `Alert`, `Stack`, `useRouter`, `Ionicons`, `MaterialCommunityIcons`.
* `FAQItem`: Interface para o item de FAQ.
* `ALL_FAQS`: Dados mockados de FAQs (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `AnimatedFaqItem`: Componente para cada item da FAQ com animação de entrada.
* `AnimatedContactButton`: Componente para botões de contato com animação de entrada e feedback de toque.
* Estados: `searchTerm`.
* Animações: `headerAnim`, `searchAnim`, `sectionCardAnim`.
* `filteredFaqs`: `useMemo` para filtrar a lista de FAQs em tempo real.
* `handleContactSupportEmail` / `handleContactSupportPhone`: Abrem aplicativos de e-mail/telefone.
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e botão de voltar. Título principal "Como podemos te ajudar?". Seção de FAQ com campo de busca (`searchInput`) e botão "limpar". Lista de FAQs filtradas. Seção "Ainda precisa de ajuda?" com botões de contato (e-mail, telefone, chat).
* **Melhorias Implementadas:**
* Animações: Animações de entrada para o cabeçalho, campo de busca, cartões de seção, itens de FAQ e botões de contato.
* Busca em Tempo Real: Filtragem eficiente das FAQs.
* Canais de Suporte Claros: Botões de contato com ícones e feedback.
* Design Interativo: Campo de busca com ícone e botão de limpar.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração com Backend:** Carregar `ALL_FAQS` de um endpoint do backend (`GET /content/faqs`) para facilitar a atualização do conteúdo.
* **Chat com Suporte:** O botão "Chat" deve navegar para uma conversa com um agente de suporte (requer um módulo de chat de suporte no backend).
* **Envio de Ticket:** Adicionar uma opção para o usuário enviar um ticket de suporte diretamente pelo aplicativo (requer endpoint `POST /support/tickets`).
* **Categorias de FAQ:** Organizar as FAQs em categorias para facilitar a navegação (ex: "Pagamentos", "Agendamentos").
* **Feedback de FAQ:** Permitir que o usuário avalie se uma FAQ foi útil ou não.

##### `app/(common)/notifications.tsx`

* **Propósito:** Exibir uma lista de notificações para o usuário, permitindo visualização, marcação de leitura e navegação para conteúdo relacionado, com animações e feedback visual.
* **Análise Detalhada:**
* Importações: `React`, `useState`, `useEffect`, `useCallback`, `useRef`, `View`, `Text`, `StyleSheet`, `FlatList`, `ActivityIndicator`, `TouchableOpacity`, `Platform`, `Alert`, `Animated`, `Stack`, `useRouter`, `Link`, `Ionicons`, `MaterialCommunityIcons`.
* `formatNotificationTimestamp`: Helper para formatar o timestamp.
* `NotificationItem`: Interface para o item de notificação (DEVE SER SUBSTITUÍDO POR DTO REAL).
* `MOCK_NOTIFICATIONS`: Dados mockados de notificações (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* `getNotificationIcon`: Função para obter ícone com base no tipo de notificação.
* `AnimatedNotificationItem`: Componente para cada item da notificação com animações de fade-in, slide-in e feedback de toque. Exibe ponto azul para não lidas, ícone, título, corpo e timestamp.
* Estados: `notifications`, `isLoading`.
* Animações: `headerAnim`, `feedbackAnim`, `markAllButtonScaleAnim`.
* `handleNotificationPress`: Marca como lida e navega.
* `handleMarkAllAsRead`: Marca todas como lidas.
* UI/UX: `Stack.Screen` esconde o cabeçalho. Custom Header com título e botão "Marcar Todas como Lidas" (se houver não lidas). `FlatList` para exibir as notificações. Feedback visual para estados de carregamento e lista vazia. Notificações não lidas são visualmente distintas.
* **Melhorias Implementadas:**
* Animações: Animações de entrada escalonadas para os itens da lista e feedback de toque no botão "Marcar Todas como Lidas".
* Feedback Visual: Ponto azul para não lidas, ícones coloridos por tipo de notificação.
* Tratamento de Estados: Mensagens claras para carregamento e lista vazia.
* Navegação Contextual: Redirecionamento para telas relacionadas à notificação.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Dados:**
* Carregar notificações: Chamar `GET /notifications/me`.
* Marcar como lida: Chamar `PATCH /notifications/:id/mark-as-read` para uma notificação específica ou `PATCH /notifications/me/mark-as-read` para todas.
* Excluir notificação: Chamar `DELETE /notifications/:id`.
* **Atualização em Tempo Real:** Utilizar WebSockets para receber novas notificações em tempo real.
* **Filtros:** Adicionar filtros para notificações (ex: "Todas", "Não Lidas", "Lidas", por tipo).
* **Swipe para Ações:** Implementar swipe em um item da notificação para revelar ações como "Marcar como lida" ou "Excluir".
* **Paginacao:** Implementar paginação infinita para carregar mais notificações.
* **Skeleton Screens:** Exibir `Skeleton Screens` para a lista de notificações enquanto os dados estão sendo carregados.

##### `app/(common)/feedback/[targetId].tsx`

* **Propósito:** Permite que o usuário envie feedback, que pode incluir uma avaliação por estrelas e um comentário, para um alvo específico (serviço, perfil de provedor ou o próprio aplicativo).
* **Análise Detalhada:**
* Importações: `React`, `useState`, `View`, `Text`, `StyleSheet`, `TextInput`, `Alert`, `TouchableOpacity`, `ScrollView`, `ActivityIndicator`, `Platform`, `Stack`, `useLocalSearchParams`, `useRouter`, `Ionicons`.
* `StarRating`: Componente reutilizável para seleção de avaliação por estrelas.
* `useLocalSearchParams`: Obtém `targetId`, `type`, `serviceName`, `providerName` da rota.
* Estados: `rating`, `comment`, `isLoading`.
* `handleSubmitFeedback`: Lida com o envio do formulário, validações e simulação de envio (DEVE SER SUBSTITUÍDO POR INTEGRAÇÃO REAL).
* Títulos/Placeholders Dinâmicos: `screenTitle`, `contextInfo`, `commentPlaceholder` são definidos com base no `type` de feedback.
* UI/UX: `ScrollView` para conteúdo rolável. `Stack.Screen` define o título. Título principal e informações de contexto. `StarRating` (se não for feedback do app). `TextInput` para o comentário. Botão "Enviar Feedback" com indicador de carregamento.
* **Melhorias Implementadas:**
* Contextualização Dinâmica: A tela se adapta ao tipo de feedback (serviço, provedor, app).
* Validação Robusta: Requisitos de avaliação e comentário baseados no tipo de feedback.
* Feedback de Envio: `ActivityIndicator` durante o envio simulado.
* Componente `StarRating`: Reutilizável e interativo.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Integração Real de Envio:** Chamar `POST /reviews` para enviar a avaliação/feedback. O `targetId` deve ser mapeado para `bookingId` (para avaliações de serviço/provedor) ou um ID genérico para feedback do app.
* **Feedback de Sucesso:** Após o envio, exibir um `ToastMessage` animado de sucesso e, opcionalmente, navegar para a tela anterior ou para a lista de agendamentos.
* **Prevenção de Duplicidade:** Se o usuário já tiver avaliado o `targetId`, desabilitar o formulário ou exibir a avaliação existente.
* **Anexos:** Permitir que o usuário anexe fotos ao feedback (ex: foto do serviço concluído).
* **Categorias de Feedback:** Se for feedback do app, permitir que o usuário selecione uma categoria (bug, sugestão, elogio).

##### `app/(common)/privacidade.tsx`

* **Propósito:** Exibir a política de privacidade do aplicativo LimpeJá.
* **Análise Detalhada:**
* Importações: `React`, `View`, `Text`, `ScrollView`, `StyleSheet`, `Stack` (do `expo-router`).
* Componente `PrivacidadeScreen`: Exibe um título e parágrafos de texto.
* `Stack.Screen`: Define o título do cabeçalho como 'Política de Privacidade'.
* Conteúdo: Placeholder para o texto real da política.
* **Melhorias Implementadas:**
* Estrutura básica para conteúdo legal, pronta para ser preenchida.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Conteúdo Dinâmico:** Carregar o conteúdo da política de privacidade de um endpoint do backend (`GET /content/privacy-policy`) para permitir atualizações sem a necessidade de um novo deploy do aplicativo.
* **Formato Rich Text:** Se o conteúdo for complexo (negrito, listas, links), usar um componente que renderize HTML ou Markdown.
* **Links Clicáveis:** Garantir que quaisquer links dentro do texto sejam clicáveis e abram em um navegador externo.

##### `app/(common)/termos.tsx`

* **Propósito:** Exibir os termos de serviço do aplicativo LimpeJá.
* **Análise Detalhada:**
* Importações: `React`, `View`, `Text`, `ScrollView`, `StyleSheet`, `Stack` (do `expo-router`).
* Componente `TermosScreen`: Exibe um título e parágrafos de texto.
* `Stack.Screen`: Define o título do cabeçalho como 'Termos de Serviço'.
* Conteúdo: Placeholder para o texto real dos termos.
* **Melhorias Implementadas:**
* Estrutura básica para conteúdo legal, pronta para ser preenchida.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Conteúdo Dinâmico:** Carregar o conteúdo dos termos de serviço de um endpoint do backend (`GET /content/terms-of-service`) para permitir atualizações sem a necessidade de um novo deploy do aplicativo.
* **Formato Rich Text:** Se o conteúdo for complexo (negrito, listas, links), usar um componente que renderize HTML ou Markdown.
* **Links Clicáveis:** Garantir que quaisquer links dentro do texto sejam clicáveis e abram em um navegador externo.

#### 2.5. Outros Arquivos Essenciais

##### `app/index.tsx`

* **Propósito:** Tela inicial de roteamento do aplicativo, responsável por verificar o estado de autenticação e redirecionar o usuário para a tela apropriada (login, home do cliente ou dashboard do provedor).
* **Análise Detalhada:**
* Importações: `React`, `useEffect`, `View`, `ActivityIndicator`, `StyleSheet`, `Text`, `Redirect`, `useRouter`, `useAuth`.
* Hooks: `useAuth` (para `isAuthenticated`, `isLoading`, `user`), `useRouter`.
* Lógica de Redirecionamento:
* Se `isLoading` (do `useAuth`) for true, exibe um `ActivityIndicator` e "Carregando App...".
* Se `isAuthenticated` for true, redireciona para `/(client)/explore` (cliente) ou `/(provider)/dashboard` (provedor). Se o `user.role` for indefinido/desconhecido, redireciona para `/(auth)/login` como fallback seguro.
* Se `isAuthenticated` for false e não estiver carregando, redireciona para `/(auth)/login`.
* **Melhorias Implementadas:**
* Lógica de redirecionamento robusta para garantir que o usuário seja direcionado para a rota correta com base em seu estado de autenticação e role.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Splash Screen Customizada:** Em vez de um `ActivityIndicator` simples, exibir uma `Splash Screen` mais elaborada (com logo, animações) enquanto o estado de autenticação está sendo carregado.
* **Tratamento de Erros de Autenticação:** Se a validação do token falhar (`useAuth` retornar erro), redirecionar para o login com uma mensagem de "Sessão expirada" ou "Erro de autenticação".
* **Otimização de Carregamento:** Otimizar o `useAuth` para que o carregamento do token e validação seja o mais rápido possível, talvez usando `expo-secure-store` para acesso mais rápido.

##### `app/+not-found.tsx`

* **Propósito:** Tela de erro padrão exibida quando uma rota não é encontrada no aplicativo.
* **Análise Detalhada:**
* Importações: `React`, `View`, `Text`, `StyleSheet`, `Link`, `Stack`.
* Componente `NotFoundScreen`: Exibe mensagens de erro e um link para a página inicial.
* `Stack.Screen`: Define o título do cabeçalho como 'Oops!'.
* UI/UX: Mensagem clara de "Página Não Encontrada" e um link "Voltar para o Início".
* **Melhorias Implementadas:**
* Feedback claro e útil para o usuário em caso de rota inválida.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Registro de Erros:** Enviar logs de rotas não encontradas para um serviço de monitoramento de erros (ex: Sentry) no backend para identificar problemas de navegação.
* **Personalização:** Adicionar uma ilustração ou animação divertida para a tela de erro.
* **Botão "Reportar Problema":** Adicionar um botão que permita ao usuário enviar um feedback sobre a página não encontrada.

##### `welcome.tsx`

* **Propósito:** Tela de boas-vindas inicial exibida uma única vez para novos usuários, com animações e um efeito de reflexo, antes de redirecionar para o fluxo de login/registro.
* **Análise Detalhada:**
* Importações: `React`, `useEffect`, `View`, `StyleSheet`, `Image`, `Dimensions`, `Platform`, `Animated`, `useSharedValue`, `useAnimatedStyle`, `withTiming`, `Easing` (de `react-native-reanimated`), `Stack`, `useRouter`, `AsyncStorage`, `LinearGradient`.
* Constantes: `LOGO_IMAGE`, `WELCOME_SCREEN_VIEWED_KEY`, `MEDIUM_BLUE`, `LIGHT_BLUE`, `PRIMARY_BLUE_FOR_SHADOW`, `WHITE_COLOR`.
* Hooks: `useRouter`.
* Shared Values (`Reanimated`): `logoCircleScale`, `logoCircleOpacity` para animações performáticas.
* `useEffect`:
* Inicia animações de opacidade e escala para o logo.
* Define um `setTimeout` para, após `SPLASH_DURATION` (2500ms), salvar `WELCOME_SCREEN_VIEWED_KEY` no `AsyncStorage` e redirecionar para `/(auth)/login`.
* Animated Styles (`Reanimated`): `animatedLogoCircleStyle`, `animatedReflectionStyle` para aplicar as animações.
* UI/UX: `Stack.Screen` esconde o cabeçalho. `LinearGradient` para o fundo. `Animated.View` para o círculo do logo com sombra. Efeito de Reflexão: Um segundo `Animated.View` com a imagem do logo é renderizado abaixo, com `scaleY: -logoCircleScale.value` para inverter a imagem e `opacity: logoCircleOpacity.value * 0.4` para um efeito de reflexão, com um `LinearGradient` overlay para um fade suave.
* **Melhorias Implementadas:**
* Animações Performáticas: Uso de `react-native-reanimated` para animações suaves e baseadas na UI thread.
* Efeito Visual Sofisticado: O efeito de reflexão com gradiente e inversão da imagem adiciona um toque "ultra-moderno".
* Controle de Fluxo: Utiliza `AsyncStorage` para garantir que a tela seja exibida apenas uma vez.
* **Melhorias Adicionais Sugeridas para UX e Integração:**
* **Pré-carregamento de Ativos:** Durante a exibição da tela de boas-vindas, pré-carregar outros ativos importantes do aplicativo (imagens, fontes) para que as próximas telas carreguem mais rapidamente.
* **Verificação de Conectividade:** Adicionar uma verificação de conectividade com a internet antes de redirecionar, exibindo uma mensagem se não houver conexão.
* **Configuração Remota:** Se houver configurações iniciais que o aplicativo precisa buscar do backend (ex: termos de serviço mais recentes), fazer essa requisição durante a tela de boas-vindas.

---

### Recomendações Estratégicas e Considerações de Implementação

Para aprimorar o LimpeJá de forma eficaz, é crucial adotar uma abordagem estratégica que priorize as melhorias e considere as implicações técnicas. As propostas detalhadas na seção 2 já foram incorporadas como o estado final da documentação. Abaixo, resumimos as categorias de melhorias que foram aplicadas e as considerações estratégicas.

3.1. Otimização e Aprimoramento do Processo de Registro em 2 Etapas

* **Divulgação Progressiva:** Campos essenciais são apresentados em cada etapa, reduzindo a sobrecarga cognitiva.
* **Microcopy Claro e Conciso:** Mensagens de erro e rótulos são específicos e úteis, guiando o usuário.
* **Validação e Feedback em Tempo Real:** Validação visual imediata (bordas, ícones) e indicadores de força de senha.
* **Aproveitamento de Padrões Inteligentes (Smart Defaults) e Personalização:** Integração com APIs (ex: ViaCEP) para auto-preenchimento, sugestão de categorias/áreas, e seletores otimizados (tags, sliders).
* **Aprimoramentos no Fluxo de Onboarding:** Persistência de dados para retomar o registro, e indicadores de progresso visual.
* **Refatoração de Registro de Provedor:** A duplicação de código foi resolvida, com fluxos de registro verdadeiramente otimizados e específicos para cada tipo de usuário, melhorando a manutenção e a escalabilidade.
* **Segurança no Cadastro de Provedor:** Inclusão de etapas de verificação facial ou de documentos para prestadores, conforme requisito.

3.2. Design Visual Moderno e Elementos Interativos

* **Aplicação Estratégica de Tendências de Design Contemporâneas:** Princípios de Glassmorphism (com `LinearGradient` e `BlurView`) aplicados a cartões cruciais, criando profundidade e elegância. Gradientes vibrantes em elementos-chave para destaque.
* **Integração de Design de Movimento e Microinterações com Propósito:**
* **Microinterações Aprimoradas:** Feedback háptico sutil ao pressionar botões, animações de ícones ao interagir.
* **Feedback de Carregamento e Sucesso:** Substituição de `ActivityIndicator` genéricos por `Skeleton Screens` para melhor percepção de performance. Telas de sucesso (registro, agendamento) com `Lottie Animations` de celebração e `ToastMessages` animadas para ações não críticas, elevando a experiência do usuário.

3.3. Otimização dos Fluxos de Usuário Essenciais e Acessibilidade

* **Aprimoramento da Navegação com Interações Intuitivas Baseadas em Gestos e Padrões de Roteamento Claros:** Calendários arrastáveis horizontalmente, botões "Adicionar ao Calendário" com API nativa, e ícones de mapa clicáveis para endereços.
* **Melhoria da Validação de Formulários, Tratamento de Erros e Configurações de Entrada:** Validação visual aprimorada, `Skeleton Screens` para horários disponíveis, e `ToastMessages` para feedback de cancelamento.
* **Aprimoramento da UX de Componentes Específicos:** Resumo claro do pedido antes do pagamento, `ToastMessage` animado para "Chave PIX Copiada!", e botões de ação contextuais.

3.4. Experiência do Usuário Proativa e Desempenho

* **Implementação de Telas de Carregamento Esqueleto e Experiências Offline Robustas:** `Skeleton Screens` para carregamento de provedores, horários e detalhes de agendamento.
* **Design de Estados Vazios Eficazes e Mecanismos de Feedback do Usuário:** Mensagens claras e ícones ilustrativos para listas vazias ou horários indisponíveis, com microcopy convidativo para avatares vazios.

3.5. Considerações Técnicas para a Implementação em React Native (Reflexão Geral)

* **Animações de Alto Desempenho:** O uso de `React Native Reanimated` é fundamental para transições complexas, gestos e `Skeleton Screens`, garantindo 60 FPS.
* **Gerenciamento de Formulários:** Bibliotecas como `React Hook Form` com `Zod` simplificam a validação e o gerenciamento de estado em formulários complexos.
* **Integração de APIs:** Integração real com serviços como ViaCEP para auto-preenchimento de endereço e serviços de armazenamento para upload de imagens.
* **Componentização Robusta:** Manutenção e expansão da filosofia de componentes reutilizáveis para todos os elementos da UI, garantindo consistência e facilidade de manutenção.
