Certo. Com base nos arquivos que você forneceu, aqui está o README completo para o módulo guarantee.

🛡️ guarantee/ — Módulo de Garantia
O módulo guarantee/ é o núcleo do sistema de proteção ao cliente. Ele fornece a infraestrutura completa para que os clientes possam submeter, rastrear e resolver solicitações de garantia relacionadas a serviços concluídos. Este módulo é essencial para construir confiança, oferecendo um canal formal para reportar problemas e buscar uma compensação.

🎯 Objetivo
Permitir a criação de solicitações de garantia: Clientes podem iniciar um processo de garantia para um agendamento específico.

Gerenciar o fluxo de status: Define e atualiza o ciclo de vida de uma solicitação de garantia (PENDING, APPROVED, REJECTED, SETTLED).

Fornecer visibilidade: Permite que clientes e administradores visualizem o status e os detalhes das solicitações.

Integrar com notificações: Garante que os usuários sejam notificados sobre o progresso de suas solicitações.

⚙️ Estrutura de Arquivos
guarantee/
├── dto/
│   ├── submit-claim.dto.ts      # DTO para a criação de uma nova solicitação de garantia.
│   └── update-claim.dto.ts      # DTO para a atualização do status da solicitação (uso interno/administrador).
├── entities/
│   └── guarantee-claim.entity.ts # Entidade de dados para uma solicitação de garantia.
├── guarantee.controller.ts      # Endpoints REST para interagir com o módulo.
├── guarantee.module.ts          # Módulo principal NestJS, gerenciando dependências.
└── guarantee.service.ts         # Lógica de negócio principal do módulo.
🧱 Entidades e DTOs
guarantee-claim.entity.ts
Esta entidade define a estrutura de uma solicitação de garantia no banco de dados.

TypeScript

export enum ClaimStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SETTLED = 'SETTLED',
}

export interface GuaranteeClaim {
  id: string;
  bookingId: string;
  clientId: string;
  providerId: string;
  description: string;
  attachments?: string[]; // URLs de fotos/vídeos
  estimatedValue?: number;
  resolvedValue?: number;
  status: ClaimStatus;
  resolutionNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
DTOs
SubmitClaimDto: Contém os dados necessários para que um cliente envie uma solicitação. Inclui bookingId, description, attachments (opcional) e estimatedValue (opcional).

UpdateClaimDto: Utilizado por administradores para atualizar o status da solicitação, adicionar resolutionNotes e definir o resolvedValue.

🌐 Endpoints — guarantee.controller.ts
Método	Rota	Descrição
POST	/guarantee/claims	(Apenas CLIENT) Cria uma nova solicitação de garantia para um agendamento.
GET	/guarantee/claims/me	(Apenas CLIENT) Retorna a lista de todas as solicitações de garantia do usuário autenticado.
GET	/guarantee/claims/:id	(CLIENT, ADMIN) Retorna os detalhes de uma solicitação específica. Clientes só podem ver as suas próprias solicitações, enquanto administradores podem ver todas.
PATCH	/guarantee/claims/:id/status	(Apenas ADMIN) Atualiza o status de uma solicitação de garantia.

Exportar para as Planilhas
🔗 Integração com Outros Módulos
bookings/: O GuaranteeService valida se o bookingId existe e está associado ao cliente que submeteu a solicitação, garantindo que o processo seja iniciado para agendamentos válidos.

notifications/: Após a criação ou atualização de uma solicitação, o GuaranteeService utiliza o NotificationsService para enviar alertas em tempo real. Isso inclui notificar administradores sobre novas solicitações e clientes sobre o status de suas próprias solicitações.

prisma/: O módulo interage diretamente com o PrismaService para operações de banco de dados, como criar, buscar e atualizar as solicitações de garantia.

auth/: O GuaranteeController usa JwtAuthGuard e RolesGuard para proteger as rotas, garantindo que apenas usuários autenticados com as permissões corretas (CLIENT ou ADMIN) possam acessar os endpoints.

✅ Conclusão
O módulo guarantee/ é um componente crítico que fortalece a confiança na plataforma ao fornecer um mecanismo robusto para resolver disputas e garantir a qualidade do serviço. Sua estrutura modular e a clara separação de responsabilidades facilitam a manutenção e a escalabilidade, assegurando que o sistema de garantia permaneça eficaz à medida que a plataforma cresce.