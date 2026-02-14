# 🐳 NANLOMO - Docker Deployment

## Estructura de Archivos

```
docker/
├── docker-compose.yml    # Configuración de servicios
├── .env.example          # Variables de entorno (copiar a .env)
├── build.sh              # Script de build (Linux/Mac)
├── build.ps1             # Script de build (Windows)
├── nginx/
│   └── nanlomo.conf      # Configuración nginx para el host
└── README.md             # Este archivo

backend/
├── Dockerfile            # Imagen del backend
└── .dockerignore

frontend/
├── Dockerfile            # Imagen del frontend
├── nginx.conf            # nginx interno del frontend
└── .dockerignore
```

## 🚀 Despliegue Rápido

### 1. Construir Imágenes

**Windows (PowerShell):**
```powershell
cd docker
.\build.ps1
```

**Linux/Mac:**
```bash
cd docker
chmod +x build.sh
./build.sh
```

### 2. Configurar Servidor

1. Crear directorio en el servidor:
```bash
mkdir -p /data/nanlomo
```

2. Copiar archivos:
```bash
# Desde tu PC al servidor
scp docker/docker-compose.yml usuario@servidor:/data/nanlomo/
scp docker/.env.example usuario@servidor:/data/nanlomo/.env
scp docker/nginx/nanlomo.conf usuario@servidor:/data/nginx/conf.d/
```

3. Configurar variables de entorno:
```bash
# En el servidor
nano /data/nanlomo/.env
# Editar DB_PASSWORD, JWT_SECRET, etc.
```

### 3. Levantar Servicios

```bash
cd /data/nanlomo
docker-compose pull
docker-compose up -d
```

### 4. Configurar SSL (Certbot)

```bash
certbot certonly --webroot -w /var/www/html -d nanlomo.cals.com.ar
```

### 5. Verificar

```bash
# Ver logs
docker-compose logs -f

# Ver estado
docker-compose ps

# Health check
curl http://localhost:3002/api/health
```

## 🔄 Actualizaciones

```bash
cd /data/nanlomo
docker-compose pull
docker-compose up -d
docker image prune -f  # Limpiar imágenes viejas
```

## 📋 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DB_HOST` | Host de PostgreSQL | postgres-server |
| `DB_PORT` | Puerto de PostgreSQL | 5433 |
| `DB_USER` | Usuario de PostgreSQL | postgres |
| `DB_PASSWORD` | Contraseña de PostgreSQL | - |
| `DB_NAME` | Nombre de la base de datos | NANOLOMOS |
| `JWT_SECRET` | Secret para tokens JWT | - |
| `JWT_EXPIRES_IN` | Tiempo de expiración JWT | 30m |
| `CORS_ORIGIN` | URL del frontend | https://nanlomo.cals.com.ar |

## 🔧 Troubleshooting

### Ver logs del backend
```bash
docker logs -f nanlomo-backend
```

### Ver logs del frontend
```bash
docker logs -f nanlomo-frontend
```

### Reiniciar servicios
```bash
docker-compose restart
```

### Recrear contenedores
```bash
docker-compose down
docker-compose up -d
```

### Limpiar todo y empezar de cero
```bash
docker-compose down -v
docker-compose pull
docker-compose up -d
```
