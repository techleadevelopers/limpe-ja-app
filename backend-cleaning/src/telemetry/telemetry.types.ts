export interface TelemetryAnomalyPayload {
  userId: string;
  path: string;
  count: number;
  windowSeconds: number;
  timestamp: string;
}

export const TELEMETRY_ANOMALY_EVENT = 'AnomaliaDetectada';

export interface TelemetryLatencySpikePayload {
  route: string;
  averageLatencyMs: number;
  thresholdMs: number;
  timestamp: string;
}

export const TELEMETRY_LATENCY_SPIKE_EVENT = 'LatencySpikeDetected';
