# Cómo Usar el Prompt en Otro Proyecto

Este documento explica cómo usar los archivos de prompt para replicar la configuración de GitHub Mobile + CI/CD + Self-Hosted Runner en otro proyecto.

---

## 📦 Archivos Incluidos

### 1. **PROMPT_GITHUB_MOBILE_CICD.md** 
El prompt principal que debes copiar y pegar en otro chat de Copilot.

**Qué contiene:**
- Requerimientos claros del enfoque simple
- Contexto del proyecto
- Objetivos específicos
- Información necesaria del servidor
- Flujo completo paso a paso
- Diferencias con enfoques más complejos

**Cuándo usar:** Es el ÚNICO archivo que necesitas copiar al nuevo chat.

### 2. **PROMPT_EXAMPLES.md**
Ejemplos concretos de la implementación real de `nano-lomos-restaurant`.

**Qué contiene:**
- Comandos exactos ejecutados
- Configuraciones reales
- Ejemplos de workflows
- Troubleshooting común

**Cuándo usar:** Como referencia si tienes dudas sobre cómo adaptar algo a tu proyecto.

### 3. **PROMPT_CHECKLIST.md**
Lista de verificación para confirmar que estás siguiendo el enfoque correcto.

**Qué contiene:**
- Checklist de implementación
- Señales de alerta (enfoque equivocado)
- Señales de éxito (enfoque correcto)
- Comparación visual de enfoques

**Cuándo usar:** Mientras implementas, para verificar cada paso.

### 4. **Este archivo (COMO_USAR_EL_PROMPT.md)**
Guía de uso de los archivos anteriores.

---

## 🚀 Proceso Paso a Paso

### Opción A: Usar en Otro Proyecto (Recomendado)

#### 1. Prepara la Información de Tu Proyecto

Antes de copiar el prompt, ten lista esta información:

```bash
# Alias SSH de tu servidor
ssh mi-servidor  # Ejemplo: ssh production-server

# Usuario no-root del servidor
echo $USER  # Ejemplo: deploy, ubuntu, tu-nombre

# Ruta donde instalarás el runner
pwd  # Ejemplo: /opt/actions-runner, /home/deploy/runner

# Servicios Docker actuales
docker ps  # Ver nombres y puertos

# Script de deploy existente (si existe)
cat /ruta/deploy.sh

# Archivo .env con credenciales
cat /ruta/.env | head -5  # Solo para ver qué variables tienes
```

**Información de Docker Hub:**
```bash
# Tus imágenes Docker existentes
docker images | grep tu-usuario
# Ejemplo: tu-usuario/mi-app-backend:latest
```

#### 2. Abre un Nuevo Chat de Copilot

- Abre VS Code
- Abre el proyecto donde quieres implementar esto
- Abre Copilot Chat (Ctrl+Alt+I o Cmd+Alt+I)

#### 3. Copia el Contenido Completo de `PROMPT_GITHUB_MOBILE_CICD.md`

```
1. Abre: PROMPT_GITHUB_MOBILE_CICD.md
2. Selecciona todo (Ctrl+A / Cmd+A)
3. Copia (Ctrl+C / Cmd+C)
4. Ve al nuevo chat de Copilot
5. Pega (Ctrl+V / Cmd+V)
```

#### 4. Modifica las Secciones Marcadas con `[...]`

Busca y reemplaza estas secciones en el prompt:

```markdown
# Para conectarme a mi servidor uso:
ssh [ALIAS_SSH]  # <-- Cambia esto por: ssh mi-servidor

# Sistema operativo del servidor:
# [Ubuntu / Debian / CentOS / etc.]  # <-- Cambia por: Ubuntu 22.04

# Usuario que ejecutará el runner:
# [usuario-no-root]  # <-- Cambia por: deploy

# Y así con todas las secciones con [...]
```

**Lista completa de secciones a modificar:**
- `[ALIAS_SSH]` → Tu alias SSH
- `[Ubuntu / Debian / etc.]` → Tu OS
- `[usuario-no-root]` → Tu usuario
- `[lista tus servicios]` → Tus containers Docker
- `[tu-usuario-github]` → Tu usuario de GitHub
- `[/data/proyecto/deploy.sh]` → Tu script (si existe)

#### 5. Envía el Prompt

Presiona Enter y Copilot comenzará a implementar todo el sistema.

#### 6. Sigue las Instrucciones de Copilot

Copilot te pedirá ejecutar comandos paso a paso:
- Crear repositorio con `gh`
- Subir código
- Crear workflows
- Conectar al servidor
- Instalar runner
- Etc.

**IMPORTANTE:** Ejecuta los comandos que te pida, uno por uno.

#### 7. Verifica con el Checklist

Mientras avanzas, abre `PROMPT_CHECKLIST.md` y marca cada casilla completada.

---

### Opción B: Revisar y Entender Primero

#### 1. Lee `PROMPT_GITHUB_MOBILE_CICD.md`
- Entender el enfoque simple vs avanzado
- Ver el flujo esperado
- Leer las aclaraciones sobre el runner

#### 2. Revisa `PROMPT_EXAMPLES.md`
- Ver comandos reales ejecutados
- Entender la estructura del proyecto
- Ver ejemplos de workflows

#### 3. Estudia `PROMPT_CHECKLIST.md`
- Entender qué NO hacer
- Ver señales de alerta
- Comparar enfoques visualmente

#### 4. Luego Implementa (Opción A)

---

## ⚠️ Errores Comunes al Usar el Prompt

### Error 1: Copiar el Prompt SIN Modificar `[...]`

**MAL:**
```markdown
ssh [ALIAS_SSH]  # Copilot intentará conectarse literalmente a "ALIAS_SSH"
```

**BIEN:**
```markdown
ssh production-server  # Tu alias real
```

**Solución:** Busca TODOS los `[...]` y reemplázalos con tu información.

---

### Error 2: Pedir Configurar GitHub Secrets

Si Copilot te dice:
> "Configura estos Secrets en GitHub: DOCKERHUB_TOKEN, ..."

**Responde:**
> "Estoy usando el enfoque simple. Las credenciales están en el archivo .env del servidor. ¿Es realmente necesario configurar Secrets?"

Copilot debería responder:
> "Tienes razón, no son necesarios para el enfoque simple."

---

### Error 3: Ver `docker build` en Workflows

Si en `.github/workflows/deploy-lan.yml` ves:
```yaml
- name: Build Docker image
  run: docker build -t mi-app .
```

**Pregunta a Copilot:**
> "El prompt especifica usar imágenes pre-buildeadas. ¿Podemos cambiar esto a docker pull en lugar de docker build?"

---

### Error 4: Runner en Servidor root

Si Copilot te pide ejecutar:
```bash
cd /data/actions-runner
sudo ./config.sh ...
```

**Detén y corrige:**
> "El runner no debe ejecutarse con sudo. Necesito usar un usuario no-root como indica el prompt."

---

## 🎯 Qué Esperar Después de Enviar el Prompt

### Inmediatamente (0-5 minutos)
- Copilot creará el repositorio en GitHub
- Hará commit inicial del código
- Creará 3-4 workflows en `.github/workflows/`
- Creará archivos de documentación (2-3 archivos .md)

### Después (5-20 minutos)
- Te pedirá conectarte al servidor con SSH
- Te dará comandos para instalar el runner
- Te guiará en la configuración del servicio systemd
- Verificará que el runner esté "online"

### Al Final (20-30 minutos)
- Te pedirá hacer un commit de prueba
- Crear un PR de prueba
- Hacer merge
- Ver el deploy ejecutándose automáticamente
- Documentar todo

**Total:** 30-50 minutos para tener todo funcionando.

---

## 📊 Diferencias entre Este Enfoque y Otros

### Si en otro chat ves que te piden configurar Secrets:

**Chat anterior (enfoque avanzado):**
```
Copilot: "Configura estos Secrets en GitHub:
1. DOCKERHUB_USERNAME
2. DOCKERHUB_TOKEN
3. GOOGLE_CLIENT_ID"
```

**Este chat (enfoque simple):**
```
Copilot: "No necesitas configurar Secrets.
Las credenciales están en /data/proyecto/.env del servidor."
```

### Si ves workflows diferentes:

**Enfoque avanzado:**
```yaml
# build-and-deploy.yml
jobs:
  build:
    runs-on: ubuntu-latest  # En GitHub Cloud
    steps:
      - docker build
      - docker push
  
  deploy:
    needs: build
    runs-on: self-hosted
    steps:
      - docker pull  # Imagen recién buildeada
```

**Enfoque simple (este prompt):**
```yaml
# deploy-lan.yml
jobs:
  deploy:
    runs-on: self-hosted  # Solo en tu servidor
    steps:
      - git pull
      - docker pull  # Imagen pre-buildeada
      - docker compose restart
```

---

## 🔍 Cómo Saber Si Está Funcionando

### Señales Positivas ✅

1. **Runner online:**
```bash
gh api repos/TU-USUARIO/TU-REPO/actions/runners --jq '.runners[].status'
# Output: "online"
```

2. **Workflow se ejecuta automáticamente al hacer merge:**
```bash
gh run list --limit 1
# Output: Deploy to LAN Server  completed  main
```

3. **Deploy demora menos de 2 minutos:**
```bash
gh run view --log
# Output: Job completed in 1m 23s
```

4. **NO hay Secrets configurados:**
```bash
gh api repos/TU-USUARIO/TU-REPO/actions/secrets
# Output: {"total_count": 0, "secrets": []}
```

5. **Servicios corriendo en servidor:**
```bash
ssh tu-alias "docker ps | grep tu-app"
# Output: tu-app-backend  Up 5 minutes  0.0.0.0:3000->3000/tcp
```

### Señales Negativas ❌

1. Runner muestra "offline" después de 5 minutos
2. Workflow tarda más de 10 minutos
3. Ves errores de "docker: permission denied"
4. Workflow dice "No runner found with label: self-hosted"
5. Copilot insiste en configurar Secrets cuando no son necesarios

**Si ves cualquiera de estas:** Usa `PROMPT_CHECKLIST.md` para diagnosticar.

---

## 💡 Tips Adicionales

### Tip 1: Guarda el Prompt Original
Antes de modificar `PROMPT_GITHUB_MOBILE_CICD.md`, guárdalo en otro lugar:
```bash
cp PROMPT_GITHUB_MOBILE_CICD.md PROMPT_GITHUB_MOBILE_CICD_ORIGINAL.md
```

### Tip 2: Prueba Primero en Proyecto Pequeño
Si tienes dudas, prueba el flujo en un proyecto de prueba antes del proyecto real.

### Tip 3: Lee la Documentación Generada
Copilot creará archivos como:
- `GITHUB_MOBILE_WORKFLOW.md`
- `DEPLOY_LAN_SETUP.md`
- `FLUJO_COMPLETO_EXPLICADO.md`

**Léelos** para entender mejor el sistema.

### Tip 4: Usa GitHub Mobile
Descarga la app en tu móvil para probar el flujo completo:
- iOS: https://apps.apple.com/app/github/id1477376905
- Android: https://play.google.com/store/apps/details?id=com.github.android

---

## 🆘 Qué Hacer Si Algo Sale Mal

### Problema: Runner no conecta

```bash
# 1. Ver logs
ssh tu-alias "journalctl -u actions.runner.*.service -n 50"

# 2. Reiniciar servicio
ssh tu-alias "cd /ruta/runner && ./svc.sh restart"

# 3. Esperar 1-2 minutos y verificar
gh api repos/TU-USUARIO/TU-REPO/actions/runners
```

### Problema: Deploy falla

```bash
# 1. Ver logs del workflow
gh run list --limit 1
gh run view <run-id> --log

# 2. Ver logs de containers
ssh tu-alias "docker logs tu-container"

# 3. Probar deploy manual
ssh tu-alias "cd /ruta/proyecto && ./deploy.sh"
```

### Problema: Copilot da enfoque diferente

**Detén y muestra el prompt:**
> "El prompt especifica el enfoque simple sin Secrets. Por favor revisa la sección 'Diferencias con Otros Enfoques' del prompt."

---

## 📝 Resumen de Uso

```
1. ✅ Lee PROMPT_GITHUB_MOBILE_CICD.md
2. ✅ Modifica secciones [...]
3. ✅ Copia todo el contenido
4. ✅ Pega en nuevo chat de Copilot en tu proyecto
5. ✅ Ejecuta comandos que Copilot te pida
6. ✅ Verifica con PROMPT_CHECKLIST.md
7. ✅ Consulta PROMPT_EXAMPLES.md si necesitas
8. ✅ Prueba el flujo completo desde móvil
9. ✅ Disfruta del CI/CD profesional! 🎉
```

---

## 🎉 Conclusión

Este sistema te permite:
- ✅ Trabajar desde cualquier lugar (incluyendo móvil)
- ✅ Deploy automático en menos de 2 minutos
- ✅ CI/CD profesional sin complejidad innecesaria
- ✅ Seguridad (credenciales en tu servidor, no en GitHub)
- ✅ Replicable en cualquier proyecto en < 1 hora

**El prompt está diseñado para que Copilot haga todo el trabajo pesado.**

Tu trabajo es solo:
1. Rellenar tu información
2. Ejecutar los comandos que te pida
3. Disfrutar del resultado

¡Éxito! 🚀
