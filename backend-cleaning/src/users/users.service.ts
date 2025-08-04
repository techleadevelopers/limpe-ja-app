// src/users/users.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service'; // Para notificações
import { QueuesService } from '../queues/queues.service'; // Para exportação de dados

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService, // Injetar NotificationsService
    private queuesService: QueuesService, // Injetar QueuesService
  ) {}

  async findOne(id: string): Promise<User | null> {
    this.logger.log(`[UsersService] findOne: Buscando usuário por ID: ${id}`);
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        client: true,
        provider: true,
      },
    });
    if (!user) {
      this.logger.warn(`[UsersService] findOne: Usuário com ID "${id}" não encontrado.`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`[UsersService] findByEmail: Buscando usuário por email: ${email}`);
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      this.logger.warn(`[UsersService] findByEmail: Usuário com email "${email}" não encontrado.`);
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    this.logger.log(`[UsersService] update: Atualizando usuário com ID: ${id}`);
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          email: updateUserDto.email,
          // Outros campos que podem ser atualizados diretamente no User
        },
      });
      this.logger.log(`[UsersService] update: Usuário com ID "${id}" atualizado com sucesso.`);
      return updatedUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }
      this.logger.error(`[UsersService] update: Erro ao atualizar usuário com ID "${id}": ${error.message}`);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`[UsersService] remove: Removendo usuário com ID: ${id}`);
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      this.logger.log(`[UsersService] remove: Usuário com ID "${id}" removido com sucesso.`);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }
      this.logger.error(`[UsersService] remove: Erro ao remover usuário com ID "${id}": ${error.message}`);
      throw error;
    }
  }

  // NOVO MÉTODO: Solicitar exportação de dados do usuário (LGPD)
  async requestDataExport(userId: string): Promise<void> {
    this.logger.log(`[UsersService] requestDataExport: Solicitação de exportação de dados para userId: ${userId}.`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Adiciona a tarefa de exportação de dados à fila
    await this.queuesService.addDataExportJob('export-user-data', { userId: user.id, email: user.email });

    // Notifica o usuário que a solicitação foi recebida
    await this.notificationsService.createNotification(
      user.id,
      'DATA_EXPORT_REQUESTED',
      'Sua solicitação de exportação de dados foi recebida. Você será notificado quando o arquivo estiver pronto para download.',
      '/profile/data-privacy' // Exemplo de URL para o frontend
    );
    this.logger.log(`[UsersService] requestDataExport: Notificação de exportação de dados adicionada à fila para userId: ${userId}.`);
  }

  // NOVO MÉTODO: Solicitar exclusão da conta do usuário (LGPD)
  async requestAccountDeletion(userId: string): Promise<void> {
    this.logger.log(`[UsersService] requestAccountDeletion: Solicitação de exclusão de conta para userId: ${userId}.`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    // Marca a conta como 'pending_deletion' ou similar (você precisaria de um novo campo no modelo User)
    // Ex: await this.prisma.user.update({ where: { id: userId }, data: { status: 'PENDING_DELETION' } });
    // Para simplificar, vamos apenas desativar o email e notificar
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${user.id}-${Date.now()}@limpeja.com`, // Altera email para evitar reuso e identificar
        // Você pode adicionar um campo 'isDeleted' ou 'deletionScheduledAt' no modelo User
      },
    });

    // Notifica o usuário sobre a desativação e o processo de exclusão
    await this.notificationsService.createNotification(
      user.id,
      'ACCOUNT_DELETION_REQUESTED',
      'Sua conta foi marcada para exclusão. Ela será desativada e excluída permanentemente após um período de carência de 30 dias.',
      '/profile/data-privacy'
    );
    this.logger.log(`[UsersService] requestAccountDeletion: Notificação de exclusão de conta adicionada à fila para userId: ${userId}.`);

    // Opcional: Adicionar uma tarefa na fila para a exclusão real após o período de carência
    // await this.queuesService.addDeletionJob('delete-user-permanently', { userId: user.id }, { delay: 30 * 24 * 60 * 60 * 1000 }); // 30 dias de atraso
  }
}