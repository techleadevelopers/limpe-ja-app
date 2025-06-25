Documentação Atualizada: interação-frontedn-backend.md
As seções a seguir foram atualizadas para refletir as correções e melhorias no fluxo de autenticação, especialmente no login.tsx.

2. Estratégias de Integração
A comunicação entre frontend e backend será realizada principalmente via requisições HTTP (API RESTful) e WebSockets para funcionalidades em tempo real.

2.1. Comunicação API RESTful
Biblioteca: O frontend utilizará axios ou a Fetch API para realizar as requisições HTTP ao backend.
URL Base: A URL base da API do backend (ex: http://localhost:3000 em desenvolvimento, ou a URL de produção) deve ser configurada no frontend, idealmente via variáveis de ambiente (.env).
Headers: Todas as requisições protegidas devem incluir o token JWT no cabeçalho Authorization no formato Bearer <token>.
CORS: O backend NestJS já está configurado com CORS (main.ts) para permitir requisições de diferentes origens, o que é essencial para o desenvolvimento e produção.
2.2. Autenticação JWT
O fluxo de autenticação é um ponto crítico de integração.

Login:
O frontend envia credenciais (e-mail e senha, que será mapeada para passwordHash conforme o LoginDto do backend) para o endpoint POST /auth/login.
O backend valida as credenciais e, se corretas, retorna um JWT.
O frontend deve armazenar este JWT de forma segura (ex: AsyncStorage ou expo-secure-store).
Registro:
O frontend envia os dados de registro (cliente ou provedor) para POST /auth/register/client ou POST /auth/register/provider.
O backend cria o usuário e retorna um JWT, que o frontend deve armazenar.
Requisições Protegidas: Para acessar rotas protegidas, o frontend deve incluir o JWT armazenado no cabeçalho Authorization de todas as requisições subsequentes.
Verificação: O backend utiliza JwtStrategy e JwtAuthGuard para validar o token em cada requisição protegida, garantindo a autenticidade do usuário e a autorização via RolesGuard. É importante notar que o UserRole é um tipo de união de literais de string ('CLIENT' | 'PROVIDER' | 'ADMIN') no frontend, e as comparações devem ser feitas diretamente com esses literais de string (ex: user.role === 'CLIENT').
Logout: Ao deslogar, o frontend deve remover o JWT armazenado localmente. O backend pode ter um endpoint de logout para invalidar o token no servidor, se necessário (embora JWTs sejam stateless por natureza, pode ser útil para blacklisting ou gerenciamento de refresh tokens).
2.3. Comunicação em Tempo Real (WebSockets)
Módulo de Chat: O backend possui um ChatGateway que utiliza @nestjs/platform-socket.io para gerenciar a comunicação em tempo real.
Frontend: As telas de chat do cliente (app/(client)/messages/[chatId].tsx) e do provedor (app/(provider)/messages/[chatId].tsx) precisarão integrar com socket.io-client para estabelecer a conexão WebSocket.
Eventos: A comunicação ocorrerá via eventos definidos no ChatGateway (ex: sendMessage, receiveMessage, joinChat).
2.4. Consistência de Dados (DTOs e Tipagem)
DTOs: O backend define DTOs (Data Transfer Objects) para entrada e saída de dados. É crucial que o frontend replique ou gere interfaces/tipos TypeScript correspondentes a esses DTOs para garantir a tipagem segura e a validação dos dados em ambos os lados. Para o LoginDto, o frontend deve enviar email e passwordHash (onde passwordHash é o valor da senha em texto plano digitada pelo usuário, que será hasheada pelo backend).
Validação: O ValidationPipe global do NestJS garante que os dados de entrada no backend sejam validados. O frontend deve realizar validações de formulário antes do envio para otimizar a UX e reduzir requisições inválidas.
3. Mapeamento Detalhado de Fluxos e Endpoints
A tabela a seguir detalha a interligação entre os fluxos do frontend e os endpoints do backend, incluindo os DTOs de requisição e resposta.

Fluxo/Tela do Frontend	Endpoint do Backend (Método HTTP, Caminho)	DTOs (Requisição/Resposta)	Observações de Integração
Fluxo de Autenticação			
Registro de Cliente (client-register.tsx)	POST /auth/register/client	RegisterClientDto / AuthResponseDto	Frontend envia dados do cliente, backend retorna JWT.
Registro de Provedor (provider-register/personal-details.tsx, service-details.tsx)	POST /auth/register/provider	RegisterProviderDto / AuthResponseDto	Frontend envia dados do provedor, backend retorna JWT.
Login (login.tsx)	POST /auth/login	LoginDto / AuthResponseDto	Frontend armazena JWT. LoginDto espera email e passwordHash.
Esqueci a Senha (forgot-password.tsx)	POST /auth/forgot-password	ForgotPasswordDto / MessageResponseDto	Simula envio de e-mail de redefinição. O login.tsx agora inclui um link direto para esta tela.
Gerenciamento de Usuário/Perfil			
Obter Perfil do Usuário (profile/index.tsx, dashboard.tsx)	GET /users/me	UserProfileDto	Protegido por JWT.
Atualizar Perfil do Cliente (profile/edit.tsx)	PATCH /clients/me	UpdateClientProfileDto / ClientEntity	Protegido por JWT (papel CLIENT).
Atualizar Perfil do Provedor (profile/edit-services.tsx, dashboard.tsx)	PATCH /providers/me	UpdateProviderProfileDto / ProviderDetailsDto	Protegido por JWT (papel PROVIDER).
Fluxo do Cliente			
Obter Dados do Dashboard (explore/index.tsx)	GET /clients/me/dashboard	ClientDashboardDto	Protegido por JWT (papel CLIENT).
Obter Todos os Tipos de Serviço (explore/todas-categorias.tsx)	GET /services	ServiceDetailsDto[]	Não requer autenticação.
Buscar Provedores/Serviços (explore/search-results.tsx)	GET /search	SearchQueryDto / SearchResultDto	Frontend deve enviar parâmetros de busca.
Obter Agendamentos do Cliente (bookings/index.tsx)	GET /bookings/me	BookingDetailsDto[]	Protegido por JWT (papel CLIENT), com filtros de status.
Obter Detalhes do Agendamento (bookings/[bookingId].tsx)	GET /bookings/:id	BookingDetailsDto	Protegido por JWT.
Atualizar Status Agendamento (Cancelar) (bookings/[bookingId].tsx)	PATCH /bookings/:id/status	UpdateBookingStatusDto / BookingDetailsDto	Cliente só pode cancelar. Protegido por JWT.
Obter Detalhes do Provedor (bookings/[providerId].tsx)	GET /providers/:id	ProviderDetailsDto	Não requer autenticação.
Obter Horários Disponíveis (bookings/schedule-service.tsx)	GET /providers/:providerId/availability	GetAvailabilityDto / AvailabilityDto[]	Frontend envia providerId.
Criar Agendamento (bookings/schedule-service.tsx)	POST /bookings	CreateBookingDto / BookingDetailsDto	Protegido por JWT.
Criar Cobrança PIX (bookings/schedule-service.tsx)	POST /payments/pix-charge	CreatePixChargeDto / PixChargeResponseDto	Protegido por JWT.
Obter Mensagens do Chat (messages/[chatId].tsx)	GET /chat/:chatId/messages	GetMessagesDto / Message[]	Protegido por JWT.
Enviar Mensagem de Chat (messages/[chatId].tsx)	POST /chat/:chatId/messages	SendMessageDto / Message	Protegido por JWT. Também via WebSocket.
Obter Detalhes da Oferta (ofertas/[ofertaId].tsx)	GET /offers/:id	Offer	Não requer autenticação.
Enviar Avaliação (bookings/[bookingId].tsx)	POST /reviews	SubmitReviewDto / ReviewEntity	Protegido por JWT.
Fluxo do Provedor			
Obter Agendamentos do Provedor (dashboard.tsx, services/index.tsx)	GET /bookings/me	BookingDetailsDto[]	Protegido por JWT (papel PROVIDER), com filtros de status.
Obter Ganhos do Provedor (earnings.tsx)	GET /providers/me/earnings	Transaction[] (implícito)	Protegido por JWT (papel PROVIDER).
Solicitar Saque (earnings.tsx)	POST /payments/withdrawal	RequestWithdrawalDto / MessageResponseDto	Protegido por JWT (papel PROVIDER).
Gerenciar Disponibilidade (schedule/manage-availability.tsx)	PATCH /providers/:providerId/availability	UpdateAvailabilityDto[] / AvailabilityDto[]	Protegido por JWT (papel PROVIDER).
Adicionar Slot de Disponibilidade (schedule/manage-availability.tsx)	POST /providers/:providerId/availability	UpdateAvailabilityDto / AvailabilityDto	Protegido por JWT (papel PROVIDER).
Deletar Slot de Disponibilidade (schedule/manage-availability.tsx)	DELETE /providers/:providerId/availability/:availabilityId	void	Protegido por JWT (papel PROVIDER).
Obter Serviços Oferecidos (profile/edit-services.tsx)	GET /providers/:providerId/services	ProviderServiceEntity[]	Protegido por JWT (papel PROVIDER).
Adicionar Serviço Oferecido (profile/edit-services.tsx)	POST /providers/:providerId/services	CreateProviderServiceDto / ProviderServiceEntity	Protegido por JWT (papel PROVIDER).
Atualizar Serviço Oferecido (profile/edit-services.tsx)	PATCH /providers/:providerId/services/:id	UpdateProviderServiceDto / ProviderServiceEntity	Protegido por JWT (papel PROVIDER).
Excluir Serviço Oferecido (profile/edit-services.tsx)	DELETE /providers/:providerId/services/:id	void	Protegido por JWT (papel PROVIDER).
Atualizar Status Agendamento (services/[serviceId].tsx)	PATCH /bookings/:id/status	UpdateBookingStatusDto / BookingDetailsDto	Provedor pode aceitar/recusar/concluir. Protegido por JWT.
Fluxo Comum			
Obter Notificações (notifications.tsx)	GET /notifications/me	NotificationEntity[]	Protegido por JWT.
Marcar Notificações como Lidas (notifications.tsx)	PATCH /notifications/me/mark-as-read	MarkAsReadDto / { count: number }	Protegido por JWT.
Marcar Notificação por ID como Lida (notifications.tsx)	PATCH /notifications/:id/mark-as-read	NotificationEntity	Protegido por JWT.
Excluir Notificação (notifications.tsx)	DELETE /notifications/:id	void	Protegido por JWT.
Enviar Feedback (feedback/[targetId].tsx)	POST /reviews	SubmitReviewDto / ReviewEntity	Protegido por JWT.
Tratamento de Erros
Backend: O HttpExceptionFilter do NestJS garante que todas as exceções HTTP sejam capturadas e formatadas em um JSON consistente (ex: { statusCode, timestamp, path, message, errors }).
Frontend: O frontend deve implementar um mecanismo centralizado para capturar e interpretar essas respostas de erro, exibindo mensagens amigáveis ao usuário. Isso é crucial para lidar com erros de validação (status 400), autenticação (401), autorização (403), recursos não encontrados (404) e erros internos do servidor (500).
Considerações de Desenvolvimento e Implantação
Variáveis de Ambiente: Tanto o frontend quanto o backend devem utilizar variáveis de ambiente (.env) para gerenciar configurações sensíveis (chaves secretas, URLs de banco de dados) e específicas do ambiente (URLs da API).
CORS: O backend já possui CORS configurado em main.ts, o que é um bom ponto de partida. Em produção, as origens permitidas devem ser restritas apenas aos domínios do frontend.
WebSockets: A configuração de WebSockets no NestJS (ChatGateway) e a conexão no React Native (socket.io-client) devem considerar o ambiente de deployment (ex: uso de ws:// ou wss:// e o endereço IP/domínio correto).
Dados Mockados: A prioridade máxima de integração é substituir todos os dados e chamadas de API mockadas no frontend por chamadas reais aos endpoints do backend.
Recomendações e Próximos Passos
Para otimizar a integração e a experiência de desenvolvimento:
Substituição de Mocks: Criar um serviço de API no frontend (ex: apiService.ts) que encapsule as chamadas HTTP e WebSockets, utilizando os DTOs e tipos definidos para garantir a consistência.
Design System Unificado: Centralizar a definição de cores, tipografia, espaçamentos e outros tokens de design em um arquivo theme.ts ou designSystem.ts no frontend, garantindo que o design reflita a identidade visual do Cleaning de forma consistente.
Feedback de Carregamento: Implementar Skeleton Screens para todas as telas que carregam dados assincronamente, melhorando a percepção de performance. Utilizar Toast Messages para feedback não intrusivo de sucesso ou erro.
Validação de Formulários: Para formulários complexos, considerar a integração de bibliotecas como React Hook Form com Zod ou Yup para validação e gerenciamento de estado mais robustos e performáticos.
Testes de Integração: Desenvolver testes de integração que simulem os fluxos de usuário completos, garantindo que frontend e backend se comuniquem corretamente.
Esta documentação serve como um guia abrangente para a equipe de desenvolvimento, facilitando a colaboração e garantindo uma integração eficiente entre o frontend e o backend do Cleaning.

Fase 1: Fundação e Autenticação
Esta fase é crucial, pois a autenticação é a base para a maioria das funcionalidades protegidas da aplicação.

Configuração e Teste de Conectividade:

Backend: Garanta que o backend NestJS esteja rodando localmente (ex: npm run start:dev). Verifique a URL e porta (http://localhost:3000 ou similar).
Frontend: No arquivo .env do frontend (ou similar), configure a BASE_API_URL para apontar para o seu backend local.
Teste: Faça uma requisição HTTP simples (ex: GET /) do frontend para o backend para confirmar que a comunicação básica está funcionando. Pode ser um fetch ou axios simples em um componente temporário.
Sincronização de DTOs e Tipos:

Ação: Crie ou gere arquivos TypeScript no frontend (types/backend-dtos.ts ou similar) que espelhem os DTOs (Data Transfer Objects) definidos no backend. Foque inicialmente nos DTOs de autenticação: LoginDto (com email: string; passwordHash: string;), RegisterClientDto, RegisterProviderDto, AuthResponseDto, ForgotPasswordDto.
Benefício: Isso garantirá tipagem segura no frontend, permitindo que o TypeScript ajude a evitar erros de dados e autocompletar propriedades.
Implementação do Serviço de Autenticação no Frontend:

Ação: Crie um novo arquivo ou pasta (ex: src/api/auth.ts ou src/services/authService.ts) para encapsular as chamadas de API relacionadas à autenticação.
Endpoints: Implemente funções para:
POST /auth/login
POST /auth/register/client
POST /auth/register/provider
POST /auth/forgot-password
Armazenamento do JWT: Após o login/registro bem-sucedido, armazene o access_token recebido do AuthResponseDto no AsyncStorage (ou expo-secure-store para maior segurança).
AuthContext: Modifique o AuthContext (contexts/AuthContext.tsx) para utilizar este novo serviço de autenticação. O isAuthenticated e user devem ser derivados do token JWT (decodificando-o para obter o role e userId) e do estado de presença do token. Ao verificar o user.role, utilize literais de string para comparação (ex: user.role === 'CLIENT').
Ajuste da Lógica de Redirecionamento Inicial:

Ação: No app/_layout.tsx e app/index.tsx, ajuste a lógica para que o redirecionamento (router.replace()) seja feito com base no estado de autenticação real do AuthContext e no papel (user.role) obtido do JWT, em vez de usar apenas variáveis mockadas ou isLoading genérico.
Teste: Execute o fluxo de login e registro completo, verificando se o usuário é redirecionado corretamente para /(client)/explore ou /(provider)/dashboard e se o token é persistido.
Fase 2: Integração de Módulos Chave
Com a autenticação funcionando, você pode começar a integrar os módulos mais importantes que dependem dela.

Integração do Perfil do Usuário:

Ação: Crie um serviço de API para usuários (ex: src/api/users.ts).
Endpoints: Implemente funções para:
GET /users/me: Para buscar os dados do perfil do usuário logado.
PATCH /clients/me: Para atualizar o perfil do cliente.
PATCH /providers/me: Para atualizar o perfil do provedor.
Frontend: Substitua os dados mockados e as simulações de API em app/(client)/profile/edit.tsx e app/(provider)/dashboard.tsx (para dados do provedor) pelas chamadas reais ao backend.
Integração de Serviços e Busca:

Ação: Crie um serviço de API para serviços e busca (ex: src/api/services.ts, src/api/search.ts).
Endpoints: Implemente funções para:
GET /services: Para listar todos os tipos de serviço.
GET /search: Para realizar a busca de provedores/serviços.
Frontend: Substitua os mockData e as funções simuladas em app/(client)/explore/todas-categorias.tsx e app/(client)/explore/search-results.tsx.
Integração de Detalhes do Provedor e Disponibilidade:

Ação: Crie um serviço de API para provedores (ex: src/api/providers.ts).
Endpoints: Implemente funções para:
GET /providers/:id: Para buscar os detalhes de um provedor específico.
GET /providers/:providerId/availability: Para buscar os horários disponíveis de um provedor.
Frontend: Substitua os mocks em app/(client)/bookings/[providerId].tsx (tela de detalhes do provedor) e em app/(client)/bookings/schedule-service.tsx (para buscar a disponibilidade).
Fase 3: Fluxos Complexos e Tempo Real
Após as funcionalidades básicas e de perfil estarem integradas, você pode avançar para os fluxos mais complexos.

Integração do Fluxo de Agendamento:

Ação: Crie um serviço de API para agendamentos (ex: src/api/bookings.ts).
Endpoints: Implemente funções para:
POST /bookings: Para criar um novo agendamento.
POST /payments/pix-charge: Para iniciar um pagamento PIX.
GET /bookings/me: Para listar os agendamentos do cliente/provedor.
GET /bookings/:id: Para obter detalhes de um agendamento específico.
PATCH /bookings/:id/status: Para atualizar o status do agendamento (cancelar, confirmar, etc.).
Frontend: Integre estes endpoints em app/(client)/bookings/schedule-service.tsx, app/(client)/bookings/success.tsx, app/(client)/bookings/[bookingId].tsx, app/(client)/bookings/index.tsx, e nas telas de agendamento do provedor.
Integração do Chat (WebSockets):

Ação: Utilize a biblioteca socket.io-client no frontend.
Conexão: Estabeleça a conexão WebSocket com o ChatGateway do backend.
Eventos: Implemente a lógica para enviar (sendMessage) e receber (receiveMessage) mensagens em tempo real.
Histórico: Integre com GET /chat/:chatId/messages para carregar o histórico de mensagens ao abrir um chat.
Frontend: Substitua os mocks em app/(client)/messages/[chatId].tsx e app/(provider)/messages/[chatId].tsx.
Integração de Ganhos e Gerenciamento de Serviços do Provedor:

Ação: Crie um serviço de API para ganhos e serviços do provedor.
Endpoints: Implemente funções para:
GET /providers/me/earnings: Para o resumo de ganhos.
POST /payments/withdrawal: Para solicitar saque.
CRUD para ProviderServices (GET, POST, PATCH, DELETE /providers/:providerId/services).
PATCH /providers/:providerId/availability: Para gerenciar slots de disponibilidade.
Frontend: Integre estes endpoints em app/(provider)/earnings.tsx, app/(provider)/profile/edit-services.tsx e app/(provider)/schedule/manage-availability.tsx.
Considerações Transversais Essenciais:
Tratamento de Erros Centralizado: Implemente um mecanismo global no frontend para interceptar erros de requisições HTTP e exibir mensagens amigáveis ao usuário, aproveitando o formato de erro padronizado do HttpExceptionFilter do backend.
Feedback Visual: Em todas as telas onde a integração está ocorrendo, substitua os ActivityIndicator genéricos por Skeleton Screens durante o carregamento. Utilize Toast Messages para feedback de sucesso ou erro (ex: "Perfil atualizado com sucesso!", "Erro ao agendar serviço.").
Remoção de Mocks: À medida que cada funcionalidade é integrada com o backend real, remova completamente os dados mockados (mockData.ts) e as funções fetch...API simuladas correspondentes. Mantenha o código limpo.
Testes: Realize testes manuais rigorosos para cada fluxo após a integração. Considere a implementação de testes de integração automatizados para os fluxos mais críticos.

Análise da Integração Atual: index.tsx (Explore Client Screen) e clientService.ts
A tela index.tsx (Explore Client Screen) é o ponto de entrada principal para o cliente e já demonstra um esforço inicial de integração com o backend, utilizando o clientService.ts.

1. app/(client)/explore/index.tsx - Visão Geral do Frontend
Estrutura: A tela utiliza ScrollView com Animated.View para efeitos visuais, HeaderSuperior, BannerOferta, SecaoContainer para categorias, SecaoRecomendacoes e SecaoPrestadores. Há também um NavBar fixo na parte inferior.
Estados: Gerencia isLoading, userName, serviceCategories, recommendations, providers, e offer.
Integração com clientService.ts:
getServiceCategories(): Chamada para buscar categorias de serviço.
searchProviders(): Chamada para buscar provedores (usada para recomendações e "Profissionais por Perto").
getUserProfile(): Chamada para obter os dados do perfil do usuário logado.
Tratamento de Carregamento/Erro: Utiliza ActivityIndicator e Alert para feedback básico.
Redirecionamentos: Usa useRouter para navegação (/ofertas/detalhes, /ver-tudo, /prestadores/[id], /servicos/[id], /search-results, /todos-prestadores-proximos).
2. app/services/clientService.ts - Visão Geral do Serviço Backend
Configuração Base: Importa axios e AsyncStorage para armazenamento do token, e define API_BASE_URL a partir das variáveis de ambiente (process.env.EXPO_PUBLIC_API_BASE_URL).
getAuthToken(): Função auxiliar para recuperar o token JWT do AsyncStorage, essencial para requisições protegidas.
Funções de API Implementadas:
getServiceCategories(): axios.get(${API_BASE_URL}/services)
Alinhamento com a Doc: ✅ Alinhado. A documentação prevê GET /services para ServiceDetailsDto[].
searchProviders(query: any): axios.get(${API_BASE_URL}/search, { params: query, headers: { Authorization:Bearer ${token}} })
Alinhamento com a Doc: ✅ Alinhado. A documentação prevê GET /search para SearchQueryDto / SearchResultDto. A requisição inclui o token de autenticação, o que é correto se a busca também for protegida ou retornar dados personalizados.
getUserProfile(): axios.get(${API_BASE_URL}/users/me, { headers: { Authorization:Bearer ${token}} })
Alinhamento com a Doc: ✅ Alinhado. A documentação prevê GET /users/me para UserProfileDto e é uma rota protegida.
3. Análise do Fluxo de Configuração e Onde Estamos na Documentação
Com base na documentação e nos arquivos fornecidos, estamos firmemente na Fase 2: Integração de Módulos Chave, e avançando em partes da Fase 3: Fluxos Complexos.

Fase 1: Fundação e Autenticação: Presume-se que a autenticação básica (login, registro, armazenamento JWT) já está funcional, pois as chamadas em clientService.ts dependem da existência e recuperação de um token (getAuthToken()).

Fase 2: Integração de Módulos Chave:

Integração do Perfil do Usuário: A função getUserProfile() em clientService.ts e seu uso em index.tsx (HeaderSuperior) estão diretamente alinhados com GET /users/me.
Integração de Serviços e Busca: As funções getServiceCategories() e searchProviders() em clientService.ts e seu uso em index.tsx (para serviceCategories, recommendations, e providers) estão diretamente alinhadas com GET /services e GET /search.
Integração de Detalhes do Provedor e Disponibilidade: Embora index.tsx não chame diretamente endpoints para GET /providers/:id ou GET /providers/:providerId/availability, a existência de SecaoPrestadores e SecaoRecomendacoes que exibem provedores sugere que essas rotas serão necessárias quando o usuário clicar em um card de provedor (navegação para /(client)/bookings/[providerId].tsx). A documentação já lista esses endpoints, então o backend deve tê-los ou estar desenvolvendo-os.
Fase 3: Fluxos Complexos e Tempo Real:

BannerOferta em index.tsx indica a necessidade de um endpoint para obter dados de ofertas.
4. Funções que o clientService.ts deve conter (Baseado nos Componentes Anexados e Rotas Implícitas)
Considerando os componentes na index.tsx e suas interações esperadas, o clientService.ts (ou outros serviços específicos do cliente, como offerService.ts) precisará das seguintes funções para substituir completamente os dados mockados e habilitar as rotas correspondentes:

getOffers():

Propósito: Obter dados para o BannerOferta. O componente BannerOferta provavelmente exibirá uma oferta promocional.
Endpoint Documentado: GET /offers/:id (para um ID específico) ou GET /offers (para listar todas as ofertas ou a oferta em destaque). A documentação menciona GET /offers/:id Offer, mas para um banner principal na home, talvez seja necessário um endpoint para "oferta em destaque" ou uma lista de ofertas para o frontend escolher.
DTOs Esperados: Offer (para o retorno, se for uma única oferta) ou Offer[] (se for uma lista).
Proteção: A documentação diz que GET /offers/:id "Não requer autenticação", o que é adequado para o banner da home.
getProviderDetails(providerId: string):

Propósito: Quando o usuário clica em um RecomendacaoCard ou PrestadorCard (handleRecomendacaoPress e a navegação da SecaoPrestadores onPress que aponta para /(client)/bookings/[providerId].tsx), o frontend precisará buscar os detalhes completos daquele provedor.
Endpoint Documentado: GET /providers/:id (ProviderDetailsDto).
Proteção: A documentação diz "Não requer autenticação", o que é lógico para permitir que usuários não logados visualizem perfis de provedores.
Funções Relacionadas a Filtros/Busca Avançada (Implícito):

A documentação já prevê GET /search. Se houver mais filtros ou tipos de busca específicos (ex: por categoria, por localização mais detalhada), o searchProviders pode precisar ser mais robusto ou funções adicionais podem ser necessárias para lidar com esses parâmetros. A rota /(client)/explore/search-results.tsx e /todos-prestadores-proximos exigirão que o searchProviders seja chamado com parâmetros específicos.
Integração do AuthContext para userName:

Atualmente, index.tsx tem um estado userName. A documentação da Fase 1 já indica que AuthContext deve ser modificado para derivar isAuthenticated e user (incluindo userName e role) do token JWT. O HeaderSuperior já está recebendo userName via props. A integração final será puxar este userName diretamente do AuthContext em index.tsx e passá-lo para HeaderSuperior. O getUserProfile() pode ser usado para buscar dados adicionais do perfil além do que está no token.
5. O que falta integrar como Rotas no Backend (Baseado nos Componentes Anexados e sem alterar a Documentação)
A documentação já é bastante abrangente e lista as rotas que seriam necessárias para suportar os componentes da Home Screen e as ações de navegação:

Para o BannerOferta:

A documentação já lista GET /offers/:id Offer. Para a home screen, pode ser que o backend precise de um endpoint para GET /offers/featured ou GET /offers/homepage-banner que retorne a oferta principal a ser exibida. Se não houver um endpoint específico para uma "oferta destacada" na home, o frontend terá que chamar GET /offers (se disponível) e selecionar uma oferta da lista, ou chamar GET /offers/:id com um ID fixo ou obtido de alguma outra configuração.
Para SecaoPrestadores e SecaoRecomendacoes (quando clicado em um card):

A navegação para /(client)/bookings/[providerId].tsx implica a necessidade de GET /providers/:id. Esta rota já está listada na documentação: Obter Detalhes do Provedor (bookings/[providerId].tsx) GET /providers/:id ProviderDetailsDto Não requer autenticação.
Para SecaoContainer (categorias):

GET /services já está implementado em clientService.ts.
Para HeaderSuperior (nome do usuário):

GET /users/me já está implementado em clientService.ts.
Para a funcionalidade de busca (TextInput no HeaderSuperior):

GET /search já está implementado em clientService.ts. A documentação lista Buscar Provedores/Serviços (explore/search-results.tsx) GET /search SearchQueryDto / SearchResultDto Frontend deve enviar parâmetros de busca.
Em resumo, a documentação já prevê a maioria das rotas necessárias para a index.tsx do cliente e seus sub-componentes. A integração existente em clientService.ts já cobriu as principais. O único ponto a ser mais claro ou adicionado, se a intenção for ter uma oferta dinâmica no banner, é a necessidade de um endpoint para obter ofertas para o banner principal (que pode ser GET /offers ou um endpoint mais específico como GET /offers/featured).

Estado Atual da Integração com Alinhamento à Documentação:

index.tsx (Explore Client Screen):

HeaderSuperior: Já consome userName e pode ser integrado com getUserProfile() para obter o nome real do usuário logado (usando o AuthContext como fonte primária e getUserProfile para detalhes adicionais como endereço).
SecaoContainer (Categorias): Integrada com getServiceCategories() em clientService.ts, que chama GET /services.
SecaoRecomendacoes e SecaoPrestadores: Integradas com searchProviders() em clientService.ts, que chama GET /search. Os dados mockados devem ser removidos completamente assim que os dados reais do backend forem consumidos.
BannerOferta: Atualmente, esta seção provavelmente usa dados mockados. A integração com o backend para obter dados de ofertas (via GET /offers ou GET /offers/:id conforme a documentação) é um próximo passo crucial.
clientService.ts:

Já contém as funções essenciais getServiceCategories, searchProviders, e getUserProfile, que correspondem diretamente aos endpoints GET /services, GET /search, e GET /users/me da documentação.
Backend (Conforme Documentação):

As rotas GET /services, GET /search, GET /users/me já estão documentadas e, portanto, devem ser implementadas no backend para que as chamadas do clientService.ts retornem dados reais.
A rota GET /providers/:id (para detalhes de provedor ao clicar nos cards de recomendação/prestadores) também está documentada e é crucial para as próximas etapas de navegação.
A rota GET /offers/:id está documentada. Para o banner de oferta na home, uma decisão precisa ser tomada: o frontend vai chamar GET /offers/:id com um ID específico, ou o backend precisa de um endpoint para listar todas as ofertas ou uma oferta destacada (ex: GET /offers ou GET /offers/featured)? A documentação atual sugere apenas GET /offers/:id. Se BannerOferta precisa de uma oferta genérica, o backend pode precisar de um endpoint de listagem ou de uma "oferta em destaque" (GET /offers/featured).
Próximos Passos Essenciais (para continuar sem alterar a documentação):

Backend:
Garantir a implementação e testes das rotas:
GET /users/me (para HeaderSuperior)
GET /services (para categorias)
GET /search (para provedores em recomendações e "por perto")
GET /providers/:id (para quando o usuário clicar em um provedor, que levará à tela de detalhes do provedor)
GET /offers/:id (para o banner de oferta, se o frontend buscar por ID específico; considerar um endpoint para listagem ou "destacado" se necessário para a home).
Frontend (index.tsx e clientService.ts):
Remoção de Mocks: Substituir todos os dados mockados (PRESTADORES_EXEMPLO_PARA_RECOMENDACOES, PRESTADORES_EXEMPLO, etc.) pelas chamadas reais ao clientService.ts.
Integração do BannerOferta: Implementar a chamada para getOffers() (ou similar) no clientService.ts e consumi-la no index.tsx para popular o BannerOferta com dados reais. Se o backend só tem GET /offers/:id, o frontend precisará de uma forma de obter o ID da oferta a ser exibida (ex: configuração, ou chamar GET /offers se um endpoint de listagem for adicionado).
Tratamento de Erros e Carregamento: Expandir a lógica de isLoading e Alert para usar o mecanismo centralizado de tratamento de erros e feedback visual (Skeleton Screens, Toast Messages) conforme a documentação recomenda.
Navegação dos Cards: Confirmar que o onPress dos RecomendacaoCard e PrestadorCard redireciona para a tela correta de detalhes do provedor (/(client)/bookings/[providerId].tsx), e que essa tela de detalhes fará a chamada GET /providers/:id usando o ID obtido da navegação.
Tipagem: Reforçar a tipagem dos dados retornados pelas funções do clientService.ts para que correspondam aos DTOs do backend (ex: ServiceDetailsDto[], SearchResultDto, UserProfileDto, Offer).
Este alinhamento garante que o progresso está em linha com a documentação, focando nos próximos passos práticos para a integração completa da Home Screen do cliente.