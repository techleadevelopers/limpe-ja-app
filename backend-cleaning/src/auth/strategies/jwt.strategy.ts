// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../common/constants/roles.enum'; // Certifique-se que o caminho está correto para UserRole

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
    // Buscamos o usuário com as relações de perfil (client, provider)
    user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        client: true,
        provider: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo.');
    }

    // Cria o objeto que será injetado em req.user
    const userPayload: {
      userId: string;
      email: string;
      role: UserRole;
      clientId?: string; // Adicionado clientId opcional
      providerId?: string; // Adicionado providerId opcional
      // Adicione outras propriedades que você quer acessar de req.user
    } = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    // Preenche clientId ou providerId baseado na role
    if (user.role === UserRole.CLIENT && user.client) {
      userPayload.clientId = user.client.id; // <-- EXPLICITAMENTE ADICIONANDO clientId
    } else if (user.role === UserRole.PROVIDER && user.provider) {
      userPayload.providerId = user.provider.id; // <-- EXPLICITAMENTE ADICIONANDO providerId
    } else if (user.role === UserRole.ADMIN) {
      // Para admins, se eles também têm um perfil de provedor/cliente associado
      if (user.provider) {
        userPayload.providerId = user.provider.id;
      }
      if (user.client) {
        userPayload.clientId = user.client.id;
      }
    }
    
    // NOTA: 'userWithoutPassword' do seu código original é bom para evitar o hash da senha,
    // mas para popular req.user, é melhor ser explícito com as propriedades que você precisa.
    // O Prisma já não incluiria passwordHash se você fizesse um select explícito.
    // return { ...userWithoutPassword }; // Isso pode trazer todo o objeto aninhado.
    // Retornar userPayload é mais limpo para req.user.

    return userPayload; // Retorna o objeto simplificado para req.user
  }
}