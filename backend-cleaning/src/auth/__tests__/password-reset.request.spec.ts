import { AuthService } from '../auth.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../common/services/email.service';
import { GeocodingService } from '../../common/services/geocoding.service';
import { JwtService } from '@nestjs/jwt';
import { ReferralsService } from '../../referrals/referrals.service';
import { UserRole } from '@prisma/client';

describe('AuthService password reset request', () => {
  let authService: AuthService;
  let prismaMock: {
    user: { findUnique: jest.Mock };
    passwordResetToken: {
      deleteMany: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let jwtServiceMock: jest.Mocked<JwtService>;
  let emailServiceMock: jest.Mocked<EmailService>;
  let configServiceMock: jest.Mocked<ConfigService>;

  const baseUrl = 'https://app.example';

  beforeEach(() => {
    prismaMock = {
      user: { findUnique: jest.fn() },
      passwordResetToken: {
        deleteMany: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockResolvedValue(undefined),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    jwtServiceMock = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    emailServiceMock = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<EmailService>;

    configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'appBaseUrl') return baseUrl;
        if (key === 'APP_BASE_URL') return baseUrl;
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

  const buildUser = (role: UserRole) => ({
    id: 'user-123',
    email: 'usuario@teste.clean',
    role,
  });

  describe.each<[UserRole, string]>([
    [UserRole.CLIENT, 'client request'],
    [UserRole.PROVIDER, 'provider request'],
  ])('password resets for %s', (role: UserRole, _label: string) => {
    it('persists a token record, hashes it, and invokes the email gateway', async () => {
      const resetToken = 'jwt-reset-token';
      const user = buildUser(role);
      prismaMock.user.findUnique.mockResolvedValueOnce(user as any);
      jwtServiceMock.sign.mockReturnValue(resetToken);

      await authService.forgotPassword(user.email);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: user.email },
      });
      expect(jwtServiceMock.sign).toHaveBeenCalledWith(
        { userId: user.id },
        { expiresIn: '1h' },
      );
      expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: user.id },
      });
      expect(prismaMock.passwordResetToken.create).toHaveBeenCalledTimes(1);

      const tokenRecord =
        prismaMock.passwordResetToken.create.mock.calls[0][0].data;
      expect(tokenRecord).toMatchObject({
        userId: user.id,
        usedAt: null,
      });
      expect(tokenRecord.expiresAt).toBeInstanceOf(Date);
      expect(tokenRecord.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(tokenRecord.tokenHash).not.toEqual(resetToken);

      expect(emailServiceMock.sendEmail).toHaveBeenCalledWith(
        user.email,
        expect.stringContaining('Redefinição de Senha'),
        expect.stringContaining(
          `${baseUrl}/reset-password?token=${resetToken}`,
        ),
        expect.any(String),
      );
    });
  });
});
