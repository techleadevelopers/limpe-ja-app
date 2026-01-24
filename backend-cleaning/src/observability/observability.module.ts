import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ObservabilityLatencyInterceptor } from './observability-latency.interceptor';
import { ObservabilityService } from './observability.service';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule, TelemetryModule],
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
