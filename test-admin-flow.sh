#!/bin/bash

# --- Configurações Iniciais ---
baseUrl="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

ADMIN_EMAIL="admin@limpeja.app"
ADMIN_PASSWORD="12345678"

# Variáveis para armazenar IDs dinâmicos
DISPUTE_ID=""
USER_ID=""   # Novo: vamos testar delete user
INCIDENT_ID="" # Agora será obtido dinamicamente

ADMIN_TOKEN=""

# Verifica se jq está instalado
command -v jq >/dev/null 2>&1 || { echo >&2 "${RED}Erro: 'jq' não está instalado. Instale-o (sudo apt-get install jq ou brew install jq).${NC}"; exit 1; }

echo -e "${GREEN}--- Iniciando Teste de Fluxo do Administrador (Foco: Disputas, Usuários e Segurança) ---${NC}"
echo "------------------------------------------------------------------"

# 1. Login do Administrador
echo "1. Realizando Login do Administrador (${ADMIN_EMAIL})..."
LOGIN_RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -d '{ "email": "'"$ADMIN_EMAIL"'", "password": "'"$ADMIN_PASSWORD"'" }')

if echo "$LOGIN_RESPONSE" | jq -e '.accessToken' >/dev/null; then
  ADMIN_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
  echo -e "  ${GREEN}✅ Login de Admin bem-sucedido.${NC}"
else
  echo -e "  ${RED}❌ Erro no login de Admin. Resposta: $LOGIN_RESPONSE${NC}"
  exit 1
fi
echo "------------------------------------------------------------------"

# 2. Resolução de Disputas
echo "2. Testando Resolução de Disputas..."

# 2.1. Listando e obtendo o ID da primeira disputa...
echo "2.1. Listando e obtendo o ID da primeira disputa..."
DISPUTES_RESPONSE=$(curl -s -X GET "$baseUrl/disputes" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if [ $? -eq 0 ] && ! echo "$DISPUTES_RESPONSE" | grep -q "error" && [ "$(echo "$DISPUTES_RESPONSE" | jq 'length')" -gt 0 ]; then
  DISPUTE_ID=$(echo "$DISPUTES_RESPONSE" | jq -r '.[0].id')
  echo -e "  ${GREEN}✅ ID da disputa obtido com sucesso: ${DISPUTE_ID}${NC}"
else
  echo -e "  ${YELLOW}⚠️ Aviso: Nenhuma disputa encontrada. Ignorando teste de resolução de disputa. Resposta: $DISPUTES_RESPONSE${NC}"
fi

# 2.2. Resolvendo disputa com outcome válido
if [ -n "$DISPUTE_ID" ]; then
  echo "2.2. Resolvendo disputa ID: ${DISPUTE_ID}..."
  RESPONSE=$(curl -s -X PATCH "$baseUrl/disputes/${DISPUTE_ID}/status" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
          "status": "RESOLVED",
          "refundAmount": 25.00,
          "resolutionNotes": "Decisão administrativa: reembolso parcial concedido."
        }')
  if echo "$RESPONSE" | grep -q "\"status\":\"RESOLVED\""; then
    echo -e "  ${GREEN}✅ Disputa resolvida com sucesso.${NC}"
  else
    echo -e "  ${RED}❌ Erro ao resolver disputa. Resposta: $RESPONSE${NC}"
  fi
fi

echo "------------------------------------------------------------------"

# 3. Exclusão de Usuários
echo "3. Testando Exclusão de Usuários..."

# 3.1. Listando usuários e pegando um ID (não admin de preferência)
USERS_RESPONSE=$(curl -s -X GET "$baseUrl/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
if [ $? -eq 0 ] && ! echo "$USERS_RESPONSE" | grep -q "error" && [ "$(echo "$USERS_RESPONSE" | jq 'length')" -gt 0 ]; then
  USER_ID=$(echo "$USERS_RESPONSE" | jq -r '.[0].id')
  echo -e "  ${GREEN}✅ ID de usuário obtido para exclusão: ${USER_ID}${NC}"
else
  echo -e "  ${YELLOW}⚠️ Nenhum usuário encontrado para exclusão. Resposta: $USERS_RESPONSE${NC}"
fi

# 3.2. Deletando usuário
if [ -n "$USER_ID" ]; then
  echo "3.2. Deletando usuário ID: ${USER_ID}..."
  RESPONSE=$(curl -s -X DELETE "$baseUrl/users/${USER_ID}" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  if [ -z "$RESPONSE" ]; then
    echo -e "  ${GREEN}✅ Usuário deletado (soft delete aplicado).${NC}"
  else
    echo -e "  ${RED}❌ Erro ao deletar usuário. Resposta: $RESPONSE${NC}"
  fi
fi

echo "------------------------------------------------------------------"

# 4. Resolução de Incidentes de Segurança
echo "4. Testando Resolução de Incidentes de Segurança..."

# 4.1. Tentando listar e obter o ID do primeiro incidente de segurança (para administradores)...
SAFETY_INCIDENTS_RESPONSE=$(curl -s -X GET "$baseUrl/safety/incidents" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if [ $? -eq 0 ] && ! echo "$SAFETY_INCIDENTS_RESPONSE" | grep -q "error" && [ "$(echo "$SAFETY_INCIDENTS_RESPONSE" | jq 'length')" -gt 0 ]; then
  INCIDENT_ID=$(echo "$SAFETY_INCIDENTS_RESPONSE" | jq -r '.[0].id')
  echo -e "  ${GREEN}✅ ID do incidente de segurança obtido com sucesso: ${INCIDENT_ID}${NC}"
else
  echo -e "  ${YELLOW}⚠️ Aviso: Nenhuma incidente de segurança encontrado ou erro ao listar. Resposta: $SAFETY_INCIDENTS_RESPONSE${NC}"
  echo -e "  ${YELLOW}⚠️ Não será possível testar o fechamento de incidente sem um ID válido.${NC}"
  INCIDENT_ID="" # Garante que INCIDENT_ID esteja vazio se não for encontrado
fi

# 4.2. Fechando um incidente
if [ -n "$INCIDENT_ID" ]; then # Só tenta fechar se obteve um ID real
  echo "4.2. Fechando incidente de segurança ID: ${INCIDENT_ID}..."
  RESPONSE=$(curl -s -X PATCH "$baseUrl/safety/incident/${INCIDENT_ID}/status" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{ "status": "RESOLVED", "resolution": "Incidente resolvido e registrado." }')
  if echo "$RESPONSE" | grep -q "\"status\":\"RESOLVED\""; then
    echo -e "  ${GREEN}✅ Incidente de segurança fechado com sucesso.${NC}"
  else
    echo -e "  ${RED}❌ Erro ao fechar incidente. Resposta: $RESPONSE${NC}"
  fi
else
  echo -e "  ${YELLOW}⚠️ Não foi possível fechar incidente, pois nenhum ID válido foi obtido.${NC}"
fi

echo "------------------------------------------------------------------"
echo -e "${GREEN}--- Teste do Fluxo do Administrador Concluído ---${NC}"