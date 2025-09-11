#!/bin/bash

# --- Configurações Iniciais ---
baseUrl="http://localhost:3000"

# Credenciais dos usuários
CLIENT_EMAIL="indicado@teste.com" # Usando o 'indicado@teste.com' como cliente para consistência
CLIENT_PASSWORD="12345678"

# CORREÇÃO: Usar as credenciais do administrador real
ADMIN_EMAIL="admin@limpeja.app"
ADMIN_PASSWORD="12345678"

# Variáveis globais
CLIENT_TOKEN=""
CLIENT_ID=""
ADMIN_TOKEN=""
ADMIN_ID=""
TICKET_ID=""

echo "--- Iniciando Teste de Fluxo do Módulo de Suporte (Shell Script) ---"
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

if echo "$RESPONSE" | jq -e '.accessToken != null' >/dev/null; then
  CLIENT_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  CLIENT_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  echo "  ✅ Cliente logado e token/ID obtidos."
else
  echo "  ❌ Erro ao fazer login do cliente. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 2. Realizando Login do Administrador ---
echo "2.1. Realizando Login do Administrador ($ADMIN_EMAIL)..."
RESPONSE=$(curl -s -X POST "$baseUrl/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}")

if echo "$RESPONSE" | jq -e '.accessToken != null' >/dev/null; then
  ADMIN_TOKEN=$(echo "$RESPONSE" | jq -r '.accessToken')
  ADMIN_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  echo "  ✅ Administrador logado e token/ID obtidos."
else
  echo "  ❌ Erro ao fazer login do administrador. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 3. Cliente Criando um Ticket de Suporte ---
echo "3.1. Cliente ($CLIENT_EMAIL) criando um ticket de suporte..."
TICKET_SUBJECT="Problema com agendamento de limpeza"
TICKET_CATEGORY="QUALITY" # Usando uma categoria válida do enum SupportTicketCategory
TICKET_DESCRIPTION="O serviço de limpeza realizado em 2025-10-01 não atendeu às expectativas de qualidade. A cozinha não foi limpa adequadamente."

JSON_PAYLOAD=$(jq -n \
  --arg subject "$TICKET_SUBJECT" \
  --arg category "$TICKET_CATEGORY" \
  --arg description "$TICKET_DESCRIPTION" \
  '{subject: $subject, category: $category, description: $description}')

RESPONSE=$(curl -s -X POST "$baseUrl/v1/support/tickets" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "$JSON_PAYLOAD")

if echo "$RESPONSE" | jq -e '.id != null' >/dev/null; then
  TICKET_ID=$(echo "$RESPONSE" | jq -r '.id')
  echo "  ✅ Ticket de suporte criado com sucesso. ID: $TICKET_ID"
else
  echo "  ❌ Erro ao criar ticket de suporte. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 4. Cliente Listando Seus Tickets ---
echo "4.1. Cliente ($CLIENT_EMAIL) listando seus tickets..."
RESPONSE=$(curl -s -X GET "$baseUrl/v1/support/tickets?mine=true" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

if echo "$RESPONSE" | jq -e '.[0].id == "'"$TICKET_ID"'"' >/dev/null; then
  echo "  ✅ Cliente listou seus tickets e encontrou o ticket ID: $TICKET_ID."
else
  echo "  ❌ Erro ao listar tickets do cliente ou ticket não encontrado. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 5. Cliente Obtendo Detalhes do Ticket ---
echo "5.1. Cliente ($CLIENT_EMAIL) obtendo detalhes do ticket ID: $TICKET_ID..."
RESPONSE=$(curl -s -X GET "$baseUrl/v1/support/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

if echo "$RESPONSE" | jq -e '.id == "'"$TICKET_ID"'" and .subject == "'"$TICKET_SUBJECT"'"' >/dev/null; then
  echo "  ✅ Cliente obteve detalhes do ticket ID: $TICKET_ID."
else
  echo "  ❌ Erro ao obter detalhes do ticket do cliente. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 6. Cliente Adicionando uma Mensagem ao Ticket ---
echo "6.1. Cliente ($CLIENT_EMAIL) adicionando uma mensagem ao ticket ID: $TICKET_ID..."
MESSAGE_BODY="Gostaria de adicionar que o banheiro também não foi limpo adequadamente."

JSON_PAYLOAD=$(jq -n \
  --arg body "$MESSAGE_BODY" \
  '{body: $body}')

RESPONSE=$(curl -s -X POST "$baseUrl/v1/support/tickets/$TICKET_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "$JSON_PAYLOAD")

if echo "$RESPONSE" | jq -e '.id != null' >/dev/null; then
  echo "  ✅ Cliente adicionou mensagem ao ticket ID: $TICKET_ID."
else
  echo "  ❌ Erro ao adicionar mensagem ao ticket. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 7. Administrador Listando Todos os Tickets ---
echo "7.1. Administrador ($ADMIN_EMAIL) listando todos os tickets..."
RESPONSE=$(curl -s -X GET "$baseUrl/v1/support/tickets" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$RESPONSE" | jq -e '.[0].id == "'"$TICKET_ID"'"' >/dev/null; then
  echo "  ✅ Administrador listou todos os tickets e encontrou o ticket ID: $TICKET_ID."
else
  echo "  ❌ Erro ao listar tickets do administrador ou ticket não encontrado. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 8. Administrador Obtendo Detalhes do Ticket ---
echo "8.1. Administrador ($ADMIN_EMAIL) obtendo detalhes do ticket ID: $TICKET_ID..."
RESPONSE=$(curl -s -X GET "$baseUrl/v1/support/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$RESPONSE" | jq -e '.id == "'"$TICKET_ID"'" and .subject == "'"$TICKET_SUBJECT"'"' >/dev/null; then
  echo "  ✅ Administrador obteve detalhes do ticket ID: $TICKET_ID."
else
  echo "  ❌ Erro ao obter detalhes do ticket do administrador. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 9. Administrador Atualizando Status para IN_PROGRESS ---
echo "9.1. Administrador ($ADMIN_EMAIL) atualizando status do ticket ID: $TICKET_ID para IN_PROGRESS..."
JSON_PAYLOAD=$(jq -n --arg status "IN_PROGRESS" '{status: $status}')

RESPONSE=$(curl -s -X PATCH "$baseUrl/v1/support/tickets/$TICKET_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$JSON_PAYLOAD")

if echo "$RESPONSE" | jq -e '.status == "IN_PROGRESS"' >/dev/null; then
  echo "  ✅ Status do ticket ID: $TICKET_ID atualizado para IN_PROGRESS."
else
  echo "  ❌ Erro ao atualizar status para IN_PROGRESS. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 10. Administrador Atribuindo o Ticket ---
echo "10.1. Administrador ($ADMIN_EMAIL) atribuindo o ticket ID: $TICKET_ID para si mesmo (ID: $ADMIN_ID)..."
RESPONSE=$(curl -s -X PATCH "$baseUrl/v1/support/tickets/$TICKET_ID/assign/$ADMIN_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$RESPONSE" | jq -e '.assignedToId == "'"$ADMIN_ID"'"' >/dev/null; then
  echo "  ✅ Ticket ID: $TICKET_ID atribuído ao agente ID: $ADMIN_ID."
else
  echo "  ❌ Erro ao atribuir ticket. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 11. Administrador/Agente Adicionando uma Mensagem ao Ticket ---
echo "11.1. Administrador/Agente ($ADMIN_EMAIL) adicionando uma mensagem ao ticket ID: $TICKET_ID..."
AGENT_MESSAGE_BODY="Olá, recebi seu ticket. Lamento pelo ocorrido. Estamos analisando o problema e entraremos em contato com o provedor."

JSON_PAYLOAD=$(jq -n \
  --arg body "$AGENT_MESSAGE_BODY" \
  '{body: $body}')

RESPONSE=$(curl -s -X POST "$baseUrl/v1/support/tickets/$TICKET_ID/messages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$JSON_PAYLOAD")

if echo "$RESPONSE" | jq -e '.id != null' >/dev/null; then
  echo "  ✅ Administrador/Agente adicionou mensagem ao ticket ID: $TICKET_ID."
else
  echo "  ❌ Erro ao adicionar mensagem como agente. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 12. Administrador Atualizando Status para RESOLVED ---
echo "12.1. Administrador ($ADMIN_EMAIL) atualizando status do ticket ID: $TICKET_ID para RESOLVED..."
JSON_PAYLOAD=$(jq -n --arg status "RESOLVED" '{status: $status}')

RESPONSE=$(curl -s -X PATCH "$baseUrl/v1/support/tickets/$TICKET_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$JSON_PAYLOAD")

if echo "$RESPONSE" | jq -e '.status == "RESOLVED"' >/dev/null; then
  echo "  ✅ Status do ticket ID: $TICKET_ID atualizado para RESOLVED."
else
  echo "  ❌ Erro ao atualizar status para RESOLVED. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

# --- 13. Cliente Verificando o Status Final do Ticket ---
echo "13.1. Cliente ($CLIENT_EMAIL) verificando o status final do ticket ID: $TICKET_ID..."
RESPONSE=$(curl -s -X GET "$baseUrl/v1/support/tickets/$TICKET_ID" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

if echo "$RESPONSE" | jq -e '.status == "RESOLVED"' >/dev/null; then
  echo "  ✅ Cliente verificou que o ticket ID: $TICKET_ID está com status RESOLVED."
else
  echo "  ❌ Erro ao verificar status final do ticket do cliente. Resposta: $RESPONSE"
  exit 1
fi
echo "------------------------------------------------------------------"

echo "--- Teste de Fluxo do Módulo de Suporte Concluído com Sucesso! ---"