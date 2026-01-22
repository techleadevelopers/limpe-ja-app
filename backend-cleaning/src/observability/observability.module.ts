import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ObservabilityLatencyInterceptor } from './observability-latency.interceptor';
import { ObservabilityService } from './observability.service';

@Module({
  imports: [ConfigModule],
  providers: [
    ObservabilityService,
    ObservabilityLatencyInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useExisting: ObservabilityLatencyInterceptor,
    },
  ],
  exports: [ObservabilityService],
})
export class ObservabilityModule {}
