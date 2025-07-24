// src/users/entities/user.entity.ts
import { User as PrismaUser, UserRole } from '@prisma/client';

export class UserEntity implements PrismaUser {
  id: string;
  email: string;
  phone: string | null;
  passwordHash: string | null;
  role: UserRole;
  avatarUrl: string | null;
  firebaseUid: string | null; // <--- ADICIONADO: Propriedade firebaseUid
  otpCode: string | null;
  otpExpiresAt: Date | null;
  isPhoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}