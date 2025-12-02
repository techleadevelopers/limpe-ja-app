import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client'; // <- alinhado ao resto do app
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // Se não houver roles definidas, permite o acesso
    }

    const { user } = context.switchToHttp().getRequest();
    // Verifica se o usuário tem algum dos roles necessários
    return requiredRoles.some((role) => user.role === role);
  }
}
