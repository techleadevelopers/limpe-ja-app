FROM node:22-slim AS build 

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build


FROM node:22-slim AS production 

WORKDIR /usr/src/app

RUN apt-get update -y && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

# === IMPORTANTE: REMOVIDAS AS CREDENCIAIS DA DATABASE_URL AQUI ===
# Se você usa autenticação de conta de serviço (IAM Database Authentication) no Cloud SQL
# as credenciais são tratadas automaticamente pelo Cloud Run/Cloud SQL Proxy
ENV DATABASE_URL="postgresql:///limpeja_db?host=/cloudsql/semiotic-anvil-461613-c0:southamerica-east1:cleaning-app-db"
# ===============================================================

ENV GCS_PROJECT_ID="semiotic-anvil-461613-c0"
ENV GCS_BUCKET_NAME="upload-semiotic-anvil-448955"

ENV PORT 8080 
EXPOSE 8080 
CMD ["node", "dist/main.js"]