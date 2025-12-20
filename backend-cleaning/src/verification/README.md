# Verification Module

`VerificationModule` garante a identidade e compliance dos prestadores. Ele orquestra uploads de documentos/selfies, acionamento de filas para análise (OCR + prova de vida), execução de background check e exposição de rotas administrativas que ativam notificações e status manualmente.

## Arquitetura e dependências

- **verification.module.ts** importa `PrismaModule`, `ProvidersModule`, `QueuesModule`, `NotificationsModule`, `UploadModule` e registra `VerificationController`, `VerificationService` e `DocumentProcessingService`.
- **verification.controller.ts** protege rotas com `JwtAuthGuard` + `RolesGuard` e usa `@Roles` para diferenciar `PROVIDER` (auto-uploads) e `ADMIN` (fila, status manual, rejeição). Swagger documenta uploads multipart.
- **verification.service.ts** cuida de toda a lógica: persistência Prisma, geração de URLs via `DocumentProcessingService`, enfileiramento com `QueuesModule`, telemetria (`[TELEMETRY] verification_*`), notificações e interação com novos serviços (ex: `CriminalBackgroundCheckService`).
- **DTOs/entities** – `UploadDocumentDto`, `UploadSelfieDto`, `DocumentPhoto` entity (metadados), `VerificationStatus` enum (UNVERIFIED, UNDER_REVIEW, VERIFIED, REJECTED).
- **Extras** – `criminal-background-check.service.ts` encapsula chamadas a provedores externos, usado pela service para reputação e risco.

## Endpoints expostos (`verification.controller.ts`)

| Método | Rota | Guardas + Papel | Descrição |
| --- | --- | --- | --- |
| `GET /verification/pending-queue` | `UserRole.ADMIN` | Lista provedores em `UNDER_REVIEW`. Serve dashboard de compliance. |
| `POST /verification/upload-document/:type` | `UserRole.PROVIDER` | Upload multipart (frente/verso) do documento (`DocumentPhotoType`). Valida arquivo, envia para queue, retorna URL e mensagem. |
| `POST /verification/upload-selfie` | `UserRole.PROVIDER` | Upload da selfie + documento; dispara jobs de prova de vida. |
| `POST /verification/upload-avatar` | `UserRole.PROVIDER|CLIENT` | Atualiza avatar via `DocumentProcessingService` (reuso de fluxo). |
| `POST /verification/advance-status` | `UserRole.PROVIDER` | Própria solicitação para mover status (ex: `UNVERIFIED → UNDER_REVIEW`). |
| `PATCH /verification/:providerId/status` | `UserRole.ADMIN` | Atualiza manualmente status (`VERIFIED`, `REJECTED`, etc) com motivo (obrigatório para rejeição). |
| `POST /verification/reject/:providerId` | `UserRole.ADMIN` | Rejeita o provedor com motivo; dispara notificação/compliance. |
| `GET /verification/status/:providerId` | `UserRole.ADMIN|PROVIDER` | Consulta atual status, documentos enviados e histórico. |

## Fluxos do `VerificationService`

1. **Upload document/ selfie** – valida `providerId`, checa tipo (`FRONT`/`BACK`), chama `DocumentProcessingService` para armazenar/assinar URLs, salva registros em `DocumentPhoto`, envia job para `QueuesModule` (OCR, validações). Cada upload também atualiza `verificationStatus` para `UNDER_REVIEW` e dispara notificação com template adequado.
2. **Fila & background check** – após upload, `QueuesModule` entrega tarefas que podem chamar `CriminalBackgroundCheckService` (arquivo dedicado). O serviço loga resultados e, quando pronto, marca `verificationStatus` (ex: `VERIFIED` ao passar todos os filtros) e envia notificação via `NotificationsModule`.
3. **Advance status (self-service)** – `advanceVerificationStatus` permite que o próprio provedor “movimente” o status (ex: `UNVERIFIED → UNDER_REVIEW`) quando enviou tudo; o service reconfirma requisitos antes de alterar o campo.
4. **Admin workflows** – `getPendingProviders` retorna filas, `updateProviderVerificationStatusManually` aplica `VERIFIED/REJECTED` com logging, e `rejectProvider` exige razão (enviada na notificação e salva no audit trail). Ambos chamam métodos de service que disparam `notifications` com contexto apropriado.
5. **Status endpoint** – `getVerificationStatus` compila `verificationStatus`, lista de documentos+selfie, e banners de compliance (uso interno).
6. **DocumentProcessing reuse** – `uploadAvatar` executa o mesmo fluxo de upload/assinar URLs, simplificando uso (avatar e documentos usam o mesmo provider).
7. **Criminal background** – `criminal-background-check.service.ts` faz check modular, logando sucesso/falha/timeout, e o service pode reagir (ex: rejeitar) na pipeline.

## Modelos e estados

- **`VerificationStatus`** – `UNVERIFIED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`; o status impede o provider de aceitar serviços enquanto estiver `UNVERIFIED`.  
- **`DocumentPhoto`** – representa uploads (`type`, `status`, `url`, `providerId`, timestamps); a entidade alimenta `queues` e auditoria.  
- **DTOs** – `UploadDocumentDto` (providerId, documentType, file metadata) e `UploadSelfieDto`.  
- **`VerificationQueuePayload`** – metadata para workers (OCR path, providerId, documentType).  
- **`CriminalBackgroundCheckResult`** – usado pelo serviço dedicado para registrar cabecalho, risco e decisão.

## Integrações e observabilidade

- **QueuesModule** – enfileira OCR, validação facial, reprovação automática, etc.  
- **NotificationsModule** – notifica o provider (novo status, rejeição, solicitação de retrabalho).  
- **ProvidersModule** – atualiza o perfil do provider (`verificationStatus`) e limita ações (negócios bloqueados para `UNVERIFIED`).  
- **DocumentProcessingModule / UploadModule** – gerencia armazenamento de arquivos (GCS/S3) e fornece URLs assinadas.  
- **CriminalBackgroundCheckService** – enfileira/verifica dados governamentais (uso de API externa).  
- **Logger + Telemetria** – `VerificationService` e controller registram `[TELEMETRY] verification_*` para uploads, status avançado, rejeição e aprovações.  
- **Swaggers** – `@ApiConsumes`, `@ApiBody` descrevem multipart forms para uploads com `memoryStorage`.

## Recomendações

1. Mantenha `QueuesModule` + workers ativos (OCR/prova de vida) para evitar backlog; monitore `verification/pending-queue`.  
2. Automatize notificações em `updateProviderVerificationStatusManually` e `rejectProvider` para fechar o ciclo compliance → negócio.  
3. Quando for necessário exigir novas verificações (ex: recheck periódico ou reupload), reutilize `uploadDocument`/`uploadSelfie` com `DocumentPhoto.status` + `verificationStatus` resets.  
