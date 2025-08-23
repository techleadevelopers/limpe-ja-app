// backend-cleaning/src/coupons/coupons.controller.ts
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto'; // <-- CORRETO
import { ApplyCouponDto } from './dto/apply-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Get(':code')
  @Roles(UserRole.ADMIN)
  async findOne(@Param('code') code: string) {
    return this.couponsService.findByCode(code);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) { // <-- usa UpdateCouponDto
    return this.couponsService.update(id, updateCouponDto);
  }

  @Post('apply')
  @Roles(UserRole.CLIENT)
  async apply(@Body() applyCouponDto: ApplyCouponDto, @Req() req) {
    const userId = req.user['userId']; // padrão do seu projeto
    return this.couponsService.applyCoupon(applyCouponDto.code, userId, applyCouponDto.bookingData);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.couponsService.findAll();
  }
}
