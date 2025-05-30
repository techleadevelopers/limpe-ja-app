Documentação: Navegação com Expo Router
1. Introdução à Navegação com Expo Router
O Expo Router representa uma evolução significativa no gerenciamento de navegação para aplicações React Native e web, oferecendo uma abordagem unificada para o roteamento universal. Ao simplificar a complexidade inerente à navegação multiplataforma, esta biblioteca permite que os desenvolvedores construam aplicações que funcionam de forma consistente em Android, iOS e na web a partir de uma única base de código.   

A principal vantagem do Expo Router reside na sua capacidade de abstrair a complexidade do React Navigation subjacente através de um sistema de roteamento baseado em arquivos. Este paradigma, similar ao de frameworks web como Next.js, estabelece uma ligação direta entre a estrutura de arquivos do projeto e as URLs da aplicação. Isso não apenas acelera o desenvolvimento, mas também garante uma consistência de URL e comportamento em todas as plataformas, o que historicamente tem sido um desafio significativo em abordagens de roteamento mais tradicionais. A "universal deep-linking", por exemplo, é uma consequência direta dessa arquitetura: se o caminho do arquivo define a URL, então qualquer arquivo se torna acessível via URL, independentemente da plataforma, sem a necessidade de configuração adicional.   

Expo Router vs. React Navigation: Uma Breve Comparação
Embora o Expo Router seja uma solução de roteamento poderosa, é fundamental compreender sua relação com o React Navigation. O Expo Router é, na verdade, construído sobre o React Navigation, atuando como uma camada de otimização que traduz a estrutura de arquivos em componentes do React Navigation. Esta relação é de complementaridade estratégica, não de substituição.   

A diferença mais notável reside na configuração. O Expo Router oferece uma configuração mais fácil e automática, onde o roteamento acontece de forma implícita com base na organização dos arquivos. Por outro lado, o React Navigation exige uma configuração manual mais detalhada, proporcionando controle total e flexibilidade para estruturas de navegação altamente complexas.   

A escolha entre as duas soluções depende das necessidades do projeto. O Expo Router foca na simplicidade e na integração perfeita com o ecossistema Expo, sendo ideal para desenvolvimento rápido e aplicações universais. Para casos de uso muito específicos ou altamente personalizados, onde é necessário um controle granular sobre cada aspecto da navegação (como transições personalizadas ou lógicas de navegação intrincadas), o conhecimento do React Navigation subjacente ainda pode ser valioso. O fato de o Expo Router herdar a estabilidade e as opções do React Navigation significa que os desenvolvedores podem, se necessário, consultar a documentação do React Navigation para personalizações avançadas.   

2. Conceitos Fundamentais do Roteamento Baseado em Arquivos
O Expo Router adota um sistema de roteamento baseado em arquivos, onde a estrutura de diretórios do projeto define diretamente a árvore de navegação da aplicação. Este modelo simplifica a gestão de rotas e torna o processo de desenvolvimento mais intuitivo, especialmente para aqueles familiarizados com frameworks web como Next.js.   

A Estrutura do Diretório app
No coração do roteamento do Expo Router está o diretório app. Todas as telas e páginas da aplicação são definidas por arquivos e subdiretórios dentro deste diretório. Os subdiretórios, por sua vez, são utilizados para agrupar telas relacionadas, formando estruturas de navegação como pilhas (stacks), abas (tabs) ou outras configurações.   

Uma regra fundamental do Expo Router é a separação estrita entre componentes navegacionais e não-navegacionais. O diretório app é exclusivamente destinado à definição das rotas da aplicação. Componentes de UI, hooks, utilitários e outras lógicas de negócio devem ser colocados em outros diretórios de nível superior (por exemplo, components/, hooks/, utils/) para evitar que o Expo Router os interprete incorretamente como rotas. Esta imposição arquitetônica visa clareza e otimização. Se um componente que não é uma rota for colocado dentro do diretório app, o Expo Router tentará tratá-lo como tal, o que pode levar a rotas inesperadas ou falhas na aplicação. Além disso, essa separação auxilia nas otimizações de tree shaking e bundle splitting, permitindo que o bundler analise estaticamente o que é uma rota e o que não é, removendo código não utilizado de forma mais eficaz. Para projetos que preferem uma estrutura src/, o Expo Router também reconhece src/app como o diretório de rotas.   

Notação de Rotas: Estáticas, Dinâmicas e Grupos (``, ())
A notação de rotas no Expo Router é uma linguagem declarativa compacta que permite expressar padrões de navegação complexos diretamente na estrutura do sistema de arquivos. Isso reduz a necessidade de linguagens de domínio específico (DSLs) de roteamento complexas ou configurações de objeto extensas.   

Rotas Estáticas: Nomes de arquivos e diretórios regulares, sem qualquer notação especial, indicam rotas estáticas. A URL da rota corresponderá exatamente ao seu caminho no sistema de arquivos. Por exemplo, um arquivo app/about.tsx corresponderá à URL /about.   
**Rotas Dinâmicas ():** O uso de colchetes em um nome de arquivo ou diretório sinaliza uma rota dinâmica. Isso significa que o nome da rota inclui um parâmetro que pode ser utilizado ao renderizar a página. Por exemplo, um arquivo [userName].tsx corresponderá a URLs como /evanbacon ou /expo. O valor do parâmetro pode ser acessado dentro da página usando o hook useLocalSearchParams.   
Grupos de Rotas (()): Um diretório cujo nome é envolto em parênteses () indica um grupo de rotas. Estes diretórios são úteis para agrupar rotas relacionadas sem que o nome do diretório afete a URL final. Por exemplo, um arquivo app/(tabs)/settings.tsx terá a URL /settings, mesmo estando aninhado no diretório (tabs). Grupos de rotas são essenciais para organização e para definir relações complexas entre rotas, como em layouts de abas ou fluxos de autenticação.   
Arquivos Especiais: _layout.tsx, index.tsx e Rotas Especiais (+not-found.tsx)
O Expo Router emprega arquivos especiais para gerenciar a estrutura da navegação e a inicialização da aplicação, permitindo uma abordagem hierárquica e modular.

index.tsx: Similar à convenção web, um arquivo index.tsx dentro de um diretório indica a rota padrão para aquele diretório. Por exemplo, profile/index.tsx corresponderá à URL /profile. O arquivo app/(tabs)/index.tsx pode ser configurado para ser a rota inicial padrão de todo o aplicativo.   
_layout.tsx: Estes são arquivos especiais que não representam páginas por si só, mas definem como os grupos de rotas dentro de um diretório se relacionam entre si. É no _layout.tsx que se configura um navegador de pilha ou de abas para as rotas contidas naquele diretório. Os layouts são renderizados antes das rotas da página dentro de seu diretório. O arquivo app/_layout.tsx é o layout raiz da aplicação, sendo renderizado antes de qualquer outra rota. Ele substitui o antigo App.jsx/tsx como o local para código de inicialização global, como o carregamento de fontes ou a interação com a tela de splash.   
Rotas Especiais (+): Rotas que começam com um sinal de mais + possuem um significado especial para o Expo Router e são utilizadas para propósitos específicos. Exemplos incluem +not-found.tsx, que captura quaisquer requisições que não correspondam a uma rota existente na aplicação; +html.tsx, usado para personalizar o boilerplate HTML em aplicações web; e +native-intent.tsx, que lida com deep links que não correspondem a uma rota específica definida.   
Este sistema de arquivos especiais centraliza a configuração do navegador e a lógica de inicialização em locais previsíveis, melhorando a manutenibilidade e a clareza do fluxo da aplicação.   

Como o Expo Router se Baseia no React Navigation
Apesar da abordagem inovadora de roteamento baseado em arquivos, o Expo Router é construído sobre o React Navigation. Isso oferece uma ponte de compatibilidade e extensibilidade crucial. A biblioteca atua como uma otimização da interface de linha de comando (CLI) do Expo, traduzindo a estrutura de arquivos em componentes do React Navigation que, de outra forma, seriam definidos manualmente no código.   

Essa fundação significa que muitas das opções de configuração e estilos para navegadores de pilha e abas são as mesmas do React Navigation. Por exemplo, se um desenvolvedor precisar de uma transição personalizada ou de uma configuração de cabeçalho muito específica que não esteja exposta diretamente pelo Expo Router, ele pode recorrer à vasta documentação e aos recursos da comunidade do React Navigation. Isso garante que o Expo Router não seja uma "caixa preta", permitindo que os desenvolvedores alavanquem o ecossistema robusto do React Navigation para personalizações avançadas ou para resolver problemas que o Expo Router pode não cobrir diretamente.   

3. Navegação Básica: useRouter e Link
O Expo Router oferece duas abordagens principais para a navegação: imperativa, utilizando o hook useRouter, e declarativa, através do componente Link. Ambas as formas de navegação trabalham em conjunto com o conceito de URLs, que são inerentes a todas as páginas no Expo Router.   

Navegação Imperativa com o Hook useRouter
O hook useRouter fornece acesso a um conjunto de funções de navegação programáticas, permitindo que o desenvolvedor controle o fluxo da aplicação de forma dinâmica. A riqueza dos métodos useRouter oferece controle granular sobre o histórico de navegação, o que é essencial para criar fluxos de usuário complexos e otimizados.   

router.navigate(url): Esta é a função de navegação mais comum. Ela empurra uma nova página para a pilha de navegação ou retorna a uma rota existente na pilha, dependendo do contexto.   
router.push(url): Empurra explicitamente uma nova página para a pilha de navegação.   
router.back(): Navega de volta para a página anterior na pilha.   
router.replace(url): Remove a rota atual do histórico de navegação e a substitui pela nova URL especificada. Este método é particularmente útil para redirecionamentos, pois impede que o usuário retorne à página anterior (por exemplo, uma tela de login após a autenticação bem-sucedida).   
router.dismiss(count): Descarta a última tela na pilha mais próxima. Se a tela atual for a única rota na pilha, ela descartará a pilha inteira. Opcionalmente, pode-se passar um número positivo para descartar um número específico de telas. Este método é crucial para gerenciar o histórico de forma inteligente, permitindo saídas rápidas de fluxos específicos, como modais ou sequências de várias etapas.   
router.dismissTo(href): Descarta telas na pilha atual até que um Href específico seja alcançado. Se o Href não estiver no histórico, uma ação de push será realizada em vez disso.   
router.dismissAll(): Retorna à primeira tela na pilha mais próxima, similar à função popToTop do React Navigation, permitindo pular telas intermediárias.   
router.setParams(params): Atualiza os parâmetros de consulta da rota atual sem navegar para uma nova rota. Isso permite a modificação dinâmica de dados na URL, otimizando a reatividade da interface do usuário.   
A tabela a seguir resume os métodos de navegação imperativa fornecidos pelo hook useRouter:

Método	Descrição	Uso Comum / Exemplo
navigate(url)	Navega para a URL fornecida, empurrando uma nova página ou retornando a uma existente.	router.navigate('/profile')
push(url)	Empurra explicitamente uma nova página para a pilha de navegação.	router.push('/details/123')
back()	Retorna à página anterior na pilha.	router.back()
replace(url)	Substitui a rota atual no histórico pela nova URL.	router.replace('/home') (após login)
dismiss(count)	Descarta a última tela na pilha mais próxima (ou count telas).	router.dismiss(2) (fecha 2 telas)
dismissTo(href)	Descarta telas até um href específico ser alcançado.	router.dismissTo('/') (volta para a raiz)
dismissAll()	Retorna à primeira tela na pilha mais próxima.	router.dismissAll() (volta para o início da pilha)
setParams(params)	Atualiza os parâmetros de consulta da rota atual.	router.setParams({ category: 'new' })

Exportar para as Planilhas
Navegação Declarativa com o Componente Link
O componente Link é a forma padrão de criar links para páginas no Expo Router, funcionando de maneira análoga aos links em aplicações web. O prop href do componente Link aceita a mesma rota que seria utilizada com router.navigate.   

A combinação de Link com asChild e prefetch revela uma estratégia de otimização da experiência do usuário que prioriza a fluidez da navegação.

asChild: Por padrão, o componente Link pode envolver apenas componentes Text. No entanto, o prop asChild permite que Pressable ou outros componentes que suportam onPress e onClick sejam utilizados dentro de um Link, passando todas as props para o primeiro filho. Isso proporciona flexibilidade na construção da interface do usuário sem sacrificar a semântica de link.   
prefetch: Este prop no componente Link habilita o pré-carregamento da tela de destino quando o componente é renderizado. Isso permite uma navegação mais rápida, pois a tela é preparada antecipadamente, reduzindo a latência percebida e tornando a experiência do aplicativo mais responsiva.   
href (objeto): Além de uma string, o prop href também pode ser um objeto contendo pathname e params, o que é útil para rotas dinâmicas que exigem parâmetros específicos.   
A tabela a seguir detalha as principais propriedades do componente Link:

Propriedade	Tipo	Descrição	Exemplo de Uso
href	string ou object	O caminho da rota para navegar. Pode ser uma string completa (/about) ou um objeto com pathname e params para rotas dinâmicas.	<Link href="/home">Home</Link> <br> <Link href={{ pathname: "/user/[id]", params: { id: "123" } }}>Perfil</Link>
asChild	boolean	Se true, passa todas as props do Link para o primeiro filho, permitindo usar componentes como Pressable internamente. O filho deve aceitar onPress ou onClick.	<Link href="/other" asChild><Pressable><Text>Ir</Text></Pressable></Link>
prefetch	boolean	Habilita o pré-carregamento da tela de destino quando o componente é renderizado, para navegação mais rápida.	<Link href="/feed" prefetch>Feed</Link>
dangerouslySingular	SingularOptions	(Removido por padrão no v5, uso desaconselhado) Controla o comportamento de push em Stack, removendo duplicatas.	<Link href="/item/1" dangerouslySingular />
className	string	No nativo, usado com ferramentas CSS interop. Na web, define a classe HTML.	<Link href="/about" className="link-style">Sobre</Link>

Exportar para as Planilhas
4. Padrões de Navegação Comuns
O Expo Router, construído sobre o React Navigation, facilita a implementação de padrões de navegação comuns, como pilhas (Stacks) e abas (Tabs), e permite o aninhamento desses navegadores para criar estruturas complexas e intuitivas.

Navegador Stack (Stack)
O navegador Stack é a forma fundamental de navegar entre telas em uma aplicação. Ele funciona como uma pilha, onde cada nova rota é "empurrada" para o topo, e ao retornar, a rota é "removida" da pilha. Em Android, uma rota empilhada anima sobre a tela atual, enquanto em iOS, ela anima da direita.   

Configuração e Opções de Tela: O Stack navigator pode ser configurado estaticamente no arquivo _layout.tsx pai usando o componente <Stack.Screen name={routeName} /> para definir opções como título do cabeçalho, estilo e botões. As opções de cabeçalho podem ser personalizadas globalmente para a pilha ou dinamicamente para uma rota individual usando Stack.Screen dentro do arquivo da rota ou a função router.setParams().   
Comportamento de Push Personalizado: Por padrão, o Stack navigator remove telas duplicadas ao tentar empurrar uma rota que já está na pilha. Este comportamento pode ser alterado fornecendo uma função getId() personalizada para o componente <Stack.Screen>. Isso é útil para cenários onde se deseja sempre empurrar uma nova tela, mesmo que o ID da rota seja o mesmo (por exemplo, ao navegar para diferentes perfis de usuário, cada um deve ser uma nova entrada na pilha).   
Removendo Telas da Pilha: O Expo Router oferece métodos para gerenciar a pilha de navegação de forma flexível:
router.dismiss(count): Descarta a última tela na pilha mais próxima. Pode descartar várias telas se um count positivo for fornecido.   
router.dismissTo(href): Descarta telas na pilha atual até que um Href específico seja alcançado.   
router.dismissAll(): Retorna à primeira tela na pilha mais próxima, permitindo pular telas intermediárias.   
A flexibilidade na configuração do Stack (estática versus dinâmica, getId personalizado) permite que os desenvolvedores ajustem o comportamento da navegação para se alinhar precisamente com a intenção do usuário e o modelo de dados da aplicação. Isso é crucial para aplicativos com fluxos de dados complexos ou requisitos de experiência do usuário específicos, como perfis de usuário dinâmicos que sempre devem ser uma nova entrada na pilha.   

Navegador Tabs (Tabs)
O navegador Tabs é uma forma comum de organizar a navegação entre diferentes seções de uma aplicação, geralmente exibindo uma barra de abas na parte inferior da tela.   

Estrutura de Arquivos e Configuração: Para implementar um layout de abas, utiliza-se tipicamente um grupo de rotas (tabs) com um arquivo _layout.tsx interno. Este _layout.tsx define as abas usando o componente Tabs e Tabs.Screen para cada aba. O app/_layout.tsx raiz deve incluir uma Stack.Screen apontando para o diretório (tabs) com headerShown: false para evitar cabeçalhos duplicados.   
Ocultando Tabs e Rotas Dinâmicas em Tabs: É possível ocultar uma aba da barra de abas definindo href: null nas opções da Tabs.Screen correspondente. Isso é útil para rotas que fazem parte de um grupo de abas, mas que não devem ser diretamente acessíveis pela barra de abas (por exemplo, uma tela de detalhes que é acessada de dentro de uma aba, mas não é uma aba em si). Rotas dinâmicas também podem ser usadas em abas, mas é crucial que a rota dinâmica definida seja única para evitar conflitos. A capacidade de ocultar abas e usar rotas dinâmicas dentro delas demonstra a flexibilidade do Expo Router em criar interfaces de usuário complexas e contextuais, mantendo a simplicidade da estrutura de roteamento baseada em arquivos.   
Navegadores Aninhados (Stacks dentro de Tabs, Tabs dentro de Stacks)
A facilidade de aninhamento de navegadores no Expo Router é um mecanismo poderoso para construir hierarquias de navegação intuitivas e escaláveis que espelham a complexidade de aplicações do mundo real.

Stacks dentro de Tabs: Este é um padrão comum onde um Stack navigator é aninhado dentro de uma aba. Isso permite que uma aba específica tenha várias telas associadas, enquanto a barra de abas principal permanece visível. Por exemplo, no arquivo app/(tabs)/feed/_layout.tsx, pode-se retornar um componente Stack para a aba "feed". Isso permite que links como /feed/123 empurrem a rota feed/[postId] para a pilha, mantendo o navegador de abas visível. Isso é crucial para a experiência do usuário, pois o usuário não "perde" o contexto das abas ao navegar profundamente em uma delas.   
Tabs dentro de Stacks: Também é possível aninhar abas dentro de um Stack navigator externo. Este padrão é frequentemente útil para exibir modais sobre as abas existentes, proporcionando uma experiência de usuário fluida para fluxos secundários.   
Compartilhando Rotas entre Tabs
O Expo Router oferece uma solução elegante para evitar duplicação de código e manter a consistência da interface do usuário em diferentes fluxos de navegação: o compartilhamento de rotas entre abas usando grupos de rotas.

Grupos de rotas podem ser utilizados para permitir que uma única tela seja acessada a partir de duas abas diferentes. Por exemplo, se uma aplicação tem abas "Feed" e "Search", e ambas precisam acessar uma tela de perfil de usuário, pode-se criar uma estrutura como app/(tabs)/(feed,search)/users/[username].tsx. Isso permite que tanto a aba "Feed" quanto a aba "Search" naveguem para /users/evanbacon e exibam a mesma página de perfil de usuário. Este padrão otimiza o desenvolvimento e a manutenção, especialmente em aplicações maiores com componentes compartilhados, garantindo que a lógica e a interface do usuário para a tela de perfil de usuário sejam consistentes, independentemente de onde ela é acessada.   

5. Gerenciamento de URLs e Parâmetros
Um aspecto fundamental do Expo Router é sua abordagem integrada ao gerenciamento de URLs e parâmetros, o que facilita a implementação de deep linking e rotas dinâmicas.

Acessando Parâmetros de URL com useLocalSearchParams
O hook useLocalSearchParams() é uma ferramenta essencial para acessar os parâmetros de URL da rota que está contextualmente focada. Este hook retorna tanto os parâmetros de rota (aqueles definidos por colchetes, como [id] em users/[id].tsx) quanto os parâmetros de busca (query parameters, como ?name=value).   

useLocalSearchParams oferece uma abordagem declarativa e reativa para acessar dados da URL, integrando-se perfeitamente com o ciclo de vida do React. A distinção entre parâmetros de rota e de busca, ambos acessíveis pelo mesmo hook, simplifica a recuperação de dados em rotas dinâmicas e deep links. Isso significa que a tela pode reagir a mudanças nos parâmetros da URL, o que é vital para rotas dinâmicas onde o conteúdo da tela depende diretamente dos dados passados na URL.   

Deep Linking Universal e URLs Amigáveis
Uma das características mais poderosas do Expo Router é o suporte nativo a deep linking universal. Todas as páginas na aplicação têm uma URL que corresponde à localização do arquivo no diretório app. Essa abordagem simplifica drasticamente a implementação de deep linking, pois elimina a necessidade de configurar esquemas de URL e mapeamentos complexos que são comuns em outras soluções de navegação.   

Isso permite que os usuários vinculem a qualquer página específica da aplicação a partir de fontes externas (como um navegador web, um e-mail ou uma notificação push), da mesma forma que fariam dentro do próprio aplicativo. A natureza "universal" do deep linking no Expo Router representa uma transformação fundamental na forma como os aplicativos móveis interagem com o ecossistema da web. Ao tratar URLs como cidadãos de primeira classe em todas as plataformas, o Expo Router não apenas simplifica a implementação, mas também abre portas para otimizações de SEO e descoberta de conteúdo que eram tradicionalmente exclusivas da web, permitindo que o conteúdo do aplicativo seja indexado por mecanismos de busca.   

6. Redirecionamentos e Autenticação
O Expo Router oferece mecanismos robustos para gerenciar redirecionamentos e implementar fluxos de autenticação, garantindo que os usuários acessem apenas as rotas apropriadas com base em seu status.

Redirecionamento Programático com o Componente Redirect
O componente <Redirect />, importado de expo-router, é uma ferramenta declarativa poderosa para implementar a lógica de controle de acesso e fluxo de usuário. Quando uma página que contém este componente é visitada, o usuário é automaticamente redirecionado para a rota especificada pelo prop href.   

Este componente pode ser utilizado dentro de lógica condicional, o que o torna ideal para cenários de autenticação. Por exemplo, se um usuário não estiver autenticado, o componente Redirect pode ser renderizado para direcioná-lo para a tela de login. Isso garante que a lógica de autenticação seja diretamente acoplada à estrutura de roteamento, assegurando que usuários não autorizados sejam sempre direcionados para a rota correta.   

Redirecionamentos Estáticos e Dinâmicos via app.json
A inclusão de redirecionamentos e rewrites estáticos no arquivo app.json representa uma abordagem de "infraestrutura como código" para o roteamento. Isso permite que regras de roteamento complexas sejam definidas no nível de configuração da aplicação, antes mesmo do carregamento do JavaScript, o que é particularmente útil para SEO, migrações de URL e manipulação de URLs legadas.   

Redirecionamentos Estáticos: São configurados no app.json usando o plugin expo-router e são ideais para rotas que podem não existir mais na estrutura de arquivos da aplicação.   
As propriedades obrigatórias incluem source (o padrão do caminho da requisição de entrada) e destination (o caminho para o qual se deseja rotear).   
Uma propriedade opcional é permanent (booleano): se true, utiliza o código de status HTTP 308 (redirecionamento permanente, cacheado por clientes/motores de busca); se false, utiliza o código 307 (redirecionamento temporário, não cacheado).   
Não é necessário adicionar o sufixo /index para rotas de diretório ou +api para rotas de API. Contudo, não é possível criar redirecionamentos para arquivos _layout.   
Rotas Dinâmicas: Tanto as rotas source quanto destination podem utilizar a sintaxe de rota dinâmica ([slug]). Variáveis não correspondidas na source serão passadas como parâmetros de consulta para a destination.   
Métodos HTTP: É possível especificar que um redirecionamento se aplique apenas a determinados métodos HTTP (por exemplo, methods:). As telas da aplicação são consideradas requisições GET.   
Rewrites: Diferentemente dos redirecionamentos, os rewrites atuam como um proxy de URL, renderizando o destino sem alterar a URL exibida no navegador. Eles são configurados apenas estaticamente via app.json e não retornam um código de status HTTP.   
A tabela a seguir detalha as propriedades de configuração de redirecionamento estático em app.json:

Propriedade	Tipo	Descrição	Exemplo
source	string	O padrão do caminho da requisição de entrada. Pode incluir rotas dinâmicas.	"/antigo/[id]"
destination	string	O caminho para o qual a requisição será roteada. Pode incluir rotas dinâmicas.	"/novo/[id]"
permanent	boolean (opcional)	Se true, usa status 308 (cache permanente); se false, usa 307 (temporário). Padrão é false.	true
methods	string (opcional)	Array de métodos HTTP para os quais o redirecionamento se aplica (ex: ``).	``

Exportar para as Planilhas
Implementando Rotas Protegidas e Fluxos de Autenticação
O Expo Router permite o uso de lógica em tempo de execução para redirecionar usuários de telas específicas com base em seu status de autenticação.   

Uso de React Context e Grupos de Rotas: Uma técnica comum envolve a utilização de um provedor de contexto de autenticação global (React Context Provider) para gerenciar o estado de autenticação do usuário. Um arquivo _layout.tsx aninhado, como app/(app)/_layout.tsx, pode ser usado para verificar o status de autenticação. Se o usuário não estiver autenticado (!isAuthenticated), este layout pode renderizar um componente <Redirect href="/login" />, direcionando o usuário para a tela de login.   
Componente Stack.Protected (SDK 53+): Com o SDK 53 e versões posteriores, o Expo Router introduziu o componente Stack.Protected. Este componente permite tornar telas inacessíveis à navegação do lado do cliente. Se um usuário tentar acessar uma tela protegida (ou se uma tela se tornar protegida enquanto estiver ativa), ele será automaticamente redirecionado para a rota âncora (geralmente a tela index) ou para a primeira tela disponível na pilha. A propriedade guard (um booleano) determina se a rota está protegida. Se o valor de guard de uma tela mudar de true para false, todas as suas entradas de histórico são removidas da navegação. A evolução das estratégias de autenticação no Expo Router, desde redirecionamentos baseados em contexto até o componente Stack.Protected, demonstra um compromisso crescente em fornecer primitivos de segurança mais robustos e integrados diretamente ao sistema de roteamento. Isso simplifica a implementação de "route guarding" e melhora a experiência do desenvolvedor.   
Modais para Autenticação: Outro padrão eficaz é apresentar a tela de login como um modal sobre o aplicativo principal. Esta abordagem permite que o modal seja descartado após a autenticação bem-sucedida, preservando deep links e o estado da navegação subjacente.   
Considerações de Renderização Estática: É importante notar que as telas protegidas são avaliadas apenas no lado do cliente. Durante a geração de site estático, nenhum arquivo HTML é criado para rotas protegidas. Além disso, as telas protegidas não substituem a autenticação ou o controle de acesso no lado do servidor. Embora o roteamento do cliente possa impedir o acesso visual, ele não impede o acesso direto a recursos se a segurança do backend for falha.   
7. Otimização de Performance e Boas Práticas
A otimização do desempenho é crucial para a experiência do usuário em qualquer aplicação. O Expo Router, juntamente com as ferramentas do Expo, oferece diversas práticas e recursos para garantir que as aplicações sejam rápidas e responsivas.

Estrutura de Projeto e Separação de Preocupações (app vs. components, utils)
A aderência a uma estrutura de projeto modular e a separação de preocupações é uma prática fundamental que impacta diretamente a escalabilidade, manutenibilidade e otimização de performance em projetos Expo Router de grande escala.

O diretório app/ deve conter exclusivamente arquivos de rota, que são as telas renderizadas em resposta a uma URL específica. Em contraste, componentes de interface do usuário (UI), hooks personalizados, lógica de negócios, constantes e utilitários devem ser colocados em diretórios separados, como components/, hooks/, utils/ ou services/. Esta separação não apenas garante a clareza do código e facilita os testes, mas também evita que componentes sejam erroneamente tratados como rotas pelo Expo Router, o que poderia levar a comportamentos inesperados. Além disso, essa organização facilita otimizações como o tree shaking e o bundle splitting, pois o bundler pode analisar com mais eficácia quais partes do código são usadas e quais podem ser descartadas.   

Otimizações de Carregamento e Bundling (Lazy Loading, Fast Refresh, Bundle Splitting)
As otimizações de carregamento e bundling do Expo Router representam uma estratégia abrangente para otimizar tanto o desempenho percebido quanto o desempenho real da aplicação, o que é crucial para a retenção de usuários, especialmente em mercados com conectividade de rede variável ou dispositivos de baixo custo.

Lazy Loading de Rotas: Em produção, as rotas são carregadas dinamicamente, ou seja, apenas quando são realmente necessárias. Isso contribui para a redução do tamanho inicial do bundle da aplicação e melhora significativamente o tempo de inicialização.   
Fast Refresh: Durante o desenvolvimento, o recurso Fast Refresh acelera drasticamente a iteração de código em todas as plataformas (Android, iOS e web), proporcionando uma experiência de desenvolvimento mais ágil.   
Automatic Bundle Splitting: O Metro bundler, que é parte integrante do Expo, suporta a divisão automática de bundles. Isso significa que o código da aplicação é dividido em partes menores e mais gerenciáveis, que podem ser carregadas sob demanda, otimizando ainda mais o desempenho.   
Prefetching: O prop prefetch no componente <Link /> permite o pré-carregamento da tela de destino antes mesmo que o usuário clique no link. Esta técnica de otimização proativa melhora a performance da transição de página, fazendo com que a navegação pareça instantânea e a experiência do usuário seja mais fluida e responsiva.   
Uso de TypeScript e Recursos Estáticos do JavaScript
A ênfase no uso de TypeScript e nas características estáticas do JavaScript (ESM) não é apenas uma questão de "código moderno", mas uma prática que habilita otimizações de build e garante a robustez da aplicação em escala.

TypeScript: É altamente recomendado o uso de TypeScript para melhor legibilidade, compreensão do código e prevenção de erros em tempo de compilação. O TypeScript fornece informações estáticas cruciais que as ferramentas de build do Expo podem usar para realizar análises mais eficazes.   
Recursos Estáticos do JavaScript: É aconselhável evitar o uso de var em favor de const e let, e utilizar a sintaxe import/export (ESM) em vez de require/module.exports (CommonJS). A razão para isso é que a sintaxe ESM pode ser analisada estaticamente pelo Expo CLI para otimizações como tree shaking, que remove código não utilizado do bundle final. O uso de require/module.exports é dinâmico e impede essa análise, cancelando a otimização.   
Evitar "Barrel Imports": Arquivos que re-exportam outros módulos (barrel imports) devem ser evitados, pois podem dificultar o tree shaking e levar a falhas de otimização, especialmente se os módulos re-exportados utilizarem código CommonJS.   
Seguir essas diretrizes de codificação tem um impacto direto no tamanho final do bundle e, consequentemente, no desempenho da aplicação, tornando-a mais eficiente e menos propensa a erros em tempo de execução.

8. Novidades e Melhorias no Expo Router v5
O Expo Router v5 representa um marco significativo na evolução da biblioteca, introduzindo capacidades full-stack e aprimoramentos substanciais em desempenho e depuração, solidificando sua posição como uma ferramenta poderosa para construir aplicações universais.

Capacidades Full-Stack: React Server Components e API Routes
A introdução de React Server Components (RSC) e API Routes no Expo Router v5 é um movimento estratégico para transformar o Expo em uma plataforma de desenvolvimento full-stack completa, borrando as linhas entre frontend e backend.   

React Server Functions/Components (Beta): O v5 permite a criação de React Server Functions, que são endpoints de servidor tipados com acesso a variáveis de ambiente secretas. Isso simplifica drasticamente a autenticação e permite a construção de interfaces de usuário orientadas a servidor (server-driven UI). Essas funções server-only podem ser chamadas diretamente do código cliente, mantendo dados sensíveis seguros e reduzindo a quantidade de JavaScript enviada para os usuários. A execução de funções no servidor é crucial tanto para a segurança (protegendo variáveis de ambiente secretas) quanto para o desempenho (reduzindo o JavaScript no cliente).   
API Routes em Produção: Com o v5, os desenvolvedores podem criar API Routes adicionando arquivos com o sufixo +api.ts ao diretório app/. Esses endpoints de API podem ser executados em produção via EAS Hosting, permitindo o tratamento seguro de lógica server-side, como submissões de formulários ou consultas a bancos de dados, sem a necessidade de configurar um backend separado.   
Este paradigma full-stack simplifica a arquitetura de aplicações complexas, especialmente aquelas com lógica de negócios sensível ou intensiva em dados, e abre caminho para otimizações de desempenho significativas através da renderização no servidor e da redução do JavaScript no cliente.

Melhorias de Performance (Prefetching, Bundling mais Rápido)
O Expo Router v5 demonstra um foco contínuo na otimização da experiência do usuário e do desenvolvedor por meio de várias melhorias de desempenho.

Prefetching Aprimorado: O novo prop prefetch no componente <Link /> permite o carregamento antecipado de uma rota, melhorando a fluidez e o desempenho da transição de página. Isso significa que os recursos da próxima tela são carregados em segundo plano antes mesmo do clique do usuário, resultando em uma experiência de navegação mais rápida e responsiva.   
Bundling mais Rápido: O processo de bundling agora inicia aproximadamente 4 vezes mais rápido com uma nova arquitetura de "lazy crawling" no Metro bundler. Essa melhoria é particularmente benéfica para monorepos e projetos com diretórios ios/android gerados, onde o bundling não sofre mais desacelerações.   
Melhorias em Tree Shaking: Foram implementadas melhorias e correções de bugs no Tree Shaking do Expo, resultando em bundles finais menores e mais eficientes.   
Preparação para React Compiler: O Expo Router v5 prepara o projeto para o React Compiler, uma ferramenta que pode melhorar drasticamente o desempenho da aplicação ao automaticamente memorizar componentes. Isso é de grande importância para o Expo Router, pois as transições de tela se tornarão notavelmente mais performáticas, reduzindo a necessidade de memoização manual e otimizando a renderização.   
Essas otimizações, que abrangem desde o tempo de build até a fluidez da interface do usuário em tempo de execução, são um sinal de uma plataforma robusta e em evolução, focada em entregar a melhor experiência possível.

Melhorias em Erros e Logging
As melhorias na depuração e no logging representam um investimento direto na produtividade do desenvolvedor e na redução do tempo de depuração. Erros claros e stack traces úteis são cruciais para a experiência do desenvolvedor, especialmente em ambientes universais onde a complexidade pode ser maior.

Redesenho do Logging de Erros: O log de erros padrão do React Native no Expo CLI foi completamente redesenhado. Agora, os stack traces são mais legíveis, sem URLs longas, e o frame mais útil exibe uma prévia do código. A tag `` também foi removida para maior clareza.   
Suporte a Owner Stack do React 19.1: O Expo Router v5 suporta o novo sistema "owner stack" do React 19.1, que mostra mais frames próximos ao erro original. Isso facilita a localização da causa raiz de problemas do React, como texto não encapsulado ou componentes indefinidos, tornando a depuração de problemas de renderização e estado mais eficiente.   
Essas melhorias demonstram que o Expo está atento aos "pontos de dor" dos desenvolvedores, fornecendo ferramentas mais eficazes para identificar e resolver problemas rapidamente.

9. Conclusões
O Expo Router emerge como uma solução de navegação altamente eficaz e estratégica para o desenvolvimento de aplicações universais em React Native e web. Sua fundação no roteamento baseado em arquivos, uma convenção inspirada em frameworks web, simplifica drasticamente a configuração e o gerenciamento de rotas, traduzindo a estrutura do sistema de arquivos diretamente em URLs navegáveis. Essa abordagem não apenas acelera o desenvolvimento, mas também garante a consistência de URL e comportamento em todas as plataformas, um desafio complexo em abordagens de roteamento mais tradicionais.

A relação do Expo Router com o React Navigation é de otimização e complementaridade. Ao construir sobre a robusta base do React Navigation, o Expo Router oferece uma experiência de desenvolvedor simplificada, ao mesmo tempo em que permite o acesso a funcionalidades avançadas do React Navigation para personalizações específicas. A notação de rotas (`` para dinâmicas, () para grupos) e o uso de arquivos especiais (_layout.tsx, index.tsx, +not-found.tsx) proporcionam uma linguagem declarativa compacta para expressar padrões de navegação complexos de forma intuitiva e modular.

As ferramentas de navegação, como o hook useRouter para controle imperativo e o componente Link para navegação declarativa, oferecem flexibilidade e controle granular sobre o fluxo da aplicação e o histórico de navegação. Recursos como prefetch no Link e as otimizações de lazy loading e bundle splitting demonstram um compromisso contínuo com a performance, crucial para a experiência do usuário.

Com a introdução do Expo Router v5, a plataforma avança significativamente em direção a capacidades full-stack, com a integração de React Server Components e API Routes. Isso permite que os desenvolvedores construam aplicações mais complexas e seguras, com lógica de servidor coexistindo diretamente com a lógica de frontend, simplificando a arquitetura e a implantação. As melhorias em erros e logging no v5 também são um testemunho do investimento na produtividade do desenvolvedor, tornando a depuração mais eficiente.

Em suma, o Expo Router é uma escolha altamente recomendada para desenvolvedores que buscam construir aplicações React Native e web de forma eficiente, com foco em universalidade, desempenho e uma experiência de desenvolvimento simplificada. Sua evolução contínua, especialmente com as capacidades full-stack do v5, posiciona-o como uma ferramenta central no ecossistema Expo para o desenvolvimento de aplicações modernas e escaláveis.