export interface TelemetryAnomalyPayload {
  userId: string;
  path: string;
  count: number;
  windowSeconds: number;
  timestamp: string;
}

export const TELEMETRY_ANOMALY_EVENT = 'AnomaliaDetectada';
