👤 clients/ — Módulo de Gestão de Clientes

O módulo clients/ é responsável por controlar o ciclo de vida completo dos usuários consumidores da plataforma. Ele abrange desde o cadastro até dados de dashboard, perfil e preferências.

🎯 Objetivo

Cadastrar, atualizar e consultar dados dos clientes

Fornecer dados para dashboards e lógica de missão/cupom

Suportar interações com gamificação, avaliação e notificações

⚙️ Estrutura de Arquivos
clients/
├── clients.module.ts                  # Módulo principal NestJS
├── clients.controller.ts              # Endpoints REST
├── clients.service.ts                 # Lógica de manipulação e consulta
├── client.entity.ts                   # Entidade ORM principal
├── client-dashboard.dto.ts            # DTO para resumo de dashboard
├── client-details.dto.ts              # DTO para detalhamento individual
├── update-client-profile.dto.ts       # DTO para edição de perfil

🧱 Entidade ORM — client.entity.ts
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  referralCode?: string;
  hasVerifiedEmail: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

📥 DTOs
client-dashboard.dto.ts

Retorna métricas do cliente (quantidade de pedidos, avaliações, cupons, etc.).

client-details.dto.ts

Detalhamento completo para tela de perfil ou administração.

update-client-profile.dto.ts

Permite atualização de nome, contato, ou dados pessoais.

🌐 Endpoints — clients.controller.ts
Método	Rota	Descrição
GET	/clients/:id	Retorna dados do cliente
PATCH	/clients/:id	Atualiza perfil do cliente
GET	/clients/:id/dashboard	Retorna dados de performance/fidelidade
🔗 Integração com Outros Módulos
Módulo	Interação
missions/	Recompensas atreladas a uso do app
loyalty/	Fidelidade, pontos e resgates
coupons/	Aplicação de cupons no perfil
notifications/	Alertas e comunicações
bookings/	Histórico de contratações
reviews/	Controle de avaliações feitas
🧠 Estratégia de Produto

🧲 Aquisição: Cadastro rápido e direto

🔁 Retenção: Gamificação baseada no perfil

📊 Engajamento: Métricas e incentivos por uso

✅ Verificação: Conectado com compliance/ e payments/

✅ Conclusão

O módulo clients/ é a base da experiência do cliente no LimpeJá. Ele orquestra perfil, engajamento e personalização, permitindo uma abordagem centrada no usuário com base em dados reais, interações e recompensas.