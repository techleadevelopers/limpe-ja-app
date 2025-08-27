Documentação do Módulo types/backend (LimpeJá App)

O módulo types/backend é o coração da tipagem da aplicação LimpeJá, atuando como um contrato explícito entre o frontend e o backend. Ele contém todas as interfaces, tipos e enums que representam os DTOs (Data Transfer Objects) de requisição e resposta, bem como as entidades de dados que são trocadas com a API.

A centralização das definições de tipo neste módulo oferece vários benefícios:

Consistência: Garante que a estrutura dos dados seja uniforme em toda a aplicação, tanto no envio quanto no recebimento.
Segurança de Tipo: Permite que o TypeScript realize verificações em tempo de compilação, capturando erros relacionados a dados antes que se tornem problemas em tempo de execução.
Manutenibilidade: Facilita a compreensão do fluxo de dados e simplifica as atualizações, pois as mudanças em uma entidade de backend são refletidas em um único local.
Legibilidade: Melhora a clareza do código ao documentar explicitamente a forma dos dados esperados.
Estrutura do Módulo types/backend
vim

Copiar
types/backend/
├── auth.ts
├── bookings.ts
├── chat.ts
├── clients.ts
├── coupons.ts
├── dashboard.ts
├── disputes.ts
├── earning.ts
├── faqs.ts
├── guarantee.ts
├── incentives.ts
├── mission.ts
├── metrics.ts
├── notifications.ts
├── offers.ts
├── payments.ts
├── provider-service.ts
├── providers.ts
├── ranking.ts
├── referrals.ts
├── reviews.ts
├── safety.ts
├── search.ts
├── services.ts
├── subscriptions.ts
├── support.ts
├── upload.ts
├── users.ts
└── verification.ts
1. auth.ts
Caminho: LimpeJaApp/src/types/backend/auth.ts

Propósito: Define as interfaces para as operações de autenticação e registro de usuários, bem como enums fundamentais para papéis de usuário e status de verificação.

Interfaces/Enums Chave:

LoginDto: Dados para login de usuário (email, password).
CreateAddressDto: Estrutura de dados para criação de um endereço, incluindo coordenadas geográficas.
RegisterClientDto: Dados para registro de um novo cliente, incluindo informações pessoais, CPF e endereço.
RegisterProviderDto: Dados para registro de um novo provedor, com campos adicionais como data de nascimento, experiência e chave PIX.
UpdateProviderProfileDto: DTO para atualização parcial do perfil de um provedor.
AuthResponse: Resposta do backend após login/registro bem-sucedido, contendo o token de acesso e o perfil do usuário.
MessageResponseDto: Resposta genérica para mensagens de sucesso ou erro.
UserRole: Enum que define os papéis dos usuários no sistema (CLIENT, PROVIDER, ADMIN, SYSTEM).
VerificationStatus: Enum para o status do processo de verificação de provedores (e.g., PENDING_DOCUMENTS_UPLOAD, APPROVED).
Relacionamentos:

AuthResponse utiliza UserProfile (de users.ts).
RegisterClientDto e RegisterProviderDto utilizam CreateAddressDto.
2. bookings.ts
Caminho: LimpeJaApp/src/types/backend/bookings.ts

Propósito: Define as estruturas de dados para agendamentos de serviços, incluindo seus status, detalhes de endereço, DTOs para criação e atualização, e informações completas de um agendamento.

Interfaces/Enums Chave:

BookingStatus: Enum para os possíveis status de um agendamento (e.g., PENDING, CONFIRMED, COMPLETED).
BookingAddress: Representa o endereço de um agendamento, com CEP, rua, número, complemento, bairro, cidade, estado, latitude e longitude.
CreateBookingDto: DTO para criar um novo agendamento, incluindo providerId, serviceId, data/hora, preço, notas e endereço.
BookingDetails: Representa um agendamento completo com todos os detalhes do cliente, provedor, serviço, endereço e status de avaliação.
UpdateBookingStatusDto: DTO para atualizar o status de um agendamento.
AppliedCoupon: Tipo para o cupom aplicado a um agendamento, com código, tipo e valor.
BookingPricing: Detalhes de precificação de um agendamento, incluindo subtotal, desconto e total.
Relacionamentos:

CreateBookingDto utiliza CreateAddressDto (de auth.ts).
BookingDetails referencia ProviderDisplayInfo (de providers.ts) e Service (de services.ts).
3. chat.ts
Caminho: LimpeJaApp/src/types/backend/chat.ts

Propósito: Define as interfaces para as funcionalidades de chat, como detalhes da conversa, estrutura das mensagens e DTOs para envio e consulta de mensagens.

Interfaces/Enums Chave:

ChatDetails: Detalhes básicos de um chat, contendo o chatId.
Message: Representa uma mensagem individual em um chat, com remetente, destinatário, conteúdo e status de leitura.
SendMessageDto: DTO para enviar uma nova mensagem.
GetMessagesQuery: DTO para filtrar e paginar mensagens.
ChatSummary: Resumo de um chat para a lista de conversas, incluindo última mensagem e contagem de mensagens não lidas.
4. clients.ts
Caminho: LimpeJaApp/src/types/backend/clients.ts

Propósito: Define as interfaces específicas para o perfil de um cliente e DTOs para sua atualização.

Interfaces/Enums Chave:

Client: Representa o perfil completo de um cliente, incluindo dados pessoais, contagem de agendamentos, saldo da carteira e informações de endereço.
SearchResult: Representa um resultado de busca por provedores/serviços (embora search.ts tenha uma versão mais abrangente).
UpdateClientProfileDto: DTO para atualização parcial do perfil do cliente.
ClientDetails: Alias para a interface Client para consistência.
Relacionamentos:

Client utiliza UserRole (de auth.ts), BookingAddress (de bookings.ts) e UserProfile (de users.ts).
5. coupons.ts
Caminho: LimpeJaApp/src/types/backend/coupons.ts

Propósito: Define enums e interfaces para a gestão de cupons de desconto, incluindo seus tipos, status e alvos.

Interfaces/Enums Chave:

CouponType: Enum para o tipo de desconto do cupom (PERCENTAGE, FIXED_AMOUNT).
CouponStatus: Enum para o status do cupom (ACTIVE, EXPIRED, USED).
CouponTarget: Enum para o público-alvo do cupom (e.g., ALL, NEW_CLIENTS, MISSION_REWARD).
Coupon: Representa um cupom de desconto com seu código, valor, validade e status.
CouponApplicationResult: Resultado da aplicação de um cupom, incluindo o valor do desconto e o novo preço total.
6. dashboard.ts
Caminho: LimpeJaApp/src/types/backend/dashboard.ts

Propósito: Define a estrutura de dados para o painel de controle do provedor, agregando informações essenciais para a visão geral de suas atividades.

Interfaces/Enums Chave:

ProviderDashboard: Contém o nome completo do provedor, agendamentos futuros, ganhos totais, saques pendentes, avaliações, contagem de avaliações 5 estrelas e contagem de agendamentos mensais.
Relacionamentos:

ProviderDashboard utiliza BookingDetails (de bookings.ts) e ProviderReview (de providers.ts).
7. disputes.ts
Caminho: LimpeJaApp/types/backend/disputes.ts

Propósito: Define as interfaces para o sistema de disputas, permitindo reportar e gerenciar conflitos relacionados a agendamentos.

Interfaces/Enums Chave:

DisputeReason: Enum para os motivos de uma disputa (e.g., SERVICE_NOT_PERFORMED, QUALITY_ISSUES).
Dispute: Representa uma disputa com ID, agendamento associado, motivo, descrição, valor de reembolso proposto, status e datas.
ReportDisputeDto: DTO para reportar uma nova disputa.
DisputeResponse: Resposta do backend ao reportar uma disputa, contendo o objeto Dispute.
8. earning.ts
Caminho: LimpeJaApp/src/types/backend/earning.ts

Propósito: Define DTOs para a resposta da API de ganhos do provedor, incluindo um resumo financeiro e transações recentes.

Interfaces/Enums Chave:

EarningsResponseDto: Contém o total de ganhos, valor disponível para saque, e uma lista de transações recentes.
GetMyProviderEarnings: Alias para EarningsResponseDto para maior clareza.
Relacionamentos:

EarningsResponseDto utiliza ProviderTransaction (de providers.ts).
9. faqs.ts
Caminho: LimpeJaApp/src/types/backend/faqs.ts

Propósito: Define a interface para itens de Perguntas Frequentes (FAQs).

Interfaces/Enums Chave:

FAQItem: Representa uma pergunta e sua resposta, com metadados como palavras-chave e categoria.
10. guarantee.ts
Caminho: LimpeJaApp/src/types/backend/guarantee.ts

Propósito: Define as interfaces para o sistema de garantia, permitindo a submissão e o gerenciamento de reclamações.

Interfaces/Enums Chave:

ClaimStatus: Enum para o status de uma reclamação de garantia (e.g., PENDING, APPROVED, REJECTED).
SubmitClaimDto: DTO para submeter uma nova reclamação de garantia.
GuaranteeClaim: Representa uma reclamação de garantia completa, incluindo detalhes do agendamento, cliente, provedor e status.
11. incentives.ts
Caminho: LimpeJaApp/types/backend/incentives.ts

Propósito: Define os tipos para as mensagens de incentivo que podem ser exibidas aos usuários, como cupons de boas-vindas ou informações de indicação.

Interfaces/Enums Chave:

IncentiveKind: Enum para o tipo de incentivo (e.g., COUPON_WELCOME, REFERRAL, CASHBACK).
IncentiveBase: Propriedades comuns a todas as mensagens de incentivo (ID, tipo, título, prioridade).
CouponPayload: Detalhes específicos para incentivos de cupom.
ReferralPayload: Detalhes específicos para incentivos de indicação.
IncentiveMessage: A mensagem de incentivo completa, que pode incluir diferentes tipos de payload.
12. mission.ts
Caminho: LimpeJaApp/relax-app/types/backend/missions.ts (ou LimpeJaApp/types/backend/missions.ts se for a localização correta)

Propósito: Define as interfaces para o sistema de missões do usuário, incluindo a definição da missão, o progresso do usuário nela e as recompensas.

Interfaces/Enums Chave:

MissionStatus: Enum para o status do progresso de uma missão (ACTIVE, COMPLETED, CLAIMED).
RewardType: Enum para o tipo de recompensa (POINTS, COUPON).
Mission: Define a estrutura de uma missão (título, descrição, meta, tipo de recompensa).
MissionProgress: O progresso de um usuário em uma missão específica.
MissionItem: Combina a Mission e seu MissionProgress para exibição no frontend.
MissionCategory: Enum para categorizar missões (e.g., VOLUME, FREQUENCY).
ClientMission: Interface específica para missões visíveis ao cliente.
ClientReward: Interface para a recompensa de uma missão do cliente.
13. metrics.ts
Caminho: LimpeJaApp/app/types/backend/metrics.ts

Propósito: Define as interfaces para dados de métricas e análises, como resumos, séries temporais e funis de conversão.

Interfaces/Enums Chave:

MetricsSummary: Resumo de métricas (total de agendamentos, receita, avaliação média).
MetricsTimeseriesDataPoint: Ponto de dados para séries temporais de métricas (data, agendamentos, receita).
MetricsFunnelStep: Um passo dentro de um funil de conversão.
MetricsFunnel: A estrutura completa de um funil de conversão.
14. notifications.ts
Caminho: LimpeJaApp/src/types/backend/notifications.ts

Propósito: Define as interfaces para as notificações do usuário, incluindo sua estrutura e DTOs para gerenciamento de status de leitura.

Interfaces/Enums Chave:

NotificationEntity: Representa uma notificação individual com tipo, título, corpo, data de criação, status de leitura e URL de navegação.
MarkAsReadDto: DTO para marcar notificações como lidas.
15. offers.ts
Caminho: LimpeJaApp/src/types/backend/offers.ts

Propósito: Define as interfaces para ofertas promocionais, incluindo seus alvos e detalhes de exibição.

Interfaces/Enums Chave:

OfferTarget: Enum para o público-alvo de uma oferta (e.g., ALL, NEW_CLIENTS, SPECIFIC_SERVICE).
Offer: Representa uma oferta promocional com título, descrição, imagem, termos, detalhes de desconto e validade.
16. payments.ts
Caminho: LimpeJaApp/src/types/backend/payments.ts

Propósito: Define DTOs e interfaces de resposta para operações de pagamento, como criação de cobranças PIX e solicitações de saque.

Interfaces/Enums Chave:

CreatePixChargeDto: DTO para criar uma cobrança PIX.
PixChargeResponseDto: Resposta do backend após a criação de uma cobrança PIX, incluindo BR Code e imagem QR Code.
RequestWithdrawalDto: DTO para solicitar um saque de ganhos (para provedores).
TransactionEntity: Representa uma transação financeira genérica.
17. provider-service.ts
Caminho: LimpeJaApp/src/types/backend/provider-service.ts

Propósito: Define as interfaces para os serviços específicos oferecidos por um provedor, incluindo seus detalhes e tipos de precificação.

Interfaces/Enums Chave:

ProviderServiceDetails: Detalhes de um serviço específico oferecido por um provedor (preço, duração, tipo de precificação, serviço base).
ProviderServiceOffering: Alias para ProviderServiceDetails.
Relacionamentos:

Utiliza Service e PricingType (de services.ts).
18. providers.ts
Caminho: LimpeJaApp/src/types/backend/providers.ts

Propósito: Define interfaces abrangentes para provedores, cobrindo informações de exibição, disponibilidade, dados do painel, transações e parâmetros de busca. É um dos arquivos de tipagem mais centrais para o domínio de provedores.

Interfaces/Enums Chave:

ProviderMetrics: Métricas de performance de um provedor (taxa de aceitação, tempo médio de resposta).
TransactionType: Enum para os tipos de transação financeira de um provedor (e.g., PAYMENT, WITHDRAWAL, COMMISSION).
ProviderAvailability: Slots de tempo de disponibilidade de um provedor.
ProviderDisplayInfo: Informações essenciais de um provedor para exibição no frontend (nome, avatar, status de verificação, endereço, avaliação, etc.).
ProviderDetails: Alias para ProviderDisplayInfo.
ProviderWithCalculatedRating: Tipo auxiliar para o backend com campos calculados.
ProviderReview: Representa uma avaliação de um provedor, incluindo detalhes do cliente.
CreateProviderServiceData: DTO para criar um novo serviço oferecido por um provedor.
UpdateProviderServiceData: DTO para atualizar um serviço oferecido por um provedor.
UpdateAvailabilityData: DTO para adicionar ou atualizar a disponibilidade de um provedor.
GetProviderAvailabilityResponse: Resposta da API de disponibilidade do provedor.
UpdateProviderProfileData: DTO para atualizar o perfil do provedor.
ProviderDashboard: Dados para o painel de controle do provedor.
ProviderTransaction: Representa uma transação financeira de um provedor.
ProviderSearchQuery: Parâmetros de busca para provedores (serviço, localização, rating, etc.).
EarningsResponseDto: Resposta detalhada da API de ganhos do provedor.
Relacionamentos:

Importa de services.ts, bookings.ts, auth.ts, users.ts, provider-service.ts.
Muitas interfaces se referenciam mutuamente, formando um grafo complexo de dados.
19. ranking.ts
Caminho: LimpeJaApp/types/backend/ranking.ts

Propósito: Define os tipos para o sistema de ranking (leaderboard) de provedores.

Interfaces/Enums Chave:

LeaderboardPeriod: Períodos de tempo para o ranking (day, week, month).
RankingBadgeType: Tipos de selos que podem ser concedidos no ranking (e.g., TOP_NEIGHBORHOOD, STREAK_10).
LeaderboardEntry: Uma entrada individual no ranking, com pontuação, posição, variação e selos.
LeaderboardResponse: A resposta completa do ranking para um período, incluindo o top de provedores e a posição do usuário logado.
20. referrals.ts
Caminho: LimpeJaApp/types/backend/referrals.ts

Propósito: Define os tipos para o sistema de indicações (referrals).

Interfaces/Enums Chave:

ReferralStatus: Enum para o status de uma indicação (PENDING, COMPLETED, CANCELLED).
Referral: Representa uma indicação com IDs de usuários, código e status.
CreateReferralDto: DTO para criar uma nova indicação.
GetReferralsMadeByUserResponse: Resposta para a busca de indicações feitas por um usuário.
GetReferredUsersResponse: Resposta para a busca de usuários indicados por um usuário.
21. reviews.ts
Caminho: LimpeJaApp/src/types/backend/reviews.ts

Propósito: Define as interfaces para a submissão e representação de avaliações e feedbacks.

Interfaces/Enums Chave:

SubmitReviewDto: DTO para enviar uma avaliação/feedback, incluindo o ID do alvo, tipo, rating e comentário.
ReviewEntity: Representa uma entidade de avaliação conforme retornada pelo backend.
22. safety.ts
Caminho: LimpeJaApp/src/types/backend/safety.ts

Propósito: Define os tipos para funcionalidades de segurança, como alertas de pânico e relatórios de incidentes.

Interfaces/Enums Chave:

PanicType: Enum para o tipo de pânico (e.g., MEDICAL, THREAT).
IncidentType: Enum para o tipo de incidente (e.g., DAMAGE, THEFT).
IncidentStatus: Enum para o status de um incidente (PENDING_REVIEW, RESOLVED).
ReportPanicDto: DTO para reportar um evento de pânico.
MessageResponse: Resposta genérica de mensagem.
IncidentReportDto: DTO para relatar um incidente.
Incident: Representa um incidente completo.
PanicAlert: Representa um alerta de pânico.
PanicEvent: Evento de pânico em andamento.
IncidentReport: Relatório de incidente associado a um pânico.
23. search.ts
Caminho: LimpeJaApp/types/backend/search.ts

Propósito: Define os tipos para a funcionalidade de busca da aplicação, incluindo parâmetros de consulta, tipos de busca e a estrutura dos resultados.

Interfaces/Enums Chave:

SearchType: Enum para os tipos de busca disponíveis (e.g., PROVIDERS, SERVICES, ALL).
SortByOption: Enum para as opções de ordenação dos resultados da busca.
SearchQuery: Parâmetros de consulta para a busca (query, tipo, localização, data, limites, ordenação).
ProviderServiceSearchResult: Resultado de um serviço específico oferecido por um provedor.
SearchResult: Resposta completa da API de busca, com listas de providerServices, providers e services.
ProviderSearchItem: Item de busca de provedor com distância.
Relacionamentos:

Utiliza ProviderDetails (de providers.ts), ServiceDetails (de services.ts) e ProviderServiceDetails (de provider-service.ts).
24. services.ts
Caminho: LimpeJaApp/src/types/backend/services.ts

Propósito: Define os tipos de serviços que podem ser oferecidos na plataforma e seus modelos de precificação.

Interfaces/Enums Chave:

PricingType: Enum para o tipo de precificação do serviço (e.g., FIXED_PRICE, HOURLY, BY_SIZE).
Service: Representa um tipo de serviço (nome, ícone, cor de fundo, descrição, preço de referência).
ServiceDetails: Alias para Service.
25. subscriptions.ts
Caminho: LimpeJaApp/src/types/backend/subscriptions.ts

Propósito: Define os tipos para o sistema de assinaturas de serviços recorrentes.

Interfaces/Enums Chave:

SubscriptionStatus: Enum para o status de uma assinatura (e.g., ACTIVE, PAUSED, CANCELED).
SubscriptionFrequency: Enum para a frequência da assinatura (e.g., WEEKLY, MONTHLY).
CreateSubscriptionDto: DTO para criar uma nova assinatura.
UpdateSubscriptionDto: DTO para atualizar uma assinatura existente.
Subscription: Representa uma assinatura completa, incluindo detalhes do cliente, provedor, serviço, frequência e status.
RecurringBooking: Representa um agendamento gerado por uma assinatura.
26. support.ts
Caminho: LimpeJaApp/app/types/backend/support.ts

Propósito: Define os tipos para o sistema de tickets de suporte.

Interfaces/Enums Chave:

SupportTicket: Representa um ticket de suporte com assunto, status e mensagens.
SupportMessage: Uma mensagem individual dentro de um ticket de suporte.
CreateTicketPayload: DTO para criar um novo ticket.
AddMessagePayload: DTO para adicionar uma mensagem a um ticket existente.
27. upload.ts
Caminho: LimpeJaApp/app/types/backend/upload.ts

Propósito: Define a interface para a resposta esperada do backend após um upload de arquivo bem-sucedido.

Interfaces/Enums Chave:

UploadResponseDto: Contém a URL pública do arquivo carregado.
28. users.ts
Caminho: LimpeJaApp/src/types/backend/users.ts

Propósito: Define a interface UserProfile, que é uma representação abrangente do perfil de um usuário, agregando informações de diferentes domínios.

Interfaces/Enums Chave:

UserProfile: O perfil completo de um usuário, incluindo ID, email, papel, nome, telefone, avatar, endereço, saldo da carteira, contagens de agendamentos, ganhos, avaliação e detalhes específicos de cliente/provedor.
Relacionamentos:

Importa UserRole, VerificationStatus (de auth.ts), ProviderDisplayInfo (de providers.ts), Client (de clients.ts) e BookingAddress (de bookings.ts).
É uma interface central que integra dados de outras entidades.
29. verification.ts
Caminho: LimpeJaApp/app/types/backend/verification.ts

Propósito: Define DTOs e interfaces de resposta para o processo de verificação de provedores, incluindo submissão de CPF e upload de documentos.

Interfaces/Enums Chave:

SubmitCpfRequest: DTO para enviar o CPF para verificação.
DocumentPhotoType: Enum para o tipo de foto de documento (FRONT, BACK).
VerificationResponse: Resposta genérica para operações de verificação.
ProviderVerificationInfo: Informações de verificação de um provedor, incluindo status, URLs de documentos e resultados de OCR/liveness.
Relacionamentos:

Utiliza VerificationStatus (de auth.ts).
Considerações Adicionais (IProvider.ts)
Caminho: LimpeJaApp/types/IProvider.ts

Propósito: Este arquivo parece ser uma definição de tipo mais antiga ou específica para um componente legado. Não está localizado dentro do diretório backend e suas importações estão comentadas, sugerindo que pode não estar ativamente integrado com o restante do sistema de tipagem do backend. Para fins de documentação, é importante notar sua existência, mas sua relevância para o fluxo principal de dados do backend pode ser limitada.

Interfaces/Enums Chave:

IProviderDetails: Detalhes básicos de serviço de um provedor.
IProvider: Informações de um provedor, incluindo nome, email, rating e IProviderDetails.
Conclusão
O módulo types/backend é um componente crítico para o desenvolvimento e manutenção do aplicativo LimpeJá. Ao fornecer definições de tipo claras e centralizadas, ele garante a integridade dos dados, facilita a colaboração entre equipes de frontend e backend, e acelera o desenvolvimento ao reduzir a ocorrência de erros relacionados à estrutura dos dados. A organização por domínio (auth, bookings, providers, etc.) torna o módulo escalável e fácil de navegar, mesmo com a crescente complexidade do aplicativo.