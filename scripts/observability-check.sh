#!/usr/bin/env bash

# Pequeno script de validação de observabilidade (curl-based).
# Ajuste BACKEND_HOST:PORT para seu ambiente.

BACKEND_HOST="${BACKEND_HOST:-localhost:3000}"

echo "== Health liveness =="
curl -fsS "http://${BACKEND_HOST}/health/liveness" || exit 1
echo

echo "== Health readiness =="
curl -fsS "http://${BACKEND_HOST}/health/readiness" || exit 1
echo

echo "== Metrics head =="
curl -fsS "http://${BACKEND_HOST}/metrics/prometheus" | head -n 20
echo

echo "== OK =="
