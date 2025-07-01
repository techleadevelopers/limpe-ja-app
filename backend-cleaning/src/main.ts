// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  console.time('AppStartupTotal'); // Inicia contagem total

  console.time('NestAppCreation');
  const app = await NestFactory.create(AppModule);
  console.timeEnd('NestAppCreation');

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('LimpeJá API')
    .setDescription('Documentação oficial da API LimpeJá')
    .setVersion('1.0')
    .addBearerAuth() // habilita token JWT nos endpoints protegidos via doc
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Configura porta pelo service
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  console.time('AppListening');
  await app.listen(port, '0.0.0.0');
  console.timeEnd('AppListening');

  console.log(`✅ LimpeJá API running at: ${await app.getUrl()}`);
  console.timeEnd('AppStartupTotal');
}
bootstrap();
