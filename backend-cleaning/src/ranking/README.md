🏆 ranking/ — Módulo de Classificação de Prestadores

Responsável por calcular, classificar e disponibilizar os rankings dos prestadores de serviço com base em critérios de performance, confiança e reputação — alimentando elementos de gamificação, reputação social e visibilidade dentro da plataforma LimpeJá.

🎯 Objetivo

Fornecer um sistema meritocrático e dinâmico que:

Recompense prestadores de alta performance

Estimule avaliações e comportamentos positivos

Sirva como referência de confiança para clientes

Gere visibilidade e motivação dentro do app

⚙️ Estrutura de Pastas
ranking/
├── ranking.controller.ts           # Exposição dos endpoints públicos e protegidos
├── ranking.module.ts               # Registro do módulo, serviços e dependências
├── ranking.service.ts              # Lógica principal de cálculo e agregação
├── provider-ranking.dto.ts         # DTO para validação e tipagem dos rankings

🧠 Lógica de Negócio
✅ Critérios de Rank (Score Interno)

O ranking é construído com base em múltiplos fatores, ponderados:

Critério	Peso Relativo	Fonte
⭐ Avaliações médias (1-5)	Alta	reviews
📍 Pontualidade (check-in)	Média	location, bookings
📆 Frequência de serviços	Alta	bookings
✅ Taxa de aceitação	Média	bookings, notifications
📣 Avaliações recentes + texto	Alta	reviews, support
🧠 Histórico de incidentes	Baixa/Moderada	safety, faqs
🎖️ Participação em missões	Moderada	missions, loyalty

Esses dados são agregados, ponderados e convertidos em um Score Global, com atualização automática.

🔁 Fluxo de Funcionamento

Eventos de serviço e avaliações disparam atualizações do score.

O ranking.service recalcula o ranking para o prestador.

Dados são disponibilizados via ranking.controller para:

App (ranking geral e individual)

Painel administrativo (futuro)

Gamificação (selos, badges, destaque)

🔗 Integração com o App
Cliente

Pode ver os prestadores mais bem avaliados em sua região.

Gera confiança ao contratar quem tem badge ou ranque alto.

Prestador

Visualiza seu score no app (dashboard)

Recebe estímulos para melhorar (ex: “Falta 0.2 para subir no ranking!”)

Pode receber benefícios reais: mais destaque, recompensas, acesso a missões exclusivas

🧪 Arquitetura Técnica
🧠 ranking.service.ts

Contém:

Lógica de agregação de métricas

Ponderação dos critérios

Atualização de ranking

Consulta por filtros geográficos ou globais

📥 provider-ranking.dto.ts

Define o shape esperado para ranking de prestadores

Garante tipagem e validação via DTO

Suporta paginação, filtros, etc.

🌐 ranking.controller.ts

GET /ranking → lista os top prestadores por critérios

GET /ranking/me → retorna o score atual do prestador logado

GET /ranking/:id → permite ver ranking de um prestador específico (admin/público)

✅ Exemplo de Resposta
{
  "providerId": "abc123",
  "score": 4.82,
  "rank": 3,
  "totalServices": 122,
  "avgRating": 4.9,
  "onTimePercentage": 97,
  "missionParticipation": true,
  "region": "São Paulo - Zona Sul"
}

📦 Integração com Outros Módulos
Módulo	Função
reviews/	Fonte das avaliações (quantidade e média)
bookings/	Base para frequência e pontualidade
missions/	Participação e bonificações extras
notifications/	Alertas sobre mudança de ranking
loyalty/	Selos e badges visuais
safety/	Redução de score em incidentes
📈 Benefícios Estratégicos

💡 Aumenta motivação interna dos prestadores (gamificação real)

🤝 Cria mais confiança para o cliente (baseado em mérito)

🎯 Facilita controle de qualidade interno

💬 Gera oportunidades de campanhas com base em performance

🧩 Próximos Passos Sugeridos
Item	Prioridade
Armazenar histórico de score	Alta
Exibir evolução semanal no app	Alta
Ranking por bairro ou zona	Média
Integração com metrics/	Alta
Pontuação pública (gamificação)	Alta
✅ Conclusão

O módulo ranking/ é uma peça fundamental no ecossistema de performance, meritocracia e confiança do LimpeJá. Ele alimenta não só a visibilidade do prestador, mas também impacta diretamente retenção, engajamento e reputação da plataforma.