import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { json, urlencoded } from 'express';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as process from 'process';
import { I18nService } from './common/i18n/i18n.service';
import { initPrometheus } from './metrics/prometheus';
import { TracingInterceptor } from './common/interceptors/tracing.interceptor';
import { initTracing } from './tracing/otel';
import { logMissingConfigOnce } from './common/logging/missing-config.logger';

async function bootstrap() {
  console.time('AppStartupTotal');

  console.time('NestAppCreation');
  const app = await NestFactory.create(AppModule);
  console.timeEnd('NestAppCreation');

  const configService = app.get(ConfigService);
  const i18nService = app.get(I18nService);

  // =======================================================
  //                   PROMETHEUS METRICS
  // =======================================================
  initPrometheus();

  // =======================================================
  //                 OPEN TELEMETRY TRACING
  // =======================================================
  initTracing({
    serviceName:
      configService.get<string>('OTEL_SERVICE_NAME') || 'backend-cleaning',
    otlpEndpoint: configService.get<string>('OTEL_EXPORTER_OTLP_ENDPOINT'),
    debug: configService.get<string>('OTEL_DEBUG') === '1',
  });

  const sentryDsn = configService.get<string>('SENTRY_DSN');
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  const isProd = nodeEnv === 'production';
  const webhookLogger = new Logger('WebhookParser');

  const criticalSecrets = [
    {
      key: 'PAGSEGURO_API_TOKEN',
      message:
        'PAGSEGURO_API_TOKEN ausente. Integração real com PSP desativada (modo placeholder).',
      label: 'PagSeguro API token',
    },
    {
      key: 'API_BASE_URL',
      message:
        'API_BASE_URL ausente. Webhooks de PSP podem não funcionar externamente.',
      label: 'Application base URL',
    },
    {
      key: 'PIX_WEBHOOK_SECRET',
      message:
        'PIX webhook secret not configured. Webhooks funcionarão em modo inseguro.',
      label: 'PIX webhook secret',
    },
    {
      key: 'psp.webhookSecret',
      message:
        'PSP webhook secret not configured. Webhooks funcionarão em modo inseguro.',
      label: 'PSP webhook secret',
    },
  ];

  const missingSecrets = criticalSecrets
    .map((secret) => ({
      ...secret,
      value: configService.get<string>(secret.key),
    }))
    .filter((secret) => !secret.value);

  if (isProd && missingSecrets.length > 0) {
    throw new Error(
      `Missing production secrets: ${missingSecrets
        .map((secret) => `${secret.key} (${secret.label})`)
        .join(', ')}`,
    );
  }

  if (!isProd) {
    missingSecrets.forEach(({ key, message }) => {
      logMissingConfigOnce(key, message);
    });
  }

  // ===== SENTRY =====
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
    console.warn('[Sentry] SENTRY_DSN não configurado. Sentry desativado.');
  }

  // =======================================================
  //        WEBHOOK PIX - RAW BODY (SEM SEGURANÇA)
  // =======================================================
  app.use((req: any, res, next) => {
    if (req.originalUrl.includes('/payments/webhook/pix')) {
      req.setEncoding('utf8');
      let data = '';

      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', () => {
        req.rawBody = data;

        try {
          req.body = JSON.parse(data);
          webhookLogger.debug('[Webhook PIX] raw payload parsed');
        } catch (err) {
          req.body = data;
          webhookLogger.error('[Webhook PIX] invalid JSON payload, using raw string', typeof err === 'object' && err !== null ? err.toString() : 'unknown error');
        }

        return next();
      });
    } else {
      return next();
    }
  });

  // =======================================================
  //        WEBHOOK PSP - RAW BODY PARA ASSINATURA PAGSEGURO
  // =======================================================
  app.use((req: any, res, next) => {
    if (req.originalUrl.includes('/payouts/webhook/gateway')) {
      req.setEncoding('utf8');
      let data = '';

      req.on('data', (chunk) => {
        data += chunk;
      });

      req.on('end', () => {
        req.rawBody = data;

        try {
          req.body = JSON.parse(data);
          webhookLogger.debug('[Webhook PSP] raw payload parsed');
        } catch (err) {
          req.body = data;
          webhookLogger.error('[Webhook PSP] invalid JSON payload, using raw string', typeof err === 'object' && err !== null ? err.toString() : 'unknown error');
        }

        return next();
      });
    } else {
      return next();
    }
  });

  // Evitar que o JSON parser sobrescreva o webhook PIX
  app.use((req: any, res, next) => {
    if (
      req.originalUrl.includes('/payments/webhook/pix') ||
      req.originalUrl.includes('/payouts/webhook/gateway')
    ) {
      return next();
    }
    return json({ limit: '10mb' })(req, res, next);
  });

  app.use((req: any, res, next) => {
    if (req.originalUrl.includes('/payments/webhook/pix')) {
      return next();
    }
    return urlencoded({ extended: true, limit: '10mb' })(req, res, next);
  });

  // =======================================================
  //                        CORS
  // =======================================================
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:8081',
    'https://limpeja-backend-production-edfa.up.railway.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // =======================================================
  //                  VALIDATION PIPE GLOBAL
  // =======================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },

      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          const constraintMessage = Object.values(error.constraints ?? {})[0];
          return constraintMessage;
        });
        return new BadRequestException(messages);
      },
    }),
  );

  // =======================================================
  //                EXCEPTION FILTER GLOBAL
  // =======================================================
  app.useGlobalFilters(new AllExceptionsFilter(i18nService));

  // =======================================================
  //                  TRACING INTERCEPTOR
  // =======================================================
  app.useGlobalInterceptors(app.get(TracingInterceptor));

  // =======================================================
  //                    FIREBASE ADMIN
  // =======================================================
  try {
    admin.initializeApp();
    console.log('[Firebase Admin] Inicializado automaticamente.');
  } catch (error: any) {
    console.error(`[Firebase Admin] Erro: ${error.message}`);

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      try {
        const serviceAccountPath = path.resolve(
          process.cwd(),
          process.env.GOOGLE_APPLICATION_CREDENTIALS,
        );

        const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountRaw);

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        console.log(
          '[Firebase Admin] Inicializado via GOOGLE_APPLICATION_CREDENTIALS.',
        );
      } catch (innerError: any) {
        console.error(
          `[Firebase Admin] Falha no carregamento manual: ${innerError.message}`,
        );

        throw new Error(
          'Firebase Admin SDK failed to initialize via GOOGLE_APPLICATION_CREDENTIALS.',
        );
      }
    } else {
      console.warn(
        '[Firebase Admin] SDK NÃO INICIALIZADO — notificações podem falhar.',
      );
    }
  }

  // =======================================================
  //                       SWAGGER
  // =======================================================
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LimpeJá API')
    .setDescription('Documentação da API do marketplace de serviços LimpeJá')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // =======================================================
  //                    LOGGING MODE
  // =======================================================
  if (isProd) {
    app.useLogger(['error', 'warn']);
  } else {
    app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
  }

  // =======================================================
  //                     START SERVER
  // =======================================================
  const port = configService.get<number>('PORT') || 3000;

  console.time('AppListening');
  await app.listen(port, '0.0.0.0');
  console.timeEnd('AppListening');

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api`);
  console.timeEnd('AppStartupTotal');
}

bootstrap().catch((err) => {
  console.error('Nest bootstrap failed', err);
  process.exit(1);
});
