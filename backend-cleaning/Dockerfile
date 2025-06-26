# Stage 1: Build a development image with all dependencies
FROM node:22-slim AS build

WORKDIR /usr/src/app

COPY package*.json ./
# Instala todas as dependências (produção e desenvolvimento) para o build
RUN npm install

# Copia o código-fonte
COPY . .

# Compila a aplicação NestJS (neste stage, 'nest build' estará disponível)
RUN npm run build

# Gera o cliente Prisma (também deve ser feito no stage de build para compatibilidade)
RUN npx prisma generate

# Stage 2: Create a production-ready slim image
FROM node:22-slim AS production

WORKDIR /usr/src/app

# Copia apenas as dependências de produção do Stage 1
COPY --from=build /usr/src/app/node_modules ./node_modules
# Copia o código compilado da aplicação do Stage 1
COPY --from=build /usr/src/app/dist ./dist
# Copia o cliente Prisma gerado do Stage 1
COPY --from=build /usr/src/app/prisma/client ./prisma/client # Ajuste o caminho se seu cliente Prisma não estiver aqui
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma # Copia o schema também

# Defina a porta que sua aplicação Node.js irá escutar
ENV PORT 8080
EXPOSE 8080

# Comando para iniciar a aplicação quando o contêiner for executado
CMD ["node", "dist/main.js"]