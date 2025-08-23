Services Module — README (Backend)

Contexto: Este módulo gerencia o catálogo de serviços base (ex.: “Limpeza Residencial”, “Passadoria”, “Pós-obra”). Ele é a referência central para os ProviderServices (ofertas dos prestadores), para o Search, Bookings, Pricing e Missões (eventos como booking.completed usam o tipo de serviço para métricas e regras).

Objetivos do módulo

CRUD do catálogo de serviços (admin-first).

Definir metadados padrão: description, icon, defaultPricingType.

Servir de chave estrangeira para ProviderService e Booking.providerService.service.

Fornecer endpoints públicos de listagem/consulta (com paginação/ordenção básicos).

Garantir validação e segurança via guards/roles.

Stack e dependências

NestJS (controller/service/module)

Prisma (model Service)

Guards: JwtAuthGuard + RolesGuard

Enums do Prisma:

PricingType = FIXED_PRICE | HOURLY | BY_SIZE | CUSTOM_QUOTE

Integrações:

Provider Services: cada Service pode ser vinculado a vários ProviderService.

Bookings: cada Booking referencia um ProviderService que, por sua vez, referencia um Service.

Search: usa os serviços como facet/filtro.

Pricing: pode usar defaultPricingType como fallback.

Modelo de dados (Prisma)
model Service {
  id                 String       @id @default(uuid())
  name               String       @unique
  description        String?
  price              Decimal      @db.Decimal(10, 2)
  defaultPricingType PricingType?
  icon               String?
  providerServices   ProviderService[]
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
}

Campos-chave

name (unique): título do serviço (“Limpeza Residencial”).

description: texto de apoio (aparece no app).

price: preço base (usado como sugestão para prestadores/estimativas).

defaultPricingType: controla como o serviço costuma ser precificado.

icon: URL ou key de asset para UI.

Estrutura do módulo
src/services/
  ├─ services.module.ts          // Declara controller + service + imports (PrismaModule)
  ├─ services.controller.ts      // Rotas/Swagger/guards
  ├─ services.service.ts         // Regras de negócio + Prisma
  ├─ service.entity.ts           // DTO/entity de resposta (Swagger)
  ├─ create-service.dto.ts       // DTO de criação (validações)
  ├─ update-service.dto.ts       // DTO de update (parcial)
  └─ service-details.dto.ts      // DTO detalhado (quando necessário)

Autenticação e Autorização

JWT obrigatório em rotas mutáveis.

Roles:

ADMIN: criar/atualizar/excluir serviços.

CLIENT/PROVIDER: consultar.

Controllers usam @UseGuards(JwtAuthGuard, RolesGuard) e @Roles(UserRole.ADMIN) quando necessário.

Endpoints
1) Criar serviço (ADMIN)

POST /services

Body (CreateServiceDto):

{
  "name": "Limpeza Residencial",
  "description": "Limpeza geral de residências.",
  "price": 120.00,
  "defaultPricingType": "FIXED_PRICE",
  "icon": "https://cdn.exemplo.com/icons/cleaning-home.svg"
}


Respostas:

201 Created → Service criado.

400 Bad Request → validação (ex.: name duplicado, price < 0).

401/403 → auth/roles.

2) Listar serviços (público autenticado)

GET /services?query=&page=1&limit=20&sort=createdAt&order=desc

Query params (opcional):

query: busca por name/description.

page, limit: paginação.

sort (name|createdAt), order (asc|desc).

Respostas:

200 OK → lista de Service + paginação.

3) Obter um serviço

GET /services/:id

Respostas:

200 OK → Service.

404 Not Found → id inválido.

4) Atualizar serviço (ADMIN)

PATCH /services/:id

Body (UpdateServiceDto) — todos os campos opcionais:

{
  "description": "Limpeza detalhada de ambientes residenciais",
  "price": 130.00,
  "defaultPricingType": "HOURLY",
  "icon": "cleaning-home-2.svg"
}


Respostas:

200 OK → atualizado.

400/404 → validação/id inválido.

401/403 → auth/roles.

5) Remover serviço (ADMIN) (opcional, se implementado)

DELETE /services/:id

Respostas:

200 OK / 204 No Content

400 → se houver vínculos críticos (ProviderService/Booking).

404 → não encontrado.

Recomendação: usar “soft delete” ou checar vínculos e bloquear remoção de serviços usados por ProviderServices/Bookings. Em muitos cenários, desativar é melhor do que deletar.

DTOs (validação resumida)
CreateServiceDto

name: string (obrigatório, único)

description: string (opcional)

price: number ≥ 0 (obrigatório)

defaultPricingType: PricingType (opcional)

icon: string (opcional)

UpdateServiceDto

Igual ao create, porém todos opcionais.

ServiceDetailsDto

Formato de resposta estendido (quando necessário, p.ex. incluir metadados adicionais).

Regras de negócio

Unicidade de name: evita duplicatas no catálogo.

Preço base coerente: usado como sugestão (prestador pode ter preço próprio no ProviderService).

defaultPricingType: orienta o fluxo de criação de ProviderService e cálculo no BookingsService:

FIXED_PRICE: preço fechado (usa price).

HOURLY: exige requestedDurationMinutes no agendamento.

BY_SIZE: usa pricePerSquareMeter ou pricePerRoom no ProviderService (não no Service base).

CUSTOM_QUOTE: indica orçamento manual (fluxo assíncrono com o prestador).

Consistência referencial: antes de excluir/alterar drasticamente, considerar impacto em ProviderService e Search.

Integração com Missões: o tipo de serviço pode ser usado em regras de missão (ex.: contagem de booking.completed para “3 limpezas no mês”). A missão escuta eventos – este módulo fornece o contexto (nome do serviço) via relacionamentos.

Erros e mensagens comuns

409/400 ao criar: name já existe.

404 em GET /:id ou PATCH /:id: serviço não encontrado.

400 em PATCH: defaultPricingType inválido.

403: usuário sem ADMIN tentando mutar.

Exemplos (cURL)

Criar:

curl -X POST https://api.exemplo.com/services \
 -H "Authorization: Bearer <JWT_ADMIN>" \
 -H "Content-Type: application/json" \
 -d '{
   "name":"Limpeza Pós-Obra",
   "description":"Remoção de resíduos pós reforma",
   "price": 300,
   "defaultPricingType":"BY_SIZE",
   "icon":"post-work.svg"
 }'


Listar:

curl -H "Authorization: Bearer <JWT>" \
 https://api.exemplo.com/services?query=limpeza&limit=10


Atualizar:

curl -X PATCH https://api.exemplo.com/services/<id> \
 -H "Authorization: Bearer <JWT_ADMIN>" \
 -H "Content-Type: application/json" \
 -d '{"price": 350, "defaultPricingType": "FIXED_PRICE"}'

Boas práticas e notas

Swagger: o controller já deve usar decorators (@ApiTags, @ApiBearerAuth, @ApiOperation, @ApiResponse).

Paginação/Ordenação: mantenha defaults previsíveis e evite overfetch.

Ids: sempre UUID (string).

Icones: padronize caminho ou CDN.

Auditoria: createdAt/updatedAt já disponíveis via Prisma.

Testes (ideias)

Unit: ServicesService

create com name duplicado → falha

update defaultPricingType inválido → falha

list com query → retorna apenas correspondências

E2E:

fluxo admin cria→consulta→atualiza

provider/client conseguem listar mas não mutar

remoção bloqueada quando há ProviderService vinculado (se regra estiver ativa)

Roadmap (opcional)

Soft delete / isActive no Service.

Categorias (p.ex. “Residencial”, “Comercial”) para organização/SEO.

A/B de ícones e descrições (telemetria de conversão).

Traduções (i18n).

Integrações laterais

ProviderServices Module: cria ofertas específicas com price, pricingType, pricePerRoom etc., referenciando Service.

Bookings Module: usa ProviderService → Service para exibir nome e para cálculos.

Pricing Module: regras dinâmicas podem agir diferente por tipo de serviço.

Search Module: filtros por serviceId.

Missions Module: contadores por booking.completed independem de Service, mas podem ser especializados por tipo no futuro.

Módulo
// services.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService], // útil para Search/ProviderServices
})
export class ServicesModule {}


Se quiser, te mando também um checklist de revisão (Swagger, guards, validações e mensagens) para colar nos PRs.