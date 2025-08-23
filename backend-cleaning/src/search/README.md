📌 Search Module
📖 Visão Geral

O módulo Search é responsável por fornecer mecanismos de busca inteligente de serviços e provedores dentro da plataforma.
Ele permite que clientes localizem serviços de limpeza e profissionais disponíveis, aplicando filtros e retornando resultados estruturados com base no catálogo de serviços cadastrados.

Esse módulo atua como a camada de descoberta do sistema, conectando clientes ao catálogo de ProviderServices (ofertas feitas pelos provedores).

🏗 Estrutura

Controller: search.controller.ts
Expõe endpoints REST para a busca de serviços/provedores.

Service: search.service.ts
Contém a lógica de negócio para consultas ao banco via Prisma.

DTOs:

search-query.dto.ts → Define os parâmetros de entrada da busca.

provider-service-search-result.dto.ts → Define o formato de resposta dos resultados da busca.

Module: search.module.ts
Configura dependências e integra o serviço de busca com o restante da aplicação.

🔄 Fluxo de Negócio

Cliente envia consulta de busca via endpoint (/search), passando filtros como:

query → texto livre (ex.: "faxina cozinha")

location → cidade ou região

providerId → busca serviços de um provedor específico

priceRange → faixa de preço desejada

categories → categorias de serviço (ex.: "residencial", "comercial")

Validação da Query
O DTO SearchQueryDto garante que os parâmetros estejam no formato correto antes de seguir para o service.

Execução da busca no banco
O SearchService utiliza o Prisma ORM para consultar a tabela de ProviderService, aplicando filtros dinâmicos conforme a query do cliente.

Montagem dos resultados
O retorno é transformado em objetos padronizados do tipo ProviderServiceSearchResultDto, que contêm:

Informações do serviço

Nome e dados do provedor

Preço

Categoria

Disponibilidade

Resposta estruturada é devolvida ao cliente, permitindo exibir resultados de busca organizados no app.

⚙️ Endpoints Principais
🔍 Buscar serviços
POST /search


Request Body (SearchQueryDto):

{
  "query": "faxina",
  "location": "São Paulo",
  "categories": ["residencial"],
  "minPrice": 50,
  "maxPrice": 200
}


Response (ProviderServiceSearchResultDto[]):

[
  {
    "id": "srv123",
    "title": "Faxina completa",
    "description": "Limpeza residencial padrão",
    "price": 150,
    "category": "residencial",
    "provider": {
      "id": "prov456",
      "name": "Maria Souza"
    },
    "rating": 4.8,
    "reviewsCount": 32
  }
]

📦 Integrações

Prisma ORM → consulta dados de ProviderServices e relacionamentos com Providers.

Providers Module → obtém informações sobre os provedores.

Reviews Module (opcional) → pode ser usado para incluir avaliações e notas no resultado de busca.

🧩 Casos de Uso

Clientes encontram serviços rapidamente filtrando por preço, categoria ou localização.

Exibir lista de provedores mais bem avaliados em uma região.

Fornecer autocomplete ou sugestões inteligentes no app móvel.

Base para ranking e missões (ex.: "Reserve 3 serviços encontrados via busca").

✅ Benefícios

Padronização do formato de entrada e saída das buscas.

Flexibilidade para adicionar novos filtros sem quebrar contratos.

Integração transparente com o ecossistema da plataforma.

Escalável para implementar busca avançada (ex.: full-text search, elasticsearch).

🚀 Próximos Passos / Melhorias

Implementar full-text search (Postgres tsvector ou Elasticsearch).

Adicionar paginação e ordenação por relevância, preço ou avaliação.

Suporte a geolocalização real (coordenadas GPS em vez de string de cidade).

Cachear buscas populares para performance.