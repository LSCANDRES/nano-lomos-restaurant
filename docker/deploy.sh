#!/bin/bash
# ==========================================
# NANLOMO - Script de Deploy
# ==========================================
# Ejecutar: chmod +x deploy.sh && ./deploy.sh

set -e

cd /data/nanlomo

echo "🚀 Desplegando NANLOMO..."
echo "========================="

# Cargar variables de entorno
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Variables de entorno cargadas"
else
    echo "❌ ERROR: No se encontró el archivo .env"
    exit 1
fi

# Login en Docker Hub
echo ""
echo "🔐 Iniciando sesión en Docker Hub..."
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
echo "✅ Login exitoso"

# Pull de imágenes
echo ""
echo "📥 Descargando imágenes..."
docker pull mambru94/nanlomo-backend:latest
docker pull mambru94/nanlomo-frontend:latest
echo "✅ Imágenes descargadas"

# Detener contenedores existentes (si los hay)
echo ""
echo "🛑 Deteniendo contenedores existentes..."
docker compose down 2>/dev/null || true

# Levantar contenedores
echo ""
echo "🐳 Levantando contenedores..."
docker compose up -d

# Esperar a que estén listos
echo ""
echo "⏳ Esperando que los servicios estén listos..."
sleep 5

# Verificar estado
echo ""
echo "📊 Estado de los contenedores:"
docker compose ps

# Health check
echo ""
echo "🏥 Verificando salud del backend..."
sleep 3
curl -s http://localhost:3002/api/health && echo " ✅ Backend OK" || echo " ❌ Backend no responde"

# Limpiar imágenes viejas
echo ""
echo "🧹 Limpiando imágenes antiguas..."
docker image prune -f

echo ""
echo "🎉 ¡Despliegue completado!"
echo ""
echo "📌 URLs:"
echo "   - Frontend: https://nanolomos.cals.com.ar"
echo "   - Backend API: https://nanolomos.cals.com.ar/api"
echo ""
echo "📝 Comandos útiles:"
echo "   - Ver logs: docker compose logs -f"
echo "   - Reiniciar: docker compose restart"
echo "   - Detener: docker compose down"
