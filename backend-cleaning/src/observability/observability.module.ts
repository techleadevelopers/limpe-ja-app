import { Module } from '@nestjs/common';
import { ObservabilityService } from './observability.service';

@Module({
  providers: [ObservabilityService],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
