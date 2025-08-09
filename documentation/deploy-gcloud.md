
#  Construir a nova imagem Docker com as alterações
  gcloud builds submit --tag gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend . --project=semiotic-anvil-461613-c0

#  Fazer o deploy no Cloud Run
gcloud run deploy limpeja-app-backend --image gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend --platform managed --region southamerica-east1 --allow-unauthenticated --set-secrets=GCS_KEY=limpeja-gcs-key-for-build:latest --project=semiotic-anvil-461613-c0


# LISTA VARIAVEIS 

gcloud run services describe limpeja-app-backend --platform managed --region southamerica-east1 --format 'value(spec.template.spec.containers[0].env)'

# utilidades
gcloud run deploy limpeja-app-backend `
  --image=gcr.io/semiotic-anvil-461613-c0/limpeja-app-backend `
  --region=southamerica-east1 `
  --set-env-vars JWT_SECRET=aebd6ebe83b77673c90c3752c53c3bf20591b26803727859d3a728a0cd57abc2 `
  --set-env-vars DATABASE_URL=postgresql://limpeja_user:Testesimple123@34.39.152.54:5432/limpeja_db?pgbouncer=true `
  --set-env-vars JWT_EXPIRATION_TIME=1h `
  --set-env-vars DEFAULT_EMAIL_FROM=paulo.ofitf@gmail.com `
  --set-env-vars GCS_PROJECT_ID=semiotic-anvil-461613-c0 `
  --set-env-vars GCS_BUCKET_NAME=limpeja-uploads `
  --set-env-vars THIRD_PARTY_FACEMATCH_API_URL=https://api.gw.cellereit.com.br/facematch `
  --set-env-vars THIRD_PARTY_FACEMATCH_API_KEY=eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICIzS1dxVWt4U2pTSDc5OUxnc3cyX0htRFozZDlkVzZoNmtsVGx2Q2t2dkdzIn0 `
  --set-env-vars TWILIO_ACCOUNT_SID=ACdc1ef73d506e5a1c19eb726580d317da `
  --set-env-vars TWILIO_AUTH_TOKEN=cba161521d5c3543d96a214ead9a7345 `
  --set-env-vars TWILIO_VERIFY_SERVICE_SID=VAf0cd7b20906227ecc9dcee93729b50e5 `
  --set-env-vars SENTRY_DSN=https://947962edb662e5ff655cbcd778ee13b6@o4509792415252480.ingest.us.sentry.io/4509792431898624 `
  --set-env-vars APP_BASE_URL=https://limpeja-app-backend-35489557635.southamerica-east1.run.app/ `
  --set-env-vars GEOCODING_API_PROVIDER=GOOGLE_MAPS `
  --set-env-vars GOOGLE_MAPS_API_KEY=AIzaSyCe3LSkZKmqlSozMJiPw1ESnIiq-yY5AuY `
  --set-env-vars PAGSEGURO_API_TOKEN=444d943d-2b5d-4f63-a3f4-420685713a2863fab2c5472faa32b233055b26c718b63ea2-97d5-454b-8e46-65b336824b32 `
  --set-env-vars PAGSEGURO_API_BASE_URL=https://sandbox.api.pagseguro.com `
  --update-secrets GCS_KEY=limpeja-gcs-key-for-build:latest


  # Configurações do Google Maps Geocoding (Backend)
GEOCODING_API_PROVIDER=GOOGLE_MAPS
GOOGLE_MAPS_API_KEY=AIzaSyCe3LSkZKmqlSozMJiPw1ESnIiq-yY5AuY

# Configurações do PagSeguro - Backend
PAGSEGURO_API_TOKEN=444d943d-2b5d-4f63-a3f4-420685713a2863fab2c5472faa32b233055b26c718b63ea2-97d5-454b-8e46-65b336824b32
PAGSEGURO_API_BASE_URL=https://sandbox.api.pagseguro.com

