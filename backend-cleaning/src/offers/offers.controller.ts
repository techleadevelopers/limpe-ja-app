// src/offers/offers.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException, // CORREÇÃO: Adicione NotFoundException aqui
} from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { Offer } from './entities/offer.entity';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @Roles(UserRole.ADMIN) // Apenas administradores podem criar ofertas
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar uma nova oferta' })
  @ApiResponse({
    status: 201,
    description: 'Oferta criada com sucesso.',
    type: Offer,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  async create(@Body() createOfferDto: CreateOfferDto): Promise<Offer> {
    return this.offersService.create(createOfferDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as ofertas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ofertas.',
    type: [Offer],
  })
  async findAll(): Promise<Offer[]> {
    return this.offersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma oferta específica' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da oferta.',
    type: Offer,
  })
  @ApiResponse({ status: 404, description: 'Oferta não encontrada.' })
  async findOne(@Param('id') id: string): Promise<Offer> {
    const offer = await this.offersService.findOne(id);
    if (!offer) {
      throw new NotFoundException(`Oferta com ID "${id}" não encontrada.`); // Linha 70
    }
    return offer;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN) // Apenas administradores podem atualizar ofertas
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar uma oferta existente' })
  @ApiResponse({
    status: 200,
    description: 'Oferta atualizada com sucesso.',
    type: Offer,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Oferta não encontrada.' })
  async update(
    @Param('id') id: string,
    @Body() updateOfferDto: UpdateOfferDto,
  ): Promise<Offer> {
    return this.offersService.update(id, updateOfferDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN) // Apenas administradores podem excluir ofertas
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir uma oferta' })
  @ApiResponse({
    status: 200,
    description: 'Oferta excluída com sucesso.',
    type: Offer,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Oferta não encontrada.' })
  async remove(@Param('id') id: string): Promise<Offer> {
    return this.offersService.remove(id);
  }
}