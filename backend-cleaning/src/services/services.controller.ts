import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceDetailsDto } from './dto/service-details.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, Service as PrismaServiceType } from '@prisma/client'; // <-- Importar Service do Prisma para tipagem
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar um novo tipo de serviço (apenas para administradores)' })
  @ApiResponse({ status: 201, description: 'Tipo de serviço criado com sucesso.', type: ServiceDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  async create(@Body() createServiceDto: CreateServiceDto): Promise<ServiceDetailsDto> {
    const service = await this.servicesService.create(createServiceDto);
    return new ServiceDetailsDto(service as PrismaServiceType);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os tipos de serviço' })
  @ApiResponse({ status: 200, description: 'Lista de tipos de serviço.', type: [ServiceDetailsDto] })
  async findAll(): Promise<ServiceDetailsDto[]> {
    const services = await this.servicesService.findAll();
    return services.map(service => new ServiceDetailsDto(service as PrismaServiceType));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter um tipo de serviço por ID' })
  @ApiResponse({ status: 200, description: 'Detalhes do tipo de serviço.', type: ServiceDetailsDto })
  @ApiResponse({ status: 404, description: 'Tipo de serviço não encontrado.' })
  async findOne(@Param('id') id: string): Promise<ServiceDetailsDto> {
    const service = await this.servicesService.findOne(id);
    if (!service) throw new NotFoundException(`Tipo de serviço com ID "${id}" não encontrado.`);
    return new ServiceDetailsDto(service as PrismaServiceType);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar um tipo de serviço (apenas para administradores)' })
  @ApiResponse({ status: 200, description: 'Tipo de serviço atualizado com sucesso.', type: ServiceDetailsDto })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Tipo de serviço não encontrado.' })
  async update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto): Promise<ServiceDetailsDto> {
    const updatedService = await this.servicesService.update(id, updateServiceDto);
    if (!updatedService) throw new NotFoundException(`Tipo de serviço com ID "${id}" não encontrado.`);
    return new ServiceDetailsDto(updatedService as PrismaServiceType);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar um tipo de serviço (apenas para administradores)' })
  @ApiResponse({ status: 204, description: 'Tipo de serviço deletado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 403, description: 'Acesso proibido.' })
  @ApiResponse({ status: 404, description: 'Tipo de serviço não encontrado.' })
  async remove(@Param('id') id: string) {
    await this.servicesService.remove(id);
  }
}
