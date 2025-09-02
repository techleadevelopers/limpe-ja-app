import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  async create(providerId: string, createProviderServiceDto: CreateProviderServiceDto): Promise<ProviderService> {
    const { serviceId, price, durationMinutes, description, pricingType, pricePerSquareMeter, pricePerRoom, pricePerHour } = createProviderServiceDto; // ADICIONADO pricePerHour aqui

    // Verificar se o provedor existe
    const providerExists = await this.providersService.findOne(providerId);
    if (!providerExists) {
      throw new NotFoundException(`Provedor com ID "${providerId}" não encontrado.`);
    }

    // Verificar se o tipo de serviço existe
    const serviceTypeExists = await this.servicesService.findOne(serviceId);
    if (!serviceTypeExists) {
      throw new NotFoundException(`Tipo de serviço com ID "${serviceId}" não encontrado.`);
    }

    // Verificar se o provedor já oferece este serviço com este tipo de precificação
    const existingProviderService = await this.prisma.providerService.findUnique({
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
      throw new ConflictException(`O provedor com ID "${providerId}" já oferece o tipo de serviço com ID "${serviceId}" e tipo de precificação "${pricingType}".`);
    }

    return this.prisma.providerService.create({
      data: {
        providerId,
        serviceId,
        // CORREÇÃO: Converter price para Prisma.Decimal e permitir null
        price: price !== undefined && price !== null ? new Prisma.Decimal(price) : null,
        durationMinutes: durationMinutes !== undefined && durationMinutes !== null ? durationMinutes : null, // Permitir null
        pricingType,
        // CORREÇÃO: Converter pricePerHour para Prisma.Decimal e permitir null
        pricePerHour: pricePerHour !== undefined && pricePerHour !== null ? new Prisma.Decimal(pricePerHour) : null,
        pricePerSquareMeter: pricePerSquareMeter !== undefined && pricePerSquareMeter !== null ? new Prisma.Decimal(pricePerSquareMeter) : null,
        pricePerRoom: pricePerRoom !== undefined && pricePerRoom !== null ? new Prisma.Decimal(pricePerRoom) : null,
        description,
      },
    });
  }

  async findAllByProviderId(providerId: string): Promise<ProviderService[]> {
    const providerExists = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!providerExists) {
      throw new NotFoundException(`Provedor com ID "${providerId}" não encontrado.`);
    }
    return this.prisma.providerService.findMany({
      where: { providerId },
      include: { service: true },
    });
  }

  async findOne(id: string, providerId: string): Promise<ProviderService | null> {
    return this.prisma.providerService.findUnique({
      where: { id, providerId },
      include: { service: true },
    });
  }

  async update(id: string, providerId: string, updateProviderServiceDto: UpdateProviderServiceDto): Promise<ProviderService | null> {
    try {
      const existingService = await this.findOne(id, providerId);
      if (!existingService) {
        throw new NotFoundException(`Serviço oferecido com ID "${id}" não encontrado para o provedor "${providerId}".`);
      }

      const updateData: Prisma.ProviderServiceUpdateInput = {
        ...updateProviderServiceDto,
      };
      if (updateProviderServiceDto.price !== undefined) {
        updateData.price = updateProviderServiceDto.price !== null ? new Prisma.Decimal(updateProviderServiceDto.price) : null;
      }
      if (updateProviderServiceDto.pricePerHour !== undefined) { // ADICIONADO: Tratamento para pricePerHour
        updateData.pricePerHour = updateProviderServiceDto.pricePerHour !== null ? new Prisma.Decimal(updateProviderServiceDto.pricePerHour) : null;
      }
      if (updateProviderServiceDto.pricePerSquareMeter !== undefined) {
        updateData.pricePerSquareMeter = updateProviderServiceDto.pricePerSquareMeter !== null ? new Prisma.Decimal(updateProviderServiceDto.pricePerSquareMeter) : null;
      }
      if (updateProviderServiceDto.pricePerRoom !== undefined) {
        updateData.pricePerRoom = updateProviderServiceDto.pricePerRoom !== null ? new Prisma.Decimal(updateProviderServiceDto.pricePerRoom) : null;
      }
      // durationMinutes é um number, não precisa de new Prisma.Decimal, mas pode ser null
      if (updateProviderServiceDto.durationMinutes !== undefined) {
        updateData.durationMinutes = updateProviderServiceDto.durationMinutes !== null ? updateProviderServiceDto.durationMinutes : null;
      }

      return await this.prisma.providerService.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Serviço oferecido com ID "${id}" não encontrado.`);
      }
      throw error;
    }
  }

  async remove(id: string, providerId: string): Promise<void> {
    try {
      const existingService = await this.findOne(id, providerId);
      if (!existingService) {
        throw new NotFoundException(`Serviço oferecido com ID "${id}" não encontrado para o provedor "${providerId}".`);
      }
      await this.prisma.providerService.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Serviço oferecido com ID "${id}" não encontrado.`);
      }
      throw error;
    }
  }
}