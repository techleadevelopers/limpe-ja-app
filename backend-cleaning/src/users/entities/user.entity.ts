// src/users/entities/user.entity.ts
import { User as PrismaUser, UserRole } from '@prisma/client';

export class UserEntity implements PrismaUser {
  id: string;
  email: string;
  phone: string | null; // ADICIONADO
  passwordHash: string | null; // ADICIONADO: passwordHash pode ser nulo para login por OTP
  role: UserRole;
  avatarUrl: string | null;
  otpCode: string | null; // ADICIONADO
  otpExpiresAt: Date | null; // ADICIONADO
  isPhoneVerified: boolean; // ADICIONADO
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}