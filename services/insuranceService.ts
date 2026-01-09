import { api } from './api';
import type { AxiosRequestConfig } from 'axios';
import { InsurancePlanProposal } from '../types/backend/bookings';

export interface GetInsurancePlansParams {
  clientCompleted?: number;
  estimateTotalCents?: number;
  providerRating?: number;
  providerCompletedBookings?: number;
  providerNewProvider?: boolean;
}

export async function getInsurancePlans(
  params: GetInsurancePlansParams,
  config?: AxiosRequestConfig,
): Promise<InsurancePlanProposal[]> {
  const response = await api.get<InsurancePlanProposal[]>('/insurance/plans', {
    params: {
      clientCompleted: params.clientCompleted ?? 0,
      estimateTotalCents: params.estimateTotalCents ?? 0,
      providerRating: params.providerRating ?? 0,
      providerCompletedBookings: params.providerCompletedBookings ?? 0,
      providerNewProvider: params.providerNewProvider ?? false,
    },
    ...config,
  });
  return response.data;
}
