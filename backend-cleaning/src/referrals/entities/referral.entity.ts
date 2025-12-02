// src/referrals/entities/referral.entity.ts
import { Referral as PrismaReferral } from '@prisma/client';

export class ReferralEntity implements PrismaReferral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  // CORREÇÃO: Adicionada a propriedade 'referralCode'
  referralCode: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ReferralEntity>) {
    Object.assign(this, partial);
  }
}
