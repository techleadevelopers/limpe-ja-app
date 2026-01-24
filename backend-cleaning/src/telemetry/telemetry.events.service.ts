import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';
import {
  TelemetryAnomalyPayload,
  TELEMETRY_LATENCY_SPIKE_EVENT,
  TELEMETRY_ANOMALY_EVENT,
  TelemetryLatencySpikePayload,
} from './telemetry.types';

@Injectable()
export class TelemetryEventsService extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(25);
  }

  publishAnomaly(payload: TelemetryAnomalyPayload): void {
    this.emit(TELEMETRY_ANOMALY_EVENT, payload);
  }

  publishLatencySpike(payload: TelemetryLatencySpikePayload): void {
    this.emit(TELEMETRY_LATENCY_SPIKE_EVENT, payload);
  }
}
