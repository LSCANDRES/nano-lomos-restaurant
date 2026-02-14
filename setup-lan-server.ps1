# Script de instalación rápida para servidor LAN
# Ejecutar como Administrador en PowerShell

Write-Host "🚀 Instalación de NANO LOMOS - Deploy Automático" -ForegroundColor Green
Write-Host ""

# Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js instalado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js no encontrado. Instálalo primero: https://nodejs.org" -ForegroundColor Red
    exit 1
}

# Instalar PM2
Write-Host ""
Write-Host "📦 Instalando PM2..." -ForegroundColor Yellow
npm install -g pm2
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PM2 instalado correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error instalando PM2" -ForegroundColor Red
    exit 1
}

# Configurar PM2 startup
Write-Host ""
Write-Host "🔧 Configurando PM2 para inicio automático..." -ForegroundColor Yellow
pm2 startup

Write-Host ""
Write-Host "✅ Instalación base completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Instalar GitHub Actions Runner (ver DEPLOY_LAN_SETUP.md)"
Write-Host "2. Configurar secrets en GitHub"
Write-Host "3. Ejecutar: pm2 start ecosystem.config.js"
Write-Host "4. Ejecutar: pm2 save"
Write-Host ""
Write-Host "📚 Documentación completa: DEPLOY_LAN_SETUP.md" -ForegroundColor Yellow
