#!/bin/bash
# ==========================================
# NANLOMO - Build & Push Docker Images
# ==========================================

set -e

# Configuración
DOCKER_USER="mambru94"
VERSION="${1:-latest}"
NO_PUSH="${2:-false}"

echo "🚀 Building NANLOMO Docker Images (version: $VERSION)"
echo "=================================================="

# Obtener directorio base
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Build Backend
echo ""
echo "📦 Building Backend..."
cd "$PROJECT_ROOT/backend"
docker build -t "$DOCKER_USER/nanlomo-backend:$VERSION" .
if [ "$VERSION" != "latest" ]; then
    docker tag "$DOCKER_USER/nanlomo-backend:$VERSION" "$DOCKER_USER/nanlomo-backend:latest"
fi

# Build Frontend
echo ""
echo "📦 Building Frontend..."
cd "$PROJECT_ROOT/frontend"
docker build -t "$DOCKER_USER/nanlomo-frontend:$VERSION" .
if [ "$VERSION" != "latest" ]; then
    docker tag "$DOCKER_USER/nanlomo-frontend:$VERSION" "$DOCKER_USER/nanlomo-frontend:latest"
fi

echo ""
echo "✅ Build completado!"

# Push to Docker Hub
if [ "$NO_PUSH" != "true" ]; then
    echo ""
    echo "📤 Pushing to Docker Hub..."
    docker push "$DOCKER_USER/nanlomo-backend:$VERSION"
    if [ "$VERSION" != "latest" ]; then
        docker push "$DOCKER_USER/nanlomo-backend:latest"
    fi
    docker push "$DOCKER_USER/nanlomo-frontend:$VERSION"
    if [ "$VERSION" != "latest" ]; then
        docker push "$DOCKER_USER/nanlomo-frontend:latest"
    fi
    echo ""
    echo "✅ Push completado!"
fi

echo ""
echo "🎉 Proceso finalizado!"
echo ""
echo "Imágenes creadas:"
echo "  - $DOCKER_USER/nanlomo-backend:$VERSION"
echo "  - $DOCKER_USER/nanlomo-frontend:$VERSION"
echo ""
echo "Siguiente paso: git push origin master (dispara deploy automático)"
