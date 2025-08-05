// backend-cleaning/src/subscriptions/subscriptions.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Assuming PrismaService exists
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionFrequency, SubscriptionStatus } from '@prisma/client'; // Prisma enums
import { BookingsService } from '../bookings/bookings.service'; // Assuming BookingsService exists
import { PaymentsService } from '../payments/payments.service'; // Assuming PaymentsService exists
import { QueuesService } from '../queues/queues.service'; // Assuming QueuesService for BullMQ

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private bookingsService: BookingsService,
    private paymentsService: PaymentsService,
    private queuesService: QueuesService, // For scheduling recurring booking generation
  ) {}

  async create(createSubscriptionDto: CreateSubscriptionDto) {
    const { clientId, providerId, providerServiceId, startDate, frequency, totalPrice } = createSubscriptionDto;

    // Basic validation: ensure client, provider, service exist
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    const provider = await this.prisma.provider.findUnique({ where: { id: providerId } });
    const providerService = await this.prisma.providerService.findUnique({ where: { id: providerServiceId } });

    if (!client || !provider || !providerService) {
      throw new BadRequestException('Client, Provider, or Provider Service not found.');
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
        endDate: createSubscriptionDto.endDate ? new Date(createSubscriptionDto.endDate) : null,
        totalPrice,
        nextGenerationDate: initialNextGenerationDate, // First generation date
        status: SubscriptionStatus.ACTIVE,
      },
    });

    // Immediately generate the first booking
    await this.generateRecurringBooking(subscription.id);

    // Schedule future booking generations
    await this.scheduleNextBookingGeneration(subscription.id, initialNextGenerationDate, frequency);

    // TODO: Integrate with PaymentsService for initial recurring payment setup (e.g., tokenization)
    // await this.paymentsService.setupRecurringPayment(clientId, subscription.id, totalPrice, frequency);

    return subscription;
  }

  async getSubscriptionsForUser(clientId: string) {
    return this.prisma.subscription.findMany({
      where: { clientId },
      include: {
        provider: { select: { name: true } },
        providerService: { select: { name: true } },
      },
    });
  }

  async getSubscriptionDetails(id: string, userId: string, userRole: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true } },
        providerService: { select: { id: true, name: true } },
        generatedBookings: {
          orderBy: { scheduledDate: 'desc' },
          select: { id: true, scheduledDate: true, status: true }, // Select minimal booking data
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found.`);
    }

    // Authorization check
    if (userRole === 'CLIENT' && subscription.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to view this subscription.');
    }

    return subscription;
  }

  async update(id: string, updateSubscriptionDto: UpdateSubscriptionDto, userId: string, userRole: string) {
    const existingSubscription = await this.prisma.subscription.findUnique({ where: { id } });

    if (!existingSubscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found.`);
    }

    // Authorization check
    if (userRole === 'CLIENT' && existingSubscription.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to update this subscription.');
    }

    const updatedSubscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: updateSubscriptionDto.status,
        frequency: updateSubscriptionDto.frequency,
        endDate: updateSubscriptionDto.endDate ? new Date(updateSubscriptionDto.endDate) : undefined,
        totalPrice: updateSubscriptionDto.totalPrice,
      },
    });

    // If status changes to PAUSED or CANCELED, cancel future scheduled jobs and bookings
    if (updateSubscriptionDto.status === SubscriptionStatus.PAUSED || updateSubscriptionDto.status === SubscriptionStatus.CANCELED) {
      await this.cancelFutureRecurringBookings(id);
      // TODO: Notify payments service to pause/cancel recurring charges
      // await this.paymentsService.pauseRecurringPayment(id);
    } else if (updateSubscriptionDto.status === SubscriptionStatus.ACTIVE && existingSubscription.status !== SubscriptionStatus.ACTIVE) {
      // If reactivated, reschedule future bookings
      await this.scheduleNextBookingGeneration(
        updatedSubscription.id,
        updatedSubscription.nextGenerationDate || new Date(), // Use next generation date or now
        updatedSubscription.frequency
      );
      // TODO: Notify payments service to resume recurring charges
      // await this.paymentsService.resumeRecurringPayment(id);
    }

    return updatedSubscription;
  }

  // --- Internal Methods for Recurring Booking Generation ---

  async generateRecurringBooking(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { client: true, provider: true, providerService: true },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      console.warn(`Subscription ${subscriptionId} is not active or not found. Skipping booking generation.`);
      return;
    }

    const now = new Date();
    // Ensure we only generate if nextGenerationDate is in the past or very near future
    if (subscription.nextGenerationDate > now && Math.abs(subscription.nextGenerationDate.getTime() - now.getTime()) > (1000 * 60 * 60 * 24)) { // 24 hours leeway
        console.warn(`Booking for subscription ${subscriptionId} not due yet. Next generation: ${subscription.nextGenerationDate}`);
        return;
    }

    // Calculate the scheduled date for the new booking
    // For simplicity, we'll use nextGenerationDate. In a real app, you'd calculate based on frequency and last booking.
    const scheduledDate = new Date(subscription.nextGenerationDate);

    // Create a new booking
    const newBooking = await this.bookingsService.createBookingFromSubscription({
      clientId: subscription.clientId,
      providerId: subscription.providerId,
      providerServiceId: subscription.providerServiceId,
      scheduledDate: scheduledDate.toISOString(), // Pass as ISO string
      totalPrice: subscription.totalPrice.toNumber(), // Convert Decimal to number
      subscriptionId: subscription.id,
      // Any other default booking fields
    });

    // Update nextGenerationDate for the subscription
    const nextDate = this.calculateNextGenerationDate(scheduledDate, subscription.frequency);
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        nextGenerationDate: nextDate,
        // Optionally, increment a counter or add to a history of generated bookings
      },
    });

    console.log(`Generated booking ${newBooking.id} for subscription ${subscriptionId}. Next generation scheduled for ${nextDate.toISOString()}`);

    // Re-schedule the job for the next generation
    await this.scheduleNextBookingGeneration(subscriptionId, nextDate, subscription.frequency);

    // Trigger recurring payment for this booking
    await this.paymentsService.processRecurringPayment(subscription.clientId, subscription.id, newBooking.id, subscription.totalPrice.toNumber());

    return newBooking;
  }

  private calculateNextGenerationDate(currentDate: Date, frequency: SubscriptionFrequency): Date {
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

  private async scheduleNextBookingGeneration(subscriptionId: string, nextGenerationDate: Date, frequency: SubscriptionFrequency) {
    // Remove any existing jobs for this subscription to prevent duplicates
    await this.queuesService.removeJob(`subscription-generation-${subscriptionId}`);

    // Calculate delay in milliseconds
    const delay = nextGenerationDate.getTime() - new Date().getTime();
    if (delay < 0) {
        // If the date is in the past (e.g., due to immediate generation or missed job),
        // schedule it for a very short delay to process it ASAP.
        // Or, handle it as an immediate job.
        console.warn(`Next generation date for ${subscriptionId} is in the past. Scheduling for immediate processing.`);
        await this.queuesService.addJob('subscription-generation', { subscriptionId }, {
            jobId: `subscription-generation-${subscriptionId}`,
            delay: 1000, // 1 second delay
            removeOnComplete: true,
            removeOnFail: true,
        });
    } else {
        await this.queuesService.addJob('subscription-generation', { subscriptionId }, {
            jobId: `subscription-generation-${subscriptionId}`,
            delay,
            removeOnComplete: true,
            removeOnFail: true,
        });
    }
    console.log(`Scheduled next booking generation for subscription ${subscriptionId} at ${nextGenerationDate.toISOString()}`);
  }

  private async cancelFutureRecurringBookings(subscriptionId: string) {
    // Remove the scheduled job from the queue
    await this.queuesService.removeJob(`subscription-generation-${subscriptionId}`);

    // Optionally, cancel any bookings that were already generated but are still in a 'pending' or 'scheduled' state
    // This depends on your booking lifecycle.
    // await this.prisma.booking.updateMany({
    //   where: {
    //     subscriptionId: subscriptionId,
    //     status: { in: ['PENDING', 'SCHEDULED'] }, // adjust statuses as needed
    //     scheduledDate: { gt: new Date() }, // only future bookings
    //   },
    //   data: {
    //     status: 'CANCELED_BY_SUBSCRIPTION',
    //   },
    // });
    console.log(`Cancelled future booking generations and potentially future bookings for subscription ${subscriptionId}.`);
  }
}