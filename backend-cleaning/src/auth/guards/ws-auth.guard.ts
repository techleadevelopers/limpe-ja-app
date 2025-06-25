// src/auth/guards/ws-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt'; // Para verificar o token JWT manualmente
import { ConfigService } from '@nestjs/config'; // Para obter a chave secreta do JWT

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const authToken = client.handshake.headers.authorization || client.handshake.query.token; // Tenta pegar do header ou query

    if (!authToken) {
      this.logger.warn('Tentativa de conexão WebSocket sem token de autenticação.');
      throw new UnauthorizedException('Token de autenticação não fornecido.');
    }

    try {
      const token = (authToken as string).split(' ')[1] || (authToken as string); // Remove 'Bearer ' se presente
      const secret = this.configService.get<string>('JWT_SECRET'); // Certifique-se de que JWT_SECRET está configurado
      const payload = this.jwtService.verify(token, { secret });

      // Anexa o payload do usuário ao objeto socket para uso posterior
      client.data.user = payload;
      client.data.userId = payload.userId; // Ou qualquer campo que identifique o usuário
      client.data.role = payload.role; // Papel do usuário

      this.logger.log(`Usuário ${payload.userId} autenticado via WebSocket.`);
      return true;
    } catch (error) {
      this.logger.error(`Erro de autenticação WebSocket: ${error.message}`);
      throw new UnauthorizedException('Token de autenticação inválido.');
    }
  }
}