import 'reflect-metadata';

import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../common/services/email.service';
import { GeocodingService } from '../../common/services/geocoding.service';
import { JwtService } from '@nestjs/jwt';
import { ReferralsService } from '../../referrals/referrals.service';
import { UserRole } from '@prisma/client';

describe('AuthService password reset security', () => {
  let authService: AuthService;
  let prismaMock: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    passwordResetToken: {
      deleteMany: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let jwtServiceMock: jest.Mocked<JwtService>;
  let emailServiceMock: jest.Mocked<EmailService>;
  let configServiceMock: jest.Mocked<ConfigService>;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        deleteMany: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(undefined),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    jwtServiceMock = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    emailServiceMock = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<EmailService>;

    configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'appBaseUrl') return 'https://app.example';
        if (key === 'APP_BASE_URL') return 'https://app.example';
        if (key === 'jwt.expirationTime') return '1h';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const geocodingServiceMock = {} as GeocodingService;
    const referralsServiceMock = {
      createReferral: jest.fn(),
    } as unknown as ReferralsService;

    authService = new AuthService(
      prismaMock as any,
      jwtServiceMock,
      emailServiceMock,
      geocodingServiceMock,
      configServiceMock,
      referralsServiceMock,
    );
  });

  const buildUser = (): { id: string; email: string; role: UserRole } => ({
    id: 'user-123',
    email: 'usuario@teste.clean',
    role: UserRole.CLIENT,
  });

  it('rejects expired tokens', async () => {
    const user = buildUser();
    jwtServiceMock.verify.mockReturnValue({ userId: user.id });
    prismaMock.passwordResetToken.findFirst.mockResolvedValue(null);

    await expect(
      authService.confirmPasswordReset('token-expired', 'NovaSenha@1'),
    ).rejects.toThrow('Token inválido ou expirado.');
  });

  it('rejects invalid token signatures', async () => {
    jwtServiceMock.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });

    await expect(
      authService.confirmPasswordReset('token-invalido', 'NovaSenha@1'),
    ).rejects.toThrow('Token inválido ou expirado.');
  });

  it('keeps only the most recent token valid across requests', async () => {
    const user = buildUser();
    const firstToken = 'jwt-first-token';
    const secondToken = 'jwt-second-token';
    let latestTokenRecord: any = null;

    jwtServiceMock.sign
      .mockReturnValueOnce(firstToken)
      .mockReturnValueOnce(secondToken);
    jwtServiceMock.verify.mockImplementation(() => ({ userId: user.id }));

    prismaMock.user.findUnique.mockResolvedValue(user as any);
    prismaMock.user.update.mockResolvedValue(user as any);

    prismaMock.passwordResetToken.create.mockImplementation(
      async ({ data }) => {
        latestTokenRecord = {
          id: `reset-${Math.random().toString(36).slice(2)}`,
          createdAt: new Date(),
          ...data,
        };
        return latestTokenRecord;
      },
    );
    prismaMock.passwordResetToken.findFirst.mockImplementation(
      () => latestTokenRecord,
    );
    prismaMock.passwordResetToken.update.mockImplementation(
      async ({ data }) => {
        latestTokenRecord = { ...latestTokenRecord, ...data };
        return latestTokenRecord;
      },
    );

    await authService.forgotPassword(user.email);
    await authService.forgotPassword(user.email);

    await expect(
      authService.confirmPasswordReset(firstToken, 'NovaSenha@1'),
    ).rejects.toThrow('Token inválido ou expirado.');

    expect(prismaMock.passwordResetToken.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalledTimes(2);
  });
});

describe('AuthController password reset rate limiting', () => {
  it('applies ThrottlerGuard to forgot password', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'forgotPassword',
    );
    const method = descriptor?.value;
    const guards = method
      ? Reflect.getMetadata(GUARDS_METADATA, method)
      : undefined;
    expect(guards).toContain(ThrottlerGuard);
  });
});
