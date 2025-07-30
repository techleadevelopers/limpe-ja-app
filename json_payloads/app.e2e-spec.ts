import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// --- Início do Mock para o Serviço de Autenticação/OTP ---
const mockFirebaseAuthService = {
  sendOtp: jest.fn().mockResolvedValue({ success: true, message: 'OTP sent successfully.' }),
  verifyFirebaseIdToken: jest.fn().mockImplementation((idToken: string) => {
    if (idToken === 'MOCK_FIREBASE_ID_TOKEN_FOR_TEST') {
      return { uid: 'some-firebase-uid-from-mock', phone_number: '+19994647291' };
    }
    throw new Error('Firebase ID Token verification failed (mocked).');
  }),
};
// --- Fim do Mock para o Serviço de Autenticação/OTP ---


describe('LimpeJá Backend (e2e)', () => {
  let app: INestApplication;
  let clientJwtToken: string;
  let providerJwtToken: string;
  let adminJwtToken: string;
  let createdServiceId: string; // Pode ser um ID de serviço já existente no seu LimpeJa_db
  let createdBookingId: string; // Este será criado pelos testes, mas precisa de um provedor e cliente pré-existentes
  let createdChatId: string;

  const jsonPath = (fileName: string) => join(__dirname, 'json_payloads', fileName);

  beforeAll(async () => {
    // 1. Configurar variáveis de ambiente para o ambiente de teste
    // CORREÇÃO: Apontar para o LimpeJa_db existente
    process.env.DATABASE_URL = "postgresql://user:password@localhost:5432/LimpeJa_db"; // USANDO O BANCO DE DESENVOLVIMENTO
    process.env.JWT_SECRET = "sua_chave_secreta_jwt_para_testes"; // Use uma chave de teste
    process.env.JWT_EXPIRATION_TIME = "1h";
    process.env.TWILIO_ACCOUNT_SID = "ACdc1ef73d506e5a1c19eb726580d317da";
    process.env.TWILIO_AUTH_TOKEN = "cba161521d5c3543d96a214ead9a7345";
    process.env.TWILIO_VERIFY_SERVICE_SID = "VAf0cd7b20906227ecc9dcee93729b50e5";
    process.env.GCS_BUCKET_NAME = "your-test-gcs-bucket";
    process.env.PAGSEGURO_TOKEN = "your-test-pagseguro-token";


    // 2. IMPORTANTE: REMOVER O RESET E SEED. Vamos testar no banco existente.
    // console.log('Resetting test database and running migrations...');
    // try {
    //   execSync('npm run prisma migrate reset --force --skip-generate --skip-seed', { cwd: 'backend-LimpeJá', stdio: 'inherit' });
    //   execSync('npm run prisma db seed', { cwd: 'backend-LimpeJá', stdio: 'inherit' });
    //   console.log('Database reset and seeded successfully.');
    // } catch (error) {
    //   console.error('Failed to reset or seed database:', error);
    //   process.exit(1);
    // }
    console.log('Using existing LimpeJa_db. No database reset or seed will be performed.');


    // 3. Inicializar a aplicação NestJS
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider('FirebaseAuthService') // Substitua pelo token de injeção real do seu serviço de Firebase Auth
    .useValue(mockFirebaseAuthService)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET) - Should return "Hello World!"', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  // --- Fluxo de Autenticação e Registro ---

  // Teste para solicitar OTP (agora usando o mock)
  it('should allow to request OTP using mock service', async () => {
    const sendOtpPayload = JSON.parse(readFileSync(jsonPath('send_otp_request.json'), 'utf8'));
    await request(app.getHttpServer())
      .post('/auth/send-otp')
      .send(sendOtpPayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('message', 'OTP sent successfully.');
        expect(mockFirebaseAuthService.sendOtp).toHaveBeenCalledWith(sendOtpPayload.phoneNumber);
      });
  });

  // Teste para verificar OTP (agora usando o mock)
  it('should verify OTP using a mock Firebase ID Token and return JWT', async () => {
    const verifyOtpPayload = { firebaseIdToken: "MOCK_FIREBASE_ID_TOKEN_FOR_TEST" };
    await request(app.getHttpServer())
      .post('/auth/verify-otp')
      .send(verifyOtpPayload)
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('user');
        expect(mockFirebaseAuthService.verifyFirebaseIdToken).toHaveBeenCalledWith(verifyOtpPayload.firebaseIdToken);
      });
  });

  // ATENÇÃO: Se o email 'client.e2e.test@example.com' ou 'provedor.e2e.test_new@example.com'
  // já existir no seu LimpeJa_db, estes testes de registro VÃO FALHAR com erro 409 (Conflict)
  // ou 400 (Bad Request).
  // Você precisará:
  // 1. Apagar esses usuários do seu LimpeJa_db antes de rodar os testes, OU
  // 2. Usar emails diferentes para cada execução, OU
  // 3. Fazer com que o teste primeiro tente login, e se falhar, tente registro.
  // Para manter a simplicidade, os testes abaixo assumem que o registro terá sucesso.

  it('should allow a client to register', async () => {
    const registerClientPayload = JSON.parse(readFileSync(jsonPath('register_client_request.json'), 'utf8'));
    // Opcional: Adicione um timestamp ou UUID ao email para torná-lo único
    registerClientPayload.email = `client.e2e.test.${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register/client')
      .send(registerClientPayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.role).toBe('CLIENT');
        clientJwtToken = res.body.accessToken;
      });
  });

  it('should allow a provider to initiate registration (personal details)', async () => {
    const registerProviderPayload = JSON.parse(readFileSync(jsonPath('register_provider_personal_details_request.json'), 'utf8'));
    // Opcional: Adicione um timestamp ou UUID ao email para torná-lo único
    registerProviderPayload.email = `provedor.e2e.test_new.${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register/provider')
      .send(registerProviderPayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.role).toBe('PROVIDER');
        providerJwtToken = res.body.accessToken;
      });
  });

  it('should allow an existing client to login and return JWT', async () => {
    const loginClientPayload = JSON.parse(readFileSync(jsonPath('login_client.json'), 'utf8'));
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginClientPayload)
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('accessToken');
        clientJwtToken = res.body.accessToken;
      });
  });

  it('should allow an existing provider to login and return JWT', async () => {
    const loginProviderPayload = JSON.parse(readFileSync(jsonPath('login_provider.json'), 'utf8'));
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginProviderPayload)
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('accessToken');
        providerJwtToken = res.body.accessToken;
      });
  });

  it('should allow an admin to login and return JWT', async () => {
    const loginAdminPayload = JSON.parse(readFileSync(jsonPath('login_admin.json'), 'utf8'));
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginAdminPayload)
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('accessToken');
        adminJwtToken = res.body.accessToken;
      });
  });

  // --- Módulo de Serviços (Globais) ---
  // ATENÇÃO: Se o serviço "Limpeza Residencial Rápida" já existe, este teste pode falhar
  // por violação de unicidade ou duplicidade.

  it('should allow admin to create a new global service', async () => {
    const createServicePayload = JSON.parse(readFileSync(jsonPath('create_service_residential.json'), 'utf8'));
    // Opcional: Adicione um sufixo para o nome para evitar duplicidade se o teste for rodado múltiplas vezes
    // createServicePayload.name = `Limpeza Residencial Rápida ${Date.now()}`;
    await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${adminJwtToken}`)
      .send(createServicePayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.name).toBe(createServicePayload.name);
        createdServiceId = res.body.id;
      });
  });

  it('should retrieve all global services', async () => {
    await request(app.getHttpServer())
      .get('/services')
      .expect(200)
      .expect((res: request.Response) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        // Se createdServiceId foi definido, verificamos se ele está presente
        if (createdServiceId) {
            expect(res.body).toContainEqual(expect.objectContaining({ id: createdServiceId }));
        }
      });
  });

  // --- Módulo de Provedores ---

  it('should allow provider to update their service details and pricing', async () => {
    const providerProfileResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${providerJwtToken}`)
        .expect(200);
    const providerId = providerProfileResponse.body.provider.id;

    const updateProviderServicePayload = JSON.parse(readFileSync(jsonPath('update_provider_service_details_request.json'), 'utf8'));
    // Assegura que o serviceId usado exista, seja do teste anterior ou do seed.
    // Se 'createdServiceId' é do serviço global criado acima, use-o.
    // Caso contrário, use um ID de serviço que você sabe que existe no seu LimpeJa_db.
    updateProviderServicePayload.providerServices[0].serviceId = createdServiceId || 'ID_DE_UM_SERVICO_GLOBAL_EXISTENTE_NO_DB';
    if (updateProviderServicePayload.providerServices.length > 1) {
        // Se você tiver um segundo serviceId, atualize-o aqui ou remova-o.
        updateProviderServicePayload.providerServices.pop();
    }

    await request(app.getHttpServer())
      .patch(`/providers/${providerId}`)
      .set('Authorization', `Bearer ${providerJwtToken}`)
      .send(updateProviderServicePayload)
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('bio', updateProviderServicePayload.bio);
        expect(res.body.providerServices).toBeInstanceOf(Array);
        expect(res.body.providerServices).toContainEqual(
          expect.objectContaining({
            serviceId: updateProviderServicePayload.providerServices[0].serviceId,
            pricingType: 'FIXED_PRICE'
          })
        );
      });
  });

  it('should allow provider to manage their availability', async () => {
    const providerProfileResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${providerJwtToken}`)
        .expect(200);
    const providerId = providerProfileResponse.body.provider.id;

    const availabilityPayload = JSON.parse(readFileSync(jsonPath('update_provider_availability_request.json'), 'utf8'));
    await request(app.getHttpServer())
      .patch(`/providers/${providerId}/availability`)
      .set('Authorization', `Bearer ${providerJwtToken}`)
      .send(availabilityPayload)
      .expect(200)
      .expect((res: request.Response) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toContainEqual(expect.objectContaining({ dayOfWeek: 'MONDAY', isAvailable: true }));
        expect(res.body).toContainEqual(expect.objectContaining({ dayOfWeek: 'SATURDAY', isAvailable: false }));
      });
  });

  // --- Módulo de Verificação (Considerando mocks para serviços externos) ---
  // ATENÇÃO: Para esses testes funcionarem, o provedor logado deve ter um status
  // que permita o upload de documentos (e.g., PENDING_DOCUMENTS_UPLOAD).
  // Se o provedor já estiver APROVADO pelo seed, esses testes podem falhar.

  it('should allow provider to upload document front for verification', async () => {
    const uploadDocPayload = JSON.parse(readFileSync(jsonPath('upload_document_front_request.json'), 'utf8'));
    await request(app.getHttpServer())
      .post('/verification/document-upload')
      .set('Authorization', `Bearer ${providerJwtToken}`)
      .send(uploadDocPayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('message', 'Document uploaded and OCR processing initiated.');
      });
  });

  it('should allow provider to upload selfie with document for facial recognition', async () => {
    const uploadSelfiePayload = JSON.parse(readFileSync(jsonPath('upload_selfie_with_document_request.json'), 'utf8'));
    await request(app.getHttpServer())
      .post('/verification/selfie-upload')
      .set('Authorization', `Bearer ${providerJwtToken}`)
      .send(uploadSelfiePayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('message', 'Selfie uploaded and facial recognition initiated.');
      });
  });

  // --- Módulo de Busca ---

  it('should allow client to search for providers by location and service', async () => {
    // A busca dependerá dos dados existentes no seu LimpeJa_db.
    await request(app.getHttpServer())
      .get('/search')
      .set('Authorization', `Bearer ${clientJwtToken}`)
      .query({
        query: "limpeza",
        latitude: -23.550520, // Campinas, SP
        longitude: -46.633308, // Campinas, SP
        radiusKm: 100
      })
      .expect(200)
      .expect((res: request.Response) => {
        expect(Array.isArray(res.body.providers)).toBe(true);
        // Se espera provedores, adicione: expect(res.body.providers.length).toBeGreaterThan(0);
      });
  });

  // --- Módulo de Agendamentos ---

  it('should allow client to create a new booking', async () => {
    // ATENÇÃO: Para este teste, o provedor 'provedor.rapido@example.com' DEVE existir
    // no seu LimpeJa_db e ter serviços e disponibilidade configurados.
    // Ele também precisa ter o verificationStatus = 'APPROVED'.

    const searchResponse = await request(app.getHttpServer())
        .get('/search')
        .set('Authorization', `Bearer ${clientJwtToken}`)
        .query({ query: "limpeza", latitude: -23.550520, longitude: -46.633308, radiusKm: 100 })
        .expect(200);

    const targetProvider = searchResponse.body.providers.find((p: any) => p.email === 'provedor.rapido@example.com');
    expect(targetProvider).toBeDefined();
    expect(targetProvider.providerServices).toBeInstanceOf(Array);
    expect(targetProvider.providerServices.length).toBeGreaterThan(0);

    const targetProviderService = targetProvider.providerServices[0];
    expect(targetProviderService).toBeDefined();

    const clientProfileResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${clientJwtToken}`)
        .expect(200);
    const clientAddressId = clientProfileResponse.body.client.addressId;

    const createBookingPayload = JSON.parse(readFileSync(jsonPath('create_booking_request.json'), 'utf8'));
    createBookingPayload.providerId = targetProvider.id;
    createBookingPayload.providerServiceId = targetProviderService.id;
    createBookingPayload.addressId = clientAddressId;
    createBookingPayload.scheduledDate = "2025-08-01"; // Use uma data futura VÁLIDA
    createBookingPayload.scheduledTime = "10:00"; // Use um horário disponível do provedor

    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${clientJwtToken}`)
      .send(createBookingPayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.status).toBe('PENDING');
        createdBookingId = res.body.id;
      });
  });

  it('should allow provider to confirm a booking', async () => {
    const providerProfileResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${providerJwtToken}`)
        .expect(200);
    const providerId = providerProfileResponse.body.provider.id;

    const confirmBookingPayload = JSON.parse(readFileSync(jsonPath('confirm_booking.json'), 'utf8'));
    await request(app.getHttpServer())
      .patch(`/bookings/${createdBookingId}/status`)
      .set('Authorization', `Bearer ${providerJwtToken}`)
      .send(confirmBookingPayload)
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body.id).toBe(createdBookingId);
        expect(res.body.status).toBe('CONFIRMED');
      });
  });

  it('should allow provider to complete a booking', async () => {
    const completeBookingPayload = JSON.parse(readFileSync(jsonPath('complete_booking.json'), 'utf8'));
    await request(app.getHttpServer())
      .patch(`/bookings/${createdBookingId}/status`)
      .set('Authorization', `Bearer ${providerJwtToken}`)
      .send(completeBookingPayload)
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body.id).toBe(createdBookingId);
        expect(res.body.status).toBe('COMPLETED');
      });
  });

  it('should allow client or provider to report an issue with a booking', async () => {
    const reportIssuePayload = JSON.parse(readFileSync(jsonPath('report_booking_issue_request.json'), 'utf8'));
    await request(app.getHttpServer())
      .post(`/bookings/${createdBookingId}/report-issue`)
      .set('Authorization', `Bearer ${clientJwtToken}`)
      .send(reportIssuePayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('message', 'Issue reported successfully.');
      });
  });

  // --- Módulo de Pagamentos ---

  it('should allow client to create a PIX charge for a booking', async () => {
    const createPixChargePayload = JSON.parse(readFileSync(jsonPath('create_pix_charge_request.json'), 'utf8'));
    createPixChargePayload.bookingId = createdBookingId;
    createPixChargePayload.amount = 150.00;

    await request(app.getHttpServer())
      .post('/payments/pix-charge')
      .set('Authorization', `Bearer ${clientJwtToken}`)
      .send(createPixChargePayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('qrCodeUrl');
        expect(res.body).toHaveProperty('copyPasteKey');
        expect(res.body.status).toBe('PENDING');
      });
  });

  it('should allow provider to request a withdrawal', async () => {
    const requestWithdrawalPayload = JSON.parse(readFileSync(jsonPath('request_withdrawal_request.json'), 'utf8'));
    await request(app.getHttpServer())
      .post('/payments/withdraw')
      .set('Authorization', `Bearer ${providerJwtToken}`)
      .send(requestWithdrawalPayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('message', 'Withdrawal request submitted successfully.');
      });
  });

  // --- Módulo de Chat ---

  it('should allow a logged in user to get their chats', async () => {
    const res = await request(app.getHttpServer())
        .get('/chat/me')
        .set('Authorization', `Bearer ${clientJwtToken}`)
        .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    createdChatId = createdBookingId; // Simplificando, usando o bookingId como chatId de referência
  });

  it('should allow sending a chat message', async () => {
    expect(createdChatId).toBeDefined();

    const providerProfileResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${providerJwtToken}`)
        .expect(200);
    const receiverUserId = providerProfileResponse.body.id;

    const sendChatMessagePayload = JSON.parse(readFileSync(jsonPath('send_chat_message_request.json'), 'utf8'));
    sendChatMessagePayload.receiverId = receiverUserId;

    await request(app.getHttpServer())
      .post(`/chat/${createdChatId}/messages`)
      .set('Authorization', `Bearer ${clientJwtToken}`)
      .send(sendChatMessagePayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.content).toBe(sendChatMessagePayload.content);
        expect(res.body.chatId).toBe(createdChatId);
      });
  });

  it('should retrieve chat messages for a specific chat', async () => {
    expect(createdChatId).toBeDefined();

    await request(app.getHttpServer())
      .get(`/chat/${createdChatId}/messages`)
      .set('Authorization', `Bearer ${clientJwtToken}`)
      .expect(200)
      .expect((res: request.Response) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
        expect(res.body).toContainEqual(expect.objectContaining({ content: "Confirmando os detalhes para o serviço de amanhã. Tudo certo?" }));
      });
  });

  // --- Módulo de Avaliações ---

  it('should allow client to submit a review for a completed booking', async () => {
    const submitReviewPayload = JSON.parse(readFileSync(jsonPath('submit_review_request.json'), 'utf8'));
    submitReviewPayload.bookingId = createdBookingId;

    await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${clientJwtToken}`)
      .send(submitReviewPayload)
      .expect(201)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.rating).toBe(submitReviewPayload.rating);
        expect(res.body.bookingId).toBe(createdBookingId);
      });
  });

  // --- Módulo de FAQs ---

  it('should retrieve all FAQs', async () => {
    await request(app.getHttpServer())
      .get('/faqs')
      .expect(200)
      .expect((res: request.Response) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  // --- Testes de Perfil de Usuário (clientes/providers/users) ---

  it('should retrieve client profile details', async () => {
    await request(app.getHttpServer())
      .get('/clients/me')
      .set('Authorization', `Bearer ${clientJwtToken}`)
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('fullName');
        expect(res.body).toHaveProperty('phone', '+19994647291');
      });
  });

  it('should retrieve provider profile details', async () => {
    await request(app.getHttpServer())
      .get('/providers/me')
      .set('Authorization', `Bearer ${providerJwtToken}`)
      .expect(200)
      .expect((res: request.Response) => {
        expect(res.body).toHaveProperty('fullName');
        expect(res.body).toHaveProperty('bio');
        expect(res.body).toHaveProperty('verificationStatus');
      });
  });

  // ... Adicione mais testes conforme a necessidade
});