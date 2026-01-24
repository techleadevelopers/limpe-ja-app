// src/auth/strategies/jwt.strategy.ts

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../common/constants/roles.enum';
import { User } from '@prisma/client';
import { CacheService } from '../../cache/cache.service';
import { AuthErrorCode } from '../../common/constants/auth-error-code';

interface RequestUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  clientId?: string;
  providerId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  private readonly safeCacheTtlSeconds = 300;
  private readonly payloadCacheTtlSeconds = 180;
  private readonly payloadSuffix = ':payload';

  async validate(payload: {
    sub: string;
    email: string;
    role: UserRole;
  }): Promise<RequestUserPayload> {
    // ❌ REMOVIDO (flood)
    // this.logger.log(`[JwtStrategy] validate: Payload JWT recebido: ${JSON.stringify(payload)}`);

    if (!payload.sub) {
      this.logger.error(
        '[JwtStrategy] validate: Payload JWT não contém "sub" (ID do usuário).',
      );
      throw new UnauthorizedException({
        message: 'Token inválido: ID do usuário ausente.',
        code: AuthErrorCode.UNAUTHORIZED,
      });
    }

    const forceLogoutKey = this.buildForceLogoutKey(payload.sub);
    const payloadKey = this.buildForceLogoutPayloadKey(payload.sub);
    const forceLogoutFlag = await this.cacheService.get<true | 'OK'>(
      forceLogoutKey,
    );
    if (forceLogoutFlag === true) {
      this.logger.warn(
        `[JwtStrategy] validate: ${payload.sub} bloqueado por logout forçado`,
      );
      throw new UnauthorizedException({
        message: 'Sessão encerrada por medidas administrativas.',
        code: AuthErrorCode.TOKEN_REVOKED,
      });
    }

    if (forceLogoutFlag === 'OK') {
      const cachedPayload = await this.cacheService.get<RequestUserPayload>(
        payloadKey,
      );
      if (cachedPayload) {
        return cachedPayload;
      }
    }

    if (forceLogoutFlag === undefined) {
      const blockedUntil = await this.getActiveForceLogoutUntil(payload.sub);
      if (blockedUntil) {
        const remainingSeconds = Math.max(
          1,
          Math.ceil((blockedUntil.getTime() - Date.now()) / 1000),
        );
        await this.cacheService.set(forceLogoutKey, true, remainingSeconds);
        this.logger.warn(
          `[JwtStrategy] validate: ${payload.sub} bloqueado por logout forçado persistente até ${blockedUntil.toISOString()}`,
        );
        throw new UnauthorizedException({
          message: 'Sessão encerrada por medidas administrativas.',
          code: AuthErrorCode.TOKEN_REVOKED,
        });
      }
      await this.cacheService.set(
        forceLogoutKey,
        'OK',
        this.safeCacheTtlSeconds,
      );
    }

    let user:
      | (User & { client?: { id: string }; provider?: { id: string } })
      | null;

    try {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          client: true,
          provider: true,
        },
      });
    } catch (dbError: unknown) {
      const message =
        dbError instanceof Error ? dbError.message : 'Erro desconhecido';
      const stack = dbError instanceof Error ? dbError.stack : undefined;
      this.logger.error(
        `[JwtStrategy] validate: Erro ao buscar usuário no DB para ID ${payload.sub}: ${message}`,
        stack,
      );
      throw new UnauthorizedException({
        message: 'Erro de validação de token: Falha no acesso ao usuário.',
        code: AuthErrorCode.UNAUTHORIZED,
      });
    }

    if (!user) {
      this.logger.warn(
        `[JwtStrategy] validate: Usuário com ID ${payload.sub} não encontrado ou inativo no DB.`,
      );
      throw new UnauthorizedException({
        message: 'Usuário não encontrado ou inativo.',
        code: AuthErrorCode.TOKEN_REVOKED,
      });
    }

    const userPayload: RequestUserPayload = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    if (user.role === UserRole.CLIENT && user.client) {
      userPayload.clientId = user.client.id;

      // ❌ REMOVIDO debug (flood)
      // this.logger.debug(`[JwtStrategy] validate: Usuário CLIENT. clientId: ${userPayload.clientId}`);
    } else if (user.role === UserRole.PROVIDER && user.provider) {
      userPayload.providerId = user.provider.id;

      // ❌ REMOVIDO debug (flood)
      // this.logger.debug(`[JwtStrategy] validate: Usuário PROVIDER. providerId: ${userPayload.providerId}`);
    } else if (user.role === UserRole.ADMIN) {
      if (user.client) {
        userPayload.clientId = user.client.id;

        // ❌ REMOVIDO debug
        // this.logger.debug(`[JwtStrategy] validate: Usuário ADMIN com clientId: ${userPayload.clientId}`);
      }
      if (user.provider) {
        userPayload.providerId = user.provider.id;

        // ❌ REMOVIDO debug
        // this.logger.debug(`[JwtStrategy] validate: Usuário ADMIN com providerId: ${userPayload.providerId}`);
      }
    }

    // ❌ REMOVIDO log gigante que floodava Railway
    // this.logger.log(
    //   `[JwtStrategy] validate: Usuário ${user.email} (ID: ${user.id}) validado com sucesso. Objeto final de req.user: ${JSON.stringify(userPayload)}`
    // );

    await this.cacheService.set(
      payloadKey,
      userPayload,
      this.payloadCacheTtlSeconds,
    );
    await this.cacheService.set(
      forceLogoutKey,
      'OK',
      this.safeCacheTtlSeconds,
    );
    return userPayload;
  }

  private buildForceLogoutKey(userId: string): string {
    return `telemetry:force-logout:${userId}`;
  }

  private buildForceLogoutPayloadKey(userId: string): string {
    return `${this.buildForceLogoutKey(userId)}${this.payloadSuffix}`;
  }

  private async getActiveForceLogoutUntil(userId: string): Promise<Date | null> {
    const record = await this.prisma.telemetryForceLogout.findUnique({
      where: { userId },
    });
    if (!record) {
      return null;
    }

    const now = new Date();
    if (record.forceLogoutUntil > now) {
      return record.forceLogoutUntil;
    }

    try {
      await this.prisma.telemetryForceLogout.delete({ where: { userId } });
    } catch {
      // Concurrency or already-removed record; ignore.
    }
    return null;
  }
}
