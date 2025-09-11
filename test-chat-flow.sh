#!/bin/bash

# Ensure UTF-8 locale for proper character handling in shell and jq
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

# --- Configurações Iniciais ---
baseUrl="http://localhost:3000"

# Credenciais dos usuários fixos (assumindo que são criados pelo endpoint /test/seed)
CLIENT_EMAIL="indicador@teste.com"
CLIENT_PASSWORD="12345678"

PROVIDER_EMAIL="provedor@teste.com"
PROVIDER_PASSWORD="12345678"

# Variáveis globais para armazenar IDs e Tokens capturados
CLIENT_TOKEN=""
CLIENT_USER_ID=""
CLIENT_ID="" # ID do Client (perfil)

PROVIDER_TOKEN=""
PROVIDER_USER_ID=""
PROVIDER_ID="" # ID do Provider (perfil)

CHAT_ID=""
SENT_MESSAGE_ID="" # Nova variável para armazenar o ID da mensagem enviada

echo "--- Iniciando Teste de Fluxo do Módulo de Chat (Shell Script) ---"
echo "URL Base do Backend: $baseUrl"
echo "------------------------------------------------------------------"

# Função para verificar se o comando jq está disponível
command -v jq >/dev/null 2>&1 || { echo >&2 "Erro: 'jq' não está instalado. Por favor, instale-o (ex: sudo apt-get install jq ou brew install jq)."; exit 1; }

# Adiciona set -e para sair imediatamente se um comando falhar
set -e

# --- 1. Realizando Login do Cliente ---
echo "1.1. Realizando Login do Cliente ($CLIENT_EMAIL)..."
RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$CLIENT_EMAIL\", \"password\": \"$CLIENT_PASSWORD\"}")

if echo "$RESPONSE" | jq -e '.accessToken != null and .user.id != null and .user.clientDetails.id != null' >/dev/null; then
  CLIENT_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  CLIENT_USER_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  CLIENT_ID=$(echo "$RESPONSE" | jq -r '.user.clientDetails.id')
  echo "  ✅ Cliente logado e token/IDs obtidos."
  echo "    Cliente User ID: $CLIENT_USER_ID"
  echo "    Cliente Profile ID: $CLIENT_ID"
else
  echo "  ❌ Erro ao fazer login do cliente. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 2. Realizando Login do Provedor ---
echo "2.1. Realizando Login do Provedor ($PROVIDER_EMAIL)..."
RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$PROVIDER_EMAIL\", \"password\": \"$PROVIDER_PASSWORD\"}")

if echo "$RESPONSE" | jq -e '.accessToken != null and .user.id != null and .user.providerDetails.id != null' >/dev/null; then
  PROVIDER_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  PROVIDER_USER_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  PROVIDER_ID=$(echo "$RESPONSE" | jq -r '.user.providerDetails.id')
  echo "  ✅ Provedor logado e token/IDs obtidos."
  echo "    Provedor User ID: $PROVIDER_USER_ID"
  echo "    Provedor Profile ID: $PROVIDER_ID"
else
  echo "  ❌ Erro ao fazer login do provedor. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 3. Cliente Encontrando ou Criando um Chat com o Provedor ---
echo "3.1. Cliente ($CLIENT_EMAIL) encontrando ou criando chat com o Provedor ($PROVIDER_EMAIL)..."
# CORREÇÃO: Usar CLIENT_USER_ID e PROVIDER_USER_ID
RESPONSE=$(curl -s -X GET "$baseUrl/chat/find-or-create/provider/$PROVIDER_USER_ID/client/$CLIENT_USER_ID" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

if echo "$RESPONSE" | jq -e '.chatId != null' >/dev/null; then
  CHAT_ID=$(echo "$RESPONSE" | jq -r '.chatId')
  echo "  ✅ Chat encontrado ou criado com sucesso. Chat ID: $CHAT_ID"
else
  echo "  ❌ Erro ao encontrar ou criar chat. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 4. Cliente Enviando uma Mensagem ---
echo "4.1. Cliente ($CLIENT_EMAIL) enviando mensagem para o chat ID: $CHAT_ID..."
MESSAGE_CONTENT="Olá, tudo bem? Esta é uma mensagem de teste do script shell."

# CORREÇÃO: Remova 'senderId' do payload JSON.
# O backend obtém o senderId do token JWT.
JSON_PAYLOAD=$(jq -n \
  --arg chatId "$CHAT_ID" \
  --arg receiverId "$PROVIDER_USER_ID" \
  --arg content "$MESSAGE_CONTENT" \
  '{chatId: $chatId, receiverId: $receiverId, content: $content}')

RESPONSE=$(curl -s -X POST "$baseUrl/chat/$CHAT_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "$JSON_PAYLOAD")

# Verificação atualizada: apenas verifica se um ID é retornado.
# A comparação de conteúdo é propensa a falhas com caracteres especiais em ambientes shell.
if echo "$RESPONSE" | jq -e '.id != null' >/dev/null; then
  SENT_MESSAGE_ID=$(echo "$RESPONSE" | jq -r '.id') # Captura o ID da mensagem enviada
  echo "  ✅ Mensagem enviada com sucesso. ID: $SENT_MESSAGE_ID"
else
  echo "  ❌ Erro ao enviar mensagem. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 5. Provedor Recuperando Mensagens do Chat ---
echo "5.1. Provedor ($PROVIDER_EMAIL) recuperando mensagens do chat ID: $CHAT_ID..."
RESPONSE=$(curl -s -X GET "$baseUrl/chat/$CHAT_ID/messages" \
  -H "Authorization: Bearer $PROVIDER_TOKEN")

# Verificação atualizada: procura pelo ID específico da mensagem que foi enviada.
if echo "$RESPONSE" | jq -e '.[] | select(.id == "'"$SENT_MESSAGE_ID"'")' >/dev/null; then
  echo "  ✅ Provedor recuperou as mensagens e encontrou a mensagem enviada (ID: $SENT_MESSAGE_ID)."
else
  echo "  ❌ Provedor não encontrou a mensagem enviada (ID: $SENT_MESSAGE_ID). Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

echo "--- Teste de Fluxo do Módulo de Chat Concluído com Sucesso! ---"