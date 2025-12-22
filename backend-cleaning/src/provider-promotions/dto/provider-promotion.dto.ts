export class ProviderPromotionDto {
  id: string;
  providerId: string;
  title?: string | null;
  percentOff: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
