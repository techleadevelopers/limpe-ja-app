# README — Módulo de Services (Backend LimpeJá)

> **Escopo:** documentação **code‑real (versão atual)** do módulo **Services** com base nos arquivos: `services.module.ts`, `services.controller.ts`, `services.service.ts`, `service.entity.ts`, `create-service.dto.ts`, `update-service.dto.ts`, `service-details.dto.ts`.
>
> **Objetivo:** manter o **catálogo canônico** de **serviços do marketplace** (ex.: *Faxina Completa*, *Passar Roupa*, *Organização*), usado como base para **Provider Services** (ofertas individuais). Centraliza **taxonomia**, **regras padrão** (duração mínima, itens inclusos) e **metadados** (categoria, slug, ícones/imagens), além de expor **APIs públicas** de listagem/consulta.

---

## 1) Responsabilidades

* Definir e versionar o **catálogo global** de serviços e suas **categorias**.
* Oferecer **payload público** consolidado para **exploração** e **busca** (nome, descrição, duração padrão, imagem, categoria, flags).
* Fornecer **defaults** para criação de **Provider Services** (ex.: `defaultDurationMin`, `materialsIncluded` sugerido, `addOns` padrões).
* Manter **slugs** estáveis para SEO/app-links e integração com **Search/Ranking**.
* Permitir **CRUD administrativo** (criar/editar/arquivar serviços) com auditoria e ordenação.

---

## 2) Arquitetura

* **Module**: `ServicesModule` — registra controller/service e injeta dependências (ORM repo, Cache/Redis, Config, Sentry, DocumentProcessing para imagens opcionais).
* **Controller**: `ServicesController` — rotas **públicas** de listagem/consulta e **admin** para CRUD.
* **Service**: `ServicesService` — regras de negócio: validações, normalização de slug, ordenação, composição de `ServiceDetailsDto` e cache.
* **Entity**: `Service` — modelo persistente do serviço canônico.

---

## 3) Modelagem (entity — code‑real esperado)

```ts
export type ServiceCategory = 'CLEANING'|'IRONING'|'ORGANIZING'|'OTHER';

export class Service {
  id: string;                     // uuid
  slug: string;                   // único, kebab-case (ex.: 'faxina-completa')
  title: string;                  // ex.: 'Faxina Completa'
  subtitle?: string | null;       // ex.: 'Até 3 quartos'
  description?: string | null;    // markdown/HTML sanitizado (para vitrine)

  category: ServiceCategory;      // taxonomia
  icon?: string | null;           // chave para ícone
  image?: string | null;          // storageKey de imagem default

  defaultDurationMin: number;     // duração padrão sugerida (múltiplos de slot)
  materialsIncludedDefault?: boolean; // sugestão (provider pode sobrescrever)
  defaultAddOns?: Array<{ code: string; title: string; price: number }>; // catálogo de adicionais sugeridos

  isActive: boolean;              // aparece em listagens públicas
  sortWeight?: number | null;     // ordenação por vitrine/categoria

  createdAt: Date; updatedAt: Date; deletedAt?: Date | null;
}
```

**Índices:** `slug (unique)`, `(category, isActive, sortWeight desc)`.

> **Sanitização:** `description` deve passar por sanitizer (sem `script/style`/event handlers).

---

## 4) DTOs (code‑real)

### 4.1 `CreateServiceDto`

```ts
export class CreateServiceDto {
  @IsString() title: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() description?: string;      // markdown
  @IsEnum(['CLEANING','IRONING','ORGANIZING','OTHER']) category: ServiceCategory;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() image?: string;            // storageKey
  @IsInt() @Min(30) defaultDurationMin: number;        // minutos
  @IsOptional() @IsBoolean() materialsIncludedDefault?: boolean;
  @IsOptional() defaultAddOns?: Array<{ code: string; title: string; price: number }>;
  @IsOptional() @IsBoolean() isActive?: boolean = true;
  @IsOptional() @IsInt() sortWeight?: number;
}
```

### 4.2 `UpdateServiceDto`

```ts
export class UpdateServiceDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(['CLEANING','IRONING','ORGANIZING','OTHER']) category?: ServiceCategory;
  @IsOptional() @IsString() icon?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsInt() defaultDurationMin?: number;
  @IsOptional() @IsBoolean() materialsIncludedDefault?: boolean;
  @IsOptional() defaultAddOns?: Array<{ code: string; title: string; price: number }>;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsInt() sortWeight?: number;
}
```

### 4.3 `ServiceDetailsDto` (payload público)

```ts
export class ServiceDetailsDto {
  id: string; slug: string; title: string; subtitle?: string; description?: string;
  category: ServiceCategory; icon?: string; imageUrl?: string;
  defaultDurationMin: number; materialsIncludedDefault?: boolean; defaultAddOns?: any[];
}
```

---

## 5) Rotas (ServicesController)

| Método | Rota                   | Scope   | Descrição                                                                          |
| -----: | ---------------------- | ------- | ---------------------------------------------------------------------------------- |
|    GET | `/services`            | Público | Lista serviços (filtros: `category`, `q`, `activeOnly`, `page/pageSize`, `order`). |
|    GET | `/services/:idOrSlug`  | Público | Detalhe público (`ServiceDetailsDto`) por **id** ou **slug**.                      |
|   POST | `/services`            | ADMIN   | Cria serviço (CreateServiceDto). Slug é **gerado** automaticamente (kebab‑case).   |
|  PATCH | `/services/:id`        | ADMIN   | Atualiza serviço (UpdateServiceDto).                                               |
| DELETE | `/services/:id`        | ADMIN   | Soft‑delete (ou apenas `isActive=false`).                                          |
|   POST | `/services/:id/toggle` | ADMIN   | Ativa/Desativa rapidamente.                                                        |

**Query params** usuais: `category=CLEANING`, `q=faxina`, `activeOnly=true`, `order=sortWeight|title`.

**Erros**: `VALIDATION_ERROR`, `DUPLICATE_SLUG`, `NOT_FOUND`, `FORBIDDEN`.

---

## 6) Service (assinaturas & regras)

```ts
class ServicesService {
  list(q: ListQuery): Promise<{ items: Service[]; total: number }>;
  getByIdOrSlug(idOrSlug: string): Promise<ServiceDetailsDto>;
  create(dto: CreateServiceDto, userId: string): Promise<Service>;
  update(id: string, dto: UpdateServiceDto, userId: string): Promise<Service>;
  remove(id: string, userId: string): Promise<void>;
  toggleActive(id: string, userId: string): Promise<Service>;
}
```

### 6.1 Regras de negócio

* **Slug**: gerar a partir do `title` (kebab‑case, ascii fold); garantir **unicidade** (sufixo numérico quando necessário).
* **Ordenação**: `sortWeight` define prioridade na vitrine; fallback `title asc`.
* **Defaults**: `defaultDurationMin` deve casar com `Availability.slotDurationMin` (múltiplos). `defaultAddOns` são **sugestões**; o provedor pode divergir na oferta.
* **Sanitização**: `description`/`subtitle` sanitizados; `image` deve referenciar **storageKey** válido (Document Processing) quando usado como hero.
* **Cache**: memo de listagens públicas (`services:list:{category}:{lang}:{page}:{size}`) com TTL curto (ex.: 300s); invalidar em `create/update/delete/toggle`.

---

## 7) Integrações

* **Provider Services**: usa os **defaults** ao criar oferta; vincula por `serviceId`/`slug` para analytics (descoberta → booking por serviço).
* **Search**: indexa `Service` como filtro/faceta e compõe título/ícone nos resultados.
* **Ranking**: não calcula score aqui; apenas fornece taxonomia e metadados.
* **Document Processing**: resolve `imageUrl` (URL assinada) via BFF.
* **Analytics**: eventos de view/click de serviço em Explore.

---

## 8) Config (ENV)

```env
SERVICES_PUBLIC_PAGE_SIZE=50
SERVICES_CACHE_TTL_SEC=300
SERVICES_DEFAULT_CATEGORY=CLEANING
```

---

## 9) Exemplos (HTTP)

### 9.1 Listar serviços de Limpeza

```http
GET /services?category=CLEANING&activeOnly=true&order=sortWeight&page=1&pageSize=20
```

**200** *(exemplo)*

```json
{ "items": [
  {"id":"svc_clean_full","slug":"faxina-completa","title":"Faxina Completa","defaultDurationMin":180,"category":"CLEANING","isActive":true}
], "total": 1 }
```

### 9.2 Detalhe por slug

```http
GET /services/faxina-completa
```

**200**

```json
{
  "id": "svc_clean_full",
  "slug": "faxina-completa",
  "title": "Faxina Completa",
  "subtitle": "Até 3 quartos",
  "description": "Limpeza completa residencial...",
  "category": "CLEANING",
  "defaultDurationMin": 180,
  "materialsIncludedDefault": false,
  "defaultAddOns": [{"code":"geladeira","title":"Limpar geladeira","price":30}]
}
```

### 9.3 Criar (admin)

```http
POST /services
{
  "title": "Passar Roupa",
  "category": "IRONING",
  "defaultDurationMin": 120,
  "materialsIncludedDefault": false
}
```

**201** → cria com `slug` gerado (`passar-roupa`).

---

## 10) Telemetria & KPIs

* Eventos: `service_created`, `service_updated`, `service_toggled`, `service_listed`, `service_viewed`.
* KPIs: CTR de vitrine (vistas → clique), conversão **explore→quote→booking** por `service.slug`, distribuição de duração, heatmap de categorias.

---

## 11) QA — Casos críticos

* `defaultDurationMin` não múltiplo do slot → rejeitar com mensagem clara.
* Colisão de `slug` em rename → aplicar sufixo (`-2`, `-3`) com redirecionamento lógico (mantendo o antigo como alias, se suportado).
* HTML não sanitizado em `description` → bloquear tags perigosas.
* Arquivamento: `isActive=false` deve removê-lo da busca, mas **não** quebrar referências históricas (Provider Services existentes continuam válidos).

---

## 12) Melhorias avançadas (quando necessário)

1. **Alias**/redirect de slug (manter SEO/app links após rename).
2. **Localização (i18n)** de `title/subtitle/description` por `language`.
3. **Árvore de categorias** (ex.: Limpeza → Pesada/Leve; Organização → Closet/Cozinha) com breadcrumbs no app.
4. **A/B** de textos e imagens para otimizar conversão.
5. **Regras declarativas** de add‑ons (YAML/JSON) para compor sugestões automáticas por perfil/tamanho do imóvel.

---

## 13) Conclusão

O **Services** sustenta o **vocabulário do marketplace** e padroniza a experiência de descoberta e criação de ofertas. Com taxonomia clara, slugs estáveis e defaults coerentes com **Availability**, facilita o trabalho do provedor, melhora a **busca** e mantém consistência de **UX** de ponta a ponta.
