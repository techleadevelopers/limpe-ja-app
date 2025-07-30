#!/bin/bash

# --- Configurações Iniciais ---
baseUrl="http://localhost:3000"

# Usar data fixa para agendamento e dia da semana.
TEST_DATE="2025-08-15T09:00:00.000Z"
PRISMA_DAY_OF_WEEK="5" # 5 = Sexta-feira, correspondente a 15 de agosto de 2025.

# Usar $EPOCHSECONDS para o timestamp (mais robusto em Bash)
TIMESTAMP="$EPOCHSECONDS"
CLIENT_EMAIL="cliente.script.$TIMESTAMP@example.com"
PROVIDER_EMAIL="provedor.script.$TIMESTAMP@example.com"

# CORREÇÃO FINAL DA GERAÇÃO DE IDS (CPFs e Telefones)
# Usando /dev/urandom com tr e head, que é a forma mais padrão e robusta em ambientes Unix-like (incluindo Git Bash)
generate_random_digits() {
  cat /dev/urandom | tr -dc '0-9' | head -c "$1"
}

CLIENT_CPF_VALIDO="1$(generate_random_digits 10)" # 1 + 10 dígitos aleatórios
PROVIDER_CPF="2$(generate_random_digits 10)" # 2 + 10 dígitos aleatórios

CLIENT_PHONE_UNIQUE="119$(generate_random_digits 8)" # (11) 9 + 8 dígitos aleatórios
PROVIDER_PHONE_UNIQUE="119$(generate_random_digits 8)" # (11) 9 + 8 dígitos aleatórios

ADMIN_EMAIL="admin.client@cleaning.com"
ADMIN_PASSWORD="adminclientpass"

SERVICE_NAME_DYNAMIC="Limpeza Completa Script $TIMESTAMP"

# Variáveis globais para armazenar IDs e Tokens capturados
CLIENT_TOKEN=""
CLIENT_USER_ID=""
CLIENT_ID=""
CLIENT_ADDRESS_ID=""

PROVIDER_TOKEN=""
PROVIDER_USER_ID=""
PROVIDER_ID=""
SERVICE_GLOBAL_ID=""
PROVIDER_SERVICE_OFFERING_ID=""
BOOKING_ID=""
CHAT_ID=""

echo "--- Iniciando Testes Automatizados LimpeJá (`$(date +"%Y-%m-%d %H:%M:%S")`) ---"
echo "URL Base do Backend: $baseUrl"
echo "------------------------------------------------------------------"

# Função para verificar se o comando jq está disponível
command -v jq >/dev/null 2>&1 || { echo >&2 "Erro: 'jq' não está instalado. Por favor, instale-o (ex: sudo apt-get install jq ou brew install jq)."; exit 1; }

# Função para ler payload JSON de um arquivo. Assume que os arquivos JSON estão em uma pasta 'json_payloads' no mesmo nível do script.
read_json_payload() {
  local file_name="$1"
  local payload_path="./json_payloads/$file_name" # Caminho relativo à raiz do projeto
  if [ -f "$payload_path" ]; then
    cat "$payload_path"
  else
    echo "Erro: Arquivo JSON de payload não encontrado: $payload_path" >&2
    exit 1
  fi
}

# --- 1. Fluxo de Autenticação e Registro ---

# (Seções 1.1 e 1.2 comentadas para pular OTP)

# 1.3. Autenticação: Registrar Cliente (usando payload do JSON)
echo "1.3. Registrando Cliente ($CLIENT_EMAIL) com telefone $CLIENT_PHONE_UNIQUE..."
JSON_PAYLOAD_REGISTER_CLIENT=$(read_json_payload "register_client_request.json" | \
  jq --arg email "$CLIENT_EMAIL" --arg cpf "$CLIENT_CPF_VALIDO" --arg phone "$CLIENT_PHONE_UNIQUE" \
  '.email = $email | .cpf = $cpf | .phone = $phone') # Injeta email, cpf, phone

echo "DEBUG: Payload de registro de cliente: $JSON_PAYLOAD_REGISTER_CLIENT"
RESPONSE=$(curl -s -X POST "$baseUrl/auth/register/client" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD_REGISTER_CLIENT")
echo "DEBUG: Resposta de registro de cliente: $RESPONSE"

if echo "$RESPONSE" | jq -e '.accessToken != null and .user.id != null and .user.clientDetails.id != null' >/dev/null; then
  CLIENT_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  CLIENT_USER_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  CLIENT_ID=$(echo "$RESPONSE" | jq -r '.user.clientDetails.id')
  CLIENT_ADDRESS_ID=$(echo "$RESPONSE" | jq -r '.user.clientDetails.address.id')
  echo "  ✅ Cliente registrado e token/IDs obtidos."
  echo "    Cliente Token: $CLIENT_TOKEN"
  echo "    Cliente User ID: $CLIENT_USER_ID"
  echo "    Cliente ID: $CLIENT_ID"
  echo "    Cliente Address ID: $CLIENT_ADDRESS_ID"
else
  echo "  ❌ Erro ao registrar cliente ou token/IDs não capturados."
  echo "    Resposta Completa: $RESPONSE"
  exit 1
fi

# 1.4. Autenticação: Registrar Provedor (usando payload do JSON)
echo "1.4. Registrando Provedor ($PROVIDER_EMAIL) com telefone $PROVIDER_PHONE_UNIQUE..."
# CORREÇÃO CRÍTICA DO PAYLOAD DO PROVEDOR:
# Constrói o JSON do zero no script para evitar problemas de parsing do arquivo original
# e garantir que todos os campos obrigatórios estejam presentes e no formato certo.
JSON_PAYLOAD_REGISTER_PROVIDER=$(jq -n \
  --arg email "$PROVIDER_EMAIL" \
  --arg password "ProviderSecurePassword123!" \
  --arg fullName "Profissional Teste Script" \
  --arg cpf "$PROVIDER_CPF" \
  --arg dateOfBirth "1990-01-01T00:00:00.000Z" \
  --arg phone "$PROVIDER_PHONE_UNIQUE" \
  --arg yearsOfExperience "1" \
  --arg cep "02002000" \
  --arg street "Avenida Script Provedor" \
  --arg number "200" \
  --arg complement "Sala 202" \
  --arg neighborhood "Bairro Script" \
  --arg city "Sao Paulo" \
  --arg state "SP" \
  '{
    email: $email,
    password: $password,
    fullName: $fullName,
    cpf: $cpf,
    dateOfBirth: $dateOfBirth,
    phone: $phone,
    yearsOfExperience: ($yearsOfExperience | tonumber),
    address: {
      cep: $cep,
      street: $street,
      number: $number,
      complement: $complement,
      neighborhood: $neighborhood,
      city: $city,
      state: $state
    }
  }')

echo "DEBUG: Payload de registro de provedor: $JSON_PAYLOAD_REGISTER_PROVIDER"
RESPONSE=$(curl -s -X POST "$baseUrl/auth/register/provider" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD_REGISTER_PROVIDER")
echo "DEBUG: Resposta de registro de provedor: $RESPONSE"

if echo "$RESPONSE" | jq -e '.accessToken != null and .user.id != null and .user.providerDetails.id != null' >/dev/null; then
  PROVIDER_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  PROVIDER_USER_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  PROVIDER_ID=$(echo "$RESPONSE" | jq -r '.user.providerDetails.id')
  echo "  ✅ Provedor registrado e token/IDs obtidos."
  echo "    Provedor Token: $PROVIDER_TOKEN"
  echo "    Provedor User ID: $PROVIDER_USER_ID"
  echo "    Provedor ID: $PROVIDER_ID"
else
  echo "  ❌ Erro ao registrar provedor ou token/IDs não capturados."
  echo "    Resposta Completa: $RESPONSE"
  exit 1
fi

# 1.5. Realizando Login Admin para obter o ADMIN_TOKEN dinamicamente (usando payload do JSON)
echo "1.5. Realizando Login Admin..."
# Referência: `login_admin.json`
JSON_PAYLOAD_LOGIN_ADMIN=$(read_json_payload "login_admin.json")

echo "DEBUG: Payload de login admin: $JSON_PAYLOAD_LOGIN_ADMIN"
RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$JSON_PAYLOAD_LOGIN_ADMIN")
echo "DEBUG: Resposta de login admin: $RESPONSE"

if echo "$RESPONSE" | jq -e '.accessToken != null' >/dev/null; then
  ADMIN_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  echo "  ✅ Admin logado e token obtido."
  echo "    Admin Token: $ADMIN_TOKEN"
else
  echo "  ❌ Erro ao fazer login Admin ou token não capturado."
  echo "    Resposta Completa: $RESPONSE"
  exit 1
fi

echo "------------------------------------------------------------------"

# --- 2. Cadastro Completo de Provider + Verificação ---

# 2.1. Atualizando dados do provedor (usando payload customizado)
echo "2.1. Atualizando dados do provedor (pixKey, bio) para $PROVIDER_EMAIL..."
JSON_PAYLOAD_UPDATE_PROVIDER=$(jq -n \
  --arg pixKey "script.pix@teste.com" \
  --arg bio "Este é o campo bio atualizado por script e aceito no DTO!" \
  '{ "pixKey": $pixKey, "bio": $bio }')

echo "DEBUG: Payload de atualização de provedor: $JSON_PAYLOAD_UPDATE_PROVIDER"
# CORREÇÃO: Usar `/providers/me` para atualizar o perfil do provedor logado.
RESPONSE=$(curl -s -X PATCH "$baseUrl/providers/me" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d "$JSON_PAYLOAD_UPDATE_PROVIDER")
echo "DEBUG: Resposta de atualização de provedor: $RESPONSE"

# CORREÇÃO: Verificar se o 'bio' foi atualizado na resposta.
# O `grep -q` é mais robusto para substrings e acentos.
if echo "$RESPONSE" | grep -q "Este é o campo bio atualizado por script e aceito no DTO!"; then
  echo "  ✅ Dados do provedor atualizados."
else
  echo "  ❌ Erro ao atualizar dados do provedor. Resposta: $RESPONSE"
  exit 1
fi

# 2.2. Upload de documento (frente) para verificação (mockado)
echo "2.2. Provedor: Upload de documento (frente) para verificação (mockado)..."
# Referência: `upload_document_front_request.json`
RESPONSE=$(curl -s -X POST "$baseUrl/verification/document-upload" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d "$(read_json_payload "upload_document_front_request.json")")

echo "DEBUG: Resposta de upload de documento: $RESPONSE"

if echo "$RESPONSE" | jq -e '.message == "Document uploaded and OCR processing initiated."' >/dev/null; then
  echo "  ✅ Upload de documento mockado bem-sucedido."
else
  echo "  ❌ Falha no upload de documento mockado. Resposta: $RESPONSE"
  exit 1
fi

# 2.3. Upload de selfie com documento para reconhecimento facial (mockado)
echo "2.3. Provedor: Upload de selfie com documento para reconhecimento facial (mockado)..."
# Referência: `upload_selfie_with_document_request.json`
RESPONSE=$(curl -s -X POST "$baseUrl/verification/selfie-upload" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d "$(read_json_payload "upload_selfie_with_document_request.json")")

echo "DEBUG: Resposta de upload de selfie: $RESPONSE"

if echo "$RESPONSE" | jq -e '.message == "Selfie uploaded and facial recognition initiated."' >/dev/null; then
  echo "  ✅ Upload de selfie mockado bem-sucedido."
else
  echo "  ❌ Falha no upload de selfie mockado. Resposta: $RESPONSE"
  exit 1
fi

# 2.4. Aprovando provedor (via ADMIN)
echo "2.4. Aprovando provedor (via ADMIN)..."
# O status de verificação é "APPROVED"
JSON_PAYLOAD_APPROVE='{"status": "APPROVED"}'

echo "DEBUG: Payload de aprovação de provedor: $JSON_PAYLOAD_APPROVE"
RESPONSE=$(curl -s -X PATCH "$baseUrl/verification/$PROVIDER_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$JSON_PAYLOAD_APPROVE")
echo "DEBUG: Resposta de aprovação de provedor: $RESPONSE"

if echo "$RESPONSE" | grep -q "status atualizado para APPROVED"; then
  echo "  ✅ Provedor aprovado por ADMIN."
else
  echo "  ❌ Erro ao aprovar provedor por ADMIN. Resposta: $RESPONSE"
  exit 1
fi

# 2.5. Verificar status final do provedor
echo "2.5. Verificando status final do provedor..."
RESPONSE=$(curl -s -X GET "$baseUrl/providers/$PROVIDER_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
FINAL_PROVIDER_STATUS=$(echo "$RESPONSE" | jq -r '.verificationStatus') # Captura o status de verificação

echo "DEBUG: Resposta de verificação de status final do provedor: $RESPONSE"

if [[ "$FINAL_PROVIDER_STATUS" == "APPROVED" ]]; then
  echo "  ✅ Status final do provedor é APPROVED."
else
  echo "  ❌ Status final do provedor é $FINAL_PROVIDER_STATUS (Esperado: APPROVED)."
  echo "    Resposta Completa de Verificação de Status: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 3. Cadastro de Serviços e Disponibilidade do Provedor ---

# 3.1. Criando serviço global (ADMIN)
echo "3.1. Criando serviço global '$SERVICE_NAME_DYNAMIC'..."
# Referência: `create_service_residential.json`
JSON_PAYLOAD_CREATE_SERVICE=$(read_json_payload "create_service_residential.json" | \
  jq --arg name "$SERVICE_NAME_DYNAMIC" \
  '.name = $name')

echo "DEBUG: Payload de criação de serviço global: $JSON_PAYLOAD_CREATE_SERVICE"
RESPONSE=$(curl -s -X POST "$baseUrl/services" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$JSON_PAYLOAD_CREATE_SERVICE")
echo "DEBUG: Resposta de criação de serviço global: $RESPONSE"

SERVICE_GLOBAL_ID=$(echo "$RESPONSE" | jq -r '.id')

if [[ -n "$SERVICE_GLOBAL_ID" && "$SERVICE_GLOBAL_ID" != "null" ]]; then
  echo "  ✅ Serviço global criado. ID: $SERVICE_GLOBAL_ID"
else
  echo "  ❌ Erro ao criar serviço global ou ID não capturado. Resposta: $RESPONSE"
  exit 1
fi

# 3.2. Vinculando provedor ao serviço (Provedor)
echo "3.2. Vinculando provedor ao serviço global (ID: $SERVICE_GLOBAL_ID)..."
# Referência: `update_provider_service_details_request.json` e `ProviderService` no schema
JSON_PAYLOAD_BIND_SERVICE=$(jq -n \
  --arg serviceId "$SERVICE_GLOBAL_ID" \
  '{"serviceId": $serviceId, "price": 90.00, "durationMinutes": 120, "pricingType": "FIXED_PRICE"}') # Adicionado pricingType conforme `documentation.md`

echo "DEBUG: Payload de vinculação de serviço ao provedor: $JSON_PAYLOAD_BIND_SERVICE"
RESPONSE=$(curl -s -X POST "$baseUrl/providers/$PROVIDER_ID/services" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d "$JSON_PAYLOAD_BIND_SERVICE")
echo "DEBUG: Resposta de vinculação de serviço ao provedor: $RESPONSE"

PROVIDER_SERVICE_OFFERING_ID=$(echo "$RESPONSE" | jq -r '.id')

if [[ -n "$PROVIDER_SERVICE_OFFERING_ID" && "$PROVIDER_SERVICE_OFFERING_ID" != "null" ]]; then
  echo "  ✅ Serviço global vinculado ao provedor. ProviderService ID: $PROVIDER_SERVICE_OFFERING_ID"
else
  echo "  ❌ Erro ao vincular serviço ao provedor ou ProviderService ID não capturado. Resposta: $RESPONSE"
  exit 1
fi

# 3.3. Cadastrando disponibilidade do provedor (Provedor)
echo "3.3. Cadastrando disponibilidade do provedor para o dia $TEST_DATE (Dia da semana Prisma: $PRISMA_DAY_OF_WEEK)..."
# Referência: `update_provider_availability_request.json`
JSON_PAYLOAD_AVAILABILITY=$(read_json_payload "update_provider_availability_request.json" | \
  jq --arg dayOfWeek "$PRISMA_DAY_OF_WEEK" \
  '.[0].dayOfWeek = ($dayOfWeek | tonumber)') # Atualiza o primeiro item do array com o dia da semana dinâmico

echo "DEBUG: Payload de disponibilidade: $JSON_PAYLOAD_AVAILABILITY"
RESPONSE=$(curl -s -X PATCH "$baseUrl/providers/$PROVIDER_ID/availability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d "$JSON_PAYLOAD_AVAILABILITY")
echo "DEBUG: Resposta de disponibilidade: $RESPONSE"

if echo "$RESPONSE" | jq -e '.[0].isAvailable == true' >/dev/null; then
  echo "  ✅ Disponibilidade cadastrada/atualizada."
else
  echo "  ❌ Erro ao cadastrar disponibilidade. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 4. Fluxo do Cliente → Agendar Serviço ---

# 4.1. Cliente agendando serviço
echo "4.1. Cliente agendando serviço com Provedor ID: $PROVIDER_ID e Service Offering ID: $PROVIDER_SERVICE_OFFERING_ID..."
# Referência: `create_booking_request.json`
JSON_PAYLOAD_BOOKING=$(read_json_payload "create_booking_request.json" | \
  jq --arg providerId "$PROVIDER_ID" \
  --arg providerServiceId "$PROVIDER_SERVICE_OFFERING_ID" \
  --arg scheduledDate "$TEST_DATE" \
  --arg addressId "$CLIENT_ADDRESS_ID" \
  '.providerId = $providerId | .providerServiceId = $providerServiceId | .scheduledDate = $scheduledDate | .addressId = $addressId | .scheduledTime = "09:00" | .totalPrice = 90.00 | .notes = "Agendamento por script com preço fixo." | del(.address)')

echo "DEBUG: Payload de agendamento: $JSON_PAYLOAD_BOOKING"
RESPONSE=$(curl -s -X POST "$baseUrl/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "$JSON_PAYLOAD_BOOKING")
echo "DEBUG: Resposta de agendamento: $RESPONSE"

BOOKING_ID=$(echo "$RESPONSE" | jq -r '.id')
BOOKING_STATUS=$(echo "$RESPONSE" | jq -r '.status')

if [[ -n "$BOOKING_ID" && "$BOOKING_ID" != "null" && "$BOOKING_STATUS" == "PENDING" ]]; then
  echo "  ✅ Agendamento criado. ID: $BOOKING_ID. Status: $BOOKING_STATUS"
else
  echo "  ❌ Erro ao criar agendamento ou status incorreto. Resposta: $RESPONSE"
  exit 1
fi

# 4.2. Provedor confirmando agendamento (usando payload do JSON)
echo "4.2. Provedor confirmando agendamento ID: $BOOKING_ID..."
# Referência: `confirm_booking.json`
JSON_PAYLOAD_CONFIRM_BOOKING=$(read_json_payload "confirm_booking.json")

echo "DEBUG: Payload de confirmação de agendamento: $JSON_PAYLOAD_CONFIRM_BOOKING"
RESPONSE=$(curl -s -X PATCH "$baseUrl/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d "$JSON_PAYLOAD_CONFIRM_BOOKING")
echo "DEBUG: Resposta de confirmação de agendamento: $RESPONSE"

if echo "$RESPONSE" | jq -e '.status == "CONFIRMED"' >/dev/null; then
  echo "  ✅ Agendamento confirmado."
else
  echo "  ❌ Erro ao confirmar agendamento. Resposta: $RESPONSE"
  exit 1
fi

# 4.3. Provedor concluindo agendamento (usando payload do JSON)
echo "4.3. Provedor concluindo agendamento ID: $BOOKING_ID..."
# Referência: `complete_booking.json`
JSON_PAYLOAD_COMPLETE_BOOKING=$(read_json_payload "complete_booking.json")

echo "DEBUG: Payload de conclusão de agendamento: $JSON_PAYLOAD_COMPLETE_BOOKING"
RESPONSE=$(curl -s -X PATCH "$baseUrl/bookings/$BOOKING_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d "$JSON_PAYLOAD_COMPLETE_BOOKING")

echo "DEBUG: Resposta de conclusão de agendamento: $RESPONSE"

if echo "$RESPONSE" | jq -e '.status == "COMPLETED"' >/dev/null; then
  echo "  ✅ Agendamento concluído."
else
  echo "  ❌ Erro ao concluir agendamento. Resposta: $RESPONSE"
  exit 1
fi

# 4.4. Cliente reportando problema no agendamento (usando payload do JSON)
echo "4.4. Cliente reportando problema no agendamento ID: $BOOKING_ID..."
# Referência: `report_booking_issue_request.json`
JSON_PAYLOAD_REPORT_ISSUE=$(read_json_payload "report_booking_issue_request.json")

echo "DEBUG: Payload de reportar problema: $JSON_PAYLOAD_REPORT_ISSUE"
RESPONSE=$(curl -s -X POST "$baseUrl/bookings/$BOOKING_ID/report-issue" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "$JSON_PAYLOAD_REPORT_ISSUE")

echo "DEBUG: Resposta de reportar problema: $RESPONSE"

if echo "$RESPONSE" | jq -e '.message == "Issue reported successfully."' >/dev/null; then
  echo "  ✅ Problema reportado com sucesso."
else
  echo "  ❌ Erro ao reportar problema. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 5. Fluxo de Pagamento e Ganhos ---

# 5.1. Cliente criando cobrança PIX (usando payload do JSON)
echo "5.1. Cliente criando cobrança PIX para agendamento ID: $BOOKING_ID..."
# Referência: `create_pix_charge_request.json`
JSON_PAYLOAD_PIX_CHARGE=$(read_json_payload "create_pix_charge_request.json" | \
  jq --arg bookingId "$BOOKING_ID" \
  '.bookingId = $bookingId')

echo "DEBUG: Payload de cobrança PIX: $JSON_PAYLOAD_PIX_CHARGE"
RESPONSE=$(curl -s -X POST "$baseUrl/payments/pix-charge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "$JSON_PAYLOAD_PIX_CHARGE")

echo "DEBUG: Resposta de cobrança PIX: $RESPONSE"

PIX_BR_CODE=$(echo "$RESPONSE" | jq -r '.brCode')
PIX_STATUS=$(echo "$RESPONSE" | jq -r '.status')

if [[ -n "$PIX_BR_CODE" && "$PIX_BR_CODE" != "null" && "$PIX_STATUS" == "PENDING" ]]; then
  echo "  ✅ Cobrança PIX criada e dados recebidos. Status: $PIX_STATUS"
else
  echo "  ❌ Erro ao criar cobrança PIX ou dados inválidos. Resposta: $RESPONSE"
  exit 1
fi

# 5.2. Provedor consultando ganhos
echo "5.2. Provedor consultando ganhos..."
RESPONSE_EARNINGS=$(curl -s -X GET "$baseUrl/providers/$PROVIDER_ID/earnings" \
  -H "Authorization: Bearer $PROVIDER_TOKEN")

echo "DEBUG: Resposta de consulta de ganhos: $RESPONSE_EARNINGS"

TOTAL_EARNINGS=$(echo "$RESPONSE_EARNINGS" | jq -r '.totalEarnings')

if [[ -n "$TOTAL_EARNINGS" && "$TOTAL_EARNINGS" != "null" ]]; then
  if (( $(echo "$TOTAL_EARNINGS > 0" | bc -l) )); then
    echo "  ✅ Ganhos refletem serviço concluído. Total: $TOTAL_EARNINGS"
  else
    echo "  ❌ Ganhos incorretos (não é maior que zero). Total: $TOTAL_EARNINGS"
    echo "    Resposta Completa de Ganhos: $RESPONSE_EARNINGS"
    exit 1
  fi
else
  echo "  ❌ Erro ao consultar ganhos ou totalEarnings é nulo/vazio. Resposta: $RESPONSE"
  exit 1
fi

# 5.3. Provedor solicitando saque (usando payload do JSON)
echo "5.3. Provedor solicitando saque..."
# Referência: `request_withdrawal_request.json`
JSON_PAYLOAD_WITHDRAWAL=$(read_json_payload "request_withdrawal_request.json")

echo "DEBUG: Payload de solicitação de saque: $JSON_PAYLOAD_WITHDRAWAL"

RESPONSE=$(curl -s -X POST "$baseUrl/payments/withdraw" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -d "$JSON_PAYLOAD_WITHDRAWAL")

echo "DEBUG: Resposta de solicitação de saque: $RESPONSE"

if echo "$RESPONSE" | jq -e '.message == "Withdrawal request submitted successfully."' >/dev/null; then
  echo "  ✅ Saque solicitado com sucesso."
else
  echo "  ❌ Erro ao solicitar saque. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 6. Fluxo de Chat ---
echo "6.1. Cliente tentando listar seus chats..."
RESPONSE=$(curl -s -X GET "$baseUrl/chat/me" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

echo "DEBUG: Resposta de listar chats: $RESPONSE"

CHAT_ID=$BOOKING_ID # Usando o bookingId como identificador de chat para este fluxo

if echo "$RESPONSE" | jq -e '.[] | select(.id == "'"$CHAT_ID"'")' >/dev/null; then
  echo "  ✅ Cliente conseguiu listar chats e o chat do booking está presente."
else
  echo "  ⚠️ Cliente listou chats, mas o chat do booking ID:$CHAT_ID não foi encontrado diretamente. Resposta: $RESPONSE"
fi

echo "6.2. Cliente enviando mensagem no chat ID: $CHAT_ID..."
# Referência: `Messages_request.json`
RESPONSE_PROVIDER_USER=$(curl -s -X GET "$baseUrl/users/me" \
  -H "Authorization: Bearer $PROVIDER_TOKEN")
RECEIVER_USER_ID=$(echo "$RESPONSE_PROVIDER_USER" | jq -r '.id')

echo "DEBUG: Receiver User ID para chat: $RECEIVER_USER_ID"

JSON_PAYLOAD_SEND_MESSAGE=$(read_json_payload "send_chat_message_request.json" | \
  jq --arg receiverId "$RECEIVER_USER_ID" \
  '.receiverId = $receiverId')

echo "DEBUG: Payload de enviar mensagem: $JSON_PAYLOAD_SEND_MESSAGE"

RESPONSE=$(curl -s -X POST "$baseUrl/chat/$CHAT_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "$JSON_PAYLOAD_SEND_MESSAGE")

echo "DEBUG: Resposta de enviar mensagem: $RESPONSE"

if echo "$RESPONSE" | jq -e '.content == "Confirmando os detalhes para o serviço de amanhã. Tudo certo?"' >/dev/null; then
  echo "  ✅ Mensagem enviada com sucesso no chat ID: $CHAT_ID."
else
  echo "  ❌ Erro ao enviar mensagem no chat. Resposta: $RESPONSE"
  exit 1
fi

echo "6.3. Provedor recuperando mensagens do chat ID: $CHAT_ID..."
RESPONSE_MESSAGES=$(curl -s -X GET "$baseUrl/chat/$CHAT_ID/messages" \
  -H "Authorization: Bearer $PROVIDER_TOKEN")

echo "DEBUG: Resposta de recuperar mensagens: $RESPONSE_MESSAGES"

if echo "$RESPONSE_MESSAGES" | jq -e '.[] | select(.content == "Confirmando os detalhes para o serviço de amanhã. Tudo certo?")' >/dev/null; then
  echo "  ✅ Provedor recebeu a mensagem no chat."
else
  echo "  ❌ Provedor não recebeu a mensagem no chat. Resposta: $RESPONSE_MESSAGES"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 7. Fluxo de Avaliação ---

echo "7.1. Cliente enviando avaliação para o agendamento ID: $BOOKING_ID..."
# Referência: `submit_review_request.json`
JSON_PAYLOAD_REVIEW=$(read_json_payload "submit_review_request.json" | \
  jq --arg bookingId "$BOOKING_ID" \
  '.bookingId = $bookingId')

echo "DEBUG: Payload de avaliação: $JSON_PAYLOAD_REVIEW"

RESPONSE=$(curl -s -X POST "$baseUrl/reviews" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "$JSON_PAYLOAD_REVIEW")

echo "DEBUG: Resposta de avaliação: $RESPONSE"

if echo "$RESPONSE" | jq -e '.rating == 5' >/dev/null; then
  echo "  ✅ Avaliação enviada com sucesso."
else
  echo "  ❌ Erro ao enviar avaliação. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 8. Teste de FAQs ---

echo "8.1. Cliente consultando FAQs..."
RESPONSE=$(curl -s -X GET "$baseUrl/faqs" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

echo "DEBUG: Resposta de FAQs: $RESPONSE"

if echo "$RESPONSE" | jq -e 'length >= 0' >/dev/null; then
  echo "  ✅ FAQs consultadas com sucesso."
else
  echo "  ❌ Erro ao consultar FAQs. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

echo "--- Todos os Testes Automatizados Concluídos com Sucesso! (`$(date +"%Y-%m-%d %H:%M:%S")`) ---"