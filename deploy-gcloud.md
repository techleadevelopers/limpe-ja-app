# 1. Adicionar as alterações ao stage
git add .

# 2. Criar o commit
git commit -m "feat(gcs): Implementa leitura e decodificacao de chave GCS via Secret Manager com logs aprimorados"

# 3. Enviar para o GitHub/repositório remoto
git push

# 4. Construir a nova imagem Docker com as alterações
gcloud builds submit --tag gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend . --project=semiotic-anvil-461613-c0

# 5. Fazer o deploy no Cloud Run
gcloud run deploy limpeja-app-backend --image gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend --platform managed --region southamerica-east1 --allow-unauthenticated --set-secrets=GCS_KEY=limpeja-gcs-key-for-build:latest --project=semiotic-anvil-461613-c0



 gcloud run deploy limpeja-app-backend --image gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend --platform managed --region southamerica-east1 --allow-unauthenticated --set-secrets=GCS_KEY=limpeja-gcs-key-for-build:latest,JWT_SECRET=jwt-secret:latest --set-env-vars=JWT_EXPIRATION_TIME='1h' --project=semiotic-anvil-461613-c0
