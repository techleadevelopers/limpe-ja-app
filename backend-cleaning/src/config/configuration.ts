// src/config/configuration.ts
/**
 * Config central do app.
 * - Fallback seguro para REDIS_URL (usa REDIS_URL_PUBLIC se não vier o interno)
 * - Normalização de números/URLs
 * - Decodificação opcional da chave GCS em base64
 */
const toInt = (v: string | undefined, fallback: number): number => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
};

const pickRedisUrl = (): string => {
  const primary = (process.env.REDIS_URL || '').trim();
  const fallback = (process.env.REDIS_URL_PUBLIC || '').trim();
  return primary || fallback || 'redis://localhost:6379';
};

const stripTrailingSlash = (url?: string | null) =>
  (url ?? '').replace(/\/+$/, '');

const decodeMaybeBase64 = (v?: string | null): string | undefined => {
  if (!v) return v ?? undefined;
  try {
    // heurística simples para detectar base64
    if (/^[A-Za-z0-9+/]+=*$/.test(v) && v.length % 4 === 0) {
      const decoded = Buffer.from(v, 'base64').toString('utf8');
      // se parecer JSON (service account), preferimos o decodificado
      if (decoded.trim().startsWith('{')) return decoded;
    }
  } catch {
    // segue com o valor original se falhar
  }
  return v;
};

export default () => ({
  // Básico
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.PORT, 3000),
  databaseUrl: process.env.DATABASE_URL,
  appBaseUrl: stripTrailingSlash(process.env.APP_BASE_URL),

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expirationTime: process.env.JWT_EXPIRATION_TIME,
  },

  // Throttle
  throttle: {
    ttl: toInt(process.env.THROTTLE_TTL, 60),
    limit: toInt(process.env.THROTTLE_LIMIT, 10),
  },

  notifications: {
    dedupeWindowSeconds: toInt(
      process.env.NOTIFICATIONS_DEDUPE_WINDOW_SECONDS,
      180,
    ),
    defaultTtlSeconds: toInt(
      process.env.NOTIFICATIONS_DEFAULT_TTL_SECONDS,
      300,
    ),
  },

  // Redis (Bull, Locks, Cache)
  redis: {
    url: pickRedisUrl(),
  },

  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN || undefined,
  },

  // Upload storage is handled by UploadThing (no GCS config)

  // APIs de terceiros
  thirdPartyApis: {
    facematch: {
      apiUrl: process.env.THIRD_PARTY_FACEMATCH_API_URL,
      apiKey: process.env.THIRD_PARTY_FACEMATCH_API_KEY,
    },
  },

  // Email
  email: {
    provider: process.env.EMAIL_SERVICE_PROVIDER || undefined,
    sendgridApiKey: process.env.SENDGRID_API_KEY || undefined,
    smtpHost: process.env.SMTP_HOST || undefined,
    smtpPort: toInt(process.env.SMTP_PORT, 587),
    smtpUser: process.env.SMTP_USER || undefined,
    smtpPass: process.env.SMTP_PASS || undefined,
    defaultFrom: process.env.DEFAULT_EMAIL_FROM,
  },

  // SMS
  sms: {
    provider: process.env.SMS_SERVICE_PROVIDER || undefined,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || undefined,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || undefined,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || undefined,
    twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || undefined,
  },

  // Geocoding
  geocoding: {
    provider: process.env.GEOCODING_API_PROVIDER || undefined,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || undefined,
    openStreetMapNominatimUrl:
      process.env.OPENSTREETMAP_NOMINATIM_URL || undefined,
  },

  // PagSeguro
  pagseguro: {
    apiToken: process.env.PAGSEGURO_API_TOKEN,
    apiBaseUrl: stripTrailingSlash(process.env.PAGSEGURO_API_BASE_URL),
  },

  // 🔥 ADIÇÃO NECESSÁRIA PARA O WEBHOOK FUNCIONAR
  pix: {
    webhookSecret: process.env.PIX_WEBHOOK_SECRET,
  },

  psp: {
    webhookSecret: process.env.PSP_WEBHOOK_SECRET,
  },
});
