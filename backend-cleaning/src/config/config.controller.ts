import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MIN_HOURLY_MINUTES } from '../common/constants/pricing';

export type PricingConfigResponse = {
  minHourlyMinutes: number;
};

@ApiTags('config')
@Controller('config')
export class ConfigController {
  @Get('pricing')
  @ApiOperation({
    summary: 'Retorna configurações de pricing compartilhadas com o frontend',
  })
  getPricingConfig(): PricingConfigResponse {
    return {
      minHourlyMinutes: MIN_HOURLY_MINUTES,
    };
  }
}
