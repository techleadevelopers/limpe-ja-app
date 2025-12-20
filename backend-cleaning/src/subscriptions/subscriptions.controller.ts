// backend-cleaning/src/subscriptions/subscriptions.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming JWT guard
import { RolesGuard } from '../auth/guards/roles.guard'; // Assuming Roles guard
import { Roles } from '../auth/decorators/roles.decorator'; // Assuming Roles decorator
import { UserRole } from '@prisma/client'; // Assuming Prisma enum for roles

type RequestWithUser = Request & {
  user?: {
    id?: string;
    userId?: string;
    role?: UserRole;
  };
};

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(UserRole.CLIENT) // Only clients can create subscriptions
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.id ?? req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      throw new BadRequestException('Usuário não autenticado.');
    }
    // Ensure the subscription is for the authenticated client
    if (role === UserRole.CLIENT && userId !== createSubscriptionDto.clientId) {
      // Or, better, derive clientId from req.user.id directly if it's a client's subscription
      createSubscriptionDto.clientId = userId;
    }
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get('me')
  @Roles(UserRole.CLIENT) // Clients can get their own subscriptions
  async getSubscriptionsForUser(@Req() req: RequestWithUser) {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) {
      throw new BadRequestException('Usuário não autenticado.');
    }
    return this.subscriptionsService.getSubscriptionsForUser(userId);
  }

  // ADMIN: Listar todas as assinaturas (com filtro opcional de status)
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Req() req: RequestWithUser) {
    const status = req.query?.status as string | undefined;
    return this.subscriptionsService.findAll(status);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN) // Clients can view their own, Admin can view any
  async getSubscriptionDetails(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    // Add logic to ensure client can only see their own subscription
    const userId = req.user?.id ?? req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      throw new BadRequestException('Usuário não autenticado.');
    }
    return this.subscriptionsService.getSubscriptionDetails(id, userId, role);
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN) // Clients can update their own (e.g., pause/cancel), Admin can update any
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
    @Req() req: RequestWithUser,
  ) {
    const userId = req.user?.id ?? req.user?.userId;
    const role = req.user?.role;
    if (!userId || !role) {
      throw new BadRequestException('Usuário não autenticado.');
    }
    // Add logic to ensure client can only update their own subscription
    return this.subscriptionsService.update(
      id,
      updateSubscriptionDto,
      userId,
      role,
    );
  }

}
