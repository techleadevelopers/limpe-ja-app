
# Atualiza e prepara o container
gcloud builds submit --tag gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend . --project=semiotic-anvil-461613-c0


# Deploy Gcloud
gcloud run deploy limpeja-app-backend --image gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend --platform managed --region southamerica-east1 --allow-unauthenticated --project=semiotic-anvil-461613-c0

# IMplantar gcloud run deploy limpeja-app-backend \
  --image gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend \
  --platform managed \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --project=semiotic-anvil-461613-c0 \
  --set-env-vars \
"DATABASE_URL=postgresql://limpeja_user:Testesimple123@/limpeja_db?host=/cloudsql/semiotic-anvil-461613-c0:southamerica-east1:cleaning-app-db,\
JWT_SECRET=aebd6ebe83b77673c90c3752c53c3bf20591b26803727859d3a728a0cd57abc2,\
JWT_EXPIRATION_TIME='1h',\
GCS_PROJECT_ID=semiotic-anvil-461613-c0,\
GCS_BUCKET_NAME=seu-nome-de-bucket-exclusivo" \
  --update-secrets=GCS_KEY_FILE_CONTENT=my-gcs-service-account-key:latest