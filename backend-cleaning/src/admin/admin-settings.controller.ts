import { Body, Controller, Get, Put, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SettingsService, SlaSettings, GeneralSettings } from '../settings/settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('admin-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('slas')
  async getSlas(): Promise<SlaSettings> {
    return this.settings.getSlaSettings();
  }

  @Put('slas')
  async updateSlas(@Req() req: any, @Body() body: Partial<SlaSettings>): Promise<SlaSettings> {
    const actorUserId = req?.user?.userId || 'unknown';
    return this.settings.updateSlaSettings(body, actorUserId);
  }

  @Get('slas/history')
  async getSlasHistory(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    const l = limit ? parseInt(limit, 10) : 50;
    const c = cursor ? parseInt(cursor, 10) : 0;
    return this.settings.getSlaHistory(l, c);
  }

  @Get('general')
  async getGeneral(): Promise<GeneralSettings> {
    return this.settings.getGeneralSettings();
  }

  @Put('general')
  async updateGeneral(@Req() req: any, @Body() body: Partial<GeneralSettings>): Promise<GeneralSettings> {
    const actorUserId = req?.user?.userId || 'unknown';
    return this.settings.updateGeneralSettings(body, actorUserId);
  }

  @Get('general/history')
  async getGeneralHistory(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    const l = limit ? parseInt(limit, 10) : 50;
    const c = cursor ? parseInt(cursor, 10) : 0;
    return this.settings.getGeneralHistory(l, c);
  }

  @Get('pricing/history')
  async getPricingHistory(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    const l = limit ? parseInt(limit, 10) : 50;
    const c = cursor ? parseInt(cursor, 10) : 0;
    return this.settings.getPricingHistory(l, c);
  }
}
