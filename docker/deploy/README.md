# MI_APP - Scripts de Deploy

Scripts Python para automatizar el build, push y deploy de imágenes Docker.

## Estructura

```
docker/deploy/
├── build.py       # Compila imágenes Docker y las sube a Docker Hub
├── deploy.py      # Despliega en el servidor de producción
├── version.json   # Control de versiones (auto-incrementado)
└── README.md
```

## Requisitos

- **Python 3.10+** instalado
- **Docker Desktop** corriendo (o Docker en el servidor)
- **SSH** configurado con alias `server-root` para el servidor (192.168.100.35)
- **Variables de entorno** para Docker Hub en `.env`

## Scripts

### `build.py` - Build y Push de Imágenes

Compila las imágenes Docker del backend y frontend, las etiqueta con versión semántica y las sube a Docker Hub.

**Uso:**
```bash
cd docker/deploy

# Build completo + push (incrementa patch: 0.1.0 → 0.1.1)
python build.py

# Versión específica
python build.py --version 2.0.0

# Incrementar minor o major
python build.py --minor    # 0.1.0 → 0.2.0
python build.py --major    # 0.1.0 → 1.0.0

# Solo build local (sin push a Docker Hub)
python build.py --no-push

# Solo sincronizar código al servidor
python build.py --sync-only
```

### `deploy.py` - Deploy a Producción

Descarga las imágenes de DockerHub y recrea los contenedores en el servidor.

**Uso:**
```bash
cd docker/deploy

# Deploy última versión
python deploy.py

# Deploy versión específica
python deploy.py --version 1.2.3

# Solo reiniciar contenedores
python deploy.py --restart

# Ver estado de contenedores
python deploy.py --status

# Ver logs
python deploy.py --logs
```

## Flujo completo

```bash
# 1. Build y push de imágenes
python build.py

# 2. Deploy en producción
python deploy.py
```
