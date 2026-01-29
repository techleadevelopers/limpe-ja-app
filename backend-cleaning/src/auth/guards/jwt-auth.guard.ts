import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError } from 'jsonwebtoken';
import { AuthErrorCode } from '../../common/constants/auth-error-code';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    const tokenExpired =
      info instanceof TokenExpiredError ||
      err instanceof TokenExpiredError ||
      (info &&
        typeof info.name === 'string' &&
        info.name === 'TokenExpiredError');

    if (tokenExpired) {
      throw new UnauthorizedException({
        message: 'Token expirado.',
        code: AuthErrorCode.TOKEN_EXPIRED,
      });
    }

    if (err) {
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException({
        message: 'Token inválido ou revogado.',
        code: AuthErrorCode.TOKEN_REVOKED,
      });
    }

    // Permite explicitamente usuários com vitrine irregular (campo correto: visibilityStatus)
    // para que possam acessar rotas de correção de perfil no frontend.
    if (user?.provider?.visibilityStatus === 'VITRINE_IRREGULAR') {
      return user;
    }

    return user;
  }
}
