// src/services/services.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service, Prisma } from '@prisma/client';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class ServicesService {
  private readonly SERVICES_CACHE_KEY = 'all_services';

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const { name, description, icon, defaultPricingType } = createServiceDto;
    const newService = await this.prisma.service.create({
      data: {
        name,
        description: description ?? null,
        icon: icon ?? null,
        defaultPricingType: defaultPricingType ?? null,
        // price removido: agora opcional/deprecated
      },
    });
    await this.cacheService.del(this.SERVICES_CACHE_KEY);
    return newService;
  }

  async findAll(): Promise<Service[]> {
    let services = await this.cacheService.get<Service[]>(
      this.SERVICES_CACHE_KEY,
    );
    if (services) return services;
    services = await this.prisma.service.findMany();
    await this.cacheService.set(this.SERVICES_CACHE_KEY, services);
    return services;
  }

  async findOne(id: string): Promise<Service | null> {
    const cacheKey = `${this.SERVICES_CACHE_KEY}:${id}`;
    let service = await this.cacheService.get<Service>(cacheKey);
    if (service) return service;
    service = await this.prisma.service.findUnique({ where: { id } });
    if (service) await this.cacheService.set(cacheKey, service);
    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service | null> {
    try {
      const { name, description, icon, defaultPricingType } = updateServiceDto;
      const data: Prisma.ServiceUpdateInput = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;
      if (icon !== undefined) data.icon = icon;
      if (defaultPricingType !== undefined)
        data.defaultPricingType = defaultPricingType;

      const updated = await this.prisma.service.update({ where: { id }, data });
      await this.cacheService.del(this.SERVICES_CACHE_KEY);
      await this.cacheService.del(`${this.SERVICES_CACHE_KEY}:${id}`);
      return updated;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Tipo de serviço com ID "${id}" não encontrado.`,
        );
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.service.delete({ where: { id } });
      await this.cacheService.del(this.SERVICES_CACHE_KEY);
      await this.cacheService.del(`${this.SERVICES_CACHE_KEY}:${id}`);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Tipo de serviço com ID "${id}" não encontrado.`,
        );
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new Error(
          `Não é possível deletar o tipo de serviço com ID "${id}" porque ele está associado a serviços de provedores.`,
        );
      }
      throw error;
    }
  }
}
