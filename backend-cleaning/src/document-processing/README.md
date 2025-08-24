# README — Módulo de Document Processing (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Document Processing** com base nos arquivos: `document-processing.module.ts`, `document-processing.service.ts`, `local-storage.service.ts`.
>
> **Objetivo:** ingestão, validação, armazenamento e processamento de **documentos e imagens** (ex.: KYC — RG/CPF/CNH, comprovante de endereço, evidências de disputa, anexos de suporte). Fornece **metadados**, **URLs assinadas** e integra com **filas** para OCR/antifraude.

---

## 1) Responsabilidades

* **Upload seguro** de arquivos (tamanho, MIME, extensão, hash, deduplicação opcional).
* **Armazenamento** (driver **local** via `local-storage.service.ts`; preparado para S3/GCS).
* **Processamento**: enfileira OCR e validações (quando aplicável) e publica eventos.
* **Distribuição**: geração de **URLs assinadas** temporárias para download/preview.
* **LGPD & Auditoria**: trilhas de acesso, retenção e expurgo programado.

---

## 2) Arquitetura

* **Module**: `DocumentProcessingModule` — registra providers e expõe o service para outros módulos (KYC/Support/Dispute/Providers).
* **Service**: `DocumentProcessingService` — API interna para criar/armazenar/processar documentos, emitir eventos, gerar URLs.
* **Storage**: `LocalStorageService` — implementação de driver **local** (filesystem), com caminhos versionados por ambiente.

**Dependências usuais**: `QueuesService` (OCR/scan), `ConfigService` (ENV), `Sentry` (telemetria), `Uuid`/`Crypto` (hash), `Sharp` (thumbnails opcional), `Mime` (detecção segura), ORM (se houver entidade `Document`).

---

## 3) Modelagem (entidade sugerida)

> *Se o projeto já possuir `document.entity.ts`, alinhar campos; abaixo, o mínimo comum utilizado pelo service.*

```ts
export type DocumentRecord = {
  id: string;                      // uuid
  ownerUserId: string;             // dono (cliente/provedor/admin)
  kind: 'KYC_ID'|'KYC_SELFIE'|'ADDRESS_PROOF'|'DISPUTE_EVIDENCE'|'SUPPORT_ATTACHMENT'|'OTHER';
  storageKey: string;              // caminho no storage (ex.: uploads/2025/08/xx/uuid.ext)
  originalName: string;            // nome do arquivo de upload
  mimeType: string;                // detecção por magic‑number (não confiar só na extensão)
  sizeBytes: number;               // tamanho real
  sha256?: string;                 // hash para dedupe/integridade
  status: 'UPLOADED'|'PROCESSING'|'PROCESSED'|'REJECTED'|'DELETED';
  meta?: Record<string, any>;      // OCR, thumbnails, páginas, dimensões, etc.
  createdAt: Date; updatedAt: Date; deletedAt?: Date | null;
}
```

**Índices**: `(ownerUserId, kind)`, `sha256` (unique parcial), `createdAt`.

---

## 4) DTOs & Tipos (code‑real)

```ts
export class InitUploadDto {
  @IsString() kind: DocumentRecord['kind'];
  @IsString() originalName: string;
  @IsInt()    sizeBytes: number;
  @IsOptional() @IsString() sha256?: string;      // integridade/dedupe
}

export class CompleteUploadDto {
  @IsUUID() documentId: string;                   // id retornado no init
  @IsString() tempPath: string;                   // caminho temporário do arquivo recebido
}

export class SignedUrlQueryDto {
  @IsUUID() id: string;
  @IsOptional() @IsInt() ttlSec?: number;         // default 600
}

export type DocumentSummaryDto = Pick<DocumentRecord,'id'|'kind'|'mimeType'|'sizeBytes'|'status'|'createdAt'> & { url?: string };
```

> Em ambiente **local**, o upload real costuma vir via `multipart/form-data` direto para o controller; o service move o arquivo para o `storageKey` definitivo.

---

## 5) API (Controller — rotas sugeridas)

| Método | Rota                  | Descrição                                                                       |
| -----: | --------------------- | ------------------------------------------------------------------------------- |
|   POST | `/documents/init`     | Registra metadados e retorna `documentId` + `tempUploadPolicy` (quando houver). |
|   POST | `/documents/complete` | Finaliza upload (move do tmp para o storage) e dispara processamento.           |
|    GET | `/documents/:id`      | Retorna metadados (`DocumentSummaryDto`).                                       |
|    GET | `/documents/:id/url`  | Gera **URL assinada** temporária para download/preview.                         |
| DELETE | `/documents/:id`      | Soft‑delete (marca `DELETED` e remove acesso).                                  |

**Erros comuns**: `VALIDATION_ERROR`, `MIME_NOT_ALLOWED`, `FILE_TOO_LARGE`, `HASH_MISMATCH`, `NOT_FOUND`, `FORBIDDEN`.

> Em muitos projetos, esse módulo é **intra‑service** (sem controller público). Caso o teu código tenha apenas service, as rotas acima são referência de consumo por outros módulos (Support/Dispute/KYC).

---

## 6) Service (assinaturas & fluxo)

```ts
class DocumentProcessingService {
  initUpload(ownerUserId: string, dto: InitUploadDto): Promise<{ documentId: string; tempUploadPolicy?: any }>;
  completeUpload(ownerUserId: string, dto: CompleteUploadDto): Promise<DocumentRecord>;
  getSummary(id: string, requesterUserId: string): Promise<DocumentSummaryDto>;
  getSignedUrl(id: string, requesterUserId: string, ttlSec?: number): Promise<string>;
  delete(id: string, requesterUserId: string): Promise<void>;
}
```

### 6.1 `initUpload`

* Valida **MIME/size** previstos com base em `originalName` e `sizeBytes`.
* Gera `documentId` e `storageKey` alvo; salva **registro preliminar** (`status='UPLOADED'`).
* (Opcional) Gera **política de upload** para envio direto ao storage (S3/GCS); com driver local, retorna apenas `documentId`.

### 6.2 `completeUpload`

* Revalida **magic‑number** (detecção MIME real) e **hash** (se fornecida) → protege contra spoofing.
* Move do diretório temporário para `storageKey` definitivo via `LocalStorageService`.
* Atualiza `status` para `PROCESSING` e **enfileira OCR/scan** (quando aplicável):

  * `document.ocr:{id}` (alto custo) — extrai campos (nome, data nasc., doc nº).
  * `document.scan:{id}` — antivírus ou heurística básica (opcional).
* Ao término, marca `PROCESSED` e publica evento `document_processed` (útil para KYC/Disputes/Support).

### 6.3 `getSignedUrl`

* Driver **local**: monta URL interna `/files/<storageKey>?token=<jwt>` com **expiração**; valida **claim** de `ownerUserId`.
* **TTL** default `DOCUMENT_URL_TTL_SEC`.

### 6.4 `delete`

* Soft‑delete (marca `DELETED`, revoga URLs futuras). Expurgo físico por **job assíncrono** (retention window).

---

## 7) Storage (LocalStorageService)

* **Raiz**: `LOCAL_STORAGE_ROOT` (ex.: `/var/app/uploads`).
* **Path**: `uploads/YYYY/MM/DD/<uuid>.<ext>` (evita hot‑dirs). Cria diretórios recursivamente.
* **Operações**: `writeFile(tmp→final)`, `exists`, `readStream`, `delete`, `getSignedUrl` (via token/TTL).
* **Segurança**: nunca expor caminho físico; **sempre** via camada de URL assinada/tokenizada.

---

## 8) Segurança & LGPD

* **MIME real** por magic‑number; negar **executáveis/arquivos zipados**.
* **Tamanho** máximo por `kind`: ex. imagens ≤ 10 MB; PDFs ≤ 15 MB.
* **Criptografia em repouso** (FS com LUKS/ZFS ou S3 SSE) quando disponível.
* **Auditoria**: registrar acessos de URL assinada (quem/quando/IP).
* **Retenção**: `DOCUMENT_RETENTION_DAYS` (ex.: 365 para KYC, 180 para disputas) + job de expurgo.
* **Mascaramento**: ocultar dados sensíveis de OCR nos logs.

---

## 9) Integrações

* **Verification/KYC**: após `PROCESSED`, consolidar **status** (APPROVED/REJECTED/NEEDS\_REVIEW) no módulo de verificação.
* **Disputes**: anexos de evidência (fotos, PDFs) com lifecycle independente e retenção menor.
* **Support**: anexos em tickets (limitar a 3–5 por ticket).
* **Notifications**: push para `NEEDS_REVIEW` (KYC pendente) ou `DOCUMENT_REJECTED` com motivo.
* **Queues**: OCR/scan (alto custo) processados fora do request/response.

---

## 10) Config (ENV)

```env
DOCUMENT_ALLOWED_MIME=image/jpeg,image/png,application/pdf
DOCUMENT_MAX_MB=15
DOCUMENT_URL_TTL_SEC=600
DOCUMENT_RETENTION_DAYS=365
STORAGE_DRIVER=local            # futuro: s3|gcs
LOCAL_STORAGE_ROOT=/var/app/uploads

# OCR/Antivirus (opcional)
OCR_ENABLED=true
OCR_PROVIDER=google-vision      # exemplo; ou aws-textract
ANTIVIRUS_ENABLED=false
```

---

## 11) Exemplos (HTTP)

### 11.1 Iniciar upload

```http
POST /documents/init
{
  "kind": "DISPUTE_EVIDENCE",
  "originalName": "foto_dano.jpg",
  "sizeBytes": 2483222,
  "sha256": "b7c1..."
}
```

**201**

```json
{ "documentId": "doc_01" }
```

### 11.2 Completar upload (driver local)

```http
POST /documents/complete
{
  "documentId": "doc_01",
  "tempPath": "/tmp/upload/abcd-1234.tmp"
}
```

**200** — retorna metadados

### 11.3 Gerar URL assinada

```http
GET /documents/doc_01/url?ttlSec=300
```

**200**

```json
{ "url": "https://api.limpeja.com/files/uploads/2025/08/24/uuid.jpg?token=..." }
```

---

## 12) Telemetria & Alertas

* Eventos: `document_init`, `document_complete`, `document_processing_started`, `document_processed`, `document_signed_url`, `document_deleted`.
* Alertas: taxa de **REJECTED** > X%, falhas em OCR > Y/min, geração de URL acima de p95 200 ms.

---

## 13) QA — Casos críticos

* **MIME spoofing** (extensão .jpg, conteúdo PDF) → rejeitar.
* **Hash mismatch** (se cliente enviou `sha256`) → rejeitar e apagar tmp.
* **Arquivo muito grande** → erro de validação no início, não mover para storage final.
* **Acesso não autorizado** (owner != requester) → `FORBIDDEN`.
* **Expurgo**: garantir remoção física após `deletedAt + retention`.

---

## 14) Roadmap (evolução leve, custo‑benefício)

1. **Driver S3** com presigned POST (reduz CPU do app server).
2. **Redimensionamento**/thumbnails via fila (economiza tráfego no app móvel).
3. **Dedupe por hash** (reutilizar storage quando hash idêntico, com ACL por usuário).
4. **Assinatura por role** (Admin com TTL maior; cliente/provedor com TTL menor).
5. **Zip de exportação** (LGPD portabilidade) com validade curta.

---

## 15) Conclusão

O **Document Processing** unifica a ingestão e o ciclo de vida de documentos sensíveis do LimpeJá. Com **storage local** pronto e ganchos para OCR/scan via filas, atende ao **MVP** com segurança e prepara terreno para evolução (S3/GCS) sem reescrever chamadas dos módulos consumidores.
