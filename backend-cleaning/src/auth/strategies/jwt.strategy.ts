// src/auth/strategies/jwt.strategy.ts

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../common/constants/roles.enum';
import { User } from '@prisma/client';

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
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

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
      throw new UnauthorizedException('Token inválido: ID do usuário ausente.');
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
    } catch (dbError) {
      this.logger.error(
        `[JwtStrategy] validate: Erro ao buscar usuário no DB para ID ${payload.sub}: ${dbError.message}`,
        dbError.stack,
      );
      throw new UnauthorizedException(
        'Erro de validação de token: Falha no acesso ao usuário.',
      );
    }

    if (!user) {
      this.logger.warn(
        `[JwtStrategy] validate: Usuário com ID ${payload.sub} não encontrado ou inativo no DB.`,
      );
      throw new UnauthorizedException('Usuário não encontrado ou inativo.');
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
    } 
    else if (user.role === UserRole.PROVIDER && user.provider) {
      userPayload.providerId = user.provider.id;

      // ❌ REMOVIDO debug (flood)
      // this.logger.debug(`[JwtStrategy] validate: Usuário PROVIDER. providerId: ${userPayload.providerId}`);
    }
    else if (user.role === UserRole.ADMIN) {
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

    return userPayload;
  }
}