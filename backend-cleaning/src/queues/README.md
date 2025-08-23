Queues Module (NestJS + Bull)

Módulo de filas responsável por processar tarefas assíncronas e trabalhos de longa duração fora do ciclo de requisição HTTP. Ele reduz latência percebida pelo usuário e melhora a resiliência do sistema.

Sumário

Arquitetura

Casos de uso suportados

Estrutura de pastas

Configuração

Como funciona

APIs do QueuesService

Workers

notification.worker.ts

verification.worker.ts

Boas práticas de uso

Observabilidade & Operação

Testes

Perguntas frequentes

Anexos (snippets úteis)

Arquitetura

NestJS + @nestjs/bull + bull usando Redis como broker.

QueuesModule registra queues e processors (workers) e expõe o QueuesService para o resto do app.

Cada worker roda dentro do mesmo processo Nest por padrão (pode ser separado em processo/instância própria para escala horizontal).

Retentativas, backoff, rate limit, deduplicação por jobId e delays são configuráveis por job.

Nos logs do bootstrap você verá BullModule dependencies initialized, indicando que o Bull foi carregado corretamente.

Casos de uso suportados

Notificações

Envio assíncrono de push, e-mail ou in-app (via NotificationsService), p.ex.:

Solicitar avaliação após Booking COMPLETED

Banners e toasts de missões e cupons

Alertas administrativos (disputas, verificação)

Verificação (KYC / documentos)

Processamento de análise de documentos e validações em background (OCR, liveness, etc.)

(Opcional/Previsto) Disputas

Encaminhar carga de trabalho para uma fila específica de análise/resolução.

Exemplos reais no código de chamada:

queuesService.addNotificationJob('send-notification', payload)

queuesService.addDisputeJob('process-booking-dispute', payload)

queuesService.addVerificationJob('provider-verification', payload)

Estrutura de pastas
src/queues/
  ├─ queues.module.ts         # Registra filas e processors (workers)
  ├─ queues.service.ts        # Fachada p/ enfileirar jobs no app
  ├─ notification.worker.ts   # Worker de notificação (processa 'send-notification', etc.)
  └─ verification.worker.ts   # Worker de verificação (documentos/KYC)

Configuração
Dependências
npm i @nestjs/bull bull ioredis

Variáveis de ambiente
Variável	Exemplo	Descrição
REDIS_HOST	127.0.0.1	Host do Redis
REDIS_PORT	6379	Porta
REDIS_PASSWORD	xxxxx (opcional)	Senha se aplicável
REDIS_TLS	false	Ativa TLS (se usar Redis gerenciado)
QUEUE_PREFIX	cleaningapp	Prefixo p/ nomes das filas
QUEUE_ATTEMPTS_DEFAULT	5	Retentativas padrão
QUEUE_BACKOFF_MS	10000	Backoff linear/exponencial (ms)
QUEUE_RATE_LIMIT	100	Jobs por intervalo (opcional)
QUEUE_RATE_INTERVAL	60000	Janela de rate limit (ms)

Se você usa ConfigModule, leia essas variáveis via ConfigService.

Como funciona

Produção do job
Qualquer módulo injeta QueuesService e chama um método especializado, p.ex.:

await this.queuesService.addNotificationJob('send-notification', {
  userId,
  type: 'REVIEW_REQUEST',
  message: 'Seu serviço foi concluído! Avalie o prestador.',
  targetUrl: `/client/bookings/${bookingId}/review`,
  imageUrl: undefined,
  actionButtons: undefined,
});


Encaminhamento e persistência
O Bull grava o job no Redis, com metadados (tentativas, atraso, prioridade, jobId para dedup, etc.).

Processamento
O worker correspondente (registrado no queues.module.ts) consome o job e executa a ação via serviços de domínio (ex.: NotificationsService, VerificationService).

Retentativas, backoff e DLQ
Falhas disparam retentativas automáticas até o limite. Jobs que esgotam retentativas permanecem como failed (pode-se configurar DLQ com filas separadas).

APIs do QueuesService

A assinatura abaixo é canônica e está alinhada ao que usamos nos módulos de Bookings, Verification e (opcionalmente) Disputes.

export class QueuesService {
  // Notificações
  addNotificationJob(
    name: 'send-notification' | 'send-email' | string,
    payload: {
      userId: string;
      type: string;              // REVIEW_REQUEST, DISPUTE_RESOLUTION, etc.
      message: string;
      targetUrl?: string;
      imageUrl?: string;
      actionButtons?: any;       // JSON com botões/ações
    },
    opts?: {
      jobId?: string;            // dedupe
      delayMs?: number;          // atraso
      attempts?: number;         // retentativas
      backoffMs?: number;        // backoff
      priority?: number;         // 1 (alta) .. 10 (baixa)
    },
  ): Promise<void>;

  // Verificação / KYC
  addVerificationJob(
    name: 'provider-verification' | 'document-ocr' | string,
    payload: Record<string, any>,
    opts?: { jobId?: string; delayMs?: number; attempts?: number; backoffMs?: number; priority?: number },
  ): Promise<void>;

  // Disputas (opcional)
  addDisputeJob(
    name: 'process-booking-dispute' | string,
    payload: {
      bookingId: string;
      reporterUserId: string;
      reporterRole: string;
      reason: string;
      description?: string;
      refundAmount?: number;
      attachments?: string[];
    },
    opts?: { jobId?: string; delayMs?: number; attempts?: number; backoffMs?: number; priority?: number },
  ): Promise<void>;
}


Padrões usados se opts não for informado

attempts: QUEUE_ATTEMPTS_DEFAULT (ou 5)

backoff: QUEUE_BACKOFF_MS (ou 10000)

removeOnComplete: true

removeOnFail: false (mantemos para auditoria)

Workers
notification.worker.ts

Fila: notifications

Jobs típicos:

send-notification: usa NotificationsService para criar registros em Notification e enviar push (FCM) ou in-app.

Opcionalmente send-email, se houver integração de e-mails.

Fluxo:

Recebe payload com { userId, type, message, targetUrl?, imageUrl?, actionButtons? }.

Persiste a notificação (opcional) e dispara o canal (push/email).

Retorna sucesso; em caso de erro, lança exceção para retentativa automática.

Exceções e Retentativa:

Erros de rede → retentativa com backoff.

4xx permanentes (ex.: token inválido) → marcar como failed com contexto.

verification.worker.ts

Fila: verification

Jobs típicos:

provider-verification: orquestra etapas de verificação (OCR do documento, liveness, background check, atualização do VerificationStatus no Provider).

document-ocr: etapa isolada para OCR.

Fluxo:

Busca dados necessários (ex.: URLs de documentos no Provider).

Chama VerificationService / DocumentProcessingService (OCR/Liveness).

Atualiza Provider.verificationStatus.

Pode disparar send-notification avisando o resultado ao provedor.

Boas práticas de uso

Idempotência: use jobId para evitar duplicação (ex.: jobId = review-request:${bookingId}).

Delays conscientes: para review request após Booking.COMPLETED, use atraso de alguns minutos (ex.: delayMs: 5 * 60 * 1000).

Backoff: prefira backoff exponencial para integrações externas instáveis.

Segregue filas: picos de notificação não devem atrasar verificação (filas separadas).

Remoção de jobs: mantenha failed para auditoria; completes podem ser removidos automaticamente.

Rate limit: ative limiter para provedores de e-mail/SMS/push.

Observabilidade & Operação

Logs:

Workers devem registrar job.id, name e payload key (sem PII sensível).

Métricas (recomendado):

Processed / Failed per queue

Tempo médio de processamento

Tamanho da fila

UI de monitoramento:

Considere bull-board para operar jobs (reprocessar, limpar).

DLQ:

Se necessário, crie fila *-dlq e mova failed com regra operacional.

Testes
Unit (mocks)

Mock de Queue (do @nestjs/bull) injetado no QueuesService.

Verifique que add é chamado com name, payload e opts corretos.

E2E

Suba um Redis real (ou em memória) e verifique:

QueuesService.addNotificationJob enfileira job

notification.worker processa e chama NotificationsService

Perguntas frequentes

Posso rodar workers em processo separado?
Sim. Em produção, muitas equipes executam uma instância só de workers para cada fila (ou várias) em pods separados, e as instâncias web apenas produzem jobs.

Como evitar bombar o usuário com notificações?

Use jobId para deduplicar.

Aplique rate limit (limiter) na fila de notificações.

Como versionar payloads de job?
Inclua payload.version e mantenha compatibilidade no worker ao longo das releases.

Anexos (snippets úteis)
Enfileirar notificação após Booking COMPLETED
await this.queuesService.addNotificationJob('send-notification', {
  userId: booking.client.userId,
  type: 'REVIEW_REQUEST',
  message: `Seu serviço de ${booking.providerService.service.name} com ${booking.provider.fullName} foi concluído! Deixe uma avaliação.`,
  targetUrl: `/client/bookings/${booking.id}/review`,
}, {
  jobId: `review-request:${booking.id}`,
  delayMs: 5 * 60 * 1000, // 5min
});

Enfileirar job de verificação
await this.queuesService.addVerificationJob('provider-verification', {
  providerId,
  documents: { front: urlFront, back: urlBack, selfie: urlSelfie },
}, {
  attempts: 8,
  backoffMs: 15000,
});

Enfileirar disputa (opcional)
await this.queuesService.addDisputeJob('process-booking-dispute', {
  bookingId,
  reporterUserId: userId,
  reporterRole: userRole,
  reason,
  description,
  refundAmount,
  attachments,
}, { jobId: `dispute:${bookingId}` });

Conclusão

O Queues Module é a base para tarefas assíncronas do sistema (notificações, verificação, disputas, e outros fluxos futuros como cleanup, cron jobs etc.).
Ele já está integrado aos pontos críticos do domínio (Bookings, Verification e, quando necessário, Missões), provendo resiliência, escala e boa UX com feedbacks não bloqueantes.

Se quiser, eu já gero um README.md pronto e salvo no repositório com essa mesma estrutura.