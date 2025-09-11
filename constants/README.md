Documentação do Módulo constants (LimpeJá App)

Este módulo constants centraliza valores e configurações imutáveis ou de uso frequente em todo o aplicativo LimpeJá. A utilização de constantes promove a consistência, a manutenibilidade e a legibilidade do código, evitando "magic strings" ou valores duplicados espalhados pela base de código.

Estrutura do Módulo constants

Copiar
constants/
├── appStyles.ts
├── Colors.ts
├── icons3d.ts
├── queryKeys.ts
├── routes.ts
├── strings.ts
├── styles.ts
└── theme.ts
1. appStyles.ts
Caminho: LimpeJaApp/src/constants/appStyles.ts

Propósito: Define um conjunto de tokens de design e estilos globais que podem ser utilizados em toda a aplicação, complementando o sistema de temas definido em theme.ts. Inclui cores genéricas, durações de animação, offsets, sombras e tipografia.

Conteúdo Principal:

AppColors: Um conjunto de cores fundamentais para a aplicação, que podem ser usadas independentemente do tema claro/escuro, ou como base para elas.
AppDurations: Constantes para durações de animação (e.g., xs, sm, md, lg, xl).
AppOffsets: Valores para offsets de animação, escalas de pressão e passos de stagger (escalonamento).
AppShadows: Estilos de sombra predefinidos (small, medium) que podem ser aplicados a componentes.
AppTypography: Estilos de texto comuns (title, subtitle, body, buttonText) com tamanhos de fonte, pesos e cores predefinidos.
SCREEN_WIDTH, SCREEN_HEIGHT: Largura e altura da tela do dispositivo, obtidas via Dimensions.
Uso: Importado e utilizado diretamente em componentes ou outros arquivos de estilo para aplicar valores consistentes de design.

2. Colors.ts
Caminho: LimpeJaApp/src/constants/Colors.ts

Propósito: Define a paleta de cores completa da aplicação, organizada por temas (claro e escuro). É a fonte primária de todas as definições de cores usadas no aplicativo, garantindo consistência visual e facilitando a troca de temas.

Conteúdo Principal:

Define tintColorLight e tintColorDark.
Exporta um objeto padrão contendo:
light: Um objeto com todas as cores para o tema claro (e.g., text, background, primary, secondary, accent, error, grey, lightGrey, darkGrey, icon, textLight, cardBackground, textPrimary, textSecondary, successBg, errorBg, info, primaryGradientStart, lightBlueBorder, cores específicas para earnings, cores para ícones de transação, e cores adicionais injetadas para interatividade, suporte de marca, indicadores, etc.).
dark: Um objeto análogo para o tema escuro, com valores de cores otimizados para fundos escuros.
brand: Um objeto opcional para cores específicas da marca que podem ser independentes do tema (e.g., primaryGreen, lightBlue).
Uso: As cores definidas aqui são importadas por theme.ts para construir os objetos de tema e por styles.ts para estilos estáticos. Componentes podem importar Colors diretamente para acessar cores específicas.

3. icons3d.ts
Caminho: LimpeJaApp/src/constants/icons3d.ts

Propósito: Centraliza a referência a todos os ícones 3D utilizados na aplicação. Isso facilita a gestão dos ativos de imagem, garante que os caminhos estejam corretos e fornece um tipo TypeScript para os nomes dos ícones, evitando erros de digitação.

Conteúdo Principal:

Icons3D: Um objeto que mapeia nomes de string amigáveis (chaves) para as chamadas require() dos arquivos de imagem .png localizados no alias @3d.
Icon3DName: Um tipo TypeScript que representa todas as chaves válidas do objeto Icons3D, permitindo tipagem forte ao referenciar os ícones.
Uso: Componentes que precisam exibir um ícone 3D podem importar Icons3D e usar Icons3D.<nomeDoIcone> para referenciar a imagem.

4. queryKeys.ts
Caminho: LimpeJaApp/src/constants/queryKeys.ts

Propósito: Fornece constantes tipadas para as chaves de busca (query keys) usadas com bibliotecas de gerenciamento de estado de servidor, como TanStack Query (anteriormente React Query). Isso garante que as chaves sejam consistentes em toda a aplicação, melhora a legibilidade e previne erros de digitação que poderiam levar a problemas de cache ou re-fetch.

Conteúdo Principal:

API_QUERY_KEYS: Um objeto que agrupa chaves de busca por domínio (e.g., PROVIDERS, SERVICES, USER_PROFILE, BOOKINGS).
Para chaves que dependem de um ID, são fornecidas funções que retornam um array ['nomeDaChave', id] com as const para inferência de tipo literal.
Uso: Importado e utilizado nas chamadas de useQuery ou useMutation para definir as chaves de cache das requisições.

5. routes.ts
Caminho: LimpeJaApp/src/constants/routes.ts

Propósito: Centraliza todos os caminhos de rota da aplicação. Isso é útil para navegação programática, para definir links ou para garantir que os caminhos sejam consistentes, especialmente em um ambiente como o Expo Router, onde os nomes dos arquivos definem as rotas.

Conteúdo Principal:

AUTH_ROUTES: Rotas relacionadas à autenticação (login, registro de cliente/provedor, etapas de registro).
CLIENT_ROUTES: Rotas específicas para a área do cliente (explorar, resultados de busca, detalhes do provedor, agendamentos, mensagens, perfil). Inclui funções para rotas com parâmetros dinâmicos (e.g., PROVIDER_DETAILS(providerId)).
PROVIDER_ROUTES: Rotas específicas para a área do provedor (dashboard, agenda, serviços, ganhos, mensagens, perfil). Também inclui funções para rotas com parâmetros dinâmicos.
COMMON_ROUTES: Rotas que podem ser acessadas tanto por clientes quanto por provedores (configurações, ajuda, notificações, feedback).
Uso: Importado e utilizado com a função router.push() do Expo Router ou em componentes de navegação para garantir que os caminhos estejam corretos e tipados. O uso de as const garante que os valores sejam inferidos como literais de string.

6. strings.ts
Caminho: LimpeJaApp/src/constants/strings.ts

Propósito: Um placeholder simples para strings de texto comuns utilizadas na aplicação. Embora para internacionalização (i18n) completa uma biblioteca dedicada (i18next, react-i18next) seja recomendada, este arquivo serve para centralizar textos fixos e facilitar futuras implementações de i18n.

Conteúdo Principal:

appStrings: Um objeto contendo chaves para textos como appName, welcomeMessage, loginAction, registerAction, e mensagens de erro comuns.
Uso: Importado e utilizado em componentes para exibir textos estáticos.

7. styles.ts
Caminho: LimpeJaApp/src/constants/styles.ts

Propósito: Define um conjunto de estilos comuns e reutilizáveis utilizando StyleSheet.create do React Native. Estes estilos são tipicamente para componentes de UI genéricos ou padrões de layout que não se alteram dinamicamente com o tema, ou que fazem referência a um tema padrão (geralmente o light como fallback).

Conteúdo Principal:

commonStyles: Um objeto StyleSheet contendo definições de estilo para elementos como backdrop (fundo de sobreposição), sheet (folhas inferiores/modais), handle (indicador de arrastar), sheetTitle, e estilos para toast (notificações pop-up).
Referencia cores de Colors.light para garantir que os estilos estáticos tenham uma base de cor.
Uso: Importado e utilizado em componentes para aplicar estilos predefinidos.

8. theme.ts
Caminho: LimpeJaApp/src/constants/theme.ts

Propósito: Define a estrutura e os valores dos temas da aplicação (claro e escuro), integrando as cores de Colors.ts com definições de tamanhos (SIZES) e fontes (FONTS). Este arquivo é fundamental para a aplicação de um sistema de design consistente e adaptável.

Conteúdo Principal:

Importa Colors.
SIZES: Define tamanhos globais (e.g., base, font, radius, padding) e tamanhos de fonte para títulos e corpo de texto (h1 a h4, body1 a body4).
FONTS: Define estilos de fonte (família, tamanho, altura da linha) para os diferentes tipos de texto, geralmente mapeando para os SIZES.
AppThemeType: Uma interface TypeScript que define a estrutura de um objeto de tema, incluindo um booleano dark e um objeto colors (que reflete as cores de Colors.ts), além de sizes e fonts.
lightTheme: Um objeto que implementa AppThemeType para o tema claro, mapeando as cores de Colors.light e incluindo SIZES e FONTS.
darkTheme: Um objeto que implementa AppThemeType para o tema escuro, mapeando as cores de Colors.dark e incluindo SIZES e FONTS.
Exporta um objeto padrão appTheme que contém SIZES, FONTS, lightTheme, e darkTheme.
Uso: Os objetos de tema (lightTheme, darkTheme) são tipicamente utilizados com provedores de tema de bibliotecas de navegação (e.g., react-navigation) ou componentes de UI (e.g., react-native-paper) para aplicar o tema globalmente. SIZES e FONTS podem ser importados diretamente por componentes que precisam de valores de espaçamento ou tipografia.


9. UnifiedTheme.ts

📍 Caminho: LimpeJaApp/src/constants/UnifiedTheme.ts

Propósito:
Unifica em um único objeto (UnifiedTheme) todos os elementos de design system definidos nos arquivos theme.ts, appStyles.ts e Colors.ts. É o ponto de entrada central para consumo de temas, cores, tipografia e tokens de design. Simplifica importações, garantindo consistência no uso dos estilos em todo o app.

Conteúdo Principal:

UnifiedTheme:
Objeto que agrupa:

colors (derivados de Colors.ts)

typography (de AppTypography)

sizes (de SIZES)

fonts (de FONTS)

shadows, durations, offsets (de appStyles.ts)

Pode expor funções auxiliares para detectar se o tema ativo é dark ou light.

Uso:
Importado em qualquer lugar onde se precise de acesso ao design system unificado, evitando múltiplos imports.

import { UnifiedTheme } from "@/constants";

