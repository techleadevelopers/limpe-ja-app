// src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    expirationTime: process.env.JWT_EXPIRATION_TIME,
  },
  // Adicione outras configurações aqui
  // stripe: {
  //   secretKey: process.env.STRIPE_SECRET_KEY,
  // },
});