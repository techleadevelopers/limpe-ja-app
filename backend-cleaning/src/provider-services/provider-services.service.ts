import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { UpdateProviderServiceDto } from './dto/update-provider-service.dto';
import { ProviderService, Prisma } from '@prisma/client';
import { ProvidersService } from '../providers/providers.service';
import { ServicesService } from '../services/services.service';
import { MIN_HOURLY_MINUTES } from '../common/constants/pricing';

@Injectable()
export class ProviderServicesService {
  constructor(
    private prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(
    providerId: string,
    createProviderServiceDto: CreateProviderServiceDto,
  ): Promise<ProviderService> {
    const {
      serviceId,
      pricePerHour,
      durationMinutes,
      description,
      pricingType,
    } = createProviderServiceDto;

    if (pricingType && pricingType !== 'HOURLY') {
      throw new BadRequestException('Somente HOURLY e permitido.');
    }

    const providerExists = await this.providersService.findOne(providerId);
    if (!providerExists) {
      throw new NotFoundException(
        `Provedor com ID "${providerId}" nao encontrado.`,
      );
    }

    const serviceTypeExists = await this.servicesService.findOne(serviceId);
    if (!serviceTypeExists) {
      throw new NotFoundException(
        `Tipo de servico com ID "${serviceId}" nao encontrado.`,
      );
    }

    const existingProviderService =
      await this.prisma.providerService.findUnique({
        where: {
          providerId_serviceId: {
            providerId,
            serviceId,
          },
        },
      });

    if (existingProviderService) {
      throw new ConflictException(
        `O provedor com ID "${providerId}" ja oferece o tipo de servico com ID "${serviceId}".`,
      );
    }

    const normalizedDuration = Math.max(
      durationMinutes ?? MIN_HOURLY_MINUTES,
      MIN_HOURLY_MINUTES,
    );

    return this.prisma.providerService.create({
      data: {
        providerId,
        serviceId,
        pricePerHour: new Prisma.Decimal(pricePerHour),
        durationMinutes: normalizedDuration,
        description,
        needsReview: false,
      },
    });
  }

  async findAllByProviderId(providerId: string): Promise<ProviderService[]> {
    const providerExists = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!providerExists) {
      throw new NotFoundException(
        `Provedor com ID "${providerId}" nao encontrado.`,
      );
    }
    return this.prisma.providerService.findMany({
      where: { providerId },
      include: { service: true },
    });
  }

  async findOne(
    id: string,
    providerId: string,
  ): Promise<ProviderService | null> {
    return this.prisma.providerService.findFirst({
      where: { id, providerId },
      include: { service: true },
    });
  }

  async update(
    id: string,
    providerId: string,
    updateProviderServiceDto: UpdateProviderServiceDto,
  ): Promise<ProviderService | null> {
    try {
      const existingService = await this.findOne(id, providerId);
      if (!existingService) {
        throw new NotFoundException(
          `Servico oferecido com ID "${id}" nao encontrado para o provedor "${providerId}".`,
        );
      }

      const updateData: Prisma.ProviderServiceUpdateInput = {};
      const { pricePerHour, durationMinutes, description } =
        updateProviderServiceDto;

      if (
        pricePerHour === undefined &&
        durationMinutes === undefined &&
        description === undefined
      ) {
        throw new BadRequestException('Nenhum campo valido fornecido.');
      }

      if (pricePerHour !== undefined) {
        if (pricePerHour <= 0) {
          throw new BadRequestException(
            'pricePerHour deve ser maior que zero.',
          );
        }
        updateData.pricePerHour = new Prisma.Decimal(pricePerHour);
        updateData.needsReview = false;
      }

      if (durationMinutes !== undefined) {
        updateData.durationMinutes = Math.max(
          durationMinutes ?? MIN_HOURLY_MINUTES,
          MIN_HOURLY_MINUTES,
        );
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      return await this.prisma.providerService.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Servico oferecido com ID "${id}" nao encontrado.`,
        );
      }
      throw error;
    }
  }

  async remove(id: string, providerId: string): Promise<void> {
    try {
      const existingService = await this.findOne(id, providerId);
      if (!existingService) {
        throw new NotFoundException(
          `Servico oferecido com ID "${id}" nao encontrado para o provedor "${providerId}".`,
        );
      }
      await this.prisma.providerService.deleteMany({
        where: { id, providerId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Servico oferecido com ID "${id}" nao encontrado.`,
        );
      }
      throw error;
    }
  }
}
