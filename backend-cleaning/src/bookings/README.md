🗓️ bookings/ — Módulo de Agendamentos
O módulo bookings/ é o coração do marketplace LimpeJá. Ele orquestra todo o ciclo de vida de um serviço agendado, desde a solicitação inicial pelo cliente até a conclusão e o pagamento, conectando as pontes entre clientes e prestadores.

🎯 Objetivo
Permitir que clientes criem e gerenciem agendamentos de serviços.

Fornecer endpoints para que prestadores visualizem e respondam a novas solicitações (aceitar/rejeitar).

Manter o status e o histórico de cada agendamento.

Servir como um gatilho central para a integração com outros módulos, como chat e pagamentos.

⚙️ Estrutura de Arquivos
bookings/
├── bookings.module.ts                 # Módulo principal NestJS
├── bookings.controller.ts             # Endpoints REST para agendamentos
├── bookings.service.ts                # Lógica de negócio principal
├── booking.entity.ts                  # Entidade ORM principal
├── dto/
│   ├── create-booking.dto.ts          # DTO para criação de agendamento
│   ├── update-booking.dto.ts          # DTO para atualização de agendamento
│   └── booking-details.dto.ts         # DTO para detalhes de agendamento

🧱 Entidade ORM
booking.entity.ts

{
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;
  serviceName: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELED';
  serviceDate: Date;
  serviceAddress: string;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  createdAt: Date;
  updatedAt: Date;
}

📥 DTOs
create-booking.dto.ts: Contém os dados para um cliente criar um novo agendamento, como providerId, serviceDate, address, etc.

update-booking.dto.ts: Define os campos que podem ser atualizados em um agendamento, como status (para aceitar/rejeitar) ou serviceDate (para reagendar).

booking-details.dto.ts: Estrutura a resposta de um endpoint, incluindo todos os detalhes de um agendamento para exibição no frontend.

🌐 Endpoints — bookings.controller.ts
Método

Rota

Descrição

POST

/bookings

Cria um novo agendamento.

GET

/bookings/me/client

Retorna a lista de agendamentos do cliente logado.

GET

/bookings/me/provider

Retorna a lista de agendamentos do prestador logado.

PATCH

/bookings/:id/accept

Prestador aceita o agendamento.

PATCH

/bookings/:id/reject

Prestador rejeita o agendamento.

PATCH

/bookings/:id/cancel

Cliente ou prestador cancela o agendamento.

GET

/bookings/:id

Retorna os detalhes de um agendamento específico.

🔗 Integração com Outros Módulos
Módulo

Interação

payments/

O agendamento tem seu status de pagamento gerenciado aqui. Ao aceitar um agendamento, o módulo de payments é acionado para criar uma cobrança (ex: PIX). Ao concluir, o payments processa o pagamento final e a comissão.

chat/

Após a criação ou confirmação de um agendamento, o bookings aciona o ChatService para encontrar ou criar uma conversa entre o cliente e o prestador.

providers/ & clients/

O bookings consulta esses módulos para obter dados do cliente e do prestador (nome, telefone, etc.) para exibição nos detalhes do agendamento.

notifications/

O bookings é responsável por enviar notificações push para o prestador (nova solicitação) e para o cliente (agendamento aceito/rejeitado).

reviews/

Após a conclusão de um agendamento (status: COMPLETED), o módulo bookings pode acionar o ReviewsService para notificar cliente e prestador para deixarem uma avaliação.

🧠 Lógica de Negócio e Estratégia de Produto
O módulo de agendamentos é o motor de valor da plataforma. Ele garante que a jornada do usuário, desde a descoberta de um profissional até a conclusão do serviço, seja contínua e segura. Sua lógica de status (PENDING, ACCEPTED, etc.) é o ponto central para a tomada de decisão do frontend e para o acionamento de todos os outros serviços, garantindo a coesão do sistema e a entrega de uma experiência de serviço completa.

✅ Conclusão
O módulo bookings/ é a espinha dorsal operacional do LimpeJá. Sua robustez e integrações estratégicas são fundamentais para a execução de uma experiência de serviço de ponta a ponta. Ele não apenas gerencia agendamentos, mas também age como o hub de comunicação e pagamento, assegurando que todas as partes do sistema funcionem em harmonia para entregar a promessa de praticidade e confiança.