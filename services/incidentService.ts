import { api } from './api';
import {
  CreateIncidentClaimDto,
  IncidentClaim,
} from '../types/backend/incidents';

export async function submitIncidentClaim(
  payload: CreateIncidentClaimDto,
): Promise<IncidentClaim> {
  const response = await api.post<IncidentClaim>('/incidents', payload);
  return response.data;
}

export async function getIncidentClaim(
  claimId: string,
): Promise<IncidentClaim> {
  const response = await api.get<IncidentClaim>(`/incidents/${claimId}`);
  return response.data;
}
