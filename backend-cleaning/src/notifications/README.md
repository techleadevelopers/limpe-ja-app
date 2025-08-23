📩 Notifications Module — README

O módulo de Notificações é responsável por gerenciar toda a lógica de criação, envio e atualização de notificações no sistema. Ele garante que usuários, provedores e administradores recebam comunicações relevantes em tempo real ou de forma persistida (armazenadas no banco para consulta posterior).

🔑 Objetivos do Módulo

Criar notificações a partir de eventos do sistema (ex.: nova reserva, mensagem de chat, missão concluída).

Armazenar notificações no banco (Prisma).

Permitir atualização de status (ex.: lida/não lida).

Expor endpoints seguros para clientes e provedores acessarem suas notificações.

Servir de hub de eventos para integração futura com push notifications (FCM/APNs).

📂 Estrutura do Módulo

notifications.controller.ts → expõe as rotas HTTP.

notifications.service.ts → contém a lógica de negócio.

notifications.module.ts → registra dependências no NestJS.

notification.entity.ts → define a estrutura da entidade Notification.

DTOs → create-notification.dto.ts, update-notification.dto.ts (validação dos payloads).

🏗 Entidade: Notification

Representa uma notificação persistida no banco. Campos principais:

id: string → identificador único.

userId: string → usuário alvo da notificação.

title: string → título resumido.

message: string → corpo da notificação.

type: string → categoria (BOOKING, MISSION, SYSTEM, etc.).

status: 'UNREAD' | 'READ' → controla se o usuário já visualizou.

createdAt / updatedAt → timestamps de rastreio.

📡 Controller (notifications.controller.ts)

Expõe endpoints protegidos com JWT + RolesGuard.

🔹 Endpoints

POST /notifications

Cria uma nova notificação.

Acesso: ADMIN.

Payload: CreateNotificationDto.

PATCH /notifications/:id

Atualiza status ou conteúdo da notificação.

Acesso: ADMIN.

Payload: UpdateNotificationDto.

GET /notifications/:userId

Lista notificações de um usuário.

Acesso: USER (cliente ou provedor autenticado).

⚙️ Service (notifications.service.ts)

Centraliza a lógica de manipulação de notificações.

🔹 Funções principais

create(dto: CreateNotificationDto)
Cria uma nova notificação no banco.

update(id: string, dto: UpdateNotificationDto)
Permite alterar status ou campos de uma notificação.

findByUser(userId: string)
Lista todas notificações do usuário, ordenadas por data.

markAsRead(id: string)
Atualiza status de uma notificação para READ.

delete(id: string) (se aplicável)
Remove uma notificação.

🔄 Fluxo de Negócio Atual

Gatilho de Evento

Exemplo: reserva criada, missão concluída, avaliação recebida.

O serviço responsável chama notificationsService.create().

Persistência

A notificação é salva no banco via Prisma.

Entrega

A notificação fica disponível na listagem do usuário (findByUser).

Pode ser exibida no frontend (badge, modal, feed de notificações).

Interação do Usuário

Ao abrir, a notificação é marcada como READ.

O serviço expõe markAsRead para esse fluxo.

🔒 Regras de Acesso

ADMIN → pode criar e atualizar notificações (ex.: disparos manuais ou ajustes).

USER (CLIENTE/PROVIDER) → pode apenas listar e atualizar o status das próprias notificações.

🚀 Exemplos de Uso
Criar notificação (ADMIN)
POST /notifications
Authorization: Bearer <token_admin>
{
  "userId": "user-123",
  "title": "Nova Reserva",
  "message": "Sua reserva foi confirmada!",
  "type": "BOOKING"
}

Listar notificações do usuário
GET /notifications/user-123
Authorization: Bearer <token_user>

Marcar como lida
PATCH /notifications/abcd1234
Authorization: Bearer <token_user>
{
  "status": "READ"
}

📌 Pontos de Evolução

Integração com FCM/APNs para push notifications.

Fila de processamento via QueuesModule para envio em larga escala.

Criação de categorias configuráveis de notificações.

Implementação de preferências de notificação por usuário (ex.: receber só e-mail, só push, ambos).