# README — Módulo de FAQs (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **FAQs** com base nos arquivos: `faqs.module.ts`, `faqs.controller.ts`, `faqs.service.ts`, `faq-item.entity.ts`, `create-faq.dto.ts`, `update-faq.dto.ts`.
>
> **Objetivo:** prover **base de conhecimento** versionável para **Clientes** e **Provedores**, com CRUD administrativo, busca por texto/categoria, cache e telemetria de uso, integrando com **Support**, **Onboarding** e **App** (screens de contexto).

---

## 1) Responsabilidades

* Servir **FAQ público** segmentado por **audiência** (`CLIENT`/`PROVIDER`/`ALL`) e **idioma** (default `pt-BR`).
* Permitir **CRUD** via painel/admin (criar, editar, desativar, reordenar, taguear).
* Oferecer **busca** por texto, **categorias** e **tags** com **paginação** e **ordenação**.
* **Cachear** respostas lidas com frequência e registrar **telemetria** (views, buscas, feedback de utilidade).

---

## 2) Arquitetura

* **Module**: `FaqsModule` — registra controller/service, injeta repositório/ORM e dependências (Cache/Config/Sentry).
* **Controller**: `FaqsController` — rotas REST para **listar/consultar** (público) e **CRUD** (admin).
* **Service**: `FaqsService` — regra de negócio: validações, normalização de texto/tags, busca e composição de payloads.
* **Entity**: `FaqItem` — modelo persistente do artigo/pergunta.

**Dependências:** `Cache/Redis` (memoização), `ConfigService` (feature flags/TTL), `Sentry` (logs), **(opcional)** `Search`/`tsvector` para busca full‑text.

---

## 3) Modelagem (entity — code‑real esperado)

```ts
export class FaqItem {
  id: string;                        // uuid
  question: string;                  // pergunta
  answer: string;                    // markdown/HTML sanitizado
  audience: 'CLIENT'|'PROVIDER'|'ALL';
  category?: string | null;          // ex.: 'Pagamentos', 'Agendamentos'
  tags?: string[] | null;            // ex.: ['PIX','cupons']
  language?: string;                 // ex.: 'pt-BR' (default)
  isActive: boolean;                 // soft visibility
  order?: number | null;             // ordenação dentro da categoria (asc)
  createdByUserId?: string | null;   // auditoria
  updatedByUserId?: string | null;   // auditoria
  createdAt: Date; updatedAt: Date; deletedAt?: Date | null; // soft delete opcional
}
```

**Índices:** `(audience, language, category, isActive, order)`, `GIN(tags)` e opcional `tsvector(question+answer)` para busca.

---

## 4) DTOs (code‑real)

### 4.1 `CreateFaqDto`

```ts
export class CreateFaqDto {
  @IsString() question: string;
  @IsString() answer: string;                 // aceita markdown/HTML seguro
  @IsEnum(['CLIENT','PROVIDER','ALL']) audience: 'CLIENT'|'PROVIDER'|'ALL';
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsArray() @IsString({each:true}) tags?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean = true;
  @IsOptional() @IsString() language?: string = 'pt-BR';
  @IsOptional() @IsInt() order?: number;
}
```

### 4.2 `UpdateFaqDto`

```ts
export class UpdateFaqDto {
  @IsOptional() @IsString() question?: string;
  @IsOptional() @IsString() answer?: string;
  @IsOptional() @IsEnum(['CLIENT','PROVIDER','ALL']) audience?: 'CLIENT'|'PROVIDER'|'ALL';
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsArray() @IsString({each:true}) tags?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() language?: string;
  @IsOptional() @IsInt() order?: number;
}
```

---

## 5) Rotas (FaqsController)

| Método | Rota               | Scope   | Descrição                                                                                                                   |
| -----: | ------------------ | ------- | --------------------------------------------------------------------------------------------------------------------------- |
|    GET | `/faqs`            | Público | Lista FAQ filtrado por `audience`, `category`, `q` (texto), `tags`, `language`, `activeOnly`, com `limit/offset` e `order`. |
|    GET | `/faqs/:id`        | Público | Retorna um item por `id` (se `isActive=true` ou role ADMIN).                                                                |
|    GET | `/faqs/categories` | Público | Lista categorias disponíveis (por `audience/language`).                                                                     |
|    GET | `/faqs/tags`       | Público | Lista tags frequentes (por `audience/language`).                                                                            |
|   POST | `/faqs`            | ADMIN   | Cria item de FAQ (CreateFaqDto).                                                                                            |
|  PATCH | `/faqs/:id`        | ADMIN   | Atualiza item (UpdateFaqDto).                                                                                               |
| DELETE | `/faqs/:id`        | ADMIN   | **Soft delete** (ou desativa `isActive=false`).                                                                             |

**Query params usuais**: `audience=CLIENT|PROVIDER|ALL`, `category=...`, `q=...`, `tags=tag1,tag2`, `language=pt-BR`, `activeOnly=true`, `limit=20`, `offset=0`, `order=asc`.

**Erros comuns**: `VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`, `CONFLICT (order)`.

---

## 6) Service (assinaturas & regra)

```ts
class FaqsService {
  list(q: ListFaqQuery): Promise<{ items: FaqItem[]; total: number }>;
  getById(id: string, includeInactive?: boolean): Promise<FaqItem>;
  create(dto: CreateFaqDto, userId: string): Promise<FaqItem>;
  update(id: string, dto: UpdateFaqDto, userId: string): Promise<FaqItem>;
  softDelete(id: string, userId: string): Promise<void>;
  listCategories(q: BaseQuery): Promise<string[]>;
  listTags(q: BaseQuery): Promise<string[]>;
}
```

**Regras:**

* **Normalização**: `question/answer` trim; `tags` em minúsculas e sem espaços extras; `category` title‑case.
* **Sanitização**: `answer` permite **markdown/HTML** básico com sanitizer (evita XSS).
* **Ordenação**: se `order` nulo, atribuir ao final da categoria; ao mudar categoria, recalcular `order`.
* **Busca**: `q` aplica ILIKE/`tsvector` em `question` e `answer` (com ranking simples).
* **Cache**: chave `faqs:{aud}:{lang}:{cat}:{q}:{tags}:{limit}:{offset}` (TTL 300s). Invalidate ao **create/update/delete**.

---

## 7) Segurança & RBAC

* Leitura: **pública** por padrão; itens **inativos** apenas para **ADMIN**.
* Escrita: **ADMIN** (ou role `CONTENT_EDITOR`).
* Auditoria: `createdByUserId`/`updatedByUserId` + timestamps e IP.

---

## 8) Integrações (contexto)

* **Onboarding** (cliente/provedor): exibir **FAQs de contexto** (categoria `Onboarding`) em telas de registro e verificação.
* **Support/Tickets**: sugerir **FAQ relacionada** antes de abrir ticket; registrar `faq_suggestion_shown/clicked`.
* **Disputes**: FAQs específicas de **política de disputas** e prazos.
* **Coupons/Missions**: artigos explicando regras (firstBookingOnly, expiração, claim).
* **Notifications**: deep‑links de push para FAQ relevante.

---

## 9) Config (ENV)

```env
FAQ_CACHE_TTL_SEC=300
FAQ_DEFAULT_LANGUAGE=pt-BR
FAQ_SEARCH_MODE=tsvector        # ou 'ilike'
```

---

## 10) Exemplos (HTTP)

### 10.1 Listar FAQ (cliente, pagamentos)

```http
GET /faqs?audience=CLIENT&category=Pagamentos&language=pt-BR&activeOnly=true&limit=20&offset=0
```

**200**

```json
{ "items": [ {"id":"f1","question":"Como pagar com PIX?","answer":"...","audience":"CLIENT","category":"Pagamentos","tags":["pix"],"language":"pt-BR","isActive":true} ], "total": 1 }
```

### 10.2 Busca por texto

```http
GET /faqs?q=cupom%20primeira%20compra&audience=CLIENT
```

### 10.3 Criar item (admin)

```http
POST /faqs
{
  "question": "O que é firstBookingOnly?",
  "answer": "Cupons com *firstBookingOnly* só podem ser usados...",
  "audience": "CLIENT",
  "category": "Cupons",
  "tags": ["cupons","primeira-compra"],
  "isActive": true,
  "order": 10
}
```

---

## 11) Telemetria & Feedback

* Eventos: `faq_viewed`, `faq_listed`, `faq_searched`, `faq_created`, `faq_updated`, `faq_deleted`.
* **Feedback de utilidade** (*Was this helpful?*): endpoints opcionais `POST /faqs/:id/feedback` → `helpful=true|false` com rate‑limit; armazenar contadores e taxa de utilidade por item.

---

## 12) QA — Casos críticos

* HTML não sanitizado → **bloquear** tags perigosas (script/style/event handlers).
* `order` conflitando dentro da mesma categoria → normalizar em transação.
* Duplicados (mesma `question` + `audience` + `language`) → validar e sugerir merge.
* Busca com `q` muito curta (<2 chars) → ignorar `q`.
* Troca de `audience/language` → invalidar caches relacionados.

---

## 13) Melhorias avançadas (quando necessário)

1. **Full‑text** Postgres (`tsvector` + ranking) e **sinônimos** (dicionário: PIX/pagamento/chave).
2. **Relacionados**: sugerir artigos semelhantes (conteúdo/tags/categoria).
3. **Tradução** multi‑idioma com *fallback* (`pt-BR` → `es-AR` → `en-US`).
4. **Versões** e **changelog** (histórico por item com diff e rollback).
5. **Embed** contextual no app (ex.: tela de cupons mostra FAQ de cupons).
6. **Search analytics**: termos sem resultado → backlog de conteúdo.
7. **Editor rich** com *snippets* padronizados (PIX, LGPD, Disputas).

---

## 14) Conclusão

O **Módulo de FAQs** entrega conhecimento autoatendido e reduz a carga do **Suporte**, com segmentação por audiência/idioma, busca eficiente, cache e telemetria. O CRUD administrativo garante agilidade na manutenção e a integração com fluxos do app melhora **conversão**, **retenção** e **NPS**.
