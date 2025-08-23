🧩 missions/ — Módulo de Missões Gamificadas do LimpeJá

O módulo missions/ é responsável por orquestrar todo o sistema de missões, progressão e recompensas dos usuários na plataforma — promovendo retenção, engajamento recorrente e comportamento positivo com base em desafios e conquistas.

🎯 Objetivo

Criar um sistema gamificado real que:

Estimule o uso recorrente do app

Incentive comportamentos desejados (avaliação, check-in, indicações)

Aumente a retenção via reforço positivo

Ofereça recompensas tangíveis e simbólicas por ações concretas

⚙️ Estrutura de Arquivos
missions/
├── missions.module.ts              # Módulo principal e injeção de dependências
├── missions.controller.ts         # Endpoints REST para missões e progresso
├── missions.service.ts            # Lógica de criação, progresso e validação de missões
├── progress.service.ts            # Controle e persistência do progresso por usuário
├── claim-mission.dto.ts           # DTO para resgatar uma missão
├── upsert-mission.dto.ts          # DTO para criar ou atualizar uma missão

🧠 Tipos de Missões Suportadas

✅ Avaliar um serviço prestado

✅ Concluir X serviços por semana

✅ Indicar amigos e obter adesão

✅ Check-in e check-out com geolocalização

✅ Realizar o primeiro agendamento

✅ Frequência mensal mínima

✅ Resolutividade (sem incidentes)

As missões podem ser:

🎯 Pessoais (individuais por usuário)

🏅 Campanhas temporárias (ex: “Missão Carnaval”)

🔁 Recorrentes (ex: “Toda segunda-feira”)

🧩 Fluxo Lógico de Missão

Sistema cria missão (upsert-mission.dto.ts)

Usuário realiza ações relevantes (serviços, avaliações, etc.)

progress.service.ts registra o progresso automaticamente

Quando completada, o usuário pode reivindicar (claim-mission.dto.ts)

Missão é marcada como completa e recompensa é entregue

🔁 Principais Componentes
✅ missions.service.ts

Responsável por:

Criar / atualizar missões

Consultar status e progresso

Validar se a missão foi cumprida

✅ progress.service.ts

Responsável por:

Registrar progresso individual por usuário

Prevenir duplicações ou abusos

Permitir resgate apenas quando 100% concluída

Integrar com outras fontes (bookings, avaliações)

✅ missions.controller.ts

Endpoints RESTful disponíveis:

Método	Rota	Função
GET	/missions	Lista todas as missões disponíveis
GET	/missions/me	Missões do usuário autenticado
POST	/missions/claim	Resgatar missão concluída
POST	/missions	Criar nova missão
PUT	/missions/:id	Atualizar missão existente
🔐 Segurança e Integridade

Todas as rotas de progresso são autenticadas

Não permite resgatar missão incompleta

Previne múltiplos resgates por missão

Progresso é incremental e rastreável

🔗 Integração com o App

Clientes e prestadores recebem notificações quando há nova missão

Missões aparecem no dashboard com progresso visual

Após completar, o usuário pode resgatar direto no app

Cupons, badges e XP são entregues automaticamente

🎮 Exemplo de Missão no App
{
  "id": "mission_123",
  "title": "Avalie 3 serviços esta semana",
  "description": "Ajude outros usuários com seu feedback",
  "progress": 2,
  "goal": 3,
  "reward": "Cupom de R$ 20",
  "status": "in_progress"
}

🧠 Papel Estratégico no LimpeJá
Benefício Estratégico	Impacto
Aumenta retenção (usuário volta para completar)	🔥 Alta
Estimula bons comportamentos (avaliar, indicar, repetir)	✅ Consciente
Substitui o vício negativo por hábitos positivos	🎯 Sustentável
Gera recompensa sem precisar de cupom aleatório	💰 Eficiente
Integra com sistema de Score/Ranking	🏆 Meritocracia
🛠️ Casos de Uso Reais
Ação do Usuário	Missão Ativada	Recompensa
Finaliza serviço com avaliação	“Avalie 3 serviços por semana”	Cupom de desconto
Faz check-in 3 dias seguidos	“Frequência LimpeJá”	Selo visual + cashback
Indica um amigo que usa o app	“Indique e ganhe”	Cupom compartilhado
Zera todos serviços do mês	“Conquistador do mês”	Badge de perfil + ranking XP
📦 Integração com Outros Módulos
Módulo	Função
bookings/	Detecção de serviços concluídos
reviews/	Acompanhamento de avaliações
users/	Relacionamento com progresso e recompensa
notifications/	Alertas de nova missão ou conclusão
coupons/	Geração de cupons por missão
ranking/	Aumento de pontuação com base em missão
loyalty/	Conversão de missão em pontos de fidelidade
🧩 Próximos Passos Sugeridos
Item	Prioridade
Histórico de missões concluídas	Alta
Missões exclusivas por região	Média
Missões cooperativas (2+ usuários)	Média
Painel administrativo de criação	Alta
✅ Conclusão

O módulo missions/ é um dos pilares centrais da lógica de engajamento e retenção da plataforma LimpeJá. Ele transforma ações operacionais em jornadas divertidas, recompensadoras e repetíveis, impactando diretamente o LTV do usuário e o ciclo de uso da plataforma.