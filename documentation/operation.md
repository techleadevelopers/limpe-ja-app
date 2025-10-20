🚀 PLANO DE AÇÃO – PRÉ-LANÇAMENTO EM 7 DIAS
📅 Dia 1 (hoje) – Checklist final + revisão operacional

 Subir app e backend em ambiente produtivo

 Fazer testes completos em agendamento real, pagamento, disputa e suporte

 Criar checklist de atendimento para o suporte

 Garantir que suporte tem acesso à dashboard + processos claros

 Validar procedimento de pagamento para prestadores (via PIX 24h)

📅 Dia 2 – Validação com usuários reais (alfa fechada)

 Convidar 5–10 clientes reais para testar (amigos, conhecidos da equipe, etc.)

 Observar se conseguem:

Se cadastrar

Contratar

Receber o serviço

Pagar

Avaliar

 Coletar feedback rápido (via WhatsApp mesmo)

📅 Dia 3-4 – Onboarding dos primeiros prestadores

 Convidar 10 diaristas da cidade (foco: Campinas) para onboard

 Oferecer benefício de "turma fundadora": prioridade em agendamento, badge, bonificação

 Validar:

Envio de documentos (KYC)

Disponibilidade de agenda

Fluxo de saque

 Ensinar a usar o app (vídeo curto ou print explicativo no WhatsApp)

📅 Dia 5 – Lançamento suave (soft launch)

 Abrir para público real com pequena campanha local

 Postar nas redes sociais (orgânico): “Já está no ar em Campinas! 🧼”

 Enviar push/email para usuários já cadastrados

 Suporte monitorando 100% (pode ser turnos curtos, mas com SLA claro)

📅 Dia 6-7 – Ajustes, Retenção e Growth Local

 Corrigir bugs da operação real

 Ver quem voltaria a contratar – foco em primeira recompra

 Iniciar campanha local de indicações (ex: indique e ganhe R$30)

 Criar mini “case de sucesso” com 1 diarista e 1 cliente → postar com print/testemunho

👥 EQUIPE: FUNÇÕES-CHAVE (com sua estrutura atual)
Função	Responsável
Suporte clientes	2 pessoas (com script de atendimento + acesso a dashboard)
Marketing & Social	1 pessoa (foco 100% em campanha local e conteúdo orgânico)
Produto & Tech	Você (garante estabilidade, analisa dados, resolve bugs)
Operação & Gestão	Você (garante SLA, coordena prestadores, resolve exceções)
📌 PRIORIDADES ABSOLUTAS PARA A PRIMEIRA SEMANA

Prestadores ativos: 10 diaristas prontos para receber demanda

Pagamentos funcionando: PIX testado e liberado

Suporte preparado: Fluxos mapeados e time treinado

Clientes satisfeitos: Primeiras contratações reais rodando

Marketing local: Posts, boca a boca, WhatsApp, grupos de bairro

Se quiser, posso te ajudar a:

Escrever os scripts de atendimento para o suporte

Criar um pitch para diaristas se cadastrarem

Planejar uma campanha de lançamento local

Quer que a gente monte juntos alguma dessas peças agora?

Governança de Verificação, Disputas e SLAs
-------------------------------------------
- Verificação (KYC): controlada pelo Admin Web via fila de revisão de provedores. UI existente em `admin-web/client/src/pages/users/verification-queue.tsx` com aprovar, rejeitar e bloquear. Backend: `verification.service` e rotas em `backend-cleaning/src/verification/*`.
- Disputas: processo completo no backend (abrir, mensagens, escalonar, resolver) em `backend-cleaning/src/disputes/*`. Admin Web ainda sem UI dedicada; curto prazo usar API + painel de filas (`/admin/queues`) para inspeção/retry. Item de roadmap: página “Disputas” no Admin para decisão/linhas do tempo.
 - SLAs (estado atual):
   - Suporte: prazos definidos em código (`SupportSlaPolicy`) por categoria.
   - Disputas: prazos documentados e parametrizáveis por ENV (`DISPUTE_SLA_*`) nas filas.
 - SLAs (agora controláveis via Redis):
   - Backend: `SettingsService` lê/grava overrides em Redis com fallback para ENV (DISPUTE_SLA_*). Chaves: `settings:sla:*`.
   - Endpoints Admin: `GET/PUT /admin/settings/slas` para leitura/atualização sem redeploy.
   - Admin Web: disponível a aba “SLAs” em Configurações (rota `/settings`) para ajustar prazos de Disputas e Suporte.

Operação prática
----------------
- Verificação: N1 usa a fila do Admin para revisar documentos e aprovar/rejeitar. Notificações automáticas ao provedor.
- Disputas: N1/N2 seguem política; se não houver UI, usar endpoints do backend para escalar/decidir. SLAs acompanhados por jobs BullMQ e monitorados em `/admin/queues`.
- Saques (PIX): manter SLA < 24h operacional com monitoramento de jobs de `payouts` e alertas em caso de falha.

vos próprios) = margens melhores que SaaS tradicional.

Projeções realistas: com 50 cidades ativas, o take rate pode chegar a R$ 11M/mês.

2. Impacto Social

Formalização e renda rápida para diaristas, que hoje dependem apenas de indicações informais.

PIX em 24h resolve liquidez, diferencial frente a concorrentes.

Segurança e confiança com KYC, Face ID, avaliações e conformidade LGPD, gerando credibilidade para cliente e prestador.

Empoderamento real: dá dignidade financeira a uma categoria marginalizada digitalmente.

3. Timing e Contexto

Apps de serviços cresceram no pós-pandemia, mas ninguém focou em diaristas.

Expansão do PIX e maior adesão digital da classe média criam um terreno fértil.

Economia fragilizada → mais pessoas buscando renda extra → oferta de prestadores nunca foi tão alta.

🔑 Diferenciais Competitivos

Segurança e compliance: integração nativa de KYC, LGPD e reconhecimento facial

doc-oficial

.

Experiência completa: do agendamento ao pagamento e chat, com UX moderna

doc-oficial

.

Gamificação + Missões: mantém engajamento dos prestadores e fideliza clientes

doc-oficial

.

Buzz social orgânico: histórias reais de transformação viram combustível de marketing barato.

📌 Relatório: Escala do Time de Suporte e Operações

O MVP entregue já cobre quase tudo em termos técnicos
(frontend sólido em React Native + backend modular em NestJS/Prisma/Postgres com Redis e filas

doc-oficial

).
O ponto crítico agora é suporte e operações, para garantir validação e sucesso do app.

1. Estrutura Inicial do Time

a) Suporte ao Cliente/Prestador (N1 – Chat/Atendimento)

2 a 3 atendentes em horário comercial.

Canais: chat no app + WhatsApp Business API.

Funções: dúvidas, onboarding, reembolso, agendamentos.

b) Backoffice de Verificação e Compliance

1 a 2 pessoas para validar documentos (KYC) e monitorar fraudes.

Operação crítica para confiança da plataforma.

c) Operações e Growth Local

1 gerente de operações local por cidade piloto (ex: Campinas).

Responsável por captação de prestadores, treinamento e retenção.

d) Suporte Técnico/Infra (N2)

1 dev de suporte compartilhado com produto.

Foco: monitorar logs (Sentry), filas e estabilidade (Redis).

2. Processos-Chave

Fila de Verificação: upload de documentos → revisão manual → aprovação/rejeição → notificações automáticas.

Gestão de Disputas: política clara para cancelamentos, reembolsos e mediação cliente x prestador.

Pagamentos e Saques: SLA < 24h para liberar PIX de prestadores.

Atendimento Omnichannel: integração app + WhatsApp + notificações push.

Segurança e Alertas: resposta rápida a falhas críticas e incidentes.

3. Escala Progressiva

Fase 1 – Validação (Campinas)

Time enxuto: 2 suporte N1 + 1 backoffice + 1 operações local.

Meta: 1.000 serviços concluídos/mês.

Fase 2 – Expansão Regional (5 cidades)

Replicar modelo com líderes locais de operações.

Suporte cresce para 6–8 atendentes.

Fase 3 – Escala Nacional (50 cidades)

Centralizar suporte em hub nacional + automação (chatbots, IA para triagem).

Operações locais viram células regionais (Sudeste, Sul, Nordeste).

🎯 Conclusão

✅ Produto tecnicamente maduro e diferenciado.
✅ Mercado gigante, pouco digitalizado, timing perfeito.
✅ Impacto social relevante, gerando buzz orgânico.
⚠️ Ponto crítico: execução operacional e controle de CAC.

Com a estrutura acima, o LimpeJá tem tudo para se tornar um dos cases mais rentáveis e de impacto social do Brasil em 2025.
