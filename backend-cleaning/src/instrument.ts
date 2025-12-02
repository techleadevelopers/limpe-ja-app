// src/instrument.ts
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { ConfigService } from '@nestjs/config';

// O DSN será lido da variável de ambiente SENTRY_DSN
const configService = new ConfigService();
const sentryDsn = configService.get<string>('SENTRY_DSN');
const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: nodeEnv,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    integrations: [nodeProfilingIntegration()],
  });
  console.log('[Sentry] Inicializado com sucesso.');
} else {
  console.warn(
    '[Sentry] SENTRY_DSN não configurado. O monitoramento de erros e performance do Sentry está desativado.',
  );
}

export { Sentry };
