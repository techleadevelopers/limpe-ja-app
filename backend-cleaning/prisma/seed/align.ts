// Additional alignment seed that complements the main seed.ts without changing it
import {
  PrismaClient,
  Prisma,
  UserRole,
  TransactionType,
  PaymentIntentStatus,
  PixKeyType,
  LedgerEntryType,
  PayoutStatus,
  SupportTicketCategory,
  DisputeReason,
  DisputeStatus,
  CouponType,
  CouponTarget,
  CouponStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function getSeedUsers() {
  const clientUser = await prisma.user.findUnique({ where: { email: 'indicador@teste.com' } });
  const providerUser = await prisma.user.findUnique({ where: { email: 'provedor@teste.com' } });
  if (!clientUser || !providerUser) {
    throw new Error('Seed alignment: expected users not found (indicador@teste.com / provedor@teste.com).');
  }
  const client = await prisma.client.findUnique({ where: { userId: clientUser.id } });
  const provider = await prisma.provider.findUnique({ where: { userId: providerUser.id } });
  if (!client || !provider) {
    throw new Error('Seed alignment: expected client/provider profiles not found.');
  }
  return { clientUser, providerUser, client, provider };
}

async function getLatestBookingBetween(clientId: string, providerId: string) {
  const b = await prisma.booking.findFirst({
    where: { clientId, providerId },
    orderBy: { createdAt: 'desc' },
  });
  if (!b) throw new Error('Seed alignment: no booking found between client and provider.');
  return b;
}

async function ensurePaymentsStack(bookingId: string, providerUserId: string, providerId: string) {
  await prisma.paymentIntent.upsert({
    where: { bookingId },
    update: {
      status: PaymentIntentStatus.PAID,
      qrCodeUrl: 'https://example.com/qr/BOOK',
      qrCodeText: '000201...seed',
    },
    create: {
      bookingId,
      amountCents: 15000,
      status: PaymentIntentStatus.PAID,
      gateway: 'PAGSEGURO_PIX',
      externalRef: 'SEED-PI-LATEST',
      idempotencyKey: 'seed-pi-latest',
      qrCodeUrl: 'https://example.com/qr/BOOK',
      qrCodeText: '000201...seed',
    },
  });

  await prisma.transaction.upsert({
    where: { id: 'TXN-SEED-LATEST' },
    update: {
      providerId,
      amount: new Prisma.Decimal(150.0),
      type: TransactionType.PAYMENT,
      status: 'PAID',
      description: 'Pagamento PIX (seed alignment)',
      bookingId,
      gatewayTransactionId: 'GATEWAY-TXN-SEED-LATEST',
      pixKeyType: PixKeyType.EMAIL,
      pixKey: 'provider.pix@example.com',
    },
    create: {
      id: 'TXN-SEED-LATEST',
      providerId,
      amount: new Prisma.Decimal(150.0),
      type: TransactionType.PAYMENT,
      status: 'PAID',
      description: 'Pagamento PIX (seed alignment)',
      bookingId,
      gatewayTransactionId: 'GATEWAY-TXN-SEED-LATEST',
      pixKeyType: PixKeyType.EMAIL,
      pixKey: 'provider.pix@example.com',
    },
  });

  await prisma.ledgerEntry.upsert({
    where: { id: 'LEDGER-SEED-1' },
    update: {
      userId: providerUserId,
      bookingId,
      amount: new Prisma.Decimal(120.0),
      type: LedgerEntryType.EARNING,
      note: 'Earning from booking (seed alignment)',
    },
    create: {
      id: 'LEDGER-SEED-1',
      userId: providerUserId,
      bookingId,
      amount: new Prisma.Decimal(120.0),
      type: LedgerEntryType.EARNING,
      note: 'Earning from booking (seed alignment)',
    },
  });

  await prisma.ledgerEntry.upsert({
    where: { id: 'LEDGER-SEED-2' },
    update: {
      userId: providerUserId,
      bookingId,
      amount: new Prisma.Decimal(-30.0),
      type: LedgerEntryType.FEE,
      note: 'Platform commission (seed alignment)',
    },
    create: {
      id: 'LEDGER-SEED-2',
      userId: providerUserId,
      bookingId,
      amount: new Prisma.Decimal(-30.0),
      type: LedgerEntryType.FEE,
      note: 'Platform commission (seed alignment)',
    },
  });

  await prisma.payout.upsert({
    where: { id: 'PAYOUT-SEED-001' },
    update: {
      userId: providerUserId,
      amount: new Prisma.Decimal(90.0),
      status: PayoutStatus.PAID,
      gatewayTxnId: 'PSP-PAYOUT-SEED-001',
      idempotencyKey: 'seed-payout-001',
    },
    create: {
      id: 'PAYOUT-SEED-001',
      userId: providerUserId,
      amount: new Prisma.Decimal(90.0),
      status: PayoutStatus.PAID,
      gatewayTxnId: 'PSP-PAYOUT-SEED-001',
      idempotencyKey: 'seed-payout-001',
    },
  });
}

async function ensureSupport(clientUserId: string) {
  await prisma.supportTicket.upsert({
    where: { id: 'SUP-001' },
    update: {
      userId: clientUserId,
      role: UserRole.CLIENT,
      subject: 'Dúvida sobre o serviço',
      category: SupportTicketCategory.QUALITY,
      description: 'Percebi um problema durante a limpeza. Poderiam ajudar?',
    },
    create: {
      id: 'SUP-001',
      userId: clientUserId,
      role: UserRole.CLIENT,
      subject: 'Dúvida sobre o serviço',
      category: SupportTicketCategory.QUALITY,
      description: 'Percebi um problema durante a limpeza. Poderiam ajudar?',
    },
  });

  await prisma.supportMessage.upsert({
    where: { id: 'SUPMSG-001' },
    update: {
      ticketId: 'SUP-001',
      userId: clientUserId,
      role: UserRole.CLIENT,
      body: 'Olá, preciso de suporte no meu pedido.',
      attachments: [],
    },
    create: {
      id: 'SUPMSG-001',
      ticketId: 'SUP-001',
      userId: clientUserId,
      role: UserRole.CLIENT,
      body: 'Olá, preciso de suporte no meu pedido.',
      attachments: [],
    },
  });
}

async function ensureEngagement(clientUserId: string, providerUserId: string) {
  // Safe path: create/find chat without violating unique, then create message
  const existingChat = await prisma.chat.findFirst({
    where: {
      OR: [
        { participant1Id: clientUserId, participant2Id: providerUserId },
        { participant1Id: providerUserId, participant2Id: clientUserId },
      ],
    },
  });

  let chatId: string;
  if (existingChat) {
    chatId = existingChat.id;
  } else {
    const chatById = await prisma.chat.findUnique({ where: { id: 'CHAT-001' } }).catch(() => null as any);
    if (chatById && (chatById.participant1Id !== clientUserId || chatById.participant2Id !== providerUserId)) {
      const created = await prisma.chat.create({ data: { participant1Id: clientUserId, participant2Id: providerUserId } });
      chatId = created.id;
    } else if (chatById) {
      chatId = chatById.id;
    } else {
      const created = await prisma.chat.create({ data: { id: 'CHAT-001', participant1Id: clientUserId, participant2Id: providerUserId } });
      chatId = created.id;
    }
  }

  await prisma.message.upsert({
    where: { id: 'MSG-001' },
    update: {
      chatId,
      senderId: clientUserId,
      receiverId: providerUserId,
      content: 'Oi! Podemos alinhar os detalhes do servi��o? (seed)',
      timestamp: new Date(),
      isRead: false,
    },
    create: {
      id: 'MSG-001',
      chatId,
      senderId: clientUserId,
      receiverId: providerUserId,
      content: 'Oi! Podemos alinhar os detalhes do servi��o? (seed)',
      timestamp: new Date(),
      isRead: false,
    },
  });

  return;
  // Chat and message
  await prisma.chat.upsert({
    where: { id: 'CHAT-001' },
    update: { participant1Id: clientUserId, participant2Id: providerUserId },
    create: { id: 'CHAT-001', participant1Id: clientUserId, participant2Id: providerUserId },
  });

  await prisma.message.upsert({
    where: { id: 'MSG-001' },
    update: {
      chatId: 'CHAT-001',
      senderId: clientUserId,
      receiverId: providerUserId,
      content: 'Oi! Podemos alinhar os detalhes do serviço? (seed)',
      timestamp: new Date(),
      isRead: false,
    },
    create: {
      id: 'MSG-001',
      chatId: 'CHAT-001',
      senderId: clientUserId,
      receiverId: providerUserId,
      content: 'Oi! Podemos alinhar os detalhes do serviço? (seed)',
      timestamp: new Date(),
      isRead: false,
    },
  });

  await prisma.notification.upsert({
    where: { id: 'NOTIF-SEED-001' },
    update: {
      userId: clientUserId,
      type: 'BOOKING_UPDATE',
      message: 'Seu agendamento teve uma atualização (seed)'.slice(0, 255),
      isRead: false,
      targetUrl: '/bookings',
    },
    create: {
      id: 'NOTIF-SEED-001',
      userId: clientUserId,
      type: 'BOOKING_UPDATE',
      message: 'Seu agendamento teve uma atualização (seed)'.slice(0, 255),
      isRead: false,
      targetUrl: '/bookings',
    },
  });
}

async function ensurePostBookingArtifacts(bookingId: string, clientUserId: string, clientId: string, providerId: string) {
  // Review
  await prisma.review.upsert({
    where: { bookingId },
    update: { rating: 5, comment: 'Excelente serviço! (seed)' },
    create: { bookingId, clientId, providerId, rating: 5, comment: 'Excelente serviço! (seed)' },
  });

  // Dispute (pending)
  await prisma.dispute.upsert({
    where: { bookingId },
    update: {
      reporterUserId: clientUserId,
      reason: DisputeReason.QUALITY_ISSUES,
      description: 'Houve uma questão de qualidade durante o serviço (seed)'.slice(0, 255),
      status: DisputeStatus.PENDING,
      attachments: [],
    },
    create: {
      bookingId,
      reporterUserId: clientUserId,
      reason: DisputeReason.QUALITY_ISSUES,
      description: 'Houve uma questão de qualidade durante o serviço (seed)'.slice(0, 255),
      status: DisputeStatus.PENDING,
      attachments: [],
    },
  });
}

async function ensureOperationalData(providerId: string, clientUserId: string) {
  // Availability (Mon-Fri 09:00-17:00)
  for (const dow of [1, 2, 3, 4, 5]) {
    await prisma.availability.upsert({
      where: { id: `AV-${dow}` },
      update: { providerId, dayOfWeek: dow, startTime: '09:00', endTime: '17:00', isAvailable: true },
      create: { id: `AV-${dow}`, providerId, dayOfWeek: dow, startTime: '09:00', endTime: '17:00', isAvailable: true },
    });
  }

  // Pricing rule
  await prisma.pricingRule.upsert({
    where: { id: 'PRC-SEED-001' },
    update: { surgeFactor: new Prisma.Decimal(1.2), isActive: true },
    create: { id: 'PRC-SEED-001', surgeFactor: new Prisma.Decimal(1.2), isActive: true },
  });

  // General coupon (10% off)
  const now = new Date();
  const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {
      description: '10% OFF (seed)',
      value: new Prisma.Decimal(10),
      valueType: CouponType.PERCENT,
      target: CouponTarget.GENERAL,
      validFrom: now,
      validUntil,
      status: CouponStatus.ACTIVE,
      firstBookingOnly: false,
    },
    create: {
      code: 'WELCOME10',
      description: '10% OFF (seed)',
      value: new Prisma.Decimal(10),
      valueType: CouponType.PERCENT,
      target: CouponTarget.GENERAL,
      validFrom: now,
      validUntil,
      status: CouponStatus.ACTIVE,
      firstBookingOnly: false,
      usesCount: 0,
    },
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('[align] Abort in production.');
    return;
  }

  const { clientUser, providerUser, client, provider } = await getSeedUsers();

  // Ensure provider pix key exists
  await prisma.provider.update({
    where: { id: provider.id },
    data: { pixKey: provider.pixKey ?? 'provider.pix@example.com' },
  });

  const booking = await getLatestBookingBetween(client.id, provider.id);

  await ensurePaymentsStack(booking.id, providerUser.id, provider.id);
  await ensureSupport(clientUser.id);
  await ensureEngagement(clientUser.id, providerUser.id);
  await ensurePostBookingArtifacts(booking.id, clientUser.id, client.id, provider.id);
  await ensureOperationalData(provider.id, clientUser.id);

  // Attach coupon to booking if none
  const existingUsage = await prisma.couponUsage.findUnique({ where: { bookingId: booking.id } });
  if (!existingUsage) {
    const coupon = await prisma.coupon.findUnique({ where: { code: 'WELCOME10' } });
    if (coupon) {
      await prisma.booking.update({ where: { id: booking.id }, data: { couponId: coupon.id } });
      await prisma.couponUsage.create({
        data: {
          coupon: { connect: { id: coupon.id } },
          user: { connect: { id: clientUser.id } },
          booking: { connect: { id: booking.id } },
          appliedValue: new Prisma.Decimal(15.0),
        },
      });
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usesCount: { increment: 1 } as any } });
    }
  }

  console.log('[align] Seed alignment done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
