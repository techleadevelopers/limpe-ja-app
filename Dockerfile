# Use uma imagem base Node.js otimizada para produção
FROM node:18-alpine AS builder

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de dependência e instala
COPY package*.json ./
# Usa 'npm ci' para instalações limpas e consistentes
RUN npm ci --omit=dev --force

# Copia o código fonte do aplicativo
COPY . .

# Compila o aplicativo NestJS (TypeScript para JavaScript)
# e gera o Prisma Client
RUN npm run build
RUN npx prisma generate --data-proxy

# --- Imagem de Produção Final ---
FROM node:18-alpine

WORKDIR /usr/src/app

# Copia apenas o necessário da imagem 'builder'
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/prisma ./prisma 

# O Cloud Run espera que sua aplicação ouça na porta 8080
ENV PORT 8080

# Comando para iniciar o aplicativo NestJS
CMD ["node", "dist/main"]