# LimpeJá ✨🧹

[![Versão](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![SDK Expo](https://img.shields.io/badge/Expo%20SDK-53-purple.svg)](https://expo.dev)
[![Licença](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE.txt)
[![Status do Build (Android)](https://img.shields.io/badge/build-%3E%20ver%20no%20EAS-brightgreen.svg)](#) [![Contribuições](https://img.shields.io/badge/contributions-welcome-orange.svg)](#%EF%B8%8F-contribuindo)

Seu marketplace de confiança para encontrar e agendar os melhores profissionais de limpeza da sua região! Inspirado na praticidade e segurança do Airbnb, o LimpeJá conecta clientes a faxineiras, diaristas e outros especialistas em limpeza de forma rápida e eficiente.

---

## 📋 Índice

* [📖 Sobre o Projeto](#-sobre-o-projeto)
* [✨ Funcionalidades Principais](#-funcionalidades-principais)
    * [Para Clientes](#para-clientes)
    * [Para Profissionais de Limpeza](#para-profissionais-de-limpeza-prestadores)
* [🛠️ Tecnologias Utilizadas (Frontend)](#️-tecnologias-utilizadas-frontend)
* [🔩 Arquitetura Backend (Sugestão)](#-arquitetura-backend-sugestão)
    * [Tecnologias Sugeridas (Exemplo com Firebase)](#tecnologias-sugeridas-exemplo-com-firebase)
    * [Módulos Principais do Backend](#módulos-principais-do-backend)
* [🔗 Conexão Frontend-Backend](#-conexão-frontend-backend)
    * [Cliente API (Axios)](#cliente-api-axios)
    * [Camada de Serviços](#camada-de-serviços)
    * [Fluxo de Dados Típico](#fluxo-de-dados-típico)
    * [Autenticação e Tokens](#autenticação-e-tokens)
    * [Comunicação em Tempo Real (Exemplo com Firebase)](#comunicação-em-tempo-real-exemplo-com-firebase)
* [📁 Estrutura do Projeto (Frontend)](#-estrutura-do-projeto-frontend)
* [🚀 Começando (Getting Started)](#-começando-getting-started)
    * [Pré-requisitos](#pré-requisitos)
    * [Instalação](#instalação)
    * [Rodando Localmente](#rodando-localmente)
* [📱 Gerando um APK para Teste (Android)](#-gerando-um-apk-para-teste-android)
* [🤝 Contribuindo](#️-contribuindo)
* [📜 Licença](#-licença)
* [📞 Contato](#-contato)
* [💰 LimpeJá Ganhos: Nossa Estratégia de Monetização](#-limpejá-ganhos-nossa-estratégia-de-monetização)
* [❤️ Feito por](#️-feito-por)

---

## 📖 Sobre o Projeto

O LimpeJá visa revolucionar a forma como serviços de limpeza são contratados e gerenciados. Para clientes, oferecemos uma plataforma intuitiva para descobrir profissionais qualificados, verificar avaliações, agendar serviços com datas e horários flexíveis, e realizar pagamentos seguros. Para os profissionais de limpeza, o LimpeJá é uma ferramenta poderosa para expandir sua clientela, gerenciar sua agenda de forma autônoma, e receber pagamentos de forma garantida e simplificada.

Construído com tecnologia de ponta, o aplicativo oferece uma experiência de usuário fluida e moderna, tanto para quem busca um ambiente limpo quanto para quem oferece o serviço de limpeza.

---

## ✨ Funcionalidades Principais

### Para Clientes:
* 🧼 **Busca Inteligente:** Encontre profissionais por especialidade, localização e avaliações.
* 📅 **Agendamento Flexível:** Escolha datas e horários que se encaixem na sua rotina.
* 💳 **Pagamento Seguro:** Transações protegidas dentro da plataforma.
* ⭐ **Avaliações Confiáveis:** Deixe e veja avaliações para ajudar a comunidade.
* 💬 **Comunicação Direta:** Chat integrado para combinar detalhes com o profissional.
* 🏠 **Perfis Detalhados:** Veja informações completas sobre os profissionais.

### Para Profissionais de Limpeza (Prestadores):
* 🚀 **Visibilidade Ampliada:** Alcance mais clientes e aumente sua renda.
* 🗓️ **Gestão de Agenda:** Controle total sobre seus horários e disponibilidade.
* 💰 **Pagamentos Garantidos:** Receba de forma segura e pontual pelos seus serviços.
* 📊 **Perfil Profissional:** Mostre suas habilidades, experiência e avaliações.
* 🔔 **Notificações em Tempo Real:** Sobre novos pedidos e mensagens.

---

## 🛠️ Stack Utilizada 

* **React Native**: Para desenvolvimento mobile multiplataforma (Android & iOS).
* **Expo (SDK 53)**: Para um fluxo de desenvolvimento gerenciado, builds e atualizações.
* **Expo Router (v5)**: Para navegação baseada em arquivos, robusta e tipada.
* **TypeScript**: Para um código mais seguro, manutenível e escalável.
* **EAS (Expo Application Services)**:
    * `EAS Build`: Para compilação de APKs/AABs e IPAs na nuvem.
    * `EAS Submit`: Para envio para as lojas (futuramente).
    * `EAS Update`: Para atualizações over-the-air (futuramente).
* **Context API (React)**: Para gerenciamento de estado global (Autenticação, Configurações do App).
* **Axios**: Para chamadas HTTP à API backend.
* **Componentes Nativos da Comunidade**: Como `@react-native-community/datetimepicker`.
* **Ícones**: `@expo/vector-icons`.

---


## 🔗 Conexão Frontend-Backend

🔗 Conexão Frontend-Backend
O frontend do LimpeJá, construído com React Native + Expo Router v5, se comunica diretamente com o backend baseado em Firebase Cloud Functions, utilizando uma arquitetura serverless escalável, segura e modularizada por domínio de negócio.

🔄 Comunicação entre Camadas
O frontend realiza chamadas:

A funções HTTP (ex: GET /checkAuthStatus, POST /create-pix-charge)

A funções Callable (invocadas diretamente pelo SDK Firebase)

A autenticação é gerenciada pelo Firebase Authentication, tanto no cliente (firebase/auth) quanto no servidor (firebase-admin).

As operações são protegidas por validação de Custom Claims, middleware e validação de dados com Zod.

📦 Módulos do Backend Invocados no Frontend
Módulo	Frontend (arquivo)	Backend (função)	Tipo
Autenticação	login.tsx, register-options.tsx	authApi, processNewUser	HTTP, Trigger
Cadastro Cliente	client-register.tsx	processNewUser	Trigger
Cadastro Profissional	provider-register/*.tsx	submitProviderRegistration	Callable
Perfil e Endereço	profile/edit.tsx	updateUserProfile, addUserAddress	Callable
Agendamentos	schedule-service.tsx, bookings/*.tsx	bookingsApi, updateBookingStatus, requestBookingReschedule	HTTP, Callable
Pagamentos PIX	schedule-service.tsx, earnings.tsx	createPixCharge, requestProviderPayout, getMyPaymentHistory	HTTP, Callable
Notificações	notifications.tsx	getNotificationsHistory, markNotificationsAsRead	Callable
Chat	messages/[chatId].tsx	onNewChatMessage	Trigger
Avaliações	feedback/[targetId].tsx	submitReview	Callable

🧩 Como os Componentes se Relacionam
O Contexto de Autenticação (AuthContext.tsx) realiza login, logout e atualização de dados via funções callable e API REST.

O Cadastro de Prestadores utiliza useProviderRegistration, agregando dados das etapas e enviando para submitProviderRegistration (Callable).

As telas de agendamento (cliente) e de serviços/agenda (prestador) invocam endpoints REST e Callable para criação, atualização e cancelamento de bookings.

O sistema de notificações mostra histórico no frontend e marca como lidas via função callable.

O fluxo financeiro (prestador) chama funções que geram cobranças PIX, solicitam saques e mostram histórico de transações.

🔐 Segurança e Validações
Todas as funções Callable e HTTP no backend utilizam assertAuthenticated e assertRole (em helpers.ts) para garantir acesso seguro.

Dados são validados com Zod em ambos os lados: entrada no frontend e entrada nas Cloud Functions.

Tokens FCM são armazenados e utilizados para notificações push em tempo real.

📚 Exemplos de Fluxos
Cadastro e Login:
register-options.tsx → client-register.tsx ou provider-register/*.tsx

Firebase Auth cria o usuário → dispara processNewUser

Após login, frontend chama checkAuthStatus para verificar o role (client, provider, admin)

Agendamento e Pagamento:
schedule-service.tsx cria agendamento via POST / (bookingsApi)

Geração de cobrança PIX via POST /create-pix-charge

Pagamento confirmado via webhook → status atualizado no Firestore

Notificação enviada para cliente e prestador

## 📁 Estrutura do Projeto inteiro
LimpeJaApp/ (Raiz do seu projeto)
app/
├── (auth)/
│   ├── provider-register/
│   │   ├── index.tsx
│   │   ├── layout.tsx
│   │   ├── personal-details.tsx
│   │   └── service-details.tsx
│   ├── client-register.tsx
│   ├── forgot-password.tsx
│   ├── layout.tsx
│   ├── login.tsx
│   └── register-options.tsx
├── (client)/
│   ├── bookings/
│   │   ├── [bookingId].tsx
│   │   ├── index.tsx
│   │   ├── schedule-service.tsx
│   │   └── success.tsx
│   ├── explore/
│   │   ├── [providerId].tsx
│   │   ├── index.tsx
│   │   ├── resultados-busca.tsx
│   │   ├── search-results.tsx
│   │   ├── servicos-por-categoria.tsx
│   │   ├── todas-categorias.tsx
│   │   └── todos-prestadores-proximos.tsx
│   ├── messages/
│   │   ├── [chatId].tsx
│   │   └── index.tsx
│   ├── ofertas/
│   │   └── [ofertaId].tsx
│   └── profile/
│       ├── edit.tsx
│       ├── index.tsx
│       └── layout.tsx
├── (common)/
│   ├── feedback/
│   │   └── [targetId].tsx
│   ├── help.tsx
│   ├── layout.tsx
│   ├── notifications.tsx
│   ├── privacidade.tsx
│   ├── settings.tsx
│   └── termos.tsx
├── (provider)/
│   ├── messages/
│   │   ├── [chatId].tsx
│   │   └── index.tsx
│   ├── profile/
│   │   ├── edit-services.tsx
│   │   └── index.tsx
│   ├── schedule/
│   │   ├── index.tsx
│   │   └── manage-availability.tsx
│   └── services/
│       ├── [serviceId].tsx
│       └── index.tsx
├── dashboard.tsx
├── earnings.tsx
├── layout.tsx
├── _layout.tsx
├── +not-found.tsx
├── index.tsx
└── welcome.tsx
assets/
├── fonts/
└── images/
components/
├── home/
│   ├── BottomNavBar.tsx
│   ├── CategoriaCard.tsx
│   ├── CategoryGrid.tsx
│   ├── SearchBar.tsx
│   ├── ServiceCard.tsx
│   ├── ServiceList.tsx
│   └── TopBar.tsx
├── layout/
│   └── CustomHeader.tsx
├── schedule/
│   ├── AddressSection.tsx
│   ├── CalendarHeader.tsx
│   ├── PaymentMethodSelection.tsx
│   └── TimeSlotButton.tsx
├── specific/
│   └── ServiceBookingCard.tsx
├── ui/
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── IconSymbol.ios.tsx
│   ├── IconSymbol.tsx
│   ├── Input.tsx
│   ├── TabBarBackground.ios.tsx
│   └── TabBarBackground.tsx
├── BannerOferta.tsx
├── CategoriaCard.tsx
├── Collapsible.tsx
├── ExternalLink.tsx
├── HapticTab.tsx
├── HeaderSuperior.tsx
├── HelloWave.tsx
├── ListaPrestadores.tsx
├── NavBar.tsx
├── ParallaxScrollView.tsx
├── PrestadorCard.tsx
├── SaudacaoContainer.tsx
├── SecaoContainer.tsx
├── SecaoPrestadores.tsx
├── ThemedText.tsx
└── ThemedView.tsx
config/
├── appConfig.ts
constants/
├── Colors.ts
├── routes.ts
├── strings.ts
└── theme.ts
contexts/
├── AppContext.tsx
├── AuthContext.tsx
└── ProviderRegistrationContext.tsx
documentation/
├── backend.md
└── frontend.md
functions/
├── node_modules/
├── src/
│   ├── admin/
│   │   ├── callable.ts
│   │   ├── auth/
│   │   │   ├── http.ts
│   │   │   └── triggers.ts
│   ├── bookings/
│   │   ├── callable.ts
│   │   ├── http.ts
│   │   └── triggers.ts
│   ├── chat/
│   │   └── triggers.ts
│   ├── config/
│   │   ├── environment.ts
│   │   └── firebaseAdmin.ts
│   ├── lib/
│   ├── notifications/
│   │   ├── callable.ts
│   │   ├── triggers.ts
│   │   └── utils.ts
│   ├── payments/
│   │   ├── callable.ts
│   │   ├── http.ts
│   │   └── triggers.ts
│   ├── providers/
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── reviews/
│   │   ├── callable.ts
│   │   └── triggers.ts
│   └── services/
│       ├── firestore.service.ts
│       ├── notification.service.ts
│       └── paymentGateway.service.ts
types/
├── booking.types.ts
├── chat.types.ts
├── index.ts
├── notification.types.ts
├── payment.types.ts
├── provider.types.ts
├── review.types.ts
├── service.types.ts
└── user.types.ts
users/
├── callable.ts
└── triggers.ts
utils/
├── helpers.ts
├── notifications.ts
├── validators.ts
└── index.ts
hooks/
├── useAuth.ts
├── useColorScheme.ts
├── useColorScheme.web.ts
├── useFormValidation.ts
└── useThemeColor.ts
services/
├── api.ts
├── authService.ts
└── clientService.ts
scripts/
└── reset-project.js
.eslintrc.js
.gitignore
package.json
package-lock.json
tsconfig.json
tsconfig.dev.json



Para suportar as funcionalidades do LimpeJá, incluindo cadastro de clientes e prestadores, agendamentos, pagamentos e a estratégia de ganhos, um backend robusto é essencial. Uma abordagem prática e escalável, especialmente para acelerar o desenvolvimento inicial, seria utilizar uma plataforma Backend-as-a-Service (BaaS) como o **Firebase (Google)**. Alternativamente, stacks customizadas como Node.js (com NestJS/Express) + PostgreSQL também são excelentes escolhas para maior controle.

### Tecnologias Sugeridas (Exemplo com Firebase):

* **Firebase Authentication**: Para cadastro e login de usuários (email/senha, login social), gerenciamento de sessão e segurança. Suporta diferenciação de perfis via custom claims.
* **Cloud Firestore (NoSQL Database)**: Banco de dados flexível e escalável para armazenar informações de usuários (clientes e prestadores), detalhes de serviços, agendamentos, avaliações, conversas de chat, etc. Permite consultas em tempo real.
* **Cloud Functions for Firebase**: Para executar lógica de backend sem gerenciar servidores. Ideal para:
    * Processar pagamentos (integrando com gateways como Stripe ou Mercado Pago).
    * Calcular comissões e preparar repasses para prestadores.
    * Enviar notificações complexas.
    * Validar dados e executar tarefas de moderação.
    * Lógica de negócios customizada que não deve residir no cliente.
* **Firebase Storage**: Para armazenamento de arquivos como fotos de perfil de usuários e prestadores, ou possíveis documentos de verificação.
* **Firebase Cloud Messaging (FCM)**: Para enviar notificações push para os dispositivos dos usuários (novos agendamentos, mensagens de chat, lembretes, etc.).
* **Gateway de Pagamento (Ex: Stripe, Mercado Pago, Pagar.me):** Integrado através de Cloud Functions para processar pagamentos dos clientes e gerenciar repasses para os prestadores.

### Módulos Principais do Backend:

Independentemente da tecnologia escolhida, os seguintes módulos seriam necessários:

1.  **Autenticação e Gerenciamento de Usuários:**
    * Registro e login para clientes e prestadores (com diferenciação de roles).
    * Gerenciamento de perfis (CRUD para dados pessoais, endereços, informações bancárias para prestadores, etc.).
    * Upload e gerenciamento de fotos de perfil.
    * (Opcional) Fluxo de verificação de documentos para prestadores.
2.  **Gerenciamento de Serviços (para Prestadores):**
    * Cadastro dos tipos de serviços oferecidos (Limpeza Padrão, Pesada, Pós-obra, etc.).
    * Definição de preços, duração estimada, e descrição para cada serviço.
3.  **Gerenciamento de Disponibilidade (para Prestadores):**
    * Configuração de horários de trabalho semanais.
    * Bloqueio de datas/horários específicos.
4.  **Busca e Descoberta:**
    * API para clientes buscarem prestadores por tipo de serviço, localização, data, avaliações.
    * (Opcional) Suporte a queries geoespaciais.
5.  **Sistema de Agendamento:**
    * API para clientes solicitarem/criarem agendamentos.
    * API para prestadores aceitarem/recusarem/gerenciarem seus agendamentos.
    * Lógica para verificar disponibilidade do prestador.
    * Gerenciamento do ciclo de vida do agendamento (pendente, confirmado, em andamento, concluído, cancelado).
6.  **Processamento de Pagamentos e Repasses:**
    * Integração com gateway de pagamento para cobrar clientes.
    * Lógica para reter o valor e calcular a comissão do LimpeJá.
    * Sistema para agendar e processar repasses para os prestadores.
7.  **Sistema de Avaliações e Comentários:**
    * Clientes avaliam prestadores (e serviços) após a conclusão.
    * (Opcional) Prestadores avaliam clientes.
8.  **Notificações:**
    * Envio de notificações push e/ou in-app para eventos importantes.
9.  **Chat (Opcional, se não usar solução de terceiros):**
    * Backend para troca de mensagens em tempo real.
10. **Painel Administrativo (para a equipe LimpeJá):**
    * Ferramentas para gerenciar usuários, resolver disputas, visualizar métricas, etc.


## 📁 Estrutura de pastas (Fronend)
LimpeJaApp/
├── app/
│   ├── (auth)/ # Fluxo de Autenticação
│   │   ├── api/
│   │   │   ├── authService.ts # mockAuthService (login, register)
│   │   │   ├── addressService.ts # mockViaCepApi
│   │   │   └── storageService.ts # mockFirebaseStorageApi (para upload de avatar)
│   │   ├── components/
│   │   │   ├── AnimatedErrorMessage.tsx # Componente de erro animado
│   │   │   └── ErrorMessage.tsx # Componente de erro simples
│   │   ├── provider-register/
│   │   │   ├── index.tsx
│   │   │   ├── _layout.tsx
│   │   │   ├── personal-details.tsx
│   │   │   └── service-details.tsx
│   │   ├── client-register.tsx
│   │   ├── forgot-password.tsx
│   │   ├── _layout.tsx # Layout do grupo de autenticação
│   │   ├── login.tsx
│   │   └── register-options.tsx
│   │
│   ├── (client)/ # Funcionalidades do Cliente
│   │   ├── bookings/ # Agendamentos do Cliente
│   │   │   ├── api/
│   │   │   │   ├── bookingService.ts # fetchBookingDetailsFromAPI
│   │   │   │   └── schedulingService.ts # fetchAvailableTimeSlotsAPI
│   │   │   ├── components/
│   │   │   │   ├── AnimatedBookingItem.tsx
│   │   │   │   └── PaymentMethodSelection.tsx # Se for específico do agendamento do cliente
│   │   │   ├── [bookingId].tsx
│   │   │   ├── index.tsx
│   │   │   ├── schedule-service.tsx
│   │   │   └── success.tsx
│   │   ├── explore/ # Explorar Serviços/Profissionais
│   │   │   ├── api/
│   │   │   │   └── providerService.ts # fetchProviderDetailsFromAPI (para visão do cliente), MOCK_PROVIDERS, TODOS_OS_PRESTADORES_DETALHES
│   │   │   ├── components/
│   │   │   │   ├── CategoriaCard.tsx
│   │   │   │   ├── PrestadorCard.tsx
│   │   │   │   ├── SecaoContainer.tsx
│   │   │   │   ├── SecaoPrestadores.tsx
│   │   │   │   └── SaudacaoContainer.tsx # Movido de components/
│   │   │   ├── [providerId].tsx
│   │   │   ├── index.tsx
│   │   │   ├── search-results.tsx # Renomeado de resultados-busca.tsx (se for o mesmo)
│   │   │   ├── services-by-category.tsx # Renomeado de servicos-por-categoria.tsx
│   │   │   ├── all-categories.tsx # Renomeado de todas-categorias.tsx
│   │   │   └── all-nearby-providers.tsx # Renomeado de todos-prestadores-proximos.tsx
│   │   ├── messages/ # Mensagens do Cliente
│   │   │   ├── api/
│   │   │   │   └── chatService.ts # mockChatService, MOCK_CONVERSATIONS (cliente)
│   │   │   ├── components/
│   │   │   │   └── AnimatedConversationItem.tsx
│   │   │   ├── [chatId].tsx
│   │   │   └── index.tsx
│   │   ├── offers/ # Ofertas do Cliente
│   │   │   ├── api/
│   │   │   │   └── offerService.ts # MOCK_OFFERS, fetchOfferDetailsFromAPI
│   │   │   ├── components/
│   │   │   │   └── BannerOferta.tsx # Movido de components/
│   │   │   └── [ofertaId].tsx
│   │   └── profile/ # Perfil do Cliente
│   │       ├── api/
│   │       │   └── profileService.ts # updateClientProfile (mock)
│   │       ├── components/
│   │       │   └── AnimatedMenuItem.tsx
│   │       ├── edit.tsx
│   │       ├── index.tsx
│   │       └── _layout.tsx # Layout do grupo de perfil do cliente
│   ├── _layout.tsx # Layout das abas do cliente
│
│   ├── (common)/ # Funcionalidades Comuns (cliente e provedor)
│   │   ├── api/
│   │   │   ├── feedbackService.ts # submitFeedback (mock)
│   │   │   └── notificationService.ts # getNotifications (mock)
│   │   ├── components/
│   │   │   ├── AnimatedFaqItem.tsx
│   │   │   ├── AnimatedContactButton.tsx
│   │   │   ├── AnimatedNotificationItem.tsx
│   │   │   ├── AnimatedSettingNavigationItem.tsx
│   │   │   └── AnimatedSettingSwitchItem.tsx
│   │   ├── feedback/
│   │   │   └── [targetId].tsx
│   │   ├── help.tsx
│   │   ├── _layout.tsx # Layout do grupo comum
│   │   ├── notifications.tsx
│   │   ├── privacy-policy.tsx # Renomeado de privacidade.tsx
│   │   ├── settings.tsx
│   │   └── terms-and-conditions.tsx # Renomeado de termos.tsx
│   │
│   ├── (provider)/ # Funcionalidades do Provedor
│   │   ├── api/
│   │   │   ├── earningsService.ts # fetchEarningsData
│   │   │   └── providerProfileService.ts # (para detalhes bancários, etc.)
│   │   ├── messages/ # Mensagens do Provedor
│   │   │   ├── api/
│   │   │   │   └── chatService.ts # MOCK_CONVERSATIONS (provedor) - pode ser compartilhado
│   │   │   ├── components/
│   │   │   │   └── AnimatedConversationItem.tsx
│   │   │   ├── [chatId].tsx # Pode reutilizar a UI de chat do cliente
│   │   │   └── index.tsx
│   │   ├── profile/ # Perfil do Provedor
│   │   │   ├── api/
│   │   │   │   └── providerService.ts # (para edit-services, etc.)
│   │   │   ├── components/
│   │   │   │   └── AnimatedServiceItem.tsx # Da tela de edição de serviços do provedor
│   │   │   ├── edit-services.tsx
│   │   │   └── index.tsx
│   │   ├── schedule/ # Agenda/Disponibilidade do Provedor
│   │   │   ├── api/
│   │   │   │   ├── scheduleService.ts # fetchProviderAppointments
│   │   │   │   └── availabilityService.ts # getProviderAvailability, updateProviderAvailability
│   │   │   ├── components/
│   │   │   │   ├── AnimatedAppointmentItem.tsx
│   │   │   │   ├── AnimatedTimeSlot.tsx
│   │   │   │   └── AnimatedDayCard.tsx
│   │   │   ├── index.tsx
│   │   │   └── manage-availability.tsx
│   │   └── services/ # Serviços/Solicitações do Provedor
│   │       ├── api/
│   │       │   └── serviceRequestService.ts # fetchProviderServices, MOCK_SERVICE_DETAILS
│   │       ├── components/
│   │       │   └── AnimatedServiceItem.tsx # Da tela de serviços do provedor
│   │       ├── [serviceId].tsx
│   │       └── index.tsx
│   │   ├── dashboard.tsx # Tela principal do painel do provedor
│   │   ├── earnings.tsx # Tela de ganhos do provedor
│   │   ├── _layout.tsx # Layout das abas do provedor
│   │
│   ├── _layout.tsx # Layout raiz global (Expo Router)
│   ├── +not-found.tsx
│   ├── index.tsx # Lógica de redirecionamento inicial
│   └── welcome.tsx # Tela de boas-vindas inicial
│
├── assets/ # Recursos estáticos
│   ├── fonts/
│   └── images/
│
├── components/ # Componentes de UI verdadeiramente reutilizáveis e atômicos (globais)
│   ├── layout/
│   │   ├── CustomHeader.tsx
│   │   ├── HeaderSuperior.tsx
│   │   └── NavBar.tsx
│   ├── schedule/ # Componentes de agendamento que são usados por ambos os papéis
│   │   ├── AddressSection.tsx
│   │   ├── CalendarHeader.tsx
│   │   ├── PaymentMethodSelection.tsx
│   │   └── TimeSlotButton.tsx
│   ├── ui/ # Componentes de UI genéricos e atômicos
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Collapsible.tsx # Movido de 'outros'
│   │   ├── ExternalLink.tsx # Movido de 'outros'
│   │   ├── HapticTab.tsx # Movido de 'outros'
│   │   ├── HelloWave.tsx # Movido de 'outros'
│   │   ├── IconSymbol.ios.tsx
│   │   ├── IconSymbol.tsx
│   │   ├── Input.tsx
│   │   ├── ParallaxScrollView.tsx # Movido de 'outros'
│   │   ├── TabBarBackground.ios.tsx
│   │   ├── TabBarBackground.tsx
│   │   ├── ThemedText.tsx # Movido de 'outros'
│   │   └── ThemedView.tsx # Movido de 'outros'
│
├── config/
│   └── appConfig.ts
│
├── constants/
│   ├── Colors.ts
│   ├── routes.ts
│   ├── strings.ts
│   └── theme.ts
│
├── contexts/ # Contextos globais
│   ├── AppContext.tsx
│   ├── AuthContext.tsx
│   └── ProviderRegistrationContext.tsx
│
├── hooks/ # Hooks globais
│   ├── useAuth.ts
│   ├── useColorScheme.ts
│   ├── useColorScheme.web.ts
│   ├── useFormValidation.ts
│   └── useThemeColor.ts
│
├── types/ # Interfaces e tipos TypeScript globais
│   ├── auth.ts # User, AuthTokens, etc.
│   ├── booking.ts # Booking, ServiceItem, ProviderAppointment, etc.
│   ├── common.ts # NotificationItem, Feedback, etc.
│   ├── provider.ts # ProviderDetails, ServiceOffering, etc.
│   └── ... (outros tipos compartilhados)
│
├── utils/ # Funções utilitárias globais (não componentes)
│   ├── helpers.ts # formatDate
│   ├── permissions.ts # NOVO: Adicionado aqui
│   └── storage.ts # NOVO: Adicionado aqui

## 📁 Estrutura de pastas (Backend)
functions/
├── src/
│   ├── index.ts # Ponto de entrada principal, exporta todas as funções de cada domínio.
│   │              # Ex: export * from './auth/functions';
│   │              #     export * from './bookings/functions';
│   │              #     ...
│   │
│   ├── auth/ # Módulo de Autenticação e Gerenciamento de Usuários
│   │   ├── functions.ts # Exporta as Cloud Functions de auth (createUser, loginUser, updateUserProfile, deleteUserAccount)
│   │   ├── service.ts # Lógica de negócio específica de auth (ex: validação de email, hashing de senha se não for Firebase Auth)
│   │   └── triggers.ts # Triggers do Firebase Auth (ex: onCreate, onDelete de usuários)
│   │
│   ├── bookings/ # Módulo de Agendamentos
│   │   ├── functions.ts # Exporta as Cloud Functions de agendamentos (createAppointment, updateAppointmentStatus, getUserAppointments)
│   │   ├── service.ts # Lógica de negócio de agendamento (ex: verificação de disponibilidade, regras de agendamento recorrente, lógica idempotente)
│   │   └── triggers.ts # Triggers do Firestore para agendamentos (ex: onCreate, onUpdate de 'appointments')
│   │
│   ├── chat/ # Módulo de Chat
│   │   ├── functions.ts # Exporta as Cloud Functions de chat (se houver HTTP/Callable)
│   │   ├── service.ts # Lógica de negócio de chat
│   │   └── triggers.ts # Triggers do Firestore para mensagens/chat (ex: onCreate de 'messages')
│   │
│   ├── common/ # Funções e utilitários COMUNS a múltiplos domínios ou de propósito muito geral.
│   │   ├── constants.ts # Constantes globais (ex: STATUS_AGENDAMENTO)
│   │   ├── errors.ts # Definições de erros customizados
│   │   ├── interfaces.ts # Interfaces globais ou genéricas
│   │   ├── utils.ts # Funções utilitárias genéricas (ex: formatadores de data, geradores de ID)
│   │   └── validators.ts # Funções de validação genéricas
│   │
│   ├── config/ # Configurações e inicialização do Firebase Admin SDK
│   │   ├── firebaseAdmin.ts # Inicialização do app Firebase Admin
│   │   └── index.ts # Exporta a instância do Admin
│   │
│   ├── notifications/ # Módulo de Notificações
│   │   ├── functions.ts # Exporta as Cloud Functions de notificação (sendAppointmentConfirmation, sendPaymentConfirmation, sendServiceReminder)
│   │   ├── service.ts # Lógica de envio de notificações (integração com FCM/SendGrid/outros)
│   │   └── triggers.ts # Triggers para disparo de notificações (ex: onCreate de 'appointments', onUpdate de 'transactions')
│   │
│   ├── payments/ # Módulo de Pagamentos
│   │   ├── functions.ts # Exporta as Cloud Functions de pagamento (createPaymentIntent, refundPayment)
│   │   ├── service.ts # Lógica de negócio de pagamento (ex: cálculo de comissão, regras de reembolso, integração com Stripe/MercadoPago)
│   │   └── triggers.ts # Triggers do Firestore para pagamentos, ou HTTP webhook para gateways de pagamento
│   │
│   ├── providers/ # Módulo de Prestadores (gerenciamento de dados de prestadores, não necessariamente as funções de autenticação deles)
│   │   ├── functions.ts # Exporta Cloud Functions relacionadas a prestadores (ex: getProviderProfile, updateProviderAvailability)
│   │   ├── service.ts # Lógica de negócio de prestadores (ex: curadoria, verificação)
│   │   └── triggers.ts # Triggers do Firestore para perfis de prestadores
│   │
│   ├── reviews/ # Módulo de Avaliações
│   │   ├── functions.ts # Exporta Cloud Functions de avaliações (ex: submitReview, getReviewsForProvider)
│   │   ├── service.ts # Lógica de negócio de avaliações (ex: cálculo de média, validação)
│   │   └── triggers.ts # Triggers do Firestore para avaliações
│   │
│   ├── services/ # Módulo de Serviços (o "que" é oferecido, como limpeza, jardinagem)
│   │   ├── functions.ts # Exporta Cloud Functions de serviços (ex: listAvailableServices, getServiceDetails)
│   │   ├── service.ts # Lógica de negócio de serviços (ex: regras de precificação, categorização)
│   │   └── triggers.ts # Triggers do Firestore para serviços
│   │
│   ├── admin/ # Funções de Admin (operações que só o admin pode fazer)
│   │   ├── functions.ts # Funções Callable ou HTTP restritas para o painel de admin
│   │   └── service.ts # Lógica de negócio de admin (ex: aprovar prestador, gerenciar usuários)
│   │
│   ├── dal/ # Data Access Layer (Camada de Acesso a Dados)
│   │   ├── firestore.ts # Funções genéricas para interagir com o Firestore (CRUD básico, transações atômicas)
│   │   └── models/ # Definição de modelos de dados Firestore (ex: user.model.ts, appointment.model.ts)
│   │       └── index.ts # Exporta todos os modelos
│   │
│   └── types/ # Definições de tipos TypeScript ESPECÍFICOS para a API de funções/backend
│       ├── index.ts
│       ├── auth.d.ts # Tipos para payload de request/response de auth
│       ├── booking.d.ts # Tipos para payload de request/response de booking
│       └── common.d.ts # Tipos comuns de API (ex: ApiResponse)

essa Estrutura de Backend com Firebase Functions:

Instalar o Firebase CLI (se ainda não o fez):
No seu terminal (não necessariamente dentro da pasta do projeto ainda, pois é uma instalação global):



npm install -g firebase-tools
Fazer Login no Firebase:
Ainda no terminal:



firebase login
Isso abrirá o navegador para você fazer login com sua conta Google associada ao Firebase.

Inicializar o Firebase no seu Projeto LimpeJá:

Navegue até a raiz do seu projeto LimpeJaApp/ no terminal.
Rode o comando:


firebase init functions
O CLI do Firebase fará algumas perguntas:
"Which Firebase project do you want to associate with this directory?": Se você já criou um projeto "LimpeJá" no console do Firebase (console.firebase.google.com), selecione "Use an existing project". Se não, você pode selecionar "Create a new project".
"What language would you like to use to write Cloud Functions?": Escolha TypeScript.
"Do you want to use ESLint to catch probable bugs and enforce style?": Responda Yes (y) (recomendado). O ESLint ajudará a manter a qualidade do seu código.
"Do you want to install dependencies with npm now?": Responda Yes (y).
Este processo criará a pasta functions/ com uma estrutura inicial, incluindo src/index.ts, package.json (para as dependências das functions), tsconfig.json (para o TypeScript das functions), etc.
Estruturar sua Pasta functions/src/:
Após o firebase init functions, a pasta functions/src/ será criada com um index.ts. Você então começará a criar as subpastas e arquivos que detalhamos (como auth/, users/, bookings/, services/, types/, etc.) dentro de functions/src/ para organizar sua lógica de backend.

Inicializar Outros Serviços do Firebase (Firestore, Storage):
Se você também for usar o Firestore como banco de dados e o Firebase Storage para arquivos, você também pode inicializá-los na raiz do seu projeto LimpeJaApp/ (se ainda não o fez):



firebase init firestore


firebase init storage
Isso criará os arquivos de regras de segurança (firestore.rules, storage.rules) e pode criar um firebase.json (ou atualizá-lo) na raiz do seu projeto LimpeJá (fora da pasta functions/). O arquivo .firebaserc também será criado/atualizado para vincular sua pasta local ao projeto Firebase.

Separação Clara de Responsabilidades:

Seu frontend (na pasta app/, components/, services/, etc.) cuida da interface do usuário, da experiência do usuário e da lógica de apresentação.
O backend na pasta functions/ (com Cloud Functions) cuida da lógica de negócios segura, interações com o banco de dados (Firestore), processamento de pagamentos, envio de notificações, etc. Essa separação é fundamental para um projeto organizado e escalável.
Modularidade Consistente:

A estrutura modular que sugerimos para functions/src/ (ex: auth/, users/, bookings/, payments/) espelha as necessidades das diferentes funcionalidades do seu frontend. Por exemplo, as funções em functions/src/bookings/ seriam chamadas quando o usuário clica em "Agendar Serviço" no frontend.
Comunicação via API e SDKs Firebase:

Frontend (LimpeJaApp/services/api.ts): O seu api.ts (com Axios) no frontend fará chamadas HTTP para os endpoints que você expor através das Cloud Functions HTTP.
Cloud Functions (HTTP Triggers ou Callable Functions): Você criará funções no backend que respondem a essas requisições HTTP, processam a lógica e interagem com o Firestore ou outros serviços Firebase.
SDKs do Firebase no Cliente: Para funcionalidades como autenticação (Firebase Authentication) e acesso direto a dados em tempo real ou offline (Cloud Firestore), o frontend pode usar os SDKs cliente do Firebase, o que simplifica muitas operações.
Fluxo de Autenticação Integrado:

O frontend usa o Firebase Authentication para o login/cadastro.
Uma Cloud Function (trigger onCreateUser em functions/src/auth/triggers.ts) pode ser usada para adicionar informações extras ao usuário no Firestore assim que ele é criado (como definir o role 'cliente' ou 'provedor').
O AuthContext no frontend gerencia o estado do usuário e o token JWT, que é enviado nas chamadas para as Cloud Functions protegidas.
Dados em Tempo Real e Notificações:

Firestore: Se você usar o Firestore para o chat ou para status de agendamentos, o frontend pode "escutar" (subscribe) essas coleções em tempo real e atualizar a UI instantaneamente.
Firebase Cloud Messaging (FCM): As Cloud Functions (em functions/src/notifications/triggers.ts) podem ser acionadas por eventos (novo agendamento, nova mensagem) para enviar notificações push para os dispositivos dos usuários.
Armazenamento de Arquivos:

O frontend (ex: na tela de edição de perfil ou cadastro de provedor) permitirá o upload de imagens.
Essas imagens podem ser enviadas para o Firebase Storage, e as Cloud Functions podem processá-las ou apenas armazenar as URLs de referência no Firestore.
Tipos Compartilhados (Idealmente):

Você tem uma pasta types/ no frontend e uma functions/src/types/ no backend. Para evitar erros e inconsistências, os tipos de dados principais (como User, Prestador, Booking, ServiceOffering) devem ser idênticos ou vir de um local compartilhado (em um setup monorepo mais avançado, ou mantendo-os sincronizados manualmente por enquanto).
Como a Conexão Acontece na Prática (Exemplo: Cliente agenda um serviço):

Frontend (Cliente):
Usuário preenche o formulário em app/(client)/bookings/schedule-service.tsx.
Ao clicar em "Confirmar Agendamento", a função handleConfirmBooking chama uma função em LimpeJaApp/services/clientService.ts (ex: createBooking(bookingData)).
Frontend (clientService.ts):
A função createBooking monta o objeto de dados do agendamento.
Usa a instância do api (Axios) para fazer uma requisição POST para um endpoint HTTP de uma Cloud Function (ex: https://sua-regiao-seuprojeto.cloudfunctions.net/api/bookings). O token de autenticação do usuário é enviado no header.
Backend (Cloud Function em functions/src/bookings/http.ts ou callable.ts):
A Cloud Function recebe a requisição.
Valida os dados e o token do usuário.
Verifica a disponibilidade do prestador no Firestore.
Cria o novo documento de agendamento no Firestore.
Pode disparar outras Cloud Functions (triggers) para enviar notificações para o cliente e para o prestador.
Retorna uma resposta de sucesso (ou erro) para o frontend.
Frontend (clientService.ts e Tela):
Recebe a resposta.
Atualiza a UI (ex: mostra um alerta de sucesso, navega para a lista de agendamentos).
Em resumo:
A estrutura de backend com Firebase Functions que você delineou é um excelente complemento para a estrutura do seu frontend Expo. Elas se conectarão principalmente através de:

Chamadas HTTP (via Axios no frontend para Cloud Functions HTTP no backend).
SDKs cliente do Firebase (para Auth, Firestore real-time, Storage).
Cloud Functions acionadas por eventos (triggers) para lógica reativa.


## 🤝 Contribuindo <a name="contribuindo"></a>

Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

Se você tem uma sugestão para melhorar este projeto, por favor, faça um fork do repositório e crie um pull request. Você também pode simplesmente abrir uma issue com a tag "enhancement".
Não se esqueça de dar uma estrela ao projeto! Obrigado novamente!

1.  Faça um Fork do Projeto
2.  Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit suas Mudanças (`git commit -m 'Add some AmazingFeature'`)
4.  Push para a Branch (`git push origin feature/AmazingFeature`)
5.  Abra um Pull Request

---

## 📜 Licença

Distribuído sob a Licença MIT. Veja `LICENSE.txt` para mais informações.
(Você precisará criar um arquivo `LICENSE.txt` com o texto da licença MIT se escolher esta).

---

## 📞 Contato

Paulo Silas de Campos Filho/ @techleadevelopers -  techleadevelopers@gmail.com

Link do Projeto: [https://github.com/techleadevelopers/limpe-ja-app]

---

## 💰 LimpeJá Ganhos: Nossa Estratégia de Monetização

O LimpeJá foi concebido para ser uma plataforma que beneficia tanto os clientes em busca de serviços de limpeza de qualidade quanto os profissionais que desejam expandir sua base de clientes e gerenciar seus serviços de forma eficiente. Nossa estratégia de monetização é transparente e se baseia no sucesso mútuo, inspirada em modelos de marketplace consolidados como o Airbnb, mas aplicada ao universo dos serviços de limpeza.

**Como o LimpeJá Gera Receita:**

A principal fonte de receita do LimpeJá virá de uma **comissão percentual cobrada sobre o valor de cada serviço de limpeza que é agendado e efetivamente pago através da plataforma.**

1.  **Para o Profissional (Prestador de Serviço):**
    * Ao se cadastrar, o profissional define seus preços para os diferentes tipos de serviço que oferece (ex: por hora, por tipo de limpeza, etc.).
    * Quando um cliente contrata e paga por um serviço através do LimpeJá, o valor total é processado pela plataforma.
    * O LimpeJá repassa o valor ao profissional, deduzindo uma taxa de serviço (comissão) previamente acordada e transparente. Esta taxa será nossa principal fonte de receita.
    * **Benefícios para o Profissional:** Acesso a uma ampla base de clientes, ferramentas de gerenciamento de agenda, marketing da plataforma, segurança no recebimento e processamento de pagamentos, suporte.

2.  **Para o Cliente:**
    * O cliente vê o preço total do serviço (que já inclui a porção do profissional e, implicitamente, a margem que permite a comissão do LimpeJá).
    * Em alguns modelos de marketplace, uma pequena taxa de conveniência/serviço pode ser adicionada ao cliente, mas o modelo principal geralmente foca na comissão sobre o valor pago ao prestador. Para o LimpeJá, podemos iniciar focando na comissão sobre o prestador para manter a atratividade para o cliente.
    * **Benefícios para o Cliente:** Conveniência para encontrar e agendar profissionais qualificados, variedade de escolha, sistema de avaliações para confiança, processo de pagamento simplificado e seguro, e a garantia de uma plataforma intermediando o serviço.

**Transparência e Valor:**
É crucial que a taxa de comissão seja clara para os profissionais e que o valor oferecido pela plataforma (marketing, base de clientes, ferramentas, segurança) justifique essa taxa. O sucesso do LimpeJá dependerá da criação de um ecossistema onde tanto clientes quanto profissionais vejam vantagens claras em usar a plataforma, resultando em um volume saudável de agendamentos e, consequentemente, receita para o aplicativo.

Este modelo permite que o LimpeJá cresça conforme o volume de transações na plataforma aumenta, alinhando nossos ganhos com o sucesso dos profissionais parceiros.

---

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```
   npm install
   ```

2. Start the app

   ```
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
