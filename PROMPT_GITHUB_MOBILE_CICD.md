# Prompt para Configurar GitHub Mobile Workflow + CI/CD + Self-Hosted Runner
## ENFOQUE: Deploy Simple con Docker Hub + Self-Hosted Runner

## Requerimiento Principal

Necesito configurar un workflow profesional de desarrollo que me permita trabajar desde cualquier lugar, incluyendo desde mi móvil, con despliegue automático a mi servidor privado local.

## 🚨 IMPORTANTE - Flujo Específico que Debes Implementar

### Arquitectura de Deploy:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE BUILD Y DEPLOY                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. BUILD DE IMÁGENES (FUERA de GitHub Actions):                   │
│     ├─ Desarrollo local: docker build -t mi-usuario/mi-app .       │
│     ├─ Push manual: docker push mi-usuario/mi-app:latest           │
│     └─ O CI separado (Jenkins, GitLab CI, etc.)                    │
│                                                                     │
│  2. IMÁGENES QUEDAN EN DOCKER HUB:                                  │
│     ├─ mi-usuario/mi-app-backend:latest                            │
│     └─ mi-usuario/mi-app-frontend:latest                           │
│                                                                     │
│  3. DEPLOY DESDE GITHUB ACTIONS (cuando merge a main):             │
│     ├─ Runner conectado a GitHub detecta merge                     │
│     ├─ Se ejecuta en TU servidor (self-hosted)                     │
│     ├─ Ejecuta: cd /data/proyecto                                  │
│     ├─ Ejecuta: git pull origin main                               │
│     ├─ Ejecuta: source .env (carga DOCKER_USERNAME, DOCKER_PASSWORD)│
│     ├─ Ejecuta: docker login (con credenciales del .env)           │
│     ├─ Ejecuta: docker pull mi-usuario/mi-app-backend:latest       │
│     ├─ Ejecuta: docker pull mi-usuario/mi-app-frontend:latest      │
│     ├─ Ejecuta: docker compose down && docker compose up -d        │
│     └─ Ejecuta: curl http://localhost:PORT/health                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 🔑 Puntos Clave del Enfoque:

**SÍ tenemos Docker Hub:**
- ✅ Las imágenes Docker EXISTEN en Docker Hub o registry privado
- ✅ Ejemplo: `mambru94/nanlomo-backend:latest`, `mambru94/nanlomo-frontend:latest`
- ✅ El push a Docker Hub se hace MANUALMENTE o en CI separado (NO en GitHub Actions)

**Credenciales en el servidor:**
- ✅ Archivo `.env` en el servidor contiene `DOCKER_USERNAME` y `DOCKER_PASSWORD`
- ✅ El runner carga estas variables con `source .env`
- ✅ Usa esas credenciales para `docker login` y `docker pull`

**NO necesitamos GitHub Secrets:**
- ❌ NO configurar `DOCKERHUB_USERNAME` en GitHub Settings → Secrets
- ❌ NO configurar `DOCKERHUB_TOKEN` en GitHub Settings → Secrets
- ❌ NO usar `${{ secrets.ALGO }}` en workflows
- ✅ Todo está en el `.env` del servidor que el runner puede leer

**Deploy simple y rápido:**
- ✅ Deploy solo: `git pull` → `docker pull` → `docker compose restart`
- ✅ NO hace `docker build` en GitHub Actions
- ✅ NO hace `docker push` en GitHub Actions
- ✅ Deploy completo en < 2 minutos

## Contexto del Proyecto

- Tengo un proyecto de desarrollo (backend + frontend) que actualmente NO está en GitHub
- Quiero poder trabajar desde mi móvil usando GitHub Mobile App
- Mi servidor de producción está en mi red LAN privada (NO es cloud)
- Uso Docker Compose para ejecutar mis servicios en el servidor
- **YA TENGO** imágenes Docker en Docker Hub / registry (ej: `mambru94/mi-app-backend`)
- Quiero mantener prácticas profesionales de CI/CD pero de forma SIMPLE

## Objetivos Específicos

### 1. GitHub Setup
- Subir mi proyecto actual a GitHub usando GitHub CLI (`gh`)
- Crear repositorio público o privado
- Configurar `.gitignore` apropiado (excluir node_modules, .env, archivos grandes)

### 2. GitHub Mobile Workflow
Quiero poder hacer todo esto desde mi móvil:
- Crear Pull Requests
- Revisar código y cambios
- Aprobar y hacer merge de PRs
- Recibir notificaciones de deploy
- Ver estado de CI/CD checks

### 3. GitHub Actions - CI Pipeline
Necesito workflows automáticos que:
- Ejecuten tests automáticos en cada PR
- Hagan linting del código
- Construyan el proyecto para verificar que compile
- Muestren resultados en la interfaz de GitHub Mobile

### 4. GitHub Actions - CD Pipeline (Deploy Automático)
Cuando hago merge a `main`:
- Detectar automáticamente que hay nuevos cambios
- Ejecutar el deploy directamente en MI servidor LAN privado
- Actualizar el código con `git pull`
- Reconstruir servicios (Docker Compose / PM2)
- Reiniciar servicios
- Verificar que el deploy fue exitoso (health checks)
- Notificarme el resultado

### 5. Self-Hosted Runner
Como mi servidor está en mi red privada (NO en cloud):
- Instalar GitHub Actions Runner en mi servidor
- Configurarlo para que GitHub pueda enviarle jobs
- Instalarlo como servicio systemd para que corra siempre
- Asegurarme que los workflows usen `runs-on: self-hosted`

## Información de mi Servidor

```bash
# Para conectarme a mi servidor uso:
ssh [ALIAS_SSH]  # Mi alias configurado en ~/.ssh/config
# Ejemplo: ssh production-server

# Sistema operativo del servidor:
# [Ubuntu / Debian / CentOS / etc.]
# Ejemplo: Ubuntu 24.04 LTS

# Usuario que ejecutará el runner:
# [usuario-no-root]  # Ejemplo: andres-luna, deploy, ubuntu
# IMPORTANTE: NO usar root

# Ubicación donde quiero instalar el runner:
# /data/actions-runner  (o la ruta que prefieras)

# Servicios actuales:
# Docker Compose con: [lista tus servicios: backend:3000, frontend:3010, postgres:5432, nginx:80, etc.]
# Ejemplo: nanlomo-backend:3002, nanlomo-frontend:80, postgres:5432, nginx:443

# Scripts de deploy existentes:
# [Si tienes algún script, menciona la ruta completa: /data/proyecto/deploy.sh]
# Ejemplo: /data/nanlomo/deploy.sh (contiene: docker login → pull → restart)

# 🔑 IMPORTANTE - Archivo .env del servidor:
[Ruta del archivo .env: /data/proyecto/.env]
# Ejemplo: /data/nanlomo/.env

# Este archivo DEBE contener (como mínimo):
DOCKER_USERNAME=tu-usuario-dockerhub      # Ejemplo: mambru94
DOCKER_PASSWORD=tu-password-o-token       # Tu password/token de Docker Hub
DB_PASSWORD=tu-password-base-datos
JWT_SECRET=tu-jwt-secret
# (Y otras variables que necesite tu app)

# 🐳 Imágenes Docker en Docker Hub:
[Tus imágenes en Docker Hub o registry]
# Ejemplo:
#   mambru94/nanlomo-backend:latest
#   mambru94/nanlomo-frontend:latest
# Estas imágenes YA DEBEN EXISTIR (las buildeas y pusheas por separado)
```

### 📝 Notas sobre Docker Hub:

**¿Dónde están mis imágenes?**
- Docker Hub: `https://hub.docker.com/u/TU-USUARIO`
- O registry privado: `registry.ejemplo.com/tu-proyecto/*`

**¿Cómo llegaron ahí?**
- Build manual: `docker build -t mi-usuario/mi-app . && docker push mi-usuario/mi-app`
- O CI separado: Jenkins, GitLab CI, Travis, etc.
- O desde otro servidor de build

**¿El runner hace build?**
- ❌ NO - El runner solo hace `docker pull` de imágenes que YA EXISTEN
- ✅ Las imágenes se buildean FUERA de GitHub Actions

**¿Necesito Docker Hub token?**
- Para el `.env` del servidor: SÍ (para que el runner pueda hacer pull)
- Para GitHub Secrets: NO (no lo configuraremos ahí)

## Estructura de mi Proyecto

```
mi-proyecto/
├── backend/          # Node.js / Python / etc.
│   ├── package.json
│   └── src/
├── frontend/         # React / Vue / etc.
│   ├── package.json
│   └── src/
├── docker-compose.yml
└── [otros archivos]
```

## Requisitos Técnicos

1. **GitHub CLI**: Ya instalado
2. **GitHub Account**: [tu-usuario-github]
3. **GitHub Mobile App**: Disponible para iOS/Android
4. **Servidor SSH**: Accesible desde mi máquina local
5. **Docker**: Ya instalado en el servidor
6. **Node.js**: Ya instalado en el servidor (si aplica)

## Lo que Necesito que Hagas

### 1. Subir código a GitHub
- Crear el repositorio con `gh`
- Hacer commit inicial evitando archivos grandes (.mp4, .zip, node_modules)
- Configurar `.gitignore` apropiado
- Push del código

### 2. Crear GitHub Actions Workflows
- **`ci.yml`**: Tests, linting, build verification (SOLO para verificar, no para deploy)
- **`deploy-lan.yml`**: Deploy automático a servidor LAN usando self-hosted runner
- **`pr-preview.yml`**: Comentarios automáticos en PRs con información de cambios

### 3. Configurar Self-Hosted Runner
- Conectarte a mi servidor con SSH
- Descargar e instalar GitHub Actions Runner
- Configurarlo con token de mi repositorio
- Instalarlo como servicio systemd (para que corra siempre)
- Verificar que esté "online" en GitHub

### 4. Adaptar Deploy al Docker Compose (ENFOQUE SIMPLE)
El workflow debe hacer:
```bash
# 1. Ir al directorio del proyecto
cd /data/mi-proyecto

# 2. Actualizar código desde GitHub
git pull origin main

# 3. Si existe script de deploy, ejecutarlo
./deploy.sh  # Este script hace: docker login → pull images → restart

# 4. Si NO existe script, hacer manualmente:
docker compose down
docker compose up -d

# 5. Health checks
curl http://localhost:3000/health || curl http://localhost:3000/api/health
```

**NO necesita:**
- ❌ Build de imágenes Docker en GitHub Actions
- ❌ Push de imágenes a Docker Hub desde GitHub
- ❌ Configurar GitHub Secrets (credenciales ya están en .env del servidor)

### 5. Documentación
- Crear guía de uso del GitHub Mobile workflow
- Documentar el flujo completo (móvil → GitHub → servidor)
- Explicar cómo funciona la conexión entre GitHub y mi servidor LAN
- Diagrama visual ASCII del proceso

### 6. Probar el Flujo Completo
- Crear un PR de prueba con cambio menor (ej: README)
- Hacer merge desde GitHub Mobile (o web)
- Verificar que el deploy se ejecute automáticamente en el servidor
- Confirmar notificaciones de éxito

## Flujo Esperado (Resultado Final)

```
1. [MÓVIL/TERMINAL] Hago cambios en código y push a feature branch
   → git checkout -b feature/nueva-funcionalidad
   → git add . && git commit -m "feat: agregar nueva funcionalidad"
   → git push origin feature/nueva-funcionalidad

2. [MÓVIL/TERMINAL] Creo Pull Request desde terminal o móvil
   → gh pr create --title "Nueva funcionalidad" --body "Descripción"
   → O desde GitHub Mobile: + → New Pull Request

3. [GITHUB CLOUD] CI checks se ejecutan automáticamente
   → Tests backend (npm test)
   → Tests frontend (npm test)
   → Linting (eslint)
   → Build verification (npm run build)
   → Resultados visibles en PR (✅ All checks passed)

4. [MÓVIL] Reviso el PR en GitHub Mobile App
   → Veo los cambios de código (Files changed)
   → Veo los checks (✅ CI passed)
   → Leo comentarios de PR Preview bot

5. [MÓVIL] Apruebo y hago merge desde GitHub Mobile
   → Botón "Merge pull request"
   → Confirm merge

6. [GITHUB CLOUD] Detecta merge a main, dispara workflow de deploy
   → workflow: deploy-lan.yml
   → trigger: push to main
   → runs-on: self-hosted

7. [RUNNER EN SERVIDOR LAN] Recibe el job y ejecuta:
   ├── cd /data/mi-proyecto
   ├── git pull origin main
   ├── source .env  (carga credenciales locales)
   ├── docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
   ├── docker pull mi-usuario/mi-app-backend:latest
   ├── docker pull mi-usuario/mi-app-frontend:latest
   ├── docker compose down
   ├── docker compose up -d
   └── curl http://localhost:3000/health  (health check)

8. [MÓVIL] Recibo notificación de GitHub Mobile
   → "Deploy exitoso ✅" (si todo OK)
   → "Deploy failed ❌" (si hubo error, con logs)
```

**Tiempo total del flujo: ~2-5 minutos**
- CI checks: 1-3 minutos
- Deploy: 30-90 segundos (pull images + restart)

## Preguntas Importantes para Verificar Antes de Empezar

### 1. ¿Tengo imágenes Docker en Docker Hub o registry?
- ✅ **SÍ** - Puedo hacer `docker pull mi-usuario/mi-app` y funciona
- ❌ **NO** - Necesito buildear y pushear primero, o usar otro enfoque

Verifica ejecutando:
```bash
docker pull mi-usuario/mi-app-backend:latest
docker pull mi-usuario/mi-app-frontend:latest
```

Si funciona → ✅ Continuar con este prompt
Si falla → ⚠️ Primero buildea y pushea tus imágenes

### 2. ¿Tengo archivo .env en mi servidor con credenciales de Docker Hub?
- ✅ **SÍ** - Existe `/data/proyecto/.env` con `DOCKER_USERNAME` y `DOCKER_PASSWORD`
- ❌ **NO** - Debo crearlo primero

Verifica ejecutando:
```bash
ssh tu-alias "cat /data/proyecto/.env | grep DOCKER_"
# Debe mostrar:
# DOCKER_USERNAME=mi-usuario
# DOCKER_PASSWORD=***********
```

### 3. ¿Mi servidor puede acceder a GitHub.com y Docker Hub?
- ✅ **SÍ** - Puedo hacer `git pull` y `docker pull` desde el servidor
- ❌ **NO** - Revisar firewall/proxy

Verifica ejecutando:
```bash
ssh tu-alias "ping -c 2 github.com && ping -c 2 hub.docker.com"
```

### 4. ¿Tengo acceso SSH al servidor?
- ✅ **SÍ** - Puedo conectarme con `ssh mi-alias`
- ❌ **NO** - Necesito configurar acceso primero

### 5. ¿Quiero configurar GitHub Secrets?
- ❌ **NO** (recomendado para este enfoque) - Usar credenciales del `.env` del servidor
- ⚠️ **SÍ** (solo si necesitas build en GitHub) - Entonces usar enfoque avanzado

**Para este prompt, la respuesta debe ser NO.**

---

## ❌ LO QUE NO VAS A NECESITAR (Importante)

Si en el otro proyecto te pidieron esto, AQUÍ NO ES NECESARIO:

### NO necesitas configurar GitHub Secrets:
```
❌ DOCKERHUB_USERNAME en GitHub Settings → Secrets
❌ DOCKERHUB_TOKEN en GitHub Settings → Secrets  
❌ GOOGLE_CLIENT_ID en GitHub Settings → Secrets
❌ Cualquier otro secret
```

**¿Por qué no?**
- Porque las credenciales ya están en `/data/proyecto/.env` del servidor
- El runner puede leer ese archivo directamente
- No exponemos credenciales a GitHub

### NO necesitas build de Docker en workflows:
```yaml
❌ - name: Build Docker image
     run: docker build -t mi-app .

❌ - name: Push to Docker Hub
     run: docker push mi-app
```

**¿Por qué no?**
- Porque las imágenes ya existen en Docker Hub
- El runner solo hace `docker pull`, no `docker build`

### NO necesitas multiple jobs en workflows:
```yaml
❌ jobs:
     build:
       runs-on: ubuntu-latest
     deploy:
       needs: build
       runs-on: self-hosted
```

**¿Por qué no?**
- Un solo job es suficiente: deploy en self-hosted runner
- Simple y rápido

## Notas Adicionales

- El servidor está en red LAN privada (192.168.x.x / 10.x.x.x)
- GitHub NO puede iniciar conexiones a mi servidor (firewall/NAT)
- Por eso necesito Self-Hosted Runner que se conecte DESDE el servidor HACIA GitHub
- GitHub envía jobs al runner mediante WebSocket/long polling

### 🔑 Diferencia con Otros Enfoques (MUY IMPORTANTE - Lee Esto)

## ⚠️ Si en Otro Proyecto te Pidieron Configurar GitHub Secrets...

### 📋 Comparación Directa:

| Aspecto | **ESTE ENFOQUE (Simple)** | **ENFOQUE AVANZADO** |
|---------|---------------------------|----------------------|
| **Build de imágenes** | Fuera de GitHub Actions (manual o CI separado) | En GitHub Actions Cloud |
| **Docker Hub Credentials** | En `.env` del servidor | En GitHub Secrets |
| **GitHub Secrets necesarios** | ❌ NINGUNO | ✅ DOCKERHUB_USERNAME, DOCKERHUB_TOKEN, etc. |
| **Workflow complexity** | 1 job simple | 2+ jobs (build + deploy) |
| **Tiempo de deploy** | 30-90 segundos | 5-15 minutos |
| **Dónde corre el workflow** | Solo en tu servidor (self-hosted) | Parte en GitHub cloud, parte en servidor |
| **Exposición de credenciales** | Solo en tu servidor | En GitHub (aunque encrypted) |

### ❌ Enfoque Avanzado (LO QUE NO HAREMOS):

```yaml
# build-and-deploy.yml (ENFOQUE AVANZADO - NO USAR)
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest  # ← Corre en GitHub Cloud
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}  # ← Necesita Secret
          password: ${{ secrets.DOCKERHUB_TOKEN }}     # ← Necesita Secret
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          push: true
          tags: mi-usuario/mi-app:latest
  
  deploy:
    needs: build
    runs-on: self-hosted  # ← Corre en tu servidor
    steps:
      - run: docker pull mi-usuario/mi-app:latest
      - run: docker compose restart
```

**Requiere configurar en GitHub Settings → Secrets:**
- ✅ `DOCKERHUB_USERNAME`
- ✅ `DOCKERHUB_TOKEN`
- ⏱️ Build demora 5-15 minutos

---

### ✅ Nuestro Enfoque Simple (LO QUE SÍ HAREMOS):

```yaml
# deploy-lan.yml (ENFOQUE SIMPLE - USAR ESTE)
name: Deploy to LAN Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted  # ← Solo corre en tu servidor
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Navigate and pull code
        run: |
          cd /data/proyecto
          git pull origin main
      
      - name: Load environment variables from server
        run: |
          cd /data/proyecto
          set -a
          source .env  # ← Lee DOCKER_USERNAME y DOCKER_PASSWORD de aquí
          set +a
      
      - name: Login to Docker Hub
        run: |
          cd /data/proyecto
          docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD  # ← Usa vars del .env
      
      - name: Pull pre-built images
        run: |
          cd /data/proyecto
          docker pull mi-usuario/mi-app-backend:latest   # ← Imágenes YA EXISTEN
          docker pull mi-usuario/mi-app-frontend:latest
      
      - name: Restart services
        run: |
          cd /data/proyecto
          docker compose down
          docker compose up -d
      
      - name: Health check
        run: |
          sleep 10
          curl -f http://localhost:3000/health || exit 1
```

**NO requiere configurar GitHub Secrets:**
- ❌ NO `DOCKERHUB_USERNAME` en Secrets
- ❌ NO `DOCKERHUB_TOKEN` en Secrets
- ✅ Todo en `/data/proyecto/.env` del servidor
- ⚡ Deploy en 30-90 segundos

---

### 🤔 ¿Por Qué Este Enfoque y No el Avanzado?

**Ventajas del enfoque simple:**
1. ✅ **Más rápido:** No esperas 10 minutos de build
2. ✅ **Más seguro:** Credenciales nunca salen de tu servidor
3. ✅ **Más simple:** Un solo job, fácil de debuggear
4. ✅ **Menos dependencias:** No dependes de GitHub cloud runners
5. ✅ **Más flexible:** Puedes buildear imágenes cuando quieras, no en cada deploy

**Desventajas (trade-offs):**
1. ⚠️ Las imágenes deben buildearse manualmente o en CI separado
2. ⚠️ Si cambias código, debes rebuild + push antes de hacer deploy

**¿Cuándo usar el enfoque avanzado?**
- Si necesitas build AUTOMÁTICO en cada commit
- Si trabajas en equipo grande sin control de builds
- Si NO tienes acceso directo al servidor para builds
- Si NO te importa esperar 10-15 minutos por deploy

**En tu caso (servidor LAN privado), el enfoque simple es ideal.**

## Aclaraciones sobre el Flujo

### ¿Cómo funciona el Runner con GitHub?

**El runner NO escucha directamente a la rama `main`.** El flujo real es:

```
1. [TÚ] Push a main (o merge PR)
   ↓
2. [GITHUB CLOUD] Detecta el push
   ↓
3. [GITHUB CLOUD] Busca workflows con "on: push: branches: [main]"
   ↓
4. [GITHUB CLOUD] Encuentra deploy-lan.yml
   ↓
5. [GITHUB CLOUD] Lee "runs-on: self-hosted"
   ↓
6. [GITHUB CLOUD] Busca runner disponible con ese label
   ↓
7. [GITHUB CLOUD] Envía el JOB al runner (via WebSocket ya conectado)
   ↓
8. [RUNNER EN TU SERVIDOR] Recibe el job y ejecuta:
   - git pull
   - docker compose down
   - docker compose up -d
   - health checks
   ↓
9. [RUNNER] Reporta resultado (success/failure) a GitHub
   ↓
10. [TÚ] Recibes notificación en móvil: "Deploy exitoso ✅"
```

**El runner es como un "trabajador" esperando órdenes:**
- El runner se conecta a GitHub Cloud 24/7 (conexión saliente desde tu LAN)
- Le dice a GitHub: "Hola, soy 'mi-runner', tengo labels: self-hosted, linux"
- GitHub responde: "Ok, estás registrado. Cuando tenga un job para ti, te aviso"
- El runner se queda esperando (listening for jobs)
- Cuando haces push a main → GitHub dispara workflow → workflow dice "runs-on: self-hosted" → GitHub envía el job al runner
- El runner ejecuta los comandos y reporta resultados

**Por eso GitHub SÍ puede comunicarse con tu servidor LAN:**
- GitHub NO inicia conexiones a tu servidor (eso sería imposible por firewall/NAT)
- El runner inicia la conexión DESDE tu servidor HACIA GitHub (conexión saliente permitida)
- GitHub usa esa conexión ya establecida para enviar jobs cuando los necesita

---

## Comandos que Voy a Necesitar Ejecutar

Durante el proceso tendré que ejecutar estos comandos según me indiques:

```bash
# Autenticación con GitHub CLI
gh auth login

# Crear repositorio
gh repo create [nombre] --[public/private]

# Git operations
git init
git add .
git commit -m "mensaje"
git push

# SSH al servidor
ssh [mi-alias]

# Comandos en el servidor (según me indiques)
cd /ruta/deseada
mkdir -p actions-runner
curl -o ... [descargar runner]
./config.sh ...
./svc.sh install [usuario]
./svc.sh start
```

---

## Importante

- Guíame paso a paso
- Dame los comandos exactos a ejecutar
- Verifica cada paso antes de continuar
- Cuando conectes al servidor, usa `ssh [mi-alias]` para ejecutar comandos
- Al final, dame documentación clara de cómo usar el workflow desde móvil

## Resumen Ejecutivo del Enfoque

**LO QUE VAS A IMPLEMENTAR:**

1. ✅ **GitHub Repository**: Crear y subir código
2. ✅ **GitHub Actions Workflows**: CI (tests) + CD (deploy)
3. ✅ **Self-Hosted Runner**: Instalar en mi servidor como servicio
4. ✅ **Deploy automatizado**: git pull → docker pull → restart
5. ✅ **Documentación**: Guías de uso desde móvil

**LO QUE NO VAS A CONFIGURAR (porque no es necesario en este enfoque):**

1. ❌ **GitHub Secrets**: NO necesito DOCKERHUB_TOKEN ni otros secrets
   - Razón: Credenciales ya están en `/data/proyecto/.env` del servidor
   
2. ❌ **Docker Build en GitHub Actions**: NO vamos a hacer build en la nube
   - Razón: Usamos imágenes pre-buildeadas de Docker Hub
   
3. ❌ **Push a Docker Hub desde GitHub**: NO necesitamos docker push desde workflows
   - Razón: Las imágenes se construyen y suben por separado (manual o CI local)

**RESULTADO ESPERADO:**

Después de implementar esto, voy a poder:
- Hacer cambios de código desde cualquier lugar
- Crear PRs desde terminal (`gh pr create`) o GitHub Mobile
- Ver tests y verificaciones en tiempo real
- Hacer merge desde mi celular
- Ver deploy automático ejecutándose en mi servidor
- Recibir notificación de éxito/error en menos de 5 minutos

## Empecemos

Por favor configura todo el sistema completo: GitHub repository, workflows, runner installation, y documentación. Usa todos los tools necesarios para hacerlo funcional.
