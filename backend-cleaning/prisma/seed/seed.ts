import {
  PrismaClient,
  UserRole,
  Prisma,
  VerificationStatus,
  BookingStatus,
  TransactionType,
  PricingType, // Importar o novo enum PricingType
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seed...');

  // --- Funções Auxiliares para Endereço (para evitar repetição e simplificar) ---
  async function upsertAddress(addressData: any) {
    const existingAddress = await prisma.address.findFirst({
        where: {
          cep: addressData.cep,
          street: addressData.street,
          number: addressData.number,
          city: addressData.city,
          state: addressData.state
        }
    });

    if (existingAddress) {
        return prisma.address.update({
            where: { id: existingAddress.id },
            data: addressData
        });
    } else {
        return prisma.address.create({ data: addressData });
    }
  }


  // --- Usuária Teste 1 (CLIENT) ---
  const teste1Email = 'teste1@cleaning.com';
  const teste1Password = 'teste123'; // Senha conhecida para teste
  const hashedTeste1Password = await bcrypt.hash(teste1Password, 8);

  const test1Address = await upsertAddress({
    street: 'Rua Teste 123',
    city: 'São Paulo',
    state: 'SP',
    cep: '01000-000',
    number: 's/n',
    neighborhood: 'Centro',
  });

  const test1User = await prisma.user.upsert({
    where: { email: teste1Email },
    update: {
      passwordHash: hashedTeste1Password,
      role: UserRole.CLIENT,
      avatarUrl: 'https://randomuser.me/api/portraits/women/55.jpg',
      client: {
        upsert: {
          create: {
            fullName: 'Ana Cliente Teste',
            phone: '11900000000',
            address: { connect: { id: test1Address.id } },
          },
          update: {
            fullName: 'Ana Cliente Teste',
            phone: '11900000000',
            address: { connect: { id: test1Address.id } },
          },
        },
      },
    },
    create: {
      email: teste1Email,
      passwordHash: hashedTeste1Password,
      role: UserRole.CLIENT,
      avatarUrl: 'https://randomuser.me/api/portraits/women/55.jpg',
      client: {
        create: {
          fullName: 'Ana Cliente Teste',
          phone: '11900000000',
          address: { connect: { id: test1Address.id } },
        },
      },
    },
    include: { client: true },
  });
  console.log(`Usuária Cliente 'Teste 1' (${teste1Email}) criada/atualizada.`);


  // --- Admin com Perfil de Cliente (Mulher) ---
  const adminClientEmail = 'admin.client@cleaning.com';
  const adminClientPassword = 'adminclientpass';
  const hashedAdminClientPassword = await bcrypt.hash(adminClientPassword, 10);

  const adminClientAddress = await upsertAddress({
    cep: '01000-000', street: 'Rua da Admin Cliente', number: '1', neighborhood: 'Centro', city: 'São Paulo', state: 'SP',
  });

  const adminClientUser = await prisma.user.upsert({
    where: { email: adminClientEmail },
    update: {
      passwordHash: hashedAdminClientPassword,
      role: UserRole.ADMIN,
      avatarUrl: 'https://randomuser.me/api/portraits/women/90.jpg', // Avatar feminino
    },
    create: {
      email: adminClientEmail,
      passwordHash: hashedAdminClientPassword,
      role: UserRole.ADMIN,
      avatarUrl: 'https://randomuser.me/api/portraits/women/90.jpg', // Avatar feminino
    },
    include: { client: true },
  });

  // Garante que o perfil de cliente é criado/atualizado APÓS o usuário
  if (!adminClientUser.client) { // Se não tem clientDetails, cria
    await prisma.client.create({
      data: {
        userId: adminClientUser.id,
        fullName: 'Admin Cliente Teste',
        phone: '11911111111',
        address: { connect: { id: adminClientAddress.id } }
      }
    });
  } else { // Se já tem, atualiza
    await prisma.client.update({
      where: { id: adminClientUser.client.id },
      data: {
        fullName: 'Admin Cliente Teste',
        phone: '11911111111',
        address: { connect: { id: adminClientAddress.id } }
      }
    });
  }
  console.log(`Usuária Admin/Cliente '${adminClientEmail}' criada/atualizada.`);

  // --- Admin com Perfil de Provedor (Mulher) ---
  const adminProviderEmail = 'admin.provider@cleaning.com';
  const adminProviderPassword = 'adminproviderpass';
  const hashedAdminProviderPassword = await bcrypt.hash(adminProviderPassword, 10);

  const adminProviderAddress = await upsertAddress({
    cep: '02000-000', street: 'Avenida Admin Provedora', number: '2', neighborhood: 'Vila Admin', city: 'Rio de Janeiro', state: 'RJ',
  });

  const adminProviderUser = await prisma.user.upsert({
    where: { email: adminProviderEmail },
    update: {
      passwordHash: hashedAdminProviderPassword,
      role: UserRole.ADMIN,
      avatarUrl: 'https://randomuser.me/api/portraits/women/80.jpg', // Avatar feminino
    },
    create: {
      email: adminProviderEmail, passwordHash: hashedAdminProviderPassword, role: UserRole.ADMIN, avatarUrl: 'https://randomuser.me/api/portraits/women/80.jpg', // Avatar feminino
    },
    include: { provider: true },
  });

  // Garante que o perfil de provedor é criado/atualizado APÓS o usuário
  if (!adminProviderUser.provider) { // Se não tem providerDetails, cria
    await prisma.provider.create({
      data: {
        userId: adminProviderUser.id,
        fullName: 'Admin Provedora Teste',
        cpf: '000.000.000-00',
        dateOfBirth: new Date('1980-01-01'),
        phone: '11922222222',
        yearsOfExperience: 5,
        avatarUrl: 'https://randomuser.me/api/portraits/women/80.jpg',
        verificationStatus: VerificationStatus.APPROVED, // Status de verificação inicial
        bio: 'Administradora que também atua como provedora.',
        pixKey: 'admin.provider@pix.com',
        address: { connect: { id: adminProviderAddress.id } },
      }
    });
  } else { // Se já tem, atualiza
    await prisma.provider.update({
      where: { id: adminProviderUser.provider.id },
      data: {
        fullName: 'Admin Provedora Teste',
        cpf: '000.000.000-00',
        dateOfBirth: new Date('1980-01-01'),
        phone: '11922222222',
        yearsOfExperience: 5,
        avatarUrl: 'https://randomuser.me/api/portraits/women/80.jpg',
        verificationStatus: VerificationStatus.APPROVED, // Status de verificação inicial
        bio: 'Administradora que também atua como provedora.',
        pixKey: 'admin.provider@pix.com',
        address: { connect: { id: adminProviderAddress.id } },
      }
    });
  }
  console.log(`Usuária Admin/Provedora '${adminProviderEmail}' criada/atualizada.`);


  // --- ADICIONADO: CRIAÇÃO DE SERVIÇOS (CATEGORIAS) COM ÍCONES E TIPO DE PREÇO ---
  console.log('Criando/Atualizando serviços (categorias)...');

  type ServiceSeedData = {
    name: string;
    description: string;
    fixedPrice: number | null; // Adicionado
    hourlyRate: number | null; // Adicionado
    icon: string;
  };

  const servicesData: ServiceSeedData[] = [
    { name: 'Residencial', description: 'Limpeza completa de residências.', fixedPrice: 150.0, hourlyRate: null, icon: 'residencial.png' },
    { name: 'Comercial', description: 'Limpeza para ambientes comerciais.', fixedPrice: null, hourlyRate: 50.0, icon: 'comercial.png' },
    { name: 'Pós-Obra', description: 'Limpeza detalhada após reformas e construções.', fixedPrice: 300.0, hourlyRate: null, icon: 'obra.png' },
    { name: 'Vidros', description: 'Limpeza especializada de janelas e superfícies de vidro.', fixedPrice: 100.0, hourlyRate: null, icon: 'vidro.png' },
    { name: 'Escritório', description: 'Limpeza e organização de espaços de escritório.', fixedPrice: 180.0, hourlyRate: null, icon: 'escritorio.png' },
    { name: 'Estofados', description: 'Limpeza e higienização de estofados.', fixedPrice: 120.0, hourlyRate: null, icon: 'estofados.png' },
    { name: 'Passadoria', description: 'Serviço de passar roupas.', fixedPrice: null, hourlyRate: 25.0, icon: 'passadoria.png' },
  ];

  for (const serviceData of servicesData) {
    let servicePrice: Prisma.Decimal | null = null;
    let servicePricingType: PricingType | null = null;

    if (serviceData.fixedPrice !== null) {
      servicePrice = new Prisma.Decimal(serviceData.fixedPrice);
      servicePricingType = PricingType.FIXED_PRICE;
    } else if (serviceData.hourlyRate !== null) {
      servicePrice = new Prisma.Decimal(serviceData.hourlyRate);
      servicePricingType = PricingType.HOURLY;
    }

    await prisma.service.upsert({
      where: { name: serviceData.name },
      update: {
        description: serviceData.description,
        price: servicePrice || new Prisma.Decimal(0), // Atribui o preço calculado
        defaultPricingType: servicePricingType, // Atribui o tipo de precificação
        icon: serviceData.icon,
      },
      create: {
        name: serviceData.name,
        description: serviceData.description,
        price: servicePrice || new Prisma.Decimal(0), // Atribui o preço calculado
        defaultPricingType: servicePricingType, // Atribui o tipo de precificação
        icon: serviceData.icon,
      },
    });
    console.log(`Serviço '${serviceData.name}' criado/atualizado.`);
  }

  // --- ADICIONADO: CRIAÇÃO E ATUALIZAÇÃO DE PROVEDORAS DE TESTE (SOMENTE MULHERES) ---
  console.log('Criando/Atualizando provedoras de teste...');

  type ProviderSeedData = {
    email: string;
    password: string;
    fullName: string;
    cpf: string;
    dateOfBirth: Date;
    phone: string;
    yearsOfExperience: number;
    avatarUrl: string;
    verificationStatus: VerificationStatus;
    bio: string;
    address: {
      cep: string;
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
    };
    services: string[];
    pixKey: string;
  };

  const testProvidersData: ProviderSeedData[] = [
    {
      email: 'provider1@cleaning.com',
      password: 'testprovider1pass',
      fullName: 'Maria da Silva',
      cpf: '111.111.111-11',
      dateOfBirth: new Date('1990-05-15'),
      phone: '11933333333',
      avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
      yearsOfExperience: 3,
      verificationStatus: VerificationStatus.APPROVED, // Aprovada para testes
      bio: 'Especialista em limpeza residencial com foco em detalhes e organização. Amo deixar ambientes brilhantes!',
      address: {
        cep: '01311-000', street: 'Av. Paulista', number: '1000', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP',
      },
      services: ['Residencial', 'Pós-Obra'],
      pixKey: 'mariadasilva.pix@email.com',
    },
    {
      email: 'provider2@cleaning.com',
      password: 'testprovider2pass',
      fullName: 'Carolina Santos',
      cpf: '222.222.222-22',
      dateOfBirth: new Date('1988-11-20'),
      phone: '11944444444',
      yearsOfExperience: 7,
      avatarUrl: 'https://randomuser.me/api/portraits/women/75.jpg',
      verificationStatus: VerificationStatus.APPROVED, // Aprovada para testes
      bio: 'Limpeza comercial eficiente e confiável. Atendo grandes e pequenos escritórios com excelência.',
      address: {
        cep: '04543-010', street: 'R. Joaquim Floriano', number: '500', neighborhood: 'Itaim Bibi', city: 'São Paulo', state: 'SP',
      },
      services: ['Comercial', 'Escritório'],
      pixKey: 'carolina.santos@banco.com.br',
    },
    {
      email: 'provider3@cleaning.com',
      password: 'testprovider3pass',
      fullName: 'Helena Teste',
      cpf: '333.333.333-33',
      dateOfBirth: new Date('1995-03-01'),
      phone: '11955555555',
      yearsOfExperience: 2,
      avatarUrl: 'https://randomuser.me/api/portraits/women/12.jpg',
      verificationStatus: VerificationStatus.PENDING_INITIAL_REVIEW, // Pendente de verificação para testes
      bio: 'Profissional organizada e atenciosa, buscando sempre a satisfação da cliente.',
      address: {
        cep: '03100-000', street: 'Rua das Cores', number: '50', neighborhood: 'Mooca', city: 'São Paulo', state: 'SP',
      },
      services: ['Residencial', 'Passadoria'],
      pixKey: 'helena.pix@email.com',
    }
  ];

  for (const providerData of testProvidersData) {
    const hashedPass = await bcrypt.hash(providerData.password, 10);
    let user = await prisma.user.upsert({ // Changed to 'let' to allow re-assignment
      where: { email: providerData.email },
      update: {
        passwordHash: hashedPass,
        role: UserRole.PROVIDER,
        avatarUrl: providerData.avatarUrl,
      },
      create: {
        email: providerData.email,
        passwordHash: hashedPass,
        role: UserRole.PROVIDER,
        avatarUrl: providerData.avatarUrl,
      },
      include: { provider: true },
 });

    const providerAddress = await upsertAddress(providerData.address);

    // Garante que o perfil de provedor é criado/atualizado APÓS o usuário
    if (!user.provider) { // Se não tem providerDetails, cria
      const newProviderProfile = await prisma.provider.create({
        data: {
          userId: user.id,
          fullName: providerData.fullName,
          cpf: providerData.cpf,
          dateOfBirth: new Date('1980-01-01'), // Fixed date for consistency
          phone: providerData.phone,
          yearsOfExperience: providerData.yearsOfExperience,
          avatarUrl: providerData.avatarUrl,
          verificationStatus: providerData.verificationStatus,
          bio: providerData.bio,
          pixKey: providerData.pixKey,
          address: { connect: { id: providerAddress.id } },
        }
      });
      // IMPORTANT: Re-fetch the user object to include the newly created provider profile
      user = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { provider: true },
      });
      console.log(`Usuária '${providerData.email}' existia, perfil de provedora criado e usuário recarregado.`);
    } else { // Se já tem, atualiza
      await prisma.provider.update({
        where: { id: user.provider.id },
        data: {
          fullName: providerData.fullName,
          cpf: providerData.cpf,
          dateOfBirth: providerData.dateOfBirth,
          phone: providerData.phone,
          yearsOfExperience: providerData.yearsOfExperience,
          avatarUrl: providerData.avatarUrl,
          verificationStatus: providerData.verificationStatus,
          bio: providerData.bio,
          pixKey: providerData.pixKey,
          address: { connect: { id: providerAddress.id } },
        }
      });
      // Even if updated, re-fetch to ensure consistency (optional but good practice)
      user = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        include: { provider: true },
      });
      console.log(`Usuária Provedora de Teste '${providerData.email}' já existe. Perfil de provedora e usuária atualizados.`);
    }

    // Lógica para associar serviços ao provedor
    // NOVO LOG AQUI para depurar se o provedor está disponível antes de tentar associar serviços
    console.log(`DEBUG: Attempting to associate services for provider ${providerData.fullName}. Provider ID: ${user.provider?.id}, Services to add: ${providerData.services?.length || 0}`);


    if (user.provider?.id && providerData.services && providerData.services.length > 0) {
      for (const serviceName of providerData.services) {
        // Buscar o serviço do banco de dados para obter o 'price' e 'defaultPricingType'
        const service = await prisma.service.findUnique({ where: { name: serviceName } });
        
        // Log para mostrar o resultado da busca pelo serviço
        console.log(`DEBUG (Service Lookup): Looking for service '${serviceName}'. Found: ${service ? 'Yes (ID: ' + service.id + ', Price: ' + service.price + ', PricingType: ' + service.defaultPricingType + ')' : 'No'}`);

        if (service) {
          await prisma.providerService.upsert({
            where: {
              providerId_serviceId: {
                providerId: user.provider.id,
                serviceId: service.id,
              },
            },
            update: {
              price: service.price, // Usar o preço do serviço base
              pricingType: service.defaultPricingType || PricingType.FIXED_PRICE, // Usar o tipo de precificação do serviço base, com fallback
              durationMinutes: 60,
              description: `Serviço ${serviceName} por ${providerData.fullName} (Atualizado).`,
            },
            create: {
              providerId: user.provider.id,
              serviceId: service.id,
              price: service.price, // Usar o preço do serviço base
              pricingType: service.defaultPricingType || PricingType.FIXED_PRICE, // Usar o tipo de precificação do serviço base, com fallback
              durationMinutes: 60,
              description: `Serviço ${serviceName} por ${providerData.fullName}.`,
            },
          });
          console.log(`    - Serviço '${serviceName}' associado/atualizado à provedora ${providerData.fullName} com preço ${service.price}.`);
        } else {
          // Mensagem de aviso mais clara se o serviço não for encontrado
          console.warn(`    - WARN: Serviço '${serviceName}' não encontrado no banco de dados. Não foi possível associá-lo à provedora ${providerData.fullName}. Verifique a consistência dos nomes dos serviços.`);
        }
      }
    } else {
        // Log que abrange casos onde services ou provider.id não estão presentes
        console.warn(`WARN: Não foi possível associar serviços para a provedora ${providerData.fullName}. Condições de 'user.provider.id' (${!!user.provider?.id}) ou 'providerData.services' (${!!providerData.services && providerData.services.length > 0}) não atendidas.`);
    }
  }


  // --- NOVO: CRIAÇÃO DE CLIENTES DE TESTE ADICIONAIS (SOMENTE MULHERES) ---
  console.log('Criando/Atualizando clientes de teste...');
  type ClientSeedData = {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    address: {
      cep: string;
      street: string;
      number: string;
      neighborhood: string;
      city: string;
      state: string;
    };
  };

  const testClientsData: ClientSeedData[] = [
    {
      email: 'client1@cleaning.com',
      password: 'testclient1pass',
      fullName: 'Ana Cliente',
      phone: '11955555555',
      address: { cep: '01001-001', street: 'Rua do Cliente', number: '10', neighborhood: 'Bairro Novo', city: 'São Paulo', state: 'SP' },
    },
    {
      email: 'client2@cleaning.com',
      password: 'testclient2pass',
      fullName: 'Beatriz Compradora', // Nome feminino
      phone: '21966666666',
      address: { cep: '20000-000', street: 'Av. Teste', number: '20', neighborhood: 'Centro', city: 'Rio de Janeiro', state: 'RJ' },
    },
    {
      email: 'client3@cleaning.com',
      password: 'testclient3pass',
      fullName: 'Laura Avaliadora',
      phone: '11977777777',
      address: { cep: '01002-002', street: 'Rua das Flores', number: '100', neighborhood: 'Jardins', city: 'São Paulo', state: 'SP' },
    },
    {
      email: 'client4@cleaning.com',
      password: 'testclient4pass',
      fullName: 'Fernanda Satisfeita', // Nome feminino
      phone: '11988888888',
      address: { cep: '01003-003', street: 'Av. Brasil', number: '50', neighborhood: 'Consolação', city: 'São Paulo', state: 'SP' },
    },
  ];

  for (const clientData of testClientsData) {
    const hashedPass = await bcrypt.hash(clientData.password, 10);
    const user = await prisma.user.upsert({
      where: { email: clientData.email },
      update: {
        passwordHash: hashedPass,
        avatarUrl: 'https://randomuser.me/api/portraits/women/50.jpg', // Avatar feminino
        role: UserRole.CLIENT,
      },
      create: {
        email: clientData.email,
        passwordHash: hashedPass,
        avatarUrl: 'https://randomuser.me/api/portraits/women/50.jpg', // Avatar feminino
        role: UserRole.CLIENT,
      },
      include: { client: true },
    });

    const clientAddress = await upsertAddress(clientData.address);

    if (user.client) {
      await prisma.client.update({
        where: { id: user.client.id },
        data: {
          fullName: clientData.fullName,
          phone: clientData.phone,
          address: { connect: { id: clientAddress.id } },
        },
      });
      console.log(`Cliente de Teste '${clientData.email}' já existe. Perfil de cliente e usuária atualizados.`);
    } else {
      await prisma.client.create({
        data: {
          userId: user.id,
          fullName: clientData.fullName,
          phone: clientData.phone,
          address: { connect: { id: clientAddress.id } },
        },
      });
      console.log(`Cliente de Teste '${clientData.email}' criada com sucesso!`);
    }
  }


  // --- NOVO: CRIAÇÃO DE DISPONIBILIDADE PARA PROVEDORAS DE TESTE ---
  console.log('Criando disponibilidade de horários para provedoras de teste...');

  // Obtenha os provedores (necessário para o escopo)
  // Recarregar provedores para garantir que os perfis recém-criados estejam incluídos
  const mariaProvider = await prisma.provider.findFirst({ where: { user: { email: 'provider1@cleaning.com' } } });
  const carolinaProvider = await prisma.provider.findFirst({ where: { user: { email: 'provider2@cleaning.com' } } });
  const helenaProvider = await prisma.provider.findFirst({ where: { user: { email: 'provider3@cleaning.com' } } });

  // Função auxiliar para gerar slots de 30 minutos
  function generateTimeSlots(startHour: number, endHour: number): { startTime: string; endTime: string }[] {
    const slots = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const startTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        let endHourSlot = h;
        let endMinuteSlot = m + 30;
        if (endMinuteSlot >= 60) {
          endMinuteSlot -= 60;
          endHourSlot += 1;
        }
        const endTime = `${endHourSlot.toString().padStart(2, '0')}:${endMinuteSlot.toString().padStart(2, '0')}`;
        slots.push({ startTime, endTime });
      }
    }
    return slots;
  }

  const allDaySlots = generateTimeSlots(8, 20); // Slots de 08:00 a 19:30 (terminando às 20:00)

  if (mariaProvider && carolinaProvider && helenaProvider) { // Garante que todos os provedores foram encontrados
    // Disponibilidade genérica para Maria da Silva (Seg-X)
    for (let day = 1; day <= 5; day++) { // Segunda a Sexta
      const mariaSlots = [
        { startTime: '09:00', endTime: '09:30' }, { startTime: '09:30', endTime: '10:00' },
        { startTime: '10:00', endTime: '10:30' }, { startTime: '10:30', endTime: '11:00' },
        { startTime: '11:00', endTime: '11:30' }, { startTime: '11:30', endTime: '12:00' },
        { startTime: '13:00', endTime: '13:30' }, { startTime: '13:30', endTime: '14:00' },
      ];
      for (const slot of mariaSlots) {
        // UPSERT MANUAL para Maria
        const existingAvailability = await prisma.availability.findFirst({
          where: {
            providerId: mariaProvider.id,
            dayOfWeek: day,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        });

        if (existingAvailability) {
          await prisma.availability.update({
            where: { id: existingAvailability.id },
            data: { isAvailable: true },
          });
        } else {
          await prisma.availability.create({
            data: {
              providerId: mariaProvider.id,
              dayOfWeek: day,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: true,
            },
          });
        }
      }
    }
    console.log(`Disponibilidade genérica para Maria da Silva (Seg-Sex) criada/atualizada.`);

    // --- MODIFICAÇÃO: Disponibilidade para Carolina Santos para 06/07/2025, 07/07/2025 e 08/07/2025 ---
    // Usando o ano atual para garantir que as datas sejam futuras ou recentes
    const currentYear = new Date().getFullYear();
    const july06 = new Date(currentYear, 6, 6); // Mês 6 é Julho (0-indexado), Dia 6
    const july07 = new Date(currentYear, 6, 7); // Mês 6 é Julho (0-indexado), Dia 7
    const july08 = new Date(currentYear, 6, 8); // Mês 6 é Julho (0-indexado), Dia 8


    const carolinaSpecificDates = [
        { date: july06, dayOfWeek: july06.getDay() }, // 06/07/2025 é um Domingo (0)
        { date: july07, dayOfWeek: july07.getDay() }, // 07/07/2025 é uma Segunda-feira (1)
        { date: july08, dayOfWeek: july08.getDay() }, // 08/07/2025 é uma Terça-feira (2)
    ];

    for (const specificDate of carolinaSpecificDates) {
      for (const slot of allDaySlots) {
        const existingSpecificAvailability = await prisma.availability.findFirst({
          where: {
            providerId: carolinaProvider.id,
            dayOfWeek: specificDate.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        });

        if (existingSpecificAvailability) {
          await prisma.availability.update({
            where: { id: existingSpecificAvailability.id },
            data: { isAvailable: true },
          });
        } else {
          await prisma.availability.create({
            data: {
              providerId: carolinaProvider.id,
              dayOfWeek: specificDate.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: true,
            },
          });
        }
      }
      console.log(`Disponibilidade completa para Carolina Santos no dia ${specificDate.date.toLocaleDateString('pt-BR')} (Dia da Semana: ${specificDate.dayOfWeek}) criada/atualizada.`);
    }

  } else {
    console.warn('Não foi possível criar disponibilidade. Provedoras não encontradas.');
  }

  if (helenaProvider) {
    for (let day = 1; day <= 5; day += 2) { // Segunda, Quarta, Sexta
      const helenaDaySlots = [
        { startTime: '10:00', endTime: '12:00' }, { startTime: '14:00', endTime: '16:00' },
      ];
      for (const slot of helenaDaySlots) {
        const existingAvailability = await prisma.availability.findFirst({
          where: {
            providerId: helenaProvider.id,
            dayOfWeek: day,
            startTime: slot.startTime,
            endTime: slot.endTime,
          },
        });

        if (existingAvailability) {
          await prisma.availability.update({
            where: { id: existingAvailability.id },
            data: { isAvailable: true },
          });
        } else {
          await prisma.availability.create({
            data: {
              providerId: helenaProvider.id,
              dayOfWeek: day,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: true,
            },
          });
        }
      }
    }
    console.log(`Disponibilidade para Helena Teste (Seg/Qua/Sex) criada/atualizada.`);
  }


  // --- NOVO: CRIAÇÃO DE AGENDAMENTOS E TRANSAÇÕES PARA TESTES DE DASHBOARD/EARNINGS ---
  console.log('Criando agendamentos e transações de teste...');

  const anaClient = await prisma.client.findFirst({ where: { user: { email: 'client1@cleaning.com' } } });
  const beatrizClient = await prisma.client.findFirst({ where: { user: { email: 'client2@cleaning.com' } } });
  const lauraClient = await prisma.client.findFirst({ where: { user: { email: 'client3@cleaning.com' } } });
  const fernandaClient = await prisma.client.findFirst({ where: { user: { email: 'client4@cleaning.com' } } });

  console.log('DEBUG: Clientes encontrados - Ana:', anaClient?.id, 'Beatriz:', beatrizClient?.id, 'Laura:', lauraClient?.id, 'Fernanda:', fernandaClient?.id);
  
  const residentialService = await prisma.service.findUnique({ where: { name: 'Residencial' } });
  const commercialService = await prisma.service.findUnique({ where: { name: 'Comercial' } });

  console.log('DEBUG: Serviços encontrados - Residencial:', residentialService?.id, 'Comercial:', commercialService?.id);


  if (
    mariaProvider &&
    carolinaProvider &&
    anaClient &&
    beatrizClient &&
    lauraClient &&
    fernandaClient &&
    residentialService &&
    commercialService
  ) {
    // --- AGENDAMENTO CONCLUÍDO (para Maria - gera ganhos) ---
    const mariaResidentialService = await prisma.providerService.findFirst({
        where: { providerId: mariaProvider.id, serviceId: residentialService.id },
    });
    console.log('DEBUG: mariaResidentialService:', mariaResidentialService?.id);

    if (mariaResidentialService) { // Adicionada verificação
        const booking1Date = new Date();
        booking1Date.setDate(booking1Date.getDate() - 7);
        const completedBookingMaria = await prisma.booking.create({
            data: {
                clientId: anaClient.id,
                providerId: mariaProvider.id,
                providerServiceId: mariaResidentialService.id,
                scheduledDate: booking1Date, // Passar o objeto Date diretamente
                scheduledTime: '10:00',
                status: BookingStatus.COMPLETED,
                totalPrice: new Prisma.Decimal(150.0),
                notes: 'Limpeza geral da casa.',
            },
        });
        console.log(`Agendamento Concluído ${completedBookingMaria.id} (Maria) criado.`);

        await prisma.transaction.create({
            data: {
                providerId: mariaProvider.id,
                amount: new Prisma.Decimal(150.0),
                type: TransactionType.PAYMENT,
                status: 'COMPLETED',
                description: `Pagamento serviço ${completedBookingMaria.id}`,
                bookingId: completedBookingMaria.id,
            },
        });
        console.log(`Transação de Pagamento para ${completedBookingMaria.id} criada.`);
    } else {
        console.warn('WARN: Maria Residential Service não encontrado, pulando booking de Maria.');
    }


    // --- MÚLTIPLOS AGENDAMENTOS CONCLUÍDOS PARA CAROLINA SANTOS (para permitir múltiplas avaliações) ---
    const carolinaBookingsData = [
      {
        client: lauraClient,
        service: commercialService,
        scheduledTime: '09:00',
        notes: 'Limpeza comercial no escritório para avaliação 1.',
        price: 200.0,
      },
      {
        client: fernandaClient,
        service: commercialService,
        scheduledTime: '10:30',
        notes: 'Limpeza de rotina para avaliação 2.',
        price: 180.0,
      },
      {
        client: anaClient,
        service: commercialService,
        scheduledTime: '14:00',
        notes: 'Limpeza profunda para avaliação 3.',
        price: 220.0,
      },
    ];

    const completedBookingsCarolina = [];

    for (let i = 0; i < carolinaBookingsData.length; i++) {
      const bookingData = carolinaBookingsData[i];
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() - (15 + i * 2)); // Ajusta a data para ser no passado

      const providerServiceForCarolina = await prisma.providerService.findFirst({
        where: { providerId: carolinaProvider.id, serviceId: bookingData.service.id },
      });

      console.log(`DEBUG: ProviderService para Carolina e ${bookingData.service.name}:`, providerServiceForCarolina?.id);
      
      if (!providerServiceForCarolina) {
        console.warn(`WARN: Serviço ${bookingData.service.name} não encontrado para Carolina Santos. Pulando booking.`);
        continue;
      }

      const completedBookingCarolina = await prisma.booking.create({
        data: {
          clientId: bookingData.client.id,
          providerId: carolinaProvider.id,
          providerServiceId: providerServiceForCarolina.id,
          scheduledDate: bookingDate, // Passar o objeto Date diretamente
          scheduledTime: bookingData.scheduledTime,
          status: BookingStatus.COMPLETED,
          totalPrice: new Prisma.Decimal(bookingData.price),
          notes: bookingData.notes,
        },
      });
      completedBookingsCarolina.push(completedBookingCarolina);
      console.log(`Agendamento Concluído ${completedBookingCarolina.id} (Carolina) criado para ${bookingData.client.fullName}.`);

      await prisma.transaction.create({
        data: {
          providerId: carolinaProvider.id,
          amount: new Prisma.Decimal(bookingData.price),
          type: TransactionType.PAYMENT,
          status: 'COMPLETED',
          description: `Pagamento serviço ${completedBookingCarolina.id}`,
          bookingId: completedBookingCarolina.id,
        },
      });
      console.log(`Transação de Pagamento para ${completedBookingCarolina.id} criada.`);
    }

    // --- AGENDAMENTO PENDENTE (para Maria - aparece no dashboard) ---
    const booking2Date = new Date();
    booking2Date.setDate(booking2Date.getDate() + 3); // 3 dias no futuro
    
    const mariaResidentialServiceForPending = await prisma.providerService.findFirst({
        where: { providerId: mariaProvider.id, serviceId: residentialService.id },
    });
    console.log('DEBUG: mariaResidentialServiceForPending:', mariaResidentialServiceForPending?.id);

    if (mariaResidentialServiceForPending) {
        await prisma.booking.create({
            data: {
                clientId: beatrizClient.id,
                providerId: mariaProvider.id,
                providerServiceId: mariaResidentialServiceForPending.id,
                scheduledDate: booking2Date, // Passar o objeto Date diretamente
                scheduledTime: '14:00',
                status: BookingStatus.PENDING,
                totalPrice: new Prisma.Decimal(100.0),
                notes: 'Limpeza de rotina.',
            },
        });
        console.log(`Agendamento Pendente para Maria criado.`);
    } else {
        console.warn('WARN: Maria Residential Service não encontrado para booking pendente, pulando.');
    }


    // --- AGENDAMENTO CONFIRMADO (para Carolina - aparece no dashboard) ---
    const booking3Date = new Date();
    booking3Date.setDate(booking3Date.getDate() + 5); // 5 dias no futuro

    const carolinaCommercialService = await prisma.providerService.findFirst({
        where: { providerId: carolinaProvider.id, serviceId: commercialService.id },
    });
    console.log('DEBUG: carolinaCommercialService:', carolinaCommercialService?.id);

    if (carolinaCommercialService) {
        await prisma.booking.create({
            data: {
                clientId: anaClient.id,
                providerId: carolinaProvider.id,
                providerServiceId: carolinaCommercialService.id,
                scheduledDate: booking3Date, // Passar o objeto Date diretamente
                scheduledTime: '09:00',
                status: BookingStatus.CONFIRMED,
                totalPrice: new Prisma.Decimal(200.0),
                notes: 'Limpeza escritório.',
            },
        });
        console.log(`Agendamento Confirmado para Carolina criado.`);
    } else {
        console.warn('WARN: Carolina Commercial Service não encontrado para booking confirmado, pulando.');
    }


    // --- TRANSAÇÃO DE SAQUE PENDENTE (para Carolina - aparece em pendingWithdrawals) ---
    await prisma.transaction.create({
      data: {
        providerId: carolinaProvider.id,
        amount: new Prisma.Decimal(50.0),
        type: TransactionType.WITHDRAWAL,
        status: 'PENDING',
        description: 'Solicitação de saque de teste.',
      },
    });
    console.log(`Transação de Saque Pendente para Carolina criada.`);

    // --- TRANSAÇÃO DE SAQUE CONCLUÍDA (para Maria - aparece no histórico, não em pendente) ---
    await prisma.transaction.create({
      data: {
        providerId: mariaProvider.id,
        amount: new Prisma.Decimal(25.0),
        type: TransactionType.WITHDRAWAL,
        status: 'COMPLETED',
        description: 'Saque anterior concluído.',
      },
    });
    console.log(`Transação de Saque Concluída para Maria criada.`);

    // --- NOVO: CRIAÇÃO DE AVALIAÇÕES (REVIEWS) ---
    console.log('Criando avaliações para Carolina Santos...');

    const reviewDetails = [
      {
        comment: 'Excelente trabalho! Carolina é muito profissional e deixou meu escritório impecável. Recomendo!',
        rating: 5,
      },
      {
        comment: 'Serviço muito bom, pontual e atencioso. A limpeza foi completa e superou as expectativas.',
        rating: 4,
      },
      {
        comment: 'Carolina é a melhor! Rápida, eficiente e muito cuidadosa com os detalhes. Contratarei novamente.',
        rating: 5,
      },
    ];

    console.log('DEBUG: completedBookingsCarolina before review loop:', completedBookingsCarolina);
    console.log('DEBUG: reviewDetails before review loop:', reviewDetails);

    for (let i = 0; i < completedBookingsCarolina.length; i++) {
      const booking = completedBookingsCarolina[i];
      const detail = reviewDetails[i];

      if (!booking || !detail) { // Esta é a linha onde o erro estava, agora com mais logs para debug
        console.warn(`WARN: Skipping review creation due to missing booking or review detail at index ${i}.`);
        console.warn('DEBUG: Booking at index', i, ':', booking);
        console.warn('DEBUG: Detail at index', i, ':', detail);
        continue;
      }

      await prisma.review.upsert({
        where: {
          bookingId: booking.id,
        },
        update: {
          rating: detail.rating,
          comment: detail.comment,
          clientId: booking.clientId,
          providerId: booking.providerId,
        },
        create: {
          bookingId: booking.id,
          clientId: booking.clientId,
          providerId: booking.providerId,
          rating: detail.rating,
          comment: detail.comment,
        },
      });
      console.log(`Avaliação de ${booking.clientId} para Carolina Santos (booking ${booking.id}) criada/atualizada.`);
    }
  } else {
    console.warn('Não foi possível criar agendamentos/transações/avaliações de teste. Provedoras, clientes ou serviços essenciais não encontrados.');
    console.warn('DEBUG: mariaProvider:', !!mariaProvider, 'carolinaProvider:', !!carolinaProvider, 'anaClient:', !!anaClient, 'beatrizClient:', !!beatrizClient, 'lauraClient:', !!lauraClient, 'fernandaClient:', !!fernandaClient, 'residentialService:', !!residentialService, 'commercialService:', !!commercialService);
  }

  console.log('Seed completo!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });