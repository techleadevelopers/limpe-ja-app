import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuditLogService } from './audit-log.service';
import { ListAuditActivitiesDto } from './dto/list-audit-activities.dto';

@Controller('admin/activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async getActivities(@Query() query: ListAuditActivitiesDto) {
    const take = query.limit ?? 50;
    return this.auditLogService.findAll(take);
  }
}
