// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  User,
  Prisma,
  UserRole,
  Client,
  Provider,
  Loyalty,
  Referral,
  Address,
  ProviderService,
  Service,
  Review,
  Booking,
  BookingStatus,
  VerificationStatus,
  Availability,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { QueuesService } from '../queues/queues.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';

// Type alias para User com includes (baseado no schema.prisma) - EXPANDIDO para ProviderWithCalculatedRating compatibilidade
// Importante: NÃO misturar include + select em um mesmo nível (Prisma não permite).
export type UserWithIncludes = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    role: true;
    fullName: true;
    phone: true;
    avatarUrl: true;
    createdAt: true;
    updatedAt: true;
    isVerified: true;
    client: {
      select: {
        id: true;
        fullName: true;
        phone: true;
        cpf: true;
        noShowCount: true;
        cancellationCount: true;
        address: true;
        createdAt: true;
        updatedAt: true;
      };
    } | null;
    provider: {
      select: {
        id: true;
        userId: true;
        fullName: true;
        phone: true;
        bio: true;
        verificationStatus: true;
        avatarUrl: true;
        cpf: true;
        dateOfBirth: true;
        yearsOfExperience: true;
        badges: true;
        acceptanceRate: true;
        averageResponseTime: true;
        address: true;
        user: true;
        createdAt: true;
        updatedAt: true;
        fiveStarReviewCount: true;
        monthlyBookingsCount: true;
        pixKey: true;
        pixKeyMasked: true;
        providerServices: { include: { service: true } };
        reviewsReceived: { include: { client: { include: { user: true } } } };
        bookings: {
          where: { status: 'COMPLETED' };
          orderBy: { createdAt: 'desc' };
          take: 100;
        };
        availability: true;
      };
    } | null;
    loyalty: true;
    referredBy: true;
    referralsMade: true;
  };
}>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private queuesService: QueuesService,
  ) {}

  async findOne(id: string): Promise<UserWithIncludes | null> {
    this.logger.log(`[UsersService] findOne: Buscando usuário por ID: ${id}`);
    try {
      const user = (await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          isVerified: true,
          client: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              cpf: true,
              noShowCount: true,
              cancellationCount: true,
              address: true,
            },
          },
          provider: {
            select: {
              id: true,
              userId: true,
              fullName: true,
              phone: true,
              bio: true,
              verificationStatus: true,
              avatarUrl: true,
              cpf: true,
              dateOfBirth: true,
              yearsOfExperience: true,
              badges: true,
              acceptanceRate: true,
              averageResponseTime: true,
              address: true,
              user: true,
              createdAt: true,
              updatedAt: true,
              fiveStarReviewCount: true,
              monthlyBookingsCount: true,
              pixKey: true,
              pixKeyMasked: true,
              providerServices: { include: { service: true } },
              reviewsReceived: {
                include: { client: { include: { user: true } } },
              },
              bookings: {
                where: { status: 'COMPLETED' },
                orderBy: { createdAt: 'desc' },
                take: 100,
              },
              availability: true,
            },
          },
          loyalty: true,
          referredBy: true,
          referralsMade: true,
        },
      })) as unknown as UserWithIncludes | null;

      this.logger.log(
        `[UsersService] findOne: Usuário encontrado com includes: ${!!user}`,
      );
      if (!user) {
        this.logger.warn(
          `[UsersService] findOne: Usuário com ID "${id}" não encontrado.`,
        );
      }
      return user;
    } catch (error: any) {
      this.logger.error(
        `[UsersService] findOne: Erro na query Prisma para ID ${id}: ${error.message}`,
      );
      // Fallback: Query simples sem includes se falhar (ex: relação inexistente ou erro de include)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const fallbackUser = await this.prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            role: true,
            fullName: true,
            phone: true,
            avatarUrl: true,
            client: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                cpf: true,
                noShowCount: true,
                cancellationCount: true,
                address: true,
              },
            },
            provider: {
              select: {
                id: true,
                userId: true,
                fullName: true,
                phone: true,
                bio: true,
                verificationStatus: true,
                avatarUrl: true,
                cpf: true,
                dateOfBirth: true,
                yearsOfExperience: true,
                badges: true,
                acceptanceRate: true,
                averageResponseTime: true,
                address: true,
                user: true,
                providerServices: { include: { service: true } },
                reviewsReceived: {
                  include: { client: { include: { user: true } } },
                },
                bookings: {
                  where: { status: 'COMPLETED' },
                  orderBy: { createdAt: 'desc' },
                  take: 100,
                },
                availability: true,
              },
            },
            loyalty: true,
            referredBy: true,
            referralsMade: true,
          },
        });
        return fallbackUser as unknown as UserWithIncludes | null;
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(
      `[UsersService] findByEmail: Buscando usuário por email: ${email}`,
    );
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        this.logger.warn(
          `[UsersService] findByEmail: Usuário com email "${email}" não encontrado.`,
        );
      }
      return user;
    } catch (error: any) {
      this.logger.error(
        `[UsersService] findByEmail: Erro na query: ${error.message}`,
      );
      throw error;
    }
  }

  // Listar com select consistente
  async findAllUsers(): Promise<UserWithIncludes[]> {
    this.logger.log(
      '[UsersService] findAllUsers: Listando todos os usuários com select.',
    );
    try {
      const users = (await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        where: {
          deletionScheduledAt: null, // Soft delete do schema
        },
        select: {
          id: true,
          email: true,
          role: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          isVerified: true,
          client: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              cpf: true,
              noShowCount: true,
              cancellationCount: true,
              address: true,
            },
          },
          provider: {
            select: {
              id: true,
              userId: true,
              fullName: true,
              phone: true,
              bio: true,
              verificationStatus: true,
              avatarUrl: true,
              cpf: true,
              dateOfBirth: true,
              yearsOfExperience: true,
              badges: true,
              acceptanceRate: true,
              averageResponseTime: true,
              address: true,
              user: true,
              createdAt: true,
              updatedAt: true,
              fiveStarReviewCount: true,
              monthlyBookingsCount: true,
              pixKey: true,
              pixKeyMasked: true,
              providerServices: { include: { service: true } },
              reviewsReceived: {
                include: { client: { include: { user: true } } },
              },
              bookings: {
                where: { status: 'COMPLETED' },
                orderBy: { createdAt: 'desc' },
                take: 100,
              },
              availability: true,
            },
          },
          loyalty: true,
          referredBy: true,
          referralsMade: true,
        },
      })) as unknown as UserWithIncludes[];

      this.logger.log(
        `[UsersService] findAllUsers: Retornando ${users.length} usuários.`,
      );
      return users;
    } catch (error: any) {
      this.logger.error(
        `[UsersService] findAllUsers: Erro ao listar usuários: ${error.message}`,
      );
      throw error;
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserWithIncludes> {
    this.logger.log(
      `[UsersService] update: Atualizando usuário com ID "${id}" com DTO: ${JSON.stringify(
        updateUserDto,
      )}`,
    );
    try {
      const data: Prisma.UserUpdateInput = {};

      if (updateUserDto.fullName !== undefined) {
        data.fullName = updateUserDto.fullName;
      }
      if (updateUserDto.phone !== undefined) {
        data.phone = updateUserDto.phone;
      }
      if (updateUserDto.avatarUrl !== undefined) {
        data.avatarUrl = updateUserDto.avatarUrl;
      }

      // Atualiza Client/Provider se necessário
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }

      if (
        user.role === UserRole.CLIENT &&
        (updateUserDto.fullName !== undefined ||
          updateUserDto.phone !== undefined)
      ) {
        await this.prisma.client.update({
          where: { userId: id },
          data: {
            fullName: updateUserDto.fullName,
            phone: updateUserDto.phone,
          },
        });
        this.logger.log(
          `[UsersService] update: Campos de Client atualizados para userId: ${id}`,
        );
      } else if (
        user.role === UserRole.PROVIDER &&
        (updateUserDto.fullName !== undefined ||
          updateUserDto.phone !== undefined)
      ) {
        await this.prisma.provider.update({
          where: { userId: id },
          data: {
            fullName: updateUserDto.fullName,
            phone: updateUserDto.phone,
          },
        });
        this.logger.log(
          `[UsersService] update: Campos de Provider atualizados para userId: ${id}`,
        );
      } else if (
        updateUserDto.fullName !== undefined ||
        updateUserDto.phone !== undefined
      ) {
        throw new BadRequestException(
          'Campos fullName e phone só podem ser atualizados para roles CLIENT ou PROVIDER.',
        );
      }

      // Atualize User base
      await this.prisma.user.update({
        where: { id },
        data,
      });

      this.logger.log(
        `[UsersService] update: Usuário com ID "${id}" atualizado com sucesso.`,
      );
      this.logger.log(`[TELEMETRY] user_profile_updated: { userId: ${id} }`);

      // Sempre retorne com includes
      const fullUpdatedUser = await this.findOne(id);
      if (!fullUpdatedUser) {
        throw new NotFoundException(
          'Usuário atualizado não encontrado após update.',
        );
      }
      return fullUpdatedUser;
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }
      this.logger.error(
        `[UsersService] update: Erro ao atualizar usuário com ID "${id}": ${error.message}`,
      );
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(
      `[UsersService] remove: Removendo (soft delete) usuário com ID: ${id}`,
    );
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }

      await this.prisma.user.update({
        where: { id },
        data: {
          email: `deleted-${user.id}-${Date.now()}@limpeja.com`, // email unique
          deletionScheduledAt: new Date(),
        },
      });

      this.logger.log(
        `[UsersService] remove: Usuário com ID "${id}" marcado para exclusão (soft delete).`,
      );
      this.logger.log(`[TELEMETRY] user_removed: { userId: ${id} }`);
    } catch (error: any) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }
      this.logger.error(
        `[UsersService] remove: Erro ao marcar usuário com ID "${id}" para exclusão: ${error.message}`,
      );
      throw error;
    }
  }

  async requestDataExport(userId: string): Promise<void> {
    this.logger.log(
      `[UsersService] requestDataExport: Solicitação de exportação de dados para userId: ${userId}.`,
    );
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }
      await this.queuesService.addDataExportJob('export-user-data', {
        userId: user.id,
        email: user.email,
      });

      const notificationDto: CreateNotificationDto = {
        userId: user.id,
        type: 'DATA_EXPORT_REQUESTED',
        message:
          'Sua solicitação de exportação de dados foi recebida. Você será notificado quando o arquivo estiver pronto para download.',
        targetUrl: '/profile/data-privacy',
        title: 'Solicitação de Exportação de Dados Recebida',
      };
      await this.notificationsService.createNotification(notificationDto);
      this.logger.log(
        `[UsersService] requestDataExport: Notificação adicionada à fila para userId: ${userId}.`,
      );
      this.logger.log(
        `[TELEMETRY] data_export_requested: { userId: ${userId} }`,
      );
    } catch (error: any) {
      this.logger.error(
        `[UsersService] requestDataExport: Erro ao solicitar exportação de dados: ${error.message}`,
      );
      throw error;
    }
  }

  async requestAccountDeletion(userId: string): Promise<void> {
    this.logger.log(
      `[UsersService] requestAccountDeletion: Solicitação de exclusão de conta para userId: ${userId}.`,
    );
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${user.id}-${Date.now()}@limpeja.com`,
          deletionScheduledAt: new Date(),
        },
      });
      const notificationDto: CreateNotificationDto = {
        userId: user.id,
        type: 'ACCOUNT_DELETION_REQUESTED',
        message:
          'Sua conta foi marcada para exclusão. Ela será desativada e excluída permanentemente após um período de carência de 30 dias.',
        targetUrl: '/profile/data-privacy',
        title: 'Solicitação de Exclusão de Conta Recebida',
      };
      await this.notificationsService.createNotification(notificationDto);
      this.logger.log(
        `[UsersService] requestAccountDeletion: Notificação adicionada à fila para userId: ${userId}.`,
      );
      this.logger.log(
        `[TELEMETRY] account_deletion_requested: { userId: ${userId} }`,
      );
    } catch (error: any) {
      this.logger.error(
        `[UsersService] requestAccountDeletion: Erro ao solicitar exclusão de conta: ${error.message}`,
      );
      throw error;
    }
  }
}
