import { api } from './api';
import { MetaStatusesResponse } from '../types/backend/meta';

let cachedMeta: MetaStatusesResponse | null = null;
let pendingRequest: Promise<MetaStatusesResponse> | null = null;

export async function getBookingStatusesMeta(): Promise<MetaStatusesResponse> {
  if (cachedMeta) {
    return cachedMeta;
  }
  if (!pendingRequest) {
    pendingRequest = api
      .get<MetaStatusesResponse>('/meta/statuses')
      .then((response) => {
        cachedMeta = response.data;
        return cachedMeta;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }
  return pendingRequest;
}
