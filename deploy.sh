#!/bin/bash

# Script de Despliegue a Producción
# MI_APP

echo "🚀 Iniciando despliegue a producción..."
echo ""

# Navegar a la carpeta docker
cd docker

# Detener contenedores existentes
echo "⏹️  Deteniendo contenedores existentes..."
docker-compose down

# Construir y levantar contenedores
echo ""
echo "🏗️  Construyendo imágenes..."
docker-compose build --no-cache

echo ""
echo "🚀 Levantando contenedores..."
docker-compose up -d

echo ""
echo "✅ Despliegue completado!"
echo ""
echo "📊 Estado de los contenedores:"
docker-compose ps

echo ""
echo "📝 Ver logs:"
echo "   Backend:  docker logs -f mi-app-backend"
echo "   Frontend: docker logs -f mi-app-frontend"
echo ""
echo "🌐 URLs:"
echo "   Frontend: https://MI_DOMINIO"
echo "   Backend:  https://MI_DOMINIO/api"
