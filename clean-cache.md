# 1. Limpar node_modules e caches do Expo

Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue

npm cache clean --force # ou yarn cache clean --force



# 2. Reinstalar dependências

npm install # ou yarn install



# 3. Limpar o cache do Metro Bundler

# Inicie o bundler, espere ele carregar completamente, então feche-o (Ctrl+C).

npm start -- --reset-cache # ou yarn start -- --reset-cache



# 4. Limpar caches do Gradle (Android) - CRÍTICO para builds nativos



# Se você está usando EAS Build (recomendado):

eas build:clear # Limpa caches locais do EAS e prepara para um novo build



# Se você estiver construindo localmente com Android Studio/Gradle:

cd android

./gradlew clean # Executa a tarefa de limpeza do Gradle

cd ..