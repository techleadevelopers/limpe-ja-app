# Stage 1: Build a development image with all dependencies
# Using the full Node.js 22 image (not 'slim') for better compatibility with system libraries like OpenSSL.
FROM node:22 AS build

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies (production and development) required for building the application.
RUN npm install

# Copy the rest of the application code
# Assuming your compiled TypeScript code will be in 'dist/'
COPY . .

# Generate the Prisma client for the container's runtime environment.
# This must be done AFTER 'npm install' and 'COPY . .' but BEFORE 'npm run build'
# to ensure the TypeScript compiler has access to the generated types.
RUN npx prisma generate

# Compile the NestJS application (this will execute 'nest build' from package.json)
RUN npm run build

# Stage 2: Create a production-ready slim image
# Using the full Node.js 22 image again for the final production image to ensure libssl compatibility.
# This image will contain only the necessary runtime files, making it as small as possible
# while still including the required system libraries.
FROM node:22 AS production

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy only production dependencies from the build stage.
# This helps keep the final image size optimized.
COPY --from=build /usr/src/app/node_modules ./node_modules
# Copy the compiled application code from the build stage.
COPY --from=build /usr/src/app/dist ./dist
# Copy the generated Prisma client runtime files from the build stage.
# The .prisma/client directory is usually inside node_modules.
COPY --from=build /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
# Copy the Prisma schema file, necessary for Prisma Client at runtime.
COPY --from=build /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma

# Define the port your Node.js application will listen on.
# Cloud Run typically expects applications to listen on the port defined by the PORT environment variable (default 8080).
ENV PORT 8080
EXPOSE 8080

# Command to start the application when the container is executed.
# This points to your compiled main JavaScript file.
CMD ["node", "dist/main.js"]