# Stage 1: Build a development image with all dependencies
# Usando a imagem Node.js baseada em Debian Bullseye.
FROM node:22-bullseye-slim AS build 

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# *** CORREÇÃO AQUI: Adicionar esta variável de ambiente ANTES de 'npx prisma generate' e 'npm run build' ***
# Isso instrui o Prisma a usar o motor de consulta que é compatível com OpenSSL 3.0.x (libssl3)
# que é a versão padrão no Debian Bullseye e mais novas, mesmo que ele procure por 1.1.x.
ENV PRISMA_QUERY_ENGINE_LIBRARY=/usr/src/app/node_modules/@prisma/client/runtime/libquery_engine-debian-openssl-3.0.x.so.node

# É crucial que o caminho para o arquivo .so.node seja exato.
# O nome do arquivo pode variar. Você pode ter que verificar dentro de node_modules/.prisma/client/
# qual é o nome do arquivo .so.node gerado.
# Se o erro persistir, você pode tentar com "debian-openssl-1.1.x.so.node" se tiver certeza que Bullseye ainda o tem.
# Aposta mais segura para Node 22 e Prisma é o 3.0.x.


RUN npx prisma generate
RUN npm run build


# Stage 2: Create a production-ready slim image
FROM node:22-bullseye-slim AS production 

WORKDIR /usr/src/app

# *** CORREÇÃO AQUI: Adicionar a variável de ambiente PRISMA_QUERY_ENGINE_LIBRARY para o tempo de execução também ***
ENV PRISMA_QUERY_ENGINE_LIBRARY=/usr/src/app/node_modules/@prisma/client/runtime/libquery_engine-debian-openssl-3.0.x.so.node


COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

ENV PORT 8080
EXPOSE 8080
CMD ["node", "dist/main.js"]