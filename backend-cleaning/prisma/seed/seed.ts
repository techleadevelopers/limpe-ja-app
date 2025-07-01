import {
  PrismaClient,
  UserRole,
  Prisma,
  VerificationStatus,
  BookingStatus,
  TransactionType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o processo de seed...');

  // --- Funções Auxiliares para Endereço (para evitar repetição e simplificar) ---
  async function upsertAddress(addressData: any) {
    // Tenta encontrar um endereço existente pelo CEP, rua, número, etc.
    // Ou cria um novo se não existir.
    // IMPORTANTE: Se o endereço puder ser compartilhado entre clientes/provedores,
    // a lógica de 'where' precisa ser mais robusta ou você sempre cria um novo.
    // Para simplificar, vou usar o CEP e número como um critério de upsert aqui.
    // Se um endereço for 1:1, a melhor forma é criar e conectar.
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


  // --- Usuário Teste 1 (CLIENT) ---
  const teste1Email = 'teste1@cleaning.com';
  const teste1Password = 'teste123';
  const hashedTeste1Password = await bcrypt.hash(teste1Password, 8);

  // Cria/Atualiza o endereço primeiro
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
            fullName: 'Teste 1',
            phone: '11900000000',
            address: { connect: { id: test1Address.id } }, // Conecta o endereço já criado/atualizado
          },
          update: {
            fullName: 'Teste 1',
            phone: '11900000000',
            address: { connect: { id: test1Address.id } }, // Conecta o endereço já criado/atualizado
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
          fullName: 'Teste 1',
          phone: '11900000000',
          address: { connect: { id: test1Address.id } }, // Conecta o endereço já criado
        },
      },
    },
    include: { client: true },
  });
  console.log(`Usuário Cliente 'Teste 1' (${teste1Email}) criado/atualizado.`);


  // --- Admin com Perfil de Cliente ---
  const adminClientEmail = 'admin.client@cleaning.com';
  const adminClientPassword = 'adminclientpass';
  const hashedAdminClientPassword = await bcrypt.hash(adminClientPassword, 10);

  const adminClientAddress = await upsertAddress({
    cep: '01000-000', street: 'Rua do Admin Cliente', number: '1', neighborhood: 'Centro', city: 'São Paulo', state: 'SP',
  });

  const adminClientUser = await prisma.user.upsert({
    where: { email: adminClientEmail },
    update: {
      passwordHash: hashedAdminClientPassword,
      role: UserRole.ADMIN,
      avatarUrl: 'https://randomuser.me/api/portraits/men/90.jpg',
      client: {
        upsert: {
          create: { fullName: 'Admin Cliente Teste', phone: '11911111111', address: { connect: { id: adminClientAddress.id } } },
          update: { fullName: 'Admin Cliente Teste', phone: '11911111111', address: { connect: { id: adminClientAddress.id } } },
        },
      },
    },
    create: {
      email: adminClientEmail,
      passwordHash: hashedAdminClientPassword,
      role: UserRole.ADMIN,
      avatarUrl: 'https://randomuser.me/api/portraits/men/90.jpg',
      client: {
        create: { fullName: 'Admin Cliente Teste', phone: '11911111111', address: { connect: { id: adminClientAddress.id } } },
      },
    },
    include: { client: true },
  });
  console.log(`Usuário Admin/Cliente '${adminClientEmail}' criado/atualizado.`);

  // --- Admin com Perfil de Provedor ---
  const adminProviderEmail = 'admin.provider@cleaning.com';
  const adminProviderPassword = 'adminproviderpass';
  const hashedAdminProviderPassword = await bcrypt.hash(adminProviderPassword, 10);

  const adminProviderAddress = await upsertAddress({
    cep: '02000-000', street: 'Avenida Admin Provedor', number: '2', neighborhood: 'Vila Admin', city: 'Rio de Janeiro', state: 'RJ',
  });

  const adminProviderUser = await prisma.user.upsert({
    where: { email: adminProviderEmail },
    update: {
      passwordHash: hashedAdminProviderPassword,
      role: UserRole.ADMIN,
      avatarUrl: 'https://randomuser.me/api/portraits/men/80.jpg',
      provider: {
        upsert: {
          create: {
            fullName: 'Admin Provedor Teste', cpf: '000.000.000-00', dateOfBirth: new Date('1980-01-01'), phone: '11922222222', yearsOfExperience: 5, avatarUrl: 'https://randomuser.me/api/portraits/men/80.jpg',
            verificationStatus: VerificationStatus.APPROVED, bio: 'Administrador que também atua como provedor.', pixKey: 'admin.provider@pix.com',
            address: { connect: { id: adminProviderAddress.id } }, // Conecta o endereço
          },
          update: {
            fullName: 'Admin Provedor Teste', cpf: '000.000.000-00', dateOfBirth: new Date('1980-01-01'), phone: '11922222222', yearsOfExperience: 5, avatarUrl: 'https://randomuser.me/api/portraits/men/80.jpg',
            verificationStatus: VerificationStatus.APPROVED, bio: 'Administrador que também atua como provedor.', pixKey: 'admin.provider@pix.com',
            address: { connect: { id: adminProviderAddress.id } }, // Conecta o endereço
          },
        },
      },
    },
    create: {
      email: adminProviderEmail, passwordHash: hashedAdminProviderPassword, role: UserRole.ADMIN, avatarUrl: 'https://randomuser.me/api/portraits/men/80.jpg',
      provider: {
        create: {
          fullName: 'Admin Provedor Teste', cpf: '000.000.000-00', dateOfBirth: new Date('1980-01-01'), phone: '11922222222', yearsOfExperience: 5, avatarUrl: 'https://randomuser.me/api/portraits/men/80.jpg',
          verificationStatus: VerificationStatus.APPROVED, bio: 'Administrador que também atua como provedor.', pixKey: 'admin.provider@pix.com',
          address: { connect: { id: adminProviderAddress.id } }, // Conecta o endereço
        },
      },
    },
    include: { provider: true },
  });
  console.log(`Usuário Admin/Provedor '${adminProviderEmail}' criado/atualizado.`);

  // --- ADICIONADO: CRIAÇÃO DE SERVIÇOS (CATEGORIAS) COM ÍCONES ---
  console.log('Criando/Atualizando serviços (categorias)...');

  type ServiceSeedData = {
    name: string;
    description: string;
    price: number;
    icon: string;
  };

  const servicesData: ServiceSeedData[] = [
    { name: 'Residencial', description: 'Limpeza completa de residências.', price: 150.0, icon: 'residencial.png' },
    { name: 'Comercial', description: 'Limpeza para ambientes comerciais.', price: 200.0, icon: 'comercial.png' },
    { name: 'Pós-Obra', description: 'Limpeza detalhada após reformas e construções.', price: 300.0, icon: 'obra.png' },
    { name: 'Vidros', description: 'Limpeza especializada de janelas e superfícies de vidro.', price: 100.0, icon: 'vidro.png' },
    { name: 'Escritório', description: 'Limpeza e organização de espaços de escritório.', price: 180.0, icon: 'escritorio.png' },
    { name: 'Estofados', description: 'Limpeza e higienização de estofados.', price: 120.0, icon: 'estofados.png' },
    { name: 'Passadoria', description: 'Serviço de passar roupas.', price: 80.0, icon: 'passadoria.png' },
  ];

  for (const service of servicesData) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: {
        description: service.description,
        price: new Prisma.Decimal(service.price),
        icon: service.icon,
      },
      create: {
        name: service.name,
        description: service.description,
        price: new Prisma.Decimal(service.price),
        icon: service.icon,
      },
    });
    console.log(`Serviço '${service.name}' criado/atualizado.`);
  }

  // --- ADICIONADO: CRIAÇÃO E ATUALIZAÇÃO DE PROVEDORES DE TESTE (PLACEHOLDERS) ---
  console.log('Criando/Atualizando provedores de teste...');

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
      yearsOfExperience: 3,
      avatarUrl: 'https://randomuser.me/api/portraits/women/68.jpg',
      verificationStatus: VerificationStatus.APPROVED,
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
      fullName: 'Carolina Santos', // Alterado de 'João de Souza' para 'Carolina Santos'
      cpf: '222.222.222-22',
      dateOfBirth: new Date('1988-11-20'),
      phone: '11944444444',
      yearsOfExperience: 7,
      avatarUrl: 'https://randomuser.me/api/portraits/women/75.jpg', // Alterado para foto de mulher
      verificationStatus: VerificationStatus.APPROVED,
      bio: 'Limpeza comercial eficiente e confiável. Atendo grandes e pequenos escritórios com excelência.',
      address: {
        cep: '04543-010', street: 'R. Joaquim Floriano', number: '500', neighborhood: 'Itaim Bibi', city: 'São Paulo', state: 'SP',
      },
      services: ['Comercial', 'Escritório'],
      pixKey: 'joao.souza@banco.com.br', // Manter se não for um problema
    },
    {
      email: 'provider3@cleaning.com',
      password: 'testprovider3pass',
      fullName: 'Helena Teste',
      cpf: '333.333.333-33',
      dateOfBirth: new Date('1995-03-01'),
      phone: '11955555555',
      yearsOfExperience: 2,
      avatarUrl: 'https://randomuser.me/api/portraits/thumb/women/12.jpg',
      verificationStatus: VerificationStatus.PENDING_INITIAL_REVIEW,
      bio: 'Profissional organizada e atenciosa, buscando sempre a satisfação do cliente.',
      address: {
        cep: '03100-000', street: 'Rua das Cores', number: '50', neighborhood: 'Mooca', city: 'São Paulo', state: 'SP',
      },
      services: ['Residencial', 'Passadoria'],
      pixKey: 'helena.pix@email.com',
    }
  ];

  for (const providerData of testProvidersData) {
    const hashedPass = await bcrypt.hash(providerData.password, 10);
    const user = await prisma.user.upsert({
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

    // Criar/atualizar o endereço do provedor separadamente primeiro
    const providerAddress = await upsertAddress(providerData.address);

    if (user.provider) {
      // Se o provedor já existe, atualize-o
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
          address: { connect: { id: providerAddress.id } }, // Conecta o endereço já criado/atualizado
        },
      });
      console.log(`Usuário Provedor de Teste '${providerData.email}' já existe. Perfil de provedor e usuário atualizados.`);
    } else {
      // Se o usuário existe, mas o perfil de provedor não, crie o perfil de provedor
      const newProviderProfile = await prisma.provider.create({
        data: {
          userId: user.id,
          fullName: providerData.fullName,
          cpf: providerData.cpf,
          dateOfBirth: providerData.dateOfBirth,
          phone: providerData.phone,
          yearsOfExperience: providerData.yearsOfExperience,
          avatarUrl: providerData.avatarUrl,
          verificationStatus: providerData.verificationStatus,
          bio: providerData.bio,
          pixKey: providerData.pixKey,
          address: { connect: { id: providerAddress.id } }, // Conecta o endereço
        },
      });
      console.log(`Usuário '${providerData.email}' existia, perfil de provedor criado.`);
    }

    // Restante da lógica de services for provider...
    if (user.provider?.id && providerData.services && providerData.services.length > 0) { // Use user.provider?.id aqui
      for (const serviceName of providerData.services) {
        const service = await prisma.service.findUnique({ where: { name: serviceName } });
        if (service) {
          await prisma.providerService.upsert({
            where: {
              providerId_serviceId: {
                providerId: user.provider.id, // Use user.provider.id aqui
                serviceId: service.id,
              },
            },
            update: {
              price: new Prisma.Decimal(100.0),
              durationMinutes: 60,
              description: `Serviço ${serviceName} por ${providerData.fullName} (Atualizado).`,
            },
            create: {
              providerId: user.provider.id, // Use user.provider.id aqui
              serviceId: service.id,
              price: new Prisma.Decimal(100.0),
              durationMinutes: 60,
              description: `Serviço ${serviceName} por ${providerData.fullName}.`,
            },
          });
          console.log(`    - Serviço '${serviceName}' associado/atualizado ao provedor ${providerData.fullName}.`);
        } else {
          console.warn(`    - Serviço '${serviceName}' não encontrado para associar/atualizar ao provedor ${providerData.fullName}.`);
        }
      }
    }
  }


  // --- NOVO: CRIAÇÃO DE CLIENTES DE TESTE ADICIONAIS ---
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
      fullName: 'Carlos Comprador',
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
      fullName: 'Pedro Satisfeito',
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
        avatarUrl: 'https://randomuser.me/api/portraits/women/50.jpg',
        role: UserRole.CLIENT,
      },
      create: {
        email: clientData.email,
        passwordHash: hashedPass,
        avatarUrl: 'https://randomuser.me/api/portraits/women/50.jpg',
        role: UserRole.CLIENT,
      },
      include: { client: true },
    });

    const clientAddress = await upsertAddress(clientData.address); // Cria/atualiza o endereço do cliente

    if (user.client) {
      await prisma.client.update({
        where: { id: user.client.id },
        data: {
          fullName: clientData.fullName,
          phone: clientData.phone,
          address: { connect: { id: clientAddress.id } }, // Conecta o endereço
        },
      });
      console.log(`Cliente de Teste '${clientData.email}' já existe. Perfil de cliente e usuário atualizados.`);
    } else {
      await prisma.client.create({
        data: {
          userId: user.id,
          fullName: clientData.fullName,
          phone: clientData.phone,
          address: { connect: { id: clientAddress.id } }, // Conecta o endereço
        },
      });
      console.log(`Cliente de Teste '${clientData.email}' criado com sucesso!`);
    }
  }


  // --- NOVO: CRIAÇÃO DE DISPONIBILIDADE PARA PROVEDORES DE TESTE ---
  console.log('Criando disponibilidade de horários para provedores de teste...');

  // Obtenha os provedores (necessário para o escopo)
  const mariaProvider = await prisma.provider.findFirst({ where: { user: { email: 'provider1@cleaning.com' } } });
  const carolinaProvider = await prisma.provider.findFirst({ where: { user: { email: 'provider2@cleaning.com' } } }); // Alterado para carolinaProvider
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

  if (mariaProvider && carolinaProvider) { // Alterado para carolinaProvider
    // Disponibilidade genérica para Maria da Silva (Seg-Sex)
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

    // --- MODIFICAÇÃO: Disponibilidade para Carolina Santos para 30/06, 01/07 e 02/07 (Seg, Ter, Qua) ---
    // Usando Date para obter o dia da semana correto para as datas futuras
    const today = new Date();
    // 30 de junho de 2025 (Segunda-feira)
    const june30 = new Date(today.getFullYear(), 5, 30); // Mês 5 é Junho (0-indexado)
    // 1 de julho de 2025 (Terça-feira)
    const july01 = new Date(today.getFullYear(), 6, 1); // Mês 6 é Julho (0-indexado)
    // 2 de julho de 2025 (Quarta-feira)
    const july02 = new Date(today.getFullYear(), 6, 2); // Mês 6 é Julho (0-indexado)


    // Array de objetos contendo a data e o dia da semana (0=Dom, 1=Seg...)
    const carolinaSpecificDates = [ // Alterado para carolinaSpecificDates
        { date: june30, dayOfWeek: june30.getDay() }, // Deve ser 1 (Segunda)
        { date: july01, dayOfWeek: july01.getDay() }, // Deve ser 2 (Terça)
        { date: july02, dayOfWeek: july02.getDay() }, // Deve ser 3 (Quarta)
    ];

    for (const specificDate of carolinaSpecificDates) { // Alterado para carolinaSpecificDates
      for (const slot of allDaySlots) {
        // UPSERT MANUAL para Carolina para as datas específicas
        const existingSpecificAvailability = await prisma.availability.findFirst({
          where: {
            providerId: carolinaProvider.id, // Alterado para carolinaProvider
            dayOfWeek: specificDate.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            // Adicionar filtro por data específica se o seu modelo Availability permite
            // Se o modelo Availability é apenas para disponibilidade semanal recorrente,
            // então não é necessário filtrar por data, apenas por dayOfWeek
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
              providerId: carolinaProvider.id, // Alterado para carolinaProvider
              dayOfWeek: specificDate.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              isAvailable: true,
              // Se você tiver um campo de data específica na sua tabela Availability, adicione aqui:
              // specificDate: specificDate.date,
            },
          });
        }
      }
      console.log(`Disponibilidade completa para Carolina Santos no dia ${specificDate.date.toLocaleDateString('pt-BR')} (Dia da Semana: ${specificDate.dayOfWeek}) criada/atualizada.`);
    }

  } else {
    console.warn('Não foi possível criar disponibilidade. Provedores não encontrados.');
  }

  if (helenaProvider) {
    for (let day = 1; day <= 5; day += 2) { // Segunda, Quarta, Sexta
      const helenaDaySlots = [
        { startTime: '10:00', endTime: '12:00' }, { startTime: '14:00', endTime: '16:00' },
      ];
      for (const slot of helenaDaySlots) {
        // UPSERT MANUAL para Helena
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
  const carlosClient = await prisma.client.findFirst({ where: { user: { email: 'client2@cleaning.com' } } });
  const lauraClient = await prisma.client.findFirst({ where: { user: { email: 'client3@cleaning.com' } } });
  const pedroClient = await prisma.client.findFirst({ where: { user: { email: 'client4@cleaning.com' } } });

  const residentialService = await prisma.service.findUnique({ where: { name: 'Residencial' } });
  const commercialService = await prisma.service.findUnique({ where: { name: 'Comercial' } });

  if (
    mariaProvider &&
    carolinaProvider && // Alterado para carolinaProvider
    anaClient &&
    carlosClient &&
    lauraClient &&
    pedroClient &&
    residentialService &&
    commercialService
  ) {
    // --- AGENDAMENTO CONCLUÍDO (para Maria - gera ganhos) ---
    const booking1Date = new Date();
    booking1Date.setDate(booking1Date.getDate() - 7); // 7 dias atrás
    const completedBookingMaria = await prisma.booking.create({
      data: {
        clientId: anaClient.id,
        providerId: mariaProvider.id,
        providerServiceId: (
          await prisma.providerService.findFirst({
            where: { providerId: mariaProvider.id, serviceId: residentialService.id },
          })
        )!.id,
        scheduledDate: booking1Date,
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

    // --- NOVO: MÚLTIPLOS AGENDAMENTOS CONCLUÍDOS PARA CAROLINA SANTOS (para permitir múltiplas avaliações) ---
    const carolinaBookingsData = [ // Alterado para carolinaBookingsData
      {
        client: lauraClient,
        service: commercialService,
        scheduledTime: '09:00',
        notes: 'Limpeza comercial no escritório para avaliação 1.',
        price: 200.0,
      },
      {
        client: pedroClient,
        service: commercialService, // Ou outro serviço
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

    const completedBookingsCarolina = []; // Alterado para completedBookingsCarolina

    for (let i = 0; i < carolinaBookingsData.length; i++) { // Alterado para carolinaBookingsData
      const bookingData = carolinaBookingsData[i]; // Alterado para carolinaBookingsData
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() - (15 + i * 2)); // Datas diferentes para cada booking

      const providerServiceForCarolina = await prisma.providerService.findFirst({ // Alterado para carolinaProvider
        where: { providerId: carolinaProvider.id, serviceId: bookingData.service.id }, // Alterado para carolinaProvider
      });

      if (!providerServiceForCarolina) {
        console.warn(`Serviço ${bookingData.service.name} não encontrado para Carolina Santos. Pulando booking.`); // Alterado para Carolina Santos
        continue;
      }

      const completedBookingCarolina = await prisma.booking.create({ // Alterado para completedBookingCarolina
        data: {
          clientId: bookingData.client.id,
          providerId: carolinaProvider.id, // Alterado para carolinaProvider
          providerServiceId: providerServiceForCarolina.id,
          scheduledDate: bookingDate,
          scheduledTime: bookingData.scheduledTime,
          status: BookingStatus.COMPLETED,
          totalPrice: new Prisma.Decimal(bookingData.price),
          notes: bookingData.notes,
        },
      });
      completedBookingsCarolina.push(completedBookingCarolina); // Alterado para completedBookingsCarolina
      console.log(`Agendamento Concluído ${completedBookingCarolina.id} (Carolina) criado para ${bookingData.client.fullName}.`); // Alterado para Carolina

      // Transação para o agendamento concluído de Carolina
      await prisma.transaction.create({
        data: {
          providerId: carolinaProvider.id, // Alterado para carolinaProvider
          amount: new Prisma.Decimal(bookingData.price),
          type: TransactionType.PAYMENT,
          status: 'COMPLETED',
          description: `Pagamento serviço ${completedBookingCarolina.id}`, // Alterado para completedBookingCarolina
          bookingId: completedBookingCarolina.id, // Alterado para completedBookingCarolina
        },
      });
      console.log(`Transação de Pagamento para ${completedBookingCarolina.id} criada.`); // Alterado para completedBookingCarolina
    }

    // --- AGENDAMENTO PENDENTE (para Maria - aparece no dashboard) ---
    const booking2Date = new Date();
    booking2Date.setDate(booking2Date.getDate() + 3); // 3 dias no futuro
    await prisma.booking.create({
      data: {
        clientId: carlosClient.id,
        providerId: mariaProvider.id,
        providerServiceId: (
          await prisma.providerService.findFirst({
            where: { providerId: mariaProvider.id, serviceId: residentialService.id },
          })
        )!.id,
        scheduledDate: booking2Date,
        scheduledTime: '14:00',
        status: BookingStatus.PENDING,
        totalPrice: new Prisma.Decimal(100.0),
        notes: 'Limpeza de rotina.',
      },
    });
    console.log(`Agendamento Pendente para Maria criado.`);

    // --- AGENDAMENTO CONFIRMADO (para Carolina - aparece no dashboard) ---
    const booking3Date = new Date();
    booking3Date.setDate(booking3Date.getDate() + 5); // 5 dias no futuro
    await prisma.booking.create({
      data: {
        clientId: anaClient.id,
        providerId: carolinaProvider.id, // Alterado para carolinaProvider
        providerServiceId: (
          await prisma.providerService.findFirst({
            where: { providerId: carolinaProvider.id, serviceId: commercialService.id }, // Alterado para carolinaProvider
          })
        )!.id,
        scheduledDate: booking3Date,
        scheduledTime: '09:00',
        status: BookingStatus.CONFIRMED,
        totalPrice: new Prisma.Decimal(200.0),
        notes: 'Limpeza escritório.',
      },
    });
    console.log(`Agendamento Confirmado para Carolina criado.`); // Alterado para Carolina

    // --- TRANSAÇÃO DE SAQUE PENDENTE (para Carolina - aparece em pendingWithdrawals) ---
    await prisma.transaction.create({
      data: {
        providerId: carolinaProvider.id, // Alterado para carolinaProvider
        amount: new Prisma.Decimal(50.0),
        type: TransactionType.WITHDRAWAL,
        status: 'PENDING',
        description: 'Solicitação de saque de teste.',
      },
    });
    console.log(`Transação de Saque Pendente para Carolina criada.`); // Alterado para Carolina

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
    console.log('Criando avaliações para Carolina Santos...'); // Alterado para Carolina Santos

    const reviewDetails = [
      {
        comment: 'Excelente trabalho! Carolina é muito profissional e deixou meu escritório impecável. Recomendo!', // Alterado para Carolina
        rating: 5,
      },
      {
        comment: 'Serviço muito bom, pontual e atencioso. A limpeza foi completa e superou as expectativas.',
        rating: 4,
      },
      {
        comment: 'Carolina é a melhor! Rápida, eficiente e muito cuidadosa com os detalhes. Contratarei novamente.', // Alterado para Carolina
        rating: 5,
      },
    ];

    for (let i = 0; i < completedBookingsCarolina.length; i++) { // Alterado para completedBookingsCarolina
      const booking = completedBookingsCarolina[i]; // Alterado para completedBookingsCarolina
      const detail = reviewDetails[i]; // Pega o detalhe da avaliação correspondente

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
      console.log(`Avaliação de ${booking.clientId} para Carolina Santos (booking ${booking.id}) criada/atualizada.`); // Alterado para Carolina Santos
    }
  } else {
    console.warn('Não foi possível criar agendamentos/transações/avaliações de teste. Provedores, clientes ou serviços essenciais não encontrados.');
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