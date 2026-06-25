/**
 * OpenTelemetry instrumentation bootstrap.
 * This must be imported BEFORE any other module in main.ts
 * when using Node.js auto-instrumentation.
 *
 * Usage: import './tracing' at the very top of main.ts
 *
 * Design note: We use OTLP gRPC exporter which is vendor-neutral.
 * Swap the exporter for Jaeger, Zipkin, or a vendor SDK without
 * changing business logic.
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';

const isEnabled = process.env.OTEL_ENABLED !== 'false';

let sdk: NodeSDK | null = null;

if (isEnabled) {
  const exporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  });

  sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'saas-workspace-api',
    traceExporter: exporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true },
        '@opentelemetry/instrumentation-ioredis': { enabled: true },
      }),
    ],
  });

  sdk.start();
  console.log('OpenTelemetry SDK started');

  process.on('SIGTERM', () => {
    sdk?.shutdown().catch(console.error);
  });
}

export default sdk;
