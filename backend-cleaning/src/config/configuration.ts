// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expirationTime: process.env.JWT_EXPIRATION_TIME,
  },
  googleCloudStorage: {
    projectId: process.env.GCS_PROJECT_ID,
    keyFilename: process.env.GCS_KEY_FILE,
    bucketName: process.env.GCS_BUCKET_NAME,
  },
  // Adicione outras configurações aqui
  // stripe: {
  //   secretKey: process.env.STRIPE_SECRET_KEY,
  // },
});