// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  console.time('AppStartupTotal'); // Inicia contagem total

  console.time('NestAppCreation');
  const app = await NestFactory.create(AppModule);
  console.timeEnd('NestAppCreation'); // Fim da criação da instância Nest

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Obtém a porta do serviço de configuração
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  console.time('AppListening'); // Inicia contagem para a fase de escuta
  await app.listen(port, '0.0.0.0');
  console.timeEnd('AppListening'); // Fim da fase de escuta

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.timeEnd('AppStartupTotal'); // Fim da contagem total
}
bootstrap();
