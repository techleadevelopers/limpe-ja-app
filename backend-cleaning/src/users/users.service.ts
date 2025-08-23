// src/users/users.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { QueuesService } from '../queues/queues.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto'; // FIX: Import CreateNotificationDto

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
        // CORREÇÃO: Incluir a relação de endereço dentro de 'client' e 'provider'
        client: {
          include: {
            address: true, // Adiciona o objeto de endereço
          },
        },
        provider: {
          include: {
            address: true, // Adiciona o objeto de endereço
          },
        },
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

  async requestDataExport(userId: string): Promise<void> {
    this.logger.log(`[UsersService] requestDataExport: Solicitação de exportação de dados para userId: ${userId}.`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    await this.queuesService.addDataExportJob('export-user-data', { userId: user.id, email: user.email });
    
    // FIX: Update createNotification call to use DTO
    const notificationDto: CreateNotificationDto = {
      userId: user.id,
      type: 'DATA_EXPORT_REQUESTED',
      message: 'Sua solicitação de exportação de dados foi recebida. Você será notificado quando o arquivo estiver pronto para download.',
      targetUrl: '/profile/data-privacy',
      title: 'Solicitação de Exportação de Dados Recebida', // Added title
    };
    await this.notificationsService.createNotification(notificationDto);
    this.logger.log(`[UsersService] requestDataExport: Notificação de exportação de dados adicionada à fila para userId: ${userId}.`);
  }

  async requestAccountDeletion(userId: string): Promise<void> {
    this.logger.log(`[UsersService] requestAccountDeletion: Solicitação de exclusão de conta para userId: ${userId}.`);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted-${user.id}-${Date.now()}@limpeja.com`,
      },
    });
    // FIX: Update createNotification call to use DTO
    const notificationDto: CreateNotificationDto = {
      userId: user.id,
      type: 'ACCOUNT_DELETION_REQUESTED',
      message: 'Sua conta foi marcada para exclusão. Ela será desativada e excluída permanentemente após um período de carência de 30 dias.',
      targetUrl: '/profile/data-privacy',
      title: 'Solicitação de Exclusão de Conta Recebida', // Added title
    };
    await this.notificationsService.createNotification(notificationDto);
    this.logger.log(`[UsersService] requestAccountDeletion: Notificação de exclusão de conta adicionada à fila para userId: ${userId}.`);
  }
}