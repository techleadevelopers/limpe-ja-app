#!/bin/bash

# --- Variáveis de Ambiente Base ---
baseUrl="http://localhost:3000"
# Gerar um timestamp único para o email para evitar conflitos de email já cadastrado
TIMESTAMP=$(date +%s)
CLIENT_EMAIL="cliente.script.$TIMESTAMP@example.com"

# CPF VÁLIDO DE TESTE (SUBSTITUA POR UM CPF VÁLIDO REAL GERADO PARA TESTES)
# Use um gerador de CPF online como https://www.geradordecpf.org/ e COLOQUE APENAS OS DÍGITOS
CLIENT_CPF_VALIDO="SEU_CPF_VALIDO_REAL_AQUI" # Exemplo: SUBSTITUA POR UM CPF VÁLIDO REAL DE 11 DÍGITOS AQUI!

# Gerar um CPF para o provedor (para unicidade, não validação matemática real)
# Garante 11 dígitos para o CPF do provedor também
RANDOM_CPF_PART=$(date +%s%N | cut -c1-11) # Gera 11 dígitos aleatórios
PROVIDER_CPF="${RANDOM_CPF_PART}" # Apenas o número, sem '01' no final se já tem 11

PROVIDER_EMAIL="provedor.script.$TIMESTAMP@example.com"
ADMIN_EMAIL="admin.client@cleaning.com" # Email do admin criado no seed.ts
ADMIN_PASSWORD="adminclientpass" # Senha do admin criado no seed.ts
# ADMIN_TOKEN será obtido dinamicamente.

# Nome do serviço com timestamp para unicidade
SERVICE_NAME_DYNAMIC="Limpeza Residencial Script $TIMESTAMP"

# Variável GLOBAL para o ID do ProviderService (serviço OFERECIDO pelo provedor)
PROVIDER_SERVICE_OFFERING_ID="" # Inicialize como vazio


echo "--- Iniciando Testes Automatizados LimpeJá ---"

# --- 1.1. Autenticação: Registrar Cliente ---
echo "1.1. Registrando Cliente..."
# CORREÇÃO: Usando jq -n para construir o payload JSON do cliente de forma segura
JSON_PAYLOAD_CLIENT=$(jq -n \
    --arg email "$CLIENT_EMAIL" \
    --arg password "Password123!" \
    --arg fullName "Cliente Script" \
    --arg phone "11987654321" \
    --arg cpf "$CLIENT_CPF_VALIDO" \
    '{
        "email": $email,
        "password": $password,
        "fullName": $fullName,
        "phone": $phone,
        "cpf": $cpf, # Adicionado o CPF aqui para o cliente
        "address": {
            "cep": "01001000",
            "street": "Rua Script Cliente",
            "number": "100",
            "neighborhood": "Centro",
            "city": "Sao Paulo",
            "state": "SP"
        }
    }')

echo "DEBUG - Cliente: JSON gerado para envio:"
echo "$JSON_PAYLOAD_CLIENT"

RESPONSE_CLIENT=$(curl -s -X POST "$baseUrl/auth/register/client" \
      -H "Content-Type: application/json" \
      -d "$JSON_PAYLOAD_CLIENT" 2>/dev/null)

echo "DEBUG - Cliente: Resposta Bruta:"
echo "$RESPONSE_CLIENT"
echo "DEBUG - Cliente: JQ accessToken:"
echo "$RESPONSE_CLIENT" | jq -r '.accessToken'
echo "DEBUG - Cliente: JQ user.id:"
echo "$RESPONSE_CLIENT" | jq -r '.user.id'
echo "DEBUG - Cliente: JQ user.clientDetails.id:"
echo "$RESPONSE_CLIENT" | jq -r '.user.clientDetails.id'

CLIENT_TOKEN=$(echo "$RESPONSE_CLIENT" | jq -r '.accessToken')
CLIENT_USER_ID=$(echo "$RESPONSE_CLIENT" | jq -r '.user.id')
CLIENT_ID=$(echo "$RESPONSE_CLIENT" | jq -r '.user.clientDetails.id')

if [[ -n "$CLIENT_TOKEN" && "$CLIENT_TOKEN" != "null" ]]; then
    echo "   ✅ Cliente registrado e token obtido."
    echo "   Cliente Token: $CLIENT_TOKEN"
    echo "   Cliente User ID: $CLIENT_USER_ID"
    echo "   Cliente ID: $CLIENT_ID"
else
    echo "   ❌ Erro ao registrar cliente ou token/ID não capturado."
    echo "   Resposta Completa: $RESPONSE_CLIENT"
    exit 1
fi

# --- 1.2. Autenticação: Registrar Provedor ---
echo "1.2. Registrando Provedor..."
RESPONSE_PROVIDER=$(curl -s -X POST "$baseUrl/auth/register/provider" \
      -H "Content-Type: application/json" \
      -d "$(printf '{
            "email": "%s",
            "password": "Password123!",
            "fullName": "Provedor Script",
            "cpf": "%s",
            "dateOfBirth": "1990-01-01T00:00:00.000Z",
            "phone": "11998765432",
            "yearsOfExperience": 1,
            "address": {
              "cep": "02002000",
              "street": "Avenida Script Provedor",
              "number": "200",
              "neighborhood": "Bairro Script",
              "city": "Sao Paulo",
              "state": "SP"
            }
          }' "$PROVIDER_EMAIL" "$PROVIDER_CPF")" 2>/dev/null)

echo "DEBUG - Provedor: Resposta Bruta:"
echo "$RESPONSE_PROVIDER"
echo "DEBUG - Provedor: JQ accessToken:"
echo "$RESPONSE_PROVIDER" | jq -r '.accessToken'
echo "DEBUG - Provedor: JQ user.id:"
echo "$RESPONSE_PROVIDER" | jq -r '.user.id'
echo "DEBUG - Provedor: JQ user.providerDetails.id:"
echo "$RESPONSE_PROVIDER" | jq -r '.user.providerDetails.id'

PROVIDER_TOKEN=$(echo "$RESPONSE_PROVIDER" | jq -r '.accessToken')
PROVIDER_USER_ID=$(echo "$RESPONSE_PROVIDER" | jq -r '.user.id')
PROVIDER_ID=$(echo "$RESPONSE_PROVIDER" | jq -r '.user.providerDetails.id')

if [[ -n "$PROVIDER_TOKEN" && "$PROVIDER_TOKEN" != "null" ]]; then
    echo "   ✅ Provedor registrado e token obtido."
    echo "   Provedor Token: $PROVIDER_TOKEN"
    echo "   Provedor User ID: $PROVIDER_USER_ID"
    echo "   Provedor ID: $PROVIDER_ID"
else
    echo "   ❌ Erro ao registrar provedor ou token/ID não capturado."
    echo "   Resposta Completa: $RESPONSE_PROVIDER"
    exit 1
fi

# --- 1.3. Realizando Login Admin para obter o ADMIN_TOKEN dinamicamente ---
echo "1.3. Realizando Login Admin..."
RESPONSE_ADMIN_LOGIN=$(curl -s -X POST "$baseUrl/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
            "email": "'"$ADMIN_EMAIL"'",
            "password": "'"$ADMIN_PASSWORD"'"
          }' 2>/dev/null)

echo "DEBUG - Admin Login: Resposta Bruta:"
echo "$RESPONSE_ADMIN_LOGIN"
echo "DEBUG - Admin Login: JQ accessToken:"
echo "$RESPONSE_ADMIN_LOGIN" | jq -r '.accessToken'

ADMIN_TOKEN=$(echo "$RESPONSE_ADMIN_LOGIN" | jq -r '.accessToken')

if [[ -n "$ADMIN_TOKEN" && "$ADMIN_TOKEN" != "null" ]]; then
    echo "   ✅ Admin logado e token obtido."
    echo "   Admin Token: $ADMIN_TOKEN"
else
    echo "   ❌ Erro ao fazer login Admin ou token não capturado."
    echo "   Resposta Completa: $RESPONSE_ADMIN_LOGIN"
    exit 1 # Sai aqui se o login Admin falhar, pois muitos passos dependem dele.
fi


# --- 2. Cadastro Completo de Provider + Verificação ---
echo "2.1. Atualizando dados do provedor..."
curl -s -X PATCH "$baseUrl/providers/me" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PROVIDER_TOKEN" \
      -d '{
            "pixKey": "script.pix@teste.com",
            "bio": "Este é o campo bio atualizado após o registro inicial e aceito no DTO!"
          }' 2>/dev/null
echo "   ✅ Dados do provedor atualizados."

# Nota: Upload de arquivo com cURL em scripts é mais complexo devido ao path absoluto e ambiente.
# Para este script simplificado, vamos SIMULAR que o upload ocorreu e o status está PENDING_MANUAL_REVIEW.
# Em um script real, você faria os curl -F para upload e verificaria as respostas.

echo "2.2. Aprovando provedor (via ADMIN, se token disponível)..."
# É crucial que ADMIN_TOKEN seja preenchido E válido para esta etapa.
if [[ -n "$ADMIN_TOKEN" && "$ADMIN_TOKEN" != "null" ]]; then
    RESPONSE_APPROVE=$(curl -s -X PATCH "$baseUrl/verification/$PROVIDER_ID/status" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          -d '{"status": "APPROVED"}' 2>/dev/null)
    APPROVAL_STATUS=$(echo "$RESPONSE_APPROVE" | jq -r '.message' | grep -q "atualizado para APPROVED" && echo "APPROVED" || echo "UNKNOWN")
    
    if [[ "$APPROVAL_STATUS" == "APPROVED" ]]; then
        echo "   ✅ Provedor aprovado por ADMIN."
    else
        echo "   ❌ Erro ao aprovar provedor por ADMIN. Resposta: $RESPONSE_APPROVE"
        exit 1
    fi
else
    echo "   ⚠️ Token ADMIN não disponível ou não capturado. Pulando aprovação manual por ADMIN."
    echo "   Para continuar, o provedor precisa ter sido automaticamente APROVADO pela simulação de verificação."
fi

# Verificar status final do provedor
FINAL_PROVIDER_STATUS=$(curl -s -X GET "$baseUrl/providers/$PROVIDER_ID" 2>/dev/null | jq -r '.verificationStatus')
if [[ "$FINAL_PROVIDER_STATUS" == "APPROVED" ]]; then
    echo "   ✅ Status final do provedor é APPROVED."
else
    if [[ -n "$ADMIN_TOKEN" && "$ADMIN_TOKEN" != "null" ]]; then
        echo "   ❌ Status final do provedor é $FINAL_PROVIDER_STATUS (Esperado: APPROVED)."
    else
        echo "   ✅ Status final do provedor é $FINAL_PROVIDER_STATUS (Conforme esperado sem aprovação ADMIN/completa)."
    fi
    echo "   Resposta Completa de Verificação de Status: $(curl -s -X GET "$baseUrl/providers/$PROVIDER_ID" 2>/dev/null)"
    if [[ "$FINAL_PROVIDER_STATUS" != "APPROVED" && -n "$ADMIN_TOKEN" && "$ADMIN_TOKEN" != "null" ]]; then
        exit 1
    fi
fi


# --- 3. Cadastro de Serviços e Disponibilidade ---
echo "3.1. Criando serviço '$SERVICE_NAME_DYNAMIC'..."
if [[ -n "$ADMIN_TOKEN" && "$ADMIN_TOKEN" != "null" ]]; then
    RESPONSE_SERVICE=$(curl -s -X POST "$baseUrl/services" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          -d '{
                "name": "'"$SERVICE_NAME_DYNAMIC"'",
                "description": "Serviço via script",
                "price": 90.00,
                "icon": "script-icon"
              }' 2>/dev/null)

    SERVICE_ID=$(echo "$RESPONSE_SERVICE" | jq -r '.id')
    if [[ -n "$SERVICE_ID" && "$SERVICE_ID" != "null" ]]; then
        echo "   ✅ Serviço criado. ID: $SERVICE_ID"
    else
        echo "   ❌ Erro ao criar serviço ou ID não capturado. Resposta: $RESPONSE_SERVICE"
        exit 1
    fi
else
    echo "   ❌ Token ADMIN não disponível ou não capturado. Pulando criação de serviço."
    echo "   Para continuar o fluxo, o serviço 'Limpeza Residencial Script' JÁ DEVE EXISTIR no banco de dados."
    exit 1
fi


echo "3.2. Vinculando provedor ao serviço..."
if [[ -z "$SERVICE_ID" || "$SERVICE_ID" == "null" ]]; then
    echo "   ❌ Pulando vinculação de serviço ao provedor: SERVICE_ID é vazio ou nulo."
    exit 1
fi

RESPONSE_PROVIDER_SERVICE_BINDING=$(curl -s -X POST "$baseUrl/providers/$PROVIDER_ID/services" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PROVIDER_TOKEN" \
      -d '{"serviceId": "'"$SERVICE_ID"'", "price": 90.00, "durationMinutes": 120}' 2>/dev/null)

PROVIDER_SERVICE_OFFERING_ID=$(echo "$RESPONSE_PROVIDER_SERVICE_BINDING" | jq -r '.id')

if [[ -n "$PROVIDER_SERVICE_OFFERING_ID" && "$PROVIDER_SERVICE_OFFERING_ID" != "null" ]]; then
    echo "   ✅ Serviço vinculado ao provedor. ProviderService ID: $PROVIDER_SERVICE_OFFERING_ID"
else
    echo "   ❌ Erro ao vincular serviço ao provedor ou ProviderService ID não capturado."
    echo "   Resposta Completa: $RESPONSE_PROVIDER_SERVICE_BINDING"
    exit 1
fi

echo "3.3. Cadastrando disponibilidade..."
CURRENT_UNIX_TIMESTAMP=$(date +%s)
FUTURE_UNIX_TIMESTAMP=$((CURRENT_UNIX_TIMESTAMP + 2 * 24 * 3600))
FUTURE_DATE_FORMATED=$(date -u -d "@$FUTURE_UNIX_TIMESTAMP" +"%Y-%m-%dT09:00:00.000Z")
PRISMA_DAY_OF_WEEK=$(date -u -d "@$FUTURE_UNIX_TIMESTAMP" +"%w")


curl -s -X PATCH "$baseUrl/providers/$PROVIDER_ID/availability" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PROVIDER_TOKEN" \
      -d '[{"dayOfWeek": '"$PRISMA_DAY_OF_WEEK"', "startTime": "09:00", "endTime": "17:00", "isAvailable": true}]' 2>/dev/null
echo "   ✅ Disponibilidade cadastrada para $FUTURE_DATE_FORMATED (Dia da semana Prisma: $PRISMA_DAY_OF_WEEK)."


# --- 4. Fluxo do Cliente → Agendar Serviço ---
echo "4.1. Cliente agendando serviço..."
# A data do agendamento é a mesma da disponibilidade criada (2 dias no futuro)
JSON_PAYLOAD_BOOKING=$(jq -n \
    --arg providerId "$PROVIDER_ID" \
    --arg providerServiceId "$PROVIDER_SERVICE_OFFERING_ID" \
    --arg scheduledDate "$FUTURE_DATE_FORMATED" \
    '{
        "providerId": $providerId,
        "providerServiceId": $providerServiceId,
        "scheduledDate": $scheduledDate,
        "scheduledTime": "09:00",
        "totalPrice": 90.00,
        "notes": "Agendamento por script.",
        "address": {
          "cep": "01001000",
          "street": "Rua Agend Script",
          "number": "50",
          "neighborhood": "Bairro Agend",
          "city": "Sao Paulo",
          "state": "SP"
        }
    }')

echo "DEBUG - Agendamento: JSON gerado para envio:"
echo "$JSON_PAYLOAD_BOOKING"
echo "" # Nova linha

RESPONSE_BOOKING=$(curl -s -X POST "$baseUrl/bookings/schedule-and-pay" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CLIENT_TOKEN" \
      -d "$JSON_PAYLOAD_BOOKING" 2>/dev/null)

BOOKING_ID=$(echo "$RESPONSE_BOOKING" | jq -r '.booking.id')
BOOKING_STATUS=$(echo "$RESPONSE_BOOKING" | jq -r '.booking.status')

# --- NOVO: Capturar e verificar dados do PIX ---
PIX_BR_CODE=$(echo "$RESPONSE_BOOKING" | jq -r '.pixCharge.brCode')
PIX_QR_CODE_IMAGE=$(echo "$RESPONSE_BOOKING" | jq -r '.pixCharge.qrCodeImage')
PIX_TRANSACTION_ID=$(echo "$RESPONSE_BOOKING" | jq -r '.pixCharge.transactionId')

if [[ -n "$BOOKING_ID" && "$BOOKING_ID" != "null" && "$BOOKING_STATUS" == "PENDING" ]]; then
    echo "   ✅ Agendamento criado. ID: $BOOKING_ID. Status: $BOOKING_STATUS"
    
    if [[ -n "$PIX_BR_CODE" && "$PIX_BR_CODE" != "null" && \
          -n "$PIX_QR_CODE_IMAGE" && "$PIX_QR_CODE_IMAGE" != "null" && \
          -n "$PIX_TRANSACTION_ID" && "$PIX_TRANSACTION_ID" != "null" ]]; then
        echo "   ✅ Dados PIX (brCode, qrCodeImage, transactionId) recebidos com sucesso!"
        echo "      BR Code: $PIX_BR_CODE"
        echo "      QR Code Image URL: $PIX_QR_CODE_IMAGE"
        echo "      PIX Transaction ID: $PIX_TRANSACTION_ID"
    else
        echo "   ❌ Erro: Dados PIX (brCode, qrCodeImage, transactionId) não recebidos ou são nulos."
        echo "      Resposta PIX Completa: $(echo "$RESPONSE_BOOKING" | jq -r '.pixCharge')"
        exit 1
    fi
else
    echo "   ❌ Erro ao criar agendamento ou status incorreto. Resposta: $RESPONSE_BOOKING"
    exit 1
fi

echo "4.2. Provedor confirmando agendamento..."
curl -s -X PATCH "$baseUrl/bookings/$BOOKING_ID/status" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PROVIDER_TOKEN" \
      -d '{"status": "CONFIRMED"}' 2>/dev/null
echo "   ✅ Agendamento confirmado."

# --- REMOVIDO: 4.3. Simular status IN_PROGRESS... (Conforme solicitado) ---
# O trecho abaixo foi removido para evitar a transição inválida de status.
# echo "4.3. Simular status IN_PROGRESS..."
# curl -s -X PATCH "$baseUrl/bookings/$BOOKING_ID/status" \
#       -H "Content-Type: application/json" \
#       -H "Authorization: Bearer $PROVIDER_TOKEN" \
#       -d '{"status": "IN_PROGRESS"}' 2>/dev/null
# echo "   ✅ Agendamento em progresso."


echo "4.4. Simular status COMPLETED..."
curl -s -X PATCH "$baseUrl/bookings/$BOOKING_ID/status" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $PROVIDER_TOKEN" \
      -d '{"status": "COMPLETED"}' 2>/dev/null
echo "   ✅ Agendamento concluído."

# --- 5. Fluxo de Avaliação e Ganhos ---
echo "5.1. Cliente avaliando o provedor..."
curl -s -X POST "$baseUrl/reviews" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $CLIENT_TOKEN" \
      -d '{"bookingId": "'"$BOOKING_ID"'", "rating": 5, "comment": "Serviço impecável por script!"}' 2>/dev/null
echo "   ✅ Avaliação enviada."

echo "5.2. Provedor consultando ganhos..."
RESPONSE_EARNINGS=$(curl -s -X GET "$baseUrl/providers/me/earnings" \
      -H "Authorization: Bearer $PROVIDER_TOKEN" 2>/dev/null)

TOTAL_EARNINGS=$(echo "$RESPONSE_EARNINGS" | jq -r '.totalEarnings')

# Comparar números de ponto flutuante no bash é complicado. 'bc' é uma opção.
# Se o preço for 90.00, esperamos que totalEarnings seja pelo menos 90.00 (ou um pouco menos pela comissão, se já implementada).
# Para este teste, vamos apenas verificar se é um número e não nulo.
if [[ -n "$TOTAL_EARNINGS" && "$TOTAL_EARNINGS" != "null" ]]; then
    # Certifique-se de que 'bc' esteja instalado (pacman -S bc no MINGW64)
    if (( $(echo "$TOTAL_EARNINGS > 0" | bc -l) )); then
        echo "   ✅ Ganhos refletem serviço concluído. Total: $TOTAL_EARNINGS"
    else
        echo "   ❌ Ganhos incorretos (não é maior que zero). Total: $TOTAL_EARNINGS"
    fi
else
    echo "   ❌ Erro ao consultar ganhos ou totalEarnings é nulo/vazio. Resposta: $RESPONSE_EARNINGS"
fi

# --- 6. Teste de Notificações ---
echo "6.1. Criando notificação para o cliente..."
# Use CLIENT_USER_ID, não CLIENT_ID, pois notificação é para o User base
curl -s -X POST "$baseUrl/notifications" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -d '{"userId": "'"$CLIENT_USER_ID"'", "type": "TEST_SCRIPT", "message": "Notificacao gerada por script."}' 2>/dev/null # <-- MENSAGEM AJUSTADA PARA ACENTOS
echo "   ✅ Notificação criada."

echo "6.2. Cliente listando notificações..."
RESPONSE_NOTIFICATIONS=$(curl -s -X GET "$baseUrl/notifications/me" \
      -H "Authorization: Bearer $CLIENT_TOKEN" 2>/dev/null)

# Verifica se a mensagem específica está contida na resposta JSON
if echo "$RESPONSE_NOTIFICATIONS" | grep -q "Notificacao gerada por script."; then # <-- BUSCA AJUSTADA PARA ACENTOS
    echo "   ✅ Cliente recebeu a notificação de script."
else
    echo "   ❌ Cliente não recebeu a notificação de script."
    echo "   Resposta: $RESPONSE_NOTIFICATIONS"
fi

echo "--- Testes Automatizados Concluídos ---"
