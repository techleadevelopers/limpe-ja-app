// src/coupons/coupons.controller.ts
import { Controller, Get, Param, Query, UseGuards, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CouponsService } from './coupons.service';
import { CouponApplicationResult } from './dto/apply-coupon.dto';
import { CouponEntity } from './entities/coupon.entity'; // Assumindo que você tem uma entidade de cupom

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  private readonly logger = new Logger(CouponsController.name);

  constructor(private readonly couponsService: CouponsService) {}

  @Get('resolve/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT) // Apenas clientes devem resolver cupons para agendamentos
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve um cupom e retorna detalhes de elegibilidade e prévia de desconto' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do cupom e elegibilidade.',
    schema: {
      properties: {
        coupon: { type: 'object' }, // Ajuste conforme sua CouponEntity
        eligibility: { type: 'boolean' },
        message: { type: 'string' },
        discountPreview: { type: 'number', format: 'float' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Cupom não encontrado.' })
  async resolveCoupon(
    @Param('code') code: string,
    @Req() req,
    @Query('originalPrice') originalPrice?: number,
    @Query('providerServiceId') providerServiceId?: string,
    @Query('providerId') providerId?: string,
    @Query('scheduledDate') scheduledDate?: string,
  ) {
    this.logger.log(`[CouponsController] resolveCoupon: Resolvendo cupom ${code} para userId ${req.user.userId}`);
    const bookingData = {
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      providerServiceId,
      providerId,
      scheduledDate,
      clientId: req.user.userId, // O clientId é o próprio userId do cliente
    };
    return this.couponsService.resolveCoupon(code, req.user.userId, bookingData);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista os cupons disponíveis para o usuário autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de cupons do usuário.', type: [CouponEntity] })
  async getMyCoupons(@Req() req) {
    this.logger.log(`[CouponsController] getMyCoupons: Buscando cupons para userId: ${req.user.userId}`);
    return this.couponsService.getMyCoupons(req.user.userId);
  }

  // --- Métodos CRUD básicos (exemplo, se não existirem) ---
  // @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Cria um novo cupom (apenas para administradores)' })
  // @ApiResponse({ status: 201, description: 'Cupom criado com sucesso.', type: CouponEntity })
  // async createCoupon(@Body() createCouponDto: CreateCouponDto) {
  //   return this.couponsService.create(createCouponDto);
  // }

  // @Get(':code')
  // @ApiOperation({ summary: 'Busca um cupom pelo código' })
  // @ApiResponse({ status: 200, description: 'Detalhes do cupom.', type: CouponEntity })
  // @ApiResponse({ status: 404, description: 'Cupom não encontrado.' })
  // async findByCode(@Param('code') code: string) {
  //   return this.couponsService.findByCode(code);
  // }

  // @Get()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Lista todos os cupons (apenas para administradores)' })
  // @ApiResponse({ status: 200, description: 'Lista de todos os cupons.', type: [CouponEntity] })
  // async findAllCoupons() {
  //   return this.couponsService.findAll();
  // }

  // @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Atualiza um cupom existente (apenas para administradores)' })
  // @ApiResponse({ status: 200, description: 'Cupom atualizado com sucesso.', type: CouponEntity })
  // @ApiResponse({ status: 404, description: 'Cupom não encontrado.' })
  // async updateCoupon(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
  //   return this.couponsService.update(id, updateCouponDto);
  // }
}