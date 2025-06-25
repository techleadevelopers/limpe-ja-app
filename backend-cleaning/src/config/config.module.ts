// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validationSchema } from './validation-schema';
import configuration from './configuration';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // Torna o ConfigModule disponível globalmente
      load: [configuration], // Carrega a configuração customizada
      validationSchema, // Schema de validação para as variáveis de ambiente
      envFilePath: `.env`, // Caminho para o arquivo .env
    }),
  ],
})
export class ConfigModule {}