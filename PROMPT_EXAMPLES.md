# Ejemplos Concretos para el Prompt

Este archivo complementa `PROMPT_GITHUB_MOBILE_CICD.md` con ejemplos reales basados en la implementación de `nano-lomos-restaurant`.

---

## 1. Información del Servidor (Ejemplo Real)

```bash
# Para conectarme a mi servidor uso:
ssh server-root  # Mi alias configurado en ~/.ssh/config

# Sistema operativo del servidor:
Ubuntu 24.04.3 LTS

# Usuario que ejecutará el runner:
andres-luna  # Usuario no-root, UID 1000

# Ubicación donde instalé el runner:
/data/actions-runner

# Servicios actuales:
# Docker Compose con:
# - nanlomo-backend:3002 (Node.js + Express)
# - nanlomo-frontend:80 (React + Vite)
# - postgres-produccion:5432 (PostgreSQL database)
# - nginx-central:80/443 (Reverse proxy)
# - pgadmin:5050 (Database admin)

# Script de deploy existente:
/data/nanlomo/deploy.sh
# Contenido:
#   docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
#   docker pull mambru94/nanlomo-backend:latest
#   docker pull mambru94/nanlomo-frontend:latest
#   docker compose down && docker compose up -d
#   curl http://localhost:3002/health

# Archivo .env del servidor:
/data/nanlomo/.env
# Contiene:
#   DOCKER_USERNAME=mambru94
#   DOCKER_PASSWORD=xxxxxxxxxxxx
#   DB_PASSWORD=xxxxxxxx
#   JWT_SECRET=xxxxxxxx
```

---

## 2. Estructura del Proyecto (Ejemplo Real)

```
nano-lomos-restaurant/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Tests automáticos en PRs
│       ├── deploy-lan.yml      # Deploy a servidor LAN
│       └── pr-preview.yml      # Comentarios en PRs
├── backend/
│   ├── package.json
│   ├── Dockerfile              # Para build local
│   └── src/
│       └── server.js           # Health endpoint: GET /health
├── frontend/
│   ├── package.json
│   ├── Dockerfile              # Para build local
│   └── src/
├── docker-compose.yml          # En servidor: /data/nanlomo/
├── ecosystem.config.js         # PM2 (no usado, preferimos Docker)
├── .gitignore
├── README.md
├── GITHUB_MOBILE_WORKFLOW.md   # Guía de uso
├── DEPLOY_LAN_SETUP.md         # Configuración del runner
└── FLUJO_COMPLETO_EXPLICADO.md # Diagrama del flujo
```

---

## 3. Comandos Ejecutados (Paso a Paso)

### A. Crear Repositorio y Subir Código

```powershell
# 1. Verificar autenticación GitHub CLI
gh auth status

# 2. Crear repositorio
gh repo create nano-lomos-restaurant --public --source=. --remote=origin

# 3. Agregar archivos (evitar grandes)
git add .
# Si hay archivos .mp4 grandes:
echo "*.mp4" >> .gitignore
git rm --cached public/videos/*.mp4

# 4. Commit y push inicial
git commit -m "feat: sistema completo de restaurante NANO LOMOS"
git push -u origin 001-restaurant-system
```

### B. Instalar Runner en Servidor

```bash
# 1. Conectar al servidor
ssh server-root

# 2. Crear directorio y descargar runner
cd /data
mkdir -p actions-runner
cd actions-runner
curl -o actions-runner-linux-x64-2.331.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.331.0/actions-runner-linux-x64-2.331.0.tar.gz
tar xzf actions-runner-linux-x64-2.331.0.tar.gz

# 3. Generar token de registro (desde máquina local)
gh api -X POST repos/LSCANDRES/nano-lomos-restaurant/actions/runners/registration-token --jq .token
# Resultado: AS4PJNJOEAK2NPVOEKSPUGLJSADYW

# 4. Configurar runner (en servidor, como usuario no-root)
chown -R andres-luna:andres-luna /data/actions-runner
su - andres-luna -c "cd /data/actions-runner && ./config.sh --url https://github.com/LSCANDRES/nano-lomos-restaurant --token AS4PJNJOEAK2NPVOEKSPUGLJSADYW --name server-root-nanlomo --labels nanlomo --unattended"

# 5. Instalar como servicio systemd
cd /data/actions-runner
./svc.sh install andres-luna
./svc.sh start

# 6. Verificar estado
./svc.sh status
# Resultado: Active: active (running)

# 7. Verificar en GitHub (desde máquina local)
gh api repos/LSCANDRES/nano-lomos-restaurant/actions/runners --jq '.runners[] | {name, status, busy}'
# Resultado: {"name": "server-root-nanlomo", "status": "online", "busy": false}
```

### C. Probar Deploy Automático

```bash
# 1. Crear branch de prueba
git checkout -b test/github-mobile-workflow
echo "# Test deploy" >> README.md
git add README.md
git commit -m "test: verificar deploy automático"
git push origin test/github-mobile-workflow

# 2. Crear PR
gh pr create --title "Test: Deploy automático" --body "Prueba del flujo completo"

# 3. Hacer merge (desde terminal o GitHub Mobile)
gh pr merge --merge

# 4. Ver workflow ejecutándose
gh run list --limit 5
gh run view <run-id> --log

# 5. Verificar en servidor
ssh server-root "cd /data/nanlomo && docker ps && curl http://localhost:3002/health"
```

---

## 4. Workflow de Deploy (Ejemplo Real)

**Archivo:** `.github/workflows/deploy-lan.yml`

```yaml
name: Deploy to LAN Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted  # ← Clave: usa runner del servidor
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Navigate to project directory
        run: cd /data/nanlomo
      
      - name: Pull latest code
        run: |
          cd /data/nanlomo
          git pull origin main
      
      - name: Load environment variables
        run: |
          cd /data/nanlomo
          set -a
          source .env
          set +a
      
      - name: Pull Docker images
        run: |
          cd /data/nanlomo
          docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
          docker pull mambru94/nanlomo-backend:latest
          docker pull mambru94/nanlomo-frontend:latest
      
      - name: Restart services
        run: |
          cd /data/nanlomo
          docker compose down
          docker compose up -d
      
      - name: Wait for services
        run: sleep 10
      
      - name: Health check
        run: |
          curl -f http://localhost:3002/health || exit 1
          curl -f http://localhost:3002/api/health || exit 1
```

---

## 5. Diferencias con Enfoque Avanzado

### Enfoque Simple (Este)
```yaml
# deploy-lan.yml
jobs:
  deploy:
    runs-on: self-hosted  # Ejecuta en TU servidor
    steps:
      - run: git pull
      - run: docker pull mambru94/nanlomo-backend  # Imagen ya existe
      - run: docker compose restart
```

**NO necesita:**
- ❌ `DOCKERHUB_TOKEN` en GitHub Secrets
- ❌ `docker build` en workflow
- ❌ `docker push` en workflow

### Enfoque Avanzado (Otro proyecto)
```yaml
# build-and-deploy.yml
jobs:
  build:
    runs-on: ubuntu-latest  # Ejecuta en GitHub runners
    steps:
      - run: docker build -t mambru94/app .
      - run: docker login -u ${{ secrets.DOCKERHUB_USERNAME }} -p ${{ secrets.DOCKERHUB_TOKEN }}
      - run: docker push mambru94/app
  
  deploy:
    needs: build
    runs-on: self-hosted
    steps:
      - run: docker pull mambru94/app  # Imagen recién buildeada
      - run: docker compose restart
```

**SÍ necesita:**
- ✅ `DOCKERHUB_USERNAME` en GitHub Secrets
- ✅ `DOCKERHUB_TOKEN` en GitHub Secrets
- ✅ `docker build` y `docker push` en workflow
- ⏱️ Más tiempo (build puede tardar 5-15 minutos)

---

## 6. Verificación de Funcionamiento

```bash
# Ver runner corriendo en servidor
ssh server-root "systemctl status actions.runner.LSCANDRES-nano-lomos-restaurant.server-root-nanlomo.service"

# Ver logs del runner
ssh server-root "journalctl -u actions.runner.LSCANDRES-nano-lomos-restaurant.server-root-nanlomo.service -f"

# Ver runners registrados en GitHub
gh api repos/LSCANDRES/nano-lomos-restaurant/actions/runners

# Ver workflows recientes
gh run list --repo LSCANDRES/nano-lomos-restaurant

# Ver logs de último run
gh run view --repo LSCANDRES/nano-lomos-restaurant --log
```

---

## 7. Troubleshooting Común

### Runner aparece "offline"
```bash
# 1. Verificar servicio
ssh server-root "./svc.sh status"

# 2. Si está stopped, reiniciar
ssh server-root "./svc.sh start"

# 3. Esperar 30-60 segundos para conexión WebSocket

# 4. Verificar logs
ssh server-root "journalctl -u actions.runner.*.service -n 50"
```

### Deploy falla en health check
```bash
# 1. Verificar servicios corriendo
ssh server-root "docker ps"

# 2. Ver logs de containers
ssh server-root "docker logs nanlomo-backend"
ssh server-root "docker logs nanlomo-frontend"

# 3. Probar health endpoint manualmente
ssh server-root "curl http://localhost:3002/health"
```

### Runner rechaza ejecutar con sudo
```bash
# Error: "Must not run with sudo"
# Solución: Usar usuario no-root

# MAL:
sudo ./config.sh ...

# BIEN:
chown -R andres-luna:andres-luna /data/actions-runner
su - andres-luna -c "./config.sh ..."
```

---

## 8. Resumen de Archivos Creados

1. **`.github/workflows/ci.yml`** - Tests automáticos
2. **`.github/workflows/deploy-lan.yml`** - Deploy automático
3. **`.github/workflows/pr-preview.yml`** - Comentarios en PRs
4. **`ecosystem.config.js`** - PM2 config (opcional, no usado)
5. **`GITHUB_MOBILE_WORKFLOW.md`** - Guía de uso móvil
6. **`DEPLOY_LAN_SETUP.md`** - Configuración runner
7. **`FLUJO_COMPLETO_EXPLICADO.md`** - Diagrama del proceso

**Total:** 7 archivos nuevos + instalación de runner

---

## 9. Tiempo Total de Implementación

- ✅ Crear repositorio y push: **5 minutos**
- ✅ Crear workflows: **10 minutos**
- ✅ Instalar runner en servidor: **15 minutos**
- ✅ Documentación: **10 minutos**
- ✅ Pruebas y verificación: **10 minutos**

**TOTAL: ~50 minutos** para tener todo funcionando.
