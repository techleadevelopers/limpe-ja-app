// backend-cleaning/src/subscriptions/subscriptions.controller.ts
import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming JWT guard
import { RolesGuard } from '../auth/guards/roles.guard'; // Assuming Roles guard
import { Roles } from '../auth/decorators/roles.decorator'; // Assuming Roles decorator
import { UserRole } from '@prisma/client'; // Assuming Prisma enum for roles

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles(UserRole.CLIENT) // Only clients can create subscriptions
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto, @Req() req) {
    // Ensure the subscription is for the authenticated client
    if (req.user.role === UserRole.CLIENT && req.user.id !== createSubscriptionDto.clientId) {
      // Or, better, derive clientId from req.user.id directly if it's a client's subscription
      createSubscriptionDto.clientId = req.user.id;
    }
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  @Get('me')
  @Roles(UserRole.CLIENT) // Clients can get their own subscriptions
  async getSubscriptionsForUser(@Req() req) {
    return this.subscriptionsService.getSubscriptionsForUser(req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN) // Clients can view their own, Admin can view any
  async getSubscriptionDetails(@Param('id') id: string, @Req() req) {
    // Add logic to ensure client can only see their own subscription
    return this.subscriptionsService.getSubscriptionDetails(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT, UserRole.ADMIN) // Clients can update their own (e.g., pause/cancel), Admin can update any
  async update(@Param('id') id: string, @Body() updateSubscriptionDto: UpdateSubscriptionDto, @Req() req) {
    // Add logic to ensure client can only update their own subscription
    return this.subscriptionsService.update(id, updateSubscriptionDto, req.user.id, req.user.role);
  }

  // Internal endpoint, possibly for admin or triggered by a webhook/scheduled job
  // Not exposed to general users
  // @Post(':subscriptionId/generate-next-booking')
  // @Roles(UserRole.ADMIN) // Or internal API key guard
  // async generateNextBooking(@Param('subscriptionId') subscriptionId: string) {
  //   return this.subscriptionsService.generateRecurringBooking(subscriptionId);
  // }
}