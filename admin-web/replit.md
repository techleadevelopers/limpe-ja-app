📌 Relatório de Consolidação — Painel Administrativo LimpeJá

Versão do Documento: v1.0
Status do App: ~60% consolidado
Meta: Elevar para 100% produção real

1. Visão Geral do Painel

O LimpeJá possui hoje:

Base sólida em React + Tailwind + Radix UI.

Estrutura modular bem organizada com pages, primitives e hooks.

Integração com backend já funcional para métricas, provedores, clientes e autenticação.

Diversas páginas placeholder que ainda não conversam com os serviços de backend.

Para atingir 100% de consolidação, precisamos:

Finalizar as páginas placeholder → conectar com APIs reais.

Melhorar integração com endpoints críticos (cupons, missões, disputas, assinaturas).

Adicionar governança administrativa real: retenção, regras dinâmicas, bloqueios, auditorias.

Implementar telemetria e analytics centralizados.

2. Status Atual dos Módulos
Módulo	Status	Integração Backend	Criticidade	Ação Necessária
Dashboard	✅ Completo	✅ Sim	🔵 Alta	Só otimizar KPIs para dados reais.
Providers	✅ Completo	✅ Sim	🔵 Alta	Ajustar filtros de métricas avançadas.
Clients	🟡 Parcial	✅ Sim	🟡 Média	Finalizar modais e filtros.
Coupon Management	🔴 Placeholder	⚠️ Parcial	🔴 Alta	Criar CRUD completo + integração com API.
Missions Management	🔴 Placeholder	⚠️ Parcial	🔴 Alta	Adicionar listagem, edição e triggers de missões.
Booking Management	🔴 Placeholder	✅ Parcial	🔵 Alta	Finalizar cancelamentos, reagendamentos e disputas.
Subscription Management	🔴 Placeholder	⚠️ Parcial	🔴 Alta	Integrar planos, billing e recorrência.
Dispute Management	🔴 Placeholder	⚠️ Parcial	🔴 Alta	Construir central de disputas + auditoria.
Payment Management	🔴 Placeholder	⚠️ Parcial	🔴 Alta	Integrar ledger de pagamentos e saques.
Financial Analytics	🟡 Parcial	⚠️ Mockado	🟡 Média	Integrar com earnings do backend.
Safety Alerts	🔴 Placeholder	✅ Sim	🟡 Média	Adicionar lista de alertas e painéis de incidentes.
Referral Management	🔴 Placeholder	⚠️ Parcial	🟢 Baixa	Construir tela de performance de indicações.
Notifications	🟡 Parcial	⚠️ Mockado	🟢 Média	Substituir dados mockados por API real.
3. Arquivos/Páginas para Atualizar e Consolidar
3.1. Páginas Críticas
Arquivo	Status Atual	O que precisa
coupon-management.tsx	Placeholder	Criar CRUD completo + relatórios.
subscription-management.tsx	Placeholder	Integração com billing e cancelamentos.
mission-management.tsx	Não existe	Nova página para criação/edição de missões.
booking-management.tsx	Placeholder	Listar agendamentos, reagendar, cancelar, abrir disputas.
payment-management.tsx	Placeholder	Ledger detalhado, auditoria de transações e saques.
dispute-management.tsx	Placeholder	Central de resolução com workflow de aprovação.
financial-analytics.tsx	Mockado	Conectar com earnings reais.
safety-alerts.tsx	Placeholder	Painel para monitorar incidentes em tempo real.
3.2. Novos Arquivos Necessários
Novo Arquivo	Objetivo	Descrição Técnica
mission-management.tsx	Gestão de Missões	CRUD completo + triggers de recompensas.
coupon-analytics.tsx	Métricas de Cupons	Relatórios detalhados de uso e conversão.
referral-performance.tsx	Métricas de Indicações	Dashboard de crescimento via referrals.
withdrawal-approval.tsx	Aprovação de Saques	Aprovar, bloquear e auditar saques.
audit-logs.tsx	Auditoria Global	Histórico de todas as ações administrativas.
system-settings.tsx	Configurações Avançadas	Ajustes de regras dinâmicas e políticas.
4. Consolidação dos Endpoints Backend

Baseando-se na documentação e na estrutura atual, precisamos integrar os seguintes serviços:

Módulo	Endpoint REST	Uso no Admin
Cupons	/api/coupons	CRUD + relatórios
Missões	/api/missions	Listagem + triggers
Assinaturas	/api/subscriptions	Billing + cancelamentos
Pagamentos	/api/earnings	Ledger + saques
Disputas	/api/disputes	Aprovação + workflow
Safety	/api/safety	Alertas em tempo real
Notificações	/api/notifications	Push e in-app
5. Roadmap Técnico
Fase	Foco	Páginas/Arquivos	Resultado Esperado
Fase 1	Cupons + Missões	coupon-management.tsx, mission-management.tsx	Ferramentas críticas de retenção e cashback.
Fase 2	Assinaturas + Pagamentos	subscription-management.tsx, payment-management.tsx	Controle financeiro completo.
Fase 3	Bookings + Disputas	booking-management.tsx, dispute-management.tsx	Operação completa e governança de conflitos.
Fase 4	Analytics Avançados	financial-analytics.tsx, coupon-analytics.tsx, referral-performance.tsx	Métricas consolidadas de retenção e conversão.
Fase 5	Governança & Segurança	audit-logs.tsx, safety-alerts.tsx, withdrawal-approval.tsx	Painel robusto com compliance e auditoria.
6. Resultado Final da Consolidação

Após a entrega completa do roadmap, teremos:

100% das páginas integradas com APIs reais.

Admin capaz de gerenciar cupons, missões, disputas, assinaturas, pagamentos, alertas e métricas.

Governança total de retenção, cashback e promoções.

Dashboard com KPIs reais, atualizados e exportáveis.

Logs de auditoria centralizados para segurança e compliance.

📌 BLUEPRINT FINAL — Painel Administrativo LimpeJá

Versão: v2.0
Status Atual: 60% consolidado
Meta: 100% pronto para produção
Stack: React + Tailwind + Radix + Wouter + TanStack Query + Recharts + API REST LimpeJá

1. Arquitetura Consolidada do Painel Admin
admin/
├── src/
│   ├── components/      # Primitives, UI compartilhada, wrappers Radix
│   ├── layouts/         # Sidebar, Header, Notifications
│   ├── hooks/           # useAuth, useToast, useQueryClient, useMobile
│   ├── pages/
│   │   ├── dashboard/
│   │   ├── providers/
│   │   ├── clients/
│   │   ├── bookings/
│   │   ├── coupons/            # [NOVO] CRUD completo + analytics
│   │   ├── missions/           # [NOVO] Gestão gamificada
│   │   ├── subscriptions/      # [NOVO] Planos + billing recorrente
│   │   ├── payments/           # Ledger, conciliação, aprovação de saques
│   │   ├── disputes/           # Workflow de disputas e bloqueios
│   │   ├── safety/             # Alertas de incidentes
│   │   ├── notifications/
│   │   ├── analytics/          # [NOVO] Financeiro, retenção e ROI
│   │   ├── referrals/          # Indicadores de referrals
│   │   ├── settings/
│   ├── services/
│   │   ├── api.ts             # Integração REST consolidada
│   │   ├── coupons.ts         # CRUD cupons
│   │   ├── missions.ts        # Gestão missões
│   │   ├── payments.ts        # Ledger e saques
│   │   ├── bookings.ts        # Agendamentos e cancelamentos
│   │   ├── subscriptions.ts   # Planos e billing
│   │   ├── disputes.ts        # Central de disputas
│   │   ├── analytics.ts       # KPIs avançados
│   ├── store/
│   │   ├── auth.store.ts      # Sessões, roles e RBAC
│   │   ├── ui.store.ts        # Preferências do painel
│   ├── styles/
│   │   ├── globals.css
│   │   ├── themes.css
│   ├── utils/
│   │   ├── cn.ts             # Tailwind class merge
│   │   ├── formatters.ts     # Dinheiro, datas, percentuais
│   │   ├── kpis.ts          # Cálculo de CAC, LTV, ROI
│   ├── index.html
│   ├── main.tsx
│   ├── App.tsx

2. Fluxo dos Módulos e Integrações
Módulo	Frontend	API / Serviço	Funções-Chave
Dashboard	dashboard.tsx	/api/metrics	KPIs, CAC, LTV, retenção.
Cupons	coupon-management.tsx	/api/coupons	Criar, editar, revogar, analytics.
Missões	mission-management.tsx	/api/missions	Criar desafios, recompensas, triggers.
Assinaturas	subscription-management.tsx	/api/subscriptions	Billing, planos, recorrência.
Pagamentos	payment-management.tsx	/api/earnings	Ledger, aprovar/recusar saques, conciliação.
Disputas	dispute-management.tsx	/api/disputes	Workflow de resolução, bloqueio, auditoria.
Bookings	booking-management.tsx	/api/bookings	Listar, reagendar, cancelar, forçar refund.
Referrals	referral-management.tsx	/api/referrals	Acompanhar conversão de indicações.
Safety	safety-alerts.tsx	/api/safety	Alertas, incidentes e panic-button.
Notificações	notifications.tsx	/api/notifications	Push, segmentação por grupos.
Analytics	financial-analytics.tsx	/api/analytics	Receita, retenção, ROI.
3. Páginas que Precisam de Consolidação
Arquivo	Status Atual	O que precisa ser feito
coupon-management.tsx	Placeholder	Implementar CRUD completo + relatórios + gráficos.
mission-management.tsx	Inexistente	Criar página + integração backend + triggers.
subscription-management.tsx	Placeholder	Conectar planos reais e billing recorrente.
payment-management.tsx	Placeholder	Ledger financeiro com aprovação de saques.
booking-management.tsx	Placeholder	Finalizar reagendamentos, cancelamentos e disputas.
dispute-management.tsx	Placeholder	Criar central de workflow para auditoria.
financial-analytics.tsx	Mockado	Integrar dados reais de earnings e KPIs.
safety-alerts.tsx	Placeholder	Adicionar painel de incidentes com atualização live.
referral-management.tsx	Placeholder	Implementar indicadores de referrals reais.
4. Novas Páginas Necessárias
Novo Arquivo	Objetivo	Descrição Técnica
coupon-analytics.tsx	Métricas de Cupons	Relatórios de ROI, CTR, cashback.
mission-analytics.tsx	Engajamento	KPIs de missões completadas vs. ativas.
withdrawal-approval.tsx	Controle de Saques	Aprovar ou bloquear saques grandes.
audit-logs.tsx	Compliance	Histórico de todas as ações administrativas.
system-settings.tsx	Regras Dinâmicas	Definir limites, cashback e retenção.
5. Roadmap Técnico de Consolidação
Fase	Módulos	Páginas/Arquivos	Resultado
Fase 1	Cupons + Missões	coupon-management.tsx, mission-management.tsx	Controle total de cashback e gamificação.
Fase 2	Financeiro + Subscriptions	payment-management.tsx, subscription-management.tsx	Billing completo + aprovações críticas.
Fase 3	Bookings + Disputas	booking-management.tsx, dispute-management.tsx	Governança operacional + auditoria.
Fase 4	Analytics	financial-analytics.tsx, coupon-analytics.tsx	Métricas consolidadas para marketing e growth.
Fase 5	Segurança e Retenção	safety-alerts.tsx, audit-logs.tsx	Incidentes + telemetria real.
6. Resultado da Consolidação

100% das páginas integradas com APIs reais.

Admin robusto com gestão de cupons, missões, assinaturas, pagamentos, disputas, bookings, safety e analytics.

Governança total de retenção, cashback, missões gamificadas e promoções.

Dashboard com KPIs reais, exportáveis e atualizados.

Auditoria completa de tudo que acontece no app.

🌎 Blueprint Visual — Painel Administrativo LimpeJá (100% Produção)
                 ┌──────────────────────────────┐
                 │        Painel Admin          │
                 │ React + Tailwind + Radix UI │
                 └─────────────┬────────────────┘
                               │
                 ╔═════════════╧═════════════╗
                 ║                           ║
          BACKEND API                 REALTIME / QUEUES
     (NestJS + Prisma + REST)          (BullMQ + WS)

1. Estrutura Modular do Admin
Módulo	Status Atual	Ação	Prioridade
Dashboard	✅ Pronto	Integrar KPIs reais	🔵 Alta
Cupons	🔴 Placeholder	Criar CRUD + relatórios + KPIs	🔴 Crítica
Missões	🔴 Inexistente	Criar gestão gamificada + triggers	🔴 Crítica
Assinaturas	🔴 Placeholder	Integrar billing real + cancelar	🔴 Alta
Pagamentos	🔴 Placeholder	Ledger financeiro + aprovação	🔴 Alta
Disputas	🔴 Placeholder	Workflow + auditoria	🔴 Alta
Bookings	🟡 Parcial	Finalizar reagendamentos e cancelamentos	🟡 Alta
Safety	🔴 Placeholder	Incidentes + Panic + Auditoria	🟠 Média
Analytics	🟡 Mockado	Conectar CAC, LTV, ROI reais	🟠 Média
Referrals	🔴 Placeholder	Painel de indicações	🟢 Baixa
Notificações	🟡 Parcial	API push + segmentação	🟠 Média
2. Mapa de Fluxo de Dados
┌─────────────┐     REST API      ┌──────────────┐
│  Painel     │  <────────────>   │   Backend    │
│  Admin      │    CRUD, KPIs     │   NestJS     │
└───────┬─────┘                   └─────┬────────┘
        │                               │
        │ WebSockets (Tempo Real)       │
        │                               │
┌───────▼─────────┐        ┌────────────▼─────────┐
│  Mobile App     │        │    BullMQ / WS       │
│  LimpeJá        │<------>│   Fila + Eventos    │
└─────────────────┘        └──────────────────────┘

3. Páginas que Devem Ser Atualizadas
Página	Arquivo	Atualização Necessária	Integração Backend
Gestão de Cupons	coupon-management.tsx	CRUD completo + analytics	/api/coupons
Gestão de Missões	mission-management.tsx	Nova página	/api/missions
Assinaturas	subscription-management.tsx	Billing, planos, cancelamento	/api/subscriptions
Ledger Financeiro	payment-management.tsx	Saques, conciliação, aprovação	/api/earnings
Disputas	dispute-management.tsx	Workflow + resolução	/api/disputes
Bookings	booking-management.tsx	Reagendar, cancelar, abrir disputa	/api/bookings
Analytics Financeiro	financial-analytics.tsx	KPIs reais	/api/analytics
Alertas	safety-alerts.tsx	Monitoramento real-time	/api/safety
4. Novas Páginas Necessárias
Novo Arquivo	Objetivo	Descrição Técnica
coupon-analytics.tsx	Relatórios detalhados	ROI, CTR, consumo, retenção
mission-analytics.tsx	Performance gamificada	KPIs de missões e engajamento
withdrawal-approval.tsx	Aprovar ou bloquear saques	Segurança financeira
audit-logs.tsx	Compliance total	Histórico de todas as ações admin
system-settings.tsx	Regras avançadas	Limites, cashback, retenção
5. Integrações Backend Críticas
Serviço	Endpoint	Uso no Admin
Coupons	/api/coupons	CRUD, expiração, revogação
Missions	/api/missions	Criar desafios + triggers
Subscriptions	/api/subscriptions	Billing + cancelamento
Payments	/api/earnings	Ledger + aprovação de saques
Disputes	/api/disputes	Workflow + resolução
Safety	/api/safety	Alertas em tempo real
Analytics	/api/analytics	CAC, LTV, ROI
Referrals	/api/referrals	Conversão de indicações
6. Roadmap de Consolidação
Sprint	Foco	Arquivos	Entrega
Sprint 1	Cupons + Missões	coupon-management.tsx, mission-management.tsx	Controle total de retenção e gamificação
Sprint 2	Financeiro	payment-management.tsx, subscription-management.tsx	Gestão completa de billing e saques
Sprint 3	Disputas + Bookings	dispute-management.tsx, booking-management.tsx	Governança operacional completa
Sprint 4	Analytics	financial-analytics.tsx, coupon-analytics.tsx	KPIs reais + relatórios
Sprint 5	Segurança + Auditoria	safety-alerts.tsx, audit-logs.tsx	Incidentes + compliance total