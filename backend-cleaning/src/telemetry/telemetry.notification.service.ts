import { Injectable, Logger } from '@nestjs/common';
import { ChatGateway } from '../chat/gateway/chat.gateway';
import { TelemetryEventsService } from './telemetry.events.service';
import {
  TelemetryAnomalyPayload,
  TELEMETRY_ANOMALY_EVENT,
} from './telemetry.types';

@Injectable()
export class TelemetryNotificationService {
  private readonly logger = new Logger(TelemetryNotificationService.name);

  constructor(
    private readonly events: TelemetryEventsService,
    private readonly chatGateway: ChatGateway,
  ) {
    this.events.on(TELEMETRY_ANOMALY_EVENT, (payload: TelemetryAnomalyPayload) =>
      this.handleAnomaly(payload),
    );
  }

  private handleAnomaly(payload: TelemetryAnomalyPayload): void {
    const server = this.chatGateway.server;
    if (!server) {
      this.logger.warn(
        'ChatGateway ainda não inicializado; aguardando conexão para notificar admins.',
      );
      return;
    }

    this.logger.warn(
      `[TelemetryNotificationService] Emitindo anomalia para ${payload.userId} (evento ${payload.path})`,
    );

    server.emit('telemetryAnomaly', {
      ...payload,
      target: 'ADMIN',
      level: 'warning',
    });
  }
}
