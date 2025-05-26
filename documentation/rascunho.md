📱 Documentação do Frontend LimpeJá (Expo / React Native)
Esta seção descreve a arquitetura, estrutura de pastas e principais componentes do frontend do aplicativo LimpeJá, construído com React Native e Expo.

1. Visão Geral da Arquitetura Frontend
O frontend do LimpeJá é construído utilizando React Native com o framework Expo, garantindo um desenvolvimento ágil e acesso a um rico ecossistema de bibliotecas e ferramentas. A navegação é gerenciada pelo Expo Router (v5), que permite uma estrutura de rotas baseada em arquivos, intuitiva e com forte tipagem com TypeScript.

O estado global da aplicação, como informações de autenticação do usuário e configurações gerais do app (ex: tema), é gerenciado através da Context API do React. A comunicação com o backend é abstraída por uma camada de serviços que utiliza Axios para chamadas HTTP.

2. Tecnologias Principais (Revisão do Frontend)
React Native: Framework para desenvolvimento de aplicativos móveis nativos.
Expo (SDK 53): Plataforma e conjunto de ferramentas para facilitar o desenvolvimento e build de apps React Native.
Expo Router (v5): Sistema de navegação baseado em arquivos, com suporte a rotas tipadas.
TypeScript: Superset do JavaScript que adiciona tipagem estática.
Context API (React): Para gerenciamento de estado global (ex: AuthContext, AppContext).
Axios: Cliente HTTP para realizar chamadas à API do backend.
@expo/vector-icons: Biblioteca de ícones.
Componentes específicos da comunidade conforme necessário (ex: @react-native-community/datetimepicker).
3. Estrutura de Pastas do Frontend (Detalhada)
Com base na estrutura que você compartilhou (image_be64fd.png e image_be5a31.png / image_be5633.png), temos:

LimpeJaApp/ (Raiz do Projeto)
app/: Coração da aplicação, onde todas as rotas e telas são definidas usando o Expo Router.
(auth)/: Telas e fluxos relacionados à autenticação.
_layout.tsx: Layout de stack para as telas de autenticação (ex: header customizado, transições).
login.tsx: Tela de login do usuário.
register-options.tsx: Tela para o usuário escolher se quer se cadastrar como cliente ou profissional.
client-register.tsx: Formulário de cadastro para clientes.
provider-register/: Subpasta para o fluxo de cadastro de múltiplos passos para profissionais.
_layout.tsx: Layout de stack para as etapas de cadastro do profissional (pode incluir um indicador de progresso).
index.tsx: Primeira etapa informativa do cadastro do profissional.
personal-details.tsx: Segunda etapa, coleta de dados pessoais do profissional.
service-details.tsx: Terceira etapa, coleta de detalhes dos serviços, experiência, etc.
(client)/: Telas e fluxos específicos para o usuário logado como Cliente.
_layout.tsx: Layout principal para o cliente, geralmente define a navegação por abas (Tabs) com seções como Explorar, Agendamentos, Mensagens, Perfil.
explore/: Seção de descoberta de serviços e profissionais.
_layout.tsx (Opcional): Se a seção "Explorar" tiver seu próprio stack de navegação interno.
index.tsx: Tela principal de exploração (Home do Cliente).
[providerId].tsx: Tela de detalhes de um profissional específico.
resultados-busca.tsx: Tela para exibir resultados de uma busca.
search-results.tsx: (Verificar se é redundante com resultados-busca.tsx).
servicos-por-categoria.tsx: Tela para listar serviços de uma categoria específica.
todas-categorias.tsx: Tela para listar todas as categorias de serviço.
todos-prestadores-proximos.tsx: Tela para listar todos os prestadores próximos.
bookings/: Seção de gerenciamento de agendamentos do cliente.
_layout.tsx (Opcional): Layout de stack para a seção de agendamentos.
index.tsx: Lista os agendamentos do cliente (Próximos, Anteriores, Cancelados).
[bookingId].tsx: Tela de detalhes de um agendamento específico.
schedule-service.tsx: Tela para o cliente agendar um novo serviço com um profissional.
messages/: Seção de mensagens do cliente.
_layout.tsx (Opcional): Layout de stack para a seção de mensagens.
index.tsx: Lista as conversas do cliente.
[chatId].tsx: Tela de uma conversa de chat específica.
ofertas/: (Se aplicável) Seção para visualizar ofertas especiais.
_layout.tsx (Opcional): Layout de stack para a seção de ofertas.
[ofertaId].tsx: Tela de detalhes de uma oferta específica.
profile/: Seção do perfil do cliente.
_layout.tsx (Opcional): Layout de stack para a seção de perfil.
index.tsx: Tela principal do perfil do cliente.
edit.tsx: Tela para editar as informações do perfil do cliente.
(provider)/: Telas e fluxos específicos para o usuário logado como Profissional.
_layout.tsx: Layout principal para o profissional, geralmente define a navegação por abas (Tabs) com seções como Dashboard, Agenda, Serviços, Ganhos, Mensagens, Perfil.
dashboard.tsx: Tela principal/painel do profissional.
schedule/: Seção de gerenciamento da agenda do profissional.
index.tsx: Visualização da agenda/calendário.
manage-availability.tsx: Tela para o profissional gerenciar seus horários disponíveis.
services/: (Pode ser para visualizar serviços agendados para ele ou gerenciar os serviços que ele oferece, dependendo da sua nomenclatura).
index.tsx: Lista de serviços (agendados ou oferecidos).
[serviceId].tsx: Detalhes de um serviço específico (agendado ou oferecido).
earnings.tsx: Tela para o profissional visualizar seus ganhos.
messages/: Seção de mensagens do profissional (similar à do cliente).
index.tsx: Lista de conversas.
[chatId].tsx: Tela de chat.
profile/: Seção do perfil do profissional.
index.tsx: Tela principal do perfil do profissional.
edit-services.tsx: Tela para o profissional editar os serviços que oferece, preços, etc. (Pode ser parte de uma edição de perfil mais completa).
(common)/: Telas que podem ser acessadas por ambos os tipos de usuários autenticados, ou até mesmo por usuários não autenticados dependendo da configuração do layout.
_layout.tsx: Layout de stack para estas telas comuns (ex: para terem um header padrão).
settings.tsx: Tela de configurações do aplicativo.
help.tsx: Tela de ajuda e FAQ.
feedback/[targetId].tsx: Tela para o usuário enviar feedback sobre um serviço, profissional ou o app.
notifications.tsx: Tela para listar as notificações do usuário.
(tabs)/: (Visível na sua imagem image_be5633.png)
Observação: Se a navegação principal por abas dos fluxos (client) e (provider) já é gerenciada pelos seus respectivos _layout.tsx (usando <Tabs /> do Expo Router), esta pasta (tabs)/ na raiz de app/ pode ser redundante ou um resquício de um template inicial. Verifique seu propósito e se ela ainda é necessária.
_layout.tsx: O layout raiz da aplicação, localizado em app/_layout.tsx. É responsável por prover os Contextos (AuthProvider, AppProvider) e pela lógica inicial de redirecionamento baseada no estado de autenticação. Renderiza o <Slot /> para as rotas filhas.
index.tsx: O ponto de entrada para a rota /. Com a lógica atual do _layout.tsx, ele serve como uma tela de carregamento/redirecionamento muito breve.
+not-found.tsx: Tela exibida quando uma rota não é encontrada.
assets/:
fonts/: Para arquivos de fontes customizadas.
images/: Para imagens estáticas usadas no app (ícones, logo, splash, placeholders como default-avatar.png).
components/: Componentes React reutilizáveis em todo o aplicativo.
ui/: Componentes de UI genéricos e estilizados (ex: Button.tsx, Card.tsx, Input.tsx customizados).
layout/: Componentes relacionados à estrutura visual das telas (ex: CustomHeader.tsx).
specific/: Componentes mais complexos e específicos para determinadas funcionalidades (ex: ServiceBookingCard.tsx).
Outros componentes de nível superior como BannerOferta.tsx, HeaderSuperior.tsx, NavBar.tsx (se este NavBar for um componente customizado diferente das abas do Expo Router), SaudacaoContainer.tsx, SecaoContainer.tsx, SecaoPrestadores.tsx.
contexts/:
AuthContext.tsx: Gerencia o estado de autenticação, informações do usuário logado e tokens.
AppContext.tsx: Gerencia configurações globais do app (ex: tema, preferências de notificação).
hooks/:
useAuth.ts: Hook customizado para acessar facilmente o AuthContext.
useFormValidation.ts: (Exemplo) Hook para lógicas de validação de formulário.
services/:
api.ts: Configuração da instância do Axios para chamadas HTTP ao backend.
authService.ts: Funções para interagir com os endpoints de autenticação do backend (login, registro de cliente, registro de provedor).
clientService.ts: Funções para as operações do cliente (buscar prestadores, criar agendamentos, buscar detalhes de agendamentos, etc.).
providerService.ts: Funções para as operações do provedor (gerenciar perfil, disponibilidade, serviços, etc.).
paymentService.ts: (Nome que demos, poderia ser parte do clientService ou providerService) Funções para interagir com os endpoints de pagamento do backend.
types/: Contém todas as definições de interface e tipo TypeScript usadas no frontend.
utils/: Funções utilitárias (formatadores de data, helpers de permissão, lógica de armazenamento, etc.).
constants/: (Se você criar) Para valores constantes como cores, temas, chaves de armazenamento, nomes de rotas.

Com certeza! Enquanto o Firebase instala, posso criar uma documentação detalhada (em formato Markdown, como um README_BACKEND.md ou uma seção para o seu README principal) sobre o backend que esboçamos e como o frontend precisará se integrar a ele.

Esta documentação será baseada na estrutura de Cloud Functions com Firebase que planejamos.

Documentação do Backend LimpeJá (Firebase Cloud Functions)
Este documento descreve a arquitetura e os módulos principais do backend do LimpeJá, construído com Firebase Cloud Functions, e como o frontend (Expo/React Native) se integra a ele.

1. Visão Geral da Arquitetura
O backend do LimpeJá utiliza uma abordagem serverless com Firebase Cloud Functions para a lógica de negócios e APIs, Cloud Firestore como banco de dados NoSQL principal, Firebase Authentication para gerenciamento de usuários, e Firebase Storage para armazenamento de arquivos (como fotos de perfil).

Principais Vantagens desta Abordagem:

Escalabilidade: Os serviços Firebase são projetados para escalar automaticamente.
Desenvolvimento Ágil: Muitos recursos prontos (autenticação, banco de dados em tempo real) aceleram o desenvolvimento.
Custo-Benefício: Modelo de precificação baseado no uso, geralmente vantajoso para startups.
Integração com Frontend: SDKs cliente do Firebase facilitam a comunicação.
2. Tecnologias Utilizadas (Backend)
Firebase Cloud Functions (Node.js com TypeScript): Para toda a lógica de backend.
Firebase Authentication: Para registro, login e gerenciamento de sessão de usuários (clientes e prestadores).
Cloud Firestore: Banco de dados NoSQL para armazenar perfis de usuários, detalhes de serviços, agendamentos, avaliações, chats, etc.
Firebase Storage: Para armazenar imagens (fotos de perfil, fotos de serviços, documentos de verificação).
Firebase Cloud Messaging (FCM): Para enviar notificações push.
(Gateway de Pagamento Externo para PIX): Um Provedor de Serviço de Pagamento (PSP) brasileiro com API PIX, integrado através de Cloud Functions.
3. Estrutura de Pastas do Backend (functions/)
functions/
├── src/                  # Código fonte TypeScript
│   ├── index.ts          # Ponto de entrada principal, exporta todas as functions
│   ├── auth/             # Autenticação customizada (triggers, http se necessário)
│   │   ├── triggers.ts
│   │   └── http.ts       # (Opcional, se SDK cliente não for suficiente)
│   ├── users/            # Gerenciamento de perfis de usuário (callable, triggers)
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── providers/        # Lógica de prestadores (callable, triggers)
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── bookings/         # Lógica de agendamentos (http, callable, triggers)
│   │   ├── http.ts
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── payments/         # Pagamentos e comissões (http, callable, triggers)
│   │   ├── http.ts
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── reviews/          # Avaliações (callable, triggers)
│   │   ├── callable.ts
│   │   └── triggers.ts
│   ├── notifications/    # Lógica de notificações (triggers, callable, utils)
│   │   ├── triggers.ts
│   │   ├── callable.ts
│   │   └── utils.ts
│   ├── chat/             # Lógica de backend para chat (triggers)
│   │   └── triggers.ts
│   ├── admin/            # Funções para o painel de administração (callable)
│   │   └── callable.ts
│   ├── services/         # Lógica de negócios compartilhada
│   │   ├── firestore.service.ts
│   │   ├── paymentGateway.service.ts
│   │   └── notification.service.ts
│   ├── types/            # Definições de tipo TypeScript para o backend
│   │   ├── index.ts      # Exporta todos os tipos
│   │   ├── user.types.ts
│   │   ├── provider.types.ts
│   │   ├── booking.types.ts
│   │   ├── service.types.ts
│   │   ├── review.types.ts
│   │   ├── notification.types.ts
│   │   └── payment.types.ts
│   ├── utils/            # Funções utilitárias (helpers, validators)
│   │   ├── helpers.ts
│   │   └── validators.ts
│   └── config/           # Configuração do Firebase Admin SDK e variáveis de ambiente
│       ├── firebaseAdmin.ts
│       └── environment.ts
├── lib/                  # Código JavaScript transpilado (ignorado pelo Git)
├── node_modules/
├── package.json
├── tsconfig.json
└── .eslintrc.js          # (Opcional)
(Arquivos como .firebaserc, firebase.json, firestore.rules, storage.rules ficam na raiz do projeto LimpeJá, fora da pasta functions/)

4. Módulos Principais do Backend e Integração com Frontend
4.1. Autenticação e Gerenciamento de Usuários (functions/src/auth/ e functions/src/users/)
Backend (Cloud Functions):
auth/triggers.ts -> processNewUser:
Disparador: Criação de um novo usuário no Firebase Authentication.
Lógica: Cria um documento correspondente na coleção users do Firestore com informações básicas (email, UID) e um role padrão (ex: "client"). Define Custom Claims no token do usuário (ex: { role: "client" }) para controle de acesso.
Integração Frontend: O frontend usa o SDK do Firebase (firebase/auth) para createUserWithEmailAndPassword ou login social. Este trigger age no backend em resposta.
auth/triggers.ts -> cleanupUser:
Disparador: Deleção de um usuário no Firebase Authentication.
Lógica: Deleta o documento correspondente em users e providerProfiles no Firestore, e outros dados relacionados (anonimizar agendamentos passados, etc.).
Integração Frontend: Se o usuário deletar a conta pelo app, o app chama uma função (Callable ou HTTP) que, por sua vez, deleta o usuário do Firebase Auth, disparando este trigger.
users/callable.ts -> updateUserProfile:
Chamada: O frontend (ex: tela profile/edit.tsx) chama esta função para atualizar dados como nome, telefone, avatarURL.
Lógica: Valida os dados, atualiza o documento do usuário em users no Firestore e também o perfil no Firebase Authentication (admin.auth().updateUser()). Se o avatar foi alterado, a URI local da imagem (enviada pelo frontend) precisaria ser primeiro carregada para o Firebase Storage (por esta função ou uma dedicada), e então a URL do Storage seria salva no perfil.
Integração Frontend: O AuthContext e o services/clientService.ts (ou providerService.ts) no frontend chamariam esta função.
users/callable.ts -> addUserAddress (e outras para gerenciar endereços):
Chamada: Tela de gerenciamento de endereços do cliente.
Lógica: Adiciona/edita/remove endereços na subcoleção addresses do perfil do usuário no Firestore.
users/triggers.ts -> onUserProfileUpdate:
Disparador: Atualização de um documento na coleção users.
Lógica: Denormaliza dados alterados (como name, avatarUrl) para outras coleções onde eles são referenciados (ex: providerProfiles, bookings, reviews, chats) para otimizar leituras no frontend.
Integração Frontend: Indireta. O frontend verá os dados atualizados em outras telas devido à denormalização.
4.2. Lógica de Prestadores (functions/src/providers/)
Backend (Cloud Functions):
providers/callable.ts -> submitProviderRegistration:
Chamada: Pelo frontend ao final do fluxo de cadastro de múltiplas etapas do prestador (provider-register/service-details.tsx).
Lógica: Recebe todos os dados coletados (pessoais, de serviço, disponibilidade), valida-os, cria/atualiza o documento em providerProfiles no Firestore, e atualiza o role do usuário para "provider" no documento users e nos Custom Claims do Firebase Auth. Pode iniciar um processo de verificação.
Integração Frontend: O Contexto de cadastro do prestador no frontend agregaria os dados e chamaria esta função.
providers/callable.ts -> updateOfferedServices, updateWeeklyAvailability, updateBlockedDates:
Chamada: Pelas telas de gerenciamento de perfil/agenda do prestador no frontend.
Lógica: Atualizam os respectivos campos no documento providerProfiles do prestador no Firestore.
providers/triggers.ts -> onProviderProfileWrite:
Disparador: Criação/Atualização de um providerProfiles.
Lógica: Pode enviar notificações para admins (novo prestador para aprovar), para o próprio prestador (perfil atualizado), ou atualizar dados agregados.
admin/callable.ts -> setProviderVerificationStatus:
Chamada: Por um painel de administração.
Lógica: Atualiza o status isVerified do ProviderProfile.
Integração Frontend (Prestador): O prestador veria seu status de verificação atualizado no perfil.
4.3. Agendamentos (functions/src/bookings/)
Backend (Cloud Functions):
bookings/http.ts -> POST / (ou uma Callable Function createBooking):
Chamada: Pelo cliente na tela schedule-service.tsx para solicitar um novo agendamento.
Lógica: Valida os dados (disponibilidade do prestador, dados do cliente), calcula preço inicial (se aplicável), cria um novo documento na coleção bookings com status inicial (ex: pending_provider_confirmation).
Integração Frontend: O services/clientService.ts chamaria este endpoint/função.
bookings/callable.ts -> updateBookingStatus:
Chamada: Tanto pelo cliente (para cancelar) quanto pelo prestador (para confirmar, cancelar, marcar como em andamento/concluído) a partir das telas de detalhes do agendamento.
Lógica: Valida permissões e a transição de status, atualiza o status do agendamento no Firestore.
bookings/triggers.ts -> onBookingCreatedSendNotifications, onBookingUpdateSendNotifications:
Disparador: Criação ou atualização de um documento booking.
Lógica: Envia notificações push para cliente e/ou prestador sobre o novo agendamento ou mudança de status.
Integração Frontend: Os usuários recebem as notificações e podem ser direcionados para a tela de detalhes do agendamento.
4.4. Pagamentos e Comissões (functions/src/payments/)
Backend (Cloud Functions):
payments/http.ts -> POST /create-pix-charge:
Chamada: Pelo frontend do cliente quando ele precisa pagar por um serviço agendado (pode ser no momento do agendamento ou depois, dependendo do seu fluxo).
Lógica: Interage com o paymentGateway.service.ts (que chama a API do PSP PIX) para gerar um QR Code/Copia e Cola PIX. Retorna esses dados para o frontend.
Integração Frontend: A tela de pagamento no frontend exibe o PIX.
payments/http.ts -> POST /pix-webhook:
Chamada: Pelo Provedor de Serviço de Pagamento (PSP) PIX quando um pagamento é confirmado.
Lógica: Valida o webhook. Se o pagamento foi confirmado, atualiza o paymentStatus do booking correspondente no Firestore para paid. Pode então chamar internamente a lógica de finalização (ou disparar o trigger onBookingFinalizedProcessPayment).
payments/triggers.ts -> onBookingFinalizedProcessPayment:
Disparador: Quando um booking é atualizado e seu status se torna finalized E paymentStatus é paid.
Lógica: Calcula a comissão do LimpeJá, calcula os ganhos do prestador, atualiza esses valores no documento booking. Atualiza o pendingBalance no providerProfile. (TODO: Inicia o processo de repasse real).
Integração Frontend: O prestador vê seu saldo atualizado e o cliente vê o agendamento como finalizado.
payments/callable.ts -> requestProviderPayout:
Chamada: Pelo prestador em sua tela de ganhos/financeiro para solicitar um saque.
Lógica: Verifica saldo, registra a solicitação, atualiza pendingBalance. Notifica admin.
payments/callable.ts -> getMyPaymentHistory:
Chamada: Pelas telas de histórico financeiro do cliente ou prestador.
Lógica: Busca e formata o histórico de transações.
payments/callable.ts -> retryBookingPayment:
Chamada: Pelo cliente se um pagamento anterior falhou.
Lógica: Tenta gerar uma nova cobrança PIX para o agendamento.
4.5. Avaliações (functions/src/reviews/)
Backend (Cloud Functions):
reviews/callable.ts -> submitReview:
Chamada: Pelo cliente (ou prestador, se houver avaliação mútua) na tela de feedback (app/(common)/feedback/[targetId].tsx).
Lógica: Valida a avaliação, salva na coleção reviews, e atualiza o booking com o clientReviewId ou providerReviewId.
reviews/triggers.ts -> onReviewCreatedUpdateProviderRating:
Disparador: Criação de uma nova review.
Lógica: Se a avaliação for para um prestador, recalcula e atualiza averageRating e totalReviews no providerProfile correspondente.
Integração Frontend: O perfil do prestador e os resultados da busca mostrarão a avaliação atualizada.
4.6. Notificações (functions/src/notifications/)
Backend (Cloud Functions):
notification.service.ts (em functions/src/services/): Contém as funções sendPushNotification e getUserFcmTokens.
notifications/triggers.ts: Contém triggers para enviar notificações em resposta a eventos específicos (ex: lembrete de agendamento, nova avaliação para prestador).
Integração Frontend: Usuários recebem notificações push. O notification.service.ts também salva as notificações no Firestore para um histórico na tela app/(common)/notifications.tsx.
notifications/callable.ts: Funções como markNotificationsAsRead, getNotificationsHistory.
Integração Frontend: A tela app/(common)/notifications.tsx chama essas funções para gerenciar o estado das notificações.
4.7. Chat (functions/src/chat/)
Backend (Cloud Functions):
chat/triggers.ts -> onNewChatMessage:
Disparador: Nova mensagem na subcoleção messages de um chat.
Lógica: Atualiza lastMessageText, lastMessageTimestamp, unreadCount no documento chat pai. Envia notificação push para o destinatário.
Integração Frontend: A tela app/(client)/messages/index.tsx (lista de conversas) e app/(client)/messages/[chatId].tsx (tela de chat) podem usar listeners do Firestore para atualizações em tempo real.
4.8. Administração (functions/src/admin/)
Backend (Cloud Functions):
admin/callable.ts -> setProviderVerificationStatus, setUserDisabledStatus, getPlatformAnalytics:
Chamada: Por um painel de administração frontend (separado ou parte do app com acesso restrito).
Lógica: Executa ações administrativas protegidas.
Integração Frontend (Admin): Um frontend de admin faria chamadas para estas funções.
5. Variáveis de Ambiente e Configuração (functions/src/config/)
firebaseAdmin.ts: Inicializa o firebase-admin SDK. O frontend não interage diretamente com este arquivo, mas ele é a base para todas as operações do backend com o Firebase.
environment.ts: Carrega configurações sensíveis (como chaves de API de gateways de pagamento, segredos de webhook) do ambiente de configuração do Firebase Functions (firebase functions:config:set ...).
Integração Frontend: Nenhuma direta. O frontend envia dados, e o backend usa essas chaves configuradas para interagir com serviços de terceiros de forma segura.


🚀 LimpeJá: Roteiro Final para Conexão, Testes e Lançamento
Este documento foca nos passos cruciais para integrar o frontend do LimpeJá com o backend (Firebase Cloud Functions), realizar os testes necessários e preparar o aplicativo para o lançamento nas lojas, com o objetivo de habilitar a monetização através da comissão sobre serviços.

1. Conexão Efetiva Frontend-Backend
Embora já tenhamos definido a arquitetura, a implementação real da comunicação é o próximo passo.

Frontend (Pasta LimpeJaApp/services/):

api.ts:
A Fazer: Configurar a instância do Axios (ou Workspace) para apontar para os URLs base das suas Cloud Functions (HTTP Triggers). Para Callable Functions, o SDK do Firebase lida com o endpoint.
A Fazer: Implementar interceptors no Axios para:
Anexar automaticamente o token de autenticação (ID Token do Firebase Auth) a todas as requisições para endpoints protegidos. O token deve ser obtido do AuthContext.
Lidar com erros de autenticação (ex: token expirado) e, idealmente, implementar uma lógica de refresh de token se o backend suportar, ou deslogar o usuário.
authService.ts:
A Fazer: Implementar as chamadas reais às funções de autenticação do Firebase (SDK Cliente) para login e cadastro de cliente.
A Fazer: Implementar a chamada à Cloud Function (provavelmente Callable) submitProviderRegistration para o cadastro de prestador, enviando os dados coletados nas múltiplas etapas do formulário frontend.
A Fazer: Implementar a lógica de signOut no frontend chamando o firebase.auth().signOut().
clientService.ts, providerService.ts, commonService.ts (ou nomes similares):
A Fazer: Implementar todas as funções que farão chamadas às Cloud Functions (HTTP ou Callable) que criamos os esqueletos para (ex: updateUserProfile, addUserAddress, getProviderDetails, createBooking, updateBookingStatus, requestProviderPayout, getMyPaymentHistory, retryBookingPayment, submitReview, markNotificationsAsRead, getNotificationsHistory, etc.).
Cada função deve lidar com o envio dos dados corretos e o tratamento da resposta (sucesso ou erro) do backend.
Backend (Pasta LimpeJaApp/functions/src/):

Finalizar Lógica das Cloud Functions:
A Fazer (CRUCIAL): Substituir todos os // TODO: e simulações pela lógica de negócios real em todos os arquivos .ts (auth/, users/, providers/, bookings/, payments/, reviews/, notifications/, admin/).
Validação de Dados: Implementar validação robusta (ex: com Zod, Joi, ou validações manuais) para todos os dados recebidos em Cloud Functions HTTP e Callable.
Tratamento de Erros: Garantir tratamento de erro consistente e significativo em todas as functions.
Segurança: Implementar assertRole (ou verificações equivalentes) em todas as Callable Functions e proteger adequadamente os endpoints HTTP.
Regras de Segurança do Firestore (firestore.rules):
A Fazer (CRUCIAL): Escrever regras de segurança detalhadas para proteger todas as suas coleções no Firestore. As regras padrão do "modo de teste" são inseguras para produção. Defina quem pode ler, escrever, atualizar e deletar quais documentos. Use request.auth.uid e request.auth.token.role nas suas regras.
Regras de Segurança do Storage (storage.rules):
A Fazer: Definir regras para quem pode fazer upload e download de arquivos (ex: fotos de perfil, documentos de verificação).
Configuração de Variáveis de Ambiente (Gateway de Pagamento PIX):
A Fazer: Usar firebase functions:config:set pix_provider.apikey="SUA_CHAVE" ... para configurar as chaves de API do seu PSP de PIX e o segredo do webhook.
Testar com Emuladores: Use firebase emulators:start extensivamente para testar suas functions localmente.
2. Testes Necessários (Frontend e Backend)
Testar é fundamental antes de lançar.

Testes Unitários (Backend):
A Fazer: Escrever testes unitários para a lógica de negócios dentro das suas Cloud Functions, especialmente para as partes críticas (cálculo de comissão, transições de status de agendamento, lógica de permissão). O Firebase fornece ferramentas para testes unitários de functions offline.
Testes de Integração (Backend <> Frontend):
A Fazer: Com o frontend conectado aos emuladores do Firebase (Auth, Firestore, Functions):
Testar todos os fluxos de usuário de ponta a ponta.
Fluxo de Cadastro (Cliente e Prestador): Todas as etapas, validações, criação de perfil no Firestore e Auth, definição de role.
Fluxo de Login e Autenticação: Acesso a rotas protegidas, persistência da sessão.
Fluxo do Cliente: Busca de prestadores, visualização de perfil, agendamento (chamada para createPixCharge), visualização de agendamentos, cancelamento, chat, avaliação.
Fluxo do Prestador: Visualização da agenda, gerenciamento de disponibilidade, aceite/recusa de agendamentos, visualização de ganhos, solicitação de repasse, chat, edição de perfil/serviços.
Fluxo de Pagamento PIX: Geração do QR Code/Copia e Cola no frontend, simulação de pagamento (se o PSP tiver sandbox), verificação do webhook no backend e atualização do status do agendamento.
Fluxo de Comissão e Repasse: Verificação (nos dados do Firestore Emulator) se a comissão é calculada corretamente e se o saldo do prestador é atualizado.
Notificações: Testar se as notificações push e in-app (se houver) são disparadas e recebidas corretamente para os eventos planejados.
Testes de UI/UX (Frontend):
A Fazer: Garantir que todas as telas "finais e sofisticadas" que criamos estão responsivas, sem quebras de layout, e que a navegação é fluida e intuitiva em diferentes dispositivos (se possível).
Testar o KeyboardAvoidingView em todas as telas com inputs.
Verificar a clareza das informações e a facilidade de uso.
Testes de Segurança:
A Fazer: Testar as regras do Firestore tentando acessar/modificar dados sem a permissão correta (pode ser feito com scripts ou testes automatizados).
Verificar a segurança dos endpoints HTTP das Cloud Functions.
3. Preparação para Lançamento na Play Store
Finalizar Conteúdo:
A Fazer: Substituir todos os textos "Lorem Ipsum", dados mockados e placeholders por conteúdo real e profissional (Termos de Serviço, Política de Privacidade, FAQs, descrições).
Assets Gráficos Finais:
A Fazer: Usar o ícone final do app (icon.png, adaptive-icon.png) e a tela de splash (splash.png) com a identidade visual do LimpeJá. O ícone deve ser quadrado (1024x1024px recomendado).
Configuração do app.json para Produção:
Revisar name, slug, version (começar com 1.0.0).
ios.bundleIdentifier e android.package: Devem ser os identificadores finais e únicos da sua aplicação nas lojas.
extra.eas.projectId: Deve estar com o ID correto do seu projeto EAS.
Configurar permissions para Android se necessário (ex: CAMERA, READ_EXTERNAL_STORAGE para upload de foto, LOCATION se usado). O expo-location e expo-image-picker já adicionam algumas permissões, mas revise.
Configuração do eas.json para Produção:
Perfil production:
distribution: "store"
Para Android, o padrão é buildType: "app-bundle" (AAB), que é o formato correto para a Play Store.
Configurar variáveis de ambiente de produção (ex: URL da API de produção do seu PSP PIX) usando eas build:configure ou editando eas.json e depois eas secret:create NOME_DA_VARIAVEL.
Construir o App Bundle (AAB) para Produção:
Comando: eas build -p android --profile production
Assinatura (Keystore): O EAS Build cuidará da assinatura. Se for o primeiro build de produção, ele te guiará para criar ou fazer upload de uma keystore. É crucial guardar bem essa keystore e suas senhas, ou deixar o EAS gerenciá-la.
Testar o Build de Produção:
Antes de enviar para a loja, instale o AAB gerado (ou o APK se você gerou um de release) em dispositivos de teste para uma última verificação. A Google Play Console permite testes internos/fechados com AABs.
Criar Conta de Desenvolvedor na Google Play Console:
Se ainda não tem, você precisará de uma conta de desenvolvedor Google Play (há uma taxa única de registro).
Preparar Materiais da Loja:
Screenshots do aplicativo em diferentes tamanhos de tela.
Ícone de alta resolução (512x512 para Play Store).
Gráfico de destaque.
Descrição curta e completa do aplicativo.
Vídeo promocional (opcional).
Política de Privacidade (URL obrigatória).
Enviar para a Google Play Store:
Use o eas submit -p android --profile production (após configurar o perfil de submit no eas.json com sua chave de API do Google Play Developer) ou faça o upload manual do AAB na Google Play Console.
Preencha todos os detalhes da listagem do app, classificação de conteúdo, política de privacidade, etc.
Envie para revisão.
4. Habilitando os Ganhos (Estratégia de Comissão)
Para que a estratégia de ganhos com comissão funcione:

Backend (payments/triggers.ts e paymentGateway.service.ts):
A Fazer (CRUCIAL): A lógica em onBookingFinalizedProcessPayment (ou a lógica chamada pelo webhook PIX) deve:
Receber a confirmação de pagamento do PSP.
Buscar o booking correspondente.
Calcular a comissão do LimpeJá (ex: 20% do booking.totalPrice).
Calcular o providerEarnings (ganho do prestador).
Atualizar o documento booking com commissionValue, providerEarnings, e mudar o paymentStatus para payout_pending.
Atualizar o pendingBalance no providerProfile do prestador.
Backend (payments/callable.ts e/ou admin/callable.ts):
A Fazer: Implementar a lógica para processar repasses (payouts) para os prestadores.
A função requestProviderPayout permite que o prestador solicite.
Uma função de admin (ou um processo agendado) aprovaria e iniciaria a transferência PIX real para a chave PIX do prestador (usando a API do seu PSP e os dados em providerProfile.bankAccount).
Após o repasse ser confirmado pelo PSP, atualizar o paymentStatus no booking para payout_completed (ou similar) e o pendingBalance do prestador.
Frontend (Prestador):
A tela app/(provider)/earnings.tsx deve mostrar o pendingBalance, totalEarnedHistorical, e um histórico de repasses.
Permitir que o prestador chame requestProviderPayout.
Termos e Condições:
A Fazer: Seus Termos de Serviço para Prestadores devem ser muito claros sobre a taxa de comissão, como e quando os pagamentos são processados e repassados.
Este roteiro é extenso, mas cobre os principais pontos para levar o LimpeJá de onde está agora até um aplicativo pronto para o mercado e para começar a gerar receita. O segredo é ir passo a passo, testando continuamente. Boa sorte!


Fontes




