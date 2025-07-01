# Stage 1: Build a development image with all dependencies
FROM node:22 AS build 

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate # Isso agora gerará o engine debian-openssl-3.0.x

RUN npm run build


# Stage 2: Create a production-ready image
FROM node:22 AS production 

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

# === INÍCIO DA MODIFICAÇÃO CRÍTICA: VARIÁVEIS DE AMBIENTE HARDCODED (INSEGURO PARA PROD!) ===
# As variáveis abaixo podem ser definidas diretamente como ENV
ENV DATABASE_URL="postgresql://limpeja_user:Testesimple123@/limpeja_db?host=/cloudsql/semiotic-anvil-461613-c0:southamerica-east1:cleaning-app-db"
ENV JWT_SECRET="aebd6ebe83b77673c90c3752c53c3bf20591b26803727859d3a728a0cd57abc2"
ENV JWT_EXPIRATION_TIME="'1h'"
ENV GCS_PROJECT_ID="semiotic-anvil-461613-c0"
ENV GCS_BUCKET_NAME="upload-semiotic-anvil-448955"

# Para a chave GCS, usamos ARG e then ENV para lidar com a complexidade da string
ARG GCS_KEY_FILE_CONTENT_BASE64_ARG # <-- DECLARAÇÃO DO ARGUMENTO DE BUILD
ENV GCS_KEY_FILE_CONTENT=$GCS_KEY_FILE_CONTENT_BASE64_ARG 
# === FIM DA MODIFICAÇÃO CRÍTICA ===

ENV PORT 8080 
EXPOSE 8080 
CMD ["node", "dist/main.js"]