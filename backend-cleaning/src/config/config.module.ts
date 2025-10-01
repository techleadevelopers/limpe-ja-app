// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { validationSchema } from './validation-schema';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Carrega variáveis de ambiente:
 * - Em produção: só do ambiente do provedor (ignoreEnvFile: true)
 * - Em dev: de .env.local, .env.<NODE_ENV>, .env (nesta ordem)
 * 
 * Extras:
 * - expandVariables: permite usar VAR=${OUTRA_VAR} no .env
 * - validate (fallback): se REDIS_URL não vier, tenta REDIS_URL_PUBLIC
 * - validationSchema/Options: valida e mostra todos os erros (abortEarly: false)
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],

      ignoreEnvFile: isProd,
      envFilePath: isProd
        ? undefined
        : [
            '.env.local',
            `.env.${process.env.NODE_ENV || 'development'}`,
            '.env',
          ],

      cache: isProd,
      expandVariables: true,

      // Fallback antes/ao lado da validação: promove REDIS_URL_PUBLIC -> REDIS_URL se necessário
      validate: (env: Record<string, any>) => {
        if (
          (!env.REDIS_URL || String(env.REDIS_URL).trim() === '') &&
          env.REDIS_URL_PUBLIC
        ) {
          env.REDIS_URL = env.REDIS_URL_PUBLIC;
        }
        return env;
      },

      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
