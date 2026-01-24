import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProvidersService } from '../providers/providers.service';
import { UserRole, VerificationStatus } from '@prisma/client';
import { UpdateProviderVisibilityDto } from './dto/update-provider-visibility.dto';
import { ProviderDetailsDto } from '../providers/dto/provider-details.dto';
import { ProviderViewDto } from '../providers/dto/provider-view.dto';
import { Request as ExpressRequest } from 'express';
import { AdminProviderListDto } from './dto/admin-provider-list.dto';
import { AdminProviderQueryDto } from './dto/admin-provider-query.dto';

type RequestWithUser = ExpressRequest & {
  user?: {
    userId?: string;
    role?: UserRole;
  };
};

@ApiTags('admin/providers')
@Controller('admin/providers')
export class AdminProvidersController {
  private readonly logger = new Logger(AdminProvidersController.name);

  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar provedores paginados para o painel administrativo.',
  })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    description: 'Termo livre para buscar por nome, email ou serviA§o.',
  })
  @ApiQuery({
    name: 'serviceId',
    required: false,
    type: String,
    description: 'ID do serviA§o/categoria.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Nome da categoria ou serviA§o (texto).',
  })
  @ApiQuery({
    name: 'verificationStatus',
    required: false,
    enum: VerificationStatus,
    description: 'Status de verificaA§ALo para filtrar.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'PÁgina atual (1-indexada).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade de itens por página (máximo 50).',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de provedores com metadados de paginação.',
    type: AdminProviderListDto,
  })
  async listProviders(
    @Query() query: AdminProviderQueryDto,
  ): Promise<AdminProviderListDto> {
    const pageResult = await this.providersService.getAdminProvidersPage({
      page: query.page,
      limit: query.limit,
      searchTerm: query.searchTerm,
      serviceId: query.serviceId,
      category: query.category,
      verificationStatus: query.verificationStatus,
    });
    const items = pageResult.items.map(
      (provider) => new ProviderViewDto(provider),
    );
    return new AdminProviderListDto(
      items,
      pageResult.totalCount,
      pageResult.page,
      pageResult.limit,
    );
  }

  @Patch(':id/visibility')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar o status de visibilidade da vitrine de um provedor',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil do provedor atualizado com o novo status de vitrine',
    type: ProviderDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async updateVisibility(
    @Param('id') id: string,
    @Body() dto: UpdateProviderVisibilityDto,
    @Req() req: RequestWithUser,
  ): Promise<ProviderDetailsDto> {
    const provider = await this.providersService.setProviderVisibility(
      id,
      dto.visibilityStatus,
      dto.visibilityReason,
      req.user?.userId,
    );
    return new ProviderDetailsDto(provider);
  }
}
