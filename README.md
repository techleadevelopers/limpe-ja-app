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

## 🛠️ Tecnologias Utilizadas (Frontend)

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

## 🔩 Arquitetura Backend (Sugestão)

Para suportar as funcionalidades do LimpeJá, incluindo cadastro de clientes e prestadores, agendamentos, pagamentos e a estratégia de ganhos, um backend robusto é essencial. Uma abordagem prática e escalável, especialmente para acelerar o desenvolvimento inicial, seria utilizar uma plataforma Backend-as-a-Service (BaaS) como o **Firebase (Google)**. Alternativamente, stacks customizadas como Node.js (com NestJS ou Express) + PostgreSQL também são excelentes escolhas para maior controle e flexibilidade a longo prazo.

### Tecnologias Sugeridas (Exemplo com Firebase):

* **Firebase Authentication**: Para cadastro e login de usuários (email/senha, login social), gerenciamento de sessão e segurança. Suporta diferenciação de perfis (cliente/prestador) via custom claims ou papéis no Firestore.
* **Cloud Firestore (NoSQL Database)**: Banco de dados flexível e escalável para armazenar informações de usuários, detalhes de serviços, agendamentos, avaliações, conversas de chat, etc. Permite consultas em tempo real.
* **Cloud Functions for Firebase**: Para executar lógica de backend serverless. Ideal para processar pagamentos, calcular comissões, enviar notificações, validar dados e outras lógicas de negócio.
* **Firebase Storage**: Para armazenamento de arquivos como fotos de perfil e documentos.
* **Firebase Cloud Messaging (FCM)**: Para enviar notificações push.
* **Gateway de Pagamento (Ex: Stripe, Mercado Pago, Pagar.me):** Integrado através de Cloud Functions.

### Módulos Principais do Backend:

1.  **Autenticação e Gerenciamento de Usuários** (Perfis Cliente/Prestador, roles, verificação).
2.  **Gerenciamento de Serviços e Disponibilidade** (para Prestadores).
3.  **Busca e Descoberta** (filtros, geolocalização opcional).
4.  **Sistema de Agendamento** (ciclo de vida do agendamento, status).
5.  **Processamento de Pagamentos e Repasses** (cálculo de comissão).
6.  **Sistema de Avaliações e Comentários**.
7.  **Notificações** (Push e in-app).
8.  **Chat** (mensagens em tempo real).
9.  **Painel Administrativo** (para a equipe LimpeJá).

---

## 🔗 Conexão Frontend-Backend

A comunicação entre o aplicativo frontend LimpeJá (React Native/Expo) e o backend (ex: Firebase ou uma API customizada) é fundamental. Ela ocorre principalmente através de chamadas HTTP (para APIs REST/GraphQL) e, para funcionalidades em tempo real, pode usar WebSockets ou serviços como o Firestore Realtime Updates.

### Cliente API (Axios)

* No frontend, teremos uma instância configurada do **Axios** (ou podemos usar a API `Workspace` nativa) localizada em `src/services/api.ts`.
* Este cliente API será configurado com a URL base do nosso backend.
* **Tokens de Autenticação (JWT):** Após o login bem-sucedido, o `AuthContext` armazena o token JWT (JSON Web Token). A instância do Axios é configurada para incluir automaticamente este token no cabeçalho (`Authorization: Bearer <token>`) de todas as requisições subsequentes para rotas protegidas do backend.

### Camada de Serviços

* A pasta `src/services/` (com arquivos como `authService.ts`, `clientService.ts`, `providerService.ts`) encapsula toda a lógica de comunicação com o backend.
* Cada função dentro desses arquivos de serviço será responsável por uma operação específica (ex: `loginUser()`, `getProviderDetails(id)`, `createBooking(data)`).
* Essas funções usarão a instância configurada do Axios para fazer as chamadas HTTP (GET, POST, PUT, DELETE) para os endpoints correspondentes da API backend.
* Elas tratarão as respostas da API (dados de sucesso ou erros) e retornarão os dados de forma estruturada (geralmente Promises) para as telas ou hooks que as chamarem.

### Fluxo de Dados Típico (Exemplo: Cliente buscando detalhes de um Prestador)

1.  **Ação do Usuário:** O cliente clica em um card de prestador na tela `app/(client)/explore/index.tsx`.
2.  **Navegação:** O Expo Router navega para `app/(client)/explore/[providerId].tsx`, passando o `providerId`.
3.  **Componente de Tela (`ProviderDetailsScreen`):**
    * No `useEffect`, ao receber o `providerId`, a tela chama uma função do `clientService.ts`, por exemplo: `getProviderDetails(providerId)`.
4.  **Função de Serviço (`clientService.getProviderDetails`):**
    * Esta função monta a requisição GET para o endpoint da API do backend (ex: `/providers/${providerId}`).
    * Usa a instância do Axios para enviar a requisição (o token JWT já estará no header se a rota for protegida).
5.  **Backend:**
    * A API backend recebe a requisição, busca os dados do prestador no banco de dados (ex: Firestore).
    * Retorna os dados do prestador como uma resposta JSON.
6.  **Função de Serviço (continuação):**
    * Recebe a resposta da API.
    * Pode fazer algum tratamento/transformação nos dados, se necessário.
    * Retorna os dados (ou uma Promise que resolve com os dados) para o `ProviderDetailsScreen`.
7.  **Componente de Tela (continuação):**
    * Recebe os dados do serviço.
    * Atualiza seu estado local (ex: `setProvider(dadosRecebidos)`).
    * A UI é re-renderizada para exibir os detalhes do prestador.
    * Tratamento de erros em cada etapa é crucial (ex: mostrar mensagem se a API falhar).

### Autenticação e Tokens

* **Login/Cadastro (`authService.ts`):** Envia credenciais para a API de autenticação do backend.
* **Resposta do Backend:** Retorna dados do usuário e tokens (access token, refresh token).
* **`AuthContext.tsx`:**
    * Chama `signIn(userData, tokenData)`.
    * Armazena os tokens de forma segura (usando `SecureStore` no mobile e `AsyncStorage` na web, como implementamos).
    * Atualiza o estado `user` e `isAuthenticated`.
    * Configura a instância global do Axios para usar o novo `accessToken` nos headers.
* **Requisições Autenticadas:** Todas as chamadas subsequentes feitas pela camada de `services/` para rotas protegidas da API incluirão automaticamente o token.
* **Refresh Token (Lógica Avançada):** O backend pode invalidar o `accessToken` após um tempo. O frontend (na configuração do Axios, usando interceptors) pode detectar um erro 401 (Não Autorizado), usar o `refreshToken` para obter um novo `accessToken` do backend, e então tentar a requisição original novamente.

### Comunicação em Tempo Real (Exemplo com Firebase)

* **Chat:** Se estiver usando Firestore para o chat, as telas de chat podem "escutar" (subscribe) as alterações em tempo real em uma coleção do Firestore. Novas mensagens aparecem instantaneamente.
* **Status de Agendamentos:** Similarmente, o status de um agendamento pode ser atualizado em tempo real para o cliente e para o prestador.

Esta arquitetura de comunicação visa manter as responsabilidades separadas: componentes de UI lidam com a apresentação e interação do usuário, a camada de serviços gerencia a lógica de API, e o backend cuida das regras de negócio e persistência de dados.

---

## 📁 Estrutura do Projeto (Frontend)
LimpeJaApp/ (Raiz do seu projeto)
├── app/  
│   ├── (auth)/
│   │   ├── provider-register/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx
│   │   │   ├── personal-details.tsx
│   │   │   └── service-details.tsx
│   │   ├── _layout.tsx
│   │   ├── client-register.tsx
│   │   ├── login.tsx
│   │   └── register-options.tsx
│   │
│   ├── (client)/
│   │   ├── _layout.tsx
│   │   ├── bookings/
│   │   │   ├── _layout.tsx  // Assumindo que possa ter um layout para o stack de bookings
│   │   │   ├── [bookingId].tsx
│   │   │   ├── index.tsx
│   │   │   └── schedule-service.tsx
│   │   ├── explore/
│   │   │   ├── _layout.tsx  // Assumindo que possa ter um layout para o stack de explore
│   │   │   ├── [providerId].tsx
│   │   │   ├── index.tsx
│   │   │   ├── resultados-busca.tsx
│   │   │   ├── search-results.tsx        // (Você tem resultados-busca e search-results, verifique se são diferentes ou se um pode ser removido)
│   │   │   ├── servicos-por-categoria.tsx
│   │   │   ├── todas-categorias.tsx
│   │   │   └── todos-prestadores-proximos.tsx
│   │   ├── messages/
│   │   │   ├── _layout.tsx  // Assumindo que possa ter um layout para o stack de messages
│   │   │   ├── [chatId].tsx
│   │   │   └── index.tsx
│   │   ├── ofertas/
│   │   │   ├── _layout.tsx  // Assumindo que possa ter um layout para o stack de ofertas
│   │   │   └── [ofertaId].tsx
│   │   └── profile/
│   │       ├── _layout.tsx  // Assumindo que possa ter um layout para o stack de profile
│   │       ├── edit.tsx
│   │       └── index.tsx
│   │
│   ├── (common)/
│   │   ├── _layout.tsx
│   │   ├── feedback/
│   │   │   └── [targetId].tsx
│   │   ├── help.tsx
│   │   └── settings.tsx 
│   │   └── notifications.tsx // Adicionando com base na nossa discussão
│   │
│   ├── (provider)/
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── earnings.tsx
│   │   ├── messages/
│   │   │   ├── _layout.tsx // Assumindo que possa ter um layout para o stack de messages do provider
│   │   │   ├── [chatId].tsx
│   │   │   └── index.tsx
│   │   ├── profile/
│   │   │   ├── _layout.tsx // Assumindo que possa ter um layout para o stack de profile do provider
│   │   │   ├── edit-services.tsx
│   │   │   └── index.tsx
│   │   ├── schedule/
│   │   │   ├── _layout.tsx // Assumindo que possa ter um layout para o stack de schedule do provider
│   │   │   ├── index.tsx
│   │   │   └── manage-availability.tsx
│   │   └── services/
│   │       ├── _layout.tsx // Assumindo que possa ter um layout para o stack de services do provider
│   │       ├── [serviceId].tsx
│   │       └── index.tsx
│   │
│   ├── (tabs)/             // Esta pasta apareceu na sua imagem mais recente.
│   │   └──                 // O conteúdo dela não está visível.
│   │
│   ├── _layout.tsx         // Layout raiz da aplicação (AuthProvider, AppProvider, InitialLayout)
│   ├── index.tsx           // Ponto de entrada da rota '/' (Tela inicial ou de redirecionamento)
│   └── +not-found.tsx      // Tela para rotas não encontradas
│
├── assets/
│   ├── fonts/
│   │   └── (seus arquivos de fonte)
│   └── images/
│       ├── icon.png
│       ├── adaptive-icon.png
│       ├── splash.png
│       ├── favicon.png
│       └── default-avatar.png (que discutimos)
│
├── components/
│   ├── layout/
│   │   └── CustomHeader.tsx
│   ├── specific/
│   │   └── ServiceBookingCard.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── IconSymbol.ios.tsx
│   │   ├── IconSymbol.tsx
│   │   ├── Input.tsx
│   │   ├── TabBarBackground.ios.tsx
│   │   └── TabBarBackground.tsx
│   ├── BannerOferta.tsx
│   ├── HeaderSuperior.tsx
│   ├── NavBar.tsx
│   ├── SaudacaoContainer.tsx
│   ├── SecaoContainer.tsx
│   └── SecaoPrestadores.tsx
│
├── contexts/
│   ├── AuthContext.tsx
│   └── AppContext.tsx
│
├── hooks/
│   ├── useAuth.ts
│   └── useFormValidation.ts // (Exemplo que demos, pode ter outros)
│
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── clientService.ts
│   ├── providerService.ts
│   └── paymentService.ts
│
├── types/
│   ├── index.ts
│   ├── user.ts
│   ├── navigation.ts
│   ├── service.ts
│   ├── booking.ts
│   └── (outros arquivos de tipo que você criar, ex: offer.ts, notification.ts)
│
├── utils/
│   ├── helpers.ts
│   ├── storage.ts
│   └── permissions.ts
│
├── .expo/                // Gerado pelo Expo
├── .vscode/              // Configurações do VSCode
├── node_modules/         // Dependências
├── scripts/              // Seus scripts customizados (ex: reset-project.js)
├── .gitignore
├── app.json
├── eas.json
├── babel.config.js
├── eslint.config.js (ou .eslintrc.js)
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json


## 🔩 Arquitetura Backend (Sugestão)

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


## 📁 Estrutura do Projeto (Backend)
├── functions/                # <<<--- PASTA DO SEU BACKEND (Cloud Functions)
│   ├── src/                  # Código fonte TypeScript das suas functions
│   │   ├── index.ts          # Ponto de entrada principal, exporta todas as functions
│   │   │
│   │   ├── auth/             # Lógica relacionada à autenticação customizada
│   │   │   ├── triggers.ts     # Ex: onCreateUser para definir roles, custom claims
│   │   │   └── http.ts         # Ex: Endpoints HTTP customizados para auth, se necessário
│   │   │
│   │   ├── users/            # Functions para gerenciamento de perfis de usuário
│   │   │   ├── triggers.ts     # Ex: onUpdateProfile para sanitizar dados
│   │   │   └── callable.ts     # Ex: Functions chamáveis para atualizar dados protegidos
│   │   │
│   │   ├── providers/        # Functions específicas para a lógica de prestadores
│   │   │   ├── triggers.ts     # Ex: onProviderCreate, onServiceUpdate
│   │   │   └── callable.ts     # Ex: aprovarCadastroPrestador, atualizarServicosOferecidos
│   │   │
│   │   ├── bookings/         # Lógica de backend para agendamentos
│   │   │   ├── triggers.ts     # Ex: onBookingCreate para enviar notificações, onBookingUpdate
│   │   │   ├── http.ts         # Ex: Endpoints para criar, listar, cancelar agendamentos
│   │   │   └── callable.ts     # Ex: confirmarAgendamento, marcarComoConcluido
│   │   │
│   │   ├── payments/         # Lógica para processamento de pagamentos e comissões
│   │   │   ├── http.ts         # Ex: criarIntencaoDePagamento (Stripe, MercadoPago)
│   │   │   ├── triggers.ts     # Ex: onPaymentSuccess para calcular comissão, liberar fundos
│   │   │   └── callable.ts     # Ex: solicitarRepasse (para prestadores)
│   │   │
│   │   ├── reviews/          # Lógica para avaliações
│   │   │   ├── triggers.ts     # Ex: onReviewCreate para recalcular média do prestador
│   │   │   └── callable.ts     # Ex: submeterAvaliacao
│   │   │
│   │   ├── notifications/    # Lógica para envio de notificações push (FCM)
│   │   │   ├── triggers.ts     # Ex: enviarNotificacaoNovoAgendamento, enviarLembrete
│   │   │   └── utils.ts        # Helpers para construir e enviar payloads de notificação
│   │   │
│   │   ├── chat/             # (Opcional) Lógica de backend para chat se não for só Firestore client-side
│   │   │   ├── triggers.ts     # Ex: onNewMessage para notificar
│   │   │
│   │   ├── admin/            # (Opcional) Functions para tarefas administrativas
│   │   │   └── callable.ts     # Ex: banirUsuario, gerarRelatorio
│   │   │
│   │   ├── services/         # Serviços de lógica de negócios compartilhados entre as functions
│   │   │   ├── firestore.service.ts // Helpers para interagir com o Firestore
│   │   │   ├── paymentGateway.service.ts // Abstração para o gateway de pagamento
│   │   │   └── notification.service.ts // Para envio de notificações
│   │   │
│   │   ├── types/            # Definições de tipo e interfaces TypeScript para o backend
│   │   │   ├── index.ts
│   │   │   ├── user.types.ts
│   │   │   ├── booking.types.ts
│   │   │   └── service.types.ts
│   │   │   // Idealmente, alguns desses tipos poderiam ser compartilhados com o frontend
│   │   │   // se você usar um monorepo ou um pacote compartilhado.
│   │   │
│   │   ├── utils/            # Funções utilitárias para o backend
│   │   │   ├── validators.ts
│   │   │   └── helpers.ts
│   │   │
│   │   └── config/           # Configurações do Firebase (inicialização do admin SDK), chaves de API
│   │       ├── firebaseAdmin.ts  // Inicializa o firebase-admin
│   │       └── environment.ts    // Para carregar variáveis de ambiente (chaves de API de terceiros)
│   │
│   ├── lib/                  # (OU dist/) Pasta com o código JavaScript transpilado (gerada pelo build do TypeScript) - DEVE SER IGNORADA PELO GIT
│   ├── node_modules/         # Dependências das Cloud Functions
│   ├── package.json          # Dependências e scripts para as Cloud Functions
│   ├── package-lock.json
│   ├── tsconfig.json         # Configuração do TypeScript para as functions
│   └── .eslintrc.js          # (Opcional) Configuração do ESLint para as functions
│
├── .firebaserc             # Arquivo de configuração do projeto Firebase (qual projeto usar)
├── firebase.json           # Configurações de deploy do Firebase (functions, firestore rules, storage rules, hosting)
├── firestore.rules         # Regras de segurança para o Cloud Firestore
├── storage.rules           # Regras de segurança para o Firebase Storage
│

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


