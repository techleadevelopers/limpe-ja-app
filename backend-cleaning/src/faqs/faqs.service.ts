// src/faqs/faqs.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { FAQItem } from '@prisma/client'; // Importa o tipo gerado pelo Prisma

@Injectable()
export class FaqsService {
  // <--- CORREÇÃO: Adicionado 'export' aqui
  constructor(private prisma: PrismaService) {}

  async create(createFaqDto: CreateFaqDto): Promise<FAQItem> {
    return this.prisma.fAQItem.create({ data: createFaqDto });
  }

  async findAll(): Promise<FAQItem[]> {
    return this.prisma.fAQItem.findMany();
  }

  async findOne(id: string): Promise<FAQItem> {
    const faq = await this.prisma.fAQItem.findUnique({ where: { id } });
    if (!faq) {
      throw new NotFoundException(`FAQ com ID "${id}" não encontrado.`);
    }
    return faq;
  }

  async update(id: string, updateFaqDto: UpdateFaqDto): Promise<FAQItem> {
    const faq = await this.prisma.fAQItem.findUnique({ where: { id } });
    if (!faq) {
      throw new NotFoundException(`FAQ com ID "${id}" não encontrado.`);
    }
    return this.prisma.fAQItem.update({
      where: { id },
      data: updateFaqDto,
    });
  }

  async remove(id: string): Promise<void> {
    const faq = await this.prisma.fAQItem.findUnique({ where: { id } });
    if (!faq) {
      throw new NotFoundException(`FAQ com ID "${id}" não encontrado.`);
    }
    await this.prisma.fAQItem.delete({ where: { id } });
  }
}
