# 🖥️ Deploy Automático a Servidor LAN

## 📋 Requisitos Previos

1. **Servidor Windows/Linux en tu LAN**
2. **Node.js instalado**
3. **PM2 instalado** (opcional pero recomendado)
4. **Git instalado**

---

## 🚀 Configuración del Self-Hosted Runner

### Paso 1: Ir a configuración del repositorio

1. Abre tu repo en GitHub: https://github.com/LSCANDRES/nano-lomos-restaurant
2. Ve a **Settings** → **Actions** → **Runners**
3. Click en **New self-hosted runner**
4. Selecciona tu sistema operativo (Windows/Linux)

### Paso 2: En tu servidor LAN ejecuta:

#### **Windows (PowerShell como Administrador):**

```powershell
# Crear directorio para el runner
mkdir actions-runner; cd actions-runner

# Descargar el runner
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip -OutFile actions-runner-win-x64-2.311.0.zip

# Extraer
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.311.0.zip", "$PWD")

# Configurar (GitHub te dará el token)
./config.cmd --url https://github.com/LSCANDRES/nano-lomos-restaurant --token TU_TOKEN_AQUI

# Instalar como servicio (opcional pero recomendado)
./svc.sh install
./svc.sh start
```

#### **Linux:**

```bash
# Crear directorio para el runner
mkdir actions-runner && cd actions-runner

# Descargar
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extraer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configurar
./config.sh --url https://github.com/LSCANDRES/nano-lomos-restaurant --token TU_TOKEN_AQUI

# Instalar como servicio
sudo ./svc.sh install
sudo ./svc.sh start
```

### Paso 3: Verificar que esté corriendo

En GitHub → Settings → Actions → Runners deberías ver tu runner **🟢 Online**

---

## 🎯 Configurar PM2 (Recomendado)

### Instalar PM2:

```bash
npm install -g pm2
```

### Iniciar aplicación con PM2:

```bash
cd "D:\Archivos Frecuentes\restaurante"

# Iniciar ambos servicios
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs

# Reiniciar
pm2 restart all

# Detener
pm2 stop all
```

### Configurar PM2 para iniciar con Windows:

```powershell
# Generar script de startup
pm2 startup

# Guardar configuración actual
pm2 save
```

---

## 🔐 Configurar Secrets en GitHub

Tu servidor necesita acceso a la base de datos. Configura secrets:

1. GitHub → Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Agrega estos secrets:

```
DB_HOST = 192.168.100.35
DB_PORT = 5433
DB_USER = postgres
DB_PASSWORD = tu_password_aqui
DB_NAME = NANOLOMOS
JWT_SECRET = tu_jwt_secret_aqui
```

---

## 🎮 Cómo usar el Deploy Automático

### Flujo normal (automático):

```bash
# 1. Hacer cambios
git add .
git commit -m "feat: nueva funcionalidad"
git push

# 2. Crear PR desde terminal o GitHub Mobile
gh pr create --title "Nueva feature" --base main

# 3. Revisar en GitHub Mobile
# ... revisas el código ...

# 4. Hacer merge desde GitHub Mobile
# ... tap en Merge ...

# 5. ¡Deploy automático comienza! 🚀
# Recibirás notificación en GitHub Mobile cuando termine
```

### Deploy manual desde GitHub Mobile:

1. Abre GitHub Mobile
2. Ve a **Actions**
3. Selecciona **CD - Deploy a Servidor LAN**
4. Tap en **Run workflow**
5. Selecciona rama `main`
6. Tap **Run workflow** ✅

---

## 📱 Monitoreo desde GitHub Mobile

### Ver estado del deploy:

1. Abre GitHub Mobile
2. Ve a tu repositorio
3. Tab **Actions**
4. Verás los workflows corriendo en tiempo real
5. Tap en un workflow para ver los logs

### Errores:

Si algo falla, recibirás notificación y podrás ver:
- ❌ Qué paso falló
- 📝 Logs completos
- 🔄 Opción de re-run

---

## 🛠️ Comandos útiles en el servidor

### Verificar que todo corre:

```powershell
# Ver procesos PM2
pm2 status

# Ver logs en tiempo real
pm2 logs nano-lomos-backend
pm2 logs nano-lomos-frontend

# Verificar puertos
netstat -ano | findstr "3002 3010"

# Reiniciar un servicio específico
pm2 restart nano-lomos-backend

# Ver métricas
pm2 monit
```

### Health checks manuales:

```powershell
# Backend
Invoke-RestMethod http://localhost:3002/health

# Frontend
Invoke-WebRequest http://localhost:3010 | Select-Object StatusCode
```

---

## 🔄 Alternativa: Deploy con Docker

Si prefieres usar Docker en tu servidor LAN:

```powershell
# Detener contenedores
cd "D:\Archivos Frecuentes\restaurante\docker"
docker-compose down

# Actualizar código (ya hecho por el runner)
# git pull origin main

# Rebuild y levantar
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

Modificarías el workflow para usar Docker en lugar de PM2.

---

## 🆘 Troubleshooting

### Runner no se conecta:

```powershell
# Ver logs del runner
cd actions-runner
Get-Content _diag/*.log -Tail 50
```

### Deploy falla:

1. Verifica que el runner esté online (GitHub → Settings → Actions → Runners)
2. Chequea que PM2 esté instalado: `pm2 --version`
3. Verifica permisos del runner en el directorio
4. Revisa logs: `pm2 logs`

### Puerto ocupado:

```powershell
# Ver qué usa el puerto 3002
netstat -ano | findstr "3002"

# Matar proceso
taskkill /PID [PID_NUMBER] /F
```

---

## 📊 Estructura de Logs

Los logs se guardan en:

```
D:\Archivos Frecuentes\restaurante\
├── logs/
│   ├── deploy-2026-02-14-120000.log
│   ├── backend-error.log
│   ├── backend-out.log
│   ├── frontend-error.log
│   └── frontend-out.log
```

---

## 🎉 ¡Todo listo!

Ahora cada vez que hagas merge a `main`:
1. 📱 GitHub te notifica en el móvil
2. 🤖 Runner ejecuta el deploy automáticamente
3. 📦 Actualiza código
4. 🔨 Hace build
5. 🚀 Reinicia servicios
6. ✅ Te notifica cuando termina

**Acceso:**
- Frontend LAN: http://192.168.X.X:3010
- Backend LAN: http://192.168.X.X:3002

¡Desarrollo profesional en tu red local! 🚀
