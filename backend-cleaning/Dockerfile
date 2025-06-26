# Stage 1: Build a development image with all dependencies
# MUDANÇA CRUCIAL AQUI: Usando a imagem Node.js 22 COMPLETA (não 'slim').
# Esta imagem é baseada em uma distribuição Debian completa e deve incluir todas as bibliotecas
# de sistema necessárias, como o libssl que o Prisma procura.
FROM node:22 AS build 

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Remova COMPLETAMENTE qualquer linha 'RUN apt-get install openssl' ou 'libssl' desta seção.
# E Remova COMPLETAMENTE qualquer linha 'ENV PRISMA_QUERY_ENGINE_LIBRARY' daqui, se houver.
# Deixe o Prisma detectar o ambiente.

# Copiar os arquivos de configuração de dependências
COPY package*.json ./

# Instalar todas as dependências (produção e desenvolvimento)
RUN npm install

# Copiar o restante do código da aplicação
COPY . .

# Gerar o cliente Prisma para o ambiente de execução do contêiner
RUN npx prisma generate 

# Compilar a aplicação NestJS
RUN npm run build


# Stage 2: Create a production-ready image
# MUDANÇA CRUCIAL AQUI: Usando a imagem Node.js 22 COMPLETA para a imagem final.
FROM node:22 AS production 

# Definir o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Remova COMPLETAMENTE qualquer linha 'RUN apt-get install openssl' ou 'libssl' desta seção.
# E Remova COMPLETAMENTE qualquer linha 'ENV PRISMA_QUERY_ENGINE_LIBRARY' daqui, se houver.

# Copiar apenas as dependências de produção do Stage 1
COPY --from=build /usr/src/app/node_modules ./node_modules
# Copiar o código compilado da aplicação do Stage 1
COPY --from=build /usr/src/app/dist ./dist
# Copiar o cliente Prisma gerado do Stage 1
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
# Copiar o arquivo de schema do Prisma
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

# Definir a porta que sua aplicação Node.js irá escutar
ENV PORT 8080
EXPOSE 8080

# Comando para iniciar a aplicação quando o contêiner for executado
CMD ["node", "dist/main.js"]
