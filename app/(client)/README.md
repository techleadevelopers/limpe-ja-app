Documentação Técnica do Frontend LimpeJá - Módulo Cliente (app/(client))
1. Visão Geral e Propósito
O módulo app/(client) do aplicativo LimpeJá representa a interface principal para os usuários clientes. Seu propósito central é fornecer uma experiência intuitiva e completa, permitindo que os clientes descubram e agendem serviços de limpeza e manutenção, gerenciem seus agendamentos, comuniquem-se com provedores e mantenham seu perfil pessoal atualizado.

Construído com React Native e Expo, este módulo se integra de forma transparente com o backend NestJS, utilizando uma arquitetura baseada em componentes e fluxos de dados bem definidos para garantir escalabilidade e manutenibilidade.

1.1. Tecnologias Principais
Framework UI: React Native
Navegação: Expo Router
Gerenciamento de Estado Global: React Context API (ex: AuthContext)
Tipagem: TypeScript
Estilização: StyleSheet do React Native
Animações: React Native Animated API
Ícones: @expo/vector-icons (Ionicons, MaterialCommunityIcons)
Utilitários: expo-image-picker, expo-clipboard, react-native-safe-area-context
2. Arquitetura de Navegação
A navegação principal da área do cliente é gerenciada pelo Expo Router, utilizando um Tabs Navigator (app/(client)/_layout.tsx). Esta abordagem oferece uma estrutura de abas na parte inferior da tela, permitindo que o usuário alterne facilmente entre as seções primárias do aplicativo.

2.1. app/(client)/_layout.tsx
Este arquivo define o layout raiz para todas as telas do módulo cliente, configurando as abas de navegação e suas respectivas rotas e ícones.

Tipo de Navegação: Tabs Navigation
Propósito: Facilitar o acesso rápido e intuitivo às funcionalidades centrais do cliente.
Telas Principais (Abas):
Explorar (/(client)/explore): Descoberta de serviços e busca de provedores.
Agendamentos (/(client)/bookings): Visualização e gestão de agendamentos.
Mensagens (/(client)/messages): Comunicação via chat com provedores.
Perfil (/(client)/profile): Gerenciamento de informações pessoais e configurações.
3. Módulos e Funcionalidades Detalhadas
Cada seção a seguir descreve uma funcionalidade ou tela específica dentro do módulo cliente, detalhando seu propósito, componentes envolvidos, fluxo de dados e interações com o backend.

3.1. Gerenciamento de Perfil
3.1.1. Tela de Edição de Perfil (app/(client)/profile/edit.tsx)
Propósito: Permitir que o cliente visualize e atualize suas informações pessoais, incluindo nome, telefone e foto de perfil.
Rota: /(client)/profile/edit
Componentes Principais: View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView.
Fluxo de Dados e Interações:
Entrada: Dados do perfil do usuário obtidos via useAuth() (contexto de autenticação). O objeto user é do tipo UserProfile (importado de LimpeJaApp/src/types/backend/users.ts), contendo id, name, email, phone, avatarUrl, role, walletBalance, ordersCount, etc.
API Calls (Backend Endpoints):
Atualização de Perfil: PATCH /clients/me (Requisição: UpdateClientProfileDto, Resposta: UserProfile). Esta chamada é encapsulada pela função updateUser do useAuth ou um serviço de cliente.
Saída: Atualização do estado global do usuário via updateUser do useAuth, navegação de volta para a tela de perfil.
Considerações de Implementação:
Utiliza useState, useEffect, useRef para gerenciamento de estado e animações.
Integração com expo-image-picker para seleção de imagem de perfil.
Validações de formulário inline para name e phone, com feedback visual animado.
Animações de entrada de tela, feedback de toque em botões e animações de borda de TextInput.
3.2. Exploração e Busca de Serviços
Esta seção é composta por componentes que permitem ao cliente descobrir e navegar por provedores de serviços.

3.2.1. Seção de Provedores (SecaoPrestadores.tsx)
Propósito: Exibir uma lista horizontalmente rolável de provedores de serviços, geralmente em uma tela de exploração.
Componentes Principais: ScrollView (horizontal), PrestadorCard.
Fluxo de Dados e Interações:
Entrada: Recebe uma prop data: Provider[] (importada de LimpeJaApp/src/types/backend/providers.ts). Esta lista de provedores é tipada com as informações completas do provedor, incluindo fullName, avatarUrl, averageRating, reviewCount, providerServices, address, etc.
API Calls (Backend Endpoints): Os dados para esta seção são tipicamente obtidos de endpoints como GET /search (Requisição: SearchQueryDto, Resposta: SearchResultDto[] que pode conter Provider data) ou GET /providers (Resposta: Provider[]). A lógica de busca e fornecimento dos dados é responsabilidade da tela pai (ex: explore/index.tsx).
Saída: Ações de navegação para a tela de detalhes do provedor via onPress do PrestadorCard.
Considerações de Implementação: Gerencia a renderização de múltiplos PrestadorCard e a navegação para a tela de detalhes.
3.2.2. Cartão de Provedor (PrestadorCard.tsx)
Propósito: Exibir um resumo visualmente atraente de um provedor de serviços, incluindo nome, avaliação, especialidade e preço.
Componentes Principais: TouchableOpacity, Image, Text, Ionicons.
Fluxo de Dados e Interações:
Entrada: Recebe uma prop item: ProviderWithDistance. ProviderWithDistance é uma interface que estende Provider (de LimpeJaApp/src/types/backend/providers.ts) e adiciona a propriedade opcional distance?: string. Isso permite que o card exiba a distância do provedor se disponível nos dados de busca.
Saída: Dispara a função onPress (recebida via props) com o id do provedor para navegação.
Considerações de Implementação:
Utiliza Animated API para feedback visual ao toque e animações de entrada.
Renderiza estrelas de avaliação e badges de "Verificado".
Extrai a especialidade e o preço do primeiro serviço listado em item.providerServices.
3.2.3. Seção de Recomendações (SecaoRecomendacoes.tsx)
Propósito: Similar à SecaoPrestadores, mas focada em provedores "recomendados", possivelmente com um layout ou critérios de seleção diferentes.
Componentes Principais: ScrollView (horizontal), RecomendacaoCard.
Fluxo de Dados e Interações:
Entrada: Recebe uma prop data: Provider[] (importada de LimpeJaApp/src/types/backend/providers.ts).
API Calls (Backend Endpoints): Os dados para esta seção também vêm de APIs de busca ou listagem de provedores (ex: GET /search com filtros específicos para recomendação).
Saída: Ações de navegação para a tela de detalhes do provedor via onPress do RecomendacaoCard.
Considerações de Implementação: Gerencia a renderização de múltiplos RecomendacaoCard.
3.2.4. Cartão de Recomendação (RecomendacaoCard.tsx)
Propósito: Exibir um cartão compacto para provedores recomendados, com foco na imagem, nome e localização.
Componentes Principais: TouchableOpacity, Image, Text, Ionicons, LinearGradient.
Fluxo de Dados e Interações:
Entrada: Recebe uma prop item: Provider (importada de LimpeJaApp/src/types/backend/providers.ts).
Saída: Dispara a função onPress (recebida via props) com o objeto item completo para navegação.
Considerações de Implementação: Utiliza LinearGradient para criar um overlay escuro na imagem e garantir a legibilidade do texto. Renderiza estrelas de avaliação e exibe a cidade do provedor.
3.3. Gerenciamento de Agendamentos
3.3.1. Tela de Lista de Agendamentos (app/(client)/bookings/index.tsx)
Propósito: Exibir uma lista de todos os agendamentos do cliente, com opções de filtragem por status (próximos, anteriores, cancelados).
Rota: /(client)/bookings
Componentes Principais: FlatList, TouchableOpacity (para filtros), AnimatedBookingItem.
Fluxo de Dados e Interações:
Entrada: Não recebe parâmetros de rota diretos, mas o activeFilter controla a exibição.
API Calls (Backend Endpoints):
Listar Agendamentos: GET /bookings/me (Resposta: BookingDetailsDto[]). O frontend pode aplicar filtros de status localmente ou enviar parâmetros de query para a API se ela suportar.
Saída: Navegação para /(client)/bookings/[bookingId] (detalhes do agendamento) ou /(client)/explore (se a lista estiver vazia).
Considerações de Implementação:
Utiliza FlatList para renderização eficiente de listas.
Implementa filtros de status com feedback visual.
AnimatedBookingItem fornece animações de entrada em cascata para cada item da lista.
3.3.2. Tela de Detalhes do Agendamento (app/(client)/bookings/[bookingId].tsx)
Propósito: Exibir os detalhes completos de um agendamento específico e permitir ações contextuais (cancelar, contatar, avaliar, ver perfil do provedor).
Rota: /(client)/bookings/[bookingId]
Parâmetro de Rota: bookingId (ID único do agendamento).
Componentes Principais: ScrollView, Image, TouchableOpacity, Animated.
Fluxo de Dados e Interações:
Entrada: bookingId via useLocalSearchParams().
API Calls (Backend Endpoints):
Obter Detalhes: GET /bookings/:id (Resposta: BookingDetailsDto).
Cancelar Agendamento: PATCH /bookings/:id/status (Requisição: UpdateBookingStatusDto com status 'CANCELED', Resposta: BookingDetailsDto).
Saída: Navegação para /(client)/bookings (após cancelamento), /(client)/messages (para chat), /(client)/reviews/submit (para avaliação), ou /(client)/explore/[providerId] (para perfil do provedor).
Considerações de Implementação:
Carregamento de dados com ActivityIndicator e tratamento de erros.
Animações de entrada para cartões de seção e feedback de toque para botões.
Lógica condicional para exibir botões de ação com base no status do agendamento.
3.3.3. Tela de Agendamento de Serviço (app/(client)/bookings/schedule-service.tsx)
Propósito: Guiar o cliente através do processo de agendamento de um serviço, desde a seleção da data/hora até a confirmação do pagamento.
Rota: /(client)/bookings/schedule-service
Parâmetros de Rota: providerId (ID do provedor), serviceName (nome do serviço, opcional).
Componentes Principais: ScrollView, CalendarHeader, AddressSection, PaymentMethodSelection, ProviderBrief, CalendarGrid, TimeSlotsSection, PixPaymentDetails, ConfirmBookingButton.
Fluxo de Dados e Interações:
Entrada: providerId e serviceName via useLocalSearchParams().
API Calls (Backend Endpoints):
Obter Detalhes do Provedor: GET /providers/:id (Resposta: ProviderDetailsDto).
Obter Disponibilidade: GET /providers/:providerId/availability (Resposta: AvailabilityDto[]).
Criar Agendamento: POST /bookings (Requisição: CreateBookingDto, Resposta: BookingDetailsDto).
Criar Cobrança PIX: POST /payments/pix-charge (Requisição: CreatePixChargeDto, Resposta: PixChargeResponseDto).
Saída: Navegação para /(client)/bookings/success (após agendamento bem-sucedido).
Considerações de Implementação:
Fluxo multi-etapa com seleção de data, hora e método de pagamento.
Integração com expo-clipboard para copiar chaves PIX.
Animações de brilho e entrada de seções.
Validação de datas passadas no calendário.
3.3.4. Tela de Sucesso do Agendamento (app/(client)/bookings/success.tsx)
Propósito: Confirmar visualmente ao cliente que seu agendamento foi realizado com sucesso e fornecer opções de navegação subsequentes.
Rota: /(client)/bookings/success
Parâmetros de Rota: providerId, providerName, providerImage, providerRating, serviceName, bookingDate, bookingTime, clientAddress, paymentValue, paymentMethod, bookingId (todos opcionais, com fallback para dados mockados).
Componentes Principais: ScrollView, LinearGradient, BlurView, Image, TouchableOpacity.
Fluxo de Dados e Interações:
Entrada: Detalhes do agendamento confirmado, passados como parâmetros de rota de schedule-service.tsx.
API Calls (Backend Endpoints): Nenhuma chamada de API direta; exibe dados já confirmados.
Saída: Navegação para /(client)/bookings (lista de agendamentos) ou /(client)/explore (tela inicial).
Considerações de Implementação:
Design visual com gradientes e efeito de glassmorphism para destacar o sucesso.
Exibição detalhada do resumo do agendamento.
3.4. Detalhes de Provedor
3.4.1. Tela de Detalhes do Prestador (app/(client)/bookings/[providerId].tsx)
Propósito: Fornecer uma visão abrangente do perfil de um provedor de serviços, permitindo ao cliente tomar uma decisão informada sobre a contratação.
Rota: /(client)/bookings/[providerId] (Apesar do caminho bookings, esta tela foca nos detalhes do provedor).
Parâmetro de Rota: providerId (ID único do provedor).
Componentes Principais: ScrollView, HeaderSection, StarRating, InfoChip, ActionButtons, ReviewCard, BookServiceButton.
Fluxo de Dados e Interações:
Entrada: providerId via useLocalSearchParams().
API Calls (Backend Endpoints):
Obter Detalhes do Provedor: GET /providers/:id (Resposta: ProviderDetailsDto).
Obter Serviços Oferecidos: GET /providers/:providerId/services (Resposta: ProviderServiceOffering[]). (Implícito na descrição original, mas pode ser uma chamada separada).
Obter Avaliações: GET /reviews (Requisição: GetReviewsDto com filtro por providerId, Resposta: ReviewEntity[]). (Implícito na descrição original).
Saída: Navegação para /(client)/bookings/schedule-service (para agendar), /(client)/messages (para chat), ou /(client)/reviews/submit (para avaliação).
Considerações de Implementação:
Carregamento de dados com ActivityIndicator e tratamento de erros.
HeaderSection para a imagem de fundo e botões de navegação.
Exibição de avaliações, informações de contato e serviços.
3.4.2. Seção de Cabeçalho (HeaderSection.tsx)
Propósito: Componente reutilizável para exibir a imagem de fundo e botões de navegação (voltar, favoritar) em telas de detalhes de provedor.
Componentes Principais: ImageBackground, TouchableOpacity, Ionicons.
Fluxo de Dados e Interações:
Entrada: Recebe uma prop provider: ProviderDetails (Interface ProviderDetails localmente definida, contendo id, fullName, avatarUrl).
Saída: Dispara a função onBackPress (recebida via props).
Considerações de Implementação:
Utiliza StyleSheet.absoluteFillObject para posicionamento da overlay.
Ajustes de paddingTop para Platform.OS (iOS/Android) para safe area.
3.5. Outras Funcionalidades
3.5.1. Tela de Mensagens (app/(client)/messages/index.tsx)
Propósito: Gerenciar conversas de chat entre o cliente e os provedores.
Rota: /(client)/messages
Componentes Principais: (Não detalhados na documentação fornecida, mas tipicamente incluem FlatList para mensagens, TextInput para entrada de texto).
Fluxo de Dados e Interações:
API Calls (Backend Endpoints):
Obter Histórico de Mensagens: GET /chat/:chatId/messages (Requisição: GetMessagesDto, Resposta: Message[]).
Enviar Mensagem: POST /chat/:chatId/messages (Requisição: SendMessageDto, Resposta: Message).
Comunicação em Tempo Real: Integração com Socket.IO para sendMessage e joinChat (conforme backend ChatGateway).
Considerações de Implementação: Exibição de contagens de mensagens não lidas na NavBar.
4. Integração com o Backend
A comunicação entre o frontend do LimpeJá (módulo cliente) e o backend NestJS é estabelecida principalmente através de APIs RESTful (HTTP) para a maioria das operações e WebSockets para funcionalidades de comunicação em tempo real (chat).

Padrão de Comunicação: Todas as chamadas de API são realizadas através de serviços centralizados (authService.ts, clientService.ts, providerService.ts) que utilizam uma instância configurada do Axios (api.ts).
Autenticação JWT: O AuthContext (via useAuth hook) gerencia o ciclo de vida do token JWT, armazenando-o no AsyncStorage e anexando-o aos cabeçalhos de requisição (Authorization: Bearer <token>) para todas as chamadas protegidas.
Consistência de Dados (DTOs): Há um forte alinhamento entre as interfaces TypeScript do frontend (presentes em LimpeJaApp/src/types/backend/) e os DTOs do backend, garantindo que a estrutura dos dados enviados e recebidos seja validada e consistente.
Tratamento de Erros: As chamadas de API incluem blocos try-catch para lidar com erros de rede ou respostas de erro do backend, muitas vezes relançando exceções com mensagens amigáveis para o usuário.
5. Princípios de Design e Padrões de Projeto (Frontend)
O desenvolvimento do módulo cliente segue os seguintes princípios para garantir um código limpo, testável e escalável:

Componentização: A UI é dividida em componentes pequenos e reutilizáveis (ex: PrestadorCard, RecomendacaoCard, HeaderSection, StarRating, InfoChip), promovendo a modularidade e a reutilização de código.
Gerenciamento de Estado:
Hooks do React: useState, useEffect, useRef, useCallback são amplamente utilizados para gerenciar o estado local dos componentes e seus efeitos colaterais.
Context API: O AuthContext é um exemplo chave, fornecendo um estado global para informações de autenticação e perfil do usuário (user, token, isAuthenticated, isLoading).
Navegação Declarativa: O Expo Router é utilizado para definir as rotas e gerenciar o fluxo de navegação de forma declarativa e baseada no sistema de arquivos.
Tipagem Forte (TypeScript): O uso rigoroso de TypeScript em todas as interfaces e componentes minimiza erros em tempo de execução e melhora a manutenibilidade do código, especialmente na integração com o backend.
Animações: A Animated API do React Native é empregada para criar transições suaves, feedback visual ao toque e efeitos de carregamento, aprimorando a experiência do usuário.
Responsividade: O uso de Dimensions e Platform.OS permite ajustes de layout e comportamento para diferentes tamanhos de tela e sistemas operacionais.
6. Histórico de Atualizações e Refatorações Recentes
Durante o processo de desenvolvimento e depuração, os seguintes componentes foram submetidos a refatorações significativas para resolver erros de tipagem e alinhar a estrutura de dados com as interfaces do backend:

SecaoRecomendacoes.tsx:

Correção: Removida a definição local de ProviderDetailsDto.
Alinhamento: Passou a importar e usar a interface Provider diretamente de LimpeJaApp/src/types/backend/providers.ts para a prop data.
Impacto: Garantiu que o componente recebesse dados completos e tipados corretamente.
RecomendacaoCard.tsx:

Correção: Removida a definição local de ProviderDetailsDto.
Alinhamento: Passou a importar e usar a interface Provider diretamente de LimpeJaApp/src/types/backend/providers.ts para a prop item.
Ajuste de Nomes: Propriedades como totalReviews e offeredServices foram corrigidas para reviewCount e providerServices, respectivamente, alinhando com a interface Provider. Nomes como nome e imagemUrl foram ajustados para fullName e avatarUrl.
NavBar.tsx:

Funcionalidade: Adicionada a capacidade de exibir contagens de notificações não lidas (unreadMessagesCount), preparando o componente para integrar dados do backend.
DrawerMenu.tsx:

Alinhamento: A tipagem do objeto user do AuthContext foi corrigida para UserProfile | null, importando UserProfile de LimpeJaApp/src/types/backend/users.ts.
Impacto: Garantiu que todos os campos do perfil do usuário (incluindo walletBalance, ordersCount, totalEarningsLastMonth, upcomingBookingsCount) estivessem disponíveis e tipados corretamente.
Correção de Erro: Resolvido o erro "Não é possível encontrar o nome 'router'" ao garantir a declaração correta de useRouter().
ListaPrestadores.tsx:

Alinhamento: A prop data foi explicitamente tipada como Provider[].
Impacto: Reforçou a consistência dos dados passados para os PrestadorCard.
PrestadorCard.tsx:

Correção: Resolvido o erro "A propriedade 'distance' não existe no tipo 'Provider'".
Alinhamento: Criada uma interface local ProviderWithDistance que estende Provider e adiciona a propriedade distance?: string, usada para a prop item.
Ajuste de Nomes: Propriedades como totalReviews e offeredServices foram corrigidas para reviewCount e providerServices, respectivamente, alinhando com a interface Provider.
SecaoPrestadores.tsx:

Correção: Removida a definição local de ProviderDetailsDto que causava incompatibilidade.
Alinhamento: Passou a importar e usar a interface Provider diretamente de LimpeJaApp/src/types/backend/providers.ts para a prop data.
Impacto: Garantiu que os dados passados para PrestadorCard estivessem corretamente tipados.
HeaderSection.tsx:

Correção: Resolvido o erro de TypeScript "A propriedade 'absoluteFillObject' não existe no tipo '{ new (): StyleSheet; prototype: StyleSheet; }'." e "A propriedade 'create' não existe no tipo '{ new (): StyleSheet; prototype: StyleSheet; }'.".
Alinhamento: A classe StyleSheet foi explicitamente importada de react-native, permitindo o uso correto de StyleSheet.create e StyleSheet.absoluteFillObject.
Esta documentação serve como um guia abrangente para o módulo cliente do LimpeJá App, detalhando sua estrutura, funcionalidades, integração com o backend e os princípios de desenvolvimento adotados.