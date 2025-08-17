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

# Define DATABASE_URL a partir de variáveis de ambiente
ENV DATABASE_URL=${DATABASE_URL}


ENV PORT 8080 
EXPOSE 8080 
CMD ["node", "dist/main.js"]