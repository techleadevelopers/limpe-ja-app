// src/coupons/coupons.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  Logger,
  Post,
  Body,
  BadRequestException,
  Headers,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CouponsService } from './coupons.service';
import {
  ApplyCouponDto,
  CouponApplicationResult,
} from './dto/apply-coupon.dto';
import { CouponEntity } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  private readonly logger = new Logger(CouponsController.name);

  constructor(private readonly couponsService: CouponsService) {}

  @Get('resolve/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT) // Apenas clientes devem resolver cupons para agendamentos
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Resolve um cupom e retorna detalhes de elegibilidade e prévia de desconto',
  })
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
    this.logger.log(
      `[CouponsController] resolveCoupon: Resolvendo cupom ${code} para userId ${req.user.userId}`,
    );
    const bookingData = {
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      providerServiceId,
      providerId,
      scheduledDate,
      clientId: req.user.userId, // O clientId é o próprio userId do cliente
    };
    return this.couponsService.resolveCoupon(
      code,
      req.user.userId,
      bookingData,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lista os cupons disponíveis para o usuário autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cupons do usuário.',
    type: [CouponEntity],
  })
  async getMyCoupons(@Req() req) {
    this.logger.log(
      `[CouponsController] getMyCoupons: Buscando cupons para userId: ${req.user.userId}`,
    );
    return this.couponsService.getMyCoupons(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cria um cupom (apenas para administradores)' })
  @ApiResponse({
    status: 201,
    description: 'Cupom criado com sucesso.',
    type: CouponEntity,
  })
  async createCoupon(@Body() dto: CreateCouponDto, @Req() req) {
    const issuer = req.user?.userId ?? 'SYSTEM';
    return this.couponsService.create({ ...dto, issuedBy: issuer });
  }

  @Get(':code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca um cupom pelo código (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Cupom encontrado.',
    type: CouponEntity,
  })
  async findByCode(@Param('code') code: string) {
    return this.couponsService.findByCode(code);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista todos os cupons (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cupons.',
    type: [CouponEntity],
  })
  async findAll() {
    return this.couponsService.findAll();
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza um cupom existente (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Cupom atualizado.',
    type: CouponEntity,
  })
  async updateCoupon(
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, dto);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aplica um cupom e retorna o desconto calculado' })
  @ApiResponse({
    status: 200,
    description: 'Resultado da aplicação do cupom.',
    type: Object,
  })
  async applyCoupon(
    @Body()
    payload: {
      code: string;
      bookingData?: {
        originalPrice?: number;
        clientId?: string;
        providerServiceId?: string;
        providerId?: string;
        scheduledDate?: string;
      };
    },
    @Req() req,
  ): Promise<CouponApplicationResult> {
    const code = payload?.code;
    if (!code) {
      throw new BadRequestException('Código do cupom é obrigatório.');
    }
    const bookingData = payload?.bookingData || {};
    // Garante clientId para regras de elegibilidade firstBooking
    bookingData.clientId = bookingData.clientId ?? req.user.userId;
    return this.couponsService.applyCoupon(code, req.user.userId, bookingData);
  }

}
