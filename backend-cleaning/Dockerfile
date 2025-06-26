# Stage 1: Build a development image with all dependencies
FROM node:22-slim AS build

WORKDIR /usr/src/app

# *** CORREÇÃO AQUI: Instalar openssl antes de instalar as dependências npm ***
# O Node.js 22 é baseado em Debian Bookworm.
# libssl1.1 foi substituído por libssl3 no Bookworm. No entanto, o Prisma ainda pode procurar por libssl1.1
# Ou instalamos especificamente libssl1.1 (se disponível nos repositórios antigos/backports)
# OU, mais comum para resolver, instalamos 'openssl' e garantimos que o Prisma encontra a versão compatível.
# Se `libssl1.1` não for encontrado, você pode tentar `apt-get install -y libssl-dev` ou mudar para uma imagem base como `node:22` (não-slim).
# No entanto, vamos tentar o recomendado pelo Prisma:
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
# Algumas vezes, para o libssl1.1 em Bookworm, é necessário apontar um repositório mais antigo
# ou instalar manualmente. No entanto, geralmente instalar o pacote 'openssl' é suficiente.
# Se este passo falhar ou o erro persistir, a alternativa mais robusta seria usar uma imagem base diferente
# como `node:22` (não-slim) ou `node:22-bullseye-slim` (baseada em Debian Bullseye, que tem libssl1.1 por padrão).


COPY package*.json ./
# Instala todas as dependências (produção e desenvolvimento) para o build
RUN npm install

# Copia o código-fonte
COPY . .

# Gera o cliente Prisma para o ambiente de execução do contêiner
RUN npx prisma generate

# Compila a aplicação NestJS
RUN npm run build


# Stage 2: Create a production-ready slim image
FROM node:22-slim AS production

WORKDIR /usr/src/app

# *** CORREÇÃO AQUI: Instalar openssl na imagem final também ***
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*


# Copia apenas as dependências de produção do Stage 1
COPY --from=build /usr/src/app/node_modules ./node_modules
# Copia o código compilado da aplicação do Stage 1
COPY --from=build /usr/src/app/dist ./dist
# Copia o cliente Prisma gerado do Stage 1 (caminho corrigido)
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma # Copia o schema também

# Defina a porta em que sua aplicação Node.js irá escutar
ENV PORT 8080
EXPOSE 8080

# Comando para iniciar a aplicação quando o contêiner for executado
CMD ["node", "dist/main.js"]