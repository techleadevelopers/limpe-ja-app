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

  // **** ALTERAÇÃO AQUI ****
  // Use process.env.PORT diretamente, ou o valor do ConfigService,
  // com um fallback para 8080 (padrão do Cloud Run) ou 3000 (para desenvolvimento local)
  const port = process.env.PORT || configService.get<number>('PORT') || 3000;
  // Ou, para simplificar e focar no Cloud Run:
  // const port = parseInt(process.env.PORT || '8080', 10);
  // Ou, se você tem certeza que o ConfigService vai pegar do .env e quer priorizá-lo:
  // const port = configService.get<number>('PORT') || 8080; // Prioriza o .env, fallback para 8080

  console.time('AppListening'); // Inicia contagem para a fase de escuta
  // Sempre escutar em '0.0.0.0' para aceitar conexões de qualquer interface dentro do contêiner
  await app.listen(port, '0.0.0.0');
  console.timeEnd('AppListening'); // Fim da fase de escuta

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.timeEnd('AppStartupTotal'); // Fim da contagem total
}
bootstrap();