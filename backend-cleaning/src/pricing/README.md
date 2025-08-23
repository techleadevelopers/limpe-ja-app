📊 Pricing Module

O módulo Pricing é responsável pela definição, gerenciamento e aplicação das regras de precificação dos serviços oferecidos na plataforma.
Ele centraliza a lógica que calcula os valores finais cobrados ao cliente, levando em conta regras dinâmicas, descontos, variações por tipo de serviço, localização e condições personalizadas.

📂 Estrutura do Módulo

pricing.controller.ts
Expõe endpoints REST para:

Criar regras de precificação (POST /pricing/rules)

Atualizar regras existentes (PATCH /pricing/rules/:id)

Listar todas as regras (GET /pricing/rules)

Calcular o preço de um serviço em tempo real (POST /pricing/calculate)

pricing.service.ts
Contém a lógica de negócio:

CRUD completo de Pricing Rules

Aplicação de regras em chamadas de cálculo

Função principal calculatePrice() que aplica todas as regras válidas sobre um pedido

Entities & DTOs

pricing-rule.entity.ts → Define a estrutura de uma regra de preço no banco.

calculate-price.dto.ts → DTO para requisição de cálculo de preço.

create-pricing-rule.dto.ts → DTO para criação de regra.

update-pricing-rule.dto.ts → DTO para atualização de regra.

pricing.module.ts
Declara controller, service e importa o PrismaModule para persistência.

🧩 Estrutura de Dados
PricingRule (Entidade)

Cada regra de preço contém:

id → Identificador único

name → Nome da regra

serviceId? → Serviço ao qual a regra se aplica (opcional → regra pode ser global)

providerId? → Provedor ao qual a regra se aplica (opcional)

type → Tipo da regra:

BASE → valor base

PERCENTAGE → percentual aplicado

FIXED_DISCOUNT → desconto fixo

MIN_PRICE / MAX_PRICE → restrições de faixa

value → número associado (ex.: 20% → 0.20 ou R$ 30 fixos)

conditions → JSON flexível para regras específicas (ex.: horário, localização, fidelidade)

status → ACTIVE | INACTIVE

createdAt / updatedAt

⚙️ Lógica de Negócio
🔹 Criação de Regras

Admins podem criar regras que impactam preços de forma:

Global (sem serviceId ou providerId)

Específica por serviço

Específica por provedor

O sistema valida que type e value são compatíveis (ex.: PERCENTAGE deve ter 0 < value ≤ 1).

🔹 Atualização e Gerenciamento

Admin pode ativar/inativar regras.

Pode ajustar valores ou restrições de aplicação.

Pode atualizar conditions (JSON) para regras mais complexas.

🔹 Cálculo de Preço (calculatePrice)

Fluxo:

Recebe calculatePriceDto contendo:

serviceId

providerId (opcional)

basePrice

clientId (para aplicar fidelidade ou cupons futuros)

meta (dados adicionais do agendamento, ex.: hora, duração, localização)

Busca todas as regras ativas aplicáveis ao serviço e/ou provedor.

Aplica as regras na seguinte ordem:

BASE (define preço inicial se houver override)

PERCENTAGE (aplica acréscimos/descontos proporcionais)

FIXED_DISCOUNT (aplica descontos fixos)

MIN_PRICE / MAX_PRICE (ajusta limites)

Retorna objeto:

{
  originalPrice: number,
  finalPrice: number,
  appliedRules: PricingRule[],
  discountsTotal: number
}

🔹 Exemplos de Uso

Definir preço base para limpeza padrão.

Aplicar desconto de fidelidade de 10% para clientes recorrentes.

Definir preço mínimo de R$ 100 independente dos descontos aplicados.

Aplicar promoções sazonais com validade.

🚀 Endpoints Principais
Criar Regra

POST /pricing/rules

{
  "name": "Desconto novos clientes",
  "serviceId": "svc_123",
  "type": "PERCENTAGE",
  "value": 0.15,
  "conditions": { "newClientOnly": true }
}

Calcular Preço

POST /pricing/calculate

{
  "serviceId": "svc_123",
  "providerId": "prov_456",
  "basePrice": 200,
  "clientId": "cli_789"
}


Resposta:

{
  "originalPrice": 200,
  "finalPrice": 170,
  "appliedRules": [
    { "name": "Desconto novos clientes", "type": "PERCENTAGE", "value": 0.15 }
  ],
  "discountsTotal": 30
}

🔒 Regras de Acesso

Apenas administradores podem criar/editar regras.

Clientes podem apenas consultar cálculo de preço via endpoints seguros.

🛠️ Integrações Futuras

Integração com Coupons (cupom vira regra temporária de desconto).

Integração com Loyalty (ex.: aplicar desconto automático baseado em pontos).

Regras contextuais baseadas em localização e demanda (dynamic pricing).

Suporte a A/B Testing de precificação.