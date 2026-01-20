import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ReferralsService } from '../../referrals/referrals.service';
import { EmailService } from '../../common/services/email.service';
import { GeocodingService } from '../../common/services/geocoding.service';
import { UserRole } from '@prisma/client';
import { AuthService } from '../auth.service';

describe('AuthService password reset confirm', () => {
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

  const buildUser = async (role: UserRole) => {
    const password = 'senha-antiga';
    const passwordHash = await bcrypt.hash(password, 10);
    return {
      id: 'user-123',
      email: 'usuario@teste.clean',
      role,
      passwordHash,
    };
  };

  it('troca a senha, marca o token como usado e impede reutilização', async () => {
    const user = await buildUser(UserRole.CLIENT);
    const resetToken = 'jwt-reset-token';
    const newPassword = 'novaSenha@123';
    jwtServiceMock.sign.mockReturnValue(resetToken);
    jwtServiceMock.verify.mockReturnValue({ userId: user.id });

    prismaMock.user.findUnique.mockResolvedValue(user as any);
    prismaMock.user.update.mockImplementation(async ({ data }) => {
      user.passwordHash = data.passwordHash;
      return user;
    });

    let createdTokenRecord: any = null;
    prismaMock.passwordResetToken.create.mockImplementation(
      async ({ data }) => {
        createdTokenRecord = {
          id: 'token-1',
          createdAt: new Date(),
          ...data,
        };
        return createdTokenRecord;
      },
    );
    prismaMock.passwordResetToken.findFirst.mockImplementation(async () => {
      if (!createdTokenRecord || createdTokenRecord.usedAt) {
        return null;
      }
      return createdTokenRecord;
    });
    prismaMock.passwordResetToken.update.mockImplementation(
      async ({ data }) => {
        createdTokenRecord = {
          ...createdTokenRecord,
          ...data,
        };
        return createdTokenRecord;
      },
    );

    await authService.forgotPassword(user.email);
    await authService.confirmPasswordReset(resetToken, newPassword);

    expect(prismaMock.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'token-1' },
        data: { usedAt: expect.any(Date) },
      }),
    );

    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: {
          passwordHash: expect.any(String),
        },
      }),
    );

    expect(user.passwordHash).not.toBe('senha-antiga');

    await expect(
      authService.validateUser(user.email, 'senha-antiga'),
    ).resolves.toBeNull();

    await expect(
      authService.validateUser(user.email, newPassword),
    ).resolves.toEqual(user);

    await expect(
      authService.confirmPasswordReset(resetToken, newPassword),
    ).rejects.toThrow('Token inválido ou expirado.');
  });
});
