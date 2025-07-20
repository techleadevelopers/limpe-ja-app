
#  Construir a nova imagem Docker com as alterações
gcloud builds submit --tag gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend . --project=semiotic-anvil-461613-c0

#  Fazer o deploy no Cloud Run
gcloud run deploy limpeja-app-backend --image gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend --platform managed --region southamerica-east1 --allow-unauthenticated --set-secrets=GCS_KEY=limpeja-gcs-key-for-build:latest --project=semiotic-anvil-461613-c0


# utilidades
gcloud run services update limpeja-app-backend --update-env-vars DATABASE_URL="postgresql://limpeja_user:Testesimple123@34.39.152.54:5432/limpeja_db?pgbouncer=true" --region southamerica-east1 --platform managed

