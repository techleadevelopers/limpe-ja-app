import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import { TelemetryAnomalyPayload, TELEMETRY_ANOMALY_EVENT } from './telemetry.types';

@Injectable()
export class TelemetryEventsService extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(25);
  }

  publishAnomaly(payload: TelemetryAnomalyPayload): void {
    this.emit(TELEMETRY_ANOMALY_EVENT, payload);
  }
}
