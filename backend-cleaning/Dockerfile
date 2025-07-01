FROM node:22-slim AS build 

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build


FROM node:22-slim AS production 

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

ENV DATABASE_URL="postgresql://limpeja_user:Testesimple123@/limpeja_db?host=/cloudsql/semiotic-anvil-461613-c0:southamerica-east1:cleaning-app-db"
ENV JWT_SECRET="aebd6ebe83b77673c90c3752c53c3bf20591b26803727859d3a728a0cd57abc2"
ENV JWT_EXPIRATION_TIME="1h"
ENV GCS_PROJECT_ID="semiotic-anvil-461613-c0"
ENV GCS_BUCKET_NAME="upload-semiotic-anvil-448955"

ENV PORT 8080 
EXPOSE 8080 
CMD ["node", "dist/main.js"]