// src/faqs/faqs.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FaqItemEntity } from './entities/faq-item.entity'; // Assumindo que você criará esta entidade

@ApiTags('faqs')
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo item de FAQ (apenas ADMIN)' })
  @ApiBody({ type: CreateFaqDto })
  @ApiResponse({ status: 201, description: 'FAQ criado com sucesso.', type: FaqItemEntity })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  async create(@Body() createFaqDto: CreateFaqDto): Promise<FaqItemEntity> {
    const faq = await this.faqsService.create(createFaqDto);
    return new FaqItemEntity(faq);
  }

  @Get()
  @ApiOperation({ summary: 'Obter todos os itens de FAQ' })
  @ApiResponse({ status: 200, description: 'Lista de FAQs.', type: [FaqItemEntity] })
  async findAll(): Promise<FaqItemEntity[]> {
    const faqs = await this.faqsService.findAll();
    return faqs.map((faq) => new FaqItemEntity(faq));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um item de FAQ por ID' })
  @ApiResponse({ status: 200, description: 'FAQ encontrado.', type: FaqItemEntity })
  @ApiResponse({ status: 404, description: 'FAQ não encontrado.' })
  async findOne(@Param('id') id: string): Promise<FaqItemEntity> {
    const faq = await this.faqsService.findOne(id);
    return new FaqItemEntity(faq);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um item de FAQ por ID (apenas ADMIN)' })
  @ApiBody({ type: UpdateFaqDto })
  @ApiResponse({ status: 200, description: 'FAQ atualizado com sucesso.', type: FaqItemEntity })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'FAQ não encontrado.' })
  async update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto): Promise<FaqItemEntity> {
    const faq = await this.faqsService.update(id, updateFaqDto);
    return new FaqItemEntity(faq);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir um item de FAQ por ID (apenas ADMIN)' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'FAQ excluído com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'FAQ não encontrado.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.faqsService.remove(id);
  }
}