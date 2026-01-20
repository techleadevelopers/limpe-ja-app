import { ComplianceService } from './compliance.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let prismaMock: {
    user: { findUnique: jest.Mock };
    userConsent: { create: jest.Mock; findFirst: jest.Mock };
  };

  beforeEach(() => {
    prismaMock = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1' }) },
      userConsent: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    service = new ComplianceService(prismaMock as unknown as PrismaService);
  });

  it('creates a consent record with metadata and hash', async () => {
    const acceptedAt = new Date('2025-01-01T00:00:00Z');
    const consentRecord = {
      id: 'consent-1',
      userId: 'user-1',
      documentType: 'TERMS',
      version: 'v2',
      documentHash: 'hash',
      source: 'api',
      consentedAt: acceptedAt,
    };
    prismaMock.userConsent.create.mockResolvedValue(consentRecord);

    const result = await service.recordConsent('user-1', 'TERMS', 'v2', {
      source: 'api',
      ip: '127.0.0.1',
      userAgent: 'jest-agent',
      acceptedAt,
      documentHash: 'hash',
    });

    expect(prismaMock.userConsent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          documentType: 'TERMS',
          version: 'v2',
          documentHash: 'hash',
          source: 'api',
          ipAddress: '127.0.0.1',
          userAgent: 'jest-agent',
        }),
      }),
    );
    expect(result).toEqual(consentRecord);
  });

  it('compares numeric versions', async () => {
    prismaMock.userConsent.findFirst
      .mockResolvedValueOnce({ version: '2.1' })
      .mockResolvedValueOnce({ version: '3.0' });

    await expect(service.checkConsent('user-1', 'TERMS', '2.0')).resolves.toBe(
      true,
    );
    await expect(service.checkConsent('user-1', 'TERMS', '3.1')).resolves.toBe(
      false,
    );
  });

  it('falls back to lexical comparison when no digits are available', async () => {
    prismaMock.userConsent.findFirst.mockResolvedValue({ version: 'alpha' });
    await expect(service.checkConsent('user-1', 'TERMS', 'beta')).resolves.toBe(
      false,
    );
  });

  it('returns false when consent is missing', async () => {
    prismaMock.userConsent.findFirst.mockResolvedValue(null);
    await expect(service.checkConsent('user-1', 'TERMS', '1.0')).resolves.toBe(
      false,
    );
  });
});
