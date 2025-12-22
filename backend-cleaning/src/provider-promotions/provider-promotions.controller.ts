import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ProviderPromotionsService } from './provider-promotions.service';
import { CreateProviderPromotionDto } from './dto/create-provider-promotion.dto';
import { UpdateProviderPromotionDto } from './dto/update-provider-promotion.dto';
import { AuthenticatedProviderUser } from './types/authenticated-provider-user.interface';
import { Request } from 'express';

@Controller('provider/promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
export class ProviderPromotionsController {
  constructor(
    private readonly promotionsService: ProviderPromotionsService,
  ) {}

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as AuthenticatedProviderUser;
    return this.promotionsService.listPromotions(user);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateProviderPromotionDto,
  ) {
    const user = req.user as AuthenticatedProviderUser;
    return this.promotionsService.createPromotion(user, dto);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateProviderPromotionDto,
  ) {
    const user = req.user as AuthenticatedProviderUser;
    return this.promotionsService.updatePromotion(user, id, dto);
  }
}
