import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.string().required(),

  // Variáveis de ambiente para Google Cloud Storage (GCS)
  GCS_PROJECT_ID: Joi.string().required().description('Google Cloud Project ID'),
  GCS_KEY: Joi.string().required().description('Base64 encoded Google Cloud Service Account key file content'),
  GCS_BUCKET_NAME: Joi.string().required().description('Name of the Google Cloud Storage bucket'),

  // NOVAS VARIÁVEIS DE AMBIENTE: Cellereit Facematch
  THIRD_PARTY_FACEMATCH_API_URL: Joi.string().uri().required().description('URL da API de terceiros para comparação facial e liveness check (Cellereit Facematch)'),
  THIRD_PARTY_FACEMATCH_API_KEY: Joi.string().required().description('Chave da API de terceiros para comparação facial e liveness check (Cellereit Facematch)'),

  // NOVAS VARIÁVEIS DE AMBIENTE: Email Service
  EMAIL_SERVICE_PROVIDER: Joi.string().optional().description('Provedor de serviço de e-mail (ex: SENDGRID, SMTP)'),
  SENDGRID_API_KEY: Joi.string().when('EMAIL_SERVICE_PROVIDER', {
    is: 'SENDGRID',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }).description('Chave da API do SendGrid'),
  SMTP_HOST: Joi.string().when('EMAIL_SERVICE_PROVIDER', {
    is: 'SMTP',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }).description('Host SMTP'),
  SMTP_PORT: Joi.number().when('EMAIL_SERVICE_PROVIDER', {
    is: 'SMTP',
    then: Joi.number().required(),
    otherwise: Joi.optional(),
  }).description('Porta SMTP'),
  SMTP_USER: Joi.string().when('EMAIL_SERVICE_PROVIDER', {
    is: 'SMTP',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }).description('Usuário SMTP'),
  SMTP_PASS: Joi.string().when('EMAIL_SERVICE_PROVIDER', {
    is: 'SMTP',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }).description('Senha SMTP'),
  DEFAULT_EMAIL_FROM: Joi.string().email().required().description('Email padrão do remetente'),

  // NOVAS VARIÁVEIS DE AMBIENTE: SMS Service
  SMS_SERVICE_PROVIDER: Joi.string().optional().description('Provedor de serviço de SMS (ex: TWILIO)'),
  TWILIO_ACCOUNT_SID: Joi.string().when('SMS_SERVICE_PROVIDER', {
    is: 'TWILIO',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }).description('Twilio Account SID'),
  TWILIO_AUTH_TOKEN: Joi.string().when('SMS_SERVICE_PROVIDER', {
    is: 'TWILIO',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }).description('Twilio Auth Token'),
  TWILIO_PHONE_NUMBER: Joi.string().when('SMS_SERVICE_PROVIDER', {
    is: 'TWILIO',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }).description('Número de telefone Twilio'),
  TWILIO_VERIFY_SERVICE_SID: Joi.string().when('SMS_SERVICE_PROVIDER', { // Nova variável para Twilio Verify
    is: 'TWILIO',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }).description('Twilio Verify Service SID'),

  // NOVAS VARIÁVEIS DE AMBIENTE: Geocoding Service
  GEOCODING_API_PROVIDER: Joi.string().optional().description('Provedor da API de geocodificação (ex: GOOGLE_MAPS, OPENSTREETMAP)'),
  GOOGLE_MAPS_API_KEY: Joi.string().when('GEOCODING_API_PROVIDER', {
    is: 'GOOGLE_MAPS',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }).description('Chave da API do Google Maps para Geocodificação'),
  OPENSTREETMAP_NOMINATIM_URL: Joi.string().uri().when('GEOCODING_API_PROVIDER', {
    is: 'OPENSTREETMAP',
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }).description('URL do Nominatim para OpenStreetMap'),
});
