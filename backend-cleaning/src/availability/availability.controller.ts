import { Controller, Get, Patch, Body, Param, UseGuards, Req, NotFoundException, ForbiddenException, Query, Post, Delete } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { GetAvailabilityDto } from './dto/get-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ProvidersService } from '../providers/providers.service'; // Para verificar se o provedor logado é o dono

@ApiTags('availability')
@Controller('providers/:providerId/availability')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly providersService: ProvidersService, // Injeta ProvidersService
  ) {}

  // Helper para verificar se o provedor logado é o dono do :providerId
  private async validateProviderOwnership(req: Request, providerId: string): Promise<void> {
    const userId = req.user['userId'];
    const provider = await this.providersService.findByUserId(userId);
    if (!provider || provider.id !== providerId) {
      throw new ForbiddenException('Você não tem permissão para gerenciar a disponibilidade deste provedor.');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obter horários de disponibilidade de um provedor' })
  @ApiResponse({ status: 200, description: 'Horários de disponibilidade do provedor.', type: [GetAvailabilityDto] })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async getAvailability(@Param('providerId') providerId: string, @Query() query: GetAvailabilityDto) {
    const availability = await this.availabilityService.getAvailability(providerId, query);
    return availability;
  }

  @Patch()
  @Roles(UserRole.PROVIDER) // Apenas provedores podem atualizar sua própria disponibilidade
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar horários de disponibilidade de um provedor' })
  @ApiResponse({ status: 200, description: 'Disponibilidade atualizada com sucesso.', type: [GetAvailabilityDto] })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async updateAvailability(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto[],
  ) {
    await this.validateProviderOwnership(req, providerId); // Verifica se o provedor logado é o dono
    const updatedAvailability = await this.availabilityService.updateAvailability(providerId, updateAvailabilityDto);
    return updatedAvailability;
  }

  // Exemplo de rota para adicionar um novo slot de disponibilidade
  @Post()
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar um novo slot de disponibilidade para um provedor' })
  @ApiResponse({ status: 201, description: 'Slot de disponibilidade adicionado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  async createAvailability(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Body() createAvailabilityDto: UpdateAvailabilityDto, // Reutiliza DTO para criação de slot
  ) {
    await this.validateProviderOwnership(req, providerId);
    const newSlot = await this.availabilityService.createAvailability(providerId, createAvailabilityDto);
    return newSlot;
  }

  // Exemplo de rota para deletar um slot de disponibilidade
  @Delete(':availabilityId')
  @Roles(UserRole.PROVIDER)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar um slot de disponibilidade de um provedor' })
  @ApiResponse({ status: 204, description: 'Slot de disponibilidade deletado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Slot de disponibilidade não encontrado.' })
  async deleteAvailability(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Param('availabilityId') availabilityId: string,
  ) {
    await this.validateProviderOwnership(req, providerId);
    await this.availabilityService.deleteAvailability(availabilityId, providerId);
  }
}