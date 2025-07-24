export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expirationTime: process.env.JWT_EXPIRATION_TIME,
  },
  googleCloudStorage: {
    projectId: process.env.GCS_PROJECT_ID,
    keyFile: process.env.GCS_KEY,
    bucketName: process.env.GCS_BUCKET_NAME,
  },
  // Configuração para as APIs de terceiros da Cellereit
  thirdPartyApis: { // Agrupando todas as APIs de terceiros em um objeto para melhor organização
    // backgroundCheck: { // REMOVIDO: Não será mais utilizado
    //   apiUrl: process.env.THIRD_PARTY_BACKGROUND_CHECK_API_URL,
    //   apiKey: process.env.THIRD_PARTY_BACKGROUND_CHECK_API_KEY,
    // },
    // contextus: { // REMOVIDO: Não será mais utilizado
    //   apiUrl: process.env.THIRD_PARTY_CONTEXTUS_API_URL,
    //   apiKey: process.env.THIRD_PARTY_CONTEXTUS_API_KEY,
    // },
    facematch: { // Nova configuração para Facematch
      apiUrl: process.env.THIRD_PARTY_FACEMATCH_API_URL,
      apiKey: process.env.THIRD_PARTY_FACEMATCH_API_KEY,
    },
  },
  // NOVAS CONFIGURAÇÕES: Email Service
  email: {
    provider: process.env.EMAIL_SERVICE_PROVIDER,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT, 10),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    defaultFrom: process.env.DEFAULT_EMAIL_FROM,
  },
  // NOVAS CONFIGURAÇÕES: SMS Service
  sms: {
    provider: process.env.SMS_SERVICE_PROVIDER,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  // NOVAS CONFIGURAÇÕES: Geocoding Service
  geocoding: {
    provider: process.env.GEOCODING_API_PROVIDER,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    openStreetMapNominatimUrl: process.env.OPENSTREETMAP_NOMINATIM_URL,
  },
});