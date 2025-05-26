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