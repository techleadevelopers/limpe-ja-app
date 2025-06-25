Documentação de Testes: Fluxo de Autenticação e Registro - LimpeJá (Frontend & Backend)
Data: 04 de Junho de 2025
Elaborado por: [Seu Nome/Função - Ex: Tech Lead]
Versão: 1.1

1. Objetivo
Validar a funcionalidade completa do fluxo de autenticação e registro do aplicativo "LimpeJá", garantindo que usuários possam se cadastrar e logar com sucesso, que os tokens de autenticação sejam gerenciados corretamente e que a experiência do usuário esteja alinhada com as expectativas de design e usabilidade.

2. Escopo do Teste
Em Escopo:

Fluxo de registro de Cliente (Etapas 1 e 2).
Fluxo de registro de Profissional (Introdução, Detalhes Pessoais, Detalhes de Serviço).
Fluxo de Login de usuário existente.
Funcionalidade de "Esqueci a Senha".
Geração e retorno de tokens JWT pelo Backend.
Tratamento inicial de erros no frontend para feedback ao usuário.
Navegação entre as telas do fluxo de autenticação.
Fora de Escopo (para esta fase):

Login social (Google, Facebook, Twitter) - Atualmente são apenas mocks.
Upload real de imagens para Firebase Storage (mockado no frontend).
Validações de segurança e vulnerabilidades (ex: injeção SQL, XSS, etc.).
Performance e testes de carga.
Integração real de termos e políticas de privacidade.
Implementação de serviços específicos para provedores (servicesOffered, priceStructure, serviceAreas) no backend.
3. Status Atual: Backend (API de Autenticação)
Componentes Analisados: src/auth/auth.service.ts, .env, src/auth/auth.module.ts, src/auth/auth.controller.ts, src/auth/dto/auth-response.dto.ts.

Conclusão:
O Backend da API de Autenticação está operando conforme o esperado no que diz respeito à geração de tokens JWT.

Geração de Token JWT: Testes confirmaram que o AuthService.login (e, consequentemente, as chamadas via registerClient e registerProvider) está gerando e retornando um accessToken válido, conforme evidenciado pela resposta do backend vista no console do cliente ("accessToken": "eyJhb....") e pelos console.log adicionados no AuthService.
Variáveis de Ambiente: A configuração do JWT_SECRET e JWT_EXPIRATION_TIME no arquivo .env e sua leitura via ConfigService no JwtModule estão funcionais.
Fluxo de Registro (Backend): A lógica de criação de usuários (Clientes e Provedores), hash de senha e tratamento de conflitos de e-mail/CPF está correta.
Problemas Anteriores Resolvidos/Confirmados: A causa raiz do erro [AsyncStorage] Passing null/undefined as value is not supported. não está no backend.

4. Status Atual: Frontend (Aplicação Mobile) - Problemas Conhecidos & Observações
Componentes Analisados: app/(auth)/login.tsx, app/(auth)/register-options.tsx, app/(auth)/client-register.tsx, app/(auth)/provider-register/index.tsx, app/(auth)/provider-register/personal-details.tsx, app/(auth)/provider-register/service-details.tsx, app/(auth)/_layout.tsx, README.md.

Problemas Críticos Identificados:

Manipulação de Token no Cliente: O erro [AsyncStorage] Passing null/undefined as value is not supported. Passed value: undefined Passed key: auth_token ocorre no lado do cliente. Apesar do backend enviar um accessToken válido, o código do aplicativo móvel está, em algum ponto, tentando armazenar um valor undefined para a chave auth_token no AsyncStorage.
Hipótese Principal: Isso sugere uma falha na forma como o accessToken está sendo extraído da resposta do backend (e.g., erro de digitação na propriedade, acesso incorreto ao objeto de resposta) ou uma atribuição incorreta a uma variável antes de passá-la ao AsyncStorage.setItem().
Duplicação de Código / Fluxo Incorreto para Profissional: O arquivo app/(auth)/provider-register/personal-details.tsx é uma cópia exata de app/(auth)/client-register.tsx.
Consequência: Atualmente, o fluxo de registro de profissional solicita informações de "cliente" na etapa de "Detalhes Pessoais" (incluindo campos de endereço e a lógica de 2 etapas do cliente), o que não é o esperado para o cadastro de um profissional (que deveria ter campos como CPF, data de nascimento, telefone, etc., e depois as informações de endereço).
Impacto: Isso pode levar a dados inconsistentes para provedores e uma experiência de usuário confusa.
Observações / Melhorias Futuras:

Caminho Absoluto do Logo: O caminho '/assets/images/logo.png' em client-register.tsx pode ser problemático em algumas configurações do Metro/Webpack. Idealmente, deveria ser relativo (../../assets/images/logo.png) ou usar um alias configurado.
Mocks: A presença de mockAuthService e mockFirebaseStorageApi indica que a integração real com o backend e serviços de armazenamento ainda precisa ser implementada.
Placeholders: Os botões de login social e os links para Termos/Políticas são placeholders e precisarão de implementação funcional.
Validações Frontend: As validações básicas de input estão presentes, mas a robustez (ex: formato de CEP, CPF, etc.) pode ser aprimorada.
5. Casos de Teste
5.1. Testes Já Verificados / Confirmados (Backend)
ID do Teste	Descrição do Cenário	Passos de Execução	Resultado Esperado	Status	Observações
BE-AUTH-001	Geração de accessToken após registro de cliente	Registrar novo cliente via /auth/register/client (via Postman/frontend)	Backend retorna AuthResponseDto com accessToken válido (string não vazia)	PASS	console.log no AuthService confirmou token válido. Resposta visível no cliente.
BE-AUTH-002	Geração de accessToken após registro de profissional	Registrar novo profissional via /auth/register/provider (via Postman/frontend)	Backend retorna AuthResponseDto com accessToken válido (string não vazia)	PASS	console.log no AuthService confirmou token válido. Resposta visível no cliente.
BE-AUTH-003	Geração de accessToken após login bem-sucedido	Realizar login via /auth/login (via Postman/frontend)	Backend retorna AuthResponseDto com accessToken válido (string não vazia)	PASS	console.log no AuthService confirmou token válido.

Exportar para as Planilhas
5.2. Casos de Teste a Serem Executados / Próximos Passos (Foco no Frontend)
Prioridade: ALTA - Correção Crítica

ID do Teste	Descrição do Cenário	Passos de Execução	Resultado Esperado	Observações/Prioridade
FE-AUTH-001	[CORREÇÃO CRÍTICA] Armazenamento do accessToken no AsyncStorage (Registro Cliente)	1. Registrar um novo cliente. &lt;br> 2. Após o sucesso da API, verificar o AsyncStorage.	auth_token deve ser armazenado como uma string válida no AsyncStorage. O erro Passing null/undefined NÃO deve ocorrer.	P0 - Crítico
FE-AUTH-002	[CORREÇÃO CRÍTICA] Armazenamento do accessToken no AsyncStorage (Registro Profissional)	1. Registrar um novo profissional (completo). &lt;br> 2. Após o sucesso da API, verificar o AsyncStorage.	auth_token deve ser armazenado como uma string válida no AsyncStorage. O erro Passing null/undefined NÃO deve ocorrer.	P0 - Crítico
FE-AUTH-003	[CORREÇÃO CRÍTICA] Armazenamento do accessToken no AsyncStorage (Login)	1. Realizar login com credenciais válidas. &lt;br> 2. Após o sucesso da API, verificar o AsyncStorage.	auth_token deve ser armazenado como uma string válida no AsyncStorage. O erro Passing null/undefined NÃO deve ocorrer.	P0 - Crítico

Exportar para as Planilhas
Prioridade: MÉDIA - Refinamento e Funcionalidade Principal

ID do Teste	Descrição do Cenário	Passos de Execução	Resultado Esperado
FE-REG-001	[FUNCIONAL] Registro de Cliente - Sucesso Completo	1. Navegar para register-options > client-register. &lt;br> 2. Preencher Etapa 1 e Etapa 2 com dados válidos e únicos. &lt;br> 3. Clicar em "Sign up".	Alerta de sucesso exibido. Usuário redirecionado para a tela de login. Novo usuário cliente visível no banco de dados.
FE-REG-002	[FUNCIONAL] Registro de Cliente - Email Existente	1. Tentar registrar um cliente com um email já cadastrado.	AnimatedErrorMessage exibe "Este email já está cadastrado." (ou similar do backend).
FE-REG-003	[FUNCIONAL] Registro de Cliente - Validação de Input	1. Tentar avançar/cadastrar com campos vazios/inválidos em ambas as etapas.	AnimatedErrorMessage exibida para cada campo inválido. Não avança/registra.
FE-REG-004	[FUNCIONAL] Fluxo de Registro de Profissional - Introdução	1. Navegar para register-options > provider-register/index. &lt;br> 2. Verificar conteúdo e animações da tela.	Vantagens e requisitos exibidos. Botão "Iniciar Cadastro" visível e navegável para personal-details. Botão "Voltar" funcional.
FE-REG-005	[FUNCIONAL] Fluxo de Registro de Profissional - Detalhes Pessoais (Após a correção da duplicação)	1. Navegar para provider-register/personal-details. &lt;br> 2. Preencher os campos específicos de profissional (CPF, data de nascimento, etc.). &lt;br> 3. Clicar em "Avançar".	Dados válidos aceitos. Navegação para service-details.
FE-REG-006	[FUNCIONAL] Fluxo de Registro de Profissional - Detalhes de Serviço	1. Preencher os dados da etapa service-details (experiência, serviços, etc.). &lt;br> 2. Testar seleção de avatar (via mock). &lt;br> 3. Clicar em "Finalizar Cadastro".	Alerta de sucesso exibido. Usuário redirecionado para a tela de login. Novo usuário profissional com dados corretos visível no banco de dados.
FE-AUTH-004	[FUNCIONAL] Login Bem-sucedido	1. Inserir credenciais válidas para cliente/profissional. &lt;br> 2. Clicar em "Login".	AuthResponseDto recebido e token armazenado. Usuário redirecionado para a tela Home/Dashboard apropriada (/(client)/explore ou /(provider)/dashboard).
FE-AUTH-005	[FUNCIONAL] Login Falha (Credenciais Inválidas)	1. Inserir credenciais inválidas. &lt;br> 2. Clicar em "Login".	AnimatedErrorMessage exibe "Credenciais inválidas" (ou similar do backend). Não redireciona.
FE-AUTH-006	[FUNCIONAL] Fluxo "Esqueci a Senha"	1. Navegar para forgot-password. &lt;br> 2. Inserir email (existente e não existente). &lt;br> 3. Clicar em "Redefinir Senha".	Mensagem de feedback exibida (ex: "Se um usuário com este email existir..."). Não redireciona.
FE-NAV-001	[UI/UX] Navegação entre as telas de autenticação	Testar todos os links e botões de navegação (Link, useRouter).	Navegação suave e correta para as telas esperadas. Animações de transição de tela se aplicáveis.
FE-UI-001	[UI/UX] Animações de entrada e botões	Observar as animações nas telas de Login, Register-Options, Client-Register, Provider-Register (index, personal-details, service-details).	Animações de fade-in, slide-up/in, escala de botões (press in/out) ocorrem conforme o esperado.
FE-UI-002	[UI/UX] Comportamento do teclado	Em campos de input, abrir o teclado e verificar se a tela se ajusta (usando KeyboardAvoidingView).	A tela deve se ajustar para que os inputs não sejam obscurecidos pelo teclado.

Exportar para as Planilhas
6. Ações Recomendadas / Próximos Passos
Resolver Erro AsyncStorage (Prioridade ALTA - Frontend):

Ação: Inspecionar o código do frontend que lida com a resposta do backend após login/registro. Verifique a atribuição da propriedade accessToken e certifique-se de que o valor passado para AsyncStorage.setItem('auth_token', ...) é a string do token e não undefined.
Ferramentas: Use console.log(response.data.accessToken) e console.log(accessTokenVariavel) imediatamente antes da chamada ao AsyncStorage.setItem() para depurar o valor.
Corrigir Duplicação do Fluxo de Registro de Profissional (Prioridade ALTA - Frontend):

Ação: Renomear ou refatorar app/(auth)/provider-register/personal-details.tsx. Ele deve ser um formulário dedicado à primeira etapa do cadastro de profissional, coletando dados como CPF, data de nascimento, talvez um breve "Sobre mim" ou "Anos de Experiência" (se ainda não estiver em service-details).
Sugestão: Crie um DTO e uma interface de estado específicos para os detalhes pessoais do profissional que serão coletados nesta tela, diferentes dos campos de cliente.
Integrar Mocks com Backend Real (Prioridade MÉDIA - Frontend):

Ação: Substituir as chamadas mockAuthService no frontend pelas chamadas reais para sua API NestJS (axios.post, fetch, etc.).
Ação: Integrar o upload de imagens do avatar para um serviço de armazenamento real (ex: Firebase Storage, Cloudinary, AWS S3), substituindo mockFirebaseStorageApi.
Implementar Funcionalidades de Placeholder (Prioridade MÉDIA - Frontend):

Ação: Desenvolver as telas e lógicas para login social (se aplicável, usando expo-auth-session ou bibliotecas específicas).
Ação: Criar as telas de "Termos para Profissionais" e "Política de Privacidade" e conectar os Links corretamente.
Refinar Validações Frontend (Prioridade MÉDIA - Frontend):

Ação: Implementar validações de formato mais robustas (ex: CEP com regex, CPF com algoritmo de validação) para dar feedback imediato ao usuário.
Otimizar Caminho do Logo (Prioridade BAIXA - Frontend):

Ação: Padronizar os caminhos das imagens para serem relativos ou configurar um alias de path no tsconfig.json e metro.config.js para assets/images.