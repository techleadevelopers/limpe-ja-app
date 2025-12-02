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
import { OfferDetailsDto } from './dto/offer-details.dto'; // Importado o DTO de detalhes
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
    type: OfferDetailsDto, // Alterado para OfferDetailsDto
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  async create(
    @Body() createOfferDto: CreateOfferDto,
  ): Promise<OfferDetailsDto> {
    const offer = await this.offersService.create(createOfferDto);
    return new OfferDetailsDto(offer); // Retorna o DTO
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as ofertas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ofertas.',
    type: [OfferDetailsDto], // Alterado para OfferDetailsDto
  })
  async findAll(): Promise<OfferDetailsDto[]> {
    const offers = await this.offersService.findAll();
    return offers.map((offer) => new OfferDetailsDto(offer)); // Mapeia para DTO
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma oferta específica' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da oferta.',
    type: OfferDetailsDto, // Alterado para OfferDetailsDto
  })
  @ApiResponse({ status: 404, description: 'Oferta não encontrada.' })
  async findOne(@Param('id') id: string): Promise<OfferDetailsDto> {
    const offer = await this.offersService.findOne(id);
    if (!offer) {
      throw new NotFoundException(`Oferta com ID "${id}" não encontrada.`); // Linha 70
    }
    return new OfferDetailsDto(offer); // Retorna o DTO
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN) // Apenas administradores podem atualizar ofertas
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar uma oferta existente' })
  @ApiResponse({
    status: 200,
    description: 'Oferta atualizada com sucesso.',
    type: OfferDetailsDto, // Alterado para OfferDetailsDto
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Oferta não encontrada.' })
  async update(
    @Param('id') id: string,
    @Body() updateOfferDto: UpdateOfferDto,
  ): Promise<OfferDetailsDto> {
    const updatedOffer = await this.offersService.update(id, updateOfferDto);
    return new OfferDetailsDto(updatedOffer); // Retorna o DTO
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN) // Apenas administradores podem excluir ofertas
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir uma oferta' })
  @ApiResponse({
    status: 200,
    description: 'Oferta excluída com sucesso.',
    type: OfferDetailsDto, // Alterado para OfferDetailsDto
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Oferta não encontrada.' })
  async remove(@Param('id') id: string): Promise<OfferDetailsDto> {
    const removedOffer = await this.offersService.remove(id);
    return new OfferDetailsDto(removedOffer); // Retorna o DTO
  }
}
