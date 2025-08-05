// src/services/services.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, Prisma } from '@prisma/client'; // <-- Importar 'Prisma' aqui também
import { CacheService } from '../cache/cache.service'; // Importar CacheService

@Injectable()
export class ServicesService {
  private readonly SERVICES_CACHE_KEY = 'all_services';

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService, // Injetar CacheService
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const newService = await this.prisma.service.create({
      data: {
        ...createServiceDto, // Copia todas as outras propriedades
        price: new Prisma.Decimal(createServiceDto.price), // <-- CORREÇÃO: Converter para Prisma.Decimal
      },
    });
    await this.cacheService.del(this.SERVICES_CACHE_KEY); // Invalida o cache após criação
    return newService;
  }

  async findAll(): Promise<Service[]> {
    let services = await this.cacheService.get<Service[]>(this.SERVICES_CACHE_KEY);
    if (services) {
      return services;
    }
    services = await this.prisma.service.findMany();
    await this.cacheService.set(this.SERVICES_CACHE_KEY, services);
    return services;
  }

  async findOne(id: string): Promise<Service | null> {
    const cacheKey = `${this.SERVICES_CACHE_KEY}:${id}`;
    let service = await this.cacheService.get<Service>(cacheKey);
    if (service) {
      return service;
    }
    service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (service) {
      await this.cacheService.set(cacheKey, service);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service | null> {
    try {
      // Para updates, precisamos verificar se 'price' existe e converter também
      const updateData: Prisma.ServiceUpdateInput = {
        ...updateServiceDto,
      };
      if (updateServiceDto.price !== undefined) {
        updateData.price = new Prisma.Decimal(updateServiceDto.price);
      }

      const updatedService = await this.prisma.service.update({
        where: { id },
        data: updateData, // <-- Usar updateData
      });
      await this.cacheService.del(this.SERVICES_CACHE_KEY); // Invalida o cache geral
      await this.cacheService.del(`${this.SERVICES_CACHE_KEY}:${id}`); // Invalida o cache específico
      return updatedService;
    } catch (error) {
      if (error.code === 'P2025') { // Prisma error code for record not found
        throw new NotFoundException(`Tipo de serviço com ID "${id}" não encontrado.`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.service.delete({
        where: { id },
      });
      await this.cacheService.del(this.SERVICES_CACHE_KEY); // Invalida o cache geral
      await this.cacheService.del(`${this.SERVICES_CACHE_KEY}:${id}`); // Invalida o cache específico
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Tipo de serviço com ID "${id}" não encontrado.`);
      }
      if (error.code === 'P2003') {
        throw new Error(`Não é possível deletar o tipo de serviço com ID "${id}" porque ele está associado a serviços oferecidos por provedores.`);
      }
      throw error;
    }
  }
}