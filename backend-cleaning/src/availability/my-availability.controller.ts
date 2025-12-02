// src/availability/my-availability.controller.ts
import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  Post,
  Delete,
  NotFoundException,
  ConflictException,
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
import { ProvidersService } from '../providers/providers.service'; // Para obter o ID do provedor logado
import { BulkAvailabilityDto } from './dto/bulk-availability.dto';

@ApiTags('my-availability') // Tag para o Swagger
@Controller('providers/me/availability') // Rota específica para o provedor autenticado
@UseGuards(JwtAuthGuard, RolesGuard) // Aplica os guards a todas as rotas deste controlador
@Roles(UserRole.PROVIDER) // Apenas provedores podem acessar
@ApiBearerAuth() // Requer autenticação Bearer no Swagger
export class MyAvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly providersService: ProvidersService, // Injeta ProvidersService
  ) {}

  // Helper para obter o providerId do usuário autenticado
  private async getProviderIdFromUser(req: Request): Promise<string> {
    const userId = req.user['userId']; // Assumindo que o userId é injetado no objeto req.user pelo JwtAuthGuard
    const provider = await this.providersService.findByUserId(userId);
    if (!provider) {
      throw new NotFoundException(
        'Provedor não encontrado para o usuário autenticado.',
      );
    }
    return provider.id;
  }

  @Get()
  @ApiOperation({
    summary: 'Obter horários de disponibilidade do provedor autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Horários de disponibilidade do provedor.',
    type: [GetAvailabilityDto],
  })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async getMyAvailability(
    @Req() req: Request,
    @Query() query: GetAvailabilityDto,
  ) {
    const providerId = await this.getProviderIdFromUser(req);
    return this.availabilityService.getAvailability(providerId, query);
  }

  @Patch()
  @ApiOperation({
    summary: 'Atualizar horários de disponibilidade do provedor autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidade atualizada com sucesso.',
    type: [GetAvailabilityDto],
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  async updateMyAvailability(
    @Req() req: Request,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto[],
  ) {
    const providerId = await this.getProviderIdFromUser(req);
    return this.availabilityService.updateAvailability(
      providerId,
      updateAvailabilityDto,
    );
  }

  @Post()
  @ApiOperation({
    summary:
      'Adicionar um novo slot de disponibilidade para o provedor autenticado',
  })
  @ApiResponse({
    status: 201,
    description: 'Slot de disponibilidade adicionado com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  async createMyAvailability(
    @Req() req: Request,
    @Body() createAvailabilityDto: UpdateAvailabilityDto,
  ) {
    const providerId = await this.getProviderIdFromUser(req);
    return this.availabilityService.createAvailability(
      providerId,
      createAvailabilityDto,
    );
  }

  @Post('bulk')
  @ApiOperation({
    summary:
      'Definir disponibilidade em massa a partir de datas e faixas de horário',
  })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidades criadas/atualizadas.',
  })
  async createBulkAvailability(
    @Req() req: Request,
    @Body() body: BulkAvailabilityDto,
  ) {
    const providerId = await this.getProviderIdFromUser(req);

    const updates: UpdateAvailabilityDto[] = [];
    for (const entry of body.dates) {
      const [y, m, d] = entry.date.split('-').map(Number);
      if (!y || !m || !d) continue;
      const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      for (const r of entry.ranges) {
        if (!r.start || !r.end) continue;
        updates.push({
          dayOfWeek: dow,
          startTime: r.start,
          endTime: r.end,
          isAvailable: true,
        });
      }
    }

    const seen = new Set<string>();
    const dedup = updates.filter((u) => {
      const k = `${u.dayOfWeek}|${u.startTime}|${u.endTime}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const created: any[] = [];
    for (const u of dedup) {
      try {
        const res = await this.availabilityService.createAvailability(
          providerId,
          u,
        );
        created.push(res);
      } catch (err) {
        // Ignorar conflitos de duplicidade
        continue;
      }
    }
    return created;
  }

  @Delete(':availabilityId')
  @ApiOperation({
    summary: 'Deletar um slot de disponibilidade do provedor autenticado',
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
  async deleteMyAvailability(
    @Req() req: Request,
    @Param('availabilityId') availabilityId: string,
  ) {
    const providerId = await this.getProviderIdFromUser(req);
    await this.availabilityService.deleteAvailability(
      availabilityId,
      providerId,
    );
  }
}
