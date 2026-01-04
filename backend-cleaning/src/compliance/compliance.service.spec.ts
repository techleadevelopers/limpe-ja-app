import { ComplianceService } from './compliance.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let prismaMock: {
    user: { findUnique: jest.Mock };
    userConsent: { upsert: jest.Mock };
  };

  beforeEach(() => {
    prismaMock = {
      user: { findUnique: jest.fn().mockResolvedValue({ id: 'user-1' }) },
      userConsent: { upsert: jest.fn() },
    };
    service = new ComplianceService(prismaMock as unknown as PrismaService);
  });

  it('upserts a consent with metadata', async () => {
    const acceptedAt = new Date('2025-01-01T10:00:00Z');
    const consentRecord = {
      userId: 'user-1',
      documentType: 'TERMS',
      version: 'terms-v1',
      consentedAt: acceptedAt,
      ipAddress: '1.2.3.4',
      userAgent: 'jest-agent',
    };
    prismaMock.userConsent.upsert.mockResolvedValue(consentRecord);

    const result = await service.recordConsent('user-1', 'TERMS', 'terms-v1', {
      source: 'api',
      ip: '1.2.3.4',
      userAgent: 'jest-agent',
      acceptedAt,
    });

    expect(result).toEqual(consentRecord);
    expect(prismaMock.userConsent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_documentType: {
            userId: 'user-1',
            documentType: 'TERMS',
          },
        },
        update: expect.objectContaining({
          version: 'terms-v1',
          consentedAt: acceptedAt,
          ipAddress: '1.2.3.4',
          userAgent: 'jest-agent',
        }),
        create: expect.objectContaining({
          ipAddress: '1.2.3.4',
          userAgent: 'jest-agent',
        }),
      }),
    );
  });

  it('updates the consent when called again with a new version', async () => {
    prismaMock.userConsent.upsert
      .mockResolvedValueOnce({
        userId: 'user-1',
        documentType: 'TERMS',
        version: 'terms-v1',
      })
      .mockResolvedValueOnce({
        userId: 'user-1',
        documentType: 'TERMS',
        version: 'terms-v2',
      });

    await service.recordConsent('user-1', 'TERMS', 'terms-v1');
    const secondResult = await service.recordConsent(
      'user-1',
      'TERMS',
      'terms-v2',
    );

    expect(prismaMock.userConsent.upsert).toHaveBeenCalledTimes(2);
    expect(prismaMock.userConsent.upsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        update: expect.objectContaining({ version: 'terms-v2' }),
      }),
    );
    expect(secondResult.version).toBe('terms-v2');
  });
});
