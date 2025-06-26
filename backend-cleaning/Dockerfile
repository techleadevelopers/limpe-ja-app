# Stage 1: Build a development image with all dependencies
# Usando a imagem Node.js baseada em Debian Bullseye (node:*-bullseye-slim).
# Bullseye ainda contém a biblioteca libssl1.1 que o Prisma busca.
FROM node:22-bullseye-slim AS build 

# Set the working directory inside the container
WORKDIR /usr/src/app

# NÃO é necessário instalar OpenSSL com bullseye-slim, pois ele vem com libssl1.1

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (production and development)
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate the Prisma client for the container's runtime environment.
RUN npx prisma generate

# Compile the NestJS application
RUN npm run build


# Stage 2: Create a production-ready slim image
# Usando a mesma imagem base Debian Bullseye para a imagem final
FROM node:22-bullseye-slim AS production 

# Set the working directory inside the container
WORKDIR /usr/src/app

# NÃO é necessário instalar OpenSSL aqui também

# Copy only production dependencies from the build stage.
COPY --from=build /usr/src/app/node_modules ./node_modules
# Copy the compiled application code from the build stage.
COPY --from=build /usr/src/app/dist ./dist
# Copy the generated Prisma client runtime files from the build stage.
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
# Copy the Prisma schema file
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

# Define the port your Node.js application will listen on.
ENV PORT 8080
EXPOSE 8080

# Command to start the application when the container is executed.
CMD ["node", "dist/main.js"]