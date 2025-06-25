// src/providers/providers.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { ProviderDetailsDto } from './dto/provider-details.dto'; // Importe o DTO
import { ProviderSearchDto } from './dto/provider-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

// Importe os tipos auxiliares do service
import { ProviderWithIncludes, ProviderWithCalculatedRating } from './providers.service';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // =================================================================================================
  // ROTAS PÚBLICAS (Sem autenticação) - ORDEM AJUSTADA: Rotas fixas antes de rotas com parâmetros
  // =================================================================================================

  @Get('recommended')
  @ApiOperation({ summary: 'Obter provedores recomendados' })
  @ApiResponse({ status: 200, description: 'Lista de provedores recomendados.', type: [ProviderDetailsDto] })
  async findRecommendedProviders(): Promise<ProviderDetailsDto[]> {
    const providers = await this.providersService.findTopRatedOrExperiencedProviders();
    // O construtor de ProviderDetailsDto precisa ser capaz de aceitar ProviderWithCalculatedRating
    return providers.map(provider => new ProviderDetailsDto(provider));
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Obter provedores por perto' })
  @ApiResponse({ status: 200, description: 'Lista de provedores próximos (ou ativos).', type: [ProviderDetailsDto] })
  async findNearbyProviders(): Promise<ProviderDetailsDto[]> {
    const providers = await this.providersService.findAllProviders({ limit: 10 });
    // O construtor de ProviderDetailsDto precisa ser capaz de aceitar ProviderWithCalculatedRating
    return providers.map(provider => new ProviderDetailsDto(provider));
  }

  @Get() // Rota de busca geral (sem ID, pode ter query params)
  @ApiOperation({ summary: 'Buscar provedores com filtros (geral)' })
  @ApiResponse({ status: 200, description: 'Lista de provedores com filtros aplicados.', type: [ProviderDetailsDto] })
  async search(@Query() searchDto: ProviderSearchDto): Promise<ProviderDetailsDto[]> {
    const providers = await this.providersService.search(searchDto);
    // O construtor de ProviderDetailsDto precisa ser capaz de aceitar ProviderWithCalculatedRating
    return providers.map(provider => new ProviderDetailsDto(provider));
  }

  // =================================================================================================
  // ROTAS AUTENTICADAS (Para o provedor logado)
  // =================================================================================================

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter o perfil do provedor logado' })
  @ApiResponse({ status: 200, description: 'Perfil do provedor.', type: ProviderDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async getMyProfile(@Req() req: Request): Promise<ProviderDetailsDto> {
    const userId = req.user['userId'];
    const provider = await this.providersService.findByUserId(userId);
    if (!provider) {
      throw new NotFoundException(`Provedor com User ID "${userId}" não encontrado.`);
    }
    // O construtor de ProviderDetailsDto espera ProviderWithIncludes
    return new ProviderDetailsDto(provider);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar o perfil do provedor logado' })
  @ApiResponse({ status: 200, description: 'Perfil do provedor atualizado com sucesso.', type: ProviderDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async updateMyProfile(@Req() req: Request, @Body() updateProviderProfileDto: UpdateProviderProfileDto): Promise<ProviderDetailsDto> {
    const userId = req.user['userId'];
    const updatedProvider = await this.providersService.updateByUserId(userId, updateProviderProfileDto);
    if (!updatedProvider) {
      throw new NotFoundException(`Provedor com User ID "${userId}" não encontrado.`);
    }
    return new ProviderDetailsDto(updatedProvider);
  }

  // =================================================================================================
  // ROTAS COM PARÂMETROS DINÂMICOS (Devem vir por último)
  // =================================================================================================

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um provedor por ID' })
  @ApiResponse({ status: 200, description: 'Detalhes do provedor.', type: ProviderDetailsDto })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async findOne(@Param('id') id: string): Promise<ProviderDetailsDto> {
    const provider = await this.providersService.findOne(id);
    if (!provider) {
      throw new NotFoundException(`Provedor com ID "${id}" não encontrado.`);
    }
    // O construtor de ProviderDetailsDto espera ProviderWithIncludes
    return new ProviderDetailsDto(provider);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar um provedor (apenas para administradores)' })
  @ApiResponse({ status: 204, description: 'Provedor deletado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido (requer função de ADMIN).' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async remove(@Param('id') id: string) {
    await this.providersService.remove(id);
  }
}