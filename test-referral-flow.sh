#!/bin/bash

# --- Configurações Iniciais ---
baseUrl="http://localhost:3000"

# Credenciais dos usuários injetados pelo seed.ts
REFERRER_EMAIL="indicador@teste.com"
REFERRER_PASSWORD="12345678"

REFERRED_EMAIL="indicado@teste.com"
REFERRED_PASSWORD="12345678"

PROVIDER_EMAIL="provedor@teste.com"
PROVIDER_PASSWORD="12345678"

# Variáveis globais
REFERRER_TOKEN=""
REFERRED_TOKEN=""
REFERRED_ID=""
# ADICIONADO: Variáveis para os detalhes completos do endereço do referido
REFERRED_ADDRESS_ID=""
REFERRED_ADDRESS_CEP=""
REFERRED_ADDRESS_STREET=""
REFERRED_ADDRESS_NUMBER=""
REFERRED_ADDRESS_NEIGHBORHOOD=""
REFERRED_ADDRESS_CITY=""
REFERRED_ADDRESS_STATE=""
REFERRED_ADDRESS_LATITUDE=""
REFERRED_ADDRESS_LONGITUDE=""
REFERRED_ADDRESS_COMPLEMENT="" # Pode ser nulo/vazio

PROVIDER_TOKEN=""
PROVIDER_ID=""
PROVIDER_SERVICE_OFFERING_ID=""
PROVIDER_SERVICE_OFFERING_PRICE=""
BOOKING_ID=""
BOOKING_TOTAL_PRICE=""

echo "--- Iniciando Teste de Fluxo de Indicação (Shell Script) ---"
echo "URL Base do Backend: $baseUrl"
echo "------------------------------------------------------------------"

# Função para verificar se o comando jq está disponível
command -v jq >/dev/null 2>&1 || { echo >&2 "Erro: 'jq' não está instalado. Por favor, instale-o (ex: sudo apt-get install jq ou brew install jq)."; exit 1; }

# Adiciona set -e para sair imediatamente se um comando falhar
set -e

# --- 1. Realizando Login e Obtendo Ganhos Iniciais ---

echo "1.1. Realizando Login do Cliente Indicador ($REFERRER_EMAIL)..."
RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$REFERRER_EMAIL\", \"password\": \"$REFERRER_PASSWORD\"}")

if echo "$RESPONSE" | jq -e '.accessToken != null' >/dev/null; then
  REFERRER_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  REFERRER_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  # CORREÇÃO: Acessar loyaltyPoints diretamente no objeto 'user'
  INITIAL_REFERRER_LOYALTY=$(echo "$RESPONSE" | jq -r '.user.loyaltyPoints')
  echo "  ✅ Indicador logado e token/ID obtidos. Pontos iniciais: $INITIAL_REFERRER_LOYALTY"
else
  echo "  ❌ Erro ao fazer login do indicador. Resposta: $RESPONSE"
  exit 1
fi

echo "1.2. Realizando Login do Cliente Referido ($REFERRED_EMAIL)..."
RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$REFERRED_EMAIL\", \"password\": \"$REFERRED_PASSWORD\"}")

if echo "$RESPONSE" | jq -e '.accessToken != null' >/dev/null; then
  REFERRED_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  REFERRED_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  # CORREÇÃO: Acessar loyaltyPoints diretamente no objeto 'user'
  INITIAL_REFERRED_LOYALTY=$(echo "$RESPONSE" | jq -r '.user.loyaltyPoints')

  # ADICIONADO: Extrair todos os detalhes do endereço do referido
  # Nota: clientDetails.address ainda deve existir
  REFERRED_ADDRESS_ID=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.id')
  REFERRED_ADDRESS_CEP=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.cep')
  REFERRED_ADDRESS_STREET=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.street')
  REFERRED_ADDRESS_NUMBER=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.number')
  REFERRED_ADDRESS_NEIGHBORHOOD=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.neighborhood')
  REFERRED_ADDRESS_CITY=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.city')
  REFERRED_ADDRESS_STATE=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.state')
  # Use 'tonumber' para latitude e longitude, pois são números
  REFERRED_ADDRESS_LATITUDE=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.latitude | tonumber')
  REFERRED_ADDRESS_LONGITUDE=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.longitude | tonumber')
  # Use // "" para lidar com 'complement' que pode ser nulo
  REFERRED_ADDRESS_COMPLEMENT=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.complement // ""')

  echo "  ✅ Referido logado e token/ID obtidos. Pontos iniciais: $INITIAL_REFERRED_LOYALTY"
  echo "  ✅ ID do endereço do referido obtido: $REFERRED_ADDRESS_ID"
  echo "  ✅ Detalhes do endereço do referido extraídos."
else
  echo "  ❌ Erro ao fazer login do referido. Resposta: $RESPONSE"
  exit 1
fi

echo "1.3. Realizando Login do Provedor ($PROVIDER_EMAIL)..."
RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$PROVIDER_EMAIL\", \"password\": \"$PROVIDER_PASSWORD\"}")

if echo "$RESPONSE" | jq -e '.accessToken != null and .user.providerDetails.id != null' >/dev/null; then
  PROVIDER_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  PROVIDER_ID=$(echo "$RESPONSE" | jq -r '.user.providerDetails.id')
  echo "  ✅ Provedor logado e token/ID obtidos."
else
  echo "  ❌ Erro ao fazer login do provedor. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 2. Obtendo ID e Preço do Serviço do Provedor ---

echo "2.1. Obtendo serviços oferecidos pelo provedor ($PROVIDER_ID)..."
RESPONSE=$(curl -s -X GET "$baseUrl/providers/$PROVIDER_ID/services" \
  -H "Authorization: Bearer $PROVIDER_TOKEN")

if echo "$RESPONSE" | jq -e '.[0].id' >/dev/null; then
  PROVIDER_SERVICE_OFFERING_ID=$(echo "$RESPONSE" | jq -r '.[0].id')
  PROVIDER_SERVICE_OFFERING_PRICE=$(echo "$RESPONSE" | jq -r '.[0].price')
  echo "  ✅ ID do serviço oferecido obtido: $PROVIDER_SERVICE_OFFERING_ID"
  echo "  ✅ Preço do serviço oferecido obtido: $PROVIDER_SERVICE_OFFERING_PRICE"
else
  echo "  ❌ Erro ao obter ID/Preço do serviço. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 3. Cliente 'Referido' Agendando o Serviço ---

echo "3.1. Cliente 'Referido' agendando serviço com Provedor ID: $PROVIDER_ID e Provider Service ID: $PROVIDER_SERVICE_OFFERING_ID..."
JSON_PAYLOAD=$(jq -n \
  --arg providerId "$PROVIDER_ID" \
  --arg providerServiceId "$PROVIDER_SERVICE_OFFERING_ID" \
  --arg scheduledDate "2025-10-10" \
  --arg scheduledTime "10:00" \
  --arg totalPrice "$PROVIDER_SERVICE_OFFERING_PRICE" \
  --arg addressCep "$REFERRED_ADDRESS_CEP" \
  --arg addressStreet "$REFERRED_ADDRESS_STREET" \
  --arg addressNumber "$REFERRED_ADDRESS_NUMBER" \
  --arg addressNeighborhood "$REFERRED_ADDRESS_NEIGHBORHOOD" \
  --arg addressCity "$REFERRED_ADDRESS_CITY" \
  --arg addressState "$REFERRED_ADDRESS_STATE" \
  --arg addressLatitude "$REFERRED_ADDRESS_LATITUDE" \
  --arg addressLongitude "$REFERRED_ADDRESS_LONGITUDE" \
  --arg addressComplement "$REFERRED_ADDRESS_COMPLEMENT" \
  '{
    providerId: $providerId,
    providerServiceId: $providerServiceId,
    scheduledDate: $scheduledDate,
    scheduledTime: $scheduledTime,
    totalPrice: ($totalPrice | tonumber),
    address: {
      cep: $addressCep,
      street: $addressStreet,
      number: $addressNumber,
      neighborhood: $addressNeighborhood,
      city: $addressCity,
      state: $addressState,
      latitude: $addressLatitude,
      longitude: $addressLongitude,
      complement: $addressComplement
    }
  }')

RESPONSE=$(curl -s -X POST "$baseUrl/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REFERRED_TOKEN" \
  -d "$JSON_PAYLOAD")

if echo "$RESPONSE" | jq -e '.id != null' >/dev/null; then
  BOOKING_ID=$(echo "$RESPONSE" | jq -r '.id')
  BOOKING_TOTAL_PRICE=$(echo "$RESPONSE" | jq -r '.totalPrice')
  echo "  ✅ Agendamento criado. ID: $BOOKING_ID. Status: PENDING"
  echo "    Preço Total do Agendamento: $BOOKING_TOTAL_PRICE"
else
  echo "  ❌ Erro ao criar agendamento. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 4. Simular Fluxo de Status do Agendamento (PENDING -> CONFIRMED -> COMPLETED) ---

echo "4.1. Provedor confirmando o agendamento (status de PENDING para CONFIRMED)..."
RESPONSE=$(curl -s -X PATCH "$baseUrl/bookings/$BOOKING_ID/status" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONFIRMED"}')

if echo "$RESPONSE" | jq -e '.status == "CONFIRMED"' >/dev/null; then
  echo "  ✅ Agendamento ID: $BOOKING_ID atualizado para status CONFIRMED."
else
  echo "  ❌ Erro ao atualizar status do agendamento para CONFIRMED. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

echo "4.2. Similando pagamento e conclusão do agendamento (status de CONFIRMED para COMPLETED)..."
RESPONSE=$(curl -s -X PATCH "$baseUrl/bookings/$BOOKING_ID/status" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETED"}')

if echo "$RESPONSE" | jq -e '.status == "COMPLETED"' >/dev/null; then
  echo "  ✅ Agendamento ID: $BOOKING_ID atualizado para status COMPLETED."
else
  echo "  ❌ Erro ao atualizar status do agendamento para COMPLETED. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 5. Verificando Pontos de Fidelidade Após a Conclusão ---

echo "5.1. Verificando pontos de fidelidade do Cliente Referido ($REFERRED_EMAIL)..."
RESPONSE=$(curl -s -X GET "$baseUrl/users/$REFERRED_ID" \
  -H "Authorization: Bearer $REFERRED_TOKEN")

# CORREÇÃO: Acessar loyaltyPoints diretamente no objeto raiz da resposta do usuário
FINAL_REFERRED_LOYALTY=$(echo "$RESPONSE" | jq -r '.loyaltyPoints')
EXPECTED_REFERRED_LOYALTY=10
if (( FINAL_REFERRED_LOYALTY == EXPECTED_REFERRED_LOYALTY )); then
  echo "  ✅ Pontos de fidelidade do referido atualizados com sucesso. Pontos finais: $FINAL_REFERRED_LOYALTY"
else
  echo "  ❌ Pontos do referido incorretos. Esperado: $EXPECTED_REFERRED_LOYALTY, Recebido: $FINAL_REFERRED_LOYALTY"
  exit 1
fi

echo "5.2. Verificando pontos de fidelidade do Cliente Indicador ($REFERRER_EMAIL)..."
RESPONSE=$(curl -s -X GET "$baseUrl/users/$REFERRER_ID" \
  -H "Authorization: Bearer $REFERRER_TOKEN")

# CORREÇÃO: Acessar loyaltyPoints diretamente no objeto raiz da resposta do usuário
FINAL_REFERRER_LOYALTY=$(echo "$RESPONSE" | jq -r '.loyaltyPoints')
EXPECTED_REFERRER_LOYALTY=300 # Ajustado para 300 pontos conforme a lógica do backend
if (( FINAL_REFERRER_LOYALTY == EXPECTED_REFERRER_LOYALTY )); then
  echo "  ✅ Pontos de fidelidade do indicador atualizados com sucesso. Pontos finais: $FINAL_REFERRER_LOYALTY"
else
  echo "  ❌ Pontos do indicador incorretos. Esperado: $EXPECTED_REFERRER_LOYALTY, Recebido: $FINAL_REFERRER_LOYALTY"
  exit 1
fi
echo "------------------------------------------------------------------"

echo "--- Teste de Fluxo de Indicação Concluído com Sucesso! ---"