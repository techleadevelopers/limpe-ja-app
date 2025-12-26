import { PrismaService } from '../../src/prisma/prisma.service';
import {
  Address,
  Booking,
  BookingStatus,
  Client,
  Mission,
  MissionAudience,
  MissionKind,
  PaymentIntent,
  PaymentIntentStatus,
  Prisma,
  Provider,
  ProviderService,
  RewardType,
  Service,
  User,
  UserRole,
  VerificationStatus,
} from '@prisma/client';

export interface SeededEntities {
  clientUser: User;
  client: Client;
  clientAddress: Address;
  providerUser: User;
  provider: Provider;
  providerService: ProviderService;
  service: Service;
  mission: Mission;
}

const tablesToTruncate = [
  '"MissionEvent"',
  '"MissionProgress"',
  '"Mission"',
  '"LedgerEntry"',
  '"Payout"',
  '"PaymentEvent"',
  '"PaymentIntent"',
  '"Booking"',
  '"Transaction"',
  '"ProviderService"',
  '"ProviderPromotion"',
  '"Provider"',
  '"Client"',
  '"User"',
  '"Address"',
  '"Service"',
  '"Coupon"',
  '"CouponUsage"',
  '"CouponReservation"',
];

export async function cleanDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tablesToTruncate.join(', ')} RESTART IDENTITY CASCADE;`,
  );
}

const baseAddressPayload = {
  cep: '01311100',
  street: 'Avenida Paulista',
  number: '1000',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  latitude: -23.561414,
  longitude: -46.656476,
};

export async function seedBaseEntities(prisma: PrismaService): Promise<SeededEntities> {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const clientUser = await prisma.user.create({
    data: {
      email: `e2e.client.${suffix}@example.com`,
      fullName: 'Client E2E',
      role: UserRole.CLIENT,
      passwordHash: 'test-password',
    },
  });

  const client = await prisma.client.create({
    data: {
      userId: clientUser.id,
      fullName: 'Client E2E',
      phone: '+5511999990000',
    },
  });

  const clientAddress = await prisma.address.create({
    data: {
      ...baseAddressPayload,
      clientId: client.id,
      complement: 'Apto 101',
    },
  });

  const providerUser = await prisma.user.create({
    data: {
      email: `e2e.provider.${suffix}@example.com`,
      fullName: 'Provider E2E',
      role: UserRole.PROVIDER,
      passwordHash: 'test-password',
    },
  });

  const provider = await prisma.provider.create({
    data: {
      userId: providerUser.id,
      fullName: 'Provider E2E',
      verificationStatus: VerificationStatus.APPROVED,
    },
  });

  const service = await prisma.service.create({
    data: {
      name: `E2E Service ${suffix}`,
      description: 'Test service',
      price: new Prisma.Decimal(120),
    },
  });

  const providerService = await prisma.providerService.create({
    data: {
      providerId: provider.id,
      serviceId: service.id,
      durationMinutes: 60,
      price: new Prisma.Decimal(120),
      pricingType: 'FIXED_PRICE',
    },
  });

  const mission = await prisma.mission.create({
    data: {
      code: `booking.completed.${suffix}`,
      title: 'Booking Completed',
      description: 'Award points when a booking is completed.',
      audience: MissionAudience.CLIENT,
      kind: MissionKind.COUNT_EVENT,
      eventName: 'booking.completed',
      targetValue: 1,
      rewardType: RewardType.POINTS,
      rewardValue: 10,
    },
  });

  return {
    clientUser,
    client,
    clientAddress,
    providerUser,
    provider,
    providerService,
    service,
    mission,
  };
}

export async function createAdditionalProvider(prisma: PrismaService) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const user = await prisma.user.create({
    data: {
      email: `e2e.other.${suffix}@example.com`,
      fullName: 'Other Provider',
      role: UserRole.PROVIDER,
      passwordHash: 'test-password',
    },
  });
  const provider = await prisma.provider.create({
    data: {
      userId: user.id,
      fullName: 'Other Provider',
      verificationStatus: VerificationStatus.APPROVED,
    },
  });
  return { user, provider };
}

export async function createBooking(
  prisma: PrismaService,
  options: {
    clientId: string;
    providerId: string;
    providerServiceId: string;
    status?: BookingStatus;
    scheduledStart?: Date;
    durationMinutes?: number;
    paymentStatus?: PaymentIntentStatus;
    totalPrice?: number;
  },
): Promise<{ booking: Booking; paymentIntent: PaymentIntent }> {
  const scheduledStart = options.scheduledStart ?? new Date();
  const durationMinutes = options.durationMinutes ?? 60;
  const baseDate = new Date(scheduledStart);
  baseDate.setHours(0, 0, 0, 0);
  const scheduledTime = `${String(scheduledStart.getHours()).padStart(2, '0')}:${String(
    scheduledStart.getMinutes(),
  ).padStart(2, '0')}`;

  const booking = await prisma.booking.create({
    data: {
      clientId: options.clientId,
      providerId: options.providerId,
      providerServiceId: options.providerServiceId,
      scheduledDate: baseDate,
      scheduledTime,
      scheduledStart,
      scheduledEnd: new Date(scheduledStart.getTime() + durationMinutes * 60000),
      durationMinutes,
      totalPrice: new Prisma.Decimal(options.totalPrice ?? 120),
      status: options.status ?? BookingStatus.ARRIVED,
      notes: 'E2E booking',
    },
  });

  const paymentIntent = await prisma.paymentIntent.create({
    data: {
      bookingId: booking.id,
      amountCents: Math.round((options.totalPrice ?? 120) * 100),
      status: options.paymentStatus ?? PaymentIntentStatus.PAID,
      externalRef: `e2e-${booking.id}`,
    },
  });

  return { booking, paymentIntent };
}
