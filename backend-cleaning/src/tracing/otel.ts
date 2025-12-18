import {
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  trace,
} from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function initTracing(options?: {
  serviceName?: string;
  otlpEndpoint?: string;
  debug?: boolean;
}) {
  const serviceName = options?.serviceName || 'backend-cleaning';
  const otlpEndpoint =
    options?.otlpEndpoint ||
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;

  if (options?.debug || process.env.OTEL_DEBUG === '1') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  if (!otlpEndpoint) {
    console.warn('[OTEL] OTLP endpoint não configurado. Tracing desativado.');
    return;
  }

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  });

  const provider = new NodeTracerProvider({ resource });

  const exporter = new OTLPTraceExporter({
    url: otlpEndpoint, // ex: http://otel-collector:4318/v1/traces
  });

  provider.addSpanProcessor(
    new BatchSpanProcessor(exporter as any, {
      maxQueueSize: 2048,
      scheduledDelayMillis: 5000,
    }),
  );

  provider.register();
  console.log(`[OTEL] Tracing inicializado. Exportando para ${otlpEndpoint}`);

  return trace.getTracer(serviceName);
}
