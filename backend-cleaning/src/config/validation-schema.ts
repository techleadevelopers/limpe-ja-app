// src/config/validation-schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION_TIME: Joi.string().required(),
  // Adicione validações para outras variáveis de ambiente aqui
  // STRIPE_SECRET_KEY: Joi.string().optional(),
});