Documentação do Módulo admin-web - Plataforma LimpeJá
Este documento detalha a arquitetura, funcionalidades e tecnologias empregadas no módulo admin-web do monorepo LimpeJá. O admin-web é a interface administrativa da plataforma, essencial para o gerenciamento, monitoramento e operação de todos os aspectos do negócio, desde o cadastro de provedores até a análise financeira e gestão de usuários.

1. Visão Geral do Projeto
O admin-web é construído como uma Single Page Application (SPA) utilizando React e TypeScript, integrado com o TanStack Query para gerenciamento de estado assíncrono e Tailwind CSS para estilização. Ele se comunica com um backend (inferido como a "ponta" do servidor do monorepo) através de uma API RESTful, e as ações realizadas aqui impactam diretamente a experiência dos usuários e provedores na "ponta" do aplicativo móvel.

Estrutura do Monorepo (Inferida):

admin-web: Este módulo, o foco desta documentação.
server (Backend): Responsável pela lógica de negócio, persistência de dados e exposição de APIs para o admin-web e o aplicativo móvel.
mobile-app (Frontend Móvel): O aplicativo voltado para usuários e provedores, consumindo as mesmas APIs do backend.
2. Tecnologias Principais
React: Biblioteca JavaScript para construção de interfaces de usuário.
TypeScript: Superset de JavaScript que adiciona tipagem estática, melhorando a robustez e manutenibilidade do código.
Vite: Ferramenta de build rápida para desenvolvimento frontend.
TanStack Query (React Query): Biblioteca poderosa para gerenciamento de estado do servidor, caching, sincronização e atualização de dados assíncronos.
Tailwind CSS: Framework CSS utility-first para estilização rápida e responsiva.
Shadcn UI: Coleção de componentes de UI reutilizáveis, construídos com Radix UI e estilizados com Tailwind CSS, fornecendo uma base sólida e acessível para a interface.
Framer Motion: Biblioteca para animações fluidas e interativas.
Wouter: Pequena biblioteca de roteamento para React.
3. Configurações Globais e Utilitários
3.1. Definições de Tipos (types.ts)
Este arquivo é o coração da consistência de dados em todo o projeto. Ele define interfaces e enums que representam as estruturas de dados compartilhadas entre o frontend (admin-web, e presumivelmente o mobile-app) e o backend.

VerificationStatus: Enum para os diferentes estados de verificação de um provedor (PENDING_DOCUMENTS_UPLOAD, PENDING_MANUAL_REVIEW, APPROVED, REJECTED, BLOCKED).
ActivityType: Enum para os tipos de atividades registradas na plataforma (e.g., PROVIDER_REGISTRATION, BOOKING_COMPLETED).
Provider: Interface detalhada para provedores, incluindo informações de contato, status de verificação, dados de revisão, ganhos, e localização. Conexão com o App Móvel: Os dados de Provider são cruciais. Provedores APPROVED são visíveis e agendáveis no aplicativo móvel. Seu verificationStatus determina sua capacidade de operar na plataforma.
Activity: Interface para atividades recentes.
DashboardMetrics: Interface para as métricas gerais do dashboard.
AuthUser / AuthResponse: Tipos relacionados à autenticação do usuário.
A centralização desses tipos em types.ts garante que a comunicação entre o frontend e o backend seja fortemente tipada, reduzindo erros e facilitando a manutenção e evolução do sistema.

3.2. Cliente de API (api.ts)
Este arquivo encapsula toda a lógica de comunicação com o backend.

API_BASE_URL: Define a URL base da API. Atualmente configurado para um ambiente de desenvolvimento (https://limpeja-app-backend-35489557635.southamerica-east1.run.app), mas deve ser ajustado para ambientes de produção.
fetchApi<T>(path: string, options: RequestInit): Uma função genérica que padroniza as requisições HTTP.
Adiciona automaticamente o token de autenticação (authToken) do localStorage ao cabeçalho Authorization.
Define Content-Type: application/json por padrão.
Trata respostas de erro HTTP, lançando exceções com mensagens claras.
Conexão com o App Móvel: Embora este fetchApi seja específico para o admin-web, o backend que ele consome é o mesmo que serve o aplicativo móvel. Isso significa que as operações de CRUD (Create, Read, Update, Delete) realizadas através desta API afetam diretamente os dados exibidos e manipulados no aplicativo móvel. Por exemplo, a aprovação de um provedor aqui o torna disponível no app móvel.
Funções Específicas de API:
login, logout: Para autenticação.
fetchDashboardMetrics: Busca dados para o dashboard.
fetchProviders: Obtém a lista de provedores.
fetchVerificationQueue: Obtém provedores pendentes de verificação.
fetchProviderById: Busca detalhes de um provedor específico.
updateProviderStatus: Atualiza o status de verificação de um provedor (crucial para o fluxo de aprovação).
fetchRecentActivities: Busca atividades recentes.
3.3. Gerenciamento de Estado com TanStack Query (queryClient.ts)
O admin-web utiliza TanStack Query para gerenciar o estado do servidor de forma eficiente.

queryClient: Instância configurada do QueryClient.
defaultOptions.queries.queryFn: Define uma função de query padrão que utiliza fetchApi. Isso simplifica a definição de queries em componentes, pois a lógica de fetching e autenticação já está centralizada.
Benefícios: Caching automático, refetching em segundo plano, tratamento de erros, e sincronização de dados, resultando em uma experiência de usuário mais fluida e um código mais limpo.
3.4. Estilização (index.css, tailwind.config.ts)
Tailwind CSS: Utilizado para construir a interface com classes utilitárias, permitindo um desenvolvimento rápido e um design consistente.
index.css: Contém diretivas Tailwind, fontes e variáveis CSS customizadas para a paleta de cores da marca LimpeJá (--light-blue, --medium-blue, --admin-bg) e sombras personalizadas (--shadow-floating).
tailwind.config.ts: Configura o Tailwind para incluir os arquivos do projeto, estender o tema com cores e animações personalizadas, e integrar plugins.
3.5. Configuração do Vite (vite.config.ts)
Plugins: Configura plugins como react() e runtimeErrorOverlay().
Aliases: Define aliases de importação (@, @shared, @assets) para facilitar a organização do código.
Proxy: Configura um proxy de desenvolvimento para /api que redireciona as requisições para o backend (http://localhost:3000). Isso é essencial para o desenvolvimento local, evitando problemas de CORS.
4. Módulos e Páginas Principais
4.1. Autenticação
AuthContext.tsx: Implementa um contexto de autenticação React (AuthProvider, useAuth).
Gerencia o estado de autenticação (user, isAuthenticated, isLoading).
Persiste o token de autenticação (authToken) e dados do usuário (userData) no localStorage.
login(credentials): Chama apiLogin, armazena credenciais e redireciona para o dashboard.
logout(): Chama apiLogout, limpa credenciais e redireciona para a página de login.
Conexão com o App Móvel: O sistema de autenticação (login/logout) se comunica com o mesmo backend que autentica usuários e provedores no aplicativo móvel. A segurança e a gestão de sessões são compartilhadas.
login.tsx: A página de login.
Coleta credenciais (email, senha).
Utiliza o useAuth para chamar a função login.
Exibe mensagens de erro (usando useToast) em caso de falha.
Redireciona para o dashboard se o usuário já estiver autenticado.
App.tsx: O ponto de entrada principal da aplicação.
Configura o QueryClientProvider para o TanStack Query.
Envolve as rotas com AuthProvider para disponibilizar o contexto de autenticação globalmente.
PrivateRoute: Um componente de guarda de rota que verifica isAuthenticated e isLoading do useAuth. Redireciona usuários não autenticados para a página de login. Isso garante que apenas usuários logados acessem as páginas protegidas do admin.
4.2. Dashboard (dashboard.tsx)
A página principal que oferece uma visão geral do estado da plataforma.

MetricsCards.tsx: Exibe métricas chave como "Active Users", "Approved Providers", "Services Booked" e "Total Revenue".
Recebe os dados de métricas (DashboardMetrics) via props.
Conexão com o App Móvel: Estas métricas são agregadas a partir das atividades de usuários e provedores no aplicativo móvel. Por exemplo, "Approved Providers" reflete o número de provedores que passaram pelo processo de verificação (gerenciado no admin) e estão aptos a receber serviços no app móvel. "Services Booked" é o total de agendamentos realizados pelos usuários no app.
RevenueChart.tsx: Visualiza tendências de receita ao longo do tempo.
Atualmente usa sampleData, mas está configurado para buscar dados do backend (fetchDashboardMetrics).
Conexão com o App Móvel: A receita é gerada a partir dos agendamentos e pagamentos processados via o aplicativo móvel.
VerificationQueueWidget.tsx: Um widget que mostra os provedores mais recentes na fila de verificação.
Usa useQuery para buscar dados da fila (fetchVerificationQueue).
Conexão com o App Móvel: Provedores que se cadastram no aplicativo móvel entram nesta fila para revisão.
RecentActivities.tsx: Lista as atividades mais recentes na plataforma.
Usa useQuery para buscar dados de atividades (fetchRecentActivities).
Conexão com o App Móvel: As atividades (cadastro de provedores, agendamentos concluídos, pagamentos processados) são geradas pelas interações no aplicativo móvel.
4.3. Gestão de Provedores
providers.tsx: Página completa para listar e gerenciar todos os provedores.
Permite buscar provedores por nome/email.
Exibe detalhes como status de verificação, avaliações, agendamentos mensais e ganhos.
Utiliza useQuery para fetchProviders e useMutation para apiUpdateProviderStatus.
Conexão com o App Móvel: Esta página é o ponto central para gerenciar a base de provedores que oferecem serviços no aplicativo móvel. Ações como bloquear ou aprovar um provedor afetam diretamente sua visibilidade e capacidade de operar no app móvel.
verification-queue.tsx: Página dedicada à revisão de provedores pendentes.
Exibe provedores agrupados por status (documentos pendentes, revisão manual).
Utiliza useQuery para fetchVerificationQueue e useMutation para apiUpdateProviderStatus.
Conexão com o App Móvel: Este é o fluxo de trabalho crítico para on-board de novos provedores do aplicativo móvel. A aprovação aqui permite que o provedor comece a aceitar serviços.
verification-modal.tsx: Um modal detalhado para revisar as informações de um provedor.
Exibe fotos de documentos, resultados de OCR e verificação de vivacidade.
Permite Aprovar, Rejeitar (com motivo via RejectionModal) ou Bloquear um provedor.
Conexão com o App Móvel: A decisão tomada neste modal (aprovar/rejeitar/bloquear) define o status do provedor, que é refletido no aplicativo móvel, controlando se ele pode ou não prestar serviços.
rejection-modal.tsx: Modal para coletar o motivo da rejeição de um provedor.
provider-map.tsx: Visualiza a distribuição geográfica dos provedores.
Filtra provedores por termo de busca e status.
Exibe estatísticas de provedores (total, aprovados, pendentes).
Usa useQuery para buscar dados de provedores.
Conexão com o App Móvel: Embora o mapa seja uma ferramenta de análise para o admin, os dados de localização dos provedores são os mesmos usados pelo aplicativo móvel para mostrar provedores próximos aos usuários.
4.4. Gestão de Serviços (service-management.tsx)
Gerencia os serviços oferecidos pela plataforma (nome, descrição, preço, duração, categoria).
Permite adicionar, editar e excluir serviços e categorias.
Conexão com o App Móvel: Os serviços definidos e ativados nesta página são os que os usuários podem agendar no aplicativo móvel. As categorias organizam a oferta de serviços para os usuários.
4.5. Gestão de Usuários (user-management.tsx)
Lista e gerencia os usuários (clientes) da plataforma.
Exibe estatísticas de usuários (total, ativos, inativos, bloqueados).
Permite buscar usuários e filtrar por status.
Exibe detalhes do usuário (gastos, agendamentos concluídos, nível de fidelidade).
Conexão com o App Móvel: Esta página gerencia a base de clientes que utilizam o aplicativo móvel para agendar serviços. Ações como bloquear um usuário aqui impediriam seu acesso ao app móvel.
4.6. Análise Financeira (financial-analytics.tsx)
Exibe métricas financeiras detalhadas (receita total, comissão, pagamentos a provedores, margem de lucro).
Gráficos de tendências de receita e distribuição por categoria.
Lista de transações recentes.
Conexão com o App Móvel: Todos os dados financeiros são gerados a partir dos agendamentos e transações de pagamento que ocorrem através do aplicativo móvel. Esta página fornece a visão consolidada da saúde financeira da plataforma.
4.7. Outras Páginas (Placeholders)
Várias páginas estão estruturadas como placeholders, indicando futuras funcionalidades cruciais para a escalabilidade e completude da plataforma:

booking-management.tsx: Gestão de agendamentos. Conexão com o App Móvel: Agendamentos são o core do negócio, originados no app móvel.
client-management.tsx: Gerenciamento de clientes (pode ser consolidado com user-management).
coupon-management.tsx: Gestão de cupons de desconto. Conexão com o App Móvel: Cupons seriam aplicados por usuários no app móvel.
dispute-management.tsx: Gestão de disputas. Conexão com o App Móvel: Disputas surgiriam de interações entre usuários e provedores no app móvel.
faq-management.tsx: Gestão de perguntas frequentes. Conexão com o App Móvel: FAQs seriam exibidas no app móvel para suporte ao usuário.
guarantee-claims.tsx: Gerenciamento de reclamações de garantia. Conexão com o App Móvel: Reclamações de garantia seriam iniciadas por usuários no app móvel.
offer-management.tsx: Gestão de ofertas promocionais. Conexão com o App Móvel: Ofertas seriam exibidas e aplicadas no app móvel.
payment-management.tsx: Gestão de pagamentos. Conexão com o App Móvel: Detalhes de transações do app móvel.
pricing-rules.tsx: Regras de precificação. Conexão com o App Móvel: Regras impactariam os preços exibidos no app móvel.
referral-management.tsx: Gestão de indicações. Conexão com o App Móvel: Programa de indicação seria usado por usuários no app móvel.
safety-alerts.tsx: Alertas de segurança. Conexão com o App Móvel: Alertas poderiam ser gerados por usuários ou provedores em situações de emergência no app móvel.
subscription-management.tsx: Gestão de assinaturas. Conexão com o App Móvel: Planos de assinatura seriam oferecidos a usuários/provedores no app móvel.
user-data-export.tsx: Exportação de dados de usuário.
notifications.tsx: Página para exibir e gerenciar notificações do sistema.
settings.tsx: Configurações gerais da plataforma (nome, email, taxa de comissão, modo de manutenção, notificações, segurança, banco de dados, email).
4.8. Componentes de UI (components/ui/*)
O projeto utiliza uma vasta coleção de componentes de UI baseados em Shadcn UI (que por sua vez utiliza Radix UI). Estes componentes fornecem a base visual e funcional para a interface, garantindo acessibilidade, responsividade e consistência. Exemplos incluem Button, Card, Dialog, Input, Select, Tabs, Badge, Skeleton, entre outros. Eles são blocos de construção genéricos e reutilizáveis, essenciais para a velocidade de desenvolvimento e a qualidade da UI.

5. Escalabilidade e Considerações para Google Play
O design atual do admin-web já incorpora várias práticas que favorecem a escalabilidade e a integração com um ecossistema maior, como o de um aplicativo no Google Play:

Separação de Preocupações: O frontend (admin-web) é desacoplado do backend, comunicando-se via API. Isso permite que o backend seja escalado independentemente e sirva múltiplos clientes (web admin, mobile app).
Tipagem Forte com TypeScript: Reduz erros em tempo de execução, melhora a colaboração da equipe e facilita a refatoração, o que é crucial para um projeto em crescimento.
Gerenciamento de Estado do Servidor (TanStack Query): Otimiza o desempenho da UI, reduz a carga no backend através de caching e lida com a complexidade da sincronização de dados, resultando em uma experiência de usuário mais rápida e responsiva.
Componentização com Shadcn UI: Reutilização de componentes acelera o desenvolvimento, garante consistência visual e facilita a manutenção.
Modularidade: O código é organizado em módulos lógicos (páginas, componentes, hooks, utilitários), tornando-o mais fácil de entender, testar e expandir.
Integração com Backend Compartilhado: A utilização de um backend comum para o admin-web e o mobile-app (inferido) garante que as operações administrativas reflitam imediatamente no aplicativo móvel e vice-versa. Por exemplo:
Provedores Aprovados: Uma vez aprovados no admin-web, aparecem no mobile-app para agendamentos.
Serviços Configurados: Serviços criados e atualizados no admin-web são instantaneamente disponíveis para os usuários no mobile-app.
Alertas e Disputas: Eventos críticos do mobile-app (disputas, alertas de segurança) são centralizados no admin-web para ação rápida.
Preparação para Funcionalidades Futuras: A presença de páginas placeholder para gestão de agendamentos, cupons, disputas, etc., demonstra uma visão de longo prazo para as necessidades administrativas de uma plataforma em crescimento.
Experiência do Usuário (UX): O uso de Framer Motion para animações e Shadcn UI para componentes acessíveis contribui para uma UX profissional, importante para a eficiência dos operadores do admin.
Em suma, o módulo admin-web é uma ferramenta robusta e bem estruturada, projetada para suportar o crescimento da plataforma LimpeJá, garantindo que as operações de back-office sejam eficientes e que as interações com o aplicativo móvel sejam fluidas e sincronizadas. A clareza das tipagens, a modularidade do código e a escolha de bibliotecas modernas posicionam este painel administrativo para escalar junto com a plataforma na Google Play Store.

