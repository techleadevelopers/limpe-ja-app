// src/config/validation-schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.string().required(),

  // Variáveis de ambiente para Google Cloud Storage (GCS)
  GCS_PROJECT_ID: Joi.string().required().description('Google Cloud Project ID'),
  GCS_KEY_FILE: Joi.string().required().description('Path to the Google Cloud Service Account key file (JSON)'),
  GCS_BUCKET_NAME: Joi.string().required().description('Name of the Google Cloud Storage bucket'),

  // Adicione validações para outras variáveis de ambiente aqui
  // STRIPE_SECRET_KEY: Joi.string().optional(),
});