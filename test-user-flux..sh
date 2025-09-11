#!/bin/bash

# --- Configurações Iniciais ---
baseUrl="http://localhost:3000"

# Credenciais dos usuários fixos (assumindo que são criados pelo endpoint /test/seed)
CLIENT_EMAIL="indicador@teste.com"
CLIENT_PASSWORD="12345678"

PROVIDER_EMAIL="provedor@teste.com"
PROVIDER_PASSWORD="12345678"

ADMIN_EMAIL="admin@limpeja.app"
ADMIN_PASSWORD="12345678"

# Usar data fixa para agendamento e dia da semana, como no script original.
TEST_DATE="2025-08-15T09:00:00.000Z"
TEST_DATE_SHORT="2025-08-15" # Para scheduledDate no DTO
TEST_TIME="09:00" # Para scheduledTime no DTO

# Variáveis globais para armazenar IDs e Tokens capturados
ADMIN_TOKEN=""
CLIENT_TOKEN=""
CLIENT_USER_ID=""
CLIENT_ID=""
# Variáveis para o endereço completo do cliente
CLIENT_ADDRESS_ID=""
CLIENT_ADDRESS_CEP=""
CLIENT_ADDRESS_STREET=""
CLIENT_ADDRESS_NUMBER=""
CLIENT_ADDRESS_COMPLEMENT=""
CLIENT_ADDRESS_NEIGHBORHOOD=""
CLIENT_ADDRESS_CITY=""
CLIENT_ADDRESS_STATE=""
CLIENT_ADDRESS_LATITUDE=""
CLIENT_ADDRESS_LONGITUDE=""

PROVIDER_TOKEN=""
PROVIDER_USER_ID=""
PROVIDER_ID=""
PROVIDER_SERVICE_OFFERING_ID=""
BOOKING_ID=""
BOOKING_TOTAL_PRICE="" # NOVO: Para capturar o preço total do agendamento
BOOKING_PROVIDER_ID_FROM_BOOKING="" # NOVO: Para capturar o providerId do agendamento criado
PIX_BR_CODE=""
PIX_STATUS=""
PIX_GATEWAY_TRANSACTION_ID="" # NOVO: Para capturar o ID da transação do gateway

echo "--- Iniciando Teste de Fluxo de Pagamento e Saque (Shell Script) ---"
echo "URL Base do Backend: $baseUrl"
echo "------------------------------------------------------------------"

# Função para verificar se o comando jq está disponível
command -v jq >/dev/null 2>&1 || { echo >&2 "Erro: 'jq' não está instalado. Por favor, instale-o (ex: sudo apt-get install jq ou brew install jq)."; exit 1; }

# --- 0. Preparação: Login Admin  ---

echo "0.1. Realizando Login Admin para obter o ADMIN_TOKEN..."
RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

if echo "$RESPONSE" | jq -e '.accessToken != null' >/dev/null; then
  ADMIN_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  echo "  ✅ Admin logado e token obtido."
else
  echo "  ❌ Erro ao fazer login Admin ou token não capturado. Resposta: $RESPONSE"
  exit 1
fi



# --- 1. Login do Cliente ---

echo "1.1. Realizando Login do Cliente ($CLIENT_EMAIL)..."
RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$CLIENT_EMAIL\", \"password\": \"$CLIENT_PASSWORD\"}")

if echo "$RESPONSE" | jq -e '.accessToken != null and .user.id != null and .user.clientDetails.id != null' >/dev/null; then
  CLIENT_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  CLIENT_USER_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  CLIENT_ID=$(echo "$RESPONSE" | jq -r '.user.clientDetails.id')
  
  # Extraindo todos os detalhes do endereço do cliente da resposta de login
  CLIENT_ADDRESS_ID=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.id')
  CLIENT_ADDRESS_CEP=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.cep')
  CLIENT_ADDRESS_STREET=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.street')
  CLIENT_ADDRESS_NUMBER=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.number')
  CLIENT_ADDRESS_COMPLEMENT=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.complement // ""') # Use // "" para lidar com nulo/vazio
  CLIENT_ADDRESS_NEIGHBORHOOD=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.neighborhood')
  CLIENT_ADDRESS_CITY=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.city')
  CLIENT_ADDRESS_STATE=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.state')
  CLIENT_ADDRESS_LATITUDE=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.latitude')
  CLIENT_ADDRESS_LONGITUDE=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.longitude')

  echo "  ✅ Cliente logado e token/IDs obtidos."
  echo "    Cliente Token: $CLIENT_TOKEN"
  echo "    Cliente User ID: $CLIENT_USER_ID"
  echo "    Cliente ID: $CLIENT_ID"
  echo "    Cliente Address ID: $CLIENT_ADDRESS_ID"
  echo "    Cliente Address Latitude: $CLIENT_ADDRESS_LATITUDE"
  echo "    Cliente Address Longitude: $CLIENT_ADDRESS_LONGITUDE"
else
  echo "  ❌ Erro ao fazer login do cliente ou token/IDs não capturados. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 2. Login do Provedor ---

echo "2.1. Realizando Login do Provedor ($PROVIDER_EMAIL)..."
RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$PROVIDER_EMAIL\", \"password\": \"$PROVIDER_PASSWORD\"}")

if echo "$RESPONSE" | jq -e '.accessToken != null and .user.id != null and .user.providerDetails.id != null' >/dev/null; then
  PROVIDER_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  PROVIDER_USER_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  PROVIDER_ID=$(echo "$RESPONSE" | jq -r '.user.providerDetails.id')
  echo "  ✅ Provedor logado e token/IDs obtidos."
  echo "    Provedor Token: $PROVIDER_TOKEN"
  echo "    Provedor User ID: $PROVIDER_USER_ID"
  echo "    Provedor ID: $PROVIDER_ID"
else
  echo "  ❌ Erro ao fazer login do provedor ou token/IDs não capturados. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 3. Obter ID do Serviço Oferecido pelo Provedor ---

echo "3.1. Obtendo serviços oferecidos pelo provedor ($PROVIDER_ID)..."
RESPONSE=$(curl -s -X GET "$baseUrl/providers/$PROVIDER_ID/services" \
  -H "Authorization: Bearer $PROVIDER_TOKEN")

# Tenta encontrar um serviço com nome "Limpeza Residencial" ou o primeiro disponível
PROVIDER_SERVICE_OFFERING_ID=$(echo "$RESPONSE" | jq -r '.[] | select(.service.name | contains("Residencial")) | .id // .[0].id')

if [[ -n "$PROVIDER_SERVICE_OFFERING_ID" && "$PROVIDER_SERVICE_OFFERING_ID" != "null" ]]; then
  echo "  ✅ ID do serviço oferecido pelo provedor obtido: $PROVIDER_SERVICE_OFFERING_ID"
else
  echo "  ❌ Erro ao obter ID do serviço oferecido pelo provedor. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 4. Cliente Agendando Serviço ---

echo "4.1. Cliente agendando serviço com Provedor ID: $PROVIDER_ID e Service Offering ID: $PROVIDER_SERVICE_OFFERING_ID..."
JSON_PAYLOAD_BOOKING=$(jq -n \
  --arg providerId "$PROVIDER_ID" \
  --arg providerServiceId "$PROVIDER_SERVICE_OFFERING_ID" \
  --arg scheduledDate "$TEST_DATE_SHORT" \
  --arg scheduledTime "$TEST_TIME" \
  --arg cep "$CLIENT_ADDRESS_CEP" \
  --arg street "$CLIENT_ADDRESS_STREET" \
  --arg number "$CLIENT_ADDRESS_NUMBER" \
  --arg complement "$CLIENT_ADDRESS_COMPLEMENT" \
  --arg neighborhood "$CLIENT_ADDRESS_NEIGHBORHOOD" \
  --arg city "$CLIENT_ADDRESS_CITY" \
  --arg state "$CLIENT_ADDRESS_STATE" \
  --argjson latitude "$CLIENT_ADDRESS_LATITUDE" \
  --argjson longitude "$CLIENT_ADDRESS_LONGITUDE" \
  '{
    providerId: $providerId,
    providerServiceId: $providerServiceId,
    scheduledDate: $scheduledDate,
    scheduledTime: $scheduledTime,
    totalPrice: 90.00,
    notes: "Agendamento de teste via script shell.",
    address: { # <-- Objeto 'address' aninhado aqui
      cep: $cep,
      street: $street,
      number: $number,
      complement: $complement,
      neighborhood: $neighborhood,
      city: $city,
      state: $state,
      latitude: $latitude,
      longitude: $longitude
    }
  }')

RESPONSE=$(curl -s -X POST "$baseUrl/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "$JSON_PAYLOAD_BOOKING")

BOOKING_ID=$(echo "$RESPONSE" | jq -r '.id')
BOOKING_STATUS=$(echo "$RESPONSE" | jq -r '.status')
BOOKING_TOTAL_PRICE=$(echo "$RESPONSE" | jq -r '.totalPrice') # CAPTURANDO O PREÇO TOTAL
BOOKING_PROVIDER_ID_FROM_BOOKING=$(echo "$RESPONSE" | jq -r '.providerId') # CAPTURANDO O PROVIDER ID DO BOOKING CRIADO

if [[ -n "$BOOKING_ID" && "$BOOKING_ID" != "null" && "$BOOKING_STATUS" == "PENDING" ]]; then
  echo "  ✅ Agendamento criado. ID: $BOOKING_ID. Status: $BOOKING_STATUS"
  echo "    Booking Total Price: $BOOKING_TOTAL_PRICE" # Log para depuração
  echo "    Booking Provider ID: $BOOKING_PROVIDER_ID_FROM_BOOKING" # Log para depuração
else
  echo "  ❌ Erro ao criar agendamento ou status incorreto. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 5. Cliente Criando Cobrança PIX e Simulação de Webhook ---

echo "5.1. Cliente criando cobrança PIX para agendamento ID: $BOOKING_ID..."
JSON_PAYLOAD_PIX_CHARGE=$(jq -n \
  --arg bookingId "$BOOKING_ID" \
  --argjson amount "$BOOKING_TOTAL_PRICE" \
  --arg description "Pagamento para agendamento $BOOKING_ID" \
  --arg providerId "$BOOKING_PROVIDER_ID_FROM_BOOKING" \
  '{
    bookingId: $bookingId,
    amount: $amount,
    description: $description,
    providerId: $providerId
  }')

RESPONSE=$(curl -s -X POST "$baseUrl/payments/pix-charge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "$JSON_PAYLOAD_PIX_CHARGE")

PIX_BR_CODE=$(echo "$RESPONSE" | jq -r '.brCode')
PIX_STATUS=$(echo "$RESPONSE" | jq -r '.status')
# CAPTURANDO O ID DA TRANSAÇÃO DO GATEWAY. Verifique o nome do campo na sua PixChargeResponseDto.
# Com base nos logs, o backend armazena 'gatewayTransactionId'. Assumimos que ele é retornado.
PIX_GATEWAY_TRANSACTION_ID=$(echo "$RESPONSE" | jq -r '.gatewayTransactionId') 

if [[ -n "$PIX_BR_CODE" && "$PIX_BR_CODE" != "null" && "$PIX_STATUS" == "PENDING" && -n "$PIX_GATEWAY_TRANSACTION_ID" && "$PIX_GATEWAY_TRANSACTION_ID" != "null" ]]; then
  echo "  ✅ Cobrança PIX criada e brCode/gatewayTransactionId obtidos. Status: $PIX_STATUS"
  echo "    PIX BR Code: $PIX_BR_CODE"
  echo "    PIX Gateway Transaction ID: $PIX_GATEWAY_TRANSACTION_ID" # Log para depuração
else
  echo "  ❌ Erro ao criar cobrança PIX ou dados inválidos. Resposta: $RESPONSE"
  exit 1
fi

echo "5.2. Simulando webhook de pagamento PIX (status COMPLETED)..."
JSON_PAYLOAD_PIX_WEBHOOK=$(jq -n \
  --arg transactionId "$PIX_GATEWAY_TRANSACTION_ID" \
  --arg status "COMPLETED" \
  --arg qrCodeText "$PIX_BR_CODE" \
  '{transactionId: $transactionId, status: $status, qrCodeText: $qrCodeText}')

RESPONSE=$(curl -s -X POST "$baseUrl/payments/webhook/pix" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD_PIX_WEBHOOK")

if echo "$RESPONSE" | grep -q "Webhook processed successfully"; then
  echo "  ✅ Webhook PIX simulado com sucesso."
else
  echo "  ❌ Erro ao simular webhook PIX. Resposta: $RESPONSE"
  exit 1
fi

echo "5.3. Verificando status do agendamento após o pagamento (deve ser CONFIRMED)..."
RESPONSE=$(curl -s -X GET "$baseUrl/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

BOOKING_STATUS_AFTER_PAYMENT=$(echo "$RESPONSE" | jq -r '.status')

if [[ "$BOOKING_STATUS_AFTER_PAYMENT" == "CONFIRMED" ]]; then
  echo "  ✅ Status do agendamento atualizado para CONFIRMED após pagamento."
else
  echo "  ❌ Status do agendamento incorreto após pagamento: $BOOKING_STATUS_AFTER_PAYMENT (Esperado: CONFIRMED). Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 6. Provedor Marcando Serviço como Concluído ---

echo "6.1. Provedor confirmando agendamento ID: $BOOKING_ID (se já não estiver CONFIRMED)..."
# Este passo é redundante se o webhook PIX já confirma, mas é bom ter para robustez.
RESPONSE=$(curl -s -X PATCH "$baseUrl/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{"status": "CONFIRMED"}')

if echo "$RESPONSE" | jq -e '.status == "CONFIRMED"' >/dev/null; then
  echo "  ✅ Agendamento está CONFIRMED."
else
  echo "  ❌ Erro ao confirmar agendamento. Resposta: $RESPONSE"
  exit 1
fi

echo "6.2. Provedor concluindo agendamento ID: $BOOKING_ID..."
RESPONSE=$(curl -s -X PATCH "$baseUrl/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d '{"status": "COMPLETED"}')

if echo "$RESPONSE" | jq -e '.status == "COMPLETED"' >/dev/null; then
  echo "  ✅ Agendamento concluído."
else
  echo "  ❌ Erro ao concluir agendamento. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 7. Provedor Verificando Saldo e Solicitando Saque ---

echo "7.1. Provedor consultando ganhos..."
RESPONSE_EARNINGS=$(curl -s -X GET "$baseUrl/providers/$PROVIDER_ID/earnings" \
  -H "Authorization: Bearer $PROVIDER_TOKEN")

TOTAL_EARNINGS=$(echo "$RESPONSE_EARNINGS" | jq -r '.totalEarnings')

if [[ -n "$TOTAL_EARNINGS" && "$TOTAL_EARNINGS" != "null" ]]; then
  if (( $(echo "$TOTAL_EARNINGS > 0" | bc -l) )); then
    echo "  ✅ Ganhos refletem serviço concluído. Total: $TOTAL_EARNINGS"
  else
    echo "  ❌ Ganhos incorretos (não é maior que zero). Total: $TOTAL_EARNINGS. Resposta: $RESPONSE_EARNINGS"
    exit 1
  fi
else
  echo "  ❌ Erro ao consultar ganhos ou totalEarnings é nulo/vazio. Resposta: $RESPONSE_EARNINGS"
  exit 1
fi

echo "7.2. Provedor solicitando saque do valor total ($TOTAL_EARNINGS)..."
JSON_PAYLOAD_WITHDRAWAL=$(jq -n \
  --arg amount "$TOTAL_EARNINGS" \
  --arg pixKey "caroline.pix@email.com" \
  '{amount: ($amount | tonumber), pixKey: $pixKey}')

RESPONSE=$(curl -s -X POST "$baseUrl/payments/withdraw" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer "$PROVIDER_TOKEN"" \
  -d "$JSON_PAYLOAD_WITHDRAWAL")

WITHDRAWAL_REQUEST_ID=$(echo "$RESPONSE" | jq -r '.id') # Capturar o ID da solicitação de saque, se disponível

if echo "$RESPONSE" | jq -e '.message == "Withdrawal request submitted successfully."' >/dev/null || [[ -n "$WITHDRAWAL_REQUEST_ID" && "$WITHDRAWAL_REQUEST_ID" != "null" ]]; then
  echo "  ✅ Saque solicitado com sucesso. ID da solicitação: $WITHDRAWAL_REQUEST_ID"
else
  echo "  ❌ Erro ao solicitar saque. Resposta: $RESPONSE"
  exit 1
fi

echo "7.3. Simulando webhook de confirmação de saque (status COMPLETED)..."
JSON_PAYLOAD_WITHDRAWAL_WEBHOOK=$(jq -n \
  --arg withdrawalId "test_withdrawal_$(date +%s)" \
  --arg status "COMPLETED" \
  '{withdrawalId: $withdrawalId, status: $status}') # Adapte os campos conforme o seu webhook espera

RESPONSE=$(curl -s -X POST "$baseUrl/payments/webhook/withdrawal" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD_WITHDRAWAL_WEBHOOK")

if echo "$RESPONSE" | grep -q "Webhook processed successfully"; then
  echo "  ✅ Webhook de saque simulado com sucesso."
else
  echo "  ❌ Erro ao simular webhook de saque. Resposta: $RESPONSE"
  exit 1
fi

echo "7.4. Verificando saldo final do provedor (deve ser R$ 0,00 ou próximo de zero)..."
RESPONSE_FINAL_EARNINGS=$(curl -s -X GET "$baseUrl/providers/$PROVIDER_ID/earnings" \
  -H "Authorization: Bearer "$PROVIDER_TOKEN"")

FINAL_TOTAL_EARNINGS=$(echo "$RESPONSE_FINAL_EARNINGS" | jq -r '.totalEarnings')

# Usar bc para comparação de ponto flutuante
if (( $(echo "$FINAL_TOTAL_EARNINGS <= 0.01" | bc -l) )); then # Permitir uma pequena margem de erro
  echo "  ✅ Saldo final do provedor verificado como R$ $FINAL_TOTAL_EARNINGS (próximo de zero)."
else
  echo "  ❌ Saldo final do provedor incorreto: R$ $FINAL_TOTAL_EARNINGS (Esperado: próximo de zero). Resposta: $RESPONSE_FINAL_EARNINGS"
  exit 1
fi
echo "------------------------------------------------------------------"

echo "--- Todos os Testes Automatizados Concluídos com Sucesso! ---"