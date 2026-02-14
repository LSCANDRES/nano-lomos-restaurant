# 📱 FLUJO COMPLETO: Móvil → GitHub → Tu Servidor

## 🔄 Diagrama del Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│  PASO 1: TÚ (desde tu móvil 📱)                                 │
├─────────────────────────────────────────────────────────────────┤
│  GitHub Mobile App                                              │
│  └─> Abres PR #123                                              │
│  └─> Revisas cambios                                            │
│  └─> TAP en "Merge pull request" ✅                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASO 2: GITHUB.COM (en la nube ☁️)                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Detecta merge a rama 'main'                                 │
│  2. Lee archivo: .github/workflows/deploy-lan.yml               │
│  3. Ve: "runs-on: self-hosted" ← 🔑 CLAVE                       │
│  4. Busca runner con etiqueta "self-hosted"                     │
│  5. Encuentra: "Runner en 192.168.X.X (Online 🟢)"              │
│  6. Envía job a ESE runner específico                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASO 3: TU SERVIDOR (192.168.X.X en tu LAN 🖥️)                │
├─────────────────────────────────────────────────────────────────┤
│  GitHub Runner (proceso corriendo en tu servidor)               │
│  └─> Recibe job de GitHub                                       │
│  └─> Ejecuta comandos en TU servidor:                           │
│      • git pull                                                 │
│      • npm install                                              │
│      • npm run build                                            │
│      • docker-compose restart (o pm2 restart)                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  PASO 4: NOTIFICACIÓN (de vuelta a tu móvil 📱)                 │
├─────────────────────────────────────────────────────────────────┤
│  GitHub Mobile te notifica:                                     │
│  ✅ "Deploy completed successfully!"                            │
│  🌐 Tu app actualizada en: http://192.168.X.X:3010              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔑 LA CLAVE: ¿Cómo sabe GitHub ejecutar en TU servidor?

### 1. **El Runner es un "agente" que TÚ instalas**

```
Tu Servidor (192.168.X.X)
├─ /data/
│  ├─ docker-compose.yml (tu setup actual)
│  └─ ...
├─ /actions-runner/  ← NUEVO: Agente de GitHub
│  ├─ run.cmd        ← Este proceso se conecta a GitHub
│  └─ config.json    ← Token único de autenticación
└─ /home/restaurante/nano-lomos/  ← Donde clonará el código
```

### 2. **Conexión persistente**

```
┌──────────────┐         WebSocket          ┌───────────────┐
│  Tu Servidor │ ←────────────────────────→ │  GitHub.com   │
│              │  "¿Hay trabajo para mí?"   │               │
│  Runner      │  "Sí, ejecuta este job"   │   Queue       │
│  (Online 🟢) │                             │               │
└──────────────┘                             └───────────────┘
```

**El runner pregunta constantemente a GitHub**: "¿Hay algún job para mí?"

### 3. **Identificación única**

Cuando instalas el runner, GitHub te da:
```
--url https://github.com/LSCANDRES/nano-lomos-restaurant
--token XXXXXXXXXXXXXXXXXXXXXXXXX  ← Token único
--name server-root  ← Nombre que TÚ eliges
--labels self-hosted,linux  ← Etiquetas
```

**En tu workflow (.github/workflows/deploy-lan.yml):**
```yaml
jobs:
  deploy-to-lan:
    runs-on: self-hosted  ← Busca runner con esta etiqueta
```

GitHub dice: "Busco un runner con etiqueta 'self-hosted'" 
→ Encuentra tu servidor: "server-root (Online 🟢)"
→ Envía el job a ESE servidor específicamente

---

## 📋 FLUJO DETALLADO PASO A PASO

### **Escenario:** Corregir precio del menú desde el móvil

#### **ANTES (instalación una sola vez):**

```bash
# En tu servidor (vía server-root)
ssh server-root
cd /actions-runner
./run.sh  # Runner queda escuchando
```

Runner en tu servidor dice: 
> "Hola GitHub, soy 'server-root', estoy online y esperando trabajo"

#### **DÍA A DÍA:**

**🌅 Mañana - En tu computadora:**
```bash
cd /d/Archivos\ Frecuentes/restaurante
git checkout -b fix/precio-lomo
# Editas: backend/seeds/002_menu_items.js
git add .
git commit -m "fix: corregir precio lomo de $8000 a $8500"
git push origin fix/precio-lomo
gh pr create --title "Corregir precio lomo"
```

**📱 Mediodía - Desde tu móvil (en el colectivo):**
1. GitHub Mobile te notifica: "📬 New PR #5"
2. Abres el PR
3. Ves el diff: `-price: 8000` / `+price: 8500`
4. TAP en "Merge pull request"
5. TAP en "Confirm merge"

**☁️ Inmediato - En GitHub (automático):**
```
GitHub detecta: Merge a 'main'
GitHub busca: runners con label 'self-hosted'
GitHub encuentra: 
  ✅ server-root (192.168.100.35) - Online
GitHub envía: Job "deploy-to-lan" → server-root
```

**🖥️ En tu servidor (automático):**
```bash
# El runner ejecuta automáticamente:
cd /home/restaurante/nano-lomos
git pull origin main  # Descarga cambios
cd backend && npm ci
cd docker && docker-compose restart backend
```

**📱 1 minuto después - Tu móvil:**
```
🔔 GitHub Mobile: "✅ Deploy completed!"
```

**🎉 Resultado:**
- Tu app en `http://192.168.100.35:3010` ya tiene el nuevo precio
- Todo sin tocar la computadora
- Todo desde el móvil

---

## 🎯 AHORA SÍ: ¿Cómo sabe ejecutar en TU servidor específico?

### **Múltiples runners:**

Puedes tener varios runners:
```
GitHub Online Runners:
├─ server-root (192.168.100.35) [self-hosted, linux] 🟢
├─ laptop-lucas (192.168.100.50) [self-hosted, windows] 🟢  
├─ vps-produccion (45.67.89.12) [self-hosted, production] 🟢
└─ raspberry-pi (192.168.100.10) [self-hosted, testing] 🔴 Offline
```

**En el workflow especificas cuál usar:**
```yaml
# Opción 1: Cualquier self-hosted
runs-on: self-hosted

# Opción 2: Label específico
runs-on: [self-hosted, linux]

# Opción 3: Por nombre (custom label)
runs-on: [self-hosted, server-root]
```

GitHub ejecutará en el **primer runner disponible** que coincida con esos labels.

---

## 🛠️ INSTALACIÓN EN TU SERVIDOR

¿Listo para instalar? Voy a conectarme y configurar todo:

```bash
ssh server-root
cd /data
mkdir -p actions-runner
cd actions-runner
# Descargaré el runner y lo configuraré
```

**Necesito que me confirmes:**
1. ¿SSH está configurado con ese alias? ¿Puedo hacer `ssh server-root`?
2. ¿Usuario tiene sudo? (para instalar servicios)
3. ¿Qué OS? (Linux? Ubuntu? Debian?)
4. ¿Ya tienes Docker funcionando en /data?

Una vez confirmado, ejecuto la instalación completa y te muestro cómo queda.
