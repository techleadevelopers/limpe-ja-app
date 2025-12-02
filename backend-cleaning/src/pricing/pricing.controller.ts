// backend-cleaning/src/pricing/pricing.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  Delete,
  Req,
} from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CalculatePriceDto } from './dto/calculate-price.dto';
import { CreatePricingRuleDto } from './dto/create-pricing-rule.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  // No specific role needed for price calculation, as it's a public utility
  async calculatePrice(@Body() calculatePriceDto: CalculatePriceDto) {
    return this.pricingService.calculatePrice(calculatePriceDto);
  }

  @Post('rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can create pricing rules
  async createRule(
    @Req() req: any,
    @Body() createPricingRuleDto: CreatePricingRuleDto,
  ) {
    const actorUserId = req?.user?.userId || 'unknown';
    return this.pricingService.createRule(createPricingRuleDto, actorUserId);
  }

  @Get('rules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can view pricing rules
  async findAllRules() {
    return this.pricingService.findAllRules();
  }

  @Patch('rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can update pricing rules
  async updateRule(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updatePricingRuleDto: UpdatePricingRuleDto,
  ) {
    const actorUserId = req?.user?.userId || 'unknown';
    return this.pricingService.updateRule(
      id,
      updatePricingRuleDto,
      actorUserId,
    );
  }

  // Potentially an endpoint to delete rules
  @Delete('rules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteRule(@Req() req: any, @Param('id') id: string) {
    const actorUserId = req?.user?.userId || 'unknown';
    return this.pricingService.deleteRule(id, actorUserId);
  }
}
