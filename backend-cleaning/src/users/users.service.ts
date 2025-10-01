// src/users/users.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, Prisma, UserRole, Client, Provider, Loyalty, Referral, Address, ProviderService, Service, Review, Booking, BookingStatus, VerificationStatus, Availability } from '@prisma/client'; // Importe tipos adicionais do schema (para includes expandidos)
import { NotificationsService } from '../notifications/notifications.service';
import { QueuesService } from '../queues/queues.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';

// Type alias para User com includes (baseado no schema.prisma) - EXPANDIDO para ProviderWithCalculatedRating compatibilidade
export type UserWithIncludes = Prisma.UserGetPayload<{
  include: {
    client: {
      include: { address: true };
      select: { id: true; fullName: true; phone: true; cpf: true; createdAt: true; updatedAt: true };
    };
    provider: {
      include: {
        address: true,
        user: true,  // Inclui User para email, role, etc.
        providerServices: {
          include: { service: true }  // Para services do provider
        },
        reviewsReceived: {
          include: {
            client: {
              include: { user: true }
            }
          }
        },
        bookings: {
          where: { status: 'COMPLETED' },  // CORRIGIDO: String literal em vez de BookingStatus.COMPLETED
          orderBy: { createdAt: 'desc' },  // CORRIGIDO: String literal em vez de Prisma.SortOrder.desc
          take: 100,
        },
        availability: true  // Se existir no schema (ex: Availability model)
      };
      select: {
        id: true;
        fullName: true;
        phone: true;
        createdAt: true;
        updatedAt: true;
        cpf: true;
        dateOfBirth: true;
        yearsOfExperience: true;
        avatarUrl: true;
        verificationStatus: true;  // CORRIGIDO: 'true' em vez de VerificationStatus
        bio: true;
        badges: true;  // Array de badges
        acceptanceRate: true;
        averageResponseTime: true;
      };
    };
    loyalty: true;
    referredBy: true; // CORRIGIDO: Usando 'referredBy' do schema (indicações recebidas)
    referralsMade: true; // Indicações feitas
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

  async findOne(id: string): Promise<UserWithIncludes | null> { // Tipado corretamente
    this.logger.log(`[UsersService] findOne: Buscando usuário por ID: ${id}`);
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          client: {
            include: {
              address: true,
            },
            select: { // Explícito para performance (evita campos pesados como bookings)
              id: true,
              fullName: true,
              phone: true,
              cpf: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          provider: {
            include: {
              address: true,
              user: true,  // EXPANDIDO: Para email e outros do User
              providerServices: {
                include: { service: true }
              },
              reviewsReceived: {
                include: {
                  client: {
                    include: { user: true }
                  }
                }
              },
              bookings: {
                where: { status: 'COMPLETED' },  // CORRIGIDO: String literal
                orderBy: { createdAt: 'desc' },  // CORRIGIDO: String literal
                take: 100,
              },
              availability: true
            },
            select: {
              id: true,
              fullName: true,
              phone: true,
              createdAt: true,
              updatedAt: true,
              cpf: true,
              dateOfBirth: true,
              yearsOfExperience: true,
              avatarUrl: true,
              verificationStatus: true,  // CORRIGIDO: 'true' em vez de VerificationStatus
              bio: true,
              badges: true,
              acceptanceRate: true,
              averageResponseTime: true,
            },
          },
          loyalty: true, // Do schema: Loyalty? em User
          // CORRIGIDO: Usando nomes corretos do schema.prisma
          referredBy: true, // Indicações recebidas (Referral[])
          referralsMade: true, // Indicações feitas (Referral[])
        },
      }) as UserWithIncludes | null; // Cast para o tipo expandido
      this.logger.log(`[UsersService] findOne: Usuário encontrado com includes: ${!!user}`);
      if (!user) {
        this.logger.warn(`[UsersService] findOne: Usuário com ID "${id}" não encontrado.`);
      }
      return user;
    } catch (error) {
      this.logger.error(`[UsersService] findOne: Erro na query Prisma para ID ${id}: ${error.message}`);
      // Fallback: Query simples sem includes se falhar (ex: relação inexistente)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return await this.prisma.user.findUnique({ where: { id } }) as UserWithIncludes | null;
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.log(`[UsersService] findByEmail: Buscando usuário por email: ${email}`);
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        this.logger.warn(`[UsersService] findByEmail: Usuário com email "${email}" não encontrado.`);
      }
      return user;
    } catch (error) {
      this.logger.error(`[UsersService] findByEmail: Erro na query: ${error.message}`);
      throw error;
    }
  }

  // MÉTODO CORRIGIDO: Listar com includes tipados - EXPANDIDO para consistência
  async findAllUsers(): Promise<UserWithIncludes[]> {
    this.logger.log(`[UsersService] findAllUsers: Listando todos os usuários com includes.`);
    try {
      const users = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        where: {
          deletionScheduledAt: null, // Soft delete do schema
        },
        include: { // Mesmo include expandido de findOne para consistência
          client: {
            include: { address: true },
            select: { id: true, fullName: true, phone: true, cpf: true, createdAt: true, updatedAt: true },
          },
          provider: {
            include: {
              address: true,
              user: true,
              providerServices: {
                include: { service: true }
              },
              reviewsReceived: {
                include: {
                  client: {
                    include: { user: true }
                  }
                }
              },
              bookings: {
                where: { status: 'COMPLETED' },  // CORRIGIDO: String literal
                orderBy: { createdAt: 'desc' },  // CORRIGIDO: String literal
                take: 100,
              },
              availability: true
            },
            select: {
              id: true,
              fullName: true,
              phone: true,
              createdAt: true,
              updatedAt: true,
              cpf: true,
              dateOfBirth: true,
              yearsOfExperience: true,
              avatarUrl: true,
              verificationStatus: true,  // CORRIGIDO: 'true' em vez de VerificationStatus
              bio: true,
              badges: true,
              acceptanceRate: true,
              averageResponseTime: true,
            },
          },
          loyalty: true,
          referredBy: true, // CORRIGIDO
          referralsMade: true,
        },
      }) as UserWithIncludes[]; // Cast para array tipado
      this.logger.log(`[UsersService] findAllUsers: Retornando ${users.length} usuários.`);
      return users;
    } catch (error) {
      this.logger.error(`[UsersService] findAllUsers: Erro na query: ${error.message}`);
      throw error;
    }
  }

  // MÉTODO CORRIGIDO: Update retorna com includes
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserWithIncludes> {
    this.logger.log(`[UsersService] update: Atualizando usuário com ID: ${id}. DTO: ${JSON.stringify(updateUserDto)}`);
    try {
      // Busque o usuário primeiro para determinar role (do schema: role em User)
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) {
        throw new NotFoundException(`Usuário com ID "${id}" não encontrado.`);
      }

      const updateData: any = {
        email: updateUserDto.email,
        avatarUrl: updateUserDto.avatarUrl,
      };

      // Baseado no role (do schema: UserRole enum), atualize em Client ou Provider
      if (user.role === UserRole.CLIENT && (updateUserDto.fullName !== undefined || updateUserDto.phone !== undefined)) {
        await this.prisma.client.update({
          where: { userId: id }, // Do schema: userId unique em Client
          data: {
            fullName: updateUserDto.fullName,
            phone: updateUserDto.phone,
          },
        });
        this.logger.log(`[UsersService] update: Campos de Client atualizados para userId: ${id}`);
      } else if (user.role === UserRole.PROVIDER && (updateUserDto.fullName !== undefined || updateUserDto.phone !== undefined)) {
        await this.prisma.provider.update({
          where: { userId: id }, // Do schema: userId unique em Provider
          data: {
            fullName: updateUserDto.fullName,
            phone: updateUserDto.phone,
          },
        });
        this.logger.log(`[UsersService] update: Campos de Provider atualizados para userId: ${id}`);
      } else if (updateUserDto.fullName !== undefined || updateUserDto.phone !== undefined) {
        throw new BadRequestException('Campos fullName e phone só podem ser atualizados para roles CLIENT ou PROVIDER.');
      }

      // Atualize User base (do schema: campos em User)
      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`[UsersService] update: Usuário com ID "${id}" atualizado com sucesso.`);
      this.logger.log(`[TELEMETRY] user_profile_updated: { userId: ${id} }`);

      // SEMPRE retorne com includes (chama findOne para tipagem e dados completos)
      const fullUpdatedUser = await this.findOne(id);
      if (!fullUpdatedUser) {
        throw new NotFoundException(`Usuário atualizado não encontrado após update.`);
      }
      return fullUpdatedUser;
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
          email: `deleted-${user.id}-${Date.now()}@limpeja.com`, // Do schema: email unique
          deletionScheduledAt: new Date(), // Campo do schema
        },
      });

      this.logger.log(`[UsersService] remove: Usuário com ID "${id}" marcado para exclusão (soft delete).`);
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
    try {
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
      this.logger.log(`[UsersService] requestDataExport: Notificação adicionada à fila para userId: ${userId}.`);
      this.logger.log(`[TELEMETRY] data_export_requested: { userId: ${userId} }`);
    } catch (error) {
      this.logger.error(`[UsersService] requestDataExport: Erro: ${error.message}`);
      throw error;
    }
  }

  async requestAccountDeletion(userId: string): Promise<void> {
    this.logger.log(`[UsersService] requestAccountDeletion: Solicitação de exclusão de conta para userId: ${userId}.`);
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
        message: 'Sua conta foi marcada para exclusão. Ela será desativada e excluída permanentemente após um período de carência de 30 dias.',
        targetUrl: '/profile/data-privacy',
        title: 'Solicitação de Exclusão de Conta Recebida',
      };
      await this.notificationsService.createNotification(notificationDto);
      this.logger.log(`[UsersService] requestAccountDeletion: Notificação adicionada à fila para userId: ${userId}.`);
      this.logger.log(`[TELEMETRY] account_deletion_requested: { userId: ${userId} }`);
    } catch (error) {
      this.logger.error(`[UsersService] requestAccountDeletion: Erro: ${error.message}`);
      throw error;
    }
  }
}