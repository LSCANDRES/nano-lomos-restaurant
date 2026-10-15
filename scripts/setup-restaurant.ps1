<#
.SYNOPSIS
  Script de aprovisionamiento automatizado para nuevos restaurantes / locales.
.DESCRIPTION
  Lee restaurant.config.yaml y genera los archivos de entorno (.env),
  actualiza el esquema, y opcionalmente inicializa la base de datos y mesas.
.EXAMPLE
  .\scripts\setup-restaurant.ps1
  .\scripts\setup-restaurant.ps1 -InitDb
#>

[CmdletBinding()]
param(
  [string]$ConfigFile = "restaurant.config.yaml",
  [switch]$InitDb
)

$ErrorActionPreference = "Stop"
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " 🚀 Nano Lomos / Provisionador Multi-Restaurante" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ConfigPath = Join-Path $ProjectRoot $ConfigFile
if (-not (Test-Path $ConfigPath)) {
  Write-Error "No se encontro el archivo de configuracion: $ConfigPath"
  exit 1
}

Write-Host "📖 Leyendo configuracion: $ConfigFile..." -ForegroundColor Gray

# Lectura y parseo básico de YAML clave: valor
$ConfigContent = Get-Content $ConfigPath -Raw

function Get-YamlValue([string]$Text, [string]$Key) {
  if ($Text -match "$Key\s*:\s*[`"']?([^`"'\r\n]+)[`"']?") {
    return $Matches[1].Trim()
  }
  return $null
}

$RestId = Get-YamlValue $ConfigContent "id"
if (-not $RestId) { $RestId = "restaurante" }

$RestName = Get-YamlValue $ConfigContent "name"
if (-not $RestName) { $RestName = "Restaurante" }

$DbName = Get-YamlValue $ConfigContent "name"  # dentro de database
if ($ConfigContent -match "database:[\s\S]*?name\s*:\s*[`"']?([^`"'\r\n]+)[`"']?") {
  $DbName = $Matches[1].Trim()
} else {
  $DbName = "DB_$($RestId.ToUpper())"
}

$DbHost = "localhost"
if ($ConfigContent -match "database:[\s\S]*?host\s*:\s*[`"']?([^`"'\r\n]+)[`"']?") {
  $DbHost = $Matches[1].Trim()
}

$DbPort = "5433"
if ($ConfigContent -match "database:[\s\S]*?port\s*:\s*[`"']?([^`"'\r\n]+)[`"']?") {
  $DbPort = $Matches[1].Trim()
}

$DbUser = "postgres"
if ($ConfigContent -match "database:[\s\S]*?user\s*:\s*[`"']?([^`"'\r\n]+)[`"']?") {
  $DbUser = $Matches[1].Trim()
}

$DbPass = "dev1234"
if ($ConfigContent -match "database:[\s\S]*?password\s*:\s*[`"']?([^`"'\r\n]+)[`"']?") {
  $DbPass = $Matches[1].Trim()
}

$BackendPort = "3007"
if ($ConfigContent -match "backendPort\s*:\s*[`"']?([^`"'\r\n]+)[`"']?") {
  $BackendPort = $Matches[1].Trim()
}

$FrontendPort = "4007"
if ($ConfigContent -match "frontendPort\s*:\s*[`"']?([^`"'\r\n]+)[`"']?") {
  $FrontendPort = $Matches[1].Trim()
}

Write-Host "✅ Restaurante: $RestName ($RestId)" -ForegroundColor Green
Write-Host "✅ Base de datos objetivo: $DbName en $DbHost:$DbPort" -ForegroundColor Green
Write-Host "✅ Puertos: Backend=$BackendPort, Frontend=$FrontendPort" -ForegroundColor Green

# 1. Generar backend .env
$BackendEnvPath = Join-Path $ProjectRoot "backend\.env"
$DatabaseUrl = "postgresql://${DbUser}:${DbPass}@${DbHost}:${DbPort}/${DbName}?schema=public"

$BackendEnvContent = @"
NODE_ENV=development
PORT=$BackendPort

DB_HOST=$DbHost
DB_PORT=$DbPort
DB_USER=$DbUser
DB_PASSWORD=$DbPass
DB_NAME=$DbName
DATABASE_URL=$DatabaseUrl

JWT_SECRET=local-jwt-secret-$RestId-min-32-chars-long-restaurant
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=local-refresh-secret-$RestId-min-32-chars-restaurant
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_ROUNDS=10

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:$BackendPort/api/auth/google/callback

CORS_ORIGIN=http://localhost:$FrontendPort
ALLOWED_ORIGINS=http://localhost:$FrontendPort,http://localhost:$BackendPort
WS_PING_INTERVAL=25000
WS_PING_TIMEOUT=5000
LOG_LEVEL=info
"@

Set-Content -Path $BackendEnvPath -Value $BackendEnvContent -Encoding UTF8
Write-Host "📝 Creado: backend/.env" -ForegroundColor Green

# 2. Generar frontend/.env.local
$FrontendEnvPath = Join-Path $ProjectRoot "frontend\.env.local"
$FrontendEnvContent = @"
NEXT_PUBLIC_API_URL=http://localhost:$BackendPort/api
NEXT_PUBLIC_WS_URL=ws://localhost:$BackendPort
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
"@

Set-Content -Path $FrontendEnvPath -Value $FrontendEnvContent -Encoding UTF8
Write-Host "📝 Creado: frontend/.env.local" -ForegroundColor Green

# 3. Inicialización opcional de Base de Datos
if ($InitDb) {
  Write-Host "⚡ Inicializando base de datos y Prisma..." -ForegroundColor Yellow
  Push-Location (Join-Path $ProjectRoot "backend")
  try {
    npm run prisma:generate
    npm run prisma:migrate
    npm run prisma:seed
    Write-Host "🎉 Base de datos configurada y seeded exitosamente!" -ForegroundColor Green
  } finally {
    Pop-Location
  }
}

Write-Host "`n✅ Aprovisionamiento completado. Listo para iniciar desarrollo o despliegue." -ForegroundColor Cyan
