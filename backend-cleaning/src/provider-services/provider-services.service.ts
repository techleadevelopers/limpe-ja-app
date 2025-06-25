import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { UpdateProviderServiceDto } from './dto/update-provider-service.dto';
import { ProviderService } from '@prisma/client';

@Injectable()
export class ProviderServicesService {
  constructor(private prisma: PrismaService) {}

  async create(providerId: string, createProviderServiceDto: CreateProviderServiceDto): Promise<ProviderService> {
    const { serviceId, price, durationMinutes, description } = createProviderServiceDto;

    // Verificar se o provedor existe
    const providerExists = await this.prisma.provider.findUnique({ where: { id: providerId } });
    if (!providerExists) {
      throw new NotFoundException(`Provedor com ID "${providerId}" não encontrado.`);
    }

    // Verificar se o tipo de serviço existe
    const serviceTypeExists = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!serviceTypeExists) {
      throw new NotFoundException(`Tipo de serviço com ID "${serviceId}" não encontrado.`);
    }

    // Verificar se o provedor já oferece este serviço
    const existingProviderService = await this.prisma.providerService.findUnique({
      where: {
        providerId_serviceId: {
          providerId,
          serviceId,
        },
      },
    });

    if (existingProviderService) {
      throw new ConflictException(`O provedor com ID "${providerId}" já oferece o tipo de serviço com ID "${serviceId}".`);
    }

    return this.prisma.providerService.create({
      data: {
        providerId,
        serviceId,
        price,
        durationMinutes,
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
      include: { service: true }, // Inclui os detalhes do tipo de serviço
    });
  }

  async findOne(id: string, providerId: string): Promise<ProviderService | null> {
    return this.prisma.providerService.findUnique({
      where: { id, providerId }, // Garante que o serviço pertence ao provedor
      include: { service: true },
    });
  }

  async update(id: string, providerId: string, updateProviderServiceDto: UpdateProviderServiceDto): Promise<ProviderService | null> {
    try {
      const existingService = await this.findOne(id, providerId);
      if (!existingService) {
        throw new NotFoundException(`Serviço oferecido com ID "${id}" não encontrado para o provedor "${providerId}".`);
      }

      return await this.prisma.providerService.update({
        where: { id },
        data: updateProviderServiceDto,
      });
    } catch (error) {
      if (error.code === 'P2025') {
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
      if (error.code === 'P2025') {
        throw new NotFoundException(`Serviço oferecido com ID "${id}" não encontrado.`);
      }
      throw error;
    }
  }
}