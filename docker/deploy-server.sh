#!/bin/bash
# ==========================================
# NANLOMO - Script de Despliegue en Servidor
# ==========================================
# Ejecutar como root en el servidor 192.168.100.35

set -e

DOMAIN="nanolomos.cals.com.ar"
EMAIL="admin@cals.com.ar"  # Cambiar por tu email para certbot

echo "🚀 Desplegando NANLOMO en $DOMAIN"
echo "=================================="

# 1. Crear directorios
echo ""
echo "📁 Creando directorios..."
mkdir -p /data/nanlomo
mkdir -p /data/nginx/conf.d
mkdir -p /var/www/certbot

# 2. Crear .env si no existe
if [ ! -f /data/nanlomo/.env ]; then
    echo ""
    echo "📝 Creando archivo .env..."
    cat > /data/nanlomo/.env << 'EOF'
# Database
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=dev1234
DB_NAME=NANOLOMOS

# JWT & Security
JWT_SECRET=nanolomos_super_secret_key_2026_production
JWT_EXPIRES_IN=30m
SESSION_TIMEOUT_MINUTES=30
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGIN=https://nanolomos.cals.com.ar

# WebSocket
WS_PING_INTERVAL=25000
WS_PING_TIMEOUT=5000

# Logging
LOG_LEVEL=info
EOF
    echo "⚠️  IMPORTANTE: Edita /data/nanlomo/.env con tus credenciales reales"
fi

# 3. Copiar docker-compose.yml (asumiendo que ya está en /data/nanlomo/)
echo ""
echo "📦 Verificando docker-compose.yml..."
if [ ! -f /data/nanlomo/docker-compose.yml ]; then
    echo "❌ ERROR: Falta /data/nanlomo/docker-compose.yml"
    echo "   Copia el archivo desde tu PC con scp"
    exit 1
fi

# 4. Copiar configuración nginx temporal (sin SSL)
echo ""
echo "🌐 Configurando nginx temporal (sin SSL)..."
cp /data/nanlomo/nanlomo-temp-no-ssl.conf /data/nginx/conf.d/nanlomo.conf 2>/dev/null || \
    echo "⚠️  Copia nanlomo-temp-no-ssl.conf a /data/nanlomo/ primero"

# 5. Pull y levantar contenedores
echo ""
echo "🐳 Descargando e iniciando contenedores..."
cd /data/nanlomo
docker-compose pull
docker-compose up -d

# 6. Esperar a que los contenedores estén listos
echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 10

# 7. Recargar nginx del host
echo ""
echo "🔄 Recargando nginx del host..."
docker exec nginx nginx -s reload 2>/dev/null || \
    systemctl reload nginx 2>/dev/null || \
    nginx -s reload 2>/dev/null || \
    echo "⚠️  Recarga nginx manualmente"

# 8. Generar certificado SSL
echo ""
echo "🔐 Generando certificado SSL con certbot..."
certbot certonly --webroot \
    -w /var/www/certbot \
    -d $DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --non-interactive

# 9. Copiar configuración nginx con SSL
echo ""
echo "🌐 Aplicando configuración nginx con SSL..."
cp /data/nanlomo/nanlomo.conf /data/nginx/conf.d/nanlomo.conf

# 10. Recargar nginx
echo ""
echo "🔄 Recargando nginx con SSL..."
docker exec nginx nginx -s reload 2>/dev/null || \
    systemctl reload nginx 2>/dev/null || \
    nginx -s reload 2>/dev/null || \
    echo "⚠️  Recarga nginx manualmente"

# 11. Verificar
echo ""
echo "✅ Verificando servicios..."
docker-compose ps
echo ""
curl -s http://localhost:3002/api/health && echo " - Backend OK" || echo " - Backend ERROR"

echo ""
echo "🎉 ¡Despliegue completado!"
echo ""
echo "📌 Accede a: https://$DOMAIN"
echo ""
echo "Comandos útiles:"
echo "  - Ver logs: cd /data/nanlomo && docker-compose logs -f"
echo "  - Reiniciar: cd /data/nanlomo && docker-compose restart"
echo "  - Actualizar: cd /data/nanlomo && docker-compose pull && docker-compose up -d"
