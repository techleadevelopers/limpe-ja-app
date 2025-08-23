⚖️ disputes/ — Módulo de Disputas
O módulo disputes/ é a camada de confiança e segurança do LimpeJá. Ele fornece a infraestrutura necessária para que clientes e prestadores possam reportar e resolver problemas que surjam durante ou após a execução de um serviço, como cancelamentos indevidos, divergências de pagamento ou danos à propriedade.

🎯 Objetivo
Permitir que usuários criem e submetam disputas relacionadas a agendamentos específicos.

Fornecer endpoints para visualizar o histórico de disputas.

Definir e gerenciar o fluxo de status de uma disputa (e.g., PENDING, IN_REVIEW, RESOLVED).

Integrar-se com outros módulos para coletar informações relevantes e notificar as partes envolvidas.

⚙️ Estrutura de Arquivos
disputes/
├── disputes.module.ts                 # Módulo principal NestJS
├── disputes.controller.ts             # Endpoints REST para gerenciamento de disputas
├── disputes.service.ts                # Lógica de negócio principal
├── dispute.entity.ts                  # Entidade ORM principal
├── dto/
│   ├── create-dispute.dto.ts          # DTO para criação de uma nova disputa
│   └── update-dispute.dto.ts          # DTO para atualização do status da disputa

🧱 Entidade ORM
dispute.entity.ts

{
  id: string;
  bookingId: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED_CLIENT' | 'RESOLVED_PROVIDER' | 'CANCELED';
  createdAt: Date;
  updatedAt: Date;
}

📥 DTOs
create-dispute.dto.ts: Contém os dados necessários para abrir uma disputa, como o bookingId, o reason e uma description detalhada.

update-dispute.dto.ts: Usado internamente ou por administradores da plataforma para atualizar o status de uma disputa conforme ela é processada.

🌐 Endpoints — disputes.controller.ts
Método

Rota

Descrição

POST

/disputes

Cria uma nova disputa. Requer um bookingId associado.

GET

/disputes/me

Retorna a lista de todas as disputas em que o usuário logado está envolvido (como reporter ou reported).

GET

/disputes/:id

Retorna os detalhes de uma disputa específica.

PATCH

/disputes/:id

Atualiza o status de uma disputa (normalmente restrito a administradores).

🔗 Integração com Outros Módulos
Módulo

Interação

bookings/

O DisputesService valida que o bookingId existe e está em um estado que permite a abertura de uma disputa.

users/

O módulo consulta o UsersService para obter informações sobre os usuários envolvidos (reporter e reported).

chat/

Uma disputa pode ser iniciada a partir de uma conversa no chat, e o DisputesService pode notificar ambas as partes sobre o novo status da disputa via mensagens de chat.

notifications/

O DisputesService aciona o NotificationsService para enviar alertas em tempo real sobre o status da disputa para os usuários envolvidos.

✅ Conclusão
O módulo disputes/ é fundamental para a construção de um ambiente de confiança no LimpeJá. Ao oferecer um canal formal e transparente para a resolução de conflitos, ele não apenas protege os interesses de clientes e prestadores, mas também reforça a confiabilidade da plataforma, incentivando um uso contínuo e a lealdade do usuário.