🔔 notifications/ — Módulo de Notificações do LimpeJá

O módulo notifications/ centraliza o envio, listagem e gerenciamento de notificações dentro do app, sendo peça-chave para engajamento, comunicação ativa, e feedback em tempo real. Suporta múltiplos canais e tipos de notificação.

🎯 Objetivo

Disparar notificações automáticas ou manuais (push/email)

Garantir que usuários recebam alertas em tempo real

Permitir marcação como lida, categorização e rastreio

Ser o backbone de comunicação assíncrona entre app e usuários

⚙️ Estrutura de Arquivos
notifications/
├── notifications.module.ts            # Módulo principal NestJS
├── notifications.controller.ts        # Endpoints públicos e admin
├── notifications.service.ts           # Lógica de envio, listagem, update
├── notification.entity.ts             # Estrutura ORM da notificação
├── create-notification.dto.ts         # DTO para criação
├── update-notification.dto.ts         # DTO para edição
├── mark-as-read.dto.ts                # DTO para marcar como lida

🧠 Lógica de Funcionamento
Tipos de Notificação Suportados:

Push Notification (via Firebase, OneSignal ou Expo)

In-App (persistente, no painel do usuário)

E-mail (via worker de envio externo)

Categorias:

Financeira (ex: repasse realizado)

Missões (ex: missão completada)

Sistema (ex: manutenção, erro)

Agendamento (ex: serviço confirmado)

Avaliação / Ranking / Gamificação

🧩 Entidade ORM — notification.entity.ts
{
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'push' | 'email' | 'in-app';
  category: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

📥 DTOs
create-notification.dto.ts
{
  userId: string;
  title: string;
  message: string;
  type: 'push' | 'email' | 'in-app';
  category?: string;
}

update-notification.dto.ts
{
  title?: string;
  message?: string;
  read?: boolean;
}

mark-as-read.dto.ts
{
  notificationId: string;
}

🌐 Endpoints — notifications.controller.ts
Método	Rota	Descrição
POST	/notifications	Cria e envia uma nova notificação
GET	/notifications/user/:userId	Lista notificações do usuário
PATCH	/notifications/:id	Atualiza conteúdo ou status de notificação
POST	/notifications/mark-as-read	Marca como lida
DELETE	/notifications/:id	Remove notificação
🔗 Integração com Outros Módulos
Módulo	Finalidade do Envio
bookings/	Avisar confirmação, alterações
earnings/	Notificar repasse efetuado
missions/	Informar missão nova ou completa
loyalty/	Alerta de resgate ou saldo
ranking/	Alerta sobre posição ou destaque
support/	Atualização de chamados
queue workers/	Envio assíncrono com BullMQ
📊 Estratégia de Produto

✅ Melhora comunicação proativa com o usuário

🚀 Impulsiona engajamento com alertas em tempo real

🧠 Reforça sensação de atividade constante

🔁 Reduz fricção no fluxo de informações

🛡️ Segurança e Controle

Verificação por userId

Filtro por categorias e status

Marcação como lida individual ou em lote

Possibilidade de log e histórico por tipo

🧭 Próximas Evoluções Sugeridas
Recurso	Prioridade
Configurações de preferências	Alta
Template dinâmico por evento	Média
Multi-idioma	Média
Notificações segmentadas	Alta
WebSocket para tempo real	Alta
✅ Conclusão

O módulo notifications/ é o hub central de comunicação assíncrona do LimpeJá. Ele garante que todas as partes do sistema possam alertar os usuários de forma contextual, rápida e acionável — sendo fundamental para reforçar engajamento, fidelidade e confiança.