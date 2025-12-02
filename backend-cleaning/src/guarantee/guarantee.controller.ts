// backend-cleaning/src/guarantee/guarantee.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GuaranteeService } from './guarantee.service';
import { SubmitClaimDto } from './dto/submit-claim.dto';
import { UpdateClaimDto } from './dto/update-claim.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client'; // Assuming Prisma enum for roles

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('guarantee')
export class GuaranteeController {
  constructor(private readonly guaranteeService: GuaranteeService) {}

  @Post('claims')
  @Roles(UserRole.CLIENT) // Only clients can submit claims
  async submitClaim(@Body() submitClaimDto: SubmitClaimDto, @Req() req) {
    // Ensure the claim is linked to the authenticated client
    return this.guaranteeService.submitClaim(req.user.id, submitClaimDto);
  }

  @Get('claims/me')
  @Roles(UserRole.CLIENT) // Clients can list their own claims
  async getClaimsForUser(@Req() req) {
    return this.guaranteeService.getClaimsForUser(req.user.id);
  }

  @Get('claims/:id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN) // Clients can view their own, Admin can view any
  async getClaimDetails(@Param('id') id: string, @Req() req) {
    // Add logic to ensure client can only see their own claim
    return this.guaranteeService.getClaimDetails(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Patch('claims/:id/status')
  @Roles(UserRole.ADMIN) // Only admins can update claim status
  async updateClaimStatus(
    @Param('id') id: string,
    @Body() updateClaimDto: UpdateClaimDto,
    @Req() req,
  ) {
    return this.guaranteeService.updateClaimStatus(
      id,
      updateClaimDto,
      req.user.id,
    );
  }
}
