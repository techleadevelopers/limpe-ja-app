// src/users/users.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Prisma, UserRole } from '@prisma/client'; // Importe UserRole aqui
import { NotificationsService } from '../notifications/notifications.service';
import { QueuesService } from '../queues/queues.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private queuesService: QueuesService,
  ) {}

  async findOne(id: string): Promise<User | null> {
    this.logger.log(`[UsersService] findOne: Buscando usuário por ID: ${id}`);
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        client: {
          include: {
            address: true,
            // REMOVIDO: loyalty não é uma relação direta do Client
            // loyalty: true,
          },
        },
        provider: {
          include: {
            address: true,
          },
        },
        loyalty: true, // <--- ADICIONADO: Inclui os dados de fidelidade diretamente do User
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

  // NOVO MÉTODO: Listar todos os usuários (para administradores)
  async findAllUsers(): Promise<User[]> {
    this.logger.log(`[UsersService] findAllUsers: Listando todos os usuários.`);
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' }, // Ordena por data de criação, do mais novo para o mais antigo
      where: {
        // Exclui usuários que foram marcados para exclusão (soft delete)
        deletionScheduledAt: null,
        // Opcional: Excluir administradores da lista se você só quiser ver clientes/provedores
        // role: {
        //   not: UserRole.ADMIN
        // }
      },
      // Opcional: Inclua dados relacionados se necessário (ex: client, provider)
      // include: {
      //   client: true,
      //   provider: true,
      // },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    this.logger.log(`[UsersService] update: Atualizando usuário com ID: ${id}`);
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: {
          email: updateUserDto.email,
          fullName: updateUserDto.fullName,
          phone: updateUserDto.phone,
          avatarUrl: updateUserDto.avatarUrl,
        },
      });
      this.logger.log(`[UsersService] update: Usuário com ID "${id}" atualizado com sucesso.`);
      // Telemetria: user_profile_updated
      this.logger.log(`[TELEMETRY] user_profile_updated: { userId: ${id} }`);
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
    this.logger.log(`[UsersService] remove: Removendo (soft delete) usuário com ID: ${id}`);
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }

      await this.prisma.user.update({
        where: { id },
        data: {
          email: `deleted-${user.id}-${Date.now()}@limpeja.com`,
          deletionScheduledAt: new Date(),
          // TODO: Se quiser, mudar role para "INACTIVE" ou "DELETED"
          // isActive: false, // Se você tiver um campo isActive
        },
      });

      this.logger.log(`[UsersService] remove: Usuário com ID "${id}" marcado para exclusão (soft delete).`);
      // Telemetria: user_removed
      this.logger.log(`[TELEMETRY] user_removed: { userId: ${id} }`);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }
      this.logger.error(`[UsersService] remove: Erro ao marcar usuário com ID "${id}" para exclusão: ${error.message}`);
      throw error;
    }
  }

  async requestDataExport(userId: string): Promise<void> {
    this.logger.log(`[UsersService] requestDataExport: Solicitação de exportação de dados para userId: ${userId}.`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    await this.queuesService.addDataExportJob('export-user-data', { userId: user.id, email: user.email });

    const notificationDto: CreateNotificationDto = {
      userId: user.id,
      type: 'DATA_EXPORT_REQUESTED',
      message: 'Sua solicitação de exportação de dados foi recebida. Você será notificado quando o arquivo estiver pronto para download.',
      targetUrl: '/profile/data-privacy',
      title: 'Solicitação de Exportação de Dados Recebida',
    };
    await this.notificationsService.createNotification(notificationDto);
    this.logger.log(`[UsersService] requestDataExport: Notificação de exportação de dados adicionada à fila para userId: ${userId}.`);
    // Telemetria: data_export_requested
    this.logger.log(`[TELEMETRY] data_export_requested: { userId: ${userId} }`);
  }

  async requestAccountDeletion(userId: string): Promise<void> {
    this.logger.log(`[UsersService] requestAccountDeletion: Solicitação de exclusão de conta para userId: ${userId}.`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    // Em vez de deletar diretamente, marcamos para exclusão e alteramos o email para evitar conflitos futuros
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${user.id}-${Date.now()}@limpeja.com`, // Altera o email para liberar o original
        deletionScheduledAt: new Date(), // Marca a data da solicitação de exclusão
        // TODO: Mudar o role para um "DELETED" ou "INACTIVE" para impedir login
        // isActive: false, // Se você tiver um campo isActive
      },
    });
    const notificationDto: CreateNotificationDto = {
      userId: user.id,
      type: 'ACCOUNT_DELETION_REQUESTED',
      message: 'Sua conta foi marcada para exclusão. Ela será desativada e excluída permanentemente após um período de carência de 30 dias.',
      targetUrl: '/profile/data-privacy',
      title: 'Solicitação de Exclusão de Conta Recebida',
    };
    await this.notificationsService.createNotification(notificationDto);
    this.logger.log(`[UsersService] requestAccountDeletion: Notificação de exclusão de conta adicionada à fila para userId: ${userId}.`);
    // Telemetria: account_deletion_requested
    this.logger.log(`[TELEMETRY] account_deletion_requested: { userId: ${userId} }`);
  }
}