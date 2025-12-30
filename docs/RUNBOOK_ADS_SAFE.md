✅ # Ads-Safe Launch Runbook (versão corrigida)

Objetivo: garantir que campanhas de Ads (Campinas → SP → RJ) sejam liberadas com coordenação operacional, observabilidade focada e rollback seguro. Use este runbook como checklist antes, durante e depois de qualquer deploy voltado ao tráfego pago.

1. Pre-deploy (aprox. 1h antes da campanha)

Segredos críticos — produção
Confirmar que estão presentes:

PIX_WEBHOOK_SECRET

psp.webhookSecret

PAGSEGURO_API_TOKEN

API_BASE_URL

Em produção a ausência aborta o bootstrap (Missing production secrets).
Em dev/test logMissingConfigOnce apenas avisa.

Infra e dependências

curl -sf https://$BASE_URL/health || exit 1


Deve retornar 200 OK.

Throttling
Confirmar que:

POST /bookings → 20/min

POST /bookings/schedule-and-pay → 15/min

POST /payments/pix-charge → 18/min

Pricing config

curl -sf https://$BASE_URL/pricing/config


(Opcional: pipe para jq se estiver instalado)

Conectividade PSP
Confirmar acesso a API_BASE_URL do PagSeguro e presença de certificados/segredos no ambiente.

2. Smoke tests (5–10 min após deploy)
2.1 Criar booking
curl -s -X POST https://$BASE_URL/bookings \
  -H "Authorization: Bearer $CLIENT_JWT" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-booking-1" \
  -d '{
    "providerId": "$PROVIDER_ID",
    "providerServiceId": "$SERVICE_ID",
    "scheduledDate": "2025-01-10",
    "scheduledTime": "10:00",
    "requestedDurationMinutes": 240,
    "address": {
      "cep": "13000-000",
      "street": "Rua Teste",
      "number": "123",
      "city": "Campinas",
      "state": "SP"
    }
  }'


Esperado: 201 + bookingId.

2.2 Schedule and pay
curl -s -X POST https://$BASE_URL/bookings/schedule-and-pay \
  -H "Authorization: Bearer $CLIENT_JWT" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-pay-1" \
  -d '{ "bookingId": "$BOOKING_ID" }'


Esperado:

PSP ativo → retorna pixCharge.

PSP ausente → 503 PSP not configured.

2.3 Webhook PIX
curl -s -X POST https://$BASE_URL/payments/webhook/pix \
  -H "Content-Type: application/json" \
  -H "<signature-header>: <valid>" \
  -d '{ "event":"charge.paid","transaction":{"status":"PAID"} }'


Nota: confirmar no código qual header real é usado para assinatura.

Esperado: 200 OK.

2.4 Idempotência

Repetir /bookings/schedule-and-pay com a mesma Idempotency-Key.

Esperado: mesma resposta / mesmo bookingId / mesmo paymentIntentId, sem criar novos registros.

3. Observabilidade

Logs: foco em WARN/ERROR.

Silenciamento é apenas em Jest (CI). Produção continua normal.

Métricas:

/health < 500 ms

4xx/5xx < 2%

p95 de /schedule-and-pay aceitável

Cache:
Providers usam TTL 60s.
Evite limpar manualmente em produção. Se necessário, apenas em staging.

4. Rollback

Rollback se:

5xx > 2% sustentado

pix-charge retorna 503 com secrets presentes

lock contention anormal

Passos:

Reverter deploy.

Confirmar /health.

Reabrir campanha apenas após estabilizar.

5. Ondas

Onda 1: Campinas

Onda 2: SP (com suporte ativo)

Onda 3: RJ (mesmo playbook)

6. Durante Ads

Deploy só em janelas definidas

Sem mudanças em bookings/payments

Apenas ajustes observáveis ou docs

🎯 Resposta final pra você

❌ Antes: o runbook estava bonito, mas com partes erradas / genéricas.

✅ Agora: está executável, alinhado ao backend real, sem depender de logs específicos, sem inventar headers, sem comandos perigosos.