<div align="center">
  <img src="https://raw.githubusercontent.com/techleadevelopers/limpe-ja-app/main/LimpeJaApp/assets/images/logo2.png" alt="LimpeJá-App Logo" width="180" style="border-radius: 20px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);">
  <h1 style="color: #2c3e50; font-size: 2.8em; margin-top: 15px; margin-bottom: 10px;">LimpeJá App ✨🧹</h1>
  <p style="color: #7f8c8d; font-size: 1.2em; margin-bottom: 25px;">Seu marketplace de confiança para encontrar e agendar os melhores profissionais de limpeza da sua região!</p>

  <p style="margin-bottom: 30px;">
    <img src="https://img.shields.io/badge/React%20Native-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React Native Badge" style="margin: 5px;">
    <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Expo Badge" style="margin: 5px;">
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS Badge" style="margin: 5px;">
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL Badge" style="margin: 5px;">
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma Badge" style="margin: 5px;">
    <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO Badge" style="margin: 5px;">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript Badge" style="margin: 5px;">
    <img src="https://img.shields.io/badge/EAS-Expo%20Application%20Services-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="EAS Badge" style="margin: 5px;">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License MIT" style="margin: 5px;">
    <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge" alt="Build Status" style="margin: 5px;">
  </p>
</div>

<div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📋 Índice</h2>
  <ul style="list-style-type: none; padding: 0;">
    <li style="margin-bottom: 8px;"><a href="#-sobre-o-projeto" style="color: #3498db; text-decoration: none; font-weight: bold;">📖 Sobre o Projeto</a></li>
    <li style="margin-bottom: 8px;"><a href="#-funcionalidades-principais" style="color: #3498db; text-decoration: none; font-weight: bold;">✨ Funcionalidades Principais</a>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;"><a href="#para-clientes" style="color: #2980b9; text-decoration: none;">Para Clientes</a></li>
        <li style="margin-bottom: 5px;"><a href="#para-profissionais-de-limpeza-prestadores" style="color: #2980b9; text-decoration: none;">Para Profissionais de Limpeza</a></li>
      </ul>
    </li>
    <li style="margin-bottom: 8px;"><a href="#️-tecnologias-principais" style="color: #3498db; text-decoration: none; font-weight: bold;">🛠️ Tecnologias Principais</a>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;"><a href="#frontend" style="color: #2980b9; text-decoration: none;">Frontend</a></li>
        <li style="margin-bottom: 5px;"><a href="#backend" style="color: #2980b9; text-decoration: none;">Backend</a></li>
      </ul>
    </li>
    <li style="margin-bottom: 8px;"><a href="#-arquitetura-do-sistema" style="color: #3498db; text-decoration: none; font-weight: bold;">🔩 Arquitetura do Sistema</a>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;"><a href="#visão-geral-e-propósito-do-backend" style="color: #2980b9; text-decoration: none;">Visão Geral e Propósito do Backend</a></li>
        <li style="margin-bottom: 5px;"><a href="#arquitetura-geral-e-fluxo-de-requisição" style="color: #2980b9; text-decoration: none;">Arquitetura Geral e Fluxo de Requisição</a></li>
        <li style="margin-bottom: 5px;"><a href="#estrutura-de-módulos-nestjs" style="color: #2980b9; text-decoration: none;">Estrutura de Módulos (NestJS)</a></li>
        <li style="margin-bottom: 5px;"><a href="#modelo-de-dados-prisma-schema" style="color: #2980b9; text-decoration: none;">Modelo de Dados (Prisma Schema)</a></li>
        <li style="margin-bottom: 5px;"><a href="#princípios-de-design-e-padrões-de-projeto" style="color: #2980b9; text-decoration: none;">Princípios de Design e Padrões de Projeto</a></li>
      </ul>
    </li>
    <li style="margin-bottom: 8px;"><a href="#-conexão-frontend-backend-1" style="color: #3498db; text-decoration: none; font-weight: bold;">🔗 Conexão Frontend-Backend</a>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;"><a href="#mapeamento-de-rotas-da-api" style="color: #2980b9; text-decoration: none;">Mapeamento de Rotas da API</a></li>
      </ul>
    </li>
    <li style="margin-bottom: 8px;"><a href="#-estrutura-do-projeto" style="color: #3498db; text-decoration: none; font-weight: bold;">📁 Estrutura do Projeto</a>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;"><a href="#estrutura-de-pastas-frontend" style="color: #2980b9; text-decoration: none;">Estrutura de Pastas (Frontend)</a></li>
        <li style="margin-bottom: 5px;"><a href="#estrutura-de-pastas-backend" style="color: #2980b9; text-decoration: none;">Estrutura de Pastas (Backend)</a></li>
      </ul>
    </li>
    <li style="margin-bottom: 8px;"><a href="#-começando-getting-started" style="color: #3498db; text-decoration: none; font-weight: bold;">🚀 Começando (Getting Started)</a>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;"><a href="#pré-requisitos" style="color: #2980b9; text-decoration: none;">Pré-requisitos</a></li>
        <li style="margin-bottom: 5px;"><a href="#instalação" style="color: #2980b9; text-decoration: none;">Instalação</a></li>
        <li style="margin-bottom: 5px;"><a href="#rodando-localmente" style="color: #2980b9; text-decoration: none;">Rodando Localmente</a></li>
      </ul>
    </li>
    <li style="margin-bottom: 8px;"><a href="#-gerando-um-apk-para-teste-android" style="color: #3498db; text-decoration: none; font-weight: bold;">📱 Gerando um APK para Teste (Android)</a></li>
    <li style="margin-bottom: 8px;"><a href="#-contribuindo" style="color: #3498db; text-decoration: none; font-weight: bold;">🤝 Contribuindo</a></li>
    <li style="margin-bottom: 8px;"><a href="#-licença" style="color: #3498db; text-decoration: none; font-weight: bold;">📜 Licença</a></li>
    <li style="margin-bottom: 8px;"><a href="#-contato" style="color: #3498db; text-decoration: none; font-weight: bold;">📞 Contato</a></li>
    <li style="margin-bottom: 8px;"><a href="#-LimpeJá-ganhos-nossa-estratégia-de-monetização" style="color: #3498db; text-decoration: none; font-weight: bold;">💰 LimpeJá Ganhos: Nossa Estratégia de Monetização</a></li>
    <li style="margin-bottom: 8px;"><a href="#️-roadmap-e-próximas-etapas" style="color: #3498db; text-decoration: none; font-weight: bold;">🛣️ Roadmap e Próximas Etapas</a></li>
    <li style="margin-bottom: 8px;"><a href="#-recursos-e-suporte" style="color: #3498db; text-decoration: none; font-weight: bold;">📚 Recursos e Suporte</a></li>
  </ul>
</div>

<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-sobre-o-projeto" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📖 Sobre o Projeto</h2>
  <p style="color: #555; line-height: 1.6;">
    O LimpeJá visa revolucionar a forma como serviços de limpeza são contratados e gerenciados. Para clientes, oferecemos uma plataforma intuitiva para descobrir profissionais qualificados, verificar avaliações, agendar serviços com datas e horários flexíveis, e realizar pagamentos seguros. Para os profissionais de limpeza, o LimpeJá é uma ferramenta poderosa para expandir sua clientela, gerenciar sua agenda de forma autônoma, e receber pagamentos de forma garantida e simplificada.
    <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span>
  </p>
  <p style="color: #555; line-height: 1.6;">
    Construído com tecnologia de ponta, o aplicativo oferece uma experiência de usuário fluida e moderna, tanto para quem busca um ambiente limpo quanto para quem oferece o serviço de limpeza. O setor de limpeza no Brasil se consolidou como uma indústria estratégica e essencial, com a valorização da higiene intensificada após a pandemia de COVID-19, o que representa uma oportunidade estrutural para o LimpeJá.
    <span style="font-size: 0.9em; color: #888;">[INDEX_2]</span>
  </p>
</div>

<div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-funcionalidades-principais" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">✨ Funcionalidades Principais</h2>
  <div style="display: flex; flex-wrap: wrap; justify-content: space-around;">
    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); width: 45%; min-width: 300px; margin: 10px;">
      <h3 id="para-clientes" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Para Clientes</h3>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">🧼 Busca Inteligente:</strong> Encontre profissionais por especialidade, localização e avaliações.</li>
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">📅 Agendamento Flexível:</strong> Escolha datas e horários que se encaixem na sua rotina.</li>
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">💳 Pagamento Seguro:</strong> Transações protegidas dentro da plataforma.</li>
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">⭐ Avaliações Confiáveis:</strong> Deixe e veja avaliações para ajudar a comunidade.</li>
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">💬 Comunicação Direta:</strong> Chat integrado para combinar detalhes com o profissional.</li>
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #3498db;">🏠 Perfis Detalhados:</strong> Veja informações completas sobre os profissionais.</li>
      </ul>
    </div>
    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); width: 45%; min-width: 300px; margin: 10px;">
      <h3 id="para-profissionais-de-limpeza-prestadores" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Para Profissionais de Limpeza (Prestadores)</h3>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">🚀 Visibilidade Ampliada:</strong> Alcance mais clientes e aumente sua renda.</li>
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">🗓️ Gestão de Agenda:</strong> Controle total sobre seus horários e disponibilidade.</li>
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">💰 Pagamentos Garantidos:</strong> Receba de forma segura e pontual pelos seus serviços.</li>
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">📊 Perfil Profissional:</strong> Mostre suas habilidades, experiência e avaliações.</li>
        <li style="margin-bottom: 10px; color: #555;"><strong style="color: #2ecc71;">🔔 Notificações em Tempo Real:</strong> Sobre novos pedidos e mensagens.</li>
      </ul>
    </div>
  </div>
</div>

<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="️-tecnologias-principais" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🛠️ Tecnologias Principais</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
    O projeto LimpeJá é construído sobre uma pilha tecnológica robusta e moderna, garantindo eficiência e escalabilidade em todas as camadas.
  </p>
  <div style="display: flex; flex-wrap: wrap; justify-content: space-around;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); width: 45%; min-width: 300px; margin: 10px;">
      <h3 id="frontend" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Frontend</h3>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Framework UI:</strong> <a href="https://reactnative.dev/docs" style="color: #3498db; text-decoration: none;">React Native</a> - Para construção de interfaces de usuário nativas para iOS e Android a partir de uma única base de código. <span style="font-size: 0.9em; color: #888;">[INDEX_8, 25, 49]</span></li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Navegação:</strong> <a href="https://docs.expo.dev/router/introduction/" style="color: #3498db; text-decoration: none;">Expo Router</a> (v5) - Sistema de roteamento baseado em arquivos para aplicativos Expo e React Native, oferecendo navegação robusta e tipada. <span style="font-size: 0.9em; color: #888;">[INDEX_10, 12, 16, 20, 33]</span></li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Gerenciamento de Estado Global:</strong> React Context API - Para gerenciar estados compartilhados, como o contexto de autenticação (AuthContext).</li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Tipagem:</strong> <a href="https://www.typescriptlang.org/docs/" style="color: #3498db; text-decoration: none;">TypeScript</a> - Essencial para a segurança e consistência dos dados, especialmente na integração com o backend.</li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Estilização:</strong> StyleSheet do React Native.</li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Animações:</strong> React Native Animated API.</li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Ícones:</strong> <code>@expo/vector-icons</code>.</li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Utilitários Expo:</strong> <code>expo-image-picker</code>, <code>expo-clipboard</code>, <code>react-native-safe-area-context</code>.</li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Requisições HTTP:</strong> <a href="https://axios-http.com/" style="color: #3498db; text-decoration: none;">Axios</a> - Para chamadas HTTP à API backend.</li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #3498db;">Serviços Expo:</strong> <a href="https://expo.dev/eas" style="color: #3498db; text-decoration: none;">EAS (Expo Application Services)</a> - Para um fluxo de desenvolvimento gerenciado, builds e atualizações. Inclui:
          <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px; color: #555;">
            <li style="margin-bottom: 5px;"><code>EAS Build</code>: Para compilação de APKs/AABs e IPAs na nuvem.</li>
            <li style="margin-bottom: 5px;"><code>EAS Submit</code>: Para envio para as lojas (futuramente).</li>
            <li style="margin-bottom: 5px;"><code>EAS Update</code>: Para atualizações over-the-air (futuramente).</li>
          </ul>
        </li>
      </ul>
    </div>
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); width: 45%; min-width: 300px; margin: 10px;">
      <h3 id="backend" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Backend</h3>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Framework:</strong> <a href="https://docs.nestjs.com/" style="color: #e74c3c; text-decoration: none;">NestJS</a> (Node.js) - Escolhido por sua modularidade, forte tipagem (TypeScript) e aderência a padrões de arquitetura (MVC, DDD). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Linguagem:</strong> TypeScript - Oferece segurança de tipo e melhora a manutenibilidade do código.</li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Banco de Dados:</strong> <a href="https://www.postgresql.org/docs/" style="color: #e74c3c; text-decoration: none;">PostgreSQL</a> - Um sistema de banco de dados relacional robusto e escalável. <span style="font-size: 0.9em; color: #888;">[INDEX_14, 24, 35, 39, 40]</span></li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">ORM:</strong> <a href="https://www.prisma.io/docs/" style="color: #e74c3c; text-decoration: none;">Prisma</a> - ORM moderno para acesso a dados type-safe e migrações declarativas. <span style="font-size: 0.9em; color: #888;">[INDEX_7, 27, 38, 43]</span></li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Autenticação:</strong> <a href="https://jwt.io/introduction/" style="color: #e74c3c; text-decoration: none;">JWT (JSON Web Tokens)</a> com <a href="http://www.passportjs.org/" style="color: #e74c3c; text-decoration: none;">Passport.js</a> - Para autenticação stateless e segura. <span style="font-size: 0.9em; color: #888;">[INDEX_2, 5, 6, 9, 11, 13, 17, 30, 41, 48]</span></li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Comunicação em Tempo Real:</strong> <a href="https://socket.io/docs/" style="color: #e74c3c; text-decoration: none;">Socket.IO</a> - Para funcionalidades de chat e notificações em tempo real. <span style="font-size: 0.9em; color: #888;">[INDEX_15, 21, 22, 23, 26]</span></li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Validação:</strong> <a href="https://github.com/typestack/class-validator" style="color: #e74c3c; text-decoration: none;">Class-validator</a> e <a href="https://github.com/typestack/class-transformer" style="color: #e74c3c; text-decoration: none;">Class-transformer</a> - Para validação declarativa de DTOs.</li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Documentação API:</strong> <a href="https://swagger.io/specification/" style="color: #e74c3c; text-decoration: none;">Swagger (OpenAPI)</a> - Para documentação automática e interativa da API. <span style="font-size: 0.9em; color: #888;">[INDEX_4, 31, 32, 36, 45]</span></li>
        <li style="margin-bottom: 8px; color: #555;"><strong style="color: #e74c3c;">Variáveis de Ambiente:</strong> <code>@nestjs/config</code> com <a href="https://joi.dev/api/" style="color: #e74c3c; text-decoration: none;">Joi</a> - Para gerenciamento e validação de configurações. <span style="font-size: 0.9em; color: #888;">[INDEX_19, 28, 29, 37, 42]</span></li>
      </ul>
    </div>
  </div>
</div>

<div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-arquitetura-do-sistema" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🔩 Arquitetura do Sistema</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
    O projeto LimpeJá adota uma arquitetura em camadas clara, dividida principalmente entre o Backend (API) e o Frontend (Aplicativo Móvel), que se comunicam através de APIs RESTful e WebSockets.
  </p>

  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
    <h3 id="visão-geral-e-propósito-do-backend" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Visão Geral e Propósito do Backend</h3>
    <p style="color: #555; line-height: 1.6;">
      O backend do LimpeJá é a camada de serviço que gerencia toda a lógica de negócios, persistência de dados e a comunicação com o frontend. Construído com NestJS, o backend é responsável por conectar clientes e provedores, facilitando agendamentos, pagamentos, chat e avaliações. Sua arquitetura modular e escalável garante robustez e alta performance.
      <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span>
    </p>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
    <h3 id="arquitetura-geral-e-fluxo-de-requisição" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Arquitetura Geral e Fluxo de Requisição</h3>
    <p style="color: #555; line-height: 1.6;">O fluxo de uma requisição típica no sistema LimpeJá segue o seguinte caminho:</p>
    <ol style="color: #555; line-height: 1.6; padding-left: 20px;">
      <li style="margin-bottom: 10px;"><strong>Cliente (Usuário):</strong> Interage com a interface do usuário no Frontend (Aplicativo Móvel). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 10px;"><strong>Frontend (Aplicativo Móvel):</strong> Coleta e valida os dados de entrada do usuário, realiza chamadas a serviços internos, formata a requisição (HTTP ou WebSocket) e a envia para o Backend, incluindo o token JWT no cabeçalho <code>Authorization</code> para requisições protegidas. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 10px;"><strong>Backend (NestJS API):</strong>
        <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
          <li style="margin-bottom: 5px;"><strong>Guards:</strong> Interceptam a requisição para validação de autenticação (JWT) e autorização (papéis do usuário). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          <li style="margin-bottom: 5px;"><strong>Pipes:</strong> Validam e transformam os DTOs de entrada. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          <li style="margin-bottom: 5px;"><strong>Controller:</strong> Recebe a requisição validada, extrai parâmetros e delega a lógica de negócios para o Service apropriado. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          <li style="margin-bottom: 5px;"><strong>Service:</strong> Contém a lógica de negócios principal, orquestrando operações e interagindo com o <code>PrismaService</code>. Pode injetar outros serviços para operações complexas. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          <li style="margin-bottom: 5px;"><strong>PrismaService:</strong> Atua como a camada de acesso a dados, executando operações no Banco de Dados. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          <li style="margin-bottom: 5px;"><strong>Banco de Dados (PostgreSQL):</strong> Persiste e recupera os dados. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          <li style="margin-bottom: 5px;"><strong>Resposta:</strong> O Service retorna os dados ao Controller, que os formata (geralmente usando DTOs de resposta) e os envia de volta ao Frontend. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          <li style="margin-bottom: 5px;"><strong>Filters:</strong> Capturam exceções HTTP, formatando as respostas de erro de forma consistente. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
        </ul>
      </li>
      <li style="margin-bottom: 10px;"><strong>Frontend (Aplicativo Móvel):</strong> Recebe a resposta do Backend, processa os dados e atualiza a interface do usuário, exibindo informações ou mensagens de erro ao Cliente. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
    </ol>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
    <h3 id="estrutura-de-módulos-nestjs" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Estrutura de Módulos (NestJS)</h3>
    <p style="color: #555; line-height: 1.6;">O backend é organizado em módulos coesos, seguindo o princípio de responsabilidade única. Cada módulo encapsula funcionalidades específicas, incluindo seus próprios controladores, serviços, DTOs e entidades. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></p>
    <ul style="list-style-type: disc; padding-left: 20px; color: #555; line-height: 1.6;">
      <li style="margin-bottom: 5px;"><code>src/auth</code>: Gerenciamento de autenticação (registro, login, redefinição de senha). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/users</code>: Operações genéricas sobre usuários (perfis, dados básicos). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/clients</code>: Lógica específica para o papel de cliente. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/providers</code>: Lógica específica para o papel de provedor. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/availability</code>: Gestão da disponibilidade de horários dos provedores. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/services</code>: Gerenciamento de tipos de serviços globais (e.g., "Limpeza Padrão"). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/provider-services</code>: Gerenciamento dos serviços específicos oferecidos por cada provedor. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/bookings</code>: Criação e gestão de agendamentos. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/payments</code>: Processamento de pagamentos (PIX simulado) e saques. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/chat</code>: Funcionalidades de chat (REST e WebSocket). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/notifications</code>: Gestão de notificações para usuários. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/reviews</code>: Submissão e consulta de avaliações. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/offers</code>: Gerenciamento de ofertas e promoções. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/search</code>: Motor de busca abrangente. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/prisma</code>: Módulo global para o <code>PrismaService</code>. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/config</code>: Módulo global para gerenciamento de configurações. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 5px;"><code>src/common</code>: Componentes reutilizáveis (pipes, filtros de exceção, DTOs genéricos, enums). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
    </ul>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
    <h3 id="modelo-de-dados-prisma-schema" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Modelo de Dados (Prisma Schema)</h3>
    <p style="color: #555; line-height: 1.6;">
      O <code>prisma/schema.prisma</code> define o modelo de dados relacional e é a fonte da verdade para a estrutura do banco de dados. As principais entidades e suas relações incluem: <code>User</code>, <code>Client</code>, <code>Provider</code>, <code>Address</code>, <code>Service</code>, <code>ProviderService</code>, <code>Booking</code>, <code>Message</code>, <code>Notification</code>, <code>Review</code>, <code>Offer</code>, <code>Transaction</code>, <code>Availability</code>.
      <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span>
    </p>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
    <h3 id="princípios-de-design-e-padrões-de-projeto" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Princípios de Design e Padrões de Projeto</h3>
    <p style="color: #555; line-height: 1.6;">O projeto LimpeJá adere a princípios de design e padrões de projeto que promovem a qualidade, manutenibilidade e escalabilidade em todo o stack. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></p>
    <ul style="list-style-type: none; padding: 0; color: #555; line-height: 1.6;">
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Arquitetura em Camadas:</strong> Tanto o frontend quanto o backend seguem uma arquitetura em camadas clara (Controladores/Telas, Serviços/Lógica de Negócios, Acesso a Dados), promovendo a separação de preocupações. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Data Transfer Objects (DTOs):</strong> Utilização rigorosa de DTOs para validação de entrada e tipagem de saída em todas as interações API, garantindo a integridade e segurança dos dados. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Autenticação e Autorização:</strong> Implementação robusta de JWT e RBAC (Role-Based Access Control) para proteger rotas e recursos. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Tratamento Centralizado de Erros:</strong> Respostas de erro padronizadas facilitam o tratamento de exceções em todo o sistema. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Modularidade:</strong> Módulos coesos no backend (NestJS) e componentes reutilizáveis no frontend (React Native) garantem organização, testabilidade e reuso de código. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Segurança de Tipos (Type-Safety):</strong> O uso extensivo de TypeScript em ambas as camadas, complementado pelo Prisma no backend, assegura a consistência e integridade dos dados em tempo de compilação. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Injeção de Dependência:</strong> No backend (NestJS), facilita a testabilidade e modularidade dos serviços. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Componentização (Frontend):</strong> Divisão da UI em componentes pequenos e reutilizáveis, promovendo reuso e manutenibilidade. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Gerenciamento de Estado:</strong> Combinação de Hooks do React (estado local) e Context API (estado global) no frontend. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Navegação Declarativa:</strong> Uso do Expo Router para uma gestão de rotas intuitiva e baseada em arquivos. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Animações e Responsividade:</strong> Aplicação de animações fluidas e design responsivo para aprimorar a experiência do usuário em diferentes dispositivos. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
    </ul>
  </div>
</div>

<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-conexão-frontend-backend-1" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🔗 Conexão Frontend-Backend</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
    A interligação entre o Frontend (React Native/Expo) e o Backend (NestJS) do projeto LimpeJá é um pilar fundamental da arquitetura, garantindo comunicação eficiente e segura.
    <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span>
  </p>
  <ul style="list-style-type: none; padding: 0; color: #555; line-height: 1.6;">
    <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Padrão de Comunicação:</strong> Predominantemente APIs RESTful (HTTP) para operações transacionais e de consulta, e WebSockets para funcionalidades de comunicação em tempo real (chat, notificações). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
    <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Autenticação JWT:</strong> O <code>AuthContext</code> no frontend gerencia o ciclo de vida do token JWT, obtido via <code>POST /auth/login</code>. Este token é armazenado de forma segura no AsyncStorage e anexado automaticamente como <code>Authorization: Bearer &lt;token&gt;</code> em todas as requisições protegidas ao backend. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
    <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Consistência de Dados (DTOs e Interfaces TypeScript):</strong> Um alinhamento rigoroso é mantido entre as interfaces TypeScript do frontend (localizadas em <code>LimpeJaApp/src/types/backend/</code>) e os DTOs definidos no backend. Isso garante a validação e consistência da estrutura de dados em ambas as camadas, minimizando erros de tipagem e facilitando a colaboração. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
    <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Tratamento de Erros:</strong> O <code>HttpExceptionFilter</code> do backend padroniza as respostas de erro, permitindo que o frontend interprete e exiba mensagens significativas ao usuário. As chamadas de API no frontend incluem blocos <code>try-catch</code> para lidar com erros de rede e respostas de erro da API. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
    <li style="margin-bottom: 8px;"><strong style="color: #3498db;">Serviços Centralizados:</strong> Chamadas de API são encapsuladas em serviços centralizados (<code>authService.ts</code>, <code>clientService.ts</code>, <code>providerService.ts</code>) que utilizam o Axios, promovendo reuso de código e padronização. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
  </ul>

  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-top: 20px;">
    <h3 id="mapeamento-de-rotas-da-api" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Mapeamento de Rotas da API</h3>
    <p style="color: #555; line-height: 1.6; margin-bottom: 15px;">Para uma lista completa de endpoints e DTOs, consulte a documentação detalhada do backend. Abaixo estão alguns exemplos de interações:</p>
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
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Registro de Cliente</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>POST /auth/register/client</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>RegisterClientDto</code> / <code>AuthResponseDto</code></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Login</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>POST /auth/login</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>LoginDto</code> / <code>AuthResponseDto</code></td>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Gerenciamento de Usuário/Perfil</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Perfil do Usuário</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>GET /users/me</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>UserProfileDto</code></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Atualizar Perfil do Cliente</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>PATCH /clients/me</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>UpdateClientProfileDto</code> / <code>ClientEntity</code></td>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Fluxo do Cliente</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Buscar Provedores/Serviços</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>GET /search</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>SearchQueryDto</code> / <code>SearchResultDto</code></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Criar Agendamento</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>POST /bookings</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>CreateBookingDto</code> / <code>BookingDetailsDto</code></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Criar Cobrança PIX</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>POST /payments/pix-charge</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>CreatePixChargeDto</code> / <code>PixChargeResponseDto</code></td>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Fluxo do Provedor</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Agendamentos do Provedor</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>GET /bookings/me</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>BookingDetailsDto[]</code></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Gerenciar Disponibilidade</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>PATCH /providers/:providerId/availability</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>UpdateAvailabilityDto[]</code> / <code>AvailabilityDto[]</code></td>
        </tr>
        <tr style="background-color: #f2f2f2;">
          <td colspan="3" style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #34495e;">Fluxo Comum</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Obter Mensagens do Chat</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>GET /chat/:chatId/messages</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>GetMessagesDto</code> / <code>Message[]</code></td>
        </tr>
        <tr style="background-color: #f9f9f9;">
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Enviar Mensagem de Chat</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>POST /chat/:chatId/messages</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>SendMessageDto</code> / <code>Message</code></td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;">Enviar Avaliação</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>POST /reviews</code></td>
          <td style="padding: 10px; border: 1px solid #ddd; color: #555;"><code>SubmitReviewDto</code> / <code>ReviewEntity</code></td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

<div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-estrutura-do-projeto" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📁 Estrutura do Projeto</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
    O projeto LimpeJá é um monorepo, contendo as pastas para o frontend (<code>LimpeJaApp/</code>) e para o backend (<code>backend-LimpeJá/</code>).
  </p>

  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
    <h3 id="estrutura-de-pastas-frontend" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Estrutura de Pastas (Frontend)</h3>
    <pre style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; color: #34495e;"><code>
LimpeJáApp/
├── app/
│   ├── (auth)/ # Fluxo de Autenticação
│   │   ├── api/
│   │   ├── components/
│   │   ├── provider-register/
│   │   │   ├── components/
│   │   │   ├── verification/
│   │   │   │   ├── background-check-status.tsx
│   │   │   │   ├── document-upload.tsx
│   │   │   │   ├── facial-recognition.tsx
│   │   │   │   ├── index.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── personal-details.tsx
│   │   │   │   ├── service-details.tsx
│   │   │   │   └── verify-account.tsx
│   │   │   ├── index.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── personal-details.tsx
│   │   │   └── service-details.tsx
│   │   ├── client-register.tsx
│   │   ├── forgot-password.tsx
│   │   ├── layout.tsx
│   │   ├── login.tsx
│   │   ├── README.md
│   │   ├── register-options.tsx
│   │   └── test-connection.tsx
│   ├── (client)/ # Funcionalidades do Cliente
│   │   ├── bookings/ # Agendamentos do Cliente
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [bookingId].tsx
│   │   │   ├── index.tsx
│   │   │   ├── schedule-service.tsx
│   │   │   └── success.tsx
│   │   ├── explore/ # Explorar Serviços/Profissionais
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── data/
│   │   │   ├── styles/
│   │   │   ├── [providerId].tsx
│   │   │   ├── index.tsx
│   │   │   ├── resultados-busca.tsx
│   │   │   ├── search-results.tsx
│   │   │   ├── servicos-por-categoria.tsx
│   │   │   ├── todas-categorias.tsx
│   │   │   └── todos-prestadores-proximos.tsx
│   │   ├── messages/ # Mensagens do Cliente
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [chatId].tsx
│   │   │   └── index.tsx
│   │   ├── ofertas/ # Ofertas do Cliente
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   └── [ofertaId].tsx
│   │   └── profile/ # Perfil do Cliente
│   │       ├── api/
│   │       ├── components/
│   │       ├── edit.tsx
│   │       ├── index.tsx
│   │       ├── layout.tsx
│   │       └── layout.tsx
│   ├── (common)/ # Funcionalidades Comuns (cliente e provedor)
│   │   ├── api/
│   │   ├── components/
│   │   ├── feedback/
│   │   │   └── [targetId].tsx
│   │   ├── help.tsx
│   │   ├── layout.tsx
│   │   ├── notifications.tsx
│   │   ├── privacidade.tsx
│   │   ├── README.md
│   │   ├── settings.tsx
│   │   └── termos.tsx
│   ├── (provider)/ # Funcionalidades do Provedor
│   │   ├── api/
│   │   ├── components/
│   │   ├── messages/ # Mensagens do Provedor
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [chatId].tsx
│   │   │   └── index.tsx
│   │   ├── profile/ # Perfil do Provedor
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── edit-services.tsx
│   │   │   └── index.tsx
│   │   ├── schedule/ # Agenda/Disponibilidade do Provedor
│   │   │   ├── api/
│   │   │   └── components/
│   │   │   └── index.tsx
│   │   ├── services/ # Serviços/Solicitações do Provedor
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [serviceId].tsx
│   │   │   └── index.tsx
│   │   ├── dashboard.tsx
│   │   ├── earnings.tsx
│   │   ├── layout.tsx
│   │   ├── README.md
│   │   └── services/
│   │       ├── authService.ts
│   │       └── clientService.ts
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── doc.md
│   ├── index.tsx
│   ├── README.md
│   └── welcome.tsx
├── assets/ # Recursos estáticos
│   ├── fonts/
│   ├── images/
│   └── lottie/
├── components/ # Componentes de UI verdadeiramente reutilizáveis e atômicos (globais)
│   ├── layout/
│   └── ui/
├── config/
│   ├── AppConfig.ts
│   ├── firebase.ts
│   └── firebaseClient.ts
├── constants/
│   ├── Colors.ts
│   ├── routes.ts
│   ├── strings.ts
│   └── theme.ts
├── contexts/
│   ├── AppContext.tsx
│   ├── AuthContext.tsx
│   └── ProviderRegistrationContext.tsx
├── documentation/
├── hooks/
│   ├── useAuth.ts
│   ├── useColorScheme.ts
│   ├── useColorScheme.web.ts
│   ├── useFormValidation.ts
│   └── useThemeColor.ts
├── node_modules/
├── scripts/
│   └── reset-project.js
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── bookingService.ts
│   ├── chatService.ts
│   ├── clientService.ts
│   ├── faqService.ts
│   ├── firebaseConfig.ts
│   ├── notificationService.ts
│   ├── offerService.ts
│   ├── paymentService.ts
│   ├── providerService.ts
│   ├── reviewService.ts
│   ├── searchService.ts
│   └── verificationService.ts
├── types/
│   ├── auth.ts
│   ├── booking.ts
│   ├── bookings.ts
│   ├── chat.ts
│   ├── clients.ts
│   ├── faqs.ts
│   ├── index.ts
│   ├── navigation.ts
│   ├── notifications.ts
│   ├── offers.ts
│   ├── payments.ts
│   ├── provider.ts
│   ├── providers.ts
│   ├── reviews.ts
│   ├── service.ts
│   ├── services.ts
│   ├── types.ts
│   ├── user.ts
│   ├── users.ts
│   └── verification.ts
├── utils/
│   ├── helpers.ts
│   ├── permissions.ts
│   └── storage.ts
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
└── tsconfig.json
    </code></pre>
  </div>

  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
    <h3 id="estrutura-de-pastas-backend" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Estrutura de Pastas (Backend)</h3>
    <pre style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; color: #34495e;"><code>
 
 
 backend-LimpeJá/

├── dist/

├── node_modules/

├── prisma/

│   ├── migrations/

│   └── schema.prisma

├── src/

│   ├── auth/

│   │   ├── decorators/

│   │   ├── dto/

│   │   ├── guards/

│   │   ├── strategies/

│   │   ├── auth.controller.ts

│   │   ├── auth.module.ts

│   │   └── auth.service.ts

│   ├── availability/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── availability.controller.ts

│   │   ├── availability.module.ts

│   │   └── availability.service.ts

│   ├── bookings/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── bookings.controller.ts

│   │   ├── bookings.module.ts

│   │   └── bookings.service.ts

│   ├── chat/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── gateway/

│   │   ├── chat.controller.ts

│   │   ├── chat.module.ts

│   │   └── chat.service.ts

│   ├── clients/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── clients.controller.ts

│   │   ├── clients.module.ts

│   │   └── clients.service.ts

│   ├── common/

│   │   ├── constants/

│   │   ├── decorators/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── filters/

│   │   ├── interceptors/

│   │   └── pipes/

│   ├── config/

│   │   ├── config.module.ts

│   │   ├── configuration.ts

│   │   └── validation-schema.ts

│   ├── notifications/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── notifications.controller.ts

│   │   ├── notifications.module.ts

│   │   └── notifications.service.ts

│   ├── offers/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── offers.controller.ts

│   │   ├── offers.module.ts

│   │   └── offers.service.ts

│   ├── payments/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── payments.controller.ts

│   │   ├── payments.module.ts

│   │   └── payments.service.ts

│   ├── prisma/

│   │   ├── prisma.module.ts

│   │   └── prisma.service.ts

│   ├── provider-services/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── provider-services.controller.ts

│   │   ├── provider-services.module.ts

│   │   └── provider-services.service.ts

│   ├── providers/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── providers.controller.ts

│   │   ├── providers.module.ts

│   │   └── providers.service.ts

│   ├── reviews/

│   │   ├── dto/

│   │   ├── entities/

│   │   ├── reviews.controller.ts

│   │   ├── reviews.module.ts

│   │   └── reviews.service.ts

│   ├── search/

│   │   ├── dto/

│   │   ├── search.controller.ts

│   │   ├── search.module.ts

│   │   └── search.service.ts

│   ├── services/

│   │   ├── dto/

│   │   ├── update-service.dto.ts

│   │   ├── entities/

│   │   ├── services.controller.ts

│   │   ├── services.module.ts

│   │   └── services.service.ts

│   └── verification/

│       ├── dto/

│       │   ├── submit-cpf.dto.ts

│       │   ├── upload-document.dto.ts

│       │   └── upload-selfie.dto.ts

│       ├── entities/

│       ├── criminal-background-check.service.ts

│       ├── document-processing.service.ts

│       ├── verification.controller.ts

│       ├── verification.module.ts

│       └── verification.service.ts

├── shared/

│   ├── enums/

│   ├── interfaces/

│   └── types/

├── users/

│   ├── dto/

│   ├── entities/

│   ├── users.controller.ts

│   ├── users.module.ts

│   └── users.service.ts

├── app.controller.spec.ts

├── app.controller.ts

├── app.module.ts

├── app.service.ts

├── main.ts

└── test/

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

└── tsconfig.json
    </code></pre>
  </div>
</div>

<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-começando-getting-started" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🚀 Começando (Getting Started)</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
    Para configurar e rodar o projeto localmente, siga os passos abaixo:
  </p>

  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
    <h3 id="pré-requisitos" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Pré-requisitos</h3>
    <p style="color: #555; line-height: 1.6;">Certifique-se de ter as seguintes ferramentas instaladas:</p>
    <ul style="list-style-type: disc; padding-left: 20px; color: #555; line-height: 1.6;">
      <li style="margin-bottom: 5px;"><a href="https://nodejs.org/en/download/" style="color: #3498db; text-decoration: none;">Node.js</a> (versão LTS recomendada)</li>
      <li style="margin-bottom: 5px;"><a href="https://www.npmjs.com/get-npm" style="color: #3498db; text-decoration: none;">npm</a> ou <a href="https://yarnpkg.com/getting-started/install" style="color: #3498db; text-decoration: none;">Yarn</a></li>
      <li style="margin-bottom: 5px;"><a href="https://git-scm.com/downloads" style="color: #3498db; text-decoration: none;">Git</a></li>
      <li style="margin-bottom: 5px;"><a href="https://docs.docker.com/get-docker/" style="color: #3498db; text-decoration: none;">Docker</a> (para rodar o PostgreSQL localmente)</li>
      <li style="margin-bottom: 5px;"><a href="https://docs.expo.dev/workflow/expo-cli/" style="color: #3498db; text-decoration: none;">Expo CLI</a> (<code>npm install -g expo-cli</code>)</li>
    </ul>
  </div>

  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
    <h3 id="instalação" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Instalação</h3>
    <ol style="list-style-type: decimal; padding-left: 20px; color: #555; line-height: 1.6;">
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
      <li style="margin-bottom: 10px;"><strong>Configure o banco de dados (PostgreSQL com Docker):</strong>
        <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
          <li style="margin-bottom: 5px;">Crie um arquivo <code>.env</code> na raiz da pasta <code>backend-LimpeJá</code> com as variáveis de ambiente do banco de dados. Exemplo:
            <pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>DATABASE_URL="postgresql://user:password@localhost:5432/LimpeJá_db"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRATION_TIME="1h"</code></pre>
          </li>
          <li style="margin-bottom: 5px;">Suba o container Docker do PostgreSQL:
            <pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>docker-compose up -d postgres # Assumindo que você tem um docker-compose.yml configurado para o postgres</code></pre>
          </li>
          <li style="margin-bottom: 5px;">Execute as migrações do Prisma para criar o esquema do banco de dados:
            <pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd backend-LimpeJá
npx prisma migrate dev --name init
npx prisma generate
cd ..</code></pre>
          </li>
        </ul>
      </li>
    </ol>
  </div>

  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); margin-bottom: 20px;">
    <h3 id="rodando-localmente" style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Rodando Localmente</h3>
    <ol style="list-style-type: decimal; padding-left: 20px; color: #555; line-height: 1.6;">
      <li style="margin-bottom: 10px;"><strong>Inicie o Backend:</strong>
        <pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd backend-LimpeJá
npm run start:dev # ou yarn start:dev</code></pre>
        <p style="margin-top: 5px; color: #555;">O backend estará disponível em <code>http://localhost:3000</code> (ou na porta configurada).</p>
      </li>
      <li style="margin-bottom: 10px;"><strong>Inicie o Frontend:</strong>
        <p style="margin-top: 5px; color: #555;">Abra um novo terminal.</p>
        <pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>cd LimpeJaApp
npx expo start</code></pre>
        <p style="margin-top: 5px; color: #555;">
          Isso abrirá o Metro Bundler. Você pode escanear o QR code com o aplicativo <a href="https://expo.dev/go" style="color: #3498db; text-decoration: none;">Expo Go</a> no seu celular, ou usar um emulador/simulador <a href="https://docs.expo.dev/workflow/android-studio-emulator/" style="color: #3498db; text-decoration: none;">Android Studio Emulator</a> / <a href="https://docs.expo.dev/workflow/ios-simulator/" style="color: #3498db; text-decoration: none;">iOS Simulator</a>.
          <span style="font-size: 0.9em; color: #888;">[INDEX_18]</span>
        </p>
      </li>
    </ol>
  </div>
</div>

<div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-gerando-um-apk-para-teste-android" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📱 Gerando um APK para Teste (Android)</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 15px;">Para gerar um APK de teste para Android, você pode usar o EAS Build:</p>
  <ol style="list-style-type: decimal; padding-left: 20px; color: #555; line-height: 1.6;">
    <li style="margin-bottom: 10px;">Certifique-se de estar logado no Expo: <code>expo login</code></li>
    <li style="margin-bottom: 10px;">Na pasta <code>LimpeJaApp</code>, execute:
      <pre style="background-color: #ecf0f1; padding: 10px; border-radius: 5px; overflow-x: auto; margin-top: 5px; color: #34495e;"><code>eas build --platform android --profile development</code></pre>
      <p style="margin-top: 5px; color: #555;">Isso iniciará um processo de build na nuvem da Expo. Ao final, você receberá um link para baixar o APK.</p>
    </li>
  </ol>
</div>

<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-contribuindo" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🤝 Contribuindo</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 15px;">
    Contribuições são o que tornam a comunidade de código aberto um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será <strong style="color: #2ecc71;">muito apreciada</strong>.
  </p>
  <p style="color: #555; line-height: 1.6; margin-bottom: 15px;">
    Se você tem uma sugestão para melhorar este projeto, por favor, faça um fork do repositório e crie um pull request. Você também pode simplesmente abrir uma issue com a tag "enhancement".
    Não se esqueça de dar uma estrela ao projeto! Obrigado novamente!
  </p>
  <ol style="list-style-type: decimal; padding-left: 20px; color: #555; line-height: 1.6;">
    <li style="margin-bottom: 10px;">Faça um Fork do Projeto</li>
    <li style="margin-bottom: 10px;">Crie sua Feature Branch (<code>git checkout -b feature/AmazingFeature</code>)</li>
    <li style="margin-bottom: 10px;">Commit suas Mudanças (<code>git commit -m 'Add some AmazingFeature'</code>)</li>
    <li style="margin-bottom: 10px;">Push para a Branch (<code>git push origin feature/AmazingFeature</code>)</li>
    <li style="margin-bottom: 10px;">Abra um Pull Request</li>
  </ol>
</div>

<div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-licença" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📜 Licença</h2>
  <p style="color: #555; line-height: 1.6;">
    Distribuído sob a Licença MIT. Veja <code>LICENSE.txt</code> para mais informações.
  </p>
</div>

<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-contato" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📞 Contato</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 10px;">
    Paulo Silas de Campos Filho/ <a href="https://github.com/techleadevelopers" style="color: #3498db; text-decoration: none;">@techleadevelopers</a> - <a href="mailto:techleadevelopers@gmail.com" style="color: #3498db; text-decoration: none;">techleadevelopers@gmail.com</a>
  </p>
  <p style="color: #555; line-height: 1.6;">
    Link do Projeto: <a href="https://github.com/techleadevelopers/limpe-ja-app" style="color: #3498db; text-decoration: none;">https://github.com/techleadevelopers/limpe-ja-app</a>
  </p>
</div>

<div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-LimpeJá-ganhos-nossa-estratégia-de-monetização" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">💰 LimpeJá Ganhos: Nossa Estratégia de Monetização</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
    O LimpeJá foi concebido para ser uma plataforma que beneficia tanto os clientes em busca de serviços de limpeza de qualidade quanto os profissionais que desejam expandir sua base de clientes e gerenciar seus serviços de forma eficiente. Nossa estratégia de monetização é transparente e se baseia no sucesso mútuo, inspirada em modelos de marketplace consolidados como o Airbnb, mas aplicada ao universo dos serviços de limpeza.
  </p>
  <h3 style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Como o LimpeJá Gera Receita:</h3>
  <p style="color: #555; line-height: 1.6; margin-bottom: 15px;">
    A principal fonte de receita do LimpeJá virá de uma <strong style="color: #2ecc71;">comissão percentual cobrada sobre o valor de cada serviço de limpeza que é agendado e efetivamente pago através da plataforma.</strong>
  </p>
  <ol style="list-style-type: decimal; padding-left: 20px; color: #555; line-height: 1.6;">
    <li style="margin-bottom: 15px;"><strong>Para o Profissional (Prestador de Serviço):</strong>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;">Ao se cadastrar, o profissional define seus preços para os diferentes tipos de serviço que oferece (ex: por hora, por tipo de limpeza, etc.).</li>
        <li style="margin-bottom: 5px;">Quando um cliente contrata e paga por um serviço através do LimpeJá, o valor total é processado pela plataforma.</li>
        <li style="margin-bottom: 5px;">O LimpeJá repassa o valor ao profissional, deduzindo uma taxa de serviço (comissão) previamente acordada e transparente. Esta taxa será nossa principal fonte de receita.</li>
        <li style="margin-bottom: 5px;"><strong style="color: #2ecc71;">Benefícios para o Profissional:</strong> Acesso a uma ampla base de clientes, ferramentas de gerenciamento de agenda, marketing da plataforma, segurança no recebimento e processamento de pagamentos, suporte.</li>
      </ul>
    </li>
    <li style="margin-bottom: 15px;"><strong>Para o Cliente:</strong>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;">O cliente vê o preço total do serviço (que já inclui a porção do profissional e, implicitamente, a margem que permite a comissão do LimpeJá).</li>
        <li style="margin-bottom: 5px;">Em alguns modelos de marketplace, uma pequena taxa de conveniência/serviço pode ser adicionada ao cliente, mas o modelo principal geralmente foca na comissão sobre o valor pago ao prestador. Para o LimpeJá, podemos iniciar focando na comissão sobre o prestador para manter a atratividade para o cliente.</li>
        <li style="margin-bottom: 5px;"><strong style="color: #3498db;">Benefícios para o Cliente:</strong> Conveniência para encontrar e agendar profissionais qualificados, variedade de escolha, sistema de avaliações para confiança, processo de pagamento simplificado e seguro, e a garantia de uma plataforma intermediando o serviço.</li>
      </ul>
    </li>
  </ol>
  <h3 style="color: #2c3e50; font-size: 1.5em; margin-bottom: 15px;">Transparência e Valor:</h3>
  <p style="color: #555; line-height: 1.6;">
    É crucial que a taxa de comissão seja clara para os profissionais e que o valor oferecido pela plataforma (marketing, base de clientes, ferramentas, segurança) justifique essa taxa. O sucesso do LimpeJá dependerá da criação de um ecossistema onde tanto clientes quanto profissionais vejam vantagens claras em usar a plataforma, resultando em um volume saudável de agendamentos e, consequentemente, receita para o aplicativo.
  </p>
  <p style="color: #555; line-height: 1.6;">
    Este modelo permite que o LimpeJá cresça conforme o volume de transações na plataforma aumenta, alinhando nossos ganhos com o sucesso dos profissionais parceiros.
  </p>
</div>

<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="️-roadmap-e-próximas-etapas" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">🛣️ Roadmap e Próximas Etapas</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
    O projeto LimpeJá está em um estágio avançado de desenvolvimento, com a maioria dos fluxos essenciais implementados. As próximas etapas focam em aprimoramentos, expansão de funcionalidades e otimização:
    <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span>
  </p>
  <ol style="list-style-type: decimal; padding-left: 20px; color: #555; line-height: 1.6;">
    <li style="margin-bottom: 15px;"><strong>Funcionalidades de Gestão (Admin):</strong>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;"><strong>Frontend:</strong> Desenvolver interfaces de usuário para POST, PATCH, DELETE em <code>/services</code> e <code>/offers</code>. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
        <li style="margin-bottom: 5px;"><strong>Backend:</strong> Expandir a UI para DELETE <code>/providers/:id</code> e DELETE <code>/users/:id</code>. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
      </ul>
    </li>
    <li style="margin-bottom: 15px;"><strong>Aprimoramentos de Funcionalidades Existentes:</strong>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;"><strong>Backend:</strong>
          <ul style="list-style-type: circle; padding-left: 20px; margin-top: 5px;">
            <li style="margin-bottom: 5px;">Cálculo de <code>walletBalance</code> para clientes e provedores. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
            <li style="margin-bottom: 5px;">Implementação de lógica geoespacial para busca avançada de provedores (<code>sortBy: Distance</code>, <code>latitude</code>, <code>longitude</code>, <code>radius</code>). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
            <li style="margin-bottom: 5px;">Refinar transições de status de agendamento. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          </ul>
        </li>
        <li style="margin-bottom: 5px;"><strong>Frontend:</strong>
          <ul style="list-style-type: circle; padding-left: 20px; margin-top: 5px;">
            <li style="margin-bottom: 5px;">Implementar UI para filtros geoespaciais na busca de provedores. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
            <li style="margin-bottom: 5px;">Desenvolver UI abrangente para consumir e exibir <code>GET /reviews</code> e <code>GET /reviews/:id</code>. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
            <li style="margin-bottom: 5px;">Refletir e gerenciar transições de status de agendamentos de forma mais robusta. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          </ul>
        </li>
      </ul>
    </li>
    <li style="margin-bottom: 15px;"><strong>Integrações Futuras:</strong>
      <ul style="list-style-type: disc; padding-left: 20px; margin-top: 5px;">
        <li style="margin-bottom: 5px;"><strong>Backend:</strong>
          <ul style="list-style-type: circle; padding-left: 20px; margin-top: 5px;">
            <li style="margin-bottom: 5px;">Substituir a simulação PIX por uma integração real com um gateway de pagamento (e.g., Stripe, PagSeguro, Mercado Pago). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
            <li style="margin-bottom: 5px;">Integrar com serviços de notificação push (e.g., Firebase Cloud Messaging). <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
            <li style="margin-bottom: 5px;">Implementar persistência de conversas de chat e funcionalidades como "digitando...", "visto por último". <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          </ul>
        </li>
        <li style="margin-bottom: 5px;"><strong>Frontend:</strong>
          <ul style="list-style-type: circle; padding-left: 20px; margin-top: 5px;">
            <li style="margin-bottom: 5px;">Integrar com um gateway de pagamento real. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
            <li style="margin-bottom: 5px;">Implementar notificações push. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
            <li style="margin-bottom: 5px;">Aprimorar o sistema de mensagens com persistência e indicadores de status. <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
          </ul>
        </li>
      </ul>
    </li>
  </ol>
</div>

<div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); margin-bottom: 40px;">
  <h2 id="-recursos-e-suporte" style="color: #34495e; font-size: 2em; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px; margin-bottom: 20px;">📚 Recursos e Suporte</h2>
  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
    Para informações detalhadas e suporte sobre as tecnologias e o ecossistema do projeto LimpeJá, consulte os seguintes recursos oficiais:
    <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span>
  </p>
  <ul style="list-style-type: none; padding: 0; color: #555; line-height: 1.6;">
    <li style="margin-bottom: 8px;"><a href="https://docs.nestjs.com/" style="color: #3498db; text-decoration: none;">Documentação NestJS</a> <span style="font-size: 0.9em; color: #888;">[INDEX_1]</span></li>
    <li style="margin-bottom: 8px;"><a href="https://reactnative.dev/docs" style="color: #3498db; text-decoration: none;">Documentação React Native</a> <span style="font-size: 0.9em; color: #888;">[INDEX_1, 8, 25, 49]</span></li>
    <li style="margin-bottom: 8px;"><a href="https://docs.expo.dev/router/introduction/" style="color: #3498db; text-decoration: none;">Documentação Expo Router</a> <span style="font-size: 0.9em; color: #888;">[INDEX_1, 10, 12, 16, 20, 33]</span></li>
    <li style="margin-bottom: 8px;"><a href="https://www.prisma.io/docs/" style="color: #3498db; text-decoration: none;">Documentação Prisma ORM</a> <span style="font-size: 0.9em; color: #888;">[INDEX_1, 7, 27, 38, 43]</span></li>
    <li style="margin-bottom: 8px;"><a href="https://socket.io/docs/" style="color: #3498db; text-decoration: none;">Documentação Socket.IO</a> <span style="font-size: 0.9em; color: #888;">[INDEX_1, 15, 21, 22, 23, 26]</span></li>
    <li style="margin-bottom: 8px;"><a href="http://www.passportjs.org/" style="color: #3498db; text-decoration: none;">Documentação Passport.js</a> <span style="font-size: 0.9em; color: #888;">[INDEX_1, 5, 17, 30, 41, 48]</span></li>
    <li style="margin-bottom: 8px;"><a href="https://swagger.io/specification/" style="color: #3498db; text-decoration: none;">Documentação OpenAPI (Swagger)</a> <span style="font-size: 0.9em; color: #888;">[INDEX_1, 4, 31, 32, 36, 45]</span></li>
    <li style="margin-bottom: 8px;"><a href="https://joi.dev/api/" style="color: #3498db; text-decoration: none;">Documentação Joi (Validação)</a> <span style="font-size: 0.9em; color: #888;">[INDEX_1, 19, 28, 29, 37, 42]</span></li>
    <li style="margin-bottom: 8px;"><a href="https://www.postgresql.org/docs/" style="color: #3498db; text-decoration: none;">Documentação PostgreSQL</a> <span style="font-size: 0.9em; color: #888;">[INDEX_1, 14, 24, 35, 39, 40]</span></li>
    <li style="margin-bottom: 8px;"><a href="https://docs.expo.dev/" style="color: #3498db; text-decoration: none;">Documentação Expo</a> <span style="font-size: 0.9em; color: #888;">[INDEX_1, 3, 47]</span></li>
  </ul>
</div>