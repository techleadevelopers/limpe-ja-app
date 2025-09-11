#!/bin/bash

# --- Configurações ---
BASE_URL="http://localhost:3000" # URL base do seu backend
PROVIDER_EMAIL="provedor@teste.com"
PROVIDER_PASSWORD="12345678" # Senha do provedor (use uma senha segura em ambientes reais)
WITHDRAW_AMOUNT="50.00" # Valor a ser sacado
PIX_KEY="carolina.pix@email.com" # Chave PIX do provedor
PIX_KEY_TYPE="EMAIL" # Tipo da chave PIX (CPF, CNPJ, EMAIL, PHONE, RANDOM)

# --- Cores para saída do terminal ---
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}--- Iniciando Teste de Fluxo de Saque (Shell Script) ---${NC}"
echo "URL Base do Backend: ${BASE_URL}"
echo "Provedor de Teste: ${PROVIDER_EMAIL}"
echo "Valor do Saque: R$ ${WITHDRAW_AMOUNT}"
echo "------------------------------------------------------------------"

# Função para verificar se o comando jq está disponível
command -v jq >/dev/null 2>&1 || { echo >&2 "${RED}Erro: 'jq' não está instalado. Por favor, instale-o (ex: sudo apt-get install jq ou brew install jq).${NC}"; exit 1; }

# 1. Login do Provedor
echo "1. Realizando Login do Provedor (${PROVIDER_EMAIL})..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${PROVIDER_EMAIL}\", \"password\": \"${PROVIDER_PASSWORD}\"}")

# Verifica se o curl retornou erro
if [ $? -ne 0 ]; then
  echo -e "  ${RED}❌ Erro de conexão ou rede ao tentar logar o provedor.${NC}"
  exit 1
fi

PROVIDER_TOKEN=$(echo "${LOGIN_RESPONSE}" | jq -r '.accessToken // empty')
PROVIDER_USER_ID=$(echo "${LOGIN_RESPONSE}" | jq -r '.user.id // empty')
# Correção: Usar .user.providerDetails.id conforme a estrutura de login do seed.ts
PROVIDER_ID=$(echo "${LOGIN_RESPONSE}" | jq -r '.user.providerDetails.id // empty')

if [ -z "${PROVIDER_TOKEN}" ]; then
  echo -e "  ${RED}❌ Erro ao logar o provedor ou token não capturado. Resposta: ${LOGIN_RESPONSE}${NC}"
  exit 1
else
  echo -e "  ${GREEN}✅ Provedor logado e token/IDs obtidos.${NC}"
  echo "    Provedor Token (parcial): ${PROVIDER_TOKEN:0:10}..."
  echo "    Provedor User ID: ${PROVIDER_USER_ID}"
  echo "    Provedor ID: ${PROVIDER_ID}" # Agora deve aparecer o ID corretamente
fi
echo "------------------------------------------------------------------"

# 2. Obter Saldo Atual do Provedor
echo "2. Obtendo saldo atual do provedor..."
# CORREÇÃO AQUI: Usar o endpoint /providers/me/earnings
BALANCE_RESPONSE=$(curl -s -X GET "${BASE_URL}/providers/me/earnings" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}")

# Verifica se o curl retornou erro
if [ $? -ne 0 ]; then
  echo -e "  ${RED}❌ Erro de conexão ou rede ao tentar obter o saldo.${NC}"
  exit 1
fi

# O endpoint /providers/me/earnings retorna um objeto EarningsResponseDto
CURRENT_BALANCE=$(echo "${BALANCE_RESPONSE}" | jq -r '.availableForWithdrawal // empty')

if [ -z "${CURRENT_BALANCE}" ]; then
  echo -e "  ${RED}❌ Erro ao obter saldo do provedor ou saldo 'availableForWithdrawal' não encontrado. Resposta: ${BALANCE_RESPONSE}${NC}"
  exit 1
else
  echo -e "  ${GREEN}✅ Saldo atual do provedor: R$ ${CURRENT_BALANCE}${NC}"
fi
echo "------------------------------------------------------------------"

# 3. Solicitar Saque
echo "3. Solicitando saque de R$ ${WITHDRAW_AMOUNT}..."
WITHDRAW_REQUEST_BODY=$(jq -n \
  --arg amount "${WITHDRAW_AMOUNT}" \
  --arg pixKey "${PIX_KEY}" \
  --arg pixKeyType "${PIX_KEY_TYPE}" \
  '{amount: ($amount | tonumber), pixKey: $pixKey, pixKeyType: $pixKeyType}')

# Manter o endpoint /payments/withdrawal
WITHDRAW_RESPONSE=$(curl -s -X POST "${BASE_URL}/payments/withdrawal" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}" \
  -d "${WITHDRAW_REQUEST_BODY}")

# Verifica se o curl retornou erro
if [ $? -ne 0 ]; then
  echo -e "  ${RED}❌ Erro de conexão ou rede ao tentar solicitar o saque.${NC}"
  exit 1
fi

# A resposta do endpoint /payments/withdrawal (MessageResponseDto) é diferente
# da resposta do earnings.service.ts (WithdrawalResponseDto).
# O payments.service.ts retorna { message: 'Solicitação de saque recebida com sucesso...' }
# O earnings.service.ts retorna { success: boolean, message: string, transactionId?: string }
# Vamos assumir que o endpoint /payments/withdrawal retorna uma MessageResponseDto simples
# e ajustar a verificação para isso.
WITHDRAWAL_MESSAGE=$(echo "${WITHDRAW_RESPONSE}" | jq -r '.message // empty')

if [ -z "${WITHDRAWAL_MESSAGE}" ]; then
  echo -e "  ${RED}❌ Erro inesperado ao solicitar saque. Resposta: ${WITHDRAW_RESPONSE}${NC}"
  exit 1
else
  echo -e "  ${GREEN}✅ Saque solicitado com sucesso!${NC}"
  echo "    Mensagem: ${WITHDRAWAL_MESSAGE}"
  # Se o endpoint /payments/withdrawal retornasse um ID, você o capturaria aqui.
  # Por exemplo: WITHDRAWAL_ID=$(echo "${WITHDRAW_RESPONSE}" | jq -r '.id // empty')
fi
echo "------------------------------------------------------------------"

# 4. Verificar Saldo Após Saque (pode não refletir imediatamente)
echo "4. Verificando saldo após a solicitação de saque (pode não refletir imediatamente)..."
# CORREÇÃO AQUI: Usar o endpoint /providers/me/earnings novamente
BALANCE_AFTER_WITHDRAW_RESPONSE=$(curl -s -X GET "${BASE_URL}/providers/me/earnings" \
  -H "Authorization: Bearer ${PROVIDER_TOKEN}")

# Verifica se o curl retornou erro
if [ $? -ne 0 ]; then
  echo -e "  ${YELLOW}⚠️ Aviso: Erro de conexão ou rede ao tentar obter o saldo final. O teste continuará.${NC}"
else
  BALANCE_AFTER_WITHDRAW=$(echo "${BALANCE_AFTER_WITHDRAW_RESPONSE}" | jq -r '.availableForWithdrawal // empty')

  if [ -z "${BALANCE_AFTER_WITHDRAW}" ]; then
    echo -e "  ${YELLOW}⚠️ Aviso: Erro ao obter saldo final ou saldo 'availableForWithdrawal' não encontrado. Resposta: ${BALANCE_AFTER_WITHDRAW_RESPONSE}${NC}"
  else
    echo -e "  ${GREEN}✅ Saldo do provedor após solicitação: R$ ${BALANCE_AFTER_WITHDRAW}${NC}"
  fi
fi
echo "------------------------------------------------------------------"

echo -e "${GREEN}--- Teste de Saque Concluído ---${NC}"