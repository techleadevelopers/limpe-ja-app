# Use uma imagem base Node.js na versão 22 (LTS)
FROM node:22-slim

# Defina o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copie os arquivos de configuração de dependências
# Isso permite que o Docker use o cache de camadas para npm install se package.json não mudar
COPY package*.json ./

# Instale as dependências da aplicação
# Usamos --production para instalar apenas as dependências de produção, otimizando o tamanho da imagem.
RUN npm install --production

# Copie o restante do código da aplicação para o contêiner
# Assumimos que 'dist/' é onde seu código TypeScript compilado está. Se seu build for diferente, ajuste.
COPY . .

# Comando para compilar o TypeScript (se você tiver um script 'build' no package.json)
# Isso deve ser feito *após* copiar o código-fonte.
RUN npm run build

# Gere o cliente Prisma para o ambiente de execução do contêiner
# É essencial que o cliente Prisma seja gerado DENTRO do contêiner para compatibilidade.
RUN npx prisma generate

# Defina a porta em que sua aplicação Node.js irá escutar.
# O Cloud Run espera que sua aplicação escute na porta definida pela variável de ambiente PORT (padrão 8080).
ENV PORT 8080
EXPOSE 8080

# Comando para iniciar a aplicação quando o contêiner for executado
# Ajuste 'dist/main.js' para o caminho do seu arquivo de entrada compilado (ex: index.js, app.js)
CMD ["node", "dist/main.js"]