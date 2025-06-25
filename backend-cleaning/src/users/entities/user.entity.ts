// src/users/entities/user.entity.ts
import { User as PrismaUser, UserRole } from '@prisma/client';

export class UserEntity implements PrismaUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatarUrl: string | null; // <--- REMOVIDO O '?' AQUI
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}