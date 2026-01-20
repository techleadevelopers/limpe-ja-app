import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AcceptProviderTermsDto {
  @ApiProperty({
    description: 'Versão dos termos que está sendo aceita.',
    example: 'v1',
  })
  @IsString()
  @IsNotEmpty()
  termsVersion: string;
}
