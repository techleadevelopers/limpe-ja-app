import { api } from './api';
import { appConfig } from '../config/appConfig';

export type ReferralInfo = {
  referralCode: string;
  referrerBenefit: string;
  refereeBenefit: string;
  termsLink: string;
};

/**
 * Busca (ou gera) o código de indicação do usuário autenticado e retorna
 * as informações necessárias para a tela de Indicações, mantendo o mesmo shape usado na UI.
 * Backend: GET /referrals/me/code -> { referralCode: string }
 */
export async function getReferralInfo(): Promise<ReferralInfo> {
  const { data } = await api.get<{ referralCode: string }>('/referrals/me/code');
  return {
    referralCode: data?.referralCode ?? '',
    referrerBenefit: appConfig.referrals.referrerBenefit,
    refereeBenefit: appConfig.referrals.refereeBenefit,
    termsLink: appConfig.referrals.termsLink,
  };
}

// Types compatíveis com o backend (ReferralEntity)
export type Referral = {
  id: string;
  referredUserId: string;
  referrerUserId: string;
  referralCode?: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Lista as indicações feitas pelo usuário autenticado */
export async function getMyReferrals(): Promise<Referral[]> {
  const { data } = await api.get<Referral[]>('/referrals/me');
  return data;
}
