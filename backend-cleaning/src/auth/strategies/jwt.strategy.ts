// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '../../common/constants/roles.enum'; // Certifique-se que o caminho está correto para UserRole
import { User } from '@prisma/client'; // Importe o modelo User do Prisma

// Interface para o payload do usuário injetado no req.user pelo JwtStrategy
// (Você já tem isso no PaymentsController, bom ter em um local compartilhado, ex: src/auth/interfaces/request-user.interface.ts)
interface RequestUserPayload {
  userId: string; // O ID do usuário (sub do JWT)
  email: string;
  role: UserRole;
  clientId?: string; // ID do perfil de cliente, se aplicável
  providerId?: string; // ID do perfil de provedor, se aplicável
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

  // O payload que vem do JWT geralmente tem 'sub' como o ID do usuário.
  // A tipagem do retorno deve ser RequestUserPayload para consistência.
  async validate(payload: { sub: string; email: string; role: UserRole }): Promise<RequestUserPayload> {
    this.logger.log(`[JwtStrategy] validate: Payload JWT recebido: ${JSON.stringify(payload)}`);

    // Verifique se o 'sub' (ID do usuário) está presente no payload
    if (!payload.sub) {
      this.logger.error('[JwtStrategy] validate: Payload JWT não contém "sub" (ID do usuário).');
      throw new UnauthorizedException('Token inválido: ID do usuário ausente.');
    }

    let user: (User & { client?: { id: string }; provider?: { id: string } }) | null; // Tipagem mais precisa para 'user'

    try {
      user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          client: true, // Inclui o perfil de cliente se existir
          provider: true, // Inclui o perfil de provedor se existir
        },
      });
    } catch (dbError) {
      this.logger.error(`[JwtStrategy] validate: Erro ao buscar usuário no DB para ID ${payload.sub}: ${dbError.message}`, dbError.stack);
      throw new UnauthorizedException('Erro de validação de token: Falha no acesso ao usuário.');
    }

    if (!user) {
      this.logger.warn(`[JwtStrategy] validate: Usuário com ID ${payload.sub} não encontrado ou inativo no DB.`);
      throw new UnauthorizedException('Usuário não encontrado ou inativo.');
    }

    // Construção do objeto que será injetado em req.user
    const userPayload: RequestUserPayload = {
      userId: payload.sub, // O ID do usuário vindo do 'sub' do JWT
      email: payload.email,
      role: payload.role,
    };

    // Adiciona o clientId ou providerId se o usuário tiver o perfil correspondente
    if (user.role === UserRole.CLIENT && user.client) {
      userPayload.clientId = user.client.id;
      this.logger.debug(`[JwtStrategy] validate: Usuário CLIENT. clientId: ${userPayload.clientId}`);
    } else if (user.role === UserRole.PROVIDER && user.provider) {
      userPayload.providerId = user.provider.id;
      this.logger.debug(`[JwtStrategy] validate: Usuário PROVIDER. providerId: ${userPayload.providerId}`);
    }
    // Para administradores, você pode querer adicionar ambos os IDs se eles tiverem perfis associados
    else if (user.role === UserRole.ADMIN) {
        if (user.client) {
            userPayload.clientId = user.client.id;
            this.logger.debug(`[JwtStrategy] validate: Usuário ADMIN com clientId: ${userPayload.clientId}`);
        }
        if (user.provider) {
            userPayload.providerId = user.provider.id;
            this.logger.debug(`[JwtStrategy] validate: Usuário ADMIN com providerId: ${userPayload.providerId}`);
        }
    }

    this.logger.log(`[JwtStrategy] validate: Usuário ${user.email} (ID: ${user.id}) validado com sucesso. Objeto final de req.user: ${JSON.stringify(userPayload)}`);
    return userPayload; // Retorna o objeto que será populado em req.user
  }
}