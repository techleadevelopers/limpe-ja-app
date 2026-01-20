import { ApiProperty } from '@nestjs/swagger';
import { VerificationStatus } from '@prisma/client';
import { ProviderWithCalculatedRating } from '../providers.service';
import { ProviderDetailsDto } from './provider-details.dto';

export class ProviderViewDto extends ProviderDetailsDto {
  @ApiProperty({
    description:
      'Flag que indica se o provedor passou pelo processo de verificação.',
    example: true,
  })
  isVerified: boolean;

  constructor(source: ProviderWithCalculatedRating) {
    super(source);
    this.isVerified = source.verificationStatus === VerificationStatus.APPROVED;
  }
}
