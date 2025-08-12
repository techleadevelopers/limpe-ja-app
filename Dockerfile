# Stage 1: Build a development image with all dependencies
# Usando a imagem Node.js 22 COMPLETA.
FROM node:22 AS build 

# Define o diretório de trabalho como a pasta do backend
# ESSA É A PRINCIPAL MUDANÇA PARA RESOLVER O ERRO DO PRISMA
WORKDIR /usr/src/app/backend-cleaning

# Copia os arquivos de configuração do npm para o diretório de trabalho
# A instrução 'COPY' agora leva em consideração a nova pasta de trabalho
COPY ./backend-cleaning/package*.json ./

# Instala as dependências
RUN npm install

# Copia todo o restante do código do backend para o diretório de trabalho
COPY ./backend-cleaning .

# Agora os comandos serão executados dentro de /usr/src/app/backend-cleaning
RUN npx prisma generate # Isso agora gerará o engine debian-openssl-3.0.x

# REMOVIDO: A migração não pode ser executada durante o build.
# A variável DATABASE_URL não está disponível nesta etapa.

RUN npm run build


# Stage 2: Create a production-ready image
FROM node:22 AS production 

# Define o diretório de trabalho como a pasta do backend
WORKDIR /usr/src/app/backend-cleaning

# A instrução 'COPY --from' precisa ser ajustada para o novo diretório
# de trabalho na imagem de build
COPY --from=build /usr/src/app/backend-cleaning/node_modules ./node_modules
COPY --from=build /usr/src/app/backend-cleaning/dist ./dist
COPY --from=build /usr/src/app/backend-cleaning/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /usr/src/app/backend-cleaning/prisma/schema.prisma ./prisma/schema.prisma

# A variável de ambiente DATABASE_URL DEVE ser configurada NO PAINEL DO RAILWAY.
# Não podemos usar a sintaxe do Railway no Dockerfile.
ENV PORT 8080
EXPOSE 8080

# Adicionamos a migração ao comando de inicialização
# Isso garante que a migração será executada ANTES da sua aplicação iniciar,
# e terá acesso à variável DATABASE_URL.
CMD ["/bin/sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
