📌 Provider Services Module

O Provider Services Module é responsável por gerenciar os serviços oferecidos pelos prestadores (providers) dentro da plataforma. Ele define a lógica de CRUD, controle de disponibilidade e integração com outros módulos que utilizam os serviços cadastrados.

📂 Estrutura de Arquivos
provider-services/
│── provider-services.controller.ts
│── provider-services.module.ts
│── provider-services.service.ts
│── entities/
│    └── provider-service.entity.ts
│── dto/
│    ├── create-provider-service.dto.ts
│    ├── provider-service-details.dto.ts
│    ├── update-provider-service.dto.ts

🏗️ Arquitetura e Fluxo

Controller (provider-services.controller.ts)

Define as rotas REST para criação, listagem, atualização e remoção de serviços de um provider.

Recebe as requisições HTTP, valida os DTOs e encaminha para o ProviderServicesService.

Service (provider-services.service.ts)

Contém a lógica central do negócio.

Interage com o PrismaService para persistência de dados.

Aplica regras de negócio como:

Validação de providers antes de criar um serviço.

Atualização de preços, descrição e disponibilidade.

Retorno de detalhes enriquecidos de cada serviço.

Entity (provider-service.entity.ts)

Define o modelo de dados de um ProviderService.

Representa as colunas que serão persistidas no banco (ex.: id, providerId, serviceName, price, status).

DTOs

create-provider-service.dto.ts: validação para criação de novos serviços.

update-provider-service.dto.ts: campos opcionais para atualização.

provider-service-details.dto.ts: estrutura para resposta detalhada com informações adicionais do serviço.

Module (provider-services.module.ts)

Agrupa controller, service e dependências.

Exporta o ProviderServicesService para ser consumido em outros módulos (ex.: Bookings, Ranking).

🔑 Principais Funcionalidades
1. Criar Serviço (POST /provider-services)

Permite que um provider cadastre um novo serviço.

Campos típicos:

providerId

name

description

price

duration

status (ex.: ACTIVE, INACTIVE)

2. Listar Serviços (GET /provider-services)

Retorna todos os serviços disponíveis, com filtros opcionais por:

providerId

status

categoria

3. Detalhar Serviço (GET /provider-services/:id)

Retorna as informações completas de um serviço, incluindo detalhes do provider.

4. Atualizar Serviço (PATCH /provider-services/:id)

Atualiza parcialmente informações como:

Nome, preço, duração, descrição.

Status (ACTIVE ou INACTIVE).

5. Remover Serviço (DELETE /provider-services/:id)

Marca o serviço como inativo ou remove definitivamente (dependendo da lógica atual de soft/hard delete).

🔄 Integrações

Bookings Module: utiliza os serviços para permitir que clientes façam reservas.

Ranking Module: pode utilizar os serviços para calcular desempenho de providers.

Notifications Module: notifica quando um novo serviço é cadastrado ou atualizado.

Loyalty e Coupons: podem aplicar descontos específicos a determinados serviços.

⚙️ Regras de Negócio

Um provider pode ter múltiplos serviços ativos.

O preço e duração devem ser valores positivos.

Serviços inativos não podem ser reservados em Bookings.

Atualizações não devem quebrar histórico de reservas já realizadas.

Cada serviço deve estar vinculado a um provider válido.

🚀 Exemplo de Uso
Criar Serviço
POST /provider-services
{
  "providerId": "12345",
  "name": "Massagem Relaxante",
  "description": "Sessão de 60 minutos",
  "price": 120.00,
  "duration": 60,
  "status": "ACTIVE"
}

Resposta
{
  "id": "abc123",
  "providerId": "12345",
  "name": "Massagem Relaxante",
  "description": "Sessão de 60 minutos",
  "price": 120.00,
  "duration": 60,
  "status": "ACTIVE",
  "createdAt": "2025-08-22T21:15:00Z"
}

✅ Conclusão

O Provider Services Module é o coração do catálogo de serviços dos prestadores. Ele garante:

Cadastro consistente e validado.

Integração com reservas e rankings.

Escalabilidade para permitir múltiplos tipos de serviços e lógicas futuras (ex.: promoções específicas por serviço).