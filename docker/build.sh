#!/bin/bash
# ==========================================
# NANLOMO - Build & Push Docker Images
# ==========================================

set -e

# Configuración
DOCKER_USER="mambru94"
VERSION=${1:-latest}

echo "🚀 Building NANLOMO Docker Images (version: $VERSION)"
echo "=================================================="

# Build Backend
echo ""
echo "📦 Building Backend..."
cd ../backend
docker build -t $DOCKER_USER/nanlomo-backend:$VERSION .
docker tag $DOCKER_USER/nanlomo-backend:$VERSION $DOCKER_USER/nanlomo-backend:latest

# Build Frontend
echo ""
echo "📦 Building Frontend..."
cd ../frontend
docker build -t $DOCKER_USER/nanlomo-frontend:$VERSION .
docker tag $DOCKER_USER/nanlomo-frontend:$VERSION $DOCKER_USER/nanlomo-frontend:latest

echo ""
echo "✅ Build completado!"
echo ""

# Push to Docker Hub
read -p "¿Desea hacer push a Docker Hub? (y/n): " push_confirm
if [ "$push_confirm" = "y" ] || [ "$push_confirm" = "Y" ]; then
    echo ""
    echo "📤 Pushing to Docker Hub..."
    docker push $DOCKER_USER/nanlomo-backend:$VERSION
    docker push $DOCKER_USER/nanlomo-backend:latest
    docker push $DOCKER_USER/nanlomo-frontend:$VERSION
    docker push $DOCKER_USER/nanlomo-frontend:latest
    echo ""
    echo "✅ Push completado!"
fi

echo ""
echo "🎉 Proceso finalizado!"
echo ""
echo "Para desplegar en el servidor:"
echo "  1. Copia docker/docker-compose.yml a /data/nanlomo/"
echo "  2. Copia docker/.env.example a /data/nanlomo/.env y configura"
echo "  3. Copia docker/nginx/nanlomo.conf a /data/nginx/conf.d/"
echo "  4. Ejecuta: cd /data/nanlomo && docker-compose pull && docker-compose up -d"
