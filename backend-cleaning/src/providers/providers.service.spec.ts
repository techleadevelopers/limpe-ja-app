import { ProviderWithCalculatedRating, ProvidersService } from './providers.service';
import { CacheService } from '../cache/cache.service';
import { DocumentProcessingService } from '../document-processing/document-processing.service';
import { SettingsService } from '../settings/settings.service';
import { VerificationStatus, UserRole } from '@prisma/client';

describe('ProvidersService caching', () => {
  let service: ProvidersService;
  let cacheServiceMock: jest.Mocked<CacheService>;
  let prismaMock: any;
  let settingsServiceMock: jest.Mocked<SettingsService>;

  const makeProviderRecord = (overrides: Partial<any> = {}) => {
    const base = {
      id: 'prov-1',
      userId: 'user-1',
      fullName: 'Provider One',
      cpf: null,
      dateOfBirth: null,
      phone: null,
      bio: 'Top pro',
      yearsOfExperience: 4,
      avatarUrl: null,
      verificationStatus: VerificationStatus.APPROVED,
      pixKey: null,
      pixKeyMasked: null,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-02T00:00:00.000Z'),
      documentPhotoFrontUrl: null,
      documentPhotoBackUrl: null,
      selfieWithDocumentUrl: null,
      backgroundCheckResult: null,
      rejectionReason: null,
      ocrResult: null,
      livenessResult: null,
      badges: [],
      acceptanceRate: 0,
      averageResponseTime: 0,
      user: {
        email: 'provider@example.com',
        role: UserRole.PROVIDER,
        isVerified: true,
        fullName: 'Provider One',
        phone: '123456789',
      },
      address: {
        id: 'addr-1',
        cep: '01001000',
        street: 'Rua Teste',
        number: '123',
        complement: null,
        neighborhood: 'Centro',
        city: 'Campinas',
        state: 'SP',
        providerId: 'prov-1',
        clientId: null,
        latitude: -23.55,
        longitude: -46.63,
        location: null,
      },
      providerServices: [],
      reviewsReceived: [],
      bookings: [],
      availability: [],
      monthlyBookingsCount: 0,
      fiveStarReviewCount: 0,
    };
    return { ...base, ...overrides } as any;
  };

  beforeEach(() => {
    cacheServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    } as any;
    prismaMock = {
      $queryRaw: jest.fn().mockResolvedValue([]),
      provider: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      availability: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    settingsServiceMock = {
      getProviderRadiusKm: jest.fn().mockResolvedValue(15),
    } as any;

    service = new ProvidersService(
      prismaMock,
      {} as DocumentProcessingService,
      cacheServiceMock,
      settingsServiceMock,
    );
  });

  it('returns cached search results without hitting Prisma', async () => {
    const cached: ProviderWithCalculatedRating[] = [
      { id: 'cached', userId: 'user-1' } as ProviderWithCalculatedRating,
    ];
    cacheServiceMock.get.mockResolvedValueOnce(cached);

    const result = await service.search({ limit: 5, offset: 10 });

    expect(result).toBe(cached);
    expect(prismaMock.provider.findMany).not.toHaveBeenCalled();
    expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
  });

  it('caches search results with TTL and makes keys sensitive to pagination', async () => {
    cacheServiceMock.get.mockResolvedValueOnce(undefined);
    const provider = makeProviderRecord();
    prismaMock.provider.findMany.mockResolvedValue([provider]);

    await service.search({ limit: 5, offset: 10 });

    expect(cacheServiceMock.get).toHaveBeenCalledWith(
      expect.stringContaining('"limit":5'),
    );
    expect(cacheServiceMock.get).toHaveBeenCalledWith(
      expect.stringContaining('"offset":10'),
    );
    expect(cacheServiceMock.set).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      (service as any).PUBLIC_PROVIDERS_CACHE_TTL_SECONDS,
    );
  });

  it('caches provider details with TTL and avoids extra Prisma loads', async () => {
    cacheServiceMock.get.mockResolvedValueOnce(undefined);
    const provider = makeProviderRecord();
    prismaMock.provider.findUnique.mockResolvedValue(provider);

    await service.findOne('prov-1');

    expect(cacheServiceMock.set).toHaveBeenCalledWith(
      expect.stringContaining('prov-1'),
      expect.any(Object),
      (service as any).PUBLIC_PROVIDERS_CACHE_TTL_SECONDS,
    );
    expect(prismaMock.provider.findUnique).toHaveBeenCalledTimes(1);
  });

  it('uses cached provider details when available', async () => {
    const cached = { id: 'prov-1' } as ProviderWithCalculatedRating;
    cacheServiceMock.get.mockResolvedValueOnce(cached);

    const result = await service.findOne('prov-1');

    expect(result).toBe(cached);
    expect(prismaMock.provider.findUnique).not.toHaveBeenCalled();
  });

  it('retains verificationStatus when mapping providers', () => {
    const provider = makeProviderRecord({ verificationStatus: VerificationStatus.PENDING_MANUAL_REVIEW });
    const mapped = service.mapProviderToCalculatedRating(provider);
    expect(mapped.verificationStatus).toBe(VerificationStatus.PENDING_MANUAL_REVIEW);
  });
});
