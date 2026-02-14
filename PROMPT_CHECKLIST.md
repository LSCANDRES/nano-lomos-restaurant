# Checklist de Verificación - Enfoque Simple

Usa este checklist para asegurarte de que estás siguiendo el **enfoque simple** (no el avanzado) cuando copies el prompt a otro proyecto.

---

## ✅ Antes de Empezar

- [ ] Mi servidor está en red LAN privada (no es cloud público)
- [ ] Ya tengo imágenes Docker en Docker Hub o registry (`docker pull mi-usuario/mi-app`)
- [ ] Tengo acceso SSH a mi servidor desde mi máquina local
- [ ] Mi servidor tiene Docker y Docker Compose instalados
- [ ] Tengo archivo `.env` en mi servidor con credenciales (DOCKER_USERNAME, DOCKER_PASSWORD, etc.)
- [ ] Mi servidor puede hacer `git pull` de GitHub.com

---

## ✅ Durante la Implementación

### 1. Repositorio GitHub
- [ ] Repositorio creado con `gh repo create`
- [ ] Commit inicial exitoso (sin archivos grandes)
- [ ] `.gitignore` configurado (node_modules, .env, *.mp4, etc.)
- [ ] Branch principal pusheado a GitHub

### 2. GitHub Actions Workflows
- [ ] `ci.yml` creado (tests, lint, build verification)
- [ ] `deploy-lan.yml` creado con `runs-on: self-hosted`
- [ ] `pr-preview.yml` creado (opcional)
- [ ] Workflows pusheados a GitHub

### 3. Self-Hosted Runner
- [ ] Descargado en servidor (latest version)
- [ ] Extraído en `/data/actions-runner` (o ruta elegida)
- [ ] Token de registro generado con `gh api`
- [ ] Configurado con `./config.sh --url ... --token ...`
- [ ] Instalado como servicio systemd con `./svc.sh install [usuario]`
- [ ] Servicio iniciado con `./svc.sh start`
- [ ] Verificado que está "online" en GitHub

### 4. Deploy Workflow
- [ ] Workflow hace `cd /directorio/proyecto`
- [ ] Workflow hace `git pull origin main`
- [ ] Workflow carga `.env` con `source .env`
- [ ] Workflow hace `docker login` con credenciales del .env
- [ ] Workflow hace `docker pull` de las imágenes
- [ ] Workflow hace `docker compose restart`
- [ ] Workflow hace `curl` de health checks

### 5. Documentación
- [ ] Guía de uso de GitHub Mobile creada
- [ ] Flujo completo explicado (con diagrama)
- [ ] Comandos de troubleshooting documentados

---

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
- [ ] ✅ Imágenes se buildean FUERA de GitHub (local o CI separado)

### Complejidad Innecesaria
- [ ] ❌ NO usar múltiples jobs en workflow (build + deploy)
- [ ] ❌ NO usar matrix strategy para múltiples ambientes
- [ ] ❌ NO configurar artifact uploads/downloads
- [ ] ✅ Un solo job: deploy en self-hosted runner

---

## ✅ Después de Implementar

### Verificación Manual
```bash
# 1. Runner está corriendo
gh api repos/TU-USUARIO/TU-REPO/actions/runners --jq '.runners[] | {name, status}'
# Resultado esperado: {"name": "...", "status": "online"}

# 2. Servicios corriendo en servidor
ssh tu-alias "docker ps"
# Resultado esperado: Containers activos

# 3. Health checks responden
ssh tu-alias "curl http://localhost:PUERTO/health"
# Resultado esperado: {"status": "ok", ...}
```

### Prueba de Flujo Completo
- [ ] Crear branch de prueba: `git checkout -b test/deploy`
- [ ] Hacer cambio menor: `echo "test" >> README.md`
- [ ] Commit y push: `git add . && git commit -m "test" && git push`
- [ ] Crear PR: `gh pr create`
- [ ] Merge PR: `gh pr merge` (o desde GitHub Mobile)
- [ ] Ver workflow ejecutándose: `gh run list`
- [ ] Ver logs: `gh run view <run-id> --log`
- [ ] Verificar que servicios se reiniciaron en servidor
- [ ] Verificar que cambios están aplicados: `ssh tu-alias "cd /data/proyecto && git log -1"`

### Prueba desde GitHub Mobile
- [ ] Instalar GitHub Mobile en celular
- [ ] Iniciar sesión con cuenta de GitHub
- [ ] Buscar repositorio en la app
- [ ] Ver PRs existentes
- [ ] Ver workflows ejecutados (Actions tab)
- [ ] Crear un PR de prueba desde la app
- [ ] Hacer merge desde la app
- [ ] Ver notificación de deploy exitoso

---

## 🚨 Señales de Alerta (Estás usando enfoque avanzado por error)

Si ves CUALQUIERA de estas cosas, estás usando el enfoque equivocado:

### En Workflows
- 🚨 `runs-on: ubuntu-latest` en job de deploy (debería ser `self-hosted`)
- 🚨 `docker build` en algún step
- 🚨 `docker push` en algún step
- 🚨 `secrets.DOCKERHUB_TOKEN` en workflow
- 🚨 `actions/docker-build-push@v2` como action

### En GitHub Settings
- 🚨 Secrets configurados en GitHub → Settings → Secrets
- 🚨 Variables de entorno en GitHub Actions settings
- 🚨 Environment configurado (staging, production)

### En Servidor
- 🚨 Runner ejecutándose como root/sudo
- 🚨 NO existe archivo `.env` con credenciales
- 🚨 Proyecto clonado en ruta diferente a la esperada

---

## ✅ Señales de Éxito (Enfoque Correcto)

### En Workflows
- ✅ `runs-on: self-hosted` en deploy job
- ✅ `git pull` como step principal
- ✅ `docker pull` (NO build)
- ✅ `source .env` para cargar credenciales
- ✅ `docker compose restart`

### En GitHub Settings
- ✅ NO hay Secrets configurados (o muy pocos)
- ✅ Runner aparece en Settings → Actions → Runners con status "online"
- ✅ Workflows ejecutados exitosamente en Actions tab

### En Servidor
- ✅ Runner corriendo como servicio systemd
- ✅ Usuario no-root ejecutando el runner
- ✅ Archivo `.env` existe con credenciales
- ✅ Proyecto clonado en ruta conocida
- ✅ Docker Compose ejecutándose correctamente

---

## 📊 Resumen del Enfoque

```
┌─────────────────────────────────────────────────────────────┐
│                    ENFOQUE SIMPLE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Merge PR → GitHub detecta → Envía job al runner          │
│                                                             │
│  Runner EN TU SERVIDOR ejecuta:                            │
│    1. git pull origin main                                 │
│    2. source .env (credenciales locales)                   │
│    3. docker login (usuario del .env)                      │
│    4. docker pull mi-imagen (imagen ya buildeada)          │
│    5. docker compose restart                               │
│    6. curl health checks                                   │
│                                                             │
│  Tiempo: 30-90 segundos                                    │
│  Complejidad: Baja                                         │
│  Secrets en GitHub: NO (están en servidor)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

VS

┌─────────────────────────────────────────────────────────────┐
│                   ENFOQUE AVANZADO                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Merge PR → GitHub detecta → Build EN GITHUB CLOUD          │
│                                                             │
│  GitHub Actions runners ejecutan:                          │
│    1. docker build (demora 5-15 minutos)                   │
│    2. docker login (usa secrets.DOCKERHUB_TOKEN)           │
│    3. docker push a Docker Hub                             │
│    4. Notifica a servidor self-hosted                      │
│                                                             │
│  Luego runner en servidor ejecuta:                         │
│    5. docker pull nueva imagen                             │
│    6. docker compose restart                               │
│                                                             │
│  Tiempo: 5-15 minutos                                      │
│  Complejidad: Alta                                         │
│  Secrets en GitHub: SÍ (DOCKERHUB_TOKEN, etc.)            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Cuándo Usar Cada Enfoque

### Usa ENFOQUE SIMPLE si:
- ✅ Servidor en LAN privada
- ✅ Ya tienes imágenes Docker pre-buildeadas
- ✅ Quieres deploy rápido (< 2 minutos)
- ✅ Prefieres simplicidad sobre automatización total
- ✅ Buildeas imágenes localmente o en CI externo

### Usa ENFOQUE AVANZADO si:
- ✅ Servidor en cloud público (AWS, GCP, Azure)
- ✅ Quieres build automático en cada commit
- ✅ No tienes acceso directo al servidor para builds
- ✅ Necesitas múltiples ambientes (staging, prod)
- ✅ Team grande con muchos contributors

---

## 📝 Notas Finales

**Si copias el prompt a otro proyecto:**

1. Lee completamente `PROMPT_GITHUB_MOBILE_CICD.md`
2. Revisa `PROMPT_EXAMPLES.md` para ver ejemplos concretos
3. Usa este checklist para verificar cada paso
4. Cuando Copilot te pida configurar Secrets, pregunta: "¿Es necesario? Estoy usando el enfoque simple"
5. Cuando veas `docker build` en workflows, pregunta: "¿Puedo usar imágenes pre-buildeadas en su lugar?"

**El prompt ya tiene toda la información necesaria para implementar el enfoque simple correctamente.**
