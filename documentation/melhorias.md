Relatório de Integração e Arquivos Envolvidos
Este relatório detalha a estratégia de integração e os arquivos-chave envolvidos nas melhorias e funcionalidades de gamificação propostas, visando uma implementação organizada e eficiente.

1. Funcionalidades de Gamificação e Engajamento
As seguintes funcionalidades visam aumentar o engajamento de provedores e clientes através de elementos de gamificação.

1.1. Níveis + Selos de Confiança
Objetivo: Reconhecer e incentivar o desempenho dos provedores, aumentando a confiança dos clientes através de um sistema de níveis visuais (Bronze, Prata, Ouro, Platina).
Estratégia de Integração:
Aproveitar dados existentes de avaliações (reviewService) e serviços concluídos (bookingService).
Criar uma função centralizada no backend para calcular o nível do provedor e cachear essa informação para otimização.
Exibir o selo e, futuramente, uma barra de progresso no perfil do provedor e no dashboard.
Arquivos Envolvidos:
Frontend (React Native / Expo):
app/explore/[providerId].tsx: Exibição do selo de nível no perfil do provedor.
app/dashboard/index.tsx: Exibição do selo e barra de progresso no dashboard do provedor.
Backend (NestJS):
src/modules/review/review.service.ts: Para obter a média de avaliações.
src/modules/booking/booking.service.ts: Para contar os serviços concluídos.
src/modules/provider/provider.service.ts: Para calcular e retornar o nível/selo no DTO do perfil do provedor.
src/modules/provider/dto/provider.dto.ts: Para incluir os campos level e badge.
Melhorias/Evolução: Adição de subníveis (ex: Bronze I, Bronze II) e barra de progresso no perfil.
1.2. Pontos por Ação
Objetivo: Recompensar clientes e provedores por ações que agregam valor à plataforma, como conclusão de serviços, avaliações e indicações.
Estratégia de Integração:
Utilizar o módulo loyalty.tsx existente, renomeando-o para "Seus Pontos".
Registrar pontos por ações específicas (serviço concluído, primeira avaliação, indicação).
Permitir o resgate inicial de pontos como desconto via couponService.
Arquivos Envolvidos:
Frontend (React Native / Expo):
components/loyalty.tsx: Renomear e exibir o saldo de pontos.
Backend (NestJS):
src/modules/loyalty/loyalty.service.ts: Centralizar a lógica de cálculo de pontos e multiplicadores.
src/modules/referral/referral.service.ts: Para pontuar indicações.
src/modules/coupon/coupon.service.ts: Para aplicar descontos no resgate de pontos.
(opcional) src/modules/loyalty/loyalty.controller.ts: Endpoint para histórico de pontos.
Melhorias/Evolução: Criação de multiplicadores temporários de pontos e loja virtual de recompensas.
1.3. Missões Semanais
Objetivo: Incentivar a frequência e diversificação das ações dos usuários através de desafios semanais.
Estratégia de Integração:
Fase Inicial: Começar com missões mockadas no frontend, utilizando TanStack Query para verificar o progresso com base em dados de bookingService e reviewService.
Fase Futura: Implementar um serviço de backend para missões dinâmicas.
Arquivos Envolvidos:
Frontend (React Native / Expo):
app/dashboard/index.tsx: Exibição das missões semanais.
components/missions/MissionList.tsx (se for criado): Para listar as missões.
Backend (NestJS):
(Fase 2) src/modules/missions/missions.service.ts: Para gerar missões dinâmicas.
Melhorias/Evolução: Missões surpresa e textos de missão 100% dinâmicos via backend.
1.4. Ranking Local
Objetivo: Motivar provedores e clientes através da visualização de sua posição em rankings locais, incentivando a melhoria contínua e a competição saudável.
Estratégia de Integração:
Utilizar getNearbyProviders() e a nota média do reviewService para criar rankings.
Exibir a posição do provedor no dashboard e um ranking de "Melhores do bairro" para clientes.
Arquivos Envolvidos:
Frontend (React Native / Expo):
app/dashboard/index.tsx: Mostrar a posição do provedor no ranking.
components/ranking/RankingCard.tsx (se existir): Para exibir a posição local.
app/explore/index.tsx (ou explore/todos-prestadores-proximos.tsx): Para exibir o ranking de "Melhores do bairro".
Backend (NestJS):
src/modules/provider/provider.service.ts: Para o endpoint getNearbyProviders() com funcionalidades de ranking.
(opcional) src/modules/ranking/ranking.service.ts: Serviço dedicado para rankings segmentados.
Melhorias/Evolução: Ranking por filtros (mais bem avaliados, mais rápidos, mais populares) e mensagens de progresso ("Você subiu X posições!").
1.5. Feedback Instantâneo Gamificado
Objetivo: Reforçar positivamente a ação do usuário (avaliação de serviço) com feedback visual e pontos imediatos, incentivando a continuidade do engajamento.
Estratégia de Integração:
Adicionar animações (react-native-reanimated) e contagem de pontos na tela pós-avaliação.
Aproveitar a tela feedback/[targetId].tsx existente.
Arquivos Envolvidos:
Frontend (React Native / Expo):
app/feedback/[targetId].tsx: Adicionar animação e feedback gamificado.
Melhorias/Evolução: Inclusão de frases motivacionais personalizadas e envio de notificação push complementar.
2. Melhorias Essenciais do Sistema (Além da Gamificação)
Estas são melhorias cruciais para a experiência do usuário e do provedor, bem como para a eficiência e diferenciação do mercado.

2.1. Melhorias para o Usuário (Cliente)
Agendamento Inteligente: Sugestões automáticas de horários com base na disponibilidade e histórico.
Precificação Dinâmica Transparente: Exibição em tempo real de como o preço muda (horário, urgência, distância).
Assinaturas Personalizadas: Expansão do módulo subscriptions para planos flexíveis.
Pagamentos Facilitados: Salvar formas de pagamento, parcelamento, cashback, cupons visíveis.
Experiência Pós-Serviço: Fluxo rápido de recontratação.
Segurança: Botão de pânico e relatório de incidentes mais visíveis na UI.
2.2. Melhorias para o Provedor
Onboarding Gamificado: Quebrar o fluxo de cadastro em etapas com recompensas visuais.
Ferramentas de Marketing Interno: Criar pacotes e ofertas sazonais, enviar promoções para clientes antigos.
Insights Acionáveis: Sugestões práticas via aiSuggestionsService e getCustomerInsights.
Gestão de Reputação: Badges/níveis de reputação, notificações de marcos atingidos.
Controle de Agenda Avançado: Bloqueio de períodos recorrentes, integração com calendários externos.
2.3. Diferenciais de Mercado
Garantia e Seguro Embutidos: Tornar o guaranteeService mais visível.
Programa de Fidelidade e Indicações: Expandir loyalty e referrals com benefícios reais.
Atendimento Instantâneo: Chat com respostas automáticas e resposta preditiva para provedores.
2.4. Eficiência e Retenção
Otimização de Performance: Migração para TanStack Query, melhoria de cache offline.
Métricas de Cancelamento e No-Show: Aplicação de políticas justas com base em novos campos.
Notificações Ricas: Suporte a rich media para alertas com imagem, botão de ação e deep link.
3. Integrações Críticas para Lançamento
Estas são duas áreas fundamentais que exigem atenção imediata para garantir a conformidade, robustez e a experiência do usuário antes do lançamento.

3.1. Contextualização Pré-Prompt (Permissões)
Objetivo: Aumentar a taxa de concessão de permissões e a confiança do usuário, explicando o porquê da solicitação de permissão antes de chamar a API do sistema.
Estratégia de Integração:
Exibir um modal ou tela intermediária com justificativa clara antes de solicitar permissões sensíveis (localização, câmera/galeria).
Tratar a recusa de forma graciosa, desabilitando funcionalidades dependentes e informando o usuário sobre como ativar a permissão posteriormente.
Arquivos Envolvidos:
Frontend (React Native / Expo):
app/(common)/safety/panic.tsx: Modal explicativo para permissão de localização (botão de pânico).
app/(auth)/provider-register/service-details.tsx: Modal explicativo para câmera/galeria (upload de documentos/selfie).
app/(client)/profile/edit.tsx: Modal explicativo para câmera/galeria (edição de foto de perfil do cliente).
app/services/securityService.ts: Revisar lógica de biometria (expo-local-authentication) para contextualização, se aplicável.
components/common/PermissionModal.tsx (novo): Componente genérico para prompts de permissão reutilizável.
3.2. Configuração do Sentry no Backend
Objetivo: Habilitar o monitoramento de erros e performance em tempo real no backend, crucial para identificar e resolver problemas rapidamente em produção.
Estratégia de Integração:
Inicializar o Sentry no ponto de entrada da aplicação NestJS.
Configurar o DSN do Sentry via variáveis de ambiente.
Garantir a captura de exceções não tratadas e o monitoramento de performance.
Arquivos Envolvidos:
Backend (NestJS):
src/main.ts: Ponto de entrada para a inicialização do Sentry.
src/config/configuration.ts: Para definir SENTRY_DSN e outras configurações.
src/config/validation-schema.ts: Para validar a variável SENTRY_DSN.
.env (ou ambiente de produção): Para definir a variável de ambiente SENTRY_DSN.
package.json: Para garantir as dependências @sentry/node, @sentry/tracing, @sentry/profiling-node.
4. Estratégia de Testes (Reforço)
Embora não haja arquivos de código específicos para a "estratégia" de testes em si, é fundamental reforçar a implementação de um plano de testes robusto.

Objetivo: Assegurar a qualidade, estabilidade e segurança do aplicativo através de uma abordagem de testes abrangente.
Aspectos a Reforçar:
Documento de Estratégia de Testes: Formalizar tipos de testes (Unitários, Integração, E2E, UI, Performance, Segurança), ferramentas (Jest, React Native Testing Library, Cypress/Detox, JMeter/K6, OWASP ZAP) e metas de cobertura.
Implementação de Testes Abrangentes:
Frontend: Testes de Componentes/UI, Testes de Integração, Testes E2E.
Backend: Testes Unitários, Testes de Integração (com DB de teste), Testes de API, Testes de Performance e Carga, Testes de Segurança.
Integração CI/CD: Automatizar a execução de testes no pipeline de Integração Contínua/Entrega Contínua, bloqueando builds em caso de falha.
Relatórios de Teste: Gerar relatórios automatizados para visibilidade do status e cobertura.
Conclusão
A abordagem proposta permite uma integração faseada das funcionalidades, priorizando o uso de componentes e serviços existentes. As funcionalidades de gamificação, juntamente com as melhorias de experiência do usuário e as integrações críticas de permissões e monitoramento de erros, são fundamentais para o sucesso do lançamento e a retenção de usuários. A estrutura detalhada dos arquivos envolvidos facilita o desenvolvimento e a manutenção, garantindo um processo de integração mais organizado e eficiente.

Arquivos Envolvidos
Frontend (React Native / Expo):

app/explore/[providerId].tsx
app/dashboard/index.tsx
components/loyalty.tsx
components/missions/MissionList.tsx (se for criado)
components/ranking/RankingCard.tsx (se existir)
app/explore/index.tsx (ou explore/todos-prestadores-proximos.tsx)
app/feedback/[targetId].tsx
app/(common)/safety/panic.tsx
app/(auth)/provider-register/service-details.tsx
app/(client)/profile/edit.tsx
app/services/securityService.ts
components/common/PermissionModal.tsx (novo)
Backend (NestJS):

src/modules/review/review.service.ts
src/modules/booking/booking.service.ts
src/modules/provider/provider.service.ts
src/modules/provider/dto/provider.dto.ts
src/modules/loyalty/loyalty.service.ts
src/modules/referral/referral.service.ts
src/modules/coupon/coupon.service.ts
src/modules/loyalty/loyalty.controller.ts (opcional)
src/modules/missions/missions.service.ts (Fase 2)
src/modules/ranking/ranking.service.ts (opcional)
src/main.ts
src/config/configuration.ts
src/config/validation-schema.ts
.env (ou ambiente de produção)
package.json (para dependências do Sentry)