// src/availability/availability.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
  Query,
  Post,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { GetAvailabilityDto } from './dto/get-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ProvidersService } from '../providers/providers.service';

@ApiTags('availability')
@Controller('providers/:providerId/availability')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly providersService: ProvidersService,
  ) {}

  // Helper para verificar se o provedor logado é o dono do :providerId
  private async validateProviderOwnership(
    req: Request,
    providerId: string,
  ): Promise<void> {
    const userId = req.user['userId'];
    const provider = await this.providersService.findByUserId(userId);
    if (!provider || provider.id !== providerId) {
      throw new ForbiddenException(
        'Você não tem permissão para gerenciar a disponibilidade deste provedor.',
      );
    }
  }

  /**
   * Valida o formato do providerId para garantir que não é "me" e é um UUID válido.
   * Isso força o uso do endpoint /providers/me/availability para o provedor autenticado.
   */
  private validateProviderId(providerId: string): void {
    // Se o ID for "me" (case-insensitive), instrua a usar o endpoint correto.
    if (providerId.toLowerCase() === 'me') {
      throw new BadRequestException(
        'Para gerenciar sua própria disponibilidade, use o endpoint /providers/me/availability.',
      );
    }
    // Opcional: Adicione uma validação de formato UUID se seus IDs de provedor forem UUIDs.
    // const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    // if (!uuidRegex.test(providerId)) {
    //   throw new BadRequestException('ID do provedor inválido. Deve ser um UUID válido.');
    // }
  }

  @Get()
  @ApiOperation({
    summary:
      'Obter horários de disponibilidade de um provedor (suporte a nextAvailable para cards)',
  })
  @ApiResponse({
    status: 200,
    description: 'Horários de disponibilidade do provedor.',
    type: [GetAvailabilityDto],
  })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  @ApiResponse({ status: 400, description: 'ID do provedor inválido.' })
  async getAvailability(
    @Param('providerId') providerId: string,
    @Query() query: GetAvailabilityDto,
  ) {
    this.validateProviderId(providerId);
    
    const result = await this.availabilityService.getAvailability(providerId, query);
    
    // Se o service retorna { available, occupiedTimes }, mande apenas o available 
    // para o frontend não quebrar
    return result.available || result; 
  }

  @Patch()
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atualizar horários de disponibilidade de um provedor',
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidade atualizada com sucesso.',
    type: [GetAvailabilityDto],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  @ApiResponse({ status: 400, description: 'ID do provedor inválido.' })
  async updateAvailability(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto[],
  ) {
    this.validateProviderId(providerId);
    await this.validateProviderOwnership(req, providerId);
    const updatedAvailability =
      await this.availabilityService.updateAvailability(
        providerId,
        updateAvailabilityDto,
      );
    return updatedAvailability;
  }

  @Post()
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Adicionar um novo slot de disponibilidade para um provedor',
  })
  @ApiResponse({
    status: 201,
    description: 'Slot de disponibilidade adicionado com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 400, description: 'ID do provedor inválido.' })
  async createAvailability(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Body() createAvailabilityDto: UpdateAvailabilityDto,
  ) {
    this.validateProviderId(providerId);
    await this.validateProviderOwnership(req, providerId);
    const newSlot = await this.availabilityService.createAvailability(
      providerId,
      createAvailabilityDto,
    );
    return newSlot;
  }

  @Delete(':availabilityId')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deletar um slot de disponibilidade de um provedor',
  })
  @ApiResponse({
    status: 204,
    description: 'Slot de disponibilidade deletado com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({
    status: 404,
    description: 'Slot de disponibilidade não encontrado.',
  })
  @ApiResponse({ status: 400, description: 'ID do provedor inválido.' })
  async deleteAvailability(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Param('availabilityId') availabilityId: string,
  ) {
    this.validateProviderId(providerId);
    await this.validateProviderOwnership(req, providerId);
    await this.availabilityService.deleteAvailability(
      availabilityId,
      providerId,
    );
  }
}
