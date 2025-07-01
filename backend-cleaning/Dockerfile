# Stage 1: Build a development image with all dependencies
FROM node:22-slim AS build 

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build


# Stage 2: Create a production-ready image
FROM node:22-slim AS production 

WORKDIR /usr/src/app

# Instala OpenSSL para compatibilidade com Prisma (libssl)
RUN apt-get update -y && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

# === DATABASE_URL COMPLETA E HARDCODED AQUI (NÃO RECOMENDADO PARA PRODUÇÃO!) ===
# Esta URL é para conexão via Cloud SQL Proxy (Unix socket).
# A senha 'Testesimple123' está hardcoded aqui.
ENV DATABASE_URL="postgresql://limpeja_user:Testesimple123@/limpeja_db?host=/cloudsql/semiotic-anvil-461613-c0:southamerica-east1:limpeja-db-prod-v2"

ENV GCS_PROJECT_ID="semiotic-anvil-461613-c0"
ENV GCS_BUCKET_NAME="upload-semiotic-anvil-448955"

ENV PORT 8080 
EXPOSE 8080 
CMD ["node", "dist/main.js"]