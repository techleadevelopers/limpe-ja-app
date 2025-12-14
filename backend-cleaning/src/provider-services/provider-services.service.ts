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
      price,
      durationMinutes,
      description,
      pricingType,
      pricePerSquareMeter,
      pricePerRoom,
      pricePerHour,
    } = createProviderServiceDto; // ADICIONADO pricePerHour aqui

    // Verificar se o provedor existe
    const providerExists = await this.providersService.findOne(providerId);
    if (!providerExists) {
      throw new NotFoundException(
        `Provedor com ID "${providerId}" não encontrado.`,
      );
    }

    // Verificar se o tipo de serviço existe
    const serviceTypeExists = await this.servicesService.findOne(serviceId);
    if (!serviceTypeExists) {
      throw new NotFoundException(
        `Tipo de serviço com ID "${serviceId}" não encontrado.`,
      );
    }

    // Verificar se o provedor já oferece este serviço com este tipo de precificação
    const existingProviderService =
      await this.prisma.providerService.findUnique({
        where: {
          // CORRIGIDO: Usar o campo de unicidade composto
          providerId_serviceId_pricingType: {
            providerId,
            serviceId,
            pricingType, // ADICIONADO: Incluir pricingType na verificação de unicidade
          },
        },
      });

    if (existingProviderService) {
      throw new ConflictException(
        `O provedor com ID "${providerId}" já oferece o tipo de serviço com ID "${serviceId}" e tipo de precificação "${pricingType}".`,
      );
    }

    return this.prisma.providerService.create({
      data: {
        providerId,
        serviceId,
        // CORREÇÃO: Converter price para Prisma.Decimal e permitir null
        price:
          price !== undefined && price !== null
            ? new Prisma.Decimal(price)
            : null,
        durationMinutes:
          durationMinutes !== undefined && durationMinutes !== null
            ? durationMinutes
            : null, // Permitir null
        pricingType,
        // CORREÇÃO: Converter pricePerHour para Prisma.Decimal e permitir null
        pricePerHour:
          pricePerHour !== undefined && pricePerHour !== null
            ? new Prisma.Decimal(pricePerHour)
            : null,
        pricePerSquareMeter:
          pricePerSquareMeter !== undefined && pricePerSquareMeter !== null
            ? new Prisma.Decimal(pricePerSquareMeter)
            : null,
        pricePerRoom:
          pricePerRoom !== undefined && pricePerRoom !== null
            ? new Prisma.Decimal(pricePerRoom)
            : null,
        description,
      },
    });
  }

  async findAllByProviderId(providerId: string): Promise<ProviderService[]> {
    const providerExists = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    if (!providerExists) {
      throw new NotFoundException(
        `Provedor com ID "${providerId}" não encontrado.`,
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
          `Serviço oferecido com ID "${id}" não encontrado para o provedor "${providerId}".`,
        );
      }

      const updateData: Prisma.ProviderServiceUpdateInput = {};
      const { pricingType } = updateProviderServiceDto;

      const price = updateProviderServiceDto.price;
      const pricePerHour = updateProviderServiceDto.pricePerHour;
      const pricePerSquareMeter = updateProviderServiceDto.pricePerSquareMeter;
      const pricePerRoom = updateProviderServiceDto.pricePerRoom;
      const durationMinutes = updateProviderServiceDto.durationMinutes;

      if (price !== undefined) {
        updateData.price = price !== null ? new Prisma.Decimal(price) : null;
      }
      if (pricePerHour !== undefined) {
        updateData.pricePerHour =
          pricePerHour !== null ? new Prisma.Decimal(pricePerHour) : null;
      }
      if (pricePerSquareMeter !== undefined) {
        updateData.pricePerSquareMeter =
          pricePerSquareMeter !== null
            ? new Prisma.Decimal(pricePerSquareMeter)
            : null;
      }
      if (pricePerRoom !== undefined) {
        updateData.pricePerRoom =
          pricePerRoom !== null ? new Prisma.Decimal(pricePerRoom) : null;
      }
      if (durationMinutes !== undefined) {
        updateData.durationMinutes =
          durationMinutes !== null ? durationMinutes : null;
      }

      const effectivePricing = pricingType ?? existingService.pricingType;
      const ensurePositive = (value?: number | null) =>
        value === null || value === undefined ? null : value > 0 ? value : NaN;

      switch (effectivePricing) {
        case 'HOURLY': {
          const dur = ensurePositive(
            durationMinutes ?? existingService.durationMinutes,
          );
          const pph = ensurePositive(
            pricePerHour ?? (existingService.pricePerHour as any),
          );
          if (!dur || !pph) {
            throw new BadRequestException(
              'Para HOURLY, defina pricePerHour>0 e durationMinutes>0.',
            );
          }
          updateData.durationMinutes = dur;
          updateData.pricePerHour = new Prisma.Decimal(pph);
          updateData.price = null;
          updateData.pricePerSquareMeter = null;
          updateData.pricePerRoom = null;
          break;
        }
        case 'BY_SIZE': {
          const psm = ensurePositive(
            pricePerSquareMeter ??
              (existingService.pricePerSquareMeter as any),
          );
          const pr = ensurePositive(
            pricePerRoom ?? (existingService.pricePerRoom as any),
          );
          if (!psm && !pr) {
            throw new BadRequestException(
              'Para BY_SIZE, defina pricePerSquareMeter>0 ou pricePerRoom>0.',
            );
          }
          updateData.price = null;
          updateData.pricePerHour = null;
          break;
        }
        case 'FIXED_PRICE':
        default: {
          const p = ensurePositive(price ?? (existingService.price as any));
          if (!p) {
            throw new BadRequestException('Para FIXED_PRICE, defina price>0.');
          }
          updateData.price = new Prisma.Decimal(p);
          updateData.pricePerHour = null;
          updateData.pricePerSquareMeter = null;
          updateData.pricePerRoom = null;
          break;
        }
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
          `Serviço oferecido com ID "${id}" não encontrado.`,
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
          `Serviço oferecido com ID "${id}" não encontrado para o provedor "${providerId}".`,
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
          `Serviço oferecido com ID "${id}" não encontrado.`,
        );
      }
      throw error;
    }
  }
}
