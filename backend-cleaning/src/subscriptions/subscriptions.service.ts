// backend-cleaning/src/subscriptions/subscriptions.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Assuming PrismaService exists
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import {
  SubscriptionFrequency,
  SubscriptionStatus,
  UserRole,
  Prisma,
} from '@prisma/client'; // Prisma enums
import { BookingsService } from '../bookings/bookings.service'; // Assuming BookingsService exists
import { PaymentsService } from '../payments/payments.service'; // Assuming PaymentsService exists
import { QueuesService } from '../queues/queues.service'; // Assuming QueuesService for BullMQ

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private bookingsService: BookingsService,
    private paymentsService: PaymentsService,
    private queuesService: QueuesService, // For scheduling recurring booking generation
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const {
      clientId,
      providerId,
      providerServiceId,
      startDate,
      frequency,
      totalPrice,
    } = createSubscriptionDto;

    // Basic validation: ensure client, provider, service exist
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    const provider = await this.prisma.provider.findUnique({
      where: { id: providerId },
    });
    const providerService = await this.prisma.providerService.findUnique({
      where: { id: providerServiceId },
    });

    if (!client || !provider || !providerService) {
      throw new BadRequestException(
        'Client, Provider, or Provider Service not found.',
      );
    }

    // Calculate initial nextGenerationDate (e.g., same as startDate for first booking)
    const initialNextGenerationDate = new Date(startDate);

    const subscription = await this.prisma.subscription.create({
      data: {
        clientId,
        providerId,
        providerServiceId,
        frequency,
        startDate: new Date(startDate),
        endDate: createSubscriptionDto.endDate
          ? new Date(createSubscriptionDto.endDate)
          : null,
        totalPrice,
        nextGenerationDate: initialNextGenerationDate, // First generation date
        status: SubscriptionStatus.ACTIVE,
      },
    });

    const now = new Date();
    if (initialNextGenerationDate > now) {
      await this.scheduleNextBookingGeneration(
        subscription.id,
        initialNextGenerationDate,
        subscription.frequency,
      );
    } else {
      await this.generateRecurringBooking(subscription.id);
    }

    // TODO: Integrate with PaymentsService for initial recurring payment setup (e.g., tokenization)
    // await this.paymentsService.setupRecurringPayment(clientId, subscription.id, totalPrice, frequency);

    return subscription;
  }

  async getSubscriptionsForUser(clientId: string) {
    return this.prisma.subscription.findMany({
      where: { clientId },
      include: {
        provider: { select: { fullName: true } },
        providerService: { include: { service: { select: { name: true } } } },
      },
    });
  }

  async findAll(status?: string) {
    const statusFilter = status as SubscriptionStatus | undefined;
    return this.prisma.subscription.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        client: { select: { id: true, fullName: true } },
        provider: { select: { id: true, fullName: true } },
        providerService: {
          include: { service: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' as Prisma.SortOrder },
    });
  }

  async getSubscriptionDetails(id: string, userId: string, userRole: UserRole) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, fullName: true } },
        provider: { select: { id: true, fullName: true } },
        providerService: {
          include: { service: { select: { id: true, name: true } } },
        },
        generatedBookings: {
          orderBy: { scheduledDate: 'desc' as Prisma.SortOrder },
          select: { id: true, scheduledDate: true, status: true },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found.`);
    }

    // Authorization check
    const isClientRole = userRole === 'CLIENT';
    if (isClientRole && subscription.clientId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this subscription.',
      );
    }

    return subscription;
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
    userId: string,
    userRole: UserRole,
  ) {
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found.`);
    }

    // Authorization check
    const isClientRole = userRole === 'CLIENT';
    if (isClientRole && existingSubscription.clientId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this subscription.',
      );
    }

    const newStatus = updateSubscriptionDto.status as
      | SubscriptionStatus
      | undefined;
    if (newStatus && !Object.values(SubscriptionStatus).includes(newStatus)) {
      throw new BadRequestException('Invalid subscription status.');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: newStatus,
        frequency: updateSubscriptionDto.frequency,
        endDate: updateSubscriptionDto.endDate
          ? new Date(updateSubscriptionDto.endDate)
          : undefined,
        totalPrice: updateSubscriptionDto.totalPrice,
      },
    });

    // If status changes to PAUSED or CANCELED, cancel future scheduled jobs and bookings
    if (
      newStatus === SubscriptionStatus.PAUSED ||
      newStatus === SubscriptionStatus.CANCELED
    ) {
      await this.cancelFutureRecurringBookings(id);
      // TODO: Notify payments service to pause/cancel recurring charges
      // await this.paymentsService.pauseRecurringPayment(id);
    } else if (
      newStatus === SubscriptionStatus.ACTIVE &&
      existingSubscription.status !== SubscriptionStatus.ACTIVE
    ) {
      // If reactivated, reschedule future bookings
      const resumedNextDate =
        updatedSubscription.nextGenerationDate ??
        updatedSubscription.startDate ??
        new Date();
      await this.scheduleNextBookingGeneration(
        updatedSubscription.id,
        resumedNextDate,
        updatedSubscription.frequency,
      );
      // TODO: Notify payments service to resume recurring charges
      // await this.paymentsService.resumeRecurringPayment(id);
    }

    return updatedSubscription;
  }

  // --- Internal Methods for Recurring Booking Generation ---

  async generateRecurringBooking(subscriptionId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        client: { include: { address: true } },
        provider: true,
        providerService: true,
      },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      this.logger.warn(
        `Subscription ${subscriptionId} is not active or not found. Skipping booking generation.`,
      );
      return false;
    }

    const address = subscription.client?.address;
    if (!address?.id) {
      this.logger.error(
        `Subscription ${subscriptionId} cannot generate booking: client address not found.`,
      );
      await this.flagSubscriptionAddressIssue(
        subscriptionId,
        'Client address missing or incomplete.',
        subscription.status,
      );
      return false;
    }

    if (
      address.latitude === null ||
      address.latitude === undefined ||
      address.longitude === null ||
      address.longitude === undefined
    ) {
      this.logger.error(
        `Subscription ${subscriptionId} address ${address.id} lacks geocoordinates.`,
      );
      await this.flagSubscriptionAddressIssue(
        subscriptionId,
        'Client address missing latitude/longitude.',
        subscription.status,
      );
      return false;
    }

    const now = new Date();
    const scheduledDate = new Date(subscription.nextGenerationDate);
    const horizonMs = 1000 * 60 * 60 * 24;
    if (scheduledDate > now && scheduledDate.getTime() - now.getTime() > horizonMs) {
      this.logger.log(
        `Booking for subscription ${subscriptionId} not due yet. Next generation: ${scheduledDate.toISOString()}`,
      );
      return false;
    }

    const scheduledTime = '09:00';
    const periodId = this.buildSubscriptionPeriodId(
      subscription.id,
      scheduledDate,
      subscription.frequency,
    );

    let booking = await this.prisma.booking.findFirst({
      where: {
        subscriptionId: subscription.id,
        periodId,
      },
    });

    if (!booking) {
      booking = await this.bookingsService.createBookingFromSubscription({
        clientId: subscription.clientId,
        providerId: subscription.providerId,
        providerServiceId: subscription.providerServiceId,
        scheduledDate: scheduledDate.toISOString(),
        totalPrice: subscription.totalPrice.toNumber(),
        subscriptionId: subscription.id,
        addressId: address.id,
        scheduledTime,
        periodId,
      });

      if (subscription.client?.userId) {
        try {
          await this.paymentsService.processRecurringPayment(
            subscription.client.userId,
            subscription.id,
            booking.id,
            subscription.totalPrice.toNumber(),
          );
        } catch (error) {
          this.logger.warn(
            `[SubscriptionsService] Failed to start recurring payment for booking ${booking.id}: ${
              error instanceof Error ? error.message : 'unknown'
            }`,
          );
        }
      } else {
        this.logger.warn(
          `[SubscriptionsService] Client ${subscription.clientId} has no userId; recurring payment kickoff skipped for booking ${booking.id}.`,
        );
      }
    } else {
      this.logger.log(
        `[SubscriptionsService] Duplicate booking detected for period ${periodId}; skipping creation.`,
      );
    }

    const nextDate = this.calculateNextGenerationDate(
      scheduledDate,
      subscription.frequency,
    );
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        nextGenerationDate: nextDate,
      },
    });

    this.logger.log(
      `[SubscriptionsService] Booking ${booking.id} prepared for subscription ${subscriptionId}. Next generation scheduled for ${nextDate.toISOString()}.`,
    );

    await this.scheduleNextBookingGeneration(
      subscription.id,
      nextDate,
      subscription.frequency,
    );

    return true;
  }

  private calculateNextGenerationDate(
    currentDate: Date,
    frequency: SubscriptionFrequency,
  ): Date {
    const nextDate = new Date(currentDate);
    switch (frequency) {
      case SubscriptionFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case SubscriptionFrequency.BI_WEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case SubscriptionFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      default:
        throw new Error('Invalid subscription frequency');
    }
    return nextDate;
  }

  private async scheduleNextBookingGeneration(
    subscriptionId: string,
    nextGenerationDate: Date,
    frequency: SubscriptionFrequency,
  ) {
    await this.queuesService.removeSubscriptionGenerationJob(subscriptionId);

    const target = new Date(nextGenerationDate);
    const now = new Date();
    const delay = Math.max(target.getTime() - now.getTime(), 0);

    await this.queuesService.addSubscriptionGenerationJob(
      subscriptionId,
      delay,
    );

    this.logger.log(
      `Scheduled next booking generation for subscription ${subscriptionId} at ${target.toISOString()} (frequency=${frequency}).`,
    );
  }

  private async cancelFutureRecurringBookings(subscriptionId: string) {
    // Remove the scheduled job from the queue
    await this.queuesService.removeSubscriptionGenerationJob(subscriptionId); // CORREÇÃO: Usar o método específico

    // Optionally, cancel any bookings that were already generated but are still in a 'pending' or 'scheduled' state
    // This depends on your booking lifecycle.
    // await this.prisma.booking.updateMany({
    //   where: {
    //     subscriptionId: subscriptionId,
    //     status: { in: ['PENDING', 'SCHEDULEED'] }, // adjust statuses as needed
    //     scheduledDate: { gt: new Date() }, // only future bookings
    //   },
    //   data: {
    //     status: 'CANCELED_BY_SUBSCRIPTION',
    //   },
    // });
    this.logger.log(
      `Cancelled future booking generations and potentially future bookings for subscription ${subscriptionId}.`,
    );
  }

  private async flagSubscriptionAddressIssue(
    subscriptionId: string,
    reason: string,
    currentStatus?: SubscriptionStatus,
  ) {
    if (currentStatus === SubscriptionStatus.ACTION_REQUIRED_ADDRESS) {
      return;
    }
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTION_REQUIRED_ADDRESS,
      },
    });
    this.logger.warn(
      `[SubscriptionsService] Subscription ${subscriptionId} marked as ACTION_REQUIRED_ADDRESS: ${reason}`,
    );
  }

  private buildSubscriptionPeriodId(
    subscriptionId: string,
    date: Date,
    frequency: SubscriptionFrequency,
  ) {
    const year = date.getUTCFullYear();
    switch (frequency) {
      case SubscriptionFrequency.WEEKLY: {
        const week = String(this.getIsoWeekNumber(date)).padStart(2, '0');
        return `${subscriptionId}-${year}-W${week}`;
      }
      case SubscriptionFrequency.BI_WEEKLY: {
        const week = this.getIsoWeekNumber(date);
        const biWeekBucket = Math.ceil(week / 2);
        return `${subscriptionId}-${year}-B${String(biWeekBucket).padStart(2, '0')}`;
      }
      case SubscriptionFrequency.MONTHLY: {
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        return `${subscriptionId}-${year}-M${month}`;
      }
      default:
        return `${subscriptionId}-${year}-${String(date.getUTCDate()).padStart(2, '0')}`;
    }
  }

  private getIsoWeekNumber(date: Date) {
    const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNumber = (tmp.getUTCDay() + 6) % 7;
    tmp.setUTCDate(tmp.getUTCDate() - dayNumber + 3);
    const firstThursday = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 4));
    return (
      1 +
      Math.round(
        (tmp.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000),
      )
    );
  }
}
