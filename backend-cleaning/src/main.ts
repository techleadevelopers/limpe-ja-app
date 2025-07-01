// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'; // Importações adicionadas

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

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('LimpeJá API') // Título da sua API
    .setDescription('Documentação da API do marketplace de serviços LimpeJá') // Descrição da API
    .setVersion('1.0') // Versão da API
    .addBearerAuth( // Adiciona suporte a autenticação Bearer (JWT)
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT',
        in: 'header',
      },
      'access-token' // Nome para referenciar este esquema de segurança
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // 'api' é o caminho onde a documentação estará disponível (ex: http://localhost:3000/api)

  // Obtém a porta do serviço de configuração
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  console.time('AppListening'); // Inicia contagem para a fase de escuta
  await app.listen(port, '0.0.0.0');
  console.timeEnd('AppListening'); // Fim da fase de escuta

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger documentation available at: ${await app.getUrl()}/api`); // Log para a URL do Swagger
  console.timeEnd('AppStartupTotal'); // Fim da contagem total
}
bootstrap();