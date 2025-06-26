# Stage 1: Build a development image with all dependencies
# Usando a imagem Node.js 22 COMPLETA.
FROM node:22 AS build 

WORKDIR /usr/src/app

# Remova COMPLETAMENTE todas as linhas 'RUN apt-get install libssl...' aqui.
# E REMOVA COMPLETAMENTE a linha 'ENV PRISMA_QUERY_ENGINE_LIBRARY' aqui.
# A imagem node:22 já tem libssl3, e o schema.prisma instruirá o Prisma a usar o motor 3.0.x.

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate # Isso agora gerará o engine debian-openssl-3.0.x

RUN npm run build


# Stage 2: Create a production-ready image
FROM node:22 AS production 

WORKDIR /usr/src/app

# Remova COMPLETAMENTE todas as linhas 'RUN apt-get install libssl...' aqui.
# E REMOVA COMPLETAMENTE a linha 'ENV PRISMA_QUERY_ENGINE_LIBRARY' aqui.

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

ENV PORT 8080
EXPOSE 8080
CMD ["node", "dist/main.js"]