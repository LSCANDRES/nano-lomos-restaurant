# Script de Despliegue a Producción - Windows PowerShell
# MI_APP

Write-Host "🚀 Iniciando despliegue a producción..." -ForegroundColor Green
Write-Host ""

# Navegar a la carpeta docker
Set-Location docker

# Detener contenedores existentes
Write-Host "⏹️  Deteniendo contenedores existentes..." -ForegroundColor Yellow
docker-compose down

# Construir y levantar contenedores
Write-Host ""
Write-Host "🏗️  Construyendo imágenes..." -ForegroundColor Cyan
docker-compose build --no-cache

Write-Host ""
Write-Host "🚀 Levantando contenedores..." -ForegroundColor Green
docker-compose up -d

Write-Host ""
Write-Host "✅ Despliegue completado!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Estado de los contenedores:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "📝 Ver logs:" -ForegroundColor Yellow
Write-Host "   Backend:  docker logs -f mi-app-backend"
Write-Host "   Frontend: docker logs -f mi-app-frontend"
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Magenta
Write-Host "   Frontend: https://MI_DOMINIO"
Write-Host "   Backend:  https://MI_DOMINIO/api"
