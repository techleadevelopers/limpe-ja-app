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

# === INÍCIO DAS VARIÁVEIS DE AMBIENTE ESSENCIAIS (HARDCODED - INSEGURO PARA PROD!) ===
ENV DATABASE_URL="postgresql://limpeja_user:Testesimple123@/limpeja_db?host=/cloudsql/semiotic-anvil-461613-c0:southamerica-east1:cleaning-app-db"
ENV JWT_SECRET="aebd6ebe83b77673c90c3752c53c3bf20591b26803727859d3a728a0cd57abc2"
ENV JWT_EXPIRATION_TIME="'1h'"
ENV GCS_PROJECT_ID="semiotic-anvil-461613-c0"
ENV GCS_BUCKET_NAME="upload-semiotic-anvil-448955"
# COLE A STRING BASE64 COMPLETA E DE UMA ÚNICA LINHA AQUI ABAIXO:
ENV GCS_KEY_FILE_CONTENT="FBb0lCQVFDb0ZrcHNoVEpLVkFIc1xublRsYWt0MzJnTE91dE9mMXZteUh3UlZBdUhlNm1NNkIxcm5nUitId2tEOHVlMkhCdXBVMWhhVE9SK3dnK0wxd1xuZ09mdzQyR2xwaitRK2prdXFQWDFEOFN1T0c0aWk0WURLNkJEUGFxQ055cDNXUTVORnpXOEgvRmZRcGVkSWFxalxuMjdSU3RocnlEaFoxTzZWYjZUcTFNcnkwcmV4ZkRWVndXKzFvMDdqeUVudmdIVERjcE1vRVcxdUJmTVlEczFVZ1xuUVJEL0tXaGt1L2NZZmpQMjBQTURhMk5XL0ZCZFkzZTg1cUo4NnZ2bjZpZUFGdWpaUW1PL2R0V0tMNkxpTUNDT1xudG1zVkJQM0ZKcC9XOFRydnJPWkhVQ1E5dnhZMWlrLy9OSHBaR1JSRGNhS3pUb0xyQnlNWnZpUzJpZkpWZFJlUVxuc2Y3VHpCSDlBZ01CQUFFQ2dnRUFVRk51dDVPanA5K2psOGErL09qSXlCOVRQdjlYQnBvODFWZFJaNytBQUIwOFxuT3RJNXU5TytScTg0Y21jbUhXV2tIcExDWW8zK2F2ZFQyS3JSck0yTkFaT0VOeTFOSEY1RVJCdUgrMVllVThYblxuZ2laY0RTWXdFTkI2SzlUVVA4VUN1ZWR0K3Y4ZzQwZU9lNFhvTEdTUDExMnR3ZWRiZ2ZjcmY4MTdIMDFjODdkZDRmNGRiM2I3ZjllMmRhNWY1MjE5NjktYWFiYTAwYWExMGZlZjc2YTAwZTcwMSJ9LCJjbGllbnRfaWQiOiAiMTEzOTcyNzgyNzgzOTY2MTExNDQ4IiwgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwgInRva2VuX3VyaSI6Imh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvbGltcGVqYS1ydW4tc2ElNDBzZW1pb3RpYy1hbnZpbC00NjE2MTMtYzAuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K"
# === FIM DAS VARIÁVEIS DE AMBIENTE ESSENCIAIS ===

ENV PORT 8080 
EXPOSE 8080 
CMD ["node", "dist/main.js"]