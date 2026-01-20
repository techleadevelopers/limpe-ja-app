// src/config/validation-schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.string().required(),

  APP_BASE_URL: Joi.string()
    .uri()
    .required()
    .description('URL base da aplicação para webhooks e redirecionamentos.'),

  // 🔥 ADICIONADO: Secrets para validação de webhooks
  PIX_WEBHOOK_SECRET: Joi.string().optional(),
  PSP_WEBHOOK_SECRET: Joi.string().optional(),
  PSP_WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS: Joi.number()
    .default(60)
    .description(
      'Tolerance window (seconds) for PSP webhook timestamps; production clamps to [10,300], dev/test clamps max 300.',
    ),

  // Throttle
  THROTTLE_TTL: Joi.number()
    .default(60)
    .description('TTL para throttle em segundos'),
  THROTTLE_LIMIT: Joi.number()
    .default(10)
    .description('Limite de requests por TTL'),

  NOTIFICATIONS_DEDUPE_WINDOW_SECONDS: Joi.number()
    .min(30)
    .default(180)
    .description(
      'Janela (segundos) para deduplicar AppEvents com mesmo dedupeKey.',
    ),
  NOTIFICATIONS_DEFAULT_TTL_SECONDS: Joi.number()
    .min(60)
    .default(300)
    .description('TTL padrão (segundos) para AppEvents enviados no stream.'),

  // Redis: aceita interno (REDIS_URL) ou público (REDIS_URL_PUBLIC)
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .allow('', null)
    .description('URL de conexão com o Redis (preferir interno)'),

  REDIS_URL_PUBLIC: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .allow('', null)
    .description('URL pública do Redis (fallback)'),

  // Sentry (opcional)
  SENTRY_DSN: Joi.string()
    .allow('', null)
    .optional()
    .description('DSN do Sentry'),
  SENTRY_API_TOKEN: Joi.string()
    .allow('', null)
    .optional()
    .description('Token da API do Sentry (Bearer).'),
  SENTRY_API_ORG_SLUG: Joi.string()
    .allow('', null)
    .optional()
    .description('Slug da organização no Sentry.'),
  SENTRY_API_PROJECT_SLUG: Joi.string()
    .allow('', null)
    .optional()
    .description('Slug do projeto no Sentry.'),
  SENTRY_API_BASE_URL: Joi.string()
    .uri()
    .allow('', null)
    .optional()
    .description(
      'Base URL para a API do Sentry (ex: https://sentry.io/api/0).',
    ),

  // Cellereit Facematch
  THIRD_PARTY_FACEMATCH_API_URL: Joi.string()
    .uri()
    .required()
    .description('URL da API de terceiros (facematch/liveness)'),

  THIRD_PARTY_FACEMATCH_API_KEY: Joi.string()
    .required()
    .description('Chave da API de terceiros (facematch/liveness)'),

  // WhatsApp Business API (opcional em dev/test)
  WHATSAPP_API_BASE_URL: Joi.string()
    .uri()
    .allow('', null)
    .optional()
    .description('Endpoint base da API do WhatsApp Business'),

  WHATSAPP_API_TOKEN: Joi.string().allow('', null).optional(),

  WHATSAPP_PIX_KEY: Joi.string().allow('', null).optional(),

  WHATSAPP_PIX_RECEIVER_NAME: Joi.string().allow('', null).optional(),

  // Z-API integration
  ZAPI_INSTANCE_ID: Joi.string().allow('', null).optional(),

  ZAPI_TOKEN: Joi.string()
    .required()
    .description('Token da Z-API usado no endpoint de envio de mensagens'),

  ZAPI_BASE_URL: Joi.string()
    .uri()
    .required()
    .description('Base URL da Z-API (instância + token)'),

  // Email Service
  EMAIL_SERVICE_PROVIDER: Joi.string().allow('', null).optional(),

  SENDGRID_API_KEY: Joi.string().when('EMAIL_SERVICE_PROVIDER', {
    is: 'SENDGRID',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  SMTP_HOST: Joi.string().when('EMAIL_SERVICE_PROVIDER', {
    is: 'SMTP',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  SMTP_PORT: Joi.number().when('EMAIL_SERVICE_PROVIDER', {
    is: 'SMTP',
    then: Joi.number().required(),
    otherwise: Joi.optional(),
  }),

  SMTP_USER: Joi.string().when('EMAIL_SERVICE_PROVIDER', {
    is: 'SMTP',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  SMTP_PASS: Joi.string().when('EMAIL_SERVICE_PROVIDER', {
    is: 'SMTP',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  DEFAULT_EMAIL_FROM: Joi.string().email().required(),

  // SMS (Twilio opcional)
  SMS_SERVICE_PROVIDER: Joi.string().allow('', null).optional(),

  TWILIO_ACCOUNT_SID: Joi.string().when('SMS_SERVICE_PROVIDER', {
    is: 'TWILIO',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  TWILIO_AUTH_TOKEN: Joi.string().when('SMS_SERVICE_PROVIDER', {
    is: 'TWILIO',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  TWILIO_PHONE_NUMBER: Joi.string().when('SMS_SERVICE_PROVIDER', {
    is: 'TWILIO',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  TWILIO_VERIFY_SERVICE_SID: Joi.string().when('SMS_SERVICE_PROVIDER', {
    is: 'TWILIO',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  // Geocoding
  GEOCODING_API_PROVIDER: Joi.string().allow('', null).optional(),

  GOOGLE_MAPS_API_KEY: Joi.string().when('GEOCODING_API_PROVIDER', {
    is: 'GOOGLE_MAPS',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),

  OPENSTREETMAP_NOMINATIM_URL: Joi.string()
    .uri()
    .when('GEOCODING_API_PROVIDER', {
      is: 'OPENSTREETMAP',
      then: Joi.string().required(),
      otherwise: Joi.optional(),
    }),
})
  // Exige ao menos um Redis válido
  .or('REDIS_URL', 'REDIS_URL_PUBLIC')
  .messages({
    'object.missing':
      'Configuração inválida: defina REDIS_URL (interno) ou REDIS_URL_PUBLIC (público).',
  });
