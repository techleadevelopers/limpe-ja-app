declare module '@opentelemetry/sdk-trace-node' {
  export class NodeTracerProvider {
    constructor(options?: any);
    addSpanProcessor(processor: any): void;
    register(options?: any): void;
  }
}

declare module '@opentelemetry/exporter-trace-otlp-http' {
  export class OTLPTraceExporter {
    constructor(options?: { url?: string });
    shutdown(): Promise<void>;
  }
}

declare module '@opentelemetry/resources' {
  export class Resource {
    constructor(attributes?: Record<string, any>);
    static empty(): Resource;
  }
}

declare module '@opentelemetry/semantic-conventions' {
  export const SemanticResourceAttributes: Record<string, string>;
}
