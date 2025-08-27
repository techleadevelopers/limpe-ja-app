Documentação do Módulo de Contextos (LimpeJá App)

Esta documentação detalha os contextos globais utilizados no aplicativo LimpeJá, que gerenciam estados e funcionalidades compartilhadas entre diferentes componentes e módulos. Os contextos são implementados utilizando a Context API do React, fornecendo uma maneira eficiente de compartilhar dados sem a necessidade de passar props manualmente em cada nível da árvore de componentes.

Estrutura do Módulo contexts

Copiar
contexts/
├── AppContext.tsx
├── AuthContext.tsx
└── ProviderRegistrationContext.tsx
1. AuthContext.tsx
Caminho: LimpeJaApp/contexts/AuthContext.tsx

Propósito: O AuthContext é responsável por gerenciar todo o estado de autenticação do usuário na aplicação, incluindo login, logout, registro e o perfil do usuário logado. Ele centraliza a lógica de interação com os serviços de autenticação do backend e mantém o estado do usuário acessível globalmente.

Variáveis de Estado Chave:

user: Um objeto AuthenticatedUserProfile contendo os dados do perfil do usuário e o token de autenticação, ou null se não houver usuário logado.
isLoading: Um booleano que indica se alguma operação de autenticação (login, logout, registro, refresh) está em andamento.
isAuthenticated: Um booleano derivado que indica se um usuário está logado (true se user e user.token existirem).
role: O papel (UserRole) do usuário logado (e.g., 'client', 'provider'), ou null.
isRegistrationInProgress: Um booleano que sinaliza se um processo de registro de provedor está em andamento, especialmente para gerenciar fluxos de UI.
Funções/Métodos Chave:

login(credentials): Realiza a autenticação do usuário com email e senha, atualizando o estado do contexto com os dados do usuário e o token.
logout(): Desautentica o usuário, limpando o estado de autenticação e removendo o token.
register(userData, userType): Permite o registro de novos usuários (cliente ou provedor), logando o usuário automaticamente após o registro bem-sucedido.
refreshUser(): Recarrega os dados do perfil do usuário diretamente do backend, útil para manter as informações atualizadas.
signUpClient(data): Um método específico para o registro de clientes, que inclui o login automático após o registro.
signUpProvider(data): Um método específico para o registro de provedores, que também inclui o login automático e gerencia o estado isRegistrationInProgress.
setIsRegistrationInProgress(inProgress): Define o estado de progresso do registro.
setAuthData(authData): Define explicitamente os dados de autenticação no contexto, útil após uma resposta de autenticação.
updateUser(updatedUser?): Atualiza o perfil do usuário no contexto e no armazenamento local. Se updatedUser for fornecido, mescla os dados; caso contrário, chama refreshUser para buscar os dados mais recentes do backend.
Uso:

O contexto é consumido através do hook useAuth(), que deve ser utilizado dentro de um componente aninhado sob o AuthProvider.

typescript

Copiar
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  // ...
};
Dependências:

authService: Serviço para interações com a API de autenticação (login, registro, logout, carregamento/armazenamento de dados de autenticação).
userService: Serviço para interações com a API de usuários (obtenção do perfil do usuário).
axios: Utilizado para tratamento de erros específicos de requisições HTTP (e.g., status 401 para token expirado).
AsyncStorage: Utilizado internamente pelo authService para persistir os dados de autenticação entre as sessões.
2. AppContext.tsx
Caminho: LimpeJaApp/src/contexts/AppContext.tsx

Propósito: O AppContext é responsável por gerenciar configurações globais da aplicação que afetam a experiência do usuário, como o modo de tema (claro/escuro) e o status das notificações. Ele garante que essas configurações sejam persistidas e acessíveis em toda a aplicação.

Variáveis de Estado Chave:

settings: Um objeto AppSettings contendo as configurações atuais da aplicação (e.g., themeMode, notificationsEnabled).
isLoadingSettings: Um booleano que indica se as configurações estão sendo carregadas do armazenamento persistente.
Funções/Métodos Chave:

toggleTheme(): Alterna o themeMode entre 'light' e 'dark' e persiste a alteração.
updateSettings(newSettings): Atualiza parcial ou totalmente as configurações da aplicação com base em um objeto Partial<AppSettings> e persiste as alterações.
Uso:

O contexto é consumido através do hook useAppContext(), que deve ser utilizado dentro de um componente aninhado sob o AppProvider.

typescript

Copiar
import { useAppContext } from '../contexts/AppContext';

const ThemeToggle = () => {
  const { settings, toggleTheme } = useAppContext();
  // ...
};
Dependências:

@react-native-async-storage/async-storage: Utilizado para carregar e salvar as configurações da aplicação de forma persistente no dispositivo.
3. ProviderRegistrationContext.tsx
Caminho: LimpeJaApp/contexts/ProviderRegistrationContext.tsx

Propósito: O ProviderRegistrationContext é projetado para facilitar o fluxo de registro de provedores, que pode envolver múltiplas etapas ou telas. Ele armazena temporariamente os detalhes pessoais e de serviço de um provedor durante o processo de registro, permitindo que os dados sejam coletados progressivamente antes de serem submetidos ao backend.

Variáveis de Estado Chave:

personalDetails: Um objeto PersonalDetails contendo informações como email, senha, nome completo, CPF, data de nascimento, telefone e endereço, ou null.
serviceDetails: Um objeto ServiceDetails contendo informações sobre a experiência, serviços oferecidos, estrutura de preço, áreas de atendimento, anos de experiência, chave PIX e URLs/URIs de avatar, ou null.
isRegistrationInProgress: Um booleano que sinaliza se a submissão final do registro do provedor está em andamento.
Funções/Métodos Chave:

setPersonalDetails(details): Define os detalhes pessoais do provedor no estado do contexto.
setServiceDetails(details): Define os detalhes de serviço do provedor no estado do contexto.
submitRegistration(currentServiceDetails): Envia os dados completos (pessoais e de serviço) para o backend para finalizar o registro do provedor. Este método é crucial para a submissão final.
resetRegistration(): Limpa todos os dados de registro temporários do contexto, reiniciando o fluxo de registro.
setIsRegistrationInProgress(inProgress): Define o estado de progresso da submissão final.
Uso:

O contexto é consumido através do hook useProviderRegistration(), que deve ser utilizado dentro de um componente aninhado sob o ProviderRegistrationProvider.

typescript

Copiar
import { useProviderRegistration } from '../contexts/ProviderRegistrationContext';

const ProviderFormStep = () => {
  const { personalDetails, setPersonalDetails, submitRegistration } = useProviderRegistration();
  // ...
};
Dependências:

mockProviderService: Um mock de serviço que simula as chamadas à API para atualização de perfil de provedor. Em um ambiente de produção, isso seria substituído por um serviço de API real (providerService ou similar) que interage com o backend.
CreateAddressDto, RegisterProviderDto: Tipos importados de ../types/backend/auth para estruturar os dados de registro.