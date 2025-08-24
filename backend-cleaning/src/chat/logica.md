8) Chat & Notificações (revisado)
8.1 Chat — Política de habilitação e uso

Visibilidade: o entrypoint do chat fica sempre visível (detalhe do booking / perfil do provedor).

Envio (gating): o input só habilita quando

booking.paymentStatus ∈ {CONFIRMED, AUTHORIZED} ou booking.status ∈ {CONFIRMED, IN_PROGRESS}.

Após COMPLETED, permanece habilitado por 48h (CHAT_ALLOWED_AFTER_COMPLETION_HOURS) para pós-atendimento/re-agendamento.

Em REQUESTED/PENDING sem pagamento confirmado: input desabilitado + CTA “Finalize o pagamento para conversar”.

Disputa aberta (DISPUTE_OPEN): mensagens intermediadas pelo Suporte; links/anexos bloqueados.

Anti-spam: 10 msgs / 10 min / usuário, com backoff progressivo.

8.2 Moderação anti-desintermediação (server-side)

Bloquear troca de contato direto (telefone, e-mail, redes sociais, links) no gateway do chat antes de persistir/emitir.

Detecta e bloqueia:

Telefones BR/intl (ex.: (?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?\d{4,5}[-.\s]?\d{4}).

E-mails (RFC simplificado, ex.: \b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b).

URLs e encurtadores (http(s)://, www., bit.ly, lnkd.in, t.me, wa.me, fb.me, instagr.am).

Palavras-chave/redes (instagram, linkedin, facebook, tiktok, whatsapp, telegram, zap) e menções @usuario.

Ação: rejeitar com CHAT_E_CONTACT_INFO + aviso “Por segurança, não é permitido compartilhar contatos”.

Escalonamento (3 strikes):

bloqueia + aviso; 2) mute 1h; 3) mute 24h + abre ticket Support/Safety.

Anexos: só após CONFIRMED, apenas image/*, até 5MB; bloquear vCards/QRs/arquivos com metadados de contato.

Auditoria: salvar mensagem sanitizada + motivo (não guardar conteúdo sensível em claro).

8.3 Notificações (push/in-app)

Enviar apenas para mensagens aceitas pela moderação.

Gatilhos: emissão/expiração de cupom (T-72h/T-24h), missão (progresso/claim), referral convertido.

Infra: BullMQ + DLQ; eventos de telemetria chat_message_blocked / chat_message_sent.

8.4 Config (feature flags)
CHAT_ENABLED = true
CHAT_MIN_BOOKING_STATUS = CONFIRMED
CHAT_ALLOWED_AFTER_COMPLETION_HOURS = 48
CHAT_PROHIBITED_PATTERNS = [regex...]
CHAT_ATTACHMENT_ALLOWED_AFTER_CONFIRMED = true
CHAT_RATE_LIMIT = "10/10min"
CHAT_STRIKES_WINDOW_DAYS = 30

Tarefas rápidas de backend (para isso funcionar)

ChatGateway/Service: interceptar sendMessage → rodar validadores; lançar CHAT_E_CONTACT_INFO; não persistir payload recusado.

Message model: campos sanitizedBody, blockedReason?, blockedAt?.

ConfigService: carregar CHAT_* do BD/env.

Support hook: ao 3º strike, SupportService.createTicket(userId, bookingId, reason='DISINTERMEDIATION_ATTEMPT').

Rate-limit: limiter por booking+usuário (Redis).

Tests: casos com telefones/links/“arroba” e números espaçados, e anexos.