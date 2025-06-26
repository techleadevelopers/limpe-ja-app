# Stage 1: Build a development image with all dependencies
# Usando node:22-bullseye-slim (ou node:22)
FROM node:22-bullseye-slim AS build 

WORKDIR /usr/src/app

# Remova COMPLETAMENTE qualquer linha 'RUN apt-get install -y libssl...' aqui.
# Remova COMPLETAMENTE qualquer linha 'ENV PRISMA_QUERY_ENGINE_LIBRARY' aqui.

COPY package*.json ./
RUN npm install

COPY . .

# Gera o cliente Prisma com o binaryTarget correto do schema.prisma
RUN npx prisma generate 
RUN npm run build


# Stage 2: Create a production-ready slim image
FROM node:22-bullseye-slim AS production 

WORKDIR /usr/src/app

# Remova COMPLETAMENTE qualquer linha 'RUN apt-get install -y libssl...' aqui.
# Remova COMPLETAMENTE qualquer linha 'ENV PRISMA_QUERY_ENGINE_LIBRARY' aqui.

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

ENV PORT 8080
EXPOSE 8080
CMD ["node", "dist/main.js"]