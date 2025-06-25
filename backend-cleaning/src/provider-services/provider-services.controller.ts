// src/provider-services/provider-services.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProviderServicesService } from './provider-services.service';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { UpdateProviderServiceDto } from './dto/update-provider-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
// import { ProviderService } from '@prisma/client'; // REMOVA esta linha
import { ProviderServiceEntity } from './entities/provider-service.entity'; // ADICIONE esta linha
import { ProvidersService } from '../providers/providers.service';

@ApiTags('provider-services')
@Controller('providers/:providerId/services')
export class ProviderServicesController {
  constructor(
    private readonly providerServicesService: ProviderServicesService,
    private readonly providersService: ProvidersService,
  ) {}

  private async validateProviderOwnership(req: Request, providerId: string): Promise<void> {
    const userId = req.user['userId'];
    const provider = await this.providersService.findByUserId(userId);
    if (!provider || provider.id !== providerId) {
      throw new ForbiddenException('Você não tem permissão para gerenciar os serviços deste provedor.');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar um novo serviço oferecido por um provedor' })
  // CORREÇÃO: Use ProviderServiceEntity
  @ApiResponse({ status: 201, description: 'Serviço oferecido adicionado com sucesso.', type: ProviderServiceEntity })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Provedor ou tipo de serviço não encontrado.' })
  async create(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Body() createProviderServiceDto: CreateProviderServiceDto,
  ): Promise<ProviderServiceEntity> { // CORREÇÃO: Retorna ProviderServiceEntity
    await this.validateProviderOwnership(req, providerId);
    const createdService = await this.providerServicesService.create(providerId, createProviderServiceDto);
    return new ProviderServiceEntity(createdService); // Mapeia para a entidade
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os serviços oferecidos por um provedor' })
  // CORREÇÃO: Use [ProviderServiceEntity]
  @ApiResponse({ status: 200, description: 'Lista de serviços oferecidos.', type: [ProviderServiceEntity] })
  @ApiResponse({ status: 404, description: 'Provedor não encontrado.' })
  async findAll(@Param('providerId') providerId: string): Promise<ProviderServiceEntity[]> { // CORREÇÃO: Retorna ProviderServiceEntity[]
    const services = await this.providerServicesService.findAllByProviderId(providerId);
    return services.map(service => new ProviderServiceEntity(service)); // Mapeia para a entidade
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um serviço oferecido por um provedor' })
  // CORREÇÃO: Use ProviderServiceEntity
  @ApiResponse({ status: 200, description: 'Serviço oferecido atualizado com sucesso.', type: ProviderServiceEntity })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Serviço oferecido não encontrado.' })
  async update(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Param('id') id: string,
    @Body() updateProviderServiceDto: UpdateProviderServiceDto,
  ): Promise<ProviderServiceEntity> { // CORREÇÃO: Retorna ProviderServiceEntity
    await this.validateProviderOwnership(req, providerId);
    const updatedService = await this.providerServicesService.update(id, providerId, updateProviderServiceDto);
    if (!updatedService) {
      throw new NotFoundException(`Serviço oferecido com ID "${id}" não encontrado para o provedor "${providerId}".`);
    }
    return new ProviderServiceEntity(updatedService); // Mapeia para a entidade
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover um serviço oferecido por um provedor' })
  @ApiResponse({ status: 204, description: 'Serviço oferecido removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Serviço oferecido não encontrado.' })
  async remove(
    @Req() req: Request,
    @Param('providerId') providerId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.validateProviderOwnership(req, providerId);
    await this.providerServicesService.remove(id, providerId);
  }
}