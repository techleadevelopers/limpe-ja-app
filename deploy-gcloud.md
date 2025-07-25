
#  Construir a nova imagem Docker com as alterações
gcloud builds submit --tag gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend . --project=semiotic-anvil-461613-c0

#  Fazer o deploy no Cloud Run
gcloud run deploy limpeja-app-backend --image gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend --platform managed --region southamerica-east1 --allow-unauthenticated --set-secrets=GCS_KEY=limpeja-gcs-key-for-build:latest --project=semiotic-anvil-461613-c0


# utilidades
gcloud run deploy limpeja-app-backend `
  --image=gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend `
  --region=southamerica-east1 `
  --set-env-vars JWT_SECRET=aebd6ebe83b77673c90c3752c53c3bf20591b26803727859d3a728a0cd57abc2 `
  --set-env-vars DATABASE_URL=postgresql://limpeja_user:Testesimple123@34.39.152.54:5432/limpeja_db?pgbouncer=true `
  --set-env-vars JWT_EXPIRATION_TIME=1h `
  --set-env-vars DEFAULT_EMAIL_FROM=paulo.ofitf@gmail.com `
  --set-env-vars GCS_PROJECT_ID=semiotic-anvil-461613-c0 `
  --set-env-vars GCS_BUCKET_NAME=upload-semiotic-anvil-448955 `
  --set-env-vars THIRD_PARTY_FACEMATCH_API_URL=https://api.gw.cellereit.com.br/facematch `
  --set-env-vars THIRD_PARTY_FACEMATCH_API_KEY=eyJhbGciOiJSUzI1NiIsInR5cCIg… `
  --update-secrets GCS_KEY=limpeja-gcs-key-for-build:latest