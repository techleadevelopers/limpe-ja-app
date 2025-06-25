// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../common/constants/roles.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
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

  async validate(payload: { sub: string; email: string; role: UserRole }) {
    let user;

    // Dependendo da role, inclua os detalhes do perfil associado
    if (payload.role === UserRole.PROVIDER || payload.role === UserRole.ADMIN) { // ADMIN também pode ter perfil de provedor
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          provider: true, // <<<< Incluir perfil de provedor
          // Se um ADMIN também puder ter perfil de cliente, você precisaria incluir o cliente aqui também
          // client: true,
        },
      });
    } else if (payload.role === UserRole.CLIENT) {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          client: true, // <<<< Incluir perfil de cliente
        },
      });
    } else {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo.');
    }

    // Retorna um objeto que será o 'req.user' no controller
    // Ele incluirá 'userId', 'email', 'role', e os objetos 'provider' ou 'client' se incluídos na query
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      ...userWithoutPassword, // Isso trará user.provider ou user.client se eles foram incluídos na query acima
    };
  }
}