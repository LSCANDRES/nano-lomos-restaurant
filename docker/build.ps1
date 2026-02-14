# ==========================================
# NANLOMO - Build & Push Docker Images (PowerShell)
# ==========================================

param(
    [string]$Version = "latest"
)

$ErrorActionPreference = "Stop"

# Configuración
$DOCKER_USER = "mambru94"

Write-Host "🚀 Building NANLOMO Docker Images (version: $Version)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Obtener directorio base
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Build Backend
Write-Host ""
Write-Host "📦 Building Backend..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\backend"
docker build -t "$DOCKER_USER/nanlomo-backend:$Version" .
docker tag "$DOCKER_USER/nanlomo-backend:$Version" "$DOCKER_USER/nanlomo-backend:latest"

# Build Frontend
Write-Host ""
Write-Host "📦 Building Frontend..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
docker build -t "$DOCKER_USER/nanlomo-frontend:$Version" .
docker tag "$DOCKER_USER/nanlomo-frontend:$Version" "$DOCKER_USER/nanlomo-frontend:latest"

Write-Host ""
Write-Host "✅ Build completado!" -ForegroundColor Green
Write-Host ""

# Push to Docker Hub
$pushConfirm = Read-Host "¿Desea hacer push a Docker Hub? (y/n)"
if ($pushConfirm -eq "y" -or $pushConfirm -eq "Y") {
    Write-Host ""
    Write-Host "📤 Pushing to Docker Hub..." -ForegroundColor Yellow
    docker push "$DOCKER_USER/nanlomo-backend:$Version"
    docker push "$DOCKER_USER/nanlomo-backend:latest"
    docker push "$DOCKER_USER/nanlomo-frontend:$Version"
    docker push "$DOCKER_USER/nanlomo-frontend:latest"
    Write-Host ""
    Write-Host "✅ Push completado!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Proceso finalizado!" -ForegroundColor Green
Write-Host ""
Write-Host "Para desplegar en el servidor:" -ForegroundColor Cyan
Write-Host "  1. Copia docker/docker-compose.yml a /data/nanlomo/" -ForegroundColor White
Write-Host "  2. Copia docker/.env.example a /data/nanlomo/.env y configura" -ForegroundColor White
Write-Host "  3. Copia docker/nginx/nanlomo.conf a /data/nginx/conf.d/" -ForegroundColor White
Write-Host "  4. Ejecuta: cd /data/nanlomo; docker-compose pull; docker-compose up -d" -ForegroundColor White

# Volver al directorio original
Set-Location $ScriptDir
