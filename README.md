<div align="center">
<img src="https://drive.google.com/uc?id=1PkFFe5bAEVf-x-nPD3BMO21gptKfFosu" alt="LimpeJá-App Logo" width="280">

<h1 style="color: #2c3e50; font-size: 2.8em; margin-top: 15px; margin-bottom: 10px;">Aplicativo LimpeJá ✨🧹</h1>

<p style="color: #7f8c8d; font-size: 1.2em; margin-bottom: 25px;">Seu marketplace de confiança para encontrar e agendar os melhores profissionais de limpeza da sua região!</p>

<p estilo="margem-inferior: 30px;">

<img src="https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="Emblema do React Native" style="margin: 5px;">

<img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Emblema da Expo" style="margin: 5px;">

<img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="Emblema NestJS" style="margin: 5px;">

<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="Emblema do PostgreSQL" style="margin: 5px;">

<img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Emblema Prisma" style="margin: 5px;">

<img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Emblema Socket.IO" style="margin: 5px;">

<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="Emblema TypeScript" style="margin: 5px;">

<img src="https://img.shields.io/badge/EAS-Expo%20Application%20Services-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Emblema EAS" style="margin: 5px;">

<img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="Licença MIT" style="margin: 5px;">

<img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge" alt="Status da construção" style="margin: 5px;">

</p>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📋 Índice</h2>

<ul style="list-style-type: none; preenchimento: 0;">

<li style="margin-bottom: 8px;"><a href="#-sobre-o-projeto" style="color: #3498db; text-decoration: none; font-weight: bold;">📖 Sobre o Projeto</a></li>

<li style="margin-bottom: 8px;"><a href="#-funcionalidades-principais" style="color: #3498db; text-decoration: none; font-weight: bold;">✨ Funcionalidades Principais</a>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><a href="#para-clientes" style="color: #2980b9; text-decoration: none;">Para Clientes</a></li>

<li style="margin-bottom: 5px;"><a href="#para-profissionais-de-limpeza-prestadores" style="color: #2980b9; text-decoration: none;">Para Profissionais de Limpeza</a></li>

</ul>

</li>

<li style="margin-bottom: 8px;"><a href="#️-tecnologias-principais" style="color: #3498db; text-decoration: none; font-weight: bold;">🛠️ Tecnologias Principais</a>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><a href="#frontend" style="color: #2980b9; text-decoration: none;">Front-end</a></li>

<li style="margin-bottom: 5px;"><a href="#backend" style="color: #2980b9; text-decoration: none;">Backend</a></li>

</ul>

</li>

<li style="margin-bottom: 8px;"><a href="#-arquitetura-do-sistema" style="color: #3498db; text-decoration: none; font-weight: bold;">🔩 Arquitetura do Sistema</a>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><a href="#visão-geral-e-propósito-do-backend" style="color: #2980b9; text-decoration: none;">Visão Geral e Propósito do Backend</a></li>

<li style="margin-bottom: 5px;"><a href="#arquitetura-geral-e-fluxo-de-requisição" style="color: #2980b9; text-decoration: none;">Arquitetura Geral e Fluxo de Requisição</a></li>

<li style="margin-bottom: 5px;"><a href="#estrutura-de-módulos-nestjs" style="color: #2980b9; text-decoration: none;">Estrutura de Módulos (NestJS)</a></li>

<li style="margin-bottom: 5px;"><a href="#modelo-de-dados-prisma-schema" style="color: #2980b9; text-decoration: none;">Modelo de Dados (Prisma Schema)</a></li>

<li style="margin-bottom: 5px;"><a href="#princípios-de-design-e-padrões-de-projeto" style="color: #2980b9; text-decoration: none;">Princípios de Design e Padrões de Projeto</a></li>

</ul>

</li>

<li style="margin-bottom: 8px;"><a href="#-conexão-frontend-backend-1" style="color: #3498db; text-decoration: none; font-weight: bold;">🔗 Conexão Frontend-Backend</a>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><a href="#mapeamento-de-rotas-da-api" style="color: #2980b9; text-decoration: none;">Mapeamento de Rotas da API</a></li>

</ul>

</li>

<li style="margin-bottom: 8px;"><a href="#-estrutura-do-projeto" style="color: #3498db; text-decoration: none; font-weight: bold;">📁 Estrutura do Projeto</a>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><a href="#frontend-folder-structure" style="color: #2980b9; text-decoration: none;">Estrutura de Pastas (Frontend)</a></li>

<li style="margin-bottom: 5px;"><a href="#backend-folder-structure" style="color: #2980b9; text-decoration: none;">Estrutura de Pastas (Backend)</a></li>

</ul>

</li>

<li style="margin-bottom: 8px;"><a href="#getting-started" style="color: #3498db; text-decoration: none; font-weight: bold;">🚀 Começando (Configuração para Desenvolvimento Local)</a>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><a href="#prerequisites" style="color: #2980b9; text-decoration: none;">Pré-requisitos</a></li>

<li style="margin-bottom: 5px;"><a href="#instalação" style="color: #2980b9; text-decoration: none;">Instalação</a></li>

<li style="margin-bottom: 5px;"><a href="#rodando-localmente" style="color: #2980b9; text-decoration: none;">Rodando Localmente</a></li>

</ul>

</li>

<li style="margin-bottom: 8px;"><a href="#-gerando-um-apk-para-teste-android" style="color: #3498db; text-decoration: none; font-weight: bold;">📱 Gerando um APK para Teste (Android)</a></li>

<li style="margin-bottom: 8px;"><a href="#-contribuindo" style="color: #3498db; text-decoration: none; font-weight: bold;">🤝 Contribuindo</a></li>

<li style="margin-bottom: 8px;"><a href="#-licença" style="color: #3498db; text-decoration: none; font-weight: bold;">📜 Licença</a></li>

<li style="margin-bottom: 8px;"><a href="#-contato" style="color: #3498db; text-decoration: none; font-weight: bold;">📞 Contato</a></li>

<li style="margin-bottom: 8px;"><a href="#-limpejá-ganhos-nossa-estratégia-de-monetização" style="color: #3498db; text-decoration: none; font-weight: negrito;">💰 LimpeJá Ganhos: Nossa Estratégia de Monetização</a></li>

<li style="margin-bottom: 8px;"><a href="#️-roadmap-e-próximas-etapas" style="color: #3498db; text-decoration: none; font-weight: bold;">🛣️ Roteiro e Próximas Etapas</a></li>

<li style="margin-bottom: 8px;"><a href="#-recursos-e-suporte" style="color: #3498db; text-decoration: none; font-weight: bold;">📚 Recursos e Suporte</a></li>

</ul>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-sobre-o-projeto" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📖 Sobre o Projeto</h2>

<p style="color: #555; line-height: 1.6;">

O LimpeJá é um mercado inovador que visa revolucionar a forma como serviços de limpeza e organização são contratados e gerenciados. Ele conecta clientes que buscam serviços de alta qualidade para profissionais independentes e empresas especializadas, oferecendo uma plataforma intuitiva para descobrir profissionais envolvidos, verificar avaliações, agendar serviços com dados e horários flexíveis, e realizar pagamentos seguros.

</p>

<p style="color: #555; line-height: 1.6;">

Para os profissionais de limpeza, o LimpeJá é uma ferramenta poderosa para expandir sua clientela, gerenciando sua agenda de forma autônoma e recebendo pagamentos de forma garantida e simplificada. Construído com tecnologia de ponta, o aplicativo oferece uma experiência de usuário fluida e moderna, tanto para quem busca um ambiente limpo quanto para quem oferece o serviço de limpeza. O setor de limpeza no Brasil está se consolidando como uma indústria estratégica e essencial, com a valorização da higiene intensificada após a pandemia de COVID-19, o que representa uma oportunidade estrutural para o LimpeJá.

</p>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-funcionalidades-principais" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">✨ Funcionalidades Principais</h2>

<div style="display: flex; flex-wrap: wrap; justify-content: space-around;">

<div style="cor de fundo: #ffffff; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); largura: 45%; largura mínima: 300px; margem: 10px;">

<h3 id="para-clientes" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Para Clientes</h3>

<ul style="list-style-type: none; preenchimento: 0;">

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">🧼 Busca Inteligente:</strong> Encontre profissionais por especialidade, localização e avaliações.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">📅 Agendamento Flexível:</strong> Escolha dados e horários que se encaixam na sua rotina e gerencie seus agendamentos.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">💳 Pagamento Seguro:</strong> Transações protegidas dentro da plataforma, incluindo geração de cobranças PIX.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">⭐ Avaliações Confiáveis:</strong> Deixe e veja avaliações para ajudar a comunidade e garantir a qualidade do serviço.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">💬 Comunicação Direta:</strong> Chat em tempo real integrado para combinar detalhes com o profissional.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">🏠 Perfis Detalhados:</strong> Visualize informações completas sobre os profissionais, incluindo serviços oferecidos e status de verificação.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">🔔 Notificações:</strong> Receba alertas sobre o status dos agendamentos, mensagens e promoções.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">⚙️ Gerenciamento de Perfil:</strong> Atualize suas informações pessoais e de contato.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">🎁 Cupons e Descontos Exclusivos:</strong> Aproveite ofertas especiais para economizar em seus agendamentos.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">🛡️ Seguro de Limpeza e Garantia:</strong> Opção de adicionar seguro aos agendamentos para maior tranquilidade, cobrindo danos ou insatisfação.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">💎 Planos Premium e Benefícios:</strong> Assine planos exclusivos para ter acesso a cupons diferenciados, seguro gratuito, prioridade no agendamento e suporte premium.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">✨ Programa de Fidelidade e Missões:</strong> Ganhe pontos e recompensas a cada serviço concluído, avaliação enviada ou indicação, com missões gamificadas para engajar o usuário.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">🔒 Segurança Aprimorada:</strong> Autenticação biométrica (Face ID/Touch ID) e alertas de segurança para proteger sua conta.</li>

</ul>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); largura: 45%; largura mínima: 300px; margem: 10px;">

<h3 id="para-profissionais-de-limpeza-prestadores" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Para Profissionais de Limpeza (Prestadores)</h3>

<ul style="list-style-type: none; preenchimento: 0;">

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">🚀 Visibilidade Ampliada:</strong> Alcance mais clientes e aumente sua renda através de um perfil profissional detalhado.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">🗓️ Gestão de Agenda:</strong> Controle total sobre seus horários e disponibilidade, aceitando ou recusando agendamentos.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">💰 Pagamentos Garantidos:</strong> Receba de forma segura e pontual pelos seus serviços, com visualizações de ganhos e solicitação de saques.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">📊 Perfil Profissional:</strong> Mostre suas habilidades, experiência, portfólio de serviços e avaliações recebidas.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">🔔 Notificações em Tempo Real:</strong> Sobre novos pedidos, mensagens e atualizações de agendamento.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">✅ Processo de Verificação:</strong> Passe por um processo de verificação de conta (CPF, documento, selfie) para aumentar a confiança dos clientes.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">🛠️ Gerenciamento de Serviços:</strong> Adicione, edite e remova os tipos de serviços que você oferece, definindo preços e durações.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">💬 Chat em Tempo Real:</strong> Comunique-se diretamente com seus clientes para esclarecer dúvidas e combinar detalhes.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">🏆 Programa de Recompensas e Reconhecimento:</strong> Ganhe níveis, selos de confiança e badges por excelência, pontualidade e avaliações 5 estrelas, destacando-se na plataforma.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">⚖️ Gestão de Incidentes e Disputas:</strong> Ferramentas e suporte para reportar e resolver problemas ou desentendimentos de forma justa e transparente.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">🔒 Segurança Aprimorada:</strong> Autenticação biométrica, alertas de segurança e controle de sessão para proteger sua conta.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">📈 Análises e Insights de Negócio:</strong> Acesse métricas de desempenho, tendências de mercado e sugestões baseadas em IA para otimizar seus serviços e ganhos.</li>

<li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">📊 Conformidade e Requisitos Legais:</strong> Ferramentas para gerenciar documentos, verificar status de conformidade e garantir que você atenda a todos os requisitos legais.</li>

</ul>

</div>

</div>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="️-tecnologias-principais" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🛠️ Tecnologias Principais</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 20px;">

O projeto LimpeJá é construído sobre uma pilha tecnológica robusta e moderna, garantindo eficiência e escalabilidade em todas as camadas.

</p>

<div style="display: flex; flex-wrap: wrap; justify-content: space-around;">

<div style="cor de fundo: #f8f9fa; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); largura: 45%; largura mínima: 300px; margem: 10px;">

<h3 id="frontend" style="color: #2c3e50; tamanho da fonte: 1,5em; margem inferior: 15px;">Frontend</h3>

<ul style="list-style-type: none; preenchimento: 0;">

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Framework UI:</strong> <a href="https://reactnative.dev/docs" style="color: #3498db; text-decoration: none;">React Native</a> - Para construção de interfaces de usuário nativo para iOS e Android a partir de uma única base de código, com foco em desempenho e experiência do usuário.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Navegação:</strong> <a href="https://docs.expo.dev/router/introduction/" style="color: #3498db; text-decoration: none;">Expo Router</a> - Sistema de roteamento baseado em arquivos para aplicativos Expo e React Native, oferecendo navegação robusta, tipada e com suporte a deep linking. [4, 7, 12, 17]</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Gerenciamento de Estado Global:</strong> React Context API - Para gerenciar estados compartilhados, como o contexto de autenticação (`AuthContext`), o contexto de registro de provedor (`ProviderRegistrationContext`) e configurações globais (`AppContext`), de forma eficiente, evitando 'perfuração de prop' e centralizando dados. [4, 12]</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Tipagem:</strong> <a href="https://www.typescriptlang.org/docs/" style="color: #3498db; text-decoration: none;">TypeScript</a> - Essencial para a segurança e consistência dos dados, especialmente na integração com o backend e para escalabilidade do desenvolvimento.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Estilização:</strong> StyleSheet do React Native, com temas dinâmicos (claro/escuro) gerenciados via `Colors.ts` e `theme.ts` para consistência visual e fácil adaptação.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Animações:</strong> React Native Animated API para transições suaves e `react-native-reanimated` para animações complexas e performáticas, incluindo efeitos visuais com `expo-linear-gradient` e `expo-blur`.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Ícones:</strong> `@expo/vector-icons` e `react-native-svg` para ícones personalizados e animados.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Utilitários Expo:</strong> `expo-image-picker`, `expo-clipboard`, `react-native-safe-area-context`, `expo-haptics` (para feedback tátil), `expo-local-authentication` para biometria [1, 5, 6, 11, 22] e `expo-secure-store` para armazenamento seguro de dados sensíveis [6, 14, 16, 19, 21, 26].</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Requisições HTTP:</strong> <a href="https://axios-http.com/" style="color: #3498db; text-decoration: none;">Axios</a> - Para chamadas HTTP à API backend, configuradas com interceptores para tratamento de autenticação (JWT) e erros (especialmente 401 Unauthorized, forçando logout).</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Gerenciamento de Dados (Opcional):</strong> <a href="https://tanstack.com/query/latest/docs/react/overview" style="color: #3498db; text-decoration: none;">TanStack Query</a> - Para otimização de requisições GET, caching, sincronização e gerenciamento de estado do servidor, reduzindo boilerplate e melhorando a performance [18, 25, 28, 30, 32].</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Serviços Expo:</strong> <a href="https://expo.dev/eas" style="color: #3498db; text-decoration: none;">EAS (Expo Application Services)</a> - Para um fluxo de desenvolvimento gerenciado, builds e atualizações. Inclui:

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px; cor: #555;">

<li style="margin-bottom: 5px;">`EAS Build`: Para compilação de APKs/AABs e IPAs na nuvem.</li>

<li style="margin-bottom: 5px;">`EAS Submit`: Para envio para as lojas (futuramente).</li>

<li style="margin-bottom: 5px;">`EAS Update`: Para atualizações over-the-air (futuramente).</li>

</ul>

</li>

</ul>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); largura: 45%; largura mínima: 300px; margem: 10px;">

<h3 id="backend" style="color: #2c3e50; tamanho da fonte: 1,5em; margem inferior: 15px;">Backend</h3>

<ul style="list-style-type: none; preenchimento: 0;">

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Framework:</strong> <a href="https://docs.nestjs.com/" style="color: #e74c3c; text-decoration: none;">NestJS</a> (Node.js) - Escolha estratégica por sua modularidade, forte tipagem (TypeScript), aderência a padrões de arquitetura (DDD, MVC-like) e um ecossistema robusto para construir APIs escaláveis ​​e manuteníveis. [8]</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Linguagem:</strong> TypeScript - Oferece segurança de tipo em todas as camadas, desde os DTOs até a interação com o banco de dados via ORM, melhorando a manutenibilidade e reduzindo erros no tempo de execução.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Banco de Dados:</strong> <a href="https://www.postgresql.org/docs/" style="color: #e74c3c; text-decoration: none;">PostgreSQL</a> - Um sistema de dados relacionado a banco robusto, bastante e escalável, ideal para dados estruturados e relações complexas.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">ORM:</strong> <a href="https://www.prisma.io/docs/" style="color: #e74c3c; text-decoration: none;">Prisma</a> - ORM moderno e type-safe que simplifica a interação com o banco de dados, oferece migrações declarativas e garantir a segurança de tipo nas operações de persistência. [2, 3]</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Autenticação:</strong> <a href="https://jwt.io/introduction/" style="color: #e74c3c; text-decoration: none;">JWT (JSON Web Tokens)</a> com <a href="http://www.passportjs.org/" style="color: #e74c3c; text-decoration: none;">Passport.js</a> - Para autenticação stateless e segura, permitindo controle de acesso baseado em papéis (RBAC) e protegendo rotas sensíveis. [2, 3, 8, 9, 10]</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Comunicação em Tempo Real:</strong> <a href="https://socket.io/docs/" style="color: #e74c3c; text-decoration: none;">Socket.IO</a> - Para comunicação bidirecional em tempo real, fundamental para funcionalidades como chat e notificações instantâneas. [29, 31, 33, 39, 40]</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Validação:</strong> <a href="https://github.com/typestack/class-validator" style="color: #e74c3c; text-decoration: none;">Class-validator</a> e <a href="https://github.com/typestack/class-transformer" style="color: #e74c3c; text-decoration: none;">Class-transformer</a> - Para validação declarativa de DTOs, garantindo que os dados de entrada da API estejam sempre no formato e com os valores esperados.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">API de documentação:</strong> <a href="https://swagger.io/specification/" style="color: #e74c3c; text-decoration: none;">Swagger (OpenAPI)</a> - Para documentação automática e interativa da API, facilitando o consumo por desenvolvedores de frontend e a utilização da API.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Variáveis ​​de Ambiente:</strong> `@nestjs/config` com <a href="https://joi.dev/api/" style="color: #e74c3c; text-decoration: none;">Joi</a> - Para gerenciamento seguro e validação rigorosas das configurações de ambiente, garantindo a integridade da aplicação.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Filas de Processamento:</strong> <a href="https://docs.nestjs.com/techniques/queues" style="color: #e74c3c; text-decoration: none;">Bull (Queues)</a> - Utilizando Redis como broker, para processamento assíncrono de tarefas de longa duração, como envio de notificações, processamento de documentos de verificação e geração de agendamentos recorrentes.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Monitoramento de Erros:</strong> <a href="https://sentry.io/" style="color: #e74c3c; text-decoration: none;">Sentry</a> - Integrado para captura de exceções e monitoramento de performance em tempo real, garantindo a estabilidade da aplicação.</li>

</ul>

</div>

</div>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-arquitetura-do-sistema" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🔩 Arquitetura do Sistema</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 20px;">

O projeto LimpeJá adota uma arquitetura em camadas claras, divididas principalmente entre o Backend (API) e o Frontend (Aplicativo Móvel), que se comunicam através de APIs RESTful e WebSockets.

</p>

<div style="cor de fundo: #ffffff; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="visão-geral-e-propósito-do-backend" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Visão Geral e Propósito do Backend</h3>

<p style="color: #555; line-height: 1.6;">

O backend do LimpeJá é uma camada de serviço que gerencia toda a lógica de negócios, persistência de dados e a comunicação com o frontend. Construído com NestJS, o backend é responsável por conectar clientes e provedores, facilitando agendamentos, pagamentos, chat e avaliações. Sua arquitetura modular e escalável garante robustez e alto desempenho.

</p>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="arquitetura-geral-e-fluxo-de-requisição" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Arquitetura Geral e Fluxo de Requisição</h3>

<p style="color: #555; line-height: 1.6;">O fluxo de uma requisição típica no sistema LimpeJá segue o seguinte caminho:</p>

<ol style="color: #555; altura da linha: 1,6; preenchimento esquerdo: 20px;">

<li style="margin-bottom: 10px;"><strong>Cliente (Usuário):</strong> Interage com a interface do usuário no Frontend (Aplicativo Móvel).</li>

<li style="margin-bottom: 10px;"><strong>Frontend (Aplicativo Móvel):</strong> Coleta e valida os dados de entrada do usuário, realiza chamadas a serviços internos, formato de requisição (HTTP ou WebSocket) e envio para o Backend, incluindo o token JWT no cabeçalho `Authorization` para requisições protegidas.</li>

<li style="margin-bottom: 10px;"><strong>Backend (API NestJS):</strong>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><strong>Guardas:</strong> Interceptam uma requisição para validação de autenticação (JWT) e autorização (papéis do usuário).</li>

<li style="margin-bottom: 5px;"><strong>Pipes:</strong> Validam e transformam os DTOs de entrada.</li>

<li style="margin-bottom: 5px;"><strong>Controlador:</strong> Recebe uma requisição validada, extrai parâmetros e delega a lógica de negócios para o Serviço de segurança.</li>

<li style="margin-bottom: 5px;"><strong>Serviço:</strong> Contém a lógica de negócios principais, orquestrando operações e interagindo com o `PrismaService`. Pode injetar outros serviços para operações complexas.</li>

<li style="margin-bottom: 5px;"><strong>PrismaService:</strong> Atua como uma camada de acesso a dados, executando operações no Banco de Dados.</li>

<li style="margin-bottom: 5px;"><strong>Banco de Dados (PostgreSQL):</strong> Persiste e recupera os dados.</li>

<li style="margin-bottom: 5px;"><strong>Resposta:</strong> O Service retorna os dados ao Controller, que os formato (geralmente usando DTOs de resposta) e os envio de volta ao Frontend.</li>

<li style="margin-bottom: 5px;"><strong>Filtros:</strong> Capturam abordagens HTTP, formatando as respostas de erro de forma consistente.</li>

</ul>

</li>

<li style="margin-bottom: 10px;"><strong>Frontend (Aplicativo Móvel):</strong> Recebe uma resposta do Backend, processa os dados e atualiza a interface do usuário, exibindo informações ou mensagens de erro ao Cliente.</li>

</ol>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="estrutura-de-módulos-nestjs" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Estrutura de Módulos (NestJS)</h3>

<p style="color: #555; line-height: 1.6;">O backend é organizado em módulos coesos, seguindo o princípio de responsabilidade única. Cada módulo encapsula funcionalidades específicas, incluindo seus próprios controladores, serviços, DTOs e entidades.</p>

<ul style="list-style-type: disc; padding-left: 20px; color: #555; line-height: 1.6;">

<li style="margin-bottom: 5px;">`src/auth`: Gerenciamento de autenticação (registro, login, redefinição de senha).</li>

<li style="margin-bottom: 5px;">`src/users`: Operações genéricas sobre usuários (perfis, dados básicos).</li>

<li style="margin-bottom: 5px;">`src/clients`: Lógica específica para o papel do cliente.</li>

<li style="margin-bottom: 5px;">`src/providers`: Lógica específica para o papel de provedor.</li>

<li style="margin-bottom: 5px;">`src/availability`: Gestão da disponibilidade de horários dos provedores.</li>

<li style="margin-bottom: 5px;">`src/services`: Gerenciamento de tipos de serviços globais (por exemplo, "Limpeza Padrão").</li>

<li style="margin-bottom: 5px;">`src/provider-services`: Gerenciamento dos serviços específicos oferecidos por cada provedor.</li>

<li style="margin-bottom: 5px;">`src/bookings`: Criação e gestão de agendamentos.</li>

<li style="margin-bottom: 5px;">`src/payments`: Processamento de pagamentos (PIX simulado) e saques.</li>

<li style="margin-bottom: 5px;">`src/chat`: Funcionalidades de chat (REST e WebSocket).</li>

<li style="margin-bottom: 5px;">`src/notifications`: Gerenciamento de notificações para usuários.</li>

<li style="margin-bottom: 5px;">`src/reviews`: Envio e consulta de avaliações.</li>

<li style="margin-bottom: 5px;">`src/offers`: Gerenciamento de ofertas e promoções.</li>

<li style="margin-bottom: 5px;">`src/search`: Motor de busca abrangente.</li>

<li style="margin-bottom: 5px;">`src/verification`: Processo de verificação de provedores (CPF, documentos, selfie).</li>

<li style="margin-bottom: 5px;">`src/coupons`: Gestão de cupons de desconto e sua aplicação.</li>

<li style="margin-bottom: 5px;">`src/subscriptions`: Gerenciamento de assinaturas e agendamentos recorrentes.</li>

<li style="margin-bottom: 5px;">`src/guarantee`: Módulo para solicitações de seguro e garantia de serviço.</li>

<li style="margin-bottom: 5px;">`src/disputes`: Gestão de disputas e mediação de problemas em agendamentos.</li>

<li style="margin-bottom: 5px;">`src/safety`: Gerenciamento de incidentes e alertas de pânico.</li>

<li style="margin-bottom: 5px;">`src/loyalty`: Gerenciamento do programa de fidelidade e pontos.</li>

<li style="margin-bottom: 5px;">`src/missions`: Criação e acompanhamento de missões gamificadas.</li>

<li style="margin-bottom: 5px;">`src/rewards`: Gerenciamento de recompensas resgatáveis com pontos de fidelidade.</li>

<li style="margin-bottom: 5px;">`src/pricing`: Definição e aplicação de regras de precificação dinâmica.</li>

<li style="margin-bottom: 5px;">`src/referrals`: Gerenciamento de indicações de usuários.</li>

<li style="margin-bottom: 5px;">`src/compliance`: Gerenciamento de conformidade e requisitos legais.</li>

<li style="margin-bottom: 5px;">`src/dashboard`: Consolidação de dados para o painel do provedor.</li>

<li style="margin-bottom: 5px;">`src/earnings`: Gerenciamento de ganhos e transações financeiras de provedores.</li>

<li style="margin-bottom: 5px;">`src/faqs`: Gerenciamento de perguntas frequentes.</li>

<li style="margin-bottom: 5px;">`src/analytics`: Coleta e análise de métricas de desempenho e insights de negócio.</li>

<li style="margin-bottom: 5px;">`src/ai-suggestions`: Geração de sugestões inteligentes baseadas em IA.</li>

<li style="margin-bottom: 5px;">`src/prisma`: Módulo global para o `PrismaService`.</li>

<li style="margin-bottom: 5px;">`src/config`: Módulo global para gerenciamento de configurações.</li>

<li style="margin-bottom: 5px;">`src/common`: Componentes reutilizáveis ​​(pipes, filtros de exceção, DTOs genéricos, enums).</li>

</ul>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="modelo-de-dados-prisma-schema" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Modelo de Dados (Prisma Schema)</h3>

<p style="color: #555; line-height: 1.6;">

O `prisma/schema.prisma` define o modelo de dados relacional e é a fonte da verdade para a estrutura do banco de dados. Ele inclui:

</p>

<ul style="list-style-type: disc; padding-left: 20px; color: #555; line-height: 1.6;">

<li style="margin-bottom: 5px;"><strong>Enums:</strong> `UserRole` (CLIENTE, PROVEDOR, ADMIN, SISTEMA), `VerificationStatus` (REVISÃO_INICIAL_PENDENTE, APROVADO, REJEITADO, etc.), `BookingStatus` (PENDENTE, CONFIRMADO, CONCLUÍDO, CANCELADO, etc.), `TransactionType` (PAGAMENTO, SAQUE, COMISSÃO, REEMBOLSO), `DisputeReason`, `DisputeStatus`, `SubscriptionStatus`, `SubscriptionFrequency`, `CouponStatus`, `ClaimStatus`, `LoyaltyTransactionType`, `IncidentType`, `IncidentStatus`, `PanicType`, `MissionAudience`, `MissionKind`, `RewardType`, `PricingType`, `ReferralStatus`, `DocumentPhotoType`, `SearchType`, `SortByOption`.</li>

<li style="margin-bottom: 5px;"><strong>Modelos Principais (Tabelas):</strong>

<ul style="list-style-type: círculo; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;">`User`: Entidade base para todos os usuários, com `email`, `passwordHash`, `role`, `avatarUrl`, `isVerified`, `walletBalance`, `ordersCount`, `noShowCount`, `cancellationCount`.</li>

<li style="margin-bottom: 5px;">`Client`: ​​Detalhes específicos para clientes (`fullName`, `phone`, `completedBookingsCount`).</li>

<li style="margin-bottom: 5px;">`Provider`: Detalhes específicos para provedores (`fullName`, `cpf`, `dateOfBirth`, `verificationStatus`, `pixKey`, `yearsOfExperience`, `bio`, `averageRating`, `reviewCount`, `fiveStarReviewCount`, `monthlyBookingsCount`, `badges`).</li>

<li style="margin-bottom: 5px;">`Address`: Informações de endereço, usadas por clientes, provedores e agendamentos, incluindo `latitude` e `longitude`.</li>

<li style="margin-bottom: 5px;">`Service`: Tipos de serviços que podem ser oferecidos (`name`, `description`, `price`, `icon`, `backgroundColor`).</li>

<li style="margin-bottom: 5px;">`ProviderService`: Um serviço específico oferecido por uma operadora, com `price`, `durationMinutes`, `pricingType`, `pricePerSquareMeter`, `pricePerRoom`.</li>

<li style="margin-bottom: 5px;">`Booking`: Representa um agendamento de serviço, incluindo `totalPrice`, um `addressId` específico para o agendamento, `couponId`, `subscriptionId`, `incidents`, `guaranteeClaims`, e detalhes do cliente/provedor/serviço aninhados.</li>

<li style="margin-bottom: 5px;">`Chat` e `Message`: Para comunicação em tempo real entre usuários, com `isRead` e `receiverId` em `Message`.</li>

<li style="margin-bottom: 5px;">`Notification`: Armazena notificações para usuários, com `type`, `title`, `body`, `createdAt`, `readAt`, `navigateTo`, `relatedId`, `imageUrl`, `actionButtons`.</li>

<li style="margin-bottom: 5px;">`Review`: Avaliações de serviços, vinculadas a um `Booking`, com `targetId`, `reviewerId`, `type`, `comment`.</li>

<li style="margin-bottom: 5px;">`Offer`: Gerencia ofertas e promoções, com `imageUrl`, `terms`, `discountPercentage`, `originalPrice`, `discountedPrice`, `validUntil`, `couponCode`, `serviceId`, `providerId`, e campos de UI como `bankName`, `buttonText`, `badgeTitle`, `backgroundColorStart/End`.</li>

<li style="margin-bottom: 5px;">`Transaction`: Registra todas as transações financeiras, utilizando `Prisma.Decimal` para garantir a rentabilidade monetária, e associada a `couponId`, `type`, `status`, `bookingId`.</li>

<li style="margin-bottom: 5px;">`ProviderAvailability`: Define a disponibilidade de horários dos provedores, com `dayOfWeek`, `startTime`, `endTime`, `isAvailable`.</li>

<li style="margin-bottom: 5px;">`Coupon`: Define os cupons de desconto, incluindo `code`, `type`, `value`, `validFrom`, `validUntil`, `maxUses`, `usesCount`, `target`, `targetId`, `status`.</li>

<li style="margin-bottom: 5px;">`CouponUsage`: Rastreia cada uso individual de um cupom, associando-o a um `userId` e `bookingId`, e registrando o `appliedValue`.</li>

<li style="margin-bottom: 5px;">`Subscription`: Gerencia assinaturas para agendamentos recorrentes, com `frequency`, `startDate`, `endDate`, `status`, `totalPrice`, `nextGenerationDate`, `generatedBookings`.</li>

<li style="margin-bottom: 5px;">`GuaranteeClaim`: Registra solicitações de garantia/seguro de serviço, com `bookingId`, `description`, `attachments`, `estimatedValue`, `resolvedValue`, `status`, `resolutionNotes`, `resolvedAt`.</li>

<li style="margin-bottom: 5px;">`Dispute`: Modela o processo de disputa de um agendamento, com `bookingId`, `reporterUserId`, `reason`, `description`, `refundAmountProposed`, `attachments`, `status`, `resolutionNotes`, `resolvedAt`.</li>

<li style="margin-bottom: 5px;">`Incident`: Detalhes de incidentes reportados, com `reporterId`, `bookingId`, `type`, `description`, `attachments`, `status`, `resolution`, `resolvedBy`, `resolvedAt`.</li>

<li style="margin-bottom: 5px;">`PanicAlert`: Registra alertas de pânico com `userId`, `latitude`, `longitude`, `message`, `status`.</li>

<li style="margin-bottom: 5px;">`LoyaltyTransaction`: Histórico detalhado de como os pontos de fidelidade foram ganhos ou resgatados, com `userId`, `amount`, `type`, `referenceId`.</li>

<li style="margin-bottom: 5px;">`Mission`: Define objetivos gamificados com `code`, `title`, `description`, `audience`, `kind`, `eventName`, `targetValue`, `timeWindowDays`, `rewardType`, `rewardValue`, `couponTemplateId`, `isActive`.</li>

<li style="margin-bottom: 5px;">`MissionProgress`: Acompanha o progresso do usuário em uma missão, com `userId`, `missionId`, `currentValue`, `status`, `lastEventAt`, `completedAt`, `claimedAt`.</li>

<li style="margin-bottom: 5px;">`Referral`: Registra indicações de usuários, com `referredUserId`, `referrerUserId`, `referralCode`, `status`.</li>

<li style="margin-bottom: 5px;">`FAQItem`: Perguntas frequentes com `question`, `answer`, `keywords`, `category`, `order`.</li>

</ul>

</li>

<li style="margin-bottom: 5px;"><strong>Precisão Monetária:</strong> O uso do tipo `Decimal` do Prisma (`@db.Decimal(10, 2)`) para campos como `price`, `totalPrice` e `amount` garante precisão exata em cálculos financeiros, evitando erros de arredondamento.</li>

</ul>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="princípios-de-design-e-padrões-de-projeto" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Princípios de Design e Padrões de Projeto</h3>

<p style="color: #555; line-height: 1.6;">O projeto LimpeJá segue princípios de design e padrões de projeto que promovem qualidade, manutenibilidade e escalabilidade em todo o stack.</p>

<ul style="list-style-type: none; preenchimento: 0; cor: #555; altura da linha: 1,6;">

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Arquitetura em Camadas:</strong> Tanto o frontend quanto o backend seguem uma arquitetura em camadas claras (Controladores/Telas, Serviços/Lógica de Negócios, Acesso a Dados), promovendo a separação de preocupações. [46, 47, 48]</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Data Transfer Objects (DTOs):</strong> Utilização rigorosa de DTOs para validação de entrada (com `class-validator` e `class-transformer`) e tipagem de saída em todas as interações API, garantindo a integridade e segurança dos dados.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Autenticação e Autorização:</strong> Implementação robusta de JWT e RBAC (Role-Based Access Control) para proteger rotas e recursos, com `Guards` e `Strategies` no NestJS. [2, 3, 8, 9, 10]</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Tratamento Centralizado de Erros:</strong> O `HttpExceptionFilter` do backend padroniza as respostas de erro, permitindo que o frontend interprete e exiba mensagens significativas ao usuário via `Alert.alert` ou `ToastMessage`. O interceptor de resposta do Axios no frontend lida com erros 401/403 de forma centralizada.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Modularidade:</strong> Módulos de dados no backend (NestJS) e componentes reutilizáveis ​​no frontend (React Native) garantem organização, testabilidade e reutilização de código.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Segurança de Tipos (Type-Safety):</strong> O uso extensivo de TypeScript em ambas as camadas, complementado pelo Prisma ORM no backend, garante a consistência e integridade dos dados em tempo de construção e execução.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Injeção de Dependência:</strong> No backend (NestJS), facilita a testabilidade e modularidade dos serviços, seguindo os princípios SOLID.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Componentização (Frontend):</strong> Divisão da UI em componentes pequenos e reutilizáveis ​​(`components/ui/`), promovendo reutilização e manutenibilidade.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Gerenciamento de Estado:</strong> Combinação de Hooks do React (`useState`, `useEffect`, `useRef`) para estado local e Context API (`AuthContext`, `AppContext`, `ProviderRegistrationContext`) para estado global no frontend, garantindo um fluxo de dados claro e reativo. [4, 12, 33]</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Navegação Declarativa:</strong> Uso do Expo Router para uma gestão de rotas intuitiva e baseada em arquivos, com layouts aninhados e rotas protegidas para controle de acesso. [4, 12, 17]</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Animações e Responsividade:</strong> Aplicação de animações fluidas (`react-native-reanimated`, React Native Animated API) e design responsivo para aprimorar a experiência do usuário em diferentes dispositivos, com `useNativeDriver: true` para otimização.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Gerenciamento de Dados e Fluxo de Informações:</strong> O frontend segue o padrão Unidirecional do React, com dados fluindo de contextos globais e estado local, e interações com o backend via camada de serviços tipada (`services/`).</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Estilização e Temas:</strong> Utilização de `Colors.ts` para uma paleta de cores centralizada e `theme.ts` para definição de temas claro/escuro, tamanhos e fontes, garantindo consistência visual e fácil manutenção da UI.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Separação de Entidades e DTOs (Backend):</strong> Entidades (`*.entity.ts`) para o modelo de domínio e DTOs (`*.dto.ts`) para validação/formatação de API, melhorando segurança e validação.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Consistência na Manipulação de Dados:</strong> Uso cuidadoso de objetos Date e UTC para evitar problemas de fuso horário, especialmente em agendamentos e disponibilidade.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Hooks de Desligamento do Prisma:</strong> Garantem o fechamento gracioso da conexão com o banco de dados em caso de encerramento da aplicação.</li>

</ul>

</div>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-conexão-frontend-backend-1" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🔗 Conexão Frontend-Backend</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 20px;">

A interligação entre o Frontend (React Native/Expo) e o Backend (NestJS) do projeto LimpeJá é um pilar fundamental da arquitetura, garantindo uma comunicação eficiente e segura.

</p>

<ul style="list-style-type: none; preenchimento: 0; cor: #555; altura da linha: 1,6;">

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Padrão de Comunicação:</strong> Predominantemente APIs RESTful (HTTP) para operações transacionais e de consulta, e WebSockets para funcionalidades de comunicação em tempo real (chat, notificações). [29, 31, 33, 39, 40]</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Autenticação JWT:</strong> O `AuthContext` no frontend gerencia o ciclo de vida do token JWT, obtido via `POST /auth/login`. Este token é armazenado de forma segura no AsyncStorage (e opcionalmente no `expo-secure-store` para maior segurança) e anexado automaticamente como `Authorization: Bearer <token>` em todas as requisições protegidas ao backend. [2, 3, 6, 8, 9, 10, 14, 16, 19, 21, 26]</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Consistência de Dados (DTOs e Interfaces TypeScript):</strong> Um alinhamento específico é reservado entre as interfaces TypeScript do frontend (localizadas em `LimpeJaApp/src/types/backend/`) e os DTOs definidos no backend. Isso garante a validação e consistência da estrutura de dados em ambas as camadas, minimizando erros de tipagem e facilitando a colaboração.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Tratamento de Erros:</strong> O `HttpExceptionFilter` do backend padroniza as respostas de erro, permitindo que o frontend interprete e exiba mensagens significativas ao usuário. As chamadas de API no frontend incluem blocos `try-catch` para lidar com erros de rede e respostas de erro da API.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Serviços Centralizados:</strong> Chamadas de API são encapsuladas em serviços centralizados (`authService.ts`, `clientService.ts`, `providerService.ts`, etc.) que utilizam o Axios, promovendo reutilização de código e padronização.</li>

</ul>

<div style="cor de fundo: #f8f9fa; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem superior: 20px;">

<h3 id="mapeamento-de-rotas-da-api" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Mapeamento de Rotas da API</h3>

<p style="color: #555; line-height: 1.6; margin-bottom: 15px;">Para uma lista completa de endpoints e DTOs, consulte uma documentação detalhada do backend, que pode ser acessada via Swagger UI em `http://localhost:3000/api` (após iniciar o backend). Abaixo alguns exemplos de interações:</p>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
<thead>
<tr style="background-color: #e0e0e0; color: #34495e;">
<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Fluxo/Tela do Frontend</th>
<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Endpoint do Backend (Método HTTP, Caminho)</th>
<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">DTOs (Requisição/Resposta)</th>
</tr>
</thead>
<tbody>
<tr style="background-color: #f2f2f2;">
<td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Fluxo de Autenticação</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Registro de Clientes</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /auth/register/client`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`RegisterClientDto` / `AuthResponse`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Registro de Provedores</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /auth/register/provider`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`RegisterProviderDto` / `AuthResponse`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Login</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /auth/login`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`LoginDto` / `AuthResponse`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Solicitar Redefinição de Senha</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /auth/forgot-password`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ForgotPasswordDto` / `MessageResponseDto`</td>
</tr>
<tr style="background-color: #f2f2f2;">
<td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Gerenciamento de Usuário/Perfil</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Perfil do Usuário Logado</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /users/me`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UserProfile`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Atualizar Perfil do Cliente</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /clients/me`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UpdateClientProfileDto` / `UserProfile`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Atualizar Perfil do Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /providers/me`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UpdateProviderProfileData` / `ProviderDisplayInfo`</td>
</tr>
<tr style="background-color: #f2f2f2;">
<td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Fluxo do Cliente</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Buscar Categorias de Serviço</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /services`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`/Service[]`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Buscar Provedores (Geral)</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /providers`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ProviderSearchQuery` / `ProviderDisplayInfo[]`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Detalhes do Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /providers/:id`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ProviderDisplayInfo`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Criar Agendamento</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /bookings`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`CreateBookingDto` / `BookingDetails`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Criar Cobrança PIX</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /payments/pix-charge`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`CreatePixChargeDto` / `PixChargeResponseDto`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Aplicar Cupom</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /coupons/apply`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ApplyCouponPayload` / `CouponApplicationResult`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Submeter Solicitação de Garantia</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /guarantee/claims`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`SubmitClaimDto` / `GuaranteeClaim`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Listar Minhas Solicitações de Garantia</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /guarantee/claims/me`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GuaranteeClaim[]`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Criar Assinatura</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /subscriptions`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`CreateSubscriptionDto` / `Subscription`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Listar Minhas Assinaturas</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /subscriptions/me`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`Subscription[]`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Detalhes da Assinatura</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /subscriptions/:id`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`Subscription`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Atualizar Assinatura</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /subscriptions/:id`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UpdateSubscriptionDto` / `Subscription`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Listar Minhas Missões</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /missions/my`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`MissionItem[]`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Resgatar Recompensa de Missão</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /missions/claim`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`{ missionId: string }` / `ClaimMissionResponse`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Criar Indicação</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /referrals`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`CreateReferralDto` / `Referral`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Listar Indicações Feitas</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /referrals/made-by/:userId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GetReferralsMadeByUserResponse`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Listar Usuários Indicados</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /referrals/referred-by/:referrerId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GetReferredUsersResponse`</td>
</tr>
<tr style="background-color: #f2f2f2;">
<td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Fluxo do Provedor</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Dashboard do Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /providers/me/dashboard`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ProviderDashboard`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Ganhos do Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /providers/me/earnings`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`EarningsResponseDto`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Solicitar Saque</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /payments/withdrawal`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`RequestWithdrawalDto` / `MessageResponseDto`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Disponibilidade do Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /providers/:providerId/availability`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GetProviderAvailabilityResponse`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Atualizar Disponibilidade do Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /providers/:providerId/availability`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UpdateAvailabilityData[]` / `ProviderAvailability[]`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Adicionar Disponibilidade do Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /providers/:providerId/availability`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UpdateAvailabilityData` / `ProviderAvailability`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Deletar Disponibilidade do Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`DELETE /providers/:providerId/availability/:availabilityId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`void`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Serviços Oferecidos pelo Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /providers/:providerId/services`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ProviderServiceOffering[]`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Adicionar Serviço Oferecido pelo Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /providers/:providerId/services`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`CreateProviderServiceData` / `ProviderServiceOffering`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Atualizar Serviço Oferecido pelo Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /providers/:providerId/services/:id`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UpdateProviderServiceData` / `ProviderServiceOffering`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Deletar Serviço Oferecido pelo Provedor</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`DELETE /providers/:providerId/services/:id`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`void`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Upload de Avatar</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /verification/upload-avatar`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`FormData` / `UploadResponseDto`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Upload de Documento (Frente/Verso)</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /verification/upload-document/:type`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`FormData` / `UploadResponseDto`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Upload de Selfie com Documento</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /verification/upload-selfie`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`FormData` / `UploadResponseDto`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Avançar Status de Verificação</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /verification/advance-status`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`{}` / `{ message: string }`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Informações de Verificação</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /verification/status/:providerId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ProviderVerificationInfo`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Métricas de Performance</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /analytics/performance/:providerId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PerformanceMetrics`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Insights de Negócio</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /analytics/business/:providerId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`BusinessInsights`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Sugestões Inteligentes (IA)</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /suggestions/provider/:providerId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`SmartSuggestion[]`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Insights de Clientes (IA)</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /insights/customer/:providerId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`CustomerInsight`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Status de Conformidade</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /compliance/status/:providerId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ComplianceStatus`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Requisitos Legais</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /compliance/requirements`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`LegalRequirement[]`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Upload de Documento de Conformidade</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /compliance/upload`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`FormData` / `void`</td>
</tr>
<tr style="background-color: #f2f2f2;">
<td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Fluxo Comum (Cliente e Provedor)</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Listar Meus Agendamentos</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /bookings/me`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`BookingDetails[]`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Detalhes do Agendamento</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /bookings/:id`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`BookingDetails`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Atualizar Status do Agendamento</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /bookings/:id/status`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UpdateBookingStatusDto` / `BookingDetails`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Cancelar Agendamento</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /bookings/:id/cancel`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`BookingDetails`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Verificar Agendamento Ativo para Chat</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /bookings/check-active-chat/:clientId/:providerId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`{ canChat: boolean; bookingId?: string }`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Encontrar ou Criar Chat</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /chat/find-or-create/provider/:providerId/client/:clientId`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ChatDetails`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Mensagens de Chat</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /chat/:chatId/messages`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GetMessagesQuery` / `Message[]`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Enviar Mensagem de Chat</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /chat/:chatId/messages`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`SendMessageDto` / `Message`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Listar Minhas Conversas de Chat</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /chat/me/conversations`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ConversationItem[]`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Listar Minhas Notificações</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /notifications/me`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`NotificationEntity[]`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Marcar Notificação como Lida</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /notifications/:id/mark-as-read`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`MarkAsReadDto` / `NotificationEntity`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Marcar Todas Notificações como Lidas</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /notifications/me/mark-as-read`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`MessageResponseDto`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Deletar Notificação</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`DELETE /notifications/:id`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`void`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Enviar Avaliação</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /reviews`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`SubmitReviewDto` / `ReviewEntity`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Análise Detalhada de Avaliações</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /reviews/provider/:providerId/breakdown`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ReviewAnalytics`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Sugestões Inteligentes de Avaliações</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /reviews/provider/:providerId/suggestions`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`string[]`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Reportar Disputa</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /bookings/:id/dispute`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ReportDisputeDto` / `DisputeResponse`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Disputa por Agendamento</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /bookings/:id/dispute`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`DisputeResponse`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Reportar Pânico</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /safety/panic`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`ReportPanicDto` / `MessageResponse`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Reportar Incidente</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /safety/incident`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`IncidentReportDto` / `Incident`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Listar Meus Incidentes</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /safety/me/incidents`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`Incident[]`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter FAQs</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /faqs`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`FAQItem[]`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Ofertas</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /offers`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`Offer[]`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Detalhes da Oferta</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /offers/:id`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`Offer`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Validar Sessão</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /auth/validate-session`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`{ valid: boolean }`</td>
</tr>
<tr style="background-color: #f9f9f9;">
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Alertas de Segurança</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /security/alerts`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`SecurityAlert[]`</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Reportar Atividade Suspeita</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /security/report`</td>
<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`{ activity: string; details: any }` / `void`</td>
</tr>
</tbody>
</table>

</div>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-estrutura-do-projeto" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📁 Estrutura do Projeto</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 20px;">

O projeto LimpeJá é um monorepo, contendo pastas para o frontend (`LimpeJaApp/`) e para o backend (`backend-LimpeJá/`).

</p>

<div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
<h3 id="frontend-folder-structure" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Frontend Folder Structure</h3>
<pre style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; color: #34495e;"><code>LimpeJáApp/
├── app/
│ ├── (auth)/ # Authentication Flow
│ │ ├── client-register.tsx
│ │ ├── forgot-password.tsx
│ │ ├── _layout.tsx
│ │ ├── login.tsx
│ │ ├── provider-register/ # Provider Registration Steps
│ │ │ ├── _layout.tsx
│ │ │ ├── index.tsx
│ │ │ ├── personal-details.tsx
│ │ │ ├── service-details.tsx
│ │ │ └── verify-account.tsx # Account verification flow (documents, selfie)
│ │ └── register-options.tsx
│ ├── (client)/ # Client Functionalities
│ │ ├── bookings/ # Client Appointments
│ │ │ ├── [bookingId].tsx
│ │ │ ├── index.tsx
│ │ │ ├── schedule-service.tsx
│ │ │ └── success.tsx
│ │ ├── explore/ # Explore Services/Professionals
│ │ │ ├── [providerId].tsx
│ │ │ ├── index.tsx
│ │ │ ├── all-categories.tsx
│ │ │ ├── all-nearby-providers.tsx
│ │ │ ├── search-results.tsx
│ │ │ └── services-by-category.tsx
│ │ ├── messages/ # Client Messages
│ │ │ ├── [chatId].tsx
│ │ │ └── index.tsx
│ │ ├── missions/ # Client Missions (Gamification)
│ │ │ └── index.tsx
│ │ └── profile/ # Client Profile
│ │ │ ├── edit.tsx
│ │ │ └── index.tsx
│ ├── (common)/ # Common Functionalities (client and provider)
│ │ ├── feedback/ # Submit Reviews/Feedback
│ │ │ └── [targetId].tsx
│ │ ├── help.tsx
│ │ ├── _layout.tsx
│ │ ├── notifications.tsx
│ │ ├── privacy.tsx
│ │ ├── settings.tsx
│ │ └── terms.tsx
│ ├── (provider)/ # Provider Functionalities
│ │ ├── dashboard.tsx
│ │ ├── earnings.tsx
│ │ ├── _layout.tsx
│ │ ├── messages/ # Provider Messages
│ │ │ ├── [chatId].tsx
│ │ │ └── index.tsx
│ │ ├── profile/ # Provider Profile
│ │ │ ├── edit-services.tsx
│ │ │ └── index.tsx
│ │ └── schedule/ # Provider Schedule/Availability
│ │ ├── index.tsx
│ │ └── manage-availability.tsx
│ ├── _layout.tsx # Root layout for the entire app
│ ├── +not-found.tsx
│ ├── index.tsx
│ └── welcome.tsx
├── assets/ # Static resources (fonts, images, lottie animations)
├── components/ # Truly reusable and atomic UI components (global)
│ ├── auth/
│ ├── client/
│ ├── common/
│ ├── provider/
│ └── ui/
├── config/ # App configuration (Firebase, etc.)
├── constants/
│ ├── Colors.ts # Centralized color palette for theming
│ ├── queryKeys.ts # Keys for TanStack Query caching
│ ├── routes.ts # Type-safe route definitions for navigation
│ ├── strings.ts # Localization strings
│ └── theme.ts # Theme definitions (light/dark, sizes, fonts)
├── contexts/
│ ├── AppContext.tsx # Global app settings (theme, notifications)
│ ├── AuthContext.tsx # Global authentication state and functions
│ └── ProviderRegistrationContext.tsx # State for multi-step provider registration
├── hooks/ # Custom React hooks
├── services/ # API service calls to backend
│ ├── api.ts # Axios instance with interceptors
│ ├── analyticsService.ts
│ ├── aiSuggestionsService.ts
│ ├── authService.ts
│ ├── bookingService.ts
│ ├── chatService.ts
│ ├── clientService.ts
│ ├── complianceService.ts
│ ├── couponService.ts
│ ├── dashboardService.ts
│ ├── disputeService.ts
│ ├── earningService.ts
│ ├── faqService.ts
│ ├── guaranteeService.ts
│ ├── missionService.ts
│ ├── notificationService.ts
│ ├── offerService.ts
│ ├── paymentService.ts
│ ├── providerService.ts
│ ├── referralService.ts
│ ├── reviewService.ts
│ ├── safetyService.ts
│ ├── securityService.ts
│ ├── subscriptionService.ts
│ ├── uploadService.ts
│ └── userService.ts
├── types/ # TypeScript interfaces and DTOs (aligned with backend)
│ ├── backend/
│ │ ├── auth.ts
│ │ ├── bookings.ts
│ │ ├── chat.ts
│ │ ├── clients.ts
│ │ ├── coupons.ts
│ │ ├── dashboard.ts
│ │ ├── disputes.ts
│ │ ├── earning.ts
│ │ ├── faqs.ts
│ │ ├── guarantee.ts
│ │ ├── mission.ts
│ │ ├── notifications.ts
│ │ ├── offers.ts
│ │ ├── payments.ts
│ │ ├── provider-service.ts
│ │ ├── providers.ts
│ │ ├── referrals.ts
│ │ ├── reviews.ts
│ │ ├── safety.ts
│ │ ├── search.ts
│ │ ├── services.ts
│ │ ├── subscriptions.ts
│ │ ├── upload.ts
│ │ ├── users.ts
│ │ └── verification.ts
│ └── navigation.ts
├── utils/ # Utility functions (helpers, permissions, storage)
├── .env
├── .gitignore
├── app.json
├── babel.config.js
├── eas.json
├── eslint.config.js
├── expo-env.d.ts
├── LICENSE
├── metro.config.js
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json</code></pre>
</div>
<div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
<h3 id="backend-folder-structure" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Backend Folder Structure</h3>
<pre style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; color: #34495e;"><code>backend-LimpeJá/
├── dist/
├── node_modules/
├── prisma/
│ ├── migrations/
│ └── schema.prisma # Definição do modelo de dados
├── src/
│ ├── app.controller.ts
│ ├── app.module.ts
│ ├── app.service.ts
│ ├── analytics/ # Módulo de Análises e Insights
│ │ ├── dto/
│ │ ├── analytics.controller.ts
│ │ ├── analytics.module.ts
│ │ └── analytics.service.ts
│ ├── ai-suggestions/ # Módulo de Sugestões Inteligentes (IA)
│ │ ├── dto/
│ │ ├── ai-suggestions.controller.ts
│ │ ├── ai-suggestions.module.ts
│ │ └── ai-suggestions.service.ts
│ ├── auth/ # Autenticação e Autorização
│ │ ├── decorators/
│ │ ├── dto/
│ │ ├── guards/
│ │ ├── strategies/
│ │ ├── auth.controller.ts
│ │ ├── auth.module.ts
│ │ └── auth.service.ts
│ ├── availability/ # Disponibilidade de Prestadores
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── availability.controller.ts
│ │ ├── availability.module.ts
│ │ └── availability.service.ts
│ ├── bookings/ # Agendamentos
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── bookings.controller.ts
│ │ ├── bookings.module.ts
│ │ └── bookings.service.ts
│ ├── cache/ # Gerenciamento de Cache
│ │ ├── cache.module.ts
│ │ └── cache.service.ts
│ ├── chat/ # Comunicação em Tempo Real (Chat)
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── gateway/
│ │ ├── chat.controller.ts
│ │ ├── chat.module.ts
│ │ └── chat.service.ts
│ ├── clients/ # Gerenciamento de Clientes
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── clients.controller.ts
│ │ ├── clients.module.ts
│ │ └── clients.service.ts
│ ├── common/ # Componentes Comuns (Pipes, Filters, DTOs, Enums)
│ │ ├── constants/
│ │ ├── decorators/
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── filters/
│ │ ├── interceptors/
│ │ ├── pipes/
│ │ └── services/
│ ├── compliance/ # Conformidade e LGPD
│ │ ├── dto/
│ │ ├── compliance.controller.ts
│ │ ├── compliance.module.ts
│ │ └── compliance.service.ts
│ ├── config/ # Configuração da Aplicação
│ │ ├── config.module.ts
│ │ ├── configuration.ts
│ │ └── validation-schema.ts
│ ├── coupons/ # Cupons de Desconto
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── coupons.controller.ts
│ │ ├── coupons.module.ts
│ │ └── coupons.service.ts
│ ├── dashboard/ # Painel de Provedor
│ │ ├── dto/
│ │ ├── dashboard.controller.ts
│ │ ├── dashboard.module.ts
│ │ └── dashboard.service.ts
│ ├── disputes/ # Gerenciamento de Disputas
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── dispute.controller.ts
│ │ ├── dispute.module.ts
│ │ └── dispute.service.ts
│ ├── earnings/ # Ganhos de Provedores
│ │ ├── dto/
│ │ ├── earnings.controller.ts
│ │ ├── earnings.module.ts
│ │ └── earnings.service.ts
│ ├── email/ # Serviço de E-mail
│ │ ├── email.module.ts
│ │ └── email.service.ts
│ ├── faqs/ # Perguntas Frequentes
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── faqs.controller.ts
│ │ ├── faqs.module.ts
│ │ └── faqs.service.ts
│ ├── geocoding/ # Serviço de Geocodificação
│ │ ├── dto/
│ │ ├── geocoding.module.ts
│ │ └── geocoding.service.ts
│ ├── guarantee/ # Garantia de Serviço
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── guarantee.controller.ts
│ │ ├── guarantee.module.ts
│ │ └── guarantee.service.ts
│ ├── loyalty/ # Programa de Fidelidade
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── loyalty.controller.ts
│ │ ├── loyalty.module.ts
│ │ └── loyalty.service.ts
│ ├── missions/ # Gamificação e Recompensas (Missões)
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── missions.controller.ts
│ │ ├── missions.module.ts
│ │ └── missions.service.ts
│ ├── notifications/ # Notificações
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── notifications.controller.ts
│ │ ├── notifications.module.ts
│ │ └── notifications.service.ts
│ ├── offers/ # Ofertas Promocionais
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── offers.controller.ts
│ │ ├── offers.module.ts
│ │ └── offers.service.ts
│ ├── payments/ # Pagamentos
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── payments.controller.ts
│ │ ├── payments.module.ts
│ │ └── payments.service.ts
│ ├── pricing/ # Precificação Dinâmica
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── pricing.controller.ts
│ │ ├── pricing.module.ts
│ │ └── pricing.service.ts
│ ├── prisma/ # Módulo Prisma (ORM)
│ │ ├── prisma.module.ts
│ │ └── prisma.service.ts
│ ├── provider-services/ # Serviços Oferecidos por Prestadores
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── provider-services.controller.ts
│ │ ├── provider-services.module.ts
│ │ └── provider-services.service.ts
│ ├── providers/ # Gerenciamento de Prestadores
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── providers.controller.ts
│ │ ├── providers.module.ts
│ │ └── providers.service.ts
│ ├── queues/ # Filas de Processamento Assíncrono
│ │ ├── queues.module.ts
│ │ ├── queues.service.ts
│ │ └── workers/ # Workers (ex: notification.worker.ts, verification.worker.ts)
│ ├── ranking/ # Ranqueamento de Prestadores
│ │ ├── dto/
│ │ ├── ranking.controller.ts
│ │ ├── ranking.module.ts
│ │ └── ranking.service.ts
│ ├── referrals/ # Indicações
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── referrals.controller.ts
│ │ ├── referrals.module.ts
│ │ └── referrals.service.ts
│ ├── reviews/ # Avaliações
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── reviews.controller.ts
│ │ ├── reviews.module.ts
│ │ └── reviews.service.ts
│ ├── rewards/ # Recompensas
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── rewards.controller.ts
│ │ ├── rewards.module.ts
│ │ └── rewards.service.ts
│ ├── safety/ # Segurança e Incidentes (inclui Incidentes e Alertas de Pânico)
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── safety.controller.ts
│ │ ├── safety.module.ts
│ │ └── safety.service.ts
│ ├── search/ # Busca de Serviços e Provedores
│ │ ├── dto/
│ │ ├── search.controller.ts
│ │ ├── search.module.ts
│ │ └── search.service.ts
│ ├── services/ # Catálogo de Serviços Base
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── services.controller.ts
│ │ ├── services.module.ts
│ │ └── services.service.ts
│ ├── sms/ # Serviço de SMS
│ │ ├── sms.module.ts
│ │ └── sms.service.ts
│ ├── subscriptions/ # Assinaturas e Agendamentos Recorrentes
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── subscriptions.controller.ts
│ │ ├── subscriptions.module.ts
│ │ └── subscriptions.service.ts
│ ├── users/ # Gerenciamento de Usuários
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── users.controller.ts
│ │ ├── users.module.ts
│ │ └── users.service.ts
│ ├── verification/ # Validação de Identidade (Provedores)
│ │ ├── dto/
│ │ ├── entities/
│ │ ├── document-processing.service.ts
│ │ ├── verification.controller.ts
│ │ ├── verification.module.ts
│ │ └── verification.service.ts
│ └── shared/ # Componentes compartilhados entre módulos (enums, types, interfaces)
│     ├── enums/
│     ├── interfaces/
│     └── types/
├── app.controller.spec.ts
├── app.service.ts
├── main.ts
├── instrument.ts # Para Sentry
├── .env
├── .env.example
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── nest-cli.json
├── package-lock.json
├── package.json
├── README.md
├── src.rar
├── tsconfig.build.json
└── tsconfig.json</code></pre>
</div>

<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
<h2 id="getting-started" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🚀 Começando (Configuração para Desenvolvimento Local)</h2>
<p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
Para configurar e rodar o projeto em seu ambiente de desenvolvimento local, siga os passos abaixo. Esta configuração é otimizada para exploração do código e desenvolvimento, não para implantação em produção.
</p>
<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
<h3 id="prerequisites" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Pré-requisitos</h3>
<p style="color: #555; line-height: 1.6;">Certifique-se de ter as seguintes ferramentas instaladas:</p>
<ul style="list-style-type: disc; padding-left: 20px; color: #555; line-height: 1.6;">
<li style="margin-bottom: 5px;"><a href="https://nodejs.org/en/download/" style="color: #3498db; text-decoration: none;">Node.js</a> (versão LTS recomendada)</li>
<li style="margin-bottom: 5px;"><a href="https://www.npmjs.com/get-npm" style="color: #3498db; text-decoration: none;">npm</a> ou <a href="https://yarnpkg.com/getting-started/install" style="color: #3498db; text-decoration: none;">Yarn</a></li>
<li style="margin-bottom: 5px;"><a href="https://git-scm.com/downloads" style="color: #3498db; text-decoration: none;">Git</a></li>
<li style="margin-bottom: 5px;"><a href="https://docs.docker.com/get-docker/" style="color: #3498db; text-decoration: none;">Docker</a> (para rodar PostgreSQL localmente em desenvolvimento)</li>
<li style="margin-bottom: 5px;"><a href="https://docs.expo.dev/workflow/expo-cli/" style="color: #3498db; text-decoration: none;">Expo CLI</a> (instale com `npm install -g expo-cli`)</li>
</ul>
</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="instalação" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Instalação</h3>

<ol style="tipo-de-estilo-de-lista: decimal; preenchimento-esquerdo: 20px; cor: #555; altura-da-linha: 1,6;">

<li style="margin-bottom: 10px;"><strong>Clone o repositório:</strong>

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>git clone https://github.com/techleadevelopers/limpe-ja-app.git
cd limpe-ja-app</code></pre>

</li>

<li style="margin-bottom: 10px;"><strong>Instale as dependências do Frontend:</strong>

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd LimpeJaApp
npm install # ou yarn install
cd ..</code></pre>

</li>

<li style="margin-bottom: 10px;"><strong>Instale as dependências do Backend:</strong>

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd backend-LimpeJá
npm install # ou yarn install
cd ..</code></pre>

</li>

<li style="margin-bottom: 10px;"><strong>Configurar o banco de dados para desenvolvimento (PostgreSQL com Docker):</strong>
    <p style="margin-top: 5px; color: #555;">Esta configuração é para um ambiente de desenvolvimento local. As credenciais de produção e configurações sensíveis são gerenciadas internamente.</p>
<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;">Crie um arquivo `.env` na raiz da pasta `backend-LimpeJá` com as variáveis ​​de ambiente necessárias para o desenvolvimento. Exemplo:

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>DATABASE_URL="postgresql://user:password@localhost:5432/limpeja_dev_db"
JWT_SECRET="seu_segredo_jwt_para_desenvolvimento"
JWT_EXPIRATION_TIME="1h"
PORT=3000
# Outras variáveis de ambiente para serviços externos (se houver)</code></pre>
<p style="margin-top: 5px; color: #e74c3c; font-weight: bold;">⚠️ Importante: Nunca adicione seu arquivo `.env` ao controle de versão (Git). Ele já está incluído no `.gitignore` para sua segurança.</p>
</li>

<li style="margin-bottom: 5px;">Suba o contêiner Docker do PostgreSQL para desenvolvimento:

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>docker-compose up -d postgres # Ou o comando específico para seu docker-compose</code></pre>

</li>

<li style="margin-bottom: 5px;">Execute as migrações do Prisma para criar o esquema do banco de dados de desenvolvimento e gerar o Prisma Client:

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd backend-LimpeJá
npx prisma migrate dev --name init # Use um nome descritivo para sua migração inicial
npx prisma generate
cd ..</code></pre>

</li>

</ul>

</li>

</ol>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="rodando-localmente" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Rodando Localmente (Ambiente de Desenvolvimento)</h3>

<ol style="tipo-de-estilo-de-lista: decimal; preenchimento-esquerdo: 20px; cor: #555; altura-da-linha: 1,6;">

<li style="margin-bottom: 10px;"><strong>Inicie o Backend:</strong>

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd backend-LimpeJá
npm run start:dev # ou yarn start:dev</code></pre>

<p style="margin-top: 5px; color: #555;">O backend estará disponível em `http://localhost:3000` (ou na porta configurada em `.env`). A documentação interativa do Swagger estará em `http://localhost:3000/api`.</p>

</li>

<li style="margin-bottom: 10px;"><strong>Inicie o Frontend:</strong>

<p style="margin-top: 5px; color: #555;">Abra um novo terminal.</p>

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd LimpeJaApp
npx expo start</code></pre>

<p estilo="margem superior: 5px; cor: #555;">

Isso abrirá o Metro Bundler. Você pode escanear o código QR com o aplicativo <a href="https://expo.dev/go" style="color: #3498db; text-decoration: none;">Expo Go</a> no seu celular, ou usar um emulador/simulador <a href="https://docs.expo.dev/workflow/android-studio-emulator/" style="color: #3498db; text-decoration: none;">Android Studio Emulator</a> / <a href="https://docs.expo.dev/workflow/ios-simulator/" style="color: #3498db; text-decoration: none;">iOS Simulator</a>.

</p>

</li>

</ol>

</div>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-gerando-um-apk-para-teste-android" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📱 Gerando um APK para Teste (Android)</h2>

<p style="color: #555; line-height: 1.6; margin-bottom: 15px;">Para gerar um APK de teste para Android, você pode usar o EAS Build, um serviço da Expo para compilação de apps na nuvem.</p>

<ol style="tipo-de-estilo-de-lista: decimal; preenchimento-esquerdo: 20px; cor: #555; altura-da-linha: 1,6;">

<li style="margin-bottom: 10px;">Certifique-se de estar logado no Expo CLI: `expo login`</li>

<li style="margin-bottom: 10px;">Na pasta `LimpeJaApp`, execute:

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>eas build --platform android --profile development</code></pre>

<p style="margin-top: 5px; color: #555;">Este comando iniciará um processo de build na nuvem da Expo, utilizando o perfil `development` configurado no `eas.json` para gerar um APK de teste. Ao final, você receberá um link para baixar o APK diretamente.</p>

</li>

</ol>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-contribuindo" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🤝 Contribuindo</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 15px;">

Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será <strong style="color: #2ecc71;">muito apreciada</strong>.

</p>

<p style="color: #555; altura da linha: 1,6; margem inferior: 15px;">

Se você tem uma sugestão para melhorar este projeto, por favor, faça um fork do repositório e crie um pull request. Você também pode simplesmente abrir uma edição com a tag "melhoria".

Não se esqueça de dar uma estrela ao projeto! Obrigado novamente!

</p>

<ol style="tipo-de-estilo-de-lista: decimal; preenchimento-esquerdo: 20px; cor: #555; altura-da-linha: 1,6;">

<li style="margin-bottom: 10px;">Faça um Fork do Projeto</li>

<li style="margin-bottom: 10px;">Crie seu Feature Branch (`git checkout -b feature/AmazingFeature`)</li>

<li style="margin-bottom: 10px;">Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)</li>

<li style="margin-bottom: 10px;">Enviar para um Branch (`git push origin feature/AmazingFeature`)</li>

<li style="margin-bottom: 10px;">Abra um Pull Request</li>

</ol>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-licença" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📜 Licença</h2>

<p style="color: #555; line-height: 1.6;">

Distribuído sob Licença MIT. Veja `LICENSE.txt` para mais informações.

</p>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-contato" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📞 Contato</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 10px;">

Paulo Silas de Campos Filho/ <a href="https://github.com/techleadevelopers" style="color: #3498db; text-decoration: none;">@techleadevelopers</a> - <a href="mailto:techleadevelopers@gmail.com" style="color: #3498db; text-decoration: none;">techleadevelopers@gmail.com</a>

</p>

<p style="color: #555; line-height: 1.6;">

Link do Projeto: <a href="https://github.com/techleadevelopers/limpe-ja-app" style="color: #3498db; text-decoration: none;">https://github.com/techleadevelopers/limpe-ja-app</a>

</p>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-limpejá-ganhos-nossa-estratégia-de-monetização" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">💰 LimpeJá Ganhos: Nossa Estratégia de Monetização</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 20px;">

O LimpeJá foi concebido para ser uma plataforma que beneficia tanto os clientes em busca de serviços de limpeza de qualidade quanto os profissionais que desejam ampliar sua base de clientes e gerenciar seus serviços de forma eficiente. Nossa estratégia de monetização é transparente e se baseia no sucesso mútuo, inspirada em modelos de marketplace consolidados como o Airbnb, mas aplicada ao universo dos serviços de limpeza. [13, 24, 36, 37, 38, 41]

</p>

<h3 style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Como o LimpeJá Gera Receita:</h3>

<p style="color: #555; altura da linha: 1,6; margem inferior: 15px;">

A principal fonte de receita do LimpeJá virá de uma <strong style="color: #2ecc71;">comissão percentual cobrada sobre o valor de cada serviço de limpeza que é agendado e efetivamente pago através da plataforma.</strong>

</p>

<ol style="tipo-de-estilo-de-lista: decimal; preenchimento-esquerdo: 20px; cor: #555; altura-da-linha: 1,6;">

<li style="margin-bottom: 15px;"><strong>Para o Profissional (Prestador de Serviço):</strong>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;">Ao se cadastrar, o profissional define seus preços para os diferentes tipos de serviço que oferece (ex: por hora, por tipo de limpeza, etc.).</li>

<li style="margin-bottom: 5px;">Quando um cliente contrata e paga por um serviço através do LimpeJá, o valor total é processado pela plataforma.</li>

<li style="margin-bottom: 5px;">O LimpeJá repassa o valor ao profissional, deduzindo uma taxa de serviço (comissão) previamente acordada e transparente. Esta taxa será nossa principal fonte de receita.</li>

<li style="margin-bottom: 5px;"><strong style="color: #2ecc71;">Benefícios para o Profissional:</strong> Acesso a uma ampla base de clientes, ferramentas de gerenciamento de agenda, marketing de plataforma, segurança no recebimento e processamento de pagamentos, suporte.</li>

</ul>

</li>

<li style="margin-bottom: 15px;"><strong>Para o Cliente:</strong>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;">O cliente vê o preço total do serviço (que já inclui a porção do profissional e, implicitamente, a margem que permite a comissão do LimpeJá).</li>

<li style="margin-bottom: 5px;">Em alguns modelos de marketplace, uma pequena taxa de conveniência/serviço pode ser adicionada ao cliente, mas o modelo principal geralmente foca na comissão sobre o valor pago ao prestador. Para o LimpeJá, podemos iniciar focando na comissão sobre o credor para manter a atratividade para o cliente.</li>

<li style="margin-bottom: 5px;"><strong style="color: #3498db;">Benefícios para o Cliente:</strong> Conveniência para encontrar e agenda profissional diversificada, variedade de escolha, sistema de avaliações para confiança, processo de pagamento simplificado e seguro, e a garantia de uma plataforma intermediando o serviço.</li>

</ul>

</li>

<li style="margin-bottom: 15px;"><strong>Estratégia de Cupons (Win-Win-Win):</strong>
    <ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">
        <li style="margin-bottom: 5px;">Para incentivar a aquisição e retenção de clientes, o LimpeJá pode emitir cupons de desconto. Nesses casos, a plataforma <strong style="color: #2ecc71;">absorve o custo do desconto</strong> para o prestador. Isso significa que, mesmo com o cliente usando um cupom, o prestador recebe o valor integral do serviço (menos a comissão padrão do LimpeJá).</li>
        <li style="margin-bottom: 5px;">Para o LimpeJá, o custo do cupom é tratado como Custo de Aquisição de Cliente (CAC), um investimento estratégico para aquisição e retenção de usuários, com um retorno de longo prazo (LTV) significativamente maior.</li>
        <li style="margin-bottom: 5px;">Essa abordagem garante que o ganho do prestador não seja afetado pelo cupom, incentivando o volume de agendamentos e mantendo a proposta de valor de "sem taxas adicionais" para o profissional.</li>
    </ul>
</li>

</ol>

<h3 style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Transparência e Valor:</h3>

<p style="color: #555; line-height: 1.6;">

É crucial que a taxa de comissão seja clara para os profissionais e que o valor oferecido pela plataforma (marketing, base de clientes, ferramentas, segurança) justifique essa taxa. O sucesso do LimpeJá dependerá da criação de um ecossistema de que tanto clientes quanto profissionais vejam vantagens claras em usar a plataforma, resultando em um volume saudável de agendamentos e, consequentemente, receita para o aplicativo.

</p>

<p style="color: #555; line-height: 1.6;">

Este modelo permite que o LimpeJá cresça conforme o volume de transações na plataforma aumente, alinhando nossos ganhos com o sucesso dos profissionais parceiros.

</p>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="️-roadmap-e-próximas-etapas" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🛣️ Roteiro e Próximas Etapas</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 20px;">

O projeto LimpeJá está em um estágio avançado de desenvolvimento, com a maioria dos fluxos essenciais implementados. As próximas etapas focam em aprimoramentos, expansão de funcionalidades e otimização:

</p>

<ol style="tipo-de-estilo-de-lista: decimal; preenchimento-esquerdo: 20px; cor: #555; altura-da-linha: 1,6;">

<li style="margin-bottom: 15px;"><strong>Funcionalidades de Gestão (Admin):</strong>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><strong>Frontend:</strong> Desenvolve interfaces de usuário para POST, PATCH, DELETE em `/services` e `/offers`.</li>

<li style="margin-bottom: 5px;"><strong>Backend:</strong> Expanda a IU para DELETE `/providers/:id` e DELETE `/users/:id`.</li>

</ul>

</li>

<li style="margin-bottom: 15px;"><strong>Aprimoramentos de Funcionalidades Existentes:</strong>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><strong>Backend:</strong>

<ul style="list-style-type: círculo; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;">Cálculo de `walletBalance` para clientes e provedores.</li>

<li style="margin-bottom: 5px;">Implementação de lógica geoespacial para busca avançada de provedores (`sortBy: Distance`, `latitude`, `longitude`, `radius`).</li>

<li style="margin-bottom: 5px;">Refinar transições de status de agendamento.</li>

<li style="margin-bottom: 5px;">Otimização de Query Prisma: Revisar instruções `include` para evitar N+1 e carregamento excessivo.</li>

<li style="margin-bottom: 5px;">Refinamento Contínuo da Documentação Swagger com `@ApiProperty`.</li>

</ul>

</li>

<li style="margin-bottom: 5px;"><strong>Front-end:</strong>

<ul style="list-style-type: círculo; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;">Implementar UI para filtros geoespaciais na busca de provedores.</li>

<li style="margin-bottom: 5px;">Desenvolver UI abrangente para extrair e exibir `GET /reviews` e `GET /reviews/:id`.</li>

<li style="margin-bottom: 5px;">Refletir e gerenciar transições de status de agendamento de forma mais robusta.</li>

</ul>

</li>

</ul>

</li>

<li style="margin-bottom: 15px;"><strong>Funcionalidades Estratégicas e de Confiança:</strong>
    <ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">
        <li style="margin-bottom: 5px;"><strong>Implementação Completa do Módulo de Seguro de Limpeza e Garantia:</strong> Finalizar o fluxo de submissão, investigação e resolução de sinistros (`guarantee` module), com equipe de suporte dedicada. [42, 43, 44, 45]</li>
        <li style="margin-bottom: 5px;"><strong>Expansão do Plano Premium para Clientes:</strong> Desenvolver e promover os benefícios de cupons exclusivos, seguro gratuito, prioridade e suporte premium (`subscriptions` module).</li>
        <li style="margin-bottom: 5px;"><strong>Construção de Comunidade e Experiência Hiper-Localizada:</strong>
            <ul style="list-style-type: círculo; preenchimento esquerdo: 20px; margem superior: 5px;">
                <li style="margin-bottom: 5px;">Aprimorar o Programa de Recompensas e Reconhecimento para Profissionais (Níveis, Selos de Confiança, Badges, Ranking Local) (`loyalty`, `missions`, `rewards` modules). [15, 20, 23, 34, 35]</li>
                <li style="margin-bottom: 5px;">Organizar Eventos e Encontros Locais (workshops, palestras) para fortalecer a comunidade.</li>
                <li style="margin-bottom: 5px;">Desenvolver Conteúdo Educacional (blog/vídeos) para clientes e profissionais.</li>
            </ul>
        </li>
        <li style="margin-bottom: 5px;"><strong>Excelência no Atendimento e Gestão de Incidentes:</strong>
            <ul style="list-style-type: círculo; preenchimento esquerdo: 20px; margem superior: 5px;">
                <li style="margin-bottom: 5px;">Implementar Sistema de Disputa e Mediação no aplicativo, com fluxo claro para reportar e acompanhar (`disputes` module).</li>
                <li style="margin-bottom: 5px;">Garantir Comunicação Transparente com notificações detalhadas sobre status de serviço, pagamento e incidentes (`safety` module).</li>
            </ul>
        </li>
        <li style="margin-bottom: 5px;"><strong>Fortalecimento da Confiança em Ambas as Partes:</strong>
            <ul style="list-style-type: círculo; preenchimento esquerdo: 20px; margem superior: 5px;">
                <li style="margin-bottom: 5px;">Desenvolver Sistema de Avaliação Mútua Robusto (clientes avaliam provedores, provedores avaliam clientes).</li>
                <li style="margin-bottom: 5px;">Publicar Relatórios de Segurança e Transparência (verificações, incidentes resolvidos) (`compliance`, `analytics` modules).</li>
            </ul>
        </li>
        <li style="margin-bottom: 5px;"><strong>Segurança Aprimorada:</strong> Implementar autenticação biométrica (Face ID/Touch ID) (`expo-local-authentication`), armazenamento seguro de tokens (`expo-secure-store`) e alertas de segurança (`security` module). [1, 5, 6, 11, 14, 16, 19, 21, 22, 26]</li>
        <li style="margin-bottom: 5px;"><strong>Análises e Insights de Negócio:</strong> Expandir o módulo de `analytics` para fornecer relatórios detalhados e o módulo de `ai-suggestions` para sugestões personalizadas de otimização.</li>
    </ul>
</li>

<li style="margin-bottom: 15px;"><strong>Integrações Futuras:</strong>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><strong>Backend:</strong>

<ul style="list-style-type: círculo; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;">Substitua uma simulação PIX por uma integração real com um gateway de pagamento (por exemplo, Stripe, PagSeguro, Mercado Pago).</li>

<li style="margin-bottom: 5px;">Integrar com serviços de notificação push (por exemplo, Firebase Cloud Messaging).</li>

<li style="margin-bottom: 5px;">Implementar persistência de conversas de chat e funcionalidades como "digitando...", "visto por último".</li>

<li style="margin-bottom: 5px;">Integração Real com APIs Externas para Verificação de Antecedentes (ex: ClearSale, Serasa) e Processamento de Documentos (OCR, comparação facial, prova de vida).</li>

<li style="margin-bottom: 5px;">Internacionalização (i18n): Suporte a múltiplos idiomas.</li>

</ul>

</li>

<li style="margin-bottom: 5px;"><strong>Front-end:</strong>

<ul style="list-style-type: círculo; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;">Integrar com um gateway de pagamento real.</li>

<li style="margin-bottom: 5px;">Implementar notificações push.</li>

<li style="margin-bottom: 5px;">Aprimorar o sistema de mensagens com persistência e indicadores de status.</li>

</ul>

</li>

</ul>

</li>

</ol>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-recursos-e-suporte" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📚 Recursos e Suporte</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 20px;">

Para informações fornecidas e suporte sobre as tecnologias e o ecossistema do projeto LimpeJá, consulte os seguintes recursos oficiais:

</p>

<ul style="list-style-type: none; preenchimento: 0; cor: #555; altura da linha: 1,6;">

<li style="margin-bottom: 8px;"><a href="https://docs.nestjs.com/" style="color: #3498db; text-decoration: none;">Documentação NestJS</a></li>

<li style="margin-bottom: 8px;"><a href="https://reactnative.dev/docs" style="color: #3498db; text-decoration: none;">Documentação React Native</a></li>

<li style="margin-bottom: 8px;"><a href="https://docs.expo.dev/router/introduction/" style="color: #3498db; text-decoration: none;">Documentação Expo Router</a></li>

<li style="margin-bottom: 8px;"><a href="https://www.prisma.io/docs/" style="color: #3498db; text-decoration: none;">Documentação Prisma ORM</a></li>

<li style="margin-bottom: 8px;"><a href="https://socket.io/docs/" style="color: #3498db; text-decoration: none;">Documentação Socket.IO</a></li>

<li style="margin-bottom: 8px;"><a href="http://www.passportjs.org/" style="color: #3498db; text-decoration: none;">Documentação Passport.js</a></li>

<li style="margin-bottom: 8px;"><a href="https://swagger.io/specification/" style="color: #3498db; text-decoration: none;">Documentação OpenAPI (Swagger)</a></li>

<li style="margin-bottom: 8px;"><a href="https://joi.dev/api/" style="color: #3498db; text-decoration: none;">Documentação Joi (Validação)</a></li>

<li style="margin-bottom: 8px;"><a href="https://www.postgresql.org/docs/" style="color: #3498db; text-decoration: none;">Documentação PostgreSQL</a></li>

<li style="margin-bottom: 8px;"><a href="https://docs.expo.dev/" style="color: #3498db; text-decoration: none;">Documentação Expo</a></li>

<li style="margin-bottom: 8px;"><a href="https://tanstack.com/query/latest/docs/react/overview" style="color: #3498db; text-decoration: none;">Documentação TanStack Query</a></li>

<li style="margin-bottom: 8px;"><a href="https://docs.expo.dev/versions/latest/sdk/local-authentication/" style="color: #3498db; text-decoration: none;">Documentação Expo LocalAuthentication</a></li>

<li style="margin-bottom: 8px;"><a href="https://docs.expo.dev/versions/latest/sdk/securestore/" style="color: #3498db; text-decoration: none;">Documentação Expo SecureStore</a></li>

</ul>

</div>