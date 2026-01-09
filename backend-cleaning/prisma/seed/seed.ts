// seed.ts
import { PrismaClient, UserRole, Prisma, VerificationStatus, BookingStatus, TransactionType, CouponType, CouponTarget, CouponStatus, MissionAudience, MissionKind, RewardType, MissionStatus, LoyaltyTransactionType, OfferTarget, OfferStatus, SupportTicketStatus, SupportTicketCategory, DisputeReason, DisputeStatus, IncidentType, IncidentStatus, SubscriptionFrequency, SubscriptionStatus, ClaimStatus, PaymentIntentStatus, PixKeyType, LedgerEntryType, PayoutStatus, Service, // Importado para tipagem de createdServices
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { assertTestDatabaseUrl } from '../../scripts/assert-test-env';
import { calculateScheduledAtInSaoPaulo } from '../../src/bookings/booking-time.utils';

const testDatabaseUrl = process.env.DATABASE_URL;
assertTestDatabaseUrl(testDatabaseUrl);
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDatabaseUrl,
    },
  },
});

// Helper para adicionar dias a uma data
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const buildScheduledDateTime = (date: Date, time: string): Date =>
  calculateScheduledAtInSaoPaulo(date, time);

// Helper para upsert de endere?os com lat/lon
async function upsertAddress(addressData: {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude?: Prisma.Decimal | number;
  longitude?: Prisma.Decimal | number;
  complement?: string; // Adicionado para ser consistente com o modelo
}) {
  const dataToCreate = {
    ...addressData,
    latitude: addressData.latitude ? Number(addressData.latitude) : undefined,
    longitude: addressData.longitude ? Number(addressData.longitude) : undefined,
  };
  const existingAddress = await prisma.address.findFirst({
    where: {
      cep: addressData.cep,
      street: addressData.street,
      number: addressData.number,
      city: addressData.city,
      state: addressData.state,
      neighborhood: addressData.neighborhood, // Adicionado para melhor unicidade
      // Novo: considerar complement na unicidade quando fornecido, para evitar reuso entre provedores
      complement: addressData.complement,
    },
  });

  if (existingAddress) {
    return prisma.address.update({
      where: { id: existingAddress.id },
      data: dataToCreate,
    });
  } else {
    return prisma.address.create({ data: dataToCreate });
  }
}

// Helper para gerar avaliações em massa para um provedor (sem alterar lógica principal)
async function generateBulkReviews(providerUser: any, clientUser: any, residentialService: Service, numReviews: number = 100) {
  console.log(`Gerando ${numReviews} avaliações em massa para ${providerUser.fullName}...`);
  const ratingsCycle = [5, 4, 5, 4, 5, 3, 5, 4, 5, 5];
  const commentsCycle = [
    'Excelente serviço! Muito profissional e atenciosa.',
    'Muito bom, recomendo para todos.',
    'Satisfatório, bom trabalho.',
    'Poderia melhorar um pouco, mas ok.',
    'Perfeito! Deixou tudo impecável.',
    'Rápida e eficiente.',
    'Atendeu bem as expectativas.',
    'Ótimo custo-benefício.',
    'Serviço de qualidade.',
    'Recomendo sem hesitar.'
  ];

  // Encontrar ou criar ProviderService para o serviço residencial (FIXED_PRICE, se existir; senão, qualquer)
  const providerService = await prisma.providerService.findUnique({
    where: {
      providerId_serviceId: {
        providerId: providerUser.provider.id,
        serviceId: residentialService.id,
      },
    },
  });
  if (!providerService) {
    console.warn(`ProviderService não encontrado para ${providerUser.fullName}. Pulando geração de reviews.`);
    return;
  }

  let createdCount = 0;
  for (let i = 1; i <= numReviews; i++) {
    const pastDate = addDays(new Date(), - (i * 3 + Math.floor(Math.random() * 30))); // Datas passadas espaçadas e variadas
    const bookingId = `BKG-BULK-${providerUser.fullName.replace(' ', '').toUpperCase()}-${i.toString().padStart(3, '0')}`;
    const cep = `010${(i % 100).toString().padStart(2, '0')}-00${(i % 10)}`;
    const street = `Rua Avaliação Fake ${i}`;
    const number = `${(i * 10) % 1000}`;
    const uniqueAddressData = {
      cep,
      street,
      number,
      neighborhood: `Bairro Fake ${i % 5}`,
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.55 + (i * 0.0001),
      longitude: -46.63 + (i * 0.0001),
      complement: bookingId,
    };
    const address = await upsertAddress(uniqueAddressData);
    const selectedTimeSlot = ['09:00', '10:00', '14:00', '16:00'][Math.floor(Math.random() * 4)];

    const booking = await prisma.booking.upsert({
      where: { id: bookingId },
      update: {
        clientId: clientUser.client.id,
        providerId: providerUser.provider.id,
        providerServiceId: providerService.id,
        scheduledDate: pastDate,
        scheduledTime: buildScheduledDateTime(pastDate, selectedTimeSlot),
        status: BookingStatus.FINISHED,
        totalPrice: new Prisma.Decimal((150 + Math.floor(Math.random() * 100)).toFixed(2)), // Variação de preço
        addressId: address.id,
        notes: `Avaliação em massa ${i} para ${providerUser.fullName}.`,
      },
      create: {
        id: bookingId,
        clientId: clientUser.client.id,
        providerId: providerUser.provider.id,
        providerServiceId: providerService.id,
        scheduledDate: pastDate,
        scheduledTime: buildScheduledDateTime(pastDate, selectedTimeSlot),
        status: BookingStatus.FINISHED,
        totalPrice: new Prisma.Decimal((150 + Math.floor(Math.random() * 100)).toFixed(2)),
        notes: `Avaliação em massa ${i} para ${providerUser.fullName}.`,
        addressId: address.id,
      },
    });

    // PaymentIntent (PAID)
    await prisma.paymentIntent.upsert({
      where: { bookingId: booking.id },
      update: {
        status: PaymentIntentStatus.PAID,
        amountCents: booking.totalPrice.mul(100).toNumber(),
      },
      create: {
        bookingId: booking.id,
        status: PaymentIntentStatus.PAID,
        amountCents: booking.totalPrice.mul(100).toNumber(),
        gateway: 'PIX_SIMULADO_BULK',
        externalRef: `PIX-BULK-${bookingId}`,
        idempotencyKey: `IDEMPOTENCY-BULK-${bookingId}`,
        createdAt: pastDate,
      },
    });

    // Transaction (COMPLETED)
    await prisma.transaction.upsert({
      where: { gatewayTransactionId: `TRANS-BULK-${bookingId}` },
      update: {
        providerId: booking.providerId,
        amount: booking.totalPrice,
        type: TransactionType.PAYMENT,
         status: 'COMPLETED',
        description: `Pagamento bulk para ${bookingId}`,
        bookingId: booking.id,
      },
      create: {
        providerId: booking.providerId,
        amount: booking.totalPrice,
        type: TransactionType.PAYMENT,
         status: 'COMPLETED',
        description: `Pagamento bulk para ${bookingId}`,
        bookingId: booking.id,
        gatewayTransactionId: `TRANS-BULK-${bookingId}`,
        createdAt: pastDate,
      },
    });

    // Review
    const rating = ratingsCycle[i % ratingsCycle.length];
    const comment = commentsCycle[Math.floor(i % commentsCycle.length)];
    await prisma.review.upsert({
      where: { bookingId: booking.id },
      update: {
        rating,
        comment: `${comment} (Bulk ${i})`,
        clientId: clientUser.client.id,
        providerId: providerUser.provider.id,
      },
      create: {
        bookingId: booking.id,
        clientId: clientUser.client.id,
        providerId: providerUser.provider.id,
        rating,
        comment: `${comment} (Bulk ${i})`,
      },
    });

    createdCount++;
  }
  console.log(`? ${createdCount} avaliações geradas para ${providerUser.fullName}.`);
}

export async function main() {
  console.log('Iniciando o processo de seed...');

  // -----------------------------------------------------------------------------
  // Guard-rail
  if (process.env.NODE_ENV === 'production') {
    console.log('Seed bloqueado em produção. Abortando.');
    return;
  }

  const pwd = await bcrypt.hash('12345678', 10);
  const now = new Date();

  // -----------------------------------------------------------------------------
  // 1) USUÁRIOS E PERFIS (ADMIN, CLIENTES, PROVEDORES)
  console.log('Criando/Atualizando usuários e perfis...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@limpeja.app' },
    update: { passwordHash: pwd, role: UserRole.ADMIN, fullName: 'Admin LimpeJá' },
    create: {
      email: 'admin@limpeja.app',
      passwordHash: pwd,
      role: UserRole.ADMIN,
      fullName: 'Admin LimpeJá',
    },
  });
  console.log(`Usuário Admin '${adminUser.email}' criado/atualizado.`);

  const referrerAddress = await upsertAddress({
    cep: '01000000',
    street: 'Rua do Indicador',
    number: '100',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.55,
    longitude: -46.63,
  });

  const referrerUser = await prisma.user.upsert({
    where: { email: 'indicador@teste.com' },
    update: { passwordHash: pwd, role: UserRole.CLIENT, fullName: 'Cliente Indicador' },
    create: {
      email: 'indicador@teste.com',
      passwordHash: pwd,
      role: UserRole.CLIENT,
      fullName: 'Cliente Indicador',
      client: {
        create: {
          fullName: 'Cliente Indicador',
          phone: '11999999999',
          address: { connect: { id: referrerAddress.id } },
        },
      },
    },
    include: { client: true },
  });
  console.log(`Usuário Cliente 'Indicador' (${referrerUser.email}) criado/atualizado.`);

  const referredAddress = await upsertAddress({
    cep: '01001001',
    street: 'Rua do Indicado',
    number: '200',
    neighborhood: 'Vila Nova',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.56,
    longitude: -46.64,
  });

  const referredUser = await prisma.user.upsert({
    where: { email: 'indicado@teste.com' },
    update: { passwordHash: pwd, role: UserRole.CLIENT, fullName: 'Cliente Indicado' },
    create: {
      email: 'indicado@teste.com',
      passwordHash: pwd,
      role: UserRole.CLIENT,
      fullName: 'Cliente Indicado',
      client: {
        create: {
          fullName: 'Cliente Indicado',
          phone: '11988888888',
          address: { connect: { id: referredAddress.id } },
        },
      },
    },
    include: { client: true },
  });
  console.log(`Usuário Cliente 'Indicado' (${referredUser.email}) criado/atualizado.`);

  // Existing Provider: Caroline Silva (LINK CORRIGIDO)
  const providerAddress = await upsertAddress({
    cep: '01002-002',
    street: 'Av. do Provedor',
    number: '300',
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.57,
    longitude: -46.65,
  });

  const providerUser = await prisma.user.upsert({
    where: { email: 'provedor@teste.com' },
    update: { 
      passwordHash: pwd, 
      role: UserRole.PROVIDER, 
      fullName: 'Caroline Silva',
      provider: {
        update: {
          pixKeyMasked: 'caro****@email.com',
          avatarUrl: 'https://randomuser.me/api/portraits/women/6.jpg',
        }
      }
    },
    create: {
      email: 'provedor@teste.com',
      passwordHash: pwd,
      role: UserRole.PROVIDER,
      fullName: 'Caroline Silva',
      provider: {
        create: {
          fullName: 'Caroline Silva',
          yearsOfExperience: 5,
          verificationStatus: VerificationStatus.APPROVED,
          acceptanceRate: 94,
          averageResponseTime: 25, // Em minutos, conforme schema.prisma
          bio: 'Provedora experiente e dedicada a um servi?o de qualidade.',
          pixKey: 'carolina.pix@email.com',
          pixKeyMasked: 'caro****@email.com',
          address: { connect: { id: providerAddress.id } },
          dateOfBirth: new Date('1985-01-15'),
          cpf: '000.000.000-00',
          phone: '11977777777',
          avatarUrl: 'https://randomuser.me/api/portraits/women/6.jpg',
        },
      },
    },
    include: { provider: true },
  });
  console.log(`Usuário Provedor 'Caroline Silva' (${providerUser.email}) criado/atualizado.`);

  // Initial balance injection for the main provider (Caroline Silva) for withdrawal testing
  if (providerUser.provider) {
    const initialBalanceTransactionRef = 'INITIAL_BALANCE_INJECTION_CAROLINE';
    const initialTransaction = await prisma.transaction.upsert({
      where: { gatewayTransactionId: initialBalanceTransactionRef },
      update: {
        amount: new Prisma.Decimal(200.00),
         status: 'COMPLETED',
        description: 'Saldo inicial injetado para teste de saque',
        gatewayTransactionId: initialBalanceTransactionRef,
      },
      create: {
        providerId: providerUser.provider.id,
        amount: new Prisma.Decimal(200.00),
        type: TransactionType.PAYMENT,
         status: 'COMPLETED',
        description: 'Saldo inicial injetado para teste de saque',
        transactionRef: initialBalanceTransactionRef,
        gatewayTransactionId: initialBalanceTransactionRef,
        createdAt: new Date(),
      },
    });
    console.log(`Transação de saldo inicial para ${providerUser.fullName} criada/atualizada. ID: ${initialTransaction.id}`);
  } else {
    console.warn(`Provider profile not found for ${providerUser.fullName}. Cannot inject initial balance.`);
  }

  // NEW PROVIDER 1: Maria (LINK CORRIGIDO)
  const providerAddress2 = await upsertAddress({
    cep: '01002-003',
    street: 'Rua das Flores',
    number: '45',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.56,
    longitude: -46.68,
  });

  const providerUser2 = await prisma.user.upsert({
    where: { email: 'provedor2@teste.com' },
    update: { 
      passwordHash: pwd, 
      role: UserRole.PROVIDER, 
      fullName: 'Maria',
      provider: {
        update: {
          pixKeyMasked: 'mari****@email.com',
          avatarUrl: 'https://randomuser.me/api/portraits/women/7.jpg',
        }
      }
    },
    create: {
      email: 'provedor2@teste.com',
      passwordHash: pwd,
      role: UserRole.PROVIDER,
      fullName: 'Maria',
      provider: {
        create: {
          fullName: 'Maria',
          yearsOfExperience: 3,
          verificationStatus: VerificationStatus.APPROVED,
          acceptanceRate: 94,
          averageResponseTime: 25,
          bio: 'Limpeza eficiente e com carinho, cuidando do seu lar como se fosse meu.',
          pixKey: 'maria.pix@email.com',
          pixKeyMasked: 'mari****@email.com',
          address: { connect: { id: providerAddress2.id } },
          dateOfBirth: new Date('1990-03-20'),
          cpf: '111.111.111-11',
          phone: '11966666666',
          avatarUrl: 'https://randomuser.me/api/portraits/women/7.jpg',
        },
      },
    },
    include: { provider: true },
  });
  console.log(`Usuário Provedor 'Maria' (${providerUser2.email}) criado/atualizado.`);

  // NEW PROVIDER 2: Joana (LINK CORRIGIDO DO CACHORRO)
  const providerAddress3 = await upsertAddress({
    cep: '01002-004',
    street: 'Av. Paulista',
    number: '1500',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.561,
    longitude: -46.656,
  });

  const providerUser3 = await prisma.user.upsert({
    where: { email: 'provedor3@teste.com' },
    update: { 
      passwordHash: pwd, 
      role: UserRole.PROVIDER, 
      fullName: 'Joana',
      provider: {
        update: {
          pixKeyMasked: 'joan****@email.com',
          avatarUrl: 'https://randomuser.me/api/portraits/women/8.jpg',
        }
      }
    },
    create: {
      email: 'provedor3@teste.com',
      passwordHash: pwd,
      role: UserRole.PROVIDER,
      fullName: 'Joana',
      provider: {
        create: {
          fullName: 'Joana',
          yearsOfExperience: 7,
          verificationStatus: VerificationStatus.APPROVED,
          acceptanceRate: 94,
          averageResponseTime: 25,
          bio: 'Especialista em limpeza profunda e organiza??o de ambientes.',
          pixKey: 'joana.pix@email.com',
          pixKeyMasked: 'joan****@email.com',
          address: { connect: { id: providerAddress3.id } },
          dateOfBirth: new Date('1980-07-01'),
          cpf: '222.222.222-22',
          phone: '11955555555',
          avatarUrl: 'https://randomuser.me/api/portraits/women/8.jpg',
        },
      },
    },
    include: { provider: true },
  });
  console.log(`Usuário Provedor 'Joana' (${providerUser3.email}) criado/atualizado.`);

  // NEW PROVIDER 3: Ana (LINK CORRIGIDO DO CÉREBRO)
  const providerAddress4 = await upsertAddress({
    cep: '01002-005',
    street: 'Rua Augusta',
    number: '2000',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.555,
    longitude: -46.666,
  });

  const providerUser4 = await prisma.user.upsert({
    where: { email: 'provedor4@teste.com' },
    update: { 
      passwordHash: pwd, 
      role: UserRole.PROVIDER, 
      fullName: 'Ana',
      provider: {
        update: {
          pixKeyMasked: 'ana.****@email.com',
          avatarUrl: 'https://randomuser.me/api/portraits/women/9.jpg',
        }
      }
    },
    create: {
      email: 'provedor4@teste.com',
      passwordHash: pwd,
      role: UserRole.PROVIDER,
      fullName: 'Ana',
      provider: {
        create: {
          fullName: 'Ana',
          yearsOfExperience: 2,
          verificationStatus: VerificationStatus.APPROVED,
          acceptanceRate: 94,
          averageResponseTime: 25,
          bio: 'Dedicação e cuidado em cada detalhe para um ambiente impecável.',
          pixKey: 'ana.pix@email.com',
          pixKeyMasked: 'ana.****@email.com',
          address: { connect: { id: providerAddress4.id } },
          dateOfBirth: new Date('1995-11-11'),
          cpf: '333.333.333-33',
          phone: '11944444444',
          avatarUrl: 'https://randomuser.me/api/portraits/women/9.jpg',
        },
      },
    },
    include: { provider: true },
  });
  console.log(`Usuário Provedor 'Ana' (${providerUser4.email}) criado/atualizado.`);

  // NOVO CLIENTE PARA AVALIAR A JOANA
  const clientJoanaReviewerAddress = await upsertAddress({
    cep: '01001002',
    street: 'Rua do Avaliador',
    number: '50',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.54,
    longitude: -46.62,
  });

  const clientUserJoanaReviewer = await prisma.user.upsert({
    where: { email: 'clientjoana@teste.com' },
    update: { passwordHash: pwd, role: UserRole.CLIENT, fullName: 'Cliente Joana Reviewer' },
    create: {
      email: 'clientjoana@teste.com',
      passwordHash: pwd,
      role: UserRole.CLIENT,
      fullName: 'Cliente Joana Reviewer',
      client: {
        create: {
          fullName: 'Cliente Joana Reviewer',
          phone: '11933333333',
          address: { connect: { id: clientJoanaReviewerAddress.id } },
        },
      },
    },
    include: { client: true },
  });
  console.log(`Usuário Cliente 'Cliente Joana Reviewer' (${clientUserJoanaReviewer.email}) criado/atualizado.`);

  // Adicional: Clientes reviewers para outros provedores (para gera??o de bulk reviews)
  const clientCarolineReviewerAddress = await upsertAddress({
    cep: '01001003',
    street: 'Rua Caroline Reviewer',
    number: '60',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.541,
    longitude: -46.621,
  });

  const clientUserCarolineReviewer = await prisma.user.upsert({
    where: { email: 'clientcaroline@teste.com' },
    update: { passwordHash: pwd, role: UserRole.CLIENT, fullName: 'Cliente Caroline Reviewer' },
    create: {
      email: 'clientcaroline@teste.com',
      passwordHash: pwd,
      role: UserRole.CLIENT,
      fullName: 'Cliente Caroline Reviewer',
      client: {
        create: {
          fullName: 'Cliente Caroline Reviewer',
          phone: '11922222222',
          address: { connect: { id: clientCarolineReviewerAddress.id } },
        },
      },
    },
    include: { client: true },
  });
  console.log(`Usuário Cliente 'Cliente Caroline Reviewer' criado/atualizado.`);

  const clientMariaReviewerAddress = await upsertAddress({
    cep: '01001004',
    street: 'Rua Maria Reviewer',
    number: '70',
    neighborhood: 'Centro',
    city: 'S?o Paulo',
    state: 'SP',
    latitude: -23.542,
    longitude: -46.622,
  });

  const clientUserMariaReviewer = await prisma.user.upsert({
    where: { email: 'clientmaria@teste.com' },
    update: { passwordHash: pwd, role: UserRole.CLIENT, fullName: 'Cliente Maria Reviewer' },
    create: {
      email: 'clientmaria@teste.com',
      passwordHash: pwd,
      role: UserRole.CLIENT,
      fullName: 'Cliente Maria Reviewer',
      client: {
        create: {
          fullName: 'Cliente Maria Reviewer',
          phone: '11911111111',
          address: { connect: { id: clientMariaReviewerAddress.id } },
        },
      },
    },
    include: { client: true },
  });
  console.log(`Usu?rio Cliente 'Cliente Maria Reviewer' criado/atualizado.`);

  const clientAnaReviewerAddress = await upsertAddress({
    cep: '01001005',
    street: 'Rua Ana Reviewer',
    number: '80',
    neighborhood: 'Centro',
    city: 'S?o Paulo',
    state: 'SP',
    latitude: -23.543,
    longitude: -46.623,
  });

  const clientUserAnaReviewer = await prisma.user.upsert({
    where: { email: 'clientana@teste.com' },
    update: { passwordHash: pwd, role: UserRole.CLIENT, fullName: 'Cliente Ana Reviewer' },
    create: {
      email: 'clientana@teste.com',
      passwordHash: pwd,
      role: UserRole.CLIENT,
      fullName: 'Cliente Ana Reviewer',
      client: {
        create: {
          fullName: 'Cliente Ana Reviewer',
          phone: '11900000000',
          address: { connect: { id: clientAnaReviewerAddress.id } },
        },
      },
    },
    include: { client: true },
  });
  console.log(`Usu?rio Cliente 'Cliente Ana Reviewer' criado/atualizado.`);

  // -----------------------------------------------------------------------------
  // 2) REFERRAL CODE (para o indicador)
 console.log('Criando/Atualizando código de indicação...');

  const referralCode = await prisma.referral.upsert({
    where: { referredUserId: referredUser.id },
    update: { referrerUserId: referrerUser.id, referralCode: 'REF-TEST-001' },
    create: {
      referredUserId: referredUser.id,
      referrerUserId: referrerUser.id,
      referralCode: 'REF-TEST-001',
    },
  });
  console.log(
    `Código de Indicação 'REF-TEST-001' para ${referrerUser.fullName} (indicando ${referredUser.fullName}) criado/atualizado.`,
  );

  // -----------------------------------------------------------------------------
  // 3) CATÁLOGO DE SERVIÇOS
  console.log('Criando/Atualizando serviços...');

  const servicesData = [
    { name: 'Residencial', description: 'Limpeza completa de residências.', icon: 'residencial' },
    { name: 'Comercial', description: 'Limpeza para ambientes comerciais.', icon: 'comercial' },
    { name: 'Pós-Obra', description: 'Limpeza detalhada após reformas e construções.', icon: 'obra' },
    { name: 'Vidros', description: 'Limpeza especializada de janelas e superfícies de vidro.', icon: 'vidro' },
    { name: 'Escritório', description: 'Limpeza e organização de espaços de escritório.', icon: 'escritorio' },
    { name: 'Estofados', description: 'Limpeza e higienização de estofados.', icon: 'estofados' },
    { name: 'Passadoria', description: 'Serviço de passar roupas.', icon: 'passadoria' },
    // Novos serviços para BY_SIZE
    { name: 'Limpeza por M²', description: 'Limpeza cobrada por metro quadrado.', icon: 'area' }, // Preço por m2
    { name: 'Limpeza por Cômodo', description: 'Limpeza cobrada por número de cômodos.', icon: 'room' }, // Preço por cômodo
  ];

  const createdServices: { [key: string]: Service } = {};
  for (const serviceData of servicesData) {
    const service = await prisma.service.upsert({
      where: { name: serviceData.name },
      update: {
        description: serviceData.description,
        icon: serviceData.icon,
      },
      create: {
        name: serviceData.name,
        description: serviceData.description,
        icon: serviceData.icon,
      },
    });
    createdServices[service.name] = service;
    console.log(`Serviço '${service.name}' criado/atualizado.`);
  }

  const residentialService = createdServices['Residencial'];
  if (!residentialService) {
    throw new Error("Serviço 'Residencial' não foi criado. Verifique o catálogo e tente novamente.");
  }

  // --- OFERTAS DE SERVIÇO POR PROVEDOR (COM TODOS OS TIPOS DE PRECIFICAÇÃO) ---
  console.log('Criando/Atualizando ofertas de serviço do provedor...');

  if (!providerUser.provider || !providerUser2.provider || !providerUser3.provider || !providerUser4.provider) {
    throw new Error("Provider profiles not found. Ensure all provider users are created with their provider profiles.");
  }

  const upsertProviderServiceOffer = async ({
    providerId,
    serviceId,
    pricePerHour,
    description,
    durationMinutes,
    needsReview = false,
  }: {
    providerId: string;
    serviceId: string;
    pricePerHour: number;
    description: string;
    durationMinutes: number | null;
    needsReview?: boolean;
  }) => {
    const decimalRate = new Prisma.Decimal(pricePerHour);
    await prisma.providerService.upsert({
      where: {
        providerId_serviceId: {
          providerId,
          serviceId,
        },
      },
      update: {
        pricePerHour: decimalRate,
        needsReview,
        description,
        durationMinutes,
      },
      create: {
        provider: { connect: { id: providerId } },
        service: { connect: { id: serviceId } },
        pricePerHour: needsReview ? new Prisma.Decimal(0) : decimalRate,
        needsReview,
        description,
        durationMinutes,
      },
    });
  };

  const hourlyRates = {
    residential: 60,
    commercial: 55,
    postConstruction: 75,
  };

  const ensureHourlyServices = (
    provider: { id: string; fullName: string },
    mapping: { serviceName: string; pricePerHour: number; durationMinutes: number; description: string }[]
  ) => {
    mapping.forEach(({ serviceName, pricePerHour, durationMinutes, description }) => {
      const service = createdServices[serviceName];
      if (!service) return;
      upsertProviderServiceOffer({
        providerId: provider.id,
        serviceId: service.id,
        pricePerHour,
        durationMinutes,
        description,
      });
      console.log(`Oferta HOURLY para ${provider.fullName} (${serviceName}) criada/atualizada.`);
    });
  };

  ensureHourlyServices(providerUser.provider!, [
    { serviceName: 'Residencial', pricePerHour: hourlyRates.residential, durationMinutes: 180, description: 'Limpeza residencial completa com mínimo de 3h.' },
    { serviceName: 'Comercial', pricePerHour: hourlyRates.commercial, durationMinutes: 60, description: 'Limpeza comercial padrão por hora.' },
    { serviceName: 'Pós-Obra', pricePerHour: hourlyRates.postConstruction, durationMinutes: 240, description: 'Limpeza pós-obra com reforço de equipe.' },
  ]);

  ensureHourlyServices(providerUser2.provider!, [
    { serviceName: 'Residencial', pricePerHour: 65, durationMinutes: 180, description: 'Limpeza residencial premium até 3h.' },
    { serviceName: 'Comercial', pricePerHour: 58, durationMinutes: 60, description: 'Cobrança por hora para escritórios.' },
    { serviceName: 'Pós-Obra', pricePerHour: 78, durationMinutes: 240, description: 'Limpeza pós-obra detalhada.' },
  ]);

  ensureHourlyServices(providerUser3.provider!, [
    { serviceName: 'Residencial', pricePerHour: 62, durationMinutes: 200, description: 'Residencial com atenção extra (até 3h20m).' },
    { serviceName: 'Comercial', pricePerHour: 57, durationMinutes: 60, description: 'Limpeza comercial por hora com equipe fixa.' },
    { serviceName: 'Pós-Obra', pricePerHour: 80, durationMinutes: 240, description: 'Pós-obra com maior duração e checklist.' },
  ]);

  ensureHourlyServices(providerUser4.provider!, [
    { serviceName: 'Residencial', pricePerHour: 58, durationMinutes: 150, description: 'Limpeza residencial compacta com mínimo de 2h30.' },
    { serviceName: 'Comercial', pricePerHour: 54, durationMinutes: 60, description: 'Limpeza comercial expressa por hora.' },
    { serviceName: 'Pós-Obra', pricePerHour: 76, durationMinutes: 240, description: 'Pós-obra com equipe reduzida e atenção total.' },
  ]);

  const markBySizeNeedsReview = (provider: { id: string; fullName: string }, serviceName: string, note: string) => {
    const service = createdServices[serviceName];
    if (!service) return;
    upsertProviderServiceOffer({
      providerId: provider.id,
      serviceId: service.id,
      pricePerHour: 0,
      description: note,
      durationMinutes: null,
      needsReview: true,
    });
    console.log(`Serviço ${serviceName} de ${provider.fullName} marcado para revisão (BY_SIZE).`);
  };

  markBySizeNeedsReview(providerUser2.provider!, 'Limpeza por M²', 'Serviço por área aguardando revisão para hourly.');
  markBySizeNeedsReview(providerUser3.provider!, 'Limpeza por Cômodo', 'Serviço por cômodo aguardando revisão para hourly.');

  // Disponibilidade semanal do provedor existente (exemplo: seg/qua/sex 09:00-12:00)
  console.log('Criando/Atualizando disponibilidade do provedor...');
  const weekdays = [1, 3, 5]; // 1 = Segunda, 3 = Quarta, 5 = Sexta
  for (const wd of weekdays) {
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        providerId: providerUser.provider.id,
        dayOfWeek: wd,
      },
    });

    if (existingAvailability) {
      await prisma.availability.update({
        where: { id: existingAvailability.id },
        data: {
          startTime: '09:00',
          endTime: '18:00', // MODIFICAÇÃO: Estendendo o horário disponível para Carolina (de 12:00 para 18:00)
          isAvailable: true,
        },
      });
    } else {
      await prisma.availability.create({
        data: {
          providerId: providerUser.provider.id,
          dayOfWeek: wd,
          startTime: '09:00',
          endTime: '18:00', // MODIFICAÇÃO: Estendendo o horário disponível para Carolina (de 12:00 para 18:00)
          isAvailable: true,
        },
      });
    }
  }
  console.log(`Disponibilidade para ${providerUser.fullName} criada/atualizada.`);

  // Adicionando mais dias para Carolina
  const additionalWeekdaysForCaroline = [2, 4, 6, 7]; // Terça, Quinta, Sábado, Domingo
  for (const wd of additionalWeekdaysForCaroline) {
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        providerId: providerUser.provider.id,
        dayOfWeek: wd,
      },
    });

    if (existingAvailability) {
      await prisma.availability.update({
        where: { id: existingAvailability.id },
        data: {
          startTime: '09:00',
          endTime: '18:00', // Horário estendido
          isAvailable: true,
        },
      });
    } else {
      await prisma.availability.create({
        data: {
          providerId: providerUser.provider.id,
          dayOfWeek: wd,
          startTime: '09:00',
          endTime: '18:00', // Horário estendido
          isAvailable: true,
        },
      });
    }
  }
  console.log(`Disponibilidade adicional para ${providerUser.fullName} (mais dias) criada/atualizada.`);

  // Disponibilidade para NEW PROVIDER 1: Maria
  const weekdays2 = [2, 4]; // 2 = Terça, 4 = Quinta
  for (const wd of weekdays2) {
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        providerId: providerUser2.provider.id,
        dayOfWeek: wd,
      },
    });

    if (existingAvailability) {
      await prisma.availability.update({
        where: { id: existingAvailability.id },
        data: {
          startTime: '08:00',
          endTime: '17:00',
          isAvailable: true,
        },
      });
    } else {
      await prisma.availability.create({
        data: {
          providerId: providerUser2.provider.id,
          dayOfWeek: wd,
          startTime: '08:00',
          endTime: '17:00',
          isAvailable: true,
        },
      });
    }
  }
  console.log(`Disponibilidade para ${providerUser2.fullName} criada/atualizada.`);

  // Disponibilidade para NEW PROVIDER 2: Joana
  const weekdays3 = [1, 2, 3, 4, 5]; // Segunda a Sexta
  for (const wd of weekdays3) {
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        providerId: providerUser3.provider.id,
        dayOfWeek: wd,
      },
    });

    if (existingAvailability) {
      await prisma.availability.update({
        where: { id: existingAvailability.id },
        data: {
          startTime: '09:00',
          endTime: '20:00', // MODIFICAÇÃO: Estendendo o horário disponível para Joana (de 18:00 para 20:00)
          isAvailable: true,
        },
      });
    } else {
      await prisma.availability.create({
        data: {
          providerId: providerUser3.provider.id,
          dayOfWeek: wd,
          startTime: '09:00',
          endTime: '20:00', // MODIFICAÇÃO: Estendendo o horário disponível para Joana (de 18:00 para 20:00)
          isAvailable: true,
        },
      });
    }
  }
  console.log(`Disponibilidade para ${providerUser3.fullName} criada/atualizada.`);

  // Adicionando mais dias para Joana
  const additionalWeekdaysForJoana = [6, 7]; // Sábado e Domingo
  for (const wd of additionalWeekdaysForJoana) {
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        providerId: providerUser3.provider.id,
        dayOfWeek: wd,
      },
    });

    if (existingAvailability) {
      await prisma.availability.update({
        where: { id: existingAvailability.id },
        data: {
          startTime: '09:00',
          endTime: '20:00', // Horário estendido
          isAvailable: true,
        },
      });
    } else {
      await prisma.availability.create({
        data: {
          providerId: providerUser3.provider.id,
          dayOfWeek: wd,
          startTime: '09:00',
          endTime: '20:00', // Horário estendido
          isAvailable: true,
        },
      });
    }
  }
  console.log(`Disponibilidade adicional para ${providerUser3.fullName} (mais dias) criada/atualizada.`);

  // Disponibilidade para NEW PROVIDER 3: Ana
  const weekdays4 = [6, 7]; // Sábado e Domingo
  for (const wd of weekdays4) {
    const existingAvailability = await prisma.availability.findFirst({
      where: {
        providerId: providerUser4.provider.id,
        dayOfWeek: wd,
      },
    });

    if (existingAvailability) {
      await prisma.availability.update({
        where: { id: existingAvailability.id },
        data: {
          startTime: '09:00',
          endTime: '13:00',
          isAvailable: true,
        },
      });
    } else {
      await prisma.availability.create({
        data: {
          providerId: providerUser4.provider.id,
          dayOfWeek: wd,
          startTime: '09:00',
          endTime: '13:00',
          isAvailable: true,
        },
      });
    }
  }
  console.log(`Disponibilidade para ${providerUser4.fullName} criada/atualizada.`);

  // -----------------------------------------------------------------------------
  // 4) CUPONS
  console.log('Criando/Atualizando cupons...');

  const in14Days = addDays(now, 14);
  const in21Days = addDays(now, 21);
  const in30Days = addDays(now, 30);

  const WELCOME20 = await prisma.coupon.upsert({
    where: { code: 'WELCOME20' },
    update: {
      target: CouponTarget.NEW_CLIENTS,
      valueType: CouponType.FIXED,
      value: new Prisma.Decimal(20.00),
      maxDiscount: new Prisma.Decimal(20.00),
      firstBookingOnly: true,
      status: CouponStatus.ACTIVE,
      validUntil: in14Days,
    },
    create: {
      code: 'WELCOME20',
      description: 'Cupom de boas-vindas para novos clientes',
      target: CouponTarget.NEW_CLIENTS,
      valueType: CouponType.FIXED,
      value: new Prisma.Decimal(20.00),
      maxDiscount: new Prisma.Decimal(20.00),
      firstBookingOnly: true,
      status: CouponStatus.ACTIVE,
      validFrom: now,
      validUntil: in14Days,
    },
  });
  console.log(`Cupom 'WELCOME20' criado/atualizado.`);

  const RETORNO15 = await prisma.coupon.upsert({
    where: { code: 'RETORNO15' },
    update: {
      target: CouponTarget.REPEAT_CUSTOMER,
      valueType: CouponType.PERCENT,
      value: new Prisma.Decimal(15),
      maxDiscount: new Prisma.Decimal(40.00),
      status: CouponStatus.ACTIVE,
      validUntil: in30Days,
    },
    create: {
      code: 'RETORNO15',
      description: '15% de desconto para sua próxima reserva',
      target: CouponTarget.REPEAT_CUSTOMER,
      valueType: CouponType.PERCENT,
      value: new Prisma.Decimal(15),
      maxDiscount: new Prisma.Decimal(40.00),
      status: CouponStatus.ACTIVE,
      validFrom: now,
      validUntil: in30Days,
    },
  });
  console.log(`Cupom 'RETORNO15' criado/atualizado.`);

  const INDICADO20 = await prisma.coupon.upsert({
    where: { code: 'INDICADO20' },
    update: {
      target: CouponTarget.REFERRAL_REFERRED,
      valueType: CouponType.FIXED,
      value: new Prisma.Decimal(20.00),
      maxDiscount: new Prisma.Decimal(20.00),
      status: CouponStatus.ACTIVE,
      issuedToUserId: referredUser.id,
      validUntil: in14Days,
    },
    create: {
      code: 'INDICADO20',
      description: 'Cupom para cliente indicado',
      target: CouponTarget.REFERRAL_REFERRED,
      valueType: CouponType.FIXED,
      value: new Prisma.Decimal(20.00),
      maxDiscount: new Prisma.Decimal(20.00),
      status: CouponStatus.ACTIVE,
      issuedToUserId: referredUser.id,
      validFrom: now,
      validUntil: in14Days,
    },
  });
  console.log(`Cupom 'INDICADO20' (para ${referredUser.fullName}) criado/atualizado.`);

  const MISSAO10 = await prisma.coupon.upsert({
    where: { code: 'MISSAO10' },
    update: {
      target: CouponTarget.MISSION_REWARD,
      valueType: CouponType.FIXED,
      value: new Prisma.Decimal(10.00),
      maxDiscount: new Prisma.Decimal(10.00),
      status: CouponStatus.ACTIVE,
      validUntil: in21Days,
    },
    create: {
      code: 'MISSAO10',
      description: 'Recompensa por completar missão',
      target: CouponTarget.MISSION_REWARD,
      valueType: CouponType.FIXED,
      value: new Prisma.Decimal(10.00),
      maxDiscount: new Prisma.Decimal(10.00),
      status: CouponStatus.ACTIVE,
      validFrom: now,
      validUntil: in21Days,
    },
  });
  console.log(`Cupom 'MISSAO10' criado/atualizado.`);

  // -----------------------------------------------------------------------------
  // 5) MISSÕES
  console.log('Criando/Atualizando missões...');

  const missionClient3Bookings = await prisma.mission.upsert({
    where: { code: 'CLIENT_3_BOOKINGS_MONTH' },
    update: {
      title: 'Faça 3 reservas este mês',
      audience: MissionAudience.CLIENT,
      kind: MissionKind.COUNT_EVENT,
      targetValue: 3,
      timeWindowDays: 30,
      rewardType: RewardType.COUPON,
      couponTemplateId: MISSAO10.id,
      isActive: true,
      updatedAt: now,
    },
    create: {
      code: 'CLIENT_3_BOOKINGS_MONTH',
      title: 'Faça 3 reservas este mês',
      description: 'Complete 3 agendamentos de serviço em 30 dias para ganhar um cupom de R$10.',
      audience: MissionAudience.CLIENT,
      kind: MissionKind.COUNT_EVENT,
      eventName: 'booking_completed',
      targetValue: 3,
      timeWindowDays: 30,
      rewardType: RewardType.COUPON,
      rewardValue: 1000, // Valor em centavos para referência
      couponTemplateId: MISSAO10.id,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`Missão 'CLIENT_3_BOOKINGS_MONTH' criada/atualizada.`);

  const missionReview48h = await prisma.mission.upsert({
    where: { code: 'CLIENT_REVIEW_48H' },
    update: {
      title: 'Avalie seu serviço em até 48h',
      audience: MissionAudience.CLIENT,
      kind: MissionKind.WITHIN_WINDOW,
      timeWindowDays: 2,
      rewardType: RewardType.POINTS,
      rewardValue: 200,
      isActive: true,
      updatedAt: now,
    },
    create: {
      code: 'CLIENT_REVIEW_48H',
      title: 'Avalie seu serviço em até 48h',
      description: 'Deixe uma avaliação para seu serviço em até 48 horas e ganhe 200 pontos de fidelidade.',
      audience: MissionAudience.CLIENT,
      kind: MissionKind.WITHIN_WINDOW,
      eventName: 'review_submitted',
      targetValue: 1, // 1 avaliação
      timeWindowDays: 2,
      rewardType: RewardType.POINTS,
      rewardValue: 200,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`Missão 'CLIENT_REVIEW_48H' criada/atualizada.`);

  const missionProviderAccept5 = await prisma.mission.upsert({
    where: { code: 'PROVIDER_ACCEPT_5_WEEK' },
    update: {
      title: 'Aceite 5 solicitações na semana',
      audience: MissionAudience.PROVIDER,
      kind: MissionKind.COUNT_EVENT,
      targetValue: 5,
      timeWindowDays: 7,
      rewardType: RewardType.POINTS,
      rewardValue: 300,
      isActive: true,
      updatedAt: now,
    },
    create: {
      code: 'PROVIDER_ACCEPT_5_WEEK',
      title: 'Aceite 5 solicitações na semana',
      description: 'Aceite 5 agendamentos em uma semana e ganhe 300 pontos de fidelidade.',
      audience: MissionAudience.PROVIDER,
      kind: MissionKind.COUNT_EVENT,
      eventName: 'booking_accepted',
      targetValue: 5,
      timeWindowDays: 7,
      rewardType: RewardType.POINTS,
      rewardValue: 300,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`Missão 'PROVIDER_ACCEPT_5_WEEK' criada/atualizada.`);

  // Provider: 10 concluídos no mês
  const missionProvider10Completed = await prisma.mission.upsert({
    where: { code: 'PROVIDER_10_COMPLETED_MONTH' },
    update: {
      title: 'Conclua 10 serviços no mês',
      audience: MissionAudience.PROVIDER,
      kind: MissionKind.COUNT_EVENT,
      targetValue: 10,
      timeWindowDays: 30,
      rewardType: RewardType.POINTS,
      rewardValue: 500,
      isActive: true,
      updatedAt: now,
    },
    create: {
      code: 'PROVIDER_10_COMPLETED_MONTH',
      title: 'Conclua 10 serviços no mês',
      description: 'Complete 10 atendimentos concluídos em 30 dias para ganhar pontos de fidelidade.',
      audience: MissionAudience.PROVIDER,
      kind: MissionKind.COUNT_EVENT,
      eventName: 'provider.booking.completed',
      targetValue: 10,
      timeWindowDays: 30,
      rewardType: RewardType.POINTS,
      rewardValue: 500,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`Missão 'PROVIDER_10_COMPLETED_MONTH' criada/atualizada.`);

  // Provider: resposta rápida (20 no mês)
  const missionProviderFastResponse = await prisma.mission.upsert({
    where: { code: 'PROVIDER_RESPONSE_FAST_20' },
    update: {
      title: 'Responda rapidamente (20 vezes)',
      audience: MissionAudience.PROVIDER,
      kind: MissionKind.COUNT_EVENT,
      targetValue: 20,
      timeWindowDays: 30,
      rewardType: RewardType.POINTS,
      rewardValue: 200,
      isActive: true,
      updatedAt: now,
    },
    create: {
      code: 'PROVIDER_RESPONSE_FAST_20',
      title: 'Responda rapidamente (20 vezes)',
      description: 'Responda em menos de 3 minutos, 20 vezes no mês, para ganhar pontos.',
      audience: MissionAudience.PROVIDER,
      kind: MissionKind.COUNT_EVENT,
      eventName: 'provider.response.fast',
      targetValue: 20,
      timeWindowDays: 30,
      rewardType: RewardType.POINTS,
      rewardValue: 200,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`Missão 'PROVIDER_RESPONSE_FAST_20' criada/atualizada.`);

  // Provider: nenhuma cancelamento na semana (4 semanas seguidas no mês)
  const missionProviderNoCancelWeekly = await prisma.mission.upsert({
    where: { code: 'PROVIDER_NO_CANCEL_4W' },
    update: {
      title: 'Sem cancelamentos por 4 semanas',
      audience: MissionAudience.PROVIDER,
      kind: MissionKind.COUNT_EVENT,
      targetValue: 4,
      timeWindowDays: 28,
      rewardType: RewardType.POINTS,
      rewardValue: 300,
      isActive: true,
      updatedAt: now,
    },
    create: {
      code: 'PROVIDER_NO_CANCEL_4W',
      title: 'Sem cancelamentos por 4 semanas',
      description: 'Mantenha 4 semanas seguidas sem cancelamentos (evento semanal agregado) para ganhar pontos.',
      audience: MissionAudience.PROVIDER,
      kind: MissionKind.COUNT_EVENT,
      eventName: 'provider.no.cancellation.week',
      targetValue: 4,
      timeWindowDays: 28,
      rewardType: RewardType.POINTS,
      rewardValue: 300,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`Missão 'PROVIDER_NO_CANCEL_4W' criada/atualizada.`);

  // Provider: reviews >= 4.8 (10 no mês)
  const missionProviderHighRating = await prisma.mission.upsert({
    where: { code: 'PROVIDER_RATING_48PLUS_10' },
    update: {
      title: 'Receba 10 avaliações = 4.8 no mês',
      audience: MissionAudience.PROVIDER,
      kind: MissionKind.COUNT_EVENT,
      targetValue: 10,
      timeWindowDays: 30,
      rewardType: RewardType.POINTS,
      rewardValue: 400,
      isActive: true,
      updatedAt: now,
    },
    create: {
      code: 'PROVIDER_RATING_48PLUS_10',
      title: 'Receba 10 avaliações = 4.8 no mês',
      description: 'Receba 10 avaliações com nota = 4.8 em 30 dias (evento emitido no review).',
      audience: MissionAudience.PROVIDER,
      kind: MissionKind.COUNT_EVENT,
      eventName: 'provider.review.4_8plus',
      targetValue: 10,
      timeWindowDays: 30,
      rewardType: RewardType.POINTS,
      rewardValue: 400,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  });
  console.log(`Missão 'PROVIDER_RATING_48PLUS_10' criada/atualizada.`);

  // -----------------------------------------------------------------------------
  // 6) BOOKINGS E PAGAMENTOS
  console.log('Criando/Atualizando agendamentos e transações...');
  const bookingAddress1 = await upsertAddress({
    cep: '01003-003',
    street: 'Rua dos Agendamentos 1',
    number: '400',
    neighborhood: 'Bairro Teste',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.58,
    longitude: -46.66,
  });

  const bookingAddress2 = await upsertAddress({
    cep: '01003-004',
    street: 'Rua dos Agendamentos 2',
    number: '401',
    neighborhood: 'Bairro Teste',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.581,
    longitude: -46.661,
  });

  const bookingAddress3 = await upsertAddress({
    cep: '01003-005',
    street: 'Rua dos Agendamentos 3',
    number: '402',
    neighborhood: 'Bairro Teste',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.582,
    longitude: -46.662,
  });

  // NOVO: Endere?os para agendamentos da Joana
  const bookingAddressJoana1 = await upsertAddress({
    cep: '01003-006',
    street: 'Rua das Rosas',
    number: '10',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.57,
    longitude: -46.67,
  });

  const bookingAddressJoana2 = await upsertAddress({
    cep: '01003-007',
    street: 'Av. Brasil',
    number: '200',
    neighborhood: 'Jardim América',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.58,
    longitude: -46.68,
  });

  const getProviderServiceByComposite = async (providerId: string, service: Service, context: string) => {
    const providerService = await prisma.providerService.findUnique({
      where: {
        providerId_serviceId: {
          providerId,
          serviceId: service.id,
        },
      },
    });
    if (!providerService) {
      throw new Error(`ProviderService ${service.name} não encontrado para provider ${providerId} (${context}).`);
    }
    return providerService;
  };

  // Agendamento COMPLETED (do indicado, para testar referral conversion)
  const booking1Date = addDays(now, -7);
  if (!referredUser.client || !providerUser.provider) {
    throw new Error("Client or Provider profile not found for booking creation.");
  }
  const providerServiceForBooking1 = await getProviderServiceByComposite(providerUser.provider.id, residentialService, 'booking 1');

  const booking1 = await prisma.booking.upsert({
    where: { id: 'BKG-SEED-1' },
    update: {
      clientId: referredUser.client.id,
      providerId: providerUser.provider.id,
      providerServiceId: providerServiceForBooking1.id,
      scheduledDate: booking1Date,
      scheduledTime: buildScheduledDateTime(booking1Date, '10:00'),
      status: BookingStatus.FINISHED,
      totalPrice: new Prisma.Decimal(180.00),
      addressId: bookingAddress1.id, // Usando addressId único
      couponId: INDICADO20.id,
      discountAmount: new Prisma.Decimal(20.00),
    },
    create: {
      id: 'BKG-SEED-1',
      clientId: referredUser.client.id,
      providerId: providerUser.provider.id,
      providerServiceId: providerServiceForBooking1.id,
      scheduledDate: booking1Date,
      scheduledTime: buildScheduledDateTime(booking1Date, '10:00'),
      status: BookingStatus.FINISHED,
      totalPrice: new Prisma.Decimal(180.00),
      notes: 'Limpeza do indicado com cupom.',
      addressId: bookingAddress1.id, // Usando addressId ?nico
      couponId: INDICADO20.id,
      discountAmount: new Prisma.Decimal(20.00),
    },
  });
  console.log(`Agendamento Concluído 'BKG-SEED-1' (Indicado) criado/atualizado.`);

  // Agendamento COMPLETED (do cliente comum, para gerar cupom de retorno, pontos, etc.)
  const booking2Date = addDays(now, -1);
  if (!referrerUser.client || !providerUser.provider) {
    throw new Error("Client or Provider profile not found for booking creation.");
  }
  const providerServiceForBooking2 = await getProviderServiceByComposite(providerUser.provider.id, residentialService, 'booking 2');

  const booking2 = await prisma.booking.upsert({
    where: { id: 'BKG-SEED-2' },
    update: {
      clientId: referrerUser.client.id,
      providerId: providerUser.provider.id,
      providerServiceId: providerServiceForBooking2.id,
      scheduledDate: booking2Date,
      scheduledTime: buildScheduledDateTime(booking2Date, '14:00'),
      status: BookingStatus.FINISHED,
      totalPrice: new Prisma.Decimal(180.00),
      addressId: bookingAddress2.id, // Usando addressId ?nico
    },
    create: {
      id: 'BKG-SEED-2',
      clientId: referrerUser.client.id,
      providerId: providerUser.provider.id,
      providerServiceId: providerServiceForBooking2.id,
      scheduledDate: booking2Date,
      scheduledTime: buildScheduledDateTime(booking2Date, '14:00'),
      status: BookingStatus.FINISHED,
      totalPrice: new Prisma.Decimal(180.00),
      notes: 'Limpeza do cliente comum.',
      addressId: bookingAddress2.id, // Usando addressId ?nico
    },
  });
  console.log(`Agendamento Concluído 'BKG-SEED-2' (Comum) criado/atualizado.`);

  // Agendamento CONFIRMED (futuro)
  const booking3Date = addDays(now, 5);
  if (!referrerUser.client || !providerUser.provider) {
    throw new Error("Client or Provider profile not found for booking creation.");
  }
  const providerServiceForBooking3 = await getProviderServiceByComposite(providerUser.provider.id, residentialService, 'booking 3');

  const booking3 = await prisma.booking.upsert({
    where: { id: 'BKG-SEED-3' },
    update: {
      clientId: referrerUser.client.id,
      providerId: providerUser.provider.id,
      providerServiceId: providerServiceForBooking3.id,
      scheduledDate: booking3Date,
      scheduledTime: buildScheduledDateTime(booking3Date, '09:00'),
      status: BookingStatus.CONFIRMED,
      totalPrice: new Prisma.Decimal(180.00),
      addressId: bookingAddress3.id, // Usando addressId ?nico
    },
    create: {
      id: 'BKG-SEED-3',
      clientId: referrerUser.client.id,
      providerId: providerUser.provider.id,
      providerServiceId: providerServiceForBooking3.id,
      scheduledDate: booking3Date,
      scheduledTime: buildScheduledDateTime(booking3Date, '09:00'),
      status: BookingStatus.CONFIRMED,
      totalPrice: new Prisma.Decimal(180.00),
      notes: 'Limpeza agendada para o futuro.',
      addressId: bookingAddress3.id, // Usando addressId ?nico
    },
  });
  console.log(`Agendamento Confirmado 'BKG-SEED-3' criado/atualizado.`);

  // Booking PENDING (aguardando confirmacao)
  const pendingBookingDate = addDays(now, 3);
  // Importante: Booking.addressId ? @unique, ent?o cada booking precisa de um Address pr?prio
  const pendingAddress = await upsertAddress({
    cep: '01002-003',
    street: 'Av. do Provedor',
    number: '301', // diferente de outros para garantir novo Address
    neighborhood: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.57,
    longitude: -46.65,
  });
  const pendingBooking = await prisma.booking.upsert({
    where: { id: 'BKG-SEED-PENDING-1' },
    update: {
      clientId: referrerUser.client.id,
      providerId: providerUser.provider.id,
      providerServiceId: providerServiceForBooking3.id,
      scheduledDate: pendingBookingDate,
      scheduledTime: buildScheduledDateTime(pendingBookingDate, '16:00'),
      status: BookingStatus.PENDING,
      totalPrice: new Prisma.Decimal(150.00),
      addressId: pendingAddress.id,
      notes: 'Solicitação pendente para teste do dashboard.',
    },
    create: {
      id: 'BKG-SEED-PENDING-1',
      clientId: referrerUser.client.id,
      providerId: providerUser.provider.id,
      providerServiceId: providerServiceForBooking3.id,
      scheduledDate: pendingBookingDate,
      scheduledTime: buildScheduledDateTime(pendingBookingDate, '16:00'),
      status: BookingStatus.PENDING,
      totalPrice: new Prisma.Decimal(150.00),
      notes: 'Solicitação pendente para teste do dashboard.',
      addressId: pendingAddress.id,
    },
  });
  console.log(`Agendamento Pendente 'BKG-SEED-PENDING-1' criado/atualizado.`);

  // NOVO: Agendamentos Conclu?dos para Joana
  const joanaService = await getProviderServiceByComposite(providerUser3.provider.id, residentialService, 'Joana booking');

  const bookingJoana1Date = addDays(now, -10);
  const bookingJoana1 = await prisma.booking.upsert({
    where: { id: 'BKG-SEED-JOANA-1' },
    update: {
      clientId: clientUserJoanaReviewer.client.id,
      providerId: providerUser3.provider.id,
      providerServiceId: joanaService.id,
      scheduledDate: bookingJoana1Date,
      scheduledTime: buildScheduledDateTime(bookingJoana1Date, '09:30'),
      status: BookingStatus.FINISHED,
      totalPrice: new Prisma.Decimal(190.00),
      notes: 'Serviço de limpeza para avaliação da Joana (5 estrelas).',
      addressId: bookingAddressJoana1.id,
    },
    create: {
      id: 'BKG-SEED-JOANA-1',
      clientId: clientUserJoanaReviewer.client.id,
      providerId: providerUser3.provider.id,
      providerServiceId: joanaService.id,
      scheduledDate: bookingJoana1Date,
      scheduledTime: buildScheduledDateTime(bookingJoana1Date, '09:30'),
      status: BookingStatus.FINISHED,
      totalPrice: new Prisma.Decimal(190.00),
      notes: 'Serviço de limpeza para avaliação da Joana (5 estrelas).',
      addressId: bookingAddressJoana1.id,
    },
  });
  console.log(`Agendamento Concluído 'BKG-SEED-JOANA-1' (para Joana) criado/atualizado.`);
  const bookingJoana2Date = addDays(now, -5);
  const bookingJoana2 = await prisma.booking.upsert({
    where: { id: 'BKG-SEED-JOANA-2' },
    update: {
      clientId: clientUserJoanaReviewer.client.id,
      providerId: providerUser3.provider.id,
      providerServiceId: joanaService.id,
      scheduledDate: bookingJoana2Date,
      scheduledTime: buildScheduledDateTime(bookingJoana2Date, '14:00'),
      status: BookingStatus.FINISHED,
      totalPrice: new Prisma.Decimal(190.00),
      notes: 'Serviço de limpeza para avaliação da Joana (4 estrelas).',
      addressId: bookingAddressJoana2.id,
    },
    create: {
      id: 'BKG-SEED-JOANA-2',
      clientId: clientUserJoanaReviewer.client.id,
      providerId: providerUser3.provider.id,
      providerServiceId: joanaService.id,
      scheduledDate: bookingJoana2Date,
      scheduledTime: buildScheduledDateTime(bookingJoana2Date, '14:00'),
      status: BookingStatus.FINISHED,
      totalPrice: new Prisma.Decimal(190.00),
      notes: 'Serviço de limpeza para avaliação da Joana (4 estrelas).',
      addressId: bookingAddressJoana2.id,
    },
  });
  console.log(`Agendamento Concluído 'BKG-SEED-JOANA-2' (para Joana) criado/atualizado.`);
  // Pagamentos confirmados dos agendamentos conclu?dos
  for (const booking of [booking1, booking2, bookingJoana1, bookingJoana2]) {
    await prisma.paymentIntent.upsert({
      where: { bookingId: booking.id },
      update: {
        status: PaymentIntentStatus.PAID,
        amountCents: booking.totalPrice.mul(100).toNumber(),
        updatedAt: now,
      },
      create: {
        bookingId: booking.id,
        status: PaymentIntentStatus.PAID,
        amountCents: booking.totalPrice.mul(100).toNumber(),
        gateway: 'PIX_SIMULADO',
        externalRef: `PIX-${booking.id}`,
        idempotencyKey: `IDEMPOTENCY-${booking.id}`,
        createdAt: booking.createdAt,
        updatedAt: now,
      },
    });
    console.log(`PaymentIntent para Booking ${booking.id} criado/atualizado.`);

    await prisma.transaction.upsert({
      where: { gatewayTransactionId: `TRANS-${booking.id}` },
      update: {
        providerId: booking.providerId, // Usar o providerId do booking para a transação
        amount: booking.totalPrice,
        type: TransactionType.PAYMENT,
         status: 'COMPLETED',
        description: `Pagamento do serviço ${booking.id}`,
        bookingId: booking.id,
      },
      create: {
        providerId: booking.providerId, // Usar o providerId do booking para a transação
        amount: booking.totalPrice,
        type: TransactionType.PAYMENT,
         status: 'COMPLETED',
        description: `Pagamento do serviço ${booking.id}`,
        bookingId: booking.id,
        gatewayTransactionId: `TRANS-${booking.id}`,
        createdAt: now,
      },
    });
    console.log(`Transação para Booking ${booking.id} criado/atualizado.`);
  }

  // -----------------------------------------------------------------------------
  // NOVO BLOCO: FLUXO INICIAR/FINALIZAR SERVIÇO
  // -----------------------------------------------------------------------------
  
  async function seedProviderLiveFlow() {
    console.log('Criando fluxo de bookings LIVE para testar iniciar/finalizar serviço...');
    // ADICIONADO: Novos endere?os exclusivos para os bookings LIVE (evitar conflito de @unique em addressId)
    const bookingAddressLive1 = await upsertAddress({
      cep: '01003-008',
      street: 'Rua LIVE 1',
      number: '500',
      neighborhood: 'Bairro LIVE',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.583,
      longitude: -46.663,
    });

    const bookingAddressLive2 = await upsertAddress({
      cep: '01003-009',
      street: 'Rua LIVE 2',
      number: '501',
      neighborhood: 'Bairro LIVE',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.584,
      longitude: -46.664,
    });
    const bookingAddressLive3 = await upsertAddress({
      cep: '01003-010',
      street: 'Rua LIVE 3',
      number: '502',
      neighborhood: 'Bairro LIVE',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.585,
      longitude: -46.665,
    });


    // Booking CONFIRMED para hoje (libera bot?o "Iniciar")
    const liveBookingDate = addDays(now, 0);
    const liveBooking = await prisma.booking.upsert({
      where: { id: 'BKG-LIVE-1' },
      create: {
        id: 'BKG-LIVE-1',
        clientId: referrerUser.client!.id,
        providerId: providerUser.provider!.id,
        providerServiceId: providerServiceForBooking3.id,
        scheduledDate: liveBookingDate, // Hoje
        scheduledTime: buildScheduledDateTime(liveBookingDate, '15:00'),
        status: BookingStatus.CONFIRMED,
        totalPrice: new Prisma.Decimal(220),
        addressId: bookingAddressLive1.id, // ADICIONADO: Endereço exclusivo
        notes: 'Booking confirmado para teste de início de serviço.',
      },
      update: {
        status: BookingStatus.CONFIRMED,
        scheduledDate: liveBookingDate, // Garantir consistência na data
        scheduledTime: buildScheduledDateTime(liveBookingDate, '15:00'), // Garantir consistencia no horário
        addressId: bookingAddressLive1.id, // Garantir consistência no endereço
      },
    });
    console.log(`Booking LIVE CONFIRMED 'BKG-LIVE-1' criado/atualizado.`);

    // Booking IN_PROGRESS (em andamento - testa botão "Finalizar")
    const inProgress = await prisma.booking.upsert({
      where: { id: 'BKG-LIVE-2' },
      update: { 
        status: BookingStatus.STARTED,
        scheduledDate: now, // Garantir consistência na data
        scheduledTime: buildScheduledDateTime(now, '09:00'), // Garantir consistencia no horário
        addressId: bookingAddressLive2.id, // Garantir consistência no endereço
      },
      create: {
        id: 'BKG-LIVE-2',
        clientId: referrerUser.client!.id,
        providerId: providerUser.provider!.id,
        providerServiceId: providerServiceForBooking3.id,
        scheduledDate: now, // Hoje
        scheduledTime: buildScheduledDateTime(now, '09:00'),
        status: BookingStatus.STARTED,
        totalPrice: new Prisma.Decimal(200),
        addressId: bookingAddressLive2.id, // ADICIONADO: Endereço exclusivo
        notes: 'Serviço em andamento para teste de finalização.',
      },
    });
    console.log(`Booking LIVE IN_PROGRESS 'BKG-LIVE-2' criado/atualizado.`);

    // Booking COMPLETED (finalizado - histórico com pagamento)
    const finishedDate = addDays(now, -2);
    const finished = await prisma.booking.upsert({
      where: { id: 'BKG-LIVE-3' },
      update: { 
        status: BookingStatus.FINISHED,
        scheduledDate: finishedDate, // Garantir consistência na data
        scheduledTime: buildScheduledDateTime(finishedDate, '11:00'), // Garantir consistencia no horário
        addressId: bookingAddressLive3.id, // Mantém o endereço original (único)
      },
      create: {
        id: 'BKG-LIVE-3',
        clientId: referredUser.client!.id,
        providerId: providerUser.provider!.id,
        providerServiceId: providerServiceForBooking3.id,
        scheduledDate: finishedDate, // 2 dias atr?s
        scheduledTime: buildScheduledDateTime(finishedDate, '11:00'),
        status: BookingStatus.FINISHED,
        totalPrice: new Prisma.Decimal(240),
        addressId: bookingAddressLive3.id,
        notes: 'Serviço finalizado para teste de histórico.',
      },
    });
    console.log(`Booking LIVE COMPLETED 'BKG-LIVE-3' criado/atualizado.`);

    // ---- PAGAMENTOS E LEDGER ----

    // PaymentIntent PENDING para o booking em andamento (BKG-LIVE-2)
    await prisma.paymentIntent.upsert({
      where: { bookingId: inProgress.id },
      create: {
        id: 'PI-LIVE-2',
        bookingId: inProgress.id,
        amountCents: 20000, // R$200,00
        status: PaymentIntentStatus.PENDING,
        gateway: 'manual_seed',
        externalRef: `PIX-LIVE-${inProgress.id}`,
        idempotencyKey: `IDEMPOTENCY-LIVE-${inProgress.id}`,
        createdAt: now,
        updatedAt: now,
      },
      update: { 
        status: PaymentIntentStatus.PENDING,
        amountCents: 20000,
      },
    });
    console.log(`PaymentIntent PENDING para Booking ${inProgress.id} criado/atualizado.`);

    // PaymentIntent PAID para o booking finalizado (BKG-LIVE-3)
    await prisma.paymentIntent.upsert({
      where: { bookingId: finished.id },
      create: {
        id: 'PI-LIVE-3',
        bookingId: finished.id,
        amountCents: 24000, // R$240,00
        status: PaymentIntentStatus.PAID,
        gateway: 'manual_seed',
        externalRef: `PIX-LIVE-${finished.id}`,
        idempotencyKey: `IDEMPOTENCY-LIVE-${finished.id}`,
        createdAt: addDays(now, -2),
        updatedAt: now,
      },
      update: { 
        status: PaymentIntentStatus.PAID,
        amountCents: 24000,
      },
    });
    console.log(`PaymentIntent PAID para Booking ${finished.id} criado/atualizado.`);

    // Transa??o de pagamento para o booking finalizado (BKG-LIVE-3)
    await prisma.transaction.upsert({
      where: { gatewayTransactionId: `TRANS-LIVE-${finished.id}` },
      create: {
        providerId: finished.providerId,
        amount: finished.totalPrice,
        type: TransactionType.PAYMENT,
         status: 'COMPLETED',
        description: `Pagamento do serviço finalizado ${finished.id}`,
        bookingId: finished.id,
        gatewayTransactionId: `TRANS-LIVE-${finished.id}`,
        createdAt: addDays(now, -2),
      },
      update: {
        providerId: finished.providerId,
        amount: finished.totalPrice,
        type: TransactionType.PAYMENT,
         status: 'COMPLETED',
        description: `Pagamento do serviço finalizado ${finished.id}`, // CORRIGIDO: servio -> serviço
        bookingId: finished.id,
      },
    });
    console.log(`Transação de pagamento para Booking ${finished.id} criada/atualizada.`); // CORRIGIDO: Transao -> Transação

    // Ledger Entry EARNING para o provedor (BKG-LIVE-3) - CORRIGIDO: Usar ledgerEntry, userId, amount (Decimal), sem amountCents/referenceDate/status
    await prisma.ledgerEntry.upsert({
      where: { id: `LEDGER-LIVE-${finished.id}` },
      create: {
        id: `LEDGER-LIVE-${finished.id}`,
        userId: providerUser.id, // Usar userId (do provedor)
        type: LedgerEntryType.EARNING,
        amount: new Prisma.Decimal(240), // amount como Decimal(14,2), não amountCents // CORRIGIDO: no -> não
        bookingId: finished.id,
        note: `Ganhos do serviço finalizado ${finished.id}`, // Usar note em vez de description // CORRIGIDO: servio -> serviço
        createdAt: addDays(now, -2),
      },
      update: {
        userId: providerUser.id,
        type: LedgerEntryType.EARNING,
        amount: new Prisma.Decimal(240),
        bookingId: finished.id,
        note: `Ganhos do serviço finalizado ${finished.id}`, // CORRIGIDO: servio -> serviço
      },
    });
    console.log(`Ledger EARNING para Booking ${finished.id} criado/atualizado.`);

    // ---- NOTIFICAÇÕES PARA PROVIDER ---- (CORRIGIDO: Usar upsert com ID fixo para idempotência) // CORRIGIDO: NOTIFICAES -> NOTIFICAÇÕES, idempotncia -> idempotência

    // Notificação de serviço iniciado (para BKG-LIVE-2) // CORRIGIDO: Notificao -> Notificação, servio -> serviço
    await prisma.notification.upsert({
      where: { id: 'NTF-LIVE-1' },
      update: {
        userId: providerUser.id,
        type: 'booking_started',
        title: 'Serviço iniciado', // CORRIGIDO: Servio -> Serviço
        message: 'Você iniciou o serviço agendado para 09:00 hoje.', // CORRIGIDO: Voc -> Você, servio -> serviço
        isRead: false,
        targetUrl: '/(provider)/active-booking/BKG-LIVE-2',
        createdAt: now,
        idempotencyKey: `IDEMPOTENCY-NTF-LIVE-1`, // ADICIONADO: Para deduplicação // CORRIGIDO: deduplicao -> deduplicação
      },
      create: {
        id: 'NTF-LIVE-1',
        userId: providerUser.id,
        type: 'booking_started',
        title: 'Serviço iniciado', // CORRIGIDO: Servio -> Serviço
        message: 'Você iniciou o serviço agendado para 09:00 hoje.', // CORRIGIDO: Voc -> Você, servio -> serviço
        isRead: false,
        targetUrl: '/(provider)/active-booking/BKG-LIVE-2',
        createdAt: now,
        idempotencyKey: `IDEMPOTENCY-NTF-LIVE-1`, // ADICIONADO: Para deduplicação // CORRIGIDO: deduplicao -> deduplicação
      },
    });
    console.log(`Notificação de serviço iniciado (BKG-LIVE-2) criada.`); // CORRIGIDO: Notificao -> Notificação, servio -> serviço

    // Notificação de serviço finalizado (para BKG-LIVE-3) // CORRIGIDO: Notificao -> Notificação, servio -> serviço
    await prisma.notification.upsert({
      where: { id: 'NTF-LIVE-2' },
      update: {
        userId: providerUser.id,
        type: 'booking_completed',
        title: 'Serviço finalizado', // CORRIGIDO: Servio -> Serviço
        message: 'Você concluiu o serviço de 11:00. Pagamento processado: R$240,00.', // CORRIGIDO: Voc -> Você, servio -> serviço
        isRead: false,
        targetUrl: '/(provider)/earnings',
        createdAt: addDays(now, -2),
        idempotencyKey: `IDEMPOTENCY-NTF-LIVE-2`, // ADICIONADO: Para deduplicação // CORRIGIDO: deduplicao -> deduplicação
      },
      create: {
        id: 'NTF-LIVE-2',
        userId: providerUser.id,
        type: 'booking_completed',
        title: 'Serviço finalizado', // CORRIGIDO: Servio -> Serviço
        message: 'Você concluiu o serviço de 11:00. Pagamento processado: R$240,00.', // CORRIGIDO: Voc -> Você, servio -> serviço
        isRead: false,
        targetUrl: '/(provider)/earnings',
        createdAt: addDays(now, -2),
        idempotencyKey: `IDEMPOTENCY-NTF-LIVE-2`, // ADICIONADO: Para deduplicação // CORRIGIDO: deduplicao -> deduplicação
      },
    });
    console.log(`Notificação de serviço finalizado (BKG-LIVE-3) criada.`); // CORRIGIDO: Notificao -> Notificação, servio -> serviço

    // Notificação de lembrete para serviço futuro (BKG-LIVE-1) // CORRIGIDO: Notificao -> Notificação, servio -> serviço
    await prisma.notification.upsert({
      where: { id: 'NTF-LIVE-3' },
      update: {
        userId: providerUser.id,
        type: 'booking_reminder',
        title: 'Lembrete de serviço', // CORRIGIDO: servio -> serviço
        message: 'Você tem um serviço confirmado para hoje às 15:00. Prepare-se!', // CORRIGIDO: Voc -> Você, servio -> serviço, s -> às
        isRead: false,
        targetUrl: '/(provider)/upcoming/BKG-LIVE-1',
        createdAt: now,
        idempotencyKey: `IDEMPOTENCY-NTF-LIVE-3`, // ADICIONADO: Para deduplicação // CORRIGIDO: deduplicao -> deduplicação
      },
      create: {
        id: 'NTF-LIVE-3',
        userId: providerUser.id,
        type: 'booking_reminder',
        title: 'Lembrete de serviço', // CORRIGIDO: servio -> serviço
        message: 'Você tem um serviço confirmado para hoje às 15:00. Prepare-se!', // CORRIGIDO: Voc -> Você, servio -> serviço, s -> às
        isRead: false,
        targetUrl: '/(provider)/upcoming/BKG-LIVE-1',
        createdAt: now,
        idempotencyKey: `IDEMPOTENCY-NTF-LIVE-3`, // ADICIONADO: Para deduplicação // CORRIGIDO: deduplicao -> deduplicação
      },
    });
    console.log(`Notificação de lembrete (BKG-LIVE-1) criada.`); // CORRIGIDO: Notificao -> Notificação

    console.log('Fluxo LIVE de bookings criado com sucesso! ?');
  }

  // Executar o novo fluxo após os bookings existentes
  await seedProviderLiveFlow();

  // -----------------------------------------------------------------------------
  // 7) PROGRESSO DE MISSÕES // CORRIGIDO: MISSES -> MISSÕES
  console.log('Criando/Atualizando progresso de missões...'); // CORRIGIDO: misses -> missões

  await prisma.missionProgress.upsert({
    where: { userId_missionId: { userId: referrerUser.id, missionId: missionClient3Bookings.id } },
    update: { currentValue: 1, status: MissionStatus.ACTIVE, lastEventAt: now },
    create: {
      userId: referrerUser.id,
      missionId: missionClient3Bookings.id,
      currentValue: 1,
      status: MissionStatus.ACTIVE,
      lastEventAt: now,
    },
  });
  console.log(`Progresso de missão para ${referrerUser.fullName} (1/3) criado/atualizado.`); // CORRIGIDO: misso -> missão

  // -----------------------------------------------------------------------------
  // 8) FIDELIDADE (Loyalty e LoyaltyTransaction)
  console.log('Criando/Atualizando pontos de fidelidade...');

  await prisma.loyalty.upsert({
    where: { userId: referrerUser.id },
    update: { currentPoints: 90 },
    create: { userId: referrerUser.id, currentPoints: 90 },
  });
  console.log(`Saldo de pontos para ${referrerUser.fullName} criado/atualizado.`);

  await prisma.loyaltyTransaction.upsert({
    where: { id: `LT-${booking2.id}` }, // ID único baseado no booking // CORRIGIDO: nico -> único
    update: { points: 90, type: LoyaltyTransactionType.SERVICE_COMPLETED, referenceId: booking2.id },
    create: {
      id: `LT-${booking2.id}`,
      userId: referrerUser.id,
      points: 90,
      type: LoyaltyTransactionType.SERVICE_COMPLETED,
      referenceId: booking2.id,
    },
  });
  console.log(`Transação de pontos para ${referrerUser.fullName} (serviço concluído) criada/atualizada.`); // CORRIGIDO: Transao -> Transação, servio -> serviço

  // -----------------------------------------------------------------------------
  // 9) NOTIFICAÇÕES // CORRIGIDO: NOTIFICAES -> NOTIFICAÇÕES
  console.log('Criando/Atualizando notificações...'); // CORRIGIDO: notificaes -> notificações

  console.log(`Notificação de boas-vindas para ${referredUser.fullName} criada/atualizada.`); // CORRIGIDO: Notificao -> Notificação

    // -----------------------------------------------------------------------------
  // 10) AVALIAÇÕES (REVIEWS) // CORRIGIDO: AVALIAES -> AVALIAÇÕES
  console.log('Criando/Atualizando avaliações...'); // CORRIGIDO: avaliaes -> avaliações

  await prisma.review.upsert({
    where: { bookingId: booking2.id },
    update: {
      rating: 5,
      comment: 'Serviço excelente! Provedora muito profissional e atenciosa.', // CORRIGIDO: Servio -> Serviço
      clientId: referrerUser.client!.id,
      providerId: providerUser.provider!.id,
    },
    create: {
      bookingId: booking2.id,
      clientId: referrerUser.client!.id,
      providerId: providerUser.provider!.id,
      rating: 5,
      comment: 'Serviço excelente! Provedora muito profissional e atenciosa.', // CORRIGIDO: Servio -> Serviço
    },
  });
  console.log(`Avaliação para Booking ${booking2.id} criada/atualizada.`); // CORRIGIDO: Avaliao -> Avaliação

  // NOVO: Avaliações para Joana // CORRIGIDO: Avaliaes -> Avaliações
  await prisma.review.upsert({
    where: { bookingId: bookingJoana1.id },
    update: {
      rating: 5,
      comment: 'Joana é excelente! Super atenciosa e deixou tudo impecável. Recomendo muito!', // CORRIGIDO:  -> é, impecvel -> impecável
      clientId: clientUserJoanaReviewer.client!.id,
      providerId: providerUser3.provider!.id,
    },
    create: {
      bookingId: bookingJoana1.id,
      clientId: clientUserJoanaReviewer.client!.id,
      providerId: providerUser3.provider!.id,
      rating: 5,
      comment: 'Joana é excelente! Super atenciosa e deixou tudo impecável. Recomendo muito!', // CORRIGIDO:  -> é, impecvel -> impecável
    },
  });
  console.log(`Avaliação para Booking ${bookingJoana1.id} (Joana) criada/atualizada.`); // CORRIGIDO: Avaliao -> Avaliação

  await prisma.review.upsert({
    where: { bookingId: bookingJoana2.id },
    update: {
      rating: 4,
      comment: 'Bom serviço, chegou no horário e fez um bom trabalho. Fiquei satisfeita.', // CORRIGIDO: servio -> serviço, horrio -> horário
      clientId: clientUserJoanaReviewer.client!.id,
      providerId: providerUser3.provider!.id,
    },
    create: {
      bookingId: bookingJoana2.id,
      clientId: clientUserJoanaReviewer.client!.id,
      providerId: providerUser3.provider!.id,
      rating: 4,
      comment: 'Bom serviço, chegou no horário e fez um bom trabalho. Fiquei satisfeita.', // CORRIGIDO: servio -> serviço, horrio -> horário
    },
  });
  console.log(`Avaliação para Booking ${bookingJoana2.id} (Joana) criada/atualizada.`); // CORRIGIDO: Avaliao -> Avaliação

  // -----------------------------------------------------------------------------
  // GERAÇÃO EM MASSA DE 100 AVALIAÇÕES POR PRESTADOR (usando o serviço residencial e reviewers dedicados) // CORRIGIDO: GERAO -> GERAÇÃO, AVALIAES -> AVALIAÇÕES, servio -> serviço
  // -----------------------------------------------------------------------------
  console.log('Gerando avaliações em massa para prestadores...'); // CORRIGIDO: avaliaes -> avaliações
  // Quantidades variadas por provedor para simular escala real (mantendo o restante igual)

  // -----------------------------------------------------------------------------
  // 11) OUTROS MODELOS (Exemplos básicos) // CORRIGIDO: bsicos -> básicos

  // FAQItem
  console.log('Criando/Atualizando FAQs...');
  await prisma.fAQItem.upsert({
    where: { question: 'Como faço para agendar um serviço?' }, // CORRIGIDO: fao -> faço, servio -> serviço
    update: { answer: 'Você pode agendar um serviço através da tela "Explorar", escolhendo a categoria e o provedor desejado.' }, // CORRIGIDO: Voc -> Você, servio -> serviço, atravs -> através
    create: {
      question: 'Como faço para agendar um serviço?', // CORRIGIDO: fao -> faço, servio -> serviço
      answer: 'Você pode agendar um serviço através da tela "Explorar", escolhendo a categoria e o provedor desejado.', // CORRIGIDO: Voc -> Você, servio -> serviço, atravs -> através
      category: 'Geral',
      order: 1,
    },
  });
  console.log(`FAQ 'Como faço para agendar um serviço?' criado/atualizado.`); // CORRIGIDO: fao -> faço, servio -> serviço

  // Offer
  console.log('Criando/Atualizando ofertas...');
  const existingOffer = await prisma.offer.findFirst({
    where: { title: 'Desconto de Verão' }, // CORRIGIDO: Vero -> Verão
  });

  if (existingOffer) {
    await prisma.offer.update({
      where: { id: existingOffer.id },
      data: {
        description: '10% de desconto em todos os serviços de limpeza residencial!', // CORRIGIDO: servios -> serviços
        discountPercentage: 10.0,
        target: OfferTarget.GENERAL,
        status: OfferStatus.ACTIVE,
        validUntil: addDays(now, 60),
      },
    });
  } else {
    await prisma.offer.create({
      data: {
        title: 'Desconto de Verão', // CORRIGIDO: Vero -> Verão
        description: '10% de desconto em todos os serviços de limpeza residencial!', // CORRIGIDO: servios -> serviços
        discountPercentage: 10.0,
        fixedDiscountAmount: null,
        target: OfferTarget.GENERAL,
        status: OfferStatus.ACTIVE,
        validFrom: now,
        validUntil: addDays(now, 60),
      },
    });
  }
  console.log(`Oferta 'Desconto de Verão' criada/atualizada.`); // CORRIGIDO: Vero -> Verão

  // Reward (recompensa resgatável com pontos) // CORRIGIDO: resgatvel -> resgatável
  console.log('Criando/Atualizando recompensas...');
  await prisma.reward.upsert({
    where: { name: 'Cupom de R$25' },
    update: {
      description: 'Resgate um cupom de R$25 para usar em qualquer serviço.', // CORRIGIDO: servio -> serviço
      costPoints: 500,
      value: new Prisma.Decimal(25.00),
      type: 'COUPON',
      isActive: true,
    },
    create: {
      name: 'Cupom de R$25',
      description: 'Resgate um cupom de R$25 para usar em qualquer serviço.', // CORRIGIDO: servio -> serviço
      costPoints: 500,
      value: new Prisma.Decimal(25.00),
      type: 'COUPON',
      couponCode: 'RESGATE25', // Exemplo de código gerado // CORRIGIDO: cdigo -> código
      isActive: true,
    },
  });
  console.log(`Recompensa 'Cupom de R$25' criada/atualizada.`);

  // PricingRule
  console.log('Criando/Atualizando regras de precificação...'); // CORRIGIDO: precificao -> precificação
  await prisma.pricingRule.upsert({
    where: { id: 'PRICING-RULE-1' },
    update: { surgeFactor: new Prisma.Decimal(1.2), isActive: true },
    create: {
      id: 'PRICING-RULE-1',
      zoneId: 'SP-CENTRO',
      dayOfWeek: 5, // Sexta-feira
      startTime: '17:00',
      endTime: '19:00',
      demandThreshold: 10,
      surgeFactor: new Prisma.Decimal(1.2), // Aumento de 20%
      isActive: true,
    },
  });
  console.log(`Regra de precificação 'PRICING-RULE-1' criada/atualizada.`); // CORRIGIDO: precificao -> precificação

  // SupportTicket
  console.log('Criando/Atualizando ticket de suporte...');
  const supportTicket = await prisma.supportTicket.upsert({
    where: { id: 'TICKET-001' },
    update: {
      userId: referrerUser.id,
      subject: 'Problema com agendamento',
      category: SupportTicketCategory.APP,
      status: SupportTicketStatus.OPEN,
    },
    create: {
      id: 'TICKET-001',
      userId: referrerUser.id,
      role: UserRole.CLIENT,
      subject: 'Problema com agendamento',
      category: SupportTicketCategory.APP,
      description: 'Não consigo ver meu agendamento na lista.', // CORRIGIDO: No -> Não
      status: SupportTicketStatus.OPEN,
      bookingId: booking3.id,
    },
  });
  console.log(`Ticket de suporte 'TICKET-001' criado/atualizado.`);

  // SupportMessage
  console.log('Criando/Atualizando mensagem de suporte...');
  await prisma.supportMessage.upsert({
    where: { id: 'TICKET-MSG-001' },
    update: { ticketId: supportTicket.id, userId: referrerUser.id, body: 'Já tentei recarregar a página, mas não aparece.' }, // CORRIGIDO: J -> Já, pgina -> página, no -> não
    create: {
      id: 'TICKET-MSG-001',
      ticketId: supportTicket.id,
      userId: referrerUser.id,
      role: UserRole.CLIENT,
      body: 'Já tentei recarregar a página, mas não aparece.', // CORRIGIDO: J -> Já, pgina -> página, no -> não
      attachments: [],
    },
  });
  console.log(`Mensagem de suporte 'TICKET-MSG-001' criada/atualizada.`);

  // Dispute (associado a um booking)
  console.log('Criando/Atualizando disputa...');
  const existingDispute = await prisma.dispute.findFirst({
    where: { bookingId: booking1.id },
  });

  let dispute: any;
  if (existingDispute) {
    dispute = await prisma.dispute.update({
      where: { id: existingDispute.id },
      data: {
        reporterUserId: referredUser.id,
        reason: DisputeReason.SERVICE_INCOMPLETE,
        status: DisputeStatus.PENDING,
      },
    });
  } else {
    dispute = await prisma.dispute.create({
      data: {
        bookingId: booking1.id,
        reporterUserId: referredUser.id,
        reason: DisputeReason.SERVICE_INCOMPLETE,
        description: 'A limpeza não foi concluída em todas as áreas combinadas.', // CORRIGIDO: no -> não, reas -> áreas
        attachments: [],
        status: DisputeStatus.PENDING,
      },
    });
  }
  console.log(`Disputa para Booking ${booking1.id} criada/atualizada.`);

  // DisputeMessage (requer um SupportTicket, então vou criar um dummy se não houver um real) // CORRIGIDO: ento -> então, no -> não
  const dummySupportTicketForDispute = await prisma.supportTicket.upsert({
    where: { id: 'DUMMY-TICKET-FOR-DISPUTE' },
    update: {
      userId: adminUser.id,
      subject: 'Dummy Ticket for Dispute Message',
      category: SupportTicketCategory.OTHER,
      status: SupportTicketStatus.CLOSED,
    },
    create: {
      id: 'DUMMY-TICKET-FOR-DISPUTE',
      userId: adminUser.id,
      role: UserRole.ADMIN,
      subject: 'Dummy Ticket for Dispute Message',
      category: SupportTicketCategory.OTHER,
      description: 'Este é um ticket dummy para satisfazer a relação de DisputeMessage.', // CORRIGIDO:  -> é, relao -> relação
      status: SupportTicketStatus.CLOSED,
    },
  });
  console.log(`Dummy SupportTicket 'DUMMY-TICKET-FOR-DISPUTE' criado/atualizado.`);

  await prisma.disputeMessage.upsert({
    where: { id: 'DISPUTE-MSG-001' },
    update: {
      disputeId: dispute.id,
      senderUserId: referredUser.id,
      content: 'Eu gostaria de resolver isso amigavelmente.',
      ticketId: dummySupportTicketForDispute.id,
    },
    create: {
      id: 'DISPUTE-MSG-001',
      disputeId: dispute.id,
      senderUserId: referredUser.id,
      content: 'Eu gostaria de resolver isso amigavelmente.',
      ticketId: dummySupportTicketForDispute.id,
    },
  });
  console.log(`Mensagem de disputa 'DISPUTE-MSG-001' criada/atualizada.`);

  // UserConsent
  console.log('Criando/Atualizando consentimento do usuário...'); // CORRIGIDO: usurio -> usuário
  const consentId = `consent-${referrerUser.id}-termos`;
  await prisma.userConsent.upsert({
    where: { id: consentId },
    update: {
      version: '1.0',
      consentedAt: new Date('2023-01-01T00:00:00Z'),
    },
    create: {
      id: consentId,
      userId: referrerUser.id,
      documentType: 'TERMOS_DE_SERVICO',
      version: '1.0',
      source: 'seed',
      consentedAt: new Date('2023-01-01T00:00:00Z'),
    },
  });
  console.log(`Consentimento para ${referrerUser.fullName} (Termos de Serviço) criado/atualizado.`); // CORRIGIDO: Servio -> Serviço

  // Subscription
  console.log('Criando/Atualizando assinatura...');
  const providerServiceForSubscription = await getProviderServiceByComposite(providerUser.provider.id, residentialService, 'subscription');

  await prisma.subscription.upsert({
    where: { id: 'SUB-001' },
    update: {
      clientId: referrerUser.client!.id,
      providerId: providerUser.provider!.id,
      providerServiceId: providerServiceForSubscription.id,
      frequency: SubscriptionFrequency.WEEKLY,
      status: SubscriptionStatus.ACTIVE,
      nextGenerationDate: addDays(now, 7),
    },
    create: {
      id: 'SUB-001',
      clientId: referrerUser.client!.id,
      providerId: providerUser.provider!.id,
      providerServiceId: providerServiceForSubscription.id,
      frequency: SubscriptionFrequency.WEEKLY,
      startDate: now,
      endDate: addDays(now, 365),
      status: SubscriptionStatus.ACTIVE,
      totalPrice: new Prisma.Decimal(150.00),
      nextGenerationDate: addDays(now, 7),
    },
  });
  console.log(`Assinatura 'SUB-001' criada/atualizada.`);

  // Incident
  console.log('Criando/Atualizando incidente...');
  await prisma.incident.upsert({
    where: { id: 'INCIDENT-001' },
    update: {
      reporterId: referrerUser.id,
      type: IncidentType.DAMAGE,
      status: IncidentStatus.PENDING_REVIEW,
    },
    create: {
      id: 'INCIDENT-001',
      reporterId: referrerUser.id,
      bookingId: booking2.id,
      type: IncidentType.DAMAGE,
      description: 'Um objeto foi danificado durante o serviço.', // CORRIGIDO: servio -> serviço
      attachments: [],
      status: IncidentStatus.PENDING_REVIEW,
    },
  });
  console.log(`Incidente 'INCIDENT-001' criado/atualizado.`);

  // PanicAlert
  console.log('Criando/Atualizando alerta de pânico...'); // CORRIGIDO: pnico -> pânico
  await prisma.panicAlert.upsert({
    where: { id: 'PANIC-001' },
    update: {
      userId: referrerUser.id,
      latitude: -23.59,
      longitude: -46.67,
      message: 'Preciso de ajuda urgente!',
      status: 'ACTIVE',
    },
    create: {
      id: 'PANIC-001',
      userId: referrerUser.id,
      latitude: -23.59,
      longitude: -46.67,
      message: 'Preciso de ajuda urgente!',
      status: 'ACTIVE',
    },
  });
  console.log(`Alerta de Pânico 'PANIC-001' criado/atualizado.`); // CORRIGIDO: Pnico -> Pânico

  // GuaranteeClaim
  console.log('Criando/Atualizando solicitação de garantia...'); // CORRIGIDO: solicitao -> solicitação
  const existingGuaranteeClaim = await prisma.guaranteeClaim.findFirst({
    where: { bookingId: booking2.id },
  });

  if (existingGuaranteeClaim) {
    await prisma.guaranteeClaim.update({
      where: { id: existingGuaranteeClaim.id },
      data: {
        clientId: referrerUser.client!.id,
        providerId: providerUser.provider!.id,
        status: ClaimStatus.PENDING,
      },
    });
  } else {
    await prisma.guaranteeClaim.create({
      data: {
        bookingId: booking2.id,
        clientId: referrerUser.client!.id,
        providerId: providerUser.provider!.id,
        description: 'A limpeza não atendeu às expectativas em uma área específica.', // CORRIGIDO: no -> não, s -> às, rea -> área, especfica -> específica
        attachments: [],
        estimatedValue: new Prisma.Decimal(50.00),
        status: ClaimStatus.PENDING,
      },
    });
  }
  console.log(`Solicitação de Garantia para Booking ${booking2.id} criada/atualizada.`); // CORRIGIDO: Solicitao -> Solicitação

  console.log('Seed completo com fluxo LIVE e avaliações em massa! ?'); // CORRIGIDO: avaliaes -> avaliações
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




































