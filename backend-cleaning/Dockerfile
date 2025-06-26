# Stage 1: Build a development image with all dependencies
# Usando a imagem Node.js 22 COMPLETA.
FROM node:22 AS build

WORKDIR /usr/src/app

# *** CORREÇÃO MAIS AGRESSIVA E COMPLETA PARA libssl ***
# Tentar instalar as duas versões da biblioteca OpenSSL para máxima compatibilidade.
# libssl1.1 é para sistemas mais antigos. libssl3 é para sistemas mais novos (Node 22, Debian Bookworm).
# Adiciona o repositório 'bullseye-backports' se 'libssl1.1' não for encontrado diretamente.
# A falha silenciosa de 'apt-get' pode ser por causa do 'rm -rf /var/lib/apt/lists/*' ou 'no-install-recommends'.
# Remove o '-slim' para garantir mais libs.

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends ca-certificates && \
    # Tenta adicionar o repositório backports do Bullseye para libssl1.1
    echo "deb http://deb.debian.org/debian bullseye-backports main" > /etc/apt/sources.list.d/backports.list || true && \
    apt-get update -y && \
    apt-get install -y libssl1.1 || true && \
    apt-get install -y libssl-dev || true && \ 
    apt-get install -y openssl || true && \ 
    apt-get install -y libssl3 || true && \ 
    rm -rf /var/lib/apt/lists/*
# IMPORTANTE: Os '|| true' servem para que o build continue mesmo se uma instalação falhar.
# O problema é que isso pode mascarar falhas reais.
# Se o problema persistir, a solução pode ser compilar OpenSSL do código fonte ou usar uma imagem base diferente (ex: alpine e instalar as libs manualmente)

COPY package*.json ./
RUN npm install

COPY . .

# *** Nova tentativa de ENV PRISMA_QUERY_ENGINE_LIBRARY ***
# Instruir o Prisma a procurar por uma das duas versões mais comuns de engine.
# Ou deixar ele tentar detectar se as bibliotecas foram instaladas.
# Remova esta linha se a instalação manual do libssl acima funcionar.
ENV PRISMA_QUERY_ENGINE_LIBRARY="/usr/src/app/node_modules/@prisma/client/runtime/libquery_engine-debian-openssl-1.1.x.so.node"

# Se o erro ainda for '1.1.x', e tiver certeza que o libssl3 foi instalado, tente:
# ENV PRISMA_QUERY_ENGINE_LIBRARY="/usr/src/app/node_modules/@prisma/client/runtime/libquery_engine-debian-openssl-3.0.x.so.node"


RUN npx prisma generate 
RUN npm run build


# Stage 2: Create a production-ready image
FROM node:22 AS production 

WORKDIR /usr/src/app

# *** Instalar libssl1.1 e libssl3 na imagem final também. ***
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends ca-certificates && \
    echo "deb http://deb.debian.org/debian bullseye-backports main" > /etc/apt/sources.list.d/backports.list || true && \
    apt-get update -y && \
    apt-get install -y libssl1.1 || true && \
    apt-get install -y libssl-dev || true && \
    apt-get install -y openssl || true && \
    apt-get install -y libssl3 || true && \
    rm -rf /var/lib/apt/lists/*

# Adicionar a variável de ambiente PRISMA_QUERY_ENGINE_LIBRARY para o tempo de execução também
ENV PRISMA_QUERY_ENGINE_LIBRARY="/usr/src/app/node_modules/@prisma/client/runtime/libquery_engine-debian-openssl-1.1.x.so.node" 

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

ENV PORT 8080
EXPOSE 8080
CMD ["node", "dist/main.js"]
