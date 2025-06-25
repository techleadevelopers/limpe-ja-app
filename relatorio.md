Relatório da Lógica Atual e Adições no Cleaning App
Este relatório sumariza as modificações e o estado atual da lógica do seu aplicativo, focando na integração de dados de provedores de serviço (prestadores) nas seções de "Recomendações" e "Profissionais por Perto" na tela inicial do cliente.

1. Backend (NestJS com Prisma e PostgreSQL)
1.1. Modelagem de Dados (Schema Prisma: prisma/schema.prisma)
Adição de price ao Service: O modelo Service (que representa as categorias de serviço como "Residencial", "Comercial") agora inclui um campo price do tipo Decimal (@db.Decimal(10, 2)).
Conversão de Float para Decimal: Campos relacionados a valores monetários em ProviderService, Booking e Transaction foram alterados de Float para Decimal (@db.Decimal(10, 2)). Esta é uma melhor prática para garantir precisão em cálculos financeiros, evitando erros de ponto flutuante.
Manutenção de Relações: Todas as relações complexas entre User, Client, Provider, Address, Service, ProviderService, Booking, Message, Notification, Review, Offer e Transaction foram mantidas e, em alguns casos, tiveram suas inclusões ajustadas para garantir a busca de dados relacionados.
1.2. População de Dados (Seed: prisma/seed/seed.ts)
Ordem de Execução Melhorada: A lógica de seed foi reestruturada para garantir que os Serviços (Categorias) sejam criados antes que os Provedores de Teste sejam criados. Isso é fundamental, pois os provedores se associam a serviços existentes.
Criação Abrangente de Provedores de Teste: Foram adicionados provedores de teste (provider1@cleaning.com, provider2@cleaning.com) com dados realistas (nome, CPF, data de nascimento, telefone, anos de experiência, URL de avatar, status de verificado, biografia e endereço completo).
Lógica de Upsert para Provedores e Serviços:
O seed agora verifica se o usuário (e o perfil de provedor associado) já existe.
Se o usuário/provedor não existe, ele é criado com todos os dados.
Se o usuário existe e já possui um perfil de provedor, o seed tenta atualizar os dados do perfil desse provedor (mantendo-o sempre atualizado com os dados do seed).
Para os providerServices (serviços que um provedor específico oferece), é usado upsert para garantir que a associação seja criada se não existir, ou atualizada se já existir. Isso mantém a consistência dos serviços oferecidos pelos provedores de teste em cada execução do seed.
Logs Detalhados: Adicionados console.logs para rastrear cada etapa do processo de seed, facilitando a depuração e verificação da população de dados.
1.3. Lógica de Negócio (Service: src/providers/providers.service.ts)
Tipagem Robusta com ProviderWithRelations: Um tipo auxiliar ProviderWithRelations foi definido utilizando a união de Provider e as relações incluídas (user, address, providerServices, reviewsReceived). Isso resolveu a maioria dos problemas de tipagem, garantindo que os objetos Provider retornados das operações de banco de dados contenham todas as relações esperadas pelo TypeScript.
ProviderWithCalculatedRating para Frontend: Um tipo ProviderWithCalculatedRating foi criado para representar o objeto Provider após o cálculo da média de avaliação e outras transformações, contendo apenas os campos relevantes para o frontend.
Métodos de Busca de Provedores Implementados:
search(searchDto: ProviderSearchDto): Este método foi aprimorado para aceitar um ProviderSearchDto (que usa searchTerm para busca textual, serviceId para filtrar por serviço, location para filtrar por cidade/bairro/rua). Ele busca provedores no banco de dados e então calcula a averageRating e reviewCount em memória. A ordenação por sortBy (Rating, Experience) também é feita em memória.
findTopRatedOrExperiencedProviders(): Novo método para buscar provedores "recomendados". Ele busca provedores verificados, ordena por yearsOfExperience em ordem decrescente (mais experientes primeiro) e limita a 5 resultados. Os dados são mapeados para ProviderWithCalculatedRating.
findAllProviders(params?): Novo método para buscar provedores para a seção "por perto". Ele busca provedores verificados e permite filtros opcionais (limit, offset, search, serviceId). Os dados também são mapeados para ProviderWithCalculatedRating.
Consistência de Include: Todas as chamadas findUnique e findMany no serviço usam consistentemente a mesma estrutura include para garantir que user, address, providerServices (com service) e reviewsReceived (com client) sejam sempre carregados, conforme necessário para a construção do ProviderDetailsDto e ProviderWithCalculatedRating.
1.4. Camada de API (Controller: src/providers/providers.controller.ts)
Novos Endpoints Públicos:
GET /providers/recommended: Mapeia para providersService.findTopRatedOrExperiencedProviders(), retornando uma lista de provedores recomendados sem necessidade de autenticação.
GET /providers/nearby: Mapeia para providersService.findAllProviders(), retornando uma lista de provedores "por perto" (ou todos os ativos, conforme a lógica do serviço), também sem necessidade de autenticação.
Ordem das Rotas: A ordem dos @Get() foi ajustada para evitar conflitos de rota (rotas com caminhos fixos como /recommended e /nearby vêm antes da rota dinâmica /:id).
ProviderDetailsDto como Resposta: Todos os endpoints que retornam provedores utilizam o ProviderDetailsDto para formatar a saída, garantindo que apenas os dados públicos e formatados sejam expostos ao frontend.
2. Frontend (React Native / Expo)
2.1. Tela Inicial do Cliente (app/(client)/explore/index.tsx)
Integração de Novas Funções de Serviço: O fetchData agora utiliza getRecommendedProviders() e getNearbyProviders() (do providerService.ts do frontend) para popular os estados recommendations e providers, respectivamente.
Tipagem ProviderDisplayInfo: Uma interface ProviderDisplayInfo foi definida (e copiada para os componentes de seção para resolver erros, embora a melhor prática seja centralizá-la) para tipar os dados de provedor esperados pelo frontend.
Renderização Dinâmica com ProviderCard:
O componente ProviderCard foi criado para exibir um provedor individualmente (com avatar, nome, biografia, serviços).
As seções SecaoRecomendacoes e SecaoPrestadores foram atualizadas para aceitar uma prop renderItem, que recebe o ProviderCard para renderizar seus itens.
Também aceitam a prop noDataText para exibir uma mensagem quando não há provedores.
Animações e Gerenciamento de Estado: A tela mantém o estado de carregamento (loading), erro (error) e utiliza animações em cascata para uma experiência de usuário fluida.
Passagem de Dados para HeaderSuperior: O HeaderSuperior continua recebendo userName e userAddress do userProfile carregado, garantindo a personalização do cabeçalho.
2.2. Componentes de Seção (SecaoRecomendacoes.tsx, SecaoPrestadores.tsx)
Props Atualizadas: As interfaces SecaoRecomendacoesProps e SecaoPrestadoresProps foram modificadas para aceitar:
data: ProviderDisplayInfo[]: Garantindo que a lista de provedores seja do tipo esperado pelo frontend.
renderItem: Uma função para renderizar cada item da lista, tornando os componentes de seção mais flexíveis.
noDataText: Uma prop para a mensagem de "nenhum dado".
Uso de renderItem: Os componentes agora utilizam a prop renderItem dentro do map para renderizar dinamicamente os cards de provedor, em vez de importar e renderizar um PrestadorCard diretamente.

Adições ao Relatório (Ponto 1.4. Camada de API: src/providers/providers.controller.ts)
Exportação da Classe: A classe ProvidersController foi explicitamente marcada com export em sua declaração no arquivo src/providers/providers.controller.ts, resolvendo o erro de importação no ProvidersModule.
Ajustes de Tipagem de Entrada para ProviderDetailsDto: A tipagem do construtor de ProviderDetailsDto foi alinhada para aceitar ProviderWithIncludes (o tipo retornado pelos métodos do service que incluem todas as relações necessárias), removendo a necessidade de as any em alguns mapeamentos e garantindo a consistência dos tipos.
Remoção de Lógica Desnecessária: Variáveis como dataToUpdate e lógicas de orderBy que foram erroneamente inseridas no providers.controller.ts em etapas anteriores foram removidas, pois a responsabilidade pela construção do objeto de atualização e pela ordenação pertence ao providers.service.ts.


Análise dos Componentes Frontend e Suas Necessidades de Backend
1. Análise de bookingId.tsx (Detalhes do Agendamento)
Propósito: Exibir informações detalhadas de um agendamento específico, permitindo ações como cancelar, contatar o provedor, avaliar o serviço e ver o perfil do provedor.

Componentes Principais:

BookingDetailsScreen (o componente raiz)
ProviderBrief (mockado no exemplo, mas idealmente renderizaria informações do provedor)
Dados Consumidos do Backend:

Detalhes do Agendamento: id, serviceName, providerName, providerId, providerImageUrl, date, time, status, address, notes, price, reviewed.
Observação: O MockBooking atual é um placeholder. O backend precisará retornar um objeto Booking com includes para service, provider, e talvez client (para o endereço).
Ações e Rotas de Backend Necessárias:

Carregar Detalhes do Agendamento:

Rota: GET /bookings/:id
Dados Esperados (Output): Um objeto Booking completo, incluindo relações com Service e Provider (e suas imagens/nomes), e o endereço do agendamento.
Status Atual: Não listada explicitamente no log, mas é fundamental.
Cancelar Agendamento:

Rota: PATCH /bookings/:id/cancel (ou DELETE /bookings/:id se o cancelamento for uma exclusão lógica/física)
Dados Esperados (Output): Mensagem de sucesso/status atualizado.
Status Atual: Não listada explicitamente no log.
Contatar Provedor (Chat):

Rota: GET /chat/provider/:providerId/client/:clientId (para obter/criar um chat entre eles) ou POST /chat/start (para iniciar um novo chat) e POST /chat/:chatId/messages (para enviar mensagem).
Dados Esperados (Output): ID do chat ou confirmação de mensagem enviada.
Status Atual: POST /chat/:chatId/messages e GET /chat/:chatId/messages existem. A rota para iniciar um chat ou obter um chat existente entre dois usuários específicos pode ser necessária.
Avaliar Serviço:

Rota: POST /reviews
Dados Esperados (Input): rating, comment, bookingId, providerId, clientId.
Status Atual: POST /reviews existe no log.
Ver Perfil do Provedor:

Rota: GET /providers/:id
Dados Esperados (Output): ProviderDetailsDto.
Status Atual: GET /providers/:id existe no log.
2. Análise de schedule-service.tsx (Agendamento de Serviço)
Propósito: Permitir que um cliente selecione um provedor e um serviço, escolha uma data/hora, confirme o endereço e finalize o agendamento com pagamento PIX.

Componentes Principais:

ScheduleServiceScreen (o componente raiz)
TimeSlotsSection, ProviderBrief (mockado aqui, mas idealmente seria o ProviderDetailsDto), PixPaymentDetails, ConfirmBookingButton, AddressSection, TimeSlotButton, PaymentMethodSelection, CalendarHeader, CalendarGrid.
Dados Consumidos do Backend:

Detalhes do Provedor: fullName, providerServices (incluindo service.name e service.price).
Disponibilidade do Provedor: Slots de tempo disponíveis para uma data específica.
Endereço do Usuário: Endereço padrão do cliente logado (para pré-preencher o formulário).
Ações e Rotas de Backend Necessárias:

Carregar Detalhes do Provedor e Serviço:

Rota: GET /providers/:id
Dados Esperados (Output): ProviderDetailsDto (ou um tipo similar que inclua providerServices com service.name e price).
Status Atual: GET /providers/:id existe no log.
Obter Disponibilidade do Provedor:

Rota: GET /providers/:providerId/availability?date=YYYY-MM-DD
Dados Esperados (Output): Array de ProviderAvailability (contendo startTime, endTime, isAvailable, dayOfWeek).
Status Atual: GET /providers/:providerId/availability existe no log.
Criar Agendamento:

Rota: POST /bookings
Dados Esperados (Input): CreateBookingDto (contendo providerId, clientId, serviceId, scheduledTime, address, totalAmount, notes).
Dados Esperados (Output): Um objeto Booking recém-criado.
Status Atual: Não listada explicitamente no log.
Gerar Cobrança PIX:

Rota: POST /payments/pix-charge
Dados Esperados (Input): amount, description, bookingId.
Dados Esperados (Output): PixChargeResponseDto (contendo brCode, qrCodeImage, value, expirationDate).
Status Atual: POST /payments/pix-charge existe no log.
Obter Endereço do Usuário Logado:

Rota: GET /users/me (para pré-popular o endereço do cliente)
Dados Esperados (Output): UserProfileDto (que contém o endereço do cliente se ele for do tipo CLIENT).
Status Atual: GET /users/me existe no log.
Mapa Consolidado de Rotas do Backend (Lógica e Prática)
Este mapa integra as rotas existentes com as identificadas como necessárias, organizadas por controladores.

Observação Importante sobre a Ordem das Rotas:
Conforme mencionado na análise anterior, é CRÍTICO que rotas com parâmetros dinâmicos (ex: /:id) venham DEPOIS de rotas com caminhos fixos (ex: /me, /recommended, /nearby) dentro do mesmo controlador para evitar conflitos de roteamento. A lista abaixo reflete a ordem lógica recomendada.

1. AppController (/)
GET /
GET /health
2. AuthController (/auth)
POST /auth/register/client
POST /auth/register/provider
POST /auth/login
POST /auth/forgot-password
3. UsersController (/users)
GET /users/me (Para o perfil do usuário logado, incluindo seu endereço para pré-preenchimento)
PATCH /users/me
GET /users/:id (Apenas para ADMIN)
DELETE /users/:id (Apenas para ADMIN)
4. ProvidersController (/providers)
Ajuste de Ordem Recomendado:

GET /providers/recommended (Existente, deve vir antes de /:id)
GET /providers/nearby (Existente, deve vir antes de /:id)
GET /providers/me (Existente, deve vir antes de /:id)
PATCH /providers/me (Existente, deve vir antes de /:id)
GET /providers (Busca com filtros, deve vir antes de /:id)
GET /providers/:id (Detalhes de um provedor específico)
DELETE /providers/:id (Apenas para ADMIN)
5. BookingsController (/bookings)
NOVO CONTROLADOR / NOVAS ROTAS NECESSÁRIAS:

POST /bookings:

Propósito: Criar um novo agendamento.
Input DTO: CreateBookingDto (ex: providerId, clientId, serviceId, scheduledTime, address, totalAmount, notes).
Output DTO: BookingEntity (ou BookingDetailsDto contendo o booking criado com id, totalAmount, e relações necessárias).
Guards: JwtAuthGuard, RolesGuard (apenas CLIENT).
GET /bookings/:id:

Propósito: Obter detalhes de um agendamento específico.
Input: id do agendamento (parâmetro de rota).
Output DTO: BookingDetailsDto (incluindo Service, Provider, Address associados).
Guards: JwtAuthGuard, RolesGuard (apenas CLIENT ou PROVIDER se for o agendamento dele, ou ADMIN).
PATCH /bookings/:id/cancel:

Propósito: Cancelar um agendamento.
Input: id do agendamento (parâmetro de rota).
Output DTO: MessageResponseDto ou BookingDetailsDto atualizado.
Guards: JwtAuthGuard, RolesGuard (apenas CLIENT ou ADMIN).
GET /bookings/me (Exemplo de rota para listar agendamentos do usuário logado, se necessário)

GET /bookings/provider/:providerId (Exemplo de rota para provedor ver seus agendamentos)

6. PaymentsController (/payments)
POST /payments/pix-charge (Já existente, usado para gerar PIX após o booking)
POST /payments/withdrawal
7. ChatController (/chat)
POST /chat/:chatId/messages
GET /chat/:chatId/messages
GET /chat/find-or-create/provider/:providerId/client/:clientId:
Propósito: Encontrar um chat existente entre um cliente e um provedor, ou criar um novo se não existir.
Input: providerId, clientId (parâmetros de rota).
Output DTO: ChatDetailsDto (contendo chatId).
Guards: JwtAuthGuard.
8. ReviewsController (/reviews)
POST /reviews (Já existente, usado para enviar avaliações)
GET /reviews
GET /reviews/:id
9. ServicesController (/services)
POST /services
GET /services
GET /services/:id
PATCH /services/:id
DELETE /services/:id
10. AvailabilityController (/providers/:providerId/availability)
GET /providers/:providerId/availability (Já existente, usado para obter slots disponíveis)
PATCH /providers/:providerId/availability
POST /providers/:providerId/availability
DELETE /providers/:providerId/availability/:availabilityId
11. OffersController (/offers)
POST /offers
GET /offers
GET /offers/:id
PATCH /offers/:id
DELETE /offers/:id
12. SearchController (/search)
GET /search
13. ClientsController (/clients)
CORREÇÃO CRÍTICA (Adicionar ao ClientsModule):

GET /clients/me/dashboard
PATCH /clients/me
GET /clients/:id (Apenas para ADMIN)
Resumo das Necessidades de Desenvolvimento Backend
Para suportar plenamente as funcionalidades de agendamento e detalhes do agendamento no frontend, você precisará:

Criar o BookingsController e implementar os métodos para POST /bookings, GET /bookings/:id, e PATCH /bookings/:id/cancel.
Garantir que o ClientsController esteja devidamente importado e declarado no ClientsModule para que suas rotas sejam mapeadas.
Ajustar a ordem das rotas no ProvidersController para evitar conflitos com parâmetros dinâmicos (/:id).
Implementar a lógica de GET /chat/find-or-create/provider/:providerId/client/:clientId no ChatController para facilitar o início de conversas.
Revisar os DTOs de saída (especialmente para BookingDetailsDto e ProviderDetailsDto) para garantir que incluem todas as includes necessárias para o frontend (ex: service.name, provider.fullName, address completo).
Assegurar que os serviços de backend (BookingService, ProviderService, UserService, PaymentService, ReviewService, ChatService) forneçam os dados com as relações corretas através do Prisma para que os DTOs possam ser construídos adequadamente.
Este mapa fornece um roteiro claro para o desenvolvimento do backend para suportar as funcionalidades atuais e futuras do seu aplicativo.









Passo 8: Componentes Reutilizáveis da UI

Objetivo: Criar ou ajustar componentes de interface do usuário que exibirão os dados e permitirão interações.
Arquivos Envolvidos (Criação/Modificação):
src/components/ProviderCard.tsx (NOVO):
Criar o componente para exibir informações de um provedor individual (avatar, nome, biografia, serviços).
src/components/SecaoRecomendacoes.tsx:
Atualizar as props para aceitar data: ProviderDisplayInfo[], renderItem, e noDataText.
src/components/SecaoPrestadores.tsx:
Atualizar as props para aceitar data: ProviderDisplayInfo[], renderItem, e noDataText.
Outros componentes de UI para agendamento (e.g., TimeSlotsSection, AddressSection, PixPaymentDetails) precisarão ser revisados para consumir os novos dados e serviços.
Passo 9: Telas e Páginas do Cliente

Objetivo: Integrar os novos serviços e componentes nas telas principais do aplicativo, fornecendo a experiência completa ao usuário.
Arquivos Envolvidos (Modificação):
app/(client)/explore/index.tsx:
Integrar getRecommendedProviders() e getNearbyProviders() para popular os estados recommendations e providers.
Utilizar os componentes SecaoRecomendacoes e SecaoPrestadores com o novo ProviderCard.
Implementar gerenciamento de estado de carregamento e erro.
app/(client)/bookingId.tsx (Detalhes do Agendamento):
Consumir dados do backend para exibir detalhes completos do agendamento (incluindo provedor, serviço, endereço, status, preço).
Implementar a lógica para as ações de "Cancelar Agendamento", "Contatar Provedor" (usando o novo serviço de chat), "Avaliar Serviço" e "Ver Perfil do Provedor".
app/(client)/schedule-service.tsx (Agendamento de Serviço):
Consumir ProviderDetailsDto para exibir informações do provedor e seus serviços.
Consumir ProviderAvailability para exibir e permitir a seleção de slots de tempo.
Utilizar getUserAddress() para pré-preencher o endereço.
Integrar a chamada para createBooking() e generatePixCharge().
