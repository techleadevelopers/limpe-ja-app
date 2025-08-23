📖 README – Módulo Offers

O módulo Offers é responsável por gerenciar ofertas promocionais dentro da plataforma, permitindo que administradores criem campanhas de desconto ou benefícios para clientes, vinculem ofertas a serviços ou provedores específicos e mantenham o histórico e status de cada oferta.

Ele atua de forma complementar aos módulos Coupons e Pricing, mas com foco em ofertas programadas e estratégicas, que podem ser exibidas automaticamente para os usuários em suas buscas ou dashboards.

🚀 Estrutura do Módulo
1. Controller – offers.controller.ts

Responsável por expor as rotas REST do módulo.

POST /offers → Cria uma nova oferta (somente ADMIN).

GET /offers/:id → Busca detalhes de uma oferta pelo ID.

GET /offers → Lista todas as ofertas cadastradas (com filtros opcionais).

PATCH /offers/:id → Atualiza uma oferta existente (somente ADMIN).

DELETE /offers/:id → Remove ou inativa uma oferta.

2. Service – offers.service.ts

Camada de regras de negócio.

create(dto: CreateOfferDto) → Cria oferta com regras de validação (datas, tipo, escopo).

findAll() → Lista todas as ofertas ativas ou filtradas.

findOne(id: string) → Retorna detalhes de uma oferta específica.

update(id: string, dto: UpdateOfferDto) → Permite atualização de status, descrição, datas e escopo.

delete(id: string) → Marca oferta como INACTIVE, preservando histórico.

getActiveOffersForUser(userId: string) → Recupera apenas as ofertas ativas e elegíveis para o usuário.

3. Entity – offer.entity.ts

Define o modelo da entidade Offer armazenada no banco:

id: string → Identificador único.

title: string → Nome da oferta.

description: string → Descrição detalhada.

discountValue: number → Valor percentual ou fixo do desconto.

discountType: 'PERCENT' | 'FIXED' → Tipo do desconto.

target: 'GENERAL' | 'SPECIFIC_SERVICE' | 'SPECIFIC_PROVIDER' | 'NEW_CLIENTS' → Público da oferta.

targetId?: string → Caso seja vinculada a um serviço/provedor específico.

validFrom: Date / validUntil: Date → Período de validade.

status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' → Situação da oferta.

createdAt / updatedAt → Metadados de auditoria.

4. DTOs (Data Transfer Objects)

create-offer.dto.ts → Campos obrigatórios para criar uma oferta.

update-offer.dto.ts → Campos opcionais para atualizar parcialmente uma oferta.

offer-details.dto.ts → Estrutura de resposta detalhada enviada ao frontend.

5. Module – offers.module.ts

Declaração oficial do módulo, contendo:

Imports: PrismaModule, NotificationsModule (se oferta gera notificações).

Providers: OffersService.

Controllers: OffersController.

Exports: OffersService (para outros módulos, como Search e Clients).

📊 Lógica de Negócio
🔹 Criação de Ofertas

Administradores podem criar ofertas programadas com valores fixos ou percentuais.

Cada oferta possui escopo alvo:

GENERAL: qualquer cliente pode usar.

NEW_CLIENTS: apenas clientes sem histórico de pedidos.

SPECIFIC_SERVICE: vinculada a um serviço.

SPECIFIC_PROVIDER: vinculada a um prestador.

🔹 Validação Automática

Uma oferta só pode ser criada se:

validUntil > validFrom.

discountValue > 0.

O tipo (PERCENT ou FIXED) for válido.

Ao expirar (validUntil < now), a oferta é marcada automaticamente como EXPIRED.

🔹 Aplicação de Ofertas

Durante o fluxo de busca (SearchModule) ou checkout (BookingsModule), o sistema consulta as ofertas ativas.

O serviço getActiveOffersForUser(userId) garante que apenas ofertas válidas e aplicáveis sejam exibidas.

Caso a oferta tenha escopo limitado (SPECIFIC_SERVICE ou SPECIFIC_PROVIDER), somente aparece se o contexto coincidir.

🔹 Atualização e Remoção

Atualizações podem alterar apenas:

Datas (validFrom, validUntil),

Status (ACTIVE → INACTIVE),

Valor de desconto.

Remoções não apagam do banco — apenas marcam como INACTIVE para preservar histórico de auditoria.

🔗 Integrações

SearchModule → Inclui ofertas ativas nos resultados para engajar clientes.

BookingsModule → Permite aplicar descontos diretamente em agendamentos.

NotificationsModule → Pode notificar usuários quando novas ofertas forem lançadas.

✅ Exemplos de Uso
Criar Oferta
POST /offers
{
  "title": "Desconto de Inverno",
  "description": "20% off em todas as limpezas no mês de Julho",
  "discountValue": 20,
  "discountType": "PERCENT",
  "target": "GENERAL",
  "validFrom": "2025-07-01T00:00:00Z",
  "validUntil": "2025-07-31T23:59:59Z"
}

Resposta ao Buscar Ofertas Ativas
[
  {
    "id": "ofr_123",
    "title": "Desconto de Inverno",
    "discountType": "PERCENT",
    "discountValue": 0.20,
    "status": "ACTIVE",
    "validUntil": "2025-07-31T23:59:59Z"
  }
]

🏗️ Fluxo de Negócio Atual

Admin cria oferta via painel → armazenada no banco.

Search exibe automaticamente ofertas ativas em resultados.

Cliente aplica oferta no agendamento → preço ajustado em tempo real.

Sistema valida elegibilidade (novo cliente, serviço específico, etc.).

Booking confirmado → oferta marcada como utilizada (se necessário).

Admin pode inativar/atualizar oferta a qualquer momento.