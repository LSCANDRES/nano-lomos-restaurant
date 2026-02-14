# Build & Push Docker Images
param(
    [string]$Version = "latest",
    [switch]$NoPush
)

$ErrorActionPreference = "Stop"
$DOCKER_USER = "mambru94"

Write-Host "Building NANLOMO Docker Images (version: $Version)" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Build Backend
Write-Host "`nBuilding Backend..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\backend"
docker build -t "$DOCKER_USER/nanlomo-backend:$Version" .
if ($Version -ne "latest") {
    docker tag "$DOCKER_USER/nanlomo-backend:$Version" "$DOCKER_USER/nanlomo-backend:latest"
}

# Build Frontend
Write-Host "`nBuilding Frontend..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
docker build -t "$DOCKER_USER/nanlomo-frontend:$Version" .
if ($Version -ne "latest") {
    docker tag "$DOCKER_USER/nanlomo-frontend:$Version" "$DOCKER_USER/nanlomo-frontend:latest"
}

Write-Host "`nBuild completado!" -ForegroundColor Green

# Push to Docker Hub
if (-not $NoPush) {
    Write-Host "`nPushing to Docker Hub..." -ForegroundColor Yellow
    docker push "$DOCKER_USER/nanlomo-backend:$Version"
    if ($Version -ne "latest") {
        docker push "$DOCKER_USER/nanlomo-backend:latest"
    }
    docker push "$DOCKER_USER/nanlomo-frontend:$Version"
    if ($Version -ne "latest") {
        docker push "$DOCKER_USER/nanlomo-frontend:latest"
    }
    Write-Host "`nPush completado!" -ForegroundColor Green
}

Write-Host "`nProceso finalizado!" -ForegroundColor Green
Write-Host "`nImagenes creadas:" -ForegroundColor Cyan
Write-Host "  - $DOCKER_USER/nanlomo-backend:$Version"
Write-Host "  - $DOCKER_USER/nanlomo-frontend:$Version"
Write-Host "`nSiguiente paso: git push origin master" -ForegroundColor Yellow

Set-Location $ScriptDir
