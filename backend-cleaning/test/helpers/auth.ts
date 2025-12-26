import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

export function buildAuthToken(
  jwtService: JwtService,
  user: Pick<User, 'id' | 'email' | 'role'>,
): string {
  return jwtService.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
}

export const authHeader = (token: string) => ({
  Authorization: `Bearer ${token}`,
});
