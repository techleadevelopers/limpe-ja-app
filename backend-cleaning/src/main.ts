// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as admin from 'firebase-admin';
import * as path from 'path';
import { json, urlencoded } from 'express';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as process from 'process';

async function bootstrap() {
  console.time('AppStartupTotal');

  console.time('NestAppCreation');
  const app = await NestFactory.create(AppModule);
  console.timeEnd('NestAppCreation');

  const configService = app.get(ConfigService);

  const sentryDsn = configService.get<string>('SENTRY_DSN');
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: nodeEnv,
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
      integrations: [
        nodeProfilingIntegration(),
      ],
    });
    console.log('[Sentry] Inicializado com sucesso.');
  } else {
    console.warn('[Sentry] SENTRY_DSN não configurado. O monitoramento de erros e performance do Sentry está desativado.');
  }

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // *** ALTERAÇÃO AQUI: Mude o 'origin' para '*' ***
  app.enableCors({
    origin: '*', // Permite requisições de QUALQUER origem
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  // ************************************************

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  app.useGlobalFilters(new HttpExceptionFilter());

  try {
    admin.initializeApp();
    console.log('[Firebase Admin] SDK inicializado automaticamente no ambiente Cloud Run ou GCP.');
  } catch (error: any) {
    console.error(`[Firebase Admin] Erro na inicialização automática do SDK: ${error.message}`);
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
            const serviceAccountPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
            const serviceAccount = require(serviceAccountPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('[Firebase Admin] SDK inicializado via GOOGLE_APPLICATION_CREDENTIALS.');
        } catch (innerError: any) {
            console.error(`[Firebase Admin] Erro ao carregar credenciais de GOOGLE_APPLICATION_CREDENTIALS: ${innerError.message}`);
            throw new Error('Firebase Admin SDK failed to initialize via GOOGLE_APPLICATION_CREDENTIALS.');
        }
    } else {
        console.warn('[Firebase Admin] Firebase Admin SDK não foi inicializado. Funções que dependem dele (como notificações push) podem falhar.');
    }
  }

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
      'access-token'
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT') || 3000;

  console.time('AppListening');
  await app.listen(port, '0.0.0.0');
  console.timeEnd('AppListening');

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api`);
  console.timeEnd('AppStartupTotal');
}
bootstrap();