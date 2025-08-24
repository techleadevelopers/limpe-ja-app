# README — Módulo de Reviews (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Reviews** com base nos arquivos: `reviews.module.ts`, `reviews.controller.ts`, `reviews.service.ts`, `review.entity.ts`, `get-reviews.dto.ts`, `review.dto.ts`, `submit-review.dto.ts`, `smart-suggestions.dto.ts`.
>
> **Objetivo:** coletar e expor **avaliações verificadas** de clientes sobre serviços/provedores, com **uma review por reserva concluída**, resposta pública do provedor, agregados (médias/contagens), filtros, fotos e **sugestões inteligentes** de resposta. Integra com **Missions**, **Coupons**, **Ranking**, **Search** e **Notifications**.

---

## 1) Responsabilidades

* Permitir **envio de review** somente para **bookings `COMPLETED`** pelo **cliente** daquela reserva.
* Persistir **rating (1..5)**, comentário, fotos e metadados de verificação/moderação.
* Expor **listagem pública** por provedor/serviço, com filtros (nota mínima, texto, fotos) e paginação.
* Calcular **agregados**: média, distribuição por estrelas, total com fotos, NPS simplificado (opcional).
* Habilitar **resposta do provedor** (uma resposta oficial + opcionais edições versionadas).
* Emitir **eventos** (ex.: `review_submitted`) para **missões** e **ranking**.

---

## 2) Arquitetura

* **Module**: `ReviewsModule` — registra controller/service, injeta repositório/ORM, cache e integra dependências (Bookings/Missions/Notifications/DocumentProcessing/Providers/Metrics).
* **Controller**: `ReviewsController` — rotas públicas de consulta e rotas autenticadas para envio/gestão.
* **Service**: `ReviewsService` — regra de negócio para validação de elegibilidade, criação, agregados, respostas e sugestões inteligentes.
* **Entity**: `Review` — modelo persistente da avaliação.

---

## 3) Modelagem (entity — code‑real esperado)

```ts
export type ReviewStatus = 'PUBLISHED'|'PENDING'|'REJECTED'|'FLAGGED';   // moderação

export class Review {
  id: string;                        // uuid
  bookingId: string;                 // FK obrigatório (1:1 com review)
  providerId: string;                // FK provedor avaliado
  clientId: string;                  // autor (cliente)
  serviceId?: string | null;         // serviço referenciado na reserva

  rating: number;                    // 1..5 (int)
  comment?: string | null;           // texto (sanitizado)
  photos?: string[] | null;          // storageKeys (Document Processing)

  isVerified: boolean;               // true se vínculo com booking COMPLETED
  status: ReviewStatus;              // publicação/moderação

  providerReply?: {
    text: string;                    // resposta pública do provedor
    repliedAt: Date;
    editedAt?: Date | null;          // versão mais recente
  } | null;

  helpfulYes?: number;               // votos de utilidade (opcional)
  helpfulNo?: number;

  createdAt: Date;                   // enviada em
  updatedAt: Date;                   // última alteração
  deletedAt?: Date | null;           // soft delete se necessário
}
```

**Índices recomendados:** `(providerId, status, createdAt desc)`, `bookingId (unique)`, `rating`, `clientId`, `serviceId`.

---

## 4) DTOs (code‑real)

### 4.1 `SubmitReviewDto`

```ts
export class SubmitReviewDto {
  @IsString() bookingId: string;                  // reserva COMPLETED
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() @MaxLength(2000) comment?: string;
  @IsOptional() @IsArray() @IsString({each:true}) photos?: string[];  // storageKeys
}
```

### 4.2 `GetReviewsDto`

```ts
export class GetReviewsDto {
  @IsOptional() @IsString() providerId?: string;
  @IsOptional() @IsString() serviceId?: string;
  @IsOptional() @IsInt() @Min(1) minRating?: number;        // 1..5
  @IsOptional() @IsBoolean() withPhotos?: boolean;
  @IsOptional() @IsString() q?: string;                     // busca por texto
  @IsOptional() @IsIn(['recent','rating','helpful']) order?: 'recent'|'rating'|'helpful';
  @IsOptional() @IsInt() @Min(1) page?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) pageSize?: number;
}
```

### 4.3 `ReviewDto` (payload público)

```ts
export class ReviewDto {
  id: string; bookingId: string; providerId: string; clientId: string;
  rating: number; comment?: string; photos?: string[]; createdAt: string;
  providerReply?: { text: string; repliedAt: string; editedAt?: string } | null;
  isVerified: boolean; serviceId?: string;
}
```

### 4.4 `SmartSuggestionsDto` (opcional)

```ts
export class SmartSuggestionsDto {
  reviewId: string;                   // contexto
  suggestions: string[];              // respostas curtas sugeridas
}
```

---

## 5) Rotas (ReviewsController)

| Método | Rota                             | Scope           | Descrição                                                                         |                                         |
| -----: | -------------------------------- | --------------- | --------------------------------------------------------------------------------- | --------------------------------------- |
|    GET | `/reviews`                       | Público         | Lista reviews por `providerId`/`serviceId` com filtros e paginação.               |                                         |
|    GET | `/reviews/:id`                   | Público         | Detalhe de uma review (publicada).                                                |                                         |
|    GET | `/reviews/summary`               | Público         | Agregados por `providerId`/`serviceId` (média, contagem por estrelas, com fotos). |                                         |
|   POST | `/reviews`                       | AUTH (client)   | Envia review (uma por booking). Valida booking `COMPLETED` + ownership.           |                                         |
|   POST | `/reviews/:id/reply`             | AUTH (provider) | Resposta pública do provedor (uma resposta, com edição possível).                 |                                         |
|   POST | `/reviews/:id/helpful`           | AUTH (user)     | Voto de utilidade (\`helpful=true                                                 | false\`) com rate‑limit por usuário/IP. |
|    GET | `/reviews/:id/smart-suggestions` | PROVIDER (self) | Sugestões de resposta (texto curto), se habilitado.                               |                                         |
| DELETE | `/reviews/:id`                   | ADMIN           | Remoção/soft‑delete ou `status='REJECTED'` via moderação.                         |                                         |

**Erros comuns**: `VALIDATION_ERROR`, `BOOKING_NOT_COMPLETED`, `ALREADY_REVIEWED`, `FORBIDDEN`, `NOT_FOUND`, `MODERATION_REQUIRED`.

---

## 6) Service (assinaturas & regra)

```ts
class ReviewsService {
  list(q: GetReviewsDto): Promise<{ items: ReviewDto[]; total: number; summary?: any }>;
  getById(id: string): Promise<ReviewDto>;

  submit(clientUserId: string, dto: SubmitReviewDto): Promise<ReviewDto>;  // valida elegibilidade
  reply(providerUserId: string, reviewId: string, text: string): Promise<ReviewDto>;
  voteHelpful(userId: string, reviewId: string, helpful: boolean): Promise<void>;

  summary(filter: { providerId?: string; serviceId?: string }): Promise<{
    avg: number; count: number; stars: { s1: number; s2: number; s3: number; s4: number; s5: number }; withPhotos: number
  }>;

  smartSuggestions(providerUserId: string, reviewId: string): Promise<SmartSuggestionsDto>; // opcional
}
```

### 6.1 Elegibilidade & janelas

* Somente **cliente** vinculado ao **bookingId** pode avaliar; booking deve estar **`COMPLETED`** e dentro da **janela** (ex.: entre 1h e 30 dias após conclusão).
* **Uma review por booking** (`bookingId` único); permitir **edição** limitada (ex.: em 24h) — se implementado.
* Provedor pode enviar **uma resposta** oficial (editável, com `editedAt`).

### 6.2 Moderação & sanitização

* Sanitizar `comment`/`reply` (HTML/markdown básico) — bloquear profanity, PII sensível e **contato direto** (telefones/links/redes sociais).
* `status`: `PENDING` (se fila de moderação ativa) → `PUBLISHED`; `FLAGGED/REJECTED` por abuso.

### 6.3 Agregados & cache

* `summary` calcula média e histograma por estrela; **cache** por `(providerId|serviceId)` com TTL (ex.: 5 min) e **invalidação** em novos envios/edições.
* `list` pode embutir `summary` no primeiro page para reduzir chamadas.

### 6.4 Sugestões inteligentes (opcional)

* Gera 2–3 **respostas curtas** e empáticas para o provedor, baseadas em rating/tema.
* **Não envia** automaticamente; provedor edita/aceita antes de publicar.

### 6.5 Integrações

* **MissionsModule**: `trackEvent(userId, 'review_submitted')` (cliente) → recompensa (cupom/pontos) quando aplicável.
* **CouponsModule**: emissão de cupom por missão de avaliação (ex.: “avalie em 48h”).
* **RankingService / Providers**: atualizar `rating`/`reviewsCount` agregados e disparar reindex.
* **Notifications**: push/in‑app para provedor quando nova review publicada; para cliente quando resposta do provedor.
* **Document Processing**: validar fotos (storageKeys) e gerar URLs assinadas no BFF.

---

## 7) Segurança & LGPD

* Acesso: reviews públicas **sem PII**; internamente, vincular por IDs. Não expor telefones, e‑mails ou endereços nos campos públicos.
* Anti‑abuso: detecção de **contato direto** (regex de telefone/link/redes) e rate‑limit por IP/usuário para votos `helpful`.
* Auditoria: registrar `who/when/ip` em submit/reply/delete.

---

## 8) Config (ENV)

```env
REVIEWS_PAGE_SIZE_DEFAULT=20
REVIEWS_PAGE_SIZE_MAX=100
REVIEWS_SUMMARY_CACHE_TTL_SEC=300
REVIEWS_SUBMIT_WINDOW_DAYS=30
REVIEWS_EDIT_WINDOW_HOURS=24
REVIEWS_MODERATION_ENABLED=false
REVIEWS_SMART_SUGGESTIONS_ENABLED=true
```

---

## 9) Exemplos (HTTP)

### 9.1 Enviar review

```http
POST /reviews
Authorization: Bearer <client-token>
{
  "bookingId": "b_123",
  "rating": 5,
  "comment": "Profissional excelente. Chegou no horário e deixou tudo impecável!",
  "photos": ["uploads/2025/08/24/foto1.jpg"]
}
```

**201** *(exemplo reduzido)*

```json
{
  "id":"r_01","bookingId":"b_123","providerId":"p_01","clientId":"c_01","rating":5,
  "comment":"Profissional excelente...","photos":["uploads/.../foto1.jpg"],
  "isVerified":true,"createdAt":"2025-08-24T14:33:00-03:00"
}
```

### 9.2 Listar reviews por provedor (com fotos)

```http
GET /reviews?providerId=p_01&withPhotos=true&minRating=4&order=recent&page=1&pageSize=20
```

### 9.3 Responder review (provedor)

```http
POST /reviews/r_01/reply
Authorization: Bearer <provider-token>
{
  "text": "Obrigado pela confiança! Ficamos à disposição para o próximo agendamento."
}
```

### 9.4 Summary

```http
GET /reviews/summary?providerId=p_01
```

**200**

```json
{ "avg": 4.86, "count": 124, "stars": {"s5": 98, "s4": 20, "s3": 3, "s2": 2, "s1": 1}, "withPhotos": 37 }
```

---

## 10) Telemetria & KPIs

* Eventos: `review_submitted`, `review_published`, `review_replied`, `review_flagged`, `review_deleted`, `review_helpful_voted`.
* KPIs: **nota média** por provedor/serviço, **distribuição de estrelas**, % com **fotos**, **tempo até resposta** do provedor, impacto na **conversão** (ranking/search).

---

## 11) QA — Casos críticos

* Envio sem `COMPLETED` ou fora da janela → `BOOKING_NOT_COMPLETED`/`WINDOW_EXPIRED`.
* Duas reviews para o mesmo booking → `ALREADY_REVIEWED` (unicidade `bookingId`).
* Comentário com PII/contatos → **bloquear**/mascarar e `status='PENDING'` se moderação ativa.
* Fotos inexistentes/sem owner → rejeitar `photos`.
* Resposta do provedor com ofensivo → aplicar sanitização e (se ativo) moderação.

---

## 12) Melhorias avançadas (quando necessário)

1. **Topic tagging** automático (ex.: pontualidade, capricho, cordialidade) para analytics e sugestões de melhoria ao provedor.
2. **Verificação ampliada** (timestamp GPS/slot de agenda) para reforço de `isVerified`.
3. **Detecção de anomalias** (review fraudulenta) por histograma de notas e grafos de relacionamento.
4. **Fotos antes/depois** com comparação (opt‑in do provedor/cliente).

---

## 13) Conclusão

O módulo **Reviews** consolida a camada de **reputação** do LimpeJá. Com elegibilidade estrita, agregados eficientes e integração com gamificação/ranking, ele apoia a **descoberta** de qualidade e eleva a **confiança** do marketplace, mantendo custo sob controle e alinhado à **LGPD**.
