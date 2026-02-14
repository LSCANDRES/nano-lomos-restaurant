# Prompt Completo: GitHub Mobile Workflow + CI/CD + Self-Hosted Runner

## 📖 Tabla de Contenido

1. [Cómo Usar Este Prompt](#cómo-usar-este-prompt)
2. [El Prompt (Copiar y Pegar)](#el-prompt-copiar-y-pegar)
3. [Ejemplos Concretos](#ejemplos-concretos)
4. [Checklist de Verificación](#checklist-de-verificación)
5. [Troubleshooting](#troubleshooting)

---

## Cómo Usar Este Prompt

### Proceso Rápido (5 pasos):

```
1. Ve a la sección "EL PROMPT (Copiar y Pegar)" más abajo
2. Modifica las secciones marcadas con [...]
3. Copia TODO el contenido del prompt
4. Pega en un nuevo chat de GitHub Copilot en tu proyecto
5. Sigue las instrucciones que Copilot te dé
```

**Tiempo total:** ~50 minutos para tener todo funcionando.

### Antes de Empezar - Información que Necesitas:

```bash
# 1. Alias SSH de tu servidor
ssh tu-alias  # Ejemplo: ssh production-server

# 2. Usuario no-root del servidor
whoami  # Ejemplo: deploy, ubuntu, andres-luna

# 3. Servicios Docker corriendo
docker ps  # Ver nombres y puertos

# 4. Imágenes Docker en Docker Hub
docker images | grep tu-usuario
# Ejemplo: mambru94/mi-app-backend:latest

# 5. Archivo .env del servidor
cat /data/proyecto/.env | grep DOCKER
# Debe tener: DOCKER_USERNAME y DOCKER_PASSWORD
```

---

# EL PROMPT (Copiar y Pegar)

> **📋 Copia desde aquí hasta el final de esta sección →**

---

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
- Hacer `docker login` con credenciales del `.env` del servidor
- Hacer `docker pull` de las imágenes pre-buildeadas
- Reconstruir servicios (Docker Compose)
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

# 3. Cargar variables del .env (DOCKER_USERNAME, DOCKER_PASSWORD)
source .env

# 4. Login a Docker Hub con credenciales del .env
docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD

# 5. Pull de imágenes pre-buildeadas
docker pull mi-usuario/mi-app-backend:latest
docker pull mi-usuario/mi-app-frontend:latest

# 6. Restart de servicios
docker compose down
docker compose up -d

# 7. Health checks
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
   ├── source .env  (carga DOCKER_USERNAME, DOCKER_PASSWORD)
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
   - cd /data/proyecto
   - git pull origin main
   - source .env
   - docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
   - docker pull imágenes
   - docker compose down && up -d
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

---

> **📋 ← Copia hasta aquí y pega en tu nuevo chat de Copilot**

---

# Ejemplos Concretos

Esta sección muestra ejemplos reales de la implementación de `nano-lomos-restaurant`.

## Ejemplo 1: Información del Servidor Real

```bash
# Alias SSH configurado:
ssh server-root

# Sistema operativo:
Ubuntu 24.04.3 LTS

# Usuario que ejecuta el runner:
andres-luna  # UID 1000

# Ubicación del runner:
/data/actions-runner

# Servicios Docker:
nanlomo-backend:3002          # Node.js + Express API
nanlomo-frontend:80           # React + Vite
postgres-produccion:5432      # PostgreSQL database
nginx-central:80/443          # Reverse proxy
pgadmin:5050                  # Database admin tool

# Script de deploy:
/data/nanlomo/deploy.sh

# Contenido del script:
#!/bin/bash
set -a
source .env
set +a
docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
docker pull mambru94/nanlomo-backend:latest
docker pull mambru94/nanlomo-frontend:latest
docker compose down
docker compose up -d
sleep 10
curl http://localhost:3002/health

# Archivo .env:
/data/nanlomo/.env

# Contenido (ejemplo):
DOCKER_USERNAME=mambru94
DOCKER_PASSWORD=dckr_pat_xxxxxxxxxxxxxxxxxxx
DB_USER=postgres
DB_PASSWORD=xxxxxxxxxxxxx
DB_NAME=nanlomo_restaurant
JWT_SECRET=xxxxxxxxxxxxx
```

## Ejemplo 2: Comandos Ejecutados Paso a Paso

### A. Crear Repositorio y Subir Código

```powershell
# 1. Verificar autenticación
gh auth status
# Output: ✓ Logged in to github.com as LSCANDRES

# 2. Crear repositorio
gh repo create nano-lomos-restaurant --public --source=. --remote=origin
# Output: ✓ Created repository LSCANDRES/nano-lomos-restaurant

# 3. Configurar .gitignore para excluir archivos grandes
echo "*.mp4" >> .gitignore
echo "*.zip" >> .gitignore
git rm --cached public/videos/*.mp4

# 4. Commit inicial
git add .
git commit -m "feat: sistema completo de restaurante NANO LOMOS"
# Output: 145 files changed, 29196 insertions(+)

# 5. Push
git push -u origin 001-restaurant-system
# Output: To github.com:LSCANDRES/nano-lomos-restaurant.git
```

### B. Instalar Runner en Servidor

```bash
# 1. Conectar al servidor
ssh server-root
# Output: Welcome to Ubuntu 24.04.3 LTS

# 2. Crear directorio para el runner
cd /data
mkdir -p actions-runner
cd actions-runner

# 3. Descargar runner (versión más reciente en ese momento)
curl -o actions-runner-linux-x64-2.331.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.331.0/actions-runner-linux-x64-2.331.0.tar.gz
# Output: 100% |████████| 179MB

# 4. Extraer
tar xzf actions-runner-linux-x64-2.331.0.tar.gz

# 5. Generar token de registro (desde máquina local, no servidor)
gh api -X POST repos/LSCANDRES/nano-lomos-restaurant/actions/runners/registration-token --jq .token
# Output: AS4PJNJOEAK2NPVOEKSPUGLJSADYW

# 6. Cambiar ownership a usuario no-root
chown -R andres-luna:andres-luna /data/actions-runner

# 7. Configurar runner (como usuario andres-luna)
su - andres-luna -c "cd /data/actions-runner && ./config.sh \
  --url https://github.com/LSCANDRES/nano-lomos-restaurant \
  --token AS4PJNJOEAK2NPVOEKSPUGLJSADYW \
  --name server-root-nanlomo \
  --labels nanlomo \
  --unattended"

# Output:
# √ Runner successfully added
# √ Runner connection is good

# 8. Instalar como servicio systemd
cd /data/actions-runner
./svc.sh install andres-luna
# Output: Creating launch runner in /etc/systemd/system/...

# 9. Iniciar servicio
./svc.sh start
# Output: Started

# 10. Verificar estado
./svc.sh status
# Output:
# ● actions.runner.LSCANDRES-nano-lomos-restaurant.server-root-nanlomo.service
#    Active: active (running)
#    Main PID: 607326
#    Tasks: 8
#    Memory: 6.7M

# 11. Verificar en GitHub (desde máquina local)
gh api repos/LSCANDRES/nano-lomos-restaurant/actions/runners \
  --jq '.runners[] | {name, status, busy}'
# Output:
# {
#   "name": "server-root-nanlomo",
#   "status": "online",
#   "busy": false
# }
```

### C. Workflow Real Creado

**Archivo:** `.github/workflows/deploy-lan.yml`

```yaml
name: Deploy to LAN Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted
    
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
      
      - name: Login to Docker Hub
        run: |
          cd /data/nanlomo
          docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
      
      - name: Pull Docker images
        run: |
          cd /data/nanlomo
          docker pull mambru94/nanlomo-backend:latest
          docker pull mambru94/nanlomo-frontend:latest
      
      - name: Restart services
        run: |
          cd /data/nanlomo
          docker compose down
          docker compose up -d
      
      - name: Wait for services
        run: sleep 10
      
      - name: Health check backend
        run: |
          curl -f http://localhost:3002/health || exit 1
          curl -f http://localhost:3002/api/health || exit 1
```

## Ejemplo 3: Prueba del Flujo Completo

```bash
# 1. Crear branch de prueba
git checkout -b test/github-mobile-workflow
echo "# Test deploy automático" >> README.md
git add README.md
git commit -m "test: verificar deploy automático"
git push origin test/github-mobile-workflow

# 2. Crear PR
gh pr create \
  --title "Test: Deploy automático" \
  --body "Prueba del flujo completo de GitHub Mobile + CI/CD"
# Output: https://github.com/LSCANDRES/nano-lomos-restaurant/pull/1

# 3. Ver status de CI checks
gh pr checks
# Output:
# ✓ CI / backend-tests    pass  1m23s
# ✓ CI / frontend-tests   pass  58s
# ✓ CI / lint             pass  12s

# 4. Hacer merge
gh pr merge --merge
# Output: ✓ Merged Pull Request #1

# 5. Ver workflow de deploy ejecutándose
gh run list --limit 5
# Output:
# STATUS  NAME                  WORKFLOW            BRANCH  EVENT
# ✓       Deploy to LAN Server  deploy-lan.yml      main    push

# 6. Ver logs del deploy
gh run view --log
# Output:
# deploy > Checkout code ... done
# deploy > Pull latest code ... done
# deploy > Load environment variables ... done
# deploy > Login to Docker Hub ... done
# deploy > Pull Docker images ... done
# deploy > Restart services ... done
# deploy > Health check backend ... ✓

# 7. Verificar en servidor que cambios están aplicados
ssh server-root "cd /data/nanlomo && git log -1 --oneline"
# Output: abc1234 test: verificar deploy automático

# 8. Verificar containers corriendo
ssh server-root "docker ps | grep nanlomo"
# Output:
# nanlomo-backend   Up 2 minutes   0.0.0.0:3002->3002/tcp
# nanlomo-frontend  Up 2 minutes   0.0.0.0:80->80/tcp
```

---

# Checklist de Verificación

Usa este checklist para asegurarte de que estás siguiendo el enfoque correcto.

## ✅ Antes de Empezar

- [ ] Mi servidor está en red LAN privada (no es cloud público)
- [ ] Ya tengo imágenes Docker en Docker Hub (`docker pull mi-usuario/mi-app` funciona)
- [ ] Tengo acceso SSH a mi servidor desde mi máquina local
- [ ] Mi servidor tiene Docker y Docker Compose instalados
- [ ] Tengo archivo `.env` en mi servidor con DOCKER_USERNAME y DOCKER_PASSWORD
- [ ] Mi servidor puede hacer `git pull` de GitHub.com
- [ ] Mi servidor puede hacer `docker pull` de Docker Hub

## ✅ Durante la Implementación

### Repositorio GitHub
- [ ] Repositorio creado con `gh repo create`
- [ ] Commit inicial exitoso (sin archivos grandes)
- [ ] `.gitignore` configurado (node_modules, .env, *.mp4, etc.)
- [ ] Branch principal pusheado a GitHub

### Workflows
- [ ] `ci.yml` creado (tests, lint, build verification)
- [ ] `deploy-lan.yml` creado con `runs-on: self-hosted`
- [ ] `pr-preview.yml` creado (opcional)
- [ ] Workflows pusheados a GitHub

### Self-Hosted Runner
- [ ] Descargado última versión en servidor
- [ ] Extraído en ruta elegida (ej: `/data/actions-runner`)
- [ ] Token de registro generado con `gh api`
- [ ] Configurado con `./config.sh --url ... --token ...`
- [ ] Instalado como servicio systemd con `./svc.sh install [usuario]`
- [ ] Servicio iniciado con `./svc.sh start`
- [ ] Verificado que está "online" en GitHub

### Deploy Workflow
- [ ] Workflow hace `cd /directorio/proyecto`
- [ ] Workflow hace `git pull origin main`
- [ ] Workflow carga `.env` con `source .env`
- [ ] Workflow hace `docker login` con credenciales del .env
- [ ] Workflow hace `docker pull` de las imágenes
- [ ] Workflow hace `docker compose restart`
- [ ] Workflow hace health checks con `curl`

## ❌ NO Hacer (Enfoque Simple)

### GitHub Secrets
- [ ] ❌ NO configurar `DOCKERHUB_USERNAME` en Secrets
- [ ] ❌ NO configurar `DOCKERHUB_TOKEN` en Secrets
- [ ] ❌ NO usar `${{ secrets.ALGO }}` en workflows
- [ ] ✅ Credenciales están en `/data/proyecto/.env` del servidor

### Docker Build
- [ ] ❌ NO hacer `docker build` en GitHub Actions workflows
- [ ] ❌ NO hacer `docker push` en GitHub Actions workflows
- [ ] ❌ NO usar `docker/build-push-action@v2`
- [ ] ✅ Imágenes se buildean FUERA de GitHub

### Complejidad Innecesaria
- [ ] ❌ NO usar múltiples jobs en workflow (build + deploy)
- [ ] ❌ NO usar `runs-on: ubuntu-latest` para deploy
- [ ] ✅ Un solo job: deploy en self-hosted runner

## ✅ Verificación Final

```bash
# 1. Runner online
gh api repos/TU-USUARIO/TU-REPO/actions/runners --jq '.runners[] | {name, status}'
# Esperado: {"name": "...", "status": "online"}

# 2. Servicios corriendo
ssh tu-alias "docker ps"
# Esperado: Containers activos

# 3. Health checks
ssh tu-alias "curl http://localhost:PUERTO/health"
# Esperado: {"status": "ok", ...}

# 4. Deploy funciona
# - Crear PR de prueba
# - Merge desde móvil o web
# - Ver workflow ejecutarse
# - Verificar cambios en servidor
```

## 🚨 Señales de Alerta (Enfoque Equivocado)

Si ves CUALQUIERA de estas cosas, estás usando el enfoque equivocado:

### En Workflows
- 🚨 `runs-on: ubuntu-latest` en job de deploy
- 🚨 `docker build` en algún step
- 🚨 `docker push` en algún step
- 🚨 `secrets.DOCKERHUB_TOKEN` en workflow
- 🚨 `actions/docker-build-push@v2` como action

### En GitHub Settings
- 🚨 Secrets configurados en GitHub → Settings → Secrets
- 🚨 Variables de entorno en GitHub Actions settings

### Copilot te Pide
- 🚨 "Configura DOCKERHUB_TOKEN en GitHub Secrets"
- 🚨 "Necesitamos hacer build de las imágenes en GitHub"

**Si ves esto, responde:**
> "Estoy usando el enfoque simple. Las credenciales están en el .env del servidor y las imágenes ya existen en Docker Hub. ¿Es realmente necesario?"

## ✅ Señales de Éxito

- ✅ `runs-on: self-hosted` en deploy job
- ✅ `source .env` para cargar credenciales
- ✅ `docker pull` (NO build)
- ✅ Runner online en GitHub
- ✅ Deploy completo en < 2 minutos
- ✅ NO hay Secrets configurados en GitHub

---

# Troubleshooting

## Problema 1: Runner aparece "offline"

```bash
# 1. Ver logs del servicio
ssh tu-alias "journalctl -u actions.runner.*.service -n 50"

# 2. Verificar estado del servicio
ssh tu-alias "cd /data/actions-runner && ./svc.sh status"

# 3. Si está stopped, reiniciar
ssh tu-alias "cd /data/actions-runner && ./svc.sh restart"

# 4. Esperar 30-60 segundos y verificar
gh api repos/TU-USUARIO/TU-REPO/actions/runners

# 5. Si persiste, verificar conexión a GitHub
ssh tu-alias "ping -c 5 github.com"

# 6. Ver si hay errores de autenticación
ssh tu-alias "journalctl -u actions.runner.*.service | grep -i error"
```

## Problema 2: Deploy falla en health check

```bash
# 1. Ver logs del workflow
gh run list --limit 1
gh run view <run-id> --log

# 2. Ver logs de containers
ssh tu-alias "docker logs nanlomo-backend --tail 100"
ssh tu-alias "docker logs nanlomo-frontend --tail 100"

# 3. Verificar que containers están corriendo
ssh tu-alias "docker ps"

# 4. Probar health endpoint manualmente
ssh tu-alias "curl http://localhost:3002/health"

# 5. Ver docker compose status
ssh tu-alias "cd /data/proyecto && docker compose ps"

# 6. Ver logs de docker compose
ssh tu-alias "cd /data/proyecto && docker compose logs --tail=50"
```

## Problema 3: Runner rechaza ejecutar con sudo

**Error:** "Must not run with sudo"

```bash
# Solución: Usar usuario no-root

# MAL (no funciona):
sudo ./config.sh ...

# BIEN (funciona):
chown -R andres-luna:andres-luna /data/actions-runner
su - andres-luna -c "cd /data/actions-runner && ./config.sh ..."
```

## Problema 4: Docker login falla

```bash
# 1. Verificar que .env existe y tiene las variables
ssh tu-alias "cat /data/proyecto/.env | grep DOCKER_"

# 2. Probar login manualmente
ssh tu-alias "docker login -u tu-usuario -p tu-password"

# 3. Si falla, verificar credenciales en Docker Hub
# - Ve a https://hub.docker.com/settings/security
# - Genera nuevo Access Token
# - Actualiza DOCKER_PASSWORD en .env

# 4. Verificar permisos del archivo .env
ssh tu-alias "ls -la /data/proyecto/.env"
# Debe ser: -rw-r----- (640) u owner: usuario-runner

# 5. Probar con el workflow
git commit --allow-empty -m "test: verificar docker login"
git push
```

## Problema 5: Docker pull falla (imagen no existe)

```bash
# 1. Verificar que imagen existe en Docker Hub
docker pull tu-usuario/tu-app-backend:latest

# 2. Si no existe, buildear y pushear
docker build -t tu-usuario/tu-app-backend:latest ./backend
docker push tu-usuario/tu-app-backend:latest

# 3. Verificar nombre de imagen en docker-compose.yml
ssh tu-alias "cat /data/proyecto/docker-compose.yml | grep image:"

# 4. Asegurar que coincida con el workflow
# workflow: docker pull tu-usuario/tu-app
# compose:  image: tu-usuario/tu-app
```

## Problema 6: Git pull falla (permisos)

```bash
# 1. Verificar que proyecto está en Git
ssh tu-alias "cd /data/proyecto && git remote -v"

# 2. Verificar permisos del directorio
ssh tu-alias "ls -la /data | grep proyecto"
# Owner debe ser: usuario-runner (ej: andres-luna)

# 3. Si permisos incorrectos, corregir
ssh tu-alias "chown -R andres-luna:andres-luna /data/proyecto"

# 4. Verificar que puede hacer pull
ssh tu-alias "cd /data/proyecto && git pull origin main"
```

## Problema 7: Copilot pide configurar GitHub Secrets

**Si Copilot te dice:**
> "Configura estos Secrets en GitHub: DOCKERHUB_USERNAME, DOCKERHUB_TOKEN..."

**Responde:**
> "Estoy usando el enfoque simple descrito en el prompt. Las credenciales están en el archivo .env del servidor (/data/proyecto/.env). NO necesito configurar GitHub Secrets. Por favor revisa la sección 'LO QUE NO VAS A NECESITAR' del prompt."

Copilot debería responder:
> "Tienes razón, no son necesarios para el enfoque simple. Usaremos las credenciales del .env del servidor."

---

## 📞 Ayuda Adicional

Si nada de lo anterior funciona:

1. **Revisa los ejemplos concretos** arriba para comparar con tu configuración
2. **Verifica el checklist** paso a paso
3. **Compara tu workflow** con el ejemplo de `deploy-lan.yml`
4. **Revisa los logs** del runner, containers y workflow

**Comandos útiles de diagnóstico:**

```bash
# Ver todo el estado del sistema
ssh tu-alias "
  echo '=== Runner Status ===' &&
  systemctl status actions.runner.* | head -20 &&
  echo '=== Docker Containers ===' &&
  docker ps &&
  echo '=== Disk Space ===' &&
  df -h | grep /data &&
  echo '=== Recent Logs ===' &&
  journalctl -u actions.runner.* -n 20
"

# Ver último deploy
gh run list --limit 1
gh run view --log

# Ver configuración del runner
ssh tu-alias "cat /data/actions-runner/.runner"
```

---

## 🎉 Resumen Final

**Este documento único contiene TODO lo necesario:**

1. ✅ **El Prompt Completo** - Copia y pega en otro proyecto
2. ✅ **Ejemplos Reales** - Comandos ejecutados en nano-lomos-restaurant
3. ✅ **Checklist** - Verifica que estás usando el enfoque correcto
4. ✅ **Troubleshooting** - Soluciones a problemas comunes

**Tiempo total:** ~50 minutos para implementar en otro proyecto.

**¿Listo para empezar?** Ve a la sección "EL PROMPT" arriba, modifica los `[...]`, copia todo y pégalo en tu nuevo chat de Copilot. 🚀
