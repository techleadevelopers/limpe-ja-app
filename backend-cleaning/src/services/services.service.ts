import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    return this.prisma.service.create({
      data: createServiceDto,
    });
  }

  async findAll(): Promise<Service[]> {
    return this.prisma.service.findMany();
  }

  async findOne(id: string): Promise<Service | null> {
    return this.prisma.service.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service | null> {
    try {
      return await this.prisma.service.update({
        where: { id },
        data: updateServiceDto,
      });
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
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Tipo de serviço com ID "${id}" não encontrado.`);
      }
      // Considerar erro de integridade referencial se o serviço estiver em uso (P2003)
      if (error.code === 'P2003') {
        throw new Error(`Não é possível deletar o tipo de serviço com ID "${id}" porque ele está associado a serviços oferecidos por provedores.`);
      }
      throw error;
    }
  }
}