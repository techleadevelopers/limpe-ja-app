📅 availability/ — Módulo de Disponibilidade
O módulo availability/ é responsável por gerenciar a agenda e a disponibilidade dos prestadores de serviço. Ele permite que os profissionais configurem seus horários de trabalho e que os clientes encontrem facilmente os horários livres para agendar um serviço.

🎯 Objetivo
Permitir que prestadores configurem, atualizem e deletem seus horários de disponibilidade (slots).

Fornecer um endpoint para que clientes possam buscar a disponibilidade de um prestador em uma data específica.

Garantir a consistência dos dados de agendamento e disponibilidade, evitando conflitos de horários.

⚙️ Estrutura de Arquivos
availability/
├── availability.module.ts              # Módulo principal NestJS
├── availability.controller.ts          # Endpoints REST para gerenciamento de disponibilidade
├── availability.service.ts             # Lógica de negócio principal
├── availability.entity.ts              # Entidade ORM principal
├── dto/
│   ├── get-availability.dto.ts         # DTO para consulta de disponibilidade
│   └── update-availability.dto.ts      # DTO para criação e atualização de slots

🧱 Entidade ORM
availability.entity.ts

{
  id: string;
  providerId: string;
  dayOfWeek: number; // 0 = Domingo, 1 = Segunda, etc.
  startTime: string; // Ex: '09:00'
  endTime: string;   // Ex: '17:00'
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

📥 DTOs
get-availability.dto.ts: Contém os parâmetros de consulta para buscar a disponibilidade, como a data específica (date).

update-availability.dto.ts: Define os dados necessários para um prestador criar ou modificar um slot de disponibilidade, incluindo dayOfWeek, startTime, e endTime.

🌐 Endpoints — availability.controller.ts
Método

Rota

Descrição

GET

/providers/:providerId/availability

Retorna a disponibilidade de um prestador para uma data específica.

POST

/providers/:providerId/availability

Adiciona um novo slot de disponibilidade para um prestador.

PATCH

/providers/:providerId/availability

Atualiza um ou mais slots de disponibilidade.

DELETE

/providers/:providerId/availability/:availabilityId

Deleta um slot de disponibilidade específico.

🔗 Integração com Outros Módulos
Módulo

Interação

bookings/

O módulo bookings consulta a disponibilidade do AvailabilityService antes de permitir que um agendamento seja criado, garantindo que o horário escolhido esteja livre.

providers/

O AvailabilityService usa o ProvidersService para validar se o provedor existe e se o usuário que está tentando modificar a agenda é realmente o dono do perfil.

✅ Conclusão
O módulo availability/ é crucial para a experiência de agendamento no LimpeJá. Ele atua como o motor de calendário do aplicativo, permitindo que a agenda dos profissionais seja gerenciada de forma flexível e que os clientes possam encontrar e reservar serviços com confiança, sabendo que os horários exibidos estão atualizado