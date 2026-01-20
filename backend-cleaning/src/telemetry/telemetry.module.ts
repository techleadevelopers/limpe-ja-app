import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { ChatModule } from '../chat/chat.module';
import { TelemetryController } from './telemetry.controller';
import { TelemetryEventsService } from './telemetry.events.service';
import { TelemetryMiddleware } from './telemetry.middleware';
import { TelemetryNotificationService } from './telemetry.notification.service';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [CacheModule, AuthModule, ChatModule],
  controllers: [TelemetryController],
  providers: [
    TelemetryService,
    TelemetryEventsService,
    TelemetryNotificationService,
    TelemetryMiddleware,
  ],
})
export class TelemetryModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TelemetryMiddleware)
      .forRoutes({ path: 'update-profile', method: RequestMethod.ALL });
  }
}
