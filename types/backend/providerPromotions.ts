export interface ProviderPromotionDto {
  id: string;
  providerId: string;
  title?: string | null;
  percentOff: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderPromotionPayload {
  title?: string;
  percentOff: number;
  validUntil: string;
  isActive?: boolean;
}

export interface UpdateProviderPromotionPayload {
  title?: string;
  percentOff?: number;
  validUntil?: string;
  isActive?: boolean;
}
