// src/config/config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as fs from 'fs';
import configuration from './configuration';
import { validationSchema } from './validation-schema';

const isProd = process.env.NODE_ENV === 'production';

// Preferir .env também em produção quando o arquivo existir dentro do container
// (ex.: para facilitar deploys simples ou ambientes de staging)
const candidateEnvFiles = [
  '.env.local',
  `.env.${process.env.NODE_ENV || 'development'}`,
  '.env',
];
const existingEnvFiles = candidateEnvFiles.filter((p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
});
const shouldLoadEnvFileInProd = existingEnvFiles.length > 0;

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

      // Em produção, ainda carregamos .env se o arquivo existir (útil dentro do container)
      ignoreEnvFile: isProd ? !shouldLoadEnvFileInProd : false,
      envFilePath: isProd
        ? shouldLoadEnvFileInProd
          ? existingEnvFiles
          : undefined
        : candidateEnvFiles,

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
        const nodeEnv = String(env.NODE_ENV || 'development');
        if (nodeEnv === 'production') {
          const missing: string[] = [];
          const requireUri = (v?: string) =>
            typeof v === 'string' && /^https?:\/\//.test(v);
          if (!requireUri(env.API_BASE_URL)) missing.push('API_BASE_URL');
          if (!env.PIX_WEBHOOK_SECRET) {
            console.warn(
              '[Config] PIX_WEBHOOK_SECRET missing in production; PIX webhook signatures will not be verified.',
            );
          }
          if (!env.PSP_WEBHOOK_SECRET) {
            console.warn(
              '[Config] PSP_WEBHOOK_SECRET missing in production; payout webhooks will skip signature validation.',
            );
          }
          if (!env.PAGSEGURO_API_TOKEN) {
            console.warn(
              '[Config] PAGSEGURO_API_TOKEN ausente em produção: saque ficará bloqueado.',
            );
          }
          if (missing.length) {
            throw new Error(
              `Ambiente de produção sem variáveis obrigatórias: ${missing.join(', ')}`,
            );
          }
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
