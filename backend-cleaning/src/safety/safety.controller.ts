// backend-cleaning/src/safety/safety.controller.ts
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { ReportPanicDto } from './dto/report-panic.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming JWT guard
import { RolesGuard } from '../auth/guards/roles.guard'; // Assuming Roles guard
import { Roles } from '../auth/decorators/roles.decorator'; // Assuming Roles decorator
import { UserRole } from '@prisma/client'; // Assuming Prisma enum for roles

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('safety')
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('panic')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER) // Both clients and providers can report panic
  async reportPanic(@Body() reportPanicDto: ReportPanicDto, @Req() req) {
    return this.safetyService.reportPanic(req.user.id, reportPanicDto);
  }

  @Post('incident')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER) // Both clients and providers can report incidents
  async reportIncident(@Body() reportIncidentDto: ReportIncidentDto, @Req() req) {
    return this.safetyService.reportIncident(req.user.id, reportIncidentDto);
  }

  @Get('me/incidents')
  @Roles(UserRole.CLIENT, UserRole.PROVIDER) // Users can list their own incidents
  async getIncidentsForUser(@Req() req) {
    return this.safetyService.getIncidentsForUser(req.user.id);
  }

  @Patch('incident/:id/status')
  @Roles(UserRole.ADMIN) // Only admins can update incident status
  async updateIncidentStatus(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto, @Req() req) {
    return this.safetyService.updateIncidentStatus(id, updateIncidentDto, req.user.id);
  }
}