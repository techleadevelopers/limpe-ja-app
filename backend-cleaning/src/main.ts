// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita CORS para permitir requisições do frontend
  app.enableCors();

  // Configura o ValidationPipe globalmente para validação de DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove propriedades que não estão definidas nos DTOs
    forbidNonWhitelisted: true, // Lança erro se houver propriedades não definidas
    transform: true, // Transforma payloads de entrada para instâncias de DTO
    transformOptions: {
      enableImplicitConversion: true, // Permite conversão implícita de tipos (ex: string para number)
    },
  }));

  // Configura o filtro de exceções globalmente
  app.useGlobalFilters(new HttpExceptionFilter());

  // Obtém a porta do serviço de configuração
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // AQUI ESTÁ A ALTERAÇÃO CRUCIAL:
  // Adicionamos '0.0.0.0' para que o servidor ouça em todas as interfaces de rede,
  // tornando-o acessível de outros dispositivos na mesma rede local.
  await app.listen(port, '0.0.0.0');
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();