#!/usr/bin/env bash
# ====================================================================
# Script de aprovisionamiento automatizado para nuevos restaurantes / locales
# ====================================================================

set -e

CONFIG_FILE="${1:-restaurant.config.yaml}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=========================================================="
echo " 🚀 Nano Lomos / Provisionador Multi-Restaurante (Linux)"
echo "=========================================================="

if [ ! -f "$PROJECT_ROOT/$CONFIG_FILE" ]; then
  echo "Error: No se encontró el archivo $CONFIG_FILE"
  exit 1
fi

echo "Leyendo configuración de $CONFIG_FILE..."

# Extraer variables con grep/sed
REST_ID=$(grep -E '^\s*id:' "$PROJECT_ROOT/$CONFIG_FILE" | head -1 | awk -F: '{print $2}' | tr -d ' "')
REST_ID="${REST_ID:-restaurante}"

DB_NAME=$(grep -E '^\s*name:' "$PROJECT_ROOT/$CONFIG_FILE" | head -2 | tail -1 | awk -F: '{print $2}' | tr -d ' "')
DB_NAME="${DB_NAME:-NANOLOMOS}"

DB_HOST=$(grep -E '^\s*host:' "$PROJECT_ROOT/$CONFIG_FILE" | head -1 | awk -F: '{print $2}' | tr -d ' "')
DB_HOST="${DB_HOST:-localhost}"

DB_PORT=$(grep -E '^\s*port:' "$PROJECT_ROOT/$CONFIG_FILE" | head -1 | awk -F: '{print $2}' | tr -d ' "')
DB_PORT="${DB_PORT:-5433}"

DB_USER=$(grep -E '^\s*user:' "$PROJECT_ROOT/$CONFIG_FILE" | head -1 | awk -F: '{print $2}' | tr -d ' "')
DB_USER="${DB_USER:-postgres}"

DB_PASS=$(grep -E '^\s*password:' "$PROJECT_ROOT/$CONFIG_FILE" | head -1 | awk -F: '{print $2}' | tr -d ' "')
DB_PASS="${DB_PASS:-dev1234}"

BACKEND_PORT=$(grep -E '^\s*backendPort:' "$PROJECT_ROOT/$CONFIG_FILE" | head -1 | awk -F: '{print $2}' | tr -d ' "')
BACKEND_PORT="${BACKEND_PORT:-3007}"

FRONTEND_PORT=$(grep -E '^\s*frontendPort:' "$PROJECT_ROOT/$CONFIG_FILE" | head -1 | awk -F: '{print $2}' | tr -d ' "')
FRONTEND_PORT="${FRONTEND_PORT:-4007}"

DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# Generar backend/.env
cat <<EOF > "$PROJECT_ROOT/backend/.env"
NODE_ENV=development
PORT=$BACKEND_PORT
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME
DATABASE_URL=$DATABASE_URL

JWT_SECRET=local-jwt-secret-${REST_ID}-min-32-chars-restaurant
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=local-refresh-secret-${REST_ID}-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=10

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:$BACKEND_PORT/api/auth/google/callback

CORS_ORIGIN=http://localhost:$FRONTEND_PORT
ALLOWED_ORIGINS=http://localhost:$FRONTEND_PORT,http://localhost:$BACKEND_PORT
WS_PING_INTERVAL=25000
WS_PING_TIMEOUT=5000
LOG_LEVEL=info
EOF

echo "✅ Creado: backend/.env"

# Generar frontend/.env.local
cat <<EOF > "$PROJECT_ROOT/frontend/.env.local"
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT/api
NEXT_PUBLIC_WS_URL=ws://localhost:$BACKEND_PORT
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
EOF

echo "✅ Creado: frontend/.env.local"
echo "🎉 Aprovisionamiento completado exitosamente."
