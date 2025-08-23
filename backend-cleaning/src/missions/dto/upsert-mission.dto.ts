// dto/upsert-mission.dto.ts
export class UpsertMissionDto {
  code: string;
  title: string;
  description: string;
  audience: 'CLIENT' | 'PROVIDER';
  kind: 'COUNT_EVENT' | 'STREAK_DAYS' | 'WITHIN_WINDOW';
  eventName: 'booking.completed' | 'review.created' | 'referral.converted';
  targetValue: number;
  timeWindowDays?: number;
  rewardType: 'COUPON' | 'POINTS';
  rewardValue: number;
  couponTemplateId?: string;
  isActive?: boolean;
}

// dto/claim-mission.dto.ts
export class ClaimMissionDto {
  missionId: string;
}
