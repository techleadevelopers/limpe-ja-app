🎁 loyalty/ — Módulo de Pontos de Fidelidade do LimpeJá

O módulo loyalty/ gerencia o sistema de pontos de fidelidade, permitindo que usuários acumulem pontos por ações recorrentes e os convertam em recompensas. Ele é o núcleo da economia de engajamento e retenção gamificada do app.

🎯 Objetivo

Permitir que clientes e prestadores:

Acumulem pontos por missões, serviços ou comportamento positivo.

Revertam pontos em benefícios (cupons, vantagens, selos).

Visualizem sua pontuação de forma transparente e motivadora.

⚙️ Estrutura de Arquivos
loyalty/
├── loyalty.module.ts            # Módulo de injeção
├── loyalty.controller.ts       # Rotas públicas e protegidas
├── loyalty.service.ts          # Lógica principal de pontos e resgates
├── add-points.dto.ts           # DTO para adicionar pontos
├── redeem-points.dto.ts        # DTO para resgatar pontos

🧠 Lógica de Funcionamento
Ganha Pontos:

Concluir uma missão (missions/)

Avaliar um serviço (reviews/)

Indicar amigos

Frequência mensal de uso

Pontualidade

Resgata Pontos:

Cupons de desconto

Selos e distintivos

Acesso a áreas VIP

Vantagens em destaque no app

🔁 Fluxo de Ação

Evento relevante ocorre (ex: missão completada)

Backend chama loyalty.service.addPoints(dto)

Pontos são acumulados no perfil do usuário

Usuário resgata algo via loyalty.service.redeemPoints(dto)

Controle de saldo e histórico mantido internamente

📥 DTOs
add-points.dto.ts
{
  userId: string;
  points: number;
  reason: string;
}

redeem-points.dto.ts
{
  userId: string;
  points: number;
  rewardId?: string;
}

🌐 Endpoints do Controller
Método	Rota	Ação
POST	/loyalty/add	Adiciona pontos ao usuário
POST	/loyalty/redeem	Resgata pontos por recompensa
GET	/loyalty/me	Retorna saldo de pontos atual
🔗 Integração com Outros Módulos
Módulo	Papel Integrado
missions/	Atribuição de pontos ao concluir missão
ranking/	Influencia visibilidade e badges
coupons/	Resgate de cupons com pontos
notifications/	Envio de alerta de saldo, conquista
📊 Impacto Estratégico

🧠 Reforça hábito de uso contínuo

💰 Gera economia emocional ao invés de custo real

🎮 Cria ciclo de retenção baseado em mérito

🤝 Dá propósito para ações recorrentes

✅ Conclusão

O módulo loyalty/ é o motor de fidelidade e engajamento contínuo do LimpeJá, conectando gamificação, experiência e retenção. É funcional, extensível e pronto para crescer com a operação.