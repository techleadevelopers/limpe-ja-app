// src/providers/providers.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  NotFoundException,
  BadRequestException, // Importado para a nova rota
  Logger,
  UseInterceptors, // Importado para o FileInterceptor
  UploadedFile, // Importado para o FileInterceptor
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // Importado para a nova rota
import { ProvidersService } from './providers.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { ProviderDetailsDto } from './dto/provider-details.dto';
import { ProviderSearchDto } from './dto/provider-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiConsumes, // Importado para a nova rota
  ApiBody, // Importado para a nova rota
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { Multer } from 'multer'; // Tipo de arquivo Multer

import { SortByOption } from '../search/dto/search-query.dto';

// Importe os tipos auxiliares do service
import { ProviderWithCalculatedRating } from './providers.service';

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  private readonly logger = new Logger(ProvidersController.name);

  constructor(private readonly providersService: ProvidersService) {}

  // =================================================================================================
  // ROTAS PÚBLICAS (Sem autenticação) - ORDEM AJUSTADA: Rotas fixas antes de rotas com parâmetros
  // =================================================================================================

  @Get('recommended')
  @ApiOperation({ summary: 'Obter provedores recomendados' })
  @ApiResponse({ status: 200, description: 'Lista de provedores recomendados.', type: [ProviderDetailsDto] })
  async findRecommendedProviders(): Promise<ProviderDetailsDto[]> {
    this.logger.log('[ProvidersController] findRecommendedProviders: Chamando serviço.');
    const providers = await this.providersService.findTopRatedOrExperiencedProviders();
    this.logger.log(`[ProvidersController] findRecommendedProviders: Retornando ${providers.length} provedores.`);
    return providers.map(provider => new ProviderDetailsDto(provider));
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Obter provedores por perto' })
  @ApiQuery({ name: 'latitude', required: false, type: Number, description: 'Latitude para busca geoespacial' })
  @ApiQuery({ name: 'longitude', required: false, type: Number, description: 'Longitude para busca geoespacial' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Raio de busca em km' })
  @ApiQuery({ name: 'sortBy', required: false, enum: SortByOption, description: 'Critério de ordenação' })
  @ApiResponse({ status: 200, description: 'Lista de provedores próximos (ou ativos).', type: [ProviderDetailsDto] })
  async findNearbyProviders(
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number,
    @Query('radius') radius?: number,
    @Query('sortBy') sortBy?: SortByOption,
  ): Promise<ProviderDetailsDto[]> {
    this.logger.log('[ProvidersController] findNearbyProviders: Chamando serviço.');

    const findAllParams: { limit?: number; latitude?: number; longitude?: number; radius?: number; sortBy?: SortByOption } = {
      limit: 10,
      latitude: latitude,
      longitude: longitude,
      radius: radius,
      sortBy: sortBy
    };

    const providers = await this.providersService.findAllProviders(findAllParams);
    this.logger.log(`[ProvidersController] findNearbyProviders: Retornando ${providers.length} provedores.`);
    return providers.map(provider => new ProviderDetailsDto(provider));
  }

  @Get()
  @ApiOperation({ summary: 'Buscar provedores com filtros (geral, incluindo geoespacial)' })
  @ApiQuery({ name: 'searchTerm', required: false, type: String, description: 'Termo de busca (nome, bio, serviço)' })
  @ApiQuery({ name: 'serviceId', required: false, type: String, description: 'ID do tipo de serviço' })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Localização textual (cidade, rua)' })
  @ApiQuery({ name: 'minRating', required: false, type: Number, description: 'Avaliação mínima' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset para paginação' })
  @ApiQuery({ name: 'sortBy', required: false, enum: SortByOption, description: 'Critério de ordenação' })
  @ApiQuery({ name: 'latitude', required: false, type: Number, description: 'Latitude para busca geoespacial' })
  @ApiQuery({ name: 'longitude', required: false, type: Number, description: 'Longitude para busca geoespacial' })
  @ApiQuery({ name: 'radius', required: false, type: Number, description: 'Raio de busca em km' })
  @ApiResponse({ status: 200, description: 'Lista de provedores com filtros aplicados.', type: [ProviderDetailsDto] })
  async search(@Query() searchDto: ProviderSearchDto): Promise<ProviderDetailsDto[]> {
    this.logger.log(`[ProvidersController] search: Chamando serviço com DTO de busca: ${JSON.stringify(searchDto)}`);
    const providers = await this.providersService.search(searchDto);
    this.logger.log(`[ProvidersController] search: Retornando ${providers.length} provedores.`);
    return providers.map(provider => new ProviderDetailsDto(provider));
  }

  // =================================================================================================
  // ROTAS AUTENTICADAS (Para o provedor logado)
  // =================================================================================================

  @Get('me')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter o perfil do provedor logado' })
  @ApiResponse({ status: 200, description: 'Perfil do provedor.', type: ProviderDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async getMyProfile(@Req() req: ExpressRequest): Promise<ProviderDetailsDto> {
    const userId = req.user['userId'];
    this.logger.log(`[ProvidersController] getMyProfile: Buscando perfil para userId: ${userId}`);
    const provider = await this.providersService.findByUserId(userId);
    if (!provider) {
      this.logger.warn(`[ProvidersController] getMyProfile: Provedor não encontrado para userId: ${userId}`);
      throw new NotFoundException(`Provedor com User ID "${userId}" não encontrado.`);
    }
    this.logger.log(`[ProvidersController] getMyProfile: Perfil encontrado para userId ${userId}.`);
    return new ProviderDetailsDto(provider);
  }

  @Patch('me')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar o perfil do provedor logado' })
  @ApiResponse({ status: 200, description: 'Perfil do provedor atualizado com sucesso.', type: ProviderDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async updateMyProfile(@Req() req: ExpressRequest, @Body() updateProviderProfileDto: UpdateProviderProfileDto): Promise<ProviderDetailsDto> {
    const userId = req.user['userId'];
    this.logger.log(`[ProvidersController] updateMyProfile: Atualizando perfil para userId: ${userId}`);
    const updatedProvider = await this.providersService.updateByUserId(userId, updateProviderProfileDto);
    if (!updatedProvider) {
      this.logger.warn(`[ProvidersController] updateMyProfile: Provedor não encontrado para userId: ${userId}`);
      throw new NotFoundException(`Provedor com User ID "${userId}" não encontrado.`);
    }
    this.logger.log(`[ProvidersController] updateMyProfile: Perfil atualizado com sucesso para userId ${userId}.`);
    return new ProviderDetailsDto(updatedProvider);
  }

  // --- NOVA ROTA: UPLOAD DE AVATAR ---
  @Post('me/avatar')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload da foto de perfil (avatar)',
    type: 'object',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Fazer upload da foto de perfil do provedor logado' })
  @ApiResponse({ status: 201, description: 'Avatar atualizado com sucesso.', schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Avatar atualizado com sucesso.' },
        url: { type: 'string', example: 'http://gcs.com/provider-avatars/123/avatar.jpg' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Nenhum arquivo enviado ou arquivo inválido.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Req() req: ExpressRequest,
    @UploadedFile() file: Multer.File,
  ) {
    const userId = req.user['userId'];
    if (!file) {
      throw new BadRequestException('Nenhum arquivo de imagem enviado.');
    }
    this.logger.log(`[ProvidersController] uploadAvatar: Recebido arquivo de avatar para userId: ${userId}`);
    const avatarUrl = await this.providersService.updateAvatar(userId, file);
    return { message: 'Avatar atualizado com sucesso.', url: avatarUrl };
  }
  // --- FIM DA NOVA ROTA ---

  // =================================================================================================
  // ROTAS COM PARÂMETROS DINÂMICOS (Devem vir por último)
  // =================================================================================================

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um provedor por ID' })
  @ApiQuery({ name: 'includeReviews', required: false, type: Boolean, description: 'Incluir avaliações do provedor' })
  @ApiResponse({ status: 200, description: 'Detalhes do provedor.', type: ProviderDetailsDto })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async findOne(@Param('id') id: string, @Query('includeReviews') includeReviews?: boolean): Promise<ProviderDetailsDto> {
    this.logger.log(`[ProvidersController] findOne: Buscando provedor por ID: ${id}`);
    const provider = await this.providersService.findOne(id);
    if (!provider) {
      this.logger.warn(`[ProvidersController] findOne: Provedor com ID "${id}" não encontrado.`);
      throw new NotFoundException(`Provedor com ID "${id}" não encontrado.`);
    }
    this.logger.log(`[ProvidersController] findOne: Provedor ${id} encontrado.`);
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
  async remove(@Param('id') id: string): Promise<void> {
    this.logger.log(`[ProvidersController] remove: Tentando deletar provedor com ID: ${id}`);
    await this.providersService.remove(id);
    this.logger.log(`[ProvidersController] remove: Provedor ${id} deletado com sucesso.`);
  }
}