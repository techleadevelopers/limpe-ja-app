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

<li style="margin-bottom: 5px;"><a href="#estrutura-de-pastas-frontend" style="color: #2980b9; text-decoration: none;">Estrutura de Pastas (Frontend)</a></li>

<li style="margin-bottom: 5px;"><a href="#estrutura-de-pastas-backend" style="color: #2980b9; text-decoration: none;">Estrutura de Massas (Backend)</a></li>

</ul>

</li>

<li style="margin-bottom: 8px;"><a href="#-começando-getting-started" style="color: #3498db; text-decoration: none; font-weight: bold;">🚀 Começando</a>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;"><a href="#pré-requisitos" style="color: #2980b9; text-decoration: none;">Pré-requisitos</a></li>

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

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Navegação:</strong> <a href="https://docs.expo.dev/router/introduction/" style="color: #3498db; text-decoration: none;">Expo Router</a> - Sistema de roteamento baseado em arquivos para aplicativos Expo e React Native, oferecendo navegação robusta, tipada e com suporte a deep linking.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Gerenciamento de Estado Global:</strong> React Context API - Para gerenciar estados compartilhados, como o contexto de autenticação (`AuthContext`), de forma eficiente, evitando 'perfuração de prop' e centralizando dados.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Tipagem:</strong> <a href="https://www.typescriptlang.org/docs/" style="color: #3498db; text-decoration: none;">TypeScript</a> - Essencial para a segurança e consistência dos dados, especialmente na integração com o backend e para escalabilidade do desenvolvimento.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Estilização:</strong> StyleSheet do React Native, com temas sonoros (claro/escuro) gerenciados via `Colors.ts` e `theme.ts` para consistência visual.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Animações:</strong> React Native Animated API para transições suaves e `react-native-reanimated` para animações complexas e performáticas, incluindo efeitos visuais com `expo-linear-gradient` e `expo-blur`.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Ícones:</strong> `@expo/vector-icons` e `react-native-svg` para ícones personalizados e animados.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Utilitários Expo:</strong> `expo-image-picker`, `expo-clipboard`, `react-native-safe-area-context`, `expo-haptics` (para feedback tátil).</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Requisições HTTP:</strong> <a href="https://axios-http.com/" style="color: #3498db; text-decoration: none;">Axios</a> - Para chamadas HTTP à API backend, configuradas com interceptores para tratamento de autenticação e erros.</li>

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

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Framework:</strong> <a href="https://docs.nestjs.com/" style="color: #e74c3c; text-decoration: none;">NestJS</a> (Node.js) - Escolha estratégica por sua modularidade, forte tipagem (TypeScript), aderência a padrões de arquitetura (DDD, MVC-like) e um ecossistema robusto para construir APIs escaláveis ​​e manuteníveis.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Linguagem:</strong> TypeScript - Oferece segurança de tipo em todas as camadas, desde os DTOs até a interação com o banco de dados via ORM, melhorando a manutenibilidade e reduzindo erros no tempo de execução.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Banco de Dados:</strong> <a href="https://www.postgresql.org/docs/" style="color: #e74c3c; text-decoration: none;">PostgreSQL</a> - Um sistema de dados relacionado a banco robusto, bastante e escalável, ideal para dados estruturados e relações complexas.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">ORM:</strong> <a href="https://www.prisma.io/docs/" style="color: #e74c3c; text-decoration: none;">Prisma</a> - ORM moderno e type-safe que simplifica a interação com o banco de dados, oferece migrações declarativas e garantir a segurança de tipo nas operações de persistência.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Autenticação:</strong> <a href="https://jwt.io/introduction/" style="color: #e74c3c; text-decoration: none;">JWT (JSON Web Tokens)</a> com <a href="http://www.passportjs.org/" style="color: #e74c3c; text-decoration: none;">Passport.js</a> - Para autenticação stateless e segura, permitindo controle de acesso baseado em papéis (RBAC) e protegendo rotas sensíveis.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Comunicação em Tempo Real:</strong> <a href="https://socket.io/docs/" style="color: #e74c3c; text-decoration: none;">Socket.IO</a> - Para comunicação bidirecional em tempo real, fundamental para funcionalidades como chat e notificações instantâneas.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Validação:</strong> <a href="https://github.com/typestack/class-validator" style="color: #e74c3c; text-decoration: none;">Class-validator</a> e <a href="https://github.com/typestack/class-transformer" style="color: #e74c3c; text-decoration: none;">Class-transformer</a> - Para validação declarativa de DTOs, garantindo que os dados de entrada da API estejam sempre no formato e com os valores esperados.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">API de documentação:</strong> <a href="https://swagger.io/specification/" style="color: #e74c3c; text-decoration: none;">Swagger (OpenAPI)</a> - Para documentação automática e interativa da API, facilitando o consumo por desenvolvedores de frontend e a utilização da API.</li>

<li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Variáveis ​​de Ambiente:</strong> `@nestjs/config` com <a href="https://joi.dev/api/" style="color: #e74c3c; text-decoration: none;">Joi</a> - Para gerenciamento seguro e validação rigorosas das configurações de ambiente, garantindo a integridade da aplicação.</li>

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

<li style="margin-bottom: 5px;"><strong>Enums:</strong> `UserRole` (CLIENTE, PROVEDOR, ADMIN, SISTEMA), `VerificationStatus` (REVISÃO_INICIAL_PENDENTE, APROVADO, REJEITADO, etc.), `BookingStatus` (PENDENTE, CONFIRMADO, CONCLUÍDO, CANCELADO, etc.), `TransactionType` (PAGAMENTO, SAQUE, COMISSÃO).</li>

<li style="margin-bottom: 5px;"><strong>Modelos Principais (Tabelas):</strong>

<ul style="list-style-type: círculo; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;">`User`: Entidade base para todos os usuários, com `email`, `passwordHash`, `role` e `avatarUrl`.</li>

<li style="margin-bottom: 5px;">`Cliente`: ​​Detalhes específicos para clientes (`fullName`, `phone`).</li>

<li style="margin-bottom: 5px;">`Provider`: Detalhes específicos para provedores (`fullName`, `cpf`, `dateOfBirth`, `verificationStatus`, `pixKey`).</li>

<li style="margin-bottom: 5px;">`Endereço`: Informações de endereço, usadas por clientes, provedores e agendamentos.</li>

<li style="margin-bottom: 5px;">`Serviço`: Tipos de serviços que podem ser oferecidos (`nome`, `preço`, `icon`).</li>

<li style="margin-bottom: 5px;">`ProviderService`: Um serviço específico oferecido por uma operadora, com `price` e `durationMinutes`.</li>

<li style="margin-bottom: 5px;">`Booking`: Representa um agendamento de serviço, incluindo `totalPrice` e um `addressId` específico para o agendamento.</li>

<li style="margin-bottom: 5px;">`Chat` e `Message`: Para comunicação em tempo real entre usuários.</li>

<li style="margin-bottom: 5px;">`Notificação`: Armazena notificações para usuários.</li>

<li style="margin-bottom: 5px;">`Review`: Avaliações de serviços, vinculadas a um `Booking`.</li>

<li style="margin-bottom: 5px;">`Oferta`: Gerencia ofertas e promoções.</li>

<li style="margin-bottom: 5px;">`Transaction`: Registra todas as transações financeiras, utilizando `Prisma.Decimal` para garantir a rentabilidade monetária.</li>

<li style="margin-bottom: 5px;">`Disponibilidade`: Define a disponibilidade de horários dos provedores.</li>

</ul>

</li>

<li style="margin-bottom: 5px;"><strong>Precisão Monetária:</strong> O uso do tipo `Decimal` do Prisma (`@db.Decimal(10, 2)`) para campos como `price`, `totalPrice` e `amount` garante precisão exata em cálculos financeiros, evitando erros de arredondamento.</li>

</ul>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="princípios-de-design-e-padrões-de-projeto" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Princípios de Design e Padrões de Projeto</h3>

<p style="color: #555; line-height: 1.6;">O projeto LimpeJá segue princípios de design e padrões de projeto que promovem qualidade, manutenibilidade e escalabilidade em todo o stack.</p>

<ul style="list-style-type: none; preenchimento: 0; cor: #555; altura da linha: 1,6;">

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Arquitetura em Camadas:</strong> Tanto o frontend quanto o backend seguem uma arquitetura em camadas claras (Controladores/Telas, Serviços/Lógica de Negócios, Acesso a Dados), promovendo a separação de preocupações.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Data Transfer Objects (DTOs):</strong> Utilização rigorosa de DTOs para validação de entrada (com `class-validator` e `class-transformer`) e tipagem de saída em todas as interações API, garantindo a integridade e segurança dos dados.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Autenticação e Autorização:</strong> Implementação robusta de JWT e RBAC (Role-Based Access Control) para proteger rotas e recursos, com `Guards` e `Strategies` no NestJS.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Tratamento Centralizado de Erros:</strong> O `HttpExceptionFilter` do backend padroniza as respostas de erro, permitindo que o frontend interprete e exiba mensagens significativas ao usuário via `Alert.alert` ou `ToastMessage`.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Modularidade:</strong> Módulos de dados no backend (NestJS) e componentes reutilizáveis ​​no frontend (React Native) garantem organização, testabilidade e reutilização de código.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Segurança de Tipos (Type-Safety):</strong> O uso extensivo de TypeScript em ambas as camadas, complementado pelo Prisma ORM no backend, garante a consistência e integridade dos dados em tempo de construção e execução.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Injeção de Dependência:</strong> Sem backend (NestJS), facilita a testabilidade e modularidade dos serviços, seguindo os princípios SOLID.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Componentização (Frontend):</strong> Divisão da UI em componentes pequenos e reutilizáveis ​​(`components/ui/`), promovendo reutilização e manutenibilidade.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Gerenciamento de Estado:</strong> Combinação de Hooks do React (`useState`, `useEffect`, `useRef`) para estado local e Context API (`AuthContext`, `AppContext`, `ProviderRegistrationContext`) para estado global no frontend.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Navegação Declarativa:</strong> Uso do Expo Router para uma gestão de rotas intuitiva e baseada em arquivos, com layouts aninhados.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Animações e Responsividade:</strong> Aplicação de animações fluidas (`react-native-reanimated`, React Native Animated API) e design responsivo para aprimorar a experiência do usuário em diferentes dispositivos, com `useNativeDriver: true` para otimização.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Gerenciamento de Dados e Fluxo de Informações:</strong> O frontend segue o padrão Unidirecional do React, com dados fluindo de contextos globais e estado local, e interações com o backend via camada de serviços tipada (`services/`).</li>

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

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Padrão de Comunicação:</strong> Predominantemente APIs RESTful (HTTP) para operações transacionais e de consulta, e WebSockets para funcionalidades de comunicação em tempo real (chat, notificações).</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Autenticação JWT:</strong> O `AuthContext` no frontend gerencia o ciclo de vida do token JWT, obtido via `POST /auth/login`. Este token é armazenado de forma segura no AsyncStorage e anexado automaticamente como `Authorization: Bearer <token>` em todas as requisições protegidas ao backend.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Consistência de Dados (DTOs e Interfaces TypeScript):</strong> Um alinhamento específico é reservado entre as interfaces TypeScript do frontend (localizadas em `LimpeJaApp/src/types/backend/`) e os DTOs definidos no backend. Isso garante a validação e consistência da estrutura de dados em ambas as camadas, minimizando erros de tipagem e facilitando a colaboração.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Tratamento de Erros:</strong> O `HttpExceptionFilter` do backend padroniza as respostas de erro, permitindo que o frontend interprete e exiba mensagens significativas ao usuário. As chamadas de API no frontend incluem blocos `try-catch` para lidar com erros de rede e respostas de erro da API.</li>

<li style="margin-bottom: 8px;"><strong style="color: #3498db;">Serviços Centralizados:</strong> Chamadas de API são encapsuladas em serviços centralizados (`authService.ts`, `clientService.ts`, `providerService.ts`) que utilizam o Axios, promovendo reutilização de código e padronização.</li>

</ul>

<div style="cor de fundo: #f8f9fa; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem superior: 20px;">

<h3 id="mapeamento-de-rotas-da-api" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Mapeamento de Rotas da API</h3>

<p style="color: #555; line-height: 1.6; margin-bottom: 15px;">Para uma lista completa de endpoints e DTOs, consulte uma documentação detalhada do backend, que pode ser acessada via Swagger UI em `http://localhost:3000/api` (após iniciar o backend). Abaixo alguns exemplos de interações:</p>

<table style="largura: 100%; border-collapse: recolher; margem inferior: 20px;">

<cabeça>

<tr style="cor de fundo: #e0e0e0; cor: #34495e;">

<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Fluxo/Tela do Frontend</th>

<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Endpoint do Backend (Método HTTP, Caminho)</th>

<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">DTOs (Requisição/Resposta)</th>

</tr>

</thead>

<tcorpo>

<tr estilo="cor de fundo: #f2f2f2;">

<td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: negrito; color: #34495e;">Fluxo de Autenticação</td>

</tr>

<tr>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Registro de Clientes</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /auth/register/client`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`RegisterClientDto` / `AuthResponseDto`</td>

</tr>

<tr estilo="cor de fundo: #f9f9f9;">

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Login</td>

<td style="padding: 10px; border: 1px sólido #ddd; color: #555;">`POST /auth/login`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`LoginDto` / `AuthResponseDto`</td>

</tr>

<tr estilo="cor de fundo: #f2f2f2;">

<td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: negrito; color: #34495e;">Gerenciamento de Usuário/Perfil</td>

</tr>

<tr>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Perfil do Usuário</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /users/me`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UserProfileDto`</td>

</tr>

<tr estilo="cor de fundo: #f9f9f9;">

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Atualizar Perfil do Cliente</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /clients/me`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UpdateClientProfileDto` / `ClientEntity`</td>

</tr>

<tr estilo="cor de fundo: #f2f2f2;">

<td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Fluxo do Cliente</td>

</tr>

<tr>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Buscar Provedores/Serviços</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /search`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`SearchQueryDto` / `SearchResultDto`</td>

</tr>

<tr estilo="cor de fundo: #f9f9f9;">

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Criar Agenda</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /bookings`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`CreateBookingDto` / `BookingDetailsDto`</td>

</tr>

<tr>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Criar Cobrança PIX</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /payments/pix-charge`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`CreatePixChargeDto` / `PixChargeResponseDto`</td>

</tr>

<tr estilo="cor de fundo: #f2f2f2;">

<td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Fluxo do Provedor</td>

</tr>

<tr>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Agendamentos do Provedor</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /bookings/me`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`BookingDetailsDto[]`</td>

</tr>

<tr estilo="cor de fundo: #f9f9f9;">

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Gerenciar Disponibilidade</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`PATCH /providers/:providerId/availability`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`UpdateAvailabilityDto[]` / `AvailabilityDto[]`</td>

</tr>

<tr estilo="cor de fundo: #f2f2f2;">

<td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Fluxo Comum</td>

</tr>

<tr>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Mensagens de Chat</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GET /chat/:chatId/messages`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`GetMessagesDto` / `Message[]`</td>

</tr>

<tr estilo="cor de fundo: #f9f9f9;">

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Enviar mensagem de chat</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /chat/:chatId/messages`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`EnviarMensagemDpara` / `Mensagem`</td>

</tr>

<tr>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">Enviar Avaliação</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`POST /avaliações`</td>

<td style="padding: 10px; border: 1px solid #ddd; color: #555;">`EnviarAvaliaçãoDpara` / `EntidadeAvaliação`</td>

</tr>

</tbody>

</tabela>

</div>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-estrutura-do-projeto" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📁 Estrutura do Projeto</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 20px;">

O projeto LimpeJá é um monorepo, contendo pastas para o frontend (`LimpeJaApp/`) e para o backend (`backend-LimpeJá/`).

</p>

<div style="cor de fundo: #ffffff; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="estrutura-de-pastas-frontend" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Estrutura de Pastas (Frontend)</h3>

<pre style="cor de fundo: #ecf0f1; preenchimento: 15px; raio da borda: 5px; overflow-x: auto; cor: #34495e;"><código>

LimpeJáApp/

├── aplicativo/

│ ├── (auth)/ # Fluxo de Autenticação

│ │ ├── api/

│ │ ├── componentes/

│ │ ├── provedor-registro/

│ │ │ ├── componentes/

│ │ │ ├── verificação/

│ │ │ │ ├── background-check-status.tsx

│ │ │ │ ├── upload-de-documento.tsx

│ │ │ │ ├── reconhecimento facial.tsx

│ │ │ │ ├── índice.tsx

│ │ │ │ ├── layout.tsx

│ │ │ │ ├── detalhes-pessoais.tsx

│ │ │ │ ├── detalhes do serviço.tsx

│ │ │ │ └── verificar-conta.tsx

│ │ │ ├── índice.tsx

│ │ │ ├── layout.tsx

│ │ │ ├── detalhes-pessoais.tsx

│ │ │ └── detalhes do serviço.tsx

│ │ ├── cliente-registro.tsx

│ │ ├── esqueci-senha.tsx

│ │ ├── layout.tsx

│ │ ├── login.tsx

│ │ ├── LEIA-ME.md

│ │ ├── register-options.tsx

│ │ └── teste-conexão.tsx

│ ├── (cliente)/ # Funcionalidades do Cliente

│ │ ├── reservas/ # Agendamentos do Cliente

│ │ │ ├── api/

│ │ │ ├── componentes/

│ │ │ ├── [ID da reserva].tsx

│ │ │ ├── índice.tsx

│ │ │ ├── agendar-serviço.tsx

│ │ │ └── sucesso.tsx

│ │ ├── explorar/ # Explorar Serviços/Profissionais

│ │ │ ├── api/

│ │ │ ├── componentes/

│ │ │ ├── dados/

│ │ │ ├── estilos/

│ │ │ ├── [Id do provedor].tsx

│ │ │ ├── índice.tsx

│ │ │ ├── resultados-busca.tsx

│ │ │ ├── resultados-de-pesquisa.tsx

│ │ │ ├── serviços-por-categoria.tsx

│ │ │ ├── todas-categorias.tsx

│ │ │ └── todos-prestadores-proximos.tsx

│ │ ├── mensagens/ # Mensagens do Cliente

│ │ │ ├── api/

│ │ │ ├── componentes/

│ │ │ ├── [chatId].tsx

│ │ │ └── índice.tsx

│ │ ├── ofertas/ #Ofertas do Cliente

│ │ │ ├── api/

│ │ │ ├── componentes/

│ │ │ └── [ofertaId].tsx

│ │ └── perfil/ #Perfil do Cliente

│ │ │ ├── api/

│ │ │ ├── componentes/

│ │ │ ├── editar.tsx

│ │ │ ├── índice.tsx

│ │ │ ├── layout.tsx

│ │ │ └── layout.tsx

│ ├── (common)/ # Funcionalidades Comuns (cliente e provedor)

│ │ ├── api/

│ │ ├── componentes/

│ │ ├── comentários/

│ │ │ └── [targetId].tsx

│ │ ├── ajuda.tsx

│ │ ├── layout.tsx

│ │ ├── notificações.tsx

│ │ ├── privacidade.tsx

│ │ ├── LEIA-ME.md

│ │ ├── configurações.tsx

│ │ └── termos.tsx

│ ├── (provedor)/ # Funcionalidades do Provedor

│ │ ├── api/

│ │ ├── componentes/

│ │ ├── mensagens/ # Mensagens do Provedor

│ │ │ ├── api/

│ │ │ ├── componentes/

│ │ │ ├── [chatId].tsx

│ │ │ └── índice.tsx

│ │ ├── perfil/ # Perfil do Provedor

│ │ │ ├── api/

│ │ │ ├── componentes/

│ │ │ ├── editar-serviços.tsx

│ │ │ └── índice.tsx

│ │ ├── agendamento/ # Agenda/Disponibilidade do Provedor

│ │ │ ├── api/

│ │ │ └── componentes/

│ │ │ └── índice.tsx

│ │ ├── serviços/ # Serviços/Solicitações do Provedor

│ │ │ ├── api/

│ │ │ ├── componentes/

│ │ │ ├── [ID do serviço].tsx

│ │ │ └── índice.tsx

│ │ ├── painel.tsx

│ │ ├── ganhos.tsx

│ │ ├── layout.tsx

│ │ ├── LEIA-ME.md

│ │ └── serviços/

│ │ ├── authService.ts

│ │ └── clientService.ts

│ ├── _layout.tsx

│ ├── +não-encontrado.tsx

│ ├── doc.md

│ ├── index.tsx

│ ├── LEIA-ME.md

│ └── bem-vindo.tsx

├── ativos/ # Recursos estáticos

│ ├── fontes/

│ ├── imagens/

│ └── lottie/

├── componentes/ # Componentes de UI realmente reutilizáveis ​​e atômicos (globais)

│ ├── layout/

│ └── ui/

├── configuração/

│ ├── AppConfig.ts

│ ├── firebase.ts

│ └── firebaseClient.ts

├── constantes/

│ ├── Cores.ts

│ ├── rotas.ts

│ ├── strings.ts

│ └── tema.ts

├── contextos/

│ ├── AppContext.tsx

│ ├── AuthContext.tsx

│ └── ProviderRegistrationContext.tsx

├── documentação/

├── ganchos/

│ ├── useAuth.ts

│ ├── useColorScheme.ts

│ ├── useColorScheme.web.ts

│ ├── useFormValidation.ts

│ └── useThemeColor.ts

├── módulos_de_nó/

├── roteiros/

│ └── reset-project.js

├── serviços/

│ ├── api.ts

│ ├── authService.ts

│ ├── bookingService.ts

│ ├── chatService.ts

│ ├── clientService.ts

│ ├── faqService.ts

│ ├── firebaseConfig.ts

│ ├── notificationService.ts

│ ├── offerService.ts

│ ├── pagamentoService.ts

│ ├── providerService.ts

│ ├── reviewService.ts

│ ├── searchService.ts

│ ├── uploadService.ts

│ └── verificationService.ts

├── tipos/

│ ├── aut.ts

│ ├── reserva.ts

│ ├── reservas.ts

│ ├── bate-papo.ts

│ ├── clientes.ts

│ ├── faqs.ts

│ ├── índice.ts

│ ├── navegação.ts

│ ├── notificações.ts

│ ├── ofertas.ts

│ ├── pagamentos.ts

│ ├── provedor.ts

│ ├── provedores.ts

│ ├── avaliações.ts

│ ├── serviço.ts

│ ├── serviços.ts

│ ├── tipos.ts

│ ├── usuário.ts

│ ├── usuários.ts

│ └── verificação.ts

├── utilitários/

│ ├── ajudantes.ts

│ ├── permissões.ts

│ └── armazenamento.ts

├── .env

├── .gitignore

├── app.json

├── babel.config.js

├── eas.json

├── eslint.config.js

├── expo-env.d.ts

├── LICENÇA

├── metro.config.js

├── pacote-lock.json

├── pacote.json

├── LEIA-ME.md

└── tsconfig.json

</code></pre>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="estrutura-de-pastas-backend" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Estrutura de Massas (Backend)</h3>

<pre style="cor de fundo: #ecf0f1; preenchimento: 15px; raio da borda: 5px; overflow-x: auto; cor: #34495e;"><código>

backend-LimpeJá/

├── dist/

├── módulos_de_nó/

├── prisma/

│ ├── migrações/

│ └── esquema.prisma

├── fonte/

│ ├── aut/

│ │ ├── decoradores/

│ │ ├── dto/

│ │ ├── guardas/

│ │ ├── estratégias/

│ │ ├── auth.controller.ts

│ │ ├── auth.module.ts

│ │ └── auth.service.ts

│ ├── disponibilidade/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── disponibilidade.controller.ts

│ │ ├── disponibilidade.módulo.ts

│ │ └── disponibilidade.serviço.ts

│ ├── reservas/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── reservas.controller.ts

│ │ ├── reservas.módulo.ts

│ │ └── reservas.serviço.ts

│ ├── bate-papo/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── portal/

│ │ ├── chat.controller.ts

│ │ ├── chat.module.ts

│ │ └── chat.service.ts

│ ├── clientes/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── clientes.controller.ts

│ │ ├── clientes.módulo.ts

│ │ └── clientes.serviço.ts

│ ├── comum/

│ │ ├── constantes/

│ │ ├── decoradores/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── filtros/

│ │ ├── interceptadores/

│ │ └── tubos/

│ ├── configuração/

│ │ ├── config.module.ts

│ │ ├── configuração.ts

│ │ └── validação-schema.ts

│ ├── notificações/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── notificações.controller.ts

│ │ ├── notificações.módulo.ts

│ │ └── notificações.serviço.ts

│ ├── oferece/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── offers.controller.ts

│ │ ├── offers.module.ts

│ │ └── ofertas.serviço.ts

│ ├── pagamentos/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── pagamentos.controller.ts

│ │ ├── pagamentos.módulo.ts

│ │ └── pagamentos.serviço.ts

│ ├── prisma/

│ │ ├── prisma.module.ts

│ │ └── prisma.service.ts

│ ├── provedores-de-serviços/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── provider-services.controller.ts

│ │ ├── provider-services.module.ts

│ │ └── provider-services.service.ts

│ ├── provedores/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── provedores.controlador.ts

│ │ ├── provedores.módulo.ts

│ │ └── provedores.serviço.ts

│ ├── avaliações/

│ │ ├── dto/

│ │ ├── entidades/

│ │ ├── avaliações.controller.ts

│ │ ├── avaliações.module.ts

│ │ └── avaliações.serviço.ts

│ ├── pesquisar/

│ │ ├── dto/

│ │ ├── pesquisa.controller.ts

│ │ ├── pesquisar.módulo.ts

│ │ └── search.service.ts

│ ├── serviços/

│ │ ├── dto/

│ │ ├── update-service.dto.ts

│ │ ├── entidades/

│ │ ├── serviços.controller.ts

│ │ ├── serviços.módulo.ts

│ │ └── serviços.serviço.ts

│ └── verificação/

│ ├── dto/

│ │ ├── enviar-cpf.dto.ts

│ │ ├── upload-document.dto.ts

│ │ └── upload-selfie.dto.ts

│ ├── entidades/

│ ├── verificação-de-antecedentes-criminais.service.ts

│ ├── serviço de processamento de documentos.ts

│ ├── verificação.controller.ts

│ ├── verificação.module.ts

│ └── verificação.serviço.ts

├── compartilhado/

│ ├── enumerações/

│ ├── interfaces/

│ └── tipos/

├── usuários/

│ ├── dto/

│ ├── entidades/

│ ├── usuários.controlador.ts

│ ├── usuários.módulo.ts

│ └── usuários.serviço.ts

├── aplicativo.controlador.spec.ts

├── app.controller.ts

├── app.module.ts

├── aplicativo.serviço.ts

├── main.ts

└── teste/

├── .env

├── .env.exemplo

├── .gitignore

├── .prettierrc

├── eslint.config.mjs

├── nest-cli.json

├── pacote-lock.json

├── pacote.json

├── LEIA-ME.md

├── src.rar

├── tsconfig.build.json

└── tsconfig.json
</código > </pre>

</div>

</div>

<div style="cor de fundo: #ffffff; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

<h2 id="-começando-getting-started" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🚀 Começando</h2>

<p style="color: #555; altura da linha: 1,6; margem inferior: 20px;">

Para configurar e rodar o projeto localmente, siga os passos abaixo:

</p>

<div style="cor de fundo: #f8f9fa; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="pré-requisitos" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Pré-requisitos</h3>

<p style="color: #555; line-height: 1.6;">Certifique-se de ter as seguintes ferramentas instaladas:</p>

<ul style="list-style-type: disc; padding-left: 20px; color: #555; line-height: 1.6;">

<li style="margin-bottom: 5px;"><a href="https://nodejs.org/en/download/" style="color: #3498db; text-decoration: none;">Node.js</a> (versão LTS recomendada)</li>

<li style="margin-bottom: 5px;"><a href="https://www.npmjs.com/get-npm" style="color: #3498db; text-decoration: none;">npm</a> ou <a href="https://yarnpkg.com/getting-started/install" style="color: #3498db; text-decoration: none;">Yarn</a></li>

<li style="margin-bottom: 5px;"><a href="https://git-scm.com/downloads" style="color: #3498db; text-decoration: none;">Git</a></li>

<li style="margin-bottom: 5px;"><a href="https://docs.docker.com/get-docker/" style="color: #3498db; text-decoration: none;">Docker</a> (para rodar o PostgreSQL localmente)</li>

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

cd ..</código></pre>

</li>

<li style="margin-bottom: 10px;"><strong>Instalar como dependências do Backend:</strong>

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd backend-LimpeJá

npm install # ou yarn install

cd ..</código></pre>

</li>

<li style="margin-bottom: 10px;"><strong>Configurar o banco de dados (PostgreSQL com Docker):</strong>

<ul style="list-style-type: disco; preenchimento esquerdo: 20px; margem superior: 5px;">

<li style="margin-bottom: 5px;">Crie um arquivo `.env` na raiz da pasta `backend-LimpeJá` com as variáveis ​​de ambiente do banco de dados e do JWT. Exemplo:

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>DATABASE_URL="postgresql://user:password@localhost:5432/LimpeJá_db"

JWT_SECRET="sua_chave_secreta_jwt_aqui"

JWT_EXPIRATION_TIME="1h"

PORTA=3000</code></pre>

</li>

<li style="margin-bottom: 5px;">Suba o contêiner Docker do PostgreSQL (assumindo que você tem um `docker-compose.yml` configurado para o postgres na raiz do projeto ou em `backend-LimpeJá/`):

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>docker-compose up -d postgres # Ou o comando específico para seu docker-compose</code></pre>

</li>

<li style="margin-bottom: 5px;">Execute as migrações do Prisma para criar o esquema do banco de dados e gerar o Prisma Client:

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd backend-LimpeJá

npx prisma migrar dev --name init

npx prisma gerar

cd ..</código></pre>

</li>

</ul>

</li>

</ol>

</div>

<div style="cor de fundo: #f8f9fa; preenchimento: 20px; raio da borda: 8px; sombra da caixa: 0 2px 8px rgba(0, 0, 0, 0,08); margem inferior: 20px;">

<h3 id="rodando-localmente" style="color: #2c3e50; font-size: 1,5em; margin-bottom: 15px;">Rodando Localmente</h3>

<ol style="tipo-de-estilo-de-lista: decimal; preenchimento-esquerdo: 20px; cor: #555; altura-da-linha: 1,6;">

<li style="margin-bottom: 10px;"><strong>Início do Backend:</strong>

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd backend-LimpeJá

npm run start:dev # ou yarn start:dev</code></pre>

<p style="margin-top: 5px; color: #555;">O backend estará disponível em `http://localhost:3000` (ou na porta configurada em `.env`). A documentação do Swagger estará em `http://localhost:3000/api`.</p>

</li>

<li style="margin-bottom: 10px;"><strong>Início do Frontend:</strong>

<p style="margin-top: 5px; color: #555;">Abra um novo terminal.</p>

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd LimpeJaApp

início da exposição npx</code></pre>

<p estilo="margem superior: 5px; cor: #555;">

Isso abrirá o Metro Bundler. Você pode ler o código QR com o aplicativo <a href="https://expo.dev/go" style="color: #3498db; text-decoration: none;">Expo Go</a> no seu celular, ou usar um emulador/simulador <a href="https://docs.expo.dev/workflow/android-studio-emulator/" style="color: #3498db; text-decoration: none;">Android Emulador de estúdio</a> / <a href="https://docs.expo.dev/workflow/ios-simulator/" style="color: #3498db; text-decoration: none;">Simulador iOS</a>.

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

<pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>construção eas --plataforma android --desenvolvimento de perfil</code></pre>

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

O LimpeJá foi concebido para ser uma plataforma que beneficia tanto os clientes em busca de serviços de limpeza de qualidade quanto os profissionais que desejam ampliar sua base de clientes e gerenciar seus serviços de forma eficiente. Nossa estratégia de monetização é transparente e se baseia no sucesso mútuo, inspirada em modelos de marketplace consolidados como o Airbnb, mas aplicada ao universo dos serviços de limpeza.

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

<li style="margin-bottom: 5px;">Refletir e gerenciar transições de status de agendamentos de forma mais robusta.</li>

</ul>

</li>

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

<div style="cor de fundo: #ffffff; preenchimento: 30px; raio da borda: 10px; sombra da caixa: 0 2px 10px rgba(0, 0, 0, 0,05); margem inferior: 40px;">

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

</ul>

</div>

Pesquisas relacionadas:

Melhores práticas de arquitetura do React Native Expo
Implementação de chat Socket.IO React Native NestJS
Processo de construção da Expo EAS
Recursos do marketplace do aplicativo LimpeJá
Melhores práticas de modelagem de dados Prisma ORM
Melhores práticas de arquitetura de backend do NestJS
roteiro para desenvolvimento de aplicativos de marketplace
estratégia de monetização para aplicativo de marketplace de serviços
Fluxo de autenticação JWT React Native NestJS