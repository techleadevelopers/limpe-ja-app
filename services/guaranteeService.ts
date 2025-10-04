// LimpeJaApp/services/guaranteeService.ts
import { api } from './api'; // Assuming you have an api.ts for Axios instance
import { SubmitClaimDto, GuaranteeClaim } from '../types/backend/guarantee';

export const submitClaim = async (data: SubmitClaimDto): Promise<GuaranteeClaim> => {
  const response = await api.post<GuaranteeClaim>('/guarantee/claims', data);
  return response.data;
};

export const getClaimsForUser = async (): Promise<GuaranteeClaim[]> => {
  const response = await api.get<GuaranteeClaim[]>('/guarantee/claims/me');
  return response.data;
};