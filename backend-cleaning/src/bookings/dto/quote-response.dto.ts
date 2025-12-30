import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InsurancePlanProposalDto } from '../../insurance/dto/insurance-plan-proposal.dto';

export class BookingQuoteBreakdownItemDto {
  @ApiProperty({
    description: 'Human-readable label for the price component',
    example: 'Subtotal',
  })
  label: string;

  @ApiProperty({
    description: 'Monetary amount in BRL for the breakdown line',
    example: 120,
  })
  amount: number;

  @ApiPropertyOptional({
    description: 'Internal type identifier for the line item',
    example: 'subtotal',
  })
  type?: string;
}

export class BookingQuoteResponseDto {
  @ApiProperty({
    description: 'Final price after coupons and adjustments',
    example: 90.0,
  })
  finalPrice: number;

  @ApiProperty({
    description: 'Price before coupons (still includes dynamic pricing)',
    example: 100.0,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Discount amount applied via coupon (positive value)',
    example: 10.0,
  })
  discountAmount: number;

  @ApiProperty({
    description: 'Platform fee deducted from the total',
    example: 13.5,
  })
  platformFee: number;

  @ApiProperty({
    description: 'Net amount credited to the provider after fees',
    example: 76.5,
  })
  providerNet: number;

  @ApiProperty({
    description: 'Indicates whether a coupon was applied',
    example: true,
  })
  couponApplied: boolean;

  @ApiPropertyOptional({
    description: 'Coupon code applied to the quote',
    example: 'LIMPEJA10',
  })
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Normalized minutes applied for hourly services',
    example: 240,
  })
  minMinutesApplied?: number;

  @ApiProperty({
    description: 'Identifier of the price quote',
    example: 'quote-abc123',
  })
  quoteId: string;

  @ApiProperty({
    description: 'Deterministic hash used to verify the quote',
    example: 'fc5e038d...',
  })
  quoteHash: string;

  @ApiProperty({
    description: 'ISO timestamp when the quote expires',
    example: '2025-02-02T12:00:00.000Z',
  })
  expiresAt: string;

  @ApiProperty({
    description: 'Total amount in cents including insurance if selected',
    example: 12490,
  })
  totalCents: number;

  @ApiProperty({
    description: 'Insurance fee in cents when a plan is selected',
    example: 2490,
  })
  insuranceFeeCents: number;

  @ApiProperty({
    description: 'Available insurance plans for this quote',
    type: [InsurancePlanProposalDto],
  })
  insuranceOptions: InsurancePlanProposalDto[];

  @ApiPropertyOptional({
    description: 'Selected insurance plan when applicable',
    type: InsurancePlanProposalDto,
    nullable: true,
  })
  selectedInsurance?: InsurancePlanProposalDto | null;

  @ApiProperty({
    description: 'Detail of the price components',
    type: [BookingQuoteBreakdownItemDto],
  })
  breakdown: BookingQuoteBreakdownItemDto[];
}
