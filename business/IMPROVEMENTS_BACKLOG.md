Commit: 47db0db2d23a815adcc498cbff64b886423aaa62
Generated: 2025-12-20 12:11:36
Scope: backend-cleaning + app (Expo Router)

# IMPROVEMENTS BACKLOG

1. **[P0] Substituir literals da barra inferior e vagões do cliente por CLIENT_ROUTES**
   - **Problema observado:** components/client/explore/home/NavBar.tsx:24-66 hardcodeia /client/explore, /client/coupons, /client/bookings e chama outer.push(path as any); o scanner ainda apresenta literais /explore, /coupons, /bookings e /h (pp/frontend_routes.md:128-220).
   - **Evidência:** NavBar destrói o novo contrato de rotas tipadas, permitindo que palavras como /h sejam captadas como destino (linha 137 do relatório) e quebram a auditoria.
   - **Impacto:** dificulta refatoração do router, gera 404 se uma rota mudar e impede o uso seguro de CLIENT_ROUTES e outer.push({ pathname }) que o projeto busca adotar.
   - **Proposta:** alinhar nav items a CLIENT_ROUTES.EXPLORE, .COUPONS, .BOOKINGS, .SUPPORT etc, remover s any e usar 
avigateTo(route) tipado; adicionar testes de navegação para este componente.
   - **Complexidade:** S (pequena refatoração de componente).

2. **[P1] Centralizar rotas comuns de perfil em outes.ts em vez de literais**
   - **Problema observado:** pp/client/profile/index.tsx:196-221 ainda usa outer.push('/common/help' as any), '/common/termos' as any e '/common/privacidade' as any mesmo com helpers (COMMON_ROUTES).
   - **Evidência:** o arquivo lista explicitamente três outer.push('/common/...') (linha 211) que ficam fora do novo pool tipado.
   - **Impacto:** incrementa a fragilidade da navegação do perfil (mudança de rota exigiria busca textual) e causa warnings do scanner sobre rotas “fora de índice”.
   - **Proposta:** substituir por outer.push(COMMON_ROUTES.HELP)/.TERMOS/.PRIVACIDADE e consumir desde já outes.ts.
   - **Complexidade:** S.

3. **[P1] Tornar rotas de segurança (panic, incident report) tipadas**
   - **Problema observado:** pp/common/safety/defense.tsx:211-214 chama outer.push('/common/safety/panic' as any) e common/safety/incident-report.tsx segue padrão similar (pp/frontend_routes.md:330-352).
   - **Evidência:** o relatório ainda mostra literal: '/common/safety/panic' e expr: '/common/safety/incident-report' (linhas 332-344), e a falta de typed helpers propaga o uso de s any.
   - **Impacto:** impede auditoria completa das rotas de safety, que são críticas em incidentes reais, e torna o código suscetível a typos (ex.: /h).
   - **Proposta:** usar COMMON_ROUTES.SAFETY_PANIC e .SAFETY_INCIDENT (ou adicionar novos helpers) em toda a pasta common/safety; remover s any e garantir que os botões/reports usem Link com objetos { pathname } quando necessário.
   - **Complexidade:** S.

4. **[P1] Fortalecer antifraude com device/IP em indicações**
   - **Problema observado:** ackend-cleaning/src/referrals/referrals.service.ts:48-130 aplica apenas validações de CPF e limite de 5 convites/30 dias, sem checar fingerprints, IP ou padrões de comportamento definidos.
   - **Evidência:** o serviço menciona TODOs anti-fraude (“TODO: AntifraudService”) e só usa CPF/IP parciais (linhas 70-110).
   - **Impacto:** usuários podem abusar do referral duplicando dispositivos ou IPs semelhantes, corroendo o custo de aquisição e impacto operacional do suporte.
   - **Proposta:** integrar com um serviço antifraude (ou heurística simples) para validar IP/User-Agent, guardar idempotency-key, e registrar eventos para flagging automático (de preferência via LoyaltyService/MissionsService).
   - **Complexidade:** M (envolve backend + possivelmente telemetry).

5. **[P2] Autenticar/verificar webhook PIX/PSP além do parsing raw de main.ts**
   - **Problema observado:** ackend-cleaning/src/main.ts:33-120 aplica middleware que apenas lê o body bruto para /payments/webhook/pix e /payouts/webhook/gateway, sem validar assinatura nem proteger contra replays.
   - **Evidência:** o middleware faz eq.rawBody = data e loga parse com console.log, mas não ativa checagem (WebhookReplay existe no schema prisma/schema.prisma:1057-1062).
   - **Impacto:** facilita replays ou payloads maliciosos se o gateway não fizer handshake; carece de idempotência e de logs seguros.
   - **Proposta:** aplicar validação de assinatura (ex: PagSeguro headers), persistir WebhookReplay para evitar reprocessamento e rejeitar requests sem header. Aproveitar equests.webhook/payments.service para validar idempotencyKey e Transaction.gatewatyTransactionId.
   - **Complexidade:** M.

6. **[P2] Rastrear e eliminar rotas inconsistentes (/client/messages/limpeja, /client/messages/[chatId] dinamicamente)**
   - **Problema observado:** o scanner ainda lista destinos inesperados como /client/messages/limpeja (model file existe pp/client/messages/limpeja.tsx mas não aparece em pp/frontend_routes.md:200-260) e a diferenciação entre common/referrals e common/feedback rende duplicates.
   - **Evidência:** pp/frontend_routes.md mostra literal: /client/messages/[chatId] e literal: /client/messages em múltiplos files (linhas 220-260) sem referencia a limpeja, criando confusão ao mapear roteamento de chat.
   - **Impacto:** rotas de mensagens especiais podem quebrar deep links, e o time não sabe se /client/messages/limpeja deve continuar acessível.
   - **Proposta:** documentar/expor explicitamente esses caminhos (atualizar scanner ou converter limpeja.tsx para route index) e racionalizar os arquivos client/messages/_layout.tsx. 
   - **Complexidade:** M.

## Open Questions
- Precisamos manter as rotas pp/client/messages/limpeja.tsx e /h no scanner ou podemos removê-las/renomeá-las com o novo esquema de rotas tipadas?
- Há SLA ou runbook para o uso das Idempotency-Key em disputas e payouts, para validar se elas precisam ser persistidas em uma tabela dedicada (além do modelo WebhookReplay)?
